const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envLocalPath = path.resolve(__dirname, '..', '.env.local');
let supabaseUrl = '';
let serviceRoleKey = '';

if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (k === 'VITE_SUPABASE_URL') supabaseUrl = v;
      if (k === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = v;
    }
  }
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectVisibility() {
  // Total products
  const { count: totalProds } = await supabase
    .from('products')
    .select('product_id', { count: 'exact', head: true });
  console.log(`Total Products in Supabase: ${totalProds}`);

  // Cash or Jewelry related products
  // 1. Cash in title
  const { count: cashTitleCount } = await supabase
    .from('products')
    .select('product_id', { count: 'exact', head: true })
    .or('title.ilike.%cash%,title.ilike.%money%');
  console.log(`Products with Cash/Money in title: ${cashTitleCount}`);

  // 2. Jewelry/Ring/Necklace/Earring/Bracelet/Diamond in title
  const { count: jewelryTitleCount } = await supabase
    .from('products')
    .select('product_id', { count: 'exact', head: true })
    .or('title.ilike.%jewelry%,title.ilike.%jewellery%,title.ilike.%ring%,title.ilike.%necklace%,title.ilike.%bracelet%,title.ilike.%earring%,title.ilike.%diamond%');
  console.log(`Products with Jewelry/Ring/Necklace/Bracelet/Earring/Diamond in title: ${jewelryTitleCount}`);

  // 3. Combined Cash OR Jewelry in title
  const { count: cashOrJewelryCount } = await supabase
    .from('products')
    .select('product_id', { count: 'exact', head: true })
    .or('title.ilike.%cash%,title.ilike.%money%,title.ilike.%jewelry%,title.ilike.%jewellery%,title.ilike.%ring%,title.ilike.%necklace%,title.ilike.%bracelet%,title.ilike.%earring%,title.ilike.%diamond%');
  console.log(`Products with Cash OR Jewelry keywords in title: ${cashOrJewelryCount}`);

  // 4. Products WITHOUT Cash or Jewelry keywords
  console.log(`Non-Cash/Non-Jewelry Products to Hide: ${totalProds - cashOrJewelryCount}`);

  // 5. Cereal bowl candles
  const { data: cerealProds } = await supabase
    .from('products')
    .select('product_id, title, handle')
    .ilike('title', '%cereal%');
  console.log(`\nTotal Cereal Products: ${cerealProds ? cerealProds.length : 0}`);
  const plainCereal = cerealProds.filter(p => {
    const t = p.title.toLowerCase();
    const hasCash = t.includes('cash') || t.includes('money');
    const hasJewelry = t.includes('jewelry') || t.includes('jewellery') || t.includes('ring') || t.includes('necklace') || t.includes('diamond');
    return !hasCash && !hasJewelry;
  });
  console.log(`Plain Cereal products (no cash, no jewelry): ${plainCereal.length}`);
  for (const p of plainCereal) {
    console.log(`  Plain cereal: "${p.title}" (ID: ${p.product_id}, Handle: ${p.handle})`);
  }
}

inspectVisibility();
