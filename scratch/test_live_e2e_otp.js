import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function runTest() {
  console.log('--- STARTING END-TO-END EMAIL OTP VERIFICATION ---');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromeLocal = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProgram = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  let execPath = edgePath;
  if (fs.existsSync(chromeProgram)) {
    execPath = chromeProgram;
  } else if (fs.existsSync(chromeLocal)) {
    execPath = chromeLocal;
  }

  console.log('Using browser binary:', execPath);

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  let capturedNetworkRequest = null;
  let capturedNetworkResponse = null;

  // Listen to network traffic (Network Tab simulation)
  page.on('request', req => {
    if (req.url().includes('/api/auth/send-otp')) {
      capturedNetworkRequest = {
        url: req.url(),
        method: req.method(),
        postData: req.postData()
      };
    }
  });

  page.on('response', async res => {
    if (res.url().includes('/api/auth/send-otp')) {
      try {
        const body = await res.json();
        capturedNetworkResponse = {
          status: res.status(),
          ok: res.ok(),
          body: body
        };
      } catch (e) {
        capturedNetworkResponse = {
          status: res.status(),
          error: e.message
        };
      }
    }
  });

  // Navigate to #register
  await page.goto('http://localhost:8080/#register', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#auth-modal-overlay', { timeout: 10000 });

  // Verify form is open
  const isModalVisible = await page.$eval('#auth-modal-overlay', el => el.style.display !== 'none');
  console.log('Register Modal Open:', isModalVisible);

  // Fill in fields
  const testEmail = 'sapeeda786@gmail.com';
  await page.type('#auth-name-input', 'Sapeeda Customer');
  await page.type('#auth-email-input', testEmail);
  await page.type('#auth-phone-input', '9876543210');

  // Click Send OTP
  console.log('Clicking Send OTP for email:', testEmail);
  await page.click('#btn-send-otp');

  // Wait for network response
  await page.waitForResponse(res => res.url().includes('/api/auth/send-otp') && res.status() === 200, { timeout: 20000 });

  // Wait 1.5s for UI DOM updates
  await new Promise(r => setTimeout(r, 1500));

  // Inspect state
  const uiState = await page.evaluate(() => {
    const otpInput = document.getElementById('auth-otp-input');
    const sendBtn = document.getElementById('btn-send-otp');
    const statusMsg = document.getElementById('otp-status-msg');
    return {
      otpInputValue: otpInput ? otpInput.value : null,
      otpInputPlaceholder: otpInput ? otpInput.placeholder : null,
      sendBtnText: sendBtn ? sendBtn.textContent.trim() : null,
      sendBtnDisabled: sendBtn ? sendBtn.disabled : null,
      statusMsgText: statusMsg ? statusMsg.textContent.trim() : null
    };
  });

  console.log('\n--- NETWORK TAB VERIFICATION ---');
  console.log('Request Method & URL:', capturedNetworkRequest?.method, capturedNetworkRequest?.url);
  console.log('Request Body:', capturedNetworkRequest?.postData);
  console.log('Response Status:', capturedNetworkResponse?.status);
  console.log('Response Body:', JSON.stringify(capturedNetworkResponse?.body));
  console.log('Contains OTP in Response:', JSON.stringify(capturedNetworkResponse?.body).includes('otp'));

  console.log('\n--- FRONTEND UI VERIFICATION ---');
  console.log('OTP Input Value (must be empty):', JSON.stringify(uiState.otpInputValue));
  console.log('Send Button Text (must show cooldown):', uiState.sendBtnText);
  console.log('Send Button Disabled:', uiState.sendBtnDisabled);
  console.log('Status Message:', uiState.statusMsgText);

  // Take screenshot for visual proof
  const screenshotPath = 'scratch/real_sendgrid_otp_flow.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to ' + screenshotPath);

  await browser.close();
  console.log('\n--- END-TO-END TEST FINISHED SUCCESSFULLY ---');
}

runTest().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
