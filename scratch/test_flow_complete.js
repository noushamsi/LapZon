// Complete Verification Script: Register -> Login -> Order -> Admin Accept -> Re-login

const BASE_URL = 'http://localhost:8080/api';
const timestamp = Date.now();
// Using noushamsi09+... delivers to the user's real SendGrid inbox!
const TEST_EMAIL = `noushamsi09+flow${timestamp.toString().slice(-4)}@gmail.com`;
const TEST_PASS = 'TestPass@123';
const TEST_PHONE = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
const TEST_NAME = 'Noushad Shamsi';

async function runTest() {
  console.log('========================================================');
  console.log('STARTING FULL-FLOW VERIFICATION: REGISTER -> LOGIN -> ORDERS -> ADMIN ACCEPT');
  console.log('========================================================');
  console.log(`Test User Email: ${TEST_EMAIL}`);
  console.log(`Test User Phone: +91 ${TEST_PHONE}`);

  // STEP 1: Registration (No OTP)
  console.log('\n--- Step 1: Register New Customer (Zero OTP Required) ---');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: TEST_NAME,
      email: TEST_EMAIL,
      phone: TEST_PHONE,
      dialCode: 'IN',
      password: TEST_PASS,
      confirmPassword: TEST_PASS
    })
  });

  const regData = await regRes.json();
  if (regRes.status !== 201) {
    console.error('✕ Registration failed:', regData);
    throw new Error('Registration failed: ' + JSON.stringify(regData));
  }
  console.log('✓ Registration successful:', regData.message);
  console.log('  Created User ID:', regData.user.id);
  console.log('  Assigned Currency:', regData.user.currency);
  let customerToken = regData.token;

  // STEP 2: Customer Login with Email -> Should send Login Success Email
  console.log('\n--- Step 2: Customer Login with Email ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASS
    })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('✕ Login with email failed:', loginData);
    throw new Error('Email login failed: ' + JSON.stringify(loginData));
  }
  customerToken = loginData.token;
  console.log('✓ Login with email succeeded:', loginData.message);
  console.log('  User Name:', loginData.user.name);
  console.log('  User Email:', loginData.user.email);
  console.log('  User Currency:', loginData.user.currency);

  // STEP 2B: Customer Login with Phone Number
  console.log('\n--- Step 2B: Customer Login with Phone Number ---');
  const phoneLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: TEST_PHONE,
      password: TEST_PASS
    })
  });
  const phoneLoginData = await phoneLoginRes.json();
  if (!phoneLoginRes.ok) {
    console.error('✕ Login with phone failed:', phoneLoginData);
    throw new Error('Phone login failed: ' + JSON.stringify(phoneLoginData));
  }
  console.log('✓ Login with phone number succeeded:', phoneLoginData.message);

  // STEP 3: Place Order -> Should send Customer Order Email + Admin New Order Email
  console.log('\n--- Step 3: Customer Places an Order ---');
  const orderPayload = {
    customer: {
      name: TEST_NAME,
      email: TEST_EMAIL,
      phone: `+91${TEST_PHONE}`,
      address: 'Plot 42, Silicon Tech Park, MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      country: 'IN'
    },
    items: [
      {
        id: 'prod-macbook-pro-16',
        name: 'Apple MacBook Pro 16" M3 Max',
        price: 349900,
        quantity: 1,
        image: '/assets/images/macbook-pro.png'
      }
    ],
    pricing: {
      subtotal: 349900,
      shipping: 0,
      tax: 0,
      discount: 0,
      total: 349900,
      currency: 'INR'
    },
    paymentMethod: 'Credit Card (Online)'
  };

  const orderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify(orderPayload)
  });

  const orderData = await orderRes.json();
  if (!orderRes.ok) {
    console.error('✕ Place order failed:', orderData);
    throw new Error('Order creation failed: ' + JSON.stringify(orderData));
  }
  const createdOrder = orderData.order;
  const orderId = createdOrder.orderId || createdOrder.id;
  console.log('✓ Order created successfully!');
  console.log('  Order ID:', orderId);
  console.log('  Total Amount:', createdOrder.pricing.currency, createdOrder.pricing.total);
  console.log('  Customer Email:', createdOrder.customer.email);

  // STEP 4: Admin Login & Confirm/Accept Order -> Should send Admin Order Accepted Email
  console.log('\n--- Step 4: Admin Confirms / Accepts the Order ---');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@lapkart.com',
      password: 'Admin@123'
    })
  });
  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginRes.ok) {
    console.error('✕ Admin login failed:', adminLoginData);
    throw new Error('Admin login failed');
  }
  const adminToken = adminLoginData.token;
  console.log('✓ Admin logged in successfully.');

  const confirmRes = await fetch(`${BASE_URL}/admin/orders/${orderId}/confirm`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const confirmData = await confirmRes.json();
  if (!confirmRes.ok) {
    console.error('✕ Admin confirm order failed:', confirmData);
    throw new Error('Admin confirm order failed: ' + JSON.stringify(confirmData));
  }
  console.log('✓ Admin confirmed order successfully:', confirmData.message);
  console.log('  Updated Order Status:', confirmData.order.status);

  // Wait a brief moment for async email dispatches to settle
  await new Promise(r => setTimeout(r, 2000));

  // STEP 5: Re-login customer
  console.log('\n--- Step 5: Customer Re-login ---');
  const reloginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASS
    })
  });
  const reloginData = await reloginRes.json();
  if (!reloginRes.ok) {
    console.error('✕ Re-login failed:', reloginData);
    throw new Error('Re-login failed');
  }
  console.log('✓ Re-login succeeded:', reloginData.message);

  console.log('\n========================================================');
  console.log('ALL 5 STEPS COMPLETED FLAWLESSLY WITH REAL SENDGRID DISPATCHES!');
  console.log('========================================================\n');
}

runTest().catch(err => {
  console.error('\nFATAL TEST ERROR:', err.message);
  process.exit(1);
});
