/**
 * Slide-out Cart Drawer Component
 * Manages cart list, quantity modifications, discount coupons, and checkout triggers
 */

import { state } from '../state.js';
import { showToast } from '../app.js';

import { api } from '../services/api.js';

let appliedCoupon = null;
let couponDiscount = 0;

export function setAppliedCoupon({ couponCode, discount }) {
  appliedCoupon = couponCode;
  couponDiscount = discount;
}

export function getAppliedCoupon() {
  return { couponCode: appliedCoupon, discount: couponDiscount };
}
  const drawerHtml = `
    <div id="cart-drawer-overlay" class="cart-drawer-overlay">
      <div class="cart-drawer" id="cart-drawer">
        <div class="cart-drawer-header">
          <h3 id="cart-drawer-title">Shopping Cart (0)</h3>
          <button type="button" class="modal-close-btn" id="btn-close-cart" style="position: static; color: #fff; background: rgba(255,255,255,0.2);">✕</button>
        </div>

        <div class="cart-drawer-body" id="cart-drawer-items">
          <!-- Items injected here -->
        </div>

        <div class="cart-drawer-footer" id="cart-drawer-footer">
          <!-- Pricing summary injected here -->
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', drawerHtml);

  const overlay = document.getElementById('cart-drawer-overlay');
  const closeBtn = document.getElementById('btn-close-cart');

  window.addEventListener('lapkart:toggle-cart', () => {
    overlay.classList.toggle('active');
    renderCartContents();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });

  state.subscribe('cart', () => {
    if (overlay.classList.contains('active')) {
      renderCartContents();
    }
  });
}

export function openCart() {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (overlay) {
    overlay.classList.add('active');
    renderCartContents();
  }
}

export function closeCart() {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

export function getAppliedCoupon() {
  return { coupon: appliedCoupon, discount: couponDiscount };
}

export function renderCartContents() {
  const cart = state.getCart();
  const totals = state.getCartTotals(couponDiscount);
  const itemsContainer = document.getElementById('cart-drawer-items');
  const footerContainer = document.getElementById('cart-drawer-footer');
  const titleEl = document.getElementById('cart-drawer-title');

  if (titleEl) {
    titleEl.textContent = `Shopping Cart (${totals.itemsCount})`;
  }

  function formatPrice(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
        <div style="font-size: 3.5rem; margin-bottom: 1rem;">🛒💨</div>
        <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">Your Cart is Empty</h4>
        <p style="font-size: 0.85rem; margin-bottom: 1.5rem;">Explore our high-performance laptop catalog and grab exclusive deals!</p>
        <a href="#store" class="btn btn-primary" onclick="document.getElementById('cart-drawer-overlay').classList.remove('active')">
          Explore Laptops
        </a>
      </div>
    `;
    footerContainer.innerHTML = '';
    return;
  }

  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item-row" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
      <div class="cart-item-details">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-specs">${item.specsSummary}</span>
        <div class="cart-item-price-row">
          <strong style="font-size: 1.05rem;">${formatPrice(item.price)}</strong>
          <span style="font-size: 0.8rem; color: var(--text-muted); text-decoration: line-through;">${formatPrice(item.mrp)}</span>
          <span style="font-size: 0.8rem; color: var(--accent-emerald); font-weight: 700;">${item.discount}% off</span>
        </div>
        <div class="cart-item-qty-ctrl">
          <button class="qty-btn btn-qty-minus" data-id="${item.id}">-</button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn btn-qty-plus" data-id="${item.id}">+</button>
          <button class="cart-item-remove-btn" data-id="${item.id}">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  footerContainer.innerHTML = `
    <!-- Coupon Box -->
    <div class="coupon-input-wrap">
      <input type="text" id="cart-coupon-code" placeholder="ENTER COUPON (e.g. LAPTOP5000)" value="${appliedCoupon || ''}" />
      <button type="button" class="btn btn-primary btn-sm" id="btn-apply-coupon">
        ${appliedCoupon ? 'Applied ✓' : 'Apply'}
      </button>
    </div>
    ${appliedCoupon ? `
      <div style="font-size: 0.78rem; color: var(--accent-emerald); font-weight: 700; display: flex; justify-content: space-between;">
        <span>Coupon "${appliedCoupon}" Active (-${formatPrice(couponDiscount)})</span>
        <a href="#" id="btn-remove-coupon" style="color: var(--accent-red); text-decoration: none;">Remove</a>
      </div>
    ` : ''}

    <div class="cart-summary-row">
      <span>Total MRP (${totals.itemsCount} items)</span>
      <span>${formatPrice(totals.mrpTotal)}</span>
    </div>
    <div class="cart-summary-row" style="color: var(--accent-emerald);">
      <span>Product Discount</span>
      <span>-${formatPrice(totals.catalogDiscount)}</span>
    </div>
    ${couponDiscount > 0 ? `
      <div class="cart-summary-row" style="color: var(--accent-emerald);">
        <span>Special Promo Coupon</span>
        <span>-${formatPrice(couponDiscount)}</span>
      </div>
    ` : ''}
    <div class="cart-summary-row">
      <span>Delivery Charges</span>
      <span style="color: var(--accent-emerald); font-weight: 700;">FREE</span>
    </div>
    <div class="cart-summary-row total-row">
      <span>Total Amount</span>
      <span>${formatPrice(totals.totalPayable)}</span>
    </div>

    <button type="button" class="btn btn-orange btn-lg btn-block" id="btn-cart-checkout" style="margin-top: 0.5rem;">
      Proceed to Checkout (1 of 2) ➔
    </button>
  `;

  attachCartEvents();
}

