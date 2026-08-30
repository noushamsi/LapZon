/**
 * Laptop Product Details Component
 * Dedicated full product details page for normal users.
 * NO admin controls. Shows complete specifications, gallery, pricing, stock status,
 * Buy Now, Add to Cart, Share (with 5-referral 30% discount offer), and Verified Buyer Reviews.
 */

import { api } from '../services/api.js';
import { state } from '../state.js';
import { auth } from '../services/auth.js';
import { showToast } from '../app.js';
import { openAuthModal } from './authModal.js';

export async function renderProductDetails(container, productId) {
  let product = null;
  let dynamicReviews = [];
  let allProducts = [];

  function formatPrice(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  try {
    const [prodRes, revRes, allProdRes] = await Promise.allSettled([
      api.getProductById(productId),
      api.getProductReviews(productId),
      api.getProducts()
    ]);

    if (prodRes.status === 'fulfilled') product = prodRes.value?.product;
    if (revRes.status === 'fulfilled') dynamicReviews = revRes.value?.reviews || [];
    if (allProdRes.status === 'fulfilled') allProducts = allProdRes.value?.products || [];
  } catch {
    product = state.getProductById(productId);
    allProducts = state.getProducts() || [];
  }

  if (!product) {
    product = state.getProductById(productId);
  }
  if (!allProducts || allProducts.length === 0) {
    allProducts = state.getProducts() || [];
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

  // Filter similar laptops (same brand, category, or similar budget, excluding current product)
  let similarProducts = allProducts.filter(p => p.id !== product.id && p.status !== 'pending');
  similarProducts.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.brand === product.brand) scoreA += 3;
    if (b.brand === product.brand) scoreB += 3;
    if (a.category && a.category === product.category) scoreA += 2;
    if (b.category && b.category === product.category) scoreB += 2;
    if (a.inStock) scoreA += 1;
    if (b.inStock) scoreB += 1;
    return scoreB - scoreA;
  });
  similarProducts = similarProducts.slice(0, 4);

  const defaultImg = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
  const rawImages = (product.images && product.images.length > 0) ? product.images : [product.image || defaultImg];
  const images = rawImages.map(img => (img && img.trim()) ? img : defaultImg);
  let activeImage = images[0];
  const isInStock = product.inStock !== false && (product.stock === undefined || Number(product.stock) > 0);

  // User Referral Code
  const user = auth.getUser();
  const userRefCode = user ? (user.referralCode || `LK-${user.id.substring(user.id.length - 6).toUpperCase()}`) : 'LK-FRIEND';

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

              <!-- Action Buttons (Buy Now, Add to Cart, Share) -->
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
                <button type="button" class="btn btn-outline btn-lg" id="pdp-btn-share" style="border-color: #3b82f6; color: #2563eb; font-weight: 700;">
                  🔗 SHARE & EARN 30% OFF
                </button>
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
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap;">
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
                <span class="pdp-mrp-price">${formatPrice(product.mrp || product.price)}</span>
                <span class="pdp-discount-badge">${product.discount || 0}% off</span>
              </div>
              <div class="pdp-inclusive-tax">+ ₹0 Packaging Fee • Cash on Delivery Available</div>
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

            <!-- Referral Offer Callout -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px dashed #22c55e; border-radius: var(--radius-xs); padding: 1rem 1.25rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
              <div>
                <strong style="color: #15803d; font-size: 0.92rem;">🎁 Refer Friends & Get 30% OFF Coupon!</strong>
                <p style="font-size: 0.8rem; color: #166534; margin-top: 2px;">Share this laptop. When 5 friends register, unlock a flat 30% OFF discount coupon for your next purchase.</p>
              </div>
              <button type="button" class="btn btn-sm btn-green" id="pdp-btn-share-referral" style="white-space: nowrap;">
                🔗 Share Link
              </button>
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

            <!-- Customer Reviews Section -->
            <div class="pdp-specs-section" style="margin-top: 2rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0;">Ratings & Customer Reviews</h3>
                <button type="button" class="btn btn-outline-primary btn-sm" id="btn-pdp-write-review" style="font-weight: 700;">
                  ⭐ Write a Review
                </button>
              </div>

              <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 1.5rem; margin-top: 1rem;">
                <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                  <div style="text-align: center; padding-right: 1.5rem; border-right: 1px solid var(--border-subtle);">
                    <div style="font-size: 2.5rem; font-weight: 900; color: var(--text-main); line-height: 1;">${product.rating || 4.5} ★</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Verified Customer Rating</div>
                  </div>
                  <div style="flex: 1; font-size: 0.85rem; color: var(--text-secondary);">
                    <div>⭐ <strong>5 Stars</strong>: 82% of buyers recommend this laptop</div>
                    <div>⭐ <strong>4 Stars</strong>: 14% of buyers recommend this laptop</div>
                    <div>⭐ <strong>3 Stars or below</strong>: 4% of buyers</div>
                  </div>
                </div>

                <!-- Dynamic & Seed Reviews -->
                <div style="display: flex; flex-direction: column; gap: 1rem;" id="pdp-reviews-list">
                  ${dynamicReviews.map(r => `
                    <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 4px;">
                        <span class="badge badge-rating">${r.rating} ★</span>
                        <strong style="font-size: 0.9rem;">${r.title || 'Verified Review'}</strong>
                      </div>
                      <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">${r.comment}</p>
                      <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                        ${r.userName || 'Customer'} • ${r.isVerifiedPurchase ? 'Verified Purchase ✓' : 'Customer Review'}
                      </div>
                    </div>
                  `).join('')}

                  <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 4px;">
                      <span class="badge badge-rating">5 ★</span>
                      <strong style="font-size: 0.9rem;">Outstanding performance & screen clarity!</strong>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                      Super fast boot time, zero thermal throttling during intense multitasking, and the battery easily lasts a full workday. Highly recommend this laptop!
                    </p>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                      Ananya K. • Verified Buyer • Bengaluru • Cash on Delivery
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- Similar Laptops Section -->
        ${similarProducts.length > 0 ? `
          <section class="pdp-similar-section" style="margin-top: 3.5rem; padding-top: 2.25rem; border-top: 2px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <div style="display: inline-flex; align-items: center; gap: 6px; background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 0.8rem; padding: 3px 10px; border-radius: 20px; margin-bottom: 6px;">
                  ✨ Handpicked for You
                </div>
                <h2 style="font-size: 1.55rem; font-weight: 800; color: var(--text-main); margin: 0 0 4px; letter-spacing: -0.5px;">
                  💻 Similar Laptops You May Also Like
                </h2>
                <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0;">
                  Explore other high-performance laptops with comparable specs, pricing, and ratings.
                </p>
              </div>
              <a href="#store?cat=${encodeURIComponent(product.category || 'All')}" class="btn btn-outline-primary" style="font-weight: 700; font-size: 0.85rem; border-radius: 8px;">
                View All ${product.category || 'Laptops'} ➔
              </a>
            </div>

            <div class="similar-laptops-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
              ${similarProducts.map(item => `
                <div class="similar-laptop-card" data-id="${item.id}" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-sm); transition: all 0.25s ease; cursor: pointer; position: relative;">
                  <div>
                    <div class="similar-card-img-wrap" style="width: 100%; height: 170px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 1rem; position: relative; background: var(--bg-subtle); border-radius: var(--radius-xs); padding: 8px;">
                      <img src="${item.image || defaultImg}" alt="${item.name}" loading="lazy" style="max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.3s ease;" />
                      <span class="badge badge-rating" style="position: absolute; bottom: 8px; left: 8px; background: #16a34a; color: #fff; font-size: 0.78rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${item.rating || 4.5} ★</span>
                      ${item.discount ? `<span class="badge badge-tag" style="position: absolute; top: 8px; right: 8px; background: #fee2e2; color: #dc2626; font-size: 0.72rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${item.discount}% OFF</span>` : ''}
                    </div>

                    <div style="font-size: 0.78rem; color: var(--primary-blue); font-weight: 700; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">
                      ${item.brand} • ${item.category || 'Laptop'}
                    </div>
                    
                    <h4 class="similar-item-title" style="font-size: 0.98rem; font-weight: 800; color: var(--text-main); line-height: 1.35; margin: 0 0 0.6rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.7rem;">
                      ${item.name}
                    </h4>

                    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 0.85rem;">
                      <span style="background: #f1f5f9; color: #334155; font-size: 0.72rem; font-weight: 600; padding: 2px 6px; border-radius: 3px;">🚀 ${item.processor || 'High-Speed CPU'}</span>
                      <span style="background: #f1f5f9; color: #334155; font-size: 0.72rem; font-weight: 600; padding: 2px 6px; border-radius: 3px;">⚡ ${item.ram || '8GB RAM'} | ${item.storage || '512GB SSD'}</span>
                    </div>
                  </div>

                  <div>
                    <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 0.85rem;">
                      <strong style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${formatPrice(item.price)}</strong>
                      ${item.mrp ? `<span style="font-size: 0.82rem; color: var(--text-muted); text-decoration: line-through;">${formatPrice(item.mrp)}</span>` : ''}
                    </div>

                    <button type="button" class="btn btn-outline-primary btn-sm btn-block btn-view-similar" data-id="${item.id}" style="font-weight: 700; padding: 0.45rem; border-radius: 6px;">
                      ⚡ View Laptop Details ➔
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

      </div>
    </div>

    <!-- Share & Referral Modal -->
    <div id="share-referral-modal" class="modal-overlay">
      <div class="modal-card" style="max-width: 500px; padding: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">🔗 Share & Refer Friends</h3>
          <button type="button" class="btn-slot-action" id="btn-close-share-modal" style="font-size: 1.2rem;">✕</button>
        </div>

        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="width: 60px; height: 60px; background: #dcfce7; border-radius: 50%; color: #15803d; font-size: 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;">
            🎁
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #166534;">Unlock Flat 30% OFF Coupon</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
            Share this laptop with 5 friends. When they visit and register on LapKart Plus, you receive an exclusive <strong>30% OFF Coupon</strong> for your next laptop order!
          </p>
        </div>

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label>Your Unique Referral / Share Link:</label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="share-link-input" readonly value="${window.location.origin}/#store?ref=${userRefCode}" style="font-size: 0.85rem; background: var(--bg-subtle);" />
            <button type="button" class="btn btn-primary" id="btn-copy-share-link" style="white-space: nowrap;">
              📋 Copy Link
            </button>
          </div>
        </div>

        <button type="button" class="btn btn-orange btn-block btn-lg" id="btn-native-share">
          📱 Share via WhatsApp / Device Apps
        </button>
      </div>
    </div>
  `;

  attachProductDetailsEvents(container, product, images, userRefCode);
}

function attachProductDetailsEvents(container, product, images, userRefCode) {
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

  // 2. Add to Cart Button (passes product object directly to avoid any out-of-stock sync lag)
  const addCartBtn = container.querySelector('#pdp-btn-add-cart');
  if (addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      const res = state.addToCart(product.id, 1, product);
      if (res.success) {
        showToast(`Added "${product.name}" to Cart! 🛒`, 'success');
      } else {
        showToast(res.message, 'warning');
      }
    });
  }

  // 3. Buy Now Button (Direct checkout flow with authentication guard)
  const buyNowBtn = container.querySelector('#pdp-btn-buy-now');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      state.addToCart(product.id, 1, product);
      if (!auth.isAuthenticated()) {
        openAuthModal('login', {
          redirectHash: '#checkout-address',
          subtitle: 'Please sign in or create an account to proceed with your laptop order'
        });
      } else {
        window.location.hash = '#checkout-address';
      }
    });
  }

  // 4. Write Review Button
  const writeRevBtn = container.querySelector('#btn-pdp-write-review');
  if (writeRevBtn) {
    writeRevBtn.addEventListener('click', async () => {
      const ratingStr = prompt(`Rate "${product.name}" (1 to 5 Stars):`, '5');
      if (!ratingStr) return;
      const rating = parseInt(ratingStr, 10);
      const title = prompt('Review Title:', 'Great build quality & fast delivery');
      if (!title) return;
      const comment = prompt('Your Review Comments:');
      if (!comment) return;

      try {
        const res = await api.submitReview({
          productId: product.id,
          rating,
          title,
          comment
        });
        showToast(res.message || 'Review submitted! Thank you.', 'success');
        renderProductDetails(container, product.id);
      } catch (err) {
        showToast(err.message || 'Failed to submit review.', 'error');
      }
    });
  }

  // 5. Share & Referral Modal Handlers
  const shareModal = container.querySelector('#share-referral-modal');
  const openShareModal = () => {
    if (shareModal) shareModal.classList.add('active');
  };

  const shareBtn = container.querySelector('#pdp-btn-share');
  const shareRefBtn = container.querySelector('#pdp-btn-share-referral');
  const closeShareBtn = container.querySelector('#btn-close-share-modal');
  const copyLinkBtn = container.querySelector('#btn-copy-share-link');
  const nativeShareBtn = container.querySelector('#btn-native-share');
  const shareInput = container.querySelector('#share-link-input');

  if (shareBtn) shareBtn.addEventListener('click', openShareModal);
  if (shareRefBtn) shareRefBtn.addEventListener('click', openShareModal);
  if (closeShareBtn && shareModal) {
    closeShareBtn.addEventListener('click', () => shareModal.classList.remove('active'));
  }

  const shareUrl = `${window.location.origin}/#store?ref=${userRefCode}`;

  if (copyLinkBtn && shareInput) {
    copyLinkBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Referral link copied to clipboard! 📋 Share with friends to get 30% OFF.', 'success');
      } catch {
        shareInput.select();
        document.execCommand('copy');
        showToast('Link copied!', 'success');
      }
    });
  }

  if (nativeShareBtn) {
    nativeShareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${product.name} on LapKart Plus`,
            text: `Check out the ${product.name} on LapKart Plus laptop store! Join via my link:`,
            url: shareUrl
          });
          showToast('Shared successfully!', 'success');
        } catch {
          // User dismissed or unsupported
        }
      } else {
        if (copyLinkBtn) copyLinkBtn.click();
      }
    });
  }

  // 6. Similar Products Navigation Handler
  container.querySelectorAll('.similar-laptop-card, .btn-view-similar').forEach(card => {
    card.addEventListener('click', (e) => {
      const targetId = card.dataset.id || card.closest('.similar-laptop-card')?.dataset.id;
      if (targetId) {
        window.location.hash = `#product/${targetId}`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}
