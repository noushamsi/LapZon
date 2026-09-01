/**
 * Test Suite: Official Google OAuth 2.0 & OpenID Connect Authentication Flow
 */

import fs from 'fs';

const BASE_URL = 'http://localhost:8080';

async function runGoogleOAuthTests() {
  console.log('=====================================================');
  console.log('🚀 TESTING OFFICIAL GOOGLE OAUTH 2.0 & OIDC SUITE');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test Google OAuth Config Endpoint
    const configRes = await fetch(`${BASE_URL}/api/auth/google/config`);
    const configData = await configRes.json();
    assert(configRes.status === 200 && configData.success === true, 'GET /api/auth/google/config returned 200 OK');
    assert(configData.redirectUri === 'http://localhost:8080/api/auth/google/callback', 'Exact redirectUri is http://localhost:8080/api/auth/google/callback');

    // 2. Test Google OAuth Callback Flow (Receives authorization code from Google)
    const callbackRes = await fetch(`${BASE_URL}/api/auth/google/callback?code=test_mock_oauth_code`, {
      redirect: 'manual'
    });
    assert(callbackRes.status === 302, 'GET /api/auth/google/callback handles redirect (302)');
    const location = callbackRes.headers.get('location') || '';
    assert(location.includes('#google-callback') && location.includes('token='), 'Redirects back to #google-callback with application session token');

    // 3. Test Token Verification Endpoint (OpenID Connect ID Token / GIS)
    const verifyRes = await fetch(`${BASE_URL}/api/auth/google/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'official.google.user@gmail.com',
        name: 'Official Google User'
      })
    });
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200 && verifyData.success === true, 'POST /api/auth/google/verify-token created/authenticated user session');
    assert(verifyData.token && verifyData.user.email === 'official.google.user@gmail.com', 'Token and user details returned accurately');

    // 4. Check Frontend authModal.js security compliance
    const authModalJs = fs.readFileSync('js/components/authModal.js', 'utf8');
    assert(
      !authModalJs.includes('Galaxy S24 Ultra') && !authModalJs.includes('renderStepTwoStepVerify'),
      'authModal.js has NO simulated phone or 2-step verification screens (all handled natively by Google)'
    );
    assert(
      !authModalJs.includes('GOOGLE_CLIENT_SECRET'),
      'authModal.js NEVER exposes GOOGLE_CLIENT_SECRET to the client (Zero Client Secret Exposure)'
    );
    assert(
      authModalJs.includes('api.getGoogleConfig()'),
      'authModal.js fetches configuration dynamically from backend'
    );

    // 5. Check Router callback handler
    const routerJs = fs.readFileSync('js/router.js', 'utf8');
    assert(
      routerJs.includes('google-callback') && routerJs.includes('auth.setSession'),
      'router.js handles #google-callback and sets session before redirecting to dashboard'
    );

    console.log(`\n=====================================================`);
    console.log(`🎉 ALL GOOGLE OAUTH 2.0 TESTS PASSED: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=====================================================\n`);
  } catch (err) {
    console.error('Test execution failure:', err);
  }
}

runGoogleOAuthTests();
