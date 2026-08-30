/**
 * Owner / Admin Dashboard Component
 * Full product catalog CRUD, image upload/preset selector, confirmation/drafts workflow,
 * stock toggles, customer orders fulfillment manager, returns manager, reviews moderation,
 * support tickets responder, and real-time dispatch synchronizer.
 */

import { api } from '../services/api.js';
import { LAPTOP_PRESET_IMAGES } from '../data.js';
import { showToast } from '../app.js';

const ORDER_STAGES = ["Waiting for Admin Confirmation", "Order Confirmed", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered"];

export async function renderAdminDashboard(container, queryParams = {}) {
  let activeTab = queryParams.tab || 'orders'; // 'orders' | 'inventory' | 'drafts' | 'returns' | 'reviews' | 'support' | 'add-product'
  let metrics = { totalRevenue: 0, totalOrders: 0, activeShipments: 0, totalProducts: 0, pendingApprovals: 0, outOfStockCount: 0 };
  let products = [];
  let orders = [];
  let returns = [];
  let reviews = [];
  let tickets = [];
  let isLoading = true;

  let uploadedImagesList = [
    { url: LAPTOP_PRESET_IMAGES[0].url, label: "Front View (Main Display)" }
  ];

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

  async function loadAdminData() {
    try {
      isLoading = true;
      const [mRes, pRes, oRes, retRes, revRes, ticRes] = await Promise.allSettled([
        api.getAdminMetrics(),
        api.getAdminProducts(),
        api.getAdminOrders(),
        api.getAdminReturns(),
        api.getAdminReviews(),
        api.getAdminTickets()
      ]);

      if (mRes.status === 'fulfilled') metrics = mRes.value?.metrics || metrics;
      if (pRes.status === 'fulfilled') products = pRes.value?.products || [];
      if (oRes.status === 'fulfilled') orders = oRes.value?.orders || [];
      if (retRes.status === 'fulfilled') returns = retRes.value?.returns || [];
      if (revRes.status === 'fulfilled') reviews = revRes.value?.reviews || [];
      if (ticRes.status === 'fulfilled') tickets = ticRes.value?.tickets || [];
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast(err.message || 'Failed to connect to Admin API.', 'error');
    } finally {
      isLoading = false;
      render();
    }
  }

  function renderGallerySlotsHtml() {
    if (uploadedImagesList.length === 0) {
      return `
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem; background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: var(--radius-xs);">
          No images uploaded yet. Upload laptop photos or add image URLs above (up to 10 angles).
        </div>
      `;
    }

    return `
      <div class="gallery-slots-grid">
        ${uploadedImagesList.map((item, idx) => `
          <div class="gallery-slot-card ${idx === 0 ? 'is-main' : ''}" data-idx="${idx}">
            <div class="gallery-slot-img-wrap">
              <img src="${item.url}" alt="Angle ${idx + 1}" />
              ${idx === 0 ? `<span class="slot-main-badge">★ MAIN</span>` : ''}
              <span class="slot-num-badge">#${idx + 1}</span>
            </div>
            <div class="slot-angle-label" title="${item.label}">
              ${item.label || `Angle #${idx + 1}`}
            </div>
            <div class="slot-actions-bar">
              ${idx !== 0 ? `
                <button type="button" class="btn-slot-action btn-make-main" data-idx="${idx}" title="Set as primary store thumbnail">
                  ★ Main
                </button>
              ` : `
                <span style="font-size: 0.7rem; color: var(--primary-blue); font-weight: 700;">✓ Primary</span>
              `}
              <button type="button" class="btn-slot-action btn-slot-remove" data-idx="${idx}" title="Remove photo">
                ✕
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function render() {
    if (isLoading) {
      container.innerHTML = `
        <div class="container" style="padding: 5rem 1rem; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">👑⏳</div>
          <h3>Connecting to Admin Center...</h3>
          <p style="color: var(--text-muted);">Authenticating session and fetching latest store orders & products.</p>
        </div>
      `;
      return;
    }

    const liveProducts = products.filter(p => p.status === 'approved');
    const draftProducts = products.filter(p => p.status === 'pending');

    container.innerHTML = `
      <div class="admin-portal">
        <div class="container">
          <!-- Top Header Strip -->
          <div class="admin-header-strip">
            <div class="admin-header-title">
              <div class="admin-badge-icon">👑</div>
              <div>
                <h2>LapKart Owner & Admin Center</h2>
                <p>Manage product catalog, approve submissions, dispatch orders & control live stock</p>
              </div>
            </div>
            <div class="admin-header-actions">
              <button type="button" class="btn btn-outline" id="btn-reset-demo" style="color: #fff; border-color: rgba(255,255,255,0.3);" title="Reset initial sample data">
                🔄 Reset Demo Data
              </button>
            </div>
          </div>

          <!-- KPI Metric Cards -->
          <div class="admin-kpi-grid">
            <div class="kpi-card">
              <div class="kpi-info">
                <span class="kpi-label">Total Store Revenue</span>
                <span class="kpi-value" style="color: var(--primary-blue);">${formatPrice(metrics.totalRevenue)}</span>
              </div>
              <div class="kpi-icon-box kpi-blue">💰</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-info">
                <span class="kpi-label">Customer Orders</span>
                <span class="kpi-value">${metrics.totalOrders}</span>
              </div>
              <div class="kpi-icon-box kpi-green">📦</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-info">
                <span class="kpi-label">Active Shipments</span>
                <span class="kpi-value" style="color: var(--accent-orange);">${metrics.activeShipments}</span>
              </div>
              <div class="kpi-icon-box kpi-orange">🚚</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-info">
                <span class="kpi-label">Live Laptops</span>
                <span class="kpi-value">${liveProducts.length} <small style="font-size: 0.8rem; color: var(--text-muted);">(${draftProducts.length} Pending)</small></span>
              </div>
              <div class="kpi-icon-box kpi-purple">💻</div>
            </div>
          </div>

          <!-- Navigation Tabs -->
          <div class="admin-nav-tabs" style="display: flex; flex-wrap: wrap; gap: 6px;">
            <button type="button" class="admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}" data-tab="orders">
              📦 Orders Fulfillment
              <span class="tab-count-badge">${orders.length}</span>
            </button>

            <button type="button" class="admin-tab-btn ${activeTab === 'inventory' ? 'active' : ''}" data-tab="inventory">
              📋 Live Inventory & Stock
              <span class="tab-count-badge">${liveProducts.length}</span>
            </button>

            <button type="button" class="admin-tab-btn ${activeTab === 'drafts' ? 'active' : ''}" data-tab="drafts">
              ⏳ Pending Approval Queue
              <span class="tab-count-badge" style="background-color: ${draftProducts.length > 0 ? '#ff9f00' : 'rgba(255,255,255,0.2)'}; color: ${draftProducts.length > 0 ? '#fff' : 'inherit'}; font-weight: 800;">${draftProducts.length}</span>
            </button>

            <button type="button" class="admin-tab-btn ${activeTab === 'returns' ? 'active' : ''}" data-tab="returns">
              🔄 Returns (${returns.length})
            </button>

            <button type="button" class="admin-tab-btn ${activeTab === 'reviews' ? 'active' : ''}" data-tab="reviews">
              ⭐ Reviews (${reviews.length})
            </button>

            <button type="button" class="admin-tab-btn ${activeTab === 'support' ? 'active' : ''}" data-tab="support">
              💬 Support Tickets (${tickets.length})
            </button>

            <button type="button" class="admin-tab-btn ${activeTab === 'add-product' ? 'active' : ''}" data-tab="add-product">
              ➕ Add New Laptop
            </button>
          </div>

          <!-- TAB 1: CUSTOMER ORDERS FULFILLMENT -->
          <div class="admin-panel ${activeTab === 'orders' ? 'active' : ''}" id="panel-orders">
            <div class="panel-header-action">
              <h3>Customer Orders (${orders.length})</h3>
              <span style="font-size: 0.85rem; color: var(--text-muted);">Update delivery stages in real-time to reflect on customer tracking</span>
            </div>

            ${orders.length === 0 ? `
              <div style="background: var(--bg-surface); padding: 3rem; text-align: center; border: 1px solid var(--border-subtle); border-radius: var(--radius-xs);">
                <p>No customer orders placed yet.</p>
              </div>
            ` : `
              <div class="admin-table-card">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID & Date</th>
                      <th>Customer Details</th>
                      <th>Delivery Address</th>
                      <th>Laptop Items</th>
                      <th>Total & Payment</th>
                      <th>Fulfillment Status</th>
                      <th>Delivery Info & Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orders.map(order => {
                      const isDelivered = order.status === 'Delivered';
                      const statusClass = `status-${order.status.replace(/\s+/g, '-')}`;

                      return `
                        <tr data-order-id="${order.orderId}">
                          <td>
                            <div class="tbl-order-id">${order.orderId}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(order.createdAt)}</div>
                          </td>

                          <td>
                            <div class="tbl-customer-info">
                              <h5>${order.customer.fullName}</h5>
                              <p>📱 ${order.customer.phone}</p>
                            </div>
                          </td>

                          <td>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); max-width: 200px;">
                              ${order.customer.houseNo}, ${order.customer.street}, ${order.customer.city}, ${order.customer.state} - <strong>${order.customer.pinCode}</strong>
                            </div>
                          </td>

                          <td>
                            <div style="display: flex; flex-direction: column; gap: 4px; max-width: 220px;">
                              ${order.items.map(it => `
                                <div style="font-size: 0.82rem; font-weight: 600;">
                                  • ${it.name} <span style="color: var(--text-muted);">(×${it.quantity})</span>
                                </div>
                              `).join('')}
                            </div>
                          </td>

                          <td>
                            <div style="font-weight: 800; font-size: 0.95rem; color: var(--primary-blue);">
                              ${formatPrice(order.pricing.totalAmount)}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">
                              ${order.paymentMethod}
                            </div>
                          </td>

                          <td>
                            ${order.status === 'Waiting for Admin Confirmation' ? `
                              <div style="display: flex; flex-direction: column; gap: 6px;">
                                <span class="badge" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-size: 0.75rem; padding: 3px 6px;">
                                  ⏳ Pending Confirmation
                                </span>
                                <button type="button" class="btn btn-sm btn-green btn-admin-confirm" data-id="${order.orderId}">
                                  ✓ Confirm Order
                                </button>
                                <button type="button" class="btn btn-sm btn-outline btn-admin-reject" data-id="${order.orderId}" style="color: var(--accent-red); border-color: rgba(239,68,68,0.4);">
                                  ✕ Reject Order
                                </button>
                              </div>
                            ` : (order.status.startsWith('Cancelled') ? `
                              <span class="badge" style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;">
                                ✕ ${order.status}
                              </span>
                            ` : `
                              <select class="tbl-status-select ${statusClass} order-status-select" data-id="${order.orderId}">
                                ${ORDER_STAGES.filter(st => st !== 'Waiting for Admin Confirmation').map(st => `
                                  <option value="${st}" ${order.status === st ? 'selected' : ''}>${st}</option>
                                `).join('')}
                              </select>
                            `)}
                          </td>

                          <td>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                              <button type="button" class="btn btn-sm btn-outline btn-edit-delivery" data-id="${order.orderId}">
                                🚚 Edit Courier Info
                              </button>
                              ${!isDelivered ? `
                                <button type="button" class="btn btn-sm btn-green btn-quick-deliver" data-id="${order.orderId}" title="Instantly mark as Delivered">
                                  ✓ Mark as Delivered
                                </button>
                              ` : `
                                <span style="color: var(--accent-emerald); font-size: 0.78rem; font-weight: 700;">✓ Delivered</span>
                              `}
                              <a href="#order-tracking?id=${order.orderId}" target="_blank" style="font-size: 0.75rem; color: var(--primary-blue); text-decoration: none;">
                                View Tracking ↗
                              </a>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

          <!-- TAB 2: LIVE PRODUCT INVENTORY -->
          <div class="admin-panel ${activeTab === 'inventory' ? 'active' : ''}" id="panel-inventory">
            <div class="panel-header-action">
              <h3>Live Laptop Products in Store (${liveProducts.length})</h3>
              <button type="button" class="btn btn-primary btn-sm" id="btn-goto-add">
                ➕ Add New Laptop
              </button>
            </div>

            <div class="admin-table-card">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Laptop Name & Brand</th>
                    <th>Category</th>
                    <th>Key Specs (CPU / RAM / SSD)</th>
                    <th>Price (MRP / Selling)</th>
                    <th>Stock Units</th>
                    <th>Live Stock Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${liveProducts.map(prod => `
                    <tr data-product-id="${prod.id}">
                      <td>
                        <div class="tbl-product-cell">
                          <img src="${prod.image}" alt="${prod.name}" class="tbl-product-img" />
                          <div>
                            <div class="tbl-product-name">${prod.name}</div>
                            <div class="tbl-product-brand">${prod.brand} • ${prod.series || 'Series'}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span class="badge badge-tag">${prod.category || 'Ultrabook'}</span>
                      </td>

                      <td>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); max-width: 250px;">
                          <strong>${prod.processor}</strong><br/>
                          ${prod.ram} | ${prod.storage} | ${prod.graphics}
                        </div>
                      </td>

                      <td>
                        <div style="font-weight: 700; color: var(--text-main);">${formatPrice(prod.price)}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-decoration: line-through;">${formatPrice(prod.mrp)}</div>
                        <div style="font-size: 0.75rem; color: var(--accent-emerald); font-weight: 700;">${prod.discount}% off</div>
                      </td>

                      <td>
                        <input 
                          type="number" 
                          class="input-stock-count" 
                          data-id="${prod.id}" 
                          value="${prod.stock}" 
                          min="0" 
                          max="999" 
                          style="width: 60px; padding: 4px 6px; border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); font-weight: 700;"
                        />
                      </td>

                      <td>
                        <button 
                          type="button" 
                          class="stock-switch-btn ${prod.inStock ? 'status-in-stock' : 'status-out-stock'} btn-toggle-stock" 
                          data-id="${prod.id}"
                          data-current-stock="${prod.stock}"
                          data-current-instock="${prod.inStock}"
                          title="Click to toggle In Stock / Out of Stock"
                        >
                          ${prod.inStock ? '✓ In Stock' : '✕ Out of Stock'}
                        </button>
                      </td>

                      <td>
                        <button type="button" class="btn btn-sm btn-outline btn-delete-product" data-id="${prod.id}" style="color: var(--accent-red); border-color: rgba(211,47,47,0.3);">
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 3: DRAFTS / PENDING QUEUE -->
          <div class="admin-panel ${activeTab === 'drafts' ? 'active' : ''}" id="panel-drafts">
            <div class="panel-header-action">
              <h3>Submitted Products Awaiting Admin Approval (${draftProducts.length})</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted);">
                Review products submitted by vendors/staff. Clicking <strong>Approve & Publish</strong> will instantly make them live in the User Store.
              </p>
            </div>

            ${draftProducts.length === 0 ? `
              <div style="background: var(--bg-surface); padding: 3rem; text-align: center; border: 1px solid var(--border-subtle); border-radius: var(--radius-xs);">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
                <h4>No Pending Confirmations</h4>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">All submitted laptops are approved and visible in the customer store.</p>
              </div>
            ` : `
              <div class="drafts-grid">
                ${draftProducts.map(draft => `
                  <div class="draft-product-card" data-draft-id="${draft.id}">
                    <img src="${draft.image}" alt="${draft.name}" class="draft-img" />
                    <div class="draft-info">
                      <span class="badge badge-tag" style="align-self: flex-start; margin-bottom: 4px;">${draft.brand} • ${draft.category}</span>
                      <h4>${draft.name}</h4>
                      <p class="draft-specs">${draft.processor} | ${draft.ram} RAM | ${draft.storage} | ${draft.graphics}</p>
                      <div class="draft-price-row">
                        ${formatPrice(draft.price)} <small style="font-size: 0.8rem; color: var(--text-muted); text-decoration: line-through;">${formatPrice(draft.mrp)}</small>
                        <span style="font-size: 0.8rem; color: var(--accent-emerald); font-weight: 700; margin-left: 6px;">${draft.discount}% off</span>
                      </div>
                      <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
                        Initial Stock: <strong>${draft.stock} units</strong> • Status: <strong>${draft.inStock ? 'In Stock' : 'Out of Stock'}</strong>
                      </div>
                      <div class="draft-actions">
                        <button type="button" class="btn btn-green btn-confirm-draft" data-id="${draft.id}">
                          ✓ Approve & Publish to Store
                        </button>
                        <button type="button" class="btn btn-outline btn-reject-draft" data-id="${draft.id}" style="color: var(--accent-red);">
                          ✕ Reject / Delete
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- TAB 4: RETURNS MANAGEMENT -->
          <div class="admin-panel ${activeTab === 'returns' ? 'active' : ''}" id="panel-returns">
            <div class="panel-header-action">
              <h3>Returns & Replacement Requests (${returns.length})</h3>
            </div>

            ${returns.length === 0 ? `
              <div style="background: #fff; border-radius: 12px; padding: 3rem; text-align: center; border: 1px solid #e2e8f0;">
                <p>No customer return or replacement requests.</p>
              </div>
            ` : `
              <div class="admin-table-card">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Return ID</th>
                      <th>Order ID</th>
                      <th>Customer Email</th>
                      <th>Reason & Details</th>
                      <th>Status</th>
                      <th>Admin Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${returns.map(r => `
                      <tr>
                        <td><strong>#${r.id}</strong></td>
                        <td>#${r.orderId}</td>
                        <td>${r.userEmail || '-'}</td>
                        <td>
                          <strong>${r.reason}</strong><br/>
                          <span style="font-size: 0.8rem; color: #64748b;">${r.description}</span>
                        </td>
                        <td>
                          <span class="badge" style="background: #fef3c7; color: #b45309; font-weight: 800;">${r.status}</span>
                        </td>
                        <td>
                          <div style="display: flex; gap: 6px;">
                            <button type="button" class="btn btn-sm btn-green btn-return-approve" data-id="${r.id}">
                              ✓ Approve
                            </button>
                            <button type="button" class="btn btn-sm btn-outline btn-return-complete" data-id="${r.id}" style="color: #2563eb;">
                              ✓ Completed
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

          <!-- TAB 5: REVIEWS MODERATION -->
          <div class="admin-panel ${activeTab === 'reviews' ? 'active' : ''}" id="panel-reviews">
            <div class="panel-header-action">
              <h3>Customer Reviews Moderation (${reviews.length})</h3>
            </div>

            ${reviews.length === 0 ? `
              <div style="background: #fff; border-radius: 12px; padding: 3rem; text-align: center; border: 1px solid #e2e8f0;">
                <p>No customer reviews submitted yet.</p>
              </div>
            ` : `
              <div class="admin-table-card">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Customer</th>
                      <th>Rating & Review</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${reviews.map(rev => `
                      <tr>
                        <td>${rev.productId}</td>
                        <td>${rev.userName || 'Customer'} (${rev.userEmail || ''})</td>
                        <td>
                          <span class="badge badge-rating">${rev.rating} ★</span> <strong>${rev.title || ''}</strong><br/>
                          <span style="font-size: 0.85rem; color: #334155;">${rev.comment}</span>
                        </td>
                        <td>
                          <span class="badge" style="background: ${rev.status === 'approved' ? '#dcfce7' : '#fef3c7'}; color: ${rev.status === 'approved' ? '#16a34a' : '#b45309'};">
                            ${rev.status}
                          </span>
                        </td>
                        <td>
                          <div style="display: flex; gap: 6px;">
                            ${rev.status !== 'approved' ? `
                              <button type="button" class="btn btn-sm btn-green btn-review-approve" data-id="${rev.id}">
                                ✓ Approve
                              </button>
                            ` : ''}
                            <button type="button" class="btn btn-sm btn-outline btn-review-delete" data-id="${rev.id}" style="color: #dc2626;">
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

          <!-- TAB 6: SUPPORT TICKETS -->
          <div class="admin-panel ${activeTab === 'support' ? 'active' : ''}" id="panel-support">
            <div class="panel-header-action">
              <h3>Customer Support Tickets (${tickets.length})</h3>
            </div>

            ${tickets.length === 0 ? `
              <div style="background: #fff; border-radius: 12px; padding: 3rem; text-align: center; border: 1px solid #e2e8f0;">
                <p>No pending customer support inquiries.</p>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${tickets.map(t => `
                  <div style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                      <div>
                        <strong style="font-size: 1rem; color: #0f172a;">${t.subject}</strong> • <span style="font-size: 0.85rem; color: #64748b;">${t.name} (${t.email} - ${t.phone || ''})</span>
                      </div>
                      <span class="badge" style="background: ${t.status === 'Resolved' ? '#dcfce7' : '#fef3c7'}; color: ${t.status === 'Resolved' ? '#16a34a' : '#b45309'}; font-weight: 800;">
                        ${t.status}
                      </span>
                    </div>
                    <p style="font-size: 0.9rem; color: #334155; margin: 0 0 0.75rem;">${t.message}</p>
                    ${t.reply ? `
                      <div style="background: #eff6ff; border-left: 3px solid #2874f0; padding: 0.6rem 0.85rem; font-size: 0.85rem; color: #1e40af; margin-bottom: 0.75rem;">
                        <strong>Reply Sent:</strong> ${t.reply}
                      </div>
                    ` : ''}
                    <div style="display: flex; gap: 8px;">
                      <button type="button" class="btn btn-sm btn-primary btn-reply-ticket" data-id="${t.id}">
                        ✉️ Reply to Customer
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- TAB 7: ADD NEW LAPTOP FORM -->
          <div class="admin-panel ${activeTab === 'add-product' ? 'active' : ''}" id="panel-add-product">
            <div class="checkout-card" style="max-width: 960px; margin: 0 auto;">
              <div class="checkout-card-header">
                <h3>➕ Add New Laptop Product</h3>
              </div>

              <div class="checkout-card-body">
                <form id="form-add-laptop" class="address-form-grid" novalidate>
                  <div class="form-group full-width">
                    <label for="new-lap-name">Laptop Name & Model Title <span class="req">*</span></label>
                    <input type="text" id="new-lap-name" placeholder="e.g. Acer Swift Go 14 AI OLED Laptop" required />
                  </div>

                  <div class="form-group">
                    <label for="new-lap-brand">Brand <span class="req">*</span></label>
                    <select id="new-lap-brand" required>
                      <option value="">-- Select Brand --</option>
                      <option value="Apple">Apple</option>
                      <option value="ASUS">ASUS</option>
                      <option value="Dell">Dell</option>
                      <option value="HP">HP</option>
                      <option value="Lenovo">Lenovo</option>
                      <option value="Acer">Acer</option>
                      <option value="MSI">MSI</option>
                      <option value="Samsung">Samsung</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="new-lap-category">Category <span class="req">*</span></label>
                    <select id="new-lap-category" required>
                      <option value="Ultrabook">Thin & Light Ultrabook</option>
                      <option value="Gaming">Gaming Laptop</option>
                      <option value="Business">Business & AI</option>
                      <option value="Student">Student & Everyday</option>
                    </select>
                  </div>

                  <div class="form-group full-width">
                    <label>Laptop Photos & 10-Angle Gallery (Upload Files or Add URLs) <span class="req">*</span></label>
                    
                    <div class="multi-image-manager-box">
                      <input type="file" id="lap-file-uploader" multiple accept="image/*" style="display: none;" />
                      <div class="image-upload-dropzone" id="lap-dropzone">
                        <div class="dropzone-icon">📸 ⬆️</div>
                        <div class="dropzone-title">Click to Upload Laptop Photos or Drag & Drop Here</div>
                        <div class="dropzone-desc">Upload up to 10 angle photos (Front, Back, Left Side, Right Side, Keyboard, Display, Bottom, Box) • PNG, JPG, WEBP</div>
                      </div>

                      <div class="image-url-input-bar">
                        <input type="url" id="custom-img-url-input" placeholder="Or paste custom image web URL (https://...)" />
                        <button type="button" class="btn btn-primary" id="btn-add-img-url">
                          ➕ Add URL
                        </button>
                        <button type="button" class="btn btn-outline" id="btn-load-10-presets" style="white-space: nowrap; border-color: var(--primary-blue); color: var(--primary-blue);">
                          ⚡ Load 10-Angle Pack
                        </button>
                      </div>

                      <div style="margin-bottom: 1rem;">
                        <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Quick Add Preset Angles:</span>
                        <div class="preset-imgs-grid">
                          ${LAPTOP_PRESET_IMAGES.map((preset) => `
                            <div class="preset-img-opt" data-url="${preset.url}" data-angle="${preset.angle}" title="Click to add ${preset.angle}">
                              <img src="${preset.url}" alt="${preset.label}" />
                              <span>${preset.label}</span>
                            </div>
                          `).join('')}
                        </div>
                      </div>

                      <div class="gallery-counter-header">
                        <span>📸 Product Gallery Photos (${uploadedImagesList.length} of 10 Angles Loaded)</span>
                        ${uploadedImagesList.length > 0 ? `
                          <button type="button" class="btn-slot-action btn-slot-remove" id="btn-clear-gallery">
                            Clear All Photos
                          </button>
                        ` : ''}
                      </div>

                      <div id="gallery-slots-container">
                        ${renderGallerySlotsHtml()}
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="new-lap-proc">Processor <span class="req">*</span></label>
                    <input type="text" id="new-lap-proc" placeholder="e.g. Intel Core Ultra 7 155H" required />
                  </div>

                  <div class="form-group">
                    <label for="new-lap-ram">RAM Memory <span class="req">*</span></label>
                    <input type="text" id="new-lap-ram" placeholder="e.g. 16GB LPDDR5X" required />
                  </div>

                  <div class="form-group">
                    <label for="new-lap-storage">Storage (SSD) <span class="req">*</span></label>
                    <input type="text" id="new-lap-storage" placeholder="e.g. 1TB NVMe PCIe Gen4 SSD" required />
                  </div>

                  <div class="form-group">
                    <label for="new-lap-graphics">Graphics Card <span class="req">*</span></label>
                    <input type="text" id="new-lap-graphics" placeholder="e.g. NVIDIA GeForce RTX 4060 8GB" required />
                  </div>

                  <div class="form-group">
                    <label for="new-lap-display">Display <span class="req">*</span></label>
                    <input type="text" id="new-lap-display" placeholder="e.g. 14-inch 2.8K 120Hz OLED (2880x1800)" required />
                  </div>

                  <div class="form-group">
                    <label for="new-lap-os">Operating System</label>
                    <input type="text" id="new-lap-os" placeholder="e.g. Windows 11 Home" value="Windows 11 Home" />
                  </div>

                  <div class="form-group">
                    <label for="new-lap-mrp">Original MRP (₹) <span class="req">*</span></label>
                    <input type="number" id="new-lap-mrp" placeholder="e.g. 99990" required />
                  </div>

                  <div class="form-group">
                    <label for="new-lap-price">Selling Price (₹) <span class="req">*</span></label>
                    <input type="number" id="new-lap-price" placeholder="e.g. 79990" required />
                  </div>

                  <div class="form-group">
                    <label for="new-lap-stock">Stock Quantity (Units) <span class="req">*</span></label>
                    <input type="number" id="new-lap-stock" value="15" min="0" required />
                  </div>

                  <div class="form-group">
                    <label>Initial Stock Availability</label>
                    <div class="radio-pills-group" style="margin-top: 0.5rem;">
                      <label class="radio-pill-label">
                        <input type="radio" name="new_lap_in_stock" value="true" checked />
                        <span style="color: var(--accent-emerald); font-weight: 700;">✓ In Stock</span>
                      </label>
                      <label class="radio-pill-label">
                        <input type="radio" name="new_lap_in_stock" value="false" />
                        <span style="color: var(--accent-red); font-weight: 700;">✕ Out of Stock</span>
                      </label>
                    </div>
                  </div>

                  <div class="form-group full-width" style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <button type="submit" class="btn btn-green btn-lg" id="btn-submit-publish" style="flex: 1;">
                      🚀 Publish Directly to Store
                    </button>
                    <button type="button" class="btn btn-orange btn-lg" id="btn-submit-draft" style="flex: 1;">
                      ⏳ Submit for Confirmation (Pending Queue)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Delivery Info Modal -->
      <div id="delivery-edit-modal" class="modal-overlay"></div>
    `;

    attachAdminEvents();
  }

  function attachAdminEvents() {
    // Tab switching
    container.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });

    const gotoAddBtn = container.querySelector('#btn-goto-add');
    if (gotoAddBtn) {
      gotoAddBtn.addEventListener('click', () => {
        activeTab = 'add-product';
        render();
      });
    }

    // Returns moderation
    container.querySelectorAll('.btn-return-approve').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const notes = prompt('Enter return approval notes (e.g. Pickup scheduled):', 'Pickup scheduled via Ekart Express');
        if (notes !== null) {
          try {
            await api.updateAdminReturnStatus(id, 'Approved', notes);
            showToast('Return request approved!', 'success');
            loadAdminData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    container.querySelectorAll('.btn-return-complete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          await api.updateAdminReturnStatus(id, 'Completed', 'Replacement unit dispatched to customer.');
          showToast('Return request marked Completed!', 'success');
          loadAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Reviews moderation
    container.querySelectorAll('.btn-review-approve').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          await api.approveAdminReview(id);
          showToast('Review approved & published!', 'success');
          loadAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    container.querySelectorAll('.btn-review-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('Delete this customer review?')) {
          try {
            await api.deleteAdminReview(id);
            showToast('Review deleted.', 'info');
            loadAdminData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    // Support ticket reply
    container.querySelectorAll('.btn-reply-ticket').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const reply = prompt('Enter resolution/response to customer:');
        if (reply) {
          try {
            await api.replyAdminTicket(id, reply, 'Resolved');
            showToast('Reply saved and customer ticket resolved!', 'success');
            loadAdminData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    // Multi-image upload handlers
    const fileUploader = container.querySelector('#lap-file-uploader');
    const dropzone = container.querySelector('#lap-dropzone');
    const addUrlBtn = container.querySelector('#btn-add-img-url');
    const customUrlInput = container.querySelector('#custom-img-url-input');
    const loadPresetsBtn = container.querySelector('#btn-load-10-presets');
    const clearGalleryBtn = container.querySelector('#btn-clear-gallery');

    const updateGalleryView = () => {
      const gContainer = container.querySelector('#gallery-slots-container');
      if (gContainer) {
        gContainer.innerHTML = renderGallerySlotsHtml();
        attachGallerySlotEvents();
      }
      const counterSpan = container.querySelector('.gallery-counter-header span');
      if (counterSpan) {
        counterSpan.textContent = `📸 Product Gallery Photos (${uploadedImagesList.length} of 10 Angles Loaded)`;
      }
    };

    const attachGallerySlotEvents = () => {
      container.querySelectorAll('.btn-make-main').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx);
          if (idx > 0 && idx < uploadedImagesList.length) {
            const [selected] = uploadedImagesList.splice(idx, 1);
            uploadedImagesList.unshift(selected);
            showToast(`"${selected.label}" set as primary thumbnail!`, 'info');
            updateGalleryView();
          }
        });
      });

      container.querySelectorAll('.btn-slot-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx);
          if (idx >= 0 && idx < uploadedImagesList.length) {
            uploadedImagesList.splice(idx, 1);
            showToast('Image removed from gallery', 'warning');
            updateGalleryView();
          }
        });
      });
    };

    const addImageFiles = (files) => {
      if (!files || files.length === 0) return;
      const remainingSlots = 10 - uploadedImagesList.length;
      if (remainingSlots <= 0) {
        showToast('Maximum 10 images limit reached per laptop product', 'warning');
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      let loadedCount = 0;

      filesToProcess.forEach((file) => {
        if (!file.type.startsWith('image/')) {
          showToast(`Skipped "${file.name}" (not an image)`, 'warning');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const nextAngleIndex = uploadedImagesList.length;
          const defaultLabel = LAPTOP_PRESET_IMAGES[nextAngleIndex]?.angle || `Angle #${nextAngleIndex + 1}`;

          uploadedImagesList.push({
            url: e.target.result,
            label: defaultLabel
          });

          loadedCount++;
          if (loadedCount === filesToProcess.length) {
            showToast(`Uploaded ${loadedCount} laptop photos! (Total: ${uploadedImagesList.length}/10)`, 'success');
            updateGalleryView();
          }
        };
        reader.readAsDataURL(file);
      });
    };

    if (dropzone && fileUploader) {
      dropzone.addEventListener('click', () => fileUploader.click());
      fileUploader.addEventListener('change', (e) => addImageFiles(e.target.files));

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files) {
          addImageFiles(e.dataTransfer.files);
        }
      });
    }

    if (addUrlBtn && customUrlInput) {
      addUrlBtn.addEventListener('click', () => {
        const url = customUrlInput.value.trim();
        if (!url) {
          showToast('Please enter a valid image URL', 'error');
          return;
        }
        if (uploadedImagesList.length >= 10) {
          showToast('Maximum 10 images limit reached per laptop product', 'warning');
          return;
        }

        const nextAngleIndex = uploadedImagesList.length;
        const defaultLabel = LAPTOP_PRESET_IMAGES[nextAngleIndex]?.angle || `Angle #${nextAngleIndex + 1}`;

        uploadedImagesList.push({ url, label: defaultLabel });
        customUrlInput.value = '';
        showToast(`Image added! (Total: ${uploadedImagesList.length}/10)`, 'success');
        updateGalleryView();
      });
    }

    if (loadPresetsBtn) {
      loadPresetsBtn.addEventListener('click', () => {
        uploadedImagesList = LAPTOP_PRESET_IMAGES.map(p => ({ url: p.url, label: p.angle }));
        showToast('Loaded all 10 realistic angle preset photos!', 'success');
        updateGalleryView();
      });
    }

    if (clearGalleryBtn) {
      clearGalleryBtn.addEventListener('click', () => {
        uploadedImagesList = [];
        showToast('Gallery cleared', 'info');
        updateGalleryView();
      });
    }

    container.querySelectorAll('.preset-img-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        const url = opt.dataset.url;
        const angle = opt.dataset.angle || 'Laptop Angle';
        if (uploadedImagesList.length >= 10) {
          showToast('Maximum 10 images limit reached per laptop product', 'warning');
          return;
        }
        uploadedImagesList.push({ url, label: angle });
        showToast(`Added "${angle}" photo! (Total: ${uploadedImagesList.length}/10)`, 'success');
        updateGalleryView();
      });
    });

    attachGallerySlotEvents();

    // Reset Demo Data
    const resetDemoBtn = container.querySelector('#btn-reset-demo');
    if (resetDemoBtn) {
      resetDemoBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all store data, orders, and products back to the original demo state in database?')) {
          try {
            await api.resetDemoData();
            showToast('Database reset to initial demo dataset.', 'info');
            loadAdminData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    }

    // Live Stock Toggle
    container.querySelectorAll('.btn-toggle-stock').forEach(btn => {
      btn.addEventListener('click', async () => {
        const prodId = btn.dataset.id;
        const currentInStock = btn.dataset.currentInstock === 'true';
        const newInStock = !currentInStock;

        try {
          const res = await api.toggleAdminStock(prodId, { inStock: newInStock });
          showToast(res.message, 'success');
          loadAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Stock count modifier
    container.querySelectorAll('.input-stock-count').forEach(input => {
      input.addEventListener('change', async (e) => {
        const prodId = input.dataset.id;
        const newCount = Math.max(0, parseInt(e.target.value) || 0);

        try {
          const res = await api.toggleAdminStock(prodId, { stock: newCount });
          showToast(`Stock updated to ${newCount} units.`, 'success');
          loadAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Delete Product
    container.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', async () => {
        const prodId = btn.dataset.id;
        if (confirm('Delete this laptop from the store catalog?')) {
          try {
            await api.deleteAdminProduct(prodId);
            showToast('Product deleted from store catalog.', 'warning');
            loadAdminData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    // Admin Confirm Order
    container.querySelectorAll('.btn-admin-confirm').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.dataset.id;
        try {
          const res = await api.confirmAdminOrder(orderId);
          showToast(res.message, 'success');
          loadAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Admin Reject / Cancel Order
    container.querySelectorAll('.btn-admin-reject').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.dataset.id;
        if (confirm(`Reject and cancel order #${orderId}? This will restore laptop stock to inventory.`)) {
          try {
            const res = await api.cancelAdminOrder(orderId, 'Rejected by Admin');
            showToast(res.message, 'info');
            loadAdminData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    // Order Status Dropdown Change
    container.querySelectorAll('.order-status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const orderId = sel.dataset.id;
        const newStatus = e.target.value;

        try {
          const res = await api.updateOrderStatus(orderId, { status: newStatus });
          showToast(res.message, 'success');
          loadAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Quick Mark as Delivered Button
    container.querySelectorAll('.btn-quick-deliver').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.dataset.id;

        try {
          const res = await api.updateOrderStatus(orderId, { status: 'Delivered' });
          showToast(`Order #${orderId} marked as DELIVERED! Live tracking updated.`, 'success');
          loadAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Edit Courier Delivery Details
    container.querySelectorAll('.btn-edit-delivery').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.dataset.id;
        openDeliveryEditModal(orderId);
      });
    });

    // Accept / Approve Draft Products into User Store
    container.querySelectorAll('.btn-confirm-draft').forEach(btn => {
      btn.addEventListener('click', async () => {
        const draftId = btn.dataset.id;

        try {
          const res = await api.approveProduct(draftId);
          showToast(res.message, 'success');
          loadAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    container.querySelectorAll('.btn-reject-draft').forEach(btn => {
      btn.addEventListener('click', async () => {
        const draftId = btn.dataset.id;
        if (confirm('Reject and delete this pending submission?')) {
          try {
            await api.deleteAdminProduct(draftId);
            showToast('Draft submission rejected and removed.', 'warning');
            loadAdminData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    // Add Laptop Form Handler
    const addForm = container.querySelector('#form-add-laptop');
    const submitDraftBtn = container.querySelector('#btn-submit-draft');

    if (addForm) {
      const handleCreateProduct = async (statusMode) => {
        const name = container.querySelector('#new-lap-name').value.trim();
        const brand = container.querySelector('#new-lap-brand').value;
        const category = container.querySelector('#new-lap-category').value;
        const processor = container.querySelector('#new-lap-proc').value.trim();
        const ram = container.querySelector('#new-lap-ram').value.trim();
        const storage = container.querySelector('#new-lap-storage').value.trim();
        const graphics = container.querySelector('#new-lap-graphics').value.trim();
        const display = container.querySelector('#new-lap-display').value.trim();
        const os = container.querySelector('#new-lap-os').value.trim() || 'Windows 11 Home';
        const mrp = Number(container.querySelector('#new-lap-mrp').value) || 0;
        const price = Number(container.querySelector('#new-lap-price').value) || 0;
        const stock = Number(container.querySelector('#new-lap-stock').value) || 10;
        const inStock = container.querySelector('input[name="new_lap_in_stock"]:checked')?.value === 'true';

        const galleryUrls = uploadedImagesList.map(item => item.url);
        const primaryImage = galleryUrls[0] || LAPTOP_PRESET_IMAGES[0].url;

        if (!name || !brand || galleryUrls.length === 0 || !processor || !ram || !storage || !mrp || !price) {
          showToast('Please fill in all required fields and upload at least 1 laptop image', 'error');
          return;
        }

        try {
          const res = await api.createAdminProduct({
            name,
            brand,
            category,
            image: primaryImage,
            images: galleryUrls,
            processor,
            ram,
            storage,
            graphics,
            display,
            os,
            mrp,
            price,
            stock,
            inStock,
            status: statusMode
          });

          showToast(res.message, 'success');
          activeTab = statusMode === 'approved' ? 'inventory' : 'drafts';
          loadAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      };

      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleCreateProduct('approved');
      });

      if (submitDraftBtn) {
        submitDraftBtn.addEventListener('click', () => {
          handleCreateProduct('pending');
        });
      }
    }
  }

  function openDeliveryEditModal(orderId) {
    const modal = document.getElementById('delivery-edit-modal');
    const order = orders.find(o => o.orderId === orderId);
    if (!modal || !order) return;

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 550px;">
        <button class="modal-close-btn" id="btn-close-deliv-modal">✕</button>
        <div style="padding: 2rem;">
          <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem;">
            Update Courier & Delivery Info
          </h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
            Order ID: <strong>${order.orderId}</strong> (${order.customer.fullName})
          </p>

          <form id="form-edit-delivery" class="address-form-grid">
            <div class="form-group full-width">
              <label>Courier Logistics Partner</label>
              <input type="text" id="edit-courier" value="${order.deliveryDetails?.courierPartner || 'Ekart Logistics'}" />
            </div>

            <div class="form-group full-width">
              <label>Tracking AWB Code</label>
              <input type="text" id="edit-awb" value="${order.deliveryDetails?.trackingNumber || 'EK-EXP-847291'}" />
            </div>

            <div class="form-group full-width">
              <label>Current Location Hub Checkpoint (e.g. "Bengaluru Distribution Center")</label>
              <input type="text" id="edit-location" value="${order.deliveryDetails?.currentLocation || 'Bengaluru Distribution Center'}" />
            </div>

            <div class="form-group full-width">
              <label>Expected Delivery Date</label>
              <input type="date" id="edit-expected-date" value="${order.deliveryDetails?.expectedDate || '2026-09-02'}" />
            </div>

            <div class="form-group full-width" style="margin-top: 1rem;">
              <button type="submit" class="btn btn-primary btn-block btn-lg">
                Save & Synchronize Live Tracking
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.classList.add('active');

    const closeBtn = modal.querySelector('#btn-close-deliv-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    const editForm = modal.querySelector('#form-edit-delivery');
    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const courierPartner = modal.querySelector('#edit-courier').value.trim();
        const trackingNumber = modal.querySelector('#edit-awb').value.trim();
        const currentLocation = modal.querySelector('#edit-location').value.trim();
        const expectedDate = modal.querySelector('#edit-expected-date').value;

        try {
          await api.updateOrderDeliveryDetails(order.orderId, {
            courierPartner,
            trackingNumber,
            currentLocation,
            expectedDate
          });

          showToast('Courier & location details updated! User tracking synced.', 'success');
          modal.classList.remove('active');
          loadAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  }

  // Initial load
  await loadAdminData();
}
