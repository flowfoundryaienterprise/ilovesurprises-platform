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
  const { data: prods } = await supabase
    .from('product_collections')
    .select('product_id, products(product_id, title, handle, product_images(image_url))')
    .eq('collection_id', '328977285309')
    .limit(20);

  console.log('Cash candles products:');
  for (const p of prods) {
    const images = (p.products?.product_images || []).map(i => i.image_url).filter(u => u && u.startsWith('http') && !u.includes('youtu'));
    console.log(`- [${p.products?.product_id}] ${p.products?.title}: ${images[0]}`);
  }
}
test();
