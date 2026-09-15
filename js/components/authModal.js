/**
 * Authentication Modal Component - LapZon
 * 
 * Supports:
 * 1. Email OTP Customer Registration:
 *    - Validates Full Name, Email, Phone Number, Country/Currency, Password, and Confirm Password.
 *    - Dispatches a 6-digit OTP to the user's exact email address via Gmail SMTP.
 *    - Displays a dedicated "Verify your email" modal view with a 5-minute countdown and 60s resend cooldown.
 *    - Enforces maximum 5 incorrect verification attempts.
 *    - On verification, securely hashes the password with bcrypt and automatically logs the user in.
 * 2. Standard Login (Email or Phone + Password)
 * 3. Forgot Password / Password Reset
 * 4. Official Google OAuth 2.0 / OpenID Connect Single Sign-On
 */

import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { state } from '../state.js';
import { showToast, showAuthSuccessNotification } from '../services/toast.js';

let activeTab = (typeof window !== 'undefined' && (window.location.hash.startsWith('#register') || window.location.hash.startsWith('#signup'))) ? 'register' : 'login';
let authOptions = {};
let isPasswordVisible = false;
let isConfirmPasswordVisible = false;

const EYE_OPEN_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const EYE_SLASH_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

// Pending registration state & timers
let pendingRegistrationData = null;
let otpTimerInterval = null;
let resendCooldownInterval = null;
let otpTimeRemaining = 60; // 60 seconds TTL
let resendCooldownRemaining = 60; // 60 seconds cooldown

// Customer Password Reset State & Timers
let currentResetEmail = '';
let currentResetToken = '';
let resetOtpTimerInterval = null;
let resetResendCooldownInterval = null;
let resetOtpTimeRemaining = 60; // 60-second TTL
let resetResendCooldownRemaining = 60; // 60-second cooldown
let isNewPasswordVisible = false;
let isConfirmNewPasswordVisible = false;

// Country Phone System Configuration
export const COUNTRY_PHONE_CONFIG = {
  IN: {
    code: 'IN',
    dialCode: '+91',
    countryName: 'India',
    length: 10,
    placeholder: 'Enter 10-digit mobile number',
    errorMessage: 'Enter a valid 10-digit Indian mobile number.',
    validate: (num) => num.length === 10 && /^\d{10}$/.test(num)
  },
  AE: {
    code: 'AE',
    dialCode: '+971',
    countryName: 'UAE',
    length: 9,
    placeholder: 'Enter 9-digit mobile number',
    errorMessage: 'Enter a valid 9-digit UAE mobile number.',
    validate: (num) => num.length === 9 && /^\d{9}$/.test(num)
  }
};

let selectedCountryCode = 'IN';

export function resetRegistrationState() {
  if (otpTimerInterval) clearInterval(otpTimerInterval);
  if (resendCooldownInterval) clearInterval(resendCooldownInterval);
  otpTimerInterval = null;
  resendCooldownInterval = null;
  pendingRegistrationData = null;
  otpTimeRemaining = 60;
  resendCooldownRemaining = 60;

  const nameInput = document.getElementById('auth-name-input');
  const emailInput = document.getElementById('auth-email-input');
  const phoneInput = document.getElementById('auth-phone-input');
  const passInput = document.getElementById('auth-pass-input');
  const confirmPassInput = document.getElementById('auth-confirm-pass-input');
  const authErrorMsg = document.getElementById('auth-error-msg');
  const otpErrorMsg = document.getElementById('auth-otp-error-msg');

  if (nameInput) nameInput.value = '';
  if (emailInput) emailInput.value = '';
  if (phoneInput) phoneInput.value = '';
  if (passInput) passInput.value = '';
  if (confirmPassInput) confirmPassInput.value = '';

  if (authErrorMsg) {
    authErrorMsg.innerHTML = '';
    authErrorMsg.style.display = 'none';
  }
  if (otpErrorMsg) {
    otpErrorMsg.innerHTML = '';
    otpErrorMsg.style.display = 'none';
  }
}

export function resetForgotState() {
  if (resetOtpTimerInterval) clearInterval(resetOtpTimerInterval);
  if (resetResendCooldownInterval) clearInterval(resetResendCooldownInterval);
  resetOtpTimerInterval = null;
  resetResendCooldownInterval = null;
  currentResetEmail = '';
  currentResetToken = '';
  resetOtpTimeRemaining = 60;
  resetResendCooldownRemaining = 60;
  isNewPasswordVisible = false;
  isConfirmNewPasswordVisible = false;
}

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

let closeTimeout = null;

export function closeAuthModal(immediate = false) {
  resetRegistrationState();
  resetForgotState();
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }
  const modalOverlay = document.getElementById('auth-modal-overlay');
  if (modalOverlay) {
    if (immediate) {
      modalOverlay.remove();
      document.body.style.overflow = '';
      return;
    }
    modalOverlay.style.opacity = '0';
    closeTimeout = setTimeout(() => {
      modalOverlay.remove();
      document.body.style.overflow = '';
      closeTimeout = null;
    }, 200);
  }
}

