const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19902;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_test_user_data_wacc_' + Date.now());
const ARTIFACT_DIR = 'C:\\Users\\janar\\.gemini\\antigravity-ide\\brain\\b3557e1d-fe32-4f13-bc01-6af380debf91';

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
    return new Promise((resolve) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, resolve);
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.result?.value;
  }

  async captureScreenshot(filepath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res.result && res.result.data) {
      fs.writeFileSync(filepath, Buffer.from(res.result.data, 'base64'));
      console.log(`Saved screenshot: ${filepath}`);
    }
  }

  close() {
    try {
      this.ws.close();
    } catch (_) {}
  }
}

async function run() {
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,900',
    'http://localhost:5173/',
  ]);

  let cdp;

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      try {
        targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
        if (targets && targets.length > 0) break;
      } catch (_) {}
    }

    let pageTarget = targets.find(t => t.url.includes('localhost:5173')) || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await sleep(3500);

    // 1. Wishlist 2 items on homepage
    console.log('Wishlisting 2 items on homepage...');
    await cdp.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('[id^="product-"]'));
        if (cards[0]) cards[0].querySelector('button[aria-label*="wishlist" i]')?.click();
        if (cards[1]) cards[1].querySelector('button[aria-label*="wishlist" i]')?.click();
      })()
    `);
    await sleep(1000);

    // 2. Mock a user in localStorage so Account page displays tabs instead of login prompt
    await cdp.eval(`
      (() => {
        const demoUser = {
          id: 'usr-wishlist-tester',
          name: 'Sarah Jenkins',
          email: 'sarah.jenkins@gmail.com',
          role: 'customer'
        };
        localStorage.setItem('ilovesurprises_user_v1', JSON.stringify(demoUser));
      })()
    `);

    // 3. Navigate to /account?tab=wishlist
    console.log('Navigating to /account?tab=wishlist...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/account?tab=wishlist' });
    await sleep(2500);

    // 4. Click the "My Wishlist" sidebar button
    console.log('Clicking My Wishlist tab button in sidebar...');
    await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const wishlistBtn = buttons.find(b => b.textContent && b.textContent.includes('My Wishlist'));
        if (wishlistBtn) wishlistBtn.click();
      })()
    `);
    await sleep(1500);

    await cdp.captureScreenshot(path.join(ARTIFACT_DIR, 'account_saved_wishlist_view.png'));
    console.log('Saved account_saved_wishlist_view.png');
  } finally {
    if (cdp) cdp.close();
    try { edgeProc.kill(); } catch (_) {}
    try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch (_) {}
  }
}

run().catch(console.error);
