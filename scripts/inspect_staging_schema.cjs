const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

async function inspect() {
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const spec = await res.json();
  const paths = Object.keys(spec.paths || {});
  console.log('Available RPC paths:', paths.filter(p => p.startsWith('/rpc/')));
  if (spec.paths['/rpc/rls_auto_enable']) {
    console.log('rls_auto_enable:', JSON.stringify(spec.paths['/rpc/rls_auto_enable']));
  }
  const tables = Object.keys(spec.definitions || {}).filter(t => t.startsWith('staging_'));
  for (const t of tables) {
    console.log(`\n=== Table: ${t} ===`);
    const props = spec.definitions[t].properties || {};
    for (const [col, def] of Object.entries(props)) {
      console.log(`  - ${col} (${def.type || def.format || 'unknown'})`);
    }
  }
}

inspect().catch(console.error);
