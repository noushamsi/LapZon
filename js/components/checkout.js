/**
 * Checkout Component - Address Details, Payment Methods & Order Confirmation
 * Strict Indian validation (PIN code, Phone), payment channels (GPay, PhonePe, COD with Captcha),
 * and backend order persistence.
 */

import { api } from '../services/api.js';
import { state } from '../state.js';
import { showToast } from '../app.js';
import { getAppliedCoupon } from './cart.js';

export function renderCheckoutAddress(container) {
  const cart = state.getCart();
  if (cart.length === 0) {
    window.location.hash = '#store';
    showToast('Your cart is empty! Add a laptop first.', 'warning');
    return;
  }

  const { discount: couponDiscount } = getAppliedCoupon();
  const totals = state.getCartTotals(couponDiscount);
  const addresses = state.getAddresses();
  let activeAddress = state.getActiveAddress() || (addresses.length > 0 ? addresses[0] : null);
  let showNewForm = addresses.length === 0;

  function formatPrice(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  container.innerHTML = `
    <div class="checkout-page">
      <div class="container">
        <!-- Stepper -->
        <div class="checkout-stepper">
          <div class="step-node active">
            <span class="step-num">1</span>
            <span>Delivery Address</span>
          </div>
          <div class="step-divider"></div>
          <div class="step-node">
            <span class="step-num">2</span>
            <span>Payment Method</span>
          </div>
          <div class="step-divider"></div>
          <div class="step-node">
            <span class="step-num">3</span>
            <span>Order Confirmed</span>
          </div>
        </div>

        <div class="checkout-layout">
          <!-- Left Column: Address Selection / Form -->
          <div class="checkout-main-content">
            <div class="checkout-card">
              <div class="checkout-card-header">
                <h3>📍 1. Select Delivery Address</h3>
                ${addresses.length > 0 ? `
                  <button type="button" class="btn btn-sm btn-outline" id="btn-toggle-new-addr" style="color: #fff; border-color: rgba(255,255,255,0.4);">
                    ${showNewForm ? 'Use Saved Address' : '+ Add New Address'}
                  </button>
                ` : ''}
              </div>

              <div class="checkout-card-body">
                ${!showNewForm && addresses.length > 0 ? `
                  <div class="saved-addresses-grid" id="saved-addrs-list">
                    ${addresses.map(addr => `
                      <div class="saved-addr-card ${activeAddress && activeAddress.id === addr.id ? 'selected' : ''}" data-id="${addr.id}">
                        <input type="radio" name="selected_addr" class="saved-addr-radio" value="${addr.id}" ${activeAddress && activeAddress.id === addr.id ? 'checked' : ''} />
                        <div class="saved-addr-info">
                          <div class="saved-addr-top">
                            <span class="saved-addr-name">${addr.fullName}</span>
                            <span class="badge badge-tag">${addr.addressType || 'Home'}</span>
                            <span class="saved-addr-phone">📱 ${addr.phone}</span>
                          </div>
                          <p class="saved-addr-text">
                            ${addr.houseNo}, ${addr.street}, ${addr.city}, ${addr.state} - <strong>${addr.pinCode}</strong>
                          </p>
                          ${activeAddress && activeAddress.id === addr.id ? `
                            <button type="button" class="btn btn-orange btn-deliver-here" id="btn-deliver-saved">
                              Deliver Here & Proceed to Payment ➔
                            </button>
                          ` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <!-- Address Input Form -->
                <div id="new-address-form-wrap" style="${!showNewForm && addresses.length > 0 ? 'display: none;' : 'display: block;'}">
                  <h4 style="margin-bottom: 1.25rem; font-size: 1rem; color: var(--text-main); font-weight: 700;">
                    ${addresses.length > 0 ? 'Enter New Delivery Address' : 'Enter Your Delivery Address'}
                  </h4>
                  
                  <form id="address-details-form" class="address-form-grid" novalidate>
                    <!-- Full Name -->
                    <div class="form-group">
                      <label for="addr-fullname">Full Name <span class="req">*</span></label>
                      <input type="text" id="addr-fullname" placeholder="e.g. Rahul Sharma" required />
                      <span class="form-error-msg" id="err-fullname"></span>
                    </div>

                    <!-- Mobile Number -->
                    <div class="form-group">
                      <label for="addr-phone">Mobile Number (10 Digits) <span class="req">*</span></label>
                      <input type="tel" id="addr-phone" placeholder="e.g. 9876543210" maxlength="10" required />
                      <span class="form-error-msg" id="err-phone"></span>
                    </div>

                    <!-- Flat / House No -->
                    <div class="form-group">
                      <label for="addr-house">Flat / House No. / Building <span class="req">*</span></label>
                      <input type="text" id="addr-house" placeholder="e.g. Flat 402, Lotus Residency" required />
                      <span class="form-error-msg" id="err-house"></span>
                    </div>

                    <!-- Street / Area -->
                    <div class="form-group">
                      <label for="addr-street">Street / Area / Locality <span class="req">*</span></label>
                      <input type="text" id="addr-street" placeholder="e.g. 100 Feet Road, Indiranagar" required />
                      <span class="form-error-msg" id="err-street"></span>
                    </div>

                    <!-- PIN Code -->
                    <div class="form-group">
                      <label for="addr-pincode">PIN Code (6 Digits) <span class="req">*</span></label>
                      <input type="text" id="addr-pincode" placeholder="e.g. 560038" maxlength="6" required />
                      <span class="form-error-msg" id="err-pincode"></span>
                    </div>

                    <!-- City -->
                    <div class="form-group">
                      <label for="addr-city">City / District <span class="req">*</span></label>
                      <input type="text" id="addr-city" placeholder="e.g. Bengaluru" required />
                      <span class="form-error-msg" id="err-city"></span>
                    </div>

                    <!-- State Dropdown -->
                    <div class="form-group">
                      <label for="addr-state">State <span class="req">*</span></label>
                      <select id="addr-state" required>
                        <option value="">-- Select State --</option>
                        ${[
                          'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi NCR', 'Goa', 'Gujarat', 
                          'Haryana', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 
                          'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
                        ].map(s => `<option value="${s}" ${s === 'Karnataka' ? 'selected' : ''}>${s}</option>`).join('')}
                      </select>
                      <span class="form-error-msg" id="err-state"></span>
                    </div>

                    <!-- Address Type -->
                    <div class="form-group">
                      <label>Address Type</label>
                      <div class="radio-pills-group">
                        <label class="radio-pill-label">
                          <input type="radio" name="address_type" value="Home" checked />
                          <span>🏠 Home (All Day Delivery)</span>
                        </label>
                        <label class="radio-pill-label">
                          <input type="radio" name="address_type" value="Work" />
                          <span>🏢 Work (10 AM - 6 PM)</span>
                        </label>
                      </div>
                    </div>

                    <div class="form-group full-width" style="margin-top: 1rem;">
                      <button type="submit" class="btn btn-orange btn-lg btn-block" id="btn-save-and-proceed">
                        Save Address & Proceed to Payment ➔
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Price Summary -->
          <aside class="price-summary-sidebar">
            <div class="price-summary-header">Price Details</div>
            <div class="price-summary-body">
              <div class="price-row">
                <span>Price (${totals.itemsCount} items)</span>
                <span>${formatPrice(totals.mrpTotal)}</span>
              </div>
              <div class="price-row discount-row">
                <span>Discount</span>
                <span>-${formatPrice(totals.catalogDiscount)}</span>
              </div>
              ${couponDiscount > 0 ? `
                <div class="price-row discount-row">
                  <span>Coupon Discount</span>
                  <span>-${formatPrice(couponDiscount)}</span>
                </div>
              ` : ''}
              <div class="price-row delivery-row">
                <span>Delivery Charges</span>
                <span class="free-tag">FREE</span>
              </div>
              <div class="price-row total-amount-row">
                <span>Total Amount Payable</span>
                <span>${formatPrice(totals.totalPayable)}</span>
              </div>
              <div class="savings-highlight">
                🎉 You will save ${formatPrice(totals.totalDiscount)} on this laptop order
              </div>
              <div class="trust-badge-mini">
                <span>🛡️ Safe and Secure Payments. 100% Authentic Laptops.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `;

  attachAddressEvents(container);
}

function attachAddressEvents(container) {
  const toggleNewBtn = container.querySelector('#btn-toggle-new-addr');
  const savedAddrsList = container.querySelector('#saved-addrs-list');
  const newFormWrap = container.querySelector('#new-address-form-wrap');
  const form = container.querySelector('#address-details-form');
  const deliverSavedBtn = container.querySelector('#btn-deliver-saved');

  if (toggleNewBtn && savedAddrsList && newFormWrap) {
    toggleNewBtn.addEventListener('click', () => {
      const isHidden = newFormWrap.style.display === 'none';
      newFormWrap.style.display = isHidden ? 'block' : 'none';
      savedAddrsList.style.display = isHidden ? 'none' : 'flex';
      toggleNewBtn.textContent = isHidden ? 'Use Saved Address' : '+ Add New Address';
    });
  }

  // Handle saved address radio clicking
  container.querySelectorAll('.saved-addr-card').forEach(card => {
    card.addEventListener('click', () => {
      const addrId = card.dataset.id;
      const addresses = state.getAddresses();
      const selected = addresses.find(a => a.id === addrId);
      if (selected) {
        state.setActiveAddress(selected);
        renderCheckoutAddress(container);
      }
    });
  });

  if (deliverSavedBtn) {
    deliverSavedBtn.addEventListener('click', () => {
      const active = state.getActiveAddress();
      if (!active) {
        showToast('Please select a delivery address', 'warning');
        return;
      }
      window.location.hash = '#checkout-payment';
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      const fullName = form.querySelector('#addr-fullname').value.trim();
      const phone = form.querySelector('#addr-phone').value.trim();
      const houseNo = form.querySelector('#addr-house').value.trim();
      const street = form.querySelector('#addr-street').value.trim();
      const pinCode = form.querySelector('#addr-pincode').value.trim();
      const city = form.querySelector('#addr-city').value.trim();
      const stateVal = form.querySelector('#addr-state').value;
      const addressType = form.querySelector('input[name="address_type"]:checked')?.value || 'Home';

      // Validation
      if (!fullName) {
        setFieldError('fullname', 'Please enter your full name');
        isValid = false;
      } else clearFieldError('fullname');

      if (!phone || !/^\d{10}$/.test(phone)) {
        setFieldError('phone', 'Please enter a valid 10-digit mobile number');
        isValid = false;
      } else clearFieldError('phone');

      if (!houseNo) {
        setFieldError('house', 'Please enter house / flat details');
        isValid = false;
      } else clearFieldError('house');

      if (!street) {
        setFieldError('street', 'Please enter street / locality details');
        isValid = false;
      } else clearFieldError('street');

      if (!pinCode || !/^\d{6}$/.test(pinCode)) {
        setFieldError('pincode', 'Please enter a valid 6-digit PIN code');
        isValid = false;
      } else clearFieldError('pincode');

      if (!city) {
        setFieldError('city', 'Please enter your city');
        isValid = false;
      } else clearFieldError('city');

      if (!stateVal) {
        setFieldError('state', 'Please select your state');
        isValid = false;
      } else clearFieldError('state');

      if (!isValid) return;

      const newAddress = state.addAddress({
        fullName,
        phone,
        houseNo,
        street,
        pinCode,
        city,
        state: stateVal,
        addressType
      });

      showToast('Delivery address saved!', 'success');
      window.location.hash = '#checkout-payment';
    });
  }

  function setFieldError(field, msg) {
    const errEl = container.querySelector(`#err-${field}`);
    const inputEl = container.querySelector(`#addr-${field}`);
    if (errEl) errEl.textContent = msg;
    if (inputEl) inputEl.classList.add('error');
  }

  function clearFieldError(field) {
    const errEl = container.querySelector(`#err-${field}`);
    const inputEl = container.querySelector(`#addr-${field}`);
    if (errEl) errEl.textContent = '';
    if (inputEl) inputEl.classList.remove('error');
  }
}

/* ==========================================================================
   Step 2: Payment Methods (Google Pay, PhonePe, Cash on Delivery)
   ========================================================================== */
export function renderCheckoutPayment(container) {
  const cart = state.getCart();
  if (cart.length === 0) {
    window.location.hash = '#store';
    showToast('Your cart is empty! Add a laptop first.', 'warning');
    return;
  }

  const activeAddress = state.getActiveAddress();
  if (!activeAddress) {
    window.location.hash = '#checkout-address';
    showToast('Please provide a delivery address first', 'warning');
    return;
  }

  const { discount: couponDiscount } = getAppliedCoupon();
  const totals = state.getCartTotals(couponDiscount);
  let selectedMethod = 'gpay';

  // Generate random 4-digit captcha for COD
  const codCaptcha = Math.floor(1000 + Math.random() * 9000).toString();

  function formatPrice(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  container.innerHTML = `
    <div class="checkout-page">
      <div class="container">
        <!-- Stepper -->
        <div class="checkout-stepper">
          <div class="step-node completed">
            <span class="step-num">✓</span>
            <span>Delivery Address</span>
          </div>
          <div class="step-divider completed"></div>
          <div class="step-node active">
            <span class="step-num">2</span>
            <span>Payment Method</span>
          </div>
          <div class="step-divider"></div>
          <div class="step-node">
            <span class="step-num">3</span>
            <span>Order Confirmed</span>
          </div>
        </div>

        <div class="checkout-layout">
          <!-- Main Payment Selection -->
          <div class="checkout-main-content">
            <!-- Selected Address Summary Card -->
            <div class="checkout-card" style="margin-bottom: 1rem;">
              <div style="padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-subtle);">
                <div>
                  <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Delivering To:</span>
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">
                    ${activeAddress.fullName} • ${activeAddress.phone}
                  </div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    ${activeAddress.houseNo}, ${activeAddress.street}, ${activeAddress.city}, ${activeAddress.state} - ${activeAddress.pinCode}
                  </div>
                </div>
                <a href="#checkout-address" class="btn btn-sm btn-outline-primary">Change</a>
              </div>
            </div>

            <!-- Payment Methods List -->
            <div class="checkout-card">
              <div class="checkout-card-header">
                <h3>💳 2. Choose Payment Method</h3>
              </div>

              <div class="checkout-card-body">
                <div class="payment-methods-list">
                  <!-- 1. Google Pay UPI -->
                  <div class="payment-method-card ${selectedMethod === 'gpay' ? 'selected' : ''}" data-method="gpay">
                    <div class="payment-method-header">
                      <input type="radio" name="pay_mode" value="gpay" ${selectedMethod === 'gpay' ? 'checked' : ''} />
                      <div class="payment-method-icon gpay-icon">
                        <span style="font-weight: 900; font-size: 1.1rem; color: #4285F4;">G</span>
                      </div>
                      <div class="payment-method-title">
                        <h4>Google Pay (UPI)</h4>
                        <p>Pay instantly using Google Pay UPI ID or scan QR code</p>
                      </div>
                    </div>
                    <div class="payment-method-body">
                      <div class="upi-form-box">
                        <input type="text" id="gpay-upi-id" placeholder="Enter Google Pay UPI ID (e.g. yourname@okaxis)" value="user@okaxis" />
                        <button type="button" class="btn btn-primary btn-sm" id="btn-verify-gpay">Verify UPI</button>
                      </div>
                      <div class="qr-preview-box">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=lapkart@okaxis%26pn=LapKart%26am=${totals.totalPayable}" alt="Google Pay QR Code" class="qr-code-img" />
                        <div class="qr-text">
                          <h5>Scan QR Code with Google Pay App</h5>
                          <p>Open GPay on your mobile, scan the QR and approve payment for <strong>${formatPrice(totals.totalPayable)}</strong>.</p>
                        </div>
                      </div>
                      <button type="button" class="btn btn-orange btn-lg btn-block btn-confirm-pay" style="margin-top: 1rem;">
                        Pay ${formatPrice(totals.totalPayable)} via Google Pay ➔
                      </button>
                    </div>
                  </div>

                  <!-- 2. PhonePe UPI -->
                  <div class="payment-method-card ${selectedMethod === 'phonepe' ? 'selected' : ''}" data-method="phonepe">
                    <div class="payment-method-header">
                      <input type="radio" name="pay_mode" value="phonepe" ${selectedMethod === 'phonepe' ? 'checked' : ''} />
                      <div class="payment-method-icon phonepe-icon">
                        <span style="font-weight: 800; font-size: 1.2rem;">पे</span>
                      </div>
                      <div class="payment-method-title">
                        <h4>PhonePe</h4>
                        <p>Direct UPI payment / Request on your PhonePe registered mobile</p>
                      </div>
                    </div>
                    <div class="payment-method-body">
                      <div class="upi-form-box">
                        <input type="tel" id="phonepe-number" placeholder="Enter 10-digit PhonePe Mobile Number" value="${activeAddress.phone}" maxlength="10" />
                        <button type="button" class="btn btn-primary btn-sm" id="btn-verify-phonepe">Send Request</button>
                      </div>
                      <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
                        A payment prompt of <strong>${formatPrice(totals.totalPayable)}</strong> will be sent to your PhonePe application.
                      </p>
                      <button type="button" class="btn btn-orange btn-lg btn-block btn-confirm-pay">
                        Pay ${formatPrice(totals.totalPayable)} via PhonePe ➔
                      </button>
                    </div>
                  </div>

                  <!-- 3. Cash on Delivery (COD) -->
                  <div class="payment-method-card ${selectedMethod === 'cod' ? 'selected' : ''}" data-method="cod">
                    <div class="payment-method-header">
                      <input type="radio" name="pay_mode" value="cod" ${selectedMethod === 'cod' ? 'checked' : ''} />
                      <div class="payment-method-icon cod-icon">
                        <span>💵</span>
                      </div>
                      <div class="payment-method-title">
                        <h4>Cash on Delivery (COD)</h4>
                        <p>Pay with cash or UPI to the delivery executive when your laptop arrives</p>
                      </div>
                    </div>
                    <div class="payment-method-body">
                      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
                        Due to high-value laptop security, please enter the security captcha shown below to confirm your COD order:
                      </p>
                      <div class="captcha-container">
                        <div class="captcha-badge-box" id="cod-captcha-display">${codCaptcha}</div>
                        <div class="captcha-input-wrap">
                          <input type="text" id="cod-captcha-input" placeholder="Enter characters" maxlength="4" />
                        </div>
                      </div>
                      <button type="button" class="btn btn-orange btn-lg btn-block btn-confirm-pay" id="btn-confirm-cod">
                        Confirm Order (Cash on Delivery) ➔
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Price Summary Sidebar -->
          <aside class="price-summary-sidebar">
            <div class="price-summary-header">Price Details</div>
            <div class="price-summary-body">
              <div class="price-row">
                <span>Price (${totals.itemsCount} items)</span>
                <span>${formatPrice(totals.mrpTotal)}</span>
              </div>
              <div class="price-row discount-row">
                <span>Discount</span>
                <span>-${formatPrice(totals.catalogDiscount)}</span>
              </div>
              ${couponDiscount > 0 ? `
                <div class="price-row discount-row">
                  <span>Coupon Discount</span>
                  <span>-${formatPrice(couponDiscount)}</span>
                </div>
              ` : ''}
              <div class="price-row delivery-row">
                <span>Delivery Charges</span>
                <span class="free-tag">FREE</span>
              </div>
              <div class="price-row total-amount-row">
                <span>Total Amount Payable</span>
                <span>${formatPrice(totals.totalPayable)}</span>
              </div>
              <div class="savings-highlight">
                🎉 Total Savings: ${formatPrice(totals.totalDiscount)}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `;

  attachPaymentEvents(container, codCaptcha, totals);
}

function attachPaymentEvents(container, expectedCaptcha, totals) {
  // Method switching
  container.querySelectorAll('.payment-method-card').forEach(card => {
    const header = card.querySelector('.payment-method-header');
    header.addEventListener('click', () => {
      container.querySelectorAll('.payment-method-card').forEach(c => {
        c.classList.remove('selected');
        const radio = c.querySelector('input[type="radio"]');
        if (radio) radio.checked = false;
      });
      card.classList.add('selected');
      const curRadio = card.querySelector('input[type="radio"]');
      if (curRadio) curRadio.checked = true;
    });
  });

  // Verify simulations
  const gpayVerify = container.querySelector('#btn-verify-gpay');
  if (gpayVerify) {
    gpayVerify.addEventListener('click', () => {
      showToast('Google Pay UPI ID verified successfully! ✓', 'success');
    });
  }

  const phonepeVerify = container.querySelector('#btn-verify-phonepe');
  if (phonepeVerify) {
    phonepeVerify.addEventListener('click', () => {
      showToast('Payment request sent to your PhonePe mobile app! 📲', 'success');
    });
  }

  // Payment Confirmation Action with Backend REST API Integration
  container.querySelectorAll('.btn-confirm-pay').forEach(btn => {
    btn.addEventListener('click', async () => {
      const selectedCard = container.querySelector('.payment-method-card.selected');
      const methodKey = selectedCard ? selectedCard.dataset.method : 'gpay';
      let paymentMethodName = 'Google Pay UPI';

      if (methodKey === 'gpay') {
        const upiId = container.querySelector('#gpay-upi-id')?.value.trim() || 'user@okaxis';
        paymentMethodName = `Google Pay (${upiId})`;
      } else if (methodKey === 'phonepe') {
        const phoneNum = container.querySelector('#phonepe-number')?.value.trim() || '9876543210';
        paymentMethodName = `PhonePe UPI (${phoneNum})`;
      } else if (methodKey === 'cod') {
        paymentMethodName = 'Cash on Delivery';
        const enteredCaptcha = container.querySelector('#cod-captcha-input')?.value.trim();
        if (enteredCaptcha !== expectedCaptcha) {
          showToast('Invalid Captcha characters! Please enter correctly.', 'error');
          return;
        }
      }

      btn.disabled = true;
      btn.textContent = 'Processing Order & Reserving Laptop in Database...';

      const cart = state.getCart();
      const activeAddress = state.getActiveAddress();
      const { discount: couponDiscount } = getAppliedCoupon();
      const finalTotals = state.getCartTotals(couponDiscount);

      const orderPayload = {
        customer: activeAddress,
        items: cart,
        pricing: {
          itemsTotal: finalTotals.mrpTotal,
          discount: finalTotals.totalDiscount,
          delivery: 0,
          totalAmount: finalTotals.totalPayable
        },
        paymentMethod: paymentMethodName
      };

      try {
        // Send order to backend API
        const res = await api.createOrder(orderPayload);
        const newOrder = res.order;

        // Also update local state
        const localOrders = state.getOrders();
        localOrders.unshift(newOrder);
        state.setOrders(localOrders);
        state.clearCart();

        showToast('Order Placed Successfully in Database! 🎉', 'success');
        window.location.hash = `#order-confirmed/${newOrder.orderId}`;
      } catch (err) {
        console.warn('Backend order failed, falling back to local storage:', err);
        const fallbackOrder = state.createOrder(orderPayload);
        state.clearCart();
        showToast('Order Placed Successfully! 🎉', 'success');
        window.location.hash = `#order-confirmed/${fallbackOrder.orderId}`;
      }
    });
  });
}

/* ==========================================================================
   Step 3: Order Confirmed Celebration Screen
   ========================================================================== */
export async function renderOrderConfirmed(container, orderId) {
  let order = null;
  try {
    const res = await api.getOrderById(orderId);
    order = res.order;
  } catch {
    order = state.getOrderById(orderId);
  }

  if (!order) {
    container.innerHTML = `
      <div class="container" style="padding: 4rem 1rem; text-align: center;">
        <h2>Order Not Found</h2>
        <p style="color: var(--text-secondary); margin: 1rem 0;">We couldn't locate order with ID ${orderId}</p>
        <a href="#store" class="btn btn-primary">Go to Laptop Store</a>
      </div>
    `;
    return;
  }

  function formatPrice(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  const expectedDateObj = new Date(order.deliveryDetails?.expectedDate || Date.now());
  const dateFormatted = isNaN(expectedDateObj) 
    ? order.deliveryDetails?.expectedDate 
    : expectedDateObj.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  container.innerHTML = `
    <div class="confirmed-page">
      <div class="container">
        <!-- Confirmed Celebration Banner -->
        <div class="confirmed-banner">
          <div class="success-check-anim">✓</div>
          <h2>Order Confirmed!</h2>
          <p>Thank you, <strong>${order.customer.fullName}</strong>. Your laptop order has been secured and confirmed.</p>
          <div style="margin-top: 1rem; font-size: 0.95rem; color: #d1fae5;">
            Order ID: <strong style="font-family: monospace; font-size: 1.1rem; color: #fff;">${order.orderId}</strong>
          </div>
        </div>

        <!-- Order Information Summary Cards -->
        <div class="order-details-grid">
          <!-- Items Summary -->
          <div class="order-info-card">
            <h4>💻 Ordered Laptop Details</h4>
            ${order.items.map(item => `
              <div class="confirmed-item-row">
                <img src="${item.image}" alt="${item.name}" />
                <div style="flex: 1;">
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">${item.name}</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">${item.specsSummary}</div>
                  <div style="font-size: 0.88rem; font-weight: 700; margin-top: 4px;">
                    Qty: ${item.quantity} × ${formatPrice(item.price)}
                  </div>
                </div>
              </div>
            `).join('')}
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; display: flex; justify-content: space-between; font-weight: 800; font-size: 1.1rem;">
              <span>Total Paid / Payable:</span>
              <span style="color: var(--primary-blue);">${formatPrice(order.pricing.totalAmount)}</span>
            </div>
          </div>

          <!-- Delivery & Payment Info -->
          <div class="order-info-card">
            <h4>📍 Delivery & Payment Details</h4>
            <div style="margin-bottom: 1rem;">
              <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Customer & Delivery Address:</div>
              <div style="font-weight: 700; color: var(--text-main);">${order.customer.fullName} (📱 ${order.customer.phone})</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;">
                ${order.customer.houseNo}, ${order.customer.street}, ${order.customer.city}, ${order.customer.state} - ${order.customer.pinCode}
              </div>
            </div>

            <div style="margin-bottom: 1rem;">
              <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Payment Mode:</div>
              <div style="font-weight: 600; color: var(--text-main);">${order.paymentMethod}</div>
              <span class="badge ${order.paymentStatus === 'Paid' ? 'badge-in-stock' : 'badge-tag'}">Status: ${order.paymentStatus}</span>
            </div>

            <div>
              <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Expected Delivery:</div>
              <div style="font-weight: 700; color: var(--accent-emerald); font-size: 1.05rem;">
                🚚 Arriving by ${dateFormatted}
              </div>
            </div>
          </div>
        </div>

        <!-- Action CTAs -->
        <div class="confirmed-actions">
          <a href="#order-tracking/${order.orderId}" class="btn btn-orange btn-lg" id="btn-track-order-confirmed">
            📦 Track Your Order Live ➔
          </a>
          <a href="#store" class="btn btn-outline-primary btn-lg">
            💻 Continue Shopping
          </a>
        </div>
      </div>
    </div>
  `;
}
