/**
 * Slide-out Cart Drawer Component
 * Manages cart list, quantity modifications, discount coupons, and checkout triggers
 */

import { state } from '../state.js';
import { showToast } from '../app.js';
import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { openAuthModal } from './authModal.js';

let appliedCoupon = null;
let couponDiscount = 0;

export function setAppliedCoupon({ couponCode, discount }) {
  appliedCoupon = couponCode;
  couponDiscount = discount;
}

export function getAppliedCoupon() {
  return { couponCode: appliedCoupon, discount: couponDiscount };
}

export function initCartDrawer() {
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

  if (overlay) {
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
        if (!auth.isAuthenticated()) {
          openAuthModal('login', {
            redirectHash: '#checkout-address',
            subtitle: 'Please sign in or create an account to proceed with your order'
          });
        } else {
          window.location.hash = '#checkout-address';
        }
      });
    }
  }
}

/**
 * Dedicated Full-Page Big Shopping Cart View
 * Route: #cart
 */
export function renderCartPage(container) {
  const cart = state.getCart();
  const totals = state.getCartTotals(couponDiscount);

  function formatPrice(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="big-cart-page-wrapper" style="background: #f8fafc; min-height: 80vh; padding: 2.5rem 0 5rem;">
        <div class="container" style="max-width: 1200px;">
          <!-- Page Back Button -->
          <div class="page-back-nav-container">
            <button type="button" class="btn-page-back" id="btn-cart-page-back" title="Back">
              <span class="back-arrow-icon">←</span>
              <span>Back</span>
            </button>
          </div>

          <div style="background: #ffffff; border-radius: 16px; border: 1.5px solid #e2e8f0; padding: 4rem 2rem; text-align: center; max-width: 650px; margin: 2rem auto; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
            <div style="font-size: 4.5rem; margin-bottom: 1.25rem;">🛒💨</div>
            <h2 style="font-size: 1.6rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">Your Shopping Cart is Empty</h2>
            <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 2rem; max-width: 450px; margin-left: auto; margin-right: auto;">
              Explore our wide collection of flagship gaming, creator, and ultrabook laptops with exclusive brand deals!
            </p>
            <a href="#store" class="btn btn-orange btn-lg" style="padding: 0.85rem 2.5rem; font-weight: 800; font-size: 1.05rem;">
              ⚡ Explore Laptops Catalog
            </a>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btn-cart-page-back')?.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else window.location.hash = '#store';
    });
    return;
  }

  container.innerHTML = `
    <div class="big-cart-page-wrapper" style="background: #f8fafc; min-height: 85vh; padding: 2rem 0 5rem;">
      <div class="container" style="max-width: 1280px;">
        
        <!-- Header & Back Nav -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <button type="button" class="btn-page-back" id="btn-cart-page-back" title="Back">
              <span class="back-arrow-icon">←</span>
              <span>Back</span>
            </button>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: #0f172a; margin: 0;">
              Shopping Cart <span style="font-size: 1rem; color: #64748b; font-weight: 700; background: #e2e8f0; padding: 3px 12px; border-radius: 20px; margin-left: 8px;">${totals.itemsCount} ${totals.itemsCount === 1 ? 'Item' : 'Items'}</span>
            </h1>
          </div>
          <a href="#store" style="color: #ff6b00; font-weight: 700; font-size: 0.92rem; text-decoration: none; display: flex; align-items: center; gap: 4px;">
            + Continue Shopping
          </a>
        </div>

        <!-- Big Cart Grid Layout (70% Items / 30% Summary) -->
        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 2rem; align-items: start;">
          
          <!-- Left Column: Big Cart Items List -->
          <div style="display: flex; flex-direction: column; gap: 1.25rem;" id="big-cart-items-list">
            ${cart.map(item => {
              const itemTotal = item.price * item.quantity;
              return `
                <div class="big-cart-card" data-id="${item.id}" style="background: #ffffff; border-radius: 14px; border: 1.5px solid #e2e8f0; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.03); transition: border-color 0.2s ease;">
                  
                  <!-- Big Laptop Image -->
                  <a href="#product/${item.id}" style="flex-shrink: 0; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px; width: 130px; height: 130px; display: flex; align-items: center; justify-content: center; padding: 8px;">
                    <img src="${item.image}" alt="${item.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                  </a>

                  <!-- Laptop Info & Controls -->
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <span class="badge" style="background: #eff6ff; color: #2563eb; font-weight: 800; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px;">⭐ ${item.brand || 'LAPTOP'}</span>
                      <span style="color: #16a34a; font-size: 0.8rem; font-weight: 700;">✓ In Stock</span>
                    </div>

                    <a href="#product/${item.id}" style="text-decoration: none;">
                      <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 4px; line-height: 1.35;" title="${item.name}">
                        ${item.name}
                      </h3>
                    </a>

                    <p style="font-size: 0.82rem; color: #64748b; margin: 0 0 0.75rem;">${item.specsSummary || 'High-performance configuration'}</p>

                    <!-- Quantity & Math Calculator -->
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                      <div style="display: inline-flex; align-items: center; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #f8fafc;">
                        <button type="button" class="big-cart-qty-minus" data-id="${item.id}" style="width: 36px; height: 36px; border: none; background: #ffffff; font-size: 1.2rem; font-weight: 800; color: #0f172a; cursor: pointer; display: flex; align-items: center; justify-content: center;">−</button>
                        <span style="min-width: 40px; text-align: center; font-size: 1.05rem; font-weight: 800; color: #0f172a; padding: 0 4px;">${item.quantity}</span>
                        <button type="button" class="big-cart-qty-plus" data-id="${item.id}" style="width: 36px; height: 36px; border: none; background: #ffffff; font-size: 1.2rem; font-weight: 800; color: #0f172a; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
                      </div>

                      <!-- Price Row -->
                      <div style="text-align: right;">
                        <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">
                          ${formatPrice(item.price)} × ${item.quantity}
                        </div>
                        <div style="display: flex; align-items: baseline; gap: 8px; justify-content: flex-end;">
                          <strong style="font-size: 1.35rem; font-weight: 900; color: #0f172a;">${formatPrice(itemTotal)}</strong>
                          <span style="font-size: 0.85rem; color: #94a3b8; text-decoration: line-through;">${formatPrice(item.mrp * item.quantity)}</span>
                          <span style="font-size: 0.82rem; color: #16a34a; font-weight: 800;">${item.discount || 18}% OFF</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Remove Button -->
                  <div style="flex-shrink: 0; align-self: flex-start;">
                    <button type="button" class="big-cart-remove-btn" data-id="${item.id}" title="Remove item" style="background: none; border: none; color: #ef4444; font-size: 0.85rem; font-weight: 700; cursor: pointer; padding: 6px 10px; border-radius: 6px; transition: background 0.15s ease;">
                      🗑️ Remove
                    </button>
                  </div>

                </div>
              `;
            }).join('')}
          </div>

          <!-- Right Column: Big Order Summary Box (Sticky) -->
          <div style="background: #ffffff; border-radius: 14px; border: 1.5px solid #e2e8f0; padding: 1.75rem; box-shadow: 0 4px 15px rgba(0,0,0,0.03); position: sticky; top: 90px;">
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1.5px solid #f1f5f9;">
              Order Summary
            </h3>

            <!-- Coupon Input -->
            <div style="margin-bottom: 1.25rem;">
              <label style="font-size: 0.8rem; font-weight: 700; color: #475569; display: block; margin-bottom: 0.35rem;">Promo / Referral Coupon:</label>
              <div style="display: flex; gap: 6px;">
                <input type="text" id="big-cart-coupon-input" placeholder="ENTER CODE (e.g. LAPTOP5000)" value="${appliedCoupon || ''}" style="flex: 1; padding: 0.6rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase;" />
                <button type="button" class="btn btn-primary btn-sm" id="btn-big-cart-apply-coupon" style="font-weight: 800; padding: 0 1.25rem;">
                  ${appliedCoupon ? 'Applied ✓' : 'Apply'}
                </button>
              </div>
              ${appliedCoupon ? `
                <div style="font-size: 0.8rem; color: #16a34a; font-weight: 700; margin-top: 0.4rem; display: flex; justify-content: space-between;">
                  <span>Coupon "${appliedCoupon}" Active (-${formatPrice(couponDiscount)})</span>
                  <a href="#" id="btn-big-cart-remove-coupon" style="color: #dc2626; text-decoration: none;">Remove</a>
                </div>
              ` : ''}
            </div>

            <!-- Price Breakdown Table -->
            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.92rem; margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; color: #475569;">
                <span>Total MRP (${totals.itemsCount} items)</span>
                <span>${formatPrice(totals.mrpTotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: #16a34a; font-weight: 600;">
                <span>Product Discount</span>
                <span>-${formatPrice(totals.catalogDiscount)}</span>
              </div>
              ${couponDiscount > 0 ? `
                <div style="display: flex; justify-content: space-between; color: #16a34a; font-weight: 700;">
                  <span>Special Promo Coupon</span>
                  <span>-${formatPrice(couponDiscount)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; color: #475569;">
                <span>Delivery Charges</span>
                <span style="color: #16a34a; font-weight: 800;">FREE</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: #475569;">
                <span>Packaging & Handling</span>
                <span style="color: #16a34a; font-weight: 800;">FREE</span>
              </div>
              
              <div style="height: 1px; background: #e2e8f0; margin: 0.5rem 0;"></div>

              <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 1.1rem; font-weight: 800; color: #0f172a;">
                <span>Total Payable Amount</span>
                <span style="font-size: 1.5rem; font-weight: 900; color: #ff6b00;">${formatPrice(totals.totalPayable)}</span>
              </div>
            </div>

            <!-- Big Checkout CTA -->
            <button type="button" class="btn btn-orange btn-lg btn-block" id="btn-big-cart-checkout" style="height: 52px; font-size: 1.05rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(255, 107, 0, 0.35); margin-bottom: 1.25rem;">
              Proceed to Checkout ➔
            </button>

            <!-- Trust Badges -->
            <div style="display: flex; flex-direction: column; gap: 0.6rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; font-size: 0.78rem; color: #64748b;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>🛡️</span>
                <span><strong>100% Secure Checkout</strong> • SSL Encrypted</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>🔄</span>
                <span><strong>7-Day Free Replacement Policy</strong> on all laptops</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>💵</span>
                <span><strong>Cash on Delivery (COD)</strong> Available</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  `;

  attachBigCartEvents(container);
}

function attachBigCartEvents(container) {
  // Back button
  container.querySelector('#btn-cart-page-back')?.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.location.hash = '#store';
  });

  // Quantity Plus
  container.querySelectorAll('.big-cart-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      state.updateCartQuantity(btn.dataset.id, 1);
      renderCartPage(container);
    });
  });

  // Quantity Minus
  container.querySelectorAll('.big-cart-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      state.updateCartQuantity(btn.dataset.id, -1);
      renderCartPage(container);
    });
  });

  // Remove Item
  container.querySelectorAll('.big-cart-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.removeFromCart(btn.dataset.id);
      showToast('Item removed from cart', 'warning');
      renderCartPage(container);
    });
  });

  // Apply Coupon
  const couponInput = container.querySelector('#big-cart-coupon-input');
  const applyCouponBtn = container.querySelector('#btn-big-cart-apply-coupon');
  const removeCouponBtn = container.querySelector('#btn-big-cart-remove-coupon');

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
          renderCartPage(container);
        } else {
          showToast(res.message || 'Invalid or expired coupon code.', 'error');
        }
      } catch {
        if (code === 'LAPTOP5000') {
          appliedCoupon = 'LAPTOP5000';
          couponDiscount = 5000;
          showToast('Coupon LAPTOP5000 applied! ₹5,000 Saved.', 'success');
          renderCartPage(container);
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
      renderCartPage(container);
    });
  }

  // Checkout Button
  const checkoutBtn = container.querySelector('#btn-big-cart-checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (!auth.isAuthenticated()) {
        openAuthModal('login', {
          redirectHash: '#checkout-address',
          subtitle: 'Please sign in or create an account to proceed with your order'
        });
      } else {
        window.location.hash = '#checkout-address';
      }
    });
  }
}
