const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const CARD_SELECT_COLUMNS =
  'product_id, handle, title, body_html, total_inventory_qty, category_name';

async function main() {
  console.log('--- Checking Collection "jewelry-candles" (ID: 243230834877) ---');
  const { data: col } = await supabase.from('collections').select('*').eq('handle', 'jewelry-candles').single();
  console.log('Collection:', col);

  const { data: pcRows, count, error } = await supabase
    .from('product_collections')
    .select(`product_id, products(${CARD_SELECT_COLUMNS})`, { count: 'exact' })
    .eq('collection_id', col.collection_id)
    .limit(20);

  console.log('Total mapped products in product_collections:', count);
  console.log('Sample mapped products:');
  pcRows.forEach(r => console.log(`  [${r.products?.product_id}] ${r.products?.title} (${r.products?.handle})`));

  console.log('\n--- Checking other collections with "jewelry" and "candle" ---');
  const { data: allJewelCandleCols } = await supabase
    .from('collections')
    .select('collection_id, handle, title, products_count')
    .ilike('handle', '%candle%')
    .order('products_count', { ascending: false });

  const jewelCandleCols = allJewelCandleCols.filter(c => c.handle.includes('jewel') || c.title.toLowerCase().includes('jewel'));
  console.log(`Found ${jewelCandleCols.length} collections:`);
  jewelCandleCols.forEach(c => console.log(`  [${c.collection_id}] ${c.handle} | ${c.title} (${c.products_count})`));
}

main().catch(console.error);
