import puppeteer from 'puppeteer-core';

async function testAdminRegisterUI() {
  console.log('Testing Admin Registration via UI...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[Browser Console ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.error('[Browser Uncaught Error]:', err.message);
  });

  await page.goto('http://localhost:8080/#admin-login', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  // Switch to register tab
  await page.click('#tab-admin-register');
  await new Promise(r => setTimeout(r, 400));

  const timestamp = Date.now();
  const testAdminEmail = `noushamsi09+uiadmin${timestamp}@gmail.com`;

  await page.type('#admin-reg-name', 'Noushamsi Admin');
  await page.type('#admin-reg-email', testAdminEmail);
  await page.type('#admin-reg-phone', '9876543210');
  // Passcode is already pre-filled with LAPZON2026
  await page.type('#admin-reg-password', 'Admin@12345');
  await page.type('#admin-reg-confirm-password', 'Admin@12345');

  console.log('Submitting Admin Registration...');
  await page.click('#btn-submit-admin-register');

  await new Promise(r => setTimeout(r, 3000));

  const afterHash = await page.evaluate(() => window.location.hash);
  const sessionToken = await page.evaluate(() => sessionStorage.getItem('lapkart_admin_token_v4'));
  const sessionUser = await page.evaluate(() => sessionStorage.getItem('lapkart_admin_user_v4'));

  console.log('Post-Registration Hash:', afterHash);
  console.log('Admin Token exists:', !!sessionToken);
  console.log('Admin User:', sessionUser);

  if (afterHash === '#admin' && sessionToken) {
    console.log('✅ PASS: Admin registered and navigated into Dashboard smoothly!');
  } else {
    console.error('❌ FAIL: Admin did not navigate to #admin');
  }

  await browser.close();
}

testAdminRegisterUI().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
