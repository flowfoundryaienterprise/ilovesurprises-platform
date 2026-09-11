const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function diagnose() {
  console.log('--- 1. Testing Categories ---');
  const { data: categories } = await sb.from('categories').select('*');
  console.log('Categories:', categories);

  console.log('\n--- 2. Testing Query Performance ---');
  const t0 = Date.now();
  const { data: pExact, count: cExact } = await sb.from('products').select('*', { count: 'exact' }).range(0, 24);
  const t1 = Date.now();
  console.log(`Query with SELECT * and count: exact took ${t1 - t0}ms, returned ${pExact?.length} items, total count: ${cExact}`);

  const t2 = Date.now();
  const { data: pFast, count: cFast } = await sb.from('products')
    .select('id, name, slug, category_id, price, original_price, surprise_type, surprise_value, rating, review_count, image, badge, is_new, is_best_seller, in_stock', { count: 'estimated' })
    .range(0, 24);
  const t3 = Date.now();
  console.log(`Query with specific columns and count: estimated took ${t3 - t2}ms, returned ${pFast?.length} items, estimated count: ${cFast}`);

  console.log('\n--- 3. Testing Zodiac Products ---');
  const { data: zodiacs } = await sb.from('products').select('id, name, slug, category_id, surprise_type').ilike('name', '%zodiac%').limit(15);
  console.log(`Found ${zodiacs?.length} zodiac products:`, zodiacs?.map(z => ({ name: z.name, slug: z.slug, cat: z.category_id })));

  console.log('\n--- 4. Testing Cash Candles ---');
  const { data: cashCandles } = await sb.from('products').select('id, name, slug, category_id, surprise_type').ilike('name', '%cash%').limit(15);
  console.log(`Found ${cashCandles?.length} cash products:`, cashCandles?.map(c => ({ name: c.name, slug: c.slug, cat: c.category_id })));

  console.log('\n--- 5. Testing Bestsellers / Trending ---');
  const { data: bestSellers } = await sb.from('products').select('id, name, slug, category_id, is_best_seller').eq('is_best_seller', true).limit(10);
  console.log(`Found ${bestSellers?.length} bestsellers:`, bestSellers?.map(b => ({ name: b.name, slug: b.slug })));

  console.log('\n--- 6. Testing Navbar Dropdown Slugs / Names ---');
  // Check common navbar items: 'Funny Cash Candles', 'Military Cash Candles', 'Cereal Bowl Candles', etc.
  const testTerms = ['Funny', 'Military', 'Soda Pop', 'Cereal', 'Coffee', 'Wine', 'Anime'];
  for (const term of testTerms) {
    const { data: matches } = await sb.from('products').select('id, name, slug').ilike('name', `%${term}%`).limit(3);
    console.log(`Matches for "${term}": ${matches?.length || 0}`, matches?.map(m => m.name));
  }

  console.log('\n--- 7. Testing Specific Subcategory Queries that return \"No Results\" ---');
  const queriesToTest = [
    'Funny Cash Candles',
    'Military Cash Candles',
    'Soda Pop Cash Candles',
    'Cereal Bowl Candles',
    'Cereal Cash Candles',
    'Jewelry Cereal Candles',
    'Coffee Mug Cash Candles',
    'Foodie Cash Candles',
    'Wine Bottle Cash Candles',
    'Zodiac Cash Candles',
    'Astrology BirthDATE Cash Candles',
    'Anime Cash Candles'
  ];

  for (const q of queriesToTest) {
    // Test current logic:
    const rootWord = q.replace(/s$/i, '');
    const { data: currentResult } = await sb.from('products').select('id, name, slug').or(`name.ilike.%${q}%,name.ilike.%${rootWord}%`).limit(3);
    
    // Test smart token logic (all significant words):
    const tokens = q.split(/\s+/).filter(t => !['candles', 'candle'].includes(t.toLowerCase()));
    let smartQuery = sb.from('products').select('id, name, slug');
    for (const token of tokens) {
      smartQuery = smartQuery.ilike('name', `%${token}%`);
    }
    const { data: smartResult } = await smartQuery.limit(3);

    console.log(`Query "${q}": Current method -> ${currentResult?.length || 0} items | Smart method -> ${smartResult?.length || 0} items`);
    if (smartResult && smartResult.length > 0 && (!currentResult || currentResult.length === 0)) {
      console.log(`   Smart sample: "${smartResult[0].name}"`);
    }
  }
}

diagnose().catch(console.error);

