const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('   AUDIT: REMOVE ALL DUMMY / MOCK DATA ACROSS ALL PANELS        ');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    process.exitCode = 1;
  }
}

// 1. Audit src/data/reviews.ts
test('reviewsData array is empty [] (no mock reviews)', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/data/reviews.ts'), 'utf8');
  assert.ok(content.includes('export const reviewsData: Review[] = [];'), 'reviewsData should be empty array');
  assert.ok(!content.includes('Sarah Jenkins'), 'Sarah Jenkins mock review must not exist in reviewsData');
  assert.ok(!content.includes('Marcus Vance'), 'Marcus Vance mock review must not exist in reviewsData');
  assert.ok(!content.includes('Chloe Davenport'), 'Chloe Davenport mock review must not exist in reviewsData');
  assert.ok(!content.includes('David K. Reynolds'), 'David K. Reynolds mock review must not exist in reviewsData');
});

// 2. Audit src/services/appraisalService.ts
test('appraisalService DEFAULT_APPRAISALS is empty []', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/services/appraisalService.ts'), 'utf8');
  assert.ok(content.includes('const DEFAULT_APPRAISALS: JewelryAppraisal[] = [];'), 'DEFAULT_APPRAISALS should be empty array');
  assert.ok(!content.includes('ILS-DIAMOND-7500'), 'ILS-DIAMOND-7500 mock appraisal must not exist');
  assert.ok(!content.includes('ILS-BRACELET-5000'), 'ILS-BRACELET-5000 mock appraisal must not exist');
  assert.ok(!content.includes('ILS-EMERALD-3500'), 'ILS-EMERALD-3500 mock appraisal must not exist');
});

// 3. Audit src/services/representativeService.ts
test('representativeService DEFAULT_REPRESENTATIVES is empty [] and no Emily Watson forced attribution', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/services/representativeService.ts'), 'utf8');
  assert.ok(content.includes('export const DEFAULT_REPRESENTATIVES: PublicRepresentative[] = [];'), 'DEFAULT_REPRESENTATIVES should be empty');
  assert.ok(!content.includes('return DEFAULT_REPRESENTATIVES[0];'), 'Must not return Emily Watson fallback for organic visits');
  assert.ok(content.includes('return null;'), 'Must return null for organic visits when no rep stored');
});

// 4. Audit src/services/affiliateService.ts
test('affiliateService has purged mock genealogy tree, commissions, and payouts', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/services/affiliateService.ts'), 'utf8');
  assert.ok(content.includes('const DEFAULT_COMMISSION_RECORDS: CommissionRecord[] = [];'), 'DEFAULT_COMMISSION_RECORDS should be empty');
  assert.ok(content.includes('const DEFAULT_PAYOUT_RECORDS: PayoutRecord[] = [];'), 'DEFAULT_PAYOUT_RECORDS should be empty');
  assert.ok(!content.includes('sarah_sparkles'), 'sarah_sparkles mock username must not exist in affiliateService');
  assert.ok(!content.includes('repUsername: \'emily_sparkles\''), 'emily_sparkles fallback should not be default');
});

// 5. Audit src/services/adminService.ts
test('adminService has purged INITIAL mock representatives, memberships, commissions, and refunds', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/services/adminService.ts'), 'utf8');
  assert.ok(content.includes('const INITIAL_MEMBERSHIPS: MembershipAdminRecord[] = [];'), 'INITIAL_MEMBERSHIPS should be empty');
  assert.ok(content.includes('const INITIAL_REFUNDS: AdminRefundRecord[] = [];'), 'INITIAL_REFUNDS should be empty');
  assert.ok(!content.includes('Sarah Jenkins (Direct)'), 'Sarah Jenkins mock rep should not exist in adminService');
  assert.ok(!content.includes('ILSR-001'), 'ILSR-001 mock rep id should not exist in adminService');
  assert.ok(!content.includes('ils_order_001'), 'ils_order_001 mock order should not exist in adminService');
});

// 6. Audit src/components/affiliate/RepresentativeAccountTab.tsx
test('RepresentativeAccountTab has no fake Emily Watson or mock invoice rows', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/components/affiliate/RepresentativeAccountTab.tsx'), 'utf8');
  assert.ok(!content.includes('INV-2026-0301'), 'Mock invoice INV-2026-0301 must not exist');
  assert.ok(!content.includes('INV-2026-0201'), 'Mock invoice INV-2026-0201 must not exist');
  assert.ok(!content.includes('INV-2026-0114'), 'Mock invoice INV-2026-0114 must not exist');
  assert.ok(content.includes('No billing invoices yet'), 'Should contain proper empty state for invoices');
  assert.ok(!content.includes('Emily Watson'), 'Hardcoded Emily Watson rep must not exist');
});

