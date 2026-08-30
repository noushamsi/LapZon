/**
 * Customer Authentication & Registration Modal
 * Handles customer login, new account creation, and password reset.
 */

import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { showToast } from '../app.js';

let activeTab = 'login'; // 'login' | 'register' | 'forgot'

export function openAuthModal(initialTab = 'login') {
  activeTab = initialTab;
  let overlay = document.getElementById('auth-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'auth-modal-overlay';
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }

  renderAuthModalContent();
  overlay.classList.add('active');
}

export function closeAuthModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

function renderAuthModalContent() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (!overlay) return;

  overlay.innerHTML = `
    <div class="modal-card auth-modal-card" style="max-width: 440px; width: 90%; background: #ffffff; border-radius: 16px; padding: 2rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); position: relative; animation: modalPop 0.25s ease-out;">
      <button type="button" class="modal-close-btn" id="btn-close-auth-modal" style="position: absolute; top: 1rem; right: 1rem; background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1.1rem; color: #64748b; display: flex; align-items: center; justify-content: center;">✕</button>

      <!-- Logo / Header -->
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #2874f0, #1e40af); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 1.6rem; color: #fff; margin-bottom: 0.5rem;">⚡</div>
        <h3 style="font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0;">LapKart Plus</h3>
        <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
          ${activeTab === 'login' ? 'Sign in to access your orders, wishlist & discounts' : activeTab === 'register' ? 'Create an account for personalized laptop shopping' : 'Reset your account password'}
        </p>
      </div>

      <!-- Tab Switcher -->
      <div style="display: flex; background: #f1f5f9; border-radius: 10px; padding: 4px; margin-bottom: 1.5rem;">
        <button type="button" id="tab-btn-login" style="flex: 1; padding: 0.5rem; border: none; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; background: ${activeTab === 'login' ? '#ffffff' : 'transparent'}; color: ${activeTab === 'login' ? '#2874f0' : '#64748b'}; box-shadow: ${activeTab === 'login' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'};">
          Sign In
        </button>
        <button type="button" id="tab-btn-register" style="flex: 1; padding: 0.5rem; border: none; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; background: ${activeTab === 'register' ? '#ffffff' : 'transparent'}; color: ${activeTab === 'register' ? '#2874f0' : '#64748b'}; box-shadow: ${activeTab === 'register' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'};">
          Register
        </button>
      </div>

      <!-- Form Body -->
      <form id="auth-main-form">
        ${activeTab === 'register' ? `
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Full Name</label>
            <input type="text" id="auth-name-input" placeholder="e.g. Rahul Sharma" required style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
          </div>
        ` : ''}

        <div class="form-group" style="margin-bottom: 1rem;">
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Email Address</label>
          <input type="email" id="auth-email-input" placeholder="e.g. name@example.com" required style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <label style="font-size: 0.82rem; font-weight: 700; color: #334155;">${activeTab === 'forgot' ? 'New Password' : 'Password'}</label>
            ${activeTab === 'login' ? `<a href="#" id="auth-forgot-link" style="font-size: 0.78rem; color: #2874f0; text-decoration: none; font-weight: 600;">Forgot Password?</a>` : ''}
          </div>
          <input type="password" id="auth-pass-input" placeholder="••••••••" required style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
        </div>

        <div id="auth-error-msg" style="display: none; padding: 0.5rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; color: #ef4444; font-size: 0.82rem; margin-bottom: 1rem;"></div>

        <button type="submit" id="btn-auth-submit" class="btn btn-primary btn-block btn-lg" style="width: 100%; padding: 0.75rem; border-radius: 8px; font-weight: 800; font-size: 0.95rem; background: #2874f0; color: #fff; border: none; cursor: pointer;">
          ${activeTab === 'login' ? 'Sign In to Account' : activeTab === 'register' ? 'Create Customer Account' : 'Reset Password'}
        </button>
      </form>

      <!-- Bottom Hint / Owner Login switch -->
      <div style="margin-top: 1.5rem; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 1rem; font-size: 0.82rem; color: #64748b;">
        <span>Store Administrator / Owner?</span>
        <a href="#admin-login" id="auth-admin-login-link" style="color: #0f172a; font-weight: 800; text-decoration: none; margin-left: 4px;">
          Owner Login ➔
        </a>
      </div>
    </div>
  `;

  attachModalEvents();
}

function attachModalEvents() {
  const overlay = document.getElementById('auth-modal-overlay');
  const closeBtn = document.getElementById('btn-close-auth-modal');
  const tabLogin = document.getElementById('tab-btn-login');
  const tabRegister = document.getElementById('tab-btn-register');
  const forgotLink = document.getElementById('auth-forgot-link');
  const adminLoginLink = document.getElementById('auth-admin-login-link');
  const form = document.getElementById('auth-main-form');
  const errorMsg = document.getElementById('auth-error-msg');

  if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });
  }

  if (tabLogin) {
    tabLogin.addEventListener('click', () => {
      activeTab = 'login';
      renderAuthModalContent();
    });
  }

  if (tabRegister) {
    tabRegister.addEventListener('click', () => {
      activeTab = 'register';
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

  if (adminLoginLink) {
    adminLoginLink.addEventListener('click', () => {
      closeAuthModal();
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
          if (res.user.role === 'admin') {
            window.location.hash = '#admin';
          }
        } else if (activeTab === 'register') {
          const res = await api.register(name, email, pass);
          auth.setSession(res.token, res.user);
          showToast(`Account created! Welcome to LapKart Plus, ${res.user.name} 🎉`, 'success');
          closeAuthModal();
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
        submitBtn.textContent = activeTab === 'login' ? 'Sign In to Account' : activeTab === 'register' ? 'Create Customer Account' : 'Reset Password';
      }
    });
  }
}
