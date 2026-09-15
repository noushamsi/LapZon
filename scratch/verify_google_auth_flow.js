import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function runGoogleAuthVerification() {
  console.log('================================================================');
  console.log('Starting LapZon Google Sign-In Flow & Authentication Verification');
  console.log('================================================================\n');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('  [BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('  [BROWSER ERROR]', err.message));

  function assert(condition, message) {
    if (condition) {
      console.log('  ✓ PASS: ' + message);
    } else {
      console.error('  ✕ FAIL: ' + message);
      process.exit(1);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST A: New Google User -> Prompt Country Selection -> Save -> Store (INR)
    // -------------------------------------------------------------------------
    console.log('--- TEST A: New Google user -> Country selection modal -> Save India -> Store ---');
    await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Simulate verified Google Auth for a new user
    const newGoogleUserRes = await page.evaluate(async () => {
      const res = await fetch('/api/auth/google/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: 'test_google_new_usr_' + Date.now(),
          email: 'new_google_user_' + Date.now() + '@gmail.com',
          name: 'Priya Patel',
          avatar: null
        })
      });
      return res.json();
    });

    assert(newGoogleUserRes.success, 'Backend verified new Google user');
    assert(newGoogleUserRes.needsCountry === true, 'New Google user identified as needing country selection');
    assert(newGoogleUserRes.user.country === null, 'Country was NOT guessed from gmail address');

    // Trigger the callback via router hash
    const userParam = encodeURIComponent(JSON.stringify(newGoogleUserRes.user));
    await page.goto(`http://localhost:8080/#google-callback?token=${encodeURIComponent(newGoogleUserRes.token)}&user=${userParam}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Verify "Where are you shopping from?" modal is displayed
    const countryModalData = await page.evaluate(() => {
      const heading = document.querySelector('.country-modal-card h2');
      const indiaBtn = document.getElementById('btn-country-india');
      const uaeBtn = document.getElementById('btn-country-uae');
      return {
        hasHeading: !!heading,
        headingText: heading ? heading.textContent.trim() : '',
        hasIndiaBtn: !!indiaBtn,
        hasUaeBtn: !!uaeBtn
      };
    });

    assert(countryModalData.hasHeading, 'Country selection modal is displayed');
    assert(countryModalData.headingText.includes('Where are you shopping from?'), 'Modal title is "Where are you shopping from?"');
    assert(countryModalData.hasIndiaBtn, 'India (+91) option button exists');
    assert(countryModalData.hasUaeBtn, 'UAE (+971) option button exists');

    // Screenshot country selection modal
    const artifactsDir = path.join(process.cwd(), 'scratch');
    await page.screenshot({ path: path.join(artifactsDir, 'test_country_modal.png') });

    // Click India (+91)
    console.log('Selecting India (+91)...');
    await page.click('#btn-country-india');

    // Wait for Notification to appear near top
    await page.waitForSelector('.toast.toast-success', { timeout: 5000 });
    const toastInfo = await page.evaluate(() => {
      const toast = document.querySelector('.toast.toast-success');
      const container = document.getElementById('toast-container');
      const rect = container ? container.getBoundingClientRect() : null;
      return {
        exists: !!toast,
        text: toast ? toast.textContent.trim() : '',
        topPosition: rect ? rect.top : null,
        modalStillInDom: !!document.getElementById('auth-modal-overlay')
      };
    });

    assert(toastInfo.exists, 'Success notification appears');
    assert(toastInfo.text.includes('Login successful! Welcome to LapZon.'), 'Success notification text matches "✓ Login successful! Welcome to LapZon."');
    assert(toastInfo.topPosition !== null && toastInfo.topPosition <= 50, 'Notification is positioned near top of page (rect.top <= 50px)');
    assert(!toastInfo.modalStillInDom, 'Login / Country selection modal was closed immediately (not left open)');

    // Wait ~2 seconds for automatic redirect to Store
    console.log('Waiting 2 seconds for automatic transition to Store...');
    await new Promise(r => setTimeout(r, 2000));

    const currentHashA = await page.evaluate(() => window.location.hash);
    assert(currentHashA === '#store', `Automatically navigated to #store (Current: ${currentHashA})`);
    assert(currentHashA !== '#my-orders', 'Did NOT redirect to #my-orders');

    // Verify Store displays prices in INR (₹)
    const storePricesA = await page.evaluate(() => {
      const priceEls = document.querySelectorAll('.product-grid-card .current-price, .card-amazon-main-price');
      const sampleTexts = Array.from(priceEls).slice(0, 4).map(e => e.textContent.trim());
      const hasRupee = sampleTexts.some(t => t.includes('₹'));
      return { sampleTexts, hasRupee };
    });
    assert(storePricesA.hasRupee, `Store displays prices in ₹ INR: ${storePricesA.sampleTexts.join(', ')}`);

    // -------------------------------------------------------------------------
    // TEST B: Existing India Google User Signs In Again -> Auto INR -> Store
    // -------------------------------------------------------------------------
    console.log('\n--- TEST B: Existing India Google user signs in again ---');
    // Clear session to simulate fresh sign in
    await page.evaluate(() => {
      localStorage.removeItem('lapkart_token_v2');
      localStorage.removeItem('lapkart_user_v2');
    });
    await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });

    // Verify the same user now has country saved in DB
    const repeatAuthRes = await page.evaluate(async (uid) => {
      const res = await fetch('/api/auth/google/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: uid
        })
      });
      return res.json();
    }, newGoogleUserRes.user.googleId);

    assert(repeatAuthRes.success, 'Existing user authenticated via Google unique ID');
    assert(repeatAuthRes.user.country === 'India', 'User record remembers saved country = India');
    assert(repeatAuthRes.user.currency === 'INR', 'User record remembers saved currency = INR');
    assert(repeatAuthRes.needsCountry === false, 'needsCountry is false for existing user');

    // Simulate Google callback for this returning user
    const repeatUserParam = encodeURIComponent(JSON.stringify(repeatAuthRes.user));
    await page.goto(`http://localhost:8080/#google-callback?token=${encodeURIComponent(repeatAuthRes.token)}&user=${repeatUserParam}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.toast.toast-success', { timeout: 5000 });

    // Verify country selection is NOT shown
    const repeatModalData = await page.evaluate(() => {
      const modal = document.querySelector('.country-modal-card');
      const toast = document.querySelector('.toast.toast-success');
      return {
        countryModalShown: !!modal,
        toastText: toast ? toast.textContent.trim() : ''
      };
    });

    assert(!repeatModalData.countryModalShown, 'Country selection modal was NOT shown again');
    assert(repeatModalData.toastText.includes('Welcome back!'), `Returning user notification shown: "${repeatModalData.toastText}"`);

    // Wait ~2 seconds for automatic store redirect
    await new Promise(r => setTimeout(r, 2000));
    const currentHashB = await page.evaluate(() => window.location.hash);
    assert(currentHashB === '#store', `Automatically navigated to #store for returning user (Current: ${currentHashB})`);

    // -------------------------------------------------------------------------
    // TEST C: Existing UAE Google User -> Automatically AED -> Store
    // -------------------------------------------------------------------------
    console.log('\n--- TEST C: Existing UAE Google user signs in -> Automatically AED ---');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Create a new Google user and set UAE country
    const uaeGoogleUser = await page.evaluate(async () => {
      const authRes = await fetch('/api/auth/google/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: 'test_google_uae_usr_' + Date.now(),
          email: 'uae.shopper.' + Date.now() + '@gmail.com',
          name: 'Rashid Al-Maktoum'
        })
      });
      const authData = await authRes.json();

      // Set country to UAE
      const setRes = await fetch('/api/auth/set-country', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({ country: 'UAE', currency: 'AED' })
      });
      const setData = await setRes.json();
      return { token: setData.token, user: setData.user };
    });

    assert(uaeGoogleUser.user.country === 'UAE', 'User country set to UAE');
    assert(uaeGoogleUser.user.currency === 'AED', 'User currency set to AED');

    // Simulate returning UAE Google login
    const uaeUserParam = encodeURIComponent(JSON.stringify(uaeGoogleUser.user));
    await page.goto(`http://localhost:8080/#google-callback?token=${encodeURIComponent(uaeGoogleUser.token)}&user=${uaeUserParam}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.toast.toast-success', { timeout: 5000 });

    // Verify Welcome back toast
    const uaeToast = await page.evaluate(() => {
      const toast = document.querySelector('.toast.toast-success');
      return toast ? toast.textContent.trim() : '';
    });
    assert(uaeToast.includes('Welcome back!'), 'Welcome back toast displayed for UAE user');

    // Wait ~2 seconds for Store redirect
    await new Promise(r => setTimeout(r, 2000));
    const currentHashC = await page.evaluate(() => window.location.hash);
    assert(currentHashC === '#store', 'Navigated to #store');

    // Verify Store prices show AED
    const uaeStorePrices = await page.evaluate(() => {
      const priceEls = document.querySelectorAll('.product-grid-card .current-price, .card-amazon-main-price');
      const sampleTexts = Array.from(priceEls).slice(0, 4).map(e => e.textContent.trim());
      const hasAed = sampleTexts.some(t => t.includes('AED'));
      return { sampleTexts, hasAed };
    });
    assert(uaeStorePrices.hasAed, `UAE user sees Store prices in AED: ${uaeStorePrices.sampleTexts.join(', ')}`);

    // -------------------------------------------------------------------------
    // TEST D & E: Notification Auto-Disappearance Test
    // -------------------------------------------------------------------------
    console.log('\n--- TEST D & E: Notification appearance & auto-disappearance ---');
    await page.evaluate(() => {
      import('./js/app.js').then(({ showAuthSuccessNotification }) => {
        showAuthSuccessNotification(false);
      });
    });
    await new Promise(r => setTimeout(r, 300));
    const toastPresentNow = await page.evaluate(() => !!document.querySelector('.toast.toast-success'));
    assert(toastPresentNow, 'Toast is currently visible');

    console.log('Waiting 2.4 seconds for toast to automatically disappear...');
    await new Promise(r => setTimeout(r, 2400));
    const toastGoneNow = await page.evaluate(() => !document.querySelector('.toast.toast-success'));
    assert(toastGoneNow, 'Toast automatically disappeared without user clicking OK');

    // -------------------------------------------------------------------------
    // TEST F: Explore Laptops Flow
    // -------------------------------------------------------------------------
    console.log('\n--- TEST F: Explore Laptops flow when logged out ---');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));

    // Click Explore Laptops button on welcome page
    await page.click('#hero-btn-explore');
    await new Promise(r => setTimeout(r, 500));

    const exploreModalOpen = await page.evaluate(() => !!document.getElementById('auth-modal-overlay'));
    assert(exploreModalOpen, 'Clicking Explore Laptops while logged out opens Auth Modal');

    // -------------------------------------------------------------------------
    // TEST G: Admin Login Still Works
    // -------------------------------------------------------------------------
    console.log('\n--- TEST G: Admin login integrity ---');
    await page.goto('http://localhost:8080/#admin-login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));

    await page.evaluate(async () => {
      const emailInput = document.getElementById('admin-email') || document.querySelector('input[type="email"]');
      const passInput = document.getElementById('admin-password') || document.querySelector('input[type="password"]');
      if (emailInput) emailInput.value = 'admin@lapkart.com';
      if (passInput) passInput.value = 'Admin@123';
      const submitBtn = document.querySelector('button[type="submit"]') || document.getElementById('btn-admin-login');
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const adminHash = await page.evaluate(() => window.location.hash);
    assert(adminHash === '#admin' || adminHash === '#admin-dashboard', `Admin login redirected to ${adminHash}`);

    // -------------------------------------------------------------------------
    // TEST H: Standard Email/Password Customer Login Still Works
    // -------------------------------------------------------------------------
    console.log('\n--- TEST H: Customer email/password login integrity ---');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:8080/#login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(async () => {
      const emailInput = document.getElementById('auth-email-input');
      const passInput = document.getElementById('auth-pass-input');
      if (emailInput) emailInput.value = 'customer@gmail.com';
      if (passInput) passInput.value = 'User@123';
      const form = document.getElementById('auth-main-form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
    });
    await new Promise(r => setTimeout(r, 2600));

    const customerHash = await page.evaluate(() => window.location.hash);
    assert(customerHash === '#store' || customerHash === '#welcome', `Customer email/password login succeeded and navigated (Current: ${customerHash})`);

    console.log('\n================================================================');
    console.log('✓ ALL 8 TEST SUITES (A through H) PASSED SUCCESSFULLY!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runGoogleAuthVerification();
