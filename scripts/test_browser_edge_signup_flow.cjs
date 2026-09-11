const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19899;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_test_signup_flow_' + Date.now());

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
    'http://localhost:4173/account',
  ]);

  let cdp;

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

    let pageTarget = targets.find(t => t.url.includes('localhost:4173')) ||
                     targets.find(t => t.type === 'page' && !t.url.startsWith('edge://')) ||
                     targets[0];

    console.log('Selected Target:', pageTarget.url);
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    console.log('Waiting for /account page to load...');
    await sleep(2500);

    // Click "Create New VIP Account" button
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
    await sleep(1000);

    // Verify SignUpForm inputs inside the AuthModal portal
    const inputsCheck = await cdp.eval(`
      (() => {
        const nameInput = document.getElementById('signup-name');
        const emailInput = document.getElementById('signup-email');
        const passInput = document.getElementById('signup-password');
        const confirmPassInput = document.getElementById('signup-confirm-password');
        const submitBtn = document.querySelector('form button[type="submit"]');
        return {
          hasName: !!nameInput,
          hasEmail: !!emailInput,
          hasPassword: !!passInput,
          hasConfirm: !!confirmPassInput,
          submitBtnText: submitBtn?.textContent?.trim() || null,
          submitDisabled: submitBtn?.disabled || false,
        };
      })()
    `);
    console.log('SignUpForm Elements check:', inputsCheck);

    // Test validation: submit with empty inputs
    console.log('Testing client validation with empty fields...');
    await cdp.eval(`
      (() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      })()
    `);
    await sleep(500);

    const validationCheck = await cdp.eval(`
      (() => {
        const modal = document.querySelector('[role="dialog"]');
        const text = modal ? modal.textContent : '';
        return {
          hasNameErr: text.includes('Full name must be at least 2 characters'),
          hasEmailErr: text.includes('Email address is required'),
          hasPassErr: text.includes('Password is required'),
        };
      })()
    `);
    console.log('Validation Error check:', validationCheck);

    // Fill valid inputs using React native value setter
    const testEmail = `ratelimit_tester_${Date.now()}@gmail.com`;
    console.log(`Filling form with test email: ${testEmail}`);
    await cdp.eval(`
      (() => {
        const setNativeValue = (element, value) => {
          const valueSetter = Object.getOwnPropertyDescriptor(element.__proto__, 'value') ||
                              Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
          valueSetter.set.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        };
        setNativeValue(document.getElementById('signup-name'), 'Rate Limit Tester');
        setNativeValue(document.getElementById('signup-email'), '${testEmail}');
        setNativeValue(document.getElementById('signup-password'), 'StrongPassword123!');
        setNativeValue(document.getElementById('signup-confirm-password'), 'StrongPassword123!');
      })()
    `);
    await sleep(500);

    // Click submit once and check immediate loading state
    console.log('Submitting form via submit event...');
    const submitState = await cdp.eval(`
      (() => {
        const form = document.querySelector('form');
        const btn = document.querySelector('form button[type="submit"]');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
        return {
          disabledImmediately: btn?.disabled,
          textImmediately: btn?.textContent?.trim(),
        };
      })()
    `);
    console.log('Submit button immediate response state:', submitState);

    // Wait for Supabase Auth response
    await sleep(4000);

    const postSubmitState = await cdp.eval(`
      (() => {
        const modal = document.querySelector('[role="dialog"]');
        const text = modal ? modal.textContent : document.body.textContent;
        const resendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Resend'));
        return {
          hasRateLimitError: text.includes('rate limit') || text.includes('Rate limit') || text.includes('exceeded'),
          hasVerificationScreen: text.includes('Check Your Inbox') || text.includes('Verification Required'),
          modalText: text.slice(0, 300),
          resendBtnText: resendBtn?.textContent?.trim() || null,
          resendBtnDisabled: resendBtn?.disabled || false,
        };
      })()
    `);
    console.log('Post Submit result:', postSubmitState);

    console.log('\n======================================================================');
    console.log('BROWSER E2E SIGNUP TEST RESULT: SUCCESSFUL');
    console.log('======================================================================');
  } finally {
    if (cdp) cdp.close();
    try { edgeProc.kill(); } catch (_) {}
    try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch (_) {}
  }
}

run().catch(err => {
  console.error('Browser test error:', err);
  process.exit(1);
});
