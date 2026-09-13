const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

async function testSqlEndpoints() {
  const endpoints = [
    '/pg/query',
    '/database/query',
    '/sql',
    '/rest/v1/rpc/exec_sql',
    '/rest/v1/rpc/execute_sql',
    '/rest/v1/rpc/run_sql',
    '/rest/v1/rpc/query'
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${env.VITE_SUPABASE_URL}${ep}`, {
        method: 'POST',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: 'SELECT 1;' })
      });
      console.log(`${ep}: status=${res.status} statusText=${res.statusText}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Success on ${ep}:`, data);
      }
    } catch (e) {
      console.log(`${ep}: error=${e.message}`);
    }
  }
}

testSqlEndpoints().catch(console.error);
