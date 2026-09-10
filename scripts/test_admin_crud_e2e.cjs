const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const sb = createClient(supabaseUrl, serviceKey);

async function runAdminCrudTests() {
  console.log('=== STARTING ADMIN CRUD E2E TEST ===\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} - ${extra}`);
      failed++;
    }
  }

  const testProdId = `prod_test_crud_${Date.now()}`;
  const testProdSlug = `test-candle-crud-${Date.now()}`;

  // 1. Create Product
  console.log('\n--- 1. Testing Product Creation ---');
  const { data: newProd, error: createProdErr } = await sb.from('products').insert({
    id: testProdId,
    name: 'E2E Test Diamond Glow Candle',
    slug: testProdSlug,
    category_id: 'cat-jewelry-candles',
    price: 49.99,
    original_price: 69.99,
    surprise_type: 'jewelry',
    surprise_value: 'Diamond Ring ($100-$7,500)',
    rating: 5.0,
    review_count: 1,
    image: '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
    in_stock: true,
    is_best_seller: false,
    description: 'Automated E2E Admin CRUD Test Product'
  }).select().single();

  assert('Product Inserted into Supabase', !createProdErr && newProd?.id === testProdId, createProdErr?.message);

  // 2. Read Product
  console.log('\n--- 2. Testing Product Retrieval ---');
  const { data: fetchedProd, error: fetchErr } = await sb
    .from('products')
    .select('*')
    .eq('id', testProdId)
    .single();

  assert('Product Fetched with Matching Values', fetchedProd?.name === 'E2E Test Diamond Glow Candle' && Number(fetchedProd?.price) === 49.99, fetchErr?.message);

  // 3. Update Product (Price & In Stock Status)
  console.log('\n--- 3. Testing Product Update ---');
  const { data: updatedProd, error: updateErr } = await sb
    .from('products')
    .update({
      price: 54.99,
      in_stock: false,
      is_best_seller: true,
      name: 'E2E Test Diamond Glow Candle (Updated)'
    })
    .eq('id', testProdId)
    .select()
    .single();

  assert('Product Updated in Supabase', !updateErr && Number(updatedProd?.price) === 54.99 && updatedProd?.in_stock === false && updatedProd?.is_best_seller === true, updateErr?.message);

  // 4. Delete Product
  console.log('\n--- 4. Testing Product Deletion ---');
  const { error: deleteErr } = await sb
    .from('products')
    .delete()
    .eq('id', testProdId);

  assert('Product Deleted from Supabase', !deleteErr, deleteErr?.message);

  const { data: verifyDeleted } = await sb
    .from('products')
    .select('*')
    .eq('id', testProdId)
    .maybeSingle();

  assert('Product No Longer Exists', verifyDeleted === null);

  // 5. Create Collection
  console.log('\n--- 5. Testing Collection Creation ---');
  const testCatId = `cat-test-crud-${Date.now()}`;
  const testCatSlug = `test-collection-crud-${Date.now()}`;

  const { data: newCat, error: createCatErr } = await sb.from('categories').insert({
    id: testCatId,
    name: 'E2E Test Luxury Melts',
    slug: testCatSlug,
    tagline: 'Exclusive test collection for admin verification',
    description: 'Detailed description for test collection',
    item_count: 0,
    image: '/assets/ilovesurprises/categories/Cat-2_Figurines_JWL_wax_melts.jpg',
    featured: false
  }).select().single();

  assert('Collection Inserted into Supabase', !createCatErr && newCat?.id === testCatId, createCatErr?.message);

  // 6. Update Collection (Featured Status & Tagline)
  console.log('\n--- 6. Testing Collection Update ---');
  const { data: updatedCat, error: updateCatErr } = await sb
    .from('categories')
    .update({
      featured: true,
      tagline: 'Updated test collection tagline'
    })
    .eq('id', testCatId)
    .select()
    .single();

  assert('Collection Updated in Supabase', !updateCatErr && updatedCat?.featured === true && updatedCat?.tagline === 'Updated test collection tagline', updateCatErr?.message);

  // 7. Delete Collection
  console.log('\n--- 7. Testing Collection Deletion ---');
  const { error: deleteCatErr } = await sb
    .from('categories')
    .delete()
    .eq('id', testCatId);

  assert('Collection Deleted from Supabase', !deleteCatErr, deleteCatErr?.message);

  const { data: verifyCatDeleted } = await sb
    .from('categories')
    .select('*')
    .eq('id', testCatId)
    .maybeSingle();

  assert('Collection No Longer Exists', verifyCatDeleted === null);

  console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runAdminCrudTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
