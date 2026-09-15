import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function verifyAll() {
  console.log('Starting verification of PDP, Admin, and Home Grid...');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 950 });

  function assert(condition, message) {
    if (condition) {
      console.log('  PASS: ' + message);
    } else {
      console.error('  FAIL: ' + message);
      process.exit(1);
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. HOME PAGE AMAZON-STYLE COLUMN GRID TEST
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Home Page Amazon-Style Column Grid ---');
    await page.goto('http://localhost:8080/#welcome', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    const gridInfo = await page.evaluate(() => {
      const grid = document.querySelector('.featured-products-grid');
      const cards = document.querySelectorAll('.product-amazon-card');
      const firstCard = cards[0];
      if (!firstCard) return { hasGrid: !!grid, cardCount: 0 };

      const computedGrid = window.getComputedStyle(grid);
      const title = firstCard.querySelector('.card-amazon-title')?.innerText;
      const stars = firstCard.querySelector('.amazon-stars')?.innerText;
      const price = firstCard.querySelector('.card-amazon-main-price')?.innerText;
      const mrp = firstCard.querySelector('.card-amazon-mrp-row')?.innerText;
      const delivery = firstCard.querySelector('.card-amazon-delivery')?.innerText;
      const addCartBtn = firstCard.querySelector('.btn-amazon-add-cart');

      return {
        hasGrid: !!grid,
        cardCount: cards.length,
        gridColumns: computedGrid.gridTemplateColumns,
        firstCard: {
          title,
          stars,
          price,
          mrp,
          delivery,
          hasAddCart: !!addCartBtn,
          addCartText: addCartBtn?.innerText
        }
      };
    });

    console.log('Grid Info:', gridInfo);
    assert(gridInfo.hasGrid, 'Featured products grid container exists');
    assert(gridInfo.cardCount > 0, 'Rendered ' + gridInfo.cardCount + ' Amazon-style product cards');
    assert(gridInfo.firstCard.hasAddCart, 'First card has Amazon-style Add to Cart button');
    assert(gridInfo.firstCard.addCartText === 'Add to cart', 'Add to Cart button text is  Add to cart');
    assert(!!gridInfo.firstCard.stars, 'Card has rating stars: ' + gridInfo.firstCard.stars);
    assert(!!gridInfo.firstCard.price, 'Card has main price: ' + gridInfo.firstCard.price);
    assert(!!gridInfo.firstCard.delivery, 'Card has delivery info: ' + gridInfo.firstCard.delivery);

    // Test clicking Add to cart on home page
    console.log('Clicking Add to cart on first Amazon-style card...');
    await page.click('.product-amazon-card .btn-amazon-add-cart');
    await new Promise(r => setTimeout(r, 600));

    const toastMsg = await page.evaluate(() => document.querySelector('.toast')?.innerText || '');
    console.log('Toast after adding to cart:', toastMsg);
    assert(toastMsg.includes('Cart') || toastMsg.includes('Added'), 'Toast confirms added to cart: ' + toastMsg);

    await page.screenshot({ path: 'scratch/homepage_amazon_column_grid.png' });
    console.log('Screenshot saved to scratch/homepage_amazon_column_grid.png');

    // -------------------------------------------------------------
    // 2. PRODUCT DETAILS PAGE (PDP) SPECS TABLE TEST
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Product Details Page Specs Table ---');
    // Navigate to PDP by clicking on the first card
    await page.click('.product-amazon-card .card-amazon-img-wrap');
    await new Promise(r => setTimeout(r, 800));

    const pdpSpecs = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('.pdp-full-specs-table .spec-label')).map(el => el.innerText.trim());
      const values = Array.from(document.querySelectorAll('.pdp-full-specs-table .spec-value')).map(el => el.innerText.trim());
      return { labels, values };
    });

    console.log('PDP Spec Labels:', pdpSpecs.labels);
    assert(!pdpSpecs.labels.includes('Warranty Summary'), 'Warranty Summary is removed from PDP table');
    assert(!pdpSpecs.labels.includes('Device Weight'), 'Device Weight is removed from PDP table');
    assert(pdpSpecs.labels.includes('In The Box'), 'In The Box is present in PDP table');
    assert(pdpSpecs.labels.includes('Display & Screen Size'), 'Display & Screen Size is present in PDP table');

    await page.screenshot({ path: 'scratch/pdp_specs_table_updated.png' });
    console.log('Screenshot saved to scratch/pdp_specs_table_updated.png');

    // -------------------------------------------------------------
    // 3. ADMIN PANEL ADD LAPTOP FORM TEST
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Admin Add Laptop Form ---');
    // Log in as Admin
    await page.goto('http://localhost:8080/#admin-login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    await page.type('#admin-email', 'admin@lapkart.com');
    await page.type('#admin-password', 'Admin@123');
    await page.click('#btn-submit-admin-login');
    await new Promise(r => setTimeout(r, 1200));

    // Navigate to Add Laptop tab
    await page.goto('http://localhost:8080/#admin?tab=add-product', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    const adminFormCheck = await page.evaluate(() => {
      const form = document.getElementById('form-add-laptop');
      const inTheBoxInput = document.getElementById('new-lap-in-the-box');
      const displayInput = document.getElementById('new-lap-display');
      const displayLabel = displayInput?.parentElement?.querySelector('label')?.innerText || '';
      const weightInput = form ? Array.from(form.querySelectorAll('input')).find(i => i.id.includes('weight')) : null;

      return {
        formExists: !!form,
        hasInTheBox: !!inTheBoxInput,
        inTheBoxVal: inTheBoxInput?.value,
        hasDisplay: !!displayInput,
        displayLabel,
        hasWeight: !!weightInput
      };
    });

    console.log('Admin Form Check:', adminFormCheck);
    assert(adminFormCheck.formExists, 'Admin Add Laptop form exists');
    assert(adminFormCheck.hasInTheBox, 'Admin form has In The Box input');
    assert(adminFormCheck.hasDisplay, 'Admin form has Display input');
    assert(adminFormCheck.displayLabel && adminFormCheck.displayLabel.includes('Display & Screen Size'), 'Display label includes Display & Screen Size');
    assert(!adminFormCheck.hasWeight, 'Device Weight input is removed from Admin form');

    await page.screenshot({ path: 'scratch/admin_add_laptop_form.png' });
    console.log('Screenshot saved to scratch/admin_add_laptop_form.png');

    console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyAll();
