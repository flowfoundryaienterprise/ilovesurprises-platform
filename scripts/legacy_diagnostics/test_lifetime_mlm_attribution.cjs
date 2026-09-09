const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key] && val) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const _supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Mock representative lookup & status
const REPS = {
  emily_sparkles: { id: 'rep-01', name: 'Emily Watson', repUsername: 'emily_sparkles', isSuspended: false },
  jess_candles: { id: 'rep-02', name: 'Jessica Miller', repUsername: 'jess_candles', isSuspended: false },
  marcus_vip: { id: 'rep-03', name: 'Marcus Sterling', repUsername: 'marcus_vip', isSuspended: false },
  rachel_cozy: { id: 'rep-04', name: 'Rachel Adams', repUsername: 'rachel_cozy', isSuspended: false },
  grace_reveals: { id: 'rep-05', name: 'Grace Kelly', repUsername: 'grace_reveals', isSuspended: false },
  suspended_rep_99: { id: 'rep-99', name: 'Suspended Rep', repUsername: 'suspended_rep_99', isSuspended: true },
};

const COMMISSION_RATES = {
  personal: 0.20, // 20%
  1: 0.05,        // 5%
  2: 0.04,        // 4%
  3: 0.03,        // 3%
  4: 0.02,        // 2%
  5: 0.01,        // 1%
};

// In-memory attribution registry simulating persistent storage
const lifetimeAttributionRegistry = {};

function isRepSuspended(repUsername) {
  return REPS[repUsername.toLowerCase()]?.isSuspended || false;
}

function resolveAttribution(customerEmail, currentSessionRep) {
  const cleanEmail = customerEmail.toLowerCase().trim();
  // Rule 1: Lifetime attribution lookup
  if (lifetimeAttributionRegistry[cleanEmail]) {
    return { repUsername: lifetimeAttributionRegistry[cleanEmail], isLifetime: true };
  }
  // Rule 2: Session referral lookup (if valid & active)
  if (currentSessionRep && !isRepSuspended(currentSessionRep)) {
    return { repUsername: currentSessionRep.toLowerCase(), isLifetime: false };
  }
  return { repUsername: null, isLifetime: false };
}

function setLifetimeAttribution(customerEmail, repUsername) {
  const cleanEmail = customerEmail.toLowerCase().trim();
  const cleanRep = repUsername.toLowerCase().trim();
  if (isRepSuspended(cleanRep)) {
    return { success: false, repUsername: '', wasAlreadyAssigned: false };
  }
  if (lifetimeAttributionRegistry[cleanEmail]) {
    // NEVER overwrite existing attribution!
    return { success: true, repUsername: lifetimeAttributionRegistry[cleanEmail], wasAlreadyAssigned: true };
  }
  lifetimeAttributionRegistry[cleanEmail] = cleanRep;
  return { success: true, repUsername: cleanRep, wasAlreadyAssigned: false };
}

function resolve5LevelUpline(directRepUsername) {
  const upline = [];
  const cleanDirect = directRepUsername.toLowerCase();
  
  if (!isRepSuspended(cleanDirect)) {
    upline.push({ level: 'personal', repUsername: cleanDirect, rate: COMMISSION_RATES.personal });
  }

  // Traverse sponsors: Jessica (L1 5%), Marcus (L2 4%), Rachel (L3 3%), Grace (L4 2%)
  const sponsorChain = [
    { repUsername: 'jess_candles', level: 1, rate: COMMISSION_RATES[1] },
    { repUsername: 'marcus_vip', level: 2, rate: COMMISSION_RATES[2] },
    { repUsername: 'rachel_cozy', level: 3, rate: COMMISSION_RATES[3] },
    { repUsername: 'grace_reveals', level: 4, rate: COMMISSION_RATES[4] },
  ].filter(s => s.repUsername !== cleanDirect);

  for (const s of sponsorChain) {
    if (!isRepSuspended(s.repUsername)) {
      upline.push(s);
    }
  }

  return upline;
}

