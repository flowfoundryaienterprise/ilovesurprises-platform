const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = '';
let serviceKey = '';
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = val;
    }
  }
}

const client = createClient(supabaseUrl, serviceKey);

const catMap = {
  'cat-jewelry-candles': 'Jewelry Candles',
  'cat-cash-candles': 'Cash Candles',
  'cat-wax-melts': 'Wax Melts',
  'cat-bath-body': 'Bath & Body',
  'cat-soaps': 'Soaps',
  'cat-slimes': 'Slimes'
};

async function run() {
  const allProducts = [];

  for (const [catId, catName] of Object.entries(catMap)) {
    const { data: prods, error } = await client
      .from('products')
      .select('*')
      .eq('category_id', catId)
      .not('image', 'is', null)
      .order('is_best_seller', { ascending: false })
      .order('rating', { ascending: false })
      .limit(18);

    if (error) {
      console.error('Error fetching for', catId, error.message);
      continue;
    }

    prods.forEach(p => {
      let scentNotes = undefined;
      if (Array.isArray(p.scent_notes)) {
        scentNotes = p.scent_notes.map(s => String(s));
      } else if (typeof p.scent_notes === 'string') {
        try {
          const parsed = JSON.parse(p.scent_notes);
          if (Array.isArray(parsed)) scentNotes = parsed.map(s => String(s));
          else scentNotes = [p.scent_notes];
        } catch {
          scentNotes = [p.scent_notes];
        }
      }

      allProducts.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: catName,
        price: Number(p.price) || 29.99,
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        surpriseType: p.surprise_type || 'mystery',
        surpriseValue: p.surprise_value || undefined,
        rating: Number(p.rating) || 4.8,
        reviewCount: Number(p.review_count) || 12,
        image: p.image,
        badge: p.badge || (p.is_best_seller ? 'Best Seller' : undefined),
        isBestSeller: Boolean(p.is_best_seller),
        isNew: Boolean(p.is_new),
        inStock: Boolean(p.in_stock),
        scentNotes,
        description: p.description || undefined
      });
    });
  }

  console.log('Total real products compiled:', allProducts.length);
  const outPath = path.join(__dirname, '..', 'src', 'data', 'products.ts');
  const code = 'import type { Product } from \'../types\';\n\nexport const productsData: Product[] = ' + JSON.stringify(allProducts, null, 2) + ';\n';
  fs.writeFileSync(outPath, code, 'utf8');
  console.log('Successfully wrote src/data/products.ts with real Supabase products!');
}

run().catch(console.error);
