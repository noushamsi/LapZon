/**
 * Interactive Review & Rating Modal Component - LapZon
 * Replaces browser prompt() dialog with a modern 5-star interactive review submission modal.
 */

import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { showToast } from '../app.js';

export function openReviewModal({ productId, productName, onSuccess }) {
  const modalId = 'lapzon-review-modal';
  let existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const user = auth.getUser();
  let selectedRating = 5;

  const ratingDescriptions = {
    1: '1.0 - Poor / Unsatisfactory ⚠️',
    2: '2.0 - Below Average 👎',
    3: '3.0 - Average / Meets Basic Needs 👍',
    4: '4.0 - Very Good / Recommended ⭐',
    5: '5.0 - Outstanding / Highly Recommended! 🔥'
  };

  const modalHtml = `
    <div id="${modalId}" style="position: fixed; inset: 0; background: rgba(15,23,42,0.75); backdrop-filter: blur(5px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem; opacity: 0; transition: opacity 0.2s ease;">
      <div style="background: #ffffff; border-radius: 16px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); overflow: hidden; border: 1px solid #e2e8f0; animation: modalPop 0.25s ease-out;">
        
        <!-- Modal Header -->
        <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fafafa;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.4rem;">⭐</span>
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0;">Rate & Write Review</h3>
              <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">Verified Customer Experience</div>
            </div>
          </div>
          <button type="button" id="btn-close-review-modal" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; padding: 4px 8px;" aria-label="Close">✕</button>
        </div>

        <!-- Modal Body -->
        <div style="padding: 1.5rem;">
          
          <!-- Product Name Banner -->
          <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">💻</span>
            <div>
              <div style="font-size: 0.72rem; font-weight: 800; color: #ea580c; text-transform: uppercase;">Product:</div>
              <div style="font-weight: 800; font-size: 0.88rem; color: #0f172a; line-height: 1.3;">${productName || 'Selected Laptop'}</div>
            </div>
          </div>

          <form id="form-submit-review" style="display: flex; flex-direction: column; gap: 1rem;">
            
            <!-- 5-Star Interactive Rating -->
            <div style="text-align: center; background: #f8fafc; border-radius: 12px; padding: 1rem; border: 1px solid #e2e8f0;">
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #475569; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">
                Select Star Rating
              </label>

              <!-- Star Icons Grid -->
              <div id="star-rating-selector" style="display: inline-flex; gap: 8px; font-size: 2.2rem; cursor: pointer; user-select: none;">
                <span class="review-star" data-val="1" style="color: #f59e0b; transition: transform 0.15s ease;">★</span>
                <span class="review-star" data-val="2" style="color: #f59e0b; transition: transform 0.15s ease;">★</span>
                <span class="review-star" data-val="3" style="color: #f59e0b; transition: transform 0.15s ease;">★</span>
                <span class="review-star" data-val="4" style="color: #f59e0b; transition: transform 0.15s ease;">★</span>
                <span class="review-star" data-val="5" style="color: #f59e0b; transition: transform 0.15s ease;">★</span>
              </div>

              <div id="rating-desc-label" style="font-size: 0.85rem; font-weight: 800; color: #ea580c; margin-top: 0.4rem;">
                ${ratingDescriptions[5]}
              </div>
            </div>

            <!-- Reviewer Name -->
            <div>
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">Your Name <span style="color: #ef4444;">*</span></label>
              <input type="text" id="review-user-name" value="${user?.name || ''}" required placeholder="e.g. Rahul Sharma" style="width: 100%; padding: 0.6rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
            </div>

            <!-- Review Headline / Title -->
            <div>
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">Review Headline <span style="color: #ef4444;">*</span></label>
              <input type="text" id="review-headline" required placeholder="e.g. Incredible gaming performance & sharp display!" style="width: 100%; padding: 0.6rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;" />
            </div>

            <!-- Detailed Feedback -->
            <div>
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">Detailed Review <span style="color: #ef4444;">*</span></label>
              <textarea id="review-comment" required rows="3" placeholder="Share details about performance, build quality, thermals, battery life, or delivery experience..." style="width: 100%; padding: 0.6rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
            </div>

            <!-- Verified Buyer Pill -->
            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: #16a34a; font-weight: 700; background: #f0fdf4; padding: 0.45rem 0.75rem; border-radius: 6px; border: 1px solid #bbf7d0;">
              <span>✓ Verified Buyer Review</span>
              <span style="color: #64748b; font-weight: 400; margin-left: auto;">Displayed publicly on product page</span>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
              <button type="button" id="btn-cancel-review" class="btn btn-outline" style="flex: 1; font-weight: 700;">
                Cancel
              </button>
              <button type="submit" id="btn-submit-review-action" class="btn btn-primary" style="flex: 2; font-weight: 800; background: #ff6b00; border: none; border-radius: 8px; padding: 0.7rem; color: #fff; box-shadow: 0 4px 12px rgba(255,107,0,0.25); cursor: pointer;">
                ⭐ Submit Review
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById(modalId);

  setTimeout(() => {
    if (modalEl) modalEl.style.opacity = '1';
  }, 10);

  const closeModal = () => {
    if (modalEl) {
      modalEl.style.opacity = '0';
      setTimeout(() => modalEl.remove(), 200);
    }
  };

  document.getElementById('btn-close-review-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-review')?.addEventListener('click', closeModal);

  // Star Rating Interactive Handlers
  const starContainer = document.getElementById('star-rating-selector');
  const descLabel = document.getElementById('rating-desc-label');
  const stars = starContainer?.querySelectorAll('.review-star') || [];

  const updateStarDisplay = (val) => {
    stars.forEach(star => {
      const starVal = parseInt(star.dataset.val, 10);
      if (starVal <= val) {
        star.style.color = '#f59e0b';
        star.textContent = '★';
      } else {
        star.style.color = '#cbd5e1';
        star.textContent = '☆';
      }
    });
    if (descLabel) {
      descLabel.textContent = ratingDescriptions[val] || `${val} Stars`;
    }
  };

  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.val, 10);
      updateStarDisplay(val);
      star.style.transform = 'scale(1.2)';
    });

    star.addEventListener('mouseleave', () => {
      updateStarDisplay(selectedRating);
      star.style.transform = 'scale(1)';
    });

    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.val, 10);
      updateStarDisplay(selectedRating);
    });
  });

  // Submit Handler
  const form = document.getElementById('form-submit-review');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userName = document.getElementById('review-user-name').value.trim();
      const headline = document.getElementById('review-headline').value.trim();
      const comment = document.getElementById('review-comment').value.trim();
      const submitBtn = document.getElementById('btn-submit-review-action');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      try {
        const res = await api.submitReview({
          productId,
          userName: userName || user?.name || 'Verified Buyer',
          rating: selectedRating,
          title: headline,
          comment
        });

        showToast(res.message || '⭐ Review submitted successfully! Thank you.', 'success');
        closeModal();
        if (onSuccess) onSuccess();
      } catch (err) {
        showToast(err.message || 'Failed to submit review.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '⭐ Submit Review';
        }
      }
    });
  }
}
