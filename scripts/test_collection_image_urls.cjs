const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

function testUrl(url) {
  return new Promise(resolve => {
    if (!url || !url.startsWith('http')) return resolve({ url, status: 'not-http' });
    const req = https.get(url, res => {
      resolve({ url, status: res.statusCode });
    });
    req.on('error', err => resolve({ url, status: 'error', error: err.message }));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve({ url, status: 'timeout' });
    });
  });
}

async function main() {
  const checkHandles = ['cash-money-candles', 'candy', 'chocolates'];

  for (const h of checkHandles) {
    console.log(`\n=== Checking collection: ${h} ===`);
    const { data: col } = await supabase.from('collections').select('*').eq('handle', h).single();
    if (!col) continue;

    const { data: prods } = await supabase
      .from('product_collections')
      .select('product_id, products(title, handle, product_images(image_url))')
      .eq('collection_id', col.collection_id)
      .limit(10);

    for (const p of prods) {
      const img = p.products?.product_images?.[0]?.image_url;
      if (img) {
        const check = await testUrl(img);
        console.log(`  Product "${p.products.title}":`);
        console.log(`    URL: ${img.slice(0, 80)}...`);
        console.log(`    Status: ${check.status}`);
        if (check.status === 200) {
          console.log(`    >>> FOUND WORKING 200 IMAGE! <<<`);
        }
      }
    }
  }
}

main().catch(console.error);
