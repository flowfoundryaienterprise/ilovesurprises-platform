const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
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

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CARD_SELECT_COLUMNS = 'product_id, handle, title, body_html, total_inventory_qty, category_name, product_variants(variant_id, price, compare_at_price, sku), product_images(image_url, position)';

function mapRowToProduct(row) {
  const variants = row.product_variants || [];
  const images = (row.product_images || []).sort((a, b) => (a.position || 0) - (b.position || 0));

  const firstVariant = variants[0] || null;
  const primaryPrice = firstVariant?.price ? Number(firstVariant.price) : 0;
  const comparePrice = firstVariant?.compare_at_price ? Number(firstVariant.compare_at_price) : undefined;
  const primaryImage = images[0]?.image_url || '/placeholder.jpg';

  return {
    id: String(row.product_id),
    name: row.title || 'Untitled Product',
    slug: row.handle || String(row.product_id),
    description: row.body_html || '',
    price: primaryPrice,
    originalPrice: comparePrice,
    image: primaryImage,
    images: images.map(img => img.image_url),
    inStock: (row.total_inventory_qty ?? 0) > 0,
    category: row.category_name || 'General',
    rating: 4.8,
    reviewCount: 15,
  };
}

async function runSmokeTests() {
  console.log('================================================================');
  console.log('🚀 FOCUSED PRODUCTION CATALOG SMOKE TEST');
  console.log(`Target URL: ${supabaseUrl}`);
  console.log('================================================================\n');

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

  // 1. Verify DB product count = 57,479
  console.log('Step 1: Checking total production product count...');
  const { count: totalCount, error: countErr } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  assert('Supabase query returned HTTP 200 without error', !countErr, countErr ? countErr.message : '');
  assert('DB products count is exactly 57,479', totalCount === 57479, `count = ${totalCount}`);

  // 2. Frontend service can retrieve a page of real products with authorative columns
  console.log('\nStep 2: Testing frontend card relation query (CARD_SELECT_COLUMNS)...');
  const t0 = Date.now();
  const { data: page1Rows, error: page1Err, count: page1Total } = await supabase
    .from('products')
    .select(CARD_SELECT_COLUMNS, { count: 'exact' })
    .range(0, 24);

  const duration = Date.now() - t0;
  assert('Page 1 query completed successfully without schema errors', !page1Err, page1Err ? page1Err.message : `${duration}ms`);
  assert('Page 1 returns exactly 25 products', page1Rows && page1Rows.length === 25, `returned = ${page1Rows?.length}`);
  assert('Page 1 reports total count of 57,479', page1Total === 57479, `total = ${page1Total}`);

  // 3. First product has real title/handle/image/price
  console.log('\nStep 3: Validating first product mapping and authentic data...');
  const firstRow = page1Rows ? page1Rows[0] : null;
  assert('First row exists', !!firstRow);

  if (firstRow) {
    const firstProduct = mapRowToProduct(firstRow);
    assert('First product ID is valid string', typeof firstProduct.id === 'string' && firstProduct.id.length > 0, `id = ${firstProduct.id}`);
    assert('First product title/name is authentic non-empty string', typeof firstProduct.name === 'string' && firstProduct.name.length > 3, `name = "${firstProduct.name}"`);
    assert('First product handle/slug is authentic', typeof firstProduct.slug === 'string' && firstProduct.slug.length > 3, `slug = "${firstProduct.slug}"`);
    assert('First product has valid price > $0.00', typeof firstProduct.price === 'number' && firstProduct.price > 0, `price = $${firstProduct.price}`);
    assert('First product has authentic image URL', typeof firstProduct.image === 'string' && firstProduct.image.startsWith('http'), `image = "${firstProduct.image.slice(0, 60)}..."`);
    console.log(`   Sample product: "${firstProduct.name}" | Price: $${firstProduct.price} | Slug: ${firstProduct.slug}`);
  }

  // 4. A product beyond the first 120 is retrievable (proving website is NOT limited to 120 items)
  console.log('\nStep 4: Testing deep pagination beyond 120 products (offset 200..209)...');
  const { data: beyond120Rows, error: beyondErr } = await supabase
    .from('products')
    .select(CARD_SELECT_COLUMNS)
    .range(200, 209);

  assert('Query beyond offset 120 succeeded', !beyondErr, beyondErr ? beyondErr.message : '');
  assert('Returned 10 items from offset 200', beyond120Rows && beyond120Rows.length === 10, `count = ${beyond120Rows?.length}`);
  
  let targetHandle = '';
  let targetId = '';
  if (beyond120Rows && beyond120Rows.length > 0) {
    const sampleDeep = mapRowToProduct(beyond120Rows[0]);
    targetHandle = sampleDeep.slug;
    targetId = sampleDeep.id;
    assert('Deep product has authentic name', sampleDeep.name.length > 3, `"${sampleDeep.name}"`);
    assert('Deep product has authentic price > 0', sampleDeep.price > 0, `$${sampleDeep.price}`);
    console.log(`   Product #201: "${sampleDeep.name}" | Slug: ${sampleDeep.slug} | Price: $${sampleDeep.price}`);
  }

  // 5. Product detail lookup by handle succeeds
  console.log('\nStep 5: Testing single-product lookup by handle...');
  const { data: handleRows, error: handleErr } = await supabase
    .from('products')
    .select(CARD_SELECT_COLUMNS)
    .eq('handle', targetHandle)
    .limit(1);

  assert('Product detail lookup by handle succeeded', !handleErr && handleRows && handleRows.length === 1, handleErr ? handleErr.message : `found 1 for "${targetHandle}"`);
  if (handleRows && handleRows.length > 0) {
    const detailProduct = mapRowToProduct(handleRows[0]);
    assert('Handle lookup returned correct product ID', detailProduct.id === targetId, `id = ${detailProduct.id}`);
  }

  // 6. Product lookup by product_id succeeds
  console.log('\nStep 6: Testing single-product lookup by product_id...');
  const { data: idRows, error: idErr } = await supabase
    .from('products')
    .select(CARD_SELECT_COLUMNS)
    .eq('product_id', targetId)
    .limit(1);

  assert('Product detail lookup by product_id succeeded', !idErr && idRows && idRows.length === 1, idErr ? idErr.message : `found 1 for "${targetId}"`);

  // 7. Search query by title
  console.log('\nStep 7: Testing catalog search by title...');
  const { data: searchRows, error: searchErr } = await supabase
    .from('products')
    .select(CARD_SELECT_COLUMNS)
    .ilike('title', '%Diamond Carat%')
    .limit(5);

  assert('Search by title completed without error', !searchErr, searchErr ? searchErr.message : '');
  assert('Search returned matching products from catalog', searchRows && searchRows.length > 0, `matches = ${searchRows?.length}`);
  if (searchRows && searchRows.length > 0) {
    console.log(`   Search match #1: "${searchRows[0].title}"`);
  }

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL CATALOG SMOKE TESTS PASSED! Production catalog is fully functional.');
    process.exit(0);
  }
}

runSmokeTests().catch(err => {
  console.error('Fatal error during smoke test:', err);
  process.exit(1);
});
