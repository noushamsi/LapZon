import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\81c59ceb-bd41-475b-9c6a-7c1cbabce664';

async function verifyFrontend() {
  console.log('Launching Edge via puppeteer-core to inspect updated Auth Modal (Zero OTP)...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 1. Check Register Modal
  console.log('Navigating to http://localhost:8080/#welcome...');
  await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  console.log('Opening Register modal directly via hash #register...');
  await page.evaluate(() => {
    window.location.hash = '#register';
    if (window.openAuthModal) window.openAuthModal('register');
  });
  await new Promise(r => setTimeout(r, 600));

  // Verify OTP elements are NOT in DOM
  const hasSendOtp = await page.$('#btn-send-otp');
  const hasVerifyOtp = await page.$('#btn-verify-otp');
  const hasOtpInput = await page.$('#auth-otp-input');
  const hasOtpGroup = await page.$('#otp-verify-group');

  console.log('OTP Elements Check in Register Modal:');
  console.log('  #btn-send-otp exists:', !!hasSendOtp);
  console.log('  #btn-verify-otp exists:', !!hasVerifyOtp);
  console.log('  #auth-otp-input exists:', !!hasOtpInput);
  console.log('  #otp-verify-group exists:', !!hasOtpGroup);

  if (hasSendOtp || hasVerifyOtp || hasOtpInput || hasOtpGroup) {
    throw new Error('FAIL: OTP elements still present in DOM!');
  }
  console.log('✓ Zero OTP elements in Register Modal!');

  // Check required register fields
  const hasName = await page.$('#auth-name-input');
  const hasEmail = await page.$('#auth-email-input');
  const hasPhone = await page.$('#auth-phone-input');
  const dialCode = await page.$eval('#auth-dial-code', el => el.value);
  const currencyHint = await page.$eval('#auth-phone-currency-hint', el => el.textContent);
  const hasPass = await page.$('#auth-pass-input');
  const hasConfirmPass = await page.$('#auth-confirm-pass-input');
  const submitText = await page.$eval('#btn-auth-submit', el => el.textContent.trim());

  console.log('Register Fields Check:');
  console.log('  Name Input:', !!hasName);
  console.log('  Email Input:', !!hasEmail);
  console.log('  Phone Input:', !!hasPhone);
  console.log('  Dial Code:', dialCode);
  console.log('  Currency Hint:', currencyHint);
  console.log('  Password Input:', !!hasPass);
  console.log('  Confirm Password Input:', !!hasConfirmPass);
  console.log('  Submit Button Text:', submitText);

  const registerShot = path.join(ARTIFACTS_DIR, 'register_modal_clean_no_otp.png');
  await page.screenshot({ path: registerShot });
  console.log(`Saved screenshot: ${registerShot}`);

  // 2. Switch to Login Modal
  console.log('\nSwitching to Login Modal...');
  const switchLoginBtn = await page.$('#auth-switch-login');
  if (switchLoginBtn) {
    await switchLoginBtn.click();
    await new Promise(r => setTimeout(r, 600));

    const loginEmailLabel = await page.$eval('.form-group label', el => el.textContent.trim());
    const loginEmailPlaceholder = await page.$eval('#auth-email-input', el => el.placeholder);
    const loginSubmitText = await page.$eval('#btn-auth-submit', el => el.textContent.trim());

    console.log('Login Modal Field Label:', loginEmailLabel);
    console.log('Login Modal Field Placeholder:', loginEmailPlaceholder);
    console.log('Login Submit Text:', loginSubmitText);

    const loginShot = path.join(ARTIFACTS_DIR, 'login_modal_clean_no_otp.png');
    await page.screenshot({ path: loginShot });
    console.log(`Saved screenshot: ${loginShot}`);
  }

  await browser.close();
  console.log('\n✓ Browser UI verification completed successfully!');
}

verifyFrontend().catch(err => {
  console.error('Frontend test error:', err);
  process.exit(1);
});
