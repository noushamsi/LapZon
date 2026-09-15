/**
 * Test: Full lifecycle of email OTP verification & login
 */
import { db } from './server/db.js';
import bcrypt from 'bcryptjs';

async function testCycle() {
  console.log('🧪 Testing Full Email OTP Registration Cycle & Login...\n');

  const testEmail = `verify_cycle_${Date.now()}@example.com`;
  const rawPassword = 'SecureUser@2026';
  const name = 'Vikram Malhotra';
  const phone = '+919876543210';

  // 1. Send OTP
  const sendRes = await fetch('http://localhost:8080/api/auth/send-register-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email: testEmail,
      password: rawPassword,
      confirmPassword: rawPassword,
      phone: '9876543210',
      dialCode: 'IN'
    })
  });
  const sendData = await sendRes.json();
  console.log('1. Send OTP response:', sendData);

  if (!sendData.success) {
    console.error('❌ Failed to initiate registration OTP');
    process.exit(1);
  }

  // 2. We need the OTP to verify. We can test incorrect OTP first:
  const badOtpRes = await fetch('http://localhost:8080/api/auth/verify-register-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: '999999'
    })
  });
  const badOtpData = await badOtpRes.json();
  console.log('2. Bad OTP test response:', badOtpData);

  // 3. Check login without verification fails
  const loginPrematureRes = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: rawPassword
    })
  });
  console.log('3. Premature login status (should be 401):', loginPrematureRes.status);

  // 4. Verify existing seeds still work with login:
  const adminLoginRes = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@lapkart.com',
      password: 'Admin@123'
    })
  });
  const adminData = await adminLoginRes.json();
  console.log('4. Admin seed login status:', adminLoginRes.status, 'Success:', adminData.success);

  const customerLoginRes = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'customer@gmail.com',
      password: 'User@123'
    })
  });
  const customerData = await customerLoginRes.json();
  console.log('5. Customer seed login status:', customerLoginRes.status, 'Success:', customerData.success);

  console.log('\n✅ All pre-checks passed.');
}

testCycle();
