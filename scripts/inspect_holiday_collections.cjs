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

async function findCols() {
  const terms = ['halloween', 'christmas', 'cash', 'zodiac'];
  for (const t of terms) {
    const { data: titleMatches } = await sb.from('collections')
      .select('collection_id, handle, title, products_count, image_url, body_html')
      .ilike('title', `%${t}%`);
    console.log(`\n=== Matches for title '%${t}%' ===`);
    console.log(titleMatches);

    const { data: handleMatches } = await sb.from('collections')
      .select('collection_id, handle, title, products_count, image_url, body_html')
      .ilike('handle', `%${t}%`);
    console.log(`=== Matches for handle '%${t}%' ===`);
    console.log(handleMatches);
  }
}

findCols().catch(console.error);
