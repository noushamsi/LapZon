import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function verifyDirectRegister() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(edgePath) ? edgePath : chromePath;

  console.log('Launching browser with:', execPath);
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  console.log('Navigating directly to http://localhost:8080/#register...');
  await page.goto('http://localhost:8080/#register', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Inspect the DOM for visible elements
  const results = await page.evaluate(() => {
    const card = document.querySelector('.auth-modal-card');
    if (!card) return { success: false, error: 'MODAL_NOT_FOUND' };

    const getElementDetails = (selector) => {
      const el = card.querySelector(selector);
      if (!el) return { found: false };
      const style = window.getComputedStyle(el);
      const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
      return {
        found: true,
        visible: isVisible,
        offsetHeight: el.offsetHeight,
        offsetWidth: el.offsetWidth,
        text: el.innerText || el.textContent || '',
        value: el.value,
        placeholder: el.placeholder
      };
    };

    // Check all required items:
    // 1. Full Name
    // 2. Email
    // 3. Phone Number (+91 | Enter 10-digit mobile number)
    // 4. Send OTP
    // 5. Enter OTP (Enter 6-digit OTP)
    // 6. Verify OTP
    // 7. Password
    // 8. Create account

    const fullNameGroup = card.querySelector('#auth-name-input')?.closest('.form-group');
    const emailGroup = card.querySelector('#auth-email-input')?.closest('.form-group');
    const phoneGroup = card.querySelector('#auth-phone-group');
    const otpVerifyGroup = card.querySelector('#otp-verify-group');
    const passGroup = card.querySelector('#auth-pass-input')?.closest('.form-group');
    const submitBtn = card.querySelector('#btn-auth-submit');

    const form = card.querySelector('#auth-main-form');
    // Extract text labels in order inside form
    const formLabelsAndButtons = Array.from(form.querySelectorAll('label, button, input')).map(el => {
      return {
        tag: el.tagName,
        id: el.id,
        text: el.innerText || el.placeholder || el.value || '',
        visible: window.getComputedStyle(el).display !== 'none' && el.offsetHeight > 0
      };
    });

    return {
      success: true,
      title: card.querySelector('h2')?.textContent.trim(),
      fullName: {
        label: fullNameGroup?.querySelector('label')?.textContent.trim(),
        input: getElementDetails('#auth-name-input')
      },
      email: {
        label: emailGroup?.querySelector('label')?.textContent.trim(),
        input: getElementDetails('#auth-email-input')
      },
      phone: {
        label: phoneGroup?.querySelector('label')?.textContent.trim(),
        dialCode: phoneGroup?.querySelector('span')?.textContent.trim(),
        selectValue: phoneGroup?.querySelector('#auth-dial-code')?.value,
        input: getElementDetails('#auth-phone-input'),
        sendOtpBtn: getElementDetails('#btn-send-otp')
      },
      otp: {
        label: otpVerifyGroup?.querySelector('label')?.textContent.trim(),
        input: getElementDetails('#auth-otp-input'),
        verifyOtpBtn: getElementDetails('#btn-verify-otp')
      },
      password: {
        label: passGroup?.querySelector('label')?.textContent.trim(),
        input: getElementDetails('#auth-pass-input')
      },
      submitButton: getElementDetails('#btn-auth-submit'),
      formElementsSummary: formLabelsAndButtons
    };
  });

  console.log('DOM Inspection Results:\n', JSON.stringify(results, null, 2));

  // Take screenshot of popup on #register
  const screenshotPath = 'scratch/register_popup_live.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to: ${screenshotPath}`);

  // Also test Login tab to ensure Phone/OTP is NOT visible on Login
  console.log('\nTesting tab switch to Login (#login)...');
  await page.click('#auth-switch-login');
  await new Promise(r => setTimeout(r, 400));

  const loginResults = await page.evaluate(() => {
    const card = document.querySelector('.auth-modal-card');
    const phoneGroup = card?.querySelector('#auth-phone-group');
    const otpGroup = card?.querySelector('#otp-verify-group');
    const nameInput = card?.querySelector('#auth-name-input');
    const submitBtn = card?.querySelector('#btn-auth-submit');

    const isPhoneVisible = phoneGroup && window.getComputedStyle(phoneGroup).display !== 'none';
    const isOtpVisible = otpGroup && window.getComputedStyle(otpGroup).display !== 'none';
    const isNamePresent = !!nameInput;

    return {
      title: card?.querySelector('h2')?.textContent.trim(),
      submitText: submitBtn?.textContent.trim(),
      isPhoneVisible,
      isOtpVisible,
      isNamePresent
    };
  });

  console.log('Login Tab Inspection Results:\n', JSON.stringify(loginResults, null, 2));

  // Save screenshot of login form
  await page.screenshot({ path: 'scratch/login_popup_live.png' });
  console.log('Screenshot of login saved to scratch/login_popup_live.png');

  await browser.close();
}

verifyDirectRegister().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
