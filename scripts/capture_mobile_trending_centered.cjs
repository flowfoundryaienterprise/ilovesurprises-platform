const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19938;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_mobile_trending_' + Date.now());
const ARTIFACT_DIR = 'C:\\Users\\janar\\.gemini\\antigravity-ide\\brain\\d54bf96b-afb6-43f9-80c1-a243af03ba0c';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
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
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  async send(method, params = {}) {
    const callId = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(callId, (res) => {
        if (res.error) reject(new Error(res.error.message || JSON.stringify(res.error)));
        else resolve(res.result);
      });
      this.ws.send(JSON.stringify({ id: callId, method, params }));
    });
  }

  async captureScreenshot(savePath, beyond = false) {
    const res = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: beyond });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(savePath, buffer);
    console.log(`Saved screenshot to: ${savePath}`);
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('Testing mobile viewport (390x844)...');
  const edgeProc = spawn(EDGE_PATH, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--window-size=390,844',
    'http://localhost:5173/',
  ]);

  try {
    let list = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      try {
        list = await fetchJson(`http://localhost:${PORT}/json/list`);
        if (list && list.length > 0) break;
      } catch (e) {}
    }

    if (!list || list.length === 0) throw new Error('Could not connect to Edge');
    const target = list.find((t) => t.type === 'page');
    const client = new CDPClient(target.webSocketDebuggerUrl);
    await client.waitOpen();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    // Emulate mobile device
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    console.log('Navigating to http://localhost:5173/...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(3500);

    // Scroll to Trending Best Sellers with offset for sticky header
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('featured');
          if (el) {
            const y = el.getBoundingClientRect().top + window.pageYOffset - 120;
            window.scrollTo({ top: y, behavior: 'instant' });
          }
        })()
      `
    });
    await sleep(1000);

    // Check computed styles on mobile for the header
    const evalResult = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const headerContainer = document.querySelector('#featured div.border-b > div');
          const pill = headerContainer?.querySelector('div');
          const title = headerContainer?.querySelector('h2');
          const p = headerContainer?.querySelector('p');
          const btn = document.querySelector('#featured div.border-b > button');

          const csContainer = headerContainer ? window.getComputedStyle(headerContainer) : null;
          const csTitle = title ? window.getComputedStyle(title) : null;
          const csP = p ? window.getComputedStyle(p) : null;

          return {
            containerTextAlign: csContainer?.textAlign,
            containerAlignItems: csContainer?.alignItems,
            titleTextAlign: csTitle?.textAlign,
            pTextAlign: csP?.textAlign,
            pillText: pill?.innerText?.trim(),
            titleText: title?.innerText?.trim(),
            pText: p?.innerText?.trim(),
            btnText: btn?.innerText?.trim()
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Mobile Computed Alignment:', JSON.stringify(evalResult.result.value, null, 2));

    const shotPath = path.join(ARTIFACT_DIR, 'verified_mobile_trending_centered.png');
    await client.captureScreenshot(shotPath);

    client.close();
  } finally {
    try {
      edgeProc.kill('SIGKILL');
    } catch (e) {}
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch (e) {}
  }
}

run();
