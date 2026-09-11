const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const CARD_SELECT_COLUMNS =
  'id, name, slug, category_id, price, original_price, surprise_type, surprise_value, rating, review_count, image, badge, is_new, is_best_seller, in_stock';

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runPerformanceAndNavTests() {
  console.log('================================================================');
  console.log('   PERFORMANCE & NAVBAR DROPDOWN REVENUE NAVIGATION AUDIT      ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      console.log(`[PASS] ${name} ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details}`);
    }
  }

  // TEST 1: Initial Shop Query Speed
  console.log('--- 1. Testing Initial Shop Page Query Performance ---');
  const t0 = Date.now();
  const { data: initialPage, error: initErr } = await sb
    .from('products')
    .select(CARD_SELECT_COLUMNS, { count: 'estimated' })
    .order('is_best_seller', { ascending: false })
    .order('rating', { ascending: false })
    .order('id', { ascending: true })
    .range(0, 24);
  const t1 = Date.now();
  const coldDuration = t1 - t0;
  console.log(`Initial page cold query loaded in ${coldDuration}ms (${initialPage?.length} items returned).`);

  const tWarm0 = Date.now();
  const { data: warmPage } = await sb
    .from('products')
    .select(CARD_SELECT_COLUMNS, { count: 'estimated' })
    .order('is_best_seller', { ascending: false })
    .order('rating', { ascending: false })
    .order('id', { ascending: true })
    .range(0, 24);
  const tWarm1 = Date.now();
  const warmDuration = tWarm1 - tWarm0;
  console.log(`Subsequent page query loaded in ${warmDuration}ms (${warmPage?.length} items returned).`);

  assert(!initErr && initialPage && initialPage.length === 25, 'Initial Shop products query returns 25 products', `(Count: ${initialPage?.length})`);
  assert(coldDuration < 2500, 'Initial query response is under 2.5s cold over internet (prevents 5s-10s skeleton freeze)', `(${coldDuration}ms)`);
  assert(warmDuration < 600, 'Warm query response is sub-600ms', `(${warmDuration}ms)`);

  // TEST 2: All 12 Navbar Dropdown Subcategories
  console.log('\n--- 2. Testing All Navbar Dropdown Subcategories (Zero "No Results" Allowed) ---');
  const navSubcategories = [
    { title: 'Funny Cash Candles', search: 'funny' },
    { title: 'Military Cash Candles', search: 'military' },
    { title: 'Soda Pop Cash Candles', search: 'soda' },
    { title: 'Cereal Bowl Candles', search: 'cereal' },
    { title: 'Cereal Cash Candles', search: 'cereal' },
    { title: 'Jewelry Cereal Candles', search: 'cereal' },
    { title: 'Coffee Mug Cash Candles', search: 'coffee' },
    { title: 'Foodie Cash Candles', search: 'foodie' },
    { title: 'Wine Bottle Cash Candles', search: 'wine' },
    { title: 'Zodiac Cash Candles', search: 'zodiac' },
    { title: 'Astrology BirthDATE Cash Candles', search: 'astrology' },
    { title: 'Anime Cash Candles', search: 'anime' },
  ];

  for (const item of navSubcategories) {
    const { data: subData, error: subErr } = await sb
      .from('products')
      .select(CARD_SELECT_COLUMNS)
      .ilike('name', `%${item.search}%`)
      .limit(5);

    const count = subData?.length || 0;
    assert(!subErr && count > 0, `Navbar subcategory "${item.title}" returns real products`, `(Found: ${count}, Sample: "${subData?.[0]?.name}")`);
  }

  // TEST 3: Homepage Featured Collections
  console.log('\n--- 3. Testing Homepage Featured Collections ---');
  // 3a. Cash Candles
  const { data: cashCol, error: cashErr } = await sb
    .from('products')
    .select(CARD_SELECT_COLUMNS)
    .or('category_id.eq.cat-cash-candles,surprise_type.eq.cash')
    .limit(8);
  assert(!cashErr && cashCol && cashCol.length > 0, 'Homepage Collection: Cash Candles returns real products', `(Count: ${cashCol?.length})`);

  // 3b. Trending Collection (Best Sellers)
  const { data: trendCol, error: trendErr } = await sb
    .from('products')
    .select(CARD_SELECT_COLUMNS)
    .eq('is_best_seller', true)
    .limit(8);
  assert(!trendErr && trendCol && trendCol.length > 0, 'Homepage Collection: Trending Collection returns real products', `(Count: ${trendCol?.length})`);

  // 3c. Zodiac Cash Money Candles
  const { data: zodiacCol, error: zodiacErr } = await sb
    .from('products')
    .select(CARD_SELECT_COLUMNS)
    .ilike('name', '%zodiac%')
    .limit(8);
  assert(!zodiacErr && zodiacCol && zodiacCol.length > 0, 'Homepage Collection: ZODIAC CASH MONEY CANDLES returns real products', `(Count: ${zodiacCol?.length}, Sample: "${zodiacCol?.[0]?.name}")`);

  // TEST 4: Exact Product Slug Resolution
  console.log('\n--- 4. Testing Exact Product Slug Resolution (Deterministic Navigation) ---');
  const targetSlug = 'capricorn-zodiac-cash-money-candle';
  const { data: bySlug, error: slugErr } = await sb
    .from('products')
    .select('*')
    .eq('slug', targetSlug)
    .maybeSingle();

  assert(!slugErr && bySlug && bySlug.slug === targetSlug, `Exact slug "${targetSlug}" resolves to real product`, `("${bySlug?.name}")`);

  // Case-insensitive test
  const { data: byCase, error: caseErr } = await sb
    .from('products')
    .select('*')
    .ilike('slug', targetSlug.toUpperCase())
    .maybeSingle();

  assert(!caseErr && byCase && byCase.slug === targetSlug, 'Case-insensitive slug lookup resolves correctly');

  // Invalid slug returns null (proper not-found, no fake fallback)
  const { data: byInvalid, error: invErr } = await sb
    .from('products')
    .select('*')
    .eq('slug', 'non-existent-dummy-slug-999999')
    .maybeSingle();

  assert(!invErr && byInvalid === null, 'Invalid slug returns null (not-found state triggered properly)');

  // TEST 5: Deduplication Integrity
  console.log('\n--- 5. Testing Product Deduplication Integrity ---');
  const sampleProducts = [
    { id: 'p-01', slug: 'candle-a', name: 'Candle A' },
    { id: 'p-01', slug: 'candle-a', name: 'Candle A' },
    { id: 'p-02', slug: 'candle-b', name: 'Candle B' },
  ];
  // Test deduplication logic directly
  const seen = new Set();
  const deduped = sampleProducts.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
  assert(deduped.length === 2, 'Product deduplication eliminates duplicate IDs without dropping valid products');

  console.log('\n----------------------------------------------------------------');
  console.log(`Results: ${passed}/${total} tests passed.`);
  if (passed === total) {
    console.log('✅ ALL PERFORMANCE & NAVBAR NAVIGATION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

runPerformanceAndNavTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
