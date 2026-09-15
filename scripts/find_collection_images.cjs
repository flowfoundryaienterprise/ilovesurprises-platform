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

async function findCollectionImages() {
  const collections = [
    { handle: 'halloween', id: '289309589693' },
    { handle: 'christmas-candles-1', id: '155711438894' },
    { handle: 'cash-candles', id: '328977285309' },
    { handle: 'zodiac-cash-money-candles', id: '160030261294' }
  ];

  for (const col of collections) {
    const { data: pc } = await supabase
      .from('product_collections')
      .select('product_id')
      .eq('collection_id', col.id)
      .limit(3);

    console.log(`\nCollection ${col.handle}:`);
    if (pc && pc.length > 0) {
      const pids = pc.map(p => p.product_id);
      const { data: prods } = await supabase
        .from('products')
        .select('product_id, title, handle, product_images(image_url)')
        .in('product_id', pids);
      for (const p of prods || []) {
        const imgs = p.product_images?.map(i => i.image_url) || [];
        console.log(`  Product: "${p.title}" -> ${imgs[0] || 'no image'}`);
      }
    }
  }
}

findCollectionImages();
