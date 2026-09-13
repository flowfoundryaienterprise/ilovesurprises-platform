const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

async function testPrefixDelete() {
  // Test count of product_id starting with '1'
  const countUrl = env.VITE_SUPABASE_URL + '/rest/v1/staging_product_variants?product_id=like.1*';
  const cRes = await fetch(countUrl, {
    method: 'HEAD',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
      Prefer: 'count=exact',
    },
  });
  console.log('Count for product_id=like.1*:', cRes.headers.get('content-range'));

  const t0 = Date.now();
  const delUrl = env.VITE_SUPABASE_URL + '/rest/v1/staging_product_variants?product_id=like.1*';
  const delRes = await fetch(delUrl, {
    method: 'DELETE',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  console.log('Delete status:', delRes.status, delRes.statusText, 'in', ((Date.now() - t0) / 1000).toFixed(2), 's');
}

testPrefixDelete().catch(console.error);
