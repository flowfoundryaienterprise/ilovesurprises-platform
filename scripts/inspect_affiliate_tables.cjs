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

async function inspectAffiliateTables() {
  console.log('=== INSPECTING AFFILIATE / BUSINESS TABLES IN SUPABASE ===');
  const tables = ['representatives', 'profiles', 'orders', 'order_items', 'commissions', 'payouts'];
  for (const t of tables) {
    const { data, count, error } = await sb.from(t).select('*', { count: 'exact' }).limit(3);
    console.log(`\nTable "${t}": count=${count}, error=${error?.message || 'none'}`);
    if (data && data.length > 0) {
      console.log('Sample columns:', Object.keys(data[0]));
      console.log('Sample data:', data[0]);
    }
  }
}

inspectAffiliateTables().catch(console.error);
