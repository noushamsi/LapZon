/**
 * Navbar Component - LapZon E-Commerce Platform
 * Theme: Orange Primary (#ff6b00) + Clean White Contrast + High Usability
 * Tagline: "Quality Products, Trusted Service"
 * Features:
 * - Brand Logo & Tagline
 * - Store, Help & Support (with 8123019785 & noushamsi09@gmail.com enquiry + New Ticket), My Orders, Cart, Account
 * - Fully responsive Mobile Hamburger Drawer
 */

import { state } from '../state.js';
import { auth } from '../services/auth.js';
import { showToast } from '../app.js';
import { openAuthModal } from './authModal.js';

export function renderNavbar() {
  const currentHash = window.location.hash || '#welcome';
  const isAdminRoute = currentHash.startsWith('#admin') || currentHash.startsWith('#owner');
  const user = auth.getUser();
  const isAdmin = auth.isAdmin();
  const cart = state.getCart();
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const currentRegion = state.getRegion();
  const currentPhone = state.getPhone();

  let headerHtml = '';

  if (isAdminRoute) {
    // =========================================================================
    // ADMIN CENTER HEADER
    // =========================================================================
    headerHtml = `
      <header class="site-header site-header-admin">
        <div class="container">
          <div class="header-top">
            <!-- Brand -->
            <a href="${isAdmin ? '#admin' : '#admin-login'}" class="header-brand" id="brand-logo-link">
              <img src="assets/images/lapzon-logo.png" class="brand-logo-img" alt="LapZon Logo" />
              <div class="brand-text-wrap">
                <span class="brand-title">Lap<span class="brand-accent-z">Z</span>on <span style="color: #f59e0b; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-left: 4px;">Admin Center</span></span>
                <span class="brand-subtitle">Management & Security Portal</span>
              </div>
            </a>

            <!-- Owner Action Links -->
            <div class="header-actions admin-header-nav">
              ${isAdmin ? `
                <a href="#admin?tab=overview" class="nav-link-btn ${currentHash.includes('tab=overview') || currentHash === '#admin' ? 'active' : ''}" id="nav-admin-dash">
                  📊 <span class="action-text">Analytics</span>
                </a>
                <a href="#admin?tab=orders" class="nav-link-btn ${currentHash.includes('tab=orders') ? 'active' : ''}" id="nav-admin-orders">
                  📦 <span class="action-text">Orders</span>
                </a>
                <a href="#admin?tab=inventory" class="nav-link-btn ${currentHash.includes('tab=inventory') ? 'active' : ''}" id="nav-admin-prods">
                  💻 <span class="action-text">Inventory</span>
                </a>
                <a href="#admin?tab=returns" class="nav-link-btn ${currentHash.includes('tab=returns') ? 'active' : ''}" id="nav-admin-returns">
                  🔄 <span class="action-text">Returns</span>
                </a>
                <button type="button" class="nav-link-btn btn-logout-owner" id="nav-logout-btn" style="background: #ef4444; color: #fff; font-weight: 700; padding: 0.45rem 1rem;">
                  🚪 <span class="action-text">Logout</span>
                </button>
              ` : `
                <a href="#store" class="nav-link-btn" style="color: #cbd5e1;">
                  ← Back to Store
                </a>
              `}
            </div>
          </div>
        </div>
      </header>
    `;
  } else {
    // =========================================================================
    // PUBLIC / USER STORE HEADER (LapZon Clean White + Vibrant Orange Theme)
    // =========================================================================
    headerHtml = `
      <!-- Top Announcement Ribbon -->
      <div class="header-top-ribbon">
        <div class="container">
          <div class="ribbon-tagline">
            <span>⚡ LapZon: Quality Products, Trusted Service</span>
            <span style="opacity: 0.75; margin: 0 4px;">•</span>
            <span>📞 Helpline: <a href="tel:8123019785" style="color: #fff; font-weight: 800; text-decoration: underline;">8123019785</a></span>
            <span style="opacity: 0.75; margin: 0 4px;">•</span>
            <span>✉️ <a href="mailto:noushamsi09@gmail.com" style="color: #fff; font-weight: 700;">noushamsi09@gmail.com</a></span>
          </div>
          <div class="ribbon-links">
            <a href="#support">💬 24x7 Helpdesk</a>
            <a href="#my-orders">📍 Track Order</a>
            <a href="#user-dashboard?tab=referral">🎁 30% Off Referral</a>
          </div>
        </div>
      </div>

      <!-- Main Sticky Header -->
      <header class="site-header">
        <div class="container">
          <div class="header-top">
            <!-- Brand Logo & Tagline -->
            <a href="#welcome" class="header-brand" id="brand-logo-link" title="LapZon - Quality Products, Trusted Service">
              <img src="assets/images/lapzon-logo.png" class="brand-logo-img" alt="LapZon Logo" />
              <div class="brand-text-wrap">
                <span class="brand-title">Lap<span class="brand-accent-z">Z</span>on</span>
                <span class="brand-subtitle">Quality Products, Trusted Service</span>
              </div>
            </a>

            <!-- Global Search Bar -->
            <div class="header-search">
              <form id="global-search-form" class="search-input-wrapper">
                <input 
                  type="text" 
                  id="global-search-input" 
                  placeholder="Search laptops by brand (Apple, ASUS, Dell), RAM, RTX GPU..." 
                  autocomplete="off"
                />
                <button type="submit" class="search-btn" title="Search Store">
                  🔍
                </button>
              </form>
            </div>

            <!-- Customer Navigation Actions -->
            <div class="header-actions">
              <a href="#store" class="nav-link-btn desktop-nav-link ${currentHash.startsWith('#store') ? 'active' : ''}" id="nav-store-link">
                💻 <span class="action-text">Store</span>
              </a>

              <!-- Help & Support with Dropdown Menu -->
              <div class="nav-support-dropdown-wrap" style="position: relative; display: inline-block;">
                <a href="#support" class="nav-link-btn desktop-nav-link ${currentHash.startsWith('#support') ? 'active' : ''}" id="nav-support-link" style="display: inline-flex; align-items: center; gap: 4px;">
                  🎧 <span class="action-text">Help & Support</span> ▾
                </a>

                <div class="nav-support-dropdown" id="nav-support-dropdown-menu" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); background: #ffffff; min-width: 270px; box-shadow: 0 12px 30px rgba(0,0,0,0.14); border-radius: 12px; padding: 0.75rem; z-index: 1000; border: 1px solid #e2e8f0;">
                  <div style="font-weight: 800; font-size: 0.88rem; color: #0f172a; margin-bottom: 0.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.4rem;">
                    🎧 Customer Help & Enquiry
                  </div>
                  
                  <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.82rem; color: #334155; margin-bottom: 0.75rem;">
                    <a href="tel:8123019785" style="display: flex; align-items: center; gap: 8px; color: #0f172a; text-decoration: none; font-weight: 700; background: #fff7ed; padding: 0.45rem 0.65rem; border-radius: 6px; border: 1px solid #ffedd5;">
                      <span>📞</span> <span>8123019785</span> <span style="font-size: 0.7rem; color: #ea580c; margin-left: auto;">Call Now</span>
                    </a>
                    
                    <a href="mailto:noushamsi09@gmail.com" style="display: flex; align-items: center; gap: 8px; color: #0f172a; text-decoration: none; font-weight: 600; background: #f8fafc; padding: 0.45rem 0.65rem; border-radius: 6px; border: 1px solid #e2e8f0; word-break: break-all;">
                      <span>✉️</span> <span>noushamsi09@gmail.com</span>
                    </a>
                  </div>

                  <a href="#support" class="btn btn-primary btn-sm btn-block" style="width: 100%; padding: 0.45rem 0.75rem; font-weight: 800; font-size: 0.8rem; text-align: center; text-decoration: none; display: block; border-radius: 6px; background: #ff6b00; color: #fff;">
                    📝 + New Ticket / Help Center
                  </a>
                </div>
              </div>

              <a href="#wishlist" class="nav-link-btn desktop-nav-link ${currentHash.startsWith('#wishlist') ? 'active' : ''}" id="nav-wishlist-link">
                💖 <span class="action-text">Wishlist</span>
              </a>

              <a href="#user-dashboard" class="nav-link-btn desktop-nav-link ${currentHash.startsWith('#user-dashboard') || currentHash.startsWith('#my-orders') ? 'active' : ''}" id="nav-orders-link">
                📦 <span class="action-text">Orders</span>
              </a>

              <a href="#cart" class="nav-link-btn cart-btn ${currentHash.startsWith('#cart') ? 'active' : ''}" id="nav-cart-toggle-btn" title="View Shopping Cart">
                🛒 <span class="action-text">Cart</span>
                ${cartCount > 0 ? `<span class="cart-badge cart-badge-bounce" id="nav-cart-badge">${cartCount}</span>` : ''}
              </a>

              <!-- Auth Status / Account Dropdown -->
              ${(user && user.role !== 'admin') ? `
                <div class="nav-user-dropdown-wrap" style="position: relative; display: inline-block;">
                  <button type="button" class="nav-link-btn nav-user-btn" id="nav-user-menu-btn" style="background: var(--primary-orange-light); color: var(--primary-orange-dark); font-weight: 700; border: 1px solid #fed7aa;">
                    👤 <span class="action-text">${user.name ? user.name.split(' ')[0] : 'Account'}</span> ▾
                  </button>

                  <div class="nav-user-dropdown" id="nav-user-dropdown-menu" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); background: #ffffff; min-width: 230px; box-shadow: 0 12px 30px rgba(0,0,0,0.12); border-radius: 12px; padding: 0.5rem 0; z-index: 1000; border: 1px solid #e2e8f0;">
                    <div style="padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; background: #fafafa;">
                      <div style="font-weight: 800; font-size: 0.9rem; color: #0f172a;">${user.name}</div>
                      <div style="font-size: 0.75rem; color: #64748b; word-break: break-all;">${user.email}</div>
                    </div>

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
                    <a href="#user-dashboard?tab=referral" style="display: flex; align-items: center; gap: 8px; padding: 0.6rem 1rem; color: var(--primary-orange); font-weight: 700; text-decoration: none; font-size: 0.85rem;">
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
                <button type="button" class="nav-link-btn nav-signin-btn" id="nav-btn-signin" style="background: var(--primary-orange); color: #ffffff; font-weight: 800; padding: 0.5rem 1.1rem; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 2px 6px rgba(255, 107, 0, 0.25);">
                  👤 <span class="action-text">Sign In</span>
                </button>
              `}

              <!-- Mobile Hamburger Toggle Button -->
              <button type="button" class="hamburger-toggle-btn" id="nav-hamburger-btn" aria-label="Toggle Mobile Menu">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Mobile Navigation Drawer & Backdrop -->
      <div class="mobile-nav-backdrop" id="mobile-nav-backdrop"></div>
      <aside class="mobile-nav-drawer" id="mobile-nav-drawer">
        <div class="mobile-drawer-header">
          <a href="#welcome" class="header-brand" style="margin: 0;">
            <img src="assets/images/lapzon-logo.png" class="brand-logo-img" style="width: 36px; height: 36px;" alt="LapZon" />
            <div class="brand-text-wrap">
              <span class="brand-title" style="font-size: 1.25rem;">Lap<span class="brand-accent-z">Z</span>on</span>
              <span class="brand-subtitle" style="font-size: 0.65rem;">Quality Products, Trusted Service</span>
            </div>
          </a>
          <button type="button" class="mobile-drawer-close" id="mobile-drawer-close-btn" aria-label="Close menu">✕</button>
        </div>

        <div class="mobile-drawer-body">
          ${user ? `
            <div style="background: var(--primary-orange-light); border: 1px solid #fed7aa; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.5rem;">
              <div style="font-weight: 800; font-size: 0.9rem; color: #0f172a;">${user.name}</div>
              <div style="font-size: 0.75rem; color: #64748b;">${user.email}</div>
            </div>
          ` : ''}

          <!-- Currency Tile in Drawer (read-only based on customer phone) -->
          <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 0.65rem 0.85rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #9a3412; text-transform: uppercase;">Store Currency</div>
            <div style="font-weight: 800; font-size: 0.85rem; color: #0f172a; display: flex; align-items: center; gap: 6px;">
              <span>${currentRegion.flag}</span>
              <span>${currentRegion.code === 'IN' ? '₹ INR (India)' : 'AED (UAE)'}</span>
            </div>
          </div>

          <a href="#welcome" class="mobile-nav-link ${currentHash === '#welcome' ? 'active' : ''}">
            🏠 Home & Deals
          </a>
          <a href="#store" class="mobile-nav-link ${currentHash.startsWith('#store') ? 'active' : ''}">
            💻 Laptop Store
          </a>
          <a href="#cart" class="mobile-nav-link ${currentHash.startsWith('#cart') ? 'active' : ''}">
            🛒 Shopping Cart ${cartCount > 0 ? `(${cartCount})` : ''}
          </a>
          <a href="#wishlist" class="mobile-nav-link ${currentHash.startsWith('#wishlist') ? 'active' : ''}">
            💖 Saved Wishlist
          </a>
          <a href="#user-dashboard?tab=orders" class="mobile-nav-link ${currentHash.includes('orders') ? 'active' : ''}">
            📦 My Orders & Tracking
          </a>
          <a href="#user-dashboard?tab=addresses" class="mobile-nav-link ${currentHash.includes('addresses') ? 'active' : ''}">
            📍 Delivery Addresses
          </a>
          <a href="#user-dashboard?tab=referral" class="mobile-nav-link" style="color: var(--primary-orange); font-weight: 700;">
            🎁 30% OFF Referral Reward
          </a>
          <a href="#support" class="mobile-nav-link ${currentHash.startsWith('#support') ? 'active' : ''}">
            💬 Help & Support (24x7)
          </a>

          <!-- Help & Support Enquiry Card in Drawer -->
          <div style="background: #fff7ed; border: 1px solid #fdba74; border-radius: 10px; padding: 0.85rem; margin: 0.75rem 0;">
            <div style="font-weight: 800; font-size: 0.82rem; color: #9a3412; margin-bottom: 0.4rem;">
              🎧 Contact & Enquiry Helpline:
            </div>
            <div style="font-size: 0.8rem; color: #7c2d12; margin-bottom: 0.25rem;">
              📞 <strong>8123019785</strong>
            </div>
            <div style="font-size: 0.75rem; color: #7c2d12; margin-bottom: 0.5rem;">
              ✉️ <strong>noushamsi09@gmail.com</strong>
            </div>
            <a href="#support" class="btn btn-sm btn-primary btn-block" style="text-align: center; text-decoration: none; display: block; font-size: 0.78rem; font-weight: 800; padding: 0.35rem;">
              📝 + New Support Ticket
            </a>
          </div>

          <div class="mobile-nav-divider"></div>

          ${user ? `
            <button type="button" id="mobile-logout-btn" class="mobile-nav-link" style="width: 100%; border: none; background: none; color: #ef4444; cursor: pointer; text-align: left; font-weight: 700;">
              🚪 Sign Out (${user.name ? user.name.split(' ')[0] : 'User'})
            </button>
          ` : `
            <button type="button" id="mobile-signin-btn" class="btn btn-orange btn-block" style="margin-top: 0.5rem;">
              👤 Customer Sign In / Register
            </button>
          `}
        </div>
      </aside>

      <!-- Modern Mobile Bottom App Navigation Bar (Visible only on <= 768px) -->
      <nav class="mobile-bottom-nav" id="mobile-bottom-nav" aria-label="Mobile Navigation">
        <a href="#welcome" class="bottom-nav-item ${currentHash === '#welcome' || currentHash === '' ? 'active' : ''}" id="bnav-home">
          <span class="bnav-icon">🏠</span>
          <span class="bnav-label">Home</span>
        </a>

        <a href="#store" class="bottom-nav-item ${currentHash.startsWith('#store') ? 'active' : ''}" id="bnav-store">
          <span class="bnav-icon">💻</span>
          <span class="bnav-label">Store</span>
        </a>

        <a href="#wishlist" class="bottom-nav-item ${currentHash.startsWith('#wishlist') ? 'active' : ''}" id="bnav-wishlist">
          <span class="bnav-icon">💖</span>
          <span class="bnav-label">Wishlist</span>
          ${state.getWishlist().length > 0 ? `<span class="bnav-badge">${state.getWishlist().length}</span>` : ''}
        </a>

        <a href="#cart" class="bottom-nav-item ${currentHash.startsWith('#cart') ? 'active' : ''}" id="bnav-cart">
          <span class="bnav-icon">🛒</span>
          <span class="bnav-label">Cart</span>
          ${cartCount > 0 ? `<span class="bnav-badge">${cartCount}</span>` : ''}
        </a>

        ${user ? `
          <a href="#user-dashboard" class="bottom-nav-item ${currentHash.startsWith('#user-dashboard') || currentHash.startsWith('#my-orders') ? 'active' : ''}" id="bnav-account">
            <span class="bnav-icon">👤</span>
            <span class="bnav-label">Account</span>
          </a>
        ` : `
          <button type="button" class="bottom-nav-item bnav-menu-btn" id="bnav-menu-toggle" aria-label="Open Navigation Menu">
            <span class="bnav-icon">☰</span>
            <span class="bnav-label">Menu</span>
          </button>
        `}
      </nav>
    `;
  }

  const existingHeader = document.querySelector('.site-header');
  const existingRibbon = document.querySelector('.header-top-ribbon');
  const existingDrawer = document.getElementById('mobile-nav-drawer');
  const existingBackdrop = document.getElementById('mobile-nav-backdrop');
  const existingBottomNav = document.getElementById('mobile-bottom-nav');

  if (existingRibbon && typeof existingRibbon.remove === 'function') existingRibbon.remove();
  if (existingDrawer && typeof existingDrawer.remove === 'function') existingDrawer.remove();
  if (existingBackdrop && typeof existingBackdrop.remove === 'function') existingBackdrop.remove();
  if (existingBottomNav && typeof existingBottomNav.remove === 'function') existingBottomNav.remove();

  if (existingHeader) {
    existingHeader.outerHTML = headerHtml;
  } else {
    const appContainer = document.getElementById('app') || document.body;
    if (appContainer) {
      appContainer.insertAdjacentHTML('afterbegin', headerHtml);
    }
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
      openAuthModal('login', { returnHash: window.location.hash || '#welcome' });
    });
  }

  // Support Dropdown Toggle in Desktop
  const supportLink = document.getElementById('nav-support-link');
  const supportDropdown = document.getElementById('nav-support-dropdown-menu');
  const supportWrap = document.querySelector('.nav-support-dropdown-wrap');

  if (supportWrap && supportDropdown) {
    supportWrap.addEventListener('mouseenter', () => {
      supportDropdown.style.display = 'block';
    });
    supportWrap.addEventListener('mouseleave', () => {
      supportDropdown.style.display = 'none';
    });
  }

  // Mobile Drawer Toggle
  const hamburgerBtn = document.getElementById('nav-hamburger-btn');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
  const mobileCloseBtn = document.getElementById('mobile-drawer-close-btn');

  function openMobileMenu() {
    if (mobileDrawer && mobileBackdrop) {
      mobileDrawer.classList.add('open');
      mobileBackdrop.classList.add('open');
      if (hamburgerBtn) hamburgerBtn.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileMenu() {
    if (mobileDrawer && mobileBackdrop) {
      mobileDrawer.classList.remove('open');
      mobileBackdrop.classList.remove('open');
      if (hamburgerBtn) hamburgerBtn.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      if (mobileDrawer && mobileDrawer.classList.contains('open')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  const bnavMenuToggle = document.getElementById('bnav-menu-toggle');
  if (bnavMenuToggle) {
    bnavMenuToggle.addEventListener('click', () => {
      openMobileMenu();
    });
  }

  if (mobileCloseBtn) {
    mobileCloseBtn.addEventListener('click', closeMobileMenu);
  }

  if (mobileBackdrop) {
    mobileBackdrop.addEventListener('click', closeMobileMenu);
  }

  // Close drawer on any drawer link click
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  const mobileSignInBtn = document.getElementById('mobile-signin-btn');
  if (mobileSignInBtn) {
    mobileSignInBtn.addEventListener('click', () => {
      closeMobileMenu();
      openAuthModal('login', { returnHash: window.location.hash || '#welcome' });
    });
  }

  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', () => {
      closeMobileMenu();
      auth.logout();
      showToast('Signed out successfully.', 'info');
      renderNavbar();
      window.location.hash = '#welcome';
    });
  }

  // User Dropdown in Desktop
  const userMenuBtn = document.getElementById('nav-user-menu-btn');
  const userDropdown = document.getElementById('nav-user-dropdown-menu');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      userDropdown.style.display = 'none';
      if (supportDropdown) supportDropdown.style.display = 'none';
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
      window.location.hash = '#admin-login';
    });
  }

  // Region / Currency Selector Modal Triggers
  document.querySelectorAll('.btn-trigger-region-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openRegionModal();
    });
  });
}

