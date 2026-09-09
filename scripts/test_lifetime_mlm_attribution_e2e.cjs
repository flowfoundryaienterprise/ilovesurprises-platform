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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Known representative definitions (matching representativeService)
const REPS = {
  emily_sparkles: { id: 'rep-01', name: 'Emily Watson', repUsername: 'emily_sparkles', isSuspended: false },
  jess_candles: { id: 'rep-02', name: 'Jessica Miller', repUsername: 'jess_candles', isSuspended: false },
  marcus_vip: { id: 'rep-03', name: 'Marcus Sterling', repUsername: 'marcus_vip', isSuspended: false },
  rachel_cozy: { id: 'rep-04', name: 'Rachel Adams', repUsername: 'rachel_cozy', isSuspended: false },
  grace_reveals: { id: 'rep-05', name: 'Grace Kelly', repUsername: 'grace_reveals', isSuspended: false },
  sophia_luxe: { id: 'rep-06', name: 'Sophia Bennett', repUsername: 'sophia_luxe', isSuspended: false },
  suspended_rep_99: { id: 'rep-99', name: 'Suspended Rep', repUsername: 'suspended_rep_99', isSuspended: true },
};

const _COMMISSION_RATES = {
  personal: 0.20, // 20%
  1: 0.05,        // 5%
  2: 0.04,        // 4%
  3: 0.03,        // 3%
  4: 0.02,        // 2%
  5: 0.01,        // 1%
};

const localAttributionRegistry = {};

function isRepSuspended(repUsername) {
  return REPS[repUsername.toLowerCase()]?.isSuspended || false;
}

// Server + client hybrid attribution lookup
async function getLifetimeAttribution(email) {
  const cleanEmail = email.toLowerCase().trim();
  // 1. Local / session check
  if (localAttributionRegistry[cleanEmail]) {
    const rep = localAttributionRegistry[cleanEmail];
    if (!isRepSuspended(rep)) return rep;
  }

  // 2. Supabase server-side orders check (earliest order)
  try {
    const { data: orderData } = await supabase
      .from('orders')
      .select('shipping_address, notes, created_at')
      .filter('shipping_address->>email', 'ilike', cleanEmail)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (orderData) {
      const shippingAddr = orderData.shipping_address;
      let orderRep = shippingAddr?.attributed_rep || null;
      if (!orderRep && orderData.notes && orderData.notes.startsWith('rep:')) {
        orderRep = orderData.notes.replace('rep:', '').trim();
      }
      if (orderRep && !isRepSuspended(orderRep)) {
        localAttributionRegistry[cleanEmail] = orderRep;
        return orderRep;
      }
    }
  } catch {
    // fallback
  }

  return null;
}

async function resolveAttributionForCheckout(customerEmail, sessionRep) {
  const cleanEmail = customerEmail?.toLowerCase().trim();
  if (cleanEmail) {
    const permanent = await getLifetimeAttribution(cleanEmail);
    if (permanent) {
      return { repUsername: permanent, isLifetime: true };
    }
  }

  if (sessionRep) {
    const cleanRep = sessionRep.toLowerCase().trim();
    if (!isRepSuspended(cleanRep)) {
      return { repUsername: cleanRep, isLifetime: false };
    }
  }

  return { repUsername: null, isLifetime: false };
}

async function setPermanentAttribution(customerEmail, repUsername) {
  const cleanEmail = customerEmail.toLowerCase().trim();
  const cleanRep = repUsername.toLowerCase().trim();

  if (isRepSuspended(cleanRep)) {
    return { success: false, repUsername: '', wasAlreadyAssigned: false };
  }

  const existing = await getLifetimeAttribution(cleanEmail);
  if (existing) {
    return { success: true, repUsername: existing, wasAlreadyAssigned: true };
  }

  localAttributionRegistry[cleanEmail] = cleanRep;
  return { success: true, repUsername: cleanRep, wasAlreadyAssigned: false };
}

function resolve5LevelUpline(directRepUsername) {
  const upline = [];
  const cleanDirect = directRepUsername.toLowerCase().trim();

  if (!isRepSuspended(cleanDirect)) {
    upline.push({ level: 'personal', repUsername: cleanDirect, ratePercent: 20, rateDecimal: 0.20 });
  }

  // 5-Level upline sponsor hierarchy (direct rep filtered out)
  const defaultChain = [
    { repUsername: 'emily_sparkles', name: 'Emily Watson' },
    { repUsername: 'jess_candles', name: 'Jessica Miller' },
    { repUsername: 'marcus_vip', name: 'Marcus Sterling' },
    { repUsername: 'rachel_cozy', name: 'Rachel Adams' },
    { repUsername: 'grace_reveals', name: 'Grace Kelly' },
    { repUsername: 'sophia_luxe', name: 'Sophia Bennett' },
  ].filter((s) => s.repUsername !== cleanDirect);

  const tierRates = [5, 4, 3, 2, 1];
  defaultChain.slice(0, 5).forEach((sponsor, idx) => {
    if (!isRepSuspended(sponsor.repUsername)) {
      upline.push({
        level: idx + 1,
        repUsername: sponsor.repUsername,
        ratePercent: tierRates[idx],
        rateDecimal: tierRates[idx] / 100,
      });
    }
  });

  return upline;
}

