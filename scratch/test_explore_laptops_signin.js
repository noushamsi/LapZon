import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function testExploreLaptopsSignIn() {
  console.log('Starting Explore Laptops Sign-In verification test...');

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

  function assert(condition, message) {
    if (condition) {
      console.log('  PASS: ' + message);
    } else {
      console.error('  FAIL: ' + message);
      process.exit(1);
    }
  }

  try {
    console.log('\n--- Test 1: Logged-out user clicks Explore Laptops ---');
    await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const exploreBtn = await page.$('#hero-btn-explore');
    assert(!!exploreBtn, 'Hero Explore Laptops button exists on Welcome page');

    console.log('Clicking Explore Laptops while logged out...');
    await page.click('#hero-btn-explore');
    await new Promise(r => setTimeout(r, 800));

    const modalState = await page.evaluate(() => {
      const modal = document.getElementById('auth-modal-overlay');
      const heading = modal ? modal.querySelector('h2')?.innerText : null;
      const subtitle = modal ? modal.querySelector('p')?.innerText : null;
      return { exists: !!modal, heading, subtitle };
    });

    console.log('Modal state:', modalState);
    assert(modalState.exists, 'Auth modal overlay is created and displayed');
    assert(modalState.heading === 'Log in', 'Modal shows Log in heading');
    assert(modalState.subtitle && modalState.subtitle.includes('explore'), 'Modal displays explore laptops subtitle');

    console.log('\n--- Test 2: Complete Sign-In and verify redirect to #store ---');
    await page.type('#auth-email-input', 'customer@gmail.com');
    await page.type('#auth-pass-input', 'User@123');
    await page.click('#btn-auth-submit');
    await new Promise(r => setTimeout(r, 1500));

    const hashAfterLogin = await page.evaluate(() => window.location.hash);
    console.log('URL hash after login:', hashAfterLogin);
    assert(hashAfterLogin === '#store', 'Redirected to #store after successful sign in');

    console.log('\n--- Test 3: Logged-in user clicks Explore Laptops ---');
    await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const hasAuthBtn = await page.evaluate(() => !!document.getElementById('hero-btn-auth'));
    assert(!hasAuthBtn, 'Hero Sign In button is removed for logged-in user');

    await page.click('#hero-btn-explore');
    await new Promise(r => setTimeout(r, 600));

    const hashWhenLoggedIn = await page.evaluate(() => window.location.hash);
    const modalWhenLoggedIn = await page.evaluate(() => !!document.getElementById('auth-modal-overlay'));
    console.log('Hash when logged in:', hashWhenLoggedIn);
    assert(hashWhenLoggedIn === '#store', 'Navigates directly to #store when already logged in');
    assert(!modalWhenLoggedIn, 'No Auth Modal appears for already logged-in user');

    console.log('\nALL EXPLORE LAPTOP TESTS PASSED!');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testExploreLaptopsSignIn();
