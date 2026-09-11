const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach((l) => {
  const m = l.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('=== Searching for "50 and fabulous" ===');
  const { data, error } = await sb
    .from('products')
    .select('id, name, slug, image, category_id, in_stock')
    .ilike('name', '%50 and fabulous%');

  console.log(`Found ${data?.length} matches. Error:`, error);
  if (data && data.length > 0) {
    data.forEach((p) => {
      console.log(`ID: ${p.id}`);
      console.log(`Name: ${p.name}`);
      console.log(`Slug: ${p.slug}`);
      console.log(`Image URL: "${p.image}"`);
      console.log('---');
    });
  }

  console.log('\n=== Checking generic-candle images in database ===');
  const { data: genericCandles, count: genericCount } = await sb
    .from('products')
    .select('id, name, image', { count: 'estimated' })
    .ilike('image', '%generic-candle%');

  console.log(`Products with generic-candle image: ${genericCount || genericCandles?.length}`);
  if (genericCandles && genericCandles.length > 0) {
    genericCandles.slice(0, 5).forEach((p) => {
      console.log(`- [${p.id}] ${p.name}: ${p.image}`);
    });
  }

  // Let's check what image other Funny Jewelry Bear Wax Melts have
  console.log('\n=== Checking images for other "Jewelry Bear Wax Melts" ===');
  const { data: bearMelts } = await sb
    .from('products')
    .select('id, name, image')
    .ilike('name', '%Jewelry Bear Wax Melts%')
    .not('image', 'ilike', '%generic-candle%')
    .limit(10);

  if (bearMelts) {
    bearMelts.forEach((p) => {
      console.log(`- [${p.id}] ${p.name}: ${p.image}`);
    });
  }

  // Test updating the image in Supabase
  console.log('\n=== Updating 50 and fabulous image in Supabase ===');
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  const adminClient = createClient(env.VITE_SUPABASE_URL, serviceKey);

  const realImage = 'https://cdn.shopify.com/s/files/1/0172/4672/products/37_Mockup_Jewelry_JewelryCandles_133547cc-a1c0-4b24-b2ae-58b15dc9e17c.jpg?v=1654707054';
  const { data: updated, error: updateErr } = await adminClient
    .from('products')
    .update({ image: realImage })
    .eq('id', 'prod_50-and-fabulous-happy-birthday-jewelry-funny-candles-1')
    .select('id, name, image');

  console.log('Update result:', updated, 'Error:', updateErr);
}

check().catch(console.error);
