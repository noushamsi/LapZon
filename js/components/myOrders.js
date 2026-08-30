/**
 * User Dashboard & My Orders Component
 * Includes: My Orders, Order Cancellation (allowed before shipping),
 * 0/5 to 5/5 Referral Progress Tracker, 30% OFF Coupon Reward, Cart, and Profile.
 */

import { api } from '../services/api.js';
import { state } from '../state.js';
import { auth } from '../services/auth.js';
import { showToast } from '../app.js';
import { setAppliedCoupon } from './cart.js';

export async function renderMyOrders(container, queryParams = {}) {
  let activeTab = queryParams.tab || 'orders'; // 'orders' | 'referrals' | 'profile'
  let orders = [];
  let referralData = { count: 0, referredUsers: [], unlockedCoupon: null };
  let isLoading = true;

  const currentUser = auth.getUser() || {
    id: 'usr-guest-01',
    name: 'Customer',
    email: 'customer@lapkart.com',
    role: 'user',
    referralCode: 'LK-GUEST'
  };

  const userRefCode = currentUser.referralCode || `LK-${currentUser.id.substring(currentUser.id.length - 6).toUpperCase()}`;

  function formatPrice(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoStr;
    }
  }

  async function loadDashboardData() {
    try {
      isLoading = true;
      const [ordersRes, refRes] = await Promise.allSettled([
        api.getMyOrders(),
        api.getReferralStatus(userRefCode)
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.orders) {
        orders = ordersRes.value.orders;
      } else {
        orders = state.getOrders();
      }

      if (refRes.status === 'fulfilled' && refRes.value.refInfo) {
        referralData = refRes.value.refInfo;
      }
    } catch {
      orders = state.getOrders();
    } finally {
      isLoading = false;
      render();
    }
  }

  function render() {
    const referralCount = referralData.count || 0;
    const progressPercent = Math.min(100, (referralCount / 5) * 100);
    const hasUnlockedCoupon = referralCount >= 5 && referralData.unlockedCoupon;

    container.innerHTML = `
      <div class="container" style="padding: 2.5rem 1.25rem 5rem; max-width: 1050px;">
        
        <!-- Dashboard Header Strip -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #fff; border-radius: var(--radius-md); padding: 1.75rem 2rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: var(--shadow-md);">
          <div style="display: flex; align-items: center; gap: 1.25rem;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: 800;">
              👤
            </div>
            <div>
              <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 2px;">
                ${currentUser.name}'s Dashboard
              </h2>
              <p style="font-size: 0.85rem; color: #94a3b8;">
                Manage your orders, shipment status, cancellations & referral rewards
              </p>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <a href="#store" class="btn btn-orange" style="font-weight: 700;">
              💻 Laptop Store
            </a>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="admin-nav-tabs" style="margin-bottom: 2rem;">
          <button type="button" class="admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}" data-tab="orders">
            📦 My Orders (${orders.length})
          </button>
          <button type="button" class="admin-tab-btn ${activeTab === 'referrals' ? 'active' : ''}" data-tab="referrals">
            🎁 30% OFF Referral Reward (${referralCount}/5)
          </button>
          <button type="button" class="admin-tab-btn ${activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
            ⚙️ Customer Profile
          </button>
        </div>

        <!-- ==============================================================
             TAB 1: MY ORDERS & CANCELLATION
             ============================================================== -->
        <div class="admin-panel ${activeTab === 'orders' ? 'active' : ''}" id="dash-panel-orders">
          ${orders.length === 0 ? `
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 4rem 2rem; text-align: center;">
              <div style="font-size: 3.5rem; margin-bottom: 1rem;">📦💨</div>
              <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem;">No Orders Placed Yet</h3>
              <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Explore our high-performance laptop store and place your order with Cash on Delivery!</p>
              <a href="#store" class="btn btn-primary btn-lg">Explore Laptops</a>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
              ${orders.map(order => {
                const isCancelled = order.status && order.status.startsWith('Cancelled');
                const isDelivered = order.status === 'Delivered';
                const isShippedOrBeyond = ['Shipped', 'In Transit', 'Out for Delivery', 'Delivered'].includes(order.status);
                const canCancel = !isCancelled && !isShippedOrBeyond;

                let statusBadgeStyle = 'background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;';
                if (order.status === 'Waiting for Admin Confirmation') {
                  statusBadgeStyle = 'background: #fffbeb; color: #b45309; border: 1px solid #fde68a;';
                } else if (order.status === 'Order Confirmed') {
                  statusBadgeStyle = 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;';
                } else if (isDelivered) {
                  statusBadgeStyle = 'background: #f0fdf4; color: #166534; border: 1px solid #86efac;';
                } else if (isCancelled) {
                  statusBadgeStyle = 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;';
                }

                return `
                  <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); box-shadow: var(--shadow-sm); overflow: hidden;">
                    <!-- Order Header -->
                    <div style="background-color: var(--bg-subtle); padding: 0.85rem 1.5rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; font-size: 0.85rem;">
                      <div>
                        <span style="color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Order Placed:</span>
                        <strong>${formatDate(order.createdAt)}</strong>
                      </div>
                      <div>
                        <span style="color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total:</span>
                        <strong style="color: var(--primary-blue); font-size: 0.95rem;">${formatPrice(order.pricing.totalAmount)}</strong>
                      </div>
                      <div>
                        <span style="color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Ship To:</span>
                        <strong>${order.customer?.fullName || 'Customer'}</strong>
                      </div>
                      <div>
                        <span style="color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Order ID:</span>
                        <strong style="font-family: monospace; color: var(--primary-blue);">${order.orderId}</strong>
                      </div>
                    </div>

                    <!-- Order Body -->
                    <div style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
                      <!-- Items -->
                      <div style="display: flex; flex-direction: column; gap: 1rem; flex: 1; min-width: 280px;">
                        ${order.items.map(item => `
                          <div style="display: flex; gap: 1.25rem; align-items: center;">
                            <img src="${item.image}" alt="${item.name}" style="width: 76px; height: 76px; object-fit: contain; background: var(--bg-subtle); border-radius: var(--radius-xs); padding: 4px;" />
                            <div>
                              <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${item.name}</h4>
                              <p style="font-size: 0.82rem; color: var(--text-muted);">${item.specsSummary}</p>
                              <div style="font-size: 0.9rem; font-weight: 700; margin-top: 4px;">
                                ${formatPrice(item.price)} × ${item.quantity}
                              </div>
                            </div>
                          </div>
                        `).join('')}

                        <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">
                          Payment Mode: <strong>${order.paymentMethod || 'Cash on Delivery'}</strong>
                        </div>
                      </div>

                      <!-- Status & Actions -->
                      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem; min-width: 240px;">
                        <span style="${statusBadgeStyle} padding: 0.4rem 0.85rem; border-radius: var(--radius-xs); font-size: 0.85rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
                          ${isCancelled ? '✕' : (isDelivered ? '✓' : '●')} Status: ${order.status}
                        </span>

                        ${!isCancelled && !isDelivered ? `
                          <span style="font-size: 0.8rem; color: var(--text-secondary);">
                            Expected Delivery: <strong>${order.deliveryDetails?.expectedDate || '3 Days'}</strong>
                          </span>
                        ` : ''}

                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end;">
                          ${!isCancelled ? `
                            <a href="#order-tracking/${order.orderId}" class="btn btn-sm btn-orange">
                              📦 Track Delivery ➔
                            </a>
                          ` : ''}

                          ${canCancel ? `
                            <button type="button" class="btn btn-sm btn-outline btn-cancel-order" data-order-id="${order.orderId}" style="color: var(--accent-red); border-color: rgba(211,47,47,0.3);">
                              ✕ Cancel Order
                            </button>
                          ` : (isShippedOrBeyond && !isCancelled ? `
                            <span style="font-size: 0.75rem; color: var(--text-muted);" title="Orders cannot be cancelled once dispatched/shipped.">
                              (Non-cancellable after shipping)
                            </span>
                          ` : '')}
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- ==============================================================
             TAB 2: REFERRAL PROGRAM & 30% OFF COUPON
             ============================================================== -->
        <div class="admin-panel ${activeTab === 'referrals' ? 'active' : ''}" id="dash-panel-referrals">
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 2rem; box-shadow: var(--shadow-sm); margin-bottom: 2rem;">
            
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
              <div style="width: 50px; height: 50px; border-radius: var(--radius-sm); background: #dcfce7; color: #15803d; font-size: 1.8rem; display: flex; align-items: center; justify-content: center;">
                🎁
              </div>
              <div>
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">Refer 5 Friends $\\rightarrow$ Unlock 30% OFF Coupon</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary);">Share your referral link with friends. When 5 new friends join LapKart Plus, unlock a flat 30% discount on your next laptop purchase!</p>
              </div>
            </div>

            <!-- Progress Bar -->
            <div style="background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 1.25rem; margin-bottom: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 700;">
                <span>Referral Milestone Progress:</span>
                <span style="color: var(--accent-emerald); font-size: 1.05rem;">${referralCount}/5 Referrals Completed</span>
              </div>

              <div style="width: 100%; height: 14px; background: #e2e8f0; border-radius: 10px; overflow: hidden;">
                <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); transition: width 0.5s ease;"></div>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">
                <span>0/5</span>
                <span>1/5</span>
                <span>2/5</span>
                <span>3/5</span>
                <span>4/5</span>
                <span>5/5 (30% OFF Unlocked)</span>
              </div>
            </div>

            <!-- Unique Referral Link Box -->
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label style="font-weight: 700;">Your Unique Share / Referral Link:</label>
              <div style="display: flex; gap: 0.75rem;">
                <input type="text" id="dash-referral-input" readonly value="${window.location.origin}/#store?ref=${userRefCode}" style="background: var(--bg-subtle); font-size: 0.9rem; font-family: monospace;" />
                <button type="button" class="btn btn-primary" id="btn-copy-dash-referral" style="white-space: nowrap;">
                  📋 Copy Link
                </button>
              </div>
            </div>

            <!-- UNLOCKED 30% OFF COUPON CARD -->
            ${hasUnlockedCoupon ? `
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: var(--radius-sm); padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                  <span class="badge" style="background: #15803d; color: #fff; font-size: 0.8rem; padding: 0.3rem 0.6rem; text-transform: uppercase;">🎉 Milestone Reward Unlocked</span>
                  <h3 style="color: #166534; font-size: 1.4rem; font-weight: 900; margin: 0.5rem 0 0.25rem;">
                    30% OFF Coupon Code: <span style="font-family: monospace; background: #fff; padding: 2px 8px; border-radius: 4px; border: 1px dashed #15803d;">${referralData.unlockedCoupon.code}</span>
                  </h3>
                  <p style="color: #15803d; font-size: 0.85rem;">
                    Valid for your next eligible laptop purchase. Single-use only. Valid until ${formatDate(referralData.unlockedCoupon.validUntil)}.
                  </p>
                </div>
                <button type="button" class="btn btn-green btn-lg btn-apply-unlocked-coupon" data-code="${referralData.unlockedCoupon.code}">
                  ⚡ Apply Coupon to Cart
                </button>
              </div>
            ` : `
              <div style="background: var(--bg-subtle); border: 1px dashed var(--border-subtle); border-radius: var(--radius-xs); padding: 1.25rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                🔒 Refer <strong>${Math.max(0, 5 - referralCount)} more friends</strong> to unlock your 30% OFF Coupon!
              </div>
            `}
          </div>

          <!-- List of Referred Users -->
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.5rem;">
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem;">Referred Friends (${referralData.referredUsers?.length || 0})</h4>
            ${(!referralData.referredUsers || referralData.referredUsers.length === 0) ? `
              <p style="color: var(--text-muted); font-size: 0.85rem;">No friends registered yet. Share your link via WhatsApp or email to start tracking progress!</p>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${referralData.referredUsers.map((u, i) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.85rem; background: var(--bg-subtle); border-radius: var(--radius-xs); font-size: 0.85rem;">
                    <span>👤 <strong>${u.name || `Friend #${i + 1}`}</strong> (${u.email})</span>
                    <span style="color: var(--accent-emerald); font-weight: 600;">✓ Joined on ${formatDate(u.joinedAt)}</span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <!-- ==============================================================
             TAB 3: CUSTOMER PROFILE
             ============================================================== -->
        <div class="admin-panel ${activeTab === 'profile' ? 'active' : ''}" id="dash-panel-profile">
          <div class="checkout-card" style="max-width: 600px;">
            <div class="checkout-card-header">
              <h3>👤 Customer Account Details</h3>
            </div>
            <div class="checkout-card-body" style="display: flex; flex-direction: column; gap: 1rem;">
              <div>
                <label style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Full Name</label>
                <div style="font-size: 1.05rem; font-weight: 700;">${currentUser.name}</div>
              </div>
              <div>
                <label style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Email Address</label>
                <div style="font-size: 1rem; color: var(--text-secondary);">${currentUser.email}</div>
              </div>
              <div>
                <label style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Account Role</label>
                <div><span class="badge badge-tag" style="text-transform: uppercase; font-weight: 700;">Customer (${currentUser.role || 'user'})</span></div>
              </div>
              <div>
                <label style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Your Referral Code</label>
                <div style="font-family: monospace; font-size: 1.1rem; font-weight: 800; color: var(--primary-blue);">${userRefCode}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    attachDashboardEvents();
  }

  function attachDashboardEvents() {
    // 1. Tab navigation
    container.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });

    // 2. Copy referral link button
    const copyRefBtn = container.querySelector('#btn-copy-dash-referral');
    const refInput = container.querySelector('#dash-referral-input');
    if (copyRefBtn && refInput) {
      copyRefBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(refInput.value);
          showToast('Referral link copied! 📋 Share with 5 friends to earn 30% OFF.', 'success');
        } catch {
          refInput.select();
          document.execCommand('copy');
          showToast('Link copied!', 'success');
        }
      });
    }

    // 3. Apply unlocked 30% coupon
    const applyCouponBtn = container.querySelector('.btn-apply-unlocked-coupon');
    if (applyCouponBtn) {
      applyCouponBtn.addEventListener('click', () => {
        const code = applyCouponBtn.dataset.code;
        setAppliedCoupon({
          couponCode: code,
          discount: Math.round(state.getCartTotals().sellingTotal * 0.3)
        });
        showToast(`Coupon "${code}" (30% OFF) applied to your Cart! 🎉`, 'success');
        window.location.hash = '#store';
      });
    }

    // 4. Cancel Order Handlers
    container.querySelectorAll('.btn-cancel-order').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.dataset.orderId;
        if (confirm(`Are you sure you want to cancel Order #${orderId}? This will restore the laptop to store inventory.`)) {
          btn.disabled = true;
          btn.textContent = 'Cancelling...';

          try {
            await api.cancelUserOrder(orderId, 'Cancelled by user from Dashboard');
            showToast(`Order #${orderId} has been cancelled.`, 'info');
            loadDashboardData();
          } catch (err) {
            showToast(err.message || 'Failed to cancel order.', 'error');
            btn.disabled = false;
            btn.textContent = '✕ Cancel Order';
          }
        }
      });
    });
  }

  // Initial load
  await loadDashboardData();
}
