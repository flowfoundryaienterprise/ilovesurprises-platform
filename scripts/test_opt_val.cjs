const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

async function testOptVal() {
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
  };
  const t0 = Date.now();
  const res = await fetch(env.VITE_SUPABASE_URL + '/rest/v1/staging_product_option_values?id=gte.700000', {
    method: 'DELETE',
    headers,
  });
  console.log('Delete option_values >= 700000 status:', res.status, res.statusText, 'in', ((Date.now() - t0) / 1000).toFixed(2), 's');
}

testOptVal().catch(console.error);
