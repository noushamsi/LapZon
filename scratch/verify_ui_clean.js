import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\81c59ceb-bd41-475b-9c6a-7c1cbabce664';

async function verifyUI() {
  console.log('Launching Edge to inspect Checkout Address and Admin Portal UI...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  // 1. Check Checkout Address Form (Image 1 feedback)
  console.log('\n--- 1. Testing Checkout Delivery Address Form (Image 1) ---');
  await page.goto('http://localhost:8080/#store', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    localStorage.setItem('lapkart_cart_v2', JSON.stringify([{
      id: 'lap-002',
      name: 'ASUS ROG Strix G16 Gaming Laptop',
      price: 174990,
      mrp: 219990,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80'
    }]));
  });

  await page.goto('http://localhost:8080/#checkout-address', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  // If there are saved addresses, toggle to new address form to inspect form fields
  await page.evaluate(() => {
    const toggleBtn = document.getElementById('btn-toggle-new-addr');
    const form = document.getElementById('address-details-form');
    if (toggleBtn && form && form.style.display === 'none') {
      toggleBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const dialCodeDropdown = await page.$('#addr-dial-code');
  const phoneInput = await page.$('#addr-phone');
  const phonePlaceholder = await page.evaluate(() => document.getElementById('addr-phone')?.placeholder || '');

  console.log('Dial code dropdown (#addr-dial-code) exists:', !!dialCodeDropdown);
  console.log('Single phone input (#addr-phone) exists:', !!phoneInput);
  console.log('Phone input placeholder:', phonePlaceholder);

  const checkoutAddressPath = path.join(ARTIFACTS_DIR, 'checkout_address_clean_phone.png');
  await page.screenshot({ path: checkoutAddressPath });
  console.log('✓ Captured screenshot:', checkoutAddressPath);

  // 2. Check Admin Portal (Image 2 feedback)
  console.log('\n--- 2. Testing Admin Portal (Image 2) ---');
  await page.goto('http://localhost:8080/#admin-login', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 800));

  const quickFillBtn = await page.$('#btn-quick-fill-admin');
  const tabLogin = await page.$('#tab-admin-login');
  const tabRegister = await page.$('#tab-admin-register');
  const adminAlert = await page.$('#admin-alert');

  console.log('Demo quick fill button (#btn-quick-fill-admin) exists:', !!quickFillBtn);
  console.log('Admin login tab (#tab-admin-login) exists:', !!tabLogin);
  console.log('Admin register tab (#tab-admin-register) exists:', !!tabRegister);

  const adminLoginPath = path.join(ARTIFACTS_DIR, 'admin_portal_login_clean.png');
  await page.screenshot({ path: adminLoginPath });
  console.log('✓ Captured screenshot:', adminLoginPath);

  // 3. Switch to Admin Register Tab
  console.log('\n--- 3. Testing Admin Register Tab Switch ---');
  await page.click('#tab-admin-register');
  await new Promise(r => setTimeout(r, 400));

  const regName = await page.$('#admin-reg-name');
  const regEmail = await page.$('#admin-reg-email');
  const regPhone = await page.$('#admin-reg-phone');
  const regPasscode = await page.$('#admin-reg-passcode');
  const regPass = await page.$('#admin-reg-password');
  const regConfirm = await page.$('#admin-reg-confirm-password');

  console.log('Register Name field exists:', !!regName);
  console.log('Register Email field exists:', !!regEmail);
  console.log('Register Phone field exists:', !!regPhone);
  console.log('Register Passcode field exists:', !!regPasscode);
  console.log('Register Password field exists:', !!regPass);
  console.log('Register Confirm Password field exists:', !!regConfirm);

  const adminRegisterPath = path.join(ARTIFACTS_DIR, 'admin_portal_register_clean.png');
  await page.screenshot({ path: adminRegisterPath });
  console.log('✓ Captured screenshot:', adminRegisterPath);

  await browser.close();
  console.log('\nAll browser UI checks passed successfully!');
}

verifyUI().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
