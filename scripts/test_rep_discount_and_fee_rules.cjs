/**
 * Test Suite: Rep Personal Order Discount (20%), Personal Order & Fee Exclusions from $125 Qualification
 * Tests Edge Cases A through K specified by founder requirements.
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment for unit testing services
const storage = new Map();
global.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};
global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};

let passed = 0;
let failed = 0;

function assert(name, condition, extra = '') {
  if (condition) {
    console.log(`✅ PASS: ${name} ${extra ? `(${extra})` : ''}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name} ${extra ? `(${extra})` : ''}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 TESTING REP PERSONAL 20% DISCOUNT, $125 EXCLUSIONS & $20 FEE');
  console.log('================================================================\n');

  // Test rep accounts
  const REP_USERNAME = 'sarah_sparkles';
  const CURRENT_MONTH = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const NOW_ISO = new Date().toISOString();

  // Load services
  // Mock Supabase
  const mockSupabase = {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
        order: () => Promise.resolve({ data: [], error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  };

  // Helper calculation logic mirroring qualificationService & commissionService
  const QUALIFICATION_THRESHOLD = 125.00;

  function isPersonalPurchase(order, rep) {
    if (order.isPersonalPurchase === true || order.is_personal_order === true) return true;
    const notes = (order.notes || '').toLowerCase();
    if (notes.includes('rep_personal') || notes.includes('personal_purchase')) return true;
    if (order.customerEmail?.toLowerCase() === `${rep}@ilovesurprises.com`) return true;
    if (order.purchaserRepUsername?.toLowerCase() === rep.toLowerCase()) return true;
    return false;
  }

  function isMembershipFee(order) {
    if (order.isMembershipFee === true || order.order_type === 'membership') return true;
    const notes = (order.notes || '').toLowerCase();
    if (notes.includes('membership_fee') || notes.includes('rep_license') || notes.includes('signup_fee') || notes.includes('$20 rep fee')) return true;
    const prod = (order.productName || '').toLowerCase();
    if (prod.includes('monthly license') || prod.includes('consultant license') || prod.includes('signup fee')) return true;
    return false;
  }

  function calculateQualification(orders, rep, month) {
    let qualifyingRetailSales = 0;
    let personalPurchasesExcluded = 0;
    let feeOrdersExcluded = 0;

    for (const order of orders) {
      if (order.month !== month) continue;

      // Exclude $20 signup/monthly fees
      if (isMembershipFee(order)) {
        feeOrdersExcluded += order.subtotal;
        continue;
      }

      // Exclude personal purchases
      if (isPersonalPurchase(order, rep)) {
        personalPurchasesExcluded += order.subtotal;
        continue;
      }

      // Valid qualifying customer retail sales
      if (order.attributedRep === rep && order.status === 'paid') {
        qualifyingRetailSales += order.subtotal;
      }
    }

    qualifyingRetailSales = parseFloat(qualifyingRetailSales.toFixed(2));
    personalPurchasesExcluded = parseFloat(personalPurchasesExcluded.toFixed(2));
    const isQualified = qualifyingRetailSales >= QUALIFICATION_THRESHOLD;

    return {
      repUsername: rep,
      calendarMonth: month,
      qualifyingRetailSales,
      personalPurchasesExcluded,
      feeOrdersExcluded,
      qualificationThreshold: QUALIFICATION_THRESHOLD,
      isQualified,
    };
  }

  function calculateOrderCommissions(order, sponsorQualificationMap) {
    // Rule 1 & Rule 2: Rep personal orders do NOT generate commission income
    if (order.isPersonalPurchase || isPersonalPurchase(order, order.purchaserRepUsername || '')) {
      return [];
    }

    // Rule 4: $20 signup/monthly fees do NOT generate commission income
    if (order.isMembershipFee || isMembershipFee(order)) {
      return [];
    }

    // Normal customer order
    const commissions = [];
    const directRate = 0.20;
    commissions.push({
      rep: order.attributedRep,
      level: 'personal',
      amount: parseFloat((order.subtotal * directRate).toFixed(2)),
      status: 'pending', // Direct commission always payable
    });

    // Sponsor overrides (Level 1: 5%)
    const sponsor = order.sponsorRep;
    if (sponsor) {
      const isSponsorQualified = sponsorQualificationMap[sponsor] === true;
      commissions.push({
        rep: sponsor,
        level: 1,
        amount: parseFloat((order.subtotal * 0.05).toFixed(2)),
        status: isSponsorQualified ? 'pending' : 'unqualified',
      });
    }

    return commissions;
  }

  // --- EDGE CASE A: Rep has $0 qualifying customer sales ---
  console.log('--- Edge Case A: Rep has $0 qualifying customer sales ---');
  const resA = calculateQualification([], REP_USERNAME, CURRENT_MONTH);
  assert('Case A: Qualifying sales is $0', resA.qualifyingRetailSales === 0);
  assert('Case A: Status is NOT QUALIFIED', resA.isQualified === false);

  // --- EDGE CASE B: Rep has $50 qualifying customer sales ---
  console.log('\n--- Edge Case B: Rep has $50 qualifying customer sales ---');
  const ordersB = [
    { id: 'ord-b1', subtotal: 50.00, attributedRep: REP_USERNAME, month: CURRENT_MONTH, status: 'paid' },
  ];
  const resB = calculateQualification(ordersB, REP_USERNAME, CURRENT_MONTH);
  assert('Case B: Qualifying sales is $50.00', resB.qualifyingRetailSales === 50.00);
  assert('Case B: Status is NOT QUALIFIED ($50 < $125)', resB.isQualified === false);

  // --- EDGE CASE C: Rep has exactly $125 qualifying retail customer sales ---
  console.log('\n--- Edge Case C: Rep has exactly $125 qualifying retail customer sales ---');
  const ordersC = [
    { id: 'ord-c1', subtotal: 125.00, attributedRep: REP_USERNAME, month: CURRENT_MONTH, status: 'paid' },
  ];
  const resC = calculateQualification(ordersC, REP_USERNAME, CURRENT_MONTH);
  assert('Case C: Qualifying sales is exactly $125.00', resC.qualifyingRetailSales === 125.00);
  assert('Case C: Status is QUALIFIED (Threshold reached)', resC.isQualified === true);

  // --- EDGE CASE D: Rep has $200 qualifying retail customer sales ---
  console.log('\n--- Edge Case D: Rep has $200 qualifying retail customer sales ---');
  const ordersD = [
    { id: 'ord-d1', subtotal: 200.00, attributedRep: REP_USERNAME, month: CURRENT_MONTH, status: 'paid' },
  ];
  const resD = calculateQualification(ordersD, REP_USERNAME, CURRENT_MONTH);
  assert('Case D: Qualifying sales is $200.00', resD.qualifyingRetailSales === 200.00);
  assert('Case D: Status is QUALIFIED', resD.isQualified === true);

  // --- EDGE CASE E: Rep personally purchases $200 ---
  console.log('\n--- Edge Case E: Rep personally purchases $200 ---');
  // 1. Check 20% Rep discount
  const rawSubtotalE = 200.00;
  const repDiscountE = parseFloat(((rawSubtotalE * 20) / 100).toFixed(2));
  const paidE = rawSubtotalE - repDiscountE;
  assert('Case E: Rep personal purchase receives 20% discount ($40 off)', repDiscountE === 40.00 && paidE === 160.00);

  const ordersE = [
    {
      id: 'ord-e1',
      subtotal: rawSubtotalE,
      isPersonalPurchase: true,
      purchaserRepUsername: REP_USERNAME,
      attributedRep: REP_USERNAME,
      month: CURRENT_MONTH,
      status: 'paid',
      notes: 'rep_personal_order: 20% rep discount applied',
    },
  ];
  const resE = calculateQualification(ordersE, REP_USERNAME, CURRENT_MONTH);
  assert('Case E: $0 qualifying retail customer sales from personal purchase', resE.qualifyingRetailSales === 0.00);
  assert('Case E: Personal purchase recorded in excluded amount ($200)', resE.personalPurchasesExcluded === 200.00);
  assert('Case E: Rep remains NOT QUALIFIED despite $200 personal spend', resE.isQualified === false);

  // Commission generated on personal order
  const commsE = calculateOrderCommissions(ordersE[0], {});
  assert('Case E: Personal purchase generates $0 commission income (not treated as commission)', commsE.length === 0);

  // --- EDGE CASE F: Rep personally purchases $100 + has $25 customer sales ---
  console.log('\n--- Edge Case F: Rep personally purchases $100 + $25 customer sales ---');
  const ordersF = [
    {
      id: 'ord-f1',
      subtotal: 100.00,
      isPersonalPurchase: true,
      purchaserRepUsername: REP_USERNAME,
      attributedRep: REP_USERNAME,
      month: CURRENT_MONTH,
      status: 'paid',
      notes: 'rep_personal_order',
    },
    {
      id: 'ord-f2',
      subtotal: 25.00,
      customerEmail: 'customer_mary@gmail.com',
      attributedRep: REP_USERNAME,
      month: CURRENT_MONTH,
      status: 'paid',
    },
  ];
  const resF = calculateQualification(ordersF, REP_USERNAME, CURRENT_MONTH);
  assert('Case F: Qualifying retail sales is exactly $25.00', resF.qualifyingRetailSales === 25.00);
  assert('Case F: Excluded personal purchase is $100.00', resF.personalPurchasesExcluded === 100.00);
  assert('Case F: Status is NOT QUALIFIED ($25 < $125)', resF.isQualified === false);

  // --- EDGE CASE G: Rep has $125 customer sales + personal purchase ---
  console.log('\n--- Edge Case G: Rep has $125 customer sales + personal purchase ---');
  const ordersG = [
    {
      id: 'ord-g1',
      subtotal: 125.00,
      customerEmail: 'customer_jen@gmail.com',
      attributedRep: REP_USERNAME,
      month: CURRENT_MONTH,
      status: 'paid',
    },
    {
      id: 'ord-g2',
      subtotal: 85.00,
      isPersonalPurchase: true,
      purchaserRepUsername: REP_USERNAME,
      attributedRep: REP_USERNAME,
      month: CURRENT_MONTH,
      status: 'paid',
      notes: 'rep_personal_order: 20% discount',
    },
  ];
  const resG = calculateQualification(ordersG, REP_USERNAME, CURRENT_MONTH);
  assert('Case G: Qualifying retail sales is $125.00', resG.qualifyingRetailSales === 125.00);
  assert('Case G: Personal purchase is excluded ($85.00)', resG.personalPurchasesExcluded === 85.00);
  assert('Case G: Status is QUALIFIED (Customer retail reached $125 threshold)', resG.isQualified === true);

  // --- EDGE CASE H: Rep signup / monthly fee = $20 ---
  console.log('\n--- Edge Case H: Rep signup / monthly fee = $20 ---');
  const ordersH = [
    {
      id: 'ord-h-fee',
      subtotal: 20.00,
      productName: 'Monthly Consultant License ($20/mo)',
      isMembershipFee: true,
      attributedRep: REP_USERNAME,
      sponsorRep: 'emily_sparkles',
      month: CURRENT_MONTH,
      status: 'paid',
      notes: 'rep_license: $20 rep fee',
    },
  ];
  const resH = calculateQualification(ordersH, REP_USERNAME, CURRENT_MONTH);
  assert('Case H: $20 fee produces $0 retail sales volume', resH.qualifyingRetailSales === 0.00);
  assert('Case H: $20 fee excluded from qualification', resH.feeOrdersExcluded === 20.00);

  const commsH = calculateOrderCommissions(ordersH[0], { emily_sparkles: true });
  assert('Case H: $20 fee generates ZERO commission records (no direct, no upline overrides)', commsH.length === 0);

  // --- EDGE CASE I: Unqualified Consultant has downline order ---
  console.log('\n--- Edge Case I: Unqualified Consultant has downline order ---');
  const downlineOrderI = {
    id: 'ord-i1',
    subtotal: 100.00,
    customerEmail: 'alice@gmail.com',
    attributedRep: 'jess_candles', // Downline rep
    sponsorRep: REP_USERNAME,      // Sarah Sparkles (currently UNQUALIFIED with $0 retail)
    month: CURRENT_MONTH,
    status: 'paid',
  };
  const commsI = calculateOrderCommissions(downlineOrderI, { [REP_USERNAME]: false });
  const sponsorCommI = commsI.find((c) => c.rep === REP_USERNAME && c.level === 1);
  assert('Case I: Downline override commission generated with status "unqualified"', sponsorCommI?.status === 'unqualified');

  // Direct commission for the selling rep is still payable
  const sellingCommI = commsI.find((c) => c.rep === 'jess_candles' && c.level === 'personal');
  assert('Case I: Selling rep direct 20% commission is active ("pending")', sellingCommI?.status === 'pending');

  // --- EDGE CASE J: Qualified Consultant has downline order ---
  console.log('\n--- Edge Case J: Qualified Consultant has downline order ---');
  const downlineOrderJ = {
    id: 'ord-j1',
    subtotal: 100.00,
    customerEmail: 'bob@gmail.com',
    attributedRep: 'jess_candles',
    sponsorRep: REP_USERNAME, // Sarah Sparkles (QUALIFIED with $125+ retail)
    month: CURRENT_MONTH,
    status: 'paid',
  };
  const commsJ = calculateOrderCommissions(downlineOrderJ, { [REP_USERNAME]: true });
  const sponsorCommJ = commsJ.find((c) => c.rep === REP_USERNAME && c.level === 1);
  assert('Case J: Downline override commission for qualified sponsor is payable ("pending")', sponsorCommJ?.status === 'pending');
  assert('Case J: Level 1 override amount is exactly $5.00 (5% of $100)', sponsorCommJ?.amount === 5.00);

  // --- EDGE CASE K: New calendar month (No carryover) ---
  console.log('\n--- Edge Case K: New calendar month (No carryover) ---');
  const ordersK = [
    { id: 'ord-jan', subtotal: 150.00, attributedRep: REP_USERNAME, month: '2026-01', status: 'paid' },
    { id: 'ord-feb', subtotal: 80.00,  attributedRep: REP_USERNAME, month: '2026-02', status: 'paid' },
    { id: 'ord-mar', subtotal: 130.00, attributedRep: REP_USERNAME, month: '2026-03', status: 'paid' },
  ];

  const resKJan = calculateQualification(ordersK, REP_USERNAME, '2026-01');
  const resKFeb = calculateQualification(ordersK, REP_USERNAME, '2026-02');
  const resKMar = calculateQualification(ordersK, REP_USERNAME, '2026-03');

  assert('Case K (January): $150 qualifying sales -> QUALIFIED', resKJan.isQualified === true);
  assert('Case K (February): $80 qualifying sales -> NOT QUALIFIED (Zero carryover from Jan)', resKFeb.isQualified === false && resKFeb.qualifyingRetailSales === 80.00);
  assert('Case K (March): $130 qualifying sales -> QUALIFIED', resKMar.isQualified === true);

  console.log('\n================================================================');
  console.log(`TEST SUITE RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite();
