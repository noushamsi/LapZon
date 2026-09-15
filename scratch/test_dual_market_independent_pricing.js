import assert from 'assert';

const BASE_URL = 'http://localhost:8080';

async function runTests() {
  console.log('=== VERIFYING DEDICATED INDIA (INR) & UAE (AED) MARKET PRICING SYSTEM ===\n');

  // Test 1: Fetch India products
  console.log('[Test 1] Testing GET /api/products?market=India ...');
  const inRes = await fetch(`${BASE_URL}/api/products?market=India`);
  const inData = await inRes.json();
  assert(inData.success, 'India products request should succeed');
  assert(inData.products.length > 0, 'India products should not be empty');
  const allInAreIndia = inData.products.every(p => (p.market === 'India' || !p.market) && p.currency !== 'AED');
  assert(allInAreIndia, 'All returned products for India market must be India/INR products');
  console.log(`✓ Received ${inData.products.length} India products. All are INR/India.`);

  // Test 2: Fetch UAE products
  console.log('\n[Test 2] Testing GET /api/products?market=UAE ...');
  const uaeRes = await fetch(`${BASE_URL}/api/products?market=UAE`);
  const uaeData = await uaeRes.json();
  assert(uaeData.success, 'UAE products request should succeed');
  assert(uaeData.products.length > 0, 'UAE products should not be empty');
  const allUaeAreUae = uaeData.products.every(p => p.market === 'UAE' || p.currency === 'AED');
  assert(allUaeAreUae, 'All returned products for UAE market must be UAE/AED products');
  console.log(`✓ Received ${uaeData.products.length} UAE products. All are AED/UAE.`);

  // Verify specific Lenovo T14 at AED 720
  const t14Uae = uaeData.products.find(p => p.id === 'lap-uae-lenovo-t14' || p.name.includes('Lenovo ThinkPad T14'));
  assert(t14Uae, 'Lenovo T14 should exist in UAE catalog');
  assert.strictEqual(t14Uae.price, 720, 'Lenovo T14 UAE price must be exactly 720 AED');
  assert.strictEqual(t14Uae.currency, 'AED', 'Lenovo T14 UAE currency must be AED');
  console.log(`✓ Found Lenovo T14 in UAE catalog at exactly AED ${t14Uae.price} (No conversion!).`);

  // Test 3: Authenticate Admin
  console.log('\n[Test 3] Authenticating as Admin...');
  const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@lapkart.com', password: 'Admin@123' })
  });
  const adminData = await adminLogin.json();
  assert(adminData.token, 'Admin login must succeed');
  const adminToken = adminData.token;
  console.log('✓ Admin authenticated.');

  // Test 4: Admin adds Lenovo T14 for India at ₹60,000
  console.log('\n[Test 4] Admin adding Lenovo T14 for India at ₹60,000...');
  const addInRes = await fetch(`${BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Lenovo ThinkPad T14 Dual Market Edition',
      brand: 'Lenovo',
      category: 'Business',
      processor: 'AMD Ryzen 7 PRO 7840U',
      ram: '16GB DDR5',
      storage: '512GB SSD',
      display: '14-inch FHD',
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
      market: 'India',
      currency: 'INR',
      mrp: 75000,
      price: 60000,
      stock: 10,
      status: 'approved'
    })
  });
  const addInData = await addInRes.json();
  assert(addInData.success, 'India product creation must succeed');
  const inProduct = addInData.product;
  assert.strictEqual(inProduct.market, 'India');
  assert.strictEqual(inProduct.currency, 'INR');
  assert.strictEqual(inProduct.price, 60000);
  console.log(`✓ Added India listing #${inProduct.id}: "${inProduct.name}" at ₹${inProduct.price}`);

  // Test 5: Admin adds the SAME Lenovo T14 model for UAE at AED 720
  console.log('\n[Test 5] Admin adding SAME model for UAE at AED 720...');
  const addUaeRes = await fetch(`${BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Lenovo ThinkPad T14 Dual Market Edition',
      brand: 'Lenovo',
      category: 'Business',
      processor: 'AMD Ryzen 7 PRO 7840U',
      ram: '16GB DDR5',
      storage: '512GB SSD',
      display: '14-inch FHD',
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
      market: 'UAE',
      currency: 'AED',
      mrp: 950,
      price: 720,
      stock: 10,
      status: 'approved'
    })
  });
  const addUaeData = await addUaeRes.json();
  assert(addUaeData.success, 'UAE product creation must succeed');
  const uaeProduct = addUaeData.product;
  assert.strictEqual(uaeProduct.market, 'UAE');
  assert.strictEqual(uaeProduct.currency, 'AED');
  assert.strictEqual(uaeProduct.price, 720);
  console.log(`✓ Added UAE listing #${uaeProduct.id}: "${uaeProduct.name}" at AED ${uaeProduct.price}`);

  // Test 6: Verify Isolation (India customer does NOT see UAE listing, UAE customer does NOT see India listing)
  console.log('\n[Test 6] Verifying Market Isolation...');
  const checkInRes = await fetch(`${BASE_URL}/api/products?market=India`);
  const checkInData = await checkInRes.json();
  const foundUaeInIndia = checkInData.products.some(p => p.id === uaeProduct.id);
  const foundInInIndia = checkInData.products.some(p => p.id === inProduct.id);
  assert(!foundUaeInIndia, 'UAE listing MUST NOT appear in India catalog');
  assert(foundInInIndia, 'India listing MUST appear in India catalog');
  console.log('✓ India catalog contains India listing and excludes UAE listing.');

  const checkUaeRes = await fetch(`${BASE_URL}/api/products?market=UAE`);
  const checkUaeData = await checkUaeRes.json();
  const foundInInUae = checkUaeData.products.some(p => p.id === inProduct.id);
  const foundUaeInUae = checkUaeData.products.some(p => p.id === uaeProduct.id);
  assert(!foundInInUae, 'India listing MUST NOT appear in UAE catalog');
  assert(foundUaeInUae, 'UAE listing MUST appear in UAE catalog');
  console.log('✓ UAE catalog contains UAE listing and excludes India listing.');

  // Test 7: Place UAE Order (Currency AED, Total AED 720, Zero conversion)
  console.log('\n[Test 7] Placing test UAE order for AED 720...');
  const uaeOrderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: {
        fullName: 'Hamdan Al Maktoum',
        phone: '501234567',
        houseNo: 'Villa 12',
        street: 'Sheikh Zayed Road',
        city: 'Dubai',
        state: 'Dubai',
        pinCode: '00000',
        email: 'hamdan@example.ae',
        country: 'AE'
      },
      items: [{
        id: uaeProduct.id,
        name: uaeProduct.name,
        price: 720,
        mrp: 950,
        quantity: 1,
        market: 'UAE',
        currency: 'AED'
      }],
      market: 'UAE',
      currency: 'AED',
      pricing: {
        currency: 'AED',
        itemsTotal: 950,
        discount: 230,
        delivery: 0,
        totalAmount: 720
      },
      paymentMethod: 'Cash on Delivery'
    })
  });
  const uaeOrderData = await uaeOrderRes.json();
  assert(uaeOrderData.success, 'UAE order creation should succeed');
  assert.strictEqual(uaeOrderData.order.pricing.totalAmount, 720, 'Order total must be exact 720');
  assert.strictEqual(uaeOrderData.order.currency, 'AED', 'Order currency must be AED');
  console.log(`✓ UAE order #${uaeOrderData.order.orderId} created with total: AED ${uaeOrderData.order.pricing.totalAmount} (Exact AED, No conversion!)`);

  // Test 8: Place India Order (Currency INR, Total ₹60,000, Zero conversion)
  console.log('\n[Test 8] Placing test India order for ₹60,000...');
  const inOrderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: {
        fullName: 'Rohit Verma',
        phone: '9876543210',
        houseNo: 'Flat 402',
        street: 'MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560001',
        email: 'rohit@example.in',
        country: 'IN'
      },
      items: [{
        id: inProduct.id,
        name: inProduct.name,
        price: 60000,
        mrp: 75000,
        quantity: 1,
        market: 'India',
        currency: 'INR'
      }],
      market: 'India',
      currency: 'INR',
      pricing: {
        currency: 'INR',
        itemsTotal: 75000,
        discount: 15000,
        delivery: 0,
        totalAmount: 60000
      },
      paymentMethod: 'Cash on Delivery'
    })
  });
  const inOrderData = await inOrderRes.json();
  assert(inOrderData.success, 'India order creation should succeed');
  assert.strictEqual(inOrderData.order.pricing.totalAmount, 60000, 'Order total must be exact 60,000');
  assert.strictEqual(inOrderData.order.currency, 'INR', 'Order currency must be INR');
  console.log(`✓ India order #${inOrderData.order.orderId} created with total: ₹${inOrderData.order.pricing.totalAmount} (Exact INR, No conversion!)`);

  console.log('\n======================================================');
  console.log('🎉 ALL DEDICATED MARKET PRICING TESTS PASSED 100%!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
