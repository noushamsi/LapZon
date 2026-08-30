/**
 * Unified API Client for LapKart
 * Automatically attaches Bearer JWT token, handles JSON encoding, and parses errors.
 */

import { auth } from './auth.js';

const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || `HTTP ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.code = data?.code;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`API Request failed: ${options.method || 'GET'} ${url}`, err);
    throw err;
  }
}

export const api = {
  // Auth & Profile
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  getProfile: () => request('/auth/me'),
  updateProfile: (data) => request('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
  resetPassword: (email, newPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, newPassword }) }),

  // User Saved Addresses
  getUserAddresses: () => request('/user/addresses'),
  addUserAddress: (addressData) => request('/user/addresses', { method: 'POST', body: JSON.stringify(addressData) }),
  deleteUserAddress: (id) => request(`/user/addresses/${id}`, { method: 'DELETE' }),

  // Wishlist
  getWishlist: () => request('/wishlist'),
  toggleWishlist: (productId) => request('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ productId }) }),

  // Products (User view - approved only)
  getProducts: () => request('/products'),
  getProductById: (id) => request(`/products/${id}`),

  // Reviews & Ratings
  getProductReviews: (productId) => request(`/products/${productId}/reviews`),
  submitReview: (reviewData) => request('/reviews', { method: 'POST', body: JSON.stringify(reviewData) }),

  // Orders (User)
  createOrder: (orderData) => request('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  getOrderById: (orderId) => request(`/orders/${orderId}`),
  getMyOrders: () => request('/orders'),
  cancelUserOrder: (orderId, reason = '') => request(`/orders/${orderId}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) }),

  // Returns & Replacements
  submitReturnRequest: (orderId, data) => request(`/orders/${orderId}/return`, { method: 'POST', body: JSON.stringify(data) }),
  getUserReturns: () => request('/user/returns'),

  // Support Tickets
  createSupportTicket: (data) => request('/support/ticket', { method: 'POST', body: JSON.stringify(data) }),
  getUserTickets: (email = '') => request(`/support/my-tickets${email ? `?email=${encodeURIComponent(email)}` : ''}`),

  // Referrals & Coupons
  registerReferral: (referrerCode, name, email) => request('/referrals/register', { method: 'POST', body: JSON.stringify({ referrerCode, name, email }) }),
  getReferralStatus: (code) => request(`/referrals/status/${encodeURIComponent(code)}`),
  validateCoupon: (code, cartTotal) => request('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, cartTotal }) }),
  applyCoupon: (code, orderId) => request('/coupons/apply', { method: 'POST', body: JSON.stringify({ code, orderId }) }),

  // Admin APIs (Protected)
  getAdminMetrics: () => request('/admin/metrics'),
  getAdminProducts: () => request('/admin/products'),
  createAdminProduct: (productData) => request('/admin/products', { method: 'POST', body: JSON.stringify(productData) }),
  approveProduct: (id) => request(`/admin/products/${id}/approve`, { method: 'PUT' }),
  toggleAdminStock: (id, stockData) => request(`/admin/products/${id}/stock`, { method: 'PUT', body: JSON.stringify(stockData) }),
  updateAdminProduct: (id, updates) => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteAdminProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  getAdminOrders: () => request('/admin/orders'),
  confirmAdminOrder: (orderId) => request(`/admin/orders/${orderId}/confirm`, { method: 'PUT' }),
  cancelAdminOrder: (orderId, reason = '') => request(`/admin/orders/${orderId}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  updateOrderStatus: (orderId, statusData) => request(`/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify(statusData) }),
  updateOrderDeliveryDetails: (orderId, details) => request(`/admin/orders/${orderId}/delivery-details`, { method: 'PUT', body: JSON.stringify(details) }),
  getAdminReturns: () => request('/admin/returns'),
  updateAdminReturnStatus: (id, statusData) => request(`/admin/returns/${id}/status`, { method: 'PUT', body: JSON.stringify(statusData) }),
  getAdminReviews: () => request('/admin/reviews'),
  approveAdminReview: (id) => request(`/admin/reviews/${id}/approve`, { method: 'PUT' }),
  deleteAdminReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),
  getAdminTickets: () => request('/admin/support/tickets'),
  replyAdminTicket: (id, replyData) => request(`/admin/support/tickets/${id}/reply`, { method: 'PUT', body: JSON.stringify(replyData) }),
  resetDemoData: () => request('/admin/reset-data', { method: 'POST' })
};
