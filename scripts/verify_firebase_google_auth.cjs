const fs = require('fs');
const https = require('https');
const path = require('path');

async function verify() {
  console.log('======================================================================');
  console.log('=== FIREBASE & GOOGLE AUTHENTICATION VERIFICATION AUDIT ===');
  console.log('======================================================================\n');

  // 1. Verify .env.local variables
  console.log('1. Checking environment variables in .env.local:');
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found!');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const expectedKeys = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  let allKeysPresent = true;
  for (const key of expectedKeys) {
    const regex = new RegExp(`^${key}=(.+)`, 'm');
    const match = envContent.match(regex);
    const isPresent = Boolean(match && match[1].trim());
    if (isPresent) {
      console.log(`   ✅ ${key}: PRESENT`);
    } else {
      console.log(`   ❌ ${key}: MISSING`);
      allKeysPresent = false;
    }
  }

  if (!allKeysPresent) {
    console.error('\n❌ Missing required environment variables.');
    process.exit(1);
  }

  // 2. Extract API Key safely for backend verification
  const apiKeyMatch = envContent.match(/^VITE_FIREBASE_API_KEY=(.+)/m);
  const apiKey = apiKeyMatch[1].trim();

  // 3. Test Google Auth Provider configuration on Firebase project backend
  console.log('\n2. Testing Firebase Identity Platform & Google Provider Configuration:');
  const checkGoogleProvider = () => {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        providerId: 'google.com',
        continueUri: 'http://localhost:5173/'
      });

      const req = https.request({
        hostname: 'identitytoolkit.googleapis.com',
        path: '/v1/accounts:createAuthUri?key=' + apiKey,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      }, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode === 200 && parsed.authUri) {
              resolve({
                status: 'ENABLED',
                message: 'Google Sign-In provider is ACTIVE and correctly configured in Firebase Console.'
              });
            } else if (parsed.error && parsed.error.message === 'CONFIGURATION_NOT_FOUND') {
              resolve({
                status: 'NOT_ENABLED',
                message: 'CONFIGURATION_NOT_FOUND: Google sign-in provider is NOT enabled yet in Firebase Console.'
              });
            } else if (parsed.error && parsed.error.message === 'OPERATION_NOT_ALLOWED') {
              resolve({
                status: 'NOT_ENABLED',
                message: 'OPERATION_NOT_ALLOWED: Google provider is disabled in Firebase Console.'
              });
            } else {
              resolve({
                status: 'ERROR',
                message: parsed.error ? parsed.error.message : `HTTP ${res.statusCode}`
              });
            }
          } catch (e) {
            resolve({ status: 'ERROR', message: e.message });
          }
        });
      });

      req.on('error', (e) => resolve({ status: 'NETWORK_ERROR', message: e.message }));
      req.write(postData);
      req.end();
    });
  };

  const providerResult = await checkGoogleProvider();
  if (providerResult.status === 'ENABLED') {
    console.log('   ✅ Google Provider Status: ENABLED & READY');
  } else {
    console.log(`   ⚠️ Google Provider Status: ${providerResult.status}`);
    console.log(`      Detail: ${providerResult.message}`);
  }

  // 4. Test Email/Password Provider status on Firebase project backend
  console.log('\n3. Testing Firebase Email/Password Provider Configuration:');
  const checkEmailProvider = () => {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        email: 'probe_check_test@example.com',
        password: 'TestPassword123!',
        returnSecureToken: true
      });

      const req = https.request({
        hostname: 'identitytoolkit.googleapis.com',
        path: '/v1/accounts:signUp?key=' + apiKey,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      }, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode === 200) {
              resolve({ status: 'ENABLED', message: 'Email/Password provider is ACTIVE.' });
            } else if (parsed.error && parsed.error.message === 'EMAIL_EXISTS') {
              resolve({ status: 'ENABLED', message: 'Email/Password provider is ACTIVE.' });
            } else if (parsed.error && parsed.error.message === 'CONFIGURATION_NOT_FOUND') {
              resolve({ status: 'NOT_ENABLED', message: 'CONFIGURATION_NOT_FOUND: Firebase Authentication is not yet activated.' });
            } else if (parsed.error && parsed.error.message === 'OPERATION_NOT_ALLOWED') {
              resolve({ status: 'NOT_ENABLED', message: 'OPERATION_NOT_ALLOWED: Email/Password sign-in is disabled in Firebase Console.' });
            } else {
              resolve({ status: 'OTHER', message: parsed.error?.message || `HTTP ${res.statusCode}` });
            }
          } catch (e) {
            resolve({ status: 'ERROR', message: e.message });
          }
        });
      });

      req.on('error', (e) => resolve({ status: 'NETWORK_ERROR', message: e.message }));
      req.write(postData);
      req.end();
    });
  };

  const emailResult = await checkEmailProvider();
  if (emailResult.status === 'ENABLED') {
    console.log('   ✅ Email/Password Provider Status: ENABLED & READY');
  } else {
    console.log(`   ⚠️ Email/Password Provider Status: ${emailResult.status}`);
    console.log(`      Detail: ${emailResult.message}`);
  }

  console.log('\n======================================================================');
  console.log('SUMMARY AUDIT COMPLETE');
  console.log('======================================================================');
}

verify().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
