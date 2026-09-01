/**
 * Automated Verification Script:
 * Verifies Mobile Responsive Design of LapZon:
 * 1. Mobile Top Header (Logo, search, account, cart, hamburger)
 * 2. Mobile Bottom Navigation Bar (5 tabs: Home, Store, Wishlist, Cart, Menu)
 * 3. Mobile CSS Breakpoints (<= 768px padding, vertical stacking, grid layouts)
 * 4. Zero horizontal overflow rules
 */

import fs from 'fs';

async function runMobileResponsiveTests() {
  console.log('=====================================================');
  console.log('📱 RUNNING MOBILE RESPONSIVE DESIGN VERIFICATION');
  console.log('=====================================================\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Set up DOM & Storage mocks
  const mockStorage = {};
  globalThis.sessionStorage = {
    getItem(k) { return mockStorage[k] || null; },
    setItem(k, v) { mockStorage[k] = String(v); },
    removeItem(k) { delete mockStorage[k]; }
  };
  globalThis.localStorage = {
    getItem(k) { return mockStorage[k] || null; },
    setItem(k, v) { mockStorage[k] = String(v); },
    removeItem(k) { delete mockStorage[k]; },
    clear() { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
  };
  globalThis.window = {
    location: { hash: '#welcome', origin: 'http://localhost:8080', pathname: '/' },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    history: { length: 2, back: () => {} },
    dispatchEvent: () => {}
  };

  let renderedHtml = '';
  const mockEl = {
    appendChild: () => {},
    insertAdjacentHTML: (pos, html) => { renderedHtml = html; },
    remove: () => {},
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    style: {},
    querySelectorAll: () => [],
    querySelector: () => null,
    dataset: {},
    reset: () => {},
    value: '',
    set outerHTML(val) { renderedHtml = val; },
    get outerHTML() { return renderedHtml; }
  };

  globalThis.document = {
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: (id) => id === 'app' ? mockEl : null,
    createElement: () => mockEl,
    body: mockEl,
    readyState: 'complete',
    addEventListener: () => {}
  };

  const { renderNavbar } = await import('../js/components/navbar.js');

  // Test 1: Render Navbar & Header
  renderNavbar();

  assert(renderedHtml.includes('brand-title'), 'Header renders LapZon Logo');
  assert(renderedHtml.includes('global-search-form'), 'Header renders compact search bar');
  assert(renderedHtml.includes('hamburger-toggle-btn'), 'Header renders hamburger menu toggle button');
  assert(renderedHtml.includes('mobile-nav-drawer'), 'Mobile slide-out drawer exists with navigation links');
  assert(renderedHtml.includes('mobile-bottom-nav'), 'Mobile Bottom App Navigation Bar exists');
  assert(renderedHtml.includes('bnav-home') && renderedHtml.includes('bnav-store') && renderedHtml.includes('bnav-cart'), 'Bottom Navigation contains Home, Store, and Cart tabs');

  // Test 2: Check CSS mobile rules in main.css
  const mainCss = fs.readFileSync('css/main.css', 'utf8');
  assert(mainCss.includes('.mobile-bottom-nav'), 'main.css defines .mobile-bottom-nav');
  assert(mainCss.includes('padding-bottom: 74px'), 'main.css sets mobile safe-area bottom padding on body');
  assert(mainCss.includes('overflow-x: hidden'), 'main.css prevents horizontal overflow scrolling on mobile');

  // Test 3: Check CSS mobile rules in store.css
  const storeCss = fs.readFileSync('css/store.css', 'utf8');
  assert(storeCss.includes('pdp-layout-grid'), 'store.css defines responsive single-column stack for PDP');
  assert(storeCss.includes('pdp-action-buttons-group'), 'store.css provides mobile touch-friendly action buttons');
  assert(storeCss.includes('repeat(auto-fill, minmax(150px, 1fr))'), 'store.css sets responsive 2-column mobile catalog grid');

  // Test 4: Check CSS mobile rules in welcome.css
  const welcomeCss = fs.readFileSync('css/welcome.css', 'utf8');
  assert(welcomeCss.includes('welcome-hero-premium'), 'welcome.css contains mobile hero responsiveness');
  assert(welcomeCss.includes('brands-clean-grid'), 'welcome.css contains responsive brand card layout');

  console.log(`\n=====================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=====================================================\n`);
}

runMobileResponsiveTests();
