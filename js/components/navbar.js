/**
 * Navbar Component - Strict Role Separation
 * NORMAL USER HEADER: LapKart Plus | Search | Store | My Orders | Cart
 * OWNER/ADMIN HEADER: LapKart Plus | Admin Dashboard | Products | Orders | Delivery | Logout
 */

import { state } from '../state.js';
import { auth } from '../services/auth.js';
import { showToast } from '../app.js';

export function renderNavbar() {
  const cart = state.getCart();
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const isAdmin = auth.isAdmin();

  let headerHtml = '';

  if (isAdmin) {
    // =========================================================================
    // OWNER / ADMIN HEADER (Visible ONLY when authenticated as Admin)
    // =========================================================================
    headerHtml = `
      <header class="site-header site-header-admin">
        <div class="container">
          <div class="header-top">
            <!-- Logo Brand -->
            <a href="#admin" class="header-brand" id="brand-logo-link">
              <div class="brand-logo-icon" style="background: linear-gradient(135deg, #ffe11b, #ff9f00); color: #0f172a;">👑</div>
              <div class="brand-text-wrap">
                <span class="brand-title">LapKart <span style="color: #ffe11b; font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Admin Center</span></span>
                <span class="brand-subtitle">Owner Management & Fulfillment</span>
              </div>
            </a>

            <!-- Owner Header Navigation Links -->
            <div class="header-actions admin-header-nav">
              <a href="#admin?tab=overview" class="nav-link-btn" id="nav-admin-dash">
                📊 <span class="action-text">Admin Dashboard</span>
              </a>

              <a href="#admin?tab=inventory" class="nav-link-btn" id="nav-admin-prods">
                💻 <span class="action-text">Products</span>
              </a>

              <a href="#admin?tab=orders" class="nav-link-btn" id="nav-admin-orders">
                📦 <span class="action-text">Orders</span>
              </a>

              <a href="#admin?tab=orders" class="nav-link-btn" id="nav-admin-delivery">
                🚚 <span class="action-text">Delivery</span>
              </a>

              <a href="#store" class="nav-link-btn" id="nav-admin-preview-store" style="background: rgba(255,255,255,0.12); color: #fff;">
                👁️ <span class="action-text">User Store</span>
              </a>

              <button type="button" class="nav-link-btn btn-logout-owner" id="nav-logout-btn" style="background: #ef4444; color: #fff; font-weight: 700; padding: 0.45rem 1rem;">
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>
    `;
  } else {
    // =========================================================================
    // NORMAL USER HEADER (Strictly ONLY LapKart Plus | Search | Store | My Orders | Cart)
    // ZERO owner/admin buttons or links
    // =========================================================================
    headerHtml = `
      <header class="site-header">
        <div class="container">
          <div class="header-top">
            <!-- Logo Brand -->
            <a href="#welcome" class="header-brand" id="brand-logo-link">
              <div class="brand-logo-icon">⚡</div>
              <div class="brand-text-wrap">
                <span class="brand-title">LapKart <span class="brand-plus">Plus</span></span>
                <span class="brand-subtitle">Explore <span class="plus-badge">Laptops Only</span></span>
              </div>
            </a>

            <!-- Global Search Bar for Laptops -->
            <div class="header-search">
              <form id="global-search-form" class="search-input-wrapper">
                <input 
                  type="text" 
                  id="global-search-input" 
                  placeholder="Search for laptops by brand, processor (i7, M3), RAM, graphics..." 
                  autocomplete="off"
                />
                <button type="submit" class="search-btn" title="Search">
                  🔍
                </button>
              </form>
            </div>

            <!-- Normal User Navigation: Store | My Orders | Cart -->
            <div class="header-actions">
              <a href="#store" class="nav-link-btn" id="nav-store-link">
                💻 <span class="action-text">Store</span>
              </a>

              <a href="#my-orders" class="nav-link-btn" id="nav-orders-link">
                📦 <span class="action-text">My Orders</span>
              </a>

              <button class="nav-link-btn cart-btn" id="nav-cart-toggle-btn" title="View Cart">
                🛒 <span class="action-text">Cart</span>
                ${cartCount > 0 ? `<span class="cart-badge" id="nav-cart-badge">${cartCount}</span>` : ''}
              </button>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  const existingHeader = document.querySelector('.site-header');
  if (existingHeader) {
    existingHeader.outerHTML = headerHtml;
  } else {
    document.getElementById('app').insertAdjacentHTML('afterbegin', headerHtml);
  }

  attachNavbarEvents();
}

function attachNavbarEvents() {
  const searchForm = document.getElementById('global-search-form');
  const searchInput = document.getElementById('global-search-input');

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (window.location.hash.startsWith('#store')) {
        window.dispatchEvent(new CustomEvent('lapkart:search', { detail: query }));
      } else {
        window.location.hash = `#store?q=${encodeURIComponent(query)}`;
      }
    });

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (window.location.hash.startsWith('#store')) {
        window.dispatchEvent(new CustomEvent('lapkart:search', { detail: query }));
      }
    });
  }

  const cartToggle = document.getElementById('nav-cart-toggle-btn');
  if (cartToggle) {
    cartToggle.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('lapkart:toggle-cart'));
    });
  }

  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
      showToast('Admin session logged out.', 'info');
      window.location.hash = '#store';
    });
  }
}

// Reactively re-render navbar when auth state changes (login/logout)
auth.subscribe(() => {
  renderNavbar();
});

// Update cart badge reactively
state.subscribe('cart', (cart) => {
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartBtn = document.getElementById('nav-cart-toggle-btn');
  if (cartBtn) {
    let badge = document.getElementById('nav-cart-badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.id = 'nav-cart-badge';
        badge.className = 'cart-badge';
        cartBtn.appendChild(badge);
      }
      badge.textContent = count;
    } else if (badge) {
      badge.remove();
    }
  }
});
