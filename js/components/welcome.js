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
  const isAuth = auth.isAuthenticated();

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
                Explore Premium Used Laptops <br/>
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
                ${!isAuth ? `
                  <button type="button" class="btn-hero-secondary" id="hero-btn-auth">
                    <span>🔑 Sign In</span>
                  </button>
                ` : ''}
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

  // Dynamic Hero Auth Button management (reactive to login / account creation / logout)
  const updateHeroAuthButton = () => {
    const authenticated = auth.isAuthenticated();
    const heroBtnActions = container?.querySelector ? container.querySelector('.hero-btn-actions') : document.querySelector('.hero-btn-actions');
    const existingAuthBtn = container?.querySelector ? container.querySelector('#hero-btn-auth') : document.getElementById('hero-btn-auth');

    if (authenticated) {
      if (existingAuthBtn) existingAuthBtn.remove();
    } else {
      if (!existingAuthBtn && heroBtnActions) {
        const newBtn = document.createElement('button');
        newBtn.type = 'button';
        newBtn.className = 'btn-hero-secondary';
        newBtn.id = 'hero-btn-auth';
        newBtn.innerHTML = '<span>🔑 Sign In</span>';
        newBtn.addEventListener('click', () => {
          openAuthModal('login', { redirectHash: '#welcome' });
        });
        heroBtnActions.appendChild(newBtn);
      }
    }
  };

  const authCtaBtn = container?.querySelector ? container.querySelector('#hero-btn-auth') : document.getElementById('hero-btn-auth');
  if (authCtaBtn) {
    authCtaBtn.addEventListener('click', () => {
      openAuthModal('login', { redirectHash: '#welcome' });
    });
  }

  // Once user clicks "⚡ Explore Laptops", if not signed in, prompt sign in modal
  const exploreCtaBtn = container?.querySelector ? container.querySelector('#hero-btn-explore') : document.getElementById('hero-btn-explore');
  if (exploreCtaBtn) {
    exploreCtaBtn.addEventListener('click', (e) => {
      if (!auth.isAuthenticated()) {
        e.preventDefault();
        showToast('Please sign in to explore laptops 💻', 'info');
        openAuthModal('login', {
          returnHash: '#store',
          redirectHash: '#store',
          subtitle: 'Please sign in or create an account to explore our laptop collection'
        });
      }
    });
  }

  // Handle "View All Laptops ➔" link
  const viewAllBtn = container?.querySelector ? container.querySelector('.featured-laptops-section a[href="#store"]') : null;
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', (e) => {
      if (!auth.isAuthenticated()) {
        e.preventDefault();
        showToast('Please sign in to explore laptops 💻', 'info');
        openAuthModal('login', {
          returnHash: '#store',
          redirectHash: '#store',
          subtitle: 'Please sign in or create an account to explore our laptop collection'
        });
      }
    });
  }

  // Handle brand strip cards
  const brandCards = container?.querySelectorAll ? container.querySelectorAll('.brands-clean-grid a') : [];
  brandCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (!auth.isAuthenticated()) {
        e.preventDefault();
        const targetHash = card.getAttribute('href') || '#store';
        showToast('Please sign in to explore laptops 💻', 'info');
        openAuthModal('login', {
          returnHash: targetHash,
          redirectHash: targetHash,
          subtitle: 'Please sign in or create an account to explore our laptop collection'
        });
      }
    });
  });

  // Subscribe so when login or logout occurs, the hero button updates dynamically
  auth.subscribe(updateHeroAuthButton);

  // Re-render featured laptops when customer market / region changes
  window.addEventListener('lapkart:region-changed', () => {
    loadFeaturedProducts(container);
  });

  // Load and render Featured Products in the grid
  loadFeaturedProducts(container);
}

function formatAmazonStars(rating) {
  const r = Math.round(Number(rating) || 4.5);
  return '★'.repeat(Math.min(5, Math.max(1, r))) + '☆'.repeat(Math.max(0, 5 - Math.min(5, Math.max(1, r))));
}

function getAmazonDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

async function loadFeaturedProducts(container) {
  const grid = container?.querySelector ? container.querySelector('#welcome-featured-products-grid') : document.getElementById('welcome-featured-products-grid');
  if (!grid) return;

  try {
    const activeMarket = state.getActiveMarket();
    const res = await api.getProducts({ market: activeMarket });
    const rawProducts = res.products || res || [];
    const products = state.filterProductsByMarket(rawProducts, activeMarket).slice(0, 8); // Top 8 featured laptops for this market

    if (!products.length) {
      grid.innerHTML = `<p style="text-align: center; color: #64748b; grid-column: 1/-1;">No laptops available at the moment.</p>`;
      return;
    }

    const deliveryDateStr = getAmazonDeliveryDate();

    grid.innerHTML = products.map(p => {
      const discountPct = p.originalPrice > p.price
        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
        : (p.discount || 14);
      const originalPrice = p.originalPrice || Math.round(p.price * 1.18);
      const isWishlisted = state.getWishlist().includes(p.id);
      const bankOffer = activeMarket === 'UAE' 
        ? 'Flat AED 200 Off on Select Bank Cards' 
        : 'Flat INR 10000 Off on SBI Cards';

      return `
        <div class="product-amazon-card" data-id="${p.id}">
          <!-- Wishlist Button -->
          <button 
            type="button" 
            class="welcome-wishlist-btn ${isWishlisted ? 'active' : ''}" 
            data-id="${p.id}"
            title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
          >
            ${isWishlisted ? '❤️' : '🤍'}
          </button>

          <!-- Laptop Image -->
          <a href="#product/${p.id}" class="card-amazon-img-wrap">
            <img 
              src="${p.image}" 
              alt="${p.name}" 
              class="card-amazon-img" 
              loading="lazy" 
            />
          </a>

          <!-- Details -->
          <div class="card-amazon-info">
            <a href="#product/${p.id}" class="card-amazon-title-link">
              <h3 class="card-amazon-title" title="${p.name}">${p.name}</h3>
            </a>

            <!-- Rating Row -->
            <div class="card-amazon-rating-row">
              <span class="amazon-rating-num">${p.rating || 4.8}</span>
              <span class="amazon-stars">${formatAmazonStars(p.rating || 4.8)}</span>
              <span class="amazon-rating-count">(${p.reviewsCount || p.reviews?.length || 73})</span>
            </div>
            <div class="card-amazon-bought">${p.boughtCount || '50+'} bought in past month</div>

            <!-- Price Block -->
            <div class="card-amazon-price-block">
              <div class="card-amazon-main-price">${state.formatPrice(p.price)}</div>
              <div class="card-amazon-mrp-row">
                M.R.P.: <span class="card-amazon-mrp-val">${state.formatPrice(originalPrice)}</span> 
                <span class="card-amazon-discount">(${discountPct}% off)</span>
              </div>
              <div class="card-amazon-bank-offer">${bankOffer}</div>
            </div>

            <!-- Delivery Info -->
            <div class="card-amazon-delivery">
              FREE delivery <strong>${deliveryDateStr}</strong>
            </div>

            <!-- Add to Cart Action Button -->
            <button type="button" class="btn-amazon-add-cart btn-add-cart-action" data-id="${p.id}">
              Add to cart
            </button>
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
        api.toggleWishlist(pId).catch(() => { });
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
