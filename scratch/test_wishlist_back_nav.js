/**
 * Automated Verification Script: Wishlist Back Navigation & Active Sidebar State
 */

import fs from 'fs';

async function runWishlistBackNavTests() {
  console.log('=====================================================');
  console.log('🔍 RUNNING WISHLIST BACK NAVIGATION VERIFICATION');
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
  let backHistoryCallCount = 0;
  globalThis.window = {
    location: { hash: '#wishlist', origin: 'http://localhost:8080', pathname: '/' },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    history: {
      length: 3,
      back: () => { backHistoryCallCount++; }
    },
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
    querySelector: (selector) => {
      if (selector === '#btn-dashboard-back') {
        return {
          addEventListener: (evt, handler) => {
            // simulate clicking back button
            handler({ preventDefault: () => {} });
          }
        };
      }
      return null;
    },
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

  const { auth } = await import('../js/services/auth.js');
  const { state } = await import('../js/state.js');
  const { router, getPreviousRoute } = await import('../js/router.js');
  const { renderWishlist } = await import('../js/components/wishlist.js');
  const { renderUserDashboard } = await import('../js/components/userDashboard.js');

  // Test 1: Router history tracking
  router.currentRoute = '#store';
  window.location.hash = '#wishlist';
  router.previousRoute = '#store';
  router.currentRoute = '#wishlist';
  assert(getPreviousRoute('#store') === '#store', 'getPreviousRoute correctly returns #store when coming from Store');

  router.currentRoute = '#product/lap-apple-m3';
  window.location.hash = '#wishlist';
  router.previousRoute = '#product/lap-apple-m3';
  router.currentRoute = '#wishlist';
  assert(getPreviousRoute('#store') === '#product/lap-apple-m3', 'getPreviousRoute correctly returns PDP #product/lap-apple-m3 when coming from PDP');

  // Test 2: Authenticated user rendering wishlist tab
  auth.setSession('test-token', { id: 'usr-1', name: 'Test User', email: 'test@lapkart.com', role: 'user' });
  state.setWishlist(['lap-apple-m3', 'lap-asus-zen']);

  await renderWishlist(mockEl);
  
  // Verify Saved Wishlist is the active tab in HTML
  assert(innerHTMLContent.includes('dash-tab-btn active" data-tab="wishlist"'), 'Saved Wishlist sidebar button has "active" class');
  assert(innerHTMLContent.includes('dash-tab-btn " data-tab="orders"'), 'My Orders sidebar button does NOT have "active" class (not selected)');
  assert(!innerHTMLContent.includes('dash-tab-btn active" data-tab="orders"'), 'Saved Wishlist is the ONLY active/selected sidebar item');

  // Test 3: Back button uses history
  assert(backHistoryCallCount > 0, 'Back button executed window.history.back() to return to user previous page');

  // Test 4: Code Audits
  const wishlistSrc = fs.readFileSync('js/components/wishlist.js', 'utf8');
  const dashSrc = fs.readFileSync('js/components/userDashboard.js', 'utf8');
  const routerSrc = fs.readFileSync('js/components/../router.js', 'utf8');

  assert(!wishlistSrc.includes("window.location.hash = '#user-dashboard?tab=wishlist'"), 'wishlist.js does NOT inject redundant history redirect');
  assert(dashSrc.includes("hash.startsWith('#wishlist')"), 'userDashboard.js recognizes #wishlist hash for active tab');
  assert(routerSrc.includes('getPreviousRoute'), 'router.js exports getPreviousRoute helper for consistent navigation');

  console.log(`\n=====================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=====================================================\n`);
}

runWishlistBackNavTests();
