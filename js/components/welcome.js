/**
 * Welcome Page Component
 * Professional laptop landing page with Hero, Featured Brands, Top Deals,
 * Why Choose Us, Verified Customer Reviews, and Comprehensive Footer.
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
                <span>India's Premier Dedicated Laptop Superstore</span>
              </div>
              
              <h1 class="hero-title">
                Find Your Ultimate <br/>
                <span class="gradient-text">Dream Laptop</span>
              </h1>
              
              <p class="hero-desc">
                From ultra-portable Apple MacBooks and AI workhorses to high-FPS ASUS ROG gaming rigs.
                Enjoy authentic 1-year brand warranty, doorstep Cash on Delivery, and instant air dispatch across India.
              </p>
              
              <div class="hero-cta-group" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <a href="#store" class="btn-get-started" id="welcome-get-started-btn">
                  <span>⚡ Get Started</span>
                  <span style="font-size: 1.25rem;">➔</span>
                </a>
                <a href="#store" class="btn-explore-outline" id="welcome-explore-laptops-btn" style="background: rgba(255,255,255,0.08); border: 2px solid var(--primary-yellow); color: #fff; padding: 0.8rem 1.75rem; border-radius: 8px; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                  💻 Explore Laptops
                </a>
              </div>
              
              <div class="hero-stats">
                <div class="hero-stat-item">
                  <span class="stat-number">100%</span>
                  <span class="stat-label">Original & Genuine</span>
                </div>
                <div class="hero-stat-item">
                  <span class="stat-number">24 Hr</span>
                  <span class="stat-label">Express Air Dispatch</span>
                </div>
                <div class="hero-stat-item">
                  <span class="stat-number">COD</span>
                  <span class="stat-label">Cash on Delivery</span>
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
                  <span>🔥 NVIDIA RTX 4090 Monster Ready</span>
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
                <h5>100% Brand Assured</h5>
                <p>1-Year Official Manufacturer Warranty</p>
              </div>
            </div>
            <div class="trust-card">
              <div class="trust-icon">⚡</div>
              <div class="trust-info">
                <h5>Express Air Delivery</h5>
                <p>19,000+ PIN Codes Across India</p>
              </div>
            </div>
            <div class="trust-card">
              <div class="trust-icon">💵</div>
              <div class="trust-info">
                <h5>Cash on Delivery (COD)</h5>
                <p>Inspect Outer Sealed Box Before Paying</p>
              </div>
            </div>
            <div class="trust-card">
              <div class="trust-icon">🔄</div>
              <div class="trust-info">
                <h5>7-Day Replacement</h5>
                <p>Hassle-Free Doorstep Exchange</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Top Brands Strip -->
      <section style="padding: 2.5rem 0; background: #ffffff; border-bottom: 1px solid #e2e8f0;">
        <div class="container" style="text-align: center;">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem;">
            Featured Official Brand Partners
          </h3>
          <div style="display: flex; justify-content: center; align-items: center; gap: 2rem; flex-wrap: wrap;">
            ${['Apple', 'ASUS', 'Dell', 'HP', 'Lenovo', 'Acer', 'MSI', 'Samsung'].map(brand => `
              <a href="#store" class="brand-chip" style="padding: 0.6rem 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 800; font-size: 1.1rem; color: #1e293b; text-decoration: none; transition: transform 0.2s ease, box-shadow 0.2s ease;">
                ${brand}
              </a>
            `).join('')}
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

      <!-- Customer Reviews & Social Proof -->
      <section style="padding: 4rem 0; background: #ffffff;">
        <div class="container">
          <div class="section-header-center">
            <h2>Trusted by 100,000+ Laptop Enthusiasts</h2>
            <p>Read real verified buyer experiences across India</p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
            
            <div style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span class="badge badge-rating">5.0 ★</span>
                <span style="font-size: 0.75rem; color: #16a34a; font-weight: 700;">Verified Buyer ✓</span>
              </div>
              <p style="font-size: 0.9rem; color: #334155; line-height: 1.5; margin: 0 0 1rem;">
                "Got my MacBook Pro M3 delivered within 24 hours in Bengaluru. The tamper-evident packaging gave total peace of mind for Cash on Delivery!"
              </p>
              <div style="font-weight: 800; font-size: 0.88rem; color: #0f172a;">— Rahul M., Software Engineer</div>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span class="badge badge-rating">5.0 ★</span>
                <span style="font-size: 0.75rem; color: #16a34a; font-weight: 700;">Verified Buyer ✓</span>
              </div>
              <p style="font-size: 0.9rem; color: #334155; line-height: 1.5; margin: 0 0 1rem;">
                "Shared my referral link with college friends and unlocked the 30% discount coupon. Saved over ₹22,000 on my ASUS ROG Strix gaming laptop!"
              </p>
              <div style="font-weight: 800; font-size: 0.88rem; color: #0f172a;">— Sneha R., Design Student</div>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span class="badge badge-rating">5.0 ★</span>
                <span style="font-size: 0.75rem; color: #16a34a; font-weight: 700;">Verified Buyer ✓</span>
              </div>
              <p style="font-size: 0.9rem; color: #334155; line-height: 1.5; margin: 0 0 1rem;">
                "Clean store interface, no spam or non-laptop items. Detailed technical specs and fast live tracking made the purchase super seamless."
              </p>
              <div style="font-weight: 800; font-size: 0.88rem; color: #0f172a;">— Amit V., Tech Lead</div>
            </div>

          </div>
        </div>
      </section>

      <!-- Comprehensive Footer -->
      <footer style="background: #0f172a; color: #94a3b8; padding: 4rem 0 2rem; border-top: 1px solid #1e293b;">
        <div class="container">
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 2.5rem; margin-bottom: 3rem;">
            
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 1rem;">
                <span style="font-size: 1.8rem;">⚡</span>
                <span style="font-size: 1.5rem; font-weight: 900; color: #fff;">LapKart <span style="color: #ff9f00;">Plus</span></span>
              </div>
              <p style="font-size: 0.88rem; line-height: 1.6; color: #94a3b8; max-width: 320px;">
                India's premier dedicated laptop superstore. 100% authentic global laptops, doorstep Cash on Delivery, and express air fulfillment.
              </p>
              <div style="margin-top: 1rem; font-size: 0.85rem; color: #cbd5e1;">
                📍 Tech Park Towers, 100 Feet Rd, Indiranagar, Bengaluru - 560038
              </div>
            </div>

            <div>
              <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; text-transform: uppercase; margin-bottom: 1rem;">Laptop Catalog</h4>
              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem;">
                <li><a href="#store?cat=Gaming" style="color: #94a3b8; text-decoration: none;">Gaming Laptops</a></li>
                <li><a href="#store?cat=Ultrabook" style="color: #94a3b8; text-decoration: none;">Thin & Light Ultrabooks</a></li>
                <li><a href="#store?cat=Business" style="color: #94a3b8; text-decoration: none;">Business & AI Laptops</a></li>
                <li><a href="#store?cat=Student" style="color: #94a3b8; text-decoration: none;">Student & Everyday</a></li>
                <li><a href="#store" style="color: #94a3b8; text-decoration: none;">All Laptops</a></li>
              </ul>
            </div>

            <div>
              <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; text-transform: uppercase; margin-bottom: 1rem;">Help & Support</h4>
              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem;">
                <li><a href="#support" style="color: #94a3b8; text-decoration: none;">Help Center & FAQ</a></li>
                <li><a href="#my-orders" style="color: #94a3b8; text-decoration: none;">Track Active Order</a></li>
                <li><a href="#legal/shipping-policy" style="color: #94a3b8; text-decoration: none;">Shipping Policy</a></li>
                <li><a href="#legal/return-policy" style="color: #94a3b8; text-decoration: none;">7-Day Replacement Policy</a></li>
                <li><a href="#legal/warranty" style="color: #94a3b8; text-decoration: none;">1-Year Warranty Details</a></li>
              </ul>
            </div>

            <div>
              <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; text-transform: uppercase; margin-bottom: 1rem;">Company & Legal</h4>
              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem;">
                <li><a href="#legal/about" style="color: #94a3b8; text-decoration: none;">About LapKart Plus</a></li>
                <li><a href="#legal/contact" style="color: #94a3b8; text-decoration: none;">Contact Specialists</a></li>
                <li><a href="#legal/privacy-policy" style="color: #94a3b8; text-decoration: none;">Privacy Policy</a></li>
                <li><a href="#legal/terms" style="color: #94a3b8; text-decoration: none;">Terms & Conditions</a></li>
                <li><a href="#admin-login" style="color: #64748b; font-size: 0.75rem; text-decoration: none;">Store Administrator</a></li>
              </ul>
            </div>

          </div>

          <div style="border-top: 1px solid #1e293b; padding-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; font-size: 0.8rem;">
            <div>
              © 2026 LapKart Plus Technologies Pvt. Ltd. All rights reserved. Sells ONLY laptops with 100% genuine warranty.
            </div>
            <div style="display: flex; gap: 1.5rem;">
              <span>🛡️ 100% Authentic Devices</span>
              <span>💵 Doorstep COD</span>
              <span>🔒 256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `;
}
