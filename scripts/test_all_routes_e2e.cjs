const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19899;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_all_routes_' + Date.now());

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
  console.log('=== STARTING ALL 15 MAJOR ROUTES AUDIT VIA CDP ===\n');

  const edgeProcess = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    `--user-data-dir=${TEMP_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await sleep(1500);

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

  await cdp.send('Runtime.enable');
  await cdp.send('Console.enable');

  const routesToTest = [
    { path: '/', expected: 'Surprises' },
    { path: '/shop', expected: 'Catalog' },
    { path: '/categories', expected: 'Categories' },
    { path: '/product/aquarius-zodiac-cash-money-candle', expected: 'Aquarius' },
    { path: '/checkout', expected: 'Checkout' },
    { path: '/order-confirmation/TEST-12345', expected: 'Order' },
    { path: '/account', expected: 'Account' },
    { path: '/affiliate', expected: 'Consultant' },
    { path: '/about', expected: 'About' },
    { path: '/contact', expected: 'Contact' },
    { path: '/admin', expected: 'Admin' },
    { path: '/rewards', expected: 'VIP' },
    { path: '/appraise-your-jewelry', expected: 'Appraisal' },
    { path: '/appraisal', expected: 'Appraisal' },
    { path: '/rep/emily_sparkles', expected: 'Surprises', checkAttribution: 'emily_sparkles' },
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (const r of routesToTest) {
    const url = `http://localhost:5173${r.path}`;
    cdp.consoleErrors = [];
    await cdp.send('Page.navigate', { url });
    await sleep(1400);

    const docReady = await cdp.eval('document.readyState');
    const bodyText = await cdp.eval('document.body.innerText');
    const title = await cdp.eval('document.title');
    const isBlank = !bodyText || bodyText.trim().length < 50;

    const hasExpected = bodyText.toLowerCase().includes(r.expected.toLowerCase()) ||
                        title.toLowerCase().includes(r.expected.toLowerCase());

    let attributionOk = true;
    if (r.checkAttribution) {
      const storedRep = await cdp.eval('localStorage.getItem("ilovesurprises_attributed_rep_v1")');
      attributionOk = storedRep && storedRep.includes(r.checkAttribution);
    }

    const criticalErrors = cdp.consoleErrors.filter(e => 
      !e.includes('favicon') && !e.includes('task_provider') && !e.includes('status of 404')
    );

    if (!isBlank && hasExpected && attributionOk && criticalErrors.length === 0) {
      console.log(`✅ PASS: Route ${r.path} loaded cleanly (Title: "${title.slice(0, 40)}...", Body length: ${bodyText.length})`);
      passedCount++;
    } else {
      console.error(`❌ FAIL: Route ${r.path} failed! Title: "${title}", Blank: ${isBlank}, Found expected: ${hasExpected}, Attribution ok: ${attributionOk}, Errors: ${JSON.stringify(criticalErrors)}`);
      failedCount++;
    }
  }

  // Test Back/Forward Navigation
  console.log('\n--- Testing Browser Back / Forward Navigation ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/shop' });
  await sleep(600);
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/about' });
  await sleep(600);

  // Go Back
  await cdp.eval('window.history.back()');
  await sleep(600);
  const backUrl = await cdp.eval('window.location.pathname');
  const backPassed = backUrl === '/shop';
  console.log(backPassed ? `✅ PASS: Back navigation returned to /shop` : `❌ FAIL: Back navigation returned to ${backUrl}`);

  // Go Forward
  await cdp.eval('window.history.forward()');
  await sleep(600);
  const forwardUrl = await cdp.eval('window.location.pathname');
  const forwardPassed = forwardUrl === '/about';
  console.log(forwardPassed ? `✅ PASS: Forward navigation returned to /about` : `❌ FAIL: Forward navigation returned to ${forwardUrl}`);

  // Test Viewport Responsiveness (Desktop 1440px, Tablet 768px, Mobile 375px)
  console.log('\n--- Testing Viewport Responsiveness ---');
  const viewports = [
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 },
  ];

  for (const vp of viewports) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.name === 'Mobile',
    });
    await sleep(400);

    const overflow = await cdp.eval('document.documentElement.scrollWidth > window.innerWidth');
    if (!overflow) {
      console.log(`✅ PASS: ${vp.name} (${vp.width}x${vp.height}): Zero horizontal overflow`);
      passedCount++;
    } else {
      console.error(`❌ FAIL: ${vp.name} (${vp.width}x${vp.height}): Horizontal overflow detected!`);
      failedCount++;
    }
  }

  console.log(`\n====================================================`);
  console.log(`ROUTE AUDIT SUMMARY: ${passedCount + (backPassed ? 1 : 0) + (forwardPassed ? 1 : 0)} PASSED, ${failedCount} FAILED`);
  console.log(`====================================================`);

  cdp.ws.close();
  edgeProcess.kill();
  process.exit(failedCount > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Audit script encountered error:', err);
  process.exit(1);
});
