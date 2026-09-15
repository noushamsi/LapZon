// Native fetch in Node 24
async function runTest() {
  console.log('--- Starting Flow Verification Test ---');

  const timestamp = Date.now();
  const testCustomerEmail = `noushamsi09+cust${timestamp}@gmail.com`;
  const testAdminEmail = `noushamsi09+admin${timestamp}@gmail.com`;

  // 1. Customer Registration
  console.log('\n1. Testing Customer Registration...');
  const regRes = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Noushamsi Test',
      email: testCustomerEmail,
      phone: '9876543210',
      dialCode: 'IN',
      password: 'User@123',
      confirmPassword: 'User@123'
    })
  });
  const regData = await regRes.json();
  console.log('Customer Registration status:', regRes.status, regData.success ? '✓ SUCCESS' : '✕ FAILED');
  if (!regData.success) {
    console.error('Registration failed:', regData);
    process.exit(1);
  }
  const custToken = regData.token;

  // 2. Admin Registration
  console.log('\n2. Testing Admin Registration...');
  const adminRegRes = await fetch('http://localhost:8080/api/auth/admin/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Store Owner Admin',
      email: testAdminEmail,
      phone: '9876543210',
      passcode: 'LAPZON2026',
      password: 'Admin@123456',
      confirmPassword: 'Admin@123456'
    })
  });
  const adminRegData = await adminRegRes.json();
  console.log('Admin Registration status:', adminRegRes.status, adminRegData.success ? '✓ SUCCESS' : '✕ FAILED');
  if (!adminRegData.success) {
    console.error('Admin registration failed:', adminRegData);
    process.exit(1);
  }
  const adminToken = adminRegData.token;

  // 3. Place an Order
  console.log('\n3. Placing an Order as Customer...');
  const prodsRes = await fetch('http://localhost:8080/api/products');
  const prodsData = await prodsRes.json();
  const prod = (prodsData.products || []).find(p => p.inStock && p.stock > 0);
  console.log(`Using in-stock product: "${prod.name}" (ID: ${prod.id}, Stock: ${prod.stock})`);

  const orderRes = await fetch('http://localhost:8080/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({
      customer: {
        fullName: 'Noushamsi Test',
        phone: '9876543210',
        houseNo: 'Flat 101, Test Tower',
        street: 'MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560001',
        addressType: 'Home',
        email: testCustomerEmail
      },
      items: [
        {
          id: prod.id,
          name: prod.name,
          price: prod.price,
          quantity: 1
        }
      ],
      pricing: {
        itemsTotal: prod.price,
        discount: 0,
        delivery: 0,
        totalAmount: prod.price
      },
      paymentMethod: 'Cash on Delivery'
    })
  });
  const orderData = await orderRes.json();
  console.log('Order Placement status:', orderRes.status, orderData.success ? '✓ SUCCESS' : '✕ FAILED');
  if (!orderData.success) {
    console.error('Order creation failed:', orderData);
    process.exit(1);
  }
  const orderId = orderData.order.orderId;
  console.log(`Created Order #${orderId}`);

  // 4. Confirm Order as Admin
  console.log(`\n4. Confirming Order #${orderId} using Admin Token...`);
  const confirmRes = await fetch(`http://localhost:8080/api/admin/orders/${orderId}/confirm`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const confirmData = await confirmRes.json();
  console.log('Admin Confirm status:', confirmRes.status, confirmData.success ? '✓ SUCCESS' : '✕ FAILED');
  if (!confirmData.success) {
    console.error('Order confirmation failed:', confirmData);
    process.exit(1);
  }
  console.log('Order confirmation response message:', confirmData.message);

  // Wait 4 seconds for SendGrid async worker logs
  console.log('\nWaiting for SendGrid HTTP 202 confirmations...');
  await new Promise(r => setTimeout(r, 4000));
  console.log('--- Test Completed Successfully ---');
}

runTest().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
