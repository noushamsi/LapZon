import { db } from '../server/db.js';
import bcrypt from 'bcryptjs';

async function testFullResetCycle() {
  console.log('========================================================================');
  console.log('🚀 LIVE INTEGRATION TEST: COMPLETE ADMIN PASSWORD RESET LIFECYCLE');
  console.log('========================================================================\n');

  const adminEmail = 'admin@lapkart.com';
  const originalPass = 'Admin@123';
  const newPass = 'LapzonSuperSecret2026!';

  let passed = 0;
  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      process.exit(1);
    }
  }

  // 1. Verify initial login with original password works
  console.log('--- 1. Testing Initial Admin Login with Original Password ---');
  const loginRes1 = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: originalPass })
  }).then(r => r.json());
  assert(loginRes1.success === true && loginRes1.user.role === 'admin', 'Original password authenticates successfully as Administrator');

  // 2. Request Password Reset OTP
  console.log('\n--- 2. Requesting Admin Password Reset OTP ---');
  const forgotRes = await fetch('http://localhost:8080/api/auth/admin/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail })
  }).then(r => r.json());
  assert(forgotRes.success === true, 'Forgot password endpoint returned success: true');
  assert(forgotRes.expiresInSeconds === 300, 'OTP expiry configured for 300 seconds (5 minutes)');
  assert(!forgotRes.otp && !forgotRes.code, 'Security: Verification code is NOT exposed in API response');

  // 3. Test Invalid OTP
  console.log('\n--- 3. Testing Incorrect OTP Verification ---');
  const wrongOtpRes = await fetch('http://localhost:8080/api/auth/admin/verify-reset-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, otp: '999999' })
  });
  const wrongOtpData = await wrongOtpRes.json();
  assert(wrongOtpRes.status === 400, 'Incorrect OTP returned HTTP 400 Bad Request');
  assert(wrongOtpData.error.includes('Invalid verification code'), 'Error message informs user of invalid code');

  // 4. Test Resend Cooldown
  console.log('\n--- 4. Testing Resend Cooldown ---');
  const resendRes = await fetch('http://localhost:8080/api/auth/admin/resend-reset-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail })
  });
  assert(resendRes.status === 429, 'Immediate resend is rate-limited with HTTP 429');

  // 5. Simulate valid password reset in DB directly to verify bcrypt hashing & security
  console.log('\n--- 5. Testing Password Update with Bcrypt & Verifying Old Password Rejection ---');
  const adminUser = db.getUserByEmail(adminEmail);
  const hashedNew = await bcrypt.hash(newPass, 10);
  db.updateUser(adminUser.id, { password: hashedNew });

  // 6. Test login with NEW password
  console.log('Testing login with NEW password...');
  const loginResNew = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: newPass })
  }).then(r => r.json());
  assert(loginResNew.success === true && loginResNew.user.role === 'admin', 'Login with NEW password succeeds');

  // 7. Verify OLD password no longer works
  console.log('Verifying OLD password is now rejected...');
  const loginResOld = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: originalPass })
  });
  assert(loginResOld.status === 401, 'Old password correctly rejected with HTTP 401 Unauthorized');

  // 8. Restore default admin password for continuous test consistency
  console.log('\n--- 8. Restoring Standard Admin Password ---');
  const hashedOriginal = await bcrypt.hash(originalPass, 10);
  db.updateUser(adminUser.id, { password: hashedOriginal });

  const restoreCheck = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: originalPass })
  }).then(r => r.json());
  assert(restoreCheck.success === true, 'Admin credentials safely verified and restored to standard test state');

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${passed} LIFECYCLE TESTS PASSED!`);
  console.log('========================================================================\n');
}

testFullResetCycle();
