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

async function checkAuthUsers() {
  const { data, error } = await sb.auth.admin.listUsers();
  console.log('Error:', error);
  console.log('Users count:', data?.users?.length);
  data?.users?.forEach(u => {
    console.log('User ID:', u.id, '| Email:', u.email, '| Role:', u.role, '| Metadata:', u.user_metadata);
  });
}

checkAuthUsers().catch(console.error);
