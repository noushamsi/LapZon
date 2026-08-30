/**
 * My Orders Page Component
 * Lists customer orders with status badges, item details, and 1-click tracking.
 */

import { state } from '../state.js';

export function renderMyOrders(container) {
  const orders = state.getOrders();

  function formatPrice(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  function formatDate(isoStr) {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoStr;
    }
  }

  container.innerHTML = `
    <div class="container" style="padding: 2.5rem 1.25rem 5rem; max-width: 1000px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h2 style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800;">My Orders</h2>
          <p style="color: var(--text-secondary); font-size: 0.95rem;">Track shipments, view invoices and manage your laptop purchases</p>
        </div>
        <a href="#store" class="btn btn-outline-primary">
          💻 Explore Laptops
        </a>
      </div>

      ${orders.length === 0 ? `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 4rem 2rem; text-align: center;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">📦💨</div>
          <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem;">No Orders Placed Yet</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">You haven't ordered any laptop yet. Explore our top brand collection now!</p>
          <a href="#store" class="btn btn-primary btn-lg">Start Shopping</a>
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${orders.map(order => {
            const isDelivered = order.status === 'Delivered';

            return `
              <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); box-shadow: var(--shadow-sm); overflow: hidden;">
                <!-- Header -->
                <div style="background-color: var(--bg-subtle); padding: 0.85rem 1.5rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; font-size: 0.85rem;">
                  <div>
                    <span style="color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Order Placed:</span>
                    <strong>${formatDate(order.createdAt)}</strong>
                  </div>
                  <div>
                    <span style="color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total:</span>
                    <strong>${formatPrice(order.pricing.totalAmount)}</strong>
                  </div>
                  <div>
                    <span style="color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Ship To:</span>
                    <strong>${order.customer.fullName}</strong>
                  </div>
                  <div>
                    <span style="color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Order ID:</span>
                    <strong style="font-family: monospace; color: var(--primary-blue);">${order.orderId}</strong>
                  </div>
                </div>

                <!-- Body Items -->
                <div style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
                  <div style="display: flex; flex-direction: column; gap: 1rem; flex: 1;">
                    ${order.items.map(item => `
                      <div style="display: flex; gap: 1.25rem; align-items: center;">
                        <img src="${item.image}" alt="${item.name}" style="width: 72px; height: 72px; object-fit: contain; background: var(--bg-subtle); border-radius: var(--radius-xs); padding: 4px;" />
                        <div>
                          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${item.name}</h4>
                          <p style="font-size: 0.82rem; color: var(--text-muted);">${item.specsSummary}</p>
                          <div style="font-size: 0.9rem; font-weight: 700; margin-top: 4px;">
                            ${formatPrice(item.price)} × ${item.quantity}
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>

                  <!-- Right Status & Tracking Button -->
                  <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem;">
                    <div>
                      <span class="badge ${isDelivered ? 'badge-in-stock' : 'badge-tag'}" style="font-size: 0.9rem; padding: 0.35rem 0.75rem;">
                        ● Status: <strong>${order.status}</strong>
                      </span>
                    </div>
                    ${isDelivered ? `
                      <span style="font-size: 0.8rem; color: var(--accent-emerald); font-weight: 700;">✓ Delivered on ${formatDate(order.deliveryDetails.deliveredAt || order.createdAt)}</span>
                    ` : `
                      <span style="font-size: 0.8rem; color: var(--text-secondary);">Expected by: <strong>${order.deliveryDetails.expectedDate}</strong></span>
                    `}
                    <a href="#order-tracking/${order.orderId}" class="btn btn-orange">
                      📦 Track Delivery Progress ➔
                    </a>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}
