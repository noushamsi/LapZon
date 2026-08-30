/**
 * Authentication & Session Service
 * Manages JWT tokens, user roles, login state, and role checks.
 */

const TOKEN_KEY = 'lapkart_auth_token_v2';
const USER_KEY = 'lapkart_auth_user_v2';

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
    this.token = safeStorage.getItem(TOKEN_KEY) || null;
    this.user = this.loadStoredUser();
    this.listeners = new Set();
  }

  loadStoredUser() {
    try {
      const raw = safeStorage.getItem(USER_KEY);
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
    this.listeners.forEach(cb => cb({ user: this.user, token: this.token, role: this.getRole() }));
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  getRole() {
    return this.user ? this.user.role : 'guest';
  }

  isAuthenticated() {
    return Boolean(this.token && this.user);
  }

  isAdmin() {
    return Boolean(this.token && this.user && this.user.role === 'admin');
  }

  setSession(token, user) {
    this.token = token;
    this.user = user;
    safeStorage.setItem(TOKEN_KEY, token);
    safeStorage.setItem(USER_KEY, JSON.stringify(user));
    this.notify();
  }

  logout() {
    this.token = null;
    this.user = null;
    safeStorage.removeItem(TOKEN_KEY);
    safeStorage.removeItem(USER_KEY);
    this.notify();
  }
}

export const auth = new AuthService();
