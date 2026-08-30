/**
 * Order Tracking Component - Flipkart Style 6-Stage Progressive Delivery Tracker
 * Polls backend API in real time: Confirmed -> Packed -> Shipped -> In Transit -> Out for Delivery -> Delivered.
 * Displays live location (e.g. "Bengaluru Distribution Center"), courier details, and "Delivered Successfully" banner.
 */

import { api } from '../services/api.js';
import { state } from '../state.js';
import { showToast } from '../app.js';

const STAGES = ["Order Placed", "Order Confirmed", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered"];

export function renderOrderTracking(container, orderId) {
  let pollIntervalId = null;
  let currentOrder = null;

  function formatPrice(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  function formatTime(isoStr) {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  }

  async function fetchOrderData() {
    try {
      const res = await api.getOrderById(orderId);
      currentOrder = res.order;
      render();
    } catch (err) {
      // Fallback to local state if backend unreachable
      currentOrder = state.getOrderById(orderId);
      render();
    }
  }

  function render() {
    const order = currentOrder;

    if (!order) {
      container.innerHTML = `
        <div class="container" style="padding: 4rem 1rem; text-align: center;">
          <h2>Order Not Found</h2>
          <p style="color: var(--text-secondary); margin: 1rem 0;">No active tracking data found for ID: <strong>${orderId}</strong></p>
          <a href="#my-orders" class="btn btn-primary">View My Orders</a>
        </div>
      `;
      return;
    }

    const isCancelled = order.status && order.status.startsWith('Cancelled');
    const currentStageIndex = order.status === 'Waiting for Admin Confirmation' ? 0 : STAGES.indexOf(order.status);
    const isDelivered = order.status === "Delivered";

    const expectedDateObj = new Date(order.deliveryDetails?.expectedDate || Date.now());
    const dateFormatted = isNaN(expectedDateObj) 
      ? order.deliveryDetails?.expectedDate 
      : expectedDateObj.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

    const deliveredDateFormatted = order.deliveryDetails?.deliveredAt 
      ? formatTime(order.deliveryDetails.deliveredAt) 
      : formatTime(order.createdAt);

    // Calculate progress fill percentage for horizontal line
    const progressPercent = Math.min(100, Math.max(0, (currentStageIndex / (STAGES.length - 1)) * 100));

    container.innerHTML = `
      <div class="tracking-page">
        <div class="container">
          <!-- Top Header Info with Live Sync Indicator -->
          <div class="tracking-header-card">
            <div class="tracking-id-text">
              <h3>📦 Order Tracking: <span>${order.orderId}</span></h3>
              <p>Placed on ${formatTime(order.createdAt)} • Mode: ${order.paymentMethod}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span class="badge" style="background: rgba(34, 197, 94, 0.1); color: #16a34a; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #16a34a; display: inline-block; animation: pulseDot 1.5s infinite;"></span>
                Live Connected
              </span>
              <span class="badge ${isDelivered ? 'badge-in-stock' : 'badge-tag'}" style="font-size: 0.95rem; padding: 0.4rem 0.8rem;">
                ● Current Status: <strong>${order.status}</strong>
              </span>
            </div>
          </div>

          <!-- CANCELLATION / DELIVERED / LIVE LOGISTICS BANNER -->
          ${isCancelled ? `
            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: var(--radius-xs); padding: 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1.25rem;">
              <div style="font-size: 2.5rem; color: #dc2626;">✕</div>
              <div>
                <h3 style="color: #991b1b; font-weight: 800; font-size: 1.2rem;">Order Cancelled (${order.status})</h3>
                <p style="color: #b91c1c; font-size: 0.9rem; margin-top: 4px;">This laptop order has been cancelled and will not be dispatched. No payment collected for Cash on Delivery.</p>
              </div>
            </div>
          ` : (isDelivered ? `
            <div class="delivered-hero-alert">
              <div class="delivered-alert-content">
                <div class="delivered-icon-circle">✓</div>
                <div>
                  <h3>🎉 Delivered Successfully</h3>
                  <p>Your laptop was delivered on <strong>${deliveredDateFormatted}</strong>. Handed over to recipient with OTP verification.</p>
                </div>
              </div>
              <div>
                <button type="button" class="btn btn-green" id="btn-download-invoice">
                  📄 Download Tax Invoice
                </button>
              </div>
            </div>
          ` : `
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 1.25rem 1.75rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: var(--shadow-sm);">
              <div>
                <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Courier Partner & Tracking:</span>
                <div style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-top: 2px;">
                  🚀 ${order.deliveryDetails?.courierPartner || 'Ekart Logistics'} (AWB: ${order.deliveryDetails?.trackingNumber || 'EK-EXP-9102834'})
                </div>
                ${order.deliveryDetails?.deliveryPersonName ? `
                  <div style="font-size: 0.85rem; color: var(--text-main); margin-top: 3px;">
                    🛵 Courier Agent: <strong>${order.deliveryDetails.deliveryPersonName}</strong> ${order.deliveryDetails.deliveryPersonPhone ? `• 📞 <a href="tel:${order.deliveryDetails.deliveryPersonPhone}" style="color: var(--primary-blue); font-weight: 700;">${order.deliveryDetails.deliveryPersonPhone}</a>` : ''}
                  </div>
                ` : ''}
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 3px;">
                  Current Location: <strong style="color: var(--primary-blue);">${order.deliveryDetails?.currentLocation || 'Distribution Facility'}</strong>
                </div>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Estimated Delivery:</span>
                <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-emerald);">
                  ${dateFormatted}
                </div>
              </div>
            </div>
          `)}

          <!-- 6-Stage Progress Stepper Card -->
          <div class="timeline-card">
            <h4 style="font-size: 1rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 2rem;">
              Delivery Progress Timeline
            </h4>

            <!-- Horizontal Stepper -->
            <div class="timeline-horizontal-stepper">
              <div class="timeline-h-line">
                <div class="timeline-h-progress-fill" style="width: ${progressPercent}%;"></div>
              </div>

              ${STAGES.map((stageName, idx) => {
                const isCompleted = idx < currentStageIndex || isDelivered;
                const isActive = idx === currentStageIndex && !isDelivered;

                let icon = '○';
                if (isCompleted) icon = '✓';
                if (isActive) icon = '●';

                return `
                  <div class="timeline-h-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                    <div class="timeline-h-node">${icon}</div>
                    <span class="timeline-h-label">${stageName}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Detailed Vertical Checkpoint Log -->
            <div class="checkpoints-log-wrap">
              <h4>Activity & Location Checkpoint Log</h4>
              <div class="checkpoint-vertical-list">
                ${(order.timeline || []).map((item, idx) => {
                  const isCompleted = item.completed || (idx <= currentStageIndex);
                  const isActive = idx === currentStageIndex && !isDelivered;

                  return `
                    <div class="checkpoint-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                      <div class="checkpoint-dot"></div>
                      <div class="checkpoint-stage-name">
                        <span>${item.stage}</span>
                        ${isCompleted ? `<span style="color: var(--accent-emerald); font-size: 0.8rem;">✓ Verified</span>` : ''}
                      </div>
                      ${item.timestamp ? `
                        <div class="checkpoint-timestamp">📅 ${formatTime(item.timestamp)}</div>
                      ` : `
                        <div class="checkpoint-timestamp" style="color: var(--text-muted); font-style: italic;">Pending</div>
                      `}
                      <p class="checkpoint-note">${item.note}</p>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Complete Order Summary Section -->
          <div class="order-details-grid">
            <!-- Items Purchased -->
            <div class="order-info-card">
              <h4>💻 Laptop Details</h4>
              ${order.items.map(item => `
                <div class="confirmed-item-row">
                  <img src="${item.image}" alt="${item.name}" />
                  <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">${item.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${item.specsSummary}</div>
                    <div style="font-size: 0.9rem; font-weight: 700; margin-top: 4px;">
                      Qty: ${item.quantity} × ${formatPrice(item.price)}
                    </div>
                  </div>
                </div>
              `).join('')}

              <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; margin-top: 0.5rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.25rem;">
                  <span>Item Total:</span>
                  <span>${formatPrice(order.pricing.itemsTotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--accent-emerald); margin-bottom: 0.25rem;">
                  <span>Discount:</span>
                  <span>-${formatPrice(order.pricing.discount)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 800; color: var(--primary-blue); border-top: 1px dashed var(--border-subtle); padding-top: 0.5rem;">
                  <span>Total Amount:</span>
                  <span>${formatPrice(order.pricing.totalAmount)}</span>
                </div>
              </div>
            </div>

            <!-- Shipping Address & Payment Card -->
            <div class="order-info-card">
              <h4>📍 Delivery Address & Payment</h4>
              <div style="margin-bottom: 1rem;">
                <div style="font-weight: 700; color: var(--text-main);">${order.customer.fullName}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;">
                  📱 Contact: ${order.customer.phone}
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;">
                  ${order.customer.houseNo}, ${order.customer.street}<br/>
                  ${order.customer.city}, ${order.customer.state} - <strong>${order.customer.pinCode}</strong>
                </div>
              </div>

              <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Payment Method:</div>
                <div style="font-weight: 600; color: var(--text-main); margin-top: 2px;">${order.paymentMethod}</div>
                <div style="margin-top: 4px;">
                  <span class="badge ${order.paymentStatus === 'Paid' ? 'badge-in-stock' : 'badge-tag'}">Payment: ${order.paymentStatus}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Navigation Links -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem;">
            <a href="#my-orders" class="btn btn-outline">
              ← Back to All Orders
            </a>
            <a href="#store" class="btn btn-primary">
              Continue Shopping ➔
            </a>
          </div>
        </div>
      </div>
    `;

    // Attach invoice download event
    const invoiceBtn = container.querySelector('#btn-download-invoice');
    if (invoiceBtn) {
      invoiceBtn.addEventListener('click', () => {
        showToast(`Generating Official Tax Invoice PDF for #${order.orderId}...`, 'success');
        setTimeout(() => window.print(), 400);
      });
    }
  }

  // Initial fetch
  fetchOrderData();

  // Set up real-time polling every 3 seconds to reflect Admin delivery updates immediately
  pollIntervalId = setInterval(() => {
    fetchOrderData();
  }, 3000);

  const cleanup = () => {
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
  };

  window.addEventListener('hashchange', cleanup, { once: true });
}
