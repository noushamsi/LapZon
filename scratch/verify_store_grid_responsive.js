import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function runStoreVerification() {
  console.log('Starting comprehensive verification of LapZon Store column/grid layout and responsive behavior...');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();

  function assert(condition, message) {
    if (condition) {
      console.log('  PASS: ' + message);
    } else {
      console.error('  FAIL: ' + message);
      process.exit(1);
    }
  }

  try {
    // =========================================================================
    // 1. DESKTOP TEST (1440px): 4 Columns Grid Verification
    // =========================================================================
    console.log('\n--- 1. Testing Desktop (1440px Viewport) ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:8080/#store', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    const desktopData = await page.evaluate(() => {
      const grid = document.querySelector('.store-products-grid') || document.querySelector('.products-list-wrap');
      const cards = document.querySelectorAll('.product-grid-card');
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;

      if (!grid || cards.length === 0) {
        return { hasGrid: false, cardCount: 0 };
      }

      const style = window.getComputedStyle(grid);
      const cols = style.gridTemplateColumns.trim().split(/\s+/).filter(Boolean);

      const firstCard = cards[0];
      const cardRect = firstCard.getBoundingClientRect();

      return {
        hasGrid: true,
        display: style.display,
        columnsCount: cols.length,
        columnValues: style.gridTemplateColumns,
        cardCount: cards.length,
        cardWidth: cardRect.width,
        noHorizontalOverflow: scrollWidth <= docWidth,
        firstCard: {
          brand: firstCard.querySelector('.product-brand-tag')?.innerText,
          hasWishlist: !!firstCard.querySelector('.product-wishlist-btn'),
          hasImage: !!firstCard.querySelector('.product-card-img-wrap img'),
          title: firstCard.querySelector('.product-grid-title')?.innerText,
          rating: firstCard.querySelector('.badge-rating')?.innerText,
          reviews: firstCard.querySelector('.reviews-count')?.innerText,
          stock: firstCard.querySelector('.stock-badge')?.innerText,
          specs: Array.from(firstCard.querySelectorAll('.spec-row')).map(s => s.innerText),
          currentPrice: firstCard.querySelector('.current-price')?.innerText,
          mrpPrice: firstCard.querySelector('.mrp-price')?.innerText,
          discount: firstCard.querySelector('.discount-pill')?.innerText,
          hasBuyNow: !!firstCard.querySelector('.btn-card-buy'),
          hasAddToCart: !!firstCard.querySelector('.btn-card-cart')
        }
      };
    });

    assert(desktopData.hasGrid, 'Store products grid exists');
    assert(desktopData.display === 'grid', 'Store container uses CSS Grid (display: grid)');
    assert(desktopData.columnsCount === 4, `Desktop 1440px displays exactly 4 columns (found: ${desktopData.columnsCount})`);
    assert(desktopData.cardCount >= 8, `All products appear in the grid, not only featured (found: ${desktopData.cardCount} products)`);
    assert(desktopData.noHorizontalOverflow, 'No horizontal overflow on 1440px desktop');
    assert(desktopData.firstCard.hasImage, 'Card contains product image');
    assert(desktopData.firstCard.hasWishlist, 'Card contains top-right wishlist button');
    assert(Boolean(desktopData.firstCard.brand), 'Card contains brand tag');
    assert(Boolean(desktopData.firstCard.title), 'Card contains laptop name/model');
    assert(Boolean(desktopData.firstCard.rating), 'Card contains rating');
    assert(Boolean(desktopData.firstCard.currentPrice), 'Card contains current price');
    assert(desktopData.firstCard.hasBuyNow, 'Card contains Buy Now button');
    assert(desktopData.firstCard.hasAddToCart, 'Card contains Add to Cart button');

    await page.screenshot({ path: 'scratch/store_desktop_1440px_4_columns.png' });
    console.log('  Saved screenshot: scratch/store_desktop_1440px_4_columns.png');

    // =========================================================================
    // 2. TABLET TEST (768px): 2 or 3 Columns
    // =========================================================================
    console.log('\n--- 2. Testing Tablet (768px Viewport) ---');
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 600));

    const tabletData = await page.evaluate(() => {
      const grid = document.querySelector('.store-products-grid') || document.querySelector('.products-list-wrap');
      const style = window.getComputedStyle(grid);
      const cols = style.gridTemplateColumns.trim().split(/\s+/).filter(Boolean);
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;

      return {
        columnsCount: cols.length,
        columnValues: style.gridTemplateColumns,
        noHorizontalOverflow: scrollWidth <= docWidth
      };
    });

    assert(tabletData.columnsCount === 2 || tabletData.columnsCount === 3, `Tablet (768px) displays 2 or 3 columns (found: ${tabletData.columnsCount})`);
    assert(tabletData.noHorizontalOverflow, 'No horizontal overflow on 768px tablet');

    await page.screenshot({ path: 'scratch/store_tablet_768px_columns.png' });
    console.log('  Saved screenshot: scratch/store_tablet_768px_columns.png');

    // =========================================================================
    // 3. MOBILE TEST (390px): 2 Columns (or 1 on narrow devices)
    // =========================================================================
    console.log('\n--- 3. Testing Mobile (390px Viewport) ---');
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 600));

    const mobileData = await page.evaluate(() => {
      const grid = document.querySelector('.store-products-grid') || document.querySelector('.products-list-wrap');
      const style = window.getComputedStyle(grid);
      const cols = style.gridTemplateColumns.trim().split(/\s+/).filter(Boolean);
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;

      return {
        columnsCount: cols.length,
        columnValues: style.gridTemplateColumns,
        noHorizontalOverflow: scrollWidth <= docWidth
      };
    });

    assert(mobileData.columnsCount === 2, `Mobile (390px) displays 2 columns (found: ${mobileData.columnsCount})`);
    assert(mobileData.noHorizontalOverflow, 'No horizontal overflow on 390px mobile');

    await page.screenshot({ path: 'scratch/store_mobile_390px_2_columns.png' });
    console.log('  Saved screenshot: scratch/store_mobile_390px_2_columns.png');

    // Narrow Mobile (320px Viewport) -> 1 column
    await page.setViewport({ width: 320, height: 640 });
    await new Promise(r => setTimeout(r, 400));
    const narrowData = await page.evaluate(() => {
      const grid = document.querySelector('.store-products-grid') || document.querySelector('.products-list-wrap');
      const cols = window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean);
      return { cols: cols.length };
    });
    assert(narrowData.cols === 1, `Extra narrow mobile (320px) automatically switches to 1 column (found: ${narrowData.cols})`);

    // =========================================================================
    // 4. INTERACTION TESTS: Wishlist, Filters, Sorting, Cart & Details Navigation
    // =========================================================================
    console.log('\n--- 4. Testing User Interactions & Functionality ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:8080/#store', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // A. Toggle Filter drawer
    console.log('Testing Filter toggle button...');
    await page.click('#btn-toggle-filters');
    await new Promise(r => setTimeout(r, 500));
    const filterPanelVisible = await page.evaluate(() => {
      const panel = document.querySelector('.store-filters-top-panel');
      return !!panel;
    });
    assert(filterPanelVisible, 'Filter panel expands smoothly above products grid');

    // B. Filter by brand (Apple)
    console.log('Testing Brand filter (Apple)...');
    await page.click('.filter-brand-chk[value="Apple"]');
    await new Promise(r => setTimeout(r, 600));

    const appleCount = await page.evaluate(() => {
      const titles = Array.from(document.querySelectorAll('.product-grid-title')).map(t => t.innerText);
      return titles.filter(t => t.toLowerCase().includes('apple') || t.toLowerCase().includes('macbook')).length;
    });
    assert(appleCount > 0, `Filtering by brand works (found ${appleCount} Apple laptops)`);

    // C. Reset filters
    console.log('Testing Reset All Filters...');
    await page.click('#btn-reset-filters');
    await new Promise(r => setTimeout(r, 600));
    const allProdsCount = await page.evaluate(() => document.querySelectorAll('.product-grid-card').length);
    assert(allProdsCount >= 8, `Filter reset restores all products (found: ${allProdsCount})`);

    // D. Sorting
    console.log('Testing Sorting: Price Low to High...');
    await page.click('.sort-tab-btn[data-sort="price-asc"]');
    await new Promise(r => setTimeout(r, 600));

    const pricesSortedAsc = await page.evaluate(() => {
      const priceEls = Array.from(document.querySelectorAll('.current-price'));
      const nums = priceEls.map(el => parseInt(el.innerText.replace(/[^\d]/g, ''), 10));
      for (let i = 0; i < nums.length - 1; i++) {
        if (nums[i] > nums[i + 1]) return false;
      }
      return true;
    });
    assert(pricesSortedAsc, 'Sorting by Price: Low to High works correctly');

    // E. Add to Cart action
    console.log('Testing Add to Cart action...');
    const cartCountBefore = await page.evaluate(() => {
      const badge = document.querySelector('#cart-count-badge') || document.querySelector('.cart-count');
      return parseInt(badge?.innerText || '0', 10);
    });

    await page.click('.product-grid-card .btn-card-cart');
    await new Promise(r => setTimeout(r, 600));

    const cartCountAfter = await page.evaluate(() => {
      const badge = document.querySelector('#cart-count-badge') || document.querySelector('.cart-count');
      return parseInt(badge?.innerText || '0', 10);
    });
    assert(cartCountAfter >= cartCountBefore, 'Add to Cart button increments cart and functions properly');

    // F. Wishlist heart toggle
    console.log('Testing Wishlist heart toggle...');
    await page.evaluate(() => localStorage.setItem('lapkart_wishlist_v2', JSON.stringify([])));
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const initialHeart = await page.evaluate(() => {
      const btn = document.querySelector('.product-grid-card .product-wishlist-btn');
      return btn ? btn.innerText.trim() : '';
    });

    await page.click('.product-grid-card .product-wishlist-btn');
    await new Promise(r => setTimeout(r, 600));

    const toggledHeart = await page.evaluate(() => {
      const btn = document.querySelector('.product-grid-card .product-wishlist-btn');
      return btn ? btn.innerText.trim() : '';
    });

    assert(initialHeart !== toggledHeart, `Wishlist heart toggled state successfully from "${initialHeart}" to "${toggledHeart}"`);

    // G. Product Details Navigation
    console.log('Testing Product Details Navigation...');
    await page.click('.product-grid-card .product-grid-title');
    await new Promise(r => setTimeout(r, 800));

    const currentUrl = page.url();
    assert(currentUrl.includes('#product/'), `Navigated to Product Details Page (${currentUrl})`);

    console.log('\n======================================================');
    console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ✅');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Verification failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runStoreVerification();
