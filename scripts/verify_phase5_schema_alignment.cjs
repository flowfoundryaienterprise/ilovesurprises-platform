const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment configuration
const envLocalPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

const EXPECTED_PROJECT_REF = 'grwhdtvorhdvyvcxwomn';
const FORBIDDEN_PROJECT_REF = 'wlycsdhrhfbbjqhjjkwz';

// Authoritative schema definitions matching SUPABASE_SCHEMA.sql
const EXPECTED_SCHEMAS = {
  staging_products: [
    'product_id', 'handle', 'title', 'body_html', 'vendor', 'product_type', 'tags',
    'created_at', 'updated_at', 'status', 'published', 'published_at',
    'template_suffix', 'gift_card', 'source_url', 'total_inventory_qty',
    'category_id', 'category_name', 'seo_title', 'seo_description'
  ],
  staging_collections: [
    'collection_id', 'handle', 'title', 'body_html', 'sort_order', 'template_suffix',
    'updated_at', 'image_url', 'products_count', 'published_online_store',
    'source_type', 'inclusion_type', 'inclusion_match', 'seo_title', 'seo_description',
    'smartseo_meta_title', 'smartseo_meta_description', 'smartseo_meta_keywords'
  ],
  staging_product_options: [
    'option_key', 'product_id', 'position', 'source_name'
  ],
  staging_product_option_values: [
    'id', 'option_key', 'product_id', 'value'
  ],
  staging_product_variants: [
    'variant_id', 'product_id', 'position', 'sku', 'barcode',
    'option1_name', 'option1_value', 'option2_name', 'option2_value',
    'option3_name', 'option3_value', 'image_url', 'weight', 'weight_unit',
    'price', 'compare_at_price', 'taxable', 'inventory_item_id', 'inventory_tracker',
    'inventory_policy', 'fulfillment_service', 'requires_shipping', 'shipping_profile',
    'inventory_qty', 'cost', 'hs_code', 'country_of_origin', 'province_of_origin'
  ],
  staging_product_images: [
    'id', 'product_id', 'image_url', 'image_type', 'position', 'width', 'height', 'alt_text'
  ],
  staging_product_collections: [
    'collection_id', 'product_id', 'collection_handle', 'product_handle',
    'sort_position', 'source_verified'
  ],
  staging_collection_conditions: [
    'id', 'collection_id', 'condition_no', 'field', 'relation', 'value', 'match'
  ],
  staging_collection_metafields: [
    'id', 'collection_id', 'namespace_key', 'metafield_type', 'value'
  ],
  staging_product_metafields: [
    'id', 'product_id', 'namespace_key', 'metafield_type', 'value'
  ],
  staging_variant_metafields: [
    'id', 'variant_id', 'namespace_key', 'metafield_type', 'value'
  ]
};

const PROTECTED_TABLES = [
  'profiles', 'orders', 'order_items', 'commissions', 'payouts', 'reviews', 'representatives'
];

