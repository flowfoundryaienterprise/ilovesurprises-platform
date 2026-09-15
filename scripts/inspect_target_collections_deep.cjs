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

async function inspectCollections() {
  const colIds = ['289309589693', '155711438894', '155711471662', '328913879229', '328977285309', '160030261294'];
  for (const cid of colIds) {
    const { data: col } = await sb.from('collections').select('*').eq('collection_id', cid).single();
    const { count } = await sb.from('product_collections').select('*', { count: 'exact', head: true }).eq('collection_id', cid);
    console.log(`\nCol ID: ${cid} | Handle: ${col?.handle} | Title: ${col?.title} | DB count: ${col?.products_count} | Mapped join count: ${count}`);
    console.log('Body HTML length:', col?.body_html ? col.body_html.length : 0);
    console.log('Image URL:', col?.image_url);
    
    // Sample 3 products
    const { data: prods } = await sb.from('product_collections')
      .select('product_id, products(product_id, title, handle)')
      .eq('collection_id', cid)
      .limit(3);
    console.log('Sample products:', prods?.map(p => p.products?.title));
  }
}

inspectCollections().catch(console.error);
