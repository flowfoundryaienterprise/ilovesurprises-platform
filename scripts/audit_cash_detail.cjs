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

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  const report = {};

  // 1. Current query in productService
  const CARD_SELECT_COLUMNS = 'product_id, handle, title, body_html, total_inventory_qty, category_name, product_variants(variant_id, price, compare_at_price, sku), product_images(image_url, position)';
  
  let q = supabase
    .from('products')
    .select(CARD_SELECT_COLUMNS, { count: 'exact' })
    .or('title.ilike.%cash%,title.ilike.%cash%,category_name.ilike.%cash%')
    .order('product_id', { ascending: true })
    .range(0, 24);

  const { data: currentQueryProds, count: currentQueryCount } = await q;
  report.currentQueryCount = currentQueryCount;
  report.currentQueryProds = currentQueryProds?.map(p => ({
    id: p.product_id,
    title: p.title,
    handle: p.handle,
    category_name: p.category_name
  }));

  // 2. Collection ID for cash-candles
  const { data: cashCandleCol } = await supabase
    .from('collections')
    .select('*')
    .eq('handle', 'cash-candles')
    .single();
  report.cashCandleCollection = cashCandleCol;

  // 3. Products mapped in product_collections for collection cash-candles
  if (cashCandleCol) {
    const { count: pcCount } = await supabase
      .from('product_collections')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', cashCandleCol.collection_id);
    report.mappedProductCount = pcCount;

    // Join products from product_collections
    const { data: mappedSamples } = await supabase
      .from('product_collections')
      .select('product_id, product_handle, products(product_id, handle, title, category_name)')
      .eq('collection_id', cashCandleCol.collection_id)
      .limit(20);
    report.mappedSamples = mappedSamples;
  }

  // 4. Check for Cash Candy collection
  const { data: candyCols } = await supabase
    .from('collections')
    .select('*')
    .ilike('title', '%candy%');
  report.candyCols = candyCols;

  // 5. Check products with title like "Cash Candy"
  const { data: candyProds, count: candyProdCount } = await supabase
    .from('products')
    .select('product_id, handle, title, category_name', { count: 'exact' })
    .ilike('title', '%cash candy%')
    .limit(20);
  report.candyProdCount = candyProdCount;
  report.candyProds = candyProds;

  fs.writeFileSync(path.join(__dirname, 'audit_report_cash.json'), JSON.stringify(report, null, 2));
  console.log('Saved audit_report_cash.json successfully');
}

run().catch(console.error);
