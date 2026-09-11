const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(l => {
  const m = l.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const anon = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const testEmail = `testuser_${Date.now()}@gmail.com`;
  const testPass = 'Password123!';
  console.log('Testing admin.createUser for:', testEmail);
  const { data, error } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPass,
    email_confirm: true,
    user_metadata: { name: 'Test User', role: 'customer' }
  });
  if (error) {
    console.error('createUser error:', error);
    return;
  }
  console.log('User created:', data.user?.id);

  console.log('Testing signInWithPassword on anon client...');
  const { data: signinData, error: signinErr } = await anon.auth.signInWithPassword({
    email: testEmail,
    password: testPass
  });
  if (signinErr) {
    console.error('signIn error:', signinErr);
  } else {
    console.log('SignIn SUCCESS! Session access_token present:', !!signinData.session?.access_token);
  }

  // Check profile row
  const { data: prof, error: profErr } = await admin.from('profiles').select('*').eq('id', data.user.id);
  console.log('Profile row in profiles table:', prof, 'Error:', profErr);

  // cleanup
  await admin.auth.admin.deleteUser(data.user.id);
  console.log('Cleaned up user successfully.');
}

run().catch(console.error);
