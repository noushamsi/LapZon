/**
 * Automated Verification Script:
 * Verifies PDP Quantity Selector & Total Amount Math Calculation:
 * - Unit price: ₹1,74,990
 * - Qty 1 -> Total Amount = ₹1,74,990
 * - Qty 2 -> Total Amount = ₹3,49,980
 * - Qty 3 -> Total Amount = ₹5,24,970
 */

import fs from 'fs';

async function runPDPTotalAmountTests() {
  console.log('=====================================================');
  console.log('🔍 RUNNING PDP TOTAL AMOUNT CALCULATION TEST');
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
    location: { hash: '#product/lap-macbook-m3', origin: 'http://localhost:8080', pathname: '/' },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    history: { length: 2, back: () => {} },
    dispatchEvent: () => {}
  };

  const elementsMap = {};
  const mockEl = {
    appendChild: () => {},
    insertAdjacentHTML: () => {},
    remove: () => {},
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    style: {},
    querySelectorAll: () => [],
    querySelector: (sel) => {
      if (!elementsMap[sel]) {
        elementsMap[sel] = {
          textContent: '',
          innerHTML: '',
          style: {},
          addEventListener: (evt, cb) => {
            elementsMap[sel][`on_${evt}`] = cb;
          }
        };
      }
      return elementsMap[sel];
    },
    dataset: {},
    reset: () => {},
    value: '',
    set innerHTML(val) { this._innerHTML = val; },
    get innerHTML() { return this._innerHTML || ''; }
  };
  globalThis.document = {
    querySelector: (sel) => mockEl.querySelector(sel),
    querySelectorAll: () => [],
    getElementById: (sel) => mockEl.querySelector(`#${sel}`),
    createElement: () => mockEl,
    body: mockEl,
    readyState: 'complete',
    addEventListener: () => {}
  };

  const { state } = await import('../js/state.js');
  const { renderProductDetails } = await import('../js/components/productDetails.js');

  const testProduct = {
    id: 'lap-macbook-m3',
    name: 'Apple MacBook Pro 16 M3 Max',
    price: 174990,
    mrp: 199900,
    stock: 10,
    inStock: true
  };
  state.setProducts([testProduct]);

  await renderProductDetails(mockEl, 'lap-macbook-m3');

  // Verify Initial State (Qty = 1)
  assert(mockEl.innerHTML.includes('Total Amount:'), 'PDP renders "Total Amount:" label clearly');
  assert(mockEl.innerHTML.includes('₹1,74,990'), 'Initial Total Amount for Qty 1 is ₹1,74,990');

  // Simulate Clicking Plus Button twice (Qty 1 -> Qty 2 -> Qty 3)
  const plusBtn = mockEl.querySelector('#pdp-qty-plus');
  assert(typeof plusBtn.on_click === 'function', 'Plus button click listener is attached and functioning');
  
  // Click 1: Qty = 2
  plusBtn.on_click();
  const totalEl = mockEl.querySelector('#pdp-calc-total-price');
  const summaryEl = mockEl.querySelector('#pdp-price-calc-summary');
  assert(totalEl.textContent === '₹3,49,980', 'After 1st increment, Total Amount updates accurately to ₹3,49,980 (174990 × 2)');
  assert(summaryEl.textContent.includes('2 units'), 'Summary shows (₹1,74,990 × 2 units)');

  // Click 2: Qty = 3
  plusBtn.on_click();
  assert(totalEl.textContent === '₹5,24,970', 'After 2nd increment, Total Amount updates accurately to ₹5,24,970 (174990 × 3)');
  assert(summaryEl.textContent.includes('3 units'), 'Summary shows (₹1,74,990 × 3 units)');

  // Simulate Clicking Minus Button (Qty 3 -> Qty 2)
  const minusBtn = mockEl.querySelector('#pdp-qty-minus');
  minusBtn.on_click();
  assert(totalEl.textContent === '₹3,49,980', 'After decrement, Total Amount reduces to ₹3,49,980');

  console.log(`\n=====================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=====================================================\n`);
}

runPDPTotalAmountTests();
