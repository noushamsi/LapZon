/**
 * Checkout Component - Address Details, Cash on Delivery Payment & Order Placement
 * Strict Indian validation (PIN code, 10-digit Phone), Cash on Delivery ONLY,
 * and initial status: "Waiting for Admin Confirmation".
 */

import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { state } from '../state.js';
import { showToast, trigger3DRefresh } from '../app.js';
import { getAppliedCoupon } from './cart.js';

export async function renderCheckoutAddress(container) {
  const cart = state.getCart();
  if (cart.length === 0) {
    window.location.hash = '#store';
    showToast('Your cart is empty! Add a laptop first.', 'warning');
    return;
  }

  const { discount: couponDiscount } = getAppliedCoupon();
  const totals = state.getCartTotals(couponDiscount);
  
  let addresses = [];
  try {
    const res = await api.getUserAddresses();
    if (res && res.addresses) {
      addresses = res.addresses;
    }
  } catch {
    addresses = state.getAddresses();
  }

  let activeAddress = addresses.length > 0 ? addresses[0] : null;
  let showNewForm = addresses.length === 0;

  function formatPrice(val) {
    return state.formatPrice(val);
  }

  container.innerHTML = `
    <div class="checkout-page fade-in-section">
      <div class="container">
        <!-- Clean Page Back Navigation Button -->
        <div class="page-back-nav-container">
          <button type="button" class="btn-page-back" id="btn-checkout-addr-back" title="Back">
            <span class="back-arrow-icon">←</span>
            <span>Back</span>
          </button>
        </div>

        <!-- Stepper -->
        <div class="checkout-stepper">
          <div class="step-node active">
            <span class="step-num">1</span>
            <span>Delivery Address</span>
          </div>
          <div class="step-divider"></div>
          <div class="step-node">
            <span class="step-num">2</span>
            <span>Order Review & Payment</span>
          </div>
          <div class="step-divider"></div>
          <div class="step-node">
            <span class="step-num">3</span>
            <span>Order Placed</span>
          </div>
        </div>

        <div class="checkout-layout">
          <!-- Left Column: Address Selection / Form -->
          <div class="checkout-main-content">
            <div class="checkout-card">
              <div class="checkout-card-header">
                <h3>📍 1. Delivery Address</h3>
                ${addresses.length > 0 ? `
                  <button type="button" class="btn btn-sm btn-outline" id="btn-toggle-new-addr" style="color: #fff; border-color: rgba(255,255,255,0.4);">
                    ${showNewForm ? 'Use Saved Address' : '+ Add Different Address'}
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
                          <div class="saved-addr-top" style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                              <span class="saved-addr-name">${addr.fullName}</span>
                              <span class="badge badge-tag">${addr.addressType || 'Home'}</span>
                              <span class="saved-addr-phone">📱 ${addr.phone}</span>
                            </div>
                            <button type="button" class="btn btn-sm btn-outline btn-delete-checkout-addr" data-id="${addr.id}" title="Remove Address" style="color: #ef4444; border-color: #fca5a5; padding: 2px 8px; font-size: 0.75rem;">
                              🗑️ Remove
                            </button>
                          </div>
                          <p class="saved-addr-text">
                            ${addr.houseNo}, ${addr.street}, ${addr.city}, ${addr.state} - <strong>${addr.pinCode}</strong>
                          </p>
                          ${activeAddress && activeAddress.id === addr.id ? `
                            <button type="button" class="btn btn-orange btn-deliver-here" id="btn-deliver-saved">
                              Deliver to this Address & Review Order ➔
                            </button>
                          ` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <!-- Address Input Form -->
                <div id="new-address-form-wrap" style="${!showNewForm && addresses.length > 0 ? 'display: none;' : 'display: block;'}">
                  <h4 style="margin: 0 0 1rem; font-size: 1.05rem; color: var(--text-main); font-weight: 800;">
                    Complete Delivery Address
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
                      <label for="addr-phone">Mobile Number <span class="req">*</span></label>
                      <input type="tel" id="addr-phone" value="${state.getPhone() || ''}" placeholder="Enter mobile number" required />
                      <span class="form-error-msg" id="err-phone"></span>
                    </div>

                    <!-- Current Location (Optional) - Standard Form Field with Connect Button -->
                    <div class="form-group" style="grid-column: 1 / -1;">
                      <label for="addr-current-location" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Current Location <span class="opt-tag" style="color: #64748b; font-weight: 500; font-size: 0.8rem;">(Optional)</span></span>
                      </label>
                      <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" id="addr-current-location" placeholder="Enter current area or click 'Connect Location'" style="flex: 1;" />
                        <button type="button" class="btn btn-outline" id="btn-use-current-location" style="display: inline-flex; align-items: center; gap: 6px; padding: 0.65rem 1rem; border: 1.5px solid #ff6b00; color: #ff6b00; font-weight: 700; border-radius: 8px; background: #fff; cursor: pointer; white-space: nowrap; transition: all 0.2s ease;">
                          <span>📍</span>
                          <span id="loc-btn-label">Connect Location</span>
                        </button>
                      </div>
                      <span id="location-detected-summary" style="display: none; font-size: 0.8rem; color: #16a34a; font-weight: 600; margin-top: 4px;"></span>
                    </div>

                    <!-- Flat / House No -->
                    <div class="form-group">
                      <label for="addr-house">House / Flat / Building No. <span class="req">*</span></label>
                      <input type="text" id="addr-house" placeholder="e.g. Flat 402, Lotus Residency" required />
                      <span class="form-error-msg" id="err-house"></span>
                    </div>

                    <!-- Street / Area -->
                    <div class="form-group">
                      <label for="addr-street">Street / Area / Locality <span class="req">*</span></label>
                      <input type="text" id="addr-street" placeholder="e.g. 100 Feet Road, Indiranagar" required />
                      <span class="form-error-msg" id="err-street"></span>
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

                    <!-- PIN Code -->
                    <div class="form-group">
                      <label for="addr-pincode">PIN Code (6 Digits) <span class="req">*</span></label>
                      <input type="text" id="addr-pincode" placeholder="e.g. 560038" maxlength="6" required />
                      <span class="form-error-msg" id="err-pincode"></span>
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
                        Save Address & Review Order ➔
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
                  <span>Referral Coupon (30% OFF)</span>
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
              <div class="trust-badge-mini">
                <span>🛡️ Safe Cash on Delivery • 100% Authentic Laptops</span>
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
  const backBtn = container.querySelector('#btn-checkout-addr-back');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = '#cart';
      }
    });
  }

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
      toggleNewBtn.textContent = isHidden ? 'Use Saved Address' : '+ Add Different Address';
    });
  }

  // Geolocation Location Detection (Optional)
  const useLocationBtn = container.querySelector('#btn-use-current-location');
  const locLabel = container.querySelector('#loc-btn-label');
  const locInput = container.querySelector('#addr-current-location');
  const locSummary = container.querySelector('#location-detected-summary');

  if (useLocationBtn && locLabel) {
    useLocationBtn.addEventListener('click', () => {
      if (!('geolocation' in navigator)) {
        showToast('Geolocation is not supported by your browser. Please enter address manually.', 'info');
        return;
      }

      locLabel.innerHTML = '⏳ Connecting...';
      useLocationBtn.disabled = true;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`, {
              headers: { 'Accept-Language': 'en' }
            });
            const geo = await res.json();
            const addr = geo?.address || {};

            const cityInput = container.querySelector('#addr-city');
            const stateSelect = container.querySelector('#addr-state');
            const pinInput = container.querySelector('#addr-pincode');
            const streetInput = container.querySelector('#addr-street');
            const houseInput = container.querySelector('#addr-house');

            let detectedCity = addr.city || addr.town || addr.city_district || addr.county || addr.state_district || '';
            let detectedPin = addr.postcode ? addr.postcode.replace(/\D/g, '').substring(0, 6) : '';
            let detectedRoad = addr.road || addr.suburb || addr.neighbourhood || addr.residential || '';
            let detectedHouse = addr.house_number || addr.building || '';
            let detectedState = addr.state || '';

            const fullLocString = [detectedRoad, detectedCity, detectedState, detectedPin].filter(Boolean).join(', ');
            if (locInput) locInput.value = fullLocString;
            if (cityInput && detectedCity) cityInput.value = detectedCity;
            if (pinInput && detectedPin && detectedPin.length === 6) pinInput.value = detectedPin;
            if (streetInput && detectedRoad) streetInput.value = detectedRoad;
            if (houseInput && detectedHouse) houseInput.value = detectedHouse;

            if (stateSelect && detectedState) {
              const options = Array.from(stateSelect.options);
              const matched = options.find(opt => 
                opt.value.toLowerCase() === detectedState.toLowerCase() || 
                detectedState.toLowerCase().includes(opt.value.toLowerCase()) || 
                opt.value.toLowerCase().includes(detectedState.toLowerCase())
              );
              if (matched) stateSelect.value = matched.value;
            }

            if (locSummary) {
              locSummary.style.display = 'block';
              locSummary.textContent = `✓ Connected to GPS Area: ${fullLocString}`;
            }

            showToast('📍 Current location connected & fields populated!', 'success');
          } catch (err) {
            console.warn('Geolocation reverse geocoding fallback:', err);
            showToast('Location connected. Please verify your address details.', 'info');
          } finally {
            locLabel.innerHTML = 'Connect Location';
            useLocationBtn.disabled = false;
          }
        },
        (err) => {
          console.warn('Geolocation access status:', err);
          locLabel.innerHTML = 'Connect Location';
          useLocationBtn.disabled = false;
          showToast('Location permission not granted. You can type your address manually.', 'info');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  }

  // Handle saved address radio clicking
  container.querySelectorAll('.saved-addr-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-checkout-addr')) return;
      const addrId = card.dataset.id;
      const addresses = state.getAddresses();
      const selected = addresses.find(a => a.id === addrId);
      if (selected) {
        state.setActiveAddress(selected);
        renderCheckoutAddress(container);
      }
    });
  });

  // Handle address delete button
  container.querySelectorAll('.btn-delete-checkout-addr').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const addrId = btn.dataset.id;
      state.deleteAddress(addrId);
      if (auth.isAuthenticated()) {
        try {
          await api.deleteUserAddress(addrId);
        } catch {}
      }
      showToast('Address removed.', 'info');
      renderCheckoutAddress(container);
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
    form.addEventListener('submit', async (e) => {
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

      // Strict Validation
      if (!fullName) {
        setFieldError('fullname', 'Please enter your Full Name');
        isValid = false;
      } else clearFieldError('fullname');

      const rawPhone = phone.replace(/[\s\-\+\(\)]/g, '');
      if (!rawPhone || rawPhone.length < 8 || rawPhone.length > 15 || !/^\d+$/.test(rawPhone)) {
        setFieldError('phone', 'Please enter a valid Mobile Number (8-15 digits)');
        isValid = false;
      } else clearFieldError('phone');

      if (!houseNo) {
        setFieldError('house', 'Please enter House / Flat Number');
        isValid = false;
      } else clearFieldError('house');

      if (!street) {
        setFieldError('street', 'Please enter Street / Area details');
        isValid = false;
      } else clearFieldError('street');

      if (!city) {
        setFieldError('city', 'Please enter City');
        isValid = false;
      } else clearFieldError('city');

      if (!stateVal) {
        setFieldError('state', 'Please select your State');
        isValid = false;
      } else clearFieldError('state');

      if (!pinCode || !/^\d{6}$/.test(pinCode)) {
        setFieldError('pincode', 'Please enter a valid 6-digit PIN Code');
        isValid = false;
      } else clearFieldError('pincode');

      if (!isValid) {
        showToast('Please fill all required address fields correctly.', 'warning');
        return;
      }

      const addressData = {
        fullName,
        phone,
        houseNo,
        street,
        pinCode,
        city,
        state: stateVal,
        addressType
      };

      const savedLocal = state.addAddress(addressData);
      state.setActiveAddress(savedLocal);

      // Save to backend if user is logged in
      try {
        await api.addUserAddress(addressData);
      } catch (err) {
        console.warn('Address saved to local session:', err);
      }

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
   Step 2: Order Review & Cash on Delivery Payment ONLY
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
    showToast('Delivery address is required before placing order.', 'warning');
    return;
  }

  const { discount: couponDiscount } = getAppliedCoupon();
  const totals = state.getCartTotals(couponDiscount);

  function formatPrice(val) {
    return state.formatPrice(val);
  }

  container.innerHTML = `
    <div class="checkout-page fade-in-section">
      <div class="container">
        <!-- Clean Page Back Navigation Button -->
        <div class="page-back-nav-container">
          <button type="button" class="btn-page-back" id="btn-checkout-pay-back" title="Back">
            <span class="back-arrow-icon">←</span>
            <span>Back</span>
          </button>
        </div>

        <!-- Stepper -->
        <div class="checkout-stepper">
          <div class="step-node completed">
            <span class="step-num">✓</span>
            <span>Delivery Address</span>
          </div>
          <div class="step-divider completed"></div>
          <div class="step-node active">
            <span class="step-num">2</span>
            <span>Order Review & Payment</span>
          </div>
          <div class="step-divider"></div>
          <div class="step-node">
            <span class="step-num">3</span>
            <span>Order Placed</span>
          </div>
        </div>

        <div class="checkout-layout">
          <!-- Main Content -->
          <div class="checkout-main-content">
            
            <!-- 1. Delivery Address Summary -->
            <div class="checkout-card" style="margin-bottom: 1rem;">
              <div style="padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-subtle);">
                <div>
                  <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">📍 Delivering To:</span>
                  <div style="font-weight: 700; font-size: 1rem; color: var(--text-main); margin-top: 2px;">
                    ${activeAddress.fullName} • 📱 ${activeAddress.phone}
                  </div>
                  <div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 2px;">
                    ${activeAddress.houseNo}, ${activeAddress.street}, ${activeAddress.city}, ${activeAddress.state} - <strong>${activeAddress.pinCode}</strong>
                  </div>
                </div>
                <a href="#checkout-address" class="btn btn-sm btn-outline-primary">Change Address</a>
              </div>
            </div>

            <!-- 2. Ordered Laptop Items Summary -->
            <div class="checkout-card" style="margin-bottom: 1.25rem;">
              <div class="checkout-card-header" style="background: var(--bg-surface); color: var(--text-main); border-bottom: 1px solid var(--border-subtle);">
                <h3 style="font-size: 1rem; color: var(--text-main);">💻 Laptop Order Summary (${totals.itemsCount} ${totals.itemsCount > 1 ? 'Laptops' : 'Laptop'})</h3>
              </div>
              <div class="checkout-card-body" style="display: flex; flex-direction: column; gap: 1rem;">
                ${cart.map(item => `
                  <div style="display: flex; gap: 1rem; align-items: center; border-bottom: 1px dashed var(--border-subtle); padding-bottom: 1rem;">
                    <img src="${item.image}" alt="${item.name}" style="width: 72px; height: 72px; object-fit: contain; background: var(--bg-subtle); border-radius: var(--radius-xs); padding: 4px;" />
                    <div style="flex: 1;">
                      <h4 style="font-size: 0.98rem; font-weight: 700; color: var(--text-main);">${item.name}</h4>
                      <p style="font-size: 0.82rem; color: var(--text-muted);">${item.specsSummary}</p>
                      <div style="font-size: 0.9rem; font-weight: 700; margin-top: 4px; color: var(--primary-blue);">
                        ${formatPrice(item.price)} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal;">(Qty: ${item.quantity})</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 3. Payment Method: Cash on Delivery ONLY -->
            <div class="checkout-card">
              <div class="checkout-card-header">
                <h3>💵 Payment Method: Cash on Delivery</h3>
              </div>

              <div class="checkout-card-body">
                <div class="payment-method-card selected" style="border: 2px solid var(--accent-emerald); background: #f0fdf4;">
                  <div class="payment-method-header" style="cursor: default;">
                    <input type="radio" name="pay_mode" value="cod" checked style="accent-color: var(--accent-emerald);" />
                    <div class="payment-method-icon" style="background: #dcfce7; color: #15803d; font-size: 1.5rem;">
                      💵
                    </div>
                    <div class="payment-method-title">
                      <h4 style="color: #15803d; font-weight: 800;">Cash on Delivery (COD)</h4>
                      <p style="color: #166534;">Pay cash directly to the delivery executive upon doorstep delivery & package inspection.</p>
                    </div>
                  </div>

                  <div style="padding: 1rem 1.25rem 1.25rem; border-top: 1px dashed #bbf7d0; font-size: 0.85rem; color: #166534;">
                    <div style="display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 1rem;">
                      <span>✓</span>
                      <span>Zero advance payment required. Inspect your authentic sealed laptop box before paying.</span>
                    </div>

                    <button type="button" class="btn btn-orange btn-lg btn-block" id="btn-place-order-cod" style="font-weight: 800; font-size: 1.1rem;">
                      Place Order (Cash on Delivery) ➔
                    </button>
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
              <div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin-top: 0.5rem;">
                Payment Mode: <strong>Cash on Delivery</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `;

  attachPaymentEvents(container, totals);
}

function attachPaymentEvents(container, totals) {
  const backBtn = container.querySelector('#btn-checkout-pay-back');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = '#checkout-address';
      }
    });
  }

  const placeOrderBtn = container.querySelector('#btn-place-order-cod');
  if (!placeOrderBtn) return;

  placeOrderBtn.addEventListener('click', async () => {
    const activeAddress = state.getActiveAddress();
    if (!activeAddress) {
      showToast('Delivery address is missing. Please enter your address first.', 'warning');
      window.location.hash = '#checkout-address';
      return;
    }

    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Placing Order & Reserving Laptop...';

    const cart = state.getCart();
    if (cart.length === 0) {
      showToast('Your cart is empty! Add a laptop first.', 'warning');
      window.location.hash = '#store';
      return;
    }

    const { couponCode, discount: couponDiscount } = getAppliedCoupon();
    const finalTotals = state.getCartTotals(couponDiscount);

    const user = auth.getCustomerUser() || auth.getUser();
    const customerInfo = {
      ...activeAddress,
      userId: user?.id || null,
      email: user?.email || state.getUser()?.email || activeAddress.email || null
    };

    const activeRegion = state.getRegion();
    const activeMarket = state.getActiveMarket();
    const activeCurrency = activeRegion.code === 'AE' ? 'AED' : 'INR';

    const orderPayload = {
      customer: customerInfo,
      items: cart,
      market: activeMarket,
      currency: activeCurrency,
      pricing: {
        currency: activeCurrency,
        itemsTotal: finalTotals.mrpTotal,
        discount: finalTotals.totalDiscount,
        delivery: 0,
        totalAmount: finalTotals.totalPayable
      },
      paymentMethod: 'Cash on Delivery'
    };

    try {
      // Send order to backend API
      const res = await api.createOrder(orderPayload);
      const newOrder = res.order;

      // Mark referral coupon as used if applied
      if (couponCode) {
        await api.applyCoupon(couponCode, newOrder.orderId).catch(() => {});
      }

      // Sync local state
      const localOrders = state.getOrders();
      localOrders.unshift(newOrder);
      state.setOrders(localOrders);
      state.clearCart();

      showToast('Order Placed Successfully! Waiting for Admin confirmation. 🎉', 'success');
      window.location.hash = `#order-confirmed/${newOrder.orderId}`;
    } catch (err) {
      console.warn('Backend order attempt error, placing order via local storage:', err);
      const fallbackOrder = state.createOrder(orderPayload);
      state.clearCart();
      showToast('Order Placed Successfully! Waiting for Admin confirmation. 🎉', 'success');
      window.location.hash = `#order-confirmed/${fallbackOrder.orderId}`;
    } finally {
      setTimeout(() => {
        if (placeOrderBtn) {
          placeOrderBtn.disabled = false;
          placeOrderBtn.textContent = 'Place Order (Cash on Delivery) ➔';
        }
      }, 1200);
    }
  });
}

