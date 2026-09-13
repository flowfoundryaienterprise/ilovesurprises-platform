const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: ccCol } = await supabase.from('collections').select('*').eq('handle', 'cash-candles').single();
  console.log('Collection cash-candles:', ccCol.collection_id, ccCol.title);
  const { data: pc } = await supabase.from('product_collections')
    .select('product_id, products(product_id, title, image_url)')
    .eq('collection_id', ccCol.collection_id)
    .limit(10);
  console.log('Top products in cash-candles:');
  pc.forEach(p => console.log(p.products?.product_id, p.products?.title, p.products?.image_url));

  const { data: cmcCol } = await supabase.from('collections').select('*').eq('handle', 'cash-money-candles').single();
  console.log('\nCollection cash-money-candles:', cmcCol.collection_id, cmcCol.title);
  const { data: pc2 } = await supabase.from('product_collections')
    .select('product_id, products(product_id, title, image_url)')
    .eq('collection_id', cmcCol.collection_id)
    .limit(5);
  console.log('Top products in cash-money-candles:');
  pc2.forEach(p => console.log(p.products?.product_id, p.products?.title, p.products?.image_url));
}
test();
