/**
 * Help Center, FAQs & Support Ticket System
 */

import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { showToast } from '../app.js';

export function renderSupportPage(container) {
  const user = auth.getUser();

  container.innerHTML = `
    <div class="support-page-wrapper" style="background: #f8fafc; min-height: 80vh; padding: 2.5rem 0 4rem;">
      <div class="container" style="max-width: 1000px;">
        
        <!-- Hero Banner -->
        <div style="background: linear-gradient(135deg, #1e40af, #2563eb); border-radius: 16px; padding: 2.5rem 2rem; color: #fff; text-align: center; margin-bottom: 2.5rem; box-shadow: 0 10px 25px rgba(37,99,235,0.2);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎧 💬</div>
          <h1 style="font-size: 2rem; font-weight: 900; margin: 0 0 0.5rem;">LapKart 24x7 Help Center</h1>
          <p style="font-size: 0.95rem; opacity: 0.9; max-width: 600px; margin: 0 auto;">
            We're here to assist you with order delivery, Cash on Delivery payments, 7-day replacements, technical specs, and 30% referral reward milestones.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
          
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
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem;">
              Submit an Inquiry
            </h3>
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.5rem;">
              Our dedicated laptop specialists respond within 24 business hours.
            </p>

            <form id="form-support-ticket">
              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Your Name <span style="color: #ef4444;">*</span></label>
                <input type="text" id="ticket-name" value="${user?.name || ''}" required placeholder="Full Name" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
              </div>

              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Email Address <span style="color: #ef4444;">*</span></label>
                <input type="email" id="ticket-email" value="${user?.email || ''}" required placeholder="name@example.com" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
              </div>

              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Mobile Number</label>
                <input type="tel" id="ticket-phone" value="${user?.phone || ''}" placeholder="10-digit mobile number" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
              </div>

              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Order ID (If applicable)</label>
                <input type="text" id="ticket-orderid" placeholder="e.g. LK-98214" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
              </div>

              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Subject <span style="color: #ef4444;">*</span></label>
                <input type="text" id="ticket-subject" required placeholder="Brief summary of inquiry" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
              </div>

              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Detailed Message <span style="color: #ef4444;">*</span></label>
                <textarea id="ticket-message" required rows="4" placeholder="Describe your question or issue in detail..." style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-family: inherit;"></textarea>
              </div>

              <button type="submit" class="btn btn-primary btn-block btn-lg" style="font-weight: 800;">
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
}
