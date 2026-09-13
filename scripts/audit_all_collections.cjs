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

// Read navigationCategories.ts to extract all nav items
const navCatContent = fs.readFileSync(path.join(__dirname, '../src/data/navigationCategories.ts'), 'utf8');

// Parse items with regex
const itemRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*slug:\s*['"]([^'"]+)['"]/g;
const navItems = [];
let m;
while ((m = itemRegex.exec(navCatContent)) !== null) {
  navItems.push({ id: m[1], name: m[2], slug: m[3] });
}

console.log(`Found ${navItems.length} navigation collection items in navigationCategories.ts`);

// Also extract main categories:
const catRegex = /id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*slug:\s*['"]([^'"]+)['"],\s*href:\s*['"]([^'"]+)['"]/g;
const mainCats = [];
while ((m = catRegex.exec(navCatContent)) !== null) {
  if (!['home', 'affiliate', 'appraisal', 'contact'].includes(m[1])) {
    mainCats.push({ id: m[1], name: m[2], slug: m[3], href: m[4] });
  }
}

async function audit() {
  const results = [];
  const allItemsToTest = [
    ...mainCats.map(c => ({ ...c, type: 'main_category' })),
    ...navItems.map(i => ({ ...i, type: 'sub_category' }))
  ];

  console.log(`Testing ${allItemsToTest.length} total navigation targets...`);

  for (const item of allItemsToTest) {
    // 1. Search in collections table by handle or title
    const { data: colsByHandle } = await supabase
      .from('collections')
      .select('collection_id, handle, title, products_count, body_html, image_url')
      .eq('handle', item.slug);

    let matchedCol = colsByHandle && colsByHandle[0];

    if (!matchedCol) {
      // Try searching collections by title
      const { data: colsByTitle } = await supabase
        .from('collections')
        .select('collection_id, handle, title, products_count, body_html, image_url')
        .ilike('title', `%${item.name}%`)
        .limit(1);
      matchedCol = colsByTitle && colsByTitle[0];
    }

    // 2. If matchedCol found, check product_collections count
    let mappedCountInDB = 0;
    if (matchedCol) {
      const { count } = await supabase
        .from('product_collections')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', matchedCol.collection_id);
      mappedCountInDB = count || 0;
    }

    // 3. Test current frontend query logic in productService.ts
    const catParam = item.name.toLowerCase().trim();
    let query = supabase.from('products').select('product_id', { count: 'exact', head: true });

    if (catParam.includes('zodiac')) {
      query = query.ilike('title', '%zodiac%');
    } else if (catParam.includes('coffee') || catParam.includes('mug')) {
      query = query.ilike('title', '%coffee%');
    } else if (
      catParam.includes('astrology') ||
      catParam.includes('birthdate') ||
      catParam.includes('birthday')
    ) {
      query = query.or('title.ilike.%astrology%,title.ilike.%birthday%');
    } else if (catParam.includes('soda') || catParam.includes('pop')) {
      query = query.or('title.ilike.%soda%,title.ilike.%pop%');
    } else if (catParam.includes('military')) {
      query = query.ilike('title', '%military%');
    } else if (catParam.includes('cereal')) {
      query = query.ilike('title', '%cereal%');
    } else if (catParam.includes('wine')) {
      query = query.ilike('title', '%wine%');
    } else if (catParam.includes('anime')) {
      query = query.ilike('title', '%anime%');
    } else if (catParam.includes('funny')) {
      query = query.ilike('title', '%funny%');
    } else if (
      catParam === 'trending' ||
      catParam === 'best-sellers' ||
      catParam.includes('trending')
    ) {
      query = query.or('tags.ilike.%trending%,tags.ilike.%bestseller%,title.ilike.%diamond%');
    } else {
      const tokens = catParam
        .split(/[\s+/,-]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2 && !['and', 'the', 'for', 'candles', 'candle'].includes(t));

      if (tokens.length > 0) {
        const primaryToken = tokens[0];
        const rootWord = primaryToken.replace(/s$/i, '');
        query = query.or(
          `title.ilike.%${primaryToken}%,title.ilike.%${rootWord}%,category_name.ilike.%${primaryToken}%`
        );
      } else {
        const rootWord = catParam.replace(/s$/i, '');
        query = query.or(
          `title.ilike.%${catParam}%,title.ilike.%${rootWord}%,category_name.ilike.%${catParam}%`
        );
      }
    }

    const { count: frontendQueryCount, error: feErr } = await query;

    results.push({
      id: item.id,
      name: item.name,
      slug: item.slug,
      type: item.type,
      matchedCollection: matchedCol ? {
        id: matchedCol.collection_id,
        handle: matchedCol.handle,
        title: matchedCol.title,
        reportedCount: matchedCol.products_count,
        hasBodyHtml: Boolean(matchedCol.body_html),
        hasImage: Boolean(matchedCol.image_url),
      } : null,
      mappedCountInDB,
      frontendQueryCount: frontendQueryCount || 0,
      isFrontendBlank: (frontendQueryCount || 0) === 0,
      isDBCollectionMissing: !matchedCol,
      isDBMappedZero: matchedCol ? mappedCountInDB === 0 : true
    });
  }

  // 4. Now also audit all 460 Supabase collections!
  const { data: allSupabaseCols } = await supabase
    .from('collections')
    .select('collection_id, handle, title, products_count, body_html, image_url')
    .order('products_count', { ascending: false });

  console.log(`Auditing all ${allSupabaseCols.length} Supabase collections...`);
  const supabaseCollectionAudit = [];
  for (const sc of allSupabaseCols) {
    const { count: actualMapped } = await supabase
      .from('product_collections')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', sc.collection_id);

    supabaseCollectionAudit.push({
      collection_id: sc.collection_id,
      handle: sc.handle,
      title: sc.title,
      reportedCount: sc.products_count,
      actualMapped: actualMapped || 0,
      hasBodyHtml: Boolean(sc.body_html),
      hasImage: Boolean(sc.image_url),
      isBlank: (actualMapped || 0) === 0
    });
  }

  const output = {
    navigationAudit: results,
    blankNavigationCount: results.filter(r => r.isFrontendBlank).length,
    blankNavigationItems: results.filter(r => r.isFrontendBlank),
    supabaseCollectionSummary: {
      totalCollections: supabaseCollectionAudit.length,
      zeroMappedCollectionsCount: supabaseCollectionAudit.filter(c => c.isBlank).length,
      zeroMappedCollections: supabaseCollectionAudit.filter(c => c.isBlank),
      topCollections: supabaseCollectionAudit.slice(0, 20)
    }
  };

  fs.writeFileSync(path.join(__dirname, 'audit_all_collections_report.json'), JSON.stringify(output, null, 2));
  console.log(`Audit complete! Saved to audit_all_collections_report.json`);
  console.log(`Blank navigation items count: ${output.blankNavigationCount} / ${results.length}`);
  console.log(`Supabase collections with 0 mapped products: ${output.supabaseCollectionSummary.zeroMappedCollectionsCount} / ${supabaseCollectionAudit.length}`);
}

audit().catch(console.error);
