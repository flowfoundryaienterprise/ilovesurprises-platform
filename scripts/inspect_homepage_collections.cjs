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

async function inspectHomepageCollections() {
  const handles = ['halloween', 'christmas-candles-1', 'cash-candles', 'zodiac-cash-money-candles'];
  console.log('Querying collections by handle:', handles);
  
  const { data: cols, error: colErr } = await supabase
    .from('collections')
    .select('collection_id, title, handle, body_html, image_url')
    .in('handle', handles);

  if (colErr) {
    console.error('Error fetching collections:', colErr);
    return;
  }

  for (const col of cols) {
    const { count, error: countErr } = await supabase
      .from('product_collections')
      .select('product_id', { count: 'exact', head: true })
      .eq('collection_id', col.collection_id);

    console.log(`\nCollection: "${col.title}"`);
    console.log(`  ID: ${col.collection_id}`);
    console.log(`  Handle: ${col.handle}`);
    console.log(`  Image: ${col.image_url}`);
    console.log(`  Body length: ${col.body_html ? col.body_html.length : 0} chars`);
    if (col.body_html) {
      console.log(`  Body preview: ${col.body_html.slice(0, 120).replace(/\n/g, ' ')}...`);
    }
    console.log(`  Product count in product_collections: ${count}`);
  }
}

inspectHomepageCollections();