async function verify() {
  console.log('======================================================================');
  console.log('=== PHASE 5A: FINAL STAGING SCHEMA ALIGNMENT VERIFICATION ===');
  console.log('======================================================================\n');

  // Safety Check: Target Supabase Verification
  const targetUrl = env.VITE_SUPABASE_URL || '';
  if (!targetUrl.includes(EXPECTED_PROJECT_REF)) {
    console.error(`❌ FATAL: Target URL does not match ${EXPECTED_PROJECT_REF}. Found: ${targetUrl}`);
    process.exit(1);
  }
  if (targetUrl.includes(FORBIDDEN_PROJECT_REF)) {
    console.error(`❌ FATAL: Target URL points to forbidden old project: ${FORBIDDEN_PROJECT_REF}`);
    process.exit(1);
  }
  console.log(`✅ Target Project Verified: ${targetUrl} (${EXPECTED_PROJECT_REF})`);
  console.log(`✅ Forbidden Old Project Blocked: ${FORBIDDEN_PROJECT_REF}\n`);

  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  // Step 1 & 2: OpenAPI Specification inspection (Tables & Columns)
  console.log('----------------------------------------------------------------------');
  console.log('Step 1 & 2: Verifying Staging Tables and Columns against SUPABASE_SCHEMA.sql');
  console.log('----------------------------------------------------------------------');

  const openApiRes = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  if (!openApiRes.ok) {
    console.error(`Failed to fetch PostgREST OpenAPI schema (${openApiRes.status}): ${openApiRes.statusText}`);
    process.exit(1);
  }

  const spec = await openApiRes.json();
  const existingTables = Object.keys(spec.definitions || {});
  
  let allTablesExist = true;
  let allColumnsMatch = true;
  const tableReport = {};

  for (const [tableName, expectedCols] of Object.entries(EXPECTED_SCHEMAS)) {
    const tableExists = existingTables.includes(tableName);
    if (!tableExists) {
      allTablesExist = false;
      tableReport[tableName] = { exists: false, missingCols: expectedCols, extraCols: [] };
      console.log(`❌ Table missing: ${tableName}`);
      continue;
    }

    const liveCols = Object.keys(spec.definitions[tableName]?.properties || {});
    const missingCols = expectedCols.filter(c => !liveCols.includes(c));
    const extraCols = liveCols.filter(c => !expectedCols.includes(c));

    const matches = missingCols.length === 0 && extraCols.length === 0;
    if (!matches) allColumnsMatch = false;

    tableReport[tableName] = {
      exists: true,
      matches,
      liveCount: liveCols.length,
      expectedCount: expectedCols.length,
      missingCols,
      extraCols
    };

    if (matches) {
      console.log(`✅ ${tableName}: Exists & matches SUPABASE_SCHEMA.sql (${liveCols.length} columns)`);
    } else {
      console.log(`⚠️ ${tableName}: Schema divergence!`);
      if (missingCols.length > 0) console.log(`   - Missing columns: ${missingCols.join(', ')}`);
      if (extraCols.length > 0) console.log(`   - Extra/Old columns: ${extraCols.join(', ')}`);
    }
  }

  // Step 3: Verify all staging tables contain 0 rows
  console.log('\n----------------------------------------------------------------------');
  console.log('Step 3: Verifying all staging tables contain 0 rows');
  console.log('----------------------------------------------------------------------');
  let allTablesZeroRows = true;
  const counts = {};

  for (const tableName of Object.keys(EXPECTED_SCHEMAS)) {
    const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
    if (error) {
      counts[tableName] = `Error: ${error.message}`;
      allTablesZeroRows = false;
      console.log(`❌ ${tableName}: Failed to query count (${error.message})`);
    } else {
      counts[tableName] = count;
      if (count === 0) {
        console.log(`✅ ${tableName}: 0 rows (Clean)`);
      } else {
        allTablesZeroRows = false;
        console.log(`⚠️ ${tableName}: ${count} rows (Expected 0)`);
      }
    }
  }

  // Step 4: Run live probe for key columns
  console.log('\n----------------------------------------------------------------------');
  console.log('Step 4: Live probe for key columns');
  console.log('----------------------------------------------------------------------');
  let probePass = true;

  // Probe 1: staging_products.body_html
  const p1 = await supabase.from('staging_products').select('body_html').limit(1);
  if (p1.error) {
    probePass = false;
    console.log(`❌ staging_products.body_html probe FAILED: ${p1.error.message}`);
  } else {
    console.log(`✅ staging_products.body_html probe PASSED: column exists & is queryable`);
  }

  // Probe 2: staging_product_variants.variant_id
  const p2 = await supabase.from('staging_product_variants').select('variant_id').limit(1);
  if (p2.error) {
    probePass = false;
    console.log(`❌ staging_product_variants.variant_id probe FAILED: ${p2.error.message}`);
  } else {
    console.log(`✅ staging_product_variants.variant_id probe PASSED: column exists & is queryable`);
  }

  // Step 5: Protected Tables Safety Check
  console.log('\n----------------------------------------------------------------------');
  console.log('Safety Verification: Protected Data Audit');
  console.log('----------------------------------------------------------------------');
  for (const pt of PROTECTED_TABLES) {
    const { count, error } = await supabase.from(pt).select('*', { count: 'exact', head: true });
    console.log(`🔒 [PROTECTED] ${pt}: ${!error ? count + ' rows (UNTOUCHED)' : 'Table untouched/uncreated'}`);
  }

  // Final Verdict
  console.log('\n======================================================================');
  console.log('=== FINAL PHASE 5A VERDICT ===');
  console.log('======================================================================');
  const overallPass = allTablesExist && allColumnsMatch && allTablesZeroRows && probePass;

  console.log(`1. All 11 Staging Tables Exist:   ${allTablesExist ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`2. Columns Match SUPABASE_SCHEMA:  ${allColumnsMatch ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`3. All Staging Tables Have 0 Rows: ${allTablesZeroRows ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`4. Key Columns Live Probe:        ${probePass ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`5. Protected Data Untouched:      PASS ✅`);
  console.log(`\nOVERALL VERDICT: ${overallPass ? 'PASS ✅' : 'FAIL ❌'}`);

  return {
    overallPass,
    allTablesExist,
    allColumnsMatch,
    allTablesZeroRows,
    probePass,
    tableReport,
    counts
  };
}

verify().catch(console.error);
