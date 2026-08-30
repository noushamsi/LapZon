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
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  getProfile: () => request('/auth/me'),

  // Products (User view - approved only)
  getProducts: () => request('/products'),
  getProductById: (id) => request(`/products/${id}`),

  // Orders (User)
  createOrder: (orderData) => request('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  getOrderById: (orderId) => request(`/orders/${orderId}`),
  getMyOrders: () => request('/orders'),
  cancelUserOrder: (orderId, reason = '') => request(`/orders/${orderId}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) }),

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
  resetDemoData: () => request('/admin/reset-data', { method: 'POST' })
};
