import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function runLiveInspection() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const networkRequests = [];
  page.on('response', response => {
    const url = response.url();
    if (url.includes('app.js') || url.includes('authModal.js')) {
      networkRequests.push({
        url,
        status: response.status(),
        fromCache: response.fromCache ? response.fromCache() : false,
        headers: response.headers()
      });
    }
  });

  console.log('Navigating to http://localhost:8080/#register...');
  await page.goto('http://localhost:8080/#register', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Run the EXACT three queries requested by user:
  // document.getElementById('auth-phone-input')
  // document.getElementById('btn-send-otp')
  // document.getElementById('auth-otp-input')
  const domQueryResult = await page.evaluate(() => {
    const phoneEl = document.getElementById('auth-phone-input');
    const sendOtpEl = document.getElementById('btn-send-otp');
    const otpInputEl = document.getElementById('auth-otp-input');

    const serializeEl = (el) => {
      if (!el) return null;
      return {
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        outerHTML: el.outerHTML,
        offsetParent: !!el.offsetParent,
        offsetHeight: el.offsetHeight,
        offsetWidth: el.offsetWidth,
        display: window.getComputedStyle(el).display,
        visibility: window.getComputedStyle(el).visibility,
        placeholder: el.placeholder || null,
        textContent: el.textContent?.trim() || null
      };
    };

    return {
      'document.getElementById("auth-phone-input")': serializeEl(phoneEl),
      'document.getElementById("btn-send-otp")': serializeEl(sendOtpEl),
      'document.getElementById("auth-otp-input")': serializeEl(otpInputEl),
      modalTitle: document.querySelector('.auth-modal-card h2')?.textContent.trim(),
      submitBtnText: document.getElementById('btn-auth-submit')?.textContent.trim()
    };
  });

  console.log('\n--- NETWORK REQUESTS FOR app.js AND authModal.js ---');
  console.log(JSON.stringify(networkRequests, null, 2));

  console.log('\n--- LIVE DOM QUERY RESULTS ---');
  console.log(JSON.stringify(domQueryResult, null, 2));

  await browser.close();
}

runLiveInspection().catch(err => {
  console.error('Inspection error:', err);
  process.exit(1);
});
