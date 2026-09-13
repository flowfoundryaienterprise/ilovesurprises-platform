const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

async function inspectVariantSchema() {
  const res = await fetch(env.VITE_SUPABASE_URL + '/rest/v1/', {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
  const spec = await res.json();
  console.log('\n=== STAGING_PRODUCT_VARIANTS COLUMNS & TYPES ===');
  const variantProps = spec.definitions.staging_product_variants.properties;
  for (const [col, info] of Object.entries(variantProps)) {
    console.log(`- ${col}: type=${info.type}, format=${info.format || 'none'}`);
  }

  console.log('\n=== STAGING_PRODUCTS COLUMNS & TYPES ===');
  const productProps = spec.definitions.staging_products.properties;
  for (const [col, info] of Object.entries(productProps)) {
    console.log(`- ${col}: type=${info.type}, format=${info.format || 'none'}`);
  }
}

inspectVariantSchema().catch(console.error);
