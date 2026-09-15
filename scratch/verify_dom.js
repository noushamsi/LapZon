import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function verifyDOM() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  console.log('Navigating directly to http://localhost:8080/#register...');
  await page.goto('http://localhost:8080/#register', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const domCheck = await page.evaluate(() => {
    const card = document.querySelector('.auth-modal-card');
    if (!card) return { foundModal: false };

    const bodyText = card.innerText;
    const hasPhoneNumber = bodyText.includes('Phone Number');
    const hasSendOtp = bodyText.includes('Send OTP');
    const hasEnterOtp = bodyText.includes('Enter OTP');
    const hasVerifyOtp = bodyText.includes('Verify OTP');

    const phoneInput = card.querySelector('#auth-phone-input');
    const otpInput = card.querySelector('#auth-otp-input');
    const sendBtn = card.querySelector('#btn-send-otp');
    const verifyBtn = card.querySelector('#btn-verify-otp');

    const phonePlaceholder = phoneInput ? phoneInput.getAttribute('placeholder') : null;
    const otpPlaceholder = otpInput ? otpInput.getAttribute('placeholder') : null;

    // Check visibility
    const phoneVisible = phoneInput ? phoneInput.offsetParent !== null : false;
    const sendVisible = sendBtn ? sendBtn.offsetParent !== null : false;
    const otpVisible = otpInput ? otpInput.offsetParent !== null : false;
    const verifyVisible = verifyBtn ? verifyBtn.offsetParent !== null : false;

    // Ordered elements
    const elements = Array.from(card.querySelectorAll('label, input, select, button'));
    const order = elements.map(el => ({
      tag: el.tagName,
      id: el.id || '',
      text: (el.innerText || el.getAttribute('placeholder') || el.value || '').trim()
    })).filter(e => e.text);

    return {
      foundModal: true,
      hasPhoneNumber,
      hasSendOtp,
      hasEnterOtp,
      hasVerifyOtp,
      phonePlaceholder,
      otpPlaceholder,
      phoneVisible,
      sendVisible,
      otpVisible,
      verifyVisible,
      order
    };
  });

  console.log('DOM Verification Result:');
  console.log(JSON.stringify(domCheck, null, 2));

  // Capture screenshot
  await page.screenshot({ path: 'scratch/auth_popup_rendered.png' });
  console.log('Screenshot saved to scratch/auth_popup_rendered.png');

  await browser.close();
}

verifyDOM().catch(console.error);
