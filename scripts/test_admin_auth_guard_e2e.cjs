const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 19994;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_admin_auth_' + Date.now());

// Read environment for Supabase
const envLocalPath = path.resolve(__dirname, '..', '.env.local');
let supabaseUrl = '';
let serviceRoleKey = '';
let anonKey = '';

if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (k === 'VITE_SUPABASE_URL') supabaseUrl = v;
      if (k === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = v;
      if (k === 'VITE_SUPABASE_ANON_KEY') anonKey = v;
    }
  }
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
      try {
        const parsed = JSON.parse(msg.data);
        if (parsed.id && this.callbacks.has(parsed.id)) {
          this.callbacks.get(parsed.id)(parsed);
          this.callbacks.delete(parsed.id);
        }
      } catch (e) {
        console.error('WS onmessage parse error:', e.message);
      }
    };
    this.ws.onerror = (err) => {
      console.error('CDP WebSocket error:', err.message || err);
    };
    this.ws.onclose = (event) => {
      for (const [id, cb] of this.callbacks.entries()) {
        cb({ error: new Error(`WebSocket closed: code ${event.code}`) });
      }
      this.callbacks.clear();
    };
  }
  async waitOpen() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    return new Promise((r) => (this.ws.onopen = r));
  }
  send(m, p = {}, timeoutMs = 15000) {
    return new Promise((res, rej) => {
      if (this.ws.readyState !== WebSocket.OPEN) {
        return rej(new Error(`WebSocket is not open (state: ${this.ws.readyState})`));
      }
      const curId = this.id++;
      const timer = setTimeout(() => {
        this.callbacks.delete(curId);
        rej(new Error(`CDP command ${m} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.callbacks.set(curId, (r) => {
        clearTimeout(timer);
        if (r.error) rej(r.error);
        else res(r.result);
      });
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
  close() {
    try {
      this.ws.close();
    } catch (_) {}
  }
}

async function run() {
  console.log('======================================================================');
  console.log('=== FULL E2E VALIDATION: SECURE ADMIN LOGIN & ROUTE AUTHORIZATION ===');
  console.log('======================================================================\n');

  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const timestamp = Date.now();
  const testAdminEmail = `admin_test_${timestamp}@ilovesurprises-live.com`;
  const testAdminPassword = `AdminPass!${timestamp.toString().slice(-4)}Secure#`;

  const testCustomerEmail = `customer_test_${timestamp}@ilovesurprises-live.com`;
  const testCustomerPassword = `CustomerPass!${timestamp.toString().slice(-4)}Secure#`;

  let adminUserId = null;
  let customerUserId = null;

  // Step 0: Set up test accounts in Supabase
  console.log('[Setup] Creating test users in live Supabase...');
  try {
    // Create Admin User
    const { data: admData, error: admErr } = await supabaseAdmin.auth.admin.createUser({
      email: testAdminEmail,
      password: testAdminPassword,
      email_confirm: true,
      user_metadata: { name: 'Automated Test Admin', role: 'admin' },
    });
    if (admErr) throw admErr;
    adminUserId = admData.user.id;

    // Ensure profiles record has role 'admin'
    await supabaseAdmin.from('profiles').upsert({
      id: adminUserId,
      name: 'Automated Test Admin',
      email: testAdminEmail,
      role: 'admin',
      updated_at: new Date().toISOString(),
    });

    // Create Customer User (Non-Admin)
    const { data: custData, error: custErr } = await supabaseAdmin.auth.admin.createUser({
      email: testCustomerEmail,
      password: testCustomerPassword,
      email_confirm: true,
      user_metadata: { name: 'Automated Test Customer', role: 'customer' },
    });
    if (custErr) throw custErr;
    customerUserId = custData.user.id;

    await supabaseAdmin.from('profiles').upsert({
      id: customerUserId,
      name: 'Automated Test Customer',
      email: testCustomerEmail,
      role: 'customer',
      updated_at: new Date().toISOString(),
    });

    console.log(`[Setup] Created Admin: ${testAdminEmail} (${adminUserId})`);
    console.log(`[Setup] Created Customer: ${testCustomerEmail} (${customerUserId})\n`);
  } catch (err) {
    console.error('[Setup Error]:', err.message);
    process.exit(1);
  }

  // Launch Headless Edge
  const edgeArgs = [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
    '--disable-background-networking',
    '--window-size=1280,850',
    'http://localhost:5173/admin',
  ];

  const edgeProc = spawn(EDGE_PATH, edgeArgs, { stdio: 'ignore' });

  let cdp = null;
  let passedCount = 0;
  let totalTests = 0;

  function assert(name, condition, details = '') {
    totalTests++;
    if (condition) {
      passedCount++;
      console.log(`✅ [PASS ${totalTests}] ${name}`);
      if (details) console.log(`          ${details}`);
    } else {
      console.log(`❌ [FAIL ${totalTests}] ${name}`);
      if (details) console.log(`          ${details}`);
    }
  }

  try {
    // Connect to CDP - specifically waiting for the localhost:5173 app target
    let pageTarget = null;
    for (let i = 0; i < 40; i++) {
      await sleep(300);
      try {
        const targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        pageTarget = targets.find(
          (t) => t.type === 'page' && t.url && t.url.includes('5173')
        );
        if (pageTarget) break;
      } catch (_) {}
    }
    if (!pageTarget) throw new Error('Could not find Edge page target for localhost:5173');
    console.log(`[CDP] Successfully connected to target: ${pageTarget.url}`);

    cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // TEST 1: Direct unauthenticated visit to /admin must redirect to /admin/login
    console.log('\n--- 1. Testing Unauthenticated Route Guard for /admin ---');
    for (let i = 0; i < 15; i++) {
      const url = await cdp.eval('window.location.pathname');
      const el = await cdp.eval('Boolean(document.getElementById("admin-email") && document.getElementById("admin-password"))');
      if (url === '/admin/login' && el) break;
      await sleep(300);
    }
    let currentUrl = await cdp.eval('window.location.pathname');
    let hasAdminLoginElements = await cdp.eval('Boolean(document.getElementById("admin-email") && document.getElementById("admin-password"))');

    assert(
      'Unauthenticated /admin redirects to /admin/login',
      currentUrl === '/admin/login' && hasAdminLoginElements,
      `Current URL: ${currentUrl}, Login form visible: ${hasAdminLoginElements}`
    );

    // TEST 2: Direct unauthenticated visit to /admin?tab=products must redirect to /admin/login
    console.log('\n--- 2. Testing Unauthenticated Deep-Link Protection (/admin?tab=products) ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin?tab=products' });
    await sleep(2000);
    currentUrl = await cdp.eval('window.location.pathname');
    hasAdminLoginElements = await cdp.eval('Boolean(document.getElementById("admin-email"))');

    assert(
      'Unauthenticated deep-link /admin?tab=products redirects to /admin/login',
      currentUrl === '/admin/login' && hasAdminLoginElements,
      `Current URL: ${currentUrl}`
    );

    // TEST 3: Admin Login Page Visual Elements & Branding
    console.log('\n--- 3. Testing Admin Login UI Elements & Branding ---');
    const brandElements = await cdp.eval(`
      (() => {
        const emailInput = document.getElementById('admin-email');
        const passInput = document.getElementById('admin-password');
        const submitBtn = document.getElementById('admin-login-submit');
        const forgotBtn = document.getElementById('admin-forgot-password-trigger');
        const backBtn = document.getElementById('admin-login-back-to-store');
        const bodyText = (document.body.innerText || '').toLowerCase();
        return {
          hasEmail: Boolean(emailInput),
          hasPassword: Boolean(passInput),
          hasSubmit: Boolean(submitBtn),
          hasForgot: Boolean(forgotBtn),
          hasBackToStore: Boolean(backBtn),
          portalTextPresent: bodyText.includes('administrator suite') || bodyText.includes('admin suite')
        };
      })()
    `);

    assert(
      'Admin Login renders all required fields, branding, and navigation controls',
      brandElements.hasEmail &&
        brandElements.hasPassword &&
        brandElements.hasSubmit &&
        brandElements.hasForgot &&
        brandElements.hasBackToStore &&
        brandElements.portalTextPresent,
      `Inputs: Email(${brandElements.hasEmail}), Password(${brandElements.hasPassword}), Submit(${brandElements.hasSubmit}), Forgot(${brandElements.hasForgot}), Back(${brandElements.hasBackToStore}), PortalText(${brandElements.portalTextPresent})`
    );

    // TEST 4: Invalid Credentials Error Message
    console.log('\n--- 4. Testing Invalid Credentials Handling ---');
    await cdp.eval(`
      (() => {
        const setVal = (el, v) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const emailInput = document.getElementById('admin-email');
        const passInput = document.getElementById('admin-password');
        setVal(emailInput, '${testAdminEmail}');
        setVal(passInput, 'CompletelyWrongPassword123!#');
        document.getElementById('admin-login-submit').click();
      })()
    `);

    // Wait for auth response
    await sleep(3000);
    const errorBanner = await cdp.eval(`
      (() => {
        const banner = document.getElementById('admin-login-error');
        return banner ? banner.innerText : '';
      })()
    `);

    assert(
      'Submitting invalid credentials displays clear error banner',
      errorBanner.length > 0 &&
        (errorBanner.toLowerCase().includes('invalid') || errorBanner.toLowerCase().includes('credentials') || errorBanner.toLowerCase().includes('failed')),
      `Error Banner Text: "${errorBanner.replace(/\n/g, ' ')}"`
    );

    // TEST 5: Customer Account Access Denied (Non-Admin Block)
    console.log('\n--- 5. Testing Customer Role Interception (Non-Admin Denied) ---');
    await cdp.eval(`
      (() => {
        const setVal = (el, v) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const emailInput = document.getElementById('admin-email');
        const passInput = document.getElementById('admin-password');
        setVal(emailInput, '${testCustomerEmail}');
        setVal(passInput, '${testCustomerPassword}');
        document.getElementById('admin-login-submit').click();
      })()
    `);

    await sleep(3500);
    const accessDeniedMsg = await cdp.eval(`
      (() => {
        const banner = document.getElementById('admin-login-error');
        return banner ? banner.innerText : '';
      })()
    `);
    const pathAfterCustomerLogin = await cdp.eval('window.location.pathname');

    assert(
      'Customer login attempt is blocked with Access Denied and stays on /admin/login',
      accessDeniedMsg.toLowerCase().includes('access denied') && pathAfterCustomerLogin === '/admin/login',
      `Message: "${accessDeniedMsg.replace(/\n/g, ' ')}", Path: ${pathAfterCustomerLogin}`
    );

    // TEST 6: Successful Admin Authentication & Redirect to /admin
    console.log('\n--- 6. Testing Successful Admin Authentication & Redirect ---');
    await cdp.eval(`
      (() => {
        const setVal = (el, v) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const emailInput = document.getElementById('admin-email');
        const passInput = document.getElementById('admin-password');
        setVal(emailInput, '${testAdminEmail}');
        setVal(passInput, '${testAdminPassword}');
        document.getElementById('admin-login-submit').click();
      })()
    `);

    await sleep(3500);
    const pathAfterAdminLogin = await cdp.eval('window.location.pathname');
    const adminDashboardLoaded = await cdp.eval(`
      (() => {
        return Boolean(
          document.querySelector('aside') &&
          document.body.innerText.includes('Super Administrator') ||
          document.body.innerText.includes('Simulate Role')
        );
      })()
    `);

    assert(
      'Admin login succeeds, redirects to /admin, and renders Admin Dashboard',
      pathAfterAdminLogin === '/admin' && adminDashboardLoaded,
      `Path: ${pathAfterAdminLogin}, Dashboard UI detected: ${adminDashboardLoaded}`
    );

    // TEST 7: Session Persistence Across Page Reload
    console.log('\n--- 7. Testing Admin Session Persistence Across Page Reload ---');
    await cdp.send('Page.reload');
    await sleep(3500);

    const pathAfterReload = await cdp.eval('window.location.pathname');
    const dashboardStillVisible = await cdp.eval(`
      (() => {
        return Boolean(
          document.querySelector('aside') &&
          document.body.innerText.includes('Storefront')
        );
      })()
    `);

    assert(
      'Admin session persists across page reload without kicking user back to login',
      pathAfterReload === '/admin' && dashboardStillVisible,
      `Path: ${pathAfterReload}, Dashboard persisted: ${dashboardStillVisible}`
    );

    // TEST 8: Logout Functionality
    console.log('\n--- 8. Testing Logout from Admin Suite ---');
    const logoutClicked = await cdp.eval(`
      (() => {
        const btn = document.getElementById('admin-sidebar-logout-btn') || document.getElementById('admin-header-logout-btn');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `);

    await sleep(2500);
    const pathAfterLogout = await cdp.eval('window.location.pathname');
    const loginFormVisibleAfterLogout = await cdp.eval('Boolean(document.getElementById("admin-email"))');

    assert(
      'Clicking Sign Out terminates admin session and returns to /admin/login',
      logoutClicked && pathAfterLogout === '/admin/login' && loginFormVisibleAfterLogout,
      `Logout Clicked: ${logoutClicked}, Path: ${pathAfterLogout}, Login Form Visible: ${loginFormVisibleAfterLogout}`
    );

    // TEST 9: Storefront Routes Remain Functional (Customer Experience Untouched)
    console.log('\n--- 9. Verifying Storefront Routes Are Completely Untouched ---');
    const clickedReturnHome = await cdp.eval(`
      (() => {
        const btn = document.getElementById('admin-login-back-to-store');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `);
    await sleep(2500);
    const homeLoaded = await cdp.eval(`
      (() => {
        const hasHeader = Boolean(document.querySelector('header'));
        const hasFooter = Boolean(document.querySelector('footer'));
        return Boolean(hasHeader && hasFooter && window.location.pathname === '/');
      })()
    `);

    // Navigate to /shop
    await cdp.eval(`
      (() => {
        window.history.pushState({ view: 'shop', category: 'All Surprises' }, '', '/shop');
        window.dispatchEvent(new CustomEvent('ils_route_change', { detail: { route: 'shop' } }));
      })()
    `);
    await sleep(2500);
    const shopLoaded = await cdp.eval(`
      (() => {
        return Boolean(window.location.pathname === '/shop' && document.body.innerText.includes('Surprises'));
      })()
    `);

    assert(
      'Public storefront routes (/ and /shop) operate normally with full header and footer',
      clickedReturnHome && homeLoaded && shopLoaded,
      `Return to Store Clicked: ${clickedReturnHome}, Home Header/Footer: ${homeLoaded}, Shop View: ${shopLoaded}`
    );

    // TEST 10: Forgot Password UI Modal Integration
    console.log('\n--- 10. Testing Forgot Password Modal on /admin/login ---');
    await cdp.eval(`
      (() => {
        window.history.pushState({ view: 'admin-login' }, '', '/admin/login');
        window.dispatchEvent(new CustomEvent('ils_route_change', { detail: { route: 'admin-login' } }));
      })()
    `);
    await sleep(2000);
    const forgotModalOpened = await cdp.eval(`
      (() => {
        const trigger = document.getElementById('admin-forgot-password-trigger');
        if (trigger) {
          trigger.click();
          return true;
        }
        return false;
      })()
    `);
    await sleep(1000);
    const modalVisible = await cdp.eval('Boolean(document.getElementById("forgot-admin-email"))');

    assert(
      'Forgot Password modal opens properly on /admin/login with email input',
      forgotModalOpened && modalVisible,
      `Trigger clicked: ${forgotModalOpened}, Modal input visible: ${modalVisible}`
    );

  } catch (err) {
    console.error('Fatal Test Exception:', err);
  } finally {
    if (cdp) {
      try {
        await cdp.send('Browser.close');
      } catch (_) {}
      cdp.close();
    }
    try {
      if (edgeProc && edgeProc.pid) {
        edgeProc.kill('SIGKILL');
      }
    } catch (_) {}
    await sleep(600);
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch (_) {}

    // Cleanup test users from Supabase
    console.log('\n[Cleanup] Cleaning up test users from Supabase...');
    if (adminUserId) {
      try {
        await supabaseAdmin.from('profiles').delete().eq('id', adminUserId);
        await supabaseAdmin.auth.admin.deleteUser(adminUserId);
        console.log(`[Cleanup] Deleted test admin user: ${adminUserId}`);
      } catch (err) {
        console.warn('Admin cleanup error:', err.message);
      }
    }
    if (customerUserId) {
      try {
        await supabaseAdmin.from('profiles').delete().eq('id', customerUserId);
        await supabaseAdmin.auth.admin.deleteUser(customerUserId);
        console.log(`[Cleanup] Deleted test customer user: ${customerUserId}`);
      } catch (err) {
        console.warn('Customer cleanup error:', err.message);
      }
    }

    console.log('\n======================================================================');
    console.log(`FINAL RESULTS: ${passedCount} / ${totalTests} TESTS PASSED`);
    console.log('======================================================================');

    if (passedCount === totalTests && totalTests > 0) {
      console.log('🎉 ALL ADMIN AUTH & ROUTE GUARD SPECIFICATIONS VERIFIED SUCCESSFUL!\n');
      setTimeout(() => process.exit(0), 300);
    } else {
      console.error(`💥 FAILURE: ${totalTests - passedCount} test(s) failed.\n`);
      setTimeout(() => process.exit(1), 300);
    }
  }
}

run();
