/**
 * Navbar Component - Production-Grade Role Separation
 * Public / User Store Header: LapKart Plus | Search | Store | Wishlist | My Orders | Cart | Profile / Sign In
 * Admin Center Header: Rendered ONLY when actively inside #admin
 */

import { state } from '../state.js';
import { auth } from '../services/auth.js';
import { showToast } from '../app.js';
import { openAuthModal } from './authModal.js';

export function renderNavbar() {
  const currentHash = window.location.hash || '#welcome';
  const isAdminRoute = currentHash.startsWith('#admin') && currentHash !== '#admin-login';
  const user = auth.getUser();
  const isAdmin = auth.isAdmin();
  const cart = state.getCart();
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  let headerHtml = '';

  if (isAdminRoute && isAdmin) {
    // =========================================================================
    // OWNER / ADMIN HEADER (Rendered ONLY when actively inside #admin portal)
    // =========================================================================
    headerHtml = `
      <header class="site-header site-header-admin">
        <div class="container">
          <div class="header-top">
            <!-- Brand -->
            <a href="#admin" class="header-brand" id="brand-logo-link">
              <div class="brand-logo-icon" style="background: linear-gradient(135deg, #ffe11b, #ff9f00); color: #0f172a;">👑</div>
              <div class="brand-text-wrap">
                <span class="brand-title">LapKart <span style="color: #ffe11b; font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Admin Center</span></span>
                <span class="brand-subtitle">Owner Management & Fulfillment</span>
              </div>
            </a>

            <!-- Owner Action Links -->
            <div class="header-actions admin-header-nav">
              <a href="#admin?tab=overview" class="nav-link-btn" id="nav-admin-dash">
                📊 <span class="action-text">Analytics</span>
              </a>
              <a href="#admin?tab=orders" class="nav-link-btn" id="nav-admin-orders">
                📦 <span class="action-text">Orders</span>
              </a>
              <a href="#admin?tab=inventory" class="nav-link-btn" id="nav-admin-prods">
                💻 <span class="action-text">Inventory</span>
              </a>
              <a href="#admin?tab=returns" class="nav-link-btn" id="nav-admin-returns">
                🔄 <span class="action-text">Returns</span>
              </a>
              <a href="#store" class="nav-link-btn" id="nav-admin-preview-store" style="background: rgba(255,255,255,0.15); color: #fff;">
                👁️ <span class="action-text">Customer Store</span>
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
    // CUSTOMER / PUBLIC STORE HEADER (Rendered across all public and user pages)
    // =========================================================================
    headerHtml = `
      <header class="site-header">
        <div class="container">
          <div class="header-top">
            <!-- Brand Logo -->
            <a href="#welcome" class="header-brand" id="brand-logo-link">
              <div class="brand-logo-icon">⚡</div>
              <div class="brand-text-wrap">
                <span class="brand-title">LapKart <span class="brand-plus">Plus</span></span>
                <span class="brand-subtitle">India's <span class="plus-badge">Laptop Superstore</span></span>
              </div>
            </a>

            <!-- Global Search Bar -->
            <div class="header-search">
              <form id="global-search-form" class="search-input-wrapper">
                <input 
                  type="text" 
                  id="global-search-input" 
                  placeholder="Search laptops by brand, processor (M3, i7), RAM, RTX GPU..." 
                  autocomplete="off"
                />
                <button type="submit" class="search-btn" title="Search">
                  🔍
                </button>
              </form>
            </div>

            <!-- Customer Navigation -->
            <div class="header-actions">
              <a href="#store" class="nav-link-btn ${currentHash.startsWith('#store') ? 'active' : ''}" id="nav-store-link">
                💻 <span class="action-text">Store</span>
              </a>

              <a href="#wishlist" class="nav-link-btn ${currentHash.startsWith('#wishlist') ? 'active' : ''}" id="nav-wishlist-link">
                💖 <span class="action-text">Wishlist</span>
              </a>

              <a href="#user-dashboard" class="nav-link-btn ${currentHash.startsWith('#user-dashboard') || currentHash.startsWith('#my-orders') ? 'active' : ''}" id="nav-orders-link">
                📦 <span class="action-text">My Orders</span>
              </a>

              <button type="button" class="nav-link-btn cart-btn" id="nav-cart-toggle-btn" title="View Cart">
                🛒 <span class="action-text">Cart</span>
                ${cartCount > 0 ? `<span class="cart-badge" id="nav-cart-badge">${cartCount}</span>` : ''}
              </button>

              <!-- Auth Status / Profile -->
              ${user ? `
                <div class="nav-user-dropdown-wrap" style="position: relative; display: inline-block;">
                  <button type="button" class="nav-link-btn nav-user-btn" id="nav-user-menu-btn" style="background: rgba(255,255,255,0.15); color: #fff; font-weight: 700; border-radius: 8px;">
                    👤 <span class="action-text">${user.name ? user.name.split(' ')[0] : 'Account'}</span> ▾
                  </button>

                  <div class="nav-user-dropdown" id="nav-user-dropdown-menu" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); background: #ffffff; min-width: 220px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border-radius: 12px; padding: 0.5rem 0; z-index: 1000; border: 1px solid #e2e8f0;">
                    <div style="padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9;">
                      <div style="font-weight: 800; font-size: 0.9rem; color: #0f172a;">${user.name}</div>
                      <div style="font-size: 0.75rem; color: #64748b;">${user.email}</div>
                    </div>

                    ${isAdmin ? `
                      <a href="#admin" style="display: flex; align-items: center; gap: 8px; padding: 0.65rem 1rem; color: #b45309; background: #fef3c7; font-weight: 700; text-decoration: none; font-size: 0.85rem;">
                        👑 Owner Admin Center
                      </a>
                    ` : ''}

                    <a href="#user-dashboard?tab=profile" style="display: flex; align-items: center; gap: 8px; padding: 0.6rem 1rem; color: #334155; text-decoration: none; font-size: 0.85rem;">
                      👤 Customer Profile
                    </a>
                    <a href="#user-dashboard?tab=orders" style="display: flex; align-items: center; gap: 8px; padding: 0.6rem 1rem; color: #334155; text-decoration: none; font-size: 0.85rem;">
                      📦 My Orders & Tracking
                    </a>
                    <a href="#user-dashboard?tab=wishlist" style="display: flex; align-items: center; gap: 8px; padding: 0.6rem 1rem; color: #334155; text-decoration: none; font-size: 0.85rem;">
                      💖 Saved Wishlist
                    </a>
                    <a href="#user-dashboard?tab=addresses" style="display: flex; align-items: center; gap: 8px; padding: 0.6rem 1rem; color: #334155; text-decoration: none; font-size: 0.85rem;">
                      📍 Delivery Addresses
                    </a>
                    <a href="#user-dashboard?tab=referral" style="display: flex; align-items: center; gap: 8px; padding: 0.6rem 1rem; color: #2874f0; font-weight: 700; text-decoration: none; font-size: 0.85rem;">
                      🎁 30% OFF Referral Reward
                    </a>
                    <a href="#support" style="display: flex; align-items: center; gap: 8px; padding: 0.6rem 1rem; color: #334155; text-decoration: none; font-size: 0.85rem;">
                      💬 Help & Support
                    </a>

                    <div style="border-top: 1px solid #f1f5f9; margin-top: 0.25rem;">
                      <button type="button" id="dropdown-logout-btn" style="width: 100%; text-align: left; background: none; border: none; padding: 0.6rem 1rem; color: #ef4444; font-weight: 700; cursor: pointer; font-size: 0.85rem;">
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                </div>
              ` : `
                <button type="button" class="nav-link-btn nav-signin-btn" id="nav-btn-signin" style="background: #ffffff; color: #2874f0; font-weight: 800; padding: 0.45rem 1.1rem; border-radius: 8px; border: none; cursor: pointer;">
                  👤 Sign In
                </button>
              `}
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

  const signInBtn = document.getElementById('nav-btn-signin');
  if (signInBtn) {
    signInBtn.addEventListener('click', () => {
      openAuthModal('login');
    });
  }

  const userMenuBtn = document.getElementById('nav-user-menu-btn');
  const userDropdown = document.getElementById('nav-user-dropdown-menu');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      userDropdown.style.display = 'none';
    });
  }

  const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');
  if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener('click', () => {
      auth.logout();
      showToast('Logged out successfully.', 'info');
      renderNavbar();
      window.location.hash = '#welcome';
    });
  }

  const adminLogoutBtn = document.getElementById('nav-logout-btn');
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
      auth.logout();
      showToast('Admin session closed.', 'info');
      renderNavbar();
      window.location.hash = '#store';
    });
  }
}

// Reactively re-render navbar when auth state changes or hash changes
auth.subscribe(() => {
  renderNavbar();
});

window.addEventListener('hashchange', () => {
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
