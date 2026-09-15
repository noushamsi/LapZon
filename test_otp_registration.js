/**
 * Test Suite: Email OTP Registration Flow Verification
 */

const BASE_URL = 'http://localhost:8080';

async function runTests() {
  console.log('🧪 Starting Email OTP Registration Verification Tests...\n');
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

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password@123';
  const testName = 'Test Verification User';
  const testPhone = '9876543210';

  // 1. Test validation on missing fields
  try {
    const res = await fetch(`${BASE_URL}/api/auth/send-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, 'Validation: Rejects incomplete registration request');
  } catch (e) {
    assert(false, `Validation error: ${e.message}`);
  }

  // 2. Test send-register-otp with valid payload
  let sendOtpResponse;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/send-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        phone: testPhone,
        dialCode: 'IN'
      })
    });
    sendOtpResponse = await res.json();
    assert(res.status === 200 && sendOtpResponse.success === true, 'Send OTP: Successfully accepted registration details');
    assert(sendOtpResponse.email === testEmail, 'Send OTP: Returns user destination email');
    assert(!('otp' in sendOtpResponse), 'Security: OTP is NEVER returned in response JSON');
    assert(sendOtpResponse.message.includes(testEmail), 'Message: Displays verification notice with user email');
  } catch (e) {
    assert(false, `Send OTP error: ${e.message}`);
  }

  // 3. Test resend-register-otp cooldown (< 60s should return 429)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/resend-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const data = await res.json();
    assert(res.status === 429 && data.success === false, 'Resend Cooldown: Enforces 60-second cooldown period (HTTP 429)');
    assert(data.error.includes('second'), 'Resend Cooldown: Informs user of remaining cooldown seconds');
  } catch (e) {
    assert(false, `Resend cooldown error: ${e.message}`);
  }

  // 4. Test verify-register-otp with invalid code (should fail and decrement attempts)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/verify-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        otp: '000000'
      })
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, 'Verify OTP: Rejects incorrect 6-digit code');
    assert(data.error.includes('attempt'), 'Verify OTP: Displays remaining attempts count');
  } catch (e) {
    assert(false, `Verify invalid OTP error: ${e.message}`);
  }

  // 5. Test max attempts limit (simulate 5 failed attempts)
  try {
    for (let i = 0; i < 4; i++) {
      await fetch(`${BASE_URL}/api/auth/verify-register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, otp: '111111' })
      });
    }
    // 6th attempt should trigger 429 rate limit / max attempts exceeded
    const res = await fetch(`${BASE_URL}/api/auth/verify-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '222222' })
    });
    const data = await res.json();
    assert(res.status === 429 && data.error.includes('Maximum verification attempts exceeded'), 'Security: Enforces max 5 incorrect attempts');
  } catch (e) {
    assert(false, `Max attempts error: ${e.message}`);
  }

  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests();
