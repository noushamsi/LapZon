/**
 * Admin Portal Component - LapZon
 * Secure authentication, registration, password visibility toggle,
 * and multi-step password recovery for store administrators.
 */

import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { showToast } from '../app.js';
import { router } from '../router.js';

const EYE_OPEN_SVG = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const EYE_SLASH_SVG = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

export function renderAdminLogin(container) {
  const target = container || (typeof document !== 'undefined' ? document.getElementById('main-content') : null);
  if (!target) return;

  // If already logged in as Admin, redirect directly to dashboard
  if (auth.isAdmin()) {
    if (window.router) {
      window.router.navigate('#admin');
    } else {
      window.location.hash = '#admin';
    }
    return;
  }

  target.innerHTML = `
    <div class="container" style="padding: 3.5rem 1.25rem 6rem; max-width: 520px;">
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-xl); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #090e17 0%, #1e293b 100%); color: #fff; padding: 2.25rem 2rem 1.75rem; text-align: center;">
          <img src="assets/images/lapzon-logo.png" style="width: 56px; height: 56px; border-radius: 12px; border: 1.5px solid #ff6b00; margin: 0 auto 0.75rem; display: block; box-shadow: 0 4px 14px rgba(255,107,0,0.35);" alt="LapZon Admin" />
          <h2 style="font-family: var(--font-display); font-size: 1.55rem; font-weight: 800; color: #fff; margin: 0;">
            LapZon Admin Portal
          </h2>
          <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 6px;">
            Quality Products, Trusted Service • Management & Security
          </p>

          <!-- Tab Navigation -->
          <div id="admin-nav-tabs-wrap" style="display: flex; gap: 8px; background: rgba(255,255,255,0.08); padding: 4px; border-radius: 10px; margin-top: 1.5rem;">
            <button type="button" id="tab-admin-login" style="flex: 1; padding: 0.6rem 0.75rem; border: none; border-radius: 8px; background: #ff6b00; color: #fff; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.2s;">
              🔐 Admin Login
            </button>
            <button type="button" id="tab-admin-register" style="flex: 1; padding: 0.6rem 0.75rem; border: none; border-radius: 8px; background: transparent; color: #94a3b8; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.2s;">
              📝 Admin Register
            </button>
          </div>
        </div>

        <!-- Form Body -->
        <div style="padding: 2rem;">
          <div id="admin-alert" style="display: none; padding: 0.75rem 1rem; border-radius: var(--radius-xs); font-size: 0.85rem; margin-bottom: 1.25rem;"></div>

          <!-- 1. ADMIN LOGIN FORM -->
          <form id="admin-login-form" novalidate style="display: flex; flex-direction: column; gap: 1.15rem;">
            <div class="form-group">
              <label for="admin-email">Administrator Email <span class="req">*</span></label>
              <input type="email" id="admin-email" placeholder="admin@domain.com" required autocomplete="username" />
            </div>

            <div class="form-group">
              <label for="admin-password">Secure Password <span class="req">*</span></label>
              <div style="position: relative; display: flex; align-items: center; width: 100%;">
                <input 
                  type="password" 
                  id="admin-password" 
                  placeholder="Enter password" 
                  required 
                  autocomplete="current-password"
                  style="width: 100%; padding-right: 2.75rem;" 
                />
                <button 
                  type="button" 
                  id="btn-toggle-admin-pass" 
                  aria-label="Show password" 
                  title="Show password" 
                  tabindex="-1"
                  style="position: absolute; right: 10px; background: transparent; border: none; cursor: pointer; color: #94a3b8; padding: 6px; display: flex; align-items: center; justify-content: center; height: 100%; border-radius: 6px; transition: color 0.2s;"
                >
                  ${EYE_OPEN_SVG}
                </button>
              </div>
            </div>

            <!-- Forgot Password Link -->
            <div style="display: flex; justify-content: flex-end; margin-top: -0.4rem;">
              <a href="javascript:void(0)" id="link-admin-forgot-pass" style="color: #ff6b00; font-size: 0.84rem; font-weight: 600; text-decoration: none; transition: color 0.15s;">
                Forgot Password?
              </a>
            </div>

            <button type="submit" class="btn btn-orange btn-lg btn-block" id="btn-submit-admin-login" style="margin-top: 0.25rem;">
              🔐 Authenticate & Enter Dashboard
            </button>

            <div style="text-align: center; margin-top: 0.5rem; font-size: 0.85rem; color: #64748b;">
              Need an administrator account? 
              <a href="javascript:void(0)" id="link-switch-to-register" style="color: #ff6b00; font-weight: 700; text-decoration: none;">Register Admin</a>
            </div>
          </form>

          <!-- 2. ADMIN REGISTER FORM -->
          <form id="admin-register-form" novalidate style="display: none; flex-direction: column; gap: 1.15rem;">
            <div class="form-group">
              <label for="admin-reg-name">Full Name <span class="req">*</span></label>
              <input type="text" id="admin-reg-name" placeholder="e.g. Store Administrator" required />
            </div>

            <div class="form-group">
              <label for="admin-reg-email">Administrator Email <span class="req">*</span></label>
              <input type="email" id="admin-reg-email" placeholder="admin@domain.com" required />
            </div>

            <div class="form-group">
              <label for="admin-reg-phone">Mobile Number <span class="req">*</span></label>
              <input type="tel" id="admin-reg-phone" placeholder="e.g. 9876543210" required />
            </div>

            <div class="form-group">
              <label for="admin-reg-passcode" style="display: flex; justify-content: space-between; align-items: center;">
                <span>Security Passcode <span class="req">*</span></span>
                <span style="font-size: 0.75rem; color: #ff6b00; font-weight: 600;">Default: LAPZON2026</span>
              </label>
              <input type="password" id="admin-reg-passcode" value="LAPZON2026" placeholder="Enter authorization passcode" required />
            </div>

            <div class="form-group">
              <label for="admin-reg-password">Password <span class="req">*</span></label>
              <div style="position: relative; display: flex; align-items: center; width: 100%;">
                <input 
                  type="password" 
                  id="admin-reg-password" 
                  placeholder="Minimum 6 characters" 
                  required 
                  style="width: 100%; padding-right: 2.75rem;" 
                />
                <button 
                  type="button" 
                  id="btn-toggle-admin-reg-pass" 
                  aria-label="Show password" 
                  title="Show password" 
                  tabindex="-1"
                  style="position: absolute; right: 10px; background: transparent; border: none; cursor: pointer; color: #94a3b8; padding: 6px; display: flex; align-items: center; justify-content: center; height: 100%; border-radius: 6px; transition: color 0.2s;"
                >
                  ${EYE_OPEN_SVG}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="admin-reg-confirm-password">Confirm Password <span class="req">*</span></label>
              <div style="position: relative; display: flex; align-items: center; width: 100%;">
                <input 
                  type="password" 
                  id="admin-reg-confirm-password" 
                  placeholder="Re-enter password" 
                  required 
                  style="width: 100%; padding-right: 2.75rem;" 
                />
                <button 
                  type="button" 
                  id="btn-toggle-admin-reg-confirm-pass" 
                  aria-label="Show password" 
                  title="Show password" 
                  tabindex="-1"
                  style="position: absolute; right: 10px; background: transparent; border: none; cursor: pointer; color: #94a3b8; padding: 6px; display: flex; align-items: center; justify-content: center; height: 100%; border-radius: 6px; transition: color 0.2s;"
                >
                  ${EYE_OPEN_SVG}
                </button>
              </div>
            </div>

            <button type="submit" class="btn btn-orange btn-lg btn-block" id="btn-submit-admin-register" style="margin-top: 0.5rem;">
              📝 Register Administrator Account
            </button>

            <div style="text-align: center; margin-top: 0.5rem; font-size: 0.85rem; color: #64748b;">
              Already registered? 
              <a href="javascript:void(0)" id="link-switch-to-login" style="color: #ff6b00; font-weight: 700; text-decoration: none;">Admin Login</a>
            </div>
          </form>

          <!-- 3. ADMIN FORGOT PASSWORD WORKFLOW -->
          <div id="admin-forgot-wrap" style="display: none; flex-direction: column;">
            
            <!-- STEP 1: Enter Email -->
            <form id="admin-forgot-step1-form" novalidate style="display: flex; flex-direction: column; gap: 1.15rem;">
              <div style="text-align: center; margin-bottom: 0.5rem;">
                <div style="width: 52px; height: 52px; background: #fff7ed; border: 2px solid #ffedd5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px;">
                  🔑
                </div>
                <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0 0 4px;">
                  Forgot Admin Password?
                </h3>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.45;">
                  Enter your administrator email address to receive a secure verification code.
                </p>
              </div>

              <div class="form-group">
                <label for="admin-forgot-email">Administrator Email <span class="req">*</span></label>
                <input type="email" id="admin-forgot-email" placeholder="admin@domain.com" required autocomplete="email" />
              </div>

              <button type="submit" class="btn btn-orange btn-lg btn-block" id="btn-send-admin-reset-code">
                ✉️ Send Verification Code
              </button>

              <div style="text-align: center; margin-top: 0.25rem;">
                <a href="javascript:void(0)" class="link-back-to-admin-login" style="color: #64748b; font-size: 0.85rem; font-weight: 600; text-decoration: none;">
                  ← Back to Admin Login
                </a>
              </div>
            </form>

            <!-- STEP 2: Verify Code -->
            <form id="admin-forgot-step2-form" novalidate style="display: none; flex-direction: column; gap: 1.15rem;">
              <div style="text-align: center; margin-bottom: 0.5rem;">
                <div style="width: 52px; height: 52px; background: #eff6ff; border: 2px solid #dbeafe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px;">
                  ✉️
                </div>
                <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0 0 4px;">
                  Enter Verification Code
                </h3>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.45;">
                  We sent a 6-digit verification code to<br/>
                  <strong id="admin-reset-email-display" style="color: #0f172a; word-break: break-all;"></strong>
                </p>
              </div>

              <div class="form-group">
                <label for="admin-reset-otp" style="display: block; text-align: center; font-weight: 700; color: #1e293b; margin-bottom: 0.35rem;">Enter 6-digit code</label>
                <input 
                  type="text" 
                  id="admin-reset-otp" 
                  maxlength="6" 
                  inputmode="numeric" 
                  pattern="[0-9]*" 
                  placeholder="••••••" 
                  autocomplete="one-time-code" 
                  required 
                  style="width: 100%; padding: 0.75rem 1rem; border: 2px solid #cbd5e1; border-radius: 12px; font-size: 1.65rem; letter-spacing: 10px; text-align: center; color: #0f172a; font-family: 'Courier New', Courier, monospace; outline: none; box-sizing: border-box; background: #f8fafc;" 
                />
              </div>

              <!-- Expiry Timer & Resend Status -->
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; color: #64748b; padding: 0 2px;">
                <span id="admin-reset-timer-wrap">Code expires in <strong id="admin-reset-timer-text" style="color: #ea580c; font-weight: 700;">0:60</strong></span>
                <button type="button" id="btn-resend-admin-reset-otp" disabled style="background: none; border: none; font-size: 0.82rem; font-weight: 700; color: #94a3b8; cursor: not-allowed; padding: 0; transition: color 0.2s;">
                  Resend in 60s
                </button>
              </div>

              <button type="submit" class="btn btn-orange btn-lg btn-block" id="btn-verify-admin-reset-code">
                🔐 Verify Code
              </button>

              <div style="text-align: center; margin-top: 0.25rem;">
                <a href="javascript:void(0)" id="link-admin-change-email" style="color: #64748b; font-size: 0.85rem; font-weight: 600; text-decoration: none;">
                  ← Change Email / Start Over
                </a>
              </div>
            </form>

            <!-- STEP 3: Create New Password -->
            <form id="admin-forgot-step3-form" novalidate style="display: none; flex-direction: column; gap: 1.15rem;">
              <div style="text-align: center; margin-bottom: 0.5rem;">
                <div style="width: 52px; height: 52px; background: #f0fdf4; border: 2px solid #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px;">
                  🔒
                </div>
                <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0 0 4px;">
                  Create New Password
                </h3>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.45;">
                  Enter a strong new password for your administrator account.
                </p>
              </div>

              <div class="form-group">
                <label for="admin-reset-password">New Password <span class="req">*</span></label>
                <div style="position: relative; display: flex; align-items: center; width: 100%;">
                  <input 
                    type="password" 
                    id="admin-reset-password" 
                    placeholder="Minimum 6 characters" 
                    required 
                    autocomplete="new-password"
                    style="width: 100%; padding-right: 2.75rem;" 
                  />
                  <button 
                    type="button" 
                    id="btn-toggle-admin-reset-pass" 
                    aria-label="Show password" 
                    title="Show password" 
                    tabindex="-1"
                    style="position: absolute; right: 10px; background: transparent; border: none; cursor: pointer; color: #94a3b8; padding: 6px; display: flex; align-items: center; justify-content: center; height: 100%; border-radius: 6px; transition: color 0.2s;"
                  >
                    ${EYE_OPEN_SVG}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label for="admin-reset-confirm-password">Confirm New Password <span class="req">*</span></label>
                <div style="position: relative; display: flex; align-items: center; width: 100%;">
                  <input 
                    type="password" 
                    id="admin-reset-confirm-password" 
                    placeholder="Re-enter new password" 
                    required 
                    autocomplete="new-password"
                    style="width: 100%; padding-right: 2.75rem;" 
                  />
                  <button 
                    type="button" 
                    id="btn-toggle-admin-reset-confirm-pass" 
                    aria-label="Show password" 
                    title="Show password" 
                    tabindex="-1"
                    style="position: absolute; right: 10px; background: transparent; border: none; cursor: pointer; color: #94a3b8; padding: 6px; display: flex; align-items: center; justify-content: center; height: 100%; border-radius: 6px; transition: color 0.2s;"
                  >
                    ${EYE_OPEN_SVG}
                  </button>
                </div>
              </div>

              <button type="submit" class="btn btn-orange btn-lg btn-block" id="btn-submit-admin-new-password">
                🔒 Reset Password
              </button>

              <div style="text-align: center; margin-top: 0.25rem;">
                <a href="javascript:void(0)" class="link-back-to-admin-login" style="color: #64748b; font-size: 0.85rem; font-weight: 600; text-decoration: none;">
                  ← Cancel & Return to Login
                </a>
              </div>
            </form>

            <!-- STEP 4: Success Message -->
            <div id="admin-forgot-step4-success" style="display: none; flex-direction: column; text-align: center; gap: 1.25rem; padding: 1rem 0;">
              <div style="width: 64px; height: 64px; background: #f0fdf4; border: 2px solid #86efac; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 30px; color: #16a34a; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.15);">
                ✓
              </div>
              <div>
                <h3 style="font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0 0 6px;">
                  Password Reset Successfully
                </h3>
                <p style="font-size: 0.88rem; color: #64748b; margin: 0; line-height: 1.5;">
                  Your administrator password has been updated securely.<br/>
                  You can now log in to the LapZon Admin Center with your new password.
                </p>
              </div>

              <button type="button" class="btn btn-orange btn-lg btn-block link-back-to-admin-login">
                🔐 Back to Admin Login
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  `;

  attachAdminAuthEvents(target);
}

