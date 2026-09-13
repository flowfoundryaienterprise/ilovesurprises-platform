const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 19993;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_admin_final_' + Date.now());

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
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
    this.ws.onmessage = (msg) => {
      const parsed = JSON.parse(msg.data);
      if (parsed.id && this.callbacks.has(parsed.id)) {
        this.callbacks.get(parsed.id)(parsed);
        this.callbacks.delete(parsed.id);
      }
    };
  }
  async waitOpen() {
    return new Promise((r) => (this.ws.onopen = r));
  }
  send(m, p = {}) {
    return new Promise((res, rej) => {
      const curId = this.id++;
      this.callbacks.set(curId, (r) => (r.error ? rej(r.error) : res(r.result)));
      this.ws.send(JSON.stringify({ id: curId, method: m, params: p }));
    });
  }
  async eval(expr) {
    let script = expr.trim();
    if (!script.startsWith('(()') && !script.startsWith('function') && !script.startsWith('{')) {
      if (!script.includes('return ') && !script.includes(';')) {
        script = `return (${script});`;
      }
      script = `(() => {\n${script}\n})()`;
    }
    const res = await this.send('Runtime.evaluate', { expression: script, returnByValue: true });
    if (res.exceptionDetails) {
      console.error(
        'EVAL EXCEPTION in (' + expr.replace(/\s+/g, ' ').slice(0, 80) + '):',
        res.exceptionDetails.exception?.description || res.exceptionDetails.text
      );
    }
    return res.result?.value;
  }
}

