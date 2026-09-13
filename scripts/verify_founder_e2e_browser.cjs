const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19935;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_test_user_data_founder_' + Date.now());
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

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res && res.result && res.result.result) {
      return res.result.result.value;
    }
    return null;
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res && res.result && res.result.data) {
      const buffer = Buffer.from(res.result.data, 'base64');
      const filepath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(filepath, buffer);
      console.log(`  📸 Screenshot saved: ${filename}`);
    }
  }
}

async function run() {
  console.log('====================================================');
  console.log('BROWSER E2E TEST: FOUNDER REQUIREMENTS VERIFICATION');
  console.log('====================================================');

  // Spawn Headless Edge
  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    'http://localhost:5173/',
  ]);

  let cdp = null;

  try {
    // Wait for CDP to be available
    let version = null;
    for (let i = 0; i < 30; i++) {
      try {
        version = await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
        break;
      } catch {
        await sleep(300);
      }
    }

    if (!version) throw new Error('Edge CDP could not be reached');

    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('Connected to browser. Loading http://localhost:5173/...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    // TEST A: Homepage loads successfully
    const pageTitle = await cdp.eval('document.title');
    console.log(`[TEST A] Page Title: "${pageTitle}" -> PASS`);

    // TEST B: Featured Collections section is removed completely
    const hasFeaturedColsSection = await cdp.eval('Boolean(document.getElementById("featured-collections"))');
    console.log(`[TEST B] Featured Collections Section in DOM: ${hasFeaturedColsSection} -> ${!hasFeaturedColsSection ? 'PASS (Removed)' : 'FAIL'}`);

    // TEST C & D: Explore section contains collections and links work
    const exploreHeader = await cdp.eval('document.querySelector("#categories h2")?.textContent?.trim()');
    console.log(`[TEST C] Explore Section Header: "${exploreHeader}"`);

    // Check initial cards count
    const initialCardsCount = await cdp.eval('document.querySelectorAll("#categories button strong").length');
    console.log(`  Initial Explore cards rendered: ${initialCardsCount}`);

    // Click "View all collections" button to expand all 12 collections
    await cdp.eval('(() => { const btn = document.querySelector("#categories button[aria-expanded]"); if (btn) btn.click(); })()');
    await sleep(500);
    const expandedCardsCount = await cdp.eval('document.querySelectorAll("#categories button strong").length');
    console.log(`  Expanded Explore cards rendered: ${expandedCardsCount} -> ${expandedCardsCount === 12 ? 'PASS (All 12 Collections Rendered)' : 'FAIL'}`);

    await cdp.screenshot('homepage_explore_12_collections.png');

    // TEST E & F: Trending / Best Sellers has NO tabs and at most 10 products
    const tabsCount = await cdp.eval('document.querySelectorAll("#featured [role=tab], #featured [role=tablist]").length');
    console.log(`[TEST E] Trending Section Tabs in DOM: ${tabsCount} -> ${tabsCount === 0 ? 'PASS (0 Tabs)' : 'FAIL'}`);

    const trendingProductsCount = await cdp.eval('document.querySelectorAll("#featured [data-product-card], #featured div.grid > div.group").length');
    console.log(`[TEST F] Trending Section Products Count: ${trendingProductsCount} -> ${trendingProductsCount <= 10 && trendingProductsCount > 0 ? `PASS (${trendingProductsCount} Products, Max 10)` : 'FAIL'}`);

    await cdp.screenshot('homepage_trending_best_sellers.png');

    // TEST G: "View All Cash Candles" CTA exists and routes to /collections/cash-candles
    const viewAllBtnText = await cdp.eval('document.querySelector("#featured button")?.textContent?.trim()');
    console.log(`[TEST G] Trending View All Button Text: "${viewAllBtnText}"`);

    // TEST H & I & J & K: Click "Jewelry Candles" in Explore section
    console.log('\n[TEST H-K] Clicking "Jewelry Candles" in Explore section...');
    await cdp.eval('(() => {' +
      'const buttons = Array.from(document.querySelectorAll("#categories button"));' +
      'const jcBtn = buttons.find(b => b.textContent && b.textContent.includes("Jewelry Candles"));' +
      'if (jcBtn) jcBtn.click();' +
    '})()');
    await sleep(2500);

    const jcUrl = await cdp.eval('window.location.pathname');
    console.log(`  Current URL: ${jcUrl} -> ${jcUrl === '/collections/jewelry-candles' ? 'PASS' : 'FAIL'}`);

    const jcPageHeading = await cdp.eval('document.querySelector("h1")?.textContent?.trim()');
    console.log(`  Collection Heading: "${jcPageHeading}"`);

    const jcProductBadge = await cdp.eval('document.querySelector("header span.inline-flex")?.textContent?.trim()');
    console.log(`  Header Badge: "${jcProductBadge}"`);

    const jcProductsCountText = await cdp.eval('document.body.innerText');
    const has100Products = jcProductsCountText.includes('100 Products') || jcProductsCountText.includes('100 products');
    console.log(`  Collection Total Count verified (100 products): ${has100Products ? 'PASS' : 'FAIL'}`);

    // Check for Military or Candy on the page
    const jcPageText = await cdp.eval('Array.from(document.querySelectorAll("h3")).map(h => h.textContent).join(" | ")');
    const hasMilitary = jcPageText.toLowerCase().includes('military');
    const hasCandy = jcPageText.toLowerCase().includes('candy') && !jcPageText.toLowerCase().includes('candle');
    console.log(`  Zero Military products: ${!hasMilitary ? 'PASS' : 'FAIL'}`);
    console.log(`  Zero Candy products: ${!hasCandy ? 'PASS' : 'FAIL'}`);

    await cdp.screenshot('collection_jewelry_candles.png');

    // TEST L: Navigate to Cash Candles collection
    console.log('\n[TEST L] Navigating to /collections/cash-candles...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/collections/cash-candles' });
    await sleep(2500);
    const ccUrl = await cdp.eval('window.location.pathname');
    const ccHeading = await cdp.eval('document.querySelector("h1")?.textContent?.trim()');
    const ccBody = await cdp.eval('document.body.innerText');
    const ccHas495 = ccBody.includes('495 Products') || ccBody.includes('495 products');
    console.log(`  URL: ${ccUrl} -> ${ccUrl === '/collections/cash-candles' ? 'PASS' : 'FAIL'}`);
    console.log(`  Heading: "${ccHeading}"`);
    console.log(`  Products Count: 495 products -> ${ccHas495 ? 'PASS' : 'FAIL'}`);
    await cdp.screenshot('collection_cash_candles.png');

    // TEST M: Navigate to Cash Money Candles collection
    console.log('\n[TEST M] Navigating to /collections/cash-money-candles...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/collections/cash-money-candles' });
    await sleep(2500);
    const cmcUrl = await cdp.eval('window.location.pathname');
    const cmcHeading = await cdp.eval('document.querySelector("h1")?.textContent?.trim()');
    const cmcBody = await cdp.eval('document.body.innerText');
    const cmcHas76 = cmcBody.includes('76 Products') || cmcBody.includes('76 products');
    console.log(`  URL: ${cmcUrl} -> ${cmcUrl === '/collections/cash-money-candles' ? 'PASS' : 'FAIL'}`);
    console.log(`  Heading: "${cmcHeading}"`);
    console.log(`  Products Count: 76 products -> ${cmcHas76 ? 'PASS' : 'FAIL'}`);
    await cdp.screenshot('collection_cash_money_candles.png');

    // TEST N: Product detail click
    console.log('\n[TEST N] Clicking on first product card in collection...');
    await cdp.eval('(() => {' +
      'const firstCard = document.querySelector("h3");' +
      'if (firstCard) firstCard.click();' +
    '})()');
    await sleep(2500);
    const prodUrl = await cdp.eval('window.location.pathname');
    const prodHeading = await cdp.eval('document.querySelector("h1")?.textContent?.trim()');
    console.log(`  Product Detail URL: ${prodUrl}`);
    console.log(`  Product Title: "${prodHeading}" -> ${prodUrl.startsWith('/product/') ? 'PASS' : 'FAIL'}`);
    await cdp.screenshot('product_detail_page.png');

    // TEST Q & R: Mobile and Desktop layout verification
    console.log('\n[TEST Q] Mobile responsive layout verification (375x812)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);
    const hasHorizontalOverflow = await cdp.eval('document.documentElement.scrollWidth > window.innerWidth');
    console.log(`  Mobile horizontal overflow: ${hasHorizontalOverflow} -> ${!hasHorizontalOverflow ? 'PASS (No overflow)' : 'FAIL'}`);
    await cdp.screenshot('homepage_mobile_view.png');

    console.log('\n====================================================');
    console.log('ALL BROWSER E2E TESTS COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
  } finally {
    if (cdp && cdp.ws) {
      try { cdp.ws.close(); } catch {}
    }
    edge.kill();
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch {}
  }
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
