/**
 * Authentication Modal Component - LapZon
 * 
 * Implements Official Google OAuth 2.0 / OpenID Connect Authentication Flow.
 * - Complies with official Google Identity & OAuth 2.0 standards.
 * - Redirects directly to Google's official authentication endpoint (accounts.google.com).
 * - All authentication, password verification, and multi-factor 2-Step Verification 
 *   (Google Authenticator, Passkeys, SMS OTP, Security Keys) are handled natively 
 *   by Google's official security servers.
 * - No custom or simulated Google security screens are rendered locally.
 * - On callback completion, Google redirects back to our backend callback handler, 
 *   which provisions the user session and loads the User Dashboard.
 */

import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { state } from '../state.js';
import { showToast } from '../app.js';

let activeTab = 'login'; // 'login' | 'register' | 'forgot'
let authOptions = {};
let isPasswordVisible = false;

export function savePendingAuthAction(data = {}) {
  try {
    const existing = getPendingAuthAction() || {};
    const payload = {
      returnHash: window.location.hash || '#welcome',
      ...existing,
      ...data,
      timestamp: Date.now()
    };
    sessionStorage.setItem('lapzon_pending_auth_action', JSON.stringify(payload));
  } catch (e) {
    console.warn('Could not save pending auth action:', e);
  }
}

