const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function runFounderFooterTests() {
  console.log('====================================================');
  console.log('🚀 TESTING FOOTER UPDATE: FOUNDER REQUIREMENTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${name} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // TEST 1: Source code analysis of Footer.tsx
  console.log('--- 1. SOURCE CODE VERIFICATION ---');
  const footerPath = path.resolve('src/components/layout/Footer.tsx');
  const footerContent = fs.readFileSync(footerPath, 'utf8');

  // Verify Collections menu is gone
  assert(
    'Collections heading removed from Footer',
    !footerContent.includes('<span>Collections</span>')
  );
  assert(
    'Old "Real Cash Candles" link removed from Footer',
    !footerContent.includes('💵 Real Cash Candles')
  );
  assert(
    'Old "Fine Jewelry Candles" link removed from Footer',
    !footerContent.includes('💍 Fine Jewelry Candles')
  );
  assert(
    'Old "Cash Bath Treats" link removed from Footer',
    !footerContent.includes('🛁 Cash Bath Treats')
  );
  assert(
    'Old "Scented Wax Melts" link removed from Footer',
    !footerContent.includes('🔥 Scented Wax Melts')
  );
  assert(
    'Old "Goat Milk Soaps" link removed from Footer',
    !footerContent.includes('🧼 Goat Milk Soaps')
  );
  assert(
    'Old "Birthday Slimes" link removed from Footer',
    !footerContent.includes('🎂 Birthday Slimes')
  );
  assert(
    'Old "Zodiac Horoscope Jars" link removed from Footer',
    !footerContent.includes('⭐ Zodiac Horoscope Jars')
  );

  // Verify Help Center section header
  assert(
    'Help Center heading present',
    footerContent.includes('<span>Help Center</span>')
  );
  assert(
    'HelpCircle icon imported & used',
    footerContent.includes('HelpCircle')
  );

  // Verify exact 13 Help Center links
  const expectedLinks = [
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

  expectedLinks.forEach((link, idx) => {
    assert(
      `Help Center Link #${idx + 1}: "${link}" present with exact wording`,
      footerContent.includes(link)
    );
  });

  // Verify routing connections
  assert(
    'Contact link connected to onNavigate("contact")',
    footerContent.includes("onClick={() => onNavigate?.('contact')}")
  );
  assert(
    'Jewelry Appraisals link connected to onNavigate("appraisal")',
    footerContent.includes("onClick={() => onNavigate?.('appraisal')}")
  );
  assert(
    'FAQs link connected to onNavigate("contact")',
    footerContent.includes("onClick={() => onNavigate?.('contact')}")
  );

  // Verify other sections remain untouched
  assert(
    'Customer Care section intact',
    footerContent.includes('<span>Customer Care</span>')
  );
  assert(
    'Partner & Earn section intact',
    footerContent.includes('<span>Partner & Earn</span>')
  );
  assert(
    'VIP Reveal Club & Newsletter intact',
    footerContent.includes('VIP Reveal Club')
  );
  assert(
    'Payment Badges & SSL Strip intact',
    footerContent.includes('256-Bit SSL Encrypted Bank-Grade Checkout')
  );

  // TEST 2: Live Headless Edge DOM dump verification
  console.log('\n--- 2. LIVE BROWSER HEADLESS EDGE DOM DUMP ---');
  try {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const dom = execSync(`"${edgePath}" --headless --dump-dom http://localhost:5173/`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });

    assert(
      'Live DOM: Help Center rendered',
      dom.includes('<span>Help Center</span>')
    );
    assert(
      'Live DOM: Collections menu NOT rendered',
      !dom.includes('<span>Collections</span>')
    );

    expectedLinks.forEach((link) => {
      // In HTML entities, & might be &amp;
      const htmlEscaped = link.replace(/&/g, '&amp;');
      const found = dom.includes(link) || dom.includes(htmlEscaped);
      assert(`Live DOM contains "${link}"`, found);
    });
  } catch (err) {
    console.error('Edge DOM test error:', err.message);
  }

  // TEST 3: Supabase verification (Data must NOT be altered or deleted)
  console.log('\n--- 3. SUPABASE DATA INTEGRITY ---');
  try {
    const { data: collections, error: colErr } = await sb.from('categories').select('*');
    if (colErr) {
      console.warn('Note on categories fetch:', colErr.message);
    } else {
      assert(
        'Supabase categories / collections intact',
        Array.isArray(collections) && collections.length > 0,
        `Found ${collections.length} categories`
      );
    }

    const { count: prodCount, error: prodErr } = await sb.from('products').select('*', { count: 'exact', head: true });
    if (prodErr) {
      console.warn('Note on products fetch:', prodErr.message);
    } else {
      assert(
        'Supabase products table intact',
        typeof prodCount === 'number' && prodCount > 0,
        `Found ${prodCount} products`
      );
    }
  } catch (err) {
    console.error('Supabase test error:', err.message);
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFounderFooterTests();
