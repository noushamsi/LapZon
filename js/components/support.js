/**
 * Help Center, FAQs & Support Ticket System - LapZon
 * Tagline: "Quality Products, Trusted Service"
 * Direct Support Contacts: 8123019785 • noushamsi09@gmail.com
 */

import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { showToast } from '../app.js';

export function renderSupportPage(container) {
  const user = auth.getUser();

  container.innerHTML = `
    <div class="support-page-wrapper fade-in-section" style="background: #f8fafc; min-height: 80vh; padding: 2rem 0 4rem;">
      <div class="container" style="max-width: 1000px;">
        
        <!-- Clean Page Back Navigation Button -->
        <div class="page-back-nav-container">
          <button type="button" class="btn-page-back" id="btn-support-back" title="Back">
            <span class="back-arrow-icon">←</span>
            <span>Back</span>
          </button>
        </div>

        <!-- Hero Banner -->
        <div style="background: linear-gradient(135deg, #ea580c, #c2410c); border-radius: 16px; padding: 2.5rem 2rem; color: #fff; text-align: center; margin-bottom: 2rem; box-shadow: 0 10px 25px rgba(234,88,12,0.25);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎧 💬</div>
          <h1 style="font-size: 2rem; font-weight: 900; margin: 0 0 0.5rem;">LapZon 24x7 Help Center</h1>
          <p style="font-size: 0.95rem; opacity: 0.95; max-width: 600px; margin: 0 auto; font-weight: 500;">
            Quality Products, Trusted Service. We're here to assist you with order delivery, Cash on Delivery payments, 7-day replacements, technical specs, and 30% referral reward milestones.
          </p>
        </div>

        <!-- Direct Contact Info Banner -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem;">
          <!-- Phone Card -->
          <div style="background: #ffffff; border: 1.5px solid #fed7aa; border-radius: 12px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: #fff7ed; color: #ea580c; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              📞
            </div>
            <div>
              <div style="font-size: 0.78rem; font-weight: 700; color: #9a3412; text-transform: uppercase;">Direct Phone Helpline</div>
              <a href="tel:8123019785" style="font-size: 1.25rem; font-weight: 900; color: #0f172a; text-decoration: none; font-family: monospace;">
                8123019785
              </a>
              <div style="font-size: 0.72rem; color: #64748b;">Mon - Sun (9:00 AM - 9:00 PM IST)</div>
            </div>
          </div>

          <!-- Email Card -->
          <div style="background: #ffffff; border: 1.5px solid #fed7aa; border-radius: 12px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: #fff7ed; color: #ea580c; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              ✉️
            </div>
            <div>
              <div style="font-size: 0.78rem; font-weight: 700; color: #9a3412; text-transform: uppercase;">Official Enquiry Email</div>
              <a href="mailto:noushamsi09@gmail.com" style="font-size: 1rem; font-weight: 800; color: #0f172a; text-decoration: none; word-break: break-all;">
                noushamsi09@gmail.com
              </a>
              <div style="font-size: 0.72rem; color: #64748b;">Guaranteed response within 24 business hours</div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; align-items: start;">
          
          <!-- Column 1: FAQ Accordions -->
          <div style="background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 1.5rem;">
              Frequently Asked Questions
            </h3>

            <div style="display: flex; flex-direction: column; gap: 1rem;">
              
              <div class="faq-item" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem;">
                <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0 0 0.35rem;">
                  💵 How does Cash on Delivery (COD) work?
                </h4>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.4;">
                  You pay zero advance fee. When our courier executive delivers the authentic sealed laptop box to your doorstep, you inspect the box and pay cash or UPI to the delivery executive.
                </p>
              </div>

              <div class="faq-item" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem;">
                <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0 0 0.35rem;">
                  🔄 What is the 7-Day Replacement Policy?
                </h4>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.4;">
                  Every delivered laptop comes with a 7-day hassle-free replacement guarantee for physical defects, display issues, or transit damage directly requestable from your customer dashboard.
                </p>
              </div>

              <div class="faq-item" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem;">
                <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0 0 0.35rem;">
                  🎁 How do I get the 30% Referral Discount?
                </h4>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.4;">
                  Go to your User Dashboard or click "Share & Earn" on any laptop. Share your link with 5 friends. Once 5 new users join, you automatically unlock a single-use 30% OFF coupon code!
                </p>
              </div>

              <div class="faq-item" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem;">
                <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0 0 0.35rem;">
                  🛡️ Are all laptops 100% Genuine with Warranty?
                </h4>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.4;">
                  Yes! All Apple, ASUS, Dell, HP, Lenovo, and Acer laptops carry 1 Year Official Onsite Manufacturer Warranty verifiable via the laptop serial number on the manufacturer website.
                </p>
              </div>

            </div>
          </div>

          <!-- Column 2: Submit Support Ticket Form -->
          <div style="background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
              <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0;">
                Submit Support Ticket
              </h3>
              <span style="background: #fff7ed; color: #ea580c; font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">
                + New Ticket
              </span>
            </div>
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.5rem;">
              Our laptop support specialists respond within 24 business hours.
            </p>

            <form id="form-support-ticket">
              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Your Name <span style="color: #ef4444;">*</span></label>
                <input type="text" id="ticket-name" required placeholder="Enter your full name" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
              </div>

              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Email Address <span style="color: #ef4444;">*</span></label>
                <input type="email" id="ticket-email" required placeholder="e.g. name@example.com" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
              </div>

              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Mobile Number</label>
                <input type="tel" id="ticket-phone" placeholder="e.g. 9876543210" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
              </div>

              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Order ID (If applicable)</label>
                <input type="text" id="ticket-orderid" placeholder="e.g. OD-LK-98214" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
              </div>

              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Subject <span style="color: #ef4444;">*</span></label>
                <input type="text" id="ticket-subject" required placeholder="Brief summary of inquiry" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
              </div>

              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Detailed Message <span style="color: #ef4444;">*</span></label>
                <textarea id="ticket-message" required rows="4" placeholder="Describe your question or issue in detail..." style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-family: inherit;"></textarea>
              </div>

              <button type="submit" class="btn btn-primary btn-block btn-lg" style="font-weight: 800; background: #ff6b00; border: none; border-radius: 8px; padding: 0.75rem;">
                ✉️ Submit Support Inquiry
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  `;

  const form = container.querySelector('#form-support-ticket');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = container.querySelector('#ticket-name').value.trim();
      const email = container.querySelector('#ticket-email').value.trim();
      const phone = container.querySelector('#ticket-phone').value.trim();
      const orderId = container.querySelector('#ticket-orderid').value.trim();
      const subject = container.querySelector('#ticket-subject').value.trim();
      const message = container.querySelector('#ticket-message').value.trim();

      try {
        const res = await api.createSupportTicket({ name, email, phone, orderId, subject, message });
        showToast(res.message || 'Support inquiry submitted successfully! Our team will contact you.', 'success');
        form.reset();
      } catch (err) {
        showToast(err.message || 'Failed to submit support ticket.', 'error');
      }
    });
  }

  // Back navigation button listener
  const backBtn = container.querySelector('#btn-support-back');
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
