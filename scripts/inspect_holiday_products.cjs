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

async function inspectHolidayProducts() {
  // Check Halloween collection products
  const { data: halloweenPc } = await supabase
    .from('product_collections')
    .select('product_id')
    .eq('collection_id', '289309589693')
    .limit(5);

  const pids = halloweenPc.map(p => p.product_id);
  const { data: prods } = await supabase
    .from('products')
    .select('product_id, title, product_type, tags, body_html')
    .in('product_id', pids);

  console.log('Halloween sample products:');
  for (const p of prods) {
    console.log(`Title: "${p.title}"`);
    console.log(`  Product Type: ${p.product_type}`);
    console.log(`  Tags: ${p.tags}`);
    console.log(`  Body preview: ${p.body_html ? p.body_html.slice(0, 100).replace(/\n/g, ' ') : ''}...`);
  }
}

inspectHolidayProducts();
