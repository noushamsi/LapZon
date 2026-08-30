/**
 * End-to-End Backend REST API & RBAC Security Verification Test
 */

import http from 'http';

const BASE_URL = 'http://localhost:8080/api';

async function req(endpoint, method = 'GET', body = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('=====================================================');
  console.log('🚀 RUNNING COMPLETE LAPKART FULL-STACK TEST SUITE');
  console.log('=====================================================\n');

  // Test 1: Public Store APIs
  console.log('--- 1. Testing Public Products Store API ---');
  const prodsRes = await req('/products');
  console.log(`✓ GET /api/products -> Status ${prodsRes.status}, Total Approved Laptops: ${prodsRes.data.products.length}`);
  if (!prodsRes.ok || prodsRes.data.products.length === 0) throw new Error('Public products failed');
  
  // Ensure NO pending laptops are leaked to public
  const leakedPending = prodsRes.data.products.filter(p => p.status === 'pending');
  if (leakedPending.length > 0) throw new Error('SECURITY BREACH: Pending products exposed in public store!');
  console.log('✓ Verified: Zero pending drafts exposed in public store.');

  // Test 2: Authentication (Admin & Customer)
  console.log('\n--- 2. Testing Authentication (Admin & Customer) ---');
  const adminLogin = await req('/auth/login', 'POST', { email: 'admin@lapkart.com', password: 'Admin@123' });
  console.log(`✓ Admin Login -> Status ${adminLogin.status}, Role: ${adminLogin.data.user?.role}`);
  if (adminLogin.data.user?.role !== 'admin') throw new Error('Admin login role mismatch');
  const adminToken = adminLogin.data.token;

  const userLogin = await req('/auth/login', 'POST', { email: 'customer@gmail.com', password: 'User@123' });
  console.log(`✓ Customer Login -> Status ${userLogin.status}, Role: ${userLogin.data.user?.role}`);
  if (userLogin.data.user?.role !== 'user') throw new Error('Customer login role mismatch');
  const userToken = userLogin.data.token;

  // Test 3: RBAC Access Control & Route Guarding
  console.log('\n--- 3. Testing RBAC Access Control & Route Guarding ---');
  // 3a. Unauthenticated request to Admin API
  const unauthRes = await req('/admin/metrics');
  console.log(`✓ Unauthenticated to Admin API -> Status ${unauthRes.status} (${unauthRes.data.error})`);
  if (unauthRes.status !== 401) throw new Error('Expected 401 Unauthorized for missing token');

  // 3b. Customer token accessing Admin API -> Expect 403 Forbidden Access Denied
  const forbiddenRes = await req('/admin/metrics', 'GET', null, userToken);
  console.log(`✓ Customer Token to Admin API -> Status ${forbiddenRes.status} (${forbiddenRes.data.error})`);
  if (forbiddenRes.status !== 403) throw new Error('Expected 403 Forbidden for non-admin token');

  // 3c. Admin token accessing Admin API -> Expect 200 OK
  const adminMetricsRes = await req('/admin/metrics', 'GET', null, adminToken);
  console.log(`✓ Admin Token to Admin API -> Status ${adminMetricsRes.status}, Store Revenue: ₹${adminMetricsRes.data.metrics.totalRevenue}`);
  if (adminMetricsRes.status !== 200) throw new Error('Expected 200 for valid admin token');

  // Test 4: Product Approval Workflow Lifecycle
  console.log('\n--- 4. Testing Product Approval Lifecycle ---');
  // 4a. Create new pending laptop as Admin
  const newPendingProd = await req('/admin/products', 'POST', {
    name: "Dell Alienware m16 R2 AI Gaming Laptop",
    brand: "Dell",
    category: "Gaming",
    processor: "Intel Core Ultra 9 185H",
    ram: "32GB DDR5",
    storage: "2TB NVMe SSD",
    graphics: "NVIDIA RTX 4080 12GB",
    display: "16-inch QHD+ 240Hz (2560x1600)",
    os: "Windows 11 Home",
    mrp: 299990,
    price: 269990,
    stock: 8,
    inStock: true,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
    status: "pending"
  }, adminToken);
  console.log(`✓ Created Pending Laptop: "${newPendingProd.data.product.name}" (ID: ${newPendingProd.data.product.id}, Status: ${newPendingProd.data.product.status})`);
  const pendingId = newPendingProd.data.product.id;

  // 4b. Verify it is NOT yet in public store
  const checkPublic1 = await req('/products');
  const foundBefore = checkPublic1.data.products.some(p => p.id === pendingId);
  console.log(`✓ Checked Public Store: Laptop visible before approval? ${foundBefore ? 'YES (Error!)' : 'NO (Correct!)'}`);
  if (foundBefore) throw new Error('Pending product was prematurely visible in store');

  // 4c. Approve product via Admin endpoint
  const approveRes = await req(`/admin/products/${pendingId}/approve`, 'PUT', null, adminToken);
  console.log(`✓ Admin Approved Laptop -> Status ${approveRes.status}: ${approveRes.data.message}`);

  // 4d. Verify it IS NOW in public store
  const checkPublic2 = await req('/products');
  const foundAfter = checkPublic2.data.products.some(p => p.id === pendingId);
  console.log(`✓ Checked Public Store: Laptop visible after approval? ${foundAfter ? 'YES (Success!)' : 'NO (Error!)'}`);
  if (!foundAfter) throw new Error('Approved product not found in public store');

  // Test 5: Order Creation & Live Location / Delivery Updates
  console.log('\n--- 5. Testing Order Creation & Live Location Updates ---');
  const firstApproved = checkPublic2.data.products[0];
  const orderRes = await req('/orders', 'POST', {
    customer: {
      fullName: "Ananya Iyer",
      phone: "9812345678",
      houseNo: "Flat 101, Palm Meadows",
      street: "Airport Road",
      city: "Bengaluru",
      state: "Karnataka",
      pinCode: "560017",
      addressType: "Home"
    },
    items: [{
      id: firstApproved.id,
      name: firstApproved.name,
      price: firstApproved.price,
      mrp: firstApproved.mrp,
      quantity: 1,
      image: firstApproved.image,
      specsSummary: `${firstApproved.processor} | ${firstApproved.ram}`
    }],
    pricing: {
      itemsTotal: firstApproved.mrp,
      discount: firstApproved.mrp - firstApproved.price,
      delivery: 0,
      totalAmount: firstApproved.price
    },
    paymentMethod: "Google Pay UPI (ananya@okhdfc)"
  }, userToken);

  console.log(`✓ Order Created: ID ${orderRes.data.order.orderId}, Status: ${orderRes.data.order.status}`);
  const testOrderId = orderRes.data.order.orderId;

  // 5a. Admin updates location to "Bengaluru Distribution Center" and status to "In Transit"
  const dispatchRes = await req(`/admin/orders/${testOrderId}/status`, 'PUT', {
    status: "In Transit",
    courierPartner: "Ekart Express Logistics",
    trackingNumber: "EK-BLR-998877IN",
    currentLocation: "Bengaluru Distribution Center"
  }, adminToken);
  console.log(`✓ Admin Dispatched Order -> ${dispatchRes.data.message}`);

  // 5b. User checks live tracking endpoint
  const userTracking1 = await req(`/orders/${testOrderId}`);
  console.log(`✓ User Tracking Check: Status is "${userTracking1.data.order.status}", Current Location is "${userTracking1.data.order.deliveryDetails.currentLocation}"`);
  if (userTracking1.data.order.status !== 'In Transit' || userTracking1.data.order.deliveryDetails.currentLocation !== 'Bengaluru Distribution Center') {
    throw new Error('User tracking did not receive live location update');
  }

  // 5c. Admin marks order as "Delivered"
  const deliverRes = await req(`/admin/orders/${testOrderId}/status`, 'PUT', {
    status: "Delivered"
  }, adminToken);
  console.log(`✓ Admin Marked Delivered -> ${deliverRes.data.message}`);

  // 5d. User checks live tracking endpoint for "Delivered" state
  const userTracking2 = await req(`/orders/${testOrderId}`);
  console.log(`✓ User Tracking Final: Status is "${userTracking2.data.order.status}", Delivered At: ${userTracking2.data.order.deliveryDetails.deliveredAt}`);
  if (userTracking2.data.order.status !== 'Delivered' || !userTracking2.data.order.deliveryDetails.deliveredAt) {
    throw new Error('User tracking does not show Delivered status');
  }

  console.log('\n=====================================================');
  console.log('🎉 ALL FULL-STACK & RBAC SECURITY TESTS PASSED 100%!');
  console.log('=====================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
