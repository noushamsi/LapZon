/**
 * Welcome Page Component
 * Professional laptop-themed hero, category highlights, trust factors & Get Started CTA
 */

export function renderWelcomePage(container) {
  container.innerHTML = `
    <div class="welcome-page">
      <!-- Hero Section -->
      <section class="welcome-hero">
        <div class="container">
          <div class="hero-grid">
            <div class="hero-content">
              <div class="hero-badge-pill">
                <span class="pulse-dot"></span>
                <span>India's Dedicated Laptop Superstore</span>
              </div>
              
              <h1 class="hero-title">
                Find Your Ultimate <br/>
                <span class="gradient-text">Dream Machine</span>
              </h1>
              
              <p class="hero-desc">
                From ultra-portable AI workhorses to brutal high-FPS gaming rigs. 
                Experience Flipkart-grade authentic warranty, zero-cost EMI, and instant dispatch on top global laptop brands.
              </p>
              
              <div class="hero-cta-group">
                <a href="#store" class="btn-get-started" id="welcome-get-started-btn">
                  <span>Explore Laptops</span>
                  <span style="font-size: 1.25rem;">➔</span>
                </a>
                <a href="#store?cat=Gaming" class="btn-explore-outline" id="welcome-gaming-btn">
                  🎮 Gaming Beasts
                </a>
              </div>
              
              <div class="hero-stats">
                <div class="hero-stat-item">
                  <span class="stat-number">100%</span>
                  <span class="stat-label">Original & Assured</span>
                </div>
                <div class="hero-stat-item">
                  <span class="stat-number">24 Hr</span>
                  <span class="stat-label">Express Dispatch</span>
                </div>
                <div class="hero-stat-item">
                  <span class="stat-number">₹0 EMI</span>
                  <span class="stat-label">Up to 24 Months</span>
                </div>
              </div>
            </div>

            <!-- Visual Showcase -->
            <div class="hero-visual-wrap">
              <div class="hero-laptop-card">
                <div class="floating-badge badge-top-left">
                  <span>⚡ Apple M3 Pro 14"</span>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80" 
                  alt="Flagship Laptop Showcase" 
                  class="hero-laptop-img"
                />
                <div class="floating-badge badge-bottom-right">
                  <span>🔥 RTX 4090 Monster Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Trust Strip -->
      <section class="welcome-trust-strip">
        <div class="container">
          <div class="trust-grid">
            <div class="trust-card">
              <div class="trust-icon">🛡️</div>
              <div class="trust-info">
                <h5>Brand Assured</h5>
                <p>100% Genuine with Official Warranty</p>
              </div>
            </div>
            <div class="trust-card">
              <div class="trust-icon">⚡</div>
              <div class="trust-info">
                <h5>Fast Delivery</h5>
                <p>Doorstep Express Shipping</p>
              </div>
            </div>
            <div class="trust-card">
              <div class="trust-icon">💳</div>
              <div class="trust-info">
                <h5>Safe UPI & COD</h5>
                <p>GPay, PhonePe & Cash on Delivery</p>
              </div>
            </div>
            <div class="trust-card">
              <div class="trust-icon">🔄</div>
              <div class="trust-info">
                <h5>7-Day Replacement</h5>
                <p>Hassle-free return policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Categories Highlights -->
      <section class="welcome-categories">
        <div class="container">
          <div class="section-header-center">
            <h2>Shop By Your Purpose</h2>
            <p>Tailored laptop configurations engineered for your exact workload</p>
          </div>

          <div class="category-cards-grid">
            <a href="#store?cat=Gaming" class="cat-card">
              <div class="cat-card-icon">🎮</div>
              <h4>Gaming Laptops</h4>
              <p>High refresh rate QHD screens, RTX 40-series GPUs, liquid cooling</p>
              <span class="cat-card-cta">View Gaming Rigs →</span>
            </a>

            <a href="#store?cat=Ultrabook" class="cat-card">
              <div class="cat-card-icon">🪶</div>
              <h4>Thin & Light Ultrabooks</h4>
              <p>All-day 18hr battery life, featherlight chassis, stunning OLEDs</p>
              <span class="cat-card-cta">Explore Ultrabooks →</span>
            </a>

            <a href="#store?cat=Business" class="cat-card">
              <div class="cat-card-icon">💼</div>
              <h4>Business & AI Power</h4>
              <p>Intel Core Ultra with NPU, fingerprint security, 2-in-1 AMOLED</p>
              <span class="cat-card-cta">View Business →</span>
            </a>

            <a href="#store?cat=Student" class="cat-card">
              <div class="cat-card-icon">🎓</div>
              <h4>Student & Everyday</h4>
              <p>Budget-friendly champions with fast SSDs, MS Office & sturdy build</p>
              <span class="cat-card-cta">Explore Student Deals →</span>
            </a>
          </div>

          <!-- Featured Offer Banner -->
          <div class="welcome-deals-banner">
            <div class="deals-banner-content">
              <h3>Mega Laptop Fest is Live!</h3>
              <p>Save up to ₹40,000 + Extra ₹5,000 instant discount using promo code <strong>LAPTOP5000</strong> at checkout.</p>
              <a href="#store" class="btn btn-orange btn-lg">Shop The Sale Now</a>
            </div>
            <div style="font-size: 5rem; line-height: 1;">
              💻🏷️
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}
