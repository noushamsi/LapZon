/**
 * Customer Wishlist Component
 */

import { renderUserDashboard } from './userDashboard.js';

export async function renderWishlist(container) {
  window.location.hash = '#user-dashboard?tab=wishlist';
  return renderUserDashboard(container);
}