/**
 * Interactive Dual-Country (India 🇮🇳 / UAE 🇦🇪) & Phone Number Currency Modal
 */
export function openRegionModal() {
  const currentRegion = state.getRegion();
  const currentPhone = state.getPhone();
  let selectedCountry = currentRegion.code; // 'IN' | 'AE'
  let phoneInputValue = currentPhone || '';

  let modalOverlay = document.getElementById('region-modal-overlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'region-modal-overlay';
    modalOverlay.className = 'auth-modal-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      z-index: 2500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      opacity: 0;
      transition: opacity 0.25s ease;
    `;
    document.body.appendChild(modalOverlay);
  }

  function renderRegionModal() {
    const isIndia = selectedCountry === 'IN';
    const flag = isIndia ? '🇮🇳' : '🇦🇪';
    const dialCode = isIndia ? '+91' : '+971';
    const currencyName = isIndia ? 'Indian Rupee (₹ INR)' : 'UAE Dirham (AED د.إ)';
    const placeholder = isIndia ? '9876543210' : '501234567';

    modalOverlay.innerHTML = `
      <div class="region-modal-card" style="background: #ffffff; border-radius: 18px; width: 100%; max-width: 450px; box-shadow: 0 25px 60px rgba(0,0,0,0.3); overflow: hidden; position: relative; padding: 2.25rem 2rem; border: 1.5px solid #fed7aa; animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
        
        <!-- Close Button -->
        <button type="button" id="btn-close-region-modal" style="position: absolute; top: 16px; right: 16px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s ease;" aria-label="Close modal">✕</button>

        <!-- Header -->
        <div style="margin-bottom: 1.35rem;">
          <div style="display: inline-flex; align-items: center; gap: 6px; background: #fff7ed; border: 1px solid #ffedd5; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 800; color: #ea580c; margin-bottom: 0.5rem;">
            <span>🌐</span> <span>Multi-Country & Currency Selector</span>
          </div>
          <h2 style="font-size: 1.45rem; font-weight: 800; color: #0f172a; margin: 0 0 0.35rem;">
            Select Region & Phone Number
          </h2>
          <p style="font-size: 0.84rem; color: #64748b; margin: 0; line-height: 1.45;">
            Enter your mobile number or select your region below. Laptop prices will automatically convert to your local currency!
          </p>
        </div>

        <!-- Country Option Cards -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1.25rem;">
          <!-- India Option -->
          <div id="card-opt-india" style="border: 2px solid ${isIndia ? '#ff6b00' : '#e2e8f0'}; background: ${isIndia ? '#fff7ed' : '#ffffff'}; border-radius: 12px; padding: 0.9rem 0.75rem; text-align: center; cursor: pointer; transition: all 0.2s ease; box-shadow: ${isIndia ? '0 4px 12px rgba(255,107,0,0.15)' : 'none'};">
            <div style="font-size: 2rem; margin-bottom: 0.25rem;">🇮🇳</div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #0f172a;">India</div>
            <div style="font-size: 0.76rem; font-weight: 800; color: ${isIndia ? '#ea580c' : '#64748b'}; margin-top: 3px;">
              +91 • ₹ Rupees (INR)
            </div>
          </div>

          <!-- UAE Option -->
          <div id="card-opt-uae" style="border: 2px solid ${!isIndia ? '#ff6b00' : '#e2e8f0'}; background: ${!isIndia ? '#fff7ed' : '#ffffff'}; border-radius: 12px; padding: 0.9rem 0.75rem; text-align: center; cursor: pointer; transition: all 0.2s ease; box-shadow: ${!isIndia ? '0 4px 12px rgba(255,107,0,0.15)' : 'none'};">
            <div style="font-size: 2rem; margin-bottom: 0.25rem;">🇦🇪</div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #0f172a;">UAE</div>
            <div style="font-size: 0.76rem; font-weight: 800; color: ${!isIndia ? '#ea580c' : '#64748b'}; margin-top: 3px;">
              +971 • AED Dirhams (1=26.5₹)
            </div>
          </div>
        </div>

        <!-- Phone Number Input with Dial Prefix -->
        <form id="region-country-phone-form">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 0.4rem;">
              Mobile Number <span style="font-weight: 500; color: #64748b;">(Auto-detects +91 or +971)</span>
            </label>
            <div style="display: flex; gap: 8px;">
              <select id="modal-dial-prefix" style="padding: 0.75rem 0.6rem; border: 1.5px solid #cbd5e1; border-radius: 8px; font-weight: 800; font-size: 0.88rem; background: #f8fafc; cursor: pointer; color: #0f172a;">
                <option value="IN" ${isIndia ? 'selected' : ''}>🇮🇳 +91 (India)</option>
                <option value="AE" ${!isIndia ? 'selected' : ''}>🇦🇪 +971 (UAE)</option>
              </select>
              <input 
                type="tel" 
                id="modal-phone-input" 
                value="${phoneInputValue}" 
                placeholder="${placeholder}" 
                style="flex: 1; padding: 0.75rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; font-weight: 600;" 
              />
            </div>
          </div>

          <!-- Live Currency Indicator -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.75rem 0.85rem; margin-bottom: 1.25rem; font-size: 0.82rem; color: #334155; display: flex; align-items: flex-start; gap: 8px;">
            <span style="font-size: 1.2rem; line-height: 1;">⚡</span>
            <div>
              <div style="font-weight: 800; color: #0f172a;">Active Store Currency: ${currencyName}</div>
              <div style="color: #64748b; font-size: 0.78rem; margin-top: 2px;">
                ${isIndia 
                  ? '🇮🇳 Indian number detected: All laptop prices, discounts, and invoices will be displayed in Indian Rupees (₹).' 
                  : '🇦🇪 UAE number detected: All laptop prices, discounts, and invoices will be converted to UAE Dirhams (1 AED = 26.5 INR).'}
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn btn-orange btn-block" style="width: 100%; padding: 0.85rem; border-radius: 8px; font-weight: 800; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 12px rgba(255,107,0,0.25);">
            Apply & View Laptop Prices in ${isIndia ? '₹ Rupees' : 'AED Dirhams'} ➔
          </button>
        </form>
      </div>
    `;

    // Internal listeners
    const closeBtn = document.getElementById('btn-close-region-modal');
    closeBtn?.addEventListener('click', closeRegionModal);

    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) closeRegionModal();
    };

    const inCard = document.getElementById('card-opt-india');
    const aeCard = document.getElementById('card-opt-uae');
    const prefixSelect = document.getElementById('modal-dial-prefix');
    const phoneInput = document.getElementById('modal-phone-input');

    inCard?.addEventListener('click', () => {
      selectedCountry = 'IN';
      renderRegionModal();
    });

    aeCard?.addEventListener('click', () => {
      selectedCountry = 'AE';
      renderRegionModal();
    });

    prefixSelect?.addEventListener('change', (e) => {
      selectedCountry = e.target.value;
      renderRegionModal();
    });

    phoneInput?.addEventListener('input', (e) => {
      phoneInputValue = e.target.value;
      const clean = phoneInputValue.replace(/[\s\-\(\)]/g, '');
      if (clean.startsWith('+971') || clean.startsWith('00971') || clean.startsWith('971')) {
        if (selectedCountry !== 'AE') {
          selectedCountry = 'AE';
          renderRegionModal();
        }
      } else if (clean.startsWith('+91') || clean.startsWith('0091') || clean.startsWith('91')) {
        if (selectedCountry !== 'IN') {
          selectedCountry = 'IN';
          renderRegionModal();
        }
      }
    });

    const form = document.getElementById('region-country-phone-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      const updatedRegion = state.setRegionFromPhone(phoneVal, selectedCountry);

      closeRegionModal();
      showToast(
        updatedRegion.code === 'AE' 
          ? '🇦🇪 UAE Region Applied! Laptop prices are now shown in UAE Dirhams (AED).' 
          : '🇮🇳 India Region Applied! Laptop prices are now shown in Indian Rupees (₹).',
        'success'
      );

      // Re-render navbar and active route page
      renderNavbar();
      window.dispatchEvent(new CustomEvent('lapkart:region-changed', { detail: updatedRegion }));
      window.dispatchEvent(new CustomEvent('hashchange'));
    });
  }

  renderRegionModal();

  setTimeout(() => {
    modalOverlay.style.opacity = '1';
    document.body.style.overflow = 'hidden';
  }, 10);
}

export function closeRegionModal() {
  const modalOverlay = document.getElementById('region-modal-overlay');
  if (modalOverlay) {
    modalOverlay.style.opacity = '0';
    setTimeout(() => {
      modalOverlay.remove();
      document.body.style.overflow = '';
    }, 250);
  }
}

// Reactively re-render navbar when auth state changes or hash changes
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    renderNavbar();
  });
  window.addEventListener('lapkart:region-changed', () => {
    renderNavbar();
  });
}

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

