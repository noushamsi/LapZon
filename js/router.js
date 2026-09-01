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
import { renderAccessDenied } from './components/accessDenied.js';
import { handlePostAuthCompletion } from './components/authModal.js';

class Router {
  constructor() {
    this.mainContainer = null;
    this.previousRoute = '#welcome';
    this.currentRoute = '#welcome';
  }

  init(container) {
    this.mainContainer = container;
    this.currentRoute = window.location.hash || '#welcome';
    window.addEventListener('hashchange', () => {
      if (this.currentRoute !== window.location.hash) {
        this.previousRoute = this.currentRoute;
        this.currentRoute = window.location.hash || '#welcome';
      }
      this.handleRoute();
    });
    this.handleRoute();
  }

  handleRoute() {
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
      if (refCode && refCode !== currentRef && !sessionStorage.getItem(`ref_tracked_${refCode}`)) {
        sessionStorage.setItem(`ref_tracked_${refCode}`, '1');
        import('./services/api.js').then(({ api }) => {
          api.registerReferral(refCode, {
            name: currentUser?.name || 'New LapKart Visitor',
            email: currentUser?.email || `visitor_${Math.random().toString(36).substring(2, 7)}@lapkart.com`
          }).then(res => {
            if (res && res.milestoneReached) {
              import('./app.js').then(({ showToast }) => {
                showToast(`🎉 5 Referrals Milestone Reached! 30% OFF Coupon Generated: ${res.couponCode}`, 'success');
              });
            }
          }).catch(() => {});
        });
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
              role: paramsObj.role || 'user'
            };
          }
        } catch (e) {
          user = { name: 'Google User', email: '', role: 'user' };
        }
        auth.setSession(token, user);
        import('./app.js').then(({ showToast }) => {
          showToast(`Welcome, ${user.name}! Successfully signed in via Google 🎉`, 'success');
        });
        handlePostAuthCompletion(user);
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
    if (pathPart === 'welcome' || pathPart === '') {
      renderWelcomePage(this.mainContainer);
    } else if (pathPart === 'store') {
      renderStorePage(this.mainContainer, paramsObj);
    } else if (pathPart.startsWith('product/')) {
      const productId = pathPart.replace('product/', '');
      renderProductDetails(this.mainContainer, productId);
    } else if (pathPart === 'checkout-address') {
      renderCheckoutAddress(this.mainContainer);
    } else if (pathPart === 'checkout-payment') {
      renderCheckoutPayment(this.mainContainer);
    } else if (pathPart.startsWith('order-confirmed/')) {
      const orderId = pathPart.replace('order-confirmed/', '');
      renderOrderConfirmed(this.mainContainer, orderId);
    } else if (pathPart.startsWith('order-tracking/') || pathPart === 'order-tracking') {
      const orderId = pathPart.startsWith('order-tracking/') ? pathPart.replace('order-tracking/', '') : paramsObj.id;
      renderOrderTracking(this.mainContainer, orderId);
    } else if (pathPart === 'my-orders') {
      renderMyOrders(this.mainContainer);
    } else if (pathPart === 'user-dashboard') {
      renderUserDashboard(this.mainContainer);
    } else if (pathPart === 'wishlist') {
      renderWishlist(this.mainContainer);
    } else if (pathPart === 'cart') {
      renderCartPage(this.mainContainer);
    } else if (pathPart === 'support') {
      renderSupportPage(this.mainContainer);
    } else if (pathPart.startsWith('legal/')) {
      const pageKey = pathPart.replace('legal/', '');
      renderLegalPage(this.mainContainer, pageKey);
    } else if (pathPart === 'admin-login' || pathPart === 'owner-login') {
      renderAdminLogin(this.mainContainer);
    } else if (pathPart === 'admin') {
      // 🔒 STRICT RBAC GUARD:
      if (auth.isAdmin()) {
        renderAdminDashboard(this.mainContainer, paramsObj);
      } else {
        // If not signed in as admin, show the Admin Login portal directly
        renderAdminLogin(this.mainContainer);
      }
    } else {
      renderWelcomePage(this.mainContainer);
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
