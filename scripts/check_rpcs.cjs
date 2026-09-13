const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envLocalPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRpcs() {
  const candidates = [
    'exec_sql', 'execute_sql', 'exec', 'run_sql', 'execute_query', 'query',
    'sql', 'admin_sql', 'pg_query', 'run_query'
  ];
  for (const c of candidates) {
    try {
      const { data, error } = await supabase.rpc(c, { query: 'SELECT 1;' });
      console.log(c, error ? error.message : 'SUCCESS: ' + JSON.stringify(data));
    } catch (err) {
      console.log(c, 'Exception:', err.message);
    }
  }
}

checkRpcs();
