const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

(async () => {
  const check = async (h) => {
    const { data } = await supabase.from('collections').select('collection_id, handle, title, products_count').eq('handle', h).maybeSingle();
    console.log(h, '->', data ? data.title + ' (ID: ' + data.collection_id + ', count: ' + data.products_count + ')' : 'NOT FOUND');
  };
  await check('cash-candles');
  await check('cash-money-candles');
  await check('zodiac-cash-money-candles');
  await check('candy');
})();
