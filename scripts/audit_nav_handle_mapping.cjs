const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  const { data: allCols } = await supabase
    .from('collections')
    .select('collection_id, handle, title, products_count, body_html, image_url')
    .order('products_count', { ascending: false });

  // Read navigation categories
  const navContent = fs.readFileSync(path.join(__dirname, '../src/data/navigationCategories.ts'), 'utf8');
  const itemRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*slug:\s*['"]([^'"]+)['"]/g;
  const navItems = [];
  let m;
  while ((m = itemRegex.exec(navContent)) !== null) {
    navItems.push({ id: m[1], name: m[2], slug: m[3] });
  }

  console.log('--- AUDITING EXACT MAPPINGS FOR ALL 67 NAV ITEMS ---');
  const detailedMap = [];

  for (const item of navItems) {
    // Look for matches by handle, tokens, or title
    const exactHandle = allCols.find(c => c.handle.toLowerCase() === item.slug.toLowerCase());
    
    // Search candidates in DB
    const candidates = allCols.filter(c => {
      const h = c.handle.toLowerCase();
      const t = c.title.toLowerCase();
      const n = item.name.toLowerCase();
      const s = item.slug.toLowerCase();
      
      const words = s.split('-').filter(w => !['and', 'the', 'for', 'cash', 'jewelry'].includes(w));
      return words.some(w => w.length > 3 && (h.includes(w) || t.includes(w)));
    }).slice(0, 5);

    detailedMap.push({
      navId: item.id,
      navName: item.name,
      navSlug: item.slug,
      exactHandleMatch: exactHandle ? {
        id: exactHandle.collection_id,
        handle: exactHandle.handle,
        title: exactHandle.title,
        count: exactHandle.products_count
      } : null,
      topDBCandidates: candidates.map(c => ({
        id: c.collection_id,
        handle: c.handle,
        title: c.title,
        count: c.products_count
      }))
    });
  }

  fs.writeFileSync(path.join(__dirname, 'nav_handle_mapping_detail.json'), JSON.stringify(detailedMap, null, 2));
  console.log('Saved nav_handle_mapping_detail.json successfully');
}

run().catch(console.error);
