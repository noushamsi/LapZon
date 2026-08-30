/**
 * Automated Unit & Logic Verification Suite
 */

import { INITIAL_PRODUCTS, INITIAL_ORDERS, SAVED_ADDRESSES } from '../js/data.js';

// Mock localStorage
const storage = {};
globalThis.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { for (let k in storage) delete storage[k]; }
};

import { state } from '../js/state.js';

console.log('--- 1. Testing Initial State Seeding ---');
const products = state.getProducts();
console.log(`✓ Products loaded: ${products.length} products (Expected >= 12)`);
if (products.length < 12) throw new Error('Product count mismatch');

const orders = state.getOrders();
console.log(`✓ Initial Orders: ${orders.length} orders`);

console.log('\n--- 2. Testing Cart & Coupon Engine ---');
const firstProd = products[0];
const addRes = state.addToCart(firstProd.id, 2);
console.log(`✓ Add to Cart: ${addRes.success} - ${addRes.message}`);

let totals = state.getCartTotals(5000);
console.log(`✓ Cart Totals (Qty 2 + LAPTOP5000 Coupon):`, {
  itemsCount: totals.itemsCount,
  mrpTotal: totals.mrpTotal,
  totalPayable: totals.totalPayable,
  couponDiscount: totals.couponDiscount
});
if (totals.itemsCount !== 2) throw new Error('Cart count mismatch');
if (totals.couponDiscount !== 5000) throw new Error('Coupon discount mismatch');

console.log('\n--- 3. Testing Order Creation & Stock Deduction ---');
const initialStock = firstProd.stock;
const testOrder = state.createOrder({
  customer: SAVED_ADDRESSES[0],
  items: state.getCart(),
  pricing: totals,
  paymentMethod: 'Google Pay UPI (test@okaxis)'
});
console.log(`✓ Order Created: ID ${testOrder.orderId}, Status: ${testOrder.status}, Date: ${testOrder.createdAt}`);

const updatedProd = state.getProductById(firstProd.id);
console.log(`✓ Stock deducted from ${initialStock} to ${updatedProd.stock}`);
if (updatedProd.stock !== initialStock - 2) throw new Error('Stock not deducted accurately');

console.log('\n--- 4. Testing 6-Stage Order Tracking Progression ---');
const STAGES = ["Confirmed", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered"];

STAGES.forEach(stage => {
  const updatedOrder = state.updateOrderStatus(testOrder.orderId, stage, {
    courierPartner: 'Ekart Logistics',
    trackingNumber: 'EK-TEST-12345IN',
    currentLocation: `Checkpoint at ${stage} Hub`
  });
  console.log(`✓ Advanced to: ${updatedOrder.status} | Completed stages count: ${updatedOrder.timeline.filter(t => t.completed).length}`);
});

const finalOrder = state.getOrderById(testOrder.orderId);
if (finalOrder.status !== 'Delivered') throw new Error('Final order status not Delivered');
if (!finalOrder.deliveryDetails.deliveredAt) throw new Error('DeliveredAt timestamp missing');
console.log(`✓ Order Successfully Delivered at: ${finalOrder.deliveryDetails.deliveredAt}`);

console.log('\n--- 5. Testing Owner/Admin Add Product & Confirmation Queue ---');
// 5a. Direct publish
const liveProduct = state.addProduct({
  name: "Acer Swift Go 14 AI OLED",
  brand: "Acer",
  category: "Ultrabook",
  processor: "Intel Core Ultra 7 155H",
  ram: "16GB",
  storage: "1TB SSD",
  graphics: "Intel Arc Graphics",
  display: "14-inch 2.8K 120Hz OLED",
  os: "Windows 11 Home",
  mrp: 99990,
  price: 79990,
  discount: 20,
  stock: 20,
  inStock: true
}, true);
console.log(`✓ Direct Published Product: ${liveProduct.name} (ID: ${liveProduct.id})`);
if (!state.getProductById(liveProduct.id)) throw new Error('Direct product not found in store');

// 5b. Draft submission & Owner Confirmation
const draftProduct = state.addProduct({
  name: "Razer Blade 16 Gaming Laptop",
  brand: "ASUS",
  category: "Gaming",
  processor: "Intel Core i9 14900HX",
  ram: "32GB",
  storage: "2TB SSD",
  graphics: "NVIDIA RTX 4090 16GB",
  display: "16-inch Dual-Mode Mini-LED 4K 120Hz / FHD 240Hz",
  os: "Windows 11 Home",
  mrp: 389990,
  price: 349990,
  discount: 10,
  stock: 5,
  inStock: true
}, false);
console.log(`✓ Submitted to Draft Queue: ${draftProduct.name}`);
if (state.getDrafts().length !== 1) throw new Error('Draft not queued');

const approvedProduct = state.confirmDraftProduct(draftProduct.id);
console.log(`✓ Owner Confirmed Draft: ${approvedProduct.name} -> Now live in store!`);
if (!state.getProductById(approvedProduct.id)) throw new Error('Approved draft not found in store');
if (state.getDrafts().length !== 0) throw new Error('Draft queue not cleared');

console.log('\n--- 6. Testing Stock Toggle in Admin Inventory ---');
const toggled = state.toggleProductStock(approvedProduct.id);
console.log(`✓ Stock toggled from In Stock to: ${toggled.inStock ? 'In Stock' : 'Out of Stock'}`);
if (toggled.inStock !== false) throw new Error('Stock toggle failed');

console.log('\n========================================');
console.log('🎉 ALL 6 TEST SUITES PASSED FLAWLESSLY! ');
console.log('========================================\n');
