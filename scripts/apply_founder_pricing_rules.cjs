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

async function updateVariantsForProducts(productIds, targetPrice, ruleName) {
  if (!productIds || productIds.length === 0) {
    console.log(`[${ruleName}] 0 products identified.`);
    return { beforeCount: 0, afterCount: 0 };
  }

  // Count before
  let beforeCount = 0;
  let allVariantIds = [];

  // Batch product IDs to avoid PostgREST URI limits
  const CHUNK_SIZE = 100;
  for (let i = 0; i < productIds.length; i += CHUNK_SIZE) {
    const chunk = productIds.slice(i, i + CHUNK_SIZE);
    const { data: variants } = await supabase
      .from('product_variants')
      .select('variant_id, price')
      .in('product_id', chunk);

    if (variants) {
      beforeCount += variants.length;
      for (const v of variants) {
        allVariantIds.push(v.variant_id);
      }
    }
  }

  console.log(`[${ruleName}] Found ${productIds.length} products with ${allVariantIds.length} variants before update.`);

  // Update variants in chunks
  const UPDATE_CHUNK = 200;
  for (let i = 0; i < allVariantIds.length; i += UPDATE_CHUNK) {
    const chunk = allVariantIds.slice(i, i + UPDATE_CHUNK);
    const { error: updateErr } = await supabase
      .from('product_variants')
      .update({ price: targetPrice })
      .in('variant_id', chunk);

    if (updateErr) {
      console.error(`Error updating chunk ${i}-${i + UPDATE_CHUNK} for ${ruleName}:`, updateErr.message);
    }
  }

  // Count after
  let verifiedCount = 0;
  for (let i = 0; i < allVariantIds.length; i += UPDATE_CHUNK) {
    const chunk = allVariantIds.slice(i, i + UPDATE_CHUNK);
    const { data: verified } = await supabase
      .from('product_variants')
      .select('variant_id')
      .in('variant_id', chunk)
      .eq('price', targetPrice);

    if (verified) {
      verifiedCount += verified.length;
    }
  }

  console.log(`[${ruleName}] Successfully verified ${verifiedCount} / ${allVariantIds.length} variants updated to $${targetPrice}.\n`);
  return { beforeCount, afterCount: verifiedCount };
}

async function run() {
  console.log('======================================================================');
  console.log('=== APPLYING FOUNDER TARGETED PRICING RULES TO PRODUCTION DATABASE ===');
  console.log('======================================================================\n');

  const summary = {};

  // RULE 1: Cereal Bowl Cash & Jewelry Candles -> $49.99
  const { data: cerealProds } = await supabase
    .from('products')
    .select('product_id, title')
    .ilike('title', '%cereal%')
    .or('title.ilike.%candle%,product_type.ilike.%candle%')
    .or('title.ilike.%cash%,title.ilike.%money%,title.ilike.%jewelry%,title.ilike.%ring%,title.ilike.%necklace%');
  const cerealPids = (cerealProds || []).map(p => p.product_id);
  summary['cereal_candles'] = await updateVariantsForProducts(cerealPids, 49.99, '1. Cereal Bowl Cash & Jewelry Candles ($49.99)');

  // RULE 2: Soda Can Cash & Jewelry Candles -> $29.99
  const { data: sodaProds } = await supabase
    .from('products')
    .select('product_id, title')
    .or('title.ilike.%soda%,handle.ilike.%soda%')
    .or('title.ilike.%candle%,product_type.ilike.%candle%')
    .or('title.ilike.%cash%,title.ilike.%money%,title.ilike.%jewelry%');
  const sodaPids = (sodaProds || []).map(p => p.product_id);
  summary['soda_candles'] = await updateVariantsForProducts(sodaPids, 29.99, '2. Soda Can Cash & Jewelry Candles ($29.99)');

  // RULE 6: Giant Jewelry Wax Melts -> $34.99 (collection 322749989053)
  const { data: giantPc } = await supabase
    .from('product_collections')
    .select('product_id')
    .eq('collection_id', '322749989053');
  const giantPids = (giantPc || []).map(p => p.product_id);
  summary['giant_wax_melts'] = await updateVariantsForProducts(giantPids, 34.99, '6. Giant Jewelry Wax Melts ($34.99)');

  // RULE 7: Cash Figurine Wax Melts -> $34.99 (collection 293598757053)
  const { data: figPc } = await supabase
    .from('product_collections')
    .select('product_id')
    .eq('collection_id', '293598757053');
  const figPids = (figPc || []).map(p => p.product_id);
  summary['figurine_wax_melts'] = await updateVariantsForProducts(figPids, 34.99, '7. Cash Figurine Wax Melts ($34.99)');

  // RULE 14: Cash Surprise Bear & Cash Wax Melt Bundles -> $59.99 (collection 329533358269)
  const { data: bearPc } = await supabase
    .from('product_collections')
    .select('product_id')
    .eq('collection_id', '329533358269');
  const bearPids = (bearPc || []).map(p => p.product_id);
  summary['bear_bundles'] = await updateVariantsForProducts(bearPids, 59.99, '14. Cash Surprise Bear & Melt Bundles ($59.99)');

  // RULE 13: Cash & Jewelry Greeting Cards -> $14.99
  const { data: cardProds } = await supabase
    .from('products')
    .select('product_id')
    .or('title.ilike.%greeting card%,title.ilike.%greeting-card%')
    .or('title.ilike.%cash%,title.ilike.%jewelry%');
  const cardPids = (cardProds || []).map(p => p.product_id);
  summary['greeting_cards'] = await updateVariantsForProducts(cardPids, 14.99, '13. Cash & Jewelry Greeting Cards ($14.99)');

  // RULE 10: Cash & Jewelry Bath Soaks (Tubes) -> $19.99
  const { data: soakProds } = await supabase
    .from('products')
    .select('product_id')
    .or('title.ilike.%bath soak%,title.ilike.%bath salt%')
    .or('title.ilike.%cash%,title.ilike.%jewelry%');
  const soakPids = (soakProds || []).map(p => p.product_id);
  summary['bath_soaks'] = await updateVariantsForProducts(soakPids, 19.99, '10. Cash & Jewelry Bath Soaks Tubes ($19.99)');

  // RULE 11: 7.5 oz Cash & Jewelry Sugar Scrubs -> $19.99
  const { data: scrubProds } = await supabase
    .from('products')
    .select('product_id')
    .ilike('title', '%sugar scrub%')
    .or('title.ilike.%cash%,title.ilike.%jewelry%');
  const scrubPids = (scrubProds || []).map(p => p.product_id);
  summary['sugar_scrubs'] = await updateVariantsForProducts(scrubPids, 19.99, '11. Cash & Jewelry Sugar Scrubs ($19.99)');

  // RULE 5: Cash & Jewelry Slimes -> $19.99
  const { data: slimeProds } = await supabase
    .from('products')
    .select('product_id')
    .ilike('title', '%slime%')
    .or('title.ilike.%cash%,title.ilike.%jewelry%');
  const slimePids = (slimeProds || []).map(p => p.product_id);
  summary['slimes'] = await updateVariantsForProducts(slimePids, 19.99, '5. Cash & Jewelry Slimes ($19.99)');

  console.log('======================================================================');
  console.log('=== PRICING UPDATE AUDIT SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
}

run();
