/**
 * Automated Verification Script: Login Redirect Flow & Action Preservation
 */

import fs from 'fs';

async function runLoginRedirectVerification() {
  console.log('=====================================================');
  console.log('🔍 RUNNING LOGIN REDIRECT & ACTION PRESERVATION TEST');
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

  // Set up DOM & SessionStorage mocks
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

  const { savePendingAuthAction, getPendingAuthAction, handlePostAuthCompletion } = await import('../js/components/authModal.js');
  const { state } = await import('../js/state.js');

  // Test 1: PDP "Buy Now" flow -> Save pending action & execute post-login
  window.location.hash = '#product/lap-apple-m3';
  savePendingAuthAction({
    action: 'buy_now',
    productId: 'lap-apple-m3',
    productData: { id: 'lap-apple-m3', name: 'Apple MacBook Pro M3', price: 169900, inStock: true },
    returnHash: '#product/lap-apple-m3',
    redirectHash: '#checkout-address'
  });

  const saved1 = getPendingAuthAction();
  assert(saved1 && saved1.action === 'buy_now' && saved1.productId === 'lap-apple-m3', 'Pending "Buy Now" action and product metadata successfully saved in session');

  // Simulate customer login
  handlePostAuthCompletion({ id: 'usr-1', name: 'Rahul Sharma', role: 'user' });
  assert(window.location.hash === '#checkout-address', 'After login on Buy Now, user continues directly to #checkout-address (NOT user-dashboard or my-orders)');
  assert(state.getCart().some(item => item.id === 'lap-apple-m3'), 'Laptop was automatically added to user cart during Buy Now login completion');

  // Test 2: Product page "Add to Cart" flow -> Return to exact product page
  window.location.hash = '#product/lap-asus-zen';
  savePendingAuthAction({
    action: 'add_to_cart',
    productId: 'lap-asus-zen',
    productData: { id: 'lap-asus-zen', name: 'ASUS Zenbook 14 OLED', price: 99990, inStock: true },
    returnHash: '#product/lap-asus-zen'
  });

  handlePostAuthCompletion({ id: 'usr-1', name: 'Rahul Sharma', role: 'user' });
  assert(window.location.hash === '#product/lap-asus-zen', 'After login on Add to Cart, user returns to the exact same product page (#product/lap-asus-zen)');
  assert(state.getCart().some(item => item.id === 'lap-asus-zen'), 'Laptop was automatically added to cart on post-login');

  // Test 3: Store page "Wishlist" flow -> Return to exact store page
  window.location.hash = '#store';
  savePendingAuthAction({
    action: 'wishlist',
    productId: 'lap-dell-xps',
    returnHash: '#store'
  });

  handlePostAuthCompletion({ id: 'usr-1', name: 'Rahul Sharma', role: 'user' });
  assert(window.location.hash === '#store', 'After login on Wishlist, user returns to the exact store page (#store)');

  // Test 4: General Sign In from Homepage -> Return to homepage (#welcome)
  window.location.hash = '#welcome';
  savePendingAuthAction({
    returnHash: '#welcome'
  });

  handlePostAuthCompletion({ id: 'usr-1', name: 'Rahul Sharma', role: 'user' });
  assert(window.location.hash === '#welcome', 'General Sign In from Homepage returns to Homepage (#welcome) and NEVER forces #user-dashboard');

  // Test 5: Admin Login -> Navigates to #admin
  handlePostAuthCompletion({ id: 'usr-admin', name: 'Admin', role: 'admin' });
  assert(window.location.hash === '#admin', 'Admin login navigates to #admin dashboard');

  // Test 6: Source Code Audit for No Unintended Dashboard Overrides
  const authModalSrc = fs.readFileSync('js/components/authModal.js', 'utf8');
  const routerSrc = fs.readFileSync('js/router.js', 'utf8');
  const pdpSrc = fs.readFileSync('js/components/productDetails.js', 'utf8');
  const storeSrc = fs.readFileSync('js/components/store.js', 'utf8');
  const welcomeSrc = fs.readFileSync('js/components/welcome.js', 'utf8');

  assert(!authModalSrc.includes("window.location.hash = '#user-dashboard'"), 'authModal.js has zero hardcoded redirects to #user-dashboard');
  assert(!routerSrc.includes("window.location.pathname + '#user-dashboard'"), 'router.js Google callback uses handlePostAuthCompletion instead of forcing #user-dashboard');
  assert(pdpSrc.includes("action: 'buy_now'") && pdpSrc.includes("returnHash: `#product/${product.id}`"), 'productDetails.js passes action: buy_now and returnHash to openAuthModal');
  assert(storeSrc.includes("action: 'buy_now'"), 'store.js passes action: buy_now to openAuthModal');
  assert(welcomeSrc.includes("action: 'buy_now'"), 'welcome.js passes action: buy_now to openAuthModal');

  console.log(`\n=====================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=====================================================\n`);
}

runLoginRedirectVerification();
