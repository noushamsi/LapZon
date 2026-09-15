import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
  console.log('🚀 Starting UAE (+971) Phone OTP & Currency Verification...');

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

    console.log('1. Navigating to http://localhost:8080/#welcome...');
    await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle2' });

    console.log('2. Opening Register modal...');
    await page.evaluate(() => {
      window.openAuthModal('register');
    });

    await page.waitForSelector('#auth-modal-overlay', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Fill registration info
    await page.type('#auth-name-input', 'Rashid Al-Maktoum');
    const uaeEmail = `rashid.${Date.now()}@example.ae`;
    await page.type('#auth-email-input', uaeEmail);

    // Select UAE (+971)
    console.log('3. Selecting UAE (+971)...');
    await page.select('#auth-dial-code', 'AE');
    await new Promise(r => setTimeout(r, 300));

    const currencyHint = await page.$eval('#auth-phone-currency-hint', el => el.textContent.trim());
    console.log('Currency hint after UAE selection:', currencyHint);
    if (!currencyHint.includes('UAE (AED Dirhams)')) {
      throw new Error('Expected UAE (AED Dirhams) currency hint!');
    }

    // Type 9-digit UAE phone number
    console.log('4. Entering 9-digit UAE phone (509999999)...');
    await page.type('#auth-phone-input', '509999999');

    // Click Send OTP
    console.log('5. Clicking Send OTP...');
    const [sendRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/send-otp') && res.status() === 200, { timeout: 15000 }),
      page.click('#btn-send-otp')
    ]);
    const sendJson = await sendRes.json();
    console.log('Send OTP Response:', sendJson);

    // Verify OTP field is blank
    const otpVal = await page.$eval('#auth-otp-input', el => el.value);
    if (otpVal !== '') throw new Error('OTP field was not blank!');

    // Enter valid OTP and verify
    console.log('6. Verifying OTP...');
    await page.type('#auth-otp-input', '123456');

    const [verifyRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/verify-otp') && res.status() === 200, { timeout: 15000 }),
      page.click('#btn-verify-otp')
    ]);
    const verifyJson = await verifyRes.json();
    console.log('Verify OTP Response:', verifyJson);

    // Fill passwords and submit
    console.log('7. Filling passwords and registering...');
    await page.type('#auth-pass-input', 'DubaiPass@2026');
    await page.type('#auth-confirm-pass-input', 'DubaiPass@2026');

    const [regRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/register') && res.status() === 201, { timeout: 15000 }),
      page.click('#btn-auth-submit')
    ]);
    const regJson = await regRes.json();
    console.log('Register Response:', regJson);

    if (regJson.user.country !== 'AE' || regJson.user.currency !== 'AED') {
      throw new Error('Expected AE country and AED currency!');
    }

    await new Promise(r => setTimeout(r, 1200));

    // Capture screenshot of UAE session with AED currency
    await page.screenshot({ path: 'scratch/uae_registered_aed.png' });
    console.log('Screenshot saved: scratch/uae_registered_aed.png');

    console.log('\n✅ UAE PHONE OTP & AED CURRENCY VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ UAE test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
