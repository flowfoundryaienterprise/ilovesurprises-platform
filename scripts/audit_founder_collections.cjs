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
  console.log('--- 1. COLLECTIONS MATCHING JEWEL% ---');
  const { data: jewelCols } = await supabase
    .from('collections')
    .select('collection_id, handle, title, products_count')
    .or('title.ilike.%jewelry%,title.ilike.%jewellery%,handle.ilike.%jewel%');
  
  console.log(`Found ${jewelCols ? jewelCols.length : 0} jewelry collections:`);
  if (jewelCols) {
    jewelCols.forEach(c => {
      console.log(`[${c.collection_id}] handle="${c.handle}" | title="${c.title}" | count=${c.products_count}`);
    });
  }

  console.log('\n--- 2. EXACT COLLECTION CHECKS ---');
  const checkHandles = ['jewelry-candles', 'jewelry-candle', 'jewellery-candles', 'jewellery-candle', 'cash-candles', 'cash-money-candles'];
  for (const h of checkHandles) {
    const { data } = await supabase.from('collections').select('*').eq('handle', h);
    console.log(`Handle "${h}":`, data && data.length > 0 ? { id: data[0].collection_id, title: data[0].title, count: data[0].products_count } : 'NOT FOUND');
  }
}

main().catch(console.error);