export function getPendingAuthAction() {
  try {
    const raw = sessionStorage.getItem('lapzon_pending_auth_action');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPendingAuthAction() {
  try {
    sessionStorage.removeItem('lapzon_pending_auth_action');
  } catch {}
}

export function handlePostAuthCompletion(user, customOptions = null) {
  // If user is Admin, navigate to Admin dashboard
  if (user && user.role === 'admin') {
    window.location.hash = '#admin';
    return;
  }

  const pending = getPendingAuthAction() || customOptions || {};
  clearPendingAuthAction();

  // 1. If Buy Now action was in progress:
  if (pending.action === 'buy_now') {
    const qty = Number(pending.quantity) || 1;
    if (pending.productId) {
      state.addToCart(pending.productId, qty, pending.productData, true);
    }
    showToast('Signed in successfully! Continuing to checkout... ➔', 'success');
    window.location.hash = '#checkout-address';
    return;
  }

  // 2. If Add to Cart action was in progress:
  if (pending.action === 'add_to_cart') {
    const qty = Number(pending.quantity) || 1;
    if (pending.productId) {
      state.addToCart(pending.productId, qty, pending.productData, false);
      showToast(`Signed in! Added ${qty} × laptop to your cart 🛒`, 'success');
    }
    const targetHash = pending.returnHash || window.location.hash || '#welcome';
    window.location.hash = targetHash;
    return;
  }

  // 3. If Wishlist action was in progress:
  if (pending.action === 'wishlist') {
    if (pending.productId) {
      state.toggleWishlist(pending.productId);
      api.toggleWishlist(pending.productId).catch(() => {});
      showToast('Signed in! Laptop saved to your wishlist ❤️', 'success');
    }
    const targetHash = pending.returnHash || window.location.hash || '#welcome';
    window.location.hash = targetHash;
    return;
  }

  // 4. If explicit redirectHash was provided:
  if (pending.redirectHash && pending.redirectHash !== '#user-dashboard') {
    window.location.hash = pending.redirectHash;
    return;
  }

  // 5. If returnHash was saved (e.g. #product/lap-123 or #store or #welcome):
  if (pending.returnHash && pending.returnHash !== '#user-dashboard' && !pending.returnHash.startsWith('#google-callback') && !pending.returnHash.startsWith('#auth-callback')) {
    window.location.hash = pending.returnHash;
    return;
  }

  // 6. Otherwise, preserve the exact page the user was on:
  const currentHash = window.location.hash;
  if (currentHash && currentHash !== '#user-dashboard' && !currentHash.startsWith('#google-callback') && !currentHash.startsWith('#auth-callback')) {
    return;
  }

  // Default fallback
  window.location.hash = '#welcome';
}

export function openAuthModal(initialTab = 'login', options = {}) {
  activeTab = initialTab;
  authOptions = {
    returnHash: window.location.hash || '#welcome',
    ...options
  };
  isPasswordVisible = false;

  // Persist pending action so both local form and Google OAuth redirect preserve it
  savePendingAuthAction(authOptions);

  let modalOverlay = document.getElementById('auth-modal-overlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'auth-modal-overlay';
    modalOverlay.className = 'auth-modal-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(6px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      opacity: 0;
      transition: opacity 0.25s ease;
    `;
    document.body.appendChild(modalOverlay);
  }

  renderAuthModalContent();

  setTimeout(() => {
    modalOverlay.style.opacity = '1';
    document.body.style.overflow = 'hidden';
  }, 10);
}

export function closeAuthModal() {
  const modalOverlay = document.getElementById('auth-modal-overlay');
  if (modalOverlay) {
    modalOverlay.style.opacity = '0';
    setTimeout(() => {
      modalOverlay.remove();
      document.body.style.overflow = '';
    }, 250);
  }
}

function renderAuthModalContent() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (!overlay) return;

  overlay.innerHTML = `
    <div class="auth-modal-card" style="background: #ffffff; border-radius: 16px; width: 100%; max-width: 400px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); overflow: hidden; position: relative; padding: 2.25rem 2rem; border: 1px solid #f1f5f9;">
      
      <!-- Close Button -->
      <button type="button" id="btn-close-auth-modal" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.25rem; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #94a3b8; transition: all 0.2s ease;" aria-label="Close modal">✕</button>

      <!-- Clean Header -->
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.6rem; font-weight: 800; color: #1e293b; margin: 0 0 0.25rem;">
          ${activeTab === 'login' ? 'Log in' : activeTab === 'register' ? 'Create account' : 'Reset password'}
        </h2>
      </div>

      <!-- Official Google OAuth 2.0 Login Button -->
      <button type="button" id="btn-google-signin" class="btn btn-google" style="width: 100%; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.92rem; background: #f8fafc; color: #1e293b; border: 1.5px solid #cbd5e1; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 1.25rem; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>${activeTab === 'register' ? 'Sign up with Google' : 'Continue with Google'}</span>
      </button>

      <!-- OR Divider -->
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1.25rem;">
        <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
        <span style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">OR</span>
        <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
      </div>

      <!-- Standard Email/Password Form -->
      <form id="auth-main-form">
        ${activeTab === 'register' ? `
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 0.35rem;">Full Name</label>
            <input type="text" id="auth-name-input" placeholder="e.g. Rahul Sharma" required style="width: 100%; padding: 0.75rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;" />
          </div>
        ` : ''}

        <div class="form-group" style="margin-bottom: 1rem;">
          <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 0.35rem;">Email</label>
          <input type="email" id="auth-email-input" placeholder="name@example.com" required style="width: 100%; padding: 0.75rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;" />
        </div>

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <label style="font-size: 0.85rem; font-weight: 700; color: #1e293b;">${activeTab === 'forgot' ? 'New Password' : 'Password'}</label>
          </div>
          
          <!-- Password Input with Embedded Eye Icon -->
          <div style="position: relative; display: flex; align-items: center;">
            <input 
              type="${isPasswordVisible ? 'text' : 'password'}" 
              id="auth-pass-input" 
              placeholder="Enter password" 
              required 
              style="width: 100%; padding: 0.75rem 2.5rem 0.75rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;" 
            />
            <button 
              type="button" 
              id="btn-toggle-show-pass" 
              title="${isPasswordVisible ? 'Hide Password' : 'Show Password'}" 
              style="position: absolute; right: 8px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; padding: 4px 6px; display: flex; align-items: center; justify-content: center;"
            >
              ${isPasswordVisible ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <div id="auth-error-msg" style="display: none; padding: 0.6rem 0.85rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #ef4444; font-size: 0.84rem; margin-bottom: 1rem;"></div>

        <!-- Log In Primary Button -->
        <button type="submit" id="btn-auth-submit" class="btn btn-block btn-lg" style="width: 100%; padding: 0.8rem; border-radius: 8px; font-weight: 800; font-size: 1rem; background: #1e293b; color: #ffffff; border: none; cursor: pointer; transition: all 0.2s ease;">
          ${activeTab === 'login' ? 'Log in' : activeTab === 'register' ? 'Create account' : 'Reset password'}
        </button>

        ${activeTab === 'login' ? `
          <div style="text-align: center; margin-top: 1rem;">
            <a href="#" id="auth-forgot-link" style="font-size: 0.85rem; color: #475569; text-decoration: underline; font-weight: 600;">Forgot password?</a>
          </div>

          <div style="text-align: center; margin-top: 1.25rem; font-size: 0.85rem; color: #64748b;">
            Don't have an account? <a href="#" id="auth-switch-register" style="color: #ff6b00; font-weight: 700; text-decoration: none;">Register</a>
          </div>
        ` : (activeTab === 'register' ? `
          <div style="text-align: center; margin-top: 1.25rem; font-size: 0.85rem; color: #64748b;">
            Already have an account? <a href="#" id="auth-switch-login" style="color: #ff6b00; font-weight: 700; text-decoration: none;">Log in</a>
          </div>
        ` : `
          <div style="text-align: center; margin-top: 1.25rem; font-size: 0.85rem; color: #64748b;">
            Remember your password? <a href="#" id="auth-switch-login" style="color: #ff6b00; font-weight: 700; text-decoration: none;">Back to Log in</a>
          </div>
        `)}
      </form>
    </div>
  `;

  attachModalEvents();
}

function attachModalEvents() {
  const overlay = document.getElementById('auth-modal-overlay');
  const closeBtn = document.getElementById('btn-close-auth-modal');
  const forgotLink = document.getElementById('auth-forgot-link');
  const switchRegister = document.getElementById('auth-switch-register');
  const switchLogin = document.getElementById('auth-switch-login');
  const form = document.getElementById('auth-main-form');
  const errorMsg = document.getElementById('auth-error-msg');
  const googleBtn = document.getElementById('btn-google-signin');

  // Password visibility toggle
  const passInput = document.getElementById('auth-pass-input');
  const togglePassBtn = document.getElementById('btn-toggle-show-pass');

  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      isPasswordVisible = !isPasswordVisible;
      passInput.type = isPasswordVisible ? 'text' : 'password';
      togglePassBtn.innerHTML = isPasswordVisible ? '🙈' : '👁';
      togglePassBtn.title = isPasswordVisible ? 'Hide Password' : 'Show Password';
    });
  }

  // Official Google OAuth 2.0 Initiation
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        googleBtn.disabled = true;
        googleBtn.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>⏳</span> <span>Connecting to Google...</span>
          </div>
        `;
        
        // Fetch official Google OAuth 2.0 authorization URL from backend
        const res = await api.getGoogleConfig();
        if (res && res.isConfigured && res.authUrl) {
          // Redirect browser directly to Google's official login page (accounts.google.com)
          window.location.href = res.authUrl;
        } else {
          googleBtn.disabled = false;
          googleBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          `;
          showToast('Google OAuth setup required: Please add your GOOGLE_CLIENT_ID in the .env file.', 'warning');
        }
      } catch (err) {
        googleBtn.disabled = false;
        showToast('Google OAuth initialization error: ' + (err.message || 'Please check server connection'), 'error');
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });
  }

  if (switchRegister) {
    switchRegister.addEventListener('click', (e) => {
      e.preventDefault();
      activeTab = 'register';
      renderAuthModalContent();
    });
  }

  if (switchLogin) {
    switchLogin.addEventListener('click', (e) => {
      e.preventDefault();
      activeTab = 'login';
      renderAuthModalContent();
    });
  }

  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      activeTab = 'forgot';
      renderAuthModalContent();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg.style.display = 'none';

      const email = document.getElementById('auth-email-input').value.trim();
      const pass = document.getElementById('auth-pass-input').value;
      const name = document.getElementById('auth-name-input')?.value.trim() || '';

      const submitBtn = document.getElementById('btn-auth-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      try {
        if (activeTab === 'login') {
          const res = await api.login(email, pass);
          auth.setSession(res.token, res.user);
          showToast(`Welcome back, ${res.user.name}! 👋`, 'success');
          closeAuthModal();
          if (authOptions.onSuccess) authOptions.onSuccess(res.user);
          handlePostAuthCompletion(res.user, authOptions);
        } else if (activeTab === 'register') {
          const res = await api.register(name, email, pass);
          auth.setSession(res.token, res.user);
          showToast(`Account created! Welcome to LapZon, ${res.user.name} 🎉`, 'success');
          closeAuthModal();
          if (authOptions.onSuccess) authOptions.onSuccess(res.user);
          handlePostAuthCompletion(res.user, authOptions);
        } else if (activeTab === 'forgot') {
          const res = await api.resetPassword(email, pass);
          showToast(res.message || 'Password updated! Please sign in with your new password.', 'success');
          activeTab = 'login';
          renderAuthModalContent();
        }
      } catch (err) {
        errorMsg.textContent = err.message || 'Authentication failed. Please check your credentials.';
        errorMsg.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = activeTab === 'login' ? 'Log in' : activeTab === 'register' ? 'Create account' : 'Reset password';
      }
    });
  }
}
