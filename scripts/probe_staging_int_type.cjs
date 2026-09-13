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

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function probe() {
  const probeIdSmall = 'probe_test_small';
  const r1 = await supabase.from('staging_products').insert({
    product_id: probeIdSmall,
    handle: 'probe-test-small',
    title: 'Probe Small',
    total_inventory_qty: 100
  });
  console.log('Insert 100:', r1.error ? r1.error.message : 'SUCCESS ✅');
  await supabase.from('staging_products').delete().eq('product_id', probeIdSmall);

  const probeId = 'probe_test_999999999';
  const { error } = await supabase.from('staging_products').insert({
    product_id: probeId,
    handle: 'probe-test-handle',
    title: 'Probe Test Product',
    total_inventory_qty: 10890099000
  });

  if (error) {
    console.log('PROBE_RESULT: STILL_INTEGER_ERROR ->', error.message);
  } else {
    console.log('PROBE_RESULT: BIGINT_SUCCESS ✅');
    await supabase.from('staging_products').delete().eq('product_id', probeId);
  }
}

probe().catch(console.error);
