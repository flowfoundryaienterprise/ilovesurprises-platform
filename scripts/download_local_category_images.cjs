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

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, response => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`Failed with status ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(destPath));
      });
    }).on('error', err => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function main() {
  console.log('Finding and downloading authentic images...');

  // 1. Cash Money Candles image
  console.log('\n--- 1. Cash Money Candles ---');
  const { data: cmcProducts } = await supabase
    .from('product_collections')
    .select('product_id, products(title, handle, product_images(image_url))')
    .eq('collection_id', '243231195325')
    .limit(10);

  let cmcSaved = false;
  for (const p of cmcProducts) {
    for (const img of (p.products?.product_images || [])) {
      const url = img.image_url;
      if (!url || !url.startsWith('http')) continue;
      try {
        const dest = path.join(__dirname, '../public/assets/ilovesurprises/categories/cash_money_candles.jpg');
        console.log(`Trying ${p.products.title}: ${url}`);
        await downloadFile(url, dest);
        console.log(`✅ Successfully saved cash_money_candles.jpg (${fs.statSync(dest).size} bytes)`);
        cmcSaved = true;
        break;
      } catch (err) {
        console.log(`  Failed (${err.message}), trying next...`);
      }
    }
    if (cmcSaved) break;
  }

  // 2. Candy image
  console.log('\n--- 2. Candy ---');
  const { data: candyProducts } = await supabase
    .from('product_collections')
    .select('product_id, products(title, handle, product_images(image_url))')
    .eq('collection_id', '329665446077')
    .limit(10);

  let candySaved = false;
  for (const p of candyProducts) {
    for (const img of (p.products?.product_images || [])) {
      const url = img.image_url;
      if (!url || !url.startsWith('http')) continue;
      try {
        const dest = path.join(__dirname, '../public/assets/ilovesurprises/categories/cash_candy.jpg');
        console.log(`Trying ${p.products.title}: ${url}`);
        await downloadFile(url, dest);
        console.log(`✅ Successfully saved cash_candy.jpg (${fs.statSync(dest).size} bytes)`);
        candySaved = true;
        break;
      } catch (err) {
        console.log(`  Failed (${err.message}), trying next...`);
      }
    }
    if (candySaved) break;
  }

  // 3. Chocolates image
  console.log('\n--- 3. Chocolates ---');
  const { data: chocProducts } = await supabase
    .from('product_collections')
    .select('product_id, products(title, handle, product_images(image_url))')
    .eq('collection_id', '162829631534')
    .limit(10);

  let chocSaved = false;
  for (const p of chocProducts) {
    for (const img of (p.products?.product_images || [])) {
      const url = img.image_url;
      if (!url || !url.startsWith('http')) continue;
      try {
        const dest = path.join(__dirname, '../public/assets/ilovesurprises/categories/chocolates.jpg');
        console.log(`Trying ${p.products.title}: ${url}`);
        await downloadFile(url, dest);
        console.log(`✅ Successfully saved chocolates.jpg (${fs.statSync(dest).size} bytes)`);
        chocSaved = true;
        break;
      } catch (err) {
        console.log(`  Failed (${err.message}), trying next...`);
      }
    }
    if (chocSaved) break;
  }

  console.log('\n=== DOWNLOAD SUMMARY ===');
  console.log('Cash Money Candles:', cmcSaved ? 'OK' : 'FAILED');
  console.log('Candy:', candySaved ? 'OK' : 'FAILED');
  console.log('Chocolates:', chocSaved ? 'OK' : 'FAILED');
}

main().catch(console.error);
