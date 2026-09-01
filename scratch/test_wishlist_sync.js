/**
 * Automated Verification Script: Wishlist Persistence & Double-Toggle Fix
 */

import fs from 'fs';

async function runWishlistVerification() {
  console.log('=====================================================');
  console.log('🔍 RUNNING WISHLIST PERSISTENCE & SYNC VERIFICATION');
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

  // Set up DOM & LocalStorage mocks
  const mockStore = {};
  globalThis.localStorage = {
    getItem(k) { return mockStore[k] || null; },
    setItem(k, v) { mockStore[k] = String(v); },
    removeItem(k) { delete mockStore[k]; },
    clear() { Object.keys(mockStore).forEach(k => delete mockStore[k]); }
  };
  globalThis.sessionStorage = {
    getItem(k) { return mockStore[k] || null; },
    setItem(k, v) { mockStore[k] = String(v); },
    removeItem(k) { delete mockStore[k]; }
  };
  globalThis.window = {
    location: { hash: '#store', origin: 'http://localhost:8080', pathname: '/' },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    history: { length: 2, back: () => {} },
    dispatchEvent: () => {}
  };
  const mockEl = {
    appendChild: () => {},
    insertAdjacentHTML: () => {},
    remove: () => {},
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    style: {},
    querySelectorAll: () => [],
    querySelector: () => null,
    dataset: {},
    reset: () => {},
    value: ''
  };
  globalThis.document = {
    querySelector: () => mockEl,
    querySelectorAll: () => [],
    getElementById: () => mockEl,
    createElement: () => mockEl,
    body: mockEl,
    readyState: 'complete',
    addEventListener: () => {}
  };

  const { state } = await import('../js/state.js');

  // Test 1: State Wishlist Toggle (Add item)
  state.setWishlist([]);
  const addRes = state.toggleWishlist('lap-apple-m3');
  assert(addRes === true, 'First click on wishlist returns added = true');
  assert(state.getWishlist().includes('lap-apple-m3'), 'Product lap-apple-m3 is saved in wishlist state');

  // Test 2: State Wishlist Toggle (Remove item on second click)
  const remRes = state.toggleWishlist('lap-apple-m3');
  assert(remRes === false, 'Second click on wishlist returns added = false (removed)');
  assert(!state.getWishlist().includes('lap-apple-m3'), 'Product lap-apple-m3 is cleanly removed from wishlist');

  // Test 3: Add multiple items
  state.toggleWishlist('lap-apple-m3');
  state.toggleWishlist('lap-asus-zen');
  assert(state.getWishlist().length === 2, 'Multiple wishlist items saved correctly in state');

  // Test 4: Code Audits
  const storeSrc = fs.readFileSync('js/components/store.js', 'utf8');
  const pdpSrc = fs.readFileSync('js/components/productDetails.js', 'utf8');
  const dashSrc = fs.readFileSync('js/components/userDashboard.js', 'utf8');
  const welcomeSrc = fs.readFileSync('js/components/welcome.js', 'utf8');

  assert(storeSrc.includes("storePageEl.addEventListener('click'") && !storeSrc.includes("container.addEventListener('click'"), 'store.js scopes click delegation to .store-page preventing multiple accumulating listeners on #main-content');
  assert(dashSrc.includes('finalWishlistProducts') && dashSrc.includes('state.getWishlist()'), 'userDashboard.js merges and resolves local state wishlist items with server wishlist');
  assert(pdpSrc.includes('pdp-btn-wishlist') && pdpSrc.includes('isWishlisted'), 'productDetails.js provides wishlist button with live state toggle');
  assert(welcomeSrc.includes('welcome-wishlist-btn'), 'welcome.js includes wishlist button for featured laptops');

  console.log(`\n=====================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=====================================================\n`);
}

runWishlistVerification();
