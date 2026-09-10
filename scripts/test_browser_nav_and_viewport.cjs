const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 19944;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_nav_vp_' + Date.now());

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

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.ws.onmessage = msg => {
      const parsed = JSON.parse(msg.data);
      if (parsed.id && this.callbacks.has(parsed.id)) {
        this.callbacks.get(parsed.id)(parsed);
        this.callbacks.delete(parsed.id);
      }
    };
  }
  async waitOpen() {
    return new Promise(r => this.ws.onopen = r);
  }
  send(m, p = {}) {
    return new Promise((res, rej) => {
      const curId = this.id++;
      this.callbacks.set(curId, r => r.error ? rej(r.error) : res(r.result));
      this.ws.send(JSON.stringify({ id: curId, method: m, params: p }));
    });
  }
  async eval(expr) {
    const res = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return res.result?.value;
  }
}

async function run() {
  console.log('=== STARTING NAVIGATION & VIEWPORT RESPONSIVENESS TEST ===\n');

  const p = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    `--user-data-dir=${TEMP_DIR}`,
    'about:blank'
  ]);
  await sleep(1500);

  const list = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
  const target = list.find(t => t.type === 'page');
  const cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.waitOpen();

  // Test 1: Navigation from Shop to About via pushState/popState
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/shop' });
  await sleep(1200);
  let initialPath = await cdp.eval('window.location.pathname');
  console.log(`[TEST 1] Initial Path: ${initialPath}`);

  await cdp.eval(`window.history.pushState({ view: 'about' }, '', '/about'); window.dispatchEvent(new PopStateEvent('popstate'));`);
  await sleep(800);
  let newPath = await cdp.eval('window.location.pathname');
  let newTitle = await cdp.eval('document.title');
  console.log(`[TEST 1] Pushed /about -> Path: ${newPath}, Title: "${newTitle}"`);

  // Test 2: Back navigation
  await cdp.eval('window.history.back()');
  await sleep(800);
  let backPath = await cdp.eval('window.location.pathname');
  console.log(`[TEST 2] Back -> Path: ${backPath}`);

  // Test 3: Forward navigation
  await cdp.eval('window.history.forward()');
  await sleep(800);
  let fwdPath = await cdp.eval('window.location.pathname');
  console.log(`[TEST 3] Forward -> Path: ${fwdPath}`);

  // Test 4: Viewport Responsiveness
  console.log('\n--- Testing Viewport Responsiveness ---');
  const viewports = [
    { name: 'Desktop Large', width: 1920, height: 1080 },
    { name: 'Desktop Standard', width: 1440, height: 900 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Mobile Standard (iPhone)', width: 375, height: 667 },
    { name: 'Mobile Compact', width: 360, height: 640 },
  ];

  let overflowErrors = 0;
  for (const vp of viewports) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.name.includes('Mobile'),
    });
    await sleep(400);

    const hasOverflow = await cdp.eval('document.documentElement.scrollWidth > window.innerWidth');
    const scrollW = await cdp.eval('document.documentElement.scrollWidth');
    const innerW = await cdp.eval('window.innerWidth');

    if (!hasOverflow) {
      console.log(`✅ PASS: ${vp.name} (${vp.width}x${vp.height}): Zero horizontal overflow (scrollWidth: ${scrollW}, innerWidth: ${innerW})`);
    } else {
      console.error(`❌ FAIL: ${vp.name} (${vp.width}x${vp.height}): Horizontal overflow! (scrollWidth: ${scrollW}, innerWidth: ${innerW})`);
      overflowErrors++;
    }
  }

  cdp.ws.close();
  p.kill();

  if (backPath === '/shop' && fwdPath === '/about' && overflowErrors === 0) {
    console.log('\n🎉 ALL NAVIGATION & VIEWPORT TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('\n❌ SOME NAVIGATION OR VIEWPORT TESTS FAILED.');
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
