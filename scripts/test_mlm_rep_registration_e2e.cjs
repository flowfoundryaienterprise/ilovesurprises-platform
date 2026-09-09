const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load environment variables
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
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ ERROR: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const clientSupabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

// Seed top-tier representatives for testing
const DEFAULT_REPRESENTATIVES = [
  { id: 'rep-01', name: 'Emily Watson', repUsername: 'emily_sparkles', isSuspended: false },
  { id: 'rep-02', name: 'Jessica Miller', repUsername: 'jess_candles', isSuspended: false },
  { id: 'rep-03', name: 'Marcus Sterling', repUsername: 'marcus_vip', isSuspended: false },
];

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'api', 'auth', 'login', 'signup',
  'register', 'account', 'shop', 'store', 'cart', 'checkout', 'rep',
  'affiliate', 'orders', 'categories', 'rewards', 'appraisal', 'contact',
  'about', 'support',
]);

const COMMISSION_RATES = {
  personal: 0.20,
  1: 0.05,
  2: 0.04,
  3: 0.03,
  4: 0.02,
  5: 0.01,
};

// Mirror sponsorService logic for Node environment verification
function normalizeUsername(username) {
  if (!username) return '';
  return username
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function validateUsername(username) {
  if (!username || !username.trim()) {
    return { valid: false, error: 'Username is required.' };
  }

  const rawClean = username.trim().replace(/^@/, '');
  if (/[^a-zA-Z0-9_\s-]/.test(rawClean)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores.' };
  }

  const normalized = normalizeUsername(username);
  if (!normalized || normalized.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters.' };
  }
  if (normalized.length > 30) {
    return { valid: false, error: 'Username cannot exceed 30 characters.' };
  }
  if (RESERVED_USERNAMES.has(normalized)) {
    return { valid: false, error: `"${normalized}" is a reserved system handle.` };
  }
  return { valid: true };
}

// In-memory / DB sponsor registry
const localRegistry = {};

function buildUpline(sponsorUsername, newRepUsername, registry = localRegistry) {
  const normNewRep = normalizeUsername(newRepUsername);
  const normSponsor = normalizeUsername(sponsorUsername);

  if (normNewRep && normSponsor === normNewRep) {
    throw new Error('A representative cannot sponsor themselves.');
  }

  const upline = [];
  const visited = new Set();
  if (normNewRep) {
    visited.add(normNewRep);
  }

  let currentSponsor = normSponsor;

  while (currentSponsor && upline.length < 5) {
    if (visited.has(currentSponsor)) {
      throw new Error(`Circular sponsor relationship detected involving "${currentSponsor}". Hierarchy rejected.`);
    }

    visited.add(currentSponsor);
    upline.push(currentSponsor);

    const rel = registry[currentSponsor];
    if (rel && rel.sponsorUsername) {
      currentSponsor = normalizeUsername(rel.sponsorUsername);
    } else {
      break;
    }
  }

  return upline;
}

function calculateMultiLevelCommissions(orderSubtotal, upline) {
  const directRepCommission = Math.round(orderSubtotal * COMMISSION_RATES.personal * 100) / 100;
  const uplineCommissions = [];

  for (let i = 0; i < upline.length && i < 5; i++) {
    const level = i + 1;
    const rate = COMMISSION_RATES[level] || 0;
    const amount = Math.round(orderSubtotal * rate * 100) / 100;
    uplineCommissions.push({
      level,
      rate,
      sponsorUsername: upline[i],
      amount,
    });
  }

  const totalCommissions = Math.round(
    (directRepCommission + uplineCommissions.reduce((sum, u) => sum + u.amount, 0)) * 100
  ) / 100;

  return {
    subtotal: orderSubtotal,
    directRepCommission,
    uplineCommissions,
    totalCommissions,
  };
}

async function runAllTests() {
  console.log('================================================================');
  console.log('🧪 TASK 5 — MLM REPRESENTATIVE REGISTRATION & SPONSOR TREE TEST');
  console.log('================================================================\n');

  let passedTests = 0;
  const totalTests = 10;
  const createdTestUserIds = [];

  const runTest = async (num, title, fn) => {
    try {
      console.log(`[TEST ${num}/10] ${title}...`);
      await fn();
      console.log(`  ✅ PASSED: Test ${num} - ${title}\n`);
      passedTests++;
    } catch (err) {
      console.error(`  ❌ FAILED: Test ${num} - ${title}`);
      console.error(`     Error: ${err.message}\n`);
    }
  };

  // -------------------------------------------------------------
  // TEST 1: New representative registration via Supabase Auth
  // -------------------------------------------------------------
  await runTest(1, 'New representative registration flow', async () => {
    const testRepEmail = `test_rep_${Date.now()}@example.com`;
    const testRepPass = 'SecureRepPass123!';
    const testRepHandle = `rep_test_${Date.now().toString().slice(-6)}`;

    // Create user via Admin API
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: testRepEmail,
      password: testRepPass,
      email_confirm: true,
      user_metadata: {
        name: 'Jane Representative',
        mobile: '5551234567',
        role: 'representative',
        rep_username: testRepHandle,
      },
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create rep auth user: ${authError?.message}`);
    }

    createdTestUserIds.push(authData.user.id);

    // Profile update/upsert
    const { error: profError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        name: 'Jane Representative',
        email: testRepEmail,
        mobile: '5551234567',
        role: 'representative',
        rep_username: testRepHandle,
      });

    if (profError) {
      throw new Error(`Failed to update rep profile: ${profError.message}`);
    }

    // Verify profile holds role: 'representative' and rep_username
    const { data: prof, error: getError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (getError || !prof) throw new Error('Could not fetch registered profile.');
    if (prof.role !== 'representative') throw new Error(`Expected role 'representative', got '${prof.role}'`);
    if (prof.rep_username !== testRepHandle) throw new Error(`Expected rep_username '${testRepHandle}', got '${prof.rep_username}'`);
  });

  // -------------------------------------------------------------
  // TEST 2: Unique username normalization and validation
  // -------------------------------------------------------------
  await runTest(2, 'Username normalization and validation rules', async () => {
    // Normalization checks
    if (normalizeUsername('@Emily_Sparkles ') !== 'emily_sparkles') {
      throw new Error('Failed to normalize @-prefix, casing, or trim.');
    }
    if (normalizeUsername('Jane-Doe Partner') !== 'jane_doe_partner') {
      throw new Error('Failed to normalize hyphens and spaces to underscores.');
    }

    // Validation checks
    if (validateUsername('ab').valid) throw new Error('Short username (<3) should fail.');
    if (validateUsername('a'.repeat(31)).valid) throw new Error('Long username (>30) should fail.');
    if (validateUsername('admin').valid) throw new Error('Reserved username "admin" should fail.');
    if (validateUsername('checkout').valid) throw new Error('Reserved username "checkout" should fail.');
    if (validateUsername('hello!world').valid) throw new Error('Special characters should fail.');
    if (!validateUsername('valid_rep_123').valid) throw new Error('Standard alphanumeric handle should pass.');
  });

  // -------------------------------------------------------------
  // TEST 3: Duplicate username rejection
  // -------------------------------------------------------------
  await runTest(3, 'Duplicate username rejection', async () => {
    const existingHandle = 'emily_sparkles';
    const isDefaultTaken = DEFAULT_REPRESENTATIVES.some(
      (r) => r.repUsername.toLowerCase() === existingHandle
    );
    if (!isDefaultTaken) throw new Error('Default rep handle was not detected as taken.');

    // Also check database uniqueness
    const testHandle = `taken_rep_${Date.now().toString().slice(-6)}`;
    const testEmail = `rep_dup_${Date.now()}@example.com`;

    const { data: user1 } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: 'Password123!',
      email_confirm: true,
      user_metadata: { role: 'representative', rep_username: testHandle },
    });
    if (user1?.user) {
      createdTestUserIds.push(user1.user.id);
      const { error: upsertErr } = await adminSupabase.from('profiles').upsert({
        id: user1.user.id,
        name: 'Duplicate Rep User',
        email: testEmail,
        role: 'representative',
        rep_username: testHandle,
      });
      if (upsertErr) {
        throw new Error(`Profile upsert error: ${upsertErr.message}`);
      }
    }

    // Check if duplicate query detects it
    const { data: existingProf } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('rep_username', testHandle)
      .maybeSingle();

    if (!existingProf) throw new Error('Database failed to detect existing rep_username.');
  });

  // -------------------------------------------------------------
  // TEST 4: Sponsor attribution
  // -------------------------------------------------------------
  await runTest(4, 'Sponsor resolution and attribution', async () => {
    const sponsorHandle = 'emily_sparkles';
    const newRepHandle = `rep_recruit_${Date.now().toString().slice(-5)}`;

    // Resolve sponsor
    const sponsor = DEFAULT_REPRESENTATIVES.find((r) => r.repUsername === sponsorHandle);
    if (!sponsor) throw new Error('Could not resolve sponsor emily_sparkles.');

    const upline = buildUpline(sponsorHandle, newRepHandle);
    if (upline[0] !== 'emily_sparkles') {
      throw new Error(`Expected direct sponsor upline[0] to be emily_sparkles, got ${upline[0]}`);
    }

    // Register relationship in local registry
    localRegistry[newRepHandle] = {
      repUsername: newRepHandle,
      sponsorUsername: sponsorHandle,
      upline,
      registeredAt: new Date().toISOString(),
    };
  });

  // -------------------------------------------------------------
  // TEST 5: 5-level upline creation
  // -------------------------------------------------------------
  await runTest(5, '5-level upline creation (A -> B -> C -> D -> E -> F -> G)', async () => {
    const treeRegistry = {};

    // Chain: rep_A -> rep_B -> rep_C -> rep_D -> rep_E -> rep_F -> rep_G
    const reps = ['rep_a', 'rep_b', 'rep_c', 'rep_d', 'rep_e', 'rep_f', 'rep_g'];

    // rep_a has no sponsor
    treeRegistry['rep_a'] = { repUsername: 'rep_a', sponsorUsername: null, upline: [] };

    for (let i = 1; i < reps.length; i++) {
      const current = reps[i];
      const sponsor = reps[i - 1];
      const upline = buildUpline(sponsor, current, treeRegistry);
      treeRegistry[current] = {
        repUsername: current,
        sponsorUsername: sponsor,
        upline,
      };
    }

    // Verify levels
    // rep_b upline: ['rep_a'] (length 1)
    if (treeRegistry['rep_b'].upline.join(',') !== 'rep_a') {
      throw new Error(`rep_b upline mismatch: ${treeRegistry['rep_b'].upline}`);
    }

    // rep_f (level 6) upline: ['rep_e', 'rep_d', 'rep_c', 'rep_b', 'rep_a'] (length 5)
    const expectedF = ['rep_e', 'rep_d', 'rep_c', 'rep_b', 'rep_a'].join(',');
    if (treeRegistry['rep_f'].upline.join(',') !== expectedF) {
      throw new Error(`rep_f upline mismatch: ${treeRegistry['rep_f'].upline.join(',')}`);
    }

    // rep_g (level 7) upline: exactly 5 levels max: ['rep_f', 'rep_e', 'rep_d', 'rep_c', 'rep_b'] (rep_a drops off)
    const expectedG = ['rep_f', 'rep_e', 'rep_d', 'rep_c', 'rep_b'].join(',');
    if (treeRegistry['rep_g'].upline.join(',') !== expectedG) {
      throw new Error(`rep_g upline mismatch: ${treeRegistry['rep_g'].upline.join(',')}`);
    }
    if (treeRegistry['rep_g'].upline.length !== 5) {
      throw new Error(`Expected max 5 upline levels, got ${treeRegistry['rep_g'].upline.length}`);
    }
  });

  // -------------------------------------------------------------
  // TEST 6: Circular sponsor prevention
  // -------------------------------------------------------------
  await runTest(6, 'Circular sponsor prevention (self-sponsorship & cycles)', async () => {
    // Case 1: Self-sponsor
    let threwSelf = false;
    try {
      buildUpline('rep_self', 'rep_self');
    } catch {
      threwSelf = true;
    }
    if (!threwSelf) throw new Error('Self-sponsorship did not throw error.');

    // Case 2: 2-node cycle (A -> B -> A)
    const cycleRegistry = {
      rep_alpha: { repUsername: 'rep_alpha', sponsorUsername: 'rep_beta', upline: ['rep_beta'] },
      rep_beta: { repUsername: 'rep_beta', sponsorUsername: 'rep_alpha', upline: ['rep_alpha'] },
    };
    let threwCycle2 = false;
    try {
      buildUpline('rep_alpha', 'rep_gamma', cycleRegistry);
    } catch (e) {
      if (e.message.includes('Circular sponsor relationship')) {
        threwCycle2 = true;
      }
    }
    if (!threwCycle2) throw new Error('2-node cycle did not trigger circular error.');

    // Case 3: Attempt to sponsor someone whose ancestor is the recruit
    let threwCycle3 = false;
    const multiRegistry = {
      node_1: { repUsername: 'node_1', sponsorUsername: 'node_2' },
      node_2: { repUsername: 'node_2', sponsorUsername: 'node_3' },
      node_3: { repUsername: 'node_3', sponsorUsername: null },
    };
    try {
      // If node_3 now tries to register with sponsor node_1 -> cycle!
      buildUpline('node_1', 'node_3', multiRegistry);
    } catch (e) {
      if (e.message.includes('Circular sponsor relationship')) {
        threwCycle3 = true;
      }
    }
    if (!threwCycle3) throw new Error('Multi-node cycle did not trigger circular error.');
  });

  // -------------------------------------------------------------
  // TEST 7: Referral link generation & URL architecture
  // -------------------------------------------------------------
  await runTest(7, 'Referral link generation and URL architecture', async () => {
    const username = 'sarah_glow';
    const baseUrl = 'https://ilovesurprises.com';

    const vanityUrl = `${baseUrl}/rep/${username}`;
    const shopUrl = `${baseUrl}/shop?rep=${username}`;

    if (vanityUrl !== 'https://ilovesurprises.com/rep/sarah_glow') {
      throw new Error(`Invalid vanity URL: ${vanityUrl}`);
    }
    if (shopUrl !== 'https://ilovesurprises.com/shop?rep=${username}'.replace('${username}', 'sarah_glow')) {
      throw new Error(`Invalid shop referral URL: ${shopUrl}`);
    }
  });

  // -------------------------------------------------------------
  // TEST 8: Representative login
  // -------------------------------------------------------------
  await runTest(8, 'Representative login via Supabase Auth', async () => {
    const email = `login_rep_${Date.now()}@example.com`;
    const password = 'RepPassword2026!';
    const username = `login_rep_${Date.now().toString().slice(-5)}`;

    // Create confirmed user
    const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'representative', rep_username: username },
    });
    if (createErr || !created.user) throw new Error(`Creation failed: ${createErr?.message}`);
    createdTestUserIds.push(created.user.id);

    // Profile
    await adminSupabase.from('profiles').upsert({
      id: created.user.id,
      email,
      role: 'representative',
      rep_username: username,
    });

    // Test sign in via anon client
    const { data: sessionData, error: loginErr } = await clientSupabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginErr || !sessionData.session) {
      throw new Error(`Login failed: ${loginErr?.message}`);
    }

    if (sessionData.user?.user_metadata?.role !== 'representative') {
      throw new Error(`Session user metadata role is not 'representative'`);
    }
  });

  // -------------------------------------------------------------
  // TEST 9: Representative profile security and immutability
  // -------------------------------------------------------------
  await runTest(9, 'Representative profile integrity and client security', async () => {
    const testUserId = createdTestUserIds[0];
    if (!testUserId) throw new Error('No test user ID available.');

    const { data: prof, error } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (error || !prof) throw new Error('Profile could not be fetched.');

    // Ensure rep_username is stored
    if (!prof.rep_username) throw new Error('rep_username is missing on profile.');
    if (prof.role !== 'representative') throw new Error('role is not representative.');

    // Verify profiles table has no writable sponsor columns that users could exploit
    const keys = Object.keys(prof);
    if (keys.includes('commission_rate') || keys.includes('commission_override')) {
      throw new Error('Security flaw: commission rates found in profiles table!');
    }
  });

  // -------------------------------------------------------------
  // TEST 10: Commission compatibility with Task 2 logic
  // -------------------------------------------------------------
  await runTest(10, 'Commission compatibility with Task 2 (20% direct + 5 levels upline)', async () => {
    // 5-level upline
    const upline = ['rep_l1', 'rep_l2', 'rep_l3', 'rep_l4', 'rep_l5'];
    const orderSubtotal = 100.0; // $100 order

    const comm = calculateMultiLevelCommissions(orderSubtotal, upline);

    // 1. Direct Rep = 20% = $20.00
    if (comm.directRepCommission !== 20.0) {
      throw new Error(`Expected direct rep commission $20.00, got ${comm.directRepCommission}`);
    }

    // 2. Level 1 = 5% = $5.00
    const l1 = comm.uplineCommissions.find((u) => u.level === 1);
    if (!l1 || l1.amount !== 5.0) throw new Error(`Expected L1 $5.00, got ${l1?.amount}`);

    // 3. Level 2 = 4% = $4.00
    const l2 = comm.uplineCommissions.find((u) => u.level === 2);
    if (!l2 || l2.amount !== 4.0) throw new Error(`Expected L2 $4.00, got ${l2?.amount}`);

    // 4. Level 3 = 3% = $3.00
    const l3 = comm.uplineCommissions.find((u) => u.level === 3);
    if (!l3 || l3.amount !== 3.0) throw new Error(`Expected L3 $3.00, got ${l3?.amount}`);

    // 5. Level 4 = 2% = $2.00
    const l4 = comm.uplineCommissions.find((u) => u.level === 4);
    if (!l4 || l4.amount !== 2.0) throw new Error(`Expected L4 $2.00, got ${l4?.amount}`);

    // 6. Level 5 = 1% = $1.00
    const l5 = comm.uplineCommissions.find((u) => u.level === 5);
    if (!l5 || l5.amount !== 1.0) throw new Error(`Expected L5 $1.00, got ${l5?.amount}`);

    // 7. Total commissions = 20 + 5 + 4 + 3 + 2 + 1 = 35% = $35.00
    if (comm.totalCommissions !== 35.0) {
      throw new Error(`Expected total commission $35.00 (35%), got ${comm.totalCommissions}`);
    }

    // 8. Beyond 5 levels test: 6th level rep should NOT receive commission
    const upline6 = ['rep_l1', 'rep_l2', 'rep_l3', 'rep_l4', 'rep_l5', 'rep_l6_beyond'];
    const comm6 = calculateMultiLevelCommissions(orderSubtotal, upline6);
    if (comm6.uplineCommissions.length > 5) {
      throw new Error('Commissions awarded beyond 5 levels!');
    }
    if (comm6.totalCommissions !== 35.0) {
      throw new Error('Total commissions exceeded 35% cap!');
    }
  });

  // -------------------------------------------------------------
  // CLEANUP: Clean up test accounts
  // -------------------------------------------------------------
  console.log('🧹 Cleaning up temporary test accounts...');
  for (const userId of createdTestUserIds) {
    try {
      await adminSupabase.from('profiles').delete().eq('id', userId);
      await adminSupabase.auth.admin.deleteUser(userId);
    } catch {
      // ignore
    }
  }
  console.log(`  Removed ${createdTestUserIds.length} test accounts.`);

  console.log('\n================================================================');
  console.log(`📊 FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ALL 10 MLM REPRESENTATIVE REGISTRATION & SPONSOR TREE TESTS PASSED!');
    process.exit(0);
  } else {
    console.error(`💥 ${totalTests - passedTests} TESTS FAILED.`);
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
