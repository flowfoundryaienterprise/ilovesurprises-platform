const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19920;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_test_user_data_shop_' + Date.now());
const ARTIFACT_DIR = 'C:\\Users\\janar\\.gemini\\antigravity-ide\\brain\\b3557e1d-fe32-4f13-bc01-6af380debf91';

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
    return res?.result?.result?.value;
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    if (res?.result?.data) {
      fs.writeFileSync(outputPath, Buffer.from(res.result.data, 'base64'));
      console.log(`Saved screenshot to: ${outputPath}`);
    } else {
      console.error('Failed to capture screenshot', res);
    }
  }

  close() {
    try {
      this.ws.close();
    } catch (e) {}
  }
}

async function run() {
  console.log('Launching headless Edge for visual verification...');
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
    '--disable-features=msFirstRunExperience,msEdgeSync,msSignInPrompt',
    '--window-size=1280,900',
    'http://localhost:5173',
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

    let pageTarget =
      targets.find((t) => t.url.includes('localhost:5173')) ||
      targets.find((t) => t.type === 'page' && !t.url.startsWith('edge://') && !t.url.startsWith('chrome://')) ||
      targets[0];

    console.log('Selected Target:', pageTarget.url);
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // 1. Verify Homepage
    console.log('Navigating to Homepage...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(3000);

    // Scroll slightly down to view Featured Collections & Products
    await cdp.eval('window.scrollTo(0, 950)');
    await sleep(1000);
    const homeProductCount = await cdp.eval("document.querySelectorAll('#featured [id^=\"product-\"]').length");
    console.log(`Homepage product count in DOM: ${homeProductCount}`);
    const homeScreenshot = path.join(ARTIFACT_DIR, 'page_homepage_featured.png');
    await cdp.captureScreenshot(homeScreenshot);

    // 2. Verify Shop Page
    console.log('Navigating to Shop page...');
    const t0 = Date.now();
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/shop' });
    await sleep(1200);
    const shopLoadTime = Date.now() - t0;
    console.log(`Shop page navigated in ${shopLoadTime}ms`);

    const productCardsCount = await cdp.eval('document.querySelectorAll(".group[data-product-id], .group, [data-product-id]").length');
    console.log(`Found product cards in DOM: ${productCardsCount}`);

    const shopScreenshot = path.join(ARTIFACT_DIR, 'page_shop_loaded.png');
    await cdp.captureScreenshot(shopScreenshot);

    // 3. Verify Product Details Navigation via direct slug
    console.log('Navigating to exact product slug...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/product/capricorn-zodiac-cash-money-candle' });
    await sleep(1500);

    const productHeading = await cdp.eval('document.querySelector("h1")?.innerText');
    console.log(`Product page h1: "${productHeading}"`);

    const productScreenshot = path.join(ARTIFACT_DIR, 'page_product_details_slug.png');
    await cdp.captureScreenshot(productScreenshot);

    cdp.close();
    console.log('All verification screenshots captured successfully!');
  } finally {
    try {
      edgeProc.kill();
    } catch (e) {}
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch (e) {}
  }
}

run().catch((err) => {
  console.error('Fatal error in visual capture:', err);
  process.exit(1);
});
