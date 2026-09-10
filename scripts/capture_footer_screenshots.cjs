const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19877;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_screenshot_data_' + Date.now());
const ARTIFACT_DIR = 'C:\\Users\\janar\\.gemini\\antigravity-ide\\brain\\ce621494-e55b-446d-a2b2-7ca8352fd5f2';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();

    this.ws.onmessage = (msg) => {
      const parsed = JSON.parse(msg.data);
      if (parsed.id && this.callbacks.has(parsed.id)) {
        this.callbacks.get(parsed.id)(parsed);
        this.callbacks.delete(parsed.id);
      }
    };
  }

  async waitOpen() {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === WebSocket.OPEN) return resolve();
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      const payload = JSON.stringify({ id: msgId, method, params });
      this.callbacks.set(msgId, (res) => {
        if (res.error) {
          reject(new Error(res.error.message));
        } else {
          resolve(res.result);
        }
      });
      this.ws.send(payload);
    });
  }

  close() {
    this.ws.close();
  }
}

async function captureFooterScreenshots() {
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,1000',
    'http://localhost:5173/'
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      try {
        targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
        if (targets && targets.length > 0) break;
      } catch (e) {}
    }

    const pageTarget = targets.find(t => t.type === 'page' && !t.url.includes('extension')) || targets[0];
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await sleep(2500);

    // Scroll footer directly into view
    await cdp.send('Runtime.evaluate', {
      expression: 'document.querySelector("footer")?.scrollIntoView({ behavior: "instant", block: "start" })'
    });
    await sleep(800);

    // 1. Desktop Screenshot
    const desktopShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const desktopPath = path.join(ARTIFACT_DIR, 'footer_desktop_view.png');
    fs.writeFileSync(desktopPath, Buffer.from(desktopShot.data, 'base64'));
    console.log('Saved desktop screenshot:', desktopPath);

    // 2. Mobile Screenshot (iPhone 14 / 390px)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(500);
    await cdp.send('Runtime.evaluate', {
      expression: 'document.querySelectorAll("footer h4")[0]?.scrollIntoView({ behavior: "instant", block: "start" })'
    });
    await sleep(800);

    const mobileShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const mobilePath = path.join(ARTIFACT_DIR, 'footer_mobile_view.png');
    fs.writeFileSync(mobilePath, Buffer.from(mobileShot.data, 'base64'));
    console.log('Saved mobile screenshot:', mobilePath);

    cdp.close();
  } finally {
    edgeProc.kill();
  }
}

captureFooterScreenshots().catch(console.error);
