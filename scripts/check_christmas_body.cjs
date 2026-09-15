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

async function checkChristmas() {
  const ids = ['155711438894', '155711471662', '289792426173', '328913879229'];
  for (const id of ids) {
    const { data } = await sb.from('collections').select('collection_id, handle, title, body_html').eq('collection_id', id).single();
    console.log('ID:', id, 'Handle:', data.handle, 'Title:', data.title);
    console.log('Body HTML:\n', data.body_html);
    console.log('----------------------------------------------------');
  }
}

checkChristmas().catch(console.error);
