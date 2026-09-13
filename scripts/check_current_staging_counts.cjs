const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envLocalPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const EXPECTED_COUNTS = {
  staging_products: 57479,
  staging_collections: 460,
  staging_product_options: 47788,
  staging_product_option_values: 706291,
  staging_product_variants: 1547749,
  staging_product_images: 64700,
  staging_product_collections: 948607,
  staging_product_metafields: 9664,
  staging_collection_metafields: 100,
  staging_collection_conditions: 43519,
  staging_collection_publications: 6900
};

async function checkCounts() {
  console.log('=== EXACT CURRENT STAGING COUNTS ===');
  let totalStaged = 0;
  for (const [table, expected] of Object.entries(EXPECTED_COUNTS)) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`${table}: ❌ Error (${error.message})`);
    } else {
      totalStaged += count;
      const status = count === expected ? 'COMPLETE ✅' : (count > 0 ? 'PARTIAL ⚠️' : 'NOT STARTED ⏳');
      console.log(`${table}: ${count.toLocaleString()} / ${expected.toLocaleString()} (${status})`);
    }
  }
  console.log(`\nTotal Records Currently Staged: ${totalStaged.toLocaleString()} / 3,433,257`);
}

checkCounts().catch(console.error);
