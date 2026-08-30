/**
 * LapKart Application Bootstrapper
 * Initializes Global UI, Navbar, Cart Drawer, Toast Engine, and Hash Router.
 */

import { renderNavbar } from './components/navbar.js';
import { initCartDrawer } from './components/cart.js';
import { router } from './router.js';

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

function renderFooter() {
  const footerHtml = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <!-- Col 1: About LapKart -->
          <div class="footer-col">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 1rem;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #ffe11b, #ff9f00); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #172337; font-weight: 900;">⚡</div>
              <h3 style="color: #fff; font-family: var(--font-display); font-size: 1.3rem;">LapKart Plus</h3>
            </div>
            <p style="color: #94a3b8; font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem;">
              India's premier dedicated laptop shopping platform. 100% brand warranty, verified stock availability, secure UPI & COD payments, and express courier dispatch.
            </p>
            <div style="color: #cbd5e1; font-size: 0.8rem;">
              📍 Fulfillment Center: Electronic City, Bengaluru, Karnataka 560100
            </div>
          </div>

          <!-- Col 2: Brands -->
          <div class="footer-col">
            <h4>Popular Laptop Brands</h4>
            <ul>
              <li><a href="#store?cat=Ultrabook">Apple MacBook Air & Pro</a></li>
              <li><a href="#store?cat=Gaming">ASUS ROG & TUF Gaming</a></li>
              <li><a href="#store">Dell XPS & Alienware</a></li>
              <li><a href="#store">HP Pavilion & Omen</a></li>
              <li><a href="#store">Lenovo Legion & IdeaPad</a></li>
            </ul>
          </div>

          <!-- Col 3: Customer Support -->
          <div class="footer-col">
            <h4>Customer Support</h4>
            <ul>
              <li><a href="#my-orders">Track Live Orders</a></li>
              <li><a href="#welcome">Return & Replacement Policy</a></li>
              <li><a href="#welcome">Brand Warranty Information</a></li>
              <li><a href="#welcome">Help Center & FAQs</a></li>
              <li><a href="#welcome">Privacy & Safety Policy</a></li>
            </ul>
          </div>

          <!-- Col 4: Trust & Guarantees -->
          <div class="footer-col">
            <h4>LapKart Trust</h4>
            <ul>
              <li><span style="color: #cbd5e1; font-size: 0.85rem;">✓ 100% Authentic Brand Laptops</span></li>
              <li><span style="color: #cbd5e1; font-size: 0.85rem;">✓ 7-Day Replacement Guarantee</span></li>
              <li><span style="color: #cbd5e1; font-size: 0.85rem;">✓ Free Express Air Delivery</span></li>
              <li><span style="color: #cbd5e1; font-size: 0.85rem;">✓ 256-Bit SSL Encrypted Checkout</span></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <div>© 2026 LapKart India Pvt Ltd. All Rights Reserved.</div>
          <div style="display: flex; gap: 1.5rem;">
            <span>🔒 256-Bit SSL Encrypted Checkout</span>
            <span>⚡ Express Air Delivery Partner</span>
          </div>
        </div>
      </div>
    </footer>
  `;

  const existingFooter = document.querySelector('.site-footer');
  if (existingFooter) {
    existingFooter.outerHTML = footerHtml;
  } else {
    document.getElementById('app').insertAdjacentHTML('beforeend', footerHtml);
  }
}

// App Initialization Function
function startApp() {
  renderNavbar();
  renderFooter();
  initCartDrawer();

  const mainContainer = document.getElementById('main-content');
  if (mainContainer) {
    router.init(mainContainer);
  } else {
    console.error('Fatal: #main-content container not found in DOM');
  }
}

// Execute immediately if DOM is already parsed, or wait for DOMContentLoaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
}
