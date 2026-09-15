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

async function findFlowerProducts() {
  console.log('--- Searching for flower / bouquet products ---');
  const queries = ['%flower%', '%bouquet%', '%scented%flower%'];
  for (const q of queries) {
    const { data, count } = await sb.from('products')
      .select('product_id, handle, title, product_type, category_name', { count: 'exact' })
      .ilike('title', q);
    console.log(`Query "${q}": found ${count} products`);
    if (data && data.length > 0) {
      console.log('Sample rows:', data.slice(0, 10));
    }
  }

  // Also check handle
  const { data: handleData, count: handleCount } = await sb.from('products')
    .select('product_id, handle, title, product_type, category_name', { count: 'exact' })
    .or('handle.ilike.%flower%,handle.ilike.%bouquet%');
  console.log(`Handle flower/bouquet query found ${handleCount} products`);
  if (handleData && handleData.length > 0) {
    console.log('Sample handle rows:', handleData.slice(0, 10));
  }
}

findFlowerProducts().catch(console.error);
