/**
 * Authentication & Session Service
 * Manages JWT tokens, user roles, login state, and role checks.
 */

const CUST_TOKEN_KEY = 'lapkart_customer_token_v3';
const CUST_USER_KEY = 'lapkart_customer_user_v3';
const ADMIN_TOKEN_KEY = 'lapkart_admin_token_v3';
const ADMIN_USER_KEY = 'lapkart_admin_user_v3';

const safeStorage = {
  getItem: (k) => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null;
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
    } catch {}
  },
  removeItem: (k) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(k);
    } catch {}
  }
};

class AuthService {
  constructor() {
    this.listeners = new Set();
  }

  loadStoredUser(key) {
    try {
      const raw = safeStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb({ 
      user: this.getUser(), 
      token: this.getToken(), 
      role: this.getRole() 
    }));
  }

  isInAdminContext() {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash || '';
    return hash.startsWith('#admin') && hash !== '#admin-login';
  }

  getToken() {
    if (this.isInAdminContext()) {
      return safeStorage.getItem(ADMIN_TOKEN_KEY);
    }
    return safeStorage.getItem(CUST_TOKEN_KEY);
  }

  getUser() {
    if (this.isInAdminContext()) {
      return this.loadStoredUser(ADMIN_USER_KEY);
    }
    return this.loadStoredUser(CUST_USER_KEY);
  }

  getCustomerUser() {
    return this.loadStoredUser(CUST_USER_KEY);
  }

  getCustomerToken() {
    return safeStorage.getItem(CUST_TOKEN_KEY);
  }

  getAdminUser() {
    return this.loadStoredUser(ADMIN_USER_KEY);
  }

  getAdminToken() {
    return safeStorage.getItem(ADMIN_TOKEN_KEY);
  }

  getRole() {
    const user = this.getUser();
    return user ? user.role : 'guest';
  }

  isAuthenticated() {
    return Boolean(this.getToken() && this.getUser());
  }

  isAdmin() {
    const adminUser = this.getAdminUser();
    const adminToken = this.getAdminToken();
    return Boolean(adminToken && adminUser && adminUser.role === 'admin');
  }

  setSession(token, user) {
    if (user && user.role === 'admin') {
      safeStorage.setItem(ADMIN_TOKEN_KEY, token);
      safeStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    } else {
      safeStorage.setItem(CUST_TOKEN_KEY, token);
      safeStorage.setItem(CUST_USER_KEY, JSON.stringify(user));
    }
    this.notify();
  }

  logout() {
    if (this.isInAdminContext()) {
      safeStorage.removeItem(ADMIN_TOKEN_KEY);
      safeStorage.removeItem(ADMIN_USER_KEY);
    } else {
      safeStorage.removeItem(CUST_TOKEN_KEY);
      safeStorage.removeItem(CUST_USER_KEY);
    }
    this.notify();
  }
}

export const auth = new AuthService();
