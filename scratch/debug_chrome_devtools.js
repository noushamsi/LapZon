import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function debugChrome() {
  const chromePath = 'C:\\\\Users\\\\Admin\\\\AppData\\\\Local\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';
  const diskFilePath = path.resolve('js/components/authModal.js');
  const diskCode = fs.readFileSync(diskFilePath, 'utf8');

  console.log('=== CHROME DEVTOOLS DIAGNOSTIC SUITE ===');
  console.log('1. Target URL: http://localhost:8080/#register');
  console.log('2. Chrome Binary:', chromePath);
  console.log('3. Disk File:', diskFilePath, `(${diskCode.length} bytes)`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-cache'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  const jsNetworkRequests = [];
  let networkAuthModalBody = null;

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('.js')) {
      const headers = res.headers();
      const status = res.status();
      jsNetworkRequests.push({ url, status, cacheControl: headers['cache-control'] });

      if (url.includes('authModal.js')) {
        try {
          networkAuthModalBody = await res.text();
        } catch (e) {
          networkAuthModalBody = 'ERROR_READING_BODY: ' + e.message;
        }
      }
    }
  });

  console.log('\n--- Navigating to http://localhost:8080/#register ---');
  await page.goto('http://localhost:8080/#register', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  console.log('\n--- CHECK 1 & 2: Console Errors ---');
  const errors = consoleMessages.filter(m => m.type === 'error');
  console.log(`Total console messages: ${consoleMessages.length}, Errors: ${errors.length}, PageErrors: ${pageErrors.length}`);
  if (errors.length > 0) {
    console.log('Console Errors:', errors);
  }
  if (pageErrors.length > 0) {
    console.log('Page Errors:', pageErrors);
  }

  console.log('\n--- CHECK 3: Network JS Requests ---');
  jsNetworkRequests.forEach(r => {
    console.log(`  [${r.status}] ${r.url} (Cache-Control: ${r.cacheControl || 'none'})`);
  });

  console.log('\n--- CHECK 4: Compare Disk File vs Network authModal.js ---');
  if (networkAuthModalBody) {
    console.log(`Network authModal.js length: ${networkAuthModalBody.length} bytes`);
    console.log(`Disk authModal.js length:    ${diskCode.length} bytes`);
    console.log(`Exact Match:                 ${networkAuthModalBody === diskCode}`);
    console.log(`Contains "Phone Number":     ${networkAuthModalBody.includes('Phone Number')}`);
    console.log(`Contains "Send OTP":         ${networkAuthModalBody.includes('Send OTP')}`);
    console.log(`Contains "Enter 6-digit OTP": ${networkAuthModalBody.includes('Enter 6-digit OTP')}`);
    console.log(`Contains "Verify OTP":       ${networkAuthModalBody.includes('Verify OTP')}`);
  } else {
    console.log('FAILED: authModal.js response body not captured');
  }

  console.log('\n--- CHECK 5 & 6: DOM & CSS Visibility Inspection ---');
  const domDetails = await page.evaluate(() => {
    const card = document.querySelector('.auth-modal-card');
    if (!card) return { error: 'AUTH_MODAL_CARD_NOT_FOUND' };

    const title = card.querySelector('h2')?.textContent.trim();
    const phoneGroup = card.querySelector('#auth-phone-group');
    const phoneInput = card.querySelector('#auth-phone-input');
    const sendOtpBtn = card.querySelector('#btn-send-otp');
    const otpGroup = card.querySelector('#otp-verify-group');
    const otpInput = card.querySelector('#auth-otp-input');
    const verifyOtpBtn = card.querySelector('#btn-verify-otp');

    function checkVis(el, name) {
      if (!el) return { name, exists: false };
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const isVisible = cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0' && rect.height > 0 && rect.width > 0;
      return {
        name,
        exists: true,
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        height: rect.height,
        width: rect.width,
        offsetParentNotNull: el.offsetParent !== null,
        isVisible
      };
    }

    return {
      title,
      phoneGroup: checkVis(phoneGroup, '#auth-phone-group'),
      phoneInput: checkVis(phoneInput, '#auth-phone-input'),
      sendOtpBtn: checkVis(sendOtpBtn, '#btn-send-otp'),
      otpGroup: checkVis(otpGroup, '#otp-verify-group'),
      otpInput: checkVis(otpInput, '#auth-otp-input'),
      verifyOtpBtn: checkVis(verifyOtpBtn, '#btn-verify-otp'),
      fullCardText: card.innerText
    };
  });

  console.log('DOM & CSS Details:');
  console.log(JSON.stringify(domDetails, null, 2));

  // Screenshot
  await page.screenshot({ path: 'scratch/chrome_devtools_verified.png' });
  console.log('\nScreenshot saved to scratch/chrome_devtools_verified.png');

  await browser.close();
  console.log('\n=== DIAGNOSTIC SUITE COMPLETE ===');
}

debugChrome().catch(console.error);
