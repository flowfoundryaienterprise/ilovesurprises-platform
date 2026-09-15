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

async function checkImages() {
  const { count } = await sb.from('collections').select('*', { count: 'exact', head: true }).not('image_url', 'is', null);
  console.log('Collections with non-null image_url in Supabase:', count);

  // Check what images are used for collections on the site
  const { data: colsWithImg } = await sb.from('collections').select('collection_id, handle, title, image_url').not('image_url', 'is', null).limit(5);
  console.log('Sample cols with image:', colsWithImg);
}

checkImages().catch(console.error);
