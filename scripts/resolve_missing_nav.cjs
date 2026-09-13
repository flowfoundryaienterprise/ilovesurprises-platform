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
  const fastReport = JSON.parse(fs.readFileSync(path.join(__dirname, 'fast_audit_report.json'), 'utf8'));
  const missing = fastReport.navigationAudit.missingFromDBItems;
  console.log(`Analyzing ${missing.length} missing navigation items...`);

  const { data: allCols } = await supabase.from('collections').select('collection_id, handle, title, products_count');

  const resolved = [];
  for (const m of missing) {
    // Search by keywords in title/handle
    const terms = m.navName.toLowerCase().split(/[\s+/,-]+/).filter(t => t.length > 2 && !['and', 'the', 'for'].includes(t));
    const matches = allCols.filter(c => {
      const h = c.handle.toLowerCase();
      const t = c.title.toLowerCase();
      return terms.some(term => h.includes(term) || t.includes(term));
    });

    resolved.push({
      navId: m.navId,
      navName: m.navName,
      navSlug: m.navSlug,
      frontendQueryCount: m.frontendQueryCount,
      bestMatchesInDB: matches.slice(0, 3).map(c => ({
        id: c.collection_id,
        handle: c.handle,
        title: c.title,
        count: c.products_count
      }))
    });
  }

  fs.writeFileSync(path.join(__dirname, 'missing_nav_resolved.json'), JSON.stringify(resolved, null, 2));
  console.log('Saved missing_nav_resolved.json successfully');
}

run().catch(console.error);
