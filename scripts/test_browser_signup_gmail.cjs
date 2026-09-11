const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19898;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_test_user_data_signup_' + Date.now());
const ARTIFACT_DIR = 'C:\\Users\\janar\\.gemini\\antigravity-ide\\brain\\b3557e1d-fe32-4f13-bc01-6af380debf91';

// Load env
const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const envVars = {};
envContent.split('\n').forEach(l => {
  const m = l.match(/^([^#=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
});
const adminClient = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

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
    'http://localhost:5173/account',
  ]);

  let cdp;
  let testCreatedUserId = null;

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

    console.log('Selected Target:', pageTarget.url);
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    console.log('Waiting for /account page to load...');
    await sleep(3000);

    // Click "Create New VIP Account" button directly on Account page
    console.log('Clicking "Create New VIP Account" button...');
    const clickedCreate = await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && b.textContent.includes('Create New VIP Account'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Clicked Create New VIP Account:', clickedCreate);
    await sleep(1500);

    const testEmail = `sarah_gmail_${Date.now()}@gmail.com`;
    const testPassword = 'Password123!';
    const testName = 'Sarah Jenkins';

    console.log(`Filling in SignUpForm with Gmail: ${testEmail}...`);
    const fillResult = await cdp.eval(`
      (() => {
        const nameInput = document.getElementById('signup-name');
        const emailInput = document.getElementById('signup-email');
        const passInput = document.getElementById('signup-password');
        const confirmPassInput = document.getElementById('signup-confirm-password');

        if (!nameInput || !emailInput || !passInput || !confirmPassInput) {
          return {
            error: 'Inputs not found',
            found: {
              name: !!nameInput,
              email: !!emailInput,
              pass: !!passInput,
              confirmPass: !!confirmPassInput
            }
          };
        }

        const setVal = (input, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };

        setVal(nameInput, ${JSON.stringify(testName)});
        setVal(emailInput, ${JSON.stringify(testEmail)});
        setVal(passInput, ${JSON.stringify(testPassword)});
        setVal(confirmPassInput, ${JSON.stringify(testPassword)});

        return { success: true };
      })()
    `);
    console.log('Form fill result:', fillResult);

    // Take screenshot of filled form before submit
    await cdp.captureScreenshot(path.join(ARTIFACT_DIR, 'signup_gmail_form_filled.png'));

    // Submit form
    console.log('Submitting registration form...');
    const submitResult = await cdp.eval(`
      (() => {
        const form = document.querySelector('form:has(#signup-email)') || document.querySelector('#signup-email')?.closest('form');
        if (!form) return { error: 'Signup form not found' };
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.click();
          return { clicked: true, btnText: submitBtn.textContent?.trim() };
        }
        form.requestSubmit();
        return { submittedViaRequest: true };
      })()
    `);
    console.log('Form submit action result:', submitResult);

    // Wait for registration to complete and modal to close
    console.log('Waiting for signup resolution...');
    await sleep(4000);

    // Check DOM state
    const resultState = await cdp.eval(`
      (() => {
        const bodyText = document.body.innerText;
        const hasRateLimit = bodyText.toLowerCase().includes('rate limit') || bodyText.toLowerCase().includes('rate_limit');
        const errorAlerts = Array.from(document.querySelectorAll('.bg-red-50, [role="alert"], p.text-red-500')).map(e => e.innerText);

        const storedUser = localStorage.getItem('ilovesurprises_user_v1');
        return {
          hasRateLimit,
          errorAlerts,
          storedUser: storedUser ? JSON.parse(storedUser) : null,
          bodySnippet: bodyText.slice(0, 300)
        };
      })()
    `);

    console.log('====================================================');
    console.log('POST-REGISTRATION RESULTS:');
    console.log('  hasRateLimit:', resultState.hasRateLimit);
    console.log('  errorAlerts:', resultState.errorAlerts);
    console.log('  storedUser email:', resultState.storedUser?.email);
    console.log('  storedUser name:', resultState.storedUser?.name);
    console.log('====================================================');

    const screenshotPath = path.join(ARTIFACT_DIR, 'signup_gmail_success_state.png');
    await cdp.captureScreenshot(screenshotPath);

    // Verify in Supabase Auth DB
    const { data: dbUsers } = await adminClient.auth.admin.listUsers();
    const createdUser = dbUsers?.users?.find(u => u.email === testEmail);
    if (createdUser) {
      testCreatedUserId = createdUser.id;
      console.log(`Verified in Supabase Auth! User ID: ${createdUser.id}, Email: ${createdUser.email}`);
    }

    if (!resultState.hasRateLimit && createdUser && resultState.storedUser?.email === testEmail) {
      console.log('🎉 BROWSER E2E TEST PASSED! Gmail account created and logged in with ZERO rate limit error!');
    } else {
      console.error('❌ TEST FAILED');
      process.exitCode = 1;
    }
  } finally {
    if (cdp) cdp.close();
    try { edgeProc.kill(); } catch (_) {}
    try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch (_) {}

    // Cleanup DB
    if (testCreatedUserId) {
      try {
        await adminClient.auth.admin.deleteUser(testCreatedUserId);
        console.log(`Cleaned up test user: ${testCreatedUserId}`);
      } catch (_) {}
    }
  }
}

run().catch(console.error);
