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

const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function probe() {
  console.log('--- Probing staging columns in live Supabase ---');
  
  // Test 1: staging_products.body_html
  const r1 = await sb.from('staging_products').select('body_html').limit(1);
  console.log('staging_products.body_html:', r1.error ? `Error: ${r1.error.message}` : 'EXISTS ✅');

  // Test 2: staging_products.description_html (old column)
  const r2 = await sb.from('staging_products').select('description_html').limit(1);
  console.log('staging_products.description_html:', r2.error ? `Error: ${r2.error.message}` : 'EXISTS ⚠️ (Old schema)');

  // Test 3: staging_product_variants.variant_id
  const r3 = await sb.from('staging_product_variants').select('variant_id').limit(1);
  console.log('staging_product_variants.variant_id:', r3.error ? `Error: ${r3.error.message}` : 'EXISTS ✅');

  // Test 4: staging_product_variants.variant_key (old column)
  const r4 = await sb.from('staging_product_variants').select('variant_key').limit(1);
  console.log('staging_product_variants.variant_key:', r4.error ? `Error: ${r4.error.message}` : 'EXISTS ⚠️ (Old schema)');
}

probe().catch(console.error);
