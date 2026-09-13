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

const EXPECTED_URL = 'https://grwhdtvorhdvyvcxwomn.supabase.co';
const EXPECTED_REF = 'grwhdtvorhdvyvcxwomn';

async function audit() {
  console.log('=== 1. PROJECT VERIFICATION ===');
  const url = env.VITE_SUPABASE_URL || '';
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = env.VITE_SUPABASE_ANON_KEY || '';

  console.log('Configured URL:', url);
  const urlMatch = url.replace(/\/$/, '') === EXPECTED_URL;
  console.log('URL Match:', urlMatch ? 'PASS ✅' : 'FAIL ❌');

  let serviceRef = '';
  try {
    const payload = JSON.parse(Buffer.from(serviceKey.split('.')[1], 'base64').toString('utf8'));
    serviceRef = payload.ref;
    console.log('Service Role Key Ref:', serviceRef);
  } catch (e) {
    console.log('Error decoding service key ref:', e.message);
  }
  const refMatch = serviceRef === EXPECTED_REF;
  console.log('Ref Match:', refMatch ? 'PASS ✅' : 'FAIL ❌');

  if (!urlMatch || !refMatch) {
    console.error('FATAL: NOT OPERATING ON THE NEW SUPABASE PROJECT! STOPPING.');
    process.exit(1);
  }

  console.log('\n=== 2. CONNECTIVITY & TABLES AUDIT ===');
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // OpenAPI check
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });
  const spec = await res.json();
  const allTables = Object.keys(spec.definitions || {});
  console.log('Total tables exposed in schema cache:', allTables.length);
  console.log('Exposed tables:', allTables);

  console.log('\n=== 3. STAGING TABLES INVENTORY (TARGET FOR RESET) ===');
  const stagingTables = [
    'staging_products',
    'staging_collections',
    'staging_product_options',
    'staging_product_option_values',
    'staging_product_variants',
    'staging_product_images',
    'staging_product_collections',
    'staging_product_metafields',
    'staging_collection_metafields',
    'staging_collection_conditions',
    'staging_collection_publications'
  ];

  const stagingCounts = {};
  for (const t of stagingTables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    stagingCounts[t] = error ? `Error: ${error.message}` : count;
    console.log(`[Staging] ${t}: ${error ? 'Error: ' + error.message : count.toLocaleString() + ' rows'}`);
  }

  console.log('\n=== 4. PROTECTED BUSINESS & IDENTITY TABLES INVENTORY ===');
  const protectedTables = [
    'profiles',
    'orders',
    'order_items',
    'commissions',
    'reviews',
    'representatives',
    'categories',
    'products'
  ];

  const protectedCounts = {};
  for (const t of protectedTables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error && error.code === 'PGRST205') {
      protectedCounts[t] = 'Table does not exist on new project (clean)';
      console.log(`[Protected] ${t}: Not present in this new project (isolated)`);
    } else if (error) {
      protectedCounts[t] = `Error: ${error.message}`;
      console.log(`[Protected] ${t}: ${error.message}`);
    } else {
      protectedCounts[t] = `${count} rows`;
      console.log(`[Protected] ${t}: ${count} rows (PROTECTED - WILL NOT BE TOUCHED)`);
    }
  }

  return {
    urlMatch,
    refMatch,
    stagingCounts,
    protectedCounts
  };
}

audit().catch(console.error);