export function handlePostAuthCompletion(user, customOptions = null) {
  if (user && user.role === 'admin') {
    if (window.router) {
      window.router.navigate('#admin');
    } else {
      window.location.hash = '#admin';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
    return;
  }

  // Ensure login modal is closed
  closeAuthModal(true);

  const pending = getPendingAuthAction() || customOptions || {};
  clearPendingAuthAction();

  // 1. Buy Now action
  if (pending.action === 'buy_now') {
    const qty = Number(pending.quantity) || 1;
    if (pending.productId) {
      state.addToCart(pending.productId, qty, pending.productData, true);
    }
    showToast('Signed in successfully! Continuing to checkout... ➔', 'success');
    window.location.hash = '#checkout-address';
    return;
  }

  // 2. Add to Cart action
  if (pending.action === 'add_to_cart') {
    const qty = Number(pending.quantity) || 1;
    if (pending.productId) {
      state.addToCart(pending.productId, qty, pending.productData, false);
      showToast(`Signed in! Added ${qty} × laptop to your cart 🛒`, 'success');
    }
    const targetHash = pending.returnHash || '#store';
    window.location.hash = targetHash;
    return;
  }

  // 3. Wishlist action
  if (pending.action === 'wishlist') {
    if (pending.productId) {
      state.toggleWishlist(pending.productId);
      api.toggleWishlist(pending.productId).catch(() => {});
      showToast('Signed in! Laptop saved to your wishlist ❤️', 'success');
    }
    const targetHash = pending.returnHash || '#store';
    window.location.hash = targetHash;
    return;
  }

  // 4. Explicit redirect (Never redirect to auth screens, #my-orders, or #user-dashboard)
  const authScreens = ['#login', '#signin', '#register', '#signup', '#user-dashboard', '#my-orders'];
  if (pending.redirectHash && !authScreens.includes(pending.redirectHash)) {
    window.location.hash = pending.redirectHash;
    return;
  }

  // 5. Return hash
  if (pending.returnHash && !authScreens.includes(pending.returnHash) && !pending.returnHash.startsWith('#google-callback') && !pending.returnHash.startsWith('#auth-callback')) {
    window.location.hash = pending.returnHash;
    return;
  }

  // Default fallback: Always continue to Store page!
  window.location.hash = '#store';
}

/**
 * Country Selection Modal for Google authentication & region configuration.
 * Always prompted on Google Sign-In (both first-time and returning after logout).
 * - India -> country: India, currency: INR, symbol: ₹, code: IN
 * - UAE -> country: UAE, currency: AED, symbol: AED / د.إ, code: AE
 */
export function openCountrySelectModal(user, onSelected) {
  let modalOverlay = document.getElementById('auth-modal-overlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'auth-modal-overlay';
    modalOverlay.className = 'auth-modal-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(6px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      opacity: 1;
      transition: opacity 0.25s ease;
    `;
    document.body.appendChild(modalOverlay);
  } else {
    modalOverlay.style.display = 'flex';
    modalOverlay.style.opacity = '1';
  }

  document.body.style.overflow = 'hidden';

  modalOverlay.innerHTML = `
    <div class="auth-modal-card country-modal-card" style="background: #ffffff; border-radius: 20px; width: 100%; max-width: 440px; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.05); position: relative; padding: 2.2rem 1.9rem; animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
      
      <div style="width: 58px; height: 58px; background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; font-size: 28px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);">
        🌍
      </div>

      <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.45rem 0; letter-spacing: -0.025em;">
        Choose Your Country
      </h2>
      
      <p style="font-size: 0.88rem; color: #64748b; margin: 0 0 1.6rem 0; line-height: 1.45;">
        Select your country to set the correct laptop currency.
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 0.5rem;">
        
        <!-- India Option -->
        <button type="button" id="btn-country-india" class="country-option-btn" style="width: 100%; padding: 1rem 1.25rem; border: 2px solid #e2e8f0; border-radius: 14px; background: #ffffff; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease; text-align: left; outline: none; box-sizing: border-box;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <span style="font-size: 2rem; line-height: 1;">🇮🇳</span>
            <div>
              <div style="font-size: 1.05rem; font-weight: 700; color: #0f172a;">India (+91)</div>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px; font-weight: 500;">Currency: <strong style="color: #ea580c;">₹ INR</strong> (Indian Rupee)</div>
            </div>
          </div>
          <span style="font-size: 1.25rem; color: #94a3b8; font-weight: 700; transition: transform 0.2s ease;">➔</span>
        </button>

        <!-- UAE Option -->
        <button type="button" id="btn-country-uae" class="country-option-btn" style="width: 100%; padding: 1rem 1.25rem; border: 2px solid #e2e8f0; border-radius: 14px; background: #ffffff; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease; text-align: left; outline: none; box-sizing: border-box;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <span style="font-size: 2rem; line-height: 1;">🇦🇪</span>
            <div>
              <div style="font-size: 1.05rem; font-weight: 700; color: #0f172a;">UAE (+971)</div>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px; font-weight: 500;">Currency: <strong style="color: #ea580c;">د.إ / AED</strong> (Dirham)</div>
            </div>
          </div>
          <span style="font-size: 1.25rem; color: #94a3b8; font-weight: 700; transition: transform 0.2s ease;">➔</span>
        </button>

      </div>

      <div id="country-select-error" style="display: none; padding: 0.6rem 0.8rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.84rem; margin-top: 1rem; font-weight: 600; text-align: left;"></div>
    </div>
  `;

  const indiaBtn = document.getElementById('btn-country-india');
  const uaeBtn = document.getElementById('btn-country-uae');
  const errorEl = document.getElementById('country-select-error');

  const setupBtnStyle = (btn) => {
    if (!btn) return;
    btn.addEventListener('mouseenter', () => {
      btn.style.borderColor = '#ea580c';
      btn.style.backgroundColor = '#fff7ed';
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 8px 20px rgba(234, 88, 12, 0.12)';
      const arrow = btn.querySelector('span:last-child');
      if (arrow) {
        arrow.style.color = '#ea580c';
        arrow.style.transform = 'translateX(3px)';
      }
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.borderColor = '#e2e8f0';
      btn.style.backgroundColor = '#ffffff';
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = 'none';
      const arrow = btn.querySelector('span:last-child');
      if (arrow) {
        arrow.style.color = '#94a3b8';
        arrow.style.transform = 'translateX(0)';
      }
    });
  };

  setupBtnStyle(indiaBtn);
  setupBtnStyle(uaeBtn);

  const chooseCountry = async (choice) => {
    try {
      if (indiaBtn) indiaBtn.disabled = true;
      if (uaeBtn) uaeBtn.disabled = true;
      if (errorEl) errorEl.style.display = 'none';

      // Save country & currency to server
      const res = await api.setCountry({ country: choice.country, currency: choice.currency });
      const updatedUser = res.user || {
        ...user,
        country: choice.country,
        currency: choice.currency,
        currencySymbol: choice.symbol
      };

      const token = res.token || auth.getToken();
      auth.setSession(token, updatedUser);
      state.setRegion(choice.code);

      // Close modal immediately
      closeAuthModal(true);

      if (typeof onSelected === 'function') {
        onSelected(updatedUser);
      }
    } catch (err) {
      if (indiaBtn) indiaBtn.disabled = false;
      if (uaeBtn) uaeBtn.disabled = false;
      if (errorEl) {
        errorEl.textContent = err.message || 'Failed to save country selection. Please try again.';
        errorEl.style.display = 'block';
      }
    }
  };

  if (indiaBtn) {
    indiaBtn.addEventListener('click', () => {
      chooseCountry({ country: 'India', currency: 'INR', symbol: '₹', code: 'IN' });
    });
  }

  if (uaeBtn) {
    uaeBtn.addEventListener('click', () => {
      chooseCountry({ country: 'UAE', currency: 'AED', symbol: 'AED', code: 'AE' });
    });
  }
}

/**
 * Handle Google Authentication Completion
 * - Closes login modal
 * - ALWAYS displays the "Choose Your Country" modal (India / UAE) before entering Store
 * - Does NOT skip country selection on returning logins
 * - Updates user profile and region state, then shows toast and navigates to Store
 */
export function handleGoogleAuthSuccess(user, token, onComplete = null) {
  // 1. Immediately close any open login modal
  closeAuthModal(true);

  if (token && user) {
    auth.setSession(token, user);
  }

  const currentUser = user || auth.getUser();

  // ALWAYS prompt the Country Selection Modal ("Choose Your Country") for every Google login
  openCountrySelectModal(currentUser, (updatedUser) => {
    // Show: "Login successful! Welcome to LapZon."
    showAuthSuccessNotification(false, () => {
      if (typeof onComplete === 'function') {
        onComplete(updatedUser);
      } else {
        window.location.hash = '#store';
      }
    });
  });
}

export function openAuthModal(initialTab = 'login', options = {}) {
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }
  if (typeof window !== 'undefined' && (window.location.hash.startsWith('#register') || window.location.hash.startsWith('#signup'))) {
    activeTab = 'register';
  } else {
    activeTab = initialTab;
  }
  authOptions = {
    returnHash: window.location.hash || '#welcome',
    ...options
  };
  isPasswordVisible = false;
  isConfirmPasswordVisible = false;
  isNewPasswordVisible = false;
  isConfirmNewPasswordVisible = false;

  resetRegistrationState();
  resetForgotState();
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
      box-sizing: border-box;
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

function formatOtpCountdown(seconds) {
  if (seconds <= 0) return 'Code expired';
  if (seconds === 60) return '0:60';
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

// Timer helpers for Register OTP View
function startOtpTimer(durationSeconds = 60) {
  if (otpTimerInterval) clearInterval(otpTimerInterval);
  otpTimeRemaining = durationSeconds;
  updateOtpTimerDisplay();

  otpTimerInterval = setInterval(() => {
    otpTimeRemaining--;
    updateOtpTimerDisplay();
    if (otpTimeRemaining <= 0) {
      clearInterval(otpTimerInterval);
      const timerEl = document.getElementById('auth-otp-timer-wrap');
      if (timerEl) {
        timerEl.innerHTML = `<span style="color: #dc2626; font-weight: 700;">Code expired</span>`;
      }
      const errorMsg = document.getElementById('auth-otp-error-msg');
      if (errorMsg) {
        errorMsg.textContent = 'Verification code expired. Please request a new verification code.';
        errorMsg.style.display = 'block';
      }
      const resendBtn = document.getElementById('btn-resend-otp');
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.style.cursor = 'pointer';
        resendBtn.style.color = '#ea580c';
        resendBtn.textContent = 'Resend Code';
      }
      const verifySubmitBtn = document.getElementById('btn-verify-otp-submit');
      if (verifySubmitBtn) {
        verifySubmitBtn.disabled = true;
        verifySubmitBtn.style.opacity = '0.6';
      }
    }
  }, 1000);
}

function updateOtpTimerDisplay() {
  const timerWrap = document.getElementById('auth-otp-timer-wrap');
  if (!timerWrap) return;
  if (otpTimeRemaining > 0) {
    timerWrap.innerHTML = `Code expires in <strong style="color: #ea580c; font-weight: 700;">${formatOtpCountdown(otpTimeRemaining)}</strong>`;
  } else {
    timerWrap.innerHTML = `<span style="color: #dc2626; font-weight: 700;">Code expired</span>`;
  }
}

function startResendCooldown(cooldownSeconds = 60) {
  if (resendCooldownInterval) clearInterval(resendCooldownInterval);
  resendCooldownRemaining = cooldownSeconds;
  updateResendTimerDisplay();

  resendCooldownInterval = setInterval(() => {
    resendCooldownRemaining--;
    updateResendTimerDisplay();
    if (resendCooldownRemaining <= 0) {
      clearInterval(resendCooldownInterval);
      const resendBtn = document.getElementById('btn-resend-otp');
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.style.cursor = 'pointer';
        resendBtn.style.color = '#ea580c';
        resendBtn.textContent = 'Resend Code';
      }
    }
  }, 1000);
}

function updateResendTimerDisplay() {
  const resendBtn = document.getElementById('btn-resend-otp');
  if (!resendBtn) return;
  if (resendCooldownRemaining > 0 && otpTimeRemaining > 0) {
    resendBtn.disabled = true;
    resendBtn.style.cursor = 'not-allowed';
    resendBtn.style.color = '#94a3b8';
    resendBtn.textContent = `Resend in ${resendCooldownRemaining}s`;
  } else {
    resendBtn.disabled = false;
    resendBtn.style.cursor = 'pointer';
    resendBtn.style.color = '#ea580c';
    resendBtn.textContent = 'Resend Code';
  }
}

// Timer helpers for Forgot Password OTP View
function startResetOtpTimers(otpDuration = 60, cooldownDuration = 60) {
  if (resetOtpTimerInterval) clearInterval(resetOtpTimerInterval);
  if (resetResendCooldownInterval) clearInterval(resetResendCooldownInterval);

  resetOtpTimeRemaining = otpDuration;
  resetResendCooldownRemaining = cooldownDuration;

  updateResetTimerDisplay();
  updateResetResendDisplay();

  resetOtpTimerInterval = setInterval(() => {
    resetOtpTimeRemaining--;
    updateResetTimerDisplay();
    if (resetOtpTimeRemaining <= 0) {
      clearInterval(resetOtpTimerInterval);
      if (resetResendCooldownInterval) clearInterval(resetResendCooldownInterval);
      resetResendCooldownRemaining = 0;

      const timerEl = document.getElementById('auth-reset-timer-wrap');
      if (timerEl) {
        timerEl.innerHTML = `<span style="color: #dc2626; font-weight: 700;">Code expired</span>`;
      }
      const errorMsg = document.getElementById('auth-reset-error-msg');
      if (errorMsg) {
        errorMsg.textContent = 'Verification code expired. Please click Resend Code to receive a new code.';
        errorMsg.style.display = 'block';
      }
      const resendBtn = document.getElementById('btn-resend-reset-otp');
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.style.cursor = 'pointer';
        resendBtn.style.color = '#ea580c';
        resendBtn.textContent = 'Resend Code';
      }
      const verifyBtn = document.getElementById('btn-verify-reset-code');
      if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.style.opacity = '0.6';
      }
    }
  }, 1000);

  resetResendCooldownInterval = setInterval(() => {
    resetResendCooldownRemaining--;
    updateResetResendDisplay();
    if (resetResendCooldownRemaining <= 0) {
      clearInterval(resetResendCooldownInterval);
      const resendBtn = document.getElementById('btn-resend-reset-otp');
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.style.cursor = 'pointer';
        resendBtn.style.color = '#ea580c';
        resendBtn.textContent = 'Resend Code';
      }
    }
  }, 1000);
}

function updateResetTimerDisplay() {
  const timerWrap = document.getElementById('auth-reset-timer-wrap');
  if (!timerWrap) return;
  if (resetOtpTimeRemaining > 0) {
    timerWrap.innerHTML = `Code expires in <strong style="color: #ea580c; font-weight: 700;">${formatOtpCountdown(resetOtpTimeRemaining)}</strong>`;
  } else {
    timerWrap.innerHTML = `<span style="color: #dc2626; font-weight: 700;">Code expired</span>`;
  }
}

function updateResetResendDisplay() {
  const resendBtn = document.getElementById('btn-resend-reset-otp');
  if (!resendBtn) return;
  if (resetResendCooldownRemaining > 0 && resetOtpTimeRemaining > 0) {
    resendBtn.disabled = true;
    resendBtn.style.cursor = 'not-allowed';
    resendBtn.style.color = '#94a3b8';
    resendBtn.textContent = `Resend in ${resetResendCooldownRemaining}s`;
  } else {
    resendBtn.disabled = false;
    resendBtn.style.cursor = 'pointer';
    resendBtn.style.color = '#ea580c';
    resendBtn.textContent = 'Resend Code';
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function renderAuthModalContent() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (!overlay) return;

  const currentConfig = COUNTRY_PHONE_CONFIG[selectedCountryCode] || COUNTRY_PHONE_CONFIG.IN;

  const isRegister = activeTab === 'register';
  const isLogin = activeTab === 'login';
  const isOtpVerify = activeTab === 'otp_verify';
  const isForgotStep1 = activeTab === 'forgot_step1' || activeTab === 'forgot';
  const isForgotStep2 = activeTab === 'forgot_step2';
  const isForgotStep3 = activeTab === 'forgot_step3';
  const isForgotStep4 = activeTab === 'forgot_step4';

  // -------------------------------------------------------------
  // VIEW: Registration OTP Verification Screen
  // -------------------------------------------------------------
  if (isOtpVerify) {
    const destEmail = pendingRegistrationData ? pendingRegistrationData.email : '';
    overlay.innerHTML = `
      <div class="auth-modal-card" style="background: #ffffff; border-radius: 20px; width: 100%; max-width: 440px; max-height: 94vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.05); position: relative; padding: 2rem 1.85rem; animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <!-- Close Button -->
        <button type="button" id="btn-close-auth-modal" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; font-size: 1.3rem; line-height: 1; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #94a3b8; transition: color 0.15s ease;" aria-label="Close modal">✕</button>

        <div style="text-align: center; margin-bottom: 1.25rem;">
          <div style="width: 56px; height: 56px; background: #fff7ed; border: 2px solid #ffedd5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 26px;">
            ✉️
          </div>
          <h2 style="font-size: 1.55rem; font-weight: 800; color: #1e293b; margin: 0 0 0.4rem 0; letter-spacing: -0.025em;">
            Verify your email
          </h2>
          <p style="font-size: 0.88rem; color: #64748b; margin: 0; line-height: 1.5;">
            We sent a verification code to<br/>
            <strong style="color: #0f172a; word-break: break-all;">${escapeHtml(destEmail)}</strong>
          </p>
        </div>

        <form id="auth-otp-form" autocomplete="off" style="margin: 0;">
          <div class="form-group" style="margin-bottom: 1.15rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 0.45rem; text-align: center;">Enter 6-digit code</label>
            <input 
              type="text" 
              id="auth-otp-input" 
              maxlength="6" 
              inputmode="numeric" 
              pattern="[0-9]*" 
              placeholder="••••••" 
              autocomplete="one-time-code" 
              required 
              style="width: 100%; padding: 0.85rem 1rem; border: 2px solid #cbd5e1; border-radius: 12px; font-size: 1.7rem; letter-spacing: 12px; text-align: center; color: #0f172a; font-family: 'Courier New', Courier, monospace; outline: none; box-sizing: border-box; transition: all 0.2s ease; background: #f8fafc;" 
            />
          </div>

          <!-- Timer & Resend Status -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; color: #64748b; margin-bottom: 1.15rem; padding: 0 4px;">
            <span id="auth-otp-timer-wrap">Code expires in <strong style="color: #ea580c; font-weight: 700;">0:60</strong></span>
            <button type="button" id="btn-resend-otp" disabled style="background: none; border: none; font-size: 0.82rem; font-weight: 700; color: #94a3b8; cursor: not-allowed; padding: 0; transition: color 0.2s;">Resend in 60s</button>
          </div>

          <!-- Error Message Container -->
          <div id="auth-otp-error-msg" style="display: none; padding: 0.55rem 0.75rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.82rem; margin-bottom: 0.85rem; font-weight: 600;"></div>

          <!-- Submit Button -->
          <button type="submit" id="btn-verify-otp-submit" style="width: 100%; padding: 0.82rem; border-radius: 10px; font-weight: 700; font-size: 0.98rem; background: #ea580c; color: #ffffff; border: none; cursor: pointer; transition: background-color 0.2s ease, transform 0.1s ease; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);">
            Verify & Create account
          </button>

          <!-- Edit Link -->
          <div style="text-align: center; margin-top: 1.15rem; font-size: 0.86rem; color: #64748b;">
            <a href="#" id="auth-back-to-register" style="color: #64748b; text-decoration: none; font-weight: 600;">← Edit registration details</a>
          </div>
        </form>
      </div>
    `;

    attachOtpVerifyEvents();
    return;
  }

  // -------------------------------------------------------------
  // VIEW: Forgot Password Step 1 (Enter Registered Email)
  // -------------------------------------------------------------
  if (isForgotStep1) {
    overlay.innerHTML = `
      <div class="auth-modal-card" style="background: #ffffff; border-radius: 20px; width: 100%; max-width: 440px; max-height: 94vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.05); position: relative; padding: 2rem 1.85rem; animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <!-- Close Button -->
        <button type="button" id="btn-close-auth-modal" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; font-size: 1.3rem; line-height: 1; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #94a3b8; transition: color 0.15s ease;" aria-label="Close modal">✕</button>

        <div style="text-align: center; margin-bottom: 1.35rem;">
          <div style="width: 56px; height: 56px; background: #fff7ed; border: 2px solid #ffedd5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 26px;">
            🔑
          </div>
          <h2 style="font-size: 1.55rem; font-weight: 800; color: #1e293b; margin: 0 0 0.4rem 0; letter-spacing: -0.025em;">
            Forgot Your Password?
          </h2>
          <p style="font-size: 0.88rem; color: #64748b; margin: 0; line-height: 1.5;">
            Enter your registered email address to receive a verification code.
          </p>
        </div>

        <form id="auth-forgot-step1-form" novalidate style="margin: 0;">
          <div class="form-group" style="margin-bottom: 1.15rem;">
            <label for="auth-reset-email-input" style="display: block; font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 0.35rem;">Email Address <span style="color: #ea580c;">*</span></label>
            <input 
              type="email" 
              id="auth-reset-email-input" 
              value="${escapeHtml(currentResetEmail)}"
              placeholder="name@example.com" 
              required 
              autocomplete="email" 
              style="width: 100%; padding: 0.72rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.92rem; color: #1e293b; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;" 
            />
          </div>

          <!-- Error Message Container -->
          <div id="auth-reset-error-msg" style="display: none; padding: 0.55rem 0.75rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.82rem; margin-bottom: 0.85rem; font-weight: 600;"></div>

          <!-- Submit Button -->
          <button type="submit" id="btn-send-reset-code" style="width: 100%; padding: 0.82rem; border-radius: 10px; font-weight: 700; font-size: 0.98rem; background: #ea580c; color: #ffffff; border: none; cursor: pointer; transition: background-color 0.2s ease, transform 0.1s ease; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);">
            ✉️ Send Verification Code
          </button>

          <!-- Back to Sign In -->
          <div style="text-align: center; margin-top: 1.15rem; font-size: 0.86rem; color: #64748b;">
            <a href="#" id="link-back-to-login" style="color: #64748b; text-decoration: none; font-weight: 600;">← Back to Sign In</a>
          </div>
        </form>
      </div>
    `;

    attachForgotStep1Events();
    return;
  }

  // -------------------------------------------------------------
  // VIEW: Forgot Password Step 2 (Enter Verification Code)
  // -------------------------------------------------------------
  if (isForgotStep2) {
    overlay.innerHTML = `
      <div class="auth-modal-card" style="background: #ffffff; border-radius: 20px; width: 100%; max-width: 440px; max-height: 94vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.05); position: relative; padding: 2rem 1.85rem; animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <!-- Close Button -->
        <button type="button" id="btn-close-auth-modal" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; font-size: 1.3rem; line-height: 1; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #94a3b8; transition: color 0.15s ease;" aria-label="Close modal">✕</button>

        <div style="text-align: center; margin-bottom: 1.25rem;">
          <div style="width: 56px; height: 56px; background: #eff6ff; border: 2px solid #dbeafe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 26px;">
            ✉️
          </div>
          <h2 style="font-size: 1.55rem; font-weight: 800; color: #1e293b; margin: 0 0 0.4rem 0; letter-spacing: -0.025em;">
            Enter Verification Code
          </h2>
          <p style="font-size: 0.88rem; color: #64748b; margin: 0; line-height: 1.5;">
            We sent a 6-digit verification code to<br/>
            <strong style="color: #0f172a; word-break: break-all;">${escapeHtml(currentResetEmail)}</strong>
          </p>
        </div>

        <form id="auth-forgot-step2-form" autocomplete="off" style="margin: 0;">
          <div class="form-group" style="margin-bottom: 1.15rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 0.45rem; text-align: center;">Enter 6-digit code</label>
            <input 
              type="text" 
              id="auth-reset-otp-input" 
              maxlength="6" 
              inputmode="numeric" 
              pattern="[0-9]*" 
              placeholder="••••••" 
              autocomplete="one-time-code" 
              required 
              style="width: 100%; padding: 0.85rem 1rem; border: 2px solid #cbd5e1; border-radius: 12px; font-size: 1.7rem; letter-spacing: 12px; text-align: center; color: #0f172a; font-family: 'Courier New', Courier, monospace; outline: none; box-sizing: border-box; transition: all 0.2s ease; background: #f8fafc;" 
            />
          </div>

          <!-- Timer & Resend Status -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; color: #64748b; margin-bottom: 1.15rem; padding: 0 4px;">
            <span id="auth-reset-timer-wrap">Code expires in <strong style="color: #ea580c; font-weight: 700;">0:60</strong></span>
            <button type="button" id="btn-resend-reset-otp" disabled style="background: none; border: none; font-size: 0.82rem; font-weight: 700; color: #94a3b8; cursor: not-allowed; padding: 0; transition: color 0.2s;">Resend in 60s</button>
          </div>

          <!-- Error Message Container -->
          <div id="auth-reset-error-msg" style="display: none; padding: 0.55rem 0.75rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.82rem; margin-bottom: 0.85rem; font-weight: 600;"></div>

          <!-- Submit Button -->
          <button type="submit" id="btn-verify-reset-code" style="width: 100%; padding: 0.82rem; border-radius: 10px; font-weight: 700; font-size: 0.98rem; background: #ea580c; color: #ffffff; border: none; cursor: pointer; transition: background-color 0.2s ease, transform 0.1s ease; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);">
            🔐 Verify Code
          </button>

          <!-- Edit Link -->
          <div style="text-align: center; margin-top: 1.15rem; font-size: 0.86rem; color: #64748b;">
            <a href="#" id="link-reset-change-email" style="color: #64748b; text-decoration: none; font-weight: 600;">← Change Email / Start Over</a>
          </div>
        </form>
      </div>
    `;

    attachForgotStep2Events();
    return;
  }

  // -------------------------------------------------------------
  // VIEW: Forgot Password Step 3 (Create New Password)
  // -------------------------------------------------------------
  if (isForgotStep3) {
    overlay.innerHTML = `
      <div class="auth-modal-card" style="background: #ffffff; border-radius: 20px; width: 100%; max-width: 440px; max-height: 94vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.05); position: relative; padding: 2rem 1.85rem; animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <!-- Close Button -->
        <button type="button" id="btn-close-auth-modal" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; font-size: 1.3rem; line-height: 1; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #94a3b8; transition: color 0.15s ease;" aria-label="Close modal">✕</button>

        <div style="text-align: center; margin-bottom: 1.25rem;">
          <div style="width: 56px; height: 56px; background: #f0fdf4; border: 2px solid #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 26px;">
            🔒
          </div>
          <h2 style="font-size: 1.55rem; font-weight: 800; color: #1e293b; margin: 0 0 0.4rem 0; letter-spacing: -0.025em;">
            Create New Password
          </h2>
          <p style="font-size: 0.88rem; color: #64748b; margin: 0; line-height: 1.5;">
            Enter a strong new password for your LapZon account.
          </p>
        </div>

        <form id="auth-forgot-step3-form" novalidate style="margin: 0;">
          <!-- 1. New Password -->
          <div class="form-group" style="margin-bottom: 0.95rem;">
            <label for="auth-reset-pass-input" style="display: block; font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 0.35rem;">New Password <span style="color: #ea580c;">*</span></label>
            <div style="position: relative; display: flex; align-items: center; width: 100%;">
              <input 
                type="${isNewPasswordVisible ? 'text' : 'password'}" 
                id="auth-reset-pass-input" 
                placeholder="Minimum 6 characters" 
                required 
                autocomplete="new-password"
                style="width: 100%; padding: 0.72rem 2.65rem 0.72rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.92rem; color: #1e293b; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;" 
              />
              <button 
                type="button" 
                id="btn-toggle-reset-pass" 
                aria-label="${isNewPasswordVisible ? 'Hide password' : 'Show password'}" 
                title="${isNewPasswordVisible ? 'Hide password' : 'Show password'}" 
                tabindex="-1"
                style="position: absolute; right: 10px; background: transparent; border: none; cursor: pointer; color: #64748b; padding: 4px; display: flex; align-items: center; justify-content: center; height: 100%;"
              >
                ${isNewPasswordVisible ? EYE_SLASH_SVG : EYE_OPEN_SVG}
              </button>
            </div>
          </div>

          <!-- 2. Confirm New Password -->
          <div class="form-group" style="margin-bottom: 1.15rem;">
            <label for="auth-reset-confirm-pass-input" style="display: block; font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 0.35rem;">Confirm New Password <span style="color: #ea580c;">*</span></label>
            <div style="position: relative; display: flex; align-items: center; width: 100%;">
              <input 
                type="${isConfirmNewPasswordVisible ? 'text' : 'password'}" 
                id="auth-reset-confirm-pass-input" 
                placeholder="Re-enter new password" 
                required 
                autocomplete="new-password"
                style="width: 100%; padding: 0.72rem 2.65rem 0.72rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.92rem; color: #1e293b; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;" 
              />
              <button 
                type="button" 
                id="btn-toggle-reset-confirm-pass" 
                aria-label="${isConfirmNewPasswordVisible ? 'Hide password' : 'Show password'}" 
                title="${isConfirmNewPasswordVisible ? 'Hide password' : 'Show password'}" 
                tabindex="-1"
                style="position: absolute; right: 10px; background: transparent; border: none; cursor: pointer; color: #64748b; padding: 4px; display: flex; align-items: center; justify-content: center; height: 100%;"
              >
                ${isConfirmNewPasswordVisible ? EYE_SLASH_SVG : EYE_OPEN_SVG}
              </button>
            </div>
          </div>

          <!-- Error Message Container -->
          <div id="auth-reset-error-msg" style="display: none; padding: 0.55rem 0.75rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.82rem; margin-bottom: 0.85rem; font-weight: 600;"></div>

          <!-- Submit Button -->
          <button type="submit" id="btn-submit-reset-pass" style="width: 100%; padding: 0.82rem; border-radius: 10px; font-weight: 700; font-size: 0.98rem; background: #ea580c; color: #ffffff; border: none; cursor: pointer; transition: background-color 0.2s ease, transform 0.1s ease; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);">
            🔒 Reset Password
          </button>

          <!-- Back to Sign In -->
          <div style="text-align: center; margin-top: 1.15rem; font-size: 0.86rem; color: #64748b;">
            <a href="#" id="link-back-to-login" style="color: #64748b; text-decoration: none; font-weight: 600;">← Cancel & Return to Sign In</a>
          </div>
        </form>
      </div>
    `;

    attachForgotStep3Events();
    return;
  }

  // -------------------------------------------------------------
  // VIEW: Forgot Password Step 4 (Password Reset Success)
  // -------------------------------------------------------------
  if (isForgotStep4) {
    overlay.innerHTML = `
      <div class="auth-modal-card" style="background: #ffffff; border-radius: 20px; width: 100%; max-width: 440px; max-height: 94vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.05); position: relative; padding: 2.2rem 1.85rem; animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
        
        <!-- Close Button -->
        <button type="button" id="btn-close-auth-modal" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; font-size: 1.3rem; line-height: 1; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #94a3b8; transition: color 0.15s ease;" aria-label="Close modal">✕</button>

        <div style="width: 64px; height: 64px; background: #f0fdf4; border: 2px solid #86efac; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 30px; color: #16a34a; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.15);">
          ✓
        </div>

        <h2 style="font-size: 1.55rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; letter-spacing: -0.025em;">
          Password reset successfully!
        </h2>
        
        <p style="font-size: 0.88rem; color: #64748b; margin: 0 0 1.6rem 0; line-height: 1.5;">
          Your password has been updated securely.<br/>
          You can now log in to LapZon with your new password.
        </p>

        <button type="button" id="btn-reset-back-to-login" style="width: 100%; padding: 0.85rem; border-radius: 10px; font-weight: 700; font-size: 0.98rem; background: #ea580c; color: #ffffff; border: none; cursor: pointer; transition: background-color 0.2s ease, transform 0.1s ease; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);">
          🔐 Back to Sign In
        </button>
      </div>
    `;

    attachForgotStep4Events();
    return;
  }

  // -------------------------------------------------------------
  // VIEW: Login or Register Form
  // -------------------------------------------------------------
  const modalTitle = isLogin ? 'Log in' : 'Create account';
  const submitText = isLogin ? 'Log in' : 'Create account';
  const googleText = isRegister ? 'Sign up with Google' : 'Continue with Google';

  const prefillName = pendingRegistrationData?.name || '';
  const prefillEmail = pendingRegistrationData?.email || currentResetEmail || '';
  let prefillPhone = '';
  if (pendingRegistrationData?.phone) {
    prefillPhone = pendingRegistrationData.phone.replace(/^\+\d{2,3}/, '');
  }

  overlay.innerHTML = `
    <div class="auth-modal-card" style="background: #ffffff; border-radius: 20px; width: 100%; max-width: 440px; max-height: 94vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.05); position: relative; padding: 1.8rem 1.85rem; animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      
      <!-- Close Button -->
      <button type="button" id="btn-close-auth-modal" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; font-size: 1.3rem; line-height: 1; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #94a3b8; transition: color 0.15s ease;" aria-label="Close modal">✕</button>

      <!-- Title -->
      <h2 style="font-size: 1.55rem; font-weight: 800; color: #1e293b; margin: 0 0 ${authOptions?.subtitle ? '0.35rem' : '1.15rem'}; letter-spacing: -0.025em;">
        ${modalTitle}
      </h2>
      ${authOptions?.subtitle ? `
        <p style="font-size: 0.86rem; color: #ea580c; margin: 0 0 1rem 0; font-weight: 600; line-height: 1.4;">
          ${escapeHtml(authOptions.subtitle)}
        </p>
      ` : ''}

      <!-- Official Google OAuth 2.0 Button -->
      <button type="button" id="btn-google-signin" style="width: 100%; padding: 0.65rem 1rem; border-radius: 10px; font-weight: 600; font-size: 0.92rem; background: #ffffff; color: #1e293b; border: 1.5px solid #cbd5e1; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 1.15rem; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>${googleText}</span>
      </button>

      <!-- OR Divider -->
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1.1rem;">
        <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
        <span style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">OR</span>
        <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
      </div>

      <!-- Main Form -->
      <form id="auth-main-form" autocomplete="off" style="margin: 0;">
        <!-- 1. Full Name (Active on Create account) -->
        ${isRegister ? `
          <div class="form-group" style="margin-bottom: 0.82rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 0.3rem;">Full Name</label>
            <input 
              type="text" 
              id="auth-name-input" 
              value="${escapeHtml(prefillName)}"
              autocomplete="off"
              placeholder="e.g. Rahul Sharma" 
              required 
              style="width: 100%; padding: 0.65rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.92rem; color: #1e293b; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;" 
            />
          </div>
        ` : ''}

        <!-- 2. Email Address or Phone Number -->
        <div class="form-group" style="margin-bottom: 0.82rem;">
          <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 0.3rem;">${isRegister ? 'Email' : 'Email or Phone Number'}</label>
          <input 
            type="${isRegister ? 'email' : 'text'}" 
            id="auth-email-input" 
            value="${escapeHtml(prefillEmail)}"
            autocomplete="${isRegister ? 'off' : 'username'}"
            placeholder="${isRegister ? 'name@example.com' : 'name@example.com or mobile number'}" 
            required 
            style="width: 100%; padding: 0.65rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.92rem; color: #1e293b; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;" 
          />
        </div>

        ${isRegister ? `
        <!-- 3. Phone Number Field (Used to identify Country and Currency) -->
        <div class="form-group" id="auth-phone-group" style="margin-bottom: 0.82rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
            <label style="font-size: 0.85rem; font-weight: 700; color: #1e293b; margin: 0;">Phone Number</label>
            <span style="font-size: 0.72rem; color: #64748b;">For country & currency</span>
          </div>
          <div id="auth-phone-container" style="display: flex; align-items: center; border: 1.5px solid #cbd5e1; border-radius: 10px; background: #ffffff; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s;">
            <div style="display: flex; align-items: center; background: #f8fafc; border-right: 1.5px solid #cbd5e1; padding: 0 0.5rem; gap: 4px;">
              <span id="auth-dial-prefix" style="font-weight: 700; font-size: 0.9rem; color: #1e293b;">${currentConfig.dialCode}</span>
              <select 
                id="auth-dial-code" 
                title="Country code"
                style="padding: 0.65rem 0.2rem; border: none; font-weight: 700; font-size: 0.85rem; background: transparent; color: #475569; cursor: pointer; outline: none;"
              >
                <option value="IN" ${selectedCountryCode === 'IN' ? 'selected' : ''}>India (+91)</option>
                <option value="AE" ${selectedCountryCode === 'AE' ? 'selected' : ''}>UAE (+971)</option>
              </select>
            </div>
            <input 
              type="tel" 
              id="auth-phone-input" 
              value="${escapeHtml(prefillPhone)}" 
              autocomplete="off"
              placeholder="${currentConfig.placeholder}" 
              maxlength="${currentConfig.length}" 
              style="flex: 1; padding: 0.65rem 0.85rem; border: none; font-size: 0.92rem; color: #1e293b; outline: none; box-sizing: border-box; background: transparent;" 
            />
          </div>
          <div style="font-size: 0.74rem; color: #64748b; margin-top: 0.28rem; font-weight: 500;">
            📍 Region & Currency: <strong id="auth-phone-currency-hint" style="color: #ea580c;">${selectedCountryCode === 'AE' ? 'UAE (AED Dirhams)' : 'India (₹ INR)'}</strong>
          </div>
        </div>
        ` : ''}

        <!-- 4. Password -->
        <div class="form-group" style="margin-bottom: 0.82rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
            <label style="font-size: 0.85rem; font-weight: 700; color: #1e293b; margin: 0;">Password</label>
          </div>
          <div style="position: relative; display: flex; align-items: center; width: 100%;">
            <input 
              type="${isPasswordVisible ? 'text' : 'password'}" 
              id="auth-pass-input" 
              value="${escapeHtml(pendingRegistrationData?.password || '')}"
              autocomplete="${isRegister ? 'new-password' : 'current-password'}"
              placeholder="Enter password" 
              required 
              style="width: 100%; padding: 0.65rem 2.5rem 0.65rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.92rem; color: #1e293b; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;" 
            />
            <button 
              type="button" 
              id="btn-toggle-show-pass" 
              aria-label="${isPasswordVisible ? 'Hide password' : 'Show password'}"
              title="${isPasswordVisible ? 'Hide password' : 'Show password'}" 
              tabindex="-1"
              style="position: absolute; right: 10px; background: transparent; border: none; cursor: pointer; color: #64748b; padding: 4px; display: flex; align-items: center; justify-content: center;"
            >
              ${isPasswordVisible ? EYE_SLASH_SVG : EYE_OPEN_SVG}
            </button>
          </div>
          ${isLogin ? `
            <div style="display: flex; justify-content: flex-end; margin-top: 0.35rem;">
              <a href="#" id="auth-forgot-link" style="font-size: 0.8rem; color: #ea580c; text-decoration: none; font-weight: 600; transition: color 0.15s;">Forgot Password?</a>
            </div>
          ` : ''}
        </div>

        <!-- 5. Confirm Password (Active on Create account) -->
        ${isRegister ? `
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 0.3rem;">Confirm Password</label>
            <div style="position: relative; display: flex; align-items: center; width: 100%;">
              <input 
                type="${isConfirmPasswordVisible ? 'text' : 'password'}" 
                id="auth-confirm-pass-input" 
                value="${escapeHtml(pendingRegistrationData?.confirmPassword || '')}"
                autocomplete="new-password"
                placeholder="Re-enter password" 
                required 
                style="width: 100%; padding: 0.65rem 2.5rem 0.65rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.92rem; color: #1e293b; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;" 
              />
              <button 
                type="button" 
                id="btn-toggle-show-confirm-pass" 
                aria-label="${isConfirmPasswordVisible ? 'Hide password' : 'Show password'}"
                title="${isConfirmPasswordVisible ? 'Hide password' : 'Show password'}" 
                tabindex="-1"
                style="position: absolute; right: 10px; background: transparent; border: none; cursor: pointer; color: #64748b; padding: 4px; display: flex; align-items: center; justify-content: center;"
              >
                ${isConfirmPasswordVisible ? EYE_SLASH_SVG : EYE_OPEN_SVG}
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Error Message Container -->
        <div id="auth-error-msg" style="display: none; padding: 0.55rem 0.75rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.82rem; margin-bottom: 0.85rem; font-weight: 600;"></div>

        <!-- Submit Button -->
        <button type="submit" id="btn-auth-submit" style="width: 100%; padding: 0.78rem; border-radius: 10px; font-weight: 700; font-size: 0.98rem; background: #1e293b; color: #ffffff; border: none; cursor: pointer; transition: background-color 0.2s ease, transform 0.1s ease; box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2);">
          ${submitText}
        </button>

        <!-- Footer Switching Link -->
        <div style="text-align: center; margin-top: 1.15rem; font-size: 0.86rem; color: #64748b;">
          ${isLogin ? `
            Don't have an account? <a href="#" id="auth-switch-register" style="color: #ea580c; font-weight: 700; text-decoration: none; margin-left: 3px;">Create account</a>
          ` : `
            Already have an account? <a href="#" id="auth-switch-login" style="color: #ea580c; font-weight: 700; text-decoration: none; margin-left: 3px;">Log in</a>
          `}
        </div>
      </form>
    </div>
  `;

  attachModalEvents();
}

function attachOtpVerifyEvents() {
  const overlay = document.getElementById('auth-modal-overlay');
  const closeBtn = document.getElementById('btn-close-auth-modal');
  const otpForm = document.getElementById('auth-otp-form');
  const otpInput = document.getElementById('auth-otp-input');
  const resendBtn = document.getElementById('btn-resend-otp');
  const backBtn = document.getElementById('auth-back-to-register');
  const otpErrorMsg = document.getElementById('auth-otp-error-msg');
  const verifySubmitBtn = document.getElementById('btn-verify-otp-submit');

  if (closeBtn) closeBtn.addEventListener('click', () => closeAuthModal());
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });
  }

  // Start live timers
  startOtpTimer(otpTimeRemaining || 60);
  startResendCooldown(resendCooldownRemaining || 60);

  // Auto-focus and filter digits
  if (otpInput) {
    otpInput.focus();
    otpInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
      if (e.target.value.length === 6) {
        e.target.style.borderColor = '#ea580c';
        e.target.style.background = '#ffffff';
      } else {
        e.target.style.borderColor = '#cbd5e1';
        e.target.style.background = '#f8fafc';
      }
    });
  }

  // Back to edit registration details
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (otpTimerInterval) clearInterval(otpTimerInterval);
      if (resendCooldownInterval) clearInterval(resendCooldownInterval);
      activeTab = 'register';
      renderAuthModalContent();
    });
  }

  // Resend OTP Handler
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      if (resendCooldownRemaining > 0 && otpTimeRemaining > 0) return;
      if (!pendingRegistrationData) return;

      try {
        resendBtn.disabled = true;
        resendBtn.textContent = 'Sending...';

        const res = await api.resendRegisterOtp({ email: pendingRegistrationData.email });
        showToast(res.message || 'New verification code sent to your email!', 'info');

        const verifySubmitBtn = document.getElementById('btn-verify-otp-submit');
        if (verifySubmitBtn) {
          verifySubmitBtn.disabled = false;
          verifySubmitBtn.style.opacity = '1';
        }

        startOtpTimer(60);
        startResendCooldown(60);

        if (otpErrorMsg) otpErrorMsg.style.display = 'none';
        if (otpInput) {
          otpInput.value = '';
          otpInput.focus();
        }
      } catch (err) {
        showToast(err.message || 'Could not resend OTP. Please try again.', 'error');
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend OTP';
      }
    });
  }

  // OTP Form Submission
  if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (otpErrorMsg) otpErrorMsg.style.display = 'none';

      if (otpTimeRemaining <= 0) {
        if (otpErrorMsg) {
          otpErrorMsg.textContent = 'OTP expired. Please request a new OTP.';
          otpErrorMsg.style.display = 'block';
        }
        return;
      }

      const enteredOtp = (otpInput?.value || '').trim();
      if (!enteredOtp || enteredOtp.length !== 6) {
        if (otpErrorMsg) {
          otpErrorMsg.textContent = 'Please enter the 6-digit verification code.';
          otpErrorMsg.style.display = 'block';
        }
        otpInput?.focus();
        return;
      }

      try {
        verifySubmitBtn.disabled = true;
        verifySubmitBtn.textContent = 'Verifying code...';

        const res = await api.verifyRegisterOtp({
          email: pendingRegistrationData.email,
          otp: enteredOtp
        });

        // Clear timers
        if (otpTimerInterval) clearInterval(otpTimerInterval);
        if (resendCooldownInterval) clearInterval(resendCooldownInterval);

        // Store session
        auth.setSession(res.token, res.user);
        if (res.user && res.user.country) {
          state.setRegion(res.user.country);
        } else if (pendingRegistrationData.country) {
          state.setRegion(pendingRegistrationData.country);
        }

        resetRegistrationState();
        closeAuthModal(true);
        showAuthSuccessNotification(false, () => {
          if (authOptions.onSuccess) authOptions.onSuccess(res.user);
          handlePostAuthCompletion(res.user, authOptions);
        });
      } catch (err) {
        if (otpErrorMsg) {
          otpErrorMsg.textContent = err.message || 'Invalid verification code. Please check and try again.';
          otpErrorMsg.style.display = 'block';
        }
        otpInput?.focus();
      } finally {
        verifySubmitBtn.disabled = false;
        verifySubmitBtn.textContent = 'Verify & Create account';
      }
    });
  }
}

