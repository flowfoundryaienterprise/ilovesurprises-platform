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

async function inspectCatalogCategories() {
  console.log('--- Inspecting product types and category names ---');
  
  // Distinct product types
  const { data: prods } = await sb.from('products').select('product_type').limit(1000);
  const types = new Set(prods.map(p => p.product_type).filter(Boolean));
  console.log('Sample product_types (first 25):', Array.from(types).slice(0, 25));

  // Check how many products have 'cash' or 'jewelry' in title/product_type/tags
  const { count: cashCount } = await sb.from('products').select('*', { count: 'exact', head: true }).or('title.ilike.%cash%,product_type.ilike.%cash%,tags.ilike.%cash%');
  console.log('Products matching cash in title/type/tags:', cashCount);

  const { count: jewelryCount } = await sb.from('products').select('*', { count: 'exact', head: true }).or('title.ilike.%jewelry%,title.ilike.%jewellery%,title.ilike.%ring%,title.ilike.%necklace%,title.ilike.%earring%,title.ilike.%bracelet%,title.ilike.%diamond%,product_type.ilike.%jewelry%,tags.ilike.%jewelry%');
  console.log('Products matching jewelry/jewellery/ring/necklace/etc:', jewelryCount);

  // Check collections related to Cash or Jewelry
  const { data: cashCols } = await sb.from('collections').select('collection_id, handle, title, products_count').or('title.ilike.%cash%,handle.ilike.%cash%');
  console.log('Cash collections count:', cashCols?.length);

  const { data: jewelCols } = await sb.from('collections').select('collection_id, handle, title, products_count').or('title.ilike.%jewelry%,handle.ilike.%jewelry%,title.ilike.%jewel%,handle.ilike.%jewel%,title.ilike.%ring%,handle.ilike.%necklace%');
  console.log('Jewelry collections count:', jewelCols?.length);
}

inspectCatalogCategories().catch(console.error);
