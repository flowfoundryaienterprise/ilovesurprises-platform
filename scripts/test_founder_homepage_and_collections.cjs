const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runTests() {
  console.log('====================================================');
  console.log('TEST SUITE: FOUNDER HOMEPAGE & COLLECTION ACCURACY');
  console.log('====================================================');

  const results = {};

  // 1. Audit Jewelry Candles collection
  console.log('\n[TEST 1] Auditing Jewelry Candles (ID: 243230834877)...');
  const { data: jcCol, error: jcErr } = await supabase
    .from('collections')
    .select('*')
    .eq('handle', 'jewelry-candles')
    .single();

  if (jcErr || !jcCol) throw new Error('Failed to fetch jewelry-candles: ' + JSON.stringify(jcErr));
  console.log(`  Found collection: "${jcCol.title}" (ID: ${jcCol.collection_id})`);

  const { data: jcProducts, count: jcCount, error: jcpErr } = await supabase
    .from('product_collections')
    .select('product_id, products(product_id, title, handle)', { count: 'exact' })
    .eq('collection_id', jcCol.collection_id);

  if (jcpErr) throw new Error('Failed to fetch products for jewelry-candles: ' + JSON.stringify(jcpErr));
  console.log(`  Total mapped products in product_collections: ${jcCount}`);

  // Check for contamination (Military, Candy)
  const militaryProds = jcProducts.filter(p => p.products?.title?.toLowerCase().includes('military'));
  const candyProds = jcProducts.filter(p => p.products?.title?.toLowerCase().includes('candy') && !p.products?.title?.toLowerCase().includes('candle'));

  console.log(`  Military products found: ${militaryProds.length}`);
  console.log(`  Candy products found: ${candyProds.length}`);
  results['Jewellery Candle contains ONLY mapped products'] = jcCount === 100 && militaryProds.length === 0 && candyProds.length === 0;

  // 2. Audit Cash Candles collection
  console.log('\n[TEST 2] Auditing Cash Candles (ID: 328977285309)...');
  const { data: ccCol } = await supabase
    .from('collections')
    .select('*')
    .eq('handle', 'cash-candles')
    .single();
  const { count: ccCount } = await supabase
    .from('product_collections')
    .select('product_id', { count: 'exact' })
    .eq('collection_id', ccCol.collection_id);
  console.log(`  Total mapped products in Cash Candles: ${ccCount}`);
  results['Cash Candle collection exists & mapped'] = ccCount === 495;

  // 3. Audit Cash Money Candles collection
  console.log('\n[TEST 3] Auditing Cash Money Candles (ID: 243231195325)...');
  const { data: cmcCol } = await supabase
    .from('collections')
    .select('*')
    .eq('handle', 'cash-money-candles')
    .single();
  const { count: cmcCount } = await supabase
    .from('product_collections')
    .select('product_id', { count: 'exact' })
    .eq('collection_id', cmcCol.collection_id);
  console.log(`  Total mapped products in Cash Money Candles: ${cmcCount}`);
  results['Cash Money Candles collection exists & mapped'] = cmcCount === 76;

  // 4. Audit all 12 Explore collections
  console.log('\n[TEST 4] Auditing all 12 Explore collections in Supabase...');
  const explore12 = [
    'jewelry-candles',
    'cash-candles',
    'cash-money-candles',
    'wax-melts',
    'bath-bombs',
    'soap',
    'slimes',
    'candy',
    'chocolates',
    'greeting-cards',
    'jewelry',
    'zodiac-cash-money-candles'
  ];

  let all12Found = true;
  for (const h of explore12) {
    const { data: col } = await supabase.from('collections').select('collection_id, handle, title, products_count').eq('handle', h).single();
    if (!col) {
      console.log(`  ❌ Missing collection handle: ${h}`);
      all12Found = false;
    } else {
      console.log(`  ✓ [${col.collection_id}] "${col.title}" (${col.handle}) - ${col.products_count} prods`);
    }
  }
  results['All 12 Explore collections authoritative & verified'] = all12Found;

  console.log('\n----------------------------------------------------');
  console.log('DATABASE & CATALOG INTEGRITY SUMMARY:');
  Object.entries(results).forEach(([k, v]) => console.log(`  ${v ? '✅ PASS' : '❌ FAIL'}: ${k}`));
  console.log('----------------------------------------------------');

  if (!Object.values(results).every(Boolean)) {
    throw new Error('Database checks failed!');
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
