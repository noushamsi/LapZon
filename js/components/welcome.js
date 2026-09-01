/**
 * Welcome Page Component - LapZon
 * Modern Premium E-Commerce UI (Focused Exclusively on Laptops)
 * 
 * Features:
 * - Clean White Surface with Orange Gradient Accents & Dark Navy Typography
 * - Photorealistic Flagship Laptop Hero Showcase Banner
 * - Official Top Brands Interactive Strip
 * - Live Featured Laptops & Best Deals Grid with Add to Cart & Buy Now
 * - The LapZon Advantage & Trust Highlights
 * - Verified Customer Reviews Carousel
 * - Modernized LapZon Footer with Trust Badges & Direct Support
 */

import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { state } from '../state.js';
import { openAuthModal } from './authModal.js';
import { showToast, trigger3DRefresh } from '../app.js';

export async function renderWelcomePage(container) {
  const user = auth.getUser();

  container.innerHTML = `
    <div class="welcome-page fade-in-section">
      
      <!-- ================================================================= -->
      <!-- 1. MODERN HERO SHOWCASE SECTION -->
      <!-- ================================================================= -->
      <section class="welcome-hero-premium">
        <div class="container">
          <div class="hero-premium-grid">
            
            <!-- Left Hero Content -->
            <div class="hero-left-content">
              <div class="hero-tag-badge">
                <span class="hero-tag-dot"></span>
                <span>Quality Products, Trusted Service</span>
              </div>
              
              <h1 class="hero-main-heading">
                Explore Premium Laptops <br/>
                <span class="hero-gradient-text">Built for Excellence</span>
              </h1>
              
              <p class="hero-description-text">
                Explore premium laptops from top brands, built for performance, productivity and everyday excellence. Shop smart. Choose better.
              </p>
              
              <!-- CTA Button Group -->
              <div class="hero-btn-actions">
                <a href="#store" class="btn-hero-primary" id="hero-btn-explore">
                  <span>⚡ Explore Laptops</span>
                  <span class="btn-arrow">➔</span>
                </a>
                <button type="button" class="btn-hero-secondary" id="hero-btn-auth">
                  <span>${user ? '👤 My Dashboard' : '🔑 Sign In'}</span>
                </button>
              </div>

              <!-- Key Metrics Strip -->
              <div class="hero-stats-row">
                <div class="hero-stat-box">
                  <div class="stat-num">100%</div>
                  <div class="stat-lbl">Authentic Brands</div>
                </div>
                <div class="hero-stat-box">
                  <div class="stat-num">24 Hr</div>
                  <div class="stat-lbl">Express Air Dispatch</div>
                </div>
                <div class="hero-stat-box">
                  <div class="stat-num">COD</div>
                  <div class="stat-lbl">Doorstep Pay</div>
                </div>
                <div class="hero-stat-box">
                  <div class="stat-num">7-Day</div>
                  <div class="stat-lbl">Replacement</div>
                </div>
              </div>
            </div>

            <!-- Right Hero Showcase Image (Single Flagship Laptop in Clean Solid Showcase Card) -->
            <div class="hero-right-visual">
              <div class="hero-image-card">
                <img 
                  src="assets/images/hero-single-laptop.jpg" 
                  alt="LapZon Premium Flagship Laptop" 
                  class="hero-flagship-img"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 2. POPULAR OFFICIAL BRANDS STRIP (Clean Modern Brand Cards) -->
      <!-- ================================================================= -->
      <section class="popular-brands-section">
        <div class="container">
          <div class="brands-section-header">
            <span class="sub-pill">Official Store Partners</span>
            <h2 class="section-title-sm">Shop by Leading Laptop Brands</h2>
          </div>
          
          <div class="brands-clean-grid">
            ${[
              { name: 'Apple', tag: 'MacBook M3 Pro & Air', icon: '🍎' },
              { name: 'ASUS', tag: 'ROG, TUF & ZenBook', icon: '⚡' },
              { name: 'Dell', tag: 'XPS, Alienware & Inspiron', icon: '💻' },
              { name: 'HP', tag: 'Spectre, OMEN & Pavilion', icon: '✨' },
              { name: 'Lenovo', tag: 'ThinkPad, Legion & Yoga', icon: '🔥' },
              { name: 'Acer', tag: 'Predator & Swift Go', icon: '🚀' },
              { name: 'MSI', tag: 'Raider, Stealth & Cyborg', icon: '🎯' },
              { name: 'Samsung', tag: 'Galaxy Book4 Ultra', icon: '⭐' }
            ].map(b => `
              <a href="#store?brand=${encodeURIComponent(b.name)}" class="brand-clean-card hover-lift">
                <span class="brand-icon">${b.icon}</span>
                <span class="brand-name">${b.name}</span>
                <span class="brand-tag">${b.tag}</span>
              </a>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 3. FEATURED LAPTOPS & BEST DEALS (Live Store Products) -->
      <!-- ================================================================= -->
      <section class="featured-laptops-section">
        <div class="container">
          <div class="section-header-flex">
            <div>
              <div class="badge badge-tag">Handpicked Performance</div>
              <h2 class="section-main-title">Featured Laptops & Best Deals</h2>
              <p class="section-subtext">Engineered for gaming, creators, coding, and executive productivity.</p>
            </div>
            <a href="#store" class="btn btn-outline-primary btn-sm">View All Laptops ➔</a>
          </div>

          <!-- Product Cards Container -->
          <div id="welcome-featured-products-grid" class="featured-products-grid">
            <!-- Loading Skeletons -->
            ${[1, 2, 3, 4].map(() => `
              <div class="product-skeleton-card">
                <div class="skeleton-shimmer skeleton-img"></div>
                <div class="skeleton-shimmer skeleton-line" style="width: 40%; margin-top: 12px;"></div>
                <div class="skeleton-shimmer skeleton-line" style="width: 80%;"></div>
                <div class="skeleton-shimmer skeleton-line" style="width: 60%;"></div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 4. THE LAPZON ADVANTAGE -->
      <!-- ================================================================= -->
      <section class="lapzon-advantage-section">
        <div class="container">
          <div class="advantage-header">
            <div class="badge badge-tag">Why Buy From Us</div>
            <h2 class="section-main-title">The LapZon Assurance</h2>
            <p class="section-subtext">Quality Products, Trusted Service across all 19,000+ PIN codes in India.</p>
          </div>

          <div class="advantage-grid">
            <div class="advantage-card">
              <div class="adv-icon-wrap">🛡️</div>
              <h3>100% Genuine Brand Sealed</h3>
              <p>Every laptop comes in manufacturer factory-sealed packaging with full 1-year official brand warranty and GST invoice.</p>
            </div>

            <div class="advantage-card">
              <div class="adv-icon-wrap">⚡</div>
              <h3>Free Express Air Dispatch</h3>
              <p>Priority air shipping with tamper-evident security tape, zero transit damage guarantee, and live GPS checkpoint tracking.</p>
            </div>

            <div class="advantage-card">
              <div class="adv-icon-wrap">💵</div>
              <h3>Cash on Delivery with Inspection</h3>
              <p>Verify the outer brand seal and package integrity at your doorstep before handing over cash or UPI payment.</p>
            </div>

            <div class="advantage-card">
              <div class="adv-icon-wrap">🔄</div>
              <h3>7-Day Doorstep Replacement</h3>
              <p>Experiencing hardware issues out of the box? Our dedicated support team arranges an express doorstep replacement immediately.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 5. VERIFIED BUYER REVIEWS -->
      <!-- ================================================================= -->
      <section class="customer-reviews-section">
        <div class="container">
          <div class="reviews-header">
            <div class="badge badge-tag">Customer Stories</div>
            <h2 class="section-main-title">Trusted by 50,000+ Students & Professionals</h2>
          </div>

          <div class="reviews-grid">
            <div class="review-glass-card">
              <div class="review-top-row">
                <span class="badge badge-rating">5.0 ★</span>
                <span class="verified-buyer-text">✓ Verified Buyer</span>
              </div>
              <p class="review-body-text">
                "Ordered the Apple MacBook Air M3. Received the sealed package within 24 hours. The screen quality and battery life are phenomenal. Seamless delivery experience!"
              </p>
              <div class="review-author-info">
                <strong>Ananya Sharma</strong>
                <span>UI/UX Designer, Bengaluru</span>
              </div>
            </div>

            <div class="review-glass-card">
              <div class="review-top-row">
                <span class="badge badge-rating">5.0 ★</span>
                <span class="verified-buyer-text">✓ Verified Buyer</span>
              </div>
              <p class="review-body-text">
                "Unlocked the 30% discount coupon by sharing with my college friends and saved ₹24,000 on the ASUS ROG Strix G16. Best platform for laptop enthusiasts!"
              </p>
              <div class="review-author-info">
                <strong>Rohan Verma</strong>
                <span>CS Engineering Student, Delhi</span>
              </div>
            </div>

            <div class="review-glass-card">
              <div class="review-top-row">
                <span class="badge badge-rating">5.0 ★</span>
                <span class="verified-buyer-text">✓ Verified Buyer</span>
              </div>
              <p class="review-body-text">
                "Clear technical specifications, no fake discount tricks, and express customer support. LapZon is hands-down the best laptop-focused store in India."
              </p>
              <div class="review-author-info">
                <strong>Vikram Patel</strong>
                <span>Tech Lead, Hyderabad</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 6. CLEAN, PROFESSIONAL LAPZON FOOTER -->
      <!-- ================================================================= -->
      <footer class="lapzon-premium-footer">
        <div class="container">
          
          <!-- Top Grid -->
          <div class="footer-columns-grid">
            
            <!-- Brand Column -->
            <div class="footer-brand-col">
              <div class="footer-brand-header">
                <img src="assets/images/lapzon-logo.png" alt="LapZon Official Brand Logo" class="footer-logo-img" />
                <div class="footer-brand-name">
                  <span>Lap<span class="highlight-orange">Z</span>on</span>
                  <small class="footer-tagline">Quality Products, Trusted Service</small>
                </div>
              </div>
              <p class="footer-about-p">
                India's premier dedicated laptop shopping platform. 100% genuine brand warranty, verified stock availability, secure UPI & COD payments, and express courier dispatch.
              </p>
              <div class="footer-support-contact-box">
                <div class="contact-line">
                  <span>📞 Call / WhatsApp:</span>
                  <strong>+91 8123019785</strong>
                </div>
                <div class="contact-line">
                  <span>✉️ Email Support:</span>
                  <a href="mailto:noushamsi09@gmail.com">noushamsi09@gmail.com</a>
                </div>
              </div>
            </div>

            <!-- Categories -->
            <div class="footer-links-col">
              <h4>Popular Categories</h4>
              <ul>
                <li><a href="#store?cat=Gaming">⚡ Gaming Laptops (RTX 40 Series)</a></li>
                <li><a href="#store?cat=Ultrabook">✨ Thin & Light Ultrabooks</a></li>
                <li><a href="#store?cat=Business">💼 Business & AI Workstations</a></li>
                <li><a href="#store?cat=Student">🎓 Student & Coding Laptops</a></li>
                <li><a href="#store">💻 View All 30+ Laptops</a></li>
              </ul>
            </div>

            <!-- Customer Care -->
            <div class="footer-links-col">
              <h4>Customer Support</h4>
              <ul>
                <li><a href="#support">💬 Help Center & Live Tickets</a></li>
                <li><a href="#my-orders">📍 Track Active Order</a></li>
                <li><a href="#legal/return-policy">🔄 7-Day Replacement Guarantee</a></li>
                <li><a href="#legal/shipping-policy">🚚 Express Delivery Information</a></li>
                <li><a href="#legal/warranty">🛡️ Brand Warranty Guide</a></li>
              </ul>
            </div>

            <!-- Trust Highlights -->
            <div class="footer-links-col">
              <h4>LapZon Trust</h4>
              <ul class="trust-list">
                <li>✓ 100% Authentic Brand Laptops</li>
                <li>✓ Sealed Manufacturer Packaging</li>
                <li>✓ Doorstep Cash on Delivery (COD)</li>
                <li>✓ 7-Day Doorstep Replacement</li>
                <li>✓ 256-Bit SSL Encrypted Checkout</li>
              </ul>
            </div>

          </div>

          <!-- Bottom Copyright Bar -->
          <div class="footer-bottom-bar">
            <div class="copyright-text">
              © 2026 LapZon India Pvt. Ltd. All rights reserved. Quality Products, Trusted Service.
            </div>
            <div class="footer-security-badges">
              <span>🔒 256-Bit SSL Encrypted</span>
              <span>⚡ Express Air Delivery Partner</span>
              <span>🛡️ Authorized Brand Retailer</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  `;

  // Attach Event Handlers
  const authCtaBtn = container?.querySelector ? container.querySelector('#hero-btn-auth') : document.getElementById('hero-btn-auth');
  if (authCtaBtn) {
    authCtaBtn.addEventListener('click', () => {
      if (auth.isAuthenticated()) {
        window.location.hash = auth.isAdmin() ? '#admin' : '#user-dashboard';
      } else {
        openAuthModal('login', { redirectHash: '#user-dashboard' });
      }
    });
  }

  // Load and render Featured Products in the grid
  loadFeaturedProducts(container);
}

async function loadFeaturedProducts(container) {
  const grid = container?.querySelector ? container.querySelector('#welcome-featured-products-grid') : document.getElementById('welcome-featured-products-grid');
  if (!grid) return;

  try {
    const res = await api.getProducts();
    const products = (res.products || res || []).slice(0, 8); // Top 8 featured laptops

    if (!products.length) {
      grid.innerHTML = `<p style="text-align: center; color: #64748b; grid-column: 1/-1;">No laptops available at the moment.</p>`;
      return;
    }

    grid.innerHTML = products.map(p => {
      const discountPct = p.originalPrice > p.price 
        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
        : 18;
      const originalPrice = p.originalPrice || Math.round(p.price * 1.22);
      const isWishlisted = state.getWishlist().includes(p.id);

      return `
        <div class="product-modern-card" data-id="${p.id}" style="position: relative;">
          <!-- Wishlist Button -->
          <button 
            type="button" 
            class="welcome-wishlist-btn ${isWishlisted ? 'active' : ''}" 
            data-id="${p.id}"
            title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
            style="position: absolute; top: 12px; right: 12px; z-index: 5; background: #ffffff; border: 1.5px solid #e2e8f0; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.08); transition: transform 0.2s ease;"
          >
            ${isWishlisted ? '❤️' : '🤍'}
          </button>

          <!-- Top Badge -->
          <span class="card-badge-top">⭐ ${p.brand}</span>

          <!-- Laptop Image -->
          <a href="#product/${p.id}" class="card-image-wrap">
            <img 
              src="${p.image}" 
              alt="${p.name}" 
              class="card-laptop-img" 
              loading="lazy" 
            />
          </a>

          <!-- Details -->
          <div class="card-info-wrap">
            <div class="card-rating-row">
              <span class="rating-pill">${p.rating || 4.8} ★</span>
              <span class="reviews-count">(${p.reviewsCount || p.reviews?.length || 42} reviews)</span>
              <span class="stock-status-pill">In Stock</span>
            </div>

            <a href="#product/${p.id}" class="card-title-link">
              <h3 class="card-laptop-title" title="${p.name}">${p.name}</h3>
            </a>

            <!-- Key Specs Chips -->
            <div class="card-specs-chips">
              <span class="spec-chip">${p.ram || '16GB RAM'}</span>
              <span class="spec-chip">${p.storage || '512GB SSD'}</span>
              <span class="spec-chip">${p.processor ? p.processor.split(' ')[0] : 'Intel/M-Series'}</span>
            </div>

            <!-- Pricing Row -->
            <div class="card-pricing-row">
              <div class="price-stack">
                <span class="price-current">₹${p.price.toLocaleString('en-IN')}</span>
                <span class="price-original">₹${originalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="card-actions-row">
              <button type="button" class="btn-card-cart btn-add-cart-action" data-id="${p.id}">
                🛒 Add to Cart
              </button>
              <button type="button" class="btn-card-buy btn-buy-now-action" data-id="${p.id}">
                ⚡ Buy Now
              </button>
            </div>

          </div>
        </div>
      `;
    }).join('');

    // Attach Add to Cart and Buy Now button listeners
    grid.querySelectorAll('.btn-add-cart-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pId = btn.dataset.id;
        const prod = products.find(item => item.id === pId);
        if (prod) {
          state.addToCart(prod.id, 1, prod);
          showToast(`Added ${prod.name} to your Cart 🛒`, 'success');
        }
      });
    });

    grid.querySelectorAll('.btn-buy-now-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pId = btn.dataset.id;
        const prod = products.find(item => item.id === pId);
        if (prod) {
          state.addToCart(prod.id, 1, prod);
          if (!auth.isAuthenticated()) {
            openAuthModal('login', {
              action: 'buy_now',
              productId: prod.id,
              productData: prod,
              returnHash: '#welcome',
              redirectHash: '#checkout-address',
              subtitle: 'Please sign in or create an account to proceed with your laptop order'
            });
          } else {
            window.location.hash = '#checkout-address';
          }
        }
      });
    });

    // Attach Wishlist toggle listeners
    grid.querySelectorAll('.welcome-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pId = btn.dataset.id;
        const prod = products.find(item => item.id === pId);
        const added = state.toggleWishlist(pId);
        api.toggleWishlist(pId).catch(() => {});
        showToast(added ? `Added "${prod?.name || 'Laptop'}" to Wishlist! ❤️` : `Removed from Wishlist.`, 'info');
        btn.innerHTML = added ? '❤️' : '🤍';
        btn.title = added ? 'Remove from Wishlist' : 'Add to Wishlist';
      });
    });

    // Refresh scroll reveals
    trigger3DRefresh();

  } catch (err) {
    console.error('Error loading featured products:', err);
    grid.innerHTML = `<p style="text-align: center; color: #ef4444; grid-column: 1/-1;">Could not load featured laptops.</p>`;
  }
}
