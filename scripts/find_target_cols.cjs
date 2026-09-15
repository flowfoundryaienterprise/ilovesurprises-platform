const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function findTargetCols() {
  console.log('=== HALLOWEEN COLLECTIONS ===');
  const { data: hal } = await sb.from('collections')
    .select('collection_id, handle, title, products_count, image_url, body_html')
    .or('handle.ilike.%halloween%,title.ilike.%halloween%');
  console.log(hal);

  console.log('=== CHRISTMAS COLLECTIONS ===');
  const { data: ch } = await sb.from('collections')
    .select('collection_id, handle, title, products_count, image_url, body_html')
    .or('handle.ilike.%christmas%,title.ilike.%christmas%,handle.ilike.%holiday%,title.ilike.%holiday%');
  console.log(ch);

  console.log('=== CASH CANDLES COLLECTIONS ===');
  const { data: cc } = await sb.from('collections')
    .select('collection_id, handle, title, products_count, image_url, body_html')
    .or('handle.eq.cash-candles,handle.eq.cash-money-candles,title.eq.Cash Candles,title.eq.Cash Money Candles');
  console.log(cc);

  console.log('=== ZODIAC CASH CANDLES COLLECTIONS ===');
  const { data: zc } = await sb.from('collections')
    .select('collection_id, handle, title, products_count, image_url, body_html')
    .or('handle.ilike.%zodiac-cash%,title.ilike.%zodiac%cash%');
  console.log(zc);
}

findTargetCols().catch(console.error);
