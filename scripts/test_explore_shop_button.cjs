const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/janar/.gemini/antigravity-ide/brain/b3557e1d-fe32-4f13-bc01-6af380debf91');
const TEMP_DIR = path.join(ARTIFACT_DIR, 'scratch', 'edge_profile_explore_' + Date.now());

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

  async connect() {
    return this.waitOpen();
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

  async screenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      quality: 100,
    });
    if (res.result && res.result.data) {
      fs.writeFileSync(outputPath, Buffer.from(res.result.data, 'base64'));
      console.log(`Saved screenshot: ${outputPath}`);
    }
  }

  close() {
    try {
      this.ws.close();
    } catch (_) {}
  }
}

async function getWsUrl(port) {
  for (let i = 0; i < 30; i++) {
    try {
      const json = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json`, (res) => {
          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => resolve(JSON.parse(raw)));
        }).on('error', reject);
      });
      const page = json.find((t) => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (_) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('Could not get debug ws url');
}

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9345;
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const edgeProc = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173/',
  ]);

  let cdp = null;

  try {
    const wsUrl = await getWsUrl(port);
    cdp = new CDPClient(wsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('1. Waiting for page to load and products to be displayed...');
    let buttonFound = false;
    for (let i = 0; i < 20; i++) {
      const status = await cdp.eval(`
        (() => {
          const btn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Explore All 57,000+'));
          const cards = document.querySelectorAll('[data-product-id], .product-card, article');
          return {
            buttonFound: !!btn,
            cardCount: cards.length,
            bodyPreview: document.body.innerText.slice(0, 200)
          };
        })()
      `);
      if (status && status.buttonFound) {
        buttonFound = true;
        console.log(`Button found after ${i * 500}ms! Card count: ${status.cardCount}`);
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!buttonFound) {
      const debugInfo = await cdp.eval(`
        (() => {
          const links = Array.from(document.querySelectorAll('a')).map(a => a.innerText.trim()).filter(Boolean);
          return {
            linksCount: links.length,
            sampleLinks: links.slice(0, 10),
            pathname: window.location.pathname
          };
        })()
      `);
      console.log('Debug info:', debugInfo);
      throw new Error('Explore button not found on home page!');
    }

    await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Explore All 57,000+'));
      if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'center' });
    `);
    await new Promise((r) => setTimeout(r, 600));

    const beforeScreenshot = path.join(ARTIFACT_DIR, 'home_explore_button_before_click.png');
    await cdp.screenshot(beforeScreenshot);

    console.log('2. Clicking "Explore All 57,000+ Surprises in Shop" button...');
    const clickResult = await cdp.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Explore All 57,000+'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Click result:', clickResult);

    // Wait for view transition to Shop
    await new Promise((r) => setTimeout(r, 1200));

    const afterClickInfo = await cdp.eval(`
      (() => {
        const shopHeading = Array.from(document.querySelectorAll('h1, h2')).find(h => 
          h.textContent.includes('All Surprises') || 
          h.textContent.includes('Shop') ||
          h.textContent.includes('Catalog')
        );
        const shopContainer = document.querySelector('[data-view="shop"], .shop-page, main');
        return {
          pathname: window.location.pathname,
          title: document.title,
          heading: shopHeading ? shopHeading.innerText.trim() : null,
          hasShopCatalog: document.body.innerText.includes('Surprises Found') || document.body.innerText.includes('Filters') || document.body.innerText.includes('Sort By'),
          scrollY: window.scrollY
        };
      })()
    `);
    console.log('After Click Info:', afterClickInfo);

    const afterScreenshot = path.join(ARTIFACT_DIR, 'shop_page_after_explore_click.png');
    await cdp.screenshot(afterScreenshot);

    if (afterClickInfo.pathname !== '/shop') {
      throw new Error(`Expected pathname to be /shop, got ${afterClickInfo.pathname}`);
    }

    console.log('3. Testing browser history back...');
    await cdp.eval(`window.history.back()`);
    await new Promise((r) => setTimeout(r, 1000));

    const backInfo = await cdp.eval(`
      (() => {
        return {
          pathname: window.location.pathname,
          isHome: !!document.getElementById('hero') || !!document.getElementById('categories')
        };
      })()
    `);
    console.log('Back Info:', backInfo);

    console.log('SUCCESS! All tests passed.');
  } finally {
    if (cdp) cdp.close();
    try { edgeProc.kill(); } catch (_) {}
    try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch (_) {}
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
