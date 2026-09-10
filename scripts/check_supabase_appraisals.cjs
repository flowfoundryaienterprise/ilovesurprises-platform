const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('Checking Supabase tables related to appraisal...');
  const tables = [
    'appraisals',
    'jewelry_appraisals',
    'appraisal_submissions',
    'appraisal_requests',
    'appraisal_tickets',
    'submissions',
    'customer_appraisals'
  ];
  for (const t of tables) {
    const { data, error } = await sb.from(t).select('*').limit(1);
    console.log(`Table "${t}":`, error ? `NOT FOUND / ERROR: ${error.message}` : `EXISTS (sample count: ${data ? data.length : 0})`);
  }

  console.log('\nChecking Supabase storage buckets...');
  const { data: buckets, error: bErr } = await sb.storage.listBuckets();
  if (bErr) {
    console.log('Buckets error:', bErr.message);
  } else {
    console.log('Buckets found:', buckets.map(b => b.name));
  }
}

check();
