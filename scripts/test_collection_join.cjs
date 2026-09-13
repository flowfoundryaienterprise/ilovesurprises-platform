const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testSorting() {
  const CARD_COLS = 'product_id, handle, title, body_html, total_inventory_qty, category_name, product_variants(variant_id, price, compare_at_price, sku), product_images(image_url, position)';
  
  // Test ordering by product_id
  const { data: ascProds, error: err1 } = await supabase
    .from('product_collections')
    .select(`product_id, products(${CARD_COLS})`)
    .eq('collection_id', '243231195325')
    .order('product_id', { ascending: true })
    .limit(3);

  console.log('Order by product_id asc:', err1 ? err1.message : ascProds.map(r => r.products?.title));

  // Test ordering by product_id desc
  const { data: descProds, error: err2 } = await supabase
    .from('product_collections')
    .select(`product_id, products(${CARD_COLS})`)
    .eq('collection_id', '243231195325')
    .order('product_id', { ascending: false })
    .limit(3);

  console.log('Order by product_id desc:', err2 ? err2.message : descProds.map(r => r.products?.title));
}

testSorting().catch(console.error);
