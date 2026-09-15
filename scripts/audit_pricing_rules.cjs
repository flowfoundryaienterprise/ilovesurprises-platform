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

async function auditPricing() {
  console.log('=== AUDITING EXACT PRICING RULES IN PRODUCTION SUPABASE ===\n');

  // Rule 1: Cereal Bowl Cash & Jewelry Candles -> $49.99
  const { data: cerealCashCandles } = await supabase
    .from('products')
    .select('product_id, title, product_type, product_variants(variant_id, price)')
    .ilike('title', '%cereal%')
    .or('title.ilike.%candle%,product_type.ilike.%candle%')
    .or('title.ilike.%cash%,title.ilike.%money%,title.ilike.%jewelry%,title.ilike.%ring%,title.ilike.%necklace%');

  let cerealCandleVariants = 0;
  for (const p of cerealCashCandles || []) {
    cerealCandleVariants += p.product_variants ? p.product_variants.length : 0;
  }
  console.log(`1. Cereal Bowl Cash & Jewelry Candles ($49.99):`);
  console.log(`   Products: ${cerealCashCandles ? cerealCashCandles.length : 0}, Variants: ${cerealCandleVariants}`);
  if (cerealCashCandles && cerealCashCandles.length > 0) {
    console.log(`   Sample: "${cerealCashCandles[0].title}" (Current price: $${cerealCashCandles[0].product_variants?.[0]?.price})`);
  }

  // Rule 2: Soda Can Cash & Jewelry Candles -> $29.99
  const { data: sodaCandles } = await supabase
    .from('products')
    .select('product_id, title, product_type, product_variants(variant_id, price)')
    .or('title.ilike.%soda%,handle.ilike.%soda%')
    .or('title.ilike.%candle%,product_type.ilike.%candle%')
    .or('title.ilike.%cash%,title.ilike.%money%,title.ilike.%jewelry%');

  let sodaVariants = 0;
  for (const p of sodaCandles || []) {
    sodaVariants += p.product_variants ? p.product_variants.length : 0;
  }
  console.log(`\n2. Soda Can Cash & Jewelry Candles ($29.99):`);
  console.log(`   Products: ${sodaCandles ? sodaCandles.length : 0}, Variants: ${sodaVariants}`);
  if (sodaCandles && sodaCandles.length > 0) {
    console.log(`   Sample: "${sodaCandles[0].title}" (Current price: $${sodaCandles[0].product_variants?.[0]?.price})`);
  }

  // Rule 6: Giant Jewelry Wax Melts -> $34.99 (collection 322749989053)
  const { data: giantMeltsPc } = await supabase
    .from('product_collections')
    .select('product_id')
    .eq('collection_id', '322749989053');
  const giantPids = (giantMeltsPc || []).map(p => p.product_id);
  const { data: giantMelts } = await supabase
    .from('products')
    .select('product_id, title, product_variants(variant_id, price)')
    .in('product_id', giantPids.length > 0 ? giantPids : ['0']);
  let giantVariants = 0;
  for (const p of giantMelts || []) {
    giantVariants += p.product_variants ? p.product_variants.length : 0;
  }
  console.log(`\n6. Giant Jewelry Wax Melts ($34.99):`);
  console.log(`   Products: ${giantMelts ? giantMelts.length : 0}, Variants: ${giantVariants}`);
  if (giantMelts && giantMelts.length > 0) {
    console.log(`   Sample: "${giantMelts[0].title}" (Current price: $${giantMelts[0].product_variants?.[0]?.price})`);
  }

  // Rule 7: Cash Figurine Wax Melts -> $34.99 (collection 293598757053)
  const { data: figMeltsPc } = await supabase
    .from('product_collections')
    .select('product_id')
    .eq('collection_id', '293598757053');
  const figPids = (figMeltsPc || []).map(p => p.product_id);
  const { data: figMelts } = await supabase
    .from('products')
    .select('product_id, title, product_variants(variant_id, price)')
    .in('product_id', figPids.length > 0 ? figPids : ['0']);
  let figVariants = 0;
  for (const p of figMelts || []) {
    figVariants += p.product_variants ? p.product_variants.length : 0;
  }
  console.log(`\n7. Cash Figurine Wax Melts ($34.99):`);
  console.log(`   Products: ${figMelts ? figMelts.length : 0}, Variants: ${figVariants}`);
  if (figMelts && figMelts.length > 0) {
    console.log(`   Sample: "${figMelts[0].title}" (Current price: $${figMelts[0].product_variants?.[0]?.price})`);
  }

  // Rule 14: Cash Surprise Bear & Cash Wax Melt Bundles -> $59.99 (collection 329533358269)
  const { data: bearPc } = await supabase
    .from('product_collections')
    .select('product_id')
    .eq('collection_id', '329533358269');
  const bearPids = (bearPc || []).map(p => p.product_id);
  const { data: bearProds } = await supabase
    .from('products')
    .select('product_id, title, product_variants(variant_id, price)')
    .in('product_id', bearPids.length > 0 ? bearPids : ['0']);
  let bearVariants = 0;
  for (const p of bearProds || []) {
    bearVariants += p.product_variants ? p.product_variants.length : 0;
  }
  console.log(`\n14. Cash Surprise Bear & Cash Wax Melt Bundles ($59.99):`);
  console.log(`    Products: ${bearProds ? bearProds.length : 0}, Variants: ${bearVariants}`);
  if (bearProds && bearProds.length > 0) {
    console.log(`    Sample: "${bearProds[0].title}" (Current price: $${bearProds[0].product_variants?.[0]?.price})`);
  }

  // Slimes: Cash & Jewelry Slimes -> $19.99
  const { data: slimes } = await supabase
    .from('products')
    .select('product_id, title, product_variants(variant_id, price)')
    .ilike('title', '%slime%')
    .or('title.ilike.%cash%,title.ilike.%jewelry%');
  let slimeVariants = 0;
  for (const p of slimes || []) {
    slimeVariants += p.product_variants ? p.product_variants.length : 0;
  }
  console.log(`\n5. Cash & Jewelry Slimes ($19.99):`);
  console.log(`   Products: ${slimes ? slimes.length : 0}, Variants: ${slimeVariants}`);
  if (slimes && slimes.length > 0) {
    console.log(`   Sample: "${slimes[0].title}" (Current price: $${slimes[0].product_variants?.[0]?.price})`);
  }

  // Greeting Cards: Cash & Jewelry Greeting Cards -> $14.99
  const { data: cards } = await supabase
    .from('products')
    .select('product_id, title, product_variants(variant_id, price)')
    .ilike('title', '%greeting card%')
    .or('title.ilike.%cash%,title.ilike.%jewelry%');
  let cardVariants = 0;
  for (const p of cards || []) {
    cardVariants += p.product_variants ? p.product_variants.length : 0;
  }
  console.log(`\n13. Cash & Jewelry Greeting Cards ($14.99):`);
  console.log(`    Products: ${cards ? cards.length : 0}, Variants: ${cardVariants}`);
  if (cards && cards.length > 0) {
    console.log(`    Sample: "${cards[0].title}" (Current price: $${cards[0].product_variants?.[0]?.price})`);
  }

  // Bath Bomb 2-Pack Tubes ($34.99) vs Singles ($19.99)
  const { data: bbTubes } = await supabase
    .from('products')
    .select('product_id, title, product_variants(variant_id, price)')
    .ilike('title', '%bath bomb%')
    .or('title.ilike.%2-pack%,title.ilike.%2 pack%,title.ilike.%tube%');
  let bbTubeVariants = 0;
  for (const p of bbTubes || []) {
    bbTubeVariants += p.product_variants ? p.product_variants.length : 0;
  }
  console.log(`\n9. Bath Bomb 2-Pack Tubes ($34.99):`);
  console.log(`   Products: ${bbTubes ? bbTubes.length : 0}, Variants: ${bbTubeVariants}`);

  // Bath Soaks (Tubes) -> $19.99
  const { data: bathSoaks } = await supabase
    .from('products')
    .select('product_id, title, product_variants(variant_id, price)')
    .or('title.ilike.%bath soak%,title.ilike.%bath salt%')
    .or('title.ilike.%cash%,title.ilike.%jewelry%');
  let soakVariants = 0;
  for (const p of bathSoaks || []) {
    soakVariants += p.product_variants ? p.product_variants.length : 0;
  }
  console.log(`\n10. Cash & Jewelry Bath Soaks Tubes ($19.99):`);
  console.log(`    Products: ${bathSoaks ? bathSoaks.length : 0}, Variants: ${soakVariants}`);

  // Sugar Scrubs 7.5 oz -> $19.99
  const { data: scrubs } = await supabase
    .from('products')
    .select('product_id, title, product_variants(variant_id, price)')
    .ilike('title', '%sugar scrub%')
    .or('title.ilike.%cash%,title.ilike.%jewelry%');
  let scrubVariants = 0;
  for (const p of scrubs || []) {
    scrubVariants += p.product_variants ? p.product_variants.length : 0;
  }
  console.log(`\n11. Cash & Jewelry Sugar Scrubs ($19.99):`);
  console.log(`    Products: ${scrubs ? scrubs.length : 0}, Variants: ${scrubVariants}`);

  // Cash Candy & Chocolate Candy Tubes -> $27.99
  const { data: candyTubes } = await supabase
    .from('products')
    .select('product_id, title, product_variants(variant_id, price)')
    .or('title.ilike.%candy%,title.ilike.%chocolate%')
    .or('title.ilike.%tube%,title.ilike.%cash%');
  let candyVariants = 0;
  for (const p of candyTubes || []) {
    candyVariants += p.product_variants ? p.product_variants.length : 0;
  }
  console.log(`\n12. Cash Candy & Chocolate Tubes ($27.99):`);
  console.log(`    Products: ${candyTubes ? candyTubes.length : 0}, Variants: ${candyVariants}`);
}

auditPricing();
