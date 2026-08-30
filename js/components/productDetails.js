/**
 * Laptop Product Details Component
 * Dedicated full product details page for normal users.
 * NO admin controls. Shows complete specifications, gallery, pricing, stock status, Buy Now and Add to Cart.
 */

import { api } from '../services/api.js';
import { state } from '../state.js';
import { showToast } from '../app.js';

export async function renderProductDetails(container, productId) {
  let product = null;
  let isLoading = true;

  function formatPrice(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  try {
    const res = await api.getProductById(productId);
    product = res.product;
  } catch {
    product = state.getProductById(productId);
  } finally {
    isLoading = false;
  }

  if (!product) {
    container.innerHTML = `
      <div class="container" style="padding: 5rem 1.25rem; text-align: center;">
        <div style="font-size: 3.5rem; margin-bottom: 1rem;">💻🔍</div>
        <h2>Laptop Not Found</h2>
        <p style="color: var(--text-secondary); margin: 0.75rem 0 1.5rem;">
          The laptop you are looking for is unavailable or has been discontinued.
        </p>
        <a href="#store" class="btn btn-primary btn-lg">
          ← Back to Laptop Store
        </a>
      </div>
    `;
    return;
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  let activeImage = images[0];
  const isInStock = product.inStock && (product.stock > 0 || product.stock === undefined);

  container.innerHTML = `
    <div class="product-details-page">
      <div class="container">
        
        <!-- Breadcrumb Navigation -->
        <nav class="breadcrumb-nav" aria-label="breadcrumb">
          <a href="#welcome">Home</a>
          <span class="bc-sep">›</span>
          <a href="#store">Laptops</a>
          <span class="bc-sep">›</span>
          <a href="#store?cat=${encodeURIComponent(product.category || 'Ultrabook')}">${product.category || 'Ultrabook'}</a>
          <span class="bc-sep">›</span>
          <span class="bc-current">${product.brand}</span>
        </nav>

        <div class="pdp-layout-grid">
          
          <!-- LEFT COLUMN: Product Gallery & Sticky Action Buttons -->
          <div class="pdp-gallery-col">
            <div class="pdp-gallery-sticky">
              
              <!-- Main High-Res Image Display -->
              <div class="pdp-main-image-wrap">
                <img src="${activeImage}" alt="${product.name}" id="pdp-active-img" class="pdp-main-img" />
                <span class="badge badge-assured pdp-assured-tag">⚡ Flipkart Assured</span>
              </div>

              <!-- Thumbnails -->
              ${images.length > 1 ? `
                <div class="pdp-thumbs-row">
                  ${images.map((img, idx) => `
                    <div class="pdp-thumb-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
                      <img src="${img}" alt="${product.name} view ${idx + 1}" />
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <!-- Action Buttons (Add to Cart & Buy Now) -->
              <div class="pdp-action-buttons-group">
                ${isInStock ? `
                  <button type="button" class="btn btn-orange btn-lg pdp-btn-buy" id="pdp-btn-buy-now">
                    ⚡ BUY NOW
                  </button>
                  <button type="button" class="btn btn-primary btn-lg pdp-btn-cart" id="pdp-btn-add-cart">
                    🛒 ADD TO CART
                  </button>
                ` : `
                  <button type="button" class="btn btn-outline btn-lg btn-block" disabled style="cursor: not-allowed; opacity: 0.65;">
                    ✕ CURRENTLY OUT OF STOCK
                  </button>
                `}
              </div>

              <!-- Safe Checkout & Delivery Assurance Pills -->
              <div class="pdp-guarantee-box">
                <div class="pdp-guar-item">
                  <span class="guar-icon">🛡️</span>
                  <div>
                    <strong>100% Genuine Brand Laptop</strong>
                    <p>Sourced directly from authorized manufacturer channels</p>
                  </div>
                </div>
                <div class="pdp-guar-item">
                  <span class="guar-icon">🔄</span>
                  <div>
                    <strong>7-Day Replacement Policy</strong>
                    <p>Free replacement in case of defects or transit damage</p>
                  </div>
                </div>
                <div class="pdp-guar-item">
                  <span class="guar-icon">⚡</span>
                  <div>
                    <strong>Express Air Logistics</strong>
                    <p>Tamper-evident anti-static packaging with OTP verification</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- RIGHT COLUMN: Laptop Info, Pricing, Bank Offers, Full Specifications Sheet -->
          <div class="pdp-info-col">
            
            <!-- Brand & Category Tags -->
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
              <span class="badge badge-tag" style="font-size: 0.82rem; padding: 0.3rem 0.75rem;">
                ${product.brand}
              </span>
              <span class="badge" style="background: #f1f5f9; color: #475569; font-size: 0.82rem;">
                ${product.category || 'Laptop'}
              </span>
              ${product.tag ? `<span class="badge badge-tag" style="background: #e0f2fe; color: #0369a1;">${product.tag}</span>` : ''}
            </div>

            <!-- Product Title -->
            <h1 class="pdp-title">
              ${product.name}
            </h1>

            <!-- Ratings & Reviews -->
            <div class="pdp-ratings-bar">
              <span class="badge badge-rating" style="font-size: 0.95rem; padding: 0.3rem 0.65rem;">
                ${product.rating || 4.5} ★
              </span>
              <span class="pdp-reviews-count">
                ${Number(product.reviewsCount || 342).toLocaleString('en-IN')} Ratings & Verified Buyer Reviews
              </span>
            </div>

            <!-- Pricing Section -->
            <div class="pdp-price-card">
              <div class="pdp-price-main">
                <span class="pdp-current-price">${formatPrice(product.price)}</span>
                <span class="pdp-mrp-price">${formatPrice(product.mrp)}</span>
                <span class="pdp-discount-badge">${product.discount}% off</span>
              </div>
              <div class="pdp-inclusive-tax">+ ₹0 Packaging Fee • Inclusive of all taxes</div>
            </div>

            <!-- Stock Status Pill -->
            <div class="pdp-stock-status-wrap">
              ${isInStock ? `
                <div class="pdp-stock-pill in-stock">
                  ✓ In Stock ${product.stock && product.stock <= 5 ? `— Only ${product.stock} units left, order soon!` : '(Ready to Dispatch)'}
                </div>
              ` : `
                <div class="pdp-stock-pill out-stock">
                  ✕ Currently Out of Stock — Notify me when available
                </div>
              `}
            </div>

            <!-- Bank & Promotional Offers -->
            <div class="pdp-offers-card">
              <h4>Available Offers & Discounts</h4>
              <ul class="pdp-offers-list">
                <li>
                  <span class="offer-tag">Bank Offer</span>
                  <span>Flat <strong>₹5,000 Instant Discount</strong> with Coupon Code <code style="background: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: 700;">LAPTOP5000</code> at checkout.</span>
                </li>
                <li>
                  <span class="offer-tag">Special Price</span>
                  <span>Extra ₹${formatPrice(product.mrp - product.price)} discount already applied on MRP.</span>
                </li>
                <li>
                  <span class="offer-tag">No Cost EMI</span>
                  <span>Avail No Cost EMI starting at ${formatPrice(Math.round(product.price / 6))}/month on major credit cards.</span>
                </li>
                <li>
                  <span class="offer-tag">Partner Offer</span>
                  <span>Get free 3-month Microsoft 365 or Apple Arcade trial with this laptop.</span>
                </li>
              </ul>
            </div>

            <!-- Delivery Pincode Check Simulator -->
            <div class="pdp-delivery-check-box">
              <span style="font-weight: 700; font-size: 0.88rem; color: var(--text-main);">Delivery to:</span>
              <div class="pincode-input-group">
                <input type="text" id="pdp-pincode-input" placeholder="Enter Delivery Pincode" maxlength="6" value="560038" />
                <button type="button" class="btn btn-sm btn-primary" id="btn-check-pincode">Check</button>
              </div>
              <div id="pincode-check-result" style="font-size: 0.85rem; color: var(--accent-emerald); font-weight: 600; margin-top: 6px;">
                🚚 Free Express Delivery to Indiranagar, Bengaluru by <strong>Tomorrow</strong> | Open Box Verification Available
              </div>
            </div>

            <!-- Product Description Overview -->
            <div class="pdp-description-section">
              <h3>Product Overview</h3>
              <p>${product.description || 'Engineered for exceptional computing performance, high responsiveness, and long-lasting durability.'}</p>
            </div>

            <!-- Full Technical Specifications Table -->
            <div class="pdp-specs-section">
              <h3>Technical Specifications</h3>
              <table class="pdp-full-specs-table">
                <tbody>
                  <tr>
                    <td class="spec-label">Brand & Series</td>
                    <td class="spec-value"><strong>${product.brand}</strong> (${product.series || `${product.brand} Series`})</td>
                  </tr>
                  <tr>
                    <td class="spec-label">Model Name</td>
                    <td class="spec-value"><strong>${product.name}</strong></td>
                  </tr>
                  <tr>
                    <td class="spec-label">Processor</td>
                    <td class="spec-value"><strong>${product.processor}</strong></td>
                  </tr>
                  <tr>
                    <td class="spec-label">System RAM</td>
                    <td class="spec-value"><strong>${product.ram}</strong> High-Speed Memory</td>
                  </tr>
                  <tr>
                    <td class="spec-label">Storage Capacity</td>
                    <td class="spec-value"><strong>${product.storage}</strong> NVMe PCIe High-Speed SSD</td>
                  </tr>
                  <tr>
                    <td class="spec-label">Graphics Coprocessor</td>
                    <td class="spec-value"><strong>${product.graphics || 'Integrated Graphics'}</strong></td>
                  </tr>
                  <tr>
                    <td class="spec-label">Display & Screen Size</td>
                    <td class="spec-value"><strong>${product.display || `${product.screenSize || '15.6'}-inch Display`}</strong></td>
                  </tr>
                  <tr>
                    <td class="spec-label">Operating System</td>
                    <td class="spec-value"><strong>${product.os || 'Windows 11 Home'}</strong></td>
                  </tr>
                  <tr>
                    <td class="spec-label">Battery & Power</td>
                    <td class="spec-value"><strong>${product.battery || 'All-Day Battery Backup with Fast Charging'}</strong></td>
                  </tr>
                  <tr>
                    <td class="spec-label">Device Weight</td>
                    <td class="spec-value"><strong>${product.weight || '1.65 kg'}</strong></td>
                  </tr>
                  <tr>
                    <td class="spec-label">In The Box</td>
                    <td class="spec-value">Laptop, Power Adapter, Charging Cable, User Manual, Warranty Card</td>
                  </tr>
                  <tr>
                    <td class="spec-label">Warranty Summary</td>
                    <td class="spec-value"><strong style="color: var(--accent-emerald);">1 Year Onsite Manufacturer Warranty + 7 Days Free Replacement</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>
    </div>
  `;

  attachProductDetailsEvents(container, product, images);
}

function attachProductDetailsEvents(container, product, images) {
  // 1. Thumbnail image switcher
  container.querySelectorAll('.pdp-thumb-item').forEach(thumb => {
    thumb.addEventListener('click', () => {
      container.querySelectorAll('.pdp-thumb-item').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const idx = Number(thumb.dataset.idx);
      const mainImg = container.querySelector('#pdp-active-img');
      if (mainImg && images[idx]) {
        mainImg.src = images[idx];
      }
    });
  });

  // 2. Add to Cart Button
  const addCartBtn = container.querySelector('#pdp-btn-add-cart');
  if (addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      const res = state.addToCart(product.id, 1);
      if (res.success) {
        showToast(`Added "${product.name}" to Cart! 🛒`, 'success');
      } else {
        showToast(res.message, 'warning');
      }
    });
  }

  // 3. Buy Now Button (Direct checkout flow)
  const buyNowBtn = container.querySelector('#pdp-btn-buy-now');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      state.addToCart(product.id, 1);
      window.location.hash = '#checkout-address';
    });
  }

  // 4. Pincode checker
  const checkPinBtn = container.querySelector('#btn-check-pincode');
  const pinInput = container.querySelector('#pdp-pincode-input');
  const resultDiv = container.querySelector('#pincode-check-result');

  if (checkPinBtn && pinInput && resultDiv) {
    checkPinBtn.addEventListener('click', () => {
      const pin = pinInput.value.trim();
      if (!/^\d{6}$/.test(pin)) {
        resultDiv.style.color = '#ef4444';
        resultDiv.textContent = '❌ Please enter a valid 6-digit Indian delivery pincode.';
        return;
      }
      resultDiv.style.color = 'var(--accent-emerald)';
      resultDiv.innerHTML = `🚚 Express Delivery available to PIN <strong>${pin}</strong> by <strong>Tomorrow</strong> | Open Box Verification Eligible.`;
      showToast('Delivery serviceability confirmed for pincode ' + pin, 'success');
    });
  }
}
