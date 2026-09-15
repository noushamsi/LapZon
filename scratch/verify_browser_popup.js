import puppeteer from 'puppeteer-core';

async function testPopup() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  // Test standard user flow: Visit home page -> Click Sign In -> Click Create account
  console.log('1. Navigating to http://localhost:8080/#welcome...');
  await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  console.log('2. Clicking Sign In in navbar...');
  await page.click('#nav-btn-signin');
  await new Promise(r => setTimeout(r, 400));

  console.log('3. Clicking "Create account" link in auth modal...');
  await page.click('#auth-switch-register');
  await new Promise(r => setTimeout(r, 500));

  // Inspect exact element presence and order
  const evaluation = await page.evaluate(() => {
    const card = document.querySelector('.auth-modal-card');
    if (!card) return { error: 'MODAL_NOT_FOUND' };

    const title = card.querySelector('h2')?.textContent.trim();
    const googleBtn = card.querySelector('#btn-google-signin span')?.textContent.trim();
    const hasName = !!card.querySelector('#auth-name-input');
    const hasEmail = !!card.querySelector('#auth-email-input');
    const dialCode = card.querySelector('#auth-dial-code')?.value;
    const phonePlaceholder = card.querySelector('#auth-phone-input')?.placeholder;
    const sendOtpText = card.querySelector('#btn-send-otp')?.textContent.trim();
    const otpPlaceholder = card.querySelector('#auth-otp-input')?.placeholder;
    const verifyOtpText = card.querySelector('#btn-verify-otp')?.textContent.trim();
    const hasPassword = !!card.querySelector('#auth-pass-input');
    const submitText = card.querySelector('#btn-auth-submit')?.textContent.trim();
    const loginLinkText = card.querySelector('#auth-switch-login')?.textContent.trim();

    // Check DOM order
    const form = card.querySelector('#auth-main-form');
    const elements = Array.from(form.querySelectorAll('input, select, button[type="button"], button[type="submit"], #auth-switch-login'));
    const order = elements.map(el => el.id || el.className || el.tagName);

    return {
      title,
      googleBtn,
      hasName,
      hasEmail,
      dialCode,
      phonePlaceholder,
      sendOtpText,
      otpPlaceholder,
      verifyOtpText,
      hasPassword,
      submitText,
      loginLinkText,
      domOrder: order
    };
  });

  console.log('Verification Results:\n', JSON.stringify(evaluation, null, 2));

  // Test interactive form filling
  console.log('\n4. Typing Registration info...');
  await page.type('#auth-name-input', 'Rahul Sharma');
  await page.type('#auth-email-input', 'rahul@example.com');
  await page.type('#auth-phone-input', '9876543210');
  await page.type('#auth-pass-input', 'SecretPass123!');

  console.log('5. Clicking Send OTP...');
  await page.click('#btn-send-otp');
  await new Promise(r => setTimeout(r, 400));

  console.log('6. Clicking Verify OTP...');
  await page.click('#btn-verify-otp');
  await new Promise(r => setTimeout(r, 400));

  // Take screenshot of the complete popup
  await page.screenshot({ path: 'scratch/auth_popup_rendered.png' });
  console.log('7. Successfully saved screenshot to scratch/auth_popup_rendered.png');

  await browser.close();
}

testPopup().catch(console.error);
