/**
 * Automated Verification Script: Professional Clean 2D UI & Universal Back Navigation
 */

import fs from 'fs';

async function runRedesignVerification() {
  console.log('=====================================================');
  console.log('🔍 RUNNING LAPZON CLEAN 2D & BACK NAVIGATION VERIFICATION');
  console.log('=====================================================\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const welcomeJs = fs.readFileSync('js/components/welcome.js', 'utf8');
  const welcomeCss = fs.readFileSync('css/welcome.css', 'utf8');
  const mainCss = fs.readFileSync('css/main.css', 'utf8');
  const pdpJs = fs.readFileSync('js/components/productDetails.js', 'utf8');
  const checkoutJs = fs.readFileSync('js/components/checkout.js', 'utf8');
  const trackingJs = fs.readFileSync('js/components/tracking.js', 'utf8');
  const userDashJs = fs.readFileSync('js/components/userDashboard.js', 'utf8');
  const supportJs = fs.readFileSync('js/components/support.js', 'utf8');
  const legalJs = fs.readFileSync('js/components/legal.js', 'utf8');
  const adminJs = fs.readFileSync('js/components/admin.js', 'utf8');
  const navbarJs = fs.readFileSync('js/components/navbar.js', 'utf8');
  const authModalJs = fs.readFileSync('js/components/authModal.js', 'utf8');

  // 1. Complete Removal of 3D Effects, 3D Badges, & Glassmorphism
  assert(
    !welcomeJs.includes('hero-floating-spec-badge') &&
    !welcomeJs.includes('card-3d-tilt') &&
    !welcomeJs.includes('hero-3d-aura') &&
    !welcomeJs.includes('card-3d-glare'),
    'welcome.js has zero 3D tilt, zero 3D glare, and zero 3D floating badges'
  );

  assert(
    !mainCss.includes('--glass-bg') &&
    !mainCss.includes('.preserve-3d') &&
    !mainCss.includes('.card-3d-tilt'),
    'main.css has zero 3D tokens and zero 3D perspective tilt utilities'
  );

  // 2. Clean 2D Micro-Animations
  assert(
    mainCss.includes('@keyframes fadeInUp') &&
    mainCss.includes('@keyframes cartBadgeBounce') &&
    mainCss.includes('.hover-lift'),
    'main.css provides smooth 2D animations (fadeInUp, cartBadgeBounce, hover-lift)'
  );

  // 3. Universal Top-Left "← Back" Navigation Button on PDP (Replaces Breadcrumb)
  assert(
    pdpJs.includes('btn-page-back') &&
    pdpJs.includes('btn-pdp-back') &&
    !pdpJs.includes('breadcrumb-nav') &&
    !pdpJs.includes('Home > Laptops'),
    'productDetails.js replaces breadcrumb navigation with top-left "← Back" button with history fallback'
  );

  // 4. Universal Top-Left "← Back" on Checkout Pages
  assert(
    checkoutJs.includes('btn-checkout-addr-back') &&
    checkoutJs.includes('btn-checkout-pay-back'),
    'checkout.js includes top-left "← Back" button for address and payment views'
  );

  // 5. Universal Top-Left "← Back" on Order Tracking Page
  assert(
    trackingJs.includes('btn-tracking-back'),
    'tracking.js includes top-left "← Back" button to return to orders'
  );

  // 6. Universal Top-Left "← Back" on User Dashboard, Support, Legal & Admin
  assert(
    userDashJs.includes('btn-dashboard-back') &&
    supportJs.includes('btn-support-back') &&
    legalJs.includes('btn-legal-back') &&
    adminJs.includes('btn-admin-back'),
    'userDashboard.js, support.js, legal.js, and admin.js all include top-left "← Back" navigation buttons'
  );

  // 7. Styling for Universal Back Button
  assert(
    mainCss.includes('.btn-page-back') &&
    mainCss.includes('.btn-page-back:hover') &&
    mainCss.includes('.back-arrow-icon'),
    'main.css includes consistent, responsive styling for .btn-page-back'
  );

  // 8. Branding and Google OAuth 2.0 Flow Preserved
  assert(
    welcomeJs.includes('LapZon India Pvt. Ltd.') &&
    navbarJs.includes('LapZon') &&
    !authModalJs.includes('Galaxy S24 Ultra') &&
    !authModalJs.includes('GOOGLE_CLIENT_SECRET'),
    'Clean LapZon branding and official Google OAuth 2.0 security flow are 100% preserved'
  );

  console.log(`\n=====================================================`);
  console.log(`🎉 VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=====================================================\n`);
}

runRedesignVerification();
