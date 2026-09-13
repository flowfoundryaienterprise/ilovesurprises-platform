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

const collections12 = [
  'jewelry-candles',
  'cash-candles',
  'cash-money-candles',
  'wax-melts',
  'bath-bombs',
  'soap',
  'slimes',
  'candy',
  'chocolates',
  'greeting-cards',
  'jewelry',
  'zodiac-cash-money-candles'
];

async function main() {
  for (const h of collections12) {
    const { data: col } = await supabase.from('collections').select('*').eq('handle', h).single();
    if (!col) {
      console.log(`❌ Collection not found: ${h}`);
      continue;
    }
    const { data: pc } = await supabase
      .from('product_collections')
      .select('product_id, products(title, product_images(image_url))')
      .eq('collection_id', col.collection_id)
      .limit(3);

    console.log(`\nCollection [${col.collection_id}] "${col.title}" (handle: ${col.handle}, count: ${col.products_count})`);
    if (pc && pc.length > 0) {
      pc.forEach(p => {
        const img = p.products?.product_images?.[0]?.image_url;
        console.log(`  - ${p.products?.title}: ${img ? img.slice(0, 70) + '...' : 'no-image'}`);
      });
    } else {
      console.log('  (no mapped products)');
    }
  }
}

main().catch(console.error);
