const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColImages() {
  const colIds = ['289309589693', '155711438894', '155711471662', '328977285309', '160030261294'];
  for (const cid of colIds) {
    const { data: mappings } = await sb.from('product_collections')
      .select('product_id, products(product_id, title, product_images(image_url))')
      .eq('collection_id', cid)
      .limit(5);

    console.log(`\n=== Collection ID ${cid} ===`);
    mappings?.forEach(m => {
      console.log('Product:', m.products?.title, '| Images:', m.products?.product_images?.map(i => i.image_url));
    });
  }
}

checkColImages().catch(console.error);