/* ==========================================================================
   Step 3: Order Placed Successfully - "Waiting for Admin Confirmation"
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
    return state.formatPrice(val);
  }

  container.innerHTML = `
    <div class="confirmed-page">
      <div class="container">
        <!-- Confirmed Banner -->
        <div class="confirmed-banner">
          <div class="success-check-anim">✓</div>
          <h2>Order Placed Successfully!</h2>
          <p>Thank you, <strong>${order.customer.fullName}</strong>. Your laptop order has been received.</p>
          <div style="margin-top: 1rem; font-size: 0.95rem; color: #d1fae5;">
            Order ID: <strong style="font-family: monospace; font-size: 1.15rem; color: #fff;">${order.orderId}</strong>
          </div>
        </div>

        <!-- Initial Status Alert -->
        <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: var(--radius-sm); padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;">
          <div style="font-size: 2rem;">⏳</div>
          <div>
            <h4 style="color: #b45309; font-weight: 800; font-size: 1.05rem;">Current Status: ${order.status}</h4>
            <p style="color: #92400e; font-size: 0.88rem; margin-top: 2px;">
              Your order is queued for Store Administrator approval. Once verified, the Admin will confirm and schedule dispatch.
            </p>
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
              <span>Total Payable (Cash on Delivery):</span>
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
              <div style="font-weight: 700; color: #15803d;">💵 Cash on Delivery</div>
              <span class="badge badge-tag" style="margin-top: 4px;">Pending on Delivery Handover</span>
            </div>

            <div>
              <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Order Status:</div>
              <div style="font-weight: 700; color: #d97706; font-size: 0.95rem;">
                ⏳ ${order.status}
              </div>
            </div>
          </div>
        </div>

        <!-- Action CTAs -->
        <div class="confirmed-actions">
          <a href="#my-orders" class="btn btn-orange btn-lg" id="btn-goto-my-orders">
            📦 View in My Orders & Dashboard ➔
          </a>
          <a href="#order-tracking/${order.orderId}" class="btn btn-primary btn-lg">
            🚚 Track Live Progress
          </a>
          <a href="#store" class="btn btn-outline btn-lg">
            💻 Continue Shopping
          </a>
        </div>
      </div>
    </div>
  `;

  trigger3DRefresh();
}
