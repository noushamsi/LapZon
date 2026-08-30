/**
 * Customer User Dashboard Component
 * Professional customer account portal with tabs:
 * 1. Profile & Password
 * 2. My Orders, Live Tracking, Cancellation & Returns
 * 3. Saved Wishlist
 * 4. Delivery Addresses
 * 5. 30% Referral Rewards & Coupons
 * 6. Support Tickets
 */

import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { state } from '../state.js';
import { showToast } from '../app.js';
import { openAuthModal } from './authModal.js';

export async function renderUserDashboard(container) {
  const user = auth.getUser();
  if (!user || user.role === 'admin') {
    container.innerHTML = `
      <div class="container" style="max-width: 600px; margin: 4rem auto; text-align: center; padding: 3rem 1.5rem; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <div style="font-size: 3.5rem; margin-bottom: 1rem;">👤🔒</div>
        <h2 style="font-size: 1.6rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">Customer Account Sign In</h2>
        <p style="color: #64748b; margin-bottom: 2rem; font-size: 0.95rem;">
          Please sign in to view your orders, live tracking updates, saved delivery addresses, wishlist, and 30% referral discount coupons.
        </p>
        <div style="display: flex; justify-content: center; gap: 1rem;">
          <button type="button" class="btn btn-primary btn-lg" id="btn-dashboard-signin" style="padding: 0.75rem 2rem;">
            Sign In / Register
          </button>
          <a href="#store" class="btn btn-secondary btn-lg" style="padding: 0.75rem 2rem;">
            Explore Laptops
          </a>
        </div>
      </div>
    `;

    document.getElementById('btn-dashboard-signin')?.addEventListener('click', () => {
      openAuthModal('login');
    });
    return;
  }

  // Parse active tab from URL query: e.g. #user-dashboard?tab=orders
  const hash = window.location.hash || '';
  const urlParams = new URLSearchParams(hash.split('?')[1] || '');
  const activeTab = urlParams.get('tab') || 'orders';

  // Load initial user data in parallel
  let orders = [];
  let addresses = [];
  let wishlist = { products: [] };
  let refData = { count: 0, referredUsers: [], unlockedCoupon: null };
  let tickets = [];
  let returns = [];

  try {
    const [ordersRes, addrRes, wishRes, refRes, tickRes, retRes] = await Promise.allSettled([
      api.getMyOrders(),
      api.getUserAddresses(),
      api.getWishlist(),
      api.getReferralStatus(user.id || user.email),
      api.getUserTickets(user.email),
      api.getUserReturns()
    ]);

    if (ordersRes.status === 'fulfilled') {
      const allOrders = ordersRes.value?.orders || ordersRes.value || [];
      if (Array.isArray(allOrders) && allOrders.length > 0) {
        orders = allOrders.filter(o => o.userId === user.id || o.customer?.email === user.email || o.customer?.userId === user.id || !o.userId);
      }
    }
    
    // If API returned empty, check local state
    if (orders.length === 0) {
      const local = state.getOrders();
      orders = local.filter(o => o.userId === user.id || o.customer?.email === user.email || o.customer?.userId === user.id || !o.userId);
    }

    if (addrRes.status === 'fulfilled') addresses = addrRes.value?.addresses || [];
    if (wishRes.status === 'fulfilled') wishlist = wishRes.value || { products: [] };
    if (refRes.status === 'fulfilled') refData = refRes.value?.refInfo || refData;
    if (tickRes.status === 'fulfilled') tickets = tickRes.value?.tickets || [];
    if (retRes.status === 'fulfilled') returns = retRes.value?.returns || [];
  } catch (err) {
    console.error('Failed to load user dashboard resources:', err);
  }

  const referralCode = `LK-${(user.name || 'USER').replace(/\s+/g, '').toUpperCase().substring(0, 4)}-${user.id ? user.id.slice(-4).toUpperCase() : '777'}`;
  const referralLink = `${window.location.origin}${window.location.pathname}#store?ref=${referralCode}`;

  container.innerHTML = `
    <div class="user-dashboard-wrapper" style="background: #f8fafc; min-height: 80vh; padding: 2rem 0 4rem;">
      <div class="container" style="max-width: 1200px;">
        
        <!-- Continue Shopping Navigation -->
        <div style="margin-bottom: 1.5rem;">
          <a href="#store" class="btn btn-outline-primary" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; border-radius: 8px; padding: 0.5rem 1.25rem; background: #ffffff; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            ← Continue Shopping
          </a>
        </div>

        <!-- Dashboard Grid Layout -->
        <div style="display: grid; grid-template-columns: 260px 1fr; gap: 2rem; align-items: start;">
          
          <!-- Sidebar Navigation -->
          <div style="background: #ffffff; border-radius: 12px; padding: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <nav style="display: flex; flex-direction: column; gap: 4px;">
              <button type="button" class="dash-tab-btn ${activeTab === 'orders' ? 'active' : ''}" data-tab="orders" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; text-align: left; background: ${activeTab === 'orders' ? '#eff6ff' : 'transparent'}; color: ${activeTab === 'orders' ? '#2874f0' : '#475569'};">
                <span>📦 My Orders</span>
                <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${orders.length}</span>
              </button>

              <button type="button" class="dash-tab-btn ${activeTab === 'wishlist' ? 'active' : ''}" data-tab="wishlist" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; text-align: left; background: ${activeTab === 'wishlist' ? '#eff6ff' : 'transparent'}; color: ${activeTab === 'wishlist' ? '#2874f0' : '#475569'};">
                <span>💖 Saved Wishlist</span>
                <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${wishlist.products?.length || 0}</span>
              </button>

              <button type="button" class="dash-tab-btn ${activeTab === 'addresses' ? 'active' : ''}" data-tab="addresses" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; text-align: left; background: ${activeTab === 'addresses' ? '#eff6ff' : 'transparent'}; color: ${activeTab === 'addresses' ? '#2874f0' : '#475569'};">
                <span>📍 Saved Addresses</span>
                <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${addresses.length}</span>
              </button>

              <button type="button" class="dash-tab-btn ${activeTab === 'referral' ? 'active' : ''}" data-tab="referral" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; text-align: left; background: ${activeTab === 'referral' ? '#eff6ff' : 'transparent'}; color: ${activeTab === 'referral' ? '#2874f0' : '#475569'};">
                <span>🎁 30% Referral Reward</span>
                <span style="background: #fef08a; color: #854d0e; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 800;">${refData.count || 0}/5</span>
              </button>

              <button type="button" class="dash-tab-btn ${activeTab === 'returns' ? 'active' : ''}" data-tab="returns" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; text-align: left; background: ${activeTab === 'returns' ? '#eff6ff' : 'transparent'}; color: ${activeTab === 'returns' ? '#2874f0' : '#475569'};">
                <span>🔄 Returns & Exchanges</span>
                <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${returns.length}</span>
              </button>

              <button type="button" class="dash-tab-btn ${activeTab === 'support' ? 'active' : ''}" data-tab="support" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; text-align: left; background: ${activeTab === 'support' ? '#eff6ff' : 'transparent'}; color: ${activeTab === 'support' ? '#2874f0' : '#475569'};">
                <span>💬 Help & Support</span>
                <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${tickets.length}</span>
              </button>

              <button type="button" class="dash-tab-btn ${activeTab === 'profile' ? 'active' : ''}" data-tab="profile" style="display: flex; align-items: center; gap: 8px; padding: 0.75rem 1rem; border: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; text-align: left; background: ${activeTab === 'profile' ? '#eff6ff' : 'transparent'}; color: ${activeTab === 'profile' ? '#2874f0' : '#475569'};">
                👤 Profile Settings
              </button>
            </nav>
          </div>

          <!-- Main Content Area -->
          <div class="dash-tab-content" id="dash-main-tab-content">
            ${renderActiveTabContent({ activeTab, orders, addresses, wishlist, refData, referralCode, referralLink, tickets, returns, user })}
          </div>
        </div>

      </div>
    </div>
  `;

  attachUserDashboardEvents(container, { activeTab, user, orders, addresses, wishlist, refData, referralCode, referralLink, tickets, returns });
}

