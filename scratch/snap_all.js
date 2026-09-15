import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function snapForm() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({ executablePath: execPath, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 950 });
  await page.goto('http://localhost:8080/#admin-login', { waitUntil: 'networkidle0' });
  await page.type('#admin-email', 'admin@lapkart.com');
  await page.type('#admin-password', 'Admin@123');
  await page.click('#btn-submit-admin-login');
  await new Promise(r => setTimeout(r, 1200));

  await page.goto('http://localhost:8080/#admin?tab=add-product', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    document.getElementById('new-lap-display')?.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'scratch/admin_fields_close_up.png' });

  await page.goto('http://localhost:8080/#product/lap-001', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    document.querySelector('.pdp-full-specs-table')?.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'scratch/pdp_table_scroll_close_up.png' });

  await browser.close();
}
snapForm();
