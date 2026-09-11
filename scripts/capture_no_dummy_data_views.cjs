const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19897;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_test_user_data_views_' + Date.now());
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

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await sleep(2000);
  }

  async captureScreenshot(filepath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res.result && res.result.data) {
      fs.writeFileSync(filepath, Buffer.from(res.result.data, 'base64'));
      console.log(`📸 Screenshot saved: ${filepath}`);
    }
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function captureAllViews() {
  console.log('🚀 Starting Edge CDP to capture all panels without dummy data...');
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
    '--disable-features=msFirstRunExperience,msEdgeSync,msSignInPrompt',
    '--window-size=1440,900',
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

    if (!targets || targets.length === 0) {
      throw new Error('Could not connect to Edge DevTools target');
    }

    let pageTarget = targets.find(t => t.url.includes('localhost:5173')) ||
                     targets.find(t => t.type === 'page' && !t.url.startsWith('edge://') && !t.url.startsWith('chrome://')) ||
                     targets[0];

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.waitOpen();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    console.log('--- 1. Capturing Reviews Section on Homepage ---');
    await client.navigate('http://localhost:5173/#reviews');
    await sleep(1500);
    await client.eval(`
      (() => {
        const el = document.getElementById('reviews');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()
    `);
    await sleep(800);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'panel_reviews_empty_state.png'));

    console.log('--- 2. Capturing Admin Overview ---');
    await client.navigate('http://localhost:5173/admin');
    await sleep(2500);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'panel_admin_overview.png'));

    console.log('--- 3. Capturing Admin Commerce (Orders & Products) ---');
    await client.navigate('http://localhost:5173/admin?tab=commerce');
    await sleep(2500);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'panel_admin_commerce.png'));

    console.log('--- 4. Capturing Admin Representatives ---');
    await client.navigate('http://localhost:5173/admin?tab=representatives');
    await sleep(2000);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'panel_admin_representatives.png'));

    console.log('--- 5. Capturing Admin Commissions ---');
    await client.navigate('http://localhost:5173/admin?tab=commissions');
    await sleep(2000);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'panel_admin_commissions.png'));

    console.log('--- 6. Capturing Admin Reports ---');
    await client.navigate('http://localhost:5173/admin?tab=reports');
    await sleep(2000);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'panel_admin_reports.png'));

    console.log('--- 7. Capturing Admin Appraisals ---');
    await client.navigate('http://localhost:5173/admin?tab=appraisals');
    await sleep(2000);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'panel_admin_appraisals.png'));

    console.log('--- 8. Capturing Affiliate / Representative Dashboard ---');
    await client.navigate('http://localhost:5173/affiliate');
    await sleep(2500);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'panel_affiliate_dashboard.png'));

    console.log('--- 9. Capturing Customer Account Panel ---');
    await client.navigate('http://localhost:5173/account');
    await sleep(2000);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'panel_customer_account.png'));

    console.log('--- 10. Capturing Jewelry Appraisal Page ---');
    await client.navigate('http://localhost:5173/appraise');
    await sleep(2000);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'panel_jewelry_appraisal.png'));

    client.close();
    console.log('🎉 All panel screenshots captured successfully!');
  } finally {
    edge.kill();
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch {}
  }
}

captureAllViews().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
