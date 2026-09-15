/**
 * Verification Test: 60-second OTP Expiration and Admin Dashboard Endpoints
 */

const BASE_URL = 'http://localhost:8080';

async function runTests() {
  console.log('🧪 Starting 60s OTP & Admin Dashboard Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      failed++;
    }
  }

  const testEmail = `user60s_${Date.now()}@example.com`;
  const password = 'Password@123';

  // 1. Send Register OTP
  let sendData;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/send-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test 60s User',
        email: testEmail,
        password,
        confirmPassword: password,
        phone: '9876543210',
        dialCode: 'IN'
      })
    });
    sendData = await res.json();
    assert(res.status === 200 && sendData.success === true, 'Send OTP: Successfully accepted');
    assert(sendData.expiresInSeconds === 60, 'TTL: Backend returns exactly 60 seconds expiresInSeconds');
    assert(!('otp' in sendData), 'Security: OTP is not in API response');
  } catch (e) {
    assert(false, `Send OTP Error: ${e.message}`);
  }

  // 2. Verify rejecting wrong OTP
  try {
    const res = await fetch(`${BASE_URL}/api/auth/verify-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '000000' })
    });
    const data = await res.json();
    assert(res.status === 400 && data.error.includes('attempt'), 'Rejects wrong OTP with attempts counter');
  } catch (e) {
    assert(false, `Reject wrong OTP Error: ${e.message}`);
  }

  // 3. Admin Authentication & Dashboard Endpoints
  try {
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@lapkart.com',
        password: 'Admin@123'
      })
    });
    const adminData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminData.success === true, 'Admin Login: Successfully authenticated');
    assert(adminData.user.role === 'admin', 'Admin Role: Role is admin');
    assert(Boolean(adminData.token), 'Admin Token: Bearer token generated');

    const adminToken = adminData.token;

    // Fetch Admin Metrics
    const metricsRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const metricsData = await metricsRes.json();
    assert(metricsRes.status === 200 && metricsData.success === true, 'Admin Metrics API: Accessible with admin token');

    // Fetch Admin Products
    const prodRes = await fetch(`${BASE_URL}/api/admin/products`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const prodData = await prodRes.json();
    assert(prodRes.status === 200 && Array.isArray(prodData.products), 'Admin Products API: Accessible with admin token');

    // Fetch Admin Orders
    const ordRes = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const ordData = await ordRes.json();
    assert(ordRes.status === 200 && Array.isArray(ordData.orders), 'Admin Orders API: Accessible with admin token');
  } catch (e) {
    assert(false, `Admin API Error: ${e.message}`);
  }

  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests();
