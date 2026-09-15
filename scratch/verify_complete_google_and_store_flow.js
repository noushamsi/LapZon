import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function runCompleteVerification() {
  console.log('========================================================================');
  console.log('🚀 Starting Complete End-to-End Verification of LapZon Auth & Store Flow');
  console.log('========================================================================\n');

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

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Email Service') || text.includes('PASS') || text.includes('FAIL')) {
      console.log('  [CONSOLE]', text);
    }
  });

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('  ✅ PASS: ' + message);
      passCount++;
    } else {
      console.error('  ❌ FAIL: ' + message);
      failCount++;
      process.exit(1);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // STEP 1: WELCOME PAGE & EXPLORE LAPTOPS MODAL FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Welcome Page → Explore Laptops Flow ---');
    await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Verify Welcome page displays
    const welcomeVisible = await page.evaluate(() => {
      const hero = document.querySelector('.welcome-hero-premium');
      const exploreBtn = document.getElementById('hero-btn-explore');
      return !!hero && !!exploreBtn;
    });
    assert(welcomeVisible, 'Logged-out user views Welcome page normally');

    // Click "Explore Laptops" when logged out
    console.log('Clicking "⚡ Explore Laptops" as logged-out user...');
    await page.click('#hero-btn-explore');
    await new Promise(r => setTimeout(r, 600));

    // Verify modal is shown instead of navigating to store
    const modalData = await page.evaluate(() => {
      const overlay = document.getElementById('auth-modal-overlay');
      const googleBtn = document.getElementById('btn-google-signin');
      const emailInput = document.getElementById('auth-email-input');
      const passInput = document.getElementById('auth-pass-input');
      const currentHash = window.location.hash;
      return {
        hasOverlay: !!overlay && overlay.style.display !== 'none',
        hasGoogleBtn: !!googleBtn,
        hasEmailInput: !!emailInput,
        hasPassInput: !!passInput,
        currentHash
      };
    });

    assert(modalData.hasOverlay, 'Clicking Explore Laptops shows Sign In / Create Account modal without opening Store immediately');
    assert(modalData.hasGoogleBtn, 'Modal contains "Continue with Google" authentication option');
    assert(modalData.hasEmailInput && modalData.hasPassInput, 'Modal contains email/password authentication');

    // -------------------------------------------------------------------------
    // STEP 2 & 3: GOOGLE AUTH (NEW USER) → COUNTRY SELECTION → SUCCESS TOAST → STORE
    // -------------------------------------------------------------------------
    console.log('\n--- 2 & 3. New Google User → Country Selection (India) → Toast → Store ---');
    const newGoogleSub = 'goog_sub_' + Date.now();
    const newGoogleEmail = 'user_' + Date.now() + '@gmail.com';

    // Verify backend token verification for new user
    const newAuthRes = await page.evaluate(async (sub, email) => {
      const res = await fetch('/api/auth/google/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: sub,
          email: email,
          name: 'Priya Sharma'
        })
      });
      return res.json();
    }, newGoogleSub, newGoogleEmail);

    assert(newAuthRes.success, 'Backend verifies Google OpenID credentials using Google sub ID');
    assert(newAuthRes.needsCountry === true, 'New Google user correctly identified as needing country selection');

    // Emulate Google OAuth redirect with token
    const userParam = encodeURIComponent(JSON.stringify(newAuthRes.user));
    await page.goto(`http://localhost:8080/#google-callback?token=${encodeURIComponent(newAuthRes.token)}&user=${userParam}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Verify Country Selection Modal
    const countryModalVisible = await page.evaluate(() => {
      const modal = document.querySelector('.country-modal-card');
      const indiaBtn = document.getElementById('btn-country-india');
      const uaeBtn = document.getElementById('btn-country-uae');
      return !!modal && !!indiaBtn && !!uaeBtn;
    });
    assert(countryModalVisible, 'Country selection prompt displayed for new Google user (India & UAE options)');

    // Select India (₹ INR)
    console.log('Selecting India (₹ INR)...');
    await page.click('#btn-country-india');

    // Verify Toast is shown with exact required message
    await page.waitForSelector('.toast.toast-success', { timeout: 5000 });
    const toastText = await page.evaluate(() => {
      const toast = document.querySelector('.toast.toast-success');
      return toast ? toast.textContent.trim() : '';
    });
    assert(toastText.includes('Login successful! Welcome to LapZon.'), `Success toast displays exact message: "${toastText}"`);

    // Verify modal closed immediately
    const modalClosed = await page.evaluate(() => !document.getElementById('auth-modal-overlay'));
    assert(modalClosed, 'Authentication modal closed immediately');

    // Wait ~2 seconds for automatic redirect to Store
    console.log('Waiting 2s for automatic transition to Store...');
    await new Promise(r => setTimeout(r, 2000));

    const currentHashAfterGoogle = await page.evaluate(() => window.location.hash);
    assert(currentHashAfterGoogle === '#store', `Redirected directly to Store page: ${currentHashAfterGoogle}`);
    assert(currentHashAfterGoogle !== '#my-orders', 'Did NOT redirect to My Orders');

    // Wait for store products to finish rendering from API
    await page.waitForSelector('.product-grid-card', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 600));

    // Verify Store prices show ₹ INR
    const storeInrPrices = await page.evaluate(() => {
      const priceEls = document.querySelectorAll('.product-grid-card .current-price');
      const texts = Array.from(priceEls).map(el => el.textContent.trim());
      return {
        count: texts.length,
        hasRupee: texts.some(t => t.includes('₹')),
        sample: texts.slice(0, 3)
      };
    });
    assert(storeInrPrices.hasRupee, `Store displays laptops with ₹ INR prices: ${storeInrPrices.sample.join(', ')}`);

    // -------------------------------------------------------------------------
    // STEP 4: RETURNING GOOGLE USER → ALWAYS PROMPTS COUNTRY SELECTION SCREEN → STORE
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Returning Google User → Country Selection Appears Again ---');
    // Clear browser session to simulate logging in again later
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });

    // Login same user via Google sub
    const repeatAuthRes = await page.evaluate(async (sub) => {
      const res = await fetch('/api/auth/google/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: sub
        })
      });
      return res.json();
    }, newGoogleSub);

    assert(repeatAuthRes.success, 'Returning user verified via Google sub identifier');

    const repeatUserParam = encodeURIComponent(JSON.stringify(repeatAuthRes.user));
    await page.goto(`http://localhost:8080/#google-callback?token=${encodeURIComponent(repeatAuthRes.token)}&user=${repeatUserParam}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const returningModalShown = await page.evaluate(() => !!document.querySelector('.country-modal-card'));
    assert(returningModalShown, 'Country selection prompt was shown again to returning Google user');

    // Click India
    await page.click('#btn-country-india');
    await page.waitForSelector('.toast.toast-success', { timeout: 5000 });

    await new Promise(r => setTimeout(r, 2000));
    const returningHash = await page.evaluate(() => window.location.hash);
    assert(returningHash === '#store', 'Returning Google user redirected to #store after country selection');

    // -------------------------------------------------------------------------
    // STEP 5: UAE GOOGLE USER → PERSISTED AED CURRENCY
    // -------------------------------------------------------------------------
    console.log('\n--- 5. UAE Google User → AED Currency Persistence ---');
    const uaeGoogleSub = 'goog_uae_sub_' + Date.now();
    const uaeGoogleEmail = 'uae_' + Date.now() + '@gmail.com';

    const uaeAuthRes = await page.evaluate(async (sub, email) => {
      const res = await fetch('/api/auth/google/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: sub,
          email: email,
          name: 'Ahmed Al-Falasi'
        })
      });
      const data = await res.json();

      // Choose UAE
      const setRes = await fetch('/api/auth/set-country', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({ country: 'UAE', currency: 'AED' })
      });
      return setRes.json();
    }, uaeGoogleSub, uaeGoogleEmail);

    assert(uaeAuthRes.user.country === 'UAE' && uaeAuthRes.user.currency === 'AED', 'UAE user saved with AED currency');

    // Emulate login for UAE user
    const uaeUserParam = encodeURIComponent(JSON.stringify(uaeAuthRes.user));
    await page.goto(`http://localhost:8080/#google-callback?token=${encodeURIComponent(uaeAuthRes.token)}&user=${uaeUserParam}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    await page.waitForSelector('.product-grid-card', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 600));

    const uaeStorePrices = await page.evaluate(() => {
      const priceEls = document.querySelectorAll('.product-grid-card .current-price');
      const texts = Array.from(priceEls).map(el => el.textContent.trim());
      return {
        hasAed: texts.some(t => t.includes('AED')),
        sample: texts.slice(0, 3)
      };
    });
    assert(uaeStorePrices.hasAed, `UAE Store displays AED currency: ${uaeStorePrices.sample.join(', ')}`);

    // -------------------------------------------------------------------------
    // STEP 6: RESPONSIVE GRID LAYOUT VERIFICATION (4 / 2-3 / 2-1 COLUMNS)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Responsive Product Grid Columns ---');
    // Desktop 1440px
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:8080/#store', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const desktopCols = await page.evaluate(() => {
      const grid = document.querySelector('.store-products-grid') || document.querySelector('.products-list-wrap');
      const cols = window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean);
      return cols.length;
    });
    assert(desktopCols === 4, `Desktop 1440px displays exactly 4 columns (found: ${desktopCols})`);

    // Tablet 768px
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 400));
    const tabletCols = await page.evaluate(() => {
      const grid = document.querySelector('.store-products-grid') || document.querySelector('.products-list-wrap');
      const cols = window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean);
      return cols.length;
    });
    assert(tabletCols === 2 || tabletCols === 3, `Tablet 768px displays 2 or 3 columns (found: ${tabletCols})`);

    // Mobile 390px
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 400));
    const mobileCols = await page.evaluate(() => {
      const grid = document.querySelector('.store-products-grid') || document.querySelector('.products-list-wrap');
      const cols = window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean);
      return cols.length;
    });
    assert(mobileCols === 2, `Mobile 390px displays 2 columns (found: ${mobileCols})`);

    // Narrow Mobile 320px
    await page.setViewport({ width: 320, height: 640 });
    await new Promise(r => setTimeout(r, 400));
    const narrowCols = await page.evaluate(() => {
      const grid = document.querySelector('.store-products-grid') || document.querySelector('.products-list-wrap');
      const cols = window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean);
      return cols.length;
    });
    assert(narrowCols === 1, `Extra narrow mobile 320px switches to 1 column (found: ${narrowCols})`);

    // -------------------------------------------------------------------------
    // STEP 7: ADMIN PORTAL INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Admin Dashboard & Admin Auth Integrity ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:8080/#admin-login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));

    await page.evaluate(() => {
      const emailInput = document.getElementById('admin-email') || document.querySelector('input[type="email"]');
      const passInput = document.getElementById('admin-password') || document.querySelector('input[type="password"]');
      if (emailInput) emailInput.value = 'admin@lapkart.com';
      if (passInput) passInput.value = 'Admin@123';
      const submitBtn = document.querySelector('button[type="submit"]') || document.getElementById('btn-admin-login');
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const adminHash = await page.evaluate(() => window.location.hash);
    assert(adminHash === '#admin' || adminHash === '#admin-dashboard', `Admin login redirected correctly to ${adminHash}`);

    console.log('\n========================================================================');
    console.log(`🎉 ALL TESTS PASSED! (${passCount} passed, ${failCount} failed)`);
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runCompleteVerification();
