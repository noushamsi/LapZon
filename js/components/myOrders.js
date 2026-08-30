/**
 * My Orders Component (Seamless User Dashboard Integration)
 */

import { renderUserDashboard } from './userDashboard.js';

export async function renderMyOrders(container) {
  return renderUserDashboard(container);
}
