const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19878;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_test_user_data_chk_' + Date.now());

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

async function runCheckoutTest() {
  console.log('=== STARTING BROWSER CDP CHECKOUT REP 20% DISCOUNT TEST ===\n');

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

    let pageTarget = targets.find(t => t.type === 'page' && !t.url.includes('containerwidget')) || targets[0];
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Console.enable');

    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    // Setup Representative User in localStorage and add a test product to cart
    await cdp.evaluate(`
      (() => {
        // Set Rep User Profile in localStorage
        const repUser = {
          id: 'rep-01',
          name: 'Emily Watson',
          email: 'emily_sparkles@ilovesurprises.com',
          role: 'representative',
          repUsername: 'emily_sparkles',
          avatar: '/assets/ilovesurprises/Profile/profile%20image.webp'
        };
        localStorage.setItem('ilovesurprises_user_v1', JSON.stringify(repUser));

        // Add item to cart
        const testCart = [
          {
            product: {
              id: 'prod-01',
              name: 'Tahitian Vanilla & Gold Cash Candle',
              slug: 'tahitian-vanilla-gold-cash-candle',
              category_id: 'cat-cash-candles',
              price: 100.00,
              surprise_type: 'cash',
              surprise_value: 'Real Cash $2 - $2,500 Inside',
              image: '/assets/ilovesurprises/products/product_Mockup_Cash_VanillaCashCandle_0f249567-9387-4aa7-ae56-a14a9ec85bf1.jpg',
              rating: 4.9,
              review_count: 120,
              in_stock: true,
              is_best_seller: true,
              description: 'Authentic 100% soy candle.'
            },
            quantity: 1,
            selectedSurpriseOption: 'Real Cash $2 - $2,500 Inside'
          }
        ];
        localStorage.setItem('ilovesurprises_cart_v1', JSON.stringify(testCart));
      })()
    `);

    // Navigate to checkout
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/checkout' });
    await sleep(3000);

    const checkoutData = await cdp.evaluate(`
      (() => {
        const bodyText = document.body.innerText.toLowerCase();
        const hasRepDiscount = bodyText.includes('rep personal order discount (20% off)') || bodyText.includes('rep personal discount');
        const hasDiscountAmount = bodyText.includes('-$20.00');
        const hasNotice = bodyText.includes('personal purchases receive a 20% rep discount but do not count toward the $125 monthly qualification');
        return { hasRepDiscount, hasDiscountAmount, hasNotice };
      })()
    `);

    assert('Checkout displays Rep Personal Order Discount (20% Off)', checkoutData?.hasRepDiscount);
    assert('Checkout applies exact 20% discount amount (-$20.00 on $100)', checkoutData?.hasDiscountAmount);
    assert('Checkout displays exact qualification exclusion disclaimer', checkoutData?.hasNotice);

    // Check Console Errors
    const realErrors = cdp.consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('downloadable font') &&
      !err.includes('chrome-extension')
    );
    assert('Zero critical browser console errors during rep checkout', realErrors.length === 0,
      realErrors.length > 0 ? `Errors: ${realErrors.join(', ')}` : 'Clean console'
    );

    console.log(`\n========================================`);
    console.log(`CHECKOUT CDP TEST COMPLETE: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================`);

    cdp.close();
    edgeProc.kill();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal checkout test error:', err);
    try { edgeProc.kill(); } catch (e) {}
    process.exit(1);
  }
}

runCheckoutTest();
