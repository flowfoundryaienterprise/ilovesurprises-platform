const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

async function inspectRanges() {
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // Check staging_product_option_values id range
  const optValMin = await (await fetch(env.VITE_SUPABASE_URL + '/rest/v1/staging_product_option_values?select=id&order=id.asc&limit=1', { headers })).json();
  const optValMax = await (await fetch(env.VITE_SUPABASE_URL + '/rest/v1/staging_product_option_values?select=id&order=id.desc&limit=1', { headers })).json();
  console.log('staging_product_option_values min ID:', optValMin, 'max ID:', optValMax);

  const varRes = await fetch(env.VITE_SUPABASE_URL + '/rest/v1/staging_product_variants?select=variant_key,product_id&limit=5', { headers });
  console.log('staging_product_variants sample:', await varRes.json());
}

inspectRanges().catch(console.error);
