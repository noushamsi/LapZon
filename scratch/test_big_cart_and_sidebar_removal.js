/**
 * Automated Verification Script:
 * 1. Bulky sidebar card removal in Wishlist & My Orders
 * 2. Full-width spacious dashboard layout
 * 3. Dedicated Full-Page Big Cart View (#cart)
 * 4. Expanded 520px Slide-out Cart Drawer
 */

import fs from 'fs';

async function runBigCartAndSidebarTests() {
  console.log('=====================================================');
  console.log('🔍 RUNNING BIG CART & SIDEBAR REMOVAL VERIFICATION');
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
    location: { hash: '#cart', origin: 'http://localhost:8080', pathname: '/' },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    history: { length: 2, back: () => {} },
    dispatchEvent: () => {}
  };
  let innerHTMLContent = '';
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
    value: '',
    set innerHTML(val) { innerHTMLContent = val; },
    get innerHTML() { return innerHTMLContent; }
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
  const { renderCartPage } = await import('../js/components/cart.js');
  const { renderUserDashboard } = await import('../js/components/userDashboard.js');

  // Test 1: User Dashboard layout contains NO 260px vertical sidebar
  auth.setSession('test-token', { id: 'usr-1', name: 'Test User', email: 'test@lapkart.com', role: 'user' });
  await renderUserDashboard(mockEl, 'wishlist');
  assert(!innerHTMLContent.includes('grid-template-columns: 260px 1fr'), 'Bulky 260px vertical sidebar grid is removed from User Dashboard');
  assert(innerHTMLContent.includes('dash-tabs-bar'), 'Top horizontal pill navigation tabs rendered cleanly');
  assert(innerHTMLContent.includes('dash-tab-content" id="dash-main-tab-content" style="width: 100%;"'), 'Content area expanded to 100% full width');

  // Test 2: Render Big Cart Page with items
  state.clearCart();
  state.addToCart('lap-1', 2, { id: 'lap-1', name: 'Apple MacBook Pro M3', price: 169900, mrp: 199900, discount: 15, processor: 'Apple M3 Pro', ram: '18GB', storage: '512GB SSD' });
  
  renderCartPage(mockEl);
  assert(innerHTMLContent.includes('big-cart-page-wrapper'), 'Big Cart Page renders with dedicated full-page container');
  assert(innerHTMLContent.includes('Apple MacBook Pro M3'), 'Big Cart renders product name and card');
  assert(innerHTMLContent.includes('big-cart-qty-plus') && innerHTMLContent.includes('big-cart-qty-minus'), 'Big Cart provides large interactive quantity controls');
  assert(innerHTMLContent.includes('btn-big-cart-checkout'), 'Big Cart provides prominent Proceed to Checkout CTA button');
  assert(innerHTMLContent.includes('btn-cart-page-back'), 'Big Cart provides working ← Back button');

  // Test 3: Render Big Cart Page empty state
  state.clearCart();
  renderCartPage(mockEl);
  assert(innerHTMLContent.includes('Your Shopping Cart is Empty'), 'Big Cart renders clean empty state when cart is empty');
  assert(innerHTMLContent.includes('Explore Laptops Catalog'), 'Big Cart empty state provides CTA to explore laptops');

  // Test 4: CSS Audits for expanded cart drawer
  const storeCss = fs.readFileSync('css/store.css', 'utf8');
  assert(storeCss.includes('width: 520px'), 'Cart drawer width expanded to 520px');
  assert(storeCss.includes('width: 96px;'), 'Cart drawer item image size expanded to 96px');

  console.log(`\n=====================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=====================================================\n`);
}

runBigCartAndSidebarTests();
