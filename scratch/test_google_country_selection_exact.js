import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function runExactCountrySelectionTests() {
  console.log('========================================================================');
  console.log('🚀 TESTING EXACT GOOGLE LOGIN COUNTRY/CURRENCY SELECTION FLOWS');
  console.log('========================================================================\n');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(chromePath) ? chromePath : edgePath;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
      process.exit(1);
    }
  }

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const testUser = {
    googleId: 'google_sub_user_' + Date.now(),
    email: 'rohan.verma.' + Date.now() + '@gmail.com',
    name: 'Rohan Verma'
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: First Google Sign-In -> Country Selection Modal -> India (INR) -> Store
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: First Google Login -> Choose Country (India INR) -> Store ---');
    await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // 1. Click Sign In
    await page.waitForSelector('#nav-btn-signin', { timeout: 5000 });
    await page.click('#nav-btn-signin');
    await new Promise(r => setTimeout(r, 400));

    // 2. Click Continue with Google -> Backend token verification
    const authRes1 = await page.evaluate(async (u) => {
      const res = await fetch('/api/auth/google/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u)
      });
      return res.json();
    }, testUser);

    assert(authRes1.success === true, 'Google authentication succeeded for test account');

    // Callback redirect
    const userParam1 = encodeURIComponent(JSON.stringify(authRes1.user));
    await page.goto(`http://localhost:8080/#google-callback?token=${encodeURIComponent(authRes1.token)}&user=${userParam1}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // 3. Verify India/UAE selection appears
    const modalTitle1 = await page.evaluate(() => document.querySelector('.country-modal-card h2')?.textContent.trim() || '');
    assert(modalTitle1.includes('Choose Your Country'), `Country selection modal appeared: "${modalTitle1}"`);

    const hasIndiaBtn1 = await page.evaluate(() => !!document.getElementById('btn-country-india'));
    const hasUaeBtn1 = await page.evaluate(() => !!document.getElementById('btn-country-uae'));
    assert(hasIndiaBtn1 && hasUaeBtn1, 'Both India [₹ INR] and UAE [AED] buttons are visible');

    // 4. Select India
    console.log('Selecting India (₹ INR)...');
    await page.click('#btn-country-india');

    // Wait for success toast & Store navigation
    await page.waitForSelector('.toast.toast-success', { timeout: 5000 });
    const toast1 = await page.evaluate(() => document.querySelector('.toast.toast-success')?.textContent.trim() || '');
    assert(toast1.includes('Login successful! Welcome to LapZon.'), `Toast notification shown: "${toast1}"`);

    await new Promise(r => setTimeout(r, 2000));
    const hash1 = await page.evaluate(() => window.location.hash);
    assert(hash1 === '#store', 'Store page opened (#store)');

    // 5. Store opens with INR
    const prices1 = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('.product-price, .laptop-price, .price-val, .current-price, .price-main'));
      return els.map(e => e.textContent.trim()).filter(Boolean);
    });
    const hasInr = prices1.some(p => p.includes('₹') || p.includes('INR')) || await page.evaluate(() => document.body.textContent.includes('₹'));
    assert(hasInr, 'Store correctly displays laptop prices in ₹ INR');

    // -------------------------------------------------------------------------
    // TEST 2: Sign Out -> Refresh -> Sign In -> Google Auth -> COUNTRY SELECTION APPEARS AGAIN -> UAE (AED)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Sign Out -> Refresh -> Sign In (Same Account) -> Country Selection Appears Again -> UAE (AED) ---');
    // 1. Sign Out
    console.log('Clicking Sign Out...');
    await page.evaluate(() => {
      import('./js/services/auth.js').then(({ auth }) => {
        auth.logout();
        window.location.hash = '#welcome';
      });
    });
    await new Promise(r => setTimeout(r, 600));

    // 2. Refresh page
    console.log('Refreshing page...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // 3. Sign In
    await page.waitForSelector('#nav-btn-signin', { timeout: 5000 });
    await page.click('#nav-btn-signin');
    await new Promise(r => setTimeout(r, 400));

    // 4. Continue with Google (same Google account)
    const authRes2 = await page.evaluate(async (u) => {
      const res = await fetch('/api/auth/google/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u)
      });
      return res.json();
    }, testUser);

    assert(authRes2.success === true, 'Google re-authentication succeeded');

    // 5. Complete Google authentication
    const userParam2 = encodeURIComponent(JSON.stringify(authRes2.user));
    await page.goto(`http://localhost:8080/#google-callback?token=${encodeURIComponent(authRes2.token)}&user=${userParam2}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // 6. VERIFY INDIA/UAE SELECTION APPEARS AGAIN
    const modalTitle2 = await page.evaluate(() => document.querySelector('.country-modal-card h2')?.textContent.trim() || '');
    assert(modalTitle2.includes('Choose Your Country'), `CRITICAL: Country selection modal appeared again for returning Google user: "${modalTitle2}"`);

    // 7. Select UAE
    console.log('Selecting UAE (AED)...');
    await page.click('#btn-country-uae');

    // 8. Store opens with AED
    await page.waitForSelector('.toast.toast-success', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 2000));
    const hash2 = await page.evaluate(() => window.location.hash);
    assert(hash2 === '#store', 'Store page opened (#store)');

    // 9. Verify laptop prices changed to AED
    const hasAed = await page.evaluate(() => {
      const text = document.getElementById('store-product-grid')?.textContent || document.body.textContent;
      return text.includes('AED') || text.includes('د.إ');
    });
    assert(hasAed, 'Store correctly displays laptop prices in AED');

    // -------------------------------------------------------------------------
    // TEST 3: Sign Out -> Sign In (Same Account) -> Country Selection Appears Again -> India (INR)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Sign Out -> Re-login with Same Google Account -> Switch to India (INR) ---');
    await page.evaluate(() => {
      import('./js/services/auth.js').then(({ auth }) => auth.logout());
      window.location.hash = '#welcome';
    });
    await new Promise(r => setTimeout(r, 600));

    const authRes3 = await page.evaluate(async (u) => {
      const res = await fetch('/api/auth/google/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u)
      });
      return res.json();
    }, testUser);

    const userParam3 = encodeURIComponent(JSON.stringify(authRes3.user));
    await page.goto(`http://localhost:8080/#google-callback?token=${encodeURIComponent(authRes3.token)}&user=${userParam3}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const modalTitle3 = await page.evaluate(() => document.querySelector('.country-modal-card h2')?.textContent.trim() || '');
    assert(modalTitle3.includes('Choose Your Country'), 'Country selection modal appeared again on 3rd login attempt');

    // Select India
    console.log('Selecting India (₹ INR)...');
    await page.click('#btn-country-india');
    await new Promise(r => setTimeout(r, 2000));

    const hash3 = await page.evaluate(() => window.location.hash);
    assert(hash3 === '#store', 'Store page opened (#store)');

    const hasInr3 = await page.evaluate(() => {
      const text = document.getElementById('store-product-grid')?.textContent || document.body.textContent;
      return text.includes('₹') || text.includes('INR');
    });
    assert(hasInr3, 'Store successfully switched back and displays ₹ INR prices');

    // -------------------------------------------------------------------------
    // TEST 4: Sign Out -> Close Browser Tab -> Reopen LapZon -> Sign In with Google -> Country Selection Appears
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Browser Restart Simulation -> Sign In with Google -> Country Selection Appears ---');
    await page.evaluate(() => {
      import('./js/services/auth.js').then(({ auth }) => auth.logout());
    });
    await page.close();

    const freshPage = await browser.newPage();
    await freshPage.setViewport({ width: 1440, height: 900 });
    await freshPage.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const authRes4 = await freshPage.evaluate(async (u) => {
      const res = await fetch('/api/auth/google/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u)
      });
      return res.json();
    }, testUser);

    const userParam4 = encodeURIComponent(JSON.stringify(authRes4.user));
    await freshPage.goto(`http://localhost:8080/#google-callback?token=${encodeURIComponent(authRes4.token)}&user=${userParam4}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const modalTitle4 = await freshPage.evaluate(() => document.querySelector('.country-modal-card h2')?.textContent.trim() || '');
    assert(modalTitle4.includes('Choose Your Country'), 'Country selection modal appears in fresh browser session before Store opens');

    await freshPage.close();

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passed} EXACT COUNTRY SELECTION TESTS PASSED! (${failed} failed)`);
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runExactCountrySelectionTests();
