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
  const { data: prods } = await supabase.from('products')
    .select('product_id, title, product_images(image_url)')
    .ilike('title', '%cash candle%')
    .limit(5);
  console.log('Cash candles:', JSON.stringify(prods, null, 2));

  const { data: cmc } = await supabase.from('products')
    .select('product_id, title, product_images(image_url)')
    .ilike('title', '%cash money candle%')
    .limit(5);
  console.log('Cash money candles:', JSON.stringify(cmc, null, 2));
}
test();
