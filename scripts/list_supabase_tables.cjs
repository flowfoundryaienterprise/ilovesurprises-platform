const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
  console.log('--- AUDITING SUPABASE TABLES ---');
  const existingTables = ['products', 'categories', 'orders', 'order_items', 'profiles', 'commissions', 'reviews'];
  for (const t of existingTables) {
    const { data, error, count } = await sb.from(t).select('*').limit(1);
    console.log(`\n=== Table: "${t}" (Total Count: ${count}) ===`);
    if (data && data.length > 0) {
      console.log('Sample Row:', Object.keys(data[0]));
    } else {
      console.log('Table is empty (0 rows).');
    }
  }
}

listTables();
