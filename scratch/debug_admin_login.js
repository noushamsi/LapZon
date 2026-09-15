import puppeteer from 'puppeteer-core';

async function debugAdminLogin() {
  console.log('Launching browser to debug Admin Login...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  page.on('console', msg => {
    console.log(`[Browser Console ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.error('[Browser Uncaught Error]:', err.message);
  });

  console.log('Navigating to http://localhost:8080/#admin-login...');
  await page.goto('http://localhost:8080/#admin-login', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Current URL/Hash:', await page.evaluate(() => window.location.href));

  // Check if form elements exist
  const emailInput = await page.$('#admin-email');
  const passInput = await page.$('#admin-password');
  const submitBtn = await page.$('#btn-submit-admin-login');

  console.log('Found inputs:', {
    emailInput: !!emailInput,
    passInput: !!passInput,
    submitBtn: !!submitBtn
  });

  // Type credentials
  await page.type('#admin-email', 'admin@lapkart.com');
  await page.type('#admin-password', 'Admin@123');

  console.log('Clicking Authenticate & Enter Dashboard...');
  await page.click('#btn-submit-admin-login');

  // Wait 3 seconds to see what happens
  await new Promise(r => setTimeout(r, 3000));

  const afterHash = await page.evaluate(() => window.location.hash);
  const alertText = await page.evaluate(() => {
    const el = document.getElementById('admin-alert');
    return el && el.style.display !== 'none' ? el.textContent : null;
  });
  const buttonText = await page.evaluate(() => document.getElementById('btn-submit-admin-login')?.textContent);
  const btnDisabled = await page.evaluate(() => document.getElementById('btn-submit-admin-login')?.disabled);
  const sessionToken = await page.evaluate(() => sessionStorage.getItem('lapkart_admin_token_v4'));
  const sessionUser = await page.evaluate(() => sessionStorage.getItem('lapkart_admin_user_v4'));
  const mainContent = await page.evaluate(() => document.querySelector('#app-main, main, .container')?.innerText?.substring(0, 200));

  console.log('\n--- State After Login Attempt ---');
  console.log('Current Hash:', afterHash);
  console.log('Alert message:', alertText);
  console.log('Button text:', buttonText);
  console.log('Button disabled:', btnDisabled);
  console.log('Admin token in sessionStorage:', sessionToken ? 'PRESENT' : 'NULL');
  console.log('Admin user in sessionStorage:', sessionUser);
  console.log('Page content snippet:', mainContent);

  await page.screenshot({ path: 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\81c59ceb-bd41-475b-9c6a-7c1cbabce664\\admin_dashboard_live.png' });
  console.log('Screenshot saved.');

  await browser.close();
}

debugAdminLogin().catch(err => {
  console.error('Debug script error:', err);
  process.exit(1);
});
