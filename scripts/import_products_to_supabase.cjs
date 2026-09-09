const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local securely
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
  console.error('ERROR: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const BACKEND_DATA_DIR = path.join(__dirname, '..', 'Backend_Data', 'I Love Surprises Backend Data');

const EXISTING_CATEGORIES = [
  { id: 'cat-jewelry-candles', name: 'Jewelry Candles', slug: 'jewelry-candles', tagline: 'Luxury jewelry in every candle', description: 'Hand-poured aromatic soy candles with real rings, necklaces, or earrings.', image: '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg', featured: true },
  { id: 'cat-cash-candles', name: 'Cash Candles', slug: 'cash-candles', tagline: 'Find cash prizes inside', description: 'Premium scented candles with real surprise cash bills hidden inside.', image: '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg', featured: true },
  { id: 'cat-wax-melts', name: 'Wax Melts', slug: 'wax-melts', tagline: 'Scented melts you will love', description: 'Artisan hand-crafted scented wax melts with hidden surprise treasures.', image: '/assets/ilovesurprises/categories/Cat-2_Figurines_JWL_wax_melts.jpg', featured: true },
  { id: 'cat-bath-body', name: 'Bath & Body', slug: 'bath-body', tagline: 'Pamper yourself every day', description: 'Soothing bath bombs, comforting hugs and plush bath rituals.', image: '/assets/ilovesurprises/categories/Heartfelt-Hugs.jpg', featured: true },
  { id: 'cat-soaps', name: 'Soaps', slug: 'soaps', tagline: 'Handmade & skin loving', description: 'Ultra-nourishing organic goat milk soaps crafted with essential oils.', image: '/assets/ilovesurprises/categories/goats_milk_soaps.jpg', featured: true },
  { id: 'cat-slimes', name: 'Slimes', slug: 'slimes', tagline: 'Fun, colorful & surprising', description: 'Sweet scented gourmet surprise slimes and birthday celebration treats.', image: '/assets/ilovesurprises/categories/BDayCake.webp', featured: true }
];

function parseCSVRows(filePath, onRow) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 64 * 1024 });
    let leftover = '';
    let inQuotes = false;
    let row = [];
    let field = '';
    let header = null;
    let rowCount = 0;

    stream.on('data', (chunk) => {
      const text = leftover + chunk;
      leftover = '';
      const len = text.length;

      for (let i = 0; i < len; i++) {
        const c = text[i];
        if (c === '"') {
          if (inQuotes && text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          row.push(field);
          field = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
          if (c === '\r' && text[i + 1] === '\n') i++;
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

    stream.on('error', reject);
  });
}

async function run() {
  console.log('====================================================');
  console.log('STARTING LIVE SUPABASE CATALOG IMPORT');
  console.log('====================================================');

  // STEP 1: Categories
  console.log('\nStep 1: Upserting 6 core categories into public.categories...');
  const { error: catErr } = await supabase.from('categories').upsert(EXISTING_CATEGORIES, { onConflict: 'id' });
  if (catErr) {
    console.error('Category upsert failed:', catErr.message);
    process.exit(1);
  }
  console.log('Categories successfully upserted into Supabase.');

  // STEP 2: Normalize products from the 6 CSV exports
  console.log('\nStep 2: Processing and normalizing 6 product CSV exports...');
  const prodDir = path.join(BACKEND_DATA_DIR, 'Product_export');
  const files = [
    'products_export_1.csv',
    'products_export_2.csv',
    'products_export_3.csv',
    'products_export_4.csv',
    'products_export_5.csv',
    'products_export_6.csv'
  ];

  const canonicalProducts = new Map();
  let totalSourceRows = 0;

  for (const file of files) {
    const filePath = path.join(prodDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }

    let handleIdx = -1, titleIdx = -1, bodyIdx = -1, vendorIdx = -1, typeIdx = -1, tagsIdx = -1;
    let priceIdx = -1, compPriceIdx = -1, imgIdx = -1, opt1NameIdx = -1, opt1ValIdx = -1, opt2ValIdx = -1;

    const { rowCount } = await parseCSVRows(filePath, (row, header) => {
      if (handleIdx === -1) {
        handleIdx = header.indexOf('Handle');
        titleIdx = header.indexOf('Title');
        bodyIdx = header.indexOf('Body (HTML)');
        vendorIdx = header.indexOf('Vendor');
        typeIdx = header.indexOf('Type');
        tagsIdx = header.indexOf('Tags');
        priceIdx = header.indexOf('Variant Price');
        compPriceIdx = header.indexOf('Variant Compare At Price');
        imgIdx = header.indexOf('Image Src');
        opt1NameIdx = header.indexOf('Option1 Name');
        opt1ValIdx = header.indexOf('Option1 Value');
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
        canonicalProducts.set(handle, {
          handle,
          title: title || handle.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          body: body || '',
          vendor: vendor || '',
          type: type || '',
          tags: tags || '',
          price: price > 0 ? price : 29.99,
          compPrice: compPrice && compPrice > price ? compPrice : null,
          image: img || '',
          scentNotes: new Set(),
          variantsCount: 0
        });
      }

      const p = canonicalProducts.get(handle);
      p.variantsCount++;
      if (!p.title && title) p.title = title;
      if (!p.body && body) p.body = body;
      if (!p.vendor && vendor) p.vendor = vendor;
      if (!p.type && type) p.type = type;
      if (!p.tags && tags) p.tags = tags;
      if (!p.image && img) p.image = img;
      if (p.price <= 0 && price > 0) p.price = price;
      if (!p.compPrice && compPrice && compPrice > p.price) p.compPrice = compPrice;

      if (opt1Name && opt1Name.toLowerCase().includes('scent') && opt1Val && opt1Val !== 'Default Title') {
        p.scentNotes.add(opt1Val);
      }
      if (opt2Val && opt2Val.toLowerCase().includes('scent')) {
        p.scentNotes.add(opt2Val);
      }
    });

    totalSourceRows += rowCount;
    console.log(`Parsed ${file}: ${rowCount.toLocaleString()} rows. Total unique products: ${canonicalProducts.size.toLocaleString()}`);
  }

  console.log(`\nSource Rows Processed: ${totalSourceRows.toLocaleString()}`);
  console.log(`Unique Canonical Products: ${canonicalProducts.size.toLocaleString()}`);

  // STEP 3: Transform into Supabase row format
  console.log('\nStep 3: Transforming into database records...');
  const rowsToInsert = [];

  for (const [handle, prod] of canonicalProducts.entries()) {
    const textCorpus = `${prod.title} ${prod.type} ${prod.vendor} ${prod.tags}`.toLowerCase();

    // Surprise type
    let surpriseType = 'mystery';
    let surpriseValue = 'Authentic surprise reveal inside';
    if (textCorpus.includes('cash') || textCorpus.includes('money') || textCorpus.includes('$')) {
      surpriseType = 'cash';
      surpriseValue = 'Real Cash inside up to $2,500';
    } else if (textCorpus.includes('jewelry') || textCorpus.includes('ring') || textCorpus.includes('necklace') || textCorpus.includes('earring') || textCorpus.includes('diamond')) {
      surpriseType = 'jewelry';
      surpriseValue = 'Jewelry inside valued $10 - $7,500';
    } else if (textCorpus.includes('charm')) {
      surpriseType = 'charm';
      surpriseValue = 'Collector charm reveal inside';
    }

    // Category
    let catId = 'cat-jewelry-candles';
    if (textCorpus.includes('wax melt') || textCorpus.includes('melts') || prod.type.toLowerCase().includes('wax')) {
      catId = 'cat-wax-melts';
    } else if (textCorpus.includes('soap')) {
      catId = 'cat-soaps';
    } else if (textCorpus.includes('slime')) {
      catId = 'cat-slimes';
    } else if (textCorpus.includes('bath') || textCorpus.includes('bomb') || textCorpus.includes('soak')) {
      catId = 'cat-bath-body';
    } else if (surpriseType === 'cash') {
      catId = 'cat-cash-candles';
    }

    const cleanHandle = handle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const cleanDescription = prod.body
      ? prod.body.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000)
      : null;

    rowsToInsert.push({
      id: `prod_${cleanHandle}`,
      name: prod.title.slice(0, 255),
      slug: handle.slice(0, 255),
      category_id: catId,
      price: prod.price,
      original_price: prod.compPrice,
      surprise_type: surpriseType,
      surprise_value: surpriseValue,
      rating: 4.8,
      review_count: Math.min(250, prod.variantsCount * 4 + 8),
      image: prod.image || 'https://cdn.shopify.com/s/files/1/0249/7740/products/generic-candle.jpg',
      badge: prod.price > 35 ? 'Bestseller' : null,
      is_new: false,
      is_best_seller: prod.variantsCount > 3,
      in_stock: true,
      scent_notes: Array.from(prod.scentNotes).slice(0, 10),
      description: cleanDescription
    });
  }

  // STEP 4: Batch Upsert into Supabase
  console.log(`\nStep 4: Commencing batch upsert of ${rowsToInsert.length.toLocaleString()} products...`);
  const BATCH_SIZE = 500;
  let insertedCount = 0;

  for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
    const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
    let attempts = 0;
    let success = false;

    while (attempts < 3 && !success) {
      attempts++;
      const { error } = await supabase.from('products').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`Batch ${i / BATCH_SIZE + 1} attempt ${attempts} error:`, error.message);
        if (attempts >= 3) {
          throw new Error(`Failed to upsert batch starting at index ${i}: ${error.message}`);
        }
        await new Promise(r => setTimeout(r, 1000 * attempts));
      } else {
        success = true;
        insertedCount += batch.length;
      }
    }

    if ((i + BATCH_SIZE) % 5000 < BATCH_SIZE || i + BATCH_SIZE >= rowsToInsert.length) {
      const pct = ((insertedCount / rowsToInsert.length) * 100).toFixed(1);
      console.log(`Progress: ${insertedCount.toLocaleString()} / ${rowsToInsert.length.toLocaleString()} products (${pct}%) upserted.`);
    }
  }

  console.log('\n====================================================');
  console.log('LIVE DATABASE RECONCILIATION AUDIT');
  console.log('====================================================');

  // Verify live counts
  const { count: liveCatCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  const { count: liveProdCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: liveProfCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

  console.log(`Source CSV rows parsed:       ${totalSourceRows.toLocaleString()}`);
  console.log(`Unique handles normalized:    ${canonicalProducts.size.toLocaleString()}`);
  console.log(`Products upserted to Supabase: ${insertedCount.toLocaleString()}`);
  console.log(`Live Supabase Products count:  ${liveProdCount?.toLocaleString()}`);
  console.log(`Live Supabase Categories count: ${liveCatCount?.toLocaleString()}`);
  console.log(`Live Supabase Profiles count:  ${liveProfCount?.toLocaleString()}`);

  if (liveProdCount === canonicalProducts.size) {
    console.log('\nRECONCILIATION RESULT: PERFECT 100% MATCH!');
  } else {
    console.log(`\nRECONCILIATION NOTE: Live count is ${liveProdCount} vs expected ${canonicalProducts.size}`);
  }
}

run().catch(err => {
  console.error('Fatal error during catalog import:', err);
  process.exit(1);
});