// -------------------------------------------------------------
// EVENT ATTACHERS FOR FORGOT PASSWORD STEPS
// -------------------------------------------------------------

function attachForgotStep1Events() {
  const overlay = document.getElementById('auth-modal-overlay');
  const closeBtn = document.getElementById('btn-close-auth-modal');
  const form = document.getElementById('auth-forgot-step1-form');
  const emailInput = document.getElementById('auth-reset-email-input');
  const errorMsg = document.getElementById('auth-reset-error-msg');
  const sendBtn = document.getElementById('btn-send-reset-code');
  const backLink = document.getElementById('link-back-to-login');

  if (closeBtn) closeBtn.addEventListener('click', () => closeAuthModal());
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });
  }

  if (emailInput) {
    emailInput.focus();
  }

  if (backLink) {
    backLink.addEventListener('click', (e) => {
      e.preventDefault();
      resetForgotState();
      activeTab = 'login';
      renderAuthModalContent();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorMsg) errorMsg.style.display = 'none';

      const email = (emailInput?.value || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email || !emailRegex.test(email)) {
        if (errorMsg) {
          errorMsg.textContent = 'Please enter a valid registered email address.';
          errorMsg.style.display = 'block';
        }
        emailInput?.focus();
        return;
      }

      try {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span>⏳ Sending code...</span>';

        const res = await api.forgotPassword(email);
        currentResetEmail = email;
        showToast(res.message || `Verification code sent to ${email}`, 'info');

        activeTab = 'forgot_step2';
        renderAuthModalContent();
        startResetOtpTimers(res.expiresInSeconds || 60, res.cooldownSeconds || 60);
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = err.message || 'No account found with this email address.';
          errorMsg.style.display = 'block';
        }
        emailInput?.focus();
      } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '✉️ Send Verification Code';
      }
    });
  }
}

