const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19899;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_test_user_data_wishlist_' + Date.now());
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
    '--disable-sync',
    '--disable-features=msFirstRunExperience,msEdgeSync,msSignInPrompt',
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

    if (!targets || targets.length === 0) {
      throw new Error('Could not connect to Edge DevTools target');
    }

    let pageTarget = targets.find(t => t.url.includes('localhost:5173')) ||
                     targets.find(t => t.type === 'page' && !t.url.startsWith('edge://')) ||
                     targets[0];

    console.log('Connected to target:', pageTarget.url);
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    console.log('Waiting for homepage products to load...');
    await sleep(3500);

    // Scroll down to the products catalog
    await cdp.eval(`
      (() => {
        const cat = document.getElementById('featured');
        if (cat) cat.scrollIntoView({ behavior: 'smooth' });
      })()
    `);
    await sleep(1000);

    // 1. Audit Heart state BEFORE click
    console.log('--- Step 1: Checking first product card heart before click ---');
    const beforeState = await cdp.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('[id^="product-"]'));
        if (cards.length === 0) return { error: 'No product cards found on homepage' };
        
        const firstCard = cards[0];
        const heartBtn = firstCard.querySelector('button[aria-label*="wishlist" i]');
        const heartSvg = heartBtn ? heartBtn.querySelector('svg') : null;
        
        const btnClasses = heartBtn ? heartBtn.className : '';
        const svgClasses = heartSvg ? heartSvg.getAttribute('class') || '' : '';
        const isFilled = svgClasses.includes('fill-[#D30915]') || svgClasses.includes('fill-current');

        return {
          productId: firstCard.id,
          hasHeartBtn: !!heartBtn,
          btnClasses,
          svgClasses,
          isFilled,
          ariaLabel: heartBtn?.getAttribute('aria-label')
        };
      })()
    `);
    console.log('Before Click State:', beforeState);

    // 2. Click the Heart button
    console.log('\n--- Step 2: Clicking heart icon on first product card ---');
    const clickResult = await cdp.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('[id^="product-"]'));
        const firstCard = cards[0];
        const heartBtn = firstCard.querySelector('button[aria-label*="wishlist" i]');
        if (heartBtn) {
          heartBtn.click();
          return { clicked: true };
        }
        return { clicked: false };
      })()
    `);
    console.log('Click result:', clickResult);
    await sleep(800);

    // 3. Audit Heart state AFTER click
    console.log('\n--- Step 3: Checking heart state AFTER click ---');
    const afterClickState = await cdp.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('[id^="product-"]'));
        const firstCard = cards[0];
        const heartBtn = firstCard.querySelector('button[aria-label*="wishlist" i]');
        const heartSvg = heartBtn ? heartBtn.querySelector('svg') : null;
        
        const btnClasses = heartBtn ? heartBtn.className : '';
        const svgClasses = heartSvg ? heartSvg.getAttribute('class') || '' : '';
        const isFilled = svgClasses.includes('fill-[#D30915]') || svgClasses.includes('fill-current');
        const isRed = btnClasses.includes('text-[#D30915]') || btnClasses.includes('bg-[#fff1f2]');

        // Check toast
        const toast = document.querySelector('.bg-emerald-50, [role="alert"], [class*="toast"]');
        const storedWishlist = localStorage.getItem('ilovesurprises_wishlist_v1');

        return {
          productId: firstCard.id,
          btnClasses,
          svgClasses,
          isFilled,
          isRed,
          ariaLabel: heartBtn?.getAttribute('aria-label'),
          toastText: toast?.innerText || null,
          storedWishlist: storedWishlist ? JSON.parse(storedWishlist) : []
        };
      })()
    `);
    console.log('After Click State:', afterClickState);

    const screenshotWishlisted = path.join(ARTIFACT_DIR, 'home_wishlist_heart_red_active.png');
    await cdp.captureScreenshot(screenshotWishlisted);

    // 4. Click Heart button AGAIN (toggle off)
    console.log('\n--- Step 4: Clicking heart button again to toggle OFF ---');
    await cdp.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('[id^="product-"]'));
        const firstCard = cards[0];
        const heartBtn = firstCard.querySelector('button[aria-label*="wishlist" i]');
        if (heartBtn) heartBtn.click();
      })()
    `);
    await sleep(800);

    const afterToggleOffState = await cdp.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('[id^="product-"]'));
        const firstCard = cards[0];
        const heartBtn = firstCard.querySelector('button[aria-label*="wishlist" i]');
        const heartSvg = heartBtn ? heartBtn.querySelector('svg') : null;
        const svgClasses = heartSvg ? heartSvg.getAttribute('class') || '' : '';
        const isFilled = svgClasses.includes('fill-[#D30915]') || svgClasses.includes('fill-current');
        const storedWishlist = localStorage.getItem('ilovesurprises_wishlist_v1');

        return {
          isFilled,
          ariaLabel: heartBtn?.getAttribute('aria-label'),
          storedWishlist: storedWishlist ? JSON.parse(storedWishlist) : []
        };
      })()
    `);
    console.log('After Toggle Off State:', afterToggleOffState);

    const passed =
      !beforeState.isFilled &&
      afterClickState.isFilled &&
      afterClickState.isRed &&
      afterClickState.storedWishlist.length > 0 &&
      !afterToggleOffState.isFilled;

    if (passed) {
      console.log('\n🎉 ALL HEART WISHLIST TESTS PASSED 100%!');
      console.log('  1. Heart starts un-wishlisted (gray outline).');
      console.log('  2. Clicking heart immediately changes heart color to VIVID RED FILLED!');
      console.log('  3. Wishlist is persisted to localStorage.');
      console.log('  4. Clicking again toggles off cleanly.');
    } else {
      console.error('\n❌ TEST FAILED. Summary:', { beforeState, afterClickState, afterToggleOffState });
      process.exitCode = 1;
    }
  } finally {
    if (cdp) cdp.close();
    try { edgeProc.kill(); } catch (_) {}
    try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch (_) {}
  }
}

run().catch(console.error);
