const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const os = require('os');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19876;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_test_user_data_' + Date.now());

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
    this.events = [];
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
      const payload = JSON.stringify({ id: msgId, method, params });
      this.callbacks.set(msgId, (res) => {
        if (res.error) {
          reject(new Error(res.error.message));
        } else {
          resolve(res.result);
        }
      });
      this.ws.send(payload);
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function runCDPTests() {
  console.log('=== STARTING BROWSER CDP E2E TESTS (EDGE HEADLESS) ===\n');

  // Spawn Edge
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,900',
    'http://localhost:5173/'
  ]);

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`✅ PASS: ${name} ${extra ? `(${extra})` : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  }

  try {
    // Wait for CDP to be available
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      try {
        targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
        if (targets && targets.length > 0) break;
      } catch (e) {
        // waiting
      }
    }

    if (!targets || targets.length === 0) {
      throw new Error('Could not connect to Edge DevTools target');
    }

    console.log('Available targets:', targets.map(t => ({ type: t.type, url: t.url, title: t.title })));
    let pageTarget = targets.find(t => t.type === 'page' && !t.url.includes('containerwidget')) || targets[0];
    console.log('Selected target:', pageTarget.url);

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Console.enable');

    // Explicitly navigate to http://localhost:5173/
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(3000);

    // TEST 1: Check Collections menu removed
    const collectionsHeading = await cdp.evaluate(`
      (() => {
        const footer = document.querySelector('footer');
        if (!footer) return false;
        const headings = Array.from(footer.querySelectorAll('h4'));
        return headings.some(h => h.textContent.includes('Collections'));
      })()
    `);
    assert('Collections heading removed in live browser', collectionsHeading === false);

    // TEST 2: Check Help Center heading present
    const helpCenterHeading = await cdp.evaluate(`
      (() => {
        const footer = document.querySelector('footer');
        if (!footer) return false;
        const headings = Array.from(footer.querySelectorAll('h4'));
        return headings.some(h => h.textContent.includes('Help Center'));
      })()
    `);
    assert('Help Center heading present in live browser', helpCenterHeading === true);

    // TEST 3: Verify all 13 links in Help Center section
    const linksFound = await cdp.evaluate(`
      (() => {
        const footer = document.querySelector('footer');
        if (!footer) return [];
        const headings = Array.from(footer.querySelectorAll('h4'));
        const hcHeading = headings.find(h => h.textContent.includes('Help Center'));
        if (!hcHeading) return [];
        const section = hcHeading.closest('div');
        if (!section) return [];
        const buttons = Array.from(section.querySelectorAll('ul button, ul a'));
        return buttons.map(b => b.textContent.trim());
      })()
    `);

    const expected13 = [
      'Accessibility & Legal Notice (ADA)',
      'Cash Guarantee Policy',
      'Official Rules / No Purchase Necessary',
      'Shipping',
      'Refund',
      'FAQs',
      'Contact',
      'Services',
      'Jewelry Appraisals',
      'Redeem Your Crypto Candle Prize',
      'Discover Our Jewelries',
      'Privacy',
      'T&Cs'
    ];

    assert('Help Center has 13 links total', linksFound.length === 13, `Found ${linksFound.length}`);

    expected13.forEach((exp, idx) => {
      assert(
        `Help Center Link #${idx + 1} "${exp}" matches live text`,
        linksFound[idx] === exp,
        `Live text: "${linksFound[idx]}"`
      );
    });

    // TEST 4: Navigation on click
    // Click Contact under Help Center
    console.log('\n--- NAVIGATION TESTING ---');
    await cdp.evaluate(`
      (() => {
        const footer = document.querySelector('footer');
        const buttons = Array.from(footer.querySelectorAll('button'));
        const contactBtn = buttons.find(b => b.textContent.trim() === 'Contact');
        if (contactBtn) contactBtn.click();
      })()
    `);
    await sleep(600);

    const afterContactUrl = await cdp.evaluate('window.location.pathname');
    const isContactPage = await cdp.evaluate(`
      document.body.innerText.includes('Get in Touch') || 
      document.body.innerText.includes('Contact Customer Care') ||
      document.body.innerText.includes('Frequently Asked Questions')
    `);
    assert('Contact link navigates to Contact page', isContactPage === true, `Path: ${afterContactUrl}`);

    // Click Jewelry Appraisals
    await cdp.evaluate(`
      (() => {
        const footer = document.querySelector('footer');
        const buttons = Array.from(footer.querySelectorAll('button'));
        const appraisalBtn = buttons.find(b => b.textContent.trim() === 'Jewelry Appraisals');
        if (appraisalBtn) appraisalBtn.click();
      })()
    `);
    await sleep(600);

    const afterAppraisalUrl = await cdp.evaluate('window.location.pathname');
    const isAppraisalPage = await cdp.evaluate(`
      document.body.innerText.includes('Appraise Your Jewelry') ||
      document.body.innerText.includes('Appraisal Value') ||
      window.location.pathname.includes('appraisal')
    `);
    assert('Jewelry Appraisals link navigates to Appraisal page', isAppraisalPage === true, `Path: ${afterAppraisalUrl}`);

    // Click FAQs
    await cdp.evaluate(`
      (() => {
        const footer = document.querySelector('footer');
        const buttons = Array.from(footer.querySelectorAll('button'));
        const faqBtn = buttons.find(b => b.textContent.trim() === 'FAQs');
        if (faqBtn) faqBtn.click();
      })()
    `);
    await sleep(600);

    const afterFaqUrl = await cdp.evaluate('window.location.pathname');
    const isFaqOnPage = await cdp.evaluate(`
      document.body.innerText.includes('Frequently Asked Questions') ||
      document.body.innerText.includes('Get in Touch')
    `);
    assert('FAQs link navigates to Contact/FAQ page', isFaqOnPage === true, `Path: ${afterFaqUrl}`);

    // TEST 5: Mobile Viewport & Horizontal Overflow Test
    console.log('\n--- MOBILE VIEWPORT & OVERFLOW TESTING ---');
    const mobileWidths = [360, 375, 390, 414];
    for (const w of mobileWidths) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 812,
        deviceScaleFactor: 2,
        mobile: true
      });
      await sleep(400);

      const metrics = await cdp.evaluate(`
        (() => {
          const scrollW = document.documentElement.scrollWidth;
          const bodyW = document.body.scrollWidth;
          const innerW = window.innerWidth;
          const footer = document.querySelector('footer');
          const footerW = footer ? footer.scrollWidth : 0;
          return {
            scrollW,
            bodyW,
            innerW,
            footerW,
            overflow: scrollW > innerW + 1 || bodyW > innerW + 1
          };
        })()
      `);

      assert(
        `Mobile (${w}px): No horizontal overflow`,
        metrics.overflow === false,
        `scrollW: ${metrics.scrollW}, innerW: ${metrics.innerW}`
      );
    }

    // TEST 6: Console Error Check
    console.log('\n--- CONSOLE ERROR CHECK ---');
    const filteredErrors = cdp.consoleErrors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('fallback_task_provider') &&
      !err.includes('Download the React DevTools')
    );
    assert(
      'No application console errors in browser',
      filteredErrors.length === 0,
      filteredErrors.length > 0 ? `Errors: ${filteredErrors.join('; ')}` : 'Clean console'
    );

    cdp.close();
  } finally {
    edgeProc.kill();
  }

  console.log('\n====================================================');
  console.log(`BROWSER CDP TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCDPTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
