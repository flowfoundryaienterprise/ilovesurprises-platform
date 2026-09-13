const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

async function inspect() {
  const res = await fetch(env.VITE_SUPABASE_URL + '/rest/v1/', {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  const spec = await res.json();
  const rpcs = Object.keys(spec.paths || {}).filter((p) => p.startsWith('/rpc/'));
  console.log('Available RPC endpoints:', rpcs);
  console.log('Definitions count:', Object.keys(spec.definitions || {}).length);
}

inspect();
