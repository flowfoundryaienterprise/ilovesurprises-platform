const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach((l) => {
  const m = l.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const sbAdmin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const sbAnon = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const testEmail = `ratelimittest_${Date.now()}@gmail.com`;
  const testPassword = 'TestPassword123!';

  console.log(`Testing signup for ${testEmail}...`);

  // First try normal anon signup
  const { data: anonData, error: anonErr } = await sbAnon.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { name: 'Rate Limit Test', role: 'customer' },
    },
  });

  console.log('Anon signUp error:', anonErr?.message);

  if (anonErr && anonErr.message.toLowerCase().includes('rate limit')) {
    console.log('Rate limit detected! Testing generateLink...');
    const { data: genData, error: genErr } = await sbAdmin.auth.admin.generateLink({
      type: 'signup',
      email: testEmail,
      password: testPassword,
      options: {
        data: { name: 'Rate Limit Test', role: 'customer' },
      },
    });

    console.log('generateLink user ID:', genData?.user?.id, 'Action link:', genData?.properties?.action_link, 'Error:', genErr?.message);

    if (genData?.user?.id) {
      await sbAdmin.auth.admin.deleteUser(genData.user.id);
      console.log('Cleaned up generateLink test user');
    }
  }
}

test().catch(console.error);
