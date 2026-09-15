/**
 * test_pagination_limit.cjs
 * Validates that pagination limit is strictly 15 for all customer-facing product listings
 * and that homepage trending remains independent at 10 items.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env
const envPath = path.resolve(__dirname, '..', '.env');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = trimmed.split('=')[1].trim();
    }
    if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = trimmed.split('=')[1].trim();
    }
  }
}

async function runTests() {
  console.log('=== TEST 1: Static Code Inspection ===');

  const shopContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/Shop.tsx'), 'utf8');
  const collectionContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/Collection.tsx'), 'utf8');
  const productServiceContent = fs.readFileSync(path.resolve(__dirname, '../src/services/productService.ts'), 'utf8');
  const homeFeaturedContent = fs.readFileSync(path.resolve(__dirname, '../src/components/home/FeaturedProducts.tsx'), 'utf8');

  let passed = true;

  // Verify Shop.tsx limit: 15
  if (shopContent.includes('limit: 15')) {
    console.log('✅ Shop.tsx requests limit: 15');
  } else {
    console.error('❌ Shop.tsx does NOT request limit: 15');
    passed = false;
  }

  // Verify Shop.tsx fallback uses 15
  if (shopContent.includes('to = from + 15') && shopContent.includes('filteredProducts.length / 15')) {
    console.log('✅ Shop.tsx in-memory fallback uses page size of 15');
  } else {
    console.error('❌ Shop.tsx in-memory fallback does NOT use 15');
    passed = false;
  }

  // Verify Collection.tsx limit: 15
  if (collectionContent.includes('limit: 15')) {
    console.log('✅ Collection.tsx requests limit: 15');
  } else {
    console.error('❌ Collection.tsx does NOT request limit: 15');
    passed = false;
  }

  // Verify Collection.tsx skeleton count is 15
  if (collectionContent.includes('Array.from({ length: 15 })')) {
    console.log('✅ Collection.tsx skeleton count is 15 (3 rows of 5)');
  } else {
    console.error('❌ Collection.tsx skeleton count is NOT 15');
    passed = false;
  }

  // Verify productService defaults to 15
  if (productServiceContent.includes('params.limit || 15')) {
    console.log('✅ productService.ts getProducts and getProductsByCollection default to limit: 15');
  } else {
    console.error('❌ productService.ts does NOT default to limit: 15');
    passed = false;
  }

  // Verify Homepage remains independent at 10 items
  if (homeFeaturedContent.includes('getCuratedTrendingProducts(10)') && homeFeaturedContent.includes('Array.from({ length: 10 })')) {
    console.log('✅ Homepage (FeaturedProducts.tsx) is unchanged and maintains 10 items (2 rows of 5)');
  } else {
    console.error('❌ Homepage does NOT maintain 10 items');
    passed = false;
  }

  console.log('\n=== TEST 2: Live Supabase Pagination Limit Query Check ===');
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test a limit of 15 products query (page 1)
    const { data: page1Data, count: totalCount, error } = await supabase
      .from('products')
      .select('product_id, title', { count: 'exact' })
      .range(0, 14);

    if (error) {
      console.error('❌ Supabase query error:', error);
      passed = false;
    } else {
      console.log(`✅ Supabase range(0, 14) returned exactly ${page1Data.length} products (Total available: ${totalCount})`);
      if (page1Data.length !== 15) {
        console.error(`❌ Expected 15 products, received ${page1Data.length}`);
        passed = false;
      }
    }

    // Test page 2 (range 15 to 29)
    const { data: page2Data, error: err2 } = await supabase
      .from('products')
      .select('product_id, title')
      .range(15, 29);

    if (err2) {
      console.error('❌ Supabase page 2 error:', err2);
      passed = false;
    } else {
      console.log(`✅ Supabase range(15, 29) returned exactly ${page2Data.length} products for Page 2`);
      // Verify no duplicates between page 1 and page 2
      const page1Ids = new Set(page1Data.map(p => p.product_id));
      const hasDuplicates = page2Data.some(p => page1Ids.has(p.product_id));
      if (hasDuplicates) {
        console.error('❌ Duplicate products found between page 1 and page 2!');
        passed = false;
      } else {
        console.log('✅ Zero duplicate products between page 1 and page 2');
      }
    }
  }

  console.log('\n=== RESULT ===');
  if (passed) {
    console.log('🎉 ALL PAGINATION LIMIT VERIFICATIONS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ Some verifications failed');
    process.exit(1);
  }
}

runTests();
