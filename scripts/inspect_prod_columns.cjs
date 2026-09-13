const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envLocalPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectProductsTable() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
  // Also check openapi / rest schema for table columns
  const res = await fetch(env.VITE_SUPABASE_URL + '/rest/v1/', {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
  const spec = await res.json();
  if (spec.definitions && spec.definitions.products) {
    console.log('products columns:', Object.keys(spec.definitions.products.properties));
  }
  if (spec.definitions && spec.definitions.staging_products) {
    console.log('staging_products columns:', Object.keys(spec.definitions.staging_products.properties));
    console.log('total_inventory_qty spec:', spec.definitions.staging_products.properties.total_inventory_qty);
  }
}

inspectProductsTable().catch(console.error);
