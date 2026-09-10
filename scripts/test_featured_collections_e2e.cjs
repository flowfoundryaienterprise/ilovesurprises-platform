const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

async function runTests() {
  console.log('=== STARTING HOMEPAGE FEATURED COLLECTIONS E2E TESTS ===\n');

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

  // Test 1: Verify FeaturedCollectionsSection.tsx source code contains exact 3 collections
  const sectionPath = path.resolve('src/components/home/FeaturedCollectionsSection.tsx');
  const sectionContent = fs.readFileSync(sectionPath, 'utf8');

  assert(
    'Collection 1: Cash Candles present',
    sectionContent.includes("title: 'Cash Candles'")
  );

  assert(
    'Collection 2: Trending Collection present',
    sectionContent.includes("title: 'Trending Collection'")
  );

  assert(
    'Collection 3: Exact title "ZODIAC CASH MONEY CANDLES"',
    sectionContent.includes("title: 'ZODIAC CASH MONEY CANDLES'")
  );

  assert(
    'Collection 3 is mapped to categoryKey "ZODIAC CASH MONEY CANDLES"',
    sectionContent.includes("categoryKey: 'ZODIAC CASH MONEY CANDLES'")
  );

  // Test 2: Check Supabase live products for Zodiac Cash Money Candles
  const { data: dbZodiac, error: dbErr } = await sb.from('products')
    .select('id, name, slug, price, image, rating, review_count, in_stock')
    .ilike('name', '%zodiac%cash%money%candle%');

  assert(
    'Live Supabase has real Zodiac Cash Money Candles',
    !dbErr && dbZodiac && dbZodiac.length >= 12,
    `Found ${dbZodiac?.length || 0} real records in Supabase`
  );

  // Test 3: Check products.ts has real Zodiac Cash Money Candles with valid data
  const productsTsPath = path.resolve('src/data/products.ts');
  const productsTsContent = fs.readFileSync(productsTsPath, 'utf8');

  assert(
    'products.ts contains real Aquarius Zodiac Cash Money Candle',
    productsTsContent.includes('prod_aquarius-zodiac-cash-money-candle') &&
    productsTsContent.includes('Aquarius Zodiac Cash Money Candle')
  );

  assert(
    'products.ts contains real Cancer Zodiac Cash Money Candle',
    productsTsContent.includes('prod_cancer-zodiac-cash-money-candle') &&
    productsTsContent.includes('Cancer Zodiac Cash Money Candle')
  );

  assert(
    'products.ts contains real Gemini Zodiac Cash Money Candle',
    productsTsContent.includes('prod_gemini-zodiac-cash-money-candle') &&
    productsTsContent.includes('Gemini Zodiac Cash Money Candle')
  );

  // Test 4: Check real images are used, no placeholder or dummy
  const sampleZodiac = dbZodiac?.[0];
  assert(
    'Zodiac products have valid non-dummy images',
    sampleZodiac && sampleZodiac.image && !sampleZodiac.image.includes('placeholder') && !sampleZodiac.image.includes('dummy'),
    `Sample image URL: ${sampleZodiac?.image}`
  );

  // Test 5: Verify Home.tsx includes FeaturedCollectionsSection
  const homePath = path.resolve('src/pages/Home.tsx');
  const homeContent = fs.readFileSync(homePath, 'utf8');
  assert(
    'Home.tsx renders FeaturedCollectionsSection',
    homeContent.includes('<FeaturedCollectionsSection')
  );

  // Test 6: Verify Shop.tsx and productService.ts support ZODIAC CASH MONEY CANDLES filter
  const productServicePath = path.resolve('src/services/productService.ts');
  const productServiceContent = fs.readFileSync(productServicePath, 'utf8');
  assert(
    'productService.ts filters zodiac collection queries against Supabase & fallback',
    productServiceContent.includes("catParam.includes('zodiac')")
  );

  const shopPath = path.resolve('src/pages/Shop.tsx');
  const shopContent = fs.readFileSync(shopPath, 'utf8');
  assert(
    'Shop.tsx filters zodiac collection queries properly in catalog view',
    shopContent.includes("catNorm.includes('zodiac')")
  );

  console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