function attachForgotStep2Events() {
  const overlay = document.getElementById('auth-modal-overlay');
  const closeBtn = document.getElementById('btn-close-auth-modal');
  const form = document.getElementById('auth-forgot-step2-form');
  const otpInput = document.getElementById('auth-reset-otp-input');
  const resendBtn = document.getElementById('btn-resend-reset-otp');
  const changeEmailLink = document.getElementById('link-reset-change-email');
  const errorMsg = document.getElementById('auth-reset-error-msg');
  const verifyBtn = document.getElementById('btn-verify-reset-code');

  if (closeBtn) closeBtn.addEventListener('click', () => closeAuthModal());
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });
  }

  if (otpInput) {
    otpInput.focus();
    otpInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
      if (e.target.value.length === 6) {
        e.target.style.borderColor = '#ea580c';
        e.target.style.background = '#ffffff';
      } else {
        e.target.style.borderColor = '#cbd5e1';
        e.target.style.background = '#f8fafc';
      }
    });
  }

  if (changeEmailLink) {
    changeEmailLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (resetOtpTimerInterval) clearInterval(resetOtpTimerInterval);
      if (resetResendCooldownInterval) clearInterval(resetResendCooldownInterval);
      activeTab = 'forgot_step1';
      renderAuthModalContent();
    });
  }

  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      if (resetResendCooldownRemaining > 0) return;
      if (!currentResetEmail) return;

      try {
        resendBtn.disabled = true;
        resendBtn.textContent = 'Sending...';

        const res = await api.resendResetOtp(currentResetEmail);
        showToast(res.message || 'New verification code sent to your email!', 'info');

        if (verifyBtn) {
          verifyBtn.disabled = false;
          verifyBtn.style.opacity = '1';
        }

        startResetOtpTimers(res.expiresInSeconds || 60, res.cooldownSeconds || 60);

        if (errorMsg) errorMsg.style.display = 'none';
        if (otpInput) {
          otpInput.value = '';
          otpInput.focus();
        }
      } catch (err) {
        showToast(err.message || 'Could not resend verification code. Please try again.', 'error');
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorMsg) errorMsg.style.display = 'none';

      if (resetOtpTimeRemaining <= 0) {
        if (errorMsg) {
          errorMsg.textContent = 'Verification code expired. Please click Resend Code to receive a new code.';
          errorMsg.style.display = 'block';
        }
        return;
      }

      const enteredOtp = (otpInput?.value || '').trim();
      if (!enteredOtp || enteredOtp.length !== 6) {
        if (errorMsg) {
          errorMsg.textContent = 'Please enter the 6-digit verification code.';
          errorMsg.style.display = 'block';
        }
        otpInput?.focus();
        return;
      }

      try {
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying code...';

        const res = await api.verifyResetOtp(currentResetEmail, enteredOtp);

        // Store resetToken only in memory
        currentResetToken = res.resetToken;

        // Clear timers
        if (resetOtpTimerInterval) clearInterval(resetOtpTimerInterval);
        if (resetResendCooldownInterval) clearInterval(resetResendCooldownInterval);

        activeTab = 'forgot_step3';
        isNewPasswordVisible = false;
        isConfirmNewPasswordVisible = false;
        renderAuthModalContent();
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = err.message || 'Invalid verification code. Please check and try again.';
          errorMsg.style.display = 'block';
        }
        otpInput?.focus();
      } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = '🔐 Verify Code';
      }
    });
  }
}

