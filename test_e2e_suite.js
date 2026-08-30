/**
 * Comprehensive Automated End-to-End Verification Test Suite
 * Tests full customer and admin lifecycles against the active server.
 */

const BASE_URL = 'http://localhost:8080';

async function runTests() {
  console.log('🚀 Starting LapKart Plus Full-Stack Automated Test Suite...\n');
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

  try {
    // 1. PUBLIC PRODUCTS
    console.log('📦 1. Testing Public Products Catalog:');
    const prodsRes = await fetch(`${BASE_URL}/api/products`).then(r => r.json());
    assert(prodsRes.success && prodsRes.products.length > 0, `Fetched ${prodsRes.products?.length} approved store laptops`);
    
    const sampleProduct = prodsRes.products[0];
    const singleRes = await fetch(`${BASE_URL}/api/products/${sampleProduct.id}`).then(r => r.json());
    assert(singleRes.success && singleRes.product.name === sampleProduct.name, `Fetched PDP details for "${sampleProduct.name}"`);

    // 2. USER AUTHENTICATION
    console.log('\n👤 2. Testing Customer Registration & Authentication:');
    const testEmail = `cust_${Date.now()}@test.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Vikram Sundaram', email: testEmail, password: 'User@123' })
    }).then(r => r.json());
    assert(regRes.success && regRes.token, `Registered new customer with email: ${testEmail}`);
    const userToken = regRes.token;
    const userAuthHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` };

    // 3. USER ADDRESSES
    console.log('\n📍 3. Testing Customer Saved Addresses:');
    const addAddrRes = await fetch(`${BASE_URL}/api/user/addresses`, {
      method: 'POST',
      headers: userAuthHeaders,
      body: JSON.stringify({
        fullName: 'Vikram Sundaram',
        phone: '9876543210',
        houseNo: 'Villa 14, Palm Meadows',
        street: 'Whitefield Main Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560066',
        addressType: 'Home'
      })
    }).then(r => r.json());
    assert(addAddrRes.success && addAddrRes.address.id, 'Successfully added customer delivery address');

    const getAddrsRes = await fetch(`${BASE_URL}/api/user/addresses`, { headers: userAuthHeaders }).then(r => r.json());
    assert(getAddrsRes.success && getAddrsRes.addresses.length === 1, 'Retrieved user saved addresses array');

    // 4. USER WISHLIST
    console.log('\n💖 4. Testing Customer Wishlist Persistence:');
    const wishToggleRes = await fetch(`${BASE_URL}/api/wishlist/toggle`, {
      method: 'POST',
      headers: userAuthHeaders,
      body: JSON.stringify({ productId: sampleProduct.id })
    }).then(r => r.json());
    assert(wishToggleRes.success && wishToggleRes.added === true, `Added "${sampleProduct.name}" to user wishlist`);

    const getWishRes = await fetch(`${BASE_URL}/api/wishlist`, { headers: userAuthHeaders }).then(r => r.json());
    assert(getWishRes.success && getWishRes.products.length === 1, 'Retrieved persisted wishlist products');

    // 5. REFERRAL MILESTONES & 30% OFF COUPON
    console.log('\n🎁 5. Testing 30% Referral Milestone (0/5 to 5/5):');
    const refCode = `LK-VIKR-9999`;
    for (let i = 1; i <= 5; i++) {
      await fetch(`${BASE_URL}/api/referrals/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrerCode: refCode, name: `Friend ${i}`, email: `friend${i}_${Date.now()}@test.com` })
      });
    }
    const refStatusRes = await fetch(`${BASE_URL}/api/referrals/status/${refCode}`).then(r => r.json());
    assert(refStatusRes.success && refStatusRes.refInfo.count >= 5 && refStatusRes.refInfo.unlockedCoupon, `Referral reached 5/5 and unlocked 30% Coupon: ${refStatusRes.refInfo?.unlockedCoupon?.code}`);
    const couponCode = refStatusRes.refInfo.unlockedCoupon.code;

    // Validate Coupon
    const valCpnRes = await fetch(`${BASE_URL}/api/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, cartTotal: 100000 })
    }).then(r => r.json());
    assert(valCpnRes.success && (valCpnRes.coupon.discountAmount === 30000 || valCpnRes.coupon.discountPercent === 30), `Validated 30% OFF coupon: Discount is ₹${valCpnRes.coupon?.discountAmount} (30%) on ₹1,00,000`);

    // 6. ORDER PLACEMENT (CASH ON DELIVERY)
    console.log('\n💵 6. Testing Order Placement (Cash on Delivery):');
    const orderPayload = {
      customer: addAddrRes.address,
      items: [{ id: sampleProduct.id, name: sampleProduct.name, price: sampleProduct.price, quantity: 1, image: sampleProduct.image, specsSummary: sampleProduct.processor }],
      pricing: { itemsTotal: sampleProduct.price, discount: 30000, delivery: 0, totalAmount: sampleProduct.price - 30000 },
      paymentMethod: 'Cash on Delivery'
    };

    const placeOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: userAuthHeaders,
      body: JSON.stringify(orderPayload)
    }).then(r => r.json());
    assert(placeOrderRes.success && placeOrderRes.order.status === 'Waiting for Admin Confirmation', `Order #${placeOrderRes.order?.orderId} placed with initial status: "${placeOrderRes.order?.status}"`);
    const createdOrderId = placeOrderRes.order.orderId;

    // 7. ADMIN RBAC & ORDER CONFIRMATION LIFECYCLE
    console.log('\n👑 7. Testing Admin Authentication & Order Confirmation:');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@lapkart.com', password: 'Admin@123' })
    }).then(r => r.json());
    assert(adminLoginRes.success && adminLoginRes.user.role === 'admin', 'Admin authenticated with ADMIN role');
    const adminToken = adminLoginRes.token;
    const adminAuthHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` };

    // Admin Confirms Order
    const confirmRes = await fetch(`${BASE_URL}/api/admin/orders/${createdOrderId}/confirm`, {
      method: 'PUT',
      headers: adminAuthHeaders
    }).then(r => r.json());
    assert(confirmRes.success && confirmRes.order.status === 'Order Confirmed', `Admin confirmed order #${createdOrderId} -> Status: "${confirmRes.order?.status}"`);

    // Admin updates stages to Delivered
    const stages = ['Packed', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered'];
    for (const stage of stages) {
      await fetch(`${BASE_URL}/api/admin/orders/${createdOrderId}/status`, {
        method: 'PUT',
        headers: adminAuthHeaders,
        body: JSON.stringify({ status: stage, currentLocation: 'Bengaluru Express Hub' })
      });
    }
    const finalOrderRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}`).then(r => r.json());
    assert(finalOrderRes.success && finalOrderRes.order.status === 'Delivered', `Order successfully transitioned through all stages to: "${finalOrderRes.order?.status}"`);

    // 8. VERIFIED CUSTOMER REVIEW
    console.log('\n⭐ 8. Testing Verified Buyer Review Submission:');
    const reviewRes = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: userAuthHeaders,
      body: JSON.stringify({
        productId: sampleProduct.id,
        rating: 5,
        title: 'Sensational Laptop!',
        comment: 'High refresh rate screen, super fast boot, and seamless Cash on Delivery experience.'
      })
    }).then(r => r.json());
    assert(reviewRes.success && reviewRes.review.isVerifiedPurchase === true, `Review submitted with Verified Purchase: ${reviewRes.review?.isVerifiedPurchase}`);

    // 9. RETURN / REPLACEMENT LIFECYCLE
    console.log('\n🔄 9. Testing 7-Day Replacement Request & Admin Resolution:');
    const returnReqRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/return`, {
      method: 'POST',
      headers: userAuthHeaders,
      body: JSON.stringify({
        reason: 'Minor display tint issue',
        description: 'Customer requested 7-day doorstep replacement unit.',
        type: 'Replacement'
      })
    }).then(r => r.json());
    assert(returnReqRes.success && returnReqRes.returnRequest.id, `Return/Replacement request #${returnReqRes.returnRequest?.id} submitted`);

    // Admin approves return
    const returnApproveRes = await fetch(`${BASE_URL}/api/admin/returns/${returnReqRes.returnRequest.id}/status`, {
      method: 'PUT',
      headers: adminAuthHeaders,
      body: JSON.stringify({ status: 'Approved', adminNotes: 'Pickup scheduled via Ekart Express' })
    }).then(r => r.json());
    assert(returnApproveRes.success && returnApproveRes.returnRequest.status === 'Approved', `Admin approved return request #${returnReqRes.returnRequest?.id}`);

    // 10. SUPPORT TICKET
    console.log('\n💬 10. Testing Customer Support Ticket & Admin Reply:');
    const ticketRes = await fetch(`${BASE_URL}/api/support/ticket`, {
      method: 'POST',
      headers: userAuthHeaders,
      body: JSON.stringify({
        name: 'Vikram Sundaram',
        email: testEmail,
        subject: 'Warranty registration inquiry',
        message: 'How do I register the 1-year onsite brand warranty?'
      })
    }).then(r => r.json());
    assert(ticketRes.success && ticketRes.ticket.id, `Support ticket #${ticketRes.ticket?.id} created`);

    // Admin replies
    const replyTicketRes = await fetch(`${BASE_URL}/api/admin/support/tickets/${ticketRes.ticket.id}/reply`, {
      method: 'PUT',
      headers: adminAuthHeaders,
      body: JSON.stringify({ reply: 'Your warranty is automatically active with the invoice in My Orders!', status: 'Resolved' })
    }).then(r => r.json());
    assert(replyTicketRes.success && replyTicketRes.ticket.status === 'Resolved', 'Admin replied and resolved support ticket');

    // 11. RBAC SECURITY (CUSTOMER ACCESSING /api/admin/* SHOULD GET 403)
    console.log('\n🔒 11. Testing RBAC Security Guard:');
    const rbacDenyRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
      headers: userAuthHeaders
    });
    assert(rbacDenyRes.status === 403, `Non-admin user token to /api/admin/metrics returned 403 Forbidden (Status: ${rbacDenyRes.status})`);

    console.log(`\n==================================================`);
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runTests();
