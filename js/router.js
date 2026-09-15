/**
 * Client-side Hash Router with RBAC Route Guard & Dedicated Pages
 */

import { auth } from './services/auth.js';
import { renderWelcomePage } from './components/welcome.js';
import { renderStorePage } from './components/store.js';
import { renderProductDetails } from './components/productDetails.js';
import { renderCheckoutAddress, renderCheckoutPayment, renderOrderConfirmed } from './components/checkout.js';
import { renderCartPage } from './components/cart.js';
import { renderOrderTracking } from './components/tracking.js';
import { renderMyOrders } from './components/myOrders.js';
import { renderUserDashboard } from './components/userDashboard.js';
import { renderWishlist } from './components/wishlist.js';
import { renderSupportPage } from './components/support.js';
import { renderLegalPage } from './components/legal.js';
import { renderAdminDashboard } from './components/admin.js';
import { renderAdminLogin } from './components/adminLogin.js';
import { handlePostAuthCompletion, openAuthModal, handleGoogleAuthSuccess } from './components/authModal.js';

class Router {
  constructor() {
    this.mainContainer = null;
    this.previousRoute = '#welcome';
    this.currentRoute = '#welcome';
    if (typeof window !== 'undefined') {
      window.router = this;
    }
  }

  getContainer() {
    if (!this.mainContainer || (typeof document !== 'undefined' && !document.body.contains(this.mainContainer))) {
      this.mainContainer = document.getElementById('main-content');
    }
    return this.mainContainer;
  }

  init(container) {
    this.mainContainer = container || (typeof document !== 'undefined' ? document.getElementById('main-content') : null);
    if (typeof window !== 'undefined') {
      window.router = this;
    }
    this.currentRoute = window.location.hash || '#welcome';
    window.addEventListener('hashchange', () => {
      if (this.currentRoute !== window.location.hash) {
        this.previousRoute = this.currentRoute;
        this.currentRoute = window.location.hash || '#welcome';
      }
      this.handleRoute();
    });
    window.addEventListener('lapkart:region-changed', () => {
      const hash = window.location.hash || '';
      if (!hash.startsWith('#google-callback') && !hash.startsWith('#auth-callback')) {
        this.handleRoute();
      }
    });
    this.handleRoute();
  }

  handleRoute() {
    const container = this.getContainer();
    if (!container) return;

    const rawHash = window.location.hash.slice(1) || 'welcome';
    const [pathPart, queryPart] = rawHash.split('?');
    const queryParams = new URLSearchParams(queryPart || '');
    const paramsObj = Object.fromEntries(queryParams.entries());

    // Scroll to top smoothly on route navigation
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Track referral query param if present
    if (paramsObj.ref) {
      const refCode = paramsObj.ref.trim();
      const currentUser = auth.getUser();
      const currentRef = currentUser ? currentUser.referralCode : null;
      if (!currentRef && refCode) {
        sessionStorage.setItem('lapkart_referral_code', refCode);
      }
    }

    // Google OAuth 2.0 / OpenID Connect Callback Handler
    if (pathPart === 'google-callback' || pathPart === 'auth-callback') {
      const token = paramsObj.token;
      if (token) {
        let user = null;
        try {
          if (paramsObj.user) {
            user = JSON.parse(decodeURIComponent(paramsObj.user));
          } else {
            user = {
              id: paramsObj.id || 'usr-google',
              name: decodeURIComponent(paramsObj.name || 'Google User'),
              email: decodeURIComponent(paramsObj.email || ''),
              role: paramsObj.role || 'user',
              googleId: paramsObj.googleId || null,
              country: paramsObj.country || null,
              currency: paramsObj.currency || null
            };
          }
        } catch (e) {
          user = { name: 'Google User', email: '', role: 'user' };
        }

        if (typeof history !== 'undefined' && history.replaceState) {
          history.replaceState(null, '', '#');
        }
        handleGoogleAuthSuccess(user, token);
        return;
      }
    }

    if (pathPart === 'auth-error') {
      const errorMsg = decodeURIComponent(paramsObj.message || 'Google authentication was cancelled or failed.');
      import('./app.js').then(({ showToast }) => {
        showToast(errorMsg, 'error');
      });
      window.location.hash = '#welcome';
      return;
    }

    // Route matching with RBAC Guard
    if (pathPart === 'register' || pathPart === 'signup') {
      renderWelcomePage(container);
      openAuthModal('register');
    } else if (pathPart === 'login' || pathPart === 'signin') {
      renderWelcomePage(container);
      openAuthModal('login');
    } else if (pathPart === 'welcome' || pathPart === '') {
      renderWelcomePage(container);
    } else if (pathPart === 'store') {
      renderStorePage(container, paramsObj);
    } else if (pathPart.startsWith('product/')) {
      const productId = pathPart.replace('product/', '');
      renderProductDetails(container, productId);
    } else if (pathPart === 'checkout-address') {
      renderCheckoutAddress(container);
    } else if (pathPart === 'checkout-payment') {
      renderCheckoutPayment(container);
    } else if (pathPart.startsWith('order-confirmed/')) {
      const orderId = pathPart.replace('order-confirmed/', '');
      renderOrderConfirmed(container, orderId);
    } else if (pathPart.startsWith('order-tracking/') || pathPart === 'order-tracking') {
      const orderId = pathPart.startsWith('order-tracking/') ? pathPart.replace('order-tracking/', '') : paramsObj.id;
      renderOrderTracking(container, orderId);
    } else if (pathPart === 'my-orders') {
      renderMyOrders(container);
    } else if (pathPart === 'user-dashboard') {
      renderUserDashboard(container);
    } else if (pathPart === 'wishlist') {
      renderWishlist(container);
    } else if (pathPart === 'cart') {
      renderCartPage(container);
    } else if (pathPart === 'support') {
      renderSupportPage(container);
    } else if (pathPart.startsWith('legal/')) {
      const pageKey = pathPart.replace('legal/', '');
      renderLegalPage(container, pageKey);
    } else if (pathPart === 'admin-login' || pathPart === 'owner-login') {
      renderAdminLogin(container);
    } else if (pathPart === 'admin') {
      // 🔒 STRICT RBAC GUARD:
      if (auth.isAdmin()) {
        renderAdminDashboard(container, paramsObj);
      } else {
        // If not signed in as admin, show the Admin Login portal directly
        renderAdminLogin(container);
      }
    } else {
      renderWelcomePage(container);
    }
  }

  navigate(hash) {
    if (window.location.hash === hash) {
      this.handleRoute();
    } else {
      window.location.hash = hash;
    }
  }
}

export const router = new Router();

export function getPreviousRoute(fallback = '#store') {
  if (router && router.previousRoute && router.previousRoute !== router.currentRoute) {
    if (router.previousRoute.includes('auth-') || router.previousRoute.includes('google-')) {
      return fallback;
    }
    return router.previousRoute;
  }
  return fallback;
}