function attachForgotStep3Events() {
  const overlay = document.getElementById('auth-modal-overlay');
  const closeBtn = document.getElementById('btn-close-auth-modal');
  const form = document.getElementById('auth-forgot-step3-form');
  const passInput = document.getElementById('auth-reset-pass-input');
  const confirmPassInput = document.getElementById('auth-reset-confirm-pass-input');
  const togglePassBtn = document.getElementById('btn-toggle-reset-pass');
  const toggleConfirmPassBtn = document.getElementById('btn-toggle-reset-confirm-pass');
  const errorMsg = document.getElementById('auth-reset-error-msg');
  const submitBtn = document.getElementById('btn-submit-reset-pass');
  const backLink = document.getElementById('link-back-to-login');

  if (closeBtn) closeBtn.addEventListener('click', () => closeAuthModal());
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });
  }

  // New Password visibility toggle
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isNewPasswordVisible = !isNewPasswordVisible;
      passInput.type = isNewPasswordVisible ? 'text' : 'password';
      togglePassBtn.setAttribute('aria-label', isNewPasswordVisible ? 'Hide password' : 'Show password');
      togglePassBtn.title = isNewPasswordVisible ? 'Hide password' : 'Show password';
      togglePassBtn.innerHTML = isNewPasswordVisible ? EYE_SLASH_SVG : EYE_OPEN_SVG;
      passInput.focus();
    });
  }

  // Confirm New Password visibility toggle
  if (toggleConfirmPassBtn && confirmPassInput) {
    toggleConfirmPassBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isConfirmNewPasswordVisible = !isConfirmNewPasswordVisible;
      confirmPassInput.type = isConfirmNewPasswordVisible ? 'text' : 'password';
      toggleConfirmPassBtn.setAttribute('aria-label', isConfirmNewPasswordVisible ? 'Hide password' : 'Show password');
      toggleConfirmPassBtn.title = isConfirmNewPasswordVisible ? 'Hide password' : 'Show password';
      toggleConfirmPassBtn.innerHTML = isConfirmNewPasswordVisible ? EYE_SLASH_SVG : EYE_OPEN_SVG;
      confirmPassInput.focus();
    });
  }

  if (backLink) {
    backLink.addEventListener('click', (e) => {
      e.preventDefault();
      resetForgotState();
      activeTab = 'login';
      renderAuthModalContent();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorMsg) errorMsg.style.display = 'none';

      const newPass = (passInput?.value || '');
      const confirmPass = (confirmPassInput?.value || '');

      if (!newPass) {
        if (errorMsg) {
          errorMsg.textContent = 'Please enter a new password.';
          errorMsg.style.display = 'block';
        }
        passInput?.focus();
        return;
      }

      if (newPass.length < 6) {
        if (errorMsg) {
          errorMsg.textContent = 'Password must be at least 6 characters long.';
          errorMsg.style.display = 'block';
        }
        passInput?.focus();
        return;
      }

      if (newPass !== confirmPass) {
        if (errorMsg) {
          errorMsg.textContent = 'Passwords do not match.';
          errorMsg.style.display = 'block';
        }
        confirmPassInput?.focus();
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating password...';

        await api.resetPassword({
          email: currentResetEmail,
          resetToken: currentResetToken,
          newPassword: newPass,
          confirmPassword: confirmPass
        });

        currentResetToken = '';
        activeTab = 'forgot_step4';
        renderAuthModalContent();
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = err.message || 'Failed to reset password. Please restart password recovery.';
          errorMsg.style.display = 'block';
        }
        passInput?.focus();
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🔒 Reset Password';
      }
    });
  }
}