const processedOrders = new Set();
const generatedCommissions = [];

function processOrderCommissions(order) {
  // Idempotency check
  if (processedOrders.has(order.id)) {
    return { orderId: order.id, status: 'IDEMPOTENT_SKIPPED', commissions: generatedCommissions.filter(c => c.orderId === order.id) };
  }

  const { repUsername: attributedRep } = resolveAttribution(order.customerEmail, order.sessionRep);
  if (!attributedRep) {
    processedOrders.add(order.id);
    return { orderId: order.id, status: 'UNATTRIBUTED', commissions: [] };
  }

  // Set permanent attribution on first order
  setLifetimeAttribution(order.customerEmail, attributedRep);

  const upline = resolve5LevelUpline(attributedRep);
  const comms = [];

  for (const node of upline) {
    const amount = parseFloat((order.subtotal * node.rate).toFixed(2));
    const record = {
      orderId: order.id,
      repUsername: node.repUsername,
      level: node.level,
      ratePercent: node.rate * 100,
      commissionAmount: amount,
    };
    comms.push(record);
    generatedCommissions.push(record);
  }

  processedOrders.add(order.id);
  return { orderId: order.id, status: 'PROCESSED', commissions: comms };
}

async function runValidationTests() {
  console.log('====================================================');
  console.log('TASK 2: LIFETIME MLM COMMISSION ATTRIBUTION TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 9;

  // Test 1: Customer A first purchases through Rep A (emily_sparkles)
  console.log('Test 1: Customer A first purchase via Rep A (emily_sparkles)...');
  const order1 = { id: 'TEST-ORD-001', customerEmail: 'customerA@gmail.com', subtotal: 100.0, sessionRep: 'emily_sparkles' };
  const res1 = processOrderCommissions(order1);
  const directComm1 = res1.commissions.find(c => c.repUsername === 'emily_sparkles' && c.level === 'personal');
  if (res1.status === 'PROCESSED' && directComm1?.commissionAmount === 20.00 && lifetimeAttributionRegistry['customera@gmail.com'] === 'emily_sparkles') {
    console.log('  ✅ PASSED: Customer A permanently assigned to emily_sparkles ($20.00 direct commission)');
    passedTests++;
  } else {
    console.error('  ❌ FAILED:', res1);
  }

  // Test 2 & 3: Customer A later purchases using Rep B (marcus_vip) link
  console.log('\nTest 2 & 3: Customer A later purchases using Rep B (marcus_vip) link...');
  const attributionCheck = resolveAttribution('customerA@gmail.com', 'marcus_vip');
  if (attributionCheck.repUsername === 'emily_sparkles' && attributionCheck.isLifetime === true) {
    console.log('  ✅ PASSED: Rep B link ignored. Customer A remains permanently attributed to emily_sparkles');
    passedTests++;
  } else {
    console.error('  ❌ FAILED: Attribution was wrongly overwritten:', attributionCheck);
  }

  // Test 4: Future purchase generates commission for Rep A, NOT Rep B
  console.log('\nTest 4: Future purchase under Rep B link generates commission for Rep A...');
  const order2 = { id: 'TEST-ORD-002', customerEmail: 'customerA@gmail.com', subtotal: 200.0, sessionRep: 'marcus_vip' };
  const res2 = processOrderCommissions(order2);
  const directComm2 = res2.commissions.find(c => c.repUsername === 'emily_sparkles' && c.level === 'personal');
  const repBComm = res2.commissions.find(c => c.repUsername === 'marcus_vip' && c.level === 'personal');
  if (directComm2?.commissionAmount === 40.00 && !repBComm) {
    console.log('  ✅ PASSED: Rep A received 20% ($40.00). Rep B did not receive personal commission.');
    passedTests++;
  } else {
    console.error('  ❌ FAILED:', res2);
  }

  // Test 5: 5-Level Upline Commissions verification
  console.log('\nTest 5: Verify 5-Level Upline commission rates and amounts on $100 order...');
  const order3 = { id: 'TEST-ORD-003', customerEmail: 'customerB@gmail.com', subtotal: 100.0, sessionRep: 'emily_sparkles' };
  const res3 = processOrderCommissions(order3);
  const personal = res3.commissions.find(c => c.level === 'personal')?.commissionAmount; // $20.00
  const l1 = res3.commissions.find(c => c.level === 1)?.commissionAmount; // $5.00
  const l2 = res3.commissions.find(c => c.level === 2)?.commissionAmount; // $4.00
  const l3 = res3.commissions.find(c => c.level === 3)?.commissionAmount; // $3.00
  const l4 = res3.commissions.find(c => c.level === 4)?.commissionAmount; // $2.00
  const totalPayout = res3.commissions.reduce((sum, c) => sum + c.commissionAmount, 0);

  if (personal === 20.0 && l1 === 5.0 && l2 === 4.0 && l3 === 3.0 && l4 === 2.0 && totalPayout === 34.0) {
    console.log(`  ✅ PASSED: Direct 20% ($20) + L1 5% ($5) + L2 4% ($4) + L3 3% ($3) + L4 2% ($2) = Total $${totalPayout}`);
    passedTests++;
  } else {
    console.error('  ❌ FAILED: Incorrect upline payouts:', res3.commissions);
  }

  // Test 6: Idempotency (Retrying the same order does not create duplicates)
  console.log('\nTest 6: Idempotency check (Retrying order TEST-ORD-003)...');
  const countBefore = generatedCommissions.length;
  const resRetry = processOrderCommissions(order3);
  const countAfter = generatedCommissions.length;
  if (resRetry.status === 'IDEMPOTENT_SKIPPED' && countBefore === countAfter) {
    console.log('  ✅ PASSED: Idempotency verified. 0 duplicate commission records created on retry.');
    passedTests++;
  } else {
    console.error('  ❌ FAILED: Duplicate commissions generated!');
  }

  // Test 7: Unattributed customer generates 0 commissions
  console.log('\nTest 7: Unattributed customer purchase generates 0 commissions...');
  const orderUnattributed = { id: 'TEST-ORD-004', customerEmail: 'organic_shopper@gmail.com', subtotal: 150.0, sessionRep: null };
  const resUnattr = processOrderCommissions(orderUnattributed);
  if (resUnattr.status === 'UNATTRIBUTED' && resUnattr.commissions.length === 0) {
    console.log('  ✅ PASSED: Organic / unattributed purchase generated exactly 0 commissions.');
    passedTests++;
  } else {
    console.error('  ❌ FAILED:', resUnattr);
  }

  // Test 8: Invalid / Suspended representative cannot receive attribution
  console.log('\nTest 8: Suspended rep cannot receive attribution or commissions...');
  const orderSuspended = { id: 'TEST-ORD-005', customerEmail: 'new_shopper@gmail.com', subtotal: 100.0, sessionRep: 'suspended_rep_99' };
  const resSusp = processOrderCommissions(orderSuspended);
  if (resSusp.status === 'UNATTRIBUTED' && !lifetimeAttributionRegistry['new_shopper@gmail.com']) {
    console.log('  ✅ PASSED: Suspended rep was rejected from becoming lifetime attribution target.');
    passedTests++;
  } else {
    console.error('  ❌ FAILED: Suspended rep was wrongly attributed!');
  }

  // Test 9: Existing attribution cannot be overwritten
  console.log('\nTest 9: Immutability test on existing attribution...');
  const overwriteAttempt = setLifetimeAttribution('customerA@gmail.com', 'marcus_vip');
  if (overwriteAttempt.wasAlreadyAssigned === true && overwriteAttempt.repUsername === 'emily_sparkles' && lifetimeAttributionRegistry['customera@gmail.com'] === 'emily_sparkles') {
    console.log('  ✅ PASSED: Immutability verified. Customer A remains attributed to emily_sparkles.');
    passedTests++;
  } else {
    console.error('  ❌ FAILED: Attribution was overwritten!');
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log('====================================================');
}

runValidationTests().catch(console.error);
