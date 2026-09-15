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

async function inspectStatus() {
  const { count: act } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('status', 'Active');
  const { count: arch } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('status', 'Archived');
  const { count: dft } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('status', 'Draft');
  console.log('Status Active:', act, '| Archived:', arch, '| Draft:', dft);
}

inspectStatus().catch(console.error);
