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

async function inspectCollectionsSchema() {
  const { data, error } = await supabase.from('collections').select('*').limit(1);
  if (error) {
    console.error('Error selecting from collections:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Collections columns:', Object.keys(data[0]));
    console.log('Sample row:', data[0]);
  } else {
    console.log('No rows returned from collections');
  }

  // Also inspect product_collections
  const { data: pcData, error: pcError } = await supabase.from('product_collections').select('*').limit(1);
  if (pcError) {
    console.error('Error selecting from product_collections:', pcError);
  } else if (pcData && pcData.length > 0) {
    console.log('\nproduct_collections columns:', Object.keys(pcData[0]));
    console.log('Sample pc row:', pcData[0]);
  }
}

inspectCollectionsSchema();
