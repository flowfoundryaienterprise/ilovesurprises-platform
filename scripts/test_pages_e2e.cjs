const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19877;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_pages_e2e_' + Date.now());

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

async function runPagesE2E() {
  console.log('=== STARTING ALL 7 PAGES BROWSER E2E TESTS (EDGE HEADLESS) ===\n');

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

    // 1. REFUND & RETURN POLICY
    console.log('\n--- 1. TESTING /refund-policy ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/refund-policy' });
    await sleep(2000);

    const refundH1 = await cdp.evaluate('document.querySelector("h1")?.innerText.trim()');
    assert('Refund Policy H1 title', refundH1 === 'Refund & Return Policy', `Found: "${refundH1}"`);

    const refundContent = await cdp.evaluate('document.body.innerText');
    assert('Refund copy: Returns section', refundContent.includes('Eligible items may be returned within 60 days'));
    assert('Refund copy: Return Approval section', refundContent.includes('Please contact I Love Surprises customer support before sending a return'));
    assert('Refund copy: Refund Processing section', refundContent.includes('normally be processed within 7 days'));
    assert('Refund copy: Damaged or Incorrect Items section', refundContent.includes('contact customer support promptly with the order number and supporting photos'));
    assert('Refund copy: Non-Returnable Items section', refundContent.includes('Certain opened, used, personalized, final-sale'));

    // 2. TERMS & CONDITIONS
    console.log('\n--- 2. TESTING /terms ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/terms' });
    await sleep(2000);

    const termsH1 = await cdp.evaluate('document.querySelector("h1")?.innerText.trim()');
    assert('Terms H1 title', termsH1 === 'Terms & Conditions', `Found: "${termsH1}"`);

    const termsContent = await cdp.evaluate('document.body.innerText');
    assert('Terms: Acceptance of Terms', termsContent.includes('By accessing or using ILoveSurprises.com'));
    assert('Terms: Online Store Terms', termsContent.includes('You must use the website only for lawful purposes'));
    assert('Terms: Products & Pricing', termsContent.includes('Product descriptions, availability, images, pricing'));
    assert('Terms: Orders & Payments', termsContent.includes('Orders are subject to acceptance, payment authorization'));
    assert('Terms: Surprise Products & Promotions', termsContent.includes('Surprise contents may vary by product'));
    assert('Terms: Affiliate / Referral Program', termsContent.includes('Participation in the I Love Surprises affiliate or representative program'));
    assert('Terms: Returns & Shipping', termsContent.includes('Purchases are also subject to the Shipping Policy and Refund & Return Policy'));
    assert('Terms: Intellectual Property', termsContent.includes('The website, branding, text, graphics, software, photographs'));
    assert('Terms: Third-Party Services', termsContent.includes('The website may use or link to third-party services'));
    assert('Terms: Disclaimer & Limitation', termsContent.includes('To the extent permitted by law, the website and services are provided without warranties'));
    assert('Terms: Changes to Terms', termsContent.includes('We may update these Terms & Conditions from time to time'));
    assert('Terms: IMPORTANT BEFORE PUBLISHING alert preserved', termsContent.includes('IMPORTANT BEFORE PUBLISHING'));

    // 3. OFFICIAL RULES / NO PURCHASE NECESSARY
    console.log('\n--- 3. TESTING /official-rules ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/official-rules' });
    await sleep(2000);

    const rulesH1 = await cdp.evaluate('document.querySelector("h1")?.innerText.trim()');
    assert('Official Rules H1 title', rulesH1 === 'Official Rules / No Purchase Necessary', `Found: "${rulesH1}"`);

    const rulesContent = await cdp.evaluate('document.body.innerText');
    assert('Rules: No Purchase Necessary', rulesContent.includes('No purchase is necessary to participate in the promotional cash program'));
    assert('Rules: Eligibility', rulesContent.includes('The promotion is intended for legal residents of the United States who are 18 years of age or older'));
    assert('Rules: Promotion Overview', rulesContent.includes('I Love Surprises sells retail products that may include promotional cash surprises'));
    assert('Rules: Alternate Method of Entry', rulesContent.includes('Participants who wish to enter without making a purchase may submit a handwritten request'));
    assert('Rules: Entry Parity', rulesContent.includes('Eligible no-purchase entries are intended to receive an opportunity to participate'));
    assert('Rules: General Conditions', rulesContent.includes('Incomplete, illegible, fraudulent, or ineligible entries may be rejected'));
    assert('Rules: IMPORTANT BEFORE PUBLISHING alert preserved', rulesContent.includes('IMPORTANT BEFORE PUBLISHING'));

    // 4. SHIPPING POLICY
    console.log('\n--- 4. TESTING /shipping ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/shipping' });
    await sleep(2000);

    const shippingH1 = await cdp.evaluate('document.querySelector("h1")?.innerText.trim()');
    assert('Shipping Policy H1 title', shippingH1 === 'Shipping Policy', `Found: "${shippingH1}"`);

    const shippingContent = await cdp.evaluate('document.body.innerText');
    assert('Shipping: Order Delivery', shippingContent.includes('I Love Surprises works to provide safe and timely delivery'));
    assert('Shipping: Delivered Packages', shippingContent.includes('Once carrier tracking confirms that a package has been delivered'));
    assert('Shipping: Shipping Destinations', shippingContent.includes('Shipping availability, rates, carriers, and delivery estimates'));
    assert('Shipping: Incorrect Address', shippingContent.includes('Customers are responsible for providing a complete and accurate shipping address'));
    assert('Shipping: Delays', shippingContent.includes('Carrier delays, weather, holidays, customs, and other events'));

    // 5. PRIVACY POLICY
    console.log('\n--- 5. TESTING /privacy ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/privacy' });
    await sleep(2000);

    const privacyH1 = await cdp.evaluate('document.querySelector("h1")?.innerText.trim()');
    assert('Privacy Policy H1 title', privacyH1 === 'Privacy Policy', `Found: "${privacyH1}"`);

    const privacyContent = await cdp.evaluate('document.body.innerText');
    assert('Privacy: Overview', privacyContent.includes('This Privacy Policy explains how I Love Surprises may collect, use, disclose, and protect'));
    assert('Privacy: Information We Collect', privacyContent.includes('Information may include contact details, account information, shipping and billing details'));
    assert('Privacy: How We Use Information', privacyContent.includes('We may use information to operate the website, process orders and payments'));
    assert('Privacy: Service Providers', privacyContent.includes('Information may be shared with vendors that help provide services such as hosting'));
    assert('Privacy: Cookies & Tracking', privacyContent.includes('ILoveSurprises.com may use cookies and similar technologies'));
    assert('Privacy: Data Rights', privacyContent.includes('Depending on applicable law and location, users may have rights to request access'));
    assert('Privacy: Security & Retention', privacyContent.includes('We use reasonable administrative, technical, and organizational safeguards'));
    assert('Privacy: Contact', privacyContent.includes('Privacy questions or requests should be sent through the official I Love Surprises contact channel'));
    assert('Privacy: IMPORTANT BEFORE PUBLISHING alert preserved', privacyContent.includes('IMPORTANT BEFORE PUBLISHING'));

    // 6. FREQUENTLY ASKED QUESTIONS
    console.log('\n--- 6. TESTING /faqs & ACCORDION ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/faqs' });
    await sleep(2000);

    const faqH1 = await cdp.evaluate('document.querySelector("h1")?.innerText.trim()');
    assert('FAQ H1 title', faqH1 === 'Frequently Asked Questions', `Found: "${faqH1}"`);

    const faqContent = await cdp.evaluate('document.body.innerText');
    assert('FAQ Q1 present', faqContent.includes('What is I Love Surprises?'));
    assert('FAQ Q2 present', faqContent.includes('What kinds of products do you offer?'));
    assert('FAQ Q3 present', faqContent.includes('Are the candles soy based?'));
    assert('FAQ Q4 present', faqContent.includes('Can I choose my jewelry?'));
    assert('FAQ Q5 present', faqContent.includes('Can I cancel an order?'));
    assert('FAQ Q6 present', faqContent.includes('Where do you ship?'));
    assert('FAQ Q7 present', faqContent.includes('How do I return a product?'));
    assert('FAQ Q8 present', faqContent.includes('How long does a refund take?'));
    assert('FAQ Q9 present', faqContent.includes('How do I contact support?'));

    // Test Accordion click
    const clickedAnswerVisible = await cdp.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const soyBtn = buttons.find(b => b.textContent.includes('Are the candles soy based?'));
        if (soyBtn) soyBtn.click();
        return true;
      })()
    `);
    await sleep(500);
    const soyAnswerVisible = await cdp.evaluate(`
      document.body.innerText.includes('Where specified on the product page, our candle products are made with soy wax.')
    `);
    assert('FAQ accordion click expands exact founder answer', soyAnswerVisible === true);

    // Test Keyboard Accessibility (aria-expanded attribute toggles)
    const ariaExpanded = await cdp.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const soyBtn = buttons.find(b => b.textContent.includes('Are the candles soy based?'));
        return soyBtn ? soyBtn.getAttribute('aria-expanded') : null;
      })()
    `);
    assert('FAQ accordion accessibility aria-expanded is "true"', ariaExpanded === 'true');

    // 7. FREE JEWELRY VALUE / APPRAISAL
    console.log('\n--- 7. TESTING /appraise-your-jewelry ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/appraise-your-jewelry' });
    await sleep(2000);

    const appraisalH1 = await cdp.evaluate('document.querySelector("h1")?.innerText.trim()');
    assert('Appraisal H1 title', appraisalH1 === 'Free Jewelry Value / Appraisal', `Found: "${appraisalH1}"`);

    const appraisalContent = await cdp.evaluate('document.body.innerText');
    assert('Appraisal Hero: Discover More About Your Jewelry', appraisalContent.includes('Discover More About Your Jewelry'));
    assert('Appraisal Intro copy', appraisalContent.includes('Found jewelry inside an eligible I Love Surprises product? Use our appraisal service'));
    assert('Appraisal What to Submit', appraisalContent.includes('What to Submit:'));
    assert('Appraisal How It Works', appraisalContent.includes('Complete the appraisal form and upload the requested information'));
    assert('Appraisal Important disclaimer', appraisalContent.includes('An appraisal or estimated value is informational and may not represent a guaranteed resale'));

    // Verify form fields
    const formFields = await cdp.evaluate(`
      (() => {
        const labels = Array.from(document.querySelectorAll('label')).map(l => l.innerText.trim());
        const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(i => i.name || i.id || i.type);
        return { labels, inputs };
      })()
    `);
    assert('Appraisal form has Name field', formFields.labels.some(l => l.includes('Full Name') || l.includes('Customer Name')));
    assert('Appraisal form has Email field', formFields.labels.some(l => l.includes('Email Address')));
    assert('Appraisal form has Order Number field', formFields.labels.some(l => l.includes('Order Number')));
    assert('Appraisal form has Product Name field', formFields.labels.some(l => l.includes('Product Name')));
    assert('Appraisal form has Jewelry Type field', formFields.labels.some(l => l.includes('Jewelry Type')));
    assert('Appraisal form has Code/Appraisal field', formFields.labels.some(l => l.includes('Appraisal Code') || l.includes('Code Information')));
    assert('Appraisal form has Photo Upload element', appraisalContent.includes('Clear Photos') || appraisalContent.includes('Upload Photos') || appraisalContent.includes('Drag and drop photos'));

    // Console Error Check
    console.log('\n--- CONSOLE ERROR AUDIT ---');
    assert('Zero browser console errors across all 7 pages', cdp.consoleErrors.length === 0, `Errors: ${JSON.stringify(cdp.consoleErrors)}`);

    console.log(`\n====================================================`);
    console.log(`PAGE E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`====================================================\n`);

    cdp.close();
    edgeProc.kill();
    process.exit(failed > 0 ? 1 : 0);

  } catch (err) {
    console.error('Test runner failed:', err);
    try { edgeProc.kill(); } catch (e) {}
    process.exit(1);
  }
}

runPagesE2E();
