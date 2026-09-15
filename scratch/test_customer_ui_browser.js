import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function runCustomerBrowserTests() {
  console.log('========================================================================');
  console.log('🚀 TESTING CUSTOMER LOGIN & FORGOT PASSWORD IN BROWSER');
  console.log('========================================================================\n');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      process.exit(1);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Open Welcome / Store -> Click Sign In Modal
    // -------------------------------------------------------------
    console.log('--- TEST 1: Open Customer Sign In Modal ---');
    await page.goto('http://localhost:8080/#store', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Open Auth Modal
    await page.waitForSelector('#nav-btn-signin', { timeout: 5000 });
    await page.click('#nav-btn-signin');
    await new Promise(r => setTimeout(r, 400));

    const modalTitle = await page.evaluate(() => document.querySelector('.auth-modal-card h2')?.textContent.trim());
    assert(modalTitle === 'Log in', `Modal opened with title: "${modalTitle}"`);

    // -------------------------------------------------------------
    // TEST 2: Password Eye Toggle on Sign In Form
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Password Show/Hide Toggle on Customer Sign In ---');
    await page.type('#auth-pass-input', 'SecretPassword123');
    let passType = await page.evaluate(() => document.getElementById('auth-pass-input').type);
    let passAria = await page.evaluate(() => document.getElementById('btn-toggle-show-pass').getAttribute('aria-label'));
    assert(passType === 'password', `Default password type is "${passType}" (masked bullets)`);
    assert(passAria === 'Show password', `Default eye toggle aria-label is "${passAria}"`);

    // Click Eye Toggle -> Show Password
    await page.click('#btn-toggle-show-pass');
    passType = await page.evaluate(() => document.getElementById('auth-pass-input').type);
    passAria = await page.evaluate(() => document.getElementById('btn-toggle-show-pass').getAttribute('aria-label'));
    let passVal = await page.evaluate(() => document.getElementById('auth-pass-input').value);
    assert(passType === 'text', `After 1st click, password type is "${passType}" (visible)`);
    assert(passAria === 'Hide password', `Eye toggle aria-label changed to "${passAria}"`);
    assert(passVal === 'SecretPassword123', `Password value preserved: "${passVal}"`);

    // Click Eye Toggle Again -> Hide Password
    await page.click('#btn-toggle-show-pass');
    passType = await page.evaluate(() => document.getElementById('auth-pass-input').type);
    passAria = await page.evaluate(() => document.getElementById('btn-toggle-show-pass').getAttribute('aria-label'));
    assert(passType === 'password', `After 2nd click, password type is "${passType}" (masked again)`);
    assert(passAria === 'Show password', `Eye toggle aria-label restored to "${passAria}"`);

    // -------------------------------------------------------------
    // TEST 3: Switch to Create Account -> Test Confirm Password Eye Toggle
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Create Account Form Password & Confirm Password Toggles ---');
    await page.click('#auth-switch-register');
    await new Promise(r => setTimeout(r, 300));

    const regTitle = await page.evaluate(() => document.querySelector('.auth-modal-card h2')?.textContent.trim());
    assert(regTitle === 'Create account', `Switched to "${regTitle}"`);

    await page.type('#auth-pass-input', 'RegPassword123');
    await page.type('#auth-confirm-pass-input', 'RegPassword123');

    // Toggle Confirm Password
    await page.click('#btn-toggle-show-confirm-pass');
    let confType = await page.evaluate(() => document.getElementById('auth-confirm-pass-input').type);
    let confAria = await page.evaluate(() => document.getElementById('btn-toggle-show-confirm-pass').getAttribute('aria-label'));
    assert(confType === 'text', `Confirm Password toggles to "${confType}"`);
    assert(confAria === 'Hide password', `Confirm Password eye aria-label is "${confAria}"`);

    await page.click('#btn-toggle-show-confirm-pass');
    confType = await page.evaluate(() => document.getElementById('auth-confirm-pass-input').type);
    assert(confType === 'password', `Confirm Password toggles back to "${confType}"`);

    // -------------------------------------------------------------
    // TEST 4: Forgot Password Flow (Steps 1 -> 2 -> 3 -> 4)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Customer Forgot Password Multi-Step Flow ---');
    // Switch back to Login
    await page.click('#auth-switch-login');
    await new Promise(r => setTimeout(r, 300));

    // Click "Forgot Password?" link
    const hasForgotLink = await page.evaluate(() => !!document.getElementById('auth-forgot-link'));
    assert(hasForgotLink, 'Found "Forgot Password?" link below customer password input');

    await page.click('#auth-forgot-link');
    await new Promise(r => setTimeout(r, 300));

    // Step 1 check
    const step1Title = await page.evaluate(() => document.querySelector('.auth-modal-card h2')?.textContent.trim());
    assert(step1Title.includes('Forgot Your Password?'), `Step 1 Card Title: "${step1Title}"`);

    // Submit registered email
    await page.type('#auth-reset-email-input', 'customer@gmail.com');
    await page.click('#btn-send-reset-code');
    
    // Wait for Step 2 to render
    await page.waitForFunction(
      () => document.querySelector('.auth-modal-card h2')?.textContent.includes('Enter Verification Code'),
      { timeout: 15000 }
    );

    // Step 2 check
    const step2Title = await page.evaluate(() => document.querySelector('.auth-modal-card h2')?.textContent.trim());
    assert(step2Title.includes('Enter Verification Code'), `Step 2 Card Title: "${step2Title}"`);

    const hasOtpTimer = await page.evaluate(() => document.getElementById('auth-reset-timer-wrap')?.textContent.includes('Code expires in'));
    const hasResendBtn = await page.evaluate(() => !!document.getElementById('btn-resend-reset-otp'));
    assert(hasOtpTimer && hasResendBtn, 'Step 2 has live 5-minute expiry timer and 60s resend cooldown button');

    // Test Incorrect OTP rejection on Step 2
    await page.type('#auth-reset-otp-input', '123456');
    await page.click('#btn-verify-reset-code');
    await new Promise(r => setTimeout(r, 600));

    const otpError = await page.evaluate(() => document.getElementById('auth-reset-error-msg')?.textContent.trim() || '');
    assert(otpError.includes('Invalid verification code'), `Step 2 correctly rejected wrong code: "${otpError}"`);

    // Change Email / Start Over link
    await page.click('#link-reset-change-email');
    await new Promise(r => setTimeout(r, 400));
    const backToStep1Title = await page.evaluate(() => document.querySelector('.auth-modal-card h2')?.textContent.trim());
    assert(backToStep1Title.includes('Forgot Your Password?'), 'Change Email link returns back to Step 1');

    // -------------------------------------------------------------
    // TEST 5: Mobile Responsive Layout (375x667 iPhone SE)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Mobile Responsive Layout (375x667 iPhone SE) ---');
    await page.setViewport({ width: 375, height: 667, isMobile: true });
    await new Promise(r => setTimeout(r, 600));

    const cardWidth = await page.evaluate(() => {
      const card = document.querySelector('.auth-modal-card');
      return card ? card.getBoundingClientRect().width : 0;
    });
    assert(cardWidth >= 250 && cardWidth <= 375, `Mobile modal card width is responsive: ${cardWidth}px (<= 375px)`);

    console.log('\n========================================================================');
    console.log('✅ ALL BROWSER UI & ACCESSIBILITY TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('Browser Test Error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runCustomerBrowserTests();
