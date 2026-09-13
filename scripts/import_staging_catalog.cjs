/**
 * ILoveSurprises - High Performance Staging Catalog Importer
 * Authoritative source: JewelryCandles_ILoveSurprises_FINAL_Migration_Package
 *
 * Strictly imports all 11 normalized files into public.staging_* tables.
 * Safe: Does NOT touch any production table or business data.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load environment variables securely
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
  console.error('ERROR: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env.local');
  process.exit(1);
}

const PACKAGE_DIR = path.join(
  __dirname,
  '..',
  'Backend_Data',
  'I Love Surprises Backend Data',
  'JewelryCandles_ILoveSurprises_FINAL_Migration_Package'
);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

// Helper: parse boolean
function toBool(val) {
  if (val === undefined || val === null || val === '') return null;
  const s = String(val).trim().toLowerCase();
  if (s === 'true' || s === 't' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === 'f' || s === '0' || s === 'no') return false;
  return null;
}

// Helper: parse float
function toFloat(val) {
  if (val === undefined || val === null || val === '') return null;
  const f = parseFloat(val);
  return isNaN(f) ? null : f;
}

// Helper: parse int
function toInt(val) {
  if (val === undefined || val === null || val === '') return null;
  const i = parseInt(val, 10);
  return isNaN(i) ? null : i;
}

// Helper: string or null
function toStr(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

// Stateful streaming CSV parser with proper backpressure
function createCSVParser(onRow) {
  let inQuotes = false;
  let currentField = '';
  let currentRow = [];
  let prevChar = '';

  function processChar(char) {
    if (char === '\ufeff') return; // Strip BOM

    if (inQuotes) {
      if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        if (prevChar === '"') {
          currentField += '"';
          inQuotes = true;
        } else {
          inQuotes = true;
        }
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\n' && prevChar === '\r') {
          // ignore trailing lf
        } else {
          currentRow.push(currentField);
          currentField = '';
          if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
            onRow(currentRow);
          }
          currentRow = [];
        }
      } else {
        currentField += char;
      }
    }
    prevChar = char;
  }

  return {
    write(chunk) {
      const str = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      for (let i = 0; i < str.length; i++) {
        processChar(str[i]);
      }
    },
    end() {
      if (currentRow.length > 0 || currentField.length > 0) {
        currentRow.push(currentField);
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
          onRow(currentRow);
        }
      }
    }
  };
}

// Async generator to stream rows with bounded memory and stream pause/resume backpressure
async function* streamCSVRows(filePath) {
  const stream = fs.createReadStream(filePath, { highWaterMark: 128 * 1024 });
  let header = null;
  const queue = [];
  let resolveWaiting = null;
  let finished = false;
  let streamError = null;

  const parser = createCSVParser(row => {
    if (!header) {
      header = row.map(h => h.trim().replace(/^\ufeff/, ''));
    } else {
      queue.push(row);
      if (resolveWaiting) {
        const resolve = resolveWaiting;
        resolveWaiting = null;
        resolve();
      }
      if (queue.length > 4000) {
        stream.pause();
      }
    }
  });

  stream.on('data', chunk => parser.write(chunk));
  stream.on('end', () => {
    parser.end();
    finished = true;
    if (resolveWaiting) {
      const resolve = resolveWaiting;
      resolveWaiting = null;
      resolve();
    }
  });
  stream.on('error', err => {
    streamError = err;
    if (resolveWaiting) {
      const resolve = resolveWaiting;
      resolveWaiting = null;
      resolve();
    }
  });

  while (true) {
    if (streamError) throw streamError;
    if (queue.length === 0) {
      if (finished) break;
      await new Promise(r => { resolveWaiting = r; });
    }
    while (queue.length > 0) {
      yield { row: queue.shift(), header };
      if (queue.length < 1000 && stream.isPaused()) {
        stream.resume();
      }
    }
  }
}

// Retry wrapper for Supabase batch insert with backoff & resource safety
async function insertBatchWithRetry(table, batch, rangeInfo, maxRetries = 5) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    const { error } = await supabase.from(table).insert(batch);
    if (!error) return;

    const errMsg = (error.message || '').toLowerCase();
    const isFatalQuota = error.code === '53100' ||
      errMsg.includes('no space left') ||
      errMsg.includes('quota') ||
      errMsg.includes('disk full');

    if (isFatalQuota) {
      console.error(`\n🚨 FATAL STORAGE / QUOTA LIMIT EXCEEDED on table ${table}!`);
      console.error(`PostgreSQL Error: [${error.code}] ${error.message}`);
      console.error(`Batch range: ${rangeInfo}`);
      throw new Error(`STORAGE_LIMIT_EXCEEDED on ${table}: ${error.message} (${error.code})`);
    }

    console.warn(`⚠️ [Retry ${attempt}/${maxRetries}] Table ${table} (${rangeInfo}): ${error.message} (${error.code || 'NO_CODE'})`);
    if (attempt >= maxRetries) {
      throw new Error(`FATAL: Failed to insert batch into ${table} (${rangeInfo}) after ${maxRetries} attempts: ${error.message} (Code: ${error.code})`);
    }
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    await new Promise(r => setTimeout(r, delay));
  }
}

// Stream and import a CSV file into a staging table
async function importCSVFile(options) {
  const { fileName, tableName, batchSize = 2500, expectedCount, transformRow } = options;
  const fullPath = path.join(PACKAGE_DIR, fileName);

  console.log(`\n============================================================`);
  console.log(`CHECKING TABLE: ${tableName} (${fileName})`);
  console.log(`Expected target: ${expectedCount.toLocaleString()} rows | Batch size: ${batchSize}`);
  console.log(`============================================================`);

  // Check current table count
  const { count: currentCount, error: countErr } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    throw new Error(`Failed to check existing count on ${tableName}: ${countErr.message}`);
  }

  if (currentCount === expectedCount) {
    console.log(`✅ [${tableName}] ALREADY FULLY IMPORTED: ${currentCount.toLocaleString()} / ${expectedCount.toLocaleString()} rows. Skipping.`);
    return currentCount;
  }

  if (currentCount > expectedCount) {
    console.warn(`⚠️ [${tableName}] Has ${currentCount} rows, which exceeds expected ${expectedCount}. Re-verifying.`);
  }

  const skipCount = currentCount || 0;
  if (skipCount > 0) {
    console.log(`🔄 [${tableName}] Resuming import: ${skipCount.toLocaleString()} rows already present. Skipping first ${skipCount.toLocaleString()} CSV records...`);
  }

  const startTime = Date.now();
  let batch = [];
  let fileRowIndex = 0;
  let totalProcessed = skipCount;

  for await (const { row, header } of streamCSVRows(fullPath)) {
    fileRowIndex++;
    if (fileRowIndex <= skipCount) {
      continue; // Skip already inserted records for resumability
    }

    const record = transformRow(row, header);
    if (record) {
      batch.push(record);
    }

    if (batch.length >= batchSize) {
      const currentBatch = batch;
      batch = [];
      const rangeInfo = `Rows ${totalProcessed + 1} to ${totalProcessed + currentBatch.length}`;
      await insertBatchWithRetry(tableName, currentBatch, rangeInfo);
      totalProcessed += currentBatch.length;

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (totalProcessed / (elapsed || 1)).toFixed(0);
      const pct = ((totalProcessed / expectedCount) * 100).toFixed(1);
      console.log(`[${tableName}] Uploaded ${totalProcessed.toLocaleString()} / ${expectedCount.toLocaleString()} rows (${pct}%, ${elapsed}s, ~${rate} r/s)...`);
    }
  }

  if (batch.length > 0) {
    const rangeInfo = `Rows ${totalProcessed + 1} to ${totalProcessed + batch.length}`;
    await insertBatchWithRetry(tableName, batch, rangeInfo);
    totalProcessed += batch.length;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Completed uploads for ${tableName}: ${totalProcessed.toLocaleString()} rows in ${elapsed}s.`);

  // Verify final count in database
  const { count: finalCount, error: finalCountErr } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (finalCountErr) {
    console.warn(`Could not verify exact count for ${tableName}: ${finalCountErr.message}`);
  } else {
    const match = finalCount === expectedCount;
    console.log(`DB Count Check for [${tableName}]: ${finalCount?.toLocaleString()} rows (Expected: ${expectedCount.toLocaleString()}) -> ${match ? 'MATCH ✅' : 'MISMATCH ❌'}`);
    if (!match) {
      throw new Error(`COUNT MISMATCH on ${tableName}: DB has ${finalCount}, expected ${expectedCount}`);
    }
  }

  return totalProcessed;
}

async function runStagingImport() {
  console.log('############################################################');
  console.log('STARTING COMPLETE JEWELRYCANDLES STAGING IMPORT');
  console.log('Target: NEW Supabase Pro project (grwhdtvorhdvyvcxwomn)');
  console.log('Tables: public.staging_* only');
  console.log('Expected Total Records: 3,433,257');
  console.log('############################################################\n');

  const overallStart = Date.now();

  // 1. staging_products (57,479 rows)
  await importCSVFile({
    fileName: 'products.csv',
    tableName: 'staging_products',
    expectedCount: 57479,
    batchSize: 2000,
    transformRow: (row) => ({
      product_id: row[0],
      handle: row[1],
      title: toStr(row[2]),
      description_html: toStr(row[3]),
      vendor: toStr(row[4]),
      product_category: toStr(row[5]),
      type: toStr(row[6]),
      tags: toStr(row[7]),
      published: toBool(row[8]),
      gift_card: toBool(row[9]),
      seo_title: toStr(row[10]),
      seo_description: toStr(row[11]),
      status: toStr(row[12]),
      base_price: toFloat(row[13]),
      base_compare_at_price: toFloat(row[14]),
      source_file: toStr(row[15])
    })
  });

  // 2. staging_collections (460 rows)
  await importCSVFile({
    fileName: 'collections.csv',
    tableName: 'staging_collections',
    expectedCount: 460,
    batchSize: 460,
    transformRow: (row) => ({
      collection_id: row[0],
      handle: row[1],
      title: toStr(row[2]),
      body_html: toStr(row[3]),
      sort_order: toStr(row[4]),
      template_suffix: toStr(row[5]),
      updated_at: toStr(row[6]),
      image_src: toStr(row[7]),
      image_alt_text: toStr(row[8]),
      products_count: toInt(row[9]),
      source_type: toStr(row[10]),
      source_title: toStr(row[11]),
      source_description: toStr(row[12]),
      inclusion_type: toStr(row[13]),
      inclusion_match: toStr(row[14]),
      published_online_store: toBool(row[15]),
      published_at_online_store: toStr(row[16]),
      seo_title: toStr(row[17]),
      seo_description: toStr(row[18]),
      smartseo_title: toStr(row[19]),
      smartseo_description: toStr(row[20]),
      smartseo_keywords: toStr(row[21])
    })
  });

  // 3. staging_product_options (47,788 rows)
  await importCSVFile({
    fileName: 'product_options.csv',
    tableName: 'staging_product_options',
    expectedCount: 47788,
    batchSize: 2500,
    transformRow: (row) => ({
      option_key: row[0],
      product_id: row[1],
      position: toInt(row[2]),
      source_name: toStr(row[3]),
      canonical_name: toStr(row[4])
    })
  });

  // 4. staging_product_option_values (706,291 rows)
  await importCSVFile({
    fileName: 'product_option_values.csv',
    tableName: 'staging_product_option_values',
    expectedCount: 706291,
    batchSize: 2500,
    transformRow: (row) => ({
      option_key: row[0],
      product_id: row[1],
      position: toInt(row[2]),
      source_name: toStr(row[3]),
      canonical_name: toStr(row[4]),
      value: toStr(row[5])
    })
  });

  // 5. staging_product_variants (1,547,749 rows)
  await importCSVFile({
    fileName: 'product_variants.csv',
    tableName: 'staging_product_variants',
    expectedCount: 1547749,
    batchSize: 2000,
    transformRow: (row) => ({
      variant_key: row[0],
      product_id: row[1],
      sku: toStr(row[2]), // preserve blank SKUs as NULL
      barcode: toStr(row[3]),
      price: toFloat(row[4]),
      compare_at_price: toFloat(row[5]),
      option1_name: toStr(row[6]),
      option1_canonical_name: toStr(row[7]),
      option1_value: toStr(row[8]),
      option2_name: toStr(row[9]),
      option2_canonical_name: toStr(row[10]),
      option2_value: toStr(row[11]),
      option3_name: toStr(row[12]),
      option3_canonical_name: toStr(row[13]),
      option3_value: toStr(row[14]),
      grams: toFloat(row[15]),
      weight_unit: toStr(row[16]),
      inventory_tracker: toStr(row[17]),
      inventory_policy: toStr(row[18]),
      fulfillment_service: toStr(row[19]),
      requires_shipping: toBool(row[20]),
      taxable: toBool(row[21]),
      tax_code: toStr(row[22]),
      cost_per_item: toFloat(row[23]),
      variant_image: toStr(row[24]),
      included_us: toBool(row[25]),
      price_us: toFloat(row[26]),
      compare_at_us: toFloat(row[27]),
      included_international: toBool(row[28]),
      price_international: toFloat(row[29]),
      compare_at_international: toFloat(row[30]),
      source_file: toStr(row[31])
    })
  });

  // 6. staging_product_images (64,700 rows)
  await importCSVFile({
    fileName: 'product_images.csv',
    tableName: 'staging_product_images',
    expectedCount: 64700,
    batchSize: 2500,
    transformRow: (row) => ({
      product_id: row[0],
      image_url: row[1],
      position: toInt(row[2]),
      alt_text: toStr(row[3]),
      source_file: toStr(row[4])
    })
  });

  // 7. staging_product_collections (948,607 rows)
  await importCSVFile({
    fileName: 'product_collections.csv',
    tableName: 'staging_product_collections',
    expectedCount: 948607,
    batchSize: 2500,
    transformRow: (row) => ({
      collection_id: row[0],
      collection_handle: toStr(row[1]),
      product_id: row[2],
      product_handle: toStr(row[3]),
      position: toInt(row[4]),
      mapping_source: toStr(row[5])
    })
  });

  // 8. staging_product_metafields (9,664 rows)
  await importCSVFile({
    fileName: 'product_metafields.csv',
    tableName: 'staging_product_metafields',
    expectedCount: 9664,
    batchSize: 2000,
    transformRow: (row) => ({
      product_id: row[0],
      metafield_column: toStr(row[1]),
      value: toStr(row[2])
    })
  });

  // 9. staging_collection_metafields (100 rows)
  await importCSVFile({
    fileName: 'collection_metafields.csv',
    tableName: 'staging_collection_metafields',
    expectedCount: 100,
    batchSize: 100,
    transformRow: (row) => ({
      collection_id: row[0],
      collection_handle: toStr(row[1]),
      metafield_column: toStr(row[2]),
      value: toStr(row[3])
    })
  });

  // 10. staging_collection_conditions (43,519 rows)
  await importCSVFile({
    fileName: 'collection_conditions.csv',
    tableName: 'staging_collection_conditions',
    expectedCount: 43519,
    batchSize: 2500,
    transformRow: (row) => ({
      collection_id: row[0],
      collection_handle: toStr(row[1]),
      command: toStr(row[2]),
      field: toStr(row[3]),
      relation: toStr(row[4]),
      value: toStr(row[5]),
      match: toStr(row[6])
    })
  });

  // 11. staging_collection_publications (6,900 rows)
  await importCSVFile({
    fileName: 'collection_publications.csv',
    tableName: 'staging_collection_publications',
    expectedCount: 6900,
    batchSize: 1000,
    transformRow: (row) => ({
      collection_id: row[0],
      collection_handle: toStr(row[1]),
      channel: toStr(row[2]),
      published: toBool(row[3]),
      published_at: toStr(row[4])
    })
  });

  const totalMinutes = ((Date.now() - overallStart) / 60000).toFixed(2);
  console.log('\n============================================================');
  console.log(`🎉 ALL 11 STAGING TABLES (3,433,257 ROWS) SUCCESSFULLY IMPORTED IN ${totalMinutes} MINUTES`);
  console.log('============================================================');
}

module.exports = { runStagingImport };

if (require.main === module) {
  runStagingImport().catch(err => {
    console.error('\n❌ FATAL IMPORT ERROR:', err.message);
    process.exit(1);
  });
}
