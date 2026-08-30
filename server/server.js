/**
 * LapKart Express.js REST API Server
 * Full REST endpoints, Role-Based Access Control (RBAC), and static file hosting.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { generateToken, verifyToken, requireAdmin, optionalAuth } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ==========================================================================
// 1. AUTHENTICATION & RBAC ENDPOINTS
// ==========================================================================

// Login for Admin and Users
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, error: 'Invalid email address or password.' });
  }

  const token = generateToken(user);

  return res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Register new customer
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
  }

  const newUser = db.createUser({ name, email, password });
  const token = generateToken(newUser);

  return res.status(201).json({
    success: true,
    message: 'Account created successfully!',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
});

// Get currently logged-in user profile
app.get('/api/auth/me', verifyToken, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// ==========================================================================
// 2. PUBLIC USER PRODUCT ENDPOINTS (ONLY APPROVED LAPTOPS SHOWN)
// ==========================================================================

// Get list of all approved laptops for user store
app.get('/api/products', (req, res) => {
  const products = db.getApprovedProducts();
  return res.json({
    success: true,
    count: products.length,
    products
  });
});

// Get single product details
app.get('/api/products/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product || product.status !== 'approved') {
    return res.status(404).json({ success: false, error: 'Product not found or unavailable in store.' });
  }
  return res.json({ success: true, product });
});

// ==========================================================================
// 3. USER ORDER CREATION & REAL-TIME TRACKING ENDPOINTS
// ==========================================================================

// Place a new laptop order
app.post('/api/orders', optionalAuth, (req, res) => {
  const { customer, items, pricing, paymentMethod } = req.body;

  if (!customer || !items || items.length === 0 || !pricing || !paymentMethod) {
    return res.status(400).json({ success: false, error: 'Missing required order details.' });
  }

  // Validate stock
  for (const item of items) {
    const prod = db.getProductById(item.id);
    if (!prod || !prod.inStock || prod.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        error: `Laptop "${item.name}" is currently out of stock or insufficient quantity.`
      });
    }
  }

  const userId = req.user ? req.user.id : null;
  const order = db.createOrder({ userId, customer, items, pricing, paymentMethod });

  return res.status(201).json({
    success: true,
    message: 'Order placed successfully!',
    order
  });
});

// Get single order for live tracking
app.get('/api/orders/:orderId', (req, res) => {
  const order = db.getOrderById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found.' });
  }
  return res.json({ success: true, order });
});

// Cancel order by customer (Allowed only before shipping)
app.put('/api/orders/:orderId/cancel', optionalAuth, (req, res) => {
  const { reason } = req.body;
  const result = db.cancelOrder(req.params.orderId, 'user', reason);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  return res.json({
    success: true,
    message: 'Order cancelled successfully. Restored inventory units.',
    order: result.order
  });
});

// Referral: Register new referral join
app.post('/api/referrals/register', (req, res) => {
  const { referrerCode, name, email } = req.body;
  if (!referrerCode) {
    return res.status(400).json({ success: false, error: 'Referrer code is required.' });
  }

  const result = db.registerReferral(referrerCode, { name, email });
  return res.json({
    success: true,
    message: 'Referral recorded.',
    refInfo: result.refInfo,
    milestoneReached: result.milestoneReached,
    couponCode: result.couponCode
  });
});

// Referral: Get referral progress and unlocked coupons
app.get('/api/referrals/status/:code', (req, res) => {
  const refInfo = db.getReferralData(req.params.code);
  return res.json({ success: true, refInfo });
});

// Coupon: Validate 30% OFF referral coupon
app.post('/api/coupons/validate', (req, res) => {
  const { code, cartTotal } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Coupon code is required.' });
  }

  const result = db.validateCoupon(code, Number(cartTotal) || 0);
  if (!result.valid) {
    return res.status(400).json({ success: false, error: result.error });
  }

  return res.json({
    success: true,
    message: '30% OFF referral coupon applied successfully! 🎉',
    coupon: result
  });
});

// Coupon: Mark coupon as used after order completion
app.post('/api/coupons/apply', (req, res) => {
  const { code, orderId } = req.body;
  if (code) {
    db.markCouponUsed(code, orderId);
  }
  return res.json({ success: true });
});

// Password Reset
app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, error: 'Email and new password are required.' });
  }
  const success = db.resetPassword(email, newPassword);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Account with this email was not found.' });
  }
  return res.json({ success: true, message: 'Password reset successfully! You can now log in.' });
});

// User Profile Update
app.put('/api/user/profile', verifyToken, (req, res) => {
  const { name, phone, password } = req.body;
  const updatedUser = db.updateUserProfile(req.user.id, { name, phone, password });
  if (!updatedUser) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }
  return res.json({ success: true, message: 'Profile updated successfully.', user: updatedUser });
});

// User Saved Addresses
app.get('/api/user/addresses', verifyToken, (req, res) => {
  const addresses = db.getUserAddresses(req.user.id);
  return res.json({ success: true, addresses });
});

app.post('/api/user/addresses', verifyToken, (req, res) => {
  const { fullName, phone, houseNo, street, city, state, pinCode, addressType } = req.body;
  if (!fullName || !phone || !houseNo || !street || !city || !state || !pinCode) {
    return res.status(400).json({ success: false, error: 'All address fields are required.' });
  }
  const newAddr = db.addUserAddress(req.user.id, { fullName, phone, houseNo, street, city, state, pinCode, addressType: addressType || 'Home' });
  return res.status(201).json({ success: true, message: 'Address saved.', address: newAddr });
});

app.delete('/api/user/addresses/:id', verifyToken, (req, res) => {
  const success = db.deleteUserAddress(req.user.id, req.params.id);
  return res.json({ success, message: success ? 'Address removed.' : 'Address not found.' });
});

// Wishlist
app.get('/api/wishlist', verifyToken, (req, res) => {
  const data = db.getUserWishlist(req.user.id);
  return res.json({ success: true, itemIds: data.itemIds, products: data.products });
});

app.post('/api/wishlist/toggle', verifyToken, (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, error: 'Product ID is required.' });
  }
  const result = db.toggleWishlist(req.user.id, productId);
  return res.json({ success: true, added: result.added, itemIds: result.itemIds });
});

// Product Reviews (Public & Verified Buyer Submission)
app.get('/api/products/:id/reviews', (req, res) => {
  const reviews = db.getProductReviews(req.params.id);
  return res.json({ success: true, reviews });
});

app.post('/api/reviews', optionalAuth, (req, res) => {
  const { productId, rating, title, comment, reviewImage, reviewerName } = req.body;
  if (!productId || !rating || !comment) {
    return res.status(400).json({ success: false, error: 'Product, star rating, and review comments are required.' });
  }
  const userId = req.user ? req.user.id : null;
  const userName = req.user ? req.user.name : (reviewerName || 'Customer');
  const review = db.addReview({
    userId,
    userName,
    productId,
    rating: Number(rating),
    title,
    comment,
    reviewImage
  });
  return res.status(201).json({
    success: true,
    message: review.isVerifiedPurchase ? 'Verified Buyer review submitted successfully! ⭐' : 'Review submitted successfully!',
    review
  });
});

// Returns & Replacements
app.post('/api/orders/:orderId/return', optionalAuth, (req, res) => {
  const { reason, description, images, type } = req.body;
  if (!reason || !description) {
    return res.status(400).json({ success: false, error: 'Return reason and description are required.' });
  }
  const userId = req.user ? req.user.id : null;
  const result = db.createReturnRequest({
    orderId: req.params.orderId,
    userId,
    reason,
    description,
    images,
    type
  });
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  return res.status(201).json({
    success: true,
    message: 'Return/Replacement request submitted. Our support team will review within 24 hours.',
    returnRequest: result.returnRequest
  });
});

app.get('/api/user/returns', verifyToken, (req, res) => {
  const returns = db.getUserReturns(req.user.id);
  return res.json({ success: true, returns });
});

// Support Tickets
app.post('/api/support/ticket', optionalAuth, (req, res) => {
  const { name, email, orderId, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, error: 'Name, email, subject, and message are required.' });
  }
  const userId = req.user ? req.user.id : null;
  const ticket = db.createSupportTicket({ userId, name, email, orderId, subject, message });
  return res.status(201).json({
    success: true,
    message: `Support ticket #${ticket.id} created! Our assistance team will respond shortly.`,
    ticket
  });
});

app.get('/api/support/my-tickets', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : null;
  const email = req.query.email || (req.user ? req.user.email : null);
  const tickets = db.getUserTickets(userId, email);
  return res.json({ success: true, tickets });
});

// ==========================================================================
// 4. PROTECTED ADMIN ENDPOINTS (STRICTLY REQUIRE ADMIN ROLE)
// ==========================================================================

// Admin KPI metrics overview
app.get('/api/admin/metrics', requireAdmin, (req, res) => {
  const products = db.getAllProducts();
  const orders = db.getOrders();

  const totalRevenue = orders.reduce((sum, o) => sum + (o.pricing?.totalAmount || 0), 0);
  const activeShipments = orders.filter(o => o.status !== 'Delivered').length;
  const pendingApprovals = products.filter(p => p.status === 'pending').length;
  const liveApprovedCount = products.filter(p => p.status === 'approved').length;
  const outOfStockCount = products.filter(p => p.status === 'approved' && (!p.inStock || p.stock === 0)).length;

  return res.json({
    success: true,
    metrics: {
      totalRevenue,
      totalOrders: orders.length,
      activeShipments,
      totalProducts: liveApprovedCount,
      pendingApprovals,
      outOfStockCount
    }
  });
});

// Admin: Get all products (including pending drafts)
app.get('/api/admin/products', requireAdmin, (req, res) => {
  const products = db.getAllProducts();
  return res.json({
    success: true,
    count: products.length,
    products
  });
});

// Admin: Add new laptop product
app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { name, brand, category, processor, ram, storage, graphics, display, os, mrp, price, stock, inStock, image, images, description, status } = req.body;

  if (!name || !brand || !processor || !ram || !storage || !mrp || !price || !image) {
    return res.status(400).json({ success: false, error: 'All primary laptop specifications, pricing, and image are required.' });
  }

  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const initialStatus = status || 'pending'; // Defaults to pending approval workflow

  const newProduct = db.createProduct({
    name,
    brand,
    category: category || 'Ultrabook',
    series: `${brand} Series`,
    processor,
    ram,
    storage,
    graphics: graphics || 'Integrated Graphics',
    display: display || '15.6-inch FHD Display',
    os: os || 'Windows 11 Home',
    mrp: Number(mrp),
    price: Number(price),
    discount,
    stock: Number(stock) || 10,
    inStock: inStock !== undefined ? Boolean(inStock) : true,
    image,
    images: images && images.length > 0 ? images : [image],
    description: description || 'High-performance laptop engineered for speed, power efficiency, and stunning visuals.'
  }, initialStatus);

  return res.status(201).json({
    success: true,
    message: initialStatus === 'approved' 
      ? `"${name}" published directly to store!` 
      : `"${name}" submitted to Owner Confirmation Queue!`,
    product: newProduct
  });
});

// Admin: Approve a pending product (Makes it visible in User Store)
app.put('/api/admin/products/:id/approve', requireAdmin, (req, res) => {
  const product = db.approveProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found.' });
  }
  return res.json({
    success: true,
    message: `"${product.name}" has been approved and is now LIVE in the User Store! 🚀`,
    product
  });
});

// Admin: Toggle Stock status or update stock quantity
app.put('/api/admin/products/:id/stock', requireAdmin, (req, res) => {
  const { stock, inStock } = req.body;
  const product = db.getProductById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found.' });
  }

  const updates = {};
  if (stock !== undefined) {
    updates.stock = Math.max(0, Number(stock));
    updates.inStock = updates.stock > 0;
  }
  if (inStock !== undefined) {
    updates.inStock = Boolean(inStock);
    if (updates.inStock && product.stock === 0) updates.stock = 10;
  }

  const updated = db.updateProduct(req.params.id, updates);
  return res.json({
    success: true,
    message: `Stock updated for "${updated.name}" (${updated.inStock ? 'IN STOCK' : 'OUT OF STOCK'})`,
    product: updated
  });
});

// Admin: Edit product details
app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Product not found.' });
  }
  return res.json({ success: true, message: 'Product updated successfully.', product: updated });
});

// Admin: Delete product
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const success = db.deleteProduct(req.params.id);
  return res.json({ success, message: 'Product deleted from store catalog.' });
});

// Admin: Get all customer orders
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const orders = db.getOrders();
  return res.json({
    success: true,
    count: orders.length,
    orders
  });
});

// Admin: Confirm Order (Waiting for Admin Confirmation -> Order Confirmed)
app.put('/api/admin/orders/:orderId/confirm', requireAdmin, (req, res) => {
  const confirmedOrder = db.confirmOrder(req.params.orderId);
  if (!confirmedOrder) {
    return res.status(404).json({ success: false, error: 'Order not found.' });
  }

  return res.json({
    success: true,
    message: `Order #${confirmedOrder.orderId} confirmed successfully by Admin!`,
    order: confirmedOrder
  });
});

// Admin: Cancel / Reject Order
app.put('/api/admin/orders/:orderId/cancel', requireAdmin, (req, res) => {
  const { reason } = req.body;
  const result = db.cancelOrder(req.params.orderId, 'admin', reason || 'Order rejected by Admin.');
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  return res.json({
    success: true,
    message: `Order #${req.params.orderId} cancelled/rejected by Admin. Restored inventory stock.`,
    order: result.order
  });
});

// Admin: Update order status (Confirmed -> Packed -> Shipped -> In Transit -> Out for Delivery -> Delivered)
app.put('/api/admin/orders/:orderId/status', requireAdmin, (req, res) => {
  const { status, courierPartner, trackingNumber, currentLocation, expectedDate } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'Status is required.' });
  }

  const updatedOrder = db.updateOrderStatus(req.params.orderId, status, {
    courierPartner,
    trackingNumber,
    currentLocation,
    expectedDate
  });

  if (!updatedOrder) {
    return res.status(404).json({ success: false, error: 'Order not found.' });
  }

  return res.json({
    success: true,
    message: `Order #${updatedOrder.orderId} status updated to "${status}". Live user tracking synchronized.`,
    order: updatedOrder
  });
});

// Admin: Update courier & location checkpoint details
app.put('/api/admin/orders/:orderId/delivery-details', requireAdmin, (req, res) => {
  const { courierPartner, trackingNumber, currentLocation, expectedDate } = req.body;
  const order = db.getOrderById(req.params.orderId);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found.' });
  }

  const updatedOrder = db.updateOrderStatus(req.params.orderId, order.status, {
    courierPartner,
    trackingNumber,
    currentLocation,
    expectedDate
  });

  return res.json({
    success: true,
    message: 'Courier tracking details updated.',
    order: updatedOrder
  });
});

// Admin: Get all customer returns
app.get('/api/admin/returns', requireAdmin, (req, res) => {
  const returns = db.getAllReturns();
  return res.json({ success: true, count: returns.length, returns });
});

// Admin: Update return request status
app.put('/api/admin/returns/:id/status', requireAdmin, (req, res) => {
  const { status, adminNotes } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, error: 'Status is required.' });
  }
  const updated = db.updateReturnStatus(req.params.id, status, adminNotes);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Return request not found.' });
  }
  return res.json({ success: true, message: `Return #${updated.id} status updated to "${status}".`, returnRequest: updated });
});

// Admin: Get all reviews for moderation
app.get('/api/admin/reviews', requireAdmin, (req, res) => {
  const reviews = db.getAllReviews();
  return res.json({ success: true, count: reviews.length, reviews });
});

// Admin: Approve review
app.put('/api/admin/reviews/:id/approve', requireAdmin, (req, res) => {
  const success = db.approveReview(req.params.id);
  return res.json({ success, message: success ? 'Review approved for public display.' : 'Review not found.' });
});

// Admin: Delete review
app.delete('/api/admin/reviews/:id', requireAdmin, (req, res) => {
  const success = db.deleteReview(req.params.id);
  return res.json({ success, message: success ? 'Review deleted from platform.' : 'Review not found.' });
});

// Admin: Get all support tickets
app.get('/api/admin/support/tickets', requireAdmin, (req, res) => {
  const tickets = db.getAllTickets();
  return res.json({ success: true, count: tickets.length, tickets });
});

// Admin: Reply & resolve support ticket
app.put('/api/admin/support/tickets/:id/reply', requireAdmin, (req, res) => {
  const { reply, status } = req.body;
  if (!reply) {
    return res.status(400).json({ success: false, error: 'Reply message is required.' });
  }
  const updated = db.replyTicket(req.params.id, reply, status || 'Resolved');
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Ticket not found.' });
  }
  return res.json({ success: true, message: `Ticket #${updated.id} replied and marked "${updated.status}".`, ticket: updated });
});

// Admin: Reset database to seed demo
app.post('/api/admin/reset-data', requireAdmin, (req, res) => {
  db.resetDatabase();
  return res.json({ success: true, message: 'Database reset to default demo dataset.' });
});

// ==========================================================================
// 5. STATIC ASSETS & SINGLE PAGE APP (SPA) ROUTING
// ==========================================================================

// Serve static frontend files
app.use(express.static(ROOT_DIR));

// Fallback all non-API requests to index.html
app.get('*', (req, res) => {
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found.' });
  }
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`⚡ LapKart Full-Stack Server running at: http://localhost:${PORT}`);
  console.log(`🔐 Admin Login: admin@lapkart.com / Admin@123`);
  console.log(`👤 Customer Login: customer@gmail.com / User@123`);
});
