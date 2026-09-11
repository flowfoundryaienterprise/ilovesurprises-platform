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

async function run() {
  const CARD_SELECT_COLUMNS =
    'id, name, slug, category_id, price, original_price, surprise_type, surprise_value, rating, review_count, image, badge, is_new, is_best_seller, in_stock';

  // 1. Fetch products across distinct categories
  const categories = [
    { id: 'cat-cash-candles', name: 'Cash Candles' },
    { id: 'cat-jewelry-candles', name: 'Jewelry & Diamond Candles' },
    { id: 'cat-bath-body', name: 'Bath & Body' },
    { id: 'cat-soaps', name: 'Soaps' },
    { id: 'cat-slimes', name: 'Slimes' },
    { id: 'cat-wax-melts', name: 'Wax Melts' },
  ];

  // Fetch 20 from each category to pick the best distinct items
  const allCandidates = [];
  for (const cat of categories) {
    const { data } = await sb
      .from('products')
      .select(CARD_SELECT_COLUMNS)
      .eq('category_id', cat.id)
      .limit(30);
    if (data) allCandidates.push(...data);
  }

  // Also include top Zodiac candles
  const { data: zodiacs } = await sb
    .from('products')
    .select(CARD_SELECT_COLUMNS)
    .ilike('name', '%Zodiac%')
    .limit(15);
  if (zodiacs) allCandidates.push(...zodiacs);

  // Also include Diamond Carat candles
  const { data: diamonds } = await sb
    .from('products')
    .select(CARD_SELECT_COLUMNS)
    .ilike('name', '%Diamond Carat%')
    .limit(15);

  // Group candidate pools by category/collection
  const pools = [
    { name: 'Diamond Candles', items: diamonds || [] },
    { name: 'Zodiac Candles', items: zodiacs || [] },
    { name: 'Cash Candles', items: allCandidates.filter(p => p.category_id === 'cat-cash-candles') },
    { name: 'Jewelry Candles', items: allCandidates.filter(p => p.category_id === 'cat-jewelry-candles') },
    { name: 'Bath & Body', items: allCandidates.filter(p => p.category_id === 'cat-bath-body') },
    { name: 'Soaps', items: allCandidates.filter(p => p.category_id === 'cat-soaps') },
    { name: 'Slimes', items: allCandidates.filter(p => p.category_id === 'cat-slimes') },
    { name: 'Wax Melts', items: allCandidates.filter(p => p.category_id === 'cat-wax-melts') },
  ];

  function getRootConcept(name) {
    return name
      .toLowerCase()
      .replace(/(\d+)\s*(year|years|oz|pack|piece|pc|clean|sober)/gi, '')
      .replace(/(candles|candle|wax melts|wax melt|bath bombs|bath bomb|greeting cards|greeting card|goat milk soaps|goat milk soap|slimes|slime|diamond carat candle)/gi, '')
      .replace(/[^a-z0-9]/gi, ' ')
      .trim()
      .slice(0, 14);
  }

  const selected = [];
  const seenConcepts = new Set();
  const seenIds = new Set();

  let maxRounds = 20;
  for (let r = 0; r < maxRounds; r++) {
    for (const pool of pools) {
      if (selected.length >= 60) break;
      // Pick next unused item from this pool
      const nextItem = pool.items.find(p => {
        if (seenIds.has(p.id)) return false;
        const concept = getRootConcept(p.name);
        if (concept.length > 3 && seenConcepts.has(concept)) return false;
        return true;
      });

      if (nextItem) {
        seenIds.add(nextItem.id);
        const concept = getRootConcept(nextItem.name);
        if (concept.length > 3) seenConcepts.add(concept);
        selected.push(nextItem);
      }
    }
    if (selected.length >= 60) break;
  }

  console.log(`\n=== Selected ${selected.length} Diverse Round-Robin Products for Home Screen ===`);
  selected.forEach((p, i) => {
    console.log(`${i + 1}. [${p.category_id}] ${p.name}`);
  });
}

run();
