import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function testRealOtpFlow() {
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

  let sendOtpApiResponse = null;
  page.on('response', async response => {
    if (response.url().includes('/api/auth/send-otp')) {
      sendOtpApiResponse = await response.json().catch(() => null);
    }
  });

  console.log('1. Navigating to http://localhost:8080/#register...');
  await page.goto('http://localhost:8080/#register', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  console.log('2. Filling in test details with phone 6364522423...');
  await page.type('#auth-name-input', 'SHAMSI');
  await page.type('#auth-email-input', 'testuser_' + Date.now() + '@example.com');
  await page.type('#auth-phone-input', '6364522423');
  await page.type('#auth-pass-input', 'SecurePass123!');

  console.log('3. Clicking "Send OTP"...');
  await page.click('#btn-send-otp');
  await new Promise(r => setTimeout(r, 1000));

  // Inspect the UI immediately after Send OTP
  const stateAfterSend = await page.evaluate(() => {
    const otpInput = document.getElementById('auth-otp-input');
    const otpStatusMsg = document.getElementById('otp-status-msg');
    const sendBtn = document.getElementById('btn-send-otp');

    return {
      otpInputValue: otpInput ? otpInput.value : null,
      otpInputBlank: otpInput ? otpInput.value === '' : false,
      statusMsgText: otpStatusMsg ? otpStatusMsg.innerText.trim() : null,
      sendBtnText: sendBtn ? sendBtn.innerText.trim() : null
    };
  });

  console.log('\n--- UI STATE AFTER CLICKING SEND OTP ---');
  console.log(JSON.stringify(stateAfterSend, null, 2));

  console.log('\n--- API RESPONSE FOR /api/auth/send-otp ---');
  console.log(JSON.stringify(sendOtpApiResponse, null, 2));

  // Capture screenshot of UI with blank OTP field
  await page.screenshot({ path: 'scratch/real_otp_sent_blank_field.png' });
  console.log('Screenshot saved to scratch/real_otp_sent_blank_field.png');

  // Verify that OTP is NOT leaked in API response
  if (sendOtpApiResponse && sendOtpApiResponse.otp) {
    console.error('FAILED: OTP is exposed in API response!');
  } else {
    console.log('✓ PASS: OTP is NOT exposed in API response.');
  }

  // Verify that OTP input is completely blank
  if (stateAfterSend.otpInputBlank) {
    console.log('✓ PASS: #auth-otp-input is completely empty (no autofill).');
  } else {
    console.error('FAILED: #auth-otp-input has value:', stateAfterSend.otpInputValue);
  }

  // Verify that status message does NOT contain "Demo OTP"
  if (stateAfterSend.statusMsgText && stateAfterSend.statusMsgText.includes('Demo OTP')) {
    console.error('FAILED: Demo OTP is still visible in status message!');
  } else {
    console.log('✓ PASS: No "Demo OTP" text anywhere in the status message.');
  }

  // Test submitting without verifying OTP
  console.log('\n4. Attempting to click "Create account" WITHOUT verifying OTP...');
  await page.click('#btn-auth-submit');
  await new Promise(r => setTimeout(r, 400));

  const errorAfterUnverifiedSubmit = await page.evaluate(() => {
    const errorEl = document.getElementById('auth-error-msg');
    return errorEl ? errorEl.innerText.trim() : null;
  });
  console.log('Validation Error on unverified submit:', errorAfterUnverifiedSubmit);

  if (errorAfterUnverifiedSubmit && errorAfterUnverifiedSubmit.includes('verify your phone number')) {
    console.log('✓ PASS: Account creation is blocked until phone OTP verification succeeds.');
  } else {
    console.error('FAILED: Form allowed submission without OTP verification!');
  }

  // Test entering an incorrect OTP
  console.log('\n5. Testing invalid OTP verification (000000)...');
  await page.type('#auth-otp-input', '000000');
  await page.click('#btn-verify-otp');
  await new Promise(r => setTimeout(r, 600));

  const invalidOtpResult = await page.evaluate(() => {
    const resEl = document.getElementById('otp-verify-result');
    return resEl ? resEl.innerText.trim() : null;
  });
  console.log('Result for invalid OTP 000000:', invalidOtpResult);

  await browser.close();
}

testRealOtpFlow().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
