const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envLocalPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

const TARGET_PROJECT = 'grwhdtvorhdvyvcxwomn';
if (!env.VITE_SUPABASE_URL.includes(TARGET_PROJECT)) {
  console.error(`FATAL: Target project mismatch! Expected ${TARGET_PROJECT}, got ${env.VITE_SUPABASE_URL}`);
  process.exit(1);
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const STAGING_TABLES_REVERSE = [
  'staging_product_collections',
  'staging_collection_conditions',
  'staging_collection_metafields',
  'staging_product_variants',
  'staging_product_images',
  'staging_product_option_values',
  'staging_product_options',
  'staging_products',
  'staging_collections'
];

const PROTECTED_TABLES = [
  'profiles',
  'orders',
  'order_items',
  'commissions',
  'payouts',
  'reviews',
  'representatives'
];

async function runZeroConfirmation() {
  console.log('===========================================================');
  console.log('RE-CONFIRMATION & ZERO-STAGING PREPARATION AUDIT');
  console.log('Target Supabase URL:', env.VITE_SUPABASE_URL);
  console.log('Target Project Ref:', TARGET_PROJECT);
  console.log('===========================================================\n');

  // 1. Audit Protected Business & Customer Tables
  console.log('--- 1. Auditing Protected Business & Customer Auth Tables ---');
  for (const table of PROTECTED_TABLES) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`[Protected Table: ${table}] Accessible: ${!error} | Current Rows: ${count ?? 0} | Status: UNTOUCHED 🔒`);
  }

  // 2. Clear all staging tables in reverse FK order
  console.log('\n--- 2. Resetting All Staging Tables to 0 Rows ---');
  const deleteFilters = {
    staging_product_collections: 'collection_id=neq.__impossible__',
    staging_collection_conditions: 'id=gt.-1',
    staging_collection_metafields: 'id=gt.-1',
    staging_product_variants: 'variant_id=neq.__impossible__',
    staging_product_images: 'id=gt.-1',
    staging_product_option_values: 'id=gt.-1',
    staging_product_options: 'option_key=neq.__impossible__',
    staging_products: 'product_id=neq.__impossible__',
    staging_collections: 'collection_id=neq.__impossible__'
  };

  for (const table of STAGING_TABLES_REVERSE) {
    const filter = deleteFilters[table] || '';
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: 'DELETE',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    console.log(`Cleared ${table} -> HTTP ${res.status}`);
  }

  // 3. Confirm all staging tables contain exactly 0 rows
  console.log('\n--- 3. Verifying All Staging Tables Contain Exactly 0 Rows ---');
  let allZero = true;
  for (const table of STAGING_TABLES_REVERSE) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    const isZero = count === 0;
    console.log(`[${table}] Row Count: ${count ?? 0} | ${isZero ? 'EMPTY (0 ROWS) ✅' : 'NOT EMPTY ❌'}`);
    if (!isZero) allZero = false;
  }

  if (!allZero) {
    console.error('ERROR: Not all staging tables are empty!');
    process.exit(1);
  }

  // 4. Reset checkpoint
  const checkpointPath = path.resolve(__dirname, 'phase5_import_checkpoint.json');
  fs.writeFileSync(checkpointPath, JSON.stringify({ completedTables: {}, tableProgress: {} }, null, 2), 'utf8');
  console.log(`\n✅ Reset checkpoint: ${checkpointPath}`);
  console.log('🎉 RE-CONFIRMATION PASS: All staging tables verified empty. Target is grwhdtvorhdvyvcxwomn. Protected data untouched.');
}

runZeroConfirmation().catch(console.error);
