/**
 * Verification Test: Test that expired OTP is rejected with exact message
 */

const BASE_URL = 'http://localhost:8080';

async function testExpiration() {
  console.log('🧪 Testing OTP Expiration Rejection...\n');

  const testEmail = `expire_test_${Date.now()}@example.com`;
  const password = 'Password@123';

  // 1. Send OTP
  const sendRes = await fetch(`${BASE_URL}/api/auth/send-register-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Expire Tester',
      email: testEmail,
      password,
      confirmPassword: password,
      phone: '9876543210',
      dialCode: 'IN'
    })
  });
  const sendData = await sendRes.json();
  console.log('Send OTP result:', sendData);

  // We want to test that when expired, verify-register-otp returns:
  // "OTP expired. Please request a new OTP."
  // Let's test with an expired pending record or check backend logic
  console.log('Waiting 61 seconds to verify genuine real-time expiration on backend...');
  await new Promise(resolve => setTimeout(resolve, 61000));

  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-register-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: '123456'
    })
  });
  const verifyData = await verifyRes.json();
  console.log('Verify response after 61 seconds:', verifyRes.status, verifyData);

  if (verifyRes.status === 400 && verifyData.error === 'OTP expired. Please request a new OTP.') {
    console.log('✅ [PASS] Expired OTP was strictly rejected with: "OTP expired. Please request a new OTP."');
  } else {
    console.error('❌ [FAIL] Expected "OTP expired. Please request a new OTP.", received:', verifyData.error);
    process.exit(1);
  }
}

testExpiration();
