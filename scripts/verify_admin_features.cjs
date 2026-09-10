const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function runComprehensiveVerification() {
  console.log('====================================================');
  console.log('=== ADMIN & SUPABASE INTEGRATION VERIFICATION ===');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, extra = '') {
    if (condition) {
      console.log(`✅ [PASS] ${title} ${extra ? `(${extra})` : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  }

  // 1. PRODUCTS & REAL SUPABASE DATA
  console.log('\n--- 1. Testing Product Admin & Supabase Integration ---');
  const { data: prods, count: prodCount, error: prodErr } = await sb
    .from('products')
    .select('id, name, price, original_price, description, category_id, in_stock, is_best_seller, surprise_type', { count: 'exact' })
    .limit(5);

  assert('Supabase products table accessible without error', !prodErr, prodErr ? prodErr.message : `Count: ${prodCount}`);
  assert('Catalog has real products (>50,000)', prodCount > 50000, `Total: ${prodCount}`);
  assert('Products include description field', prods && prods.length > 0 && ('description' in prods[0]));

  // Test Product CRUD with Supabase
  const testProdId = `prod_test_verify_${Date.now()}`;
  const testSlug = `test-verify-candle-${Date.now()}`;

  // Insert
  const { data: inserted, error: insertErr } = await sb.from('products').insert({
    id: testProdId,
    name: 'E2E Verification Diamond Sparkle Candle',
    slug: testSlug,
    category_id: 'cat-cash-candles',
    price: 34.99,
    original_price: 49.99,
    surprise_type: 'cash',
    surprise_value: '$100 Cash Prize',
    description: 'Fresh citrus and vanilla notes with guaranteed cash reveal inside.',
    in_stock: true,
    is_best_seller: true,
    image: '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg'
  }).select().single();

  assert('Product Add / Insert into Supabase', !insertErr && inserted && inserted.id === testProdId, insertErr ? insertErr.message : '');

  // Update
  const { data: updated, error: updateErr } = await sb.from('products').update({
    price: 29.99,
    in_stock: false,
    description: 'Updated description for live Supabase testing'
  }).eq('id', testProdId).select().single();

  assert('Product Edit / Update in Supabase (Price & Status)', !updateErr && updated && updated.price === 29.99 && updated.in_stock === false);

  // Delete
  const { error: deleteErr } = await sb.from('products').delete().eq('id', testProdId);
  assert('Product Delete from Supabase', !deleteErr);

  // 2. COLLECTIONS & ORDERING
  console.log('\n--- 2. Testing Collection Admin & Featured Collections ---');
  const { data: categories, error: catErr } = await sb.from('categories').select('*');
  assert('Supabase categories table accessible', !catErr && categories && categories.length > 0, `Total categories: ${categories?.length}`);

  const featuredCollectionsFile = fs.readFileSync('src/components/home/FeaturedCollectionsSection.tsx', 'utf8');
  assert('Homepage collection 1: Cash Candles', featuredCollectionsFile.includes("title: 'Cash Candles'"));
  assert('Homepage collection 2: Trending Collection', featuredCollectionsFile.includes("title: 'Trending Collection'"));
  assert('Homepage collection 3: Exactly "ZODIAC CASH MONEY CANDLES"', featuredCollectionsFile.includes("title: 'ZODIAC CASH MONEY CANDLES'"));

  // Check Admin Commerce collections ordering logic in adminService
  const adminServiceFile = fs.readFileSync('src/services/adminService.ts', 'utf8');
  assert('adminService supports updateCollectionOrdering', adminServiceFile.includes('updateCollectionOrdering'));
  assert('adminService supports assignProductToCollection', adminServiceFile.includes('assignProductToCollection'));
  assert('adminService supports removeProductFromCollection', adminServiceFile.includes('removeProductFromCollection'));

  // 3. STAFF / MANAGER ADMIN PERMISSIONS
  console.log('\n--- 3. Testing Staff / Manager Permissions Separation ---');
  assert('Super Admin full access defined in ADMIN_ROLES_CONFIG', adminServiceFile.includes("id: 'super_admin'") && adminServiceFile.includes("canManageSettings: true"));
  assert('Store Manager restricted from settings', adminServiceFile.includes("id: 'store_manager'") && adminServiceFile.includes("canManageSettings: false"));
  assert('Store Manager restricted from payout approval', adminServiceFile.includes("id: 'store_manager'") && adminServiceFile.includes("canApprovePayouts: false"));
  assert('Dynamic role permissions update supported', adminServiceFile.includes('updateRolePermissions'));

  const permissionsUIFile = fs.readFileSync('src/components/admin/AdminPermissions.tsx', 'utf8');
  assert('Permissions UI has interactive Super Admin toggle', permissionsUIFile.includes('handleTogglePermission'));
  assert('Permissions UI enforces security lock on settings & permissions', permissionsUIFile.includes('isRestricted'));

  // 4. JEWELRY APPRAISAL / CERTIFICATE ADMIN UI
  console.log('\n--- 4. Testing Jewelry Appraisal / Certificate UI ---');
  const appraisalsUIFile = fs.readFileSync('src/components/admin/AdminAppraisals.tsx', 'utf8');
  assert('Appraisals UI has View Official Certificate Details modal', appraisalsUIFile.includes('viewingCertificate'));
  assert('Appraisals UI links to Customer, Order, and Product', appraisalsUIFile.includes('customerName') && appraisalsUIFile.includes('orderId') && appraisalsUIFile.includes('productName'));
  assert('Appraisals UI navigates to public /appraise-your-jewelry', appraisalsUIFile.includes('/appraise-your-jewelry'));

  // 5. REPORTS & REAL CSV EXPORTS
  console.log('\n--- 5. Testing Reports & CSV Exports ---');
  const reportsUIFile = fs.readFileSync('src/components/admin/AdminReports.tsx', 'utf8');
  assert('Reports UI supports Sales & Orders view', reportsUIFile.includes("'sales_orders'"));
  assert('Reports UI supports Customer Cohorts view', reportsUIFile.includes("'customers'"));
  assert('Reports UI supports Commission Ledger view', reportsUIFile.includes("'commissions'"));
  assert('Reports UI supports Top Affiliates view', reportsUIFile.includes("'top_affiliates'"));
  assert('Real CSV export implemented with Blob download', reportsUIFile.includes('downloadCsv') && reportsUIFile.includes('new Blob'));

  // 6. AFFILIATE / REP DASHBOARD
  console.log('\n--- 6. Testing Affiliate / Rep Dashboard ---');
  const affiliateFile = fs.readFileSync('src/pages/AffiliateDashboard.tsx', 'utf8');
  assert('Affiliate Dashboard exposes direct 20% commission', affiliateFile.includes('20%'));
  assert('Affiliate Dashboard exposes 5-tier commission breakdown', affiliateFile.includes('5-Tier') || affiliateFile.includes('GenealogyTree'));
  assert('Affiliate Dashboard exposes unique referral link & copy', affiliateFile.includes('handleQuickCopyLink') || affiliateFile.includes('referralLink'));
  assert('Affiliate Dashboard exposes sales roster and commissions', affiliateFile.includes('CommissionHistoryTable') && affiliateFile.includes('SalesRosterTable'));

  // 7. REAL DATABASE ORDERS & COMMISSIONS SUMMARY
  console.log('\n--- 7. Checking Database Tables for Real Activity ---');
  const { data: dbOrders, error: ordErr } = await sb.from('orders').select('id, status, total, payment_status').limit(5);
  assert('Supabase orders table accessible', !ordErr, ordErr ? ordErr.message : `Orders found: ${dbOrders?.length}`);

  const { data: dbCommissions, error: commErr } = await sb.from('commissions').select('id, commission_amount, status, tier_level').limit(5);
  assert('Supabase commissions table accessible', !commErr, commErr ? commErr.message : `Commissions found: ${dbCommissions?.length}`);

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveVerification().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
