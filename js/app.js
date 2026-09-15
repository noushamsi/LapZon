/**
 * LapKart Application Bootstrapper
 * Initializes Global UI, Navbar, Cart Drawer, Toast Engine, and Hash Router.
 */

import { renderNavbar } from './components/navbar.js';
import { initCartDrawer } from './components/cart.js';
import { router } from './router.js';
import { init3DTilt, initScrollReveals } from './services/tilt.js';
import { openAuthModal, closeAuthModal } from './components/authModal.js';
import { auth } from './services/auth.js';
import { state } from './state.js';

// Expose globally for convenience
if (typeof window !== 'undefined') {
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
}

export function trigger3DRefresh() {
  setTimeout(() => {
    init3DTilt();
    initScrollReveals();
  }, 60);
}

// Toast & Notification Service
export { showToast, showAuthSuccessNotification } from './services/toast.js';

// App Initialization Function
function startApp() {
  // Restore authenticated customer country and currency
  const user = auth.getUser();
  if (user && user.country) {
    state.setRegion(user.country);
  }

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
