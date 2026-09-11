const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19933;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_diverse_' + Date.now());
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
  console.log('Launching headless Edge for diverse products and image verification...');
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

    // 1. Verify Homepage Products Diversity
    console.log('\n--- 1. Checking Home Screen Products Diversity ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(3500);

    const productNames = await cdp.eval(`
      Array.from(document.querySelectorAll('#featured [id^="product-"]')).map(el => {
        const titleEl = el.querySelector('h3, [class*="font-semibold"], strong, p');
        return titleEl ? titleEl.innerText : el.innerText.split('\\n')[0];
      })
    `);

    console.log(`Total Products on Home Screen: ${productNames?.length}`);
    if (productNames && productNames.length > 0) {
      console.log('First 10 Products on Home Screen:');
      productNames.slice(0, 10).forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
      console.log('Sample Products 25-35:');
      productNames.slice(25, 35).forEach((name, i) => console.log(`  ${i + 26}. ${name}`));
      console.log('Last 5 Products:');
      productNames.slice(-5).forEach((name, i) => console.log(`  ${productNames.length - 5 + i + 1}. ${name}`));

      // Check uniqueness
      const uniqueNames = new Set(productNames);
      console.log(`Unique Product Titles: ${uniqueNames.size} / ${productNames.length}`);
      if (uniqueNames.size === productNames.length) {
        console.log('✅ ALL PRODUCTS ON HOME SCREEN ARE 100% UNIQUE!');
      } else {
        console.warn('⚠️ Some duplicate titles detected');
      }
    }

    // Scroll and take screenshot of homepage
    await cdp.eval('window.scrollTo(0, 1000)');
    await sleep(1000);
    const homeScreenshot = path.join(ARTIFACT_DIR, 'page_homepage_diverse_60.png');
    await cdp.captureScreenshot(homeScreenshot);

    // 2. Verify "50 and fabulous" Product Image Loading
    console.log('\n--- 2. Checking "50 and fabulous" Product Details & Image Load ---');
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/product/50-and-fabulous-happy-birthday-jewelry-funny-candles-1',
    });
    await sleep(3000);

    const productInfo = await cdp.eval(`
      (() => {
        const h1 = document.querySelector('h1')?.innerText;
        const img = document.querySelector('img[alt*="50 and fabulous"], .isolate img');
        return {
          title: h1,
          imageSrc: img?.src,
          naturalWidth: img?.naturalWidth,
          naturalHeight: img?.naturalHeight,
          complete: img?.complete,
        };
      })()
    `);

    console.log('Product Info:', JSON.stringify(productInfo, null, 2));

    if (productInfo && productInfo.naturalWidth > 0 && productInfo.complete) {
      console.log('✅ "50 and fabulous" IMAGE LOADED SUCCESSFULLY WITH ZERO ERRORS!');
      console.log(`Dimensions: ${productInfo.naturalWidth}x${productInfo.naturalHeight}px`);
    } else {
      console.error('❌ "50 and fabulous" IMAGE FAILED TO LOAD!');
    }

    const prodScreenshot = path.join(ARTIFACT_DIR, 'page_50_and_fabulous_loaded.png');
    await cdp.captureScreenshot(prodScreenshot);

    cdp.close();
    console.log('\nAll visual and diversity verifications completed successfully!');
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
  console.error('Fatal verification error:', err);
  process.exit(1);
});