function attachCartEvents() {
  const itemsContainer = document.getElementById('cart-drawer-items');
  const footerContainer = document.getElementById('cart-drawer-footer');

  if (itemsContainer) {
    itemsContainer.querySelectorAll('.btn-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        state.updateCartQuantity(btn.dataset.id, 1);
      });
    });

    itemsContainer.querySelectorAll('.btn-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        state.updateCartQuantity(btn.dataset.id, -1);
      });
    });

    itemsContainer.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.removeFromCart(btn.dataset.id);
        showToast('Item removed from cart', 'warning');
      });
    });
  }

  if (footerContainer) {
    const applyCouponBtn = footerContainer.querySelector('#btn-apply-coupon');
    const couponInput = footerContainer.querySelector('#cart-coupon-code');
    const removeCouponBtn = footerContainer.querySelector('#btn-remove-coupon');

    if (applyCouponBtn && couponInput) {
      applyCouponBtn.addEventListener('click', async () => {
        const code = couponInput.value.trim().toUpperCase();
        if (!code) {
          showToast('Please enter a coupon code.', 'warning');
          return;
        }

        const totals = state.getCartTotals();
        try {
          const res = await api.validateCoupon(code, totals.sellingTotal);
          if (res && res.valid) {
            appliedCoupon = res.coupon.code;
            couponDiscount = res.discountAmount;
            showToast(res.message || `Coupon "${code}" applied! 🎉`, 'success');
            renderCartContents();
          } else {
            showToast(res.message || 'Invalid or expired coupon code.', 'error');
          }
        } catch {
          if (code === 'LAPTOP5000') {
            appliedCoupon = 'LAPTOP5000';
            couponDiscount = 5000;
            showToast('Coupon LAPTOP5000 applied! ₹5,000 Saved.', 'success');
            renderCartContents();
          } else {
            showToast('Invalid Coupon code!', 'error');
          }
        }
      });
    }

    if (removeCouponBtn) {
      removeCouponBtn.addEventListener('click', (e) => {
        e.preventDefault();
        appliedCoupon = null;
        couponDiscount = 0;
        showToast('Coupon removed', 'warning');
        renderCartContents();
      });
    }

    const checkoutBtn = footerContainer.querySelector('#btn-cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        closeCart();
        window.location.hash = '#checkout-address';
      });
    }
  }
}