// 7. Audit src/components/admin/AdminCommerce.tsx
test('AdminCommerce has cleared dummy form defaults and has authentic empty states', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/components/admin/AdminCommerce.tsx'), 'utf8');
  assert.ok(!content.includes('ILS-89104-US'), 'Dummy order number ILS-89104-US must not exist');
  assert.ok(content.includes('No orders yet'), 'Should render No orders yet empty state');
  assert.ok(content.includes('No customers found'), 'Should render No customers found empty state');
  assert.ok(content.includes('No refunds found'), 'Should render No refunds found empty state');
});

// 8. Audit src/components/admin/AdminCommissions.tsx
test('AdminCommissions has cleared DEFAULT_AUDIT_LOGS and has authentic empty states', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/components/admin/AdminCommissions.tsx'), 'utf8');
  assert.ok(content.includes('const DEFAULT_AUDIT_LOGS: CommissionAuditRecord[] = [];'), 'DEFAULT_AUDIT_LOGS should be empty');
  assert.ok(!content.includes('audit-001'), 'audit-001 mock log must not exist');
  assert.ok(content.includes('No rate adjustments logged yet'), 'Should render audit log empty state');
  assert.ok(content.includes('No commissions yet'), 'Should render No commissions yet empty state');
});

// 9. Audit src/components/admin/AdminReports.tsx
test('AdminReports has clean empty states across all chart canvases and tables', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/components/admin/AdminReports.tsx'), 'utf8');
  assert.ok(content.includes('No sales recorded yet'), 'Should render No sales recorded yet for empty salesByDay');
  assert.ok(content.includes('No traffic recorded yet'), 'Should render No traffic recorded yet for empty trafficByDay');
  assert.ok(content.includes('No commission tiers recorded yet'), 'Should render empty state for tierDistribution');
  assert.ok(content.includes('No active membership subscriptions yet'), 'Should render empty state for membershipBreakdown');
  assert.ok(content.includes('No orders yet'), 'Should render No orders yet in sales & orders tab');
  assert.ok(content.includes('No customers found'), 'Should render No customers found in customer cohorts tab');
  assert.ok(content.includes('No commissions yet'), 'Should render No commissions yet in commission ledger tab');
  assert.ok(content.includes('No representatives found'), 'Should render No representatives found in top affiliates tab');
});

// 10. Audit src/components/admin/AdminAppraisals.tsx
test('AdminAppraisals has clean form defaults and authentic empty state', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/components/admin/AdminAppraisals.tsx'), 'utf8');
  assert.ok(content.includes('estimatedValue: 0'), 'Form estimatedValue default should be 0');
  assert.ok(content.includes('No appraisal records yet'), 'Should render No appraisal records yet');
});

// 11. Audit src/components/account/OrderHistorySection.tsx
test('OrderHistorySection has authentic No orders yet empty state', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/components/account/OrderHistorySection.tsx'), 'utf8');
  assert.ok(content.includes('No orders yet'), 'Should render No orders yet');
  assert.ok(content.includes('When you purchase candles or bath treats, your tracked deliveries and prize receipts will appear right here.'), 'Friendly description');
});

// 12. Audit src/pages/ProductDetails.tsx
test('ProductDetails renders empty state when relevantReviews is empty and does not subtract fake reviewsData', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/pages/ProductDetails.tsx'), 'utf8');
  assert.ok(!content.includes('- reviewsData.length'), 'Must not have fake reviewsData subtraction math');
  assert.ok(content.includes('No reviews for this product yet'), 'Must render clean empty state for product reviews');
});

// 13. Audit src/services/sponsorService.ts
test('sponsorService has purged hardcoded fake defaultChain and defaultSponsorChain', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/services/sponsorService.ts'), 'utf8');
  assert.ok(!content.includes('const defaultChain = ['), 'defaultChain fake upline must not exist');
  assert.ok(!content.includes('const defaultSponsorChain = ['), 'defaultSponsorChain fake upline must not exist');
});

console.log('----------------------------------------------------------------');
console.log(`Results: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('✅ ALL DUMMY DATA AUDIT TESTS PASSED SUCCESSFULLY!');
} else {
  console.log('❌ SOME AUDIT TESTS FAILED.');
  process.exit(1);
}
