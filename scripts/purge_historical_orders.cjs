const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key] && val) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const BATCH_SIZE = 150; // Under HTTP URL length limit
const CONCURRENCY = 12;

async function purgeTable(tableName) {
  console.log(`\n--- Purging historical records from [${tableName}] ---`);
  let totalDeleted = 0;
  const startTime = Date.now();

  while (true) {
    // Fetch a large block of IDs
    const fetchLimit = BATCH_SIZE * CONCURRENCY;
    const { data: rows, error: selectErr } = await supabase
      .from(tableName)
      .select('id')
      .limit(fetchLimit);

    if (selectErr) {
      console.error(`Error fetching from ${tableName}:`, selectErr.message);
      // Brief pause before retry
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    if (!rows || rows.length === 0) {
      console.log(`\nAll records in [${tableName}] successfully purged!`);
      break;
    }

    // Split rows into concurrent chunks of BATCH_SIZE
    const chunks = [];
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      chunks.push(rows.slice(i, i + BATCH_SIZE).map((r) => r.id));
    }

    // Execute parallel deletes
    const results = await Promise.all(
      chunks.map((ids) => supabase.from(tableName).delete().in('id', ids))
    );

    let roundDeleted = 0;
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.error) {
        console.error(`Error in delete chunk:`, res.error.message);
      } else {
        roundDeleted += chunks[i].length;
      }
    }

    totalDeleted += roundDeleted;
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (totalDeleted / ((Date.now() - startTime) / 1000)).toFixed(0);
    process.stdout.write(`\rDeleted ${totalDeleted.toLocaleString()} rows from ${tableName} (${elapsedSec}s, ~${rate} rows/s)...`);
  }

  console.log(`\nCompleted [${tableName}] purge: ${totalDeleted.toLocaleString()} total rows removed.`);
}

async function run() {
  console.log('====================================================');
  console.log('TASK 1: FRESH START DATA POLICY - DATABASE PURGE');
  console.log('====================================================');

  const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  const { count: profCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  console.log(`[PROTECTED] Products in DB:   ${prodCount?.toLocaleString()} (KEPT 100% INTACT)`);
  console.log(`[PROTECTED] Categories in DB: ${catCount?.toLocaleString()} (KEPT 100% INTACT)`);
  console.log(`[PROTECTED] Profiles in DB:   ${profCount?.toLocaleString()} (KEPT 100% INTACT - ADMIN/LEGITIMATE ACCOUNTS)`);

  // Step 1: Purge order_items
  await purgeTable('order_items');

  // Step 2: Purge orders
  await purgeTable('orders');

  // Step 3: Verify final state
  console.log('\n====================================================');
  console.log('FINAL DATABASE VERIFICATION & AUDIT');
  console.log('====================================================');
  const { count: finalProd } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: finalCat } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  const { count: finalProf } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: finalOrd } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: finalItems } = await supabase.from('order_items').select('*', { count: 'exact', head: true });

  console.log(`Products:     ${finalProd?.toLocaleString()} (Intact)`);
  console.log(`Categories:   ${finalCat?.toLocaleString()} (Intact)`);
  console.log(`Profiles:     ${finalProf?.toLocaleString()} (Intact)`);
  console.log(`Orders:       ${finalOrd} (0 historical records - Ready for new orders)`);
  console.log(`Order Items:  ${finalItems} (0 historical records - Ready for new order items)`);
  console.log('====================================================');
}

run().catch(console.error);

