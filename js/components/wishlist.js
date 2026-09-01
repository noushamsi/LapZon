/**
 * Customer Wishlist Component
 * Renders Saved Wishlist directly within the User Dashboard framework
 * without mutating hash or injecting intermediate history entries.
 */

import { renderUserDashboard } from './userDashboard.js';

export async function renderWishlist(container) {
  return renderUserDashboard(container, 'wishlist');
}
