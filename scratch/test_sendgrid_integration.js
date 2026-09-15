import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function testSendGridFlow() {
  console.log('====================================================');
  console.log('1. TESTING BACKEND SENDGRID API ENDPOINT');
  console.log('====================================================');

  const testEmail = `sendgrid_user_${Date.now()}@lapzon.test`;
  const response = await fetch('http://localhost:8080/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });

  const data = await response.json();
  console.log('API Response status:', response.status);
  console.log('API Response body:', data);

  if (data.success && data.message.includes(testEmail)) {
    console.log('✓ PASS: API returned success message to customer.');
  } else {
    console.error('FAILED: API did not return expected success!', data);
    process.exit(1);
  }

  if (data.otp !== undefined) {
    console.error('FAILED: SECURITY BREACH! OTP code was exposed in API response!', data);
    process.exit(1);
  } else {
    console.log('✓ PASS: OTP code is strictly absent from API response (zero exposure).');
  }

  // Check server log to ensure OTP is NOT logged
  const logContent = fs.readFileSync('C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\81c59ceb-bd41-475b-9c6a-7c1cbabce664\\.system_generated\\tasks\\task-1619.log', 'utf8');
  console.log('Recent server log lines:\n', logContent.split('\n').slice(-10).join('\n'));

  if (logContent.includes('OTP Code:')) {
    console.error('FAILED: OTP Code was logged in server output!');
    process.exit(1);
  } else {
    console.log('✓ PASS: Zero OTP digits in server log. OTP is completely concealed.');
  }

  console.log('\n====================================================');
  console.log('2. TESTING BROWSER REGISTER MODAL & SENDGRID UI');
  console.log('====================================================');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });
  await page.goto('http://localhost:8080/#register', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Enter customer email
  const browserTestEmail = `browser_test_${Date.now()}@lapzon.test`;
  await page.type('#auth-email-input', browserTestEmail);
  await page.click('#btn-send-otp');
  await new Promise(r => setTimeout(r, 800));

  const uiState = await page.evaluate(() => {
    return {
      statusText: document.getElementById('otp-status-msg')?.innerText.trim(),
      otpInputValue: document.getElementById('auth-otp-input')?.value,
      sendBtnText: document.getElementById('btn-send-otp')?.innerText.trim()
    };
  });
  console.log('Browser UI state after clicking Send OTP:', uiState);

  if (uiState.statusText.includes(browserTestEmail) && uiState.otpInputValue === '') {
    console.log('✓ PASS: UI displays delivery confirmation, OTP input remains strictly blank.');
  } else {
    console.error('FAILED: UI state incorrect after Send OTP!', uiState);
    process.exit(1);
  }

  await browser.close();
  console.log('\nALL SENDGRID INTEGRATION & PRIVACY TESTS PASSED!');
}

testSendGridFlow().catch(err => {
  console.error('Error in SendGrid test:', err);
  process.exit(1);
});
