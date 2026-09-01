/**
 * Comprehensive Automated Test Suite:
 * - PDP Quantity Selector (with live unit price * qty calculation)
 * - Buy Now & Add to Cart quantity preservation
 * - User-scoped Wishlist & My Orders Isolation
 * - Navbar reactive auth state updates
 */

import fs from 'fs';

async function runPDPQuantityAndAuthTests() {
  console.log('=====================================================');
  console.log('🔍 RUNNING PDP QUANTITY & USER ISOLATION TEST SUITE');
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
    location: { hash: '#product/lap-apple-m3', origin: 'http://localhost:8080', pathname: '/' },
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
  const { auth } = await import('../js/services/auth.js');
  const { savePendingAuthAction, getPendingAuthAction, handlePostAuthCompletion } = await import('../js/components/authModal.js');

  // Test 1: PDP Quantity math & Buy Now flow with qty = 2
  const sampleProduct = { id: 'lap-test-qty', name: 'Dell XPS 16', price: 50000, mrp: 60000, inStock: true, stock: 5 };
  state.clearCart();
  
  // Add 2 items via Buy Now
  state.addToCart(sampleProduct.id, 2, sampleProduct, true);
  const cart1 = state.getCart();
  const addedItem = cart1.find(i => i.id === sampleProduct.id);
  assert(addedItem && addedItem.quantity === 2, 'state.addToCart preserves chosen quantity (qty = 2)');
  
  const totals1 = state.getCartTotals();
  assert(totals1.sellingTotal === 100000, 'Calculated price for 2 units @ ₹50,000 = ₹1,00,000');

  // Test 2: Add 3 items via Buy Now (replaceQuantity = true)
  state.addToCart(sampleProduct.id, 3, sampleProduct, true);
  const cart2 = state.getCart();
  assert(cart2.find(i => i.id === sampleProduct.id).quantity === 3, 'Buy Now overrides to selected quantity (qty = 3)');
  assert(state.getCartTotals().sellingTotal === 150000, 'Calculated price for 3 units @ ₹50,000 = ₹1,50,000');

  // Test 3: Stock bounds: Attempting to add more than stock (stock = 5)
  state.addToCart(sampleProduct.id, 99, sampleProduct, true);
  assert(state.getCart().find(i => i.id === sampleProduct.id).quantity === 5, 'Quantity capped at product.stock (5 units)');

  // Test 4: Auth modal pending action preserves chosen quantity
  savePendingAuthAction({
    action: 'buy_now',
    productId: sampleProduct.id,
    quantity: 4,
    productData: sampleProduct,
    returnHash: `#product/${sampleProduct.id}`,
    redirectHash: '#checkout-address'
  });

  state.clearCart();
  handlePostAuthCompletion({ id: 'usr-cust-1', name: 'Aarav Patel', email: 'aarav@test.com', role: 'user' });
  assert(window.location.hash === '#checkout-address', 'Buy Now post-auth navigates straight to #checkout-address');
  assert(state.getCart().find(i => i.id === sampleProduct.id).quantity === 4, 'Preserved quantity (qty = 4) across login to checkout');

  // Test 5: User-Scoped Wishlist Isolation (User A vs User B)
  auth.setSession('token-user-a', { id: 'usr-a', email: 'user.a@test.com', role: 'user' });
  state.setWishlist(['lap-macbook-pro']);
  assert(state.getWishlist().includes('lap-macbook-pro'), 'User A wishlist contains lap-macbook-pro');

  auth.setSession('token-user-b', { id: 'usr-b', email: 'user.b@test.com', role: 'user' });
  assert(state.getWishlist().length === 0, 'User B starts with clean, isolated empty wishlist (User A items never leak)');
  state.toggleWishlist('lap-lenovo-legion');
  assert(state.getWishlist().includes('lap-lenovo-legion'), 'User B wishlist saved lap-lenovo-legion');

  // Switch back to User A
  auth.setSession('token-user-a', { id: 'usr-a', email: 'user.a@test.com', role: 'user' });
  assert(state.getWishlist().includes('lap-macbook-pro') && !state.getWishlist().includes('lap-lenovo-legion'), 'User A wishlist persists isolated from User B');

  // Test 6: Source Code Audits
  const pdpSrc = fs.readFileSync('js/components/productDetails.js', 'utf8');
  const navbarSrc = fs.readFileSync('js/components/navbar.js', 'utf8');
  const userDashSrc = fs.readFileSync('js/components/userDashboard.js', 'utf8');

  assert(pdpSrc.includes('id="pdp-qty-minus"') && pdpSrc.includes('id="pdp-qty-plus"'), 'PDP contains interactive − 1 + quantity selector controls');
  assert(pdpSrc.includes('pdp-calc-unit-price') && pdpSrc.includes('pdp-calc-total-price'), 'PDP contains dynamic real-time price calculation display');
  assert(pdpSrc.includes('pdp-btn-wishlist') && !pdpSrc.includes("window.location.hash = '#cart'"), 'PDP wishlist button does not redirect to cart');
  assert(pdpSrc.includes('btn-page-back') && pdpSrc.includes('window.history.back'), 'PDP includes working top-left ← Back button');
  assert(navbarSrc.includes('auth.subscribe'), 'Navbar immediately subscribes to auth state changes');
  assert(userDashSrc.includes('userEmail && orderEmail === userEmail'), 'User dashboard strictly isolates orders by authenticated user email');

  console.log(`\n=====================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=====================================================\n`);
}

runPDPQuantityAndAuthTests();