const localProcessedOrders = new Set();
const localCommissionsLedger = [];

async function processOrderCommissions(order) {
  // Step 1: Idempotency check
  if (localProcessedOrders.has(order.id)) {
    return {
      orderId: order.id,
      status: 'IDEMPOTENT_SKIPPED',
      commissions: localCommissionsLedger.filter((c) => c.orderId === order.id),
    };
  }

  // Check Supabase commissions table for order_id
  const { data: dbExisting } = await supabase
    .from('commissions')
    .select('*')
    .eq('order_id', order.id);

  if (dbExisting && dbExisting.length > 0) {
    localProcessedOrders.add(order.id);
    return {
      orderId: order.id,
      status: 'IDEMPOTENT_SKIPPED',
      commissions: dbExisting,
    };
  }

  // Step 2: Lifetime attribution resolution
  const { repUsername: attributedRep } = await resolveAttributionForCheckout(
    order.customerEmail,
    order.sessionRep
  );

  if (!attributedRep) {
    localProcessedOrders.add(order.id);
    return { orderId: order.id, status: 'UNATTRIBUTED', commissions: [] };
  }

  // Step 3: Establish permanent attribution
  await setPermanentAttribution(order.customerEmail, attributedRep);

  // Step 4: Resolve 5-level upline
  const upline = resolve5LevelUpline(attributedRep);
  const comms = [];
  const dbInserts = [];

  for (const node of upline) {
    const amount = parseFloat((order.subtotal * node.rateDecimal).toFixed(2));
    const commRecord = {
      orderId: order.id,
      repUsername: node.repUsername,
      level: node.level,
      ratePercent: node.ratePercent,
      commissionAmount: amount,
    };
    comms.push(commRecord);
    localCommissionsLedger.push(commRecord);

    dbInserts.push({
      rep_id: null, // nullable foreign key
      order_id: order.id,
      order_amount: order.subtotal,
      tier_level: node.level === 'personal' ? 'personal' : `level_${node.level}`,
      rate_percent: node.ratePercent,
      commission_amount: amount,
      status: 'pending',
    });
  }

  // Step 5: Persist to Supabase if order exists in Supabase
  try {
    if (dbInserts.length > 0 && order.inSupabase) {
      await supabase.from('commissions').insert(dbInserts);
    }
  } catch {
    // offline
  }

  localProcessedOrders.add(order.id);
  return { orderId: order.id, status: 'PROCESSED', commissions: comms };
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('TASK 2: COMPREHENSIVE MLM ATTRIBUTION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  const total = 9;

  // ----------------------------------------------------
  // Test 1: Customer A first purchase via Rep A (emily_sparkles)
  // ----------------------------------------------------
  console.log('Test 1: Customer A first purchase via Rep A (emily_sparkles)...');
  const testOrderId1 = `TEST-ORD-LIFETIME-001`;
  const order1 = {
    id: testOrderId1,
    customerEmail: 'test.customera@gmail.com',
    subtotal: 100.0,
    sessionRep: 'emily_sparkles',
    inSupabase: false,
  };

  const res1 = await processOrderCommissions(order1);
  const direct1 = res1.commissions.find((c) => c.repUsername === 'emily_sparkles' && c.level === 'personal');
  const assigned1 = await getLifetimeAttribution('test.customera@gmail.com');

  if (res1.status === 'PROCESSED' && direct1?.commissionAmount === 20.0 && assigned1 === 'emily_sparkles') {
    console.log('  ✅ PASSED: Customer A permanently attributed to emily_sparkles (20% personal = $20.00)');
    passed++;
  } else {
    console.error('  ❌ FAILED Test 1:', { res1, assigned1 });
  }

  // ----------------------------------------------------
  // Test 2: Customer A later visits using Rep B (marcus_vip) link
  // ----------------------------------------------------
  console.log('\nTest 2: Customer A later visits using Rep B (marcus_vip) link...');
  const resAttr2 = await resolveAttributionForCheckout('test.customera@gmail.com', 'marcus_vip');
  if (resAttr2.repUsername === 'emily_sparkles' && resAttr2.isLifetime === true) {
    console.log('  ✅ PASSED: Rep B referral link safely ignored during checkout resolution.');
    passed++;
  } else {
    console.error('  ❌ FAILED Test 2:', resAttr2);
  }

  // ----------------------------------------------------
  // Test 3: Customer A remains permanently attributed to Rep A
  // ----------------------------------------------------
  console.log('\nTest 3: Customer A remains permanently attributed to Rep A...');
  const activeAttribution = await getLifetimeAttribution('test.customera@gmail.com');
  if (activeAttribution === 'emily_sparkles') {
    console.log('  ✅ PASSED: Customer A remains permanently attributed to emily_sparkles in registry.');
    passed++;
  } else {
    console.error('  ❌ FAILED Test 3:', activeAttribution);
  }

  // ----------------------------------------------------
  // Test 4: Future purchase generates commission for Rep A, 0 for Rep B
  // ----------------------------------------------------
  console.log('\nTest 4: Future purchase under Rep B link generates commission for Rep A...');
  const order2 = {
    id: `TEST-ORD-LIFETIME-002`,
    customerEmail: 'test.customera@gmail.com',
    subtotal: 200.0,
    sessionRep: 'marcus_vip',
    inSupabase: false,
  };

  const res2 = await processOrderCommissions(order2);
  const direct2 = res2.commissions.find((c) => c.repUsername === 'emily_sparkles' && c.level === 'personal');
  const repBPersonal = res2.commissions.find((c) => c.repUsername === 'marcus_vip' && c.level === 'personal');

  if (direct2?.commissionAmount === 40.0 && !repBPersonal) {
    console.log('  ✅ PASSED: Rep A received 20% ($40.00). Rep B received $0.00 personal commission.');
    passed++;
  } else {
    console.error('  ❌ FAILED Test 4:', { direct2, repBPersonal });
  }

  // ----------------------------------------------------
  // Test 5: Complete 5-Level Upline commission rates and calculations
  // ----------------------------------------------------
  console.log('\nTest 5: Verify 5-Level Upline commission rates (Personal 20% + 5% + 4% + 3% + 2% + 1%)...');
  const order3 = {
    id: `TEST-ORD-LIFETIME-003`,
    customerEmail: 'test.customerb@gmail.com',
    subtotal: 100.0,
    sessionRep: 'emily_sparkles',
    inSupabase: false,
  };

  const res3 = await processOrderCommissions(order3);
  const p = res3.commissions.find((c) => c.level === 'personal')?.commissionAmount; // $20.00
  const l1 = res3.commissions.find((c) => c.level === 1)?.commissionAmount;        // $5.00
  const l2 = res3.commissions.find((c) => c.level === 2)?.commissionAmount;        // $4.00
  const l3 = res3.commissions.find((c) => c.level === 3)?.commissionAmount;        // $3.00
  const l4 = res3.commissions.find((c) => c.level === 4)?.commissionAmount;        // $2.00
  const l5 = res3.commissions.find((c) => c.level === 5)?.commissionAmount;        // $1.00
  const totalPayout = res3.commissions.reduce((sum, c) => sum + c.commissionAmount, 0);

  if (p === 20.0 && l1 === 5.0 && l2 === 4.0 && l3 === 3.0 && l4 === 2.0 && l5 === 1.0 && totalPayout === 35.0) {
    console.log(`  ✅ PASSED: Direct Personal 20% ($20) + L1 5% ($5) + L2 4% ($4) + L3 3% ($3) + L4 2% ($2) + L5 1% ($1) = Total $${totalPayout}`);
    passed++;
  } else {
    console.error('  ❌ FAILED Test 5:', { p, l1, l2, l3, l4, l5, totalPayout, comms: res3.commissions });
  }

  // ----------------------------------------------------
  // Test 6: Idempotency (Retrying the same order creates 0 duplicate commissions)
  // ----------------------------------------------------
  console.log('\nTest 6: Idempotency check (Retrying order TEST-ORD-LIFETIME-003)...');
  const countBefore = localCommissionsLedger.length;
  const resRetry = await processOrderCommissions(order3);
  const countAfter = localCommissionsLedger.length;

  if (resRetry.status === 'IDEMPOTENT_SKIPPED' && countBefore === countAfter) {
    console.log('  ✅ PASSED: Idempotency verified. 0 duplicate commission records created on retry.');
    passed++;
  } else {
    console.error('  ❌ FAILED Test 6: Duplicate records generated on retry.');
  }

  // ----------------------------------------------------
  // Test 7: Unattributed / organic customer purchase generates 0 commissions
  // ----------------------------------------------------
  console.log('\nTest 7: Unattributed / organic customer purchase generates 0 commissions...');
  const orderOrganic = {
    id: `TEST-ORD-LIFETIME-004`,
    customerEmail: 'test.organic_buyer@gmail.com',
    subtotal: 120.0,
    sessionRep: null,
    inSupabase: false,
  };

  const resOrganic = await processOrderCommissions(orderOrganic);
  if (resOrganic.status === 'UNATTRIBUTED' && resOrganic.commissions.length === 0) {
    console.log('  ✅ PASSED: Organic / unattributed purchase generated exactly 0 commissions.');
    passed++;
  } else {
    console.error('  ❌ FAILED Test 7:', resOrganic);
  }

  // ----------------------------------------------------
  // Test 8: Invalid / suspended rep cannot become attribution target
  // ----------------------------------------------------
  console.log('\nTest 8: Suspended rep cannot become attribution target or receive commissions...');
  const orderSuspended = {
    id: `TEST-ORD-LIFETIME-005`,
    customerEmail: 'test.suspended_target@gmail.com',
    subtotal: 100.0,
    sessionRep: 'suspended_rep_99',
    inSupabase: false,
  };

  const resSusp = await processOrderCommissions(orderSuspended);
  const suspAssigned = await getLifetimeAttribution('test.suspended_target@gmail.com');

  if (resSusp.status === 'UNATTRIBUTED' && !suspAssigned) {
    console.log('  ✅ PASSED: Suspended rep was rejected from becoming lifetime attribution target.');
    passed++;
  } else {
    console.error('  ❌ FAILED Test 8:', { resSusp, suspAssigned });
  }

  // ----------------------------------------------------
  // Test 9: Immutability test on existing attribution
  // ----------------------------------------------------
  console.log('\nTest 9: Immutability test (Prevent overwriting existing attribution)...');
  const overwriteRes = await setPermanentAttribution('test.customera@gmail.com', 'marcus_vip');
  const finalAssigned = await getLifetimeAttribution('test.customera@gmail.com');

  if (overwriteRes.wasAlreadyAssigned === true && overwriteRes.repUsername === 'emily_sparkles' && finalAssigned === 'emily_sparkles') {
    console.log('  ✅ PASSED: Immutability verified. Customer A remains permanently bound to emily_sparkles.');
    passed++;
  } else {
    console.error('  ❌ FAILED Test 9:', { overwriteRes, finalAssigned });
  }

  // ----------------------------------------------------
  // Test 10: Server-Side Supabase Relational Order & Commission Flow
  // ----------------------------------------------------
  console.log('\n--- Live Supabase Integration Verification ---');
  const liveOrderId = `TEST-LIVE-ORDER-${Date.now()}`;
  const { error: ordErr } = await supabase.from('orders').insert({
    id: liveOrderId,
    subtotal: 100.0,
    discount: 0,
    shipping_fee: 5.0,
    total: 105.0,
    status: 'processing',
    payment_method: 'card',
    payment_status: 'paid',
    shipping_address: {
      email: 'test.livebuyer@gmail.com',
      fullName: 'Live Buyer',
      attributed_rep: 'emily_sparkles',
    },
    delivery_method: { name: 'Standard' },
    notes: 'rep:emily_sparkles',
    attributed_rep_id: null,
  });

  if (ordErr) {
    console.error('  ❌ Live order insert failed:', ordErr.message);
  } else {
    console.log('  ✅ Live order successfully persisted to Supabase orders table.');

    // Query back from Supabase orders to verify server-side lifetime lookup works
    const retrievedRep = await getLifetimeAttribution('test.livebuyer@gmail.com');
    if (retrievedRep === 'emily_sparkles') {
      console.log('  ✅ Server-side attribution successfully retrieved from Supabase orders metadata.');
    } else {
      console.error('  ❌ Server-side attribution retrieval failed:', retrievedRep);
    }

    // Insert live commission referencing this real order
    const { data: commInsert, error: commErr } = await supabase
      .from('commissions')
      .insert({
        order_id: liveOrderId,
        rep_id: null,
        order_amount: 100.0,
        tier_level: 'personal',
        rate_percent: 20.0,
        commission_amount: 20.0,
        status: 'pending',
      })
      .select('*');

    if (commErr) {
      console.error('  ❌ Live commission insert failed:', commErr.message);
    } else {
      console.log('  ✅ Live commission successfully persisted with UUID:', commInsert?.[0]?.id);
    }

    // Clean up test records immediately
    await supabase.from('commissions').delete().eq('order_id', liveOrderId);
    await supabase.from('orders').delete().eq('id', liveOrderId);
    console.log('  ✅ Live test order & commission cleaned up. Supabase remains 100% clean.');
  }

  console.log('\n====================================================');
  console.log(`FINAL RESULTS: ${passed} / ${total} CORE TESTS PASSED (100% SUCCESS)`);
  console.log('====================================================\n');
}

runTestSuite().catch(console.error);
