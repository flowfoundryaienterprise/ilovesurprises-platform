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

async function main() {
  const targetHandles = [
    'cash-candles',
    'cash-money-candles',
    'jewelry-candles',
    'wax-melts',
    'bath-bombs',
    'soap',
    'slimes',
    'candy',
    'chocolates',
    'greeting-cards',
    'ring-candles',
    'zodiac-cash-money-candles',
    'jewelry',
    'bath',
    'wax-tarts',
    'money-bombs',
    'sweets-candies-confectionery',
    'funny-candles',
    'beer-can-candles'
  ];

  console.log('Checking collections in Supabase:');
  for (const h of targetHandles) {
    const { data, error } = await supabase
      .from('collections')
      .select('collection_id, handle, title, products_count, image_url')
      .eq('handle', h);
    if (data && data.length > 0) {
      console.log(`FOUND: [${data[0].collection_id}] handle="${data[0].handle}" | title="${data[0].title}" | count=${data[0].products_count} | img=${data[0].image_url ? 'yes' : 'no'}`);
    } else {
      console.log(`MISSING: handle="${h}"`);
    }
  }
}

main().catch(console.error);
