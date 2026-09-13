const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  console.log('=== TEST 1: What does the current productService.getProducts("Cash Candles") query return? ===');
  const CARD_SELECT_COLUMNS = 'product_id, handle, title, body_html, total_inventory_qty, category_name, product_variants(variant_id, price, compare_at_price, sku), product_images(image_url, position)';
  
  // Exactly replicating productService.ts lines 315-344:
  let q = supabase
    .from('products')
    .select(CARD_SELECT_COLUMNS, { count: 'exact' })
    .or('title.ilike.%cash%,title.ilike.%cash%,category_name.ilike.%cash%')
    .order('product_id', { ascending: true })
    .range(0, 24);

  const { data, error, count } = await q;
  console.log('Total matching count:', count, 'Error:', error ? error.message : 'none');
  if (data) {
    console.log(`First ${data.length} products returned:`);
    data.forEach((p, i) => {
      console.log(`  ${i+1}. [ID: ${p.product_id}] ${p.title} (handle: ${p.handle}, category_name: ${p.category_name})`);
    });
  }

  console.log('\n=== TEST 2: Inspect collections table for "Cash Candle" vs "Cash Candy" ===');
  const { data: cols, error: colsErr } = await supabase
    .from('collections')
    .select('collection_id, handle, title, products_count, body_html, image_url')
    .or('title.ilike.%cash%,handle.ilike.%cash%,title.ilike.%candle%,handle.ilike.%candle%')
    .limit(30);
  
  if (colsErr) {
    console.error('Collections query error:', colsErr.message);
  } else {
    console.log(`Found ${cols.length} collections matching cash/candle:`);
    cols.forEach(c => {
      console.log(`  - [${c.collection_id}] "${c.title}" (handle: "${c.handle}", count: ${c.products_count})`);
    });
  }

  console.log('\n=== TEST 3: Check collections with title or handle containing "candy" ===');
  const { data: candyCols } = await supabase
    .from('collections')
    .select('collection_id, handle, title, products_count')
    .or('title.ilike.%candy%,handle.ilike.%candy%');
  console.log('Candy collections:', candyCols);

  console.log('\n=== TEST 4: Check collections with title or handle containing "cash-candle" or "cash candle" ===');
  const { data: cashCandleCols } = await supabase
    .from('collections')
    .select('collection_id, handle, title, products_count, body_html')
    .or('handle.eq.cash-candles,handle.eq.cash-candle,title.ilike.%cash candle%');
  console.log('Cash Candle collections in DB:', cashCandleCols);
}

main().catch(console.error);
