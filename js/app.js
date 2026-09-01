/**
 * LapKart Application Bootstrapper
 * Initializes Global UI, Navbar, Cart Drawer, Toast Engine, and Hash Router.
 */

import { renderNavbar } from './components/navbar.js';
import { initCartDrawer } from './components/cart.js';
import { router } from './router.js';
import { init3DTilt, initScrollReveals } from './services/tilt.js';

export function trigger3DRefresh() {
  setTimeout(() => {
    init3DTilt();
    initScrollReveals();
  }, 60);
}

// Toast Notification Service
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '✕';

  toast.innerHTML = `
    <span style="font-weight: 800; font-size: 1.1rem;">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastFadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// App Initialization Function
function startApp() {
  renderNavbar();
  initCartDrawer();

  const mainContainer = document.getElementById('main-content');
  if (mainContainer && router && typeof router.init === 'function') {
    router.init(mainContainer);
    trigger3DRefresh();
  }
}

// Execute on DOMContentLoaded or next event loop tick
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    setTimeout(startApp, 0);
  }
}
