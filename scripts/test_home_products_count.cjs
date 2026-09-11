const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach((l) => {
  const m = l.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const CARD_SELECT_COLUMNS =
    'id, name, slug, category_id, price, original_price, surprise_type, surprise_value, rating, review_count, image, badge, is_new, is_best_seller, in_stock';

  const chips = [
    { name: 'All Surprises', query: null },
    { name: 'Cash Candles', query: 'Cash' },
    { name: 'Jewelry Candles', query: 'Candle' },
    { name: 'Bath & Body', query: 'Bath' },
    { name: 'Wax Melts', query: 'Melts' },
    { name: 'Soaps', query: 'Soap' },
    { name: 'Slimes', query: 'Slime' },
  ];

  for (const c of chips) {
    let q = sb.from('products').select(CARD_SELECT_COLUMNS, { count: 'estimated' });
    if (c.query) {
      q = q.ilike('name', `%${c.query}%`);
    }
    q = q
      .order('is_best_seller', { ascending: false })
      .order('rating', { ascending: false })
      .order('id', { ascending: true })
      .limit(60);

    const t0 = Date.now();
    const { data, count, error } = await q;
    console.log(`Chip "${c.name}": returned ${data?.length} products in ${Date.now() - t0}ms (total: ${count})`);
  }
}

test();
