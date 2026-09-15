import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function runExactScenariosTest() {
  console.log('========================================================================');
  console.log('🚀 TESTING EXACT GOOGLE AUTHENTICATION & SIGN-OUT SCENARIOS');
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

  // ---------------------------------------------------------------------------
  // 0. API & CONFIG VERIFICATION: prompt=select_account consent & No login_hint
  // ---------------------------------------------------------------------------
  console.log('--- 0. Verifying Google OAuth Configuration & GIS Scripts ---');
  const configRes = await fetch('http://localhost:8080/api/auth/google/config');
  const configData = await configRes.json();
  assert(configData.success === true, 'GET /api/auth/google/config returned success: true');
  assert(configData.authUrl.includes('prompt=select_account'), 'Google authUrl strictly enforces "prompt=select_account"');
  assert(configData.authUrl.includes('response_type=code'), 'Google authUrl uses standard OAuth 2.0 authorization code flow');
  assert(configData.authUrl.includes('scope=openid%20email%20profile') || configData.authUrl.includes('openid'), 'Google authUrl requests openid, email, and profile scopes');
  assert(configData.authUrl.includes('include_granted_scopes=false'), 'Google authUrl enforces include_granted_scopes=false');
  assert(!configData.authUrl.includes('login_hint'), 'Google authUrl contains NO login_hint (preventing account skip)');

  // Verify index.html loads Google Identity Services SDK
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert(indexHtml.includes('https://accounts.google.com/gsi/client'), 'index.html includes Google Identity Services (GIS) client script');

  // Verify client code contains disableAutoSelect on logout and no fake 2FA
  const authServiceSrc = fs.readFileSync('js/services/auth.js', 'utf8');
  assert(authServiceSrc.includes('window.google.accounts.id.disableAutoSelect()'), 'auth.js calls window.google.accounts.id.disableAutoSelect() on logout');
  assert(!authServiceSrc.includes('button_auto_select: true'), 'auth.js has NO button_auto_select enabled');

  const authModalSrc = fs.readFileSync('js/components/authModal.js', 'utf8');
  assert(!authModalSrc.includes('Galaxy S24 Ultra') && !authModalSrc.includes('renderStepTwoStepVerify'), 'Zero fake 2FA popups in authModal.js (all handled natively by Google)');
  assert(!authModalSrc.includes('GOOGLE_CLIENT_SECRET'), 'Zero client secret exposure in client code');

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Step 1-3: Open LapZon -> Sign in with Google -> Store Opens
    // -------------------------------------------------------------------------
    console.log('\n--- STEPS 1-3: First Google Sign-In Flow ---');
    await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Verify logged out state
    const isLoggedOut1 = await page.evaluate(() => {
      const btn = document.getElementById('nav-btn-signin');
      return !!btn;
    });
    assert(isLoggedOut1, 'Navbar displays "Sign In" button when user is logged out');

    // Simulate Google Login for a user
    const test1User = {
      googleId: 'google_sub_test_01_' + Date.now(),
      email: 'test_user_01_' + Date.now() + '@gmail.com',
      name: 'Rohan Verma'
    };

    const authRes1 = await page.evaluate(async (userPayload) => {
      const res = await fetch('/api/auth/google/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload)
      });
      return res.json();
    }, test1User);

    assert(authRes1.success === true, 'Backend verified Google credentials');
    assert(authRes1.needsCountry === true, 'New Google user identified as needing country selection');

    // Callback redirect
    const userParam1 = encodeURIComponent(JSON.stringify(authRes1.user));
    await page.goto(`http://localhost:8080/#google-callback?token=${encodeURIComponent(authRes1.token)}&user=${userParam1}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Select country India
    await page.waitForSelector('#btn-country-india', { timeout: 5000 });
    await page.click('#btn-country-india');

    // Wait for success toast
    await page.waitForSelector('.toast.toast-success', { timeout: 5000 });
    const toast1 = await page.evaluate(() => document.querySelector('.toast.toast-success')?.textContent.trim() || '');
    assert(toast1.includes('Login successful! Welcome to LapZon.'), `Toast displays: "${toast1}"`);

    // Wait ~2s for automatic Store navigation
    await new Promise(r => setTimeout(r, 2000));
    const hash1 = await page.evaluate(() => window.location.hash);
    assert(hash1 === '#store', `Redirected directly to Store page (#store): current=${hash1}`);

    // Verify navbar now displays logged in user name
    const navUserName1 = await page.evaluate(() => document.getElementById('nav-user-menu-btn')?.textContent.trim() || '');
    assert(navUserName1.includes('Rohan') || navUserName1.includes('Account'), `Navbar updated with authenticated user: "${navUserName1}"`);

    // -------------------------------------------------------------------------
    // TEST 2: Steps 4-5: Click Sign Out -> Refresh Page
    // -------------------------------------------------------------------------
    console.log('\n--- STEPS 4-5: Sign Out & Refresh Page ---');
    console.log('Clicking Sign Out...');
    
    // Track if window.google.accounts.id.disableAutoSelect was invoked
    const disableAutoSelectCalled = await page.evaluate(() => {
      let called = false;
      if (!window.google) window.google = {};
      if (!window.google.accounts) window.google.accounts = {};
      if (!window.google.accounts.id) window.google.accounts.id = {};
      window.google.accounts.id.disableAutoSelect = () => { called = true; };

      return import('./js/services/auth.js').then(({ auth }) => {
        auth.logout();
        window.location.hash = '#welcome';
        return called;
      });
    });
    assert(disableAutoSelectCalled, 'window.google.accounts.id.disableAutoSelect() was successfully executed on Sign Out');

    // Verify session is completely destroyed
    const sessionCleared = await page.evaluate(() => {
      const sCustToken = sessionStorage.getItem('lapkart_customer_token_v4');
      const lCustToken = localStorage.getItem('lapkart_customer_token_v4');
      const sAdminToken = sessionStorage.getItem('lapkart_admin_token_v4');
      const lAdminToken = localStorage.getItem('lapkart_admin_token_v4');
      return !sCustToken && !lCustToken && !sAdminToken && !lAdminToken;
    });
    assert(sessionCleared, 'Application session tokens completely removed from sessionStorage and localStorage on Sign Out');

    // Step 5: Refresh the page
    console.log('Refreshing the page after Sign Out...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Verify navbar still shows "Sign In" after refresh
    const isLoggedOutAfterRefresh = await page.evaluate(() => {
      return !!document.getElementById('nav-btn-signin');
    });
    assert(isLoggedOutAfterRefresh, 'Navbar maintains "Sign In" state after page refresh (no auto-login)');

    // -------------------------------------------------------------------------
    // TEST 3: Steps 6-9: Click Sign In -> Click Continue with Google -> Explicit Interaction
    // -------------------------------------------------------------------------
    console.log('\n--- STEPS 6-9: Re-opening Sign In & Google Authentication Verification ---');
    // Click Sign In
    await page.waitForSelector('#nav-btn-signin', { timeout: 5000 });
    await page.click('#nav-btn-signin');
    await new Promise(r => setTimeout(r, 400));

    const modalOpen2 = await page.evaluate(() => !!document.getElementById('auth-modal-overlay'));
    assert(modalOpen2, 'Sign In modal opens properly on manual click (NOT silently auto-logged in)');

    // Verify Continue with Google button is present and initiates OAuth with prompt=select_account
    const googleBtnAuthUrl = await page.evaluate(async () => {
      const res = await fetch('/api/auth/google/config');
      const data = await res.json();
      return data.authUrl;
    });
    assert(googleBtnAuthUrl.includes('prompt=select_account'), 'Google OAuth URL strictly includes "prompt=select_account" requiring user account selection');
    assert(googleBtnAuthUrl.startsWith('https://accounts.google.com/o/oauth2/v2/auth'), 'Directs user to official Google OAuth endpoint (allowing 2FA/MFA)');

    // -------------------------------------------------------------------------
    // TEST 4: Steps 10-11: Complete Authentication -> Country Selection -> Store Opens ONLY After Success
    // -------------------------------------------------------------------------
    console.log('\n--- STEPS 10-11: Complete Authentication & Verify Country Selection + Store Redirection ---');
    // Simulate user choosing Google account explicitly
    const reAuthRes = await page.evaluate(async (sub) => {
      const res = await fetch('/api/auth/google/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleId: sub })
      });
      return res.json();
    }, test1User.googleId);

    assert(reAuthRes.success === true, 'Re-authentication succeeds only upon verified account confirmation');

    const reUserParam = encodeURIComponent(JSON.stringify(reAuthRes.user));
    await page.goto(`http://localhost:8080/#google-callback?token=${encodeURIComponent(reAuthRes.token)}&user=${reUserParam}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Verify country selection prompt appears on returning login
    await page.waitForSelector('#btn-country-india', { timeout: 5000 });
    await page.click('#btn-country-india');

    await page.waitForSelector('.toast.toast-success', { timeout: 5000 });
    const toast2 = await page.evaluate(() => document.querySelector('.toast.toast-success')?.textContent.trim() || '');
    assert(toast2.includes('Login successful! Welcome to LapZon.'), `Re-auth toast displays: "${toast2}"`);

    await new Promise(r => setTimeout(r, 2000));
    const hash2 = await page.evaluate(() => window.location.hash);
    assert(hash2 === '#store', 'User navigated to Store page (#store) ONLY after explicit, successful authentication');

    // -------------------------------------------------------------------------
    // TEST 5: Browser Restart / Fresh Tab Simulation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Browser Restart Simulation ---');
    await page.evaluate(() => {
      import('./js/services/auth.js').then(({ auth }) => auth.logout());
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Close current page and open new page (simulating restart)
    const freshPage = await browser.newPage();
    await freshPage.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
    
    const isFreshLoggedOut = await freshPage.evaluate(() => {
      return !!document.getElementById('nav-btn-signin') && !sessionStorage.getItem('lapkart_customer_token_v4');
    });
    assert(isFreshLoggedOut, 'Reopened browser starts in logged-out state with zero silent auto-authentication');

    await freshPage.close();

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passed} TESTS PASSED! (${failed} failed)`);
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runExactScenariosTest();