function attachAdminAuthEvents(container) {
  const tabLogin = container.querySelector('#tab-admin-login');
  const tabRegister = container.querySelector('#tab-admin-register');
  const tabsWrap = container.querySelector('#admin-nav-tabs-wrap');
  const loginForm = container.querySelector('#admin-login-form');
  const registerForm = container.querySelector('#admin-register-form');
  const forgotWrap = container.querySelector('#admin-forgot-wrap');
  const alertBox = container.querySelector('#admin-alert');
  const linkSwitchToRegister = container.querySelector('#link-switch-to-register');
  const linkSwitchToLogin = container.querySelector('#link-switch-to-login');
  const linkAdminForgotPass = container.querySelector('#link-admin-forgot-pass');

  // Forgot Password Steps
  const forgotStep1Form = container.querySelector('#admin-forgot-step1-form');
  const forgotStep2Form = container.querySelector('#admin-forgot-step2-form');
  const forgotStep3Form = container.querySelector('#admin-forgot-step3-form');
  const forgotStep4Success = container.querySelector('#admin-forgot-step4-success');
  const forgotEmailInput = container.querySelector('#admin-forgot-email');
  const forgotEmailDisplay = container.querySelector('#admin-reset-email-display');
  const resetOtpInput = container.querySelector('#admin-reset-otp');
  const resendOtpBtn = container.querySelector('#btn-resend-admin-reset-otp');
  const timerTextEl = container.querySelector('#admin-reset-timer-text');
  const linkChangeEmail = container.querySelector('#link-admin-change-email');
  const resetPassInput = container.querySelector('#admin-reset-password');
  const resetConfirmPassInput = container.querySelector('#admin-reset-confirm-password');

  // State
  let currentResetEmail = '';
  let currentResetToken = '';
  let otpCountdownInterval = null;
  let resendCooldownInterval = null;
  let otpSecondsRemaining = 60;
  let resendSecondsRemaining = 60;

  function showAlert(msg, isError = true) {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.style.display = 'block';
    if (isError) {
      alertBox.style.background = '#fee2e2';
      alertBox.style.border = '1px solid #f87171';
      alertBox.style.color = '#991b1b';
    } else {
      alertBox.style.background = '#f0fdf4';
      alertBox.style.border = '1px solid #86efac';
      alertBox.style.color = '#166534';
    }
  }

  function hideAlert() {
    if (alertBox) alertBox.style.display = 'none';
  }

  function clearTimers() {
    if (otpCountdownInterval) clearInterval(otpCountdownInterval);
    if (resendCooldownInterval) clearInterval(resendCooldownInterval);
    otpCountdownInterval = null;
    resendCooldownInterval = null;
  }

  function setupPasswordToggle(inputEl, btnEl) {
    if (!inputEl || !btnEl) return;
    btnEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isVisible = inputEl.type === 'text';
      inputEl.type = isVisible ? 'password' : 'text';
      btnEl.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
      btnEl.title = isVisible ? 'Show password' : 'Hide password';
      btnEl.innerHTML = isVisible ? EYE_OPEN_SVG : EYE_SLASH_SVG;
      inputEl.focus();
    });
  }

  // Setup password toggles on all password fields
  setupPasswordToggle(container.querySelector('#admin-password'), container.querySelector('#btn-toggle-admin-pass'));
  setupPasswordToggle(container.querySelector('#admin-reg-password'), container.querySelector('#btn-toggle-admin-reg-pass'));
  setupPasswordToggle(container.querySelector('#admin-reg-confirm-password'), container.querySelector('#btn-toggle-admin-reg-confirm-pass'));
  setupPasswordToggle(resetPassInput, container.querySelector('#btn-toggle-admin-reset-pass'));
  setupPasswordToggle(resetConfirmPassInput, container.querySelector('#btn-toggle-admin-reset-confirm-pass'));

  function switchToLogin() {
    hideAlert();
    clearTimers();
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
    forgotWrap.style.display = 'none';
    if (tabsWrap) tabsWrap.style.display = 'flex';
    tabLogin.style.background = '#ff6b00';
    tabLogin.style.color = '#fff';
    tabRegister.style.background = 'transparent';
    tabRegister.style.color = '#94a3b8';
  }

  function switchToRegister() {
    hideAlert();
    clearTimers();
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    forgotWrap.style.display = 'none';
    if (tabsWrap) tabsWrap.style.display = 'flex';
    tabRegister.style.background = '#ff6b00';
    tabRegister.style.color = '#fff';
    tabLogin.style.background = 'transparent';
    tabLogin.style.color = '#94a3b8';
  }

  function switchToForgot() {
    hideAlert();
    clearTimers();
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    forgotWrap.style.display = 'flex';
    if (tabsWrap) tabsWrap.style.display = 'none';

    // Show Step 1 by default
    forgotStep1Form.style.display = 'flex';
    forgotStep2Form.style.display = 'none';
    forgotStep3Form.style.display = 'none';
    forgotStep4Success.style.display = 'none';

    const loginEmailVal = container.querySelector('#admin-email')?.value.trim();
    if (loginEmailVal && forgotEmailInput) {
      forgotEmailInput.value = loginEmailVal;
    }
  }

  tabLogin.addEventListener('click', switchToLogin);
  tabRegister.addEventListener('click', switchToRegister);
  if (linkSwitchToRegister) linkSwitchToRegister.addEventListener('click', switchToRegister);
  if (linkSwitchToLogin) linkSwitchToLogin.addEventListener('click', switchToLogin);
  if (linkAdminForgotPass) linkAdminForgotPass.addEventListener('click', switchToForgot);

  container.querySelectorAll('.link-back-to-admin-login').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchToLogin();
    });
  });

  if (linkChangeEmail) {
    linkChangeEmail.addEventListener('click', (e) => {
      e.preventDefault();
      clearTimers();
      hideAlert();
      forgotStep1Form.style.display = 'flex';
      forgotStep2Form.style.display = 'none';
      forgotStep3Form.style.display = 'none';
      forgotStep4Success.style.display = 'none';
    });
  }

  // --- SUBMIT ADMIN LOGIN ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = container.querySelector('#admin-email').value.trim();
    const password = container.querySelector('#admin-password').value.trim();
    const submitBtn = container.querySelector('#btn-submit-admin-login');

    if (!email || !password) {
      showAlert('Please enter both administrator email and password.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying Credentials...';

    try {
      const res = await api.login(email, password);

      if (res.user.role !== 'admin') {
        showAlert('Access Denied: This account is a regular customer account, not an Administrator.');
        submitBtn.disabled = false;
        submitBtn.textContent = '🔐 Authenticate & Enter Dashboard';
        return;
      }

      auth.setSession(res.token, res.user);
      showToast(`Authentication verified! Welcome Admin, ${res.user.name}.`, 'success');
      if (window.router) {
        window.router.navigate('#admin');
      } else {
        window.location.hash = '#admin';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    } catch (err) {
      showAlert(err.message || 'Login failed. Please check your credentials.');
      submitBtn.disabled = false;
      submitBtn.textContent = '🔐 Authenticate & Enter Dashboard';
    }
  });

  // --- SUBMIT ADMIN REGISTER ---
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const name = container.querySelector('#admin-reg-name').value.trim();
    const email = container.querySelector('#admin-reg-email').value.trim();
    const phone = container.querySelector('#admin-reg-phone').value.trim();
    const passcode = container.querySelector('#admin-reg-passcode').value.trim();
    const password = container.querySelector('#admin-reg-password').value.trim();
    const confirmPassword = container.querySelector('#admin-reg-confirm-password').value.trim();
    const submitBtn = container.querySelector('#btn-submit-admin-register');

    if (!name || !email || !password) {
      showAlert('Please fill in your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match. Please verify.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering Administrator...';

    try {
      const res = await api.registerAdmin({
        name,
        email,
        phone,
        passcode,
        password,
        confirmPassword
      });

      // Automatically sign in the new admin
      auth.setSession(res.token, res.user);
      showToast(`Administrator account created successfully! Welcome, ${res.user.name}.`, 'success');
      if (window.router) {
        window.router.navigate('#admin');
      } else {
        window.location.hash = '#admin';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    } catch (err) {
      showAlert(err.message || 'Registration failed. Please verify information and passcode.');
      submitBtn.disabled = false;
      submitBtn.textContent = '📝 Register Administrator Account';
    }
  });

  // --- FORGOT PASSWORD STEP 1: REQUEST CODE ---
  forgotStep1Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = (forgotEmailInput?.value || '').trim();
    const submitBtn = container.querySelector('#btn-send-admin-reset-code');

    if (!email) {
      showAlert('Please enter your administrator email address.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending Verification Code...';

    try {
      const res = await api.adminForgotPassword(email);
      currentResetEmail = email;

      showToast(res.message || 'Verification code sent to your email!', 'success');

      if (forgotEmailDisplay) forgotEmailDisplay.textContent = email;
      if (resetOtpInput) resetOtpInput.value = '';

      // Transition to Step 2
      forgotStep1Form.style.display = 'none';
      forgotStep2Form.style.display = 'flex';
      if (resetOtpInput) resetOtpInput.focus();

      startOtpTimers(res.expiresInSeconds || 60, res.cooldownSeconds || 60);
    } catch (err) {
      showAlert(err.message || 'Could not send verification code. Please verify administrator email.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '✉️ Send Verification Code';
    }
  });

  // Timers for OTP expiry & resend cooldown
  function startOtpTimers(otpTtl = 60, cooldown = 60) {
    clearTimers();
    otpSecondsRemaining = otpTtl;
    resendSecondsRemaining = cooldown;

    const updateTimerDisplay = () => {
      if (timerTextEl) {
        if (otpSecondsRemaining > 0) {
          if (otpSecondsRemaining === 60) {
            timerTextEl.textContent = '0:60';
          } else {
            const m = Math.floor(otpSecondsRemaining / 60);
            const s = String(otpSecondsRemaining % 60).padStart(2, '0');
            timerTextEl.textContent = `${m}:${s}`;
          }
        } else {
          timerTextEl.textContent = 'Code expired';
        }
      }
    };

    updateTimerDisplay();

    otpCountdownInterval = setInterval(() => {
      otpSecondsRemaining--;
      if (otpSecondsRemaining <= 0) {
        clearInterval(otpCountdownInterval);
        if (resendCooldownInterval) clearInterval(resendCooldownInterval);
        resendSecondsRemaining = 0;
        if (timerTextEl) timerTextEl.textContent = 'Code expired';
        const timerWrap = container.querySelector('#admin-reset-timer-wrap');
        if (timerWrap) {
          timerWrap.innerHTML = `<span style="color: #dc2626; font-weight: 700;">Code expired</span>`;
        }
        if (resendOtpBtn) {
          resendOtpBtn.disabled = false;
          resendOtpBtn.textContent = 'Resend Code';
          resendOtpBtn.style.color = '#ff6b00';
          resendOtpBtn.style.cursor = 'pointer';
        }
        showAlert('Verification code has expired. Please click Resend Code to receive a new code.');
      } else {
        updateTimerDisplay();
      }
    }, 1000);

    if (resendOtpBtn) {
      resendOtpBtn.disabled = true;
      resendOtpBtn.textContent = `Resend in ${resendSecondsRemaining}s`;

      resendCooldownInterval = setInterval(() => {
        resendSecondsRemaining--;
        if (resendSecondsRemaining <= 0) {
          clearInterval(resendCooldownInterval);
          resendOtpBtn.disabled = false;
          resendOtpBtn.textContent = 'Resend Code';
          resendOtpBtn.style.color = '#ff6b00';
          resendOtpBtn.style.cursor = 'pointer';
        } else {
          resendOtpBtn.textContent = `Resend in ${resendSecondsRemaining}s`;
        }
      }, 1000);
    }
  }

  // --- RESEND OTP BUTTON ---
  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', async () => {
      if (resendSecondsRemaining > 0 && otpSecondsRemaining > 0) return;
      if (!currentResetEmail) return;

      resendOtpBtn.disabled = true;
      resendOtpBtn.textContent = 'Sending...';

      try {
        const res = await api.adminResendResetOtp(currentResetEmail);
        showToast(res.message || 'New verification code sent!', 'info');
        hideAlert();
        if (resetOtpInput) {
          resetOtpInput.value = '';
          resetOtpInput.focus();
        }
        startOtpTimers(res.expiresInSeconds || 60, res.cooldownSeconds || 60);
      } catch (err) {
        showAlert(err.message || 'Could not resend verification code.');
        resendOtpBtn.disabled = false;
        resendOtpBtn.textContent = 'Resend Code';
      }
    });
  }

  // --- FORGOT PASSWORD STEP 2: VERIFY OTP ---
  forgotStep2Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const otp = (resetOtpInput?.value || '').trim();
    const submitBtn = container.querySelector('#btn-verify-admin-reset-code');

    if (!otp || otp.length !== 6) {
      showAlert('Please enter the 6-digit verification code.');
      resetOtpInput?.focus();
      return;
    }

    if (otpSecondsRemaining <= 0) {
      showAlert('Verification code has expired. Please request a new code.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying Code...';

    try {
      const res = await api.adminVerifyResetOtp(currentResetEmail, otp);
      currentResetToken = res.resetToken;

      clearTimers();
      showToast('Verification code confirmed! Please create your new password.', 'success');

      // Transition to Step 3
      forgotStep2Form.style.display = 'none';
      forgotStep3Form.style.display = 'flex';
      if (resetPassInput) resetPassInput.focus();
    } catch (err) {
      showAlert(err.message || 'Invalid verification code. Please check and try again.');
      resetOtpInput?.focus();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '🔐 Verify Code';
    }
  });

  // --- FORGOT PASSWORD STEP 3: RESET PASSWORD ---
  forgotStep3Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const newPassword = (resetPassInput?.value || '').trim();
    const confirmPassword = (resetConfirmPassInput?.value || '').trim();
    const submitBtn = container.querySelector('#btn-submit-admin-new-password');

    if (!newPassword || !confirmPassword) {
      showAlert('Please enter and confirm your new password.');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating Password...';

    try {
      const res = await api.adminResetPassword({
        email: currentResetEmail,
        resetToken: currentResetToken,
        newPassword,
        confirmPassword
      });

      showToast(res.message || 'Password reset successfully!', 'success');

      // Transition to Step 4 (Success Screen)
      forgotStep3Form.style.display = 'none';
      forgotStep4Success.style.display = 'flex';

      // Prefill login email for convenience
      const adminEmailInput = container.querySelector('#admin-email');
      if (adminEmailInput) adminEmailInput.value = currentResetEmail;
      const adminPassInput = container.querySelector('#admin-password');
      if (adminPassInput) adminPassInput.value = '';
    } catch (err) {
      showAlert(err.message || 'Failed to reset password. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '🔒 Reset Password';
    }
  });
}
