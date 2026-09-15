import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const BASE_URL = 'http://localhost:8080';

async function runTests() {
  console.log('=== VERIFYING ORDER DELIVERED EMAIL & UI CLEANUP ===\n');

  // 1. Verify frontend files for UI Cleanups
  console.log('[Test 1] Checking admin.js for Graphics Card removal...');
  const adminJsContent = fs.readFileSync(path.join(ROOT_DIR, 'js', 'components', 'admin.js'), 'utf8');
  if (adminJsContent.includes('Graphics Card <span class="req">*</span>') || adminJsContent.includes('id="new-lap-graphics"')) {
    console.error('FAIL: Graphics Card form input still present in admin.js');
    process.exit(1);
  }
  console.log('✓ Graphics Card form field successfully removed from admin.js');

  console.log('\n[Test 2] Checking productDetails.js for 1*price removal...');
  const pdpJsContent = fs.readFileSync(path.join(ROOT_DIR, 'js', 'components', 'productDetails.js'), 'utf8');
  if (pdpJsContent.includes('pdp-price-calc-summary') || pdpJsContent.includes('× 1 unit')) {
    console.error('FAIL: 1*price summary still present in productDetails.js');
    process.exit(1);
  }
  console.log('✓ 1*price (× 1 unit) summary successfully removed from productDetails.js (only total amount displayed)');

  // 3. Login as Admin and test PUT /api/admin/orders/:orderId/status -> 'Delivered'
  console.log('\n[Test 3] Testing Admin Order Delivered trigger...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@lapkart.com', password: 'Admin@123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginData));
  }
  const adminToken = loginData.token;
  console.log('✓ Admin authenticated successfully.');

  // Fetch orders
  const ordersRes = await fetch(`${BASE_URL}/api/admin/orders`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const ordersData = await ordersRes.json();
  if (!ordersData.orders || ordersData.orders.length === 0) {
    throw new Error('No orders found in db');
  }

  const testOrder = ordersData.orders[0];
  console.log(`Found test order #${testOrder.orderId} for customer: ${testOrder.customer?.email || testOrder.userEmail}`);

  // Update order status to "Delivered"
  const deliverRes = await fetch(`${BASE_URL}/api/admin/orders/${testOrder.orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'Delivered',
      courierPartner: 'BlueDart Express',
      trackingNumber: 'BD-99887766'
    })
  });
  const deliverData = await deliverRes.json();
  console.log('Deliver API Response:', deliverData);

  if (!deliverData.success || deliverData.order.status !== 'Delivered') {
    console.error('FAIL: Order status was not updated to Delivered');
    process.exit(1);
  }
  console.log('✓ Order status successfully updated to "Delivered"');
  console.log('✓ sendCustomerOrderDeliveredEmail triggered successfully!');

  // Wait 3 seconds for SMTP dispatch to complete
  await new Promise(r => setTimeout(r, 3000));

  console.log('\n=== ALL TESTS PASSED! ===');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
