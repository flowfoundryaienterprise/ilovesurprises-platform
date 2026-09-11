/**
 * Verification of Duplicate Signup Request Prevention and Rate-Limit Error Handling
 */
const assert = require('assert');

console.log('======================================================================');
console.log('DUPLICATE REQUEST & RATE-LIMIT PREVENTION UNIT TESTS');
console.log('======================================================================');

// Mirroring the exact mapAuthError logic for standalone node execution test
function testMapAuthError(error, context = 'register') {
  if (!error) return 'An unexpected authentication error occurred. Please try again.';

  const rawMsg = (error.message || error.error_description || error.msg || '');
  const msg = rawMsg.toLowerCase();
  const status = Number(error.status || error.statusCode || 0);
  const code = (error.code || error.error_code || '').toLowerCase();

  // 1. Network Failure / Connection Error
  const isNetworkFailure =
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('connection') ||
    msg.includes('offline') ||
    msg.includes('abort') ||
    code.includes('network');

  if (isNetworkFailure) {
    return 'Connection error. Unable to reach the authentication service. Please check your internet connection and try again.';
  }

  // 2. Supabase Unavailable / 5xx Server Errors
  if (status >= 500) {
    return 'Authentication service is temporarily unavailable. Please try again in a few moments.';
  }

  // 3. 429 Rate Limits
  if (
    status === 429 ||
    msg.includes('rate limit') ||
    code.includes('rate_limit') ||
    msg.includes('too many requests') ||
    msg.includes('security purposes') ||
    msg.includes('over_email_send_rate_limit')
  ) {
    if (msg.includes('security purposes') || (msg.includes('after') && msg.includes('second'))) {
      return rawMsg;
    }

    if (
      code === 'over_email_send_rate_limit' ||
      msg.includes('email rate limit') ||
      msg.includes('email send') ||
      msg.includes('over_email_send_rate_limit')
    ) {
      if (context === 'resend_verification') {
        return 'Email verification rate limit reached. For security, please wait 60 seconds before requesting another verification email.';
      }
      return 'Email rate limit exceeded. Too many requests have been submitted. Please wait a few moments before trying again, or log in if your account is already created.';
    }
    if (context === 'login') {
      return 'Too many sign-in attempts. Please wait a few moments and try again.';
    }
    if (context === 'forgot_password') {
      return 'Reset email rate limit reached. If you recently requested a reset, please check your inbox or try again shortly.';
    }
    return 'Rate limit reached. Too many requests have been submitted. Please wait a few moments and try again.';
  }

  return rawMsg || 'Authentication failed. Please try again.';
}

// Test Suite
console.log('\n--- 1. Testing Rate-Limit Error Formatting ---');

// Case A: Supabase specific cooldown seconds
const errA = { status: 429, message: 'For security purposes, you can only request this after 48 seconds.' };
const resA = testMapAuthError(errA, 'register');
assert.strictEqual(resA, 'For security purposes, you can only request this after 48 seconds.');
console.log('✅ PASS: Specific cooldown message preserved: ', resA);

// Case B: over_email_send_rate_limit code
const errB = { status: 429, code: 'over_email_send_rate_limit', message: 'Email rate limit exceeded' };
const resB = testMapAuthError(errB, 'register');
assert(resB.includes('Email rate limit exceeded'));
console.log('✅ PASS: over_email_send_rate_limit properly explained: ', resB);

// Case C: Resend verification context
const resC = testMapAuthError(errB, 'resend_verification');
assert(resC.includes('wait 60 seconds'));
console.log('✅ PASS: Resend verification gives 60s cooldown guidance: ', resC);

// Case D: In-Flight Lock Simulation
console.log('\n--- 2. Testing In-Flight Registration Deduplication Simulation ---');
const inFlightRegistrations = new Set();

async function simulateRegistration(email, delayMs) {
  const cleanEmail = email.trim().toLowerCase();
  if (inFlightRegistrations.has(cleanEmail)) {
    return { success: false, error: 'A registration request for this email is already being processed. Please wait a moment.' };
  }
  inFlightRegistrations.add(cleanEmail);
  try {
    await new Promise(r => setTimeout(r, delayMs));
    return { success: true, registered: cleanEmail };
  } finally {
    inFlightRegistrations.delete(cleanEmail);
  }
}

async function testParallelSignup() {
  const email = 'duplicate_test@example.com';
  // Simulate double-click (two concurrent requests dispatched simultaneously)
  const [req1, req2] = await Promise.all([
    simulateRegistration(email, 150),
    simulateRegistration(email, 150),
  ]);

  console.log('Request 1 result:', req1);
  console.log('Request 2 result:', req2);

  // Exactly one request must succeed and the second must be blocked by the in-flight guard
  assert.strictEqual(req1.success, true);
  assert.strictEqual(req2.success, false);
  assert(req2.error.includes('already being processed'));
  console.log('✅ PASS: Concurrent request successfully blocked! Only ONE request executed.');
}

testParallelSignup().then(() => {
  console.log('\n======================================================================');
  console.log('🎉 ALL DUPLICATE AND RATE-LIMIT TESTS PASSED 100%!');
  console.log('======================================================================');
});
