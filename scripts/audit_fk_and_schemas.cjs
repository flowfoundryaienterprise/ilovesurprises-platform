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

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function auditDatabase() {
  console.log('==================================================');
  console.log('AUDITING DATABASE SCHEMA AND FOREIGN KEY CONSTRAINTS');
  console.log('Target:', env.VITE_SUPABASE_URL);
  console.log('==================================================\n');

  // 1. Fetch OpenAPI spec
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  if (!res.ok) {
    console.error('Failed to fetch OpenAPI spec:', res.status, res.statusText);
    return;
  }

  const spec = await res.json();
  const tables = Object.keys(spec.definitions || {});
  console.log(`Found ${tables.length} tables in OpenAPI definitions:`);
  console.log(tables);

  // 2. Check each table for foreign key relationships
  console.log('\n--- Auditing Table Foreign Key Relationships in Spec ---');
  for (const tableName of tables) {
    const tableDef = spec.definitions[tableName];
    const props = tableDef.properties || {};
    // Look at description or comments if available
    console.log(`Table: ${tableName}`);
  }

  // 3. Probe protected tables directly via Supabase client
  const candidateTables = [
    'products',
    'product_variants',
    'product_images',
    'product_options',
    'product_option_values',
    'collections',
    'product_collections',
    'collection_conditions',
    'collection_metafields',
    'product_metafields',
    'variant_metafields',
    'profiles',
    'orders',
    'order_items',
    'commissions',
    'payouts',
    'reviews',
    'representatives',
    'affiliates',
    'users',
    'categories'
  ];

  console.log('\n--- Probing Candidate Tables Existence & Structure ---');
  const tableStatus = {};
  for (const t of candidateTables) {
    const { data, error, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      tableStatus[t] = { exists: false, error: error.message, code: error.code };
      console.log(`[${t}]: NOT ACCESSIBLE / DOES NOT EXIST (${error.code}: ${error.message})`);
    } else {
      tableStatus[t] = { exists: true, count: count || 0 };
      console.log(`[${t}]: EXISTS (count: ${count || 0})`);
    }
  }

  // 4. Inspect staging table columns vs SUPABASE_SCHEMA.sql
  console.log('\n--- Inspecting Staging Table Columns in OpenAPI Spec ---');
  const stagingColumns = {};
  for (const t of tables.filter(t => t.startsWith('staging_'))) {
    stagingColumns[t] = Object.keys(spec.definitions[t]?.properties || {});
  }
  console.log(JSON.stringify(stagingColumns, null, 2));

  // 5. Check if order_items or any other table has FKs
  // If order_items exists, let's see what columns it has
  if (tableStatus['order_items']?.exists) {
    const { data: itemSample } = await supabase.from('order_items').select('*').limit(1);
    console.log('order_items sample:', itemSample);
  }
  if (tableStatus['orders']?.exists) {
    const { data: orderSample } = await supabase.from('orders').select('*').limit(1);
    console.log('orders sample:', orderSample);
  }
}

auditDatabase().catch(console.error);
