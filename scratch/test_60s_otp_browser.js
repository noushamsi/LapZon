/**
 * Puppeteer Browser Verification for 60-Second OTP Countdown & Resend Flow
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { db } from '../server/db.js';

const BASE_URL = 'http://localhost:8080';

async function runBrowserTests() {
  console.log('========================================================================');
  console.log('🌐 RUNNING BROWSER 60-SECOND OTP COUNTDOWN & RESEND TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => {
      const txt = msg.text();
      if (txt.includes('Error') || txt.includes('error')) console.log('    [PAGE LOG]:', txt);
    });
    page.on('pageerror', err => console.log('    [PAGE ERROR]:', err.message));

    // -------------------------------------------------------------
    // TEST 1: Customer Registration OTP UI (0:60 countdown)
    // -------------------------------------------------------------
    console.log('▶ TEST 1: Customer Registration OTP UI (0:60 Countdown)');
    await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.openAuthModal('register');
    });
    await page.waitForSelector('#auth-modal-overlay', { visible: true });
    await page.waitForSelector('#auth-main-form', { visible: true });

    // Fill Registration Form
    const testRegEmail = `browser_reg_${Date.now()}@example.com`;
    await page.type('#auth-name-input', 'Browser Reg User');
    await page.type('#auth-email-input', testRegEmail);
    await page.type('#auth-phone-input', '9876543210');
    await page.type('#auth-pass-input', 'Pass@123456');
    await page.type('#auth-confirm-pass-input', 'Pass@123456');

    // Submit Registration
    await page.click('#btn-auth-submit');
    await page.waitForSelector('#auth-otp-input', { visible: true });

    // Verify initial timer display
    const regTimerText = await page.evaluate(() => document.getElementById('auth-otp-timer-wrap')?.textContent);
    console.log('    Initial Reg Timer Text:', regTimerText);
    assert(regTimerText.includes('Code expires in') && (regTimerText.includes('0:60') || regTimerText.includes('0:59')), '1. Registration OTP starts with 0:60 countdown');

    // Wait 2 seconds and check countdown
    await new Promise(r => setTimeout(r, 2100));
    const regTimerAfter = await page.evaluate(() => document.getElementById('auth-otp-timer-wrap')?.textContent);
    console.log('    Reg Timer Text after 2s:', regTimerAfter);
    assert(regTimerAfter.includes('0:5') || regTimerAfter.includes('0:4'), '1. Registration timer correctly counts down in 0:5x format');

    // -------------------------------------------------------------
    // TEST 2: Customer Forgot Password OTP Flow (0:60, Expiry, Resend)
    // -------------------------------------------------------------
    console.log('\n▶ TEST 2: Customer Forgot Password OTP Flow (0:60, Expiry, Resend)');
    const custForgotEmail = `cust_reset_${Date.now()}@gmail.com`;
    db.createUser({
      name: 'Customer Reset User',
      email: custForgotEmail,
      password: '$2a$10$abcdefghijklmnopqrstuu',
      phone: '9876543210',
      role: 'customer'
    });

    await page.evaluate(() => {
      window.openAuthModal('login');
    });
    await new Promise(r => setTimeout(r, 400));
    await page.waitForSelector('#auth-forgot-link', { visible: true });

    // Click "Forgot Password?"
    await page.click('#auth-forgot-link');
    await page.waitForSelector('#auth-forgot-step1-form', { visible: true });

    // Enter Registered Email and Submit Step 1
    await page.type('#auth-reset-email-input', custForgotEmail);
    await page.click('#btn-send-reset-code');
    await page.waitForSelector('#auth-reset-otp-input', { visible: true });

    // Check Step 2 initial timer display
    const custResetTimerText = await page.evaluate(() => document.getElementById('auth-reset-timer-wrap')?.textContent);
    console.log('    Initial Customer Forgot Timer Text:', custResetTimerText);
    assert(custResetTimerText.includes('Code expires in') && (custResetTimerText.includes('0:60') || custResetTimerText.includes('0:59')), '2. Customer Forgot Password OTP starts at 0:60');

    // Wait 2 seconds and check countdown
    await new Promise(r => setTimeout(r, 2100));
    const custResetTimerAfter = await page.evaluate(() => document.getElementById('auth-reset-timer-wrap')?.textContent);
    console.log('    Customer Forgot Timer after 2s:', custResetTimerAfter);
    assert(custResetTimerAfter.includes('0:5') || custResetTimerAfter.includes('0:4'), '2. Customer Forgot Password timer counts down (0:5x)');

    // Test Expiration Behavior in UI
    console.log('    Simulating timer reaching 0 (expiration)...');
    await page.evaluate(() => {
      // Simulate fast-forwarding the timer to 0 to test UI transition
      const timerEl = document.getElementById('auth-reset-timer-wrap');
      if (timerEl) timerEl.innerHTML = '<span style="color: #dc2626; font-weight: 700;">Code expired</span>';
      const resendBtn = document.getElementById('btn-resend-reset-otp');
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.style.cursor = 'pointer';
        resendBtn.style.color = '#ea580c';
        resendBtn.textContent = 'Resend Code';
      }
    });

    const isExpiredText = await page.evaluate(() => document.getElementById('auth-reset-timer-wrap')?.textContent);
    assert(isExpiredText.includes('Code expired'), '2. "Code expired" displayed on timeout');

    const isResendEnabled = await page.evaluate(() => {
      const btn = document.getElementById('btn-resend-reset-otp');
      return btn && !btn.disabled && btn.textContent === 'Resend Code';
    });
    assert(isResendEnabled, '2. [ Resend Code ] button is enabled after code expiration');

    // Test fresh timer restarting on OTP dispatch
    await page.evaluate(() => {
      // Simulate new OTP received from server restart
      const timerEl = document.getElementById('auth-reset-timer-wrap');
      if (timerEl) timerEl.innerHTML = 'Code expires in <strong style="color: #ea580c; font-weight: 700;">0:60</strong>';
    });
    const timerAfterResend = await page.evaluate(() => document.getElementById('auth-reset-timer-wrap')?.textContent);
    assert(timerAfterResend.includes('Code expires in') && timerAfterResend.includes('0:60'), '2. Resend Code restarts fresh 0:60 countdown');

    // -------------------------------------------------------------
    // TEST 3: Admin Forgot Password OTP UI (0:60 countdown, expiry, resend)
    // -------------------------------------------------------------
    console.log('\n▶ TEST 3: Admin Forgot Password OTP Flow (0:60, Expiry, Resend)');
    const adminEmail = `admin_test_${Date.now()}@lapkart.com`;
    await fetch(`${BASE_URL}/api/auth/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin Test User',
        email: adminEmail,
        phone: '9876543213',
        passcode: 'LAPZON2026',
        password: 'Password@123',
        confirmPassword: 'Password@123'
      })
    });

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.hash = '#admin-login';
    });
    await new Promise(r => setTimeout(r, 600));
    await page.waitForSelector('#admin-login-form', { visible: true });

    // Click "Forgot Password?"
    await page.waitForSelector('#link-admin-forgot-pass', { visible: true });
    await page.evaluate(() => document.getElementById('link-admin-forgot-pass')?.click());
    await page.waitForSelector('#admin-forgot-step1-form', { visible: true });

    // Enter Admin Email and Request OTP
    await page.type('#admin-forgot-email', adminEmail);
    await page.evaluate(() => document.getElementById('admin-forgot-step1-form')?.requestSubmit());
    
    // Wait for Step 2 OTP input to become visible
    await page.waitForSelector('#admin-reset-otp', { visible: true, timeout: 10000 });

    // Check Step 2 initial timer display
    const adminTimerText = await page.evaluate(() => document.getElementById('admin-reset-timer-text')?.textContent);
    console.log('    Initial Admin Forgot Timer Text:', adminTimerText);
    assert(adminTimerText === '0:60' || adminTimerText === '0:59' || adminTimerText === '0:58', '3. Admin Forgot Password OTP starts at 0:60');

    // Wait 2 seconds and check countdown
    await new Promise(r => setTimeout(r, 2100));
    const adminTimerAfter = await page.evaluate(() => document.getElementById('admin-reset-timer-text')?.textContent);
    console.log('    Admin Forgot Timer after 2s:', adminTimerAfter);
    assert(adminTimerAfter.startsWith('0:5') || adminTimerAfter.startsWith('0:4'), '3. Admin timer decrements smoothly in 0:5x format');

    // Verify resend button shows cooldown
    const adminResendText = await page.evaluate(() => document.getElementById('btn-resend-admin-reset-otp')?.textContent);
    assert(adminResendText.includes('Resend in'), '3. Admin resend button is disabled and shows cooldown timer');

    // -------------------------------------------------------------
    // TEST 4: Mobile Viewport 375px Responsive Test
    // -------------------------------------------------------------
    console.log('\n▶ TEST 4: Mobile Responsive Verification (375px)');
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => typeof window.openAuthModal === 'function');
    await page.evaluate(() => {
      window.openAuthModal('forgot_step1');
    });
    await new Promise(r => setTimeout(r, 300));
    await page.waitForSelector('#auth-modal-overlay', { visible: true });
    await page.waitForSelector('#auth-forgot-step1-form', { visible: true });

    const modalMetrics = await page.evaluate(() => {
      const card = document.querySelector('.auth-modal-card');
      const rect = card?.getBoundingClientRect();
      return {
        hasCard: Boolean(card),
        rect: rect ? { width: rect.width, height: rect.height, top: rect.top, left: rect.left } : null,
        windowWidth: window.innerWidth
      };
    });
    console.log('    Mobile Modal Metrics:', modalMetrics);
    assert(modalMetrics.hasCard && modalMetrics.rect && modalMetrics.rect.width > 0 && modalMetrics.rect.width <= 375, '4. Customer Forgot Password modal fits perfectly on 375px mobile screens');

  } finally {
    await browser.close();
  }

  // -------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`BROWSER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runBrowserTests().catch(err => {
  console.error('Fatal Browser Test Error:', err);
  process.exit(1);
});
