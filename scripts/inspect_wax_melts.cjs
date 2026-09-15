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

async function inspectMelts() {
  console.log('--- Inspecting Wax Melts ---');
  // Collections related to figurines or cash wax melts
  const { data: cols } = await sb.from('collections')
    .select('collection_id, handle, title, products_count')
    .or('handle.ilike.%figurine%,handle.ilike.%melt%,title.ilike.%figurine%,title.ilike.%melt%');
  console.log('Melt collections:', cols);

  // Check 5.5 oz wax melts
  const { data: fiveFive, count: fiveFiveCount } = await sb.from('products')
    .select('product_id, title, handle, product_type', { count: 'exact' })
    .or('title.ilike.%5.5 oz%,title.ilike.%5.5oz%');
  console.log(`5.5 oz products: ${fiveFiveCount}`);
  console.log('Sample 5.5 oz:', fiveFive?.slice(0, 5).map(p => p.title));

  // Check standard Cash & Jewelry Wax Melts (product_type or title)
  const { data: cashMelts, count: cashMeltCount } = await sb.from('products')
    .select('product_id, title, handle, product_type', { count: 'exact' })
    .ilike('title', '%cash%wax melt%');
  console.log(`Cash Wax Melts: ${cashMeltCount}`);
  console.log('Sample Cash Wax Melts:', cashMelts?.slice(0, 5).map(p => p.title));

  const { data: jewelMelts, count: jewelMeltCount } = await sb.from('products')
    .select('product_id, title, handle, product_type', { count: 'exact' })
    .ilike('title', '%jewelry%wax melt%');
  console.log(`Jewelry Wax Melts: ${jewelMeltCount}`);
  console.log('Sample Jewelry Wax Melts:', jewelMelts?.slice(0, 5).map(p => p.title));
}

inspectMelts().catch(console.error);
