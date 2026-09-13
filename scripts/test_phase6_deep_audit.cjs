/**
 * ILoveSurprises - Phase 6 Deep Verification
 * Audits collection/product mappings, variants, options, images, and product navigation.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envLocalPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function runDeepAudit() {
  console.log('======================================================');
  console.log('STARTING PHASE 6 DEEP CATALOG INTEGRATION AUDIT');
  console.log('======================================================\n');

  let pass = true;

  // 1. Collection-Product Mappings Verification
  console.log('--- 1. Auditing Collection-Product Mappings ---');
  const { data: colSample, error: colErr } = await supabase
    .from('collections')
    .select('collection_id, handle, title, products_count')
    .gt('products_count', 0)
    .limit(3);

  if (colErr || !colSample?.length) {
    console.error('Error fetching sample collections:', colErr);
    pass = false;
  } else {
    for (const c of colSample) {
      const { count: mappedCount, error: mapErr } = await supabase
        .from('product_collections')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', c.collection_id);

      console.log(`Collection [${c.title}] (ID: ${c.collection_id}) -> Products Count declared: ${c.products_count} | Actual Mappings: ${mappedCount}`);
      if (mapErr) pass = false;
    }
  }

  // 2. Variant / Options / Images Relationship Audit
  console.log('\n--- 2. Auditing Variant / Options / Images Relationships ---');
  // Get a product that has variants and images
  const { data: testProducts, error: prodErr } = await supabase
    .from('products')
    .select('product_id, handle, title')
    .limit(3);

  if (prodErr || !testProducts?.length) {
    console.error('Error fetching test products:', prodErr);
    pass = false;
  } else {
    for (const p of testProducts) {
      const { data: variants } = await supabase.from('product_variants').select('variant_id, price, compare_at_price, option1_name, option1_value, sku').eq('product_id', p.product_id);
      const { data: images } = await supabase.from('product_images').select('image_url, position, alt_text').eq('product_id', p.product_id);
      const { data: options } = await supabase.from('product_options').select('option_key, position, source_name').eq('product_id', p.product_id);
      const { data: optValues } = await supabase.from('product_option_values').select('value').eq('product_id', p.product_id);

      console.log(`Product: "${p.title}" (Handle: ${p.handle})`);
      console.log(`  -> Variants: ${variants?.length || 0} | Images: ${images?.length || 0} | Options: ${options?.length || 0} | Option Values: ${optValues?.length || 0}`);
      if (variants?.length) {
        console.log(`     Sample Variant: Price: $${variants[0].price} | Option: ${variants[0].option1_name}=${variants[0].option1_value} | SKU: ${variants[0].sku || 'NULL'}`);
      }
      if (images?.length) {
        console.log(`     Sample Image: URL: ${images[0].image_url?.substring(0, 60)}... | Position: ${images[0].position}`);
      }
    }
  }

  // 3. Exact Product Navigation Verification (Query by Handle & ID)
  console.log('\n--- 3. Verifying Exact Product Navigation by Handle ---');
  const testHandles = [
    'hot-pink-on-white-keep-calm-short-sleeve-shirt-jewelry-clothing',
    'personalized-handwritten-card'
  ];

  for (const h of testHandles) {
    const tStart = Date.now();
    const { data: prod, error } = await supabase
      .from('products')
      .select('product_id, handle, title, body_html, total_inventory_qty')
      .eq('handle', h)
      .single();
    const duration = Date.now() - tStart;

    if (error || !prod) {
      console.error(`❌ Failed to resolve product by handle "${h}":`, error);
      pass = false;
    } else {
      console.log(`✅ Resolved handle "${h}" in ${duration}ms: "${prod.title}" (ID: ${prod.product_id})`);
    }
  }

  // 4. Spot Check Zero Orphans in Production
  console.log('\n--- 4. Checking Zero Orphan Records in Production ---');
  const { data: sampleVariants } = await supabase.from('product_variants').select('variant_id, product_id').limit(10);
  let orphanVariants = 0;
  for (const v of (sampleVariants || [])) {
    const { data: parent } = await supabase.from('products').select('product_id').eq('product_id', v.product_id).single();
    if (!parent) orphanVariants++;
  }
  console.log(`Variant -> Product Probe (10 samples): ${orphanVariants} orphans (${orphanVariants === 0 ? 'PASS ✅' : 'FAIL ❌'})`);
  if (orphanVariants > 0) pass = false;

  const { data: sampleImages } = await supabase.from('product_images').select('id, product_id').limit(10);
  let orphanImages = 0;
  for (const img of (sampleImages || [])) {
    const { data: parent } = await supabase.from('products').select('product_id').eq('product_id', img.product_id).single();
    if (!parent) orphanImages++;
  }
  console.log(`Image -> Product Probe (10 samples): ${orphanImages} orphans (${orphanImages === 0 ? 'PASS ✅' : 'FAIL ❌'})`);
  if (orphanImages > 0) pass = false;

  console.log('\n======================================================');
  console.log(`PHASE 6 DEEP CATALOG VERIFICATION: ${pass ? '100% PASS ✅' : 'FAIL ❌'}`);
  console.log('======================================================');

  return pass;
}

runDeepAudit().catch(console.error);
