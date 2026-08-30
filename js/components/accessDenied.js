/**
 * 403 Access Denied Component
 * Rendered whenever an unauthorized or non-admin user attempts to access #admin.
 */

import { auth } from '../services/auth.js';

export function renderAccessDenied(container) {
  let countdown = 5;
  let intervalId = null;

  const currentUser = auth.getUser();
  const currentRole = auth.getRole();

  container.innerHTML = `
    <div class="container" style="padding: 4rem 1.25rem 6rem; max-width: 680px; text-align: center;">
      <div style="background: var(--bg-surface); border: 2px solid #ef4444; border-radius: var(--radius-md); padding: 3rem 2rem; box-shadow: var(--shadow-xl);">
        
        <!-- Red Security Shield Icon -->
        <div style="width: 80px; height: 80px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 2.75rem; margin: 0 auto 1.5rem; box-shadow: 0 0 25px rgba(220, 38, 38, 0.25);">
          🛡️
        </div>

        <span class="badge" style="background-color: #fee2e2; color: #b91c1c; font-size: 0.85rem; padding: 0.35rem 0.85rem; margin-bottom: 1rem;">
          HTTP 403 - FORBIDDEN
        </span>

        <h2 style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: #991b1b; margin: 0.5rem 0;">
          Access Denied: Admin Privileges Required
        </h2>

        <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin: 1rem 0 1.5rem;">
          You do not have permission to view the <strong>Owner & Admin Management Center</strong>. 
          ${currentUser ? `You are currently signed in as <strong>${currentUser.name}</strong> (Role: <span style="text-transform: uppercase; font-weight: 700; color: var(--primary-blue);">${currentRole}</span>).` : `You are not authenticated.`}
          <br/>Customer personal records, inventory controls, and fulfillment tools are restricted strictly to authorized store administrators.
        </p>

        <div style="background-color: var(--bg-subtle); border-radius: var(--radius-xs); padding: 0.85rem 1.25rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2rem;">
          ⏳ Redirecting back to Laptop Store in <strong id="redirect-timer" style="color: var(--text-main); font-size: 1rem;">${countdown}</strong> seconds...
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <a href="#admin-login" class="btn btn-primary btn-lg" id="btn-goto-admin-login">
            🔐 Admin Staff Login
          </a>
          <a href="#store" class="btn btn-outline btn-lg" id="btn-cancel-redirect">
            ← Return to Laptop Store
          </a>
        </div>
      </div>
    </div>
  `;

  const timerEl = container.querySelector('#redirect-timer');
  const cancelBtn = container.querySelector('#btn-cancel-redirect');
  const loginBtn = container.querySelector('#btn-goto-admin-login');

  const cleanup = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  if (cancelBtn) cancelBtn.addEventListener('click', cleanup);
  if (loginBtn) loginBtn.addEventListener('click', cleanup);

  intervalId = setInterval(() => {
    countdown -= 1;
    if (timerEl) timerEl.textContent = countdown;
    if (countdown <= 0) {
      cleanup();
      window.location.hash = '#store';
    }
  }, 1000);

  window.addEventListener('hashchange', cleanup, { once: true });
}
