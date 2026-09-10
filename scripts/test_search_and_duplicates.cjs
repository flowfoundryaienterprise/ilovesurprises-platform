const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envLocalPath = path.join(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envLocalPath)) {
  fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/).forEach(l => {
    const idx = l.indexOf('=');
    if (idx > 0) env[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
  });
}
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

function deduplicateProducts(products) {
  if (!products || products.length === 0) return [];
  const seenIds = new Set();
  const seenSlugs = new Set();
  const unique = [];

  for (const product of products) {
    if (!product) continue;
    const id = product.id?.trim();
    const slug = product.slug?.trim();

    if (id && seenIds.has(id)) continue;
    if (slug && seenSlugs.has(slug)) continue;

    if (id) seenIds.add(id);
    if (slug) seenSlugs.add(slug);
    unique.push(product);
  }
  return unique;
}

function rankProducts(products, query) {
  const q = query.toLowerCase().trim();
  if (!q) return deduplicateProducts(products);

  const scored = products.map((product) => {
    const name = (product.name || '').toLowerCase();
    let score = 0;

    if (name === q) {
      score += 10000;
    } else if (name.startsWith(q)) {
      score += 5000;
    } else if (name.includes(' ' + q) || name.includes('-' + q)) {
      score += 3000;
    } else if (name.includes(q)) {
      const idx = name.indexOf(q);
      score += Math.max(1000 - idx * 10, 500);
    }
    if (product.is_best_seller) score += 20;
    score -= Math.min(name.length, 100);
    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return deduplicateProducts(scored.map((s) => s.product));
}

async function runTests() {
  console.log('====================================================');
  console.log('TEST SUITE: PRODUCT SEARCH, NAVIGATION & DUPLICATE PREVENTION');
  console.log('====================================================');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  // TEST 1: Exact product name search
  console.log('\n--- 1. Testing Exact Product Name Search ---');
  const exactTerm = 'Aquarius Zodiac Cash Money Candle';
  const { data: exactRes } = await client
    .from('products')
    .select('id, name, slug')
    .ilike('name', exactTerm)
    .limit(10);

  const rankedExact = rankProducts(exactRes || [], exactTerm);
  assert(rankedExact.length > 0, 'Exact search returns at least 1 result');
  assert(rankedExact[0].name.toLowerCase() === exactTerm.toLowerCase(), `Top result matches searched product exact name: "${rankedExact[0]?.name}"`);
  assert(rankedExact[0].slug === 'aquarius-zodiac-cash-money-candle', `Slug matches exact product: "${rankedExact[0]?.slug}"`);

  // TEST 2: Partial search ranking
  console.log('\n--- 2. Testing Partial Search Ranking ---');
  const partialTerm = 'Sweet Pea';
  const { data: partialRes } = await client
    .from('products')
    .select('id, name, slug, is_best_seller')
    .ilike('name', `%${partialTerm}%`)
    .limit(20);

  const rankedPartial = rankProducts(partialRes || [], partialTerm);
  assert(rankedPartial.length > 0, 'Partial search returns results');
  assert(rankedPartial[0].name.toLowerCase().includes('sweet pea'), `Top result contains partial term: "${rankedPartial[0]?.name}"`);
  assert(rankedPartial[0].name.toLowerCase().startsWith('sweet pea'), `Top result starts with partial term: "${rankedPartial[0]?.name}"`);

  // TEST 3: Non-existent product query
  console.log('\n--- 3. Testing Non-Existent Product Search ---');
  const nonExistent = 'xyz999nonexistentquery';
  const { data: emptyRes } = await client
    .from('products')
    .select('id, name, slug')
    .ilike('name', `%${nonExistent}%`)
    .limit(10);

  const rankedEmpty = rankProducts(emptyRes || [], nonExistent);
  assert(rankedEmpty.length === 0, 'Non-existent search returns genuine 0 results (no false fallbacks)');

  // TEST 4: Deterministic pagination without duplicates
  console.log('\n--- 4. Testing Multi-Page Pagination Determinism & Overlap ---');
  const { data: p1 } = await client
    .from('products')
    .select('id, slug, name')
    .order('is_best_seller', { ascending: false })
    .order('rating', { ascending: false })
    .order('id', { ascending: true })
    .range(0, 24);

  const { data: p2 } = await client
    .from('products')
    .select('id, slug, name')
    .order('is_best_seller', { ascending: false })
    .order('rating', { ascending: false })
    .order('id', { ascending: true })
    .range(25, 49);

  const { data: p3 } = await client
    .from('products')
    .select('id, slug, name')
    .order('is_best_seller', { ascending: false })
    .order('rating', { ascending: false })
    .order('id', { ascending: true })
    .range(50, 74);

  const p1Ids = new Set(p1.map(p => p.id));
  const p2Ids = new Set(p2.map(p => p.id));

  const p1p2Overlap = p2.filter(p => p1Ids.has(p.id));
  const p2p3Overlap = p3.filter(p => p2Ids.has(p.id));
  const p1p3Overlap = p3.filter(p => p1Ids.has(p.id));

  assert(p1.length === 25, 'Page 1 has 25 products');
  assert(p2.length === 25, 'Page 2 has 25 products');
  assert(p3.length === 25, 'Page 3 has 25 products');
  assert(p1p2Overlap.length === 0, `Page 1 and Page 2 have 0 overlap (found ${p1p2Overlap.length})`);
  assert(p2p3Overlap.length === 0, `Page 2 and Page 3 have 0 overlap (found ${p2p3Overlap.length})`);
  assert(p1p3Overlap.length === 0, `Page 1 and Page 3 have 0 overlap (found ${p1p3Overlap.length})`);

  // TEST 5: Slug lookup validation
  console.log('\n--- 5. Testing Exact Slug Lookup & No Fallback ---');
  const targetSlug = 'sweet-pea-diamond-candles';
  const { data: slugProd } = await client
    .from('products')
    .select('id, name, slug')
    .eq('slug', targetSlug)
    .maybeSingle();

  assert(slugProd !== null, 'Product found by exact slug');
  assert(slugProd?.slug === targetSlug, `Slug matches target: "${slugProd?.slug}"`);
  assert(slugProd?.name.includes('Sweet Pea Diamond'), `Product name matches exact item: "${slugProd?.name}"`);

  // TEST 6: Non-existent slug returns null
  console.log('\n--- 6. Testing Non-Existent Slug Lookup ---');
  const invalidSlug = 'this-slug-does-not-exist-12345';
  const { data: nullProd } = await client
    .from('products')
    .select('id, name, slug')
    .eq('slug', invalidSlug)
    .maybeSingle();

  assert(nullProd === null, 'Invalid slug query returns null, never falling back to another product');

  // TEST 7: Deduplication helper
  console.log('\n--- 7. Testing Deduplication Helper Logic ---');
  const testList = [
    { id: '1', slug: 'prod-a', name: 'Product A' },
    { id: '2', slug: 'prod-b', name: 'Product B' },
    { id: '1', slug: 'prod-a', name: 'Product A (Duplicated ID)' },
    { id: '3', slug: 'prod-b', name: 'Product C (Duplicated Slug)' },
    { id: '4', slug: 'prod-d', name: 'Product D' },
  ];
  const deduped = deduplicateProducts(testList);
  assert(deduped.length === 3, `Deduplicator reduced 5 items with duplicate ID and slug to 3 unique items (got ${deduped.length})`);
  assert(deduped.map(d => d.id).join(',') === '1,2,4', `Unique IDs are preserved: "${deduped.map(d => d.id).join(',')}"`);

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('====================================================');

  if (passed === total) {
    console.log('ALL TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('SOME TESTS FAILED!');
    process.exit(1);
  }
}

runTests();
