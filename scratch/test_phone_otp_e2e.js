import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
  console.log('🚀 Starting Comprehensive Phone Number OTP End-to-End Verification...');

  const chromeProgram = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeLocal = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  let execPath = edgePath;
  if (fs.existsSync(chromeProgram)) execPath = chromeProgram;
  else if (fs.existsSync(chromeLocal)) execPath = chromeLocal;

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    page.on('console', msg => {
      const text = msg.text();
      if (!text.includes('Failed to load resource')) {
        console.log('[BROWSER]', text);
      }
    });

    console.log('1. Navigating to http://localhost:8080/#welcome...');
    await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle2' });

    console.log('2. Opening Create Account modal...');
    await page.evaluate(() => {
      window.openAuthModal('register');
    });

    await page.waitForSelector('#auth-modal-overlay', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Capture initial fresh modal
    await page.screenshot({ path: 'scratch/phone_otp_modal_clean.png' });
    console.log('Clean modal screenshot saved: scratch/phone_otp_modal_clean.png');

    // 1. Verify all fields are completely blank
    const initialFields = await page.evaluate(() => ({
      name: document.getElementById('auth-name-input')?.value,
      email: document.getElementById('auth-email-input')?.value,
      phone: document.getElementById('auth-phone-input')?.value,
      otp: document.getElementById('auth-otp-input')?.value,
      pass: document.getElementById('auth-pass-input')?.value,
      confirmPass: document.getElementById('auth-confirm-pass-input')?.value,
      sendBtnText: document.getElementById('btn-send-otp')?.textContent.trim(),
      verifyBtnText: document.getElementById('btn-verify-otp')?.textContent.trim()
    }));
    console.log('Initial fields verification:', initialFields);
    if (initialFields.name !== '' || initialFields.email !== '' || initialFields.phone !== '' || initialFields.otp !== '') {
      throw new Error('Fields were not blank upon opening!');
    }

    // 2. Fill name, email, and invalid phone number
    console.log('3. Testing invalid phone error handling...');
    await page.type('#auth-name-input', 'Aarav Patel');
    const testEmail = `aarav.${Date.now()}@example.com`;
    await page.type('#auth-email-input', testEmail);
    await page.type('#auth-phone-input', '98765');
    await page.click('#btn-send-otp');
    await new Promise(r => setTimeout(r, 400));

    const invalidMsg = await page.$eval('#otp-status-msg', el => el.textContent.trim());
    console.log('Invalid phone error msg:', invalidMsg);
    if (!invalidMsg.includes('valid 10-digit')) {
      throw new Error('Expected 10-digit validation error, got: ' + invalidMsg);
    }

    // 3. Enter valid phone number and click Send OTP
    console.log('4. Entering valid phone number (9999999999) and sending OTP...');
    await page.evaluate(() => {
      const p = document.getElementById('auth-phone-input');
      p.value = '';
    });
    await page.type('#auth-phone-input', '9999999999');

    const [sendRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/send-otp') && res.status() === 200, { timeout: 15000 }),
      page.click('#btn-send-otp')
    ]);

    const sendData = await sendRes.json();
    console.log('Send OTP API Response:', sendData);
    if (!sendData.success) throw new Error('Send OTP API returned success: false');

    await new Promise(r => setTimeout(r, 800));

    // Verify OTP input is still completely blank (NO autofill)
    const otpInputAfterSend = await page.$eval('#auth-otp-input', el => el.value);
    console.log('OTP field after send (must be blank):', JSON.stringify(otpInputAfterSend));
    if (otpInputAfterSend !== '') {
      throw new Error('SECURITY VIOLATION: OTP field was autofilled!');
    }

    // Verify Send OTP button shows countdown
    const sendBtnDuringTimer = await page.$eval('#btn-send-otp', el => el.textContent.trim());
    console.log('Send Button text during countdown:', sendBtnDuringTimer);
    if (!sendBtnDuringTimer.includes('Resend in')) {
      throw new Error('Expected countdown timer on button!');
    }

    await page.screenshot({ path: 'scratch/phone_otp_sent_countdown.png' });
    console.log('Screenshot saved: scratch/phone_otp_sent_countdown.png');

    // 4. Test wrong OTP rejection
    console.log('5. Testing invalid OTP verification...');
    await page.type('#auth-otp-input', '000000');
    await page.click('#btn-verify-otp');
    await new Promise(r => setTimeout(r, 500));

    const invalidOtpMsg = await page.$eval('#otp-verify-result', el => el.textContent.trim());
    console.log('Invalid OTP message:', invalidOtpMsg);
    if (!invalidOtpMsg.includes('Invalid OTP code')) {
      throw new Error('Expected Invalid OTP error message, got: ' + invalidOtpMsg);
    }

    // 5. Test valid OTP verification
    console.log('6. Entering valid OTP (123456) and verifying...');
    await page.evaluate(() => {
      document.getElementById('auth-otp-input').value = '';
    });
    await page.type('#auth-otp-input', '123456');

    const [verifyRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/verify-otp') && res.status() === 200, { timeout: 15000 }),
      page.click('#btn-verify-otp')
    ]);

    const verifyData = await verifyRes.json();
    console.log('Verify OTP API response:', verifyData);

    await new Promise(r => setTimeout(r, 800));

    // Verify that timer STOPPED and button says ✓ Verified in green
    const sendBtnAfterVerify = await page.$eval('#btn-send-otp', el => ({
      text: el.textContent.trim(),
      disabled: el.disabled,
      bg: window.getComputedStyle(el).backgroundColor
    }));
    console.log('Send button after verify:', sendBtnAfterVerify);

    const verifyBtnAfterVerify = await page.$eval('#btn-verify-otp', el => ({
      text: el.textContent.trim(),
      disabled: el.disabled,
      bg: window.getComputedStyle(el).backgroundColor
    }));
    console.log('Verify button after verify:', verifyBtnAfterVerify);

    const otpInputDisabled = await page.$eval('#auth-otp-input', el => el.disabled);
    console.log('OTP Input disabled:', otpInputDisabled);

    if (!sendBtnAfterVerify.text.includes('Verified') || !sendBtnAfterVerify.disabled) {
      throw new Error('Send button did not stop countdown timer and lock into Verified state!');
    }
    if (!verifyBtnAfterVerify.text.includes('Verified') || !verifyBtnAfterVerify.disabled) {
      throw new Error('Verify button did not turn to Verified state!');
    }
    if (!otpInputDisabled) {
      throw new Error('OTP input was not locked after verification!');
    }

    await page.screenshot({ path: 'scratch/phone_otp_verified.png' });
    console.log('Screenshot saved: scratch/phone_otp_verified.png');

    // 6. Enter passwords and submit registration
    console.log('7. Filling password & confirm password, submitting registration...');
    await page.type('#auth-pass-input', 'SecretPass@2026');
    await page.type('#auth-confirm-pass-input', 'SecretPass@2026');

    const [registerRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/register') && res.status() === 201, { timeout: 15000 }),
      page.click('#btn-auth-submit')
    ]);

    const registerData = await registerRes.json();
    console.log('Register API Response:', registerData);

    if (!registerData.success || !registerData.user) {
      throw new Error('Account registration failed!');
    }

    console.log(`Registered user: ${registerData.user.name}, Country: ${registerData.user.country}, Currency: ${registerData.user.currency}`);
    if (registerData.user.country !== 'IN' || registerData.user.currency !== 'INR') {
      throw new Error('Expected India user with INR currency!');
    }

    await new Promise(r => setTimeout(r, 1200));

    // Check modal closed and user logged in
    const isModalVisible = await page.evaluate(() => {
      const modal = document.getElementById('auth-modal-overlay');
      return modal && modal.style.display !== 'none';
    });
    console.log('Modal visible after registration (should be false):', isModalVisible);

    // Capture screen of logged in state
    await page.screenshot({ path: 'scratch/phone_otp_registered_home.png' });
    console.log('Screenshot saved: scratch/phone_otp_registered_home.png');

    console.log('\n✅ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
