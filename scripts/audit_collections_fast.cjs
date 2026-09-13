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
  console.log('--- FAST AUDIT OF COLLECTIONS & NAVIGATION ---');

  // 1. Fetch ALL collections from Supabase in ONE query
  const { data: allCollections, error: colErr } = await supabase
    .from('collections')
    .select('collection_id, handle, title, body_html, products_count, image_url, sort_order')
    .order('products_count', { ascending: false });

  if (colErr) {
    console.error('Failed to fetch collections:', colErr);
    return;
  }
  console.log(`Fetched ${allCollections.length} collections from Supabase`);

  const colByHandle = new Map();
  const colById = new Map();
  const colByTitle = new Map();

  allCollections.forEach(c => {
    colByHandle.set(c.handle.toLowerCase(), c);
    colById.set(c.collection_id, c);
    colByTitle.set(c.title.toLowerCase(), c);
  });

  // 2. Read navigation items from navigationCategories.ts
  const navContent = fs.readFileSync(path.join(__dirname, '../src/data/navigationCategories.ts'), 'utf8');
  const itemRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*slug:\s*['"]([^'"]+)['"]/g;
  const navItems = [];
  let m;
  while ((m = itemRegex.exec(navContent)) !== null) {
    navItems.push({ id: m[1], name: m[2], slug: m[3] });
  }

  // Also read homepage featured cards
  const featuredCards = [
    { id: 'cash-candles', title: 'Cash Candles', categoryKey: 'Cash Candles' },
    { id: 'trending-collection', title: 'Trending Collection', categoryKey: 'Trending' },
    { id: 'zodiac-cash-money-candles', title: 'ZODIAC CASH MONEY CANDLES', categoryKey: 'ZODIAC CASH MONEY CANDLES' }
  ];

  // Also read top-level categories
  const topCategories = [
    'Candles', 'Wax Melts', 'Bath + Bombs', 'Soaps', 'Jewelry', 'Candy', 'Chocolates', 'Slimes', 'Cards'
  ];

  // 3. Audit each navigation item
  const navAudit = [];
  for (const item of navItems) {
    const slugLower = item.slug.toLowerCase();
    const nameLower = item.name.toLowerCase();

    // Exact handle match
    let matched = colByHandle.get(slugLower);

    // Fuzzy title match if not by handle
    if (!matched) {
      for (const c of allCollections) {
        if (c.title.toLowerCase().includes(nameLower) || nameLower.includes(c.title.toLowerCase())) {
          matched = c;
          break;
        }
      }
    }

    // Check product count in product_collections
    let actualMappedInDB = 0;
    if (matched) {
      const { count } = await supabase
        .from('product_collections')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', matched.collection_id);
      actualMappedInDB = count || 0;
    }

    // Check current frontend query
    const catParam = item.name.toLowerCase().trim();
    let query = supabase.from('products').select('product_id', { count: 'exact', head: true });

    if (catParam.includes('zodiac')) {
      query = query.ilike('title', '%zodiac%');
    } else if (catParam.includes('coffee') || catParam.includes('mug')) {
      query = query.ilike('title', '%coffee%');
    } else if (catParam.includes('astrology') || catParam.includes('birthdate') || catParam.includes('birthday')) {
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
    } else if (catParam === 'trending' || catParam === 'best-sellers' || catParam.includes('trending')) {
      query = query.or('tags.ilike.%trending%,tags.ilike.%bestseller%,title.ilike.%diamond%');
    } else {
      const tokens = catParam
        .split(/[\s+/,-]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2 && !['and', 'the', 'for', 'candles', 'candle'].includes(t));

      if (tokens.length > 0) {
        const primaryToken = tokens[0];
        const rootWord = primaryToken.replace(/s$/i, '');
        query = query.or(`title.ilike.%${primaryToken}%,title.ilike.%${rootWord}%,category_name.ilike.%${primaryToken}%`);
      } else {
        const rootWord = catParam.replace(/s$/i, '');
        query = query.or(`title.ilike.%${catParam}%,title.ilike.%${rootWord}%,category_name.ilike.%${catParam}%`);
      }
    }

    const { count: feCount } = await query;

    navAudit.push({
      navId: item.id,
      navName: item.name,
      navSlug: item.slug,
      matchedCollection: matched ? {
        id: matched.collection_id,
        handle: matched.handle,
        title: matched.title,
        reportedCount: matched.products_count,
        hasBodyHtml: Boolean(matched.body_html),
        hasImage: Boolean(matched.image_url)
      } : null,
      actualMappedInDB,
      frontendQueryCount: feCount || 0,
      isFrontendBlank: (feCount || 0) === 0
    });
  }

  // 4. Specifically audit the Featured Homepage Collections
  const featuredAudit = [];
  for (const card of featuredCards) {
    let col = colByHandle.get(card.id) || colByTitle.get(card.title.toLowerCase());
    if (!col && card.id === 'zodiac-cash-money-candles') {
      col = colByHandle.get('zodiac-cash-candles') || colByHandle.get('zodiac-candles');
      if (!col) {
        for (const c of allCollections) {
          if (c.handle.includes('zodiac')) {
            col = c;
            break;
          }
        }
      }
    }
    if (!col && card.id === 'trending-collection') {
      for (const c of allCollections) {
        if (c.handle.includes('trend') || c.handle.includes('best-seller')) {
          col = c;
          break;
        }
      }
    }

    let actualMapped = 0;
    if (col) {
      const { count } = await supabase
        .from('product_collections')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', col.collection_id);
      actualMapped = count || 0;
    }

    featuredAudit.push({
      cardId: card.id,
      cardTitle: card.title,
      categoryKey: card.categoryKey,
      matchedCol: col ? {
        id: col.collection_id,
        handle: col.handle,
        title: col.title,
        reportedCount: col.products_count,
        actualMapped,
        hasBodyHtml: Boolean(col.body_html),
        hasImage: Boolean(col.image_url)
      } : 'NOT_FOUND_IN_DB'
    });
  }

  // 5. Test 10 Random Collections from allCollections
  const randomIndices = [5, 15, 35, 75, 120, 180, 240, 310, 380, 440];
  const randomCollectionsAudit = [];
  for (const idx of randomIndices) {
    const col = allCollections[idx];
    if (!col) continue;

    const { count: actualMapped } = await supabase
      .from('product_collections')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', col.collection_id);

    // Also get 3 sample products
    const { data: sampleProds } = await supabase
      .from('product_collections')
      .select('product_id, product_handle, products(product_id, handle, title, total_inventory_qty)')
      .eq('collection_id', col.collection_id)
      .limit(3);

    randomCollectionsAudit.push({
      index: idx,
      id: col.collection_id,
      handle: col.handle,
      title: col.title,
      products_count: col.products_count,
      actualMapped: actualMapped || 0,
      hasBodyHtml: Boolean(col.body_html),
      hasImage: Boolean(col.image_url),
      sampleProducts: sampleProds?.map(p => ({
        id: p.product_id,
        handle: p.product_handle,
        title: p.products ? p.products.title : 'NO_JOIN'
      }))
    });
  }

  // 6. Check collections in DB with 0 mapped products
  console.log('Checking all 460 collections for empty collections in DB...');
  const emptyCollectionsInDB = [];
  for (const c of allCollections) {
    if (c.products_count === 0) {
      emptyCollectionsInDB.push({
        id: c.collection_id,
        handle: c.handle,
        title: c.title,
        products_count: c.products_count
      });
    }
  }

  const finalReport = {
    totalSupabaseCollections: allCollections.length,
    emptyCollectionsInDBCount: emptyCollectionsInDB.length,
    emptyCollectionsInDB,
    featuredCollectionsAudit: featuredAudit,
    randomCollectionsAudit,
    navigationAudit: {
      totalItems: navAudit.length,
      blankCount: navAudit.filter(n => n.isFrontendBlank).length,
      blankItems: navAudit.filter(n => n.isFrontendBlank),
      missingFromDBCount: navAudit.filter(n => !n.matchedCollection).length,
      missingFromDBItems: navAudit.filter(n => !n.matchedCollection),
      matchedItems: navAudit.filter(n => n.matchedCollection && !n.isFrontendBlank)
    }
  };

  fs.writeFileSync(path.join(__dirname, 'fast_audit_report.json'), JSON.stringify(finalReport, null, 2));
  console.log('Saved fast_audit_report.json successfully');
}

run().catch(console.error);
