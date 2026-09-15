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

async function printHolidays() {
  const { data: hal } = await sb.from('collections')
    .select('collection_id, handle, title, products_count, image_url')
    .or('handle.ilike.%halloween%,title.ilike.%halloween%');
  console.log('Halloween collections:', hal);

  const { data: ch } = await sb.from('collections')
    .select('collection_id, handle, title, products_count, image_url')
    .or('handle.ilike.%christmas%,title.ilike.%christmas%');
  console.log('Christmas collections:', ch);

  const { data: hol } = await sb.from('collections')
    .select('collection_id, handle, title, products_count, image_url')
    .or('handle.ilike.%holiday%,title.ilike.%holiday%');
  console.log('Holiday collections:', hol);
}

printHolidays().catch(console.error);
