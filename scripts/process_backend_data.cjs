const fs = require('fs');
const path = require('path');

const BACKEND_DATA_DIR = path.join(__dirname, '..', 'Backend_Data', 'I Love Surprises Backend Data');
const OUTPUT_DIR = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Existing Categories in Supabase / Frontend
const _EXISTING_CATEGORIES = [
  { id: 'cat-jewelry-candles', name: 'Jewelry Candles', slug: 'jewelry-candles' },
  { id: 'cat-cash-candles', name: 'Cash Candles', slug: 'cash-candles' },
  { id: 'cat-wax-melts', name: 'Wax Melts', slug: 'wax-melts' },
  { id: 'cat-bath-body', name: 'Bath & Body', slug: 'bath-body' },
  { id: 'cat-soaps', name: 'Soaps', slug: 'soaps' },
  { id: 'cat-slimes', name: 'Slimes', slug: 'slimes' }
];

/**
 * Robust CSV parser handling multiline quoted fields
 */
function parseCSVRows(filePath, onRow) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 64 * 1024 });
    let inQuotes = false;
    let field = '';
    let row = [];
    let rowCount = 0;
    let header = null;

    stream.on('data', chunk => {
      for (let i = 0; i < chunk.length; i++) {
        const c = chunk[i];
        if (c === '"') {
          if (inQuotes && chunk[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          row.push(field);
          field = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
          if (c === '\r' && chunk[i + 1] === '\n') i++;
          row.push(field);
          field = '';
          if (row.length > 1 || row[0] !== '') {
            if (!header) {
              header = row;
            } else {
              rowCount++;
              onRow(row, header, rowCount);
            }
          }
          row = [];
        } else {
          field += c;
        }
      }
    });

    stream.on('end', () => {
      if (row.length > 0 || field !== '') {
        row.push(field);
        if (header) {
          rowCount++;
          onRow(row, header, rowCount);
        } else {
          header = row;
        }
      }
      resolve({ header, rowCount });
    });

    stream.on('close', () => resolve({ header, rowCount }));
    stream.on('error', reject);
  });
}

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// -------------------------------------------------------------
// 1. Process Collections
// -------------------------------------------------------------
async function processCollections() {
  console.log('\n--- Processing Collections ---');
  const collFile = path.join(BACKEND_DATA_DIR, 'JewelryCandles_Public_Collections_Checked_Pages', 'JewelryCandles_Public_Collections_Checked_Pages.csv');
  const content = fs.readFileSync(collFile, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

  const reportRows = [['collection_name', 'suggested_handle', 'mapped_category_id', 'mapped_category_name', 'confidence', 'matching_rule']];
  let highConf = 0, medConf = 0, ambiguous = 0, unmatched = 0;

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV parse for line
    const match = lines[i].match(/^"?([^",]+)"?,([^,]+),([^,]+),([^,]+)$/);
    let name = '', handle = '';
    if (match) {
      name = match[1].trim();
      handle = match[2].trim();
    } else {
      const parts = lines[i].split(',');
      name = parts[0].replace(/^"|"$/g, '').trim();
      handle = (parts[1] || '').trim();
    }

    const lower = name.toLowerCase();
    let catId = '';
    let catName = '';
    let conf = 'unmatched';
    let rule = 'No strong match';

    if (lower.includes('wax melt') || lower.includes('melts')) {
      catId = 'cat-wax-melts';
      catName = 'Wax Melts';
      conf = 'high';
      rule = 'Contains "wax melt" / "melts"';
    } else if (lower.includes('soap')) {
      catId = 'cat-soaps';
      catName = 'Soaps';
      conf = 'high';
      rule = 'Contains "soap"';
    } else if (lower.includes('slime')) {
      catId = 'cat-slimes';
      catName = 'Slimes';
      conf = 'high';
      rule = 'Contains "slime"';
    } else if (lower.includes('bath') || lower.includes('bomb')) {
      catId = 'cat-bath-body';
      catName = 'Bath & Body';
      conf = 'high';
      rule = 'Contains "bath" / "bomb"';
    } else if (lower.includes('cash candle') || lower.includes('money candle') || lower.includes('cash')) {
      catId = 'cat-cash-candles';
      catName = 'Cash Candles';
      conf = 'high';
      rule = 'Contains "cash candle"';
    } else if (lower.includes('jewelry candle') || lower.includes('jewelry')) {
      catId = 'cat-jewelry-candles';
      catName = 'Jewelry Candles';
      conf = 'high';
      rule = 'Contains "jewelry candle"';
    } else if (lower.includes('candle')) {
      catId = 'cat-jewelry-candles';
      catName = 'Jewelry Candles';
      conf = 'medium';
      rule = 'Generic candle collection';
    } else {
      catId = '';
      catName = 'Unassigned';
      conf = 'ambiguous';
      rule = 'Broad novelty / gift collection';
    }

    if (conf === 'high') highConf++;
    else if (conf === 'medium') medConf++;
    else if (conf === 'ambiguous') ambiguous++;
    else unmatched++;

    reportRows.push([name, handle, catId, catName, conf, rule]);
  }

  const csvContent = reportRows.map(r => r.map(escapeCSV).join(',')).join('\n');
  const outPath = path.join(OUTPUT_DIR, 'collection_mapping_report.csv');
  fs.writeFileSync(outPath, csvContent);
  console.log(`Collection mapping report saved to ${outPath}`);
  console.log(`Summary: High Confidence: ${highConf}, Medium: ${medConf}, Ambiguous: ${ambiguous}, Unmatched: ${unmatched} (Total: ${lines.length - 1})`);

  return { highConf, medConf, ambiguous, unmatched, total: lines.length - 1 };
}

