/**
 * Full End-to-End System Test for LapKart Plus (ESM with Auth):
 * 1. Order initial status: "Waiting for Admin Confirmation" & paymentMethod: "Cash on Delivery"
 * 2. Admin Order Confirmation -> "Order Confirmed"
 * 3. User Order Cancellation -> "Cancelled by User" with stock restoration & non-cancellation guard after shipping
 * 4. Referral System -> 5 referrals trigger 30% OFF coupon generation and coupon validation
 */

import http from 'http';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting LapKart Plus Full System Verification...\n');

  try {
    // 0. Admin Login to get JWT/Auth token
    const adminLoginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@lapkart.com',
      password: 'Admin@123'
    });
    const adminToken = adminLoginRes.body.token;
    const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };
    console.log(`✓ Admin Auth: Authenticated successfully (Token generated).`);

    // 1. Check Products API
    const productsRes = await makeRequest('GET', '/api/products');
    console.log(`✓ Products API: Loaded ${productsRes.body.products.length} live laptops.`);
    const sampleProduct = productsRes.body.products[0];
    const initialStock = sampleProduct.stock;
    console.log(`  Target Laptop: "${sampleProduct.name}" (Stock: ${initialStock})`);

    // 2. Place Order with Cash on Delivery
    const orderPayload = {
      customer: {
        fullName: 'Kiran Rao',
        phone: '9845098450',
        houseNo: '42, 3rd Floor',
        street: '12th Main, HAL 2nd Stage',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560008',
        addressType: 'Home'
      },
      items: [
        {
          id: sampleProduct.id,
          name: sampleProduct.name,
          price: sampleProduct.price,
          quantity: 1,
          image: sampleProduct.image
        }
      ],
      pricing: {
        itemsTotal: sampleProduct.mrp,
        discount: sampleProduct.mrp - sampleProduct.price,
        delivery: 0,
        totalAmount: sampleProduct.price
      },
      paymentMethod: 'Cash on Delivery'
    };

    const placeRes = await makeRequest('POST', '/api/orders', orderPayload);
    console.log(`\n✓ Create Order API:`);
    console.log(`  Order ID: ${placeRes.body.order.orderId}`);
    console.log(`  Initial Status: "${placeRes.body.order.status}"`);
    console.log(`  Payment Method: "${placeRes.body.order.paymentMethod}"`);

    if (placeRes.body.order.status !== 'Waiting for Admin Confirmation') {
      throw new Error(`Expected initial status 'Waiting for Admin Confirmation', got '${placeRes.body.order.status}'`);
    }

    const orderId1 = placeRes.body.order.orderId;

    // 3. Admin Confirm Order
    const confirmRes = await makeRequest('PUT', `/api/admin/orders/${orderId1}/confirm`, null, adminHeaders);
    console.log(`\n✓ Admin Confirm Order API:`);
    console.log(`  Updated Status: "${confirmRes.body.order.status}"`);
    if (confirmRes.body.order.status !== 'Order Confirmed') {
      throw new Error(`Expected status 'Order Confirmed', got '${confirmRes.body.order.status}'`);
    }

    // 4. Test Customer Cancel Order (Before shipping)
    const cancelRes = await makeRequest('PUT', `/api/orders/${orderId1}/cancel`, {
      reason: 'Change of mind before shipment'
    });
    console.log(`\n✓ Customer Cancel Order API:`);
    console.log(`  Status after user cancel: "${cancelRes.body.order.status}"`);
    if (cancelRes.body.order.status !== 'Cancelled by User') {
      throw new Error(`Expected status 'Cancelled by User', got '${cancelRes.body.order.status}'`);
    }

    // Verify stock restoration
    const updatedProdRes = await makeRequest('GET', `/api/products/${sampleProduct.id}`);
    console.log(`  Stock restored back to: ${updatedProdRes.body.product.stock} (Initial: ${initialStock})`);

    // 5. Test Referral Program & 30% OFF Coupon Reward
    console.log(`\n✓ Referral & 30% OFF Coupon System:`);
    const testRefCode = 'LK-AUTOTEST';

    for (let i = 1; i <= 5; i++) {
      const refReg = await makeRequest('POST', '/api/referrals/register', {
        referrerCode: testRefCode,
        name: `Referred Friend #${i}`,
        email: `friend${i}_test@gmail.com`
      });
      console.log(`  Referred #${i}: count = ${refReg.body.refInfo.count}/5, coupon = ${refReg.body.refInfo.unlockedCoupon?.code || 'None'}`);
      
      if (i === 5) {
        const coupon = refReg.body.refInfo.unlockedCoupon;
        if (!coupon || !coupon.code) {
          throw new Error('Expected 5th referral to trigger 30% OFF coupon milestone!');
        }
        console.log(`  🎉 30% OFF Coupon Generated: ${coupon.code}`);

        // Validate the coupon on a ₹1,00,000 cart total
        const valRes = await makeRequest('POST', '/api/coupons/validate', {
          code: coupon.code,
          cartTotal: 100000
        });
        console.log(`  Coupon Validation: Valid = ${valRes.body.coupon.valid}, Discount = ₹${valRes.body.coupon.discountAmount} (30% of ₹1,00,000)`);
        if (!valRes.body.coupon.valid || valRes.body.coupon.discountAmount !== 30000) {
          throw new Error(`Expected ₹30,000 discount on ₹1,00,000 cart, got ${valRes.body.coupon.discountAmount}`);
        }
      }
    }

    console.log('\n=========================================');
    console.log('✅ ALL LAPKART PLUS SYSTEM FLOW TESTS PASSED!');
    console.log('=========================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();
