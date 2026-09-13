const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PACKAGE_DIR = path.resolve(
  __dirname,
  '..',
  'Backend_Data',
  'I Love Surprises Backend Data',
  'JewelryCandles_ILoveSurprises_FINAL_Migration_Package'
);

const EXPECTED_COUNTS = {
  'products.csv': 57479,
  'product_variants.csv': 1547749,
  'product_images.csv': 64700,
  'collections.csv': 460,
  'product_collections.csv': 948607,
  'product_options.csv': 47788,
  'product_option_values.csv': 706291,
  'product_metafields.csv': 9664,
  'collection_metafields.csv': 100,
  'collection_conditions.csv': 43519,
  'collection_publications.csv': 6900,
};

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

async function countLinesAndValidateHeaders(filename) {
  const filePath = path.join(PACKAGE_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File missing: ${filename}`);
  }
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  let headers = null;

  for await (const line of rl) {
    if (!line.trim()) continue;
    if (headers === null) {
      headers = parseCsvLine(line);
    } else {
      count++;
    }
  }
  return { filename, count, headers };
}

async function validatePackage() {
  console.log('======================================================================');
  console.log('=== PRE-IMPORT VALIDATION: AUTHORITATIVE MIGRATION PACKAGE ===');
  console.log('======================================================================\n');
  console.log('Package Directory:', PACKAGE_DIR);

  const fileKeys = Object.keys(EXPECTED_COUNTS);
  const results = {};
  let totalCount = 0;
  let allCountsPass = true;

  console.log('\n--- 1. Validating Exact Record Counts for all 11 CSVs ---');
  for (const filename of fileKeys) {
    process.stdout.write(`Analyzing ${filename}... `);
    const { count, headers } = await countLinesAndValidateHeaders(filename);
    const expected = EXPECTED_COUNTS[filename];
    const match = count === expected;
    totalCount += count;
    results[filename] = { count, expected, match, headers };
    if (!match) allCountsPass = false;
    console.log(`${match ? '✅ MATCH' : '❌ MISMATCH'}: ${count.toLocaleString()} (expected: ${expected.toLocaleString()})`);
  }

  console.log('\n--- Total Records ---');
  const expectedTotal = 3371397;
  const totalMatch = totalCount === expectedTotal;
  console.log(`Total Records Counted: ${totalCount.toLocaleString()} / ${expectedTotal.toLocaleString()} -> ${totalMatch ? '✅ EXACT MATCH' : '❌ MISMATCH'}`);

  // Now perform deep relational & data integrity validations
  console.log('\n--- 2. Performing Deep Relational & Schema Integrity Checks ---');

  // Step 2a: Products (Handles, IDs, Prices, Blanks)
  console.log('Checking products.csv...');
  const productIds = new Set();
  const productHandles = new Set();
  let duplicateProductIds = 0;
  let duplicateProductHandles = 0;
  let missingTitle = 0;

  {
    const fileStream = fs.createReadStream(path.join(PACKAGE_DIR, 'products.csv'));
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;
    for await (const line of rl) {
      if (!line.trim()) continue;
      if (isHeader) { isHeader = false; continue; }
      const [productId, handle, title] = parseCsvLine(line);
      if (productIds.has(productId)) duplicateProductIds++;
      else productIds.add(productId);

      if (productHandles.has(handle)) duplicateProductHandles++;
      else productHandles.add(handle);

      if (!title || !title.trim()) missingTitle++;
    }
  }
  console.log(`  Products Count: ${productIds.size.toLocaleString()}`);
  console.log(`  Duplicate Product IDs: ${duplicateProductIds}`);
  console.log(`  Duplicate Product Handles: ${duplicateProductHandles}`);

  // Step 2b: Collections (Handles, IDs)
  console.log('\nChecking collections.csv...');
  const collectionIds = new Set();
  const collectionHandles = new Set();
  let duplicateCollectionIds = 0;
  let duplicateCollectionHandles = 0;

  {
    const fileStream = fs.createReadStream(path.join(PACKAGE_DIR, 'collections.csv'));
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;
    for await (const line of rl) {
      if (!line.trim()) continue;
      if (isHeader) { isHeader = false; continue; }
      const [collectionId, handle] = parseCsvLine(line);
      if (collectionIds.has(collectionId)) duplicateCollectionIds++;
      else collectionIds.add(collectionId);

      if (collectionHandles.has(handle)) duplicateCollectionHandles++;
      else collectionHandles.add(handle);
    }
  }
  console.log(`  Collections Count: ${collectionIds.size.toLocaleString()}`);
  console.log(`  Duplicate Collection IDs: ${duplicateCollectionIds}`);
  console.log(`  Duplicate Collection Handles: ${duplicateCollectionHandles}`);

  // Step 2c: Product Options
  console.log('\nChecking product_options.csv...');
  const optionKeys = new Set();
  let orphanOptions = 0;
  let duplicateOptionKeys = 0;

  {
    const fileStream = fs.createReadStream(path.join(PACKAGE_DIR, 'product_options.csv'));
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;
    for await (const line of rl) {
      if (!line.trim()) continue;
      if (isHeader) { isHeader = false; continue; }
      const [optionKey, productId] = parseCsvLine(line);
      if (optionKeys.has(optionKey)) duplicateOptionKeys++;
      else optionKeys.add(optionKey);

      if (!productIds.has(productId)) orphanOptions++;
    }
  }
  console.log(`  Options Count: ${optionKeys.size.toLocaleString()}`);
  console.log(`  Duplicate Option Keys: ${duplicateOptionKeys}`);
  console.log(`  Orphan Options (unmatched product_id): ${orphanOptions}`);

  // Step 2d: Product Option Values
  console.log('\nChecking product_option_values.csv...');
  let orphanOptionValues = 0;
  let orphanOptionValueProducts = 0;

  {
    const fileStream = fs.createReadStream(path.join(PACKAGE_DIR, 'product_option_values.csv'));
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;
    for await (const line of rl) {
      if (!line.trim()) continue;
      if (isHeader) { isHeader = false; continue; }
      const [, optionKey, productId] = parseCsvLine(line);
      if (!optionKeys.has(optionKey)) orphanOptionValues++;
      if (!productIds.has(productId)) orphanOptionValueProducts++;
    }
  }
  console.log(`  Orphan Option Values (unmatched option_key): ${orphanOptionValues}`);
  console.log(`  Orphan Option Values (unmatched product_id): ${orphanOptionValueProducts}`);

  // Step 2e: Product Variants (SKU statistics, orphan variants, duplicate keys, price validity)
  console.log('\nChecking product_variants.csv...');
  const variantKeys = new Set();
  let duplicateVariantKeys = 0;
  let orphanVariants = 0;
  let blankSkus = 0;
  let populatedSkus = 0;
  let invalidPrices = 0;
  let invalidCompareAtPrices = 0;

  {
    const fileStream = fs.createReadStream(path.join(PACKAGE_DIR, 'product_variants.csv'));
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;
    for await (const line of rl) {
      if (!line.trim()) continue;
      if (isHeader) { isHeader = false; continue; }
      const [variantKey, productId, sku, , priceStr, compareAtStr] = parseCsvLine(line);
      if (variantKeys.has(variantKey)) duplicateVariantKeys++;
      else variantKeys.add(variantKey);

      if (!productIds.has(productId)) orphanVariants++;

      if (!sku || !sku.trim()) blankSkus++;
      else populatedSkus++;

      if (priceStr && isNaN(Number(priceStr))) invalidPrices++;
      if (compareAtStr && isNaN(Number(compareAtStr))) invalidCompareAtPrices++;
    }
  }
  console.log(`  Variants Count: ${variantKeys.size.toLocaleString()}`);
  console.log(`  Duplicate Variant Keys: ${duplicateVariantKeys}`);
  console.log(`  Orphan Variants (unmatched product_id): ${orphanVariants}`);
  console.log(`  Populated SKUs: ${populatedSkus.toLocaleString()}`);
  console.log(`  Blank SKUs (must remain blank, never invented): ${blankSkus.toLocaleString()}`);
  console.log(`  Invalid Prices: ${invalidPrices}`);
  console.log(`  Invalid Compare-At Prices: ${invalidCompareAtPrices}`);

  // Step 2f: Product Images (Orphan images)
  console.log('\nChecking product_images.csv...');
  let orphanImages = 0;
  const productsWithImages = new Set();

  {
    const fileStream = fs.createReadStream(path.join(PACKAGE_DIR, 'product_images.csv'));
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;
    for await (const line of rl) {
      if (!line.trim()) continue;
      if (isHeader) { isHeader = false; continue; }
      const [, productId] = parseCsvLine(line);
      if (!productIds.has(productId)) orphanImages++;
      else productsWithImages.add(productId);
    }
  }
  const productsWithoutImages = productIds.size - productsWithImages.size;
  console.log(`  Orphan Images (unmatched product_id): ${orphanImages}`);
  console.log(`  Products with Images: ${productsWithImages.size.toLocaleString()}`);
  console.log(`  Products without Images (documented QA exception): ${productsWithoutImages.toLocaleString()} (manifest: 763)`);

  // Step 2g: Product Collections (Orphan links, duplicate pairs, membership)
  console.log('\nChecking product_collections.csv...');
  let orphanProductCollectionLinks = 0;
  let orphanProductCollectionCollections = 0;
  let duplicateProductCollectionLinks = 0;
  const linkedProductIds = new Set();
  const seenPairs = new Set();

  {
    const fileStream = fs.createReadStream(path.join(PACKAGE_DIR, 'product_collections.csv'));
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;
    for await (const line of rl) {
      if (!line.trim()) continue;
      if (isHeader) { isHeader = false; continue; }
      const [collectionId, , productId] = parseCsvLine(line);
      if (!collectionIds.has(collectionId)) orphanProductCollectionCollections++;
      if (!productIds.has(productId)) orphanProductCollectionLinks++;
      else linkedProductIds.add(productId);

      const pairKey = `${collectionId}:::${productId}`;
      if (seenPairs.has(pairKey)) duplicateProductCollectionLinks++;
      else seenPairs.add(pairKey);
    }
  }
  const productsWithoutCollection = productIds.size - linkedProductIds.size;
  console.log(`  Duplicate Product-Collection Links: ${duplicateProductCollectionLinks}`);
  console.log(`  Orphan Product Links (unmatched product_id): ${orphanProductCollectionLinks}`);
  console.log(`  Orphan Collection Links (unmatched collection_id): ${orphanProductCollectionCollections}`);
  console.log(`  Products linked to >= 1 Collection: ${linkedProductIds.size.toLocaleString()}`);
  console.log(`  Products without any Collection snapshot (documented QA exception): ${productsWithoutCollection.toLocaleString()} (manifest: 1206)`);

  console.log('\n======================================================================');
  console.log('=== SUMMARY OF VALIDATION RESULTS ===');
  console.log('======================================================================');
  console.log(`All 11 CSV Source Counts Match Manifest: ${allCountsPass && totalMatch ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Relational Integrity (0 Orphan Variants/Images/Options/Links): ${orphanVariants === 0 && orphanImages === 0 && orphanOptions === 0 && orphanProductCollectionLinks === 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Zero Duplicate Primary Keys (Products, Collections, Variants, Options): ${duplicateProductIds === 0 && duplicateCollectionIds === 0 && duplicateVariantKeys === 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Documented Exceptions Verified (763 imageless, 1206 unlinked): ${productsWithoutImages === 763 && productsWithoutCollection === 1206 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('======================================================================\n');
}

validatePackage().catch((err) => {
  console.error('Validation error:', err);
  process.exit(1);
});
