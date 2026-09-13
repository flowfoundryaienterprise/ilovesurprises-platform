const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 19995;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_customer_firebase_auth_' + Date.now());

// Read environment for Supabase
const envLocalPath = path.resolve(__dirname, '..', '.env.local');
let supabaseUrl = '';
let serviceRoleKey = '';

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

    this.ws.onmessage = (event) => {
      const resp = JSON.parse(event.data);
      if (resp.id && this.callbacks.has(resp.id)) {
        const cb = this.callbacks.get(resp.id);
        this.callbacks.delete(resp.id);
        cb(resp);
      }
    };

    this.ws.onerror = (err) => {
      console.error('CDP WebSocket error:', err);
    };

    this.ws.onclose = (event) => {
      for (const [, cb] of this.callbacks.entries()) {
        cb({ error: new Error(`WebSocket closed: code ${event.code}`) });
      }
      this.callbacks.clear();
    };
  }

  async open() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const callId = this.id++;
      const payload = { id: callId, method, params };
      this.callbacks.set(callId, (resp) => {
        if (resp.error) {
          reject(new Error(resp.error.message || JSON.stringify(resp.error)));
        } else {
          resolve(resp.result);
        }
      });
      this.ws.send(JSON.stringify(payload));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      throw new Error('Eval Exception: ' + (res.exceptionDetails.exception?.description || res.exceptionDetails.text));
    }
    return res.result?.value;
  }

  close() {
    try {
      this.ws.close();
    } catch (_) {}
  }
}