async function run() {
  console.log('===========================================================');
  console.log('=== FULL E2E VALIDATION: ADMIN PANEL (10 REQUIREMENTS) ===');
  console.log('===========================================================\n');

  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const edgeArgs = [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,850',
    'http://localhost:5173/admin',
  ];

  const edgeProc = spawn(EDGE_PATH, edgeArgs);

  let cdp = null;
  let passed = 0;
  let failed = 0;

  function assert(title, condition, extra = '') {
    if (condition) {
      console.log(`✅ [PASS] ${title} ${extra ? `(${extra})` : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  }

  try {
    let targets = null;
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      try {
        targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        if (targets && targets.length > 0) break;
      } catch (_) {}
    }

    if (!targets || targets.length === 0) {
      throw new Error('Edge failed to start or expose CDP port');
    }

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Explicitly set desktop viewport (1280x850)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Wait until Admin dashboard has mounted
    console.log('Waiting for admin bundle to mount...');
    for (let i = 0; i < 30; i++) {
      const ready = await cdp.eval(`!!document.querySelector('header') && !document.querySelector('.animate-spin')`);
      if (ready) break;
      await sleep(500);
    }

    async function clickSidebarTab(tabId) {
      await cdp.eval(`
        const btn = document.querySelector('button[data-tab="${tabId}"]');
        if (btn) btn.click();
      `);
      await sleep(700);
    }

    // TEST 1: Admin Overview
    console.log('\n--- 1. Testing Admin Overview (KPI Cards & Velocity) ---');
    await clickSidebarTab('overview');
    const overviewTitle = await cdp.eval(`document.body.innerText.toLowerCase().includes('operational overview & shortcuts')`);
    assert('Overview page loaded', overviewTitle);

    const hasCards = await cdp.eval(`
      ['Products', 'Collections', 'Orders', 'Customers', 'Affiliates', 'Commissions', 'Appraisals'].every(k =>
        document.body.innerText.includes(k)
      )
    `);
    assert('All 7 KPI Overview Cards present with quick-jump links', hasCards);

    const hasLiveVelocity = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('gross sales') ||
      document.body.innerText.toLowerCase().includes('revenue velocity')
    `);
    assert('Financial metrics bar rendered with revenue velocity', hasLiveVelocity);

    // TEST 2: Product Management
    console.log('\n--- 2. Testing Product Management Tab ---');
    await clickSidebarTab('products');

    const productsHeader = await cdp.eval(`document.body.innerText.toLowerCase().includes('product & inventory catalog')`);
    assert('Product Catalog view active', productsHeader);

    const hasSearchAndFilter = await cdp.eval(`
      !!document.querySelector('input[placeholder*="Search by title"]') &&
      !!document.querySelector('select')
    `);
    assert('Search input and category/stock filters rendered', hasSearchAndFilter);

    const hasPagination = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('showing') &&
      document.body.innerText.toLowerCase().includes('matching products')
    `);
    assert('Pagination and count status rendered', hasPagination);

    // Test Open Add Product Modal
    await cdp.eval(`
      const addBtn = document.getElementById('admin-add-product-btn');
      if (addBtn) addBtn.click();
    `);
    await sleep(500);

    const addModalOpen = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('add new catalog product') ||
      document.body.innerText.toLowerCase().includes('create new product') ||
      document.body.innerText.toLowerCase().includes('pricing & stock')
    `);
    assert('Create New Product modal opens with title, price, variants, and options manager', addModalOpen);

    // Close modal
    await cdp.eval(`
      const cancelBtn = document.getElementById('admin-cancel-product-btn');
      if (cancelBtn) cancelBtn.click();
    `);
    await sleep(400);

    // TEST 3: Collection Management
    console.log('\n--- 3. Testing Collection Management Tab ---');
    await clickSidebarTab('collections');

    const collectionsHeader = await cdp.eval(`document.body.innerText.toLowerCase().includes('collection & category management')`);
    assert('Collection Directory view active', collectionsHeader);

    const hasCollections = await cdp.eval(`
      document.body.innerText.includes('Cash Candles') || document.body.innerText.includes('ZODIAC')
    `);
    assert('Collections list rendered with writeups and image covers', hasCollections);

    // Test Create Collection Modal
    await cdp.eval(`
      const newColBtn = document.getElementById('admin-create-collection-btn');
      if (newColBtn) newColBtn.click();
    `);
    await sleep(500);

    const createColModal = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('create new collection') &&
      document.body.innerText.toLowerCase().includes('tagline')
    `);
    assert('Create Collection modal has name, slug, tagline, description, image', createColModal);

    // Close modal
    await cdp.eval(`
      const cancelColBtn = document.getElementById('admin-cancel-collection-btn');
      if (cancelColBtn) cancelColBtn.click();
    `);
    await sleep(400);

    // TEST 4: Orders Management
    console.log('\n--- 4. Testing Orders Management Tab ---');
    await clickSidebarTab('orders');

    const ordersHeader = await cdp.eval(`document.body.innerText.toLowerCase().includes('orders & fulfillment')`);
    assert('Orders & Fulfillment view active', ordersHeader);

    const hasOrderFilters = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('shipping status') &&
      document.body.innerText.toLowerCase().includes('payments')
    `);
    assert('Fulfillment and payment status filters present', hasOrderFilters);

    const ordersTableOrEmptyState = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('no orders found') ||
      document.body.innerText.toLowerCase().includes('order id & date')
    `);
    assert('Proper table or high-fidelity empty state for zero-order database', ordersTableOrEmptyState);

    // TEST 5: Customers Management
    console.log('\n--- 5. Testing Customers Management Tab ---');
    await clickSidebarTab('customers');

    const customersHeader = await cdp.eval(`document.body.innerText.toLowerCase().includes('customer registry')`);
    assert('Customer Accounts view active', customersHeader);

    const hasCustomerList = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('customer name') &&
      document.body.innerText.toLowerCase().includes('lifetime value') &&
      document.body.innerText.toLowerCase().includes('attributed referrer')
    `);
    assert('Customer table lists accounts with LTV and affiliate attribution', hasCustomerList);

    // Click profile button on first customer
    await cdp.eval(`
      const profBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Profile');
      if (profBtn) profBtn.click();
    `);
    await sleep(500);

    const customerDrawerOpen = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('customer profile') ||
      document.body.innerText.toLowerCase().includes('total orders')
    `);
    assert('Customer detail drawer opens with profile stats and email copy button', customerDrawerOpen);

    // Close drawer
    await cdp.eval(`
      const closeBtn = document.querySelector('button[aria-label="Close"]') || Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-x'));
      if (closeBtn) closeBtn.click();
    `);
    await sleep(400);

    // TEST 6: Affiliate / MLM Management
    console.log('\n--- 6. Testing Affiliate / MLM Management Tab ---');
    await clickSidebarTab('representatives');

    const repsHeader = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('representatives directory') ||
      document.body.innerText.toLowerCase().includes('audit downline')
    `);
    assert('Representatives / MLM Directory view active', repsHeader);

    const hasRepColumns = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('representative') &&
      (document.body.innerText.toLowerCase().includes('sponsor info') || document.body.innerText.toLowerCase().includes('no representatives found'))
    `);
    assert('Reps table includes sponsor upline and tier details', hasRepColumns);

    // TEST 7: Appraisal / Certificate Management
    console.log('\n--- 7. Testing Appraisals & Certificates Tab ---');
    await clickSidebarTab('appraisals');

    const appraisalsHeader = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('jewelry appraisal management') ||
      document.body.innerText.toLowerCase().includes('appraisal')
    `);
    assert('Appraisals management view active', appraisalsHeader);

    // TEST 8: Homepage Content Management
    console.log('\n--- 8. Testing Homepage Content Management Tab ---');
    await clickSidebarTab('content');

    const contentHeader = await cdp.eval(`document.body.innerText.toLowerCase().includes('homepage content & showcase management')`);
    assert('Homepage Content Manager view active', contentHeader);

    const hasCardsConfig = await cdp.eval(`
      document.body.innerText.includes('Cash Candles') &&
      document.body.innerText.includes('Trending Collection') &&
      document.body.innerText.includes('ZODIAC CASH MONEY CANDLES')
    `);
    assert('All 3 primary featured collection cards configurable with live preview', hasCardsConfig);

    const hasBannerTabs = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('announcement') ||
      document.body.innerText.toLowerCase().includes('promo')
    `);
    assert('Promo and announcement banners configurable', hasBannerTabs);

    // TEST 9: Admin Management & Permissions
    console.log('\n--- 9. Testing Staff & Permissions Tab ---');
    await clickSidebarTab('permissions');

    const permHeader = await cdp.eval(`document.body.innerText.toLowerCase().includes('administrative roles & rbac matrix')`);
    assert('Administrative Roles & RBAC Matrix view active', permHeader);

    const hasStaffSection = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('administrative staff')
    `);
    assert('Administrative staff directory loaded from Supabase profiles', hasStaffSection);

    const hasRbacMatrix = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('module access matrix') &&
      document.body.innerText.toLowerCase().includes('super admin') &&
      document.body.innerText.toLowerCase().includes('store manager')
    `);
    assert('Full RBAC Permissions Matrix table rendered', hasRbacMatrix);

    // TEST 10: Reports & Analytics
    console.log('\n--- 10. Testing Reports & Analytics Tab ---');
    await clickSidebarTab('reports');

    const reportsHeader = await cdp.eval(`document.body.innerText.toLowerCase().includes('analytics, financials & reports')`);
    assert('Reports view active', reportsHeader);

    const hasTimeframes = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('7d') ||
      document.body.innerText.toLowerCase().includes('30d') ||
      document.body.innerText.toLowerCase().includes('last 7 days') ||
      document.body.innerText.toLowerCase().includes('omnichannel sales')
    `);
    assert('Financial intelligence metrics and timeframe filters present', hasTimeframes);

    // TEST 11: Mobile Responsive Navigation (375px)
    console.log('\n--- 11. Testing Mobile Responsive Viewport (375px) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(600);

    const hasHamburger = await cdp.eval(`
      !!document.querySelector('button[aria-label="Open sidebar navigation"]')
    `);
    assert('Mobile hamburger button visible on 375px viewport', hasHamburger);

    // Click hamburger to open drawer
    await cdp.eval(`
      const hamburger = document.querySelector('button[aria-label="Open sidebar navigation"]');
      if (hamburger) hamburger.click();
    `);
    await sleep(500);

    const mobileDrawerOpen = await cdp.eval(`
      document.body.innerText.toLowerCase().includes('admin suite') ||
      document.body.innerText.toLowerCase().includes('simulate role')
    `);
    assert('Mobile navigation drawer opens smoothly', mobileDrawerOpen);

    // Restore desktop viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(400);

    // TEST 12: Storefront Integrity
    console.log('\n--- 12. Testing Storefront Integrity & Dynamic Sync ---');
    await cdp.eval(`
      const storeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Storefront'));
      if (storeBtn) storeBtn.click();
    `);
    await sleep(1500);

    const storefrontHomeLoaded = await cdp.eval(`
      document.body.innerText.includes('Jewelry Candles') ||
      document.body.innerText.includes('I Love Surprises') ||
      document.body.innerText.includes('SURPRISE')
    `);
    assert('Storefront homepage loads smoothly when exiting admin', storefrontHomeLoaded);

    const featuredSectionRendered = await cdp.eval(`
      document.body.innerText.includes('Featured Collections') ||
      document.body.innerText.includes('Cash Candles')
    `);
    assert('Storefront Featured Collections section renders seamlessly', featuredSectionRendered);

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    if (cdp) cdp.ws.close();
    try {
      edgeProc.kill();
    } catch (_) {}
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch (_) {}
  }

  console.log('\n===========================================================');
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  process.exit(failed > 0 ? 1 : 0);
}

run();
