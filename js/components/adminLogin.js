/**
 * Admin Login Page Component
 * Secure authentication portal for store owner and administrators.
 */

import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { showToast } from '../app.js';
import { router } from '../router.js';

export function renderAdminLogin(container) {
  // If already logged in as Admin, redirect directly to dashboard
  if (auth.isAdmin()) {
    router.navigate('#admin');
    return;
  }

  container.innerHTML = `
    <div class="container" style="padding: 3.5rem 1.25rem 6rem; max-width: 520px;">
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-xl); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 2rem; text-align: center;">
          <div style="width: 54px; height: 54px; background: linear-gradient(135deg, #ffe11b, #ff9f00); border-radius: var(--radius-sm); color: #0f172a; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 900; margin: 0 auto 0.75rem;">
            👑
          </div>
          <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #fff;">
            Admin & Owner Portal
          </h2>
          <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">
            Secure access for product approvals, inventory & dispatch
          </p>
        </div>

        <!-- Form Body -->
        <div style="padding: 2rem;">
          <!-- Demo 1-Click Fill Banner -->
          <div style="background: #f0fdf4; border: 1px dashed #22c55e; border-radius: var(--radius-xs); padding: 0.85rem 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
            <div>
              <div style="font-size: 0.78rem; font-weight: 700; color: #15803d; text-transform: uppercase;">Quick Demo Credentials:</div>
              <div style="font-size: 0.82rem; color: #166534; font-family: monospace;">admin@lapkart.com • Admin@123</div>
            </div>
            <button type="button" class="btn btn-sm btn-green" id="btn-quick-fill-admin">
              ⚡ Auto-Fill
            </button>
          </div>

          <div id="login-error-alert" style="display: none; background: #fee2e2; border: 1px solid #f87171; color: #991b1b; padding: 0.75rem 1rem; border-radius: var(--radius-xs); font-size: 0.85rem; margin-bottom: 1.25rem;"></div>

          <form id="admin-login-form" class="address-form-grid" novalidate style="display: flex; flex-direction: column; gap: 1.25rem;">
            <div class="form-group">
              <label for="admin-email">Administrator Email <span class="req">*</span></label>
              <input type="email" id="admin-email" placeholder="admin@lapkart.com" required autocomplete="username" />
            </div>

            <div class="form-group">
              <label for="admin-password">Secure Password <span class="req">*</span></label>
              <input type="password" id="admin-password" placeholder="••••••••••••" required autocomplete="current-password" />
            </div>

            <button type="submit" class="btn btn-orange btn-lg btn-block" id="btn-submit-admin-login" style="margin-top: 0.5rem;">
              🔐 Authenticate & Enter Dashboard
            </button>
          </form>

          <div style="border-top: 1px solid var(--border-subtle); margin-top: 1.75rem; padding-top: 1.25rem; text-align: center; font-size: 0.85rem; color: var(--text-secondary);">
            Are you a customer? <a href="#store" style="color: var(--primary-blue); font-weight: 600;">Go to Laptop Store</a>
          </div>
        </div>
      </div>
    </div>
  `;

  attachAdminLoginEvents(container);
}

function attachAdminLoginEvents(container) {
  const form = container.querySelector('#admin-login-form');
  const emailInput = container.querySelector('#admin-email');
  const passInput = container.querySelector('#admin-password');
  const errorAlert = container.querySelector('#login-error-alert');
  const quickFillBtn = container.querySelector('#btn-quick-fill-admin');
  const submitBtn = container.querySelector('#btn-submit-admin-login');

  if (quickFillBtn) {
    quickFillBtn.addEventListener('click', () => {
      emailInput.value = 'admin@lapkart.com';
      passInput.value = 'Admin@123';
      showToast('Admin demo credentials populated! Click login.', 'info');
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorAlert.style.display = 'none';

      const email = emailInput.value.trim();
      const password = passInput.value.trim();

      if (!email || !password) {
        errorAlert.textContent = 'Please enter both email and password.';
        errorAlert.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying Credentials...';

      try {
        const res = await api.login(email, password);

        if (res.user.role !== 'admin') {
          errorAlert.textContent = 'Access Denied: This account is a regular customer account, not an Administrator.';
          errorAlert.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = '🔐 Authenticate & Enter Dashboard';
          return;
        }

        auth.setSession(res.token, res.user);
        showToast(`Authentication verified! Welcome Admin, ${res.user.name}.`, 'success');
        router.navigate('#admin');
      } catch (err) {
        errorAlert.textContent = err.message || 'Login failed. Please verify email and password.';
        errorAlert.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = '🔐 Authenticate & Enter Dashboard';
      }
    });
  }
}
