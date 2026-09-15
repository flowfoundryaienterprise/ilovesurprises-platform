const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function probeTables() {
  const candidates = [
    'products', 'collections', 'product_collections', 'product_variants', 'product_images',
    'product_options', 'product_option_values', 'collection_conditions', 'collection_metafields',
    'categories', 'orders', 'order_items', 'profiles', 'commissions', 'payouts', 'reviews',
    'representatives', 'appraisals', 'affiliates', 'mlm_trees'
  ];

  for (const t of candidates) {
    const { data, error } = await sb.from(t).select('*').limit(1);
    if (error) {
      console.log(`[${t}]: ❌ ${error.code} - ${error.message}`);
    } else {
      console.log(`[${t}]: ✅ EXISTS (rows: ${data.length})`);
    }
  }
}

probeTables().catch(console.error);