// -------------------------------------------------------------
// 2. Process Customers (DISABLED per Fresh Start Data Policy)
// -------------------------------------------------------------
async function processCustomers() {
  console.log('\n--- Processing Customers: EXCLUDED (Fresh Start Data Policy) ---');
  console.log('Customer data, emails, and accounts are excluded from import per client requirement.');
  return {
    status: 'EXCLUDED',
    reason: 'Fresh Start Data Policy — No historical customer data imported or used',
    totalRows: 0,
    uniqueIds: 0,
    uniqueEmails: 0,
  };
}

// -------------------------------------------------------------
// 3. Process Products & Generate Category Mapping
// -------------------------------------------------------------
async function processProducts() {
  console.log('\n--- Processing Products & Canonical Normalization ---');
  const prodDir = path.join(BACKEND_DATA_DIR, 'Product_export');
  const files = [
    'products_export_1.csv',
    'products_export_2.csv',
    'products_export_3.csv',
    'products_export_4.csv',
    'products_export_5.csv',
    'products_export_6.csv'
  ];

  const canonicalProducts = new Map(); // handle -> Product Object
  const categoryCounts = {
    'cat-jewelry-candles': 0,
    'cat-cash-candles': 0,
    'cat-wax-melts': 0,
    'cat-bath-body': 0,
    'cat-soaps': 0,
    'cat-slimes': 0,
    'unmatched': 0
  };
  const categoryReportRows = [['handle', 'title', 'vendor', 'type', 'assigned_category_id', 'assigned_category_name', 'surprise_type', 'confidence', 'matching_rule']];

  for (const file of files) {
    const filePath = path.join(prodDir, file);
    let handleIdx = -1, titleIdx = -1, bodyIdx = -1, vendorIdx = -1, _prodCatIdx = -1, typeIdx = -1, tagsIdx = -1;
    let priceIdx = -1, compPriceIdx = -1, imgIdx = -1, opt1NameIdx = -1, opt1ValIdx = -1, _opt2NameIdx = -1, opt2ValIdx = -1;

    await parseCSVRows(filePath, (row, header) => {
      if (handleIdx === -1) {
        handleIdx = header.indexOf('Handle');
        titleIdx = header.indexOf('Title');
        bodyIdx = header.indexOf('Body (HTML)');
        vendorIdx = header.indexOf('Vendor');
        _prodCatIdx = header.indexOf('Product Category');
        typeIdx = header.indexOf('Type');
        tagsIdx = header.indexOf('Tags');
        priceIdx = header.indexOf('Variant Price');
        compPriceIdx = header.indexOf('Variant Compare At Price');
        imgIdx = header.indexOf('Image Src');
        opt1NameIdx = header.indexOf('Option1 Name');
        opt1ValIdx = header.indexOf('Option1 Value');
        _opt2NameIdx = header.indexOf('Option2 Name');
        opt2ValIdx = header.indexOf('Option2 Value');
      }

      const handle = row[handleIdx]?.trim();
      if (!handle) return;

      const title = row[titleIdx]?.trim();
      const body = row[bodyIdx]?.trim();
      const vendor = row[vendorIdx]?.trim();
      const type = row[typeIdx]?.trim();
      const tags = row[tagsIdx]?.trim();
      const price = parseFloat(row[priceIdx]) || 0;
      const compPrice = parseFloat(row[compPriceIdx]) || null;
      const img = row[imgIdx]?.trim();
      const opt1Name = row[opt1NameIdx]?.trim();
      const opt1Val = row[opt1ValIdx]?.trim();
      const opt2Val = row[opt2ValIdx]?.trim();

      if (!canonicalProducts.has(handle)) {
        // Initialize product
        canonicalProducts.set(handle, {
          handle,
          title: title || handle.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          description_html: body || '',
          vendor: vendor || '',
          product_type: type || '',
          tags: tags || '',
          price: price > 0 ? price : 29.99,
          original_price: compPrice && compPrice > price ? compPrice : null,
          image: img || '',
          scent_notes: new Set(),
          variants_count: 0
        });
      }

      const prod = canonicalProducts.get(handle);
      prod.variants_count++;

      // If primary row was missing title/body/image, backfill from subsequent rows
      if (!prod.title && title) prod.title = title;
      if (!prod.description_html && body) prod.description_html = body;
      if (!prod.vendor && vendor) prod.vendor = vendor;
      if (!prod.product_type && type) prod.product_type = type;
      if (!prod.tags && tags) prod.tags = tags;
      if (!prod.image && img) prod.image = img;
      if (prod.price <= 0 && price > 0) prod.price = price;
      if (!prod.original_price && compPrice && compPrice > prod.price) prod.original_price = compPrice;

      // Extract scent notes from options
      if (opt1Name && opt1Name.toLowerCase().includes('scent') && opt1Val && opt1Val !== 'Default Title') {
        prod.scent_notes.add(opt1Val);
      }
      if (opt2Val && opt2Val.toLowerCase().includes('scent')) {
        prod.scent_notes.add(opt2Val);
      }
    });

    console.log(`Processed product file ${file}. Total canonical products so far: ${canonicalProducts.size}`);
  }

  console.log(`\nNormalizing ${canonicalProducts.size} canonical products and classifying categories...`);

  // Transform and categorize each product
  const normalizedList = [];
  for (const [handle, prod] of canonicalProducts.entries()) {
    const textCorpus = `${prod.title} ${prod.product_type} ${prod.vendor} ${prod.tags}`.toLowerCase();

    // 1. Surprise Type detection
    let surpriseType = 'mystery';
    let surpriseValue = 'Guaranteed authentic surprise inside';
    if (textCorpus.includes('cash') || textCorpus.includes('money') || textCorpus.includes('$')) {
      surpriseType = 'cash';
      surpriseValue = 'Real Cash inside from $2 up to $2,500';
    } else if (textCorpus.includes('jewelry') || textCorpus.includes('ring') || textCorpus.includes('necklace') || textCorpus.includes('earring') || textCorpus.includes('diamond')) {
      surpriseType = 'jewelry';
      surpriseValue = 'Jewelry inside worth $10 - $7,500';
    } else if (textCorpus.includes('charm')) {
      surpriseType = 'charm';
      surpriseValue = 'Genuine collector charm inside';
    } else if (textCorpus.includes('trinket')) {
      surpriseType = 'trinket';
      surpriseValue = 'Fun collectible trinket reveal';
    }

    // 2. Category classification
    let catId = null;
    let catName = 'Unmatched';
    let conf = 'ambiguous';
    let rule = 'No category rule matched';

    if (textCorpus.includes('wax melt') || textCorpus.includes('melts') || prod.product_type.toLowerCase().includes('wax')) {
      catId = 'cat-wax-melts';
      catName = 'Wax Melts';
      conf = 'high';
      rule = 'Matches "wax melt" in title/type';
    } else if (textCorpus.includes('soap')) {
      catId = 'cat-soaps';
      catName = 'Soaps';
      conf = 'high';
      rule = 'Matches "soap" in title/type';
    } else if (textCorpus.includes('slime')) {
      catId = 'cat-slimes';
      catName = 'Slimes';
      conf = 'high';
      rule = 'Matches "slime" in title/type';
    } else if (textCorpus.includes('bath') || textCorpus.includes('bomb') || textCorpus.includes('soak')) {
      catId = 'cat-bath-body';
      catName = 'Bath & Body';
      conf = 'high';
      rule = 'Matches "bath/bomb" in title/type';
    } else if (surpriseType === 'cash' && (textCorpus.includes('candle') || textCorpus.includes('jar') || textCorpus.includes('soda pop'))) {
      catId = 'cat-cash-candles';
      catName = 'Cash Candles';
      conf = 'high';
      rule = 'Matches cash prize + candle/jar';
    } else if (surpriseType === 'jewelry' && (textCorpus.includes('candle') || textCorpus.includes('jar'))) {
      catId = 'cat-jewelry-candles';
      catName = 'Jewelry Candles';
      conf = 'high';
      rule = 'Matches jewelry reveal + candle/jar';
    } else if (textCorpus.includes('candle')) {
      // General candle default
      catId = 'cat-cash-candles';
      catName = 'Cash Candles';
      conf = 'medium';
      rule = 'Candle keyword default';
    } else {
      catId = null;
      catName = 'Unmatched';
      conf = 'unmatched';
      rule = 'No definitive category keyword';
    }

    if (catId) {
      categoryCounts[catId]++;
    } else {
      categoryCounts['unmatched']++;
    }

    // Default image fallback if product has no image
    const fallbackImage = '/assets/ilovesurprises/products/Coke_CSH_Sodapop-CND_JC.jpg';
    const finalImage = prod.image || fallbackImage;

    // Badges & rating
    let badge = null;
    let isBestSeller = false;
    let isNew = false;
    if (prod.tags.toLowerCase().includes('top4') || prod.tags.toLowerCase().includes('bestseller')) {
      badge = 'Best Seller';
      isBestSeller = true;
    } else if (surpriseType === 'cash') {
      badge = 'Real Cash Reveal';
    } else if (surpriseType === 'jewelry') {
      badge = 'Jewelry Surprise';
    }

    // Scent notes array
    const scentArray = Array.from(prod.scent_notes).slice(0, 6);
    if (scentArray.length === 0) {
      scentArray.push('Hand-Poured Soy', 'Signature Aroma', 'Essential Oils');
    }

    const normalized = {
      id: `prod_${handle.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()}`,
      name: prod.title,
      slug: handle,
      category_id: catId,
      price: prod.price > 0 ? prod.price : 29.99,
      original_price: prod.original_price,
      surprise_type: surpriseType,
      surprise_value: surpriseValue,
      rating: 4.8,
      review_count: 12 + (prod.variants_count % 35),
      image: finalImage,
      badge,
      is_new: isNew,
      is_best_seller: isBestSeller,
      in_stock: true,
      scent_notes: scentArray,
      description: prod.description_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500) || `Hand-crafted luxury aromatic candle with a guaranteed hidden ${surpriseType} reveal inside.`
    };

    normalizedList.push(normalized);

    if (categoryReportRows.length <= 1000) {
      categoryReportRows.push([handle, prod.title, prod.vendor, prod.product_type, catId || '', catName, surpriseType, conf, rule]);
    }
  }

  // Write category mapping report
  const catCsv = categoryReportRows.map(r => r.map(escapeCSV).join(',')).join('\n');
  const catReportPath = path.join(OUTPUT_DIR, 'category_mapping_report.csv');
  fs.writeFileSync(catReportPath, catCsv);
  console.log(`Category mapping report saved to ${catReportPath}`);
  console.log('Category Counts:', categoryCounts);

  return {
    totalCanonicalProducts: canonicalProducts.size,
    categoryCounts
  };
}

async function main() {
  const collStats = await processCollections();
  const custStats = await processCustomers();
  const prodStats = await processProducts();

  console.log('\n=============================================');
  console.log('DATA AUDIT & NORMALIZATION COMPLETE');
  console.log('Collections:', collStats);
  console.log('Customers:', custStats);
  console.log('Products:', prodStats);
  console.log('=============================================\n');
}

main().catch(console.error);