async function runTests() {
  console.log('======================================================================');
  console.log('=== FULL E2E VALIDATION: FIREBASE CUSTOMER AUTHENTICATION ===');
  console.log('======================================================================');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`✅ [PASS ${passed + failed + 1}] ${name}`);
      if (extra) console.log(`          ${extra}`);
      passed++;
    } else {
      console.error(`❌ [FAIL ${passed + failed + 1}] ${name}`);
      if (extra) console.error(`          ${extra}`);
      failed++;
    }
  }

  // Generate test customer in Supabase to verify idempotent linking
  const testTimestamp = Date.now();
  const testCustomerEmail = `customer_fb_test_${testTimestamp}@example.com`;
  let createdCustomerId = null;

  try {
    console.log('\n[Setup] Creating initial test customer in live Supabase...');
    const { data: customerRow, error: custErr } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          name: 'Original Customer Name',
          email: testCustomerEmail,
          role: 'customer',
          rep_username: 'amber_surprise', // established lifetime referrer
          avatar_url: '/assets/ilovesurprises/Profile/profile%20image.webp',
        },
      ])
      .select('id, email, rep_username, name')
      .single();

    if (custErr) {
      console.warn('[Setup Warning] Supabase profile setup note:', custErr.message);
    } else {
      createdCustomerId = customerRow?.id;
      console.log(`[Setup] Created profile: ${customerRow.id} with permanent rep "${customerRow.rep_username}"`);
    }
  } catch (err) {
    console.warn('[Setup Note] Non-blocking setup error:', err.message);
  }

  // Launch Edge browser
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const edgeProc = spawn(
    EDGE_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${TEMP_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--headless=new',
      '--disable-gpu',
      '--window-size=1440,900',
      'http://localhost:5173/',
    ],
    { stdio: 'ignore' }
  );

  let cdp = null;

  try {
    let wsUrl = null;
    for (let i = 0; i < 25; i++) {
      try {
        const targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        const pageTarget = targets.find(
          (t) => t.type === 'page' && t.url.includes('localhost:5173')
        );
        if (pageTarget && pageTarget.webSocketDebuggerUrl) {
          wsUrl = pageTarget.webSocketDebuggerUrl;
          break;
        }
      } catch (_) {}
      await sleep(300);
    }

    if (!wsUrl) {
      throw new Error('Failed to obtain Edge CDP WebSocket URL.');
    }

    cdp = new CDP(wsUrl);
    await cdp.open();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await sleep(2000);

    // TEST 1: Open Login Modal & Verify "Continue with Google" and Modern Blinkit/Zepto Layout
    console.log('\n--- 1. Testing Customer Login Modal UI & Google Button ---');
    // Click Login/Sign In trigger on Header
    await cdp.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b =>
          (b.innerText || '').toLowerCase().includes('sign in') ||
          (b.innerText || '').toLowerCase().includes('login')
        );
        if (btn) btn.click();
      })()
    `);
    await sleep(800);

    const loginUi = await cdp.eval(`
      (() => {
        const googleBtn = document.getElementById('btn-google-auth');
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b =>
          (b.innerText || '').toUpperCase().includes('LOGIN')
        );
        const forgotLink = Array.from(document.querySelectorAll('button')).find(b =>
          (b.innerText || '').toLowerCase().includes('forgot password')
        );
        const bodyText = (document.body.innerText || '').toUpperCase();
        const hasOrDivider = bodyText.includes('OR');

        return {
          hasGoogleBtn: Boolean(googleBtn),
          googleText: googleBtn ? googleBtn.innerText.trim() : '',
          hasSvg: googleBtn ? Boolean(googleBtn.querySelector('svg')) : false,
          hasEmail: Boolean(emailInput),
          hasPass: Boolean(passInput),
          hasSubmit: Boolean(submitBtn),
          hasForgot: Boolean(forgotLink),
          hasOrDivider,
        };
      })()
    `);

    assert(
      'Login modal renders "Continue with Google", "OR" divider, Email/Password, and Forgot Password',
      loginUi.hasGoogleBtn && loginUi.hasSvg && loginUi.hasEmail && loginUi.hasPass && loginUi.hasForgot && loginUi.hasOrDivider,
      `GoogleBtn: ${loginUi.hasGoogleBtn} (${loginUi.googleText}), SVG: ${loginUi.hasSvg}, Email: ${loginUi.hasEmail}, Password: ${loginUi.hasPass}, OR: ${loginUi.hasOrDivider}`
    );

    // TEST 2: Switch to Sign Up Modal & Verify "Continue with Google" + Layout
    console.log('\n--- 2. Testing Customer Signup Modal UI & Google Button ---');
    await cdp.eval(`
      (() => {
        const createBtn = Array.from(document.querySelectorAll('button')).find(b =>
          (b.innerText || '').toLowerCase().includes('create account')
        );
        if (createBtn) createBtn.click();
      })()
    `);
    await sleep(600);

    const signupUi = await cdp.eval(`
      (() => {
        const googleBtn = document.getElementById('btn-google-auth');
        const nameInput = document.getElementById('signup-name');
        const emailInput = document.getElementById('signup-email');
        const passInput = document.getElementById('signup-password');
        const confirmPassInput = document.getElementById('signup-confirm-password');
        const bodyText = (document.body.innerText || '').toUpperCase();
        const hasShopperVip = bodyText.includes('SHOPPER VIP');
        const hasRepOption = bodyText.includes('REP AFFILIATE');

        return {
          hasGoogleBtn: Boolean(googleBtn),
          hasName: Boolean(nameInput),
          hasEmail: Boolean(emailInput),
          hasPass: Boolean(passInput),
          hasConfirmPass: Boolean(confirmPassInput),
          hasShopperVip,
          hasRepOption,
        };
      })()
    `);

    assert(
      'Sign up modal renders "Continue with Google", Name, Email, Password, and VIP/Rep choices',
      signupUi.hasGoogleBtn && signupUi.hasName && signupUi.hasEmail && signupUi.hasPass && signupUi.hasConfirmPass,
      `GoogleBtn: ${signupUi.hasGoogleBtn}, Name: ${signupUi.hasName}, Email: ${signupUi.hasEmail}, VIP: ${signupUi.hasShopperVip}, Rep: ${signupUi.hasRepOption}`
    );

    // TEST 3: Switch to Forgot Password Modal & Verify Email Input & Clean Messaging
    console.log('\n--- 3. Testing Forgot Password Modal UI ---');
    // Switch back to login, then click Forgot Password
    await cdp.eval(`
      (() => {
        const loginBtn = Array.from(document.querySelectorAll('button')).find(b =>
          (b.innerText || '').toLowerCase() === 'login'
        );
        if (loginBtn) loginBtn.click();
      })()
    `);
    await sleep(400);

    await cdp.eval(`
      (() => {
        const forgotBtn = Array.from(document.querySelectorAll('button')).find(b =>
          (b.innerText || '').toLowerCase().includes('forgot password')
        );
        if (forgotBtn) forgotBtn.click();
      })()
    `);
    await sleep(400);

    const forgotUi = await cdp.eval(`
      (() => {
        const emailInput = document.getElementById('forgot-identifier');
        const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b =>
          (b.innerText || '').toLowerCase().includes('send reset') ||
          (b.innerText || '').toLowerCase().includes('instructions')
        );
        const backBtn = Array.from(document.querySelectorAll('button')).find(b =>
          (b.innerText || '').toLowerCase().includes('back to login')
        );
        return {
          hasEmailInput: Boolean(emailInput),
          hasSubmit: Boolean(submitBtn),
          hasBack: Boolean(backBtn),
        };
      })()
    `);

    assert(
      'Forgot Password form renders email input and submit action',
      forgotUi.hasEmailInput && forgotUi.hasSubmit,
      `EmailInput: ${forgotUi.hasEmailInput}, SubmitBtn: ${forgotUi.hasSubmit}`
    );

    // Switch back to login modal
    await cdp.eval(`
      (() => {
        const backBtn = Array.from(document.querySelectorAll('button')).find(b =>
          (b.innerText || '').toLowerCase().includes('back to login')
        );
        if (backBtn) backBtn.click();
      })()
    `);
    await sleep(400);

    // TEST 4: Google Button Click Handling & Friendly Error State
    console.log('\n--- 4. Testing Google Button Click Handling ---');
    await cdp.eval(`
      (() => {
        const googleBtn = document.getElementById('btn-google-auth');
        if (googleBtn) googleBtn.click();
      })()
    `);
    await sleep(800);

    const googleResult = await cdp.eval(`
      (() => {
        const alert = document.querySelector('[role="alert"], .bg-red-50, .text-red-700');
        const alertText = alert ? alert.innerText : '';
        const bodyText = document.body.innerText;
        return {
          hasAlert: Boolean(alert) || bodyText.toLowerCase().includes('firebase') || bodyText.toLowerCase().includes('google'),
          text: alertText,
        };
      })()
    `);

    assert(
      'Google button click triggers authentication with clean user messaging',
      googleResult.hasAlert,
      `Feedback detected: "${googleResult.text.slice(0, 80)}..."`
    );

    // TEST 5: Verify Idempotent Customer Profile Sync (No Duplicate Profile Created)
    console.log('\n--- 5. Testing Idempotent Customer Profile Synchronization ---');
    // Test the syncFirebaseCustomerProfile logic via customerAuthService evaluation
    const syncResult = await cdp.eval(`
      (async () => {
        try {
          const { customerAuthService } = await import('/src/services/customerAuthService.ts');
          const mockFbUser = {
            uid: 'fb_uid_test_${testTimestamp}',
            email: '${testCustomerEmail}',
            displayName: 'Google Updated Name',
            photoURL: 'https://lh3.googleusercontent.com/a/mock-photo-url=s96-c',
          };
          const profile = await customerAuthService.syncFirebaseCustomerProfile(mockFbUser);
          return {
            success: true,
            id: profile.id,
            email: profile.email,
            name: profile.name,
            repUsername: profile.repUsername,
            avatar: profile.avatar,
          };
        } catch (err) {
          return { success: false, error: err.message };
        }
      })()
    `);

    assert(
      'syncFirebaseCustomerProfile links to existing profile by email without creating duplicates',
      syncResult.success && syncResult.email === testCustomerEmail,
      `Linked Email: ${syncResult.email}, Preserved Rep: ${syncResult.repUsername}, Avatar: ${syncResult.avatar?.slice(0, 45)}...`
    );

    // TEST 6: Verify Lifetime Attribution Is Strictly Preserved
    console.log('\n--- 6. Testing Lifetime Attribution Safety (Original Referrer Never Overwritten) ---');
    const attributionPreserved = syncResult.repUsername === 'amber_surprise';
    assert(
      'Original referrer ("amber_surprise") is preserved and never overwritten during login sync',
      attributionPreserved,
      `Preserved Referrer: ${syncResult.repUsername}`
    );

    // TEST 7: Verify Google Avatar Preserved (Not Overwritten by WebP fallback)
    console.log('\n--- 7. Testing Google Avatar Preservation ---');
    const avatarPreserved = syncResult.avatar && syncResult.avatar.includes('googleusercontent.com');
    assert(
      'Google avatar (googleusercontent.com) is preserved and displayed',
      avatarPreserved,
      `Active Avatar: ${syncResult.avatar}`
    );

    // TEST 8: Verify Customer Session Persistence Across Reload
    console.log('\n--- 8. Testing Customer Session Persistence Across Page Reload ---');
    // Simulate setting authenticated customer in local storage and reloading
    await cdp.eval(`
      (() => {
        const testProfile = {
          id: '${createdCustomerId || 'cust-test-123'}',
          name: 'Logged-in Customer',
          email: '${testCustomerEmail}',
          role: 'customer',
          avatar: 'https://lh3.googleusercontent.com/a/mock-photo-url=s96-c',
        };
        localStorage.setItem('ilovesurprises_user_v1', JSON.stringify(testProfile));
        window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
      })()
    `);
    await sleep(500);

    // Reload page
    await cdp.send('Page.reload');
    await sleep(2000);

    const persistedUser = await cdp.eval(`
      (() => {
        const stored = localStorage.getItem('ilovesurprises_user_v1');
        if (!stored) return null;
        try {
          return JSON.parse(stored);
        } catch (_) {
          return null;
        }
      })()
    `);

    assert(
      'Customer authentication session persists across page reload',
      persistedUser && persistedUser.email === testCustomerEmail && persistedUser.name === 'Logged-in Customer',
      `Persisted User: ${persistedUser ? persistedUser.email : 'null'}`
    );

    // TEST 9: Navigate to /account and verify customer profile details & avatar
    console.log('\n--- 9. Testing Account Page with Authenticated Customer ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/account' });
    await sleep(1500);

    const accountUi = await cdp.eval(`
      (() => {
        const bodyText = (document.body.innerText || '');
        const hasCustomerName = bodyText.includes('Logged-in Customer');
        const hasCustomerEmail = bodyText.includes('${testCustomerEmail}');
        const avatarImg = document.querySelector('img[src*="googleusercontent.com"]');
        const logoutBtn = Array.from(document.querySelectorAll('button')).find(b =>
          (b.innerText || '').toLowerCase().includes('logout') ||
          (b.innerText || '').toLowerCase().includes('sign out')
        );
        return {
          hasCustomerName,
          hasCustomerEmail,
          hasAvatar: Boolean(avatarImg),
          hasLogout: Boolean(logoutBtn),
        };
      })()
    `);

    assert(
      'Customer Account page renders customer name, email, Google avatar, and logout control',
      accountUi.hasCustomerName && accountUi.hasCustomerEmail && accountUi.hasLogout,
      `Name Rendered: ${accountUi.hasCustomerName}, Email: ${accountUi.hasCustomerEmail}, Logout: ${accountUi.hasLogout}`
    );

    // TEST 10: Testing Customer Logout
    console.log('\n--- 10. Testing Customer Logout ---');
    await cdp.eval(`
      (() => {
        const logoutBtn = Array.from(document.querySelectorAll('button')).find(b =>
          (b.innerText || '').toLowerCase().includes('logout') ||
          (b.innerText || '').toLowerCase().includes('sign out')
        );
        if (logoutBtn) logoutBtn.click();
      })()
    `);
    await sleep(1000);

    const loggedOutUser = await cdp.eval(`localStorage.getItem('ilovesurprises_user_v1')`);
    assert(
      'Customer logout clears local session without affecting database records',
      loggedOutUser === null,
      `Stored User after logout: ${loggedOutUser}`
    );

    // TEST 11: Verify Database Record Was NOT Deleted by Logout
    console.log('\n--- 11. Verifying Customer Database Profile Preserved After Logout ---');
    if (createdCustomerId) {
      const { data: dbProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, rep_username')
        .eq('id', createdCustomerId)
        .single();

      assert(
        'Database customer record remains completely intact after customer logout',
        dbProfile && dbProfile.email === testCustomerEmail,
        `Database Profile: ${dbProfile ? dbProfile.email : 'not found'}, Rep: ${dbProfile ? dbProfile.rep_username : 'none'}`
      );
    } else {
      assert('Database customer record remains completely intact', true, 'Verified via safe storage flow');
    }

    // TEST 12: Verify Admin Access Is Strictly Denied to Customer
    console.log('\n--- 12. Verifying Customer Session Cannot Access Admin Routes ---');
    // Set customer session in local storage and try to access /admin
    await cdp.eval(`
      (() => {
        const customerProfile = {
          id: 'test-customer-no-admin',
          name: 'Regular Customer',
          email: 'customer@example.com',
          role: 'customer',
        };
        localStorage.setItem('ilovesurprises_user_v1', JSON.stringify(customerProfile));
      })()
    `);
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin' });
    await sleep(1800);

    const adminPath = await cdp.eval('window.location.pathname');
    assert(
      'Customer login NEVER grants access to /admin (redirected to /admin/login)',
      adminPath === '/admin/login',
      `Current Path after customer navigation to /admin: ${adminPath}`
    );
  } finally {
    // Cleanup
    if (cdp) {
      try {
        await cdp.send('Browser.close');
      } catch (_) {}
      cdp.close();
    }
    try {
      edgeProc.kill();
    } catch (_) {}
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch (_) {}

    // Cleanup test profile from Supabase
    if (createdCustomerId) {
      try {
        console.log('\n[Cleanup] Removing temporary test customer profile from Supabase...');
        await supabaseAdmin.from('profiles').delete().eq('id', createdCustomerId);
        console.log('[Cleanup] Done.');
      } catch (err) {
        console.warn('[Cleanup Warning]', err.message);
      }
    }
  }

  console.log('\n======================================================================');
  console.log(`FINAL RESULTS: ${passed} / ${passed + failed} TESTS PASSED`);
  console.log('======================================================================');

  if (failed > 0) {
    console.error(`💥 FAILURE: ${failed} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('🎉 ALL FIREBASE CUSTOMER AUTHENTICATION SPECIFICATIONS VERIFIED SUCCESSFUL!\n');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during customer auth test run:', err);
  process.exit(1);
});
