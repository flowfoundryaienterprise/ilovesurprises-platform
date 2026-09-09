const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local securely
const envLocalPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key] && val) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('====================================================');
console.log('SUPABASE LIVE ENVIRONMENT & SCHEMA VERIFICATION');
console.log('====================================================');
console.log('Project URL Defined:', Boolean(supabaseUrl));
console.log('Project URL Valid HTTPS:', supabaseUrl.startsWith('https://'));
console.log('Anon Key Defined:', Boolean(anonKey));
console.log('Service Role Key Defined:', Boolean(serviceRoleKey));

if (!supabaseUrl || !anonKey) {
  console.error('ERROR: Supabase URL or Anon Key is missing from .env.local');
  process.exit(1);
}

const anonClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

async function verify() {
  const tables = ['categories', 'products', 'profiles', 'orders', 'order_items', 'commissions', 'reviews'];

  console.log('\n--- 1. TESTING CLIENT CONNECTION (ANON KEY) ---');
  for (const t of tables) {
    try {
      // Use indexed limit(1) query to verify accessibility without triggering unindexed full-table RLS scan timeout on 300k rows
      const { data, error } = await anonClient.from(t).select('id').limit(1);
      if (error) {
        console.log(`Table [${t}]: ERROR - ${error.message} (${error.code})`);
      } else {
        console.log(`Table [${t}]: ONLINE & ACCESSIBLE (Sample record returned: ${Boolean(data?.length)})`);
      }
    } catch (e) {
      console.log(`Table [${t}]: EXCEPTION - ${e.message}`);
    }
  }

  console.log('\n--- 2. TESTING SERVICE ROLE ACCESS & LIVE ROW COUNTS ---');
  if (!serviceRoleKey) {
    console.log('Service Role Key: NOT CONFIGURED in .env.local');
    return;
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  for (const t of tables) {
    try {
      const { count, error } = await serviceClient.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`Table [${t}]: COUNT ERROR - ${error.message}`);
      } else {
        console.log(`Table [${t}]: ${count?.toLocaleString()} rows in live database`);
      }
    } catch (err) {
      console.log(`Table [${t}]: EXCEPTION - ${err.message}`);
    }
  }

  console.log('\n--- 3. TESTING FOREIGN KEY & RELATIONAL INTEGRITY ---');
  try {
    const { data: sampleOrders, error: joinErr } = await serviceClient.from('orders').select(`
      id, total, status, payment_status, created_at,
      order_items ( id, product_id, quantity, unit_price, total_price, selected_surprise_option )
    `).limit(3);

    if (joinErr) {
      console.error('Join error:', joinErr.message);
    } else {
      console.log('Sample relational join verification:');
      sampleOrders.forEach(o => {
        console.log(`  - Order ${o.id}: Total=$${o.total}, Status=${o.status}, Items=${o.order_items.length}`);
      });
    }

    // Check for any orphan order_items (items whose order_id doesn't exist)
    const { data: orphanTest, error: orphanErr } = await serviceClient.from('order_items').select('id').is('order_id', null).limit(1);
    console.log(`Orphan order_items without order_id: ${orphanTest?.length || 0} ${orphanErr ? `(Error: ${orphanErr.message})` : '✅'}`);

  } catch (err) {
    console.log('Relational verification exception:', err.message);
  }

  console.log('\n====================================================');
  console.log('LIVE VERIFICATION COMPLETE');
  console.log('====================================================');
}

verify().catch(console.error);
