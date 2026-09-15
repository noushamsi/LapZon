/**
 * LapZon Toast & Notification Service
 * High-performance, zero-dependency notification engine.
 */

export function showToast(message, type = 'success', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '✕';

  toast.innerHTML = `
    <span style="font-weight: 800; font-size: 1.15rem; line-height: 1;">${icon}</span>
    <span style="line-height: 1.4;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastFadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Consistent Professional Authentication Notification (1.5 - 2.0s duration, auto disappears)
export function showAuthSuccessNotification(isReturning = false, callback = null) {
  const message = 'Login successful! Welcome to LapZon.';
  showToast(message, 'success', 1800);
  if (typeof callback === 'function') {
    setTimeout(callback, 1800);
  }
}
