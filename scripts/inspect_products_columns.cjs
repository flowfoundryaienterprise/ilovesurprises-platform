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

async function inspectProductsColumns() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('Error selecting from products:', error);
    return;
  }
  console.log('Products columns:', Object.keys(data[0]));
  console.log('Sample product:', data[0]);
}

inspectProductsColumns();
