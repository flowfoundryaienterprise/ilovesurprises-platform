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

async function inspectTargetPrices() {
  console.log('--- Inspecting current variant prices in collections ---');
  const cols = [
    { name: 'Giant Jewelry Wax Melts', id: '322749989053', targetPrice: 34.99 },
    { name: 'Cash Wax Melts (Figurines)', id: '293598757053', targetPrice: 34.99 },
    { name: 'Cash Surprise Bear & Melt Bundles', id: '329533358269', targetPrice: 59.99 }
  ];

  for (const c of cols) {
    const { data: pcols } = await sb.from('product_collections').select('product_id').eq('collection_id', c.id);
    const pids = pcols?.map(p => p.product_id) || [];
    console.log(`\nCollection: ${c.name} (${c.id}) -> ${pids.length} products`);
    if (pids.length > 0) {
      const { data: variants } = await sb.from('product_variants').select('variant_id, product_id, price').in('product_id', pids.slice(0, 10));
      const prices = Array.from(new Set(variants?.map(v => v.price)));
      console.log('Current sample variant prices:', prices);
    }
  }
}

inspectTargetPrices().catch(console.error);
