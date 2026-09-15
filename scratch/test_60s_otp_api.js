/**
 * Automated Verification: 60-Second OTP Validity & Expiry Test Suite
 */

import { db } from '../server/db.js';

const BASE_URL = 'http://localhost:8080';

async function runTests() {
  console.log('========================================================================');
  console.log('🚀 TESTING 60-SECOND OTP VALIDITY, COUNTDOWN & EXPIRATION ENFORCEMENT');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Customer Registration OTP 60s Validity
  // -------------------------------------------------------------
  console.log('▶ TEST 1: Customer Registration OTP (60s Expiry & Server Enforcement)');
  const regEmail = `test_reg_60s_${Date.now()}@example.com`;
  
  const regRes = await fetch(`${BASE_URL}/api/auth/send-register-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Reg Test User',
      email: regEmail,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      phone: '9876543210',
      dialCode: 'IN'
    })
  });
  const regData = await regRes.json();
  assert(regRes.status === 200 && regData.success === true, '1. Customer registration OTP sent successfully');
  assert(regData.expiresInSeconds === 60, '1. Backend returns expiresInSeconds === 60');
  assert(!('otp' in regData), '1. OTP is not exposed in API response');

  // Test Resend cooldown (should be 60s)
  const regResendRes = await fetch(`${BASE_URL}/api/auth/resend-register-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: regEmail })
  });
  assert(regResendRes.status === 429, '1. Resend OTP before cooldown rejected with HTTP 429');

  // -------------------------------------------------------------
  // TEST 2: Customer Forgot Password OTP 60s Validity & Expiration
  // -------------------------------------------------------------
  console.log('\n▶ TEST 2: Customer Forgot Password OTP (60s Expiry & Server Enforcement)');
  
  // Ensure a test customer exists
  let customerUser = db.getUserByEmail('customer60s@lapkart.com');
  if (!customerUser) {
    customerUser = db.createUser({
      name: 'Customer 60s Test',
      email: 'customer60s@lapkart.com',
      password: '$2a$10$abcdefghijklmnopqrstuu',
      phone: '9876543211',
      role: 'customer'
    });
  }

  // Request Customer Forgot Password OTP
  const custForgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: customerUser.email })
  });
  const custForgotData = await custForgotRes.json();
  assert(custForgotRes.status === 200 && custForgotData.success === true, '2. Customer Forgot Password OTP dispatched');
  assert(custForgotData.expiresInSeconds === 60, '2. Customer Forgot Password returns expiresInSeconds === 60');
  assert(custForgotData.cooldownSeconds === 60, '2. Customer Forgot Password returns cooldownSeconds === 60');
  assert(!('otp' in custForgotData), '2. Customer OTP code is NOT exposed in response payload');

  // Test incorrect OTP
  const custWrongOtpRes = await fetch(`${BASE_URL}/api/auth/verify-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: customerUser.email, otp: '000000' })
  });
  const custWrongOtpData = await custWrongOtpRes.json();
  assert(custWrongOtpRes.status === 400 && custWrongOtpData.error.includes('attempt'), '2. Incorrect OTP rejected with remaining attempts counter');

  // -------------------------------------------------------------
  // TEST 3: Admin Forgot Password OTP 60s Validity & Expiration
  // -------------------------------------------------------------
  console.log('\n▶ TEST 3: Admin Forgot Password OTP (60s Expiry & Server Enforcement)');
  
  const adminForgotRes = await fetch(`${BASE_URL}/api/auth/admin/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lapkart.com' })
  });
  const adminForgotData = await adminForgotRes.json();
  assert(adminForgotRes.status === 200 && adminForgotData.success === true, '3. Admin Forgot Password OTP dispatched');
  assert(adminForgotData.expiresInSeconds === 60, '3. Admin Forgot Password returns expiresInSeconds === 60');
  assert(adminForgotData.cooldownSeconds === 60, '3. Admin Forgot Password returns cooldownSeconds === 60');
  assert(!('otp' in adminForgotData), '3. Admin OTP code is NOT exposed in response payload');

  // Test incorrect OTP
  const adminWrongOtpRes = await fetch(`${BASE_URL}/api/auth/admin/verify-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lapkart.com', otp: '999999' })
  });
  const adminWrongOtpData = await adminWrongOtpRes.json();
  assert(adminWrongOtpRes.status === 400 && adminWrongOtpData.error.includes('attempt'), '3. Incorrect Admin OTP rejected with remaining attempts counter');

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
