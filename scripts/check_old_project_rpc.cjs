const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

console.log('Checking old project in .env:', env.VITE_SUPABASE_URL);
const sbOld = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOld() {
  const { data, error } = await sbOld.rpc('exec_sql', { query: 'SELECT 1;' });
  console.log('exec_sql on old project:', error ? error.message : 'EXISTS!');
}

checkOld().catch(console.error);
