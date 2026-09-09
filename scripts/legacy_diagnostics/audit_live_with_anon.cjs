const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envLocalPath = path.join(__dirname, '..', '.env.local');
const lines = fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/);
let url = '', anon = '';
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('VITE_SUPABASE_URL=')) url = trimmed.split('=')[1].trim();
  if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) anon = trimmed.split('=')[1].trim();
}

console.log('Testing connection with VITE_SUPABASE_ANON_KEY...');
const supabase = createClient(url, anon, { auth: { persistSession: false } });

async function checkAll() {
  const tables = [
    'categories', 'products', 'profiles', 'orders',
    'order_items', 'commissions', 'reviews', 'collections',
    'product_variants', 'product_images', 'addresses'
  ];

  for (const t of tables) {
    try {
      const { data, error, count } = await supabase
        .from(t)
        .select('*', { count: 'exact' })
        .limit(5);

      if (error) {
        console.log(`Table [${t}]: ERROR - ${error.message} (code: ${error.code})`);
      } else {
        console.log(`Table [${t}]: SUCCESS (Rows: ${count}, Sample: ${data?.length})`);
        if (data && data.length > 0) {
          console.log(`  Columns:`, Object.keys(data[0]));
          console.log(`  First row sample:`, JSON.stringify(data[0]).slice(0, 150));
        }
      }
    } catch (e) {
      console.log(`Table [${t}]: EXCEPTION - ${e.message}`);
    }
  }

  // Test insert capability on categories (to check RLS / permissions)
  console.log('\nTesting INSERT permission on categories table with anon key...');
  const testCat = {
    id: 'test-cat-probe',
    name: 'Test Cat Probe',
    slug: 'test-cat-probe'
  };
  const { data: _insData, error: insErr } = await supabase
    .from('categories')
    .insert(testCat)
    .select();

  if (insErr) {
    console.log('Insert test result: BLOCKED -', insErr.message, `(${insErr.code})`);
  } else {
    console.log('Insert test result: ALLOWED! Cleaning up test record...');
    await supabase.from('categories').delete().eq('id', 'test-cat-probe');
    console.log('Cleaned up probe record.');
  }
}

checkAll().catch(console.error);
