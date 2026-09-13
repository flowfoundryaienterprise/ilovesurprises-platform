const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envLocalPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function testCascade() {
  console.log('Fetching 500 product IDs from staging_products...');
  const { data: prods, error: err1 } = await supabase
    .from('staging_products')
    .select('product_id')
    .limit(500);

  if (err1 || !prods) {
    console.error('Fetch error:', err1);
    return;
  }

  const ids = prods.map((p) => p.product_id);
  console.log(`Deleting ${ids.length} products (with cascade to variants)...`);
  const t0 = Date.now();
  const { error: delErr } = await supabase
    .from('staging_products')
    .delete()
    .in('product_id', ids);

  if (delErr) {
    console.error('Delete error:', delErr);
  } else {
    console.log(`Success! Deleted ${ids.length} products in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
  }
}

testCascade().catch(console.error);
