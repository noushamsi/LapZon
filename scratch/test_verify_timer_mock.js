import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function run() {
  console.log('--- STARTING VERIFY TIMER STOP TEST ---');

  const chromeProgram = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeLocal = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  let execPath = edgePath;
  if (fs.existsSync(chromeProgram)) execPath = chromeProgram;
  else if (fs.existsSync(chromeLocal)) execPath = chromeLocal;

  const browser = await puppeteer.launch({ executablePath: execPath, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Intercept verify-otp route to test frontend timer stop behavior
  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => {
    if (interceptedRequest.url().includes('/api/auth/verify-otp')) {
      interceptedRequest.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Email address verified successfully!' })
      });
    } else {
      interceptedRequest.continue();
    }
  });

  await page.goto('http://localhost:8080/#register', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#auth-modal-overlay', { timeout: 10000 });

  const testEmail = 'buylap3916@gmail.com';
  await page.type('#auth-name-input', 'Noushad');
  await page.type('#auth-email-input', testEmail);
  await page.type('#auth-phone-input', '558316202');

  console.log('1. Clicking Send OTP...');
  await page.click('#btn-send-otp');

  // Wait for 200 response
  await page.waitForResponse(res => res.url().includes('/api/auth/send-otp') && res.status() === 200, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1200));

  const textDuringCountdown = await page.$eval('#btn-send-otp', el => el.textContent.trim());
  console.log('2. Button during countdown:', textDuringCountdown);

  // Now enter 6-digit OTP
  console.log('3. Entering 6-digit OTP and clicking Verify OTP...');
  await page.type('#auth-otp-input', '972354');
  await page.click('#btn-verify-otp');

  await new Promise(r => setTimeout(r, 1000));

  const stateAfterVerify = await page.evaluate(() => {
    const sendBtn = document.getElementById('btn-send-otp');
    const verifyBtn = document.getElementById('btn-verify-otp');
    const otpInput = document.getElementById('auth-otp-input');
    const statusMsg = document.getElementById('otp-verify-result');
    return {
      sendBtnText: sendBtn?.textContent.trim(),
      sendBtnDisabled: sendBtn?.disabled,
      verifyBtnText: verifyBtn?.textContent.trim(),
      verifyBtnDisabled: verifyBtn?.disabled,
      otpInputDisabled: otpInput?.disabled,
      statusMsgText: statusMsg?.textContent.trim()
    };
  });

  console.log('4. State immediately after verify:', stateAfterVerify);

  // Wait 3 seconds to verify the timer does NOT resume or continue ticking
  console.log('5. Waiting 3 seconds to confirm timer stays stopped...');
  await new Promise(r => setTimeout(r, 3000));

  const stateAfterWait = await page.evaluate(() => {
    const sendBtn = document.getElementById('btn-send-otp');
    return {
      sendBtnText: sendBtn?.textContent.trim(),
      sendBtnDisabled: sendBtn?.disabled
    };
  });

  console.log('6. State after 3 seconds wait:', stateAfterWait);

  // Take screenshot for proof
  await page.screenshot({ path: 'scratch/verified_timer_stopped.png' });
  console.log('Screenshot saved to scratch/verified_timer_stopped.png');

  await browser.close();
  console.log('--- TEST FINISHED SUCCESSFULLY ---');
}

run().catch(e => {
  console.error('Test Failed:', e);
  process.exit(1);
});
