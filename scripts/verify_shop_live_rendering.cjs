const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19905;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_shop_verify_p2_' + Date.now());

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
    this.consoleErrors = [];

    this.ws.onmessage = (msg) => {
      const parsed = JSON.parse(msg.data);
      if (parsed.id && this.callbacks.has(parsed.id)) {
        this.callbacks.get(parsed.id)(parsed);
        this.callbacks.delete(parsed.id);
      } else if (parsed.method === 'Console.messageAdded') {
        if (parsed.params?.message?.level === 'error') {
          this.consoleErrors.push(parsed.params.message.text);
        }
      } else if (parsed.method === 'Runtime.consoleAPICalled') {
        if (parsed.params?.type === 'error') {
          this.consoleErrors.push(parsed.params.args?.map(a => a.value || a.description).join(' '));
        }
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
      this.callbacks.set(msgId, (res) => {
        if (res.error) reject(res.error);
        else resolve(res.result);
      });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }
}

async function run() {
  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await sleep(1500);

  try {
    let version;
    for (let i = 0; i < 10; i++) {
      try {
        version = await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
        if (version) break;
      } catch {
        await sleep(500);
      }
    }

    const list = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = list.find(t => t.type === 'page');
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Console.enable');

    console.log('Navigating to http://localhost:5173/shop ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/shop' });
    await sleep(2500);

    const page1Titles = await cdp.eval(`(() => {
      return Array.from(document.querySelectorAll('h3, h4'))
        .map(el => el.textContent.trim())
        .filter(t => t.length > 5)
        .slice(0, 3);
    })()`);

    console.log('Page 1 Top 3 Titles:', page1Titles);

    // Click "Next" button
    console.log('Clicking "Next" button...');
    await cdp.eval(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(b => b.textContent.trim() === 'Next');
      if (nextBtn) nextBtn.click();
    })()`);

    await sleep(2000);

    const page2Info = await cdp.eval(`(() => {
      const m = document.body.innerText.match(/Page\\s+(\\d+)\\s+of\\s+(\\d+)/i);
      return m ? m[0] : null;
    })()`);

    const page2Titles = await cdp.eval(`(() => {
      return Array.from(document.querySelectorAll('h3, h4'))
        .map(el => el.textContent.trim())
        .filter(t => t.length > 5)
        .slice(0, 3);
    })()`);

    console.log('Page 2 Indicator:', page2Info);
    console.log('Page 2 Top 3 Titles:', page2Titles);

    if (page2Info === 'Page 2 of 2300') {
      console.log('✅ PASS: Successfully navigated to Page 2 of 2300!');
    } else {
      console.error('❌ FAIL: Expected "Page 2 of 2300", got:', page2Info);
      process.exit(1);
    }

    if (JSON.stringify(page1Titles) !== JSON.stringify(page2Titles)) {
      console.log('✅ PASS: Page 2 loaded distinct catalog items from Supabase!');
    } else {
      console.error('❌ FAIL: Page 2 titles identical to Page 1!');
      process.exit(1);
    }

  } finally {
    edge.kill();
  }
}

run().catch(console.error);
