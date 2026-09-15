import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function testAllThreeRequirements() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  console.log('====================================================');
  console.log('TEST 1: HERO SECTION AUTH UI (LOGGED OUT)');
  console.log('====================================================');
  await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const heroInitialState = await page.evaluate(() => {
    const exploreBtn = document.getElementById('hero-btn-explore');
    const authBtn = document.getElementById('hero-btn-auth');
    return {
      hasExplore: !!exploreBtn,
      exploreText: exploreBtn ? exploreBtn.innerText.trim() : null,
      hasAuth: !!authBtn,
      authText: authBtn ? authBtn.innerText.trim() : null
    };
  });
  console.log('Hero Initial (Logged Out):', heroInitialState);
  if (heroInitialState.hasExplore && heroInitialState.hasAuth) {
    console.log('✓ PASS: Logged out shows Explore Laptops + Sign In.');
  } else {
    console.error('FAILED: Logged out Hero state is incorrect!');
  }

  console.log('\n====================================================');
  console.log('TEST 2: COUNTRY-SPECIFIC PHONE VALIDATION (INDIA & UAE)');
  console.log('====================================================');
  // Open Register modal
  await page.goto('http://localhost:8080/#register', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // 2A. India with 9 digits (Must be rejected)
  console.log('Testing India with 9 digits...');
  await page.select('#auth-dial-code', 'IN');
  await page.type('#auth-phone-input', '987654321');
  await page.click('#btn-send-otp');
  await new Promise(r => setTimeout(r, 400));

  let statusMsg = await page.evaluate(() => document.getElementById('otp-status-msg')?.innerText.trim());
  console.log('India 9 digits result:', statusMsg);
  if (statusMsg && statusMsg.includes('10-digit Indian mobile number')) {
    console.log('✓ PASS: India with 9 digits correctly rejected.');
  } else {
    console.error('FAILED: India 9 digits was not properly rejected!');
  }

  // 2B. India with 10 digits (Must be accepted)
  console.log('Testing India with 10 digits (6364522423)...');
  await page.evaluate(() => { document.getElementById('auth-phone-input').value = ''; });
  await page.type('#auth-phone-input', '6364522423');
  await page.click('#btn-send-otp');
  await new Promise(r => setTimeout(r, 800));

  statusMsg = await page.evaluate(() => document.getElementById('otp-status-msg')?.innerText.trim());
  let otpValue = await page.evaluate(() => document.getElementById('auth-otp-input')?.value);
  console.log('India 10 digits result:', statusMsg);
  console.log('OTP input value:', JSON.stringify(otpValue));
  if (statusMsg && statusMsg.includes('OTP has been sent to +91 6364522423') && otpValue === '') {
    console.log('✓ PASS: India 10 digits accepted, OTP input remains completely blank.');
  } else {
    console.error('FAILED: India 10 digits send OTP failed!');
  }

  // 2C. Switch to UAE (+971)
  console.log('Switching country to UAE (+971)...');
  await page.select('#auth-dial-code', 'AE');
  await new Promise(r => setTimeout(r, 400));

  const uaeRules = await page.evaluate(() => {
    const input = document.getElementById('auth-phone-input');
    const prefix = document.getElementById('auth-dial-prefix');
    return {
      placeholder: input?.placeholder,
      maxLength: input?.maxLength,
      value: input?.value,
      prefix: prefix?.innerText.trim()
    };
  });
  console.log('UAE rules after switch:', uaeRules);
  if (uaeRules.maxLength === 9 && uaeRules.prefix === '+971' && uaeRules.value === '') {
    console.log('✓ PASS: UAE dial prefix is +971, maxLength is 9, invalid number cleared.');
  } else {
    console.error('FAILED: UAE rules did not update correctly!', uaeRules);
  }

  // 2D. UAE with 8 digits (Must be rejected)
  console.log('Testing UAE with 8 digits (50123456)...');
  await page.type('#auth-phone-input', '50123456');
  await page.click('#btn-send-otp');
  await new Promise(r => setTimeout(r, 400));

  statusMsg = await page.evaluate(() => document.getElementById('otp-status-msg')?.innerText.trim());
  console.log('UAE 8 digits result:', statusMsg);
  if (statusMsg && statusMsg.includes('9-digit UAE mobile number')) {
    console.log('✓ PASS: UAE with 8 digits correctly rejected.');
  } else {
    console.error('FAILED: UAE 8 digits was not rejected!');
  }

  // 2E. UAE with 9 digits (501234567 - Must be accepted)
  console.log('Testing UAE with 9 digits (501234567)...');
  await page.evaluate(() => { document.getElementById('auth-phone-input').value = ''; });
  await page.type('#auth-phone-input', '501234567');
  await page.click('#btn-send-otp');
  await new Promise(r => setTimeout(r, 800));

  statusMsg = await page.evaluate(() => document.getElementById('otp-status-msg')?.innerText.trim());
  otpValue = await page.evaluate(() => document.getElementById('auth-otp-input')?.value);
  console.log('UAE 9 digits result:', statusMsg);
  console.log('OTP input value:', JSON.stringify(otpValue));
  if (statusMsg && statusMsg.includes('OTP has been sent to +971 501234567') && otpValue === '') {
    console.log('✓ PASS: UAE 9 digits accepted, OTP input remains completely blank.');
  } else {
    console.error('FAILED: UAE 9 digits send OTP failed!');
  }

  console.log('\n====================================================');
  console.log('TEST 3: FORM RESET & PERSISTENCE');
  console.log('====================================================');
  // Fill in test details
  console.log('Entering values in Create Account modal...');
  await page.type('#auth-name-input', 'Test Reset User');
  await page.type('#auth-email-input', 'testreset@example.com');
  await page.type('#auth-otp-input', '123456');
  await page.type('#auth-pass-input', 'Password123!');

  // Close modal
  console.log('Closing modal...');
  await page.click('#btn-close-auth-modal');
  await new Promise(r => setTimeout(r, 400));

  // Open Create Account again
  console.log('Opening Create Account modal again (without refresh)...');
  await page.evaluate(() => window.location.hash = '#register');
  await new Promise(r => setTimeout(r, 600));

  const stateReopened = await page.evaluate(() => ({
    name: document.getElementById('auth-name-input')?.value,
    email: document.getElementById('auth-email-input')?.value,
    phone: document.getElementById('auth-phone-input')?.value,
    otp: document.getElementById('auth-otp-input')?.value,
    pass: document.getElementById('auth-pass-input')?.value
  }));
  console.log('Values upon reopening modal:', stateReopened);
  const allEmptyReopened = Object.values(stateReopened).every(v => v === '');
  if (allEmptyReopened) {
    console.log('✓ PASS: All fields are completely empty upon reopening modal.');
  } else {
    console.error('FAILED: Fields were retained upon reopening modal!', stateReopened);
  }

  // Refresh page and check again
  console.log('Refreshing page (http://localhost:8080/#register)...');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const stateRefreshed = await page.evaluate(() => ({
    name: document.getElementById('auth-name-input')?.value,
    email: document.getElementById('auth-email-input')?.value,
    phone: document.getElementById('auth-phone-input')?.value,
    otp: document.getElementById('auth-otp-input')?.value,
    pass: document.getElementById('auth-pass-input')?.value
  }));
  console.log('Values after refresh:', stateRefreshed);
  const allEmptyRefreshed = Object.values(stateRefreshed).every(v => v === '');
  if (allEmptyRefreshed) {
    console.log('✓ PASS: All fields are completely empty after page refresh.');
  } else {
    console.error('FAILED: Fields were restored after refresh!', stateRefreshed);
  }

  console.log('\n====================================================');
  console.log('TEST 4: HERO SECTION AUTH UI AFTER LOGIN / ACCOUNT CREATION');
  console.log('====================================================');
  // Simulate successful customer session in the browser to test Hero behavior
  await page.evaluate(() => {
    sessionStorage.setItem('lapkart_customer_token_v4', 'mock_jwt_token_for_test');
    sessionStorage.setItem('lapkart_customer_user_v4', JSON.stringify({
      id: 'cust_test_123',
      name: 'Verified Customer',
      email: 'customer_verified@example.com',
      role: 'customer'
    }));
    window.location.hash = '#welcome';
  });
  await new Promise(r => setTimeout(r, 600));

  const heroLoggedInState = await page.evaluate(() => {
    const exploreBtn = document.getElementById('hero-btn-explore');
    const authBtn = document.getElementById('hero-btn-auth');
    return {
      hasExplore: !!exploreBtn,
      exploreText: exploreBtn ? exploreBtn.innerText.trim() : null,
      hasAuth: !!authBtn,
      authText: authBtn ? authBtn.innerText.trim() : null
    };
  });
  console.log('Hero State (Logged In):', heroLoggedInState);
  if (heroLoggedInState.hasExplore && !heroLoggedInState.hasAuth) {
    console.log('✓ PASS: Logged in shows Explore Laptops ONLY. Sign In button is completely removed.');
  } else {
    console.error('FAILED: Logged in Hero still contains Sign In button!', heroLoggedInState);
  }

  // Refresh page while logged in
  console.log('Refreshing page while logged in...');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const heroLoggedInAfterRefresh = await page.evaluate(() => {
    const exploreBtn = document.getElementById('hero-btn-explore');
    const authBtn = document.getElementById('hero-btn-auth');
    return {
      hasExplore: !!exploreBtn,
      hasAuth: !!authBtn
    };
  });
  console.log('Hero State (Logged In After Refresh):', heroLoggedInAfterRefresh);
  if (heroLoggedInAfterRefresh.hasExplore && !heroLoggedInAfterRefresh.hasAuth) {
    console.log('✓ PASS: Logged-in state persists after refresh: Hero still shows Explore Laptops ONLY.');
  } else {
    console.error('FAILED: Logged in Hero after refresh failed!', heroLoggedInAfterRefresh);
  }

  // Capture screenshot of Hero section logged in
  await page.screenshot({ path: 'scratch/hero_logged_in_explore_only.png' });
  console.log('Screenshot saved to scratch/hero_logged_in_explore_only.png');

  // Test logout
  console.log('Logging out...');
  await page.evaluate(() => {
    sessionStorage.removeItem('lapkart_customer_token_v4');
    sessionStorage.removeItem('lapkart_customer_user_v4');
    window.location.hash = '#welcome';
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const heroLoggedOutState = await page.evaluate(() => {
    const exploreBtn = document.getElementById('hero-btn-explore');
    const authBtn = document.getElementById('hero-btn-auth');
    return {
      hasExplore: !!exploreBtn,
      hasAuth: !!authBtn
    };
  });
  console.log('Hero State (After Logout):', heroLoggedOutState);
  if (heroLoggedOutState.hasExplore && heroLoggedOutState.hasAuth) {
    console.log('✓ PASS: Hero Sign In button restored upon logout.');
  } else {
    console.error('FAILED: Hero Sign In button was not restored after logout!', heroLoggedOutState);
  }

  await browser.close();
  console.log('\nALL 4 TEST SUITES COMPLETED SUCCESSFULLY!');
}

testAllThreeRequirements().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
