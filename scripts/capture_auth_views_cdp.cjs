const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19896;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_test_user_data_auth_' + Date.now());
const ARTIFACT_DIR = 'C:\\Users\\janar\\.gemini\\antigravity-ide\\brain\\b3557e1d-fe32-4f13-bc01-6af380debf91';

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
      console.log(`📸 Screenshot saved: ${filepath}`);
    }
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function runVisualAudit() {
  console.log('🚀 Starting Microsoft Edge CDP for Visual Auth Verification...');
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
    '--disable-features=msFirstRunExperience,msEdgeSync,msSignInPrompt',
    '--window-size=1280,900',
    'http://localhost:5173/account'
  ]);

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
                     targets.find(t => t.type === 'page' && !t.url.startsWith('edge://') && !t.url.startsWith('chrome://')) ||
                     targets[0];

    console.log('Selected Target:', pageTarget.url);
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.waitOpen();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    console.log('⏳ Waiting for /account page to render...');
    await sleep(3000);

    // Click "Sign In to Continue" button
    console.log('🔍 Clicking "Sign In to Continue" button...');
    const clickedLogin = await client.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && (b.textContent.includes('Sign In to Continue') || b.textContent.includes('Login')));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Clicked login button:', clickedLogin);
    await sleep(1000);

    // Audit Login Modal
    const loginAudit = await client.eval(`
      (() => {
        const bodyText = document.body.innerText || '';
        return {
          hasWelcome: bodyText.includes('Welcome Back'),
          hasGoogle: bodyText.includes('Continue with Google') || bodyText.includes('Google'),
          hasEmailInput: !!document.getElementById('login-email'),
          hasPasswordInput: !!document.getElementById('login-password'),
          hasForgotLink: bodyText.includes('Forgot Password?'),
          hasDivider: bodyText.includes('or sign in with email'),
        };
      })()
    `);
    console.log('Login Modal Audit:', loginAudit);

    const loginScreenshotPath = path.join(ARTIFACT_DIR, 'auth_login_modal.png');
    await client.captureScreenshot(loginScreenshotPath);

    // Switch to SignUp view
    console.log('🔄 Switching to Sign Up view...');
    await client.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const createBtn = buttons.find(b => b.textContent && b.textContent.includes('Create Account'));
        if (createBtn) {
          createBtn.click();
          return true;
        }
        return false;
      })()
    `);
    await sleep(1000);

    // Audit SignUp Modal
    const signupAudit = await client.eval(`
      (() => {
        const bodyText = document.body.innerText || '';
        return {
          hasCreateTitle: bodyText.includes('Create your account'),
          hasGoogle: bodyText.includes('Continue with Google') || bodyText.includes('Google'),
          hasNameInput: !!document.getElementById('signup-name'),
          hasEmailInput: !!document.getElementById('signup-email'),
          hasPasswordInput: !!document.getElementById('signup-password'),
          hasConfirmPasswordInput: !!document.getElementById('signup-confirm-password'),
          hasMobileInput: !!document.getElementById('signup-mobile'),
          hasDivider: bodyText.includes('or register with email'),
        };
      })()
    `);
    console.log('SignUp Modal Audit:', signupAudit);

    const signupScreenshotPath = path.join(ARTIFACT_DIR, 'auth_signup_modal.png');
    await client.captureScreenshot(signupScreenshotPath);

    client.close();
    console.log('✅ Visual Auth Audit Completed.');
  } finally {
    edge.kill();
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch {}
  }
}

runVisualAudit().catch(err => {
  console.error('Visual audit failed:', err);
  process.exit(1);
});
