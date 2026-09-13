const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19936;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_test_cash_candles_' + Date.now());
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
  console.log('Starting headless Edge on port', PORT);
  const edgeProc = spawn(EDGE_PATH, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--window-size=1440,1100',
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

    console.log('Navigating to http://localhost:5173/...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(3500);

    // 1. Audit category card images in initial 6-card view
    console.log('\n--- Auditing Initial Explore Cards (6 cards) ---');
    const initialReport = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = Array.from(document.querySelectorAll('#categories button')).filter(b => b.querySelector('img'));
          return cards.map(c => {
            const title = c.querySelector('strong')?.innerText?.trim() || '';
            const img = c.querySelector('img');
            return {
              title,
              src: img?.src || '',
              complete: img?.complete,
              naturalWidth: img?.naturalWidth || 0,
              naturalHeight: img?.naturalHeight || 0,
              isBroken: !img || !img.complete || img.naturalWidth === 0
            };
          });
        })()
      `,
      returnByValue: true
    });

    console.log('Initial Cards Report:', JSON.stringify(initialReport.result.value, null, 2));

    for (const card of initialReport.result.value) {
      if (card.isBroken) {
        console.error(`❌ BROKEN IMAGE: ${card.title} -> ${card.src}`);
      } else {
        console.log(`✅ LOADED: ${card.title} (${card.naturalWidth}x${card.naturalHeight}px)`);
      }
    }

    // Save screenshot of 6-card view
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'verified_explore_cash_candles_loaded.png'));

    // 2. Expand to all 12 collections
    console.log('\n--- Expanding to all 12 collections ---');
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const toggleBtn = Array.from(document.querySelectorAll('#categories button')).find(b => b.innerText.includes('View all'));
          if (toggleBtn) toggleBtn.click();
        })()
      `
    });
    await sleep(1500);

    const all12Report = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = Array.from(document.querySelectorAll('#categories button')).filter(b => b.querySelector('img'));
          return cards.map(c => {
            const title = c.querySelector('strong')?.innerText?.trim() || '';
            const img = c.querySelector('img');
            return {
              title,
              src: img?.src || '',
              complete: img?.complete,
              naturalWidth: img?.naturalWidth || 0,
              naturalHeight: img?.naturalHeight || 0,
              isBroken: !img || !img.complete || img.naturalWidth === 0
            };
          });
        })()
      `,
      returnByValue: true
    });

    console.log(`All 12 Collections Report (${all12Report.result.value.length} cards):`);
    let brokenCount = 0;
    for (const card of all12Report.result.value) {
      if (card.isBroken) {
        brokenCount++;
        console.error(`  ❌ BROKEN IMAGE: ${card.title} -> ${card.src}`);
      } else {
        console.log(`  ✅ LOADED: ${card.title} (${card.naturalWidth}x${card.naturalHeight}px)`);
      }
    }

    // Save screenshot of all 12 cards expanded with beyond viewport
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'verified_all_12_collections_loaded.png'), true);

    // 3. Check Trending Best Sellers images
    console.log('\n--- Checking Trending Best Sellers Images ---');
    const trendingReport = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const prods = Array.from(document.querySelectorAll('#featured [id^="product-"]'));
          return prods.map(p => {
            const title = p.querySelector('h3')?.innerText?.trim() || '';
            const img = p.querySelector('img');
            return {
              title,
              src: img?.src || '',
              complete: img?.complete,
              naturalWidth: img?.naturalWidth || 0,
              naturalHeight: img?.naturalHeight || 0,
              isBroken: !img || !img.complete || img.naturalWidth === 0
            };
          });
        })()
      `,
      returnByValue: true
    });

    console.log(`Trending Best Sellers Report (${trendingReport.result.value.length} products):`);
    let brokenProds = 0;
    for (const p of trendingReport.result.value) {
      if (p.isBroken) {
        brokenProds++;
        console.error(`  ❌ BROKEN PRODUCT IMAGE: ${p.title} -> ${p.src}`);
      } else {
        console.log(`  ✅ LOADED: ${p.title} (${p.naturalWidth}x${p.naturalHeight}px)`);
      }
    }

    client.close();

    console.log('\n====================================================');
    console.log(`SUMMARY: Broken category images: ${brokenCount} | Broken product images: ${brokenProds}`);
    console.log('====================================================');

    if (brokenCount > 0 || brokenProds > 0) {
      process.exit(1);
    }
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
