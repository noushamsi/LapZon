import fetch from 'node-fetch';

async function testBackendSendGrid() {
  console.log('--- Testing Backend SendGrid Email OTP ---');
  try {
    const res = await fetch('http://localhost:8080/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'noushamsi09@gmail.com' })
    });
    const data = await res.json();
    console.log('Response status:', res.status);
    console.log('Response body:', data);
  } catch (err) {
    console.error('Test error:', err);
  }
}

testBackendSendGrid();
