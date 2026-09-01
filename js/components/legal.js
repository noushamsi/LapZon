/**
 * Legal & Policy Pages Component - LapZon
 * Tagline: "Quality Products, Trusted Service"
 * Covers About Us, Contact Us, Shipping Policy, Return & Refund Policy, Privacy Policy, Terms & Conditions, and Warranty Info.
 */

export function renderLegalPage(container, pageKey = 'about') {
  const pages = {
    'about': {
      title: 'About LapZon',
      subtitle: 'Quality Products, Trusted Service',
      icon: '💻',
      content: `
        <h3>Our Mission</h3>
        <p>
          LapZon was founded with a single, clear purpose: to make buying genuine, high-performance laptops transparent, reliable, and effortless across India. We focus exclusively on computing devices—ensuring deep technical expertise, curated selections from top global manufacturers, and seamless customer service.
        </p>

        <h3>Why Choose LapZon?</h3>
        <ul>
          <li><strong>100% Genuine Brand Authorization:</strong> We source directly from official brand distributors for Apple, ASUS ROG, Dell XPS/Alienware, HP, Lenovo Legion, Acer Predator, MSI, and Samsung.</li>
          <li><strong>Doorstep Cash on Delivery:</strong> Zero advance stress. Pay with cash or UPI directly when your sealed laptop arrives at your doorstep.</li>
          <li><strong>Strict Quality Inspection:</strong> Every shipment is packaged in tamper-evident, anti-static sealed boxes with multi-layer bubble shielding.</li>
          <li><strong>Nationwide Express Logistics:</strong> Fast air dispatch to 19,000+ PIN codes across India via premier logistics partners.</li>
        </ul>
      `
    },
    'contact': {
      title: 'Contact Us',
      subtitle: 'Get in Touch with our Laptop Specialists',
      icon: '📞',
      content: `
        <h3>Corporate & Fulfillment Office</h3>
        <p>
          <strong>LapZon Technologies Pvt. Ltd.</strong><br/>
          Level 4, Tech Park Towers, 100 Feet Road, Indiranagar<br/>
          Bengaluru, Karnataka - 560038, India
        </p>

        <h3>Customer Support & Helpline</h3>
        <ul>
          <li><strong>Direct Phone Helpline:</strong> <a href="tel:8123019785" style="color: var(--primary-orange); font-weight: 700;">8123019785</a> (Mon - Sun, 9:00 AM - 9:00 PM IST)</li>
          <li><strong>Official Enquiry Email:</strong> <a href="mailto:noushamsi09@gmail.com" style="color: var(--primary-orange); font-weight: 700;">noushamsi09@gmail.com</a></li>
          <li><strong>Corporate Partnerships:</strong> partners@lapzon.in</li>
        </ul>

        <h3>Quick Support Ticket</h3>
        <p>
          Need fast assistance regarding an active order or technical guidance? <a href="#support" style="color: var(--primary-orange); font-weight: 700;">Submit a ticket in our Help Center ➔</a>
        </p>
      `
    },
    'shipping-policy': {
      title: 'Shipping & Delivery Policy',
      subtitle: 'Fast, Insured Express Air Logistics Across India',
      icon: '🚚',
      content: `
        <h3>Delivery Timelines</h3>
        <ul>
          <li><strong>Metro Cities (Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Kolkata):</strong> 24 to 48 Hours.</li>
          <li><strong>Tier 2 & Tier 3 Cities:</strong> 2 to 4 Business Days.</li>
          <li><strong>Rest of India & Remote Locations:</strong> 4 to 6 Business Days.</li>
        </ul>

        <h3>Shipping Charges</h3>
        <p>
          We offer <strong>100% FREE Express Shipping</strong> on all laptop orders across India. There are zero hidden packaging or logistics fees.
        </p>

        <h3>Cash on Delivery & Open-Box Verification</h3>
        <p>
          Cash on Delivery orders require OTP verification upon delivery. Customers are encouraged to verify the intact outer seal and tamper-evident packaging before payment.
        </p>
      `
    },
    'return-policy': {
      title: 'Return, Refund & Replacement Policy',
      subtitle: '7-Day Hassle-Free Replacement Guarantee',
      icon: '🔄',
      content: `
        <h3>7-Day Free Replacement Policy</h3>
        <p>
          Every laptop purchased on LapZon is eligible for free 7-day replacement from the date of doorstep delivery if:
        </p>
        <ul>
          <li>The laptop has a manufacturing hardware defect or display anomaly.</li>
          <li>The device arrived physically damaged or with missing accessories.</li>
          <li>The delivered item does not match the specifications ordered.</li>
        </ul>

        <h3>How to Request a Replacement</h3>
        <ol>
          <li>Navigate to your <strong>User Dashboard</strong> under <strong>My Orders</strong>.</li>
          <li>Click the <strong>"🔄 Return / Replace"</strong> button on your delivered order.</li>
          <li>Select the reason and provide a brief description.</li>
          <li>Our support agent will approve the request and schedule a doorstep pickup within 24 hours.</li>
        </ol>
      `
    },
    'privacy-policy': {
      title: 'Privacy Policy',
      subtitle: 'How We Protect Your Personal Information & Data',
      icon: '🔒',
      content: `
        <h3>Information We Collect</h3>
        <p>
          When you register, place an order, or browse LapZon, we collect necessary contact and delivery information (Name, Email, Mobile Number, Shipping Address) strictly to fulfill your order and provide warranty tracking.
        </p>

        <h3>Zero Data Sharing</h3>
        <p>
          We do not sell, rent, or trade your personal information to third-party advertisers. Data is encrypted using industry-standard TLS 1.3 protocols.
        </p>
      `
    },
    'terms': {
      title: 'Terms & Conditions',
      subtitle: 'Standard User Agreement & Store Guidelines',
      icon: '📜',
      content: `
        <h3>User Agreement</h3>
        <p>
          By accessing or making a purchase on LapZon, you agree to comply with our store policies, fair usage guidelines, and applicable consumer laws of the Republic of India.
        </p>

        <h3>Pricing & Stock Availability</h3>
        <p>
          All laptop prices are listed in Indian Rupees (INR) inclusive of applicable GST taxes. We reserve the right to cancel orders in case of unforeseen stock discrepancies, in which case full updates are provided immediately.
        </p>
      `
    },
    'warranty': {
      title: 'Official Manufacturer Warranty',
      subtitle: '1-Year Complete Onsite Warranty & Support Details',
      icon: '🛡️',
      content: `
        <h3>1-Year Onsite Manufacturer Warranty</h3>
        <p>
          All brand-new laptops sold on LapZon carry a minimum of <strong>1 Year Official Brand Warranty</strong> directly honored by authorized service centers of Apple, ASUS, Dell, HP, Lenovo, and Acer across India.
        </p>

        <h3>How to Claim Warranty</h3>
        <ul>
          <li>Locate your purchase invoice generated in <strong>My Orders</strong>.</li>
          <li>Visit the official brand support portal (e.g. support.apple.com, asus.com/in/support, dell.com/support) and enter your laptop's serial number.</li>
          <li>You can also schedule an authorized brand technician home visit at zero additional charge.</li>
        </ul>
      `
    }
  };

  const page = pages[pageKey] || pages['about'];

  container.innerHTML = `
    <div class="legal-page-wrapper fade-in-section" style="background: #f8fafc; min-height: 80vh; padding: 2rem 0 4rem;">
      <div class="container" style="max-width: 900px;">
        
        <!-- Clean Page Back Navigation Button -->
        <div class="page-back-nav-container">
          <button type="button" class="btn-page-back" id="btn-legal-back" title="Back">
            <span class="back-arrow-icon">←</span>
            <span>Back</span>
          </button>
        </div>

        <!-- Document Selection Tabs -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 2rem;">
          ${Object.keys(pages).map(key => `
            <a href="#legal/${key}" class="btn btn-sm ${pageKey === key ? 'btn-primary' : 'btn-outline'}" style="font-weight: 700; border-radius: 20px; padding: 0.4rem 1rem;">
              ${pages[key].title}
            </a>
          `).join('')}
        </div>

        <!-- Document Card -->
        <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 3rem 2.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1.5rem;">
            <div style="font-size: 2.5rem;">${page.icon}</div>
            <div>
              <h1 style="font-size: 1.8rem; font-weight: 900; color: #0f172a; margin: 0 0 0.25rem;">${page.title}</h1>
              <p style="font-size: 0.95rem; color: #64748b; margin: 0;">${page.subtitle}</p>
            </div>
          </div>

          <div class="legal-document-body" style="font-size: 0.95rem; color: #334155; line-height: 1.7;">
            ${page.content}
          </div>

          <div style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <a href="#store" class="btn btn-primary" style="font-weight: 700;">
              🛍️ Explore Laptop Catalog
            </a>
            <a href="#support" class="btn btn-secondary" style="font-weight: 700;">
              🎧 Contact Customer Support
            </a>
          </div>
        </div>

      </div>
    </div>
  `;

  // Back navigation button listener
  const backBtn = container.querySelector('#btn-legal-back');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = '#welcome';
      }
    });
  }
}
