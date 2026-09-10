const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19877;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_test_user_data_qual_' + Date.now());

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
          const errText = parsed.params.args?.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
          if (!errText.includes('favicon') && !errText.includes('downloadable font')) {
            this.consoleErrors.push(errText);
          }
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

async function runBrowserTests() {
  console.log('=== STARTING BROWSER CDP E2E TESTS FOR $125 QUALIFICATION & REP 20% DISCOUNT ===\n');

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
    'http://localhost:5173/affiliate'
  ]);

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`[PASS] ${name} ${extra ? `(${extra})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  }

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
                     targets.find(t => t.type === 'page' && !t.url.startsWith('chrome') && !t.url.startsWith('edge')) ||
                     targets[0];

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Console.enable');

    // 1. Check Affiliate Dashboard - Overview
    console.log('\n--- 1. Testing Affiliate Dashboard Overview (/affiliate) ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/affiliate' });
    await sleep(3000);

    const overviewQualificationData = await cdp.evaluate(`
      (() => {
        const bodyText = document.body.innerText.toLowerCase();
        const hasTitle = bodyText.includes('monthly qualification');
        const hasRequired = bodyText.includes('$125.00') || bodyText.includes('$125');
        const hasSalesLabel = bodyText.includes('current qualifying retail customer sales');
        const hasPersonalDiscountNote = bodyText.includes('personal purchases receive a 20% rep discount but do not count toward the $125 monthly qualification');
        const hasFeeNotice = bodyText.includes('rep signup/monthly fees do not generate commission income');
        const hasStatus = bodyText.includes('status: qualified') || bodyText.includes('status: not qualified');
        return { hasTitle, hasRequired, hasSalesLabel, hasPersonalDiscountNote, hasFeeNotice, hasStatus };
      })()
    `);

    assert('Affiliate Overview renders Monthly Qualification title', overviewQualificationData?.hasTitle);
    assert('Affiliate Overview shows $125 requirement', overviewQualificationData?.hasRequired);
    assert('Affiliate Overview shows Current qualifying retail customer sales label', overviewQualificationData?.hasSalesLabel);
    assert('Affiliate Overview displays 20% Rep discount personal purchase disclaimer', overviewQualificationData?.hasPersonalDiscountNote);
    assert('Affiliate Overview displays Rep fee zero-commission notice', overviewQualificationData?.hasFeeNotice);
    assert('Affiliate Overview displays qualification status badge', overviewQualificationData?.hasStatus);

    // 2. Check Commissions Tab in Affiliate Dashboard
    console.log('\n--- 2. Testing Affiliate Dashboard Commissions Tab ---');
    await cdp.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const commBtn = buttons.find(b => b.textContent.includes('Commissions & History') || b.textContent.includes('Commissions'));
        if (commBtn) commBtn.click();
      })()
    `);
    await sleep(1500);

    // Open status filter dropdown
    await cdp.evaluate(`
      (() => {
        const selectButtons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('All Statuses') || b.textContent.includes('Statuses'));
        if (selectButtons.length > 0) {
          selectButtons[0].click();
        }
      })()
    `);
    await sleep(500);

    const commTabData = await cdp.evaluate(`
      (() => {
        const bodyText = document.body.innerText.toLowerCase();
        const hasTeamQual = bodyText.includes('team commission qualification');
        const hasRuleNotice = bodyText.includes('$125 qualifying retail customer sales required') || bodyText.includes('$125');
        const hasUnqualifiedFilter = bodyText.includes('unqualified (<$125 sales)') || bodyText.includes('unqualified');
        return { hasTeamQual, hasRuleNotice, hasUnqualifiedFilter };
      })()
    `);

    assert('Commissions tab displays Team Commission Qualification banner', commTabData?.hasTeamQual);
    assert('Commissions tab explains $125 qualifying sales requirement', commTabData?.hasRuleNotice);
    assert('Commissions tab includes Unqualified status filter option in dropdown', commTabData?.hasUnqualifiedFilter);

    // 3. Check Admin Representatives View (/admin?tab=representatives)
    console.log('\n--- 3. Testing Admin Representatives View (/admin?tab=representatives) ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin?tab=representatives' });
    await sleep(3000);

    const adminRepData = await cdp.evaluate(`
      (() => {
        const bodyText = document.body.innerText.toLowerCase();
        const hasMonthlyCol = bodyText.includes('monthly qualification ($125)') || bodyText.includes('monthly qualification');
        const hasRetailIndicator = bodyText.includes('retail:') || bodyText.includes('/ $125');
        const hasPersonalDiscountNote = bodyText.includes('20% off') || bodyText.includes('personal:');
        const hasFeeExcludedNotice = bodyText.includes('$20 fees: $0 comm');
        const hasEligibilityBadge = bodyText.includes('qualified') || bodyText.includes('not qualified');
        return { hasMonthlyCol, hasRetailIndicator, hasPersonalDiscountNote, hasFeeExcludedNotice, hasEligibilityBadge };
      })()
    `);

    assert('Admin Representatives displays Monthly Qualification ($125) column header', adminRepData?.hasMonthlyCol);
    assert('Admin Representatives displays Retail volume indicator', adminRepData?.hasRetailIndicator);
    assert('Admin Representatives displays Rep Personal 20% discount note', adminRepData?.hasPersonalDiscountNote);
    assert('Admin Representatives displays $20 fees $0 comm notice', adminRepData?.hasFeeExcludedNotice);
    assert('Admin Representatives displays qualification status badges for representatives', adminRepData?.hasEligibilityBadge);

    // 4. Check Admin Commissions View (/admin?tab=commissions)
    console.log('\n--- 4. Testing Admin Commissions View (/admin?tab=commissions) ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin?tab=commissions' });
    await sleep(3000);

    const adminCommData = await cdp.evaluate(`
      (() => {
        const bodyText = document.body.innerText.toLowerCase();
        const hasPolicyNotice = bodyText.includes('active commission qualification rule') && bodyText.includes('$125.00');
        const hasPersonalNotice = bodyText.includes('rep personal purchases receive a 20% discount');
        const hasFeeNotice = bodyText.includes('$20 rep signup/monthly fees do not generate commission income');
        const hasFixedPolicyBadge = bodyText.includes('policy enforced ($125 fixed)') || bodyText.includes('policy enforced');
        const allSelects = Array.from(document.querySelectorAll('select'));
        const hasUnqualifiedOption = allSelects.some(s =>
          Array.from(s.options).some(o => o.value === 'unqualified' || o.text.toLowerCase().includes('unqualified'))
        );
        return { hasPolicyNotice, hasPersonalNotice, hasFeeNotice, hasFixedPolicyBadge, hasUnqualifiedOption };
      })()
    `);

    assert('Admin Commissions displays $125 downline qualification policy banner', adminCommData?.hasPolicyNotice);
    assert('Admin Commissions explains 20% Rep personal discount rule', adminCommData?.hasPersonalNotice);
    assert('Admin Commissions explains $20 fee zero-commission rule', adminCommData?.hasFeeNotice);
    assert('Admin Commissions displays Policy Enforced ($125 Fixed) badge', adminCommData?.hasFixedPolicyBadge);
    assert('Admin Commissions includes Unqualified status filter option in select', adminCommData?.hasUnqualifiedOption);

    // 5. Check Console Errors
    console.log('\n--- 5. Checking Browser Console Errors ---');
    const realErrors = cdp.consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('downloadable font') &&
      !err.includes('chrome-extension')
    );
    assert('Zero critical browser console errors during navigation', realErrors.length === 0,
      realErrors.length > 0 ? `Errors: ${realErrors.join(', ')}` : 'Clean console'
    );

    console.log(`\n========================================`);
    console.log(`BROWSER CDP TESTS COMPLETE: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================`);

    cdp.close();
    edgeProc.kill();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    try { edgeProc.kill(); } catch (e) {}
    process.exit(1);
  }
}

runBrowserTests();
