const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data: cols } = await supabase
    .from('collections')
    .select('collection_id, handle, title, products_count')
    .or('handle.ilike.%trend%,handle.ilike.%best%,title.ilike.%trend%,title.ilike.%best%');
  
  console.log('Collections matching trend/best in DB:', cols);
}

main().catch(console.error);