function attachForgotStep4Events() {
  const overlay = document.getElementById('auth-modal-overlay');
  const closeBtn = document.getElementById('btn-close-auth-modal');
  const backBtn = document.getElementById('btn-reset-back-to-login');

  if (closeBtn) closeBtn.addEventListener('click', () => closeAuthModal());
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      activeTab = 'login';
      isPasswordVisible = false;
      renderAuthModalContent();
      const passInput = document.getElementById('auth-pass-input');
      if (passInput) passInput.focus();
    });
  }
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

  // Inputs
  const emailInput = document.getElementById('auth-email-input');
  const dialCodeSelect = document.getElementById('auth-dial-code');
  const phoneInput = document.getElementById('auth-phone-input');
  const passInput = document.getElementById('auth-pass-input');
  const confirmPassInput = document.getElementById('auth-confirm-pass-input');
  const togglePassBtn = document.getElementById('btn-toggle-show-pass');
  const toggleConfirmPassBtn = document.getElementById('btn-toggle-show-confirm-pass');

  // Password visibility toggle
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isPasswordVisible = !isPasswordVisible;
      passInput.type = isPasswordVisible ? 'text' : 'password';
      togglePassBtn.setAttribute('aria-label', isPasswordVisible ? 'Hide password' : 'Show password');
      togglePassBtn.title = isPasswordVisible ? 'Hide password' : 'Show password';
      togglePassBtn.innerHTML = isPasswordVisible ? EYE_SLASH_SVG : EYE_OPEN_SVG;
      passInput.focus();
    });
  }

  // Confirm Password visibility toggle
  if (toggleConfirmPassBtn && confirmPassInput) {
    toggleConfirmPassBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isConfirmPasswordVisible = !isConfirmPasswordVisible;
      confirmPassInput.type = isConfirmPasswordVisible ? 'text' : 'password';
      toggleConfirmPassBtn.setAttribute('aria-label', isConfirmPasswordVisible ? 'Hide password' : 'Show password');
      toggleConfirmPassBtn.title = isConfirmPasswordVisible ? 'Hide password' : 'Show password';
      toggleConfirmPassBtn.innerHTML = isConfirmPasswordVisible ? EYE_SLASH_SVG : EYE_OPEN_SVG;
      confirmPassInput.focus();
    });
  }

  // Dual-country dial code dropdown (+91 India and +971 UAE)
  if (dialCodeSelect) {
    dialCodeSelect.addEventListener('change', (e) => {
      selectedCountryCode = e.target.value;
      const cfg = COUNTRY_PHONE_CONFIG[selectedCountryCode] || COUNTRY_PHONE_CONFIG.IN;
      
      const dialPrefix = document.getElementById('auth-dial-prefix');
      if (dialPrefix) dialPrefix.textContent = cfg.dialCode;

      const currencyHint = document.getElementById('auth-phone-currency-hint');
      if (currencyHint) {
        currencyHint.textContent = selectedCountryCode === 'AE' ? 'UAE (AED Dirhams)' : 'India (₹ INR)';
      }

      if (phoneInput) {
        phoneInput.placeholder = cfg.placeholder;
        phoneInput.maxLength = cfg.length;
        const currentClean = phoneInput.value.replace(/\D/g, '');
        if (currentClean.length > cfg.length || (currentClean.length > 0 && currentClean.length !== cfg.length)) {
          phoneInput.value = '';
        }
      }
    });
  }

  // Live input filtering for phone input (digits only)
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      const cfg = COUNTRY_PHONE_CONFIG[selectedCountryCode] || COUNTRY_PHONE_CONFIG.IN;
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, cfg.length);
    });
  }

  // Official Google OAuth 2.0 Initiation
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        googleBtn.disabled = true;
        googleBtn.innerHTML = `<span>⏳ Connecting to Google...</span>`;

        const res = await api.getGoogleConfig();
        if (res && res.isConfigured && res.authUrl) {
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
            <span>${activeTab === 'register' ? 'Sign up with Google' : 'Continue with Google'}</span>
          `;
          showToast('Google OAuth setup required: Please add your GOOGLE_CLIENT_ID in the .env file.', 'warning');
        }
      } catch (err) {
        googleBtn.disabled = false;
        showToast('Google OAuth initialization error: ' + (err.message || 'Please check server connection'), 'error');
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', () => closeAuthModal());
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });
  }

  if (switchRegister) {
    switchRegister.addEventListener('click', (e) => {
      e.preventDefault();
      resetRegistrationState();
      activeTab = 'register';
      if (typeof window !== 'undefined' && history.replaceState) {
        history.replaceState(null, '', '#register');
      }
      renderAuthModalContent();
    });
  }

  if (switchLogin) {
    switchLogin.addEventListener('click', (e) => {
      e.preventDefault();
      resetRegistrationState();
      activeTab = 'login';
      if (typeof window !== 'undefined' && history.replaceState) {
        history.replaceState(null, '', '#login');
      }
      renderAuthModalContent();
    });
  }

  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      resetForgotState();
      activeTab = 'forgot_step1';
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
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const confirmPass = confirmPassInput ? confirmPassInput.value : '';

      const submitBtn = document.getElementById('btn-auth-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      // Validation for Register flow
      if (activeTab === 'register') {
        const cfg = COUNTRY_PHONE_CONFIG[selectedCountryCode] || COUNTRY_PHONE_CONFIG.IN;
        const cleanPhone = phone.replace(/\D/g, '');

        if (!name) {
          errorMsg.textContent = 'Full Name is required.';
          errorMsg.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create account';
          document.getElementById('auth-name-input')?.focus();
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          errorMsg.textContent = 'Please enter a valid email address.';
          errorMsg.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create account';
          emailInput?.focus();
          return;
        }

        if (!phone || !cleanPhone) {
          errorMsg.textContent = 'Phone number is required. Please enter your mobile number.';
          errorMsg.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create account';
          phoneInput?.focus();
          return;
        }

        if (!cfg.validate(cleanPhone)) {
          errorMsg.textContent = cfg.errorMessage;
          errorMsg.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create account';
          phoneInput?.focus();
          return;
        }

        if (!pass) {
          errorMsg.textContent = 'Password is required.';
          errorMsg.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create account';
          passInput?.focus();
          return;
        }

        if (!confirmPass) {
          errorMsg.textContent = 'Please confirm your password.';
          errorMsg.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create account';
          confirmPassInput?.focus();
          return;
        }

        if (pass !== confirmPass) {
          errorMsg.textContent = 'Passwords do not match.';
          errorMsg.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create account';
          confirmPassInput?.focus();
          return;
        }
      }

      try {
        const cfg = COUNTRY_PHONE_CONFIG[selectedCountryCode] || COUNTRY_PHONE_CONFIG.IN;
        const cleanPhone = phone.replace(/\D/g, '');
        const fullIntlPhone = cleanPhone ? `${cfg.dialCode}${cleanPhone}` : '';

        if (activeTab === 'login') {
          const res = await api.login(email, pass);
          auth.setSession(res.token, res.user);
          if (res.user && res.user.country) {
            state.setRegion(res.user.country);
          }
          closeAuthModal(true);
          showAuthSuccessNotification(true, () => {
            if (authOptions.onSuccess) authOptions.onSuccess(res.user);
            handlePostAuthCompletion(res.user, authOptions);
          });
          return;
        } else if (activeTab === 'register') {
          // Initiate Email OTP Verification Flow
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending verification code...';

          pendingRegistrationData = {
            name,
            email,
            password: pass,
            confirmPassword: confirmPass,
            phone: fullIntlPhone,
            dialCode: selectedCountryCode
          };

          const otpInitRes = await api.sendRegisterOtp(pendingRegistrationData);
          showToast(otpInitRes.message || `We sent a verification code to ${email}`, 'info');

          activeTab = 'otp_verify';
          otpTimeRemaining = 60;
          resendCooldownRemaining = 60;
          renderAuthModalContent();
          return;
        }
      } catch (err) {
        errorMsg.textContent = err.message || 'Authentication failed. Please check your credentials.';
        errorMsg.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = activeTab === 'login' ? 'Log in' : 'Create account';
      }
    });
  }
}
