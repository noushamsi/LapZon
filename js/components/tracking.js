/**
 * Order Tracking Component - Flipkart Style 6-Stage Progressive Delivery Tracker
 * Polls backend API in real time: Confirmed -> Packed -> Shipped -> In Transit -> Out for Delivery -> Delivered.
 * Displays live location (e.g. "Bengaluru Distribution Center"), courier details, and "Delivered Successfully" banner.
 */

import { api } from '../services/api.js';
import { state } from '../state.js';
import { showToast, trigger3DRefresh } from '../app.js';

const STAGES = ["Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"];

function getStageIndex(status) {
  if (!status || status === 'Waiting for Admin Confirmation' || status === 'Order Placed') return 0;
  if (status === 'Order Confirmed' || status === 'Confirmed') return 0;
  if (status === 'Processing' || status === 'Quality Checked') return 1;
  if (status === 'Packed') return 2;
  if (status === 'Shipped' || status === 'In Transit' || status === 'Dispatched') return 3;
  if (status === 'Out for Delivery') return 4;
  if (status === 'Delivered') return 5;
  return 0;
}

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
    const currentStageIndex = getStageIndex(order.status);
    const isDelivered = order.status === "Delivered" || currentStageIndex === 5;

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
      <div class="tracking-page fade-in-section">
        <div class="container">
          <!-- Clean Page Back Navigation Button -->
          <div class="page-back-nav-container">
            <button type="button" class="btn-page-back" id="btn-tracking-back" title="Back to previous page">
              <span class="back-arrow-icon">←</span>
              <span>Back</span>
            </button>
          </div>

          <!-- Top Header Info Card -->
          <div class="tracking-header-card">
            <div class="tracking-id-text">
              <h3>📦 Order Tracking: <span>${order.orderId}</span></h3>
              <p>Placed on ${formatTime(order.createdAt)} • Payment: <strong>${order.paymentMethod}</strong></p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
              <span class="badge" style="background: rgba(34, 197, 94, 0.12); color: #16a34a; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px; font-weight: 700; border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 999px; padding: 0.35rem 0.75rem;">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: #16a34a; display: inline-block;"></span>
                Live GPS Sync Active
              </span>
              <span class="badge ${isDelivered ? 'badge-in-stock' : 'badge-tag'}" style="font-size: 0.92rem; padding: 0.45rem 0.95rem; border-radius: 8px; font-weight: 800;">
                ● ${order.status}
              </span>
            </div>
          </div>

          <!-- CANCELLATION / DELIVERED / LIVE LOGISTICS BANNER -->
          ${isCancelled ? `
            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1.25rem;">
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
                  <p>Your laptop was delivered on <strong>${deliveredDateFormatted}</strong>. Handed over with OTP verification.</p>
                </div>
              </div>
              <div>
                <button type="button" class="btn btn-green" id="btn-download-invoice">
                  📄 Download Tax Invoice
                </button>
              </div>
            </div>
          ` : `
            <div class="courier-live-info-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: var(--shadow-sm); padding: 1.35rem 1.75rem; margin-bottom: 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 0.5px;">Courier Partner & Live Status</span>
                <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-top: 3px;">
                  🚀 ${order.deliveryDetails?.courierPartner || 'LapZon Express Logistics'} <span style="color: var(--primary-orange); font-size: 0.88rem;">(AWB: ${order.deliveryDetails?.trackingNumber || 'LZ-EXP-9102834'})</span>
                </div>
                ${order.deliveryDetails?.deliveryPersonName ? `
                  <div style="font-size: 0.85rem; color: var(--text-main); margin-top: 4px;">
                    🛵 Courier Agent: <strong>${order.deliveryDetails.deliveryPersonName}</strong> ${order.deliveryDetails.deliveryPersonPhone ? `• 📞 <a href="tel:${order.deliveryDetails.deliveryPersonPhone}" style="color: var(--primary-orange); font-weight: 700;">${order.deliveryDetails.deliveryPersonPhone}</a>` : ''}
                  </div>
                ` : ''}
                <div style="font-size: 0.86rem; color: var(--text-secondary); margin-top: 4px;">
                  Current Hub: <strong style="color: var(--primary-orange);">${order.deliveryDetails?.currentLocation || 'Bengaluru Distribution Center'}</strong>
                </div>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 0.5px;">Estimated Delivery</span>
                <div style="font-size: 1.25rem; font-weight: 800; color: #16a34a;">
                  ${dateFormatted}
                </div>
              </div>
            </div>
          `)}

          <!-- 6-Stage Progress Stepper Card -->
          <div class="timeline-card">
            <h4 style="font-size: 1rem; font-weight: 800; text-transform: uppercase; color: var(--text-main); letter-spacing: 0.5px; margin-bottom: 2.2rem; display: flex; align-items: center; gap: 8px;">
              <span>⚡ Live Delivery Progress</span>
              <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-left: auto;">(Step ${currentStageIndex + 1} of 6)</span>
            </h4>

            <!-- Horizontal 3D Stepper -->
            <div class="timeline-horizontal-stepper">
              <div class="timeline-h-line">
                <div class="timeline-h-progress-fill" style="width: ${progressPercent}%;"></div>
              </div>

              ${STAGES.map((stageName, idx) => {
                const isCompleted = idx < currentStageIndex || isDelivered;
                const isActive = idx === currentStageIndex && !isDelivered;

                let icon = '○';
                if (isCompleted) icon = '✓';
                if (isActive) icon = '🚀';

                return `
                  <div class="timeline-h-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                    <div class="timeline-h-node ${isActive ? 'pulse-node' : ''}">${icon}</div>
                    <span class="timeline-h-label">${stageName}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Detailed Vertical Checkpoint Log -->
            <div class="checkpoints-log-wrap" style="margin-top: 2.5rem;">
              <h4 style="font-weight: 800; font-size: 0.95rem; color: var(--text-main); margin-bottom: 1.2rem;">Activity & Location Checkpoint Log</h4>
              <div class="checkpoint-vertical-list">
                ${(order.timeline || []).map((item, idx) => {
                  const isCompleted = item.completed || (idx <= currentStageIndex);
                  const isActive = idx === currentStageIndex && !isDelivered;

                  return `
                    <div class="checkpoint-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                      <div class="checkpoint-dot"></div>
                      <div class="checkpoint-stage-name">
                        <span>${item.stage}</span>
                        ${isCompleted ? `<span style="color: #16a34a; font-size: 0.8rem; font-weight: 700;">✓ Verified</span>` : ''}
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

    // Attach back navigation button event
    const backBtn = container.querySelector('#btn-tracking-back');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.hash = '#my-orders';
        }
      });
    }

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