function renderActiveTabContent({ activeTab, orders, addresses, wishlist, refData, referralCode, referralLink, tickets, returns, user }) {
  function formatPrice(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  // 1. MY ORDERS TAB
  if (activeTab === 'orders') {
    if (orders.length === 0) {
      return `
        <div style="background: #fff; border-radius: 12px; padding: 3rem; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">📦💨</div>
          <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">No Orders Placed Yet</h3>
          <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem;">Explore top-rated Apple MacBooks, ASUS ROG Gaming, and Dell XPS laptops with Cash on Delivery!</p>
          <a href="#store" class="btn btn-primary" style="padding: 0.75rem 2rem;">Explore Laptops</a>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0;">My Orders (${orders.length})</h3>
          <span style="font-size: 0.85rem; color: #64748b;">Showing all your laptop purchases</span>
        </div>

        ${orders.map(order => {
          const item = order.items?.[0] || {};
          const isCancelled = order.status.startsWith('Cancelled');
          const isDelivered = order.status === 'Delivered';
          const isCancellable = ['Waiting for Admin Confirmation', 'Order Confirmed', 'Packed'].includes(order.status);
          const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

          let badgeColor = '#2874f0';
          let badgeBg = '#eff6ff';
          if (order.status === 'Waiting for Admin Confirmation') { badgeColor = '#d97706'; badgeBg = '#fef3c7'; }
          if (order.status === 'Order Confirmed') { badgeColor = '#2563eb'; badgeBg = '#dbeafe'; }
          if (order.status === 'Delivered') { badgeColor = '#16a34a'; badgeBg = '#dcfce7'; }
          if (isCancelled) { badgeColor = '#dc2626'; badgeBg = '#fee2e2'; }

          return `
            <div class="user-order-card" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
              <!-- Top Bar -->
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <span style="font-weight: 800; font-size: 1.05rem; color: #0f172a;">Order #${order.orderId}</span>
                  <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">Placed on ${formattedDate}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 800; font-size: 0.82rem; padding: 4px 12px; border-radius: 20px;">
                    ${order.status === 'Waiting for Admin Confirmation' ? '⏳ Waiting for Admin Confirmation' : order.status}
                  </span>
                </div>
              </div>

              <!-- Item Snapshot -->
              <div style="display: grid; grid-template-columns: 100px 1fr auto; gap: 1.25rem; align-items: center;">
                <img src="${item.image || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80'}" alt="${item.name || 'Laptop'}" style="width: 100px; height: 75px; object-fit: contain; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;" />
                
                <div>
                  <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem;">${item.name || 'Laptop'}</h4>
                  <div style="font-size: 0.82rem; color: #64748b; margin-bottom: 0.5rem;">${item.specsSummary || 'High-performance Laptop'} • Qty: ${item.quantity || 1}</div>
                  <div style="font-size: 0.85rem; color: #334155;">
                    <span>Payment: <strong>${order.paymentMethod || 'Cash on Delivery'}</strong></span>
                  </div>
                </div>

                <div style="text-align: right;">
                  <div style="font-size: 1.2rem; font-weight: 800; color: #0f172a;">${formatPrice(order.pricing?.totalAmount || item.price || 0)}</div>
                  <div style="font-size: 0.78rem; color: #16a34a; font-weight: 700;">Free Delivery Included</div>
                </div>
              </div>

              <!-- Delivery Address Strip -->
              <div style="background: #f8fafc; border-radius: 8px; padding: 0.75rem 1rem; margin-top: 1.25rem; font-size: 0.82rem; color: #475569; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  📍 Deliver to: <strong>${order.customer?.fullName || 'Customer'}</strong> (${order.customer?.phone || ''}) - ${order.customer?.houseNo || ''}, ${order.customer?.street || ''}, ${order.customer?.city || ''}, ${order.customer?.state || ''} - <strong>${order.customer?.pinCode || ''}</strong>
                </div>
                ${order.deliveryDetails?.trackingNumber ? `
                  <div style="color: #2874f0; font-weight: 700;">
                    AWB: ${order.deliveryDetails.trackingNumber} (${order.deliveryDetails.courierPartner || 'Ekart'})
                    ${order.deliveryDetails.deliveryPersonName ? `• 🛵 Agent: ${order.deliveryDetails.deliveryPersonName} ${order.deliveryDetails.deliveryPersonPhone ? `(${order.deliveryDetails.deliveryPersonPhone})` : ''}` : ''}
                    ${order.deliveryDetails.expectedDate ? `• 📅 Est. Delivery: ${order.deliveryDetails.expectedDate.split('T')[0]}` : ''}
                  </div>
                ` : ''}
              </div>

              <!-- Action Buttons -->
              <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; flex-wrap: wrap;">
                <a href="#order-tracking?id=${order.orderId}" class="btn btn-outline-primary btn-sm" style="font-weight: 700; border-radius: 6px; padding: 0.45rem 1rem;">
                  📍 Live Tracking
                </a>

                ${isCancellable && !isCancelled ? `
                  <button type="button" class="btn btn-sm btn-cancel-order" data-order-id="${order.orderId}" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; font-weight: 700; border-radius: 6px; padding: 0.45rem 1rem; cursor: pointer;">
                    ✕ Cancel Order
                  </button>
                ` : ''}

                ${isDelivered ? `
                  <button type="button" class="btn btn-sm btn-return-order" data-order-id="${order.orderId}" style="background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; font-weight: 700; border-radius: 6px; padding: 0.45rem 1rem; cursor: pointer;">
                    🔄 Return / Replace
                  </button>
                  <button type="button" class="btn btn-sm btn-review-order" data-product-id="${item.id}" data-product-name="${item.name}" style="background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; font-weight: 700; border-radius: 6px; padding: 0.45rem 1rem; cursor: pointer;">
                    ⭐ Rate & Review
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 2. WISHLIST TAB
  if (activeTab === 'wishlist') {
    const items = wishlist.products || [];
    if (items.length === 0) {
      return `
        <div style="background: #fff; border-radius: 12px; padding: 3rem; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">💖💨</div>
          <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">Your Wishlist is Empty</h3>
          <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem;">Save your favorite laptops to compare specs and buy anytime!</p>
          <a href="#store" class="btn btn-primary" style="padding: 0.75rem 2rem;">Explore Laptops</a>
        </div>
      `;
    }

    return `
      <div>
        <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-bottom: 1.5rem;">Saved Wishlist (${items.length})</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem;">
          ${items.map(p => `
            <div style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <img src="${p.image}" alt="${p.name}" style="width: 100%; height: 140px; object-fit: contain; margin-bottom: 0.75rem;" />
                <span style="font-size: 0.75rem; color: #2874f0; font-weight: 700; text-transform: uppercase;">${p.brand}</span>
                <h4 style="font-size: 0.92rem; font-weight: 700; color: #0f172a; margin: 0.25rem 0 0.5rem; line-height: 1.3;">${p.name}</h4>
                <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem;">${formatPrice(p.price)}</div>
              </div>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-primary btn-sm btn-wishlist-cart" data-id="${p.id}" style="flex: 1; font-weight: 700;">
                  🛒 Add to Cart
                </button>
                <button type="button" class="btn btn-outline-danger btn-sm btn-wishlist-remove" data-id="${p.id}" title="Remove" style="padding: 0.4rem 0.6rem;">
                  ✕
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 3. SAVED ADDRESSES TAB
  if (activeTab === 'addresses') {
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0;">Saved Delivery Addresses (${addresses.length})</h3>
          <button type="button" class="btn btn-primary btn-sm" id="btn-show-add-address-modal" style="font-weight: 700;">
            + Add New Address
          </button>
        </div>

        ${addresses.length === 0 ? `
          <div style="background: #fff; border-radius: 12px; padding: 3rem; text-align: center; border: 1px solid #e2e8f0;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📍</div>
            <h4 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">No Delivery Addresses Saved</h4>
            <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 1.5rem;">Add your home or office address for 1-click Cash on Delivery checkout.</p>
            <button type="button" class="btn btn-primary" id="btn-empty-add-address">+ Add Delivery Address</button>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem;">
            ${addresses.map(a => `
              <div style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-weight: 800; color: #0f172a; font-size: 1rem;">${a.fullName}</span>
                    <span style="background: #f1f5f9; color: #475569; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 4px;">${a.addressType || 'Home'}</span>
                  </div>
                  <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.25rem;">📱 ${a.phone}</div>
                  <div style="font-size: 0.85rem; color: #334155; line-height: 1.4;">
                    ${a.houseNo}, ${a.street}<br/>
                    ${a.city}, ${a.state} - <strong>${a.pinCode}</strong>
                  </div>
                </div>

                <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end;">
                  <button type="button" class="btn btn-outline-danger btn-sm btn-delete-address" data-id="${a.id}" style="font-size: 0.8rem; padding: 3px 10px; color: #dc2626; border-color: #fca5a5;">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  // 4. REFERRAL REWARDS & 30% COUPONS TAB
  if (activeTab === 'referral') {
    const count = refData.count || 0;
    const progressPercent = Math.min(100, (count / 5) * 100);
    const coupon = refData.unlockedCoupon;

    return `
      <div>
        <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          
          <div style="text-align: center; max-width: 600px; margin: 0 auto 2rem;">
            <span style="background: #fef08a; color: #854d0e; font-weight: 800; font-size: 0.8rem; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">
              ⭐ Share & Earn Reward Program
            </span>
            <h3 style="font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0.75rem 0 0.5rem;">
              Refer 5 Friends & Unlock a 30% OFF Coupon!
            </h3>
            <p style="color: #64748b; font-size: 0.9rem;">
              Share LapKart Plus with friends and colleagues. Once 5 new users join through your referral link, you automatically receive a single-use 30% OFF discount coupon!
            </p>
          </div>

          <!-- Progress Bar Tracker (0/5 to 5/5) -->
          <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; border: 1px solid #e2e8f0; margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-weight: 800; font-size: 0.95rem; color: #0f172a;">Referral Milestone Progress</span>
              <span style="font-weight: 900; font-size: 1.1rem; color: #2874f0;">${count} / 5 Friends Joined</span>
            </div>
            
            <div style="height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; position: relative;">
              <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #2874f0, #10b981); border-radius: 6px; transition: width 0.4s ease;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; font-weight: 700; margin-top: 0.5rem;">
              <span>0 (Start)</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span style="color: #10b981;">5 (30% OFF Unlocked! 🎉)</span>
            </div>
          </div>

          <!-- Unlocked Coupon Banner or Active Coupon -->
          ${coupon ? `
            <div style="background: linear-gradient(135deg, #065f46, #059669); border-radius: 12px; padding: 1.5rem; color: #ffffff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;">
              <div>
                <div style="font-size: 0.8rem; font-weight: 800; color: #a7f3d0; text-transform: uppercase;">🎉 Referral Milestone Reached!</div>
                <h4 style="font-size: 1.5rem; font-weight: 900; margin: 0.25rem 0;">30% OFF Flat Discount Coupon</h4>
                <div style="font-size: 0.85rem; opacity: 0.9;">Coupon Code: <strong style="background: rgba(255,255,255,0.25); padding: 2px 8px; border-radius: 4px; letter-spacing: 1px;">${coupon.code}</strong> ${coupon.isUsed ? '(Already Redeemed)' : '• Valid for your next purchase'}</div>
              </div>
              <div>
                ${!coupon.isUsed ? `
                  <button type="button" class="btn btn-apply-ref-coupon" data-code="${coupon.code}" style="background: #ffffff; color: #065f46; font-weight: 800; padding: 0.65rem 1.5rem; border-radius: 8px;">
                    ⚡ Apply Coupon to Cart
                  </button>
                ` : `
                  <span style="background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.85rem;">Used in Order ✓</span>
                `}
              </div>
            </div>
          ` : ''}

          <!-- Referral Link Box -->
          <div style="background: #f1f5f9; border-radius: 10px; padding: 1.25rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #475569; margin-bottom: 0.5rem;">Your Unique Referral Link</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="user-ref-link-input" readonly value="${referralLink}" style="flex: 1; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; font-size: 0.85rem; font-family: monospace;" />
              <button type="button" class="btn btn-primary" id="btn-copy-ref-link" style="font-weight: 700; padding: 0.65rem 1.25rem;">
                📋 Copy Link
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  // 5. RETURNS & EXCHANGES TAB
  if (activeTab === 'returns') {
    return `
      <div>
        <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-bottom: 1.5rem;">Returns & Replacement Requests (${returns.length})</h3>
        
        ${returns.length === 0 ? `
          <div style="background: #fff; border-radius: 12px; padding: 3rem; text-align: center; border: 1px solid #e2e8f0;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔄</div>
            <h4 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">No Active Return Requests</h4>
            <p style="color: #64748b; font-size: 0.85rem;">Eligible delivered laptops feature a 7-day replacement guarantee directly from My Orders.</p>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${returns.map(r => `
              <div style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <div>
                    <span style="font-weight: 800; color: #0f172a;">Request #${r.id}</span> • <span style="font-size: 0.85rem; color: #64748b;">Order #${r.orderId}</span>
                  </div>
                  <span style="background: #fef3c7; color: #b45309; font-weight: 800; font-size: 0.8rem; padding: 3px 10px; border-radius: 12px;">${r.status}</span>
                </div>
                <div style="font-size: 0.85rem; color: #334155; margin-bottom: 0.5rem;">
                  <strong>Reason:</strong> ${r.reason} - ${r.description}
                </div>
                ${r.adminNotes ? `
                  <div style="background: #f8fafc; border-left: 3px solid #2874f0; padding: 0.5rem 0.75rem; font-size: 0.82rem; color: #1e40af;">
                    <strong>Admin Note:</strong> ${r.adminNotes}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  // 6. SUPPORT TICKETS TAB
  if (activeTab === 'support') {
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0;">Help & Support Inquiries (${tickets.length})</h3>
          <a href="#support" class="btn btn-primary btn-sm" style="font-weight: 700;">+ New Ticket</a>
        </div>

        ${tickets.length === 0 ? `
          <div style="background: #fff; border-radius: 12px; padding: 3rem; text-align: center; border: 1px solid #e2e8f0;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">💬</div>
            <h4 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">No Support Inquiries</h4>
            <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 1rem;">Need help with warranty, delivery tracking, or technical specs?</p>
            <a href="#support" class="btn btn-primary">Contact Support</a>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${tickets.map(t => `
              <div style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span style="font-weight: 800; color: #0f172a;">${t.subject}</span>
                  <span style="background: ${t.status === 'Resolved' ? '#dcfce7' : '#fef3c7'}; color: ${t.status === 'Resolved' ? '#16a34a' : '#b45309'}; font-weight: 800; font-size: 0.78rem; padding: 2px 8px; border-radius: 12px;">
                    ${t.status}
                  </span>
                </div>
                <p style="font-size: 0.85rem; color: #475569; margin: 0 0 0.5rem;">${t.message}</p>
                ${t.reply ? `
                  <div style="background: #eff6ff; border-left: 3px solid #2874f0; padding: 0.6rem 0.85rem; border-radius: 0 8px 8px 0; font-size: 0.82rem; color: #1e40af; margin-top: 0.5rem;">
                    <strong>LapKart Support Agent:</strong> ${t.reply}
                  </div>
                ` : '<div style="font-size: 0.78rem; color: #94a3b8;">Awaiting support representative response...</div>'}
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  // 7. PROFILE TAB
  return `
    <div style="background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 2rem;">
      <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-bottom: 1.5rem;">Customer Profile Settings</h3>
      
      <form id="form-user-profile" style="max-width: 500px;">
        <div style="margin-bottom: 1rem;">
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Full Name</label>
          <input type="text" id="prof-name-input" value="${user.name || ''}" required style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
        </div>

        <div style="margin-bottom: 1rem;">
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Email Address (Read-only)</label>
          <input type="email" value="${user.email || ''}" disabled style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; background: #f1f5f9; color: #64748b;" />
        </div>

        <div style="margin-bottom: 1rem;">
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Mobile Number</label>
          <input type="tel" id="prof-phone-input" value="${user.phone || ''}" placeholder="10-digit mobile number" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">New Password (Optional)</label>
          <input type="password" id="prof-pass-input" placeholder="Leave blank to keep unchanged" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
        </div>

        <button type="submit" class="btn btn-primary" style="font-weight: 800; padding: 0.75rem 2rem;">
          Save Profile Changes
        </button>
      </form>
    </div>
  `;
}

function attachUserDashboardEvents(container, context) {
  // Tab switcher
  container.querySelectorAll('.dash-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      window.location.hash = `#user-dashboard?tab=${tab}`;
    });
  });

  // Logout button
  document.getElementById('btn-user-logout')?.addEventListener('click', () => {
    auth.logout();
    showToast('Logged out of account.', 'info');
    window.location.hash = '#welcome';
  });

  // Copy referral link
  document.getElementById('btn-copy-ref-link')?.addEventListener('click', () => {
    const input = document.getElementById('user-ref-link-input');
    if (input) {
      navigator.clipboard.writeText(input.value);
      showToast('Referral link copied to clipboard! 📋', 'success');
    }
  });

  // Apply referral coupon
  container.querySelectorAll('.btn-apply-ref-coupon').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      window.dispatchEvent(new CustomEvent('lapkart:toggle-cart'));
      setTimeout(() => {
        const couponInput = document.getElementById('cart-coupon-code');
        const applyBtn = document.getElementById('btn-apply-coupon');
        if (couponInput && applyBtn) {
          couponInput.value = code;
          applyBtn.click();
        }
      }, 300);
    });
  });

  // Cancel order button with confirmation
  container.querySelectorAll('.btn-cancel-order').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.orderId;
      const reason = prompt('Please enter a cancellation reason (Optional):', 'Changed my mind');
      if (reason !== null) {
        try {
          const res = await api.cancelUserOrder(orderId, reason);
          showToast(res.message || 'Order cancelled successfully.', 'success');
          renderUserDashboard(container);
        } catch (err) {
          showToast(err.message || 'Failed to cancel order.', 'error');
        }
      }
    });
  });

  // Return request button
  container.querySelectorAll('.btn-return-order').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.orderId;
      const reason = prompt('Please provide reason for replacement/return (e.g. Display defect, physical damage, wrong item):', 'Defective display unit');
      if (reason) {
        try {
          const res = await api.submitReturnRequest(orderId, {
            reason,
            description: 'Customer requested 7-day replacement via User Dashboard.',
            type: 'Replacement'
          });
          showToast(res.message || 'Replacement requested successfully!', 'success');
          renderUserDashboard(container);
        } catch (err) {
          showToast(err.message || 'Failed to submit return request.', 'error');
        }
      }
    });
  });

  // Rate & Review button
  container.querySelectorAll('.btn-review-order').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = btn.dataset.productId;
      const productName = btn.dataset.productName;
      const ratingStr = prompt(`Rate "${productName}" (1 to 5 Stars):`, '5');
      if (ratingStr) {
        const rating = parseInt(ratingStr, 10);
        const comment = prompt('Write your customer feedback/review:', 'Outstanding performance and fast delivery!');
        if (comment) {
          try {
            const res = await api.submitReview({
              productId,
              rating,
              title: 'Verified Buyer Feedback',
              comment
            });
            showToast(res.message || 'Review submitted! Thank you.', 'success');
          } catch (err) {
            showToast(err.message || 'Failed to submit review.', 'error');
          }
        }
      }
    });
  });

  // Wishlist actions
  container.querySelectorAll('.btn-wishlist-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const res = state.addToCart(id, 1);
      if (res.success) {
        showToast(res.message, 'success');
        window.dispatchEvent(new CustomEvent('lapkart:toggle-cart'));
      }
    });
  });

  container.querySelectorAll('.btn-wishlist-remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      await api.toggleWishlist(id);
      showToast('Item removed from wishlist.', 'info');
      renderUserDashboard(container);
    });
  });

  // Address add & delete
  const showAddAddrBtn = document.getElementById('btn-show-add-address-modal') || document.getElementById('btn-empty-add-address');
  if (showAddAddrBtn) {
    showAddAddrBtn.addEventListener('click', async () => {
      const fullName = prompt('Full Name:');
      if (!fullName) return;
      const phone = prompt('10-Digit Mobile Number:');
      if (!phone) return;
      const houseNo = prompt('Flat / House / Building Number:');
      if (!houseNo) return;
      const street = prompt('Street / Area / Landmark:');
      if (!street) return;
      const city = prompt('City:');
      if (!city) return;
      const stateName = prompt('State:', 'Karnataka');
      if (!stateName) return;
      const pinCode = prompt('6-Digit PIN Code:');
      if (!pinCode) return;

      try {
        await api.addUserAddress({
          fullName,
          phone,
          houseNo,
          street,
          city,
          state: stateName,
          pinCode,
          addressType: 'Home'
        });
        showToast('Address saved successfully!', 'success');
        renderUserDashboard(container);
      } catch (err) {
        showToast(err.message || 'Failed to save address.', 'error');
      }
    });
  }

  container.querySelectorAll('.btn-delete-address').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Delete this saved delivery address?')) {
        try {
          await api.deleteUserAddress(btn.dataset.id);
          showToast('Address removed.', 'info');
          renderUserDashboard(container);
        } catch (err) {
          showToast(err.message || 'Failed to delete address.', 'error');
        }
      }
    });
  });

  // Profile update form
  const profileForm = document.getElementById('form-user-profile');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('prof-name-input').value.trim();
      const phone = document.getElementById('prof-phone-input').value.trim();
      const password = document.getElementById('prof-pass-input').value;

      try {
        const res = await api.updateProfile({ name, phone, password: password || undefined });
        auth.setSession(auth.getToken(), res.user);
        showToast('Profile updated successfully! ✓', 'success');
        renderUserDashboard(container);
      } catch (err) {
        showToast(err.message || 'Failed to update profile.', 'error');
      }
    });
  }
}
