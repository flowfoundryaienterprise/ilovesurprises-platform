/**
 * ILoveSurprises - Phase 5 Authoritative Staging Catalog Importer
 * Authoritative source: ILoveSurprises_Final_Developer_Handoff
 *
 * Imports into public.staging_* tables aligned with SUPABASE_SCHEMA.sql.
 * Safe: Strictly isolated to staging_* tables. Production tables untouched.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

// 1. Environment configuration
const envLocalPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const TARGET_PROJECT = 'grwhdtvorhdvyvcxwomn';
if (!supabaseUrl.includes(TARGET_PROJECT)) {
  console.error(`FATAL: Forbidden or mismatched target project! Expected ${TARGET_PROJECT}, got ${supabaseUrl}`);
  process.exit(1);
}

const HANDOFF_DIR = path.resolve(
  __dirname,
  '..',
  'Backend_Data',
  'I Love Surprises Backend Data',
  'ILoveSurprises_Final_Developer_Handoff'
);
const NORMALIZED_DIR = path.resolve(HANDOFF_DIR, 'ILoveSurprises_Developer_Handoff');
const PRODUCTS_CSV = path.resolve(HANDOFF_DIR, 'Products.csv');

const CHECKPOINT_FILE = path.resolve(__dirname, 'phase5_import_checkpoint.json');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

// Load or initialize checkpoint
function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    } catch (_) {}
  }
  return { completedTables: {}, tableProgress: {} };
}

function saveCheckpoint(state) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// Helpers
function toBool(val) {
  if (val === undefined || val === null || val === '') return null;
  const s = String(val).trim().toLowerCase();
  if (s === 'true' || s === 't' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === 'f' || s === '0' || s === 'no') return false;
  return null;
}

function toFloat(val) {
  if (val === undefined || val === null || val === '') return null;
  const f = parseFloat(val);
  return isNaN(f) ? null : f;
}

function toInt(val) {
  if (val === undefined || val === null || val === '') return null;
  const i = parseInt(val, 10);
  return isNaN(i) ? null : i;
}

function toStr(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

// RFC-4180 CSV line parser
function parseCSVFields(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  fields.push(current);
  return fields;
}

// Bulk insert batch with intelligent retry
async function insertBatch(table, batch, maxRetries = 5) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    const { error } = await supabase.from(table).insert(batch);
    if (!error) return;

    console.warn(`[${table}] Batch insert warning (attempt ${attempt}/${maxRetries}):`, error.message);
    if (attempt >= maxRetries) {
      throw new Error(`Failed to insert batch of ${batch.length} rows into ${table}: ${error.message}`);
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
}

// High-throughput concurrent batch pipeline
class BatchPipeline {
  constructor(table, concurrency = 4) {
    this.table = table;
    this.concurrency = concurrency;
    this.pool = new Set();
    this.error = null;
  }

  async push(batch) {
    if (this.error) throw this.error;
    const p = insertBatch(this.table, batch).catch((err) => {
      this.error = err;
      throw err;
    });
    this.pool.add(p);
    p.finally(() => this.pool.delete(p));
    if (this.pool.size >= this.concurrency) {
      await Promise.race(this.pool);
    }
  }

  async flush() {
    if (this.error) throw this.error;
    await Promise.all(this.pool);
    if (this.error) throw this.error;
  }
}

// -------------------------------------------------------------
// STEP 1: Import staging_collections (460 rows)
// -------------------------------------------------------------
async function importCollections(state) {
  const tableName = 'staging_collections';
  if (state.completedTables[tableName]) {
    console.log(`⏩ ${tableName} already marked complete. Skipping.`);
    return;
  }
  console.log(`\n📦 Importing ${tableName} from collections_master.csv ...`);
  const csvFile = path.resolve(NORMALIZED_DIR, 'collections_master.csv');
  const rl = readline.createInterface({
    input: fs.createReadStream(csvFile, 'utf8'),
    crlfDelay: Infinity
  });

  let isHeader = true;
  let acc = '';
  const rows = [];
  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    if (!line.trim() && !acc) continue;
    acc = acc ? acc + '\n' + line : line;
    let q = 0;
    for (let i = 0; i < acc.length; i++) {
      if (acc[i] === '"') q++;
    }
    if (q % 2 !== 0) continue;

    const f = parseCSVFields(acc);
    acc = '';
    rows.push({
      collection_id: f[0].replace(/^\uFEFF/, ''),
      handle: f[1],
      title: toStr(f[2]) || 'Untitled Collection',
      body_html: toStr(f[3]),
      sort_order: toStr(f[4]),
      template_suffix: toStr(f[5]),
      updated_at: toStr(f[6]),
      image_url: toStr(f[7]),
      products_count: toInt(f[8]),
      published_online_store: toBool(f[9]),
      source_type: toStr(f[10]),
      inclusion_type: toStr(f[11]),
      inclusion_match: toStr(f[12]),
      seo_title: toStr(f[13]),
      seo_description: toStr(f[14]),
      smartseo_meta_title: toStr(f[15]),
      smartseo_meta_description: toStr(f[16]),
      smartseo_meta_keywords: toStr(f[17])
    });
  }

  await insertBatch(tableName, rows);
  console.log(`✅ Loaded ${rows.length} rows into ${tableName}.`);
  state.completedTables[tableName] = true;
  saveCheckpoint(state);
}

// -------------------------------------------------------------
// STEP 2: Import staging_collection_conditions (43,519 rows)
// -------------------------------------------------------------
async function importCollectionConditions(state) {
  const tableName = 'staging_collection_conditions';
  if (state.completedTables[tableName]) {
    console.log(`⏩ ${tableName} already marked complete. Skipping.`);
    return;
  }
  console.log(`\n📦 Importing ${tableName} from collection_conditions.csv ...`);
  const csvFile = path.resolve(NORMALIZED_DIR, 'collection_conditions.csv');
  const rl = readline.createInterface({
    input: fs.createReadStream(csvFile, 'utf8'),
    crlfDelay: Infinity
  });

  const pipeline = new BatchPipeline(tableName, 4);
  let isHeader = true;
  let batch = [];
  let count = 0;
  let acc = '';
  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    if (!line.trim() && !acc) continue;
    acc = acc ? acc + '\n' + line : line;
    let q = 0;
    for (let i = 0; i < acc.length; i++) {
      if (acc[i] === '"') q++;
    }
    if (q % 2 !== 0) continue;

    const f = parseCSVFields(acc);
    acc = '';
    batch.push({
      collection_id: f[0].replace(/^\uFEFF/, ''),
      condition_no: toInt(f[2]),
      field: toStr(f[3]),
      relation: toStr(f[4]),
      value: toStr(f[5]),
      match: toStr(f[6])
    });

    if (batch.length >= 3000) {
      count += batch.length;
      await pipeline.push(batch);
      process.stdout.write(`\r   -> Staged ${count.toLocaleString()} conditions...`);
      batch = [];
    }
  }
  if (batch.length > 0) {
    count += batch.length;
    await pipeline.push(batch);
  }
  await pipeline.flush();
  console.log(`\n✅ Loaded ${count.toLocaleString()} rows into ${tableName}.`);
  state.completedTables[tableName] = true;
  saveCheckpoint(state);
}

// -------------------------------------------------------------
// STEP 3: Import staging_collection_metafields (100 rows)
// -------------------------------------------------------------
async function importCollectionMetafields(state) {
  const tableName = 'staging_collection_metafields';
  if (state.completedTables[tableName]) {
    console.log(`⏩ ${tableName} already marked complete. Skipping.`);
    return;
  }
  console.log(`\n📦 Importing ${tableName} from collection_metafields.csv ...`);
  const csvFile = path.resolve(NORMALIZED_DIR, 'collection_metafields.csv');
  const rl = readline.createInterface({
    input: fs.createReadStream(csvFile, 'utf8'),
    crlfDelay: Infinity
  });

  let isHeader = true;
  let acc = '';
  const rows = [];
  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    if (!line.trim() && !acc) continue;
    acc = acc ? acc + '\n' + line : line;
    let q = 0;
    for (let i = 0; i < acc.length; i++) {
      if (acc[i] === '"') q++;
    }
    if (q % 2 !== 0) continue;

    const f = parseCSVFields(acc);
    acc = '';
    rows.push({
      collection_id: f[0].replace(/^\uFEFF/, ''),
      namespace_key: toStr(f[2]),
      metafield_type: toStr(f[3]),
      value: toStr(f[4])
    });
  }

  await insertBatch(tableName, rows);
  console.log(`✅ Loaded ${rows.length} rows into ${tableName}.`);
  state.completedTables[tableName] = true;
  saveCheckpoint(state);
}

// -------------------------------------------------------------
// STEP 4: Stream Products.csv (Products, Options, Values, Variants, Images)
// -------------------------------------------------------------
async function streamProductsCSV(state) {
  console.log('\n📦 Streaming Products.csv for Products, Options, Variants, and Images...');

  // Pass 1: Products (57,479 rows)
  if (!state.completedTables['staging_products']) {
    console.log('\n--- Pass 1: Staging Products (57,479 rows) ---');
    const stream = fs.createReadStream(PRODUCTS_CSV);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    const pipeline = new BatchPipeline('staging_products', 4);
    let isHeader = true;
    let inQuotedMultiline = false;
    let accumulated = '';
    let batch = [];
    let productCount = 0;

    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }

      if (!inQuotedMultiline) {
        accumulated = line;
      } else {
        accumulated += '\n' + line;
      }

      let quoteCount = 0;
      for (let i = 0; i < accumulated.length; i++) {
        if (accumulated[i] === '"') quoteCount++;
      }

      if (quoteCount % 2 !== 0) {
        inQuotedMultiline = true;
        continue;
      }
      inQuotedMultiline = false;

      const f = parseCSVFields(accumulated);
      accumulated = '';

      const isTopRow = f[20] === 'true';
      if (isTopRow) {
        batch.push({
          product_id: f[0],
          handle: f[1],
          title: toStr(f[3]) || 'Untitled Product',
          body_html: toStr(f[4]),
          vendor: toStr(f[5]),
          product_type: toStr(f[6]),
          tags: toStr(f[7]),
          created_at: toStr(f[9]),
          updated_at: toStr(f[10]),
          status: toStr(f[11]),
          published: toBool(f[12]),
          published_at: toStr(f[13]),
          template_suffix: toStr(f[15]),
          gift_card: toBool(f[16]),
          source_url: toStr(f[17]),
          total_inventory_qty: toInt(f[18]),
          category_id: toStr(f[21]),
          category_name: toStr(f[22]),
          seo_title: toStr(f[82]),
          seo_description: toStr(f[83])
        });

        if (batch.length >= 2000) {
          productCount += batch.length;
          await pipeline.push(batch);
          process.stdout.write(`\r   -> Staged ${productCount.toLocaleString()} products...`);
          batch = [];
        }
      }
    }
    if (batch.length > 0) {
      productCount += batch.length;
      await pipeline.push(batch);
    }
    await pipeline.flush();
    console.log(`\n✅ Loaded ${productCount.toLocaleString()} rows into staging_products.`);
    state.completedTables['staging_products'] = true;
    saveCheckpoint(state);
  } else {
    console.log('⏩ staging_products already marked complete.');
  }

  // Pass 2A: Product Options (68,402 rows)
  if (!state.completedTables['staging_product_options']) {
    console.log('\n--- Pass 2A: Staging Product Options (68,402 rows) ---');
    const stream = fs.createReadStream(PRODUCTS_CSV);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    const pipeline = new BatchPipeline('staging_product_options', 4);
    const seenOptions = new Set();
    let optionsBatch = [];
    let totalOptions = 0;
    let isHeader = true;
    let inQuotedMultiline = false;
    let accumulated = '';

    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      if (!inQuotedMultiline) accumulated = line;
      else accumulated += '\n' + line;

      let quoteCount = 0;
      for (let i = 0; i < accumulated.length; i++) {
        if (accumulated[i] === '"') quoteCount++;
      }
      if (quoteCount % 2 !== 0) { inQuotedMultiline = true; continue; }
      inQuotedMultiline = false;

      const f = parseCSVFields(accumulated);
      accumulated = '';

      const productId = f[0];
      if (!productId) continue;

      const optDefs = [
        { name: toStr(f[37]), pos: 1 },
        { name: toStr(f[39]), pos: 2 },
        { name: toStr(f[41]), pos: 3 }
      ];

      for (const opt of optDefs) {
        if (opt.name) {
          const optKey = `${productId}_opt_${opt.pos}`;
          if (!seenOptions.has(optKey)) {
            seenOptions.add(optKey);
            optionsBatch.push({
              option_key: optKey,
              product_id: productId,
              position: opt.pos,
              source_name: opt.name
            });
          }
        }
      }

      if (optionsBatch.length >= 3000) {
        totalOptions += optionsBatch.length;
        await pipeline.push(optionsBatch);
        process.stdout.write(`\r   -> Options: ${totalOptions.toLocaleString()}...`);
        optionsBatch = [];
      }
    }

    if (optionsBatch.length > 0) {
      totalOptions += optionsBatch.length;
      await pipeline.push(optionsBatch);
    }
    await pipeline.flush();

    console.log(`\n✅ Loaded ${totalOptions.toLocaleString()} rows into staging_product_options.`);
    state.completedTables['staging_product_options'] = true;
    saveCheckpoint(state);
  } else {
    console.log('⏩ staging_product_options already marked complete.');
  }

  // Pass 2B: Product Option Values (726,907 rows)
  if (!state.completedTables['staging_product_option_values']) {
    console.log('\n--- Pass 2B: Staging Product Option Values (726,907 rows) ---');
    const stream = fs.createReadStream(PRODUCTS_CSV);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    const pipeline = new BatchPipeline('staging_product_option_values', 4);
    const seenOptionValues = new Set();
    let optionValuesBatch = [];
    let totalValues = 0;
    let isHeader = true;
    let inQuotedMultiline = false;
    let accumulated = '';

    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      if (!inQuotedMultiline) accumulated = line;
      else accumulated += '\n' + line;

      let quoteCount = 0;
      for (let i = 0; i < accumulated.length; i++) {
        if (accumulated[i] === '"') quoteCount++;
      }
      if (quoteCount % 2 !== 0) { inQuotedMultiline = true; continue; }
      inQuotedMultiline = false;

      const f = parseCSVFields(accumulated);
      accumulated = '';

      const productId = f[0];
      if (!productId) continue;

      const optDefs = [
        { name: toStr(f[37]), val: toStr(f[38]), pos: 1 },
        { name: toStr(f[39]), val: toStr(f[40]), pos: 2 },
        { name: toStr(f[41]), val: toStr(f[42]), pos: 3 }
      ];

      for (const opt of optDefs) {
        if (opt.name && opt.val) {
          const optKey = `${productId}_opt_${opt.pos}`;
          const valKey = `${optKey}_${opt.val}`;
          if (!seenOptionValues.has(valKey)) {
            seenOptionValues.add(valKey);
            optionValuesBatch.push({
              option_key: optKey,
              product_id: productId,
              value: opt.val
            });
          }
        }
      }

      if (optionValuesBatch.length >= 3000) {
        totalValues += optionValuesBatch.length;
        await pipeline.push(optionValuesBatch);
        process.stdout.write(`\r   -> Option Values: ${totalValues.toLocaleString()}...`);
        optionValuesBatch = [];
      }
    }

    if (optionValuesBatch.length > 0) {
      totalValues += optionValuesBatch.length;
      await pipeline.push(optionValuesBatch);
    }
    await pipeline.flush();

    console.log(`\n✅ Loaded ${totalValues.toLocaleString()} rows into staging_product_option_values.`);
    state.completedTables['staging_product_option_values'] = true;
    saveCheckpoint(state);
  } else {
    console.log('⏩ staging_product_option_values already marked complete.');
  }

  // Pass 3: Product Variants (1,547,749 rows)
  if (!state.completedTables['staging_product_variants']) {
    console.log('\n--- Pass 3: Staging Product Variants (1,547,749 rows) ---');
    const stream = fs.createReadStream(PRODUCTS_CSV);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    const pipeline = new BatchPipeline('staging_product_variants', 4);
    let isHeader = true;
    let inQuotedMultiline = false;
    let accumulated = '';
    let batch = [];
    let variantCount = 0;

    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      if (!inQuotedMultiline) accumulated = line;
      else accumulated += '\n' + line;

      let quoteCount = 0;
      for (let i = 0; i < accumulated.length; i++) {
        if (accumulated[i] === '"') quoteCount++;
      }
      if (quoteCount % 2 !== 0) { inQuotedMultiline = true; continue; }
      inQuotedMultiline = false;

      const f = parseCSVFields(accumulated);
      accumulated = '';

      const variantId = toStr(f[35]);
      if (variantId) {
        batch.push({
          variant_id: variantId,
          product_id: f[0],
          position: toInt(f[43]),
          sku: toStr(f[44]),
          barcode: toStr(f[45]),
          option1_name: toStr(f[37]),
          option1_value: toStr(f[38]),
          option2_name: toStr(f[39]),
          option2_value: toStr(f[40]),
          option3_name: toStr(f[41]),
          option3_value: toStr(f[42]),
          image_url: toStr(f[46]),
          weight: toFloat(f[47]),
          weight_unit: toStr(f[48]),
          price: toFloat(f[49]),
          compare_at_price: toFloat(f[50]),
          taxable: toBool(f[51]),
          inventory_item_id: toStr(f[34]),
          inventory_tracker: toStr(f[52]),
          inventory_policy: toStr(f[53]),
          fulfillment_service: toStr(f[54]),
          requires_shipping: toBool(f[55]),
          shipping_profile: toStr(f[56]),
          inventory_qty: toInt(f[57]),
          cost: toFloat(f[59]),
          hs_code: toStr(f[60]),
          country_of_origin: toStr(f[61]),
          province_of_origin: toStr(f[62])
        });

        if (batch.length >= 3000) {
          variantCount += batch.length;
          await pipeline.push(batch);
          process.stdout.write(`\r   -> Staged ${variantCount.toLocaleString()} variants...`);
          batch = [];
        }
      }
    }
    if (batch.length > 0) {
      variantCount += batch.length;
      await pipeline.push(batch);
    }
    await pipeline.flush();

    console.log(`\n✅ Loaded ${variantCount.toLocaleString()} rows into staging_product_variants.`);
    state.completedTables['staging_product_variants'] = true;
    saveCheckpoint(state);
  } else {
    console.log('⏩ staging_product_variants already marked complete.');
  }

  // Pass 4: Product Images (64,937 rows)
  if (!state.completedTables['staging_product_images']) {
    console.log('\n--- Pass 4: Staging Product Images (64,937 rows) ---');
    const stream = fs.createReadStream(PRODUCTS_CSV);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    const pipeline = new BatchPipeline('staging_product_images', 4);
    let isHeader = true;
    let inQuotedMultiline = false;
    let accumulated = '';
    let batch = [];
    let imageCount = 0;

    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      if (!inQuotedMultiline) accumulated = line;
      else accumulated += '\n' + line;

      let quoteCount = 0;
      for (let i = 0; i < accumulated.length; i++) {
        if (accumulated[i] === '"') quoteCount++;
      }
      if (quoteCount % 2 !== 0) { inQuotedMultiline = true; continue; }
      inQuotedMultiline = false;

      const f = parseCSVFields(accumulated);
      accumulated = '';

      const imageSrc = toStr(f[28]);
      if (imageSrc) {
        batch.push({
          product_id: f[0],
          image_url: imageSrc,
          image_type: toStr(f[27]),
          position: toInt(f[30]),
          width: toInt(f[31]),
          height: toInt(f[32]),
          alt_text: toStr(f[33])
        });

        if (batch.length >= 3000) {
          imageCount += batch.length;
          await pipeline.push(batch);
          process.stdout.write(`\r   -> Staged ${imageCount.toLocaleString()} images...`);
          batch = [];
        }
      }
    }
    if (batch.length > 0) {
      imageCount += batch.length;
      await pipeline.push(batch);
    }
    await pipeline.flush();

    console.log(`\n✅ Loaded ${imageCount.toLocaleString()} rows into staging_product_images.`);
    state.completedTables['staging_product_images'] = true;
    saveCheckpoint(state);
  } else {
    console.log('⏩ staging_product_images already marked complete.');
  }
}

// -------------------------------------------------------------
// STEP 5: Import staging_product_collections (948,607 rows)
// -------------------------------------------------------------
async function importProductCollections(state) {
  const tableName = 'staging_product_collections';
  if (state.completedTables[tableName]) {
    console.log(`⏩ ${tableName} already marked complete. Skipping.`);
    return;
  }
  console.log(`\n📦 Importing ${tableName} from product_collections.csv (948,607 rows)...`);
  const csvFile = path.resolve(NORMALIZED_DIR, 'product_collections.csv');
  const rl = readline.createInterface({
    input: fs.createReadStream(csvFile, 'utf8'),
    crlfDelay: Infinity
  });

  const pipeline = new BatchPipeline(tableName, 4);
  let isHeader = true;
  let batch = [];
  let count = 0;
  let acc = '';
  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    if (!line.trim() && !acc) continue;
    acc = acc ? acc + '\n' + line : line;
    let q = 0;
    for (let i = 0; i < acc.length; i++) {
      if (acc[i] === '"') q++;
    }
    if (q % 2 !== 0) continue;

    const f = parseCSVFields(acc);
    acc = '';
    batch.push({
      collection_id: f[0].replace(/^\uFEFF/, ''),
      collection_handle: toStr(f[1]),
      product_id: f[2],
      product_handle: toStr(f[3]),
      sort_position: toInt(f[4]),
      source_verified: toStr(f[5])
    });

    if (batch.length >= 3000) {
      count += batch.length;
      await pipeline.push(batch);
      process.stdout.write(`\r   -> Staged ${count.toLocaleString()} mappings...`);
      batch = [];
    }
  }
  if (batch.length > 0) {
    count += batch.length;
    await pipeline.push(batch);
  }
  await pipeline.flush();

  console.log(`\n✅ Loaded ${count.toLocaleString()} rows into ${tableName}.`);
  state.completedTables[tableName] = true;
  saveCheckpoint(state);
}

// -------------------------------------------------------------
// Main execution runner
// -------------------------------------------------------------
async function run() {
  console.log('====================================================');
  console.log('ILOVESURPRISES PHASE 5: AUTHORITATIVE STAGING IMPORT');
  console.log(`Target Supabase URL: ${supabaseUrl}`);
  console.log('====================================================');

  const state = loadCheckpoint();

  // Strict dependency-safe execution order
  // 1. Collections (must precede product_collections and conditions)
  await importCollections(state);

  // 2. Collection conditions
  await importCollectionConditions(state);

  // 3. Collection metafields
  await importCollectionMetafields(state);

  // 4. Products, Options, Option Values, Variants, Images
  await streamProductsCSV(state);

  // 5. Product Collections (must follow products and collections)
  await importProductCollections(state);

  console.log('\n🎉 ALL STAGING DATA IMPORTED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('\n❌ IMPORT FAILED WITH ERROR:', err);
  process.exit(1);
});
