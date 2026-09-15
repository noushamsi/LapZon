/**
 * Store Component - Flipkart Style Laptop Catalog
 * Multi-faceted filtering, instant search, sorting, and live API synchronization.
 */

import { api } from '../services/api.js';
import { state } from '../state.js';
import { auth } from '../services/auth.js';
import { showToast, trigger3DRefresh } from '../app.js';
import { openAuthModal } from './authModal.js';

export async function renderStorePage(container, queryParams = {}) {
  let activeSearch = queryParams.q ? decodeURIComponent(queryParams.q) : '';
  let activeCategory = queryParams.cat || 'All';
  let activeSort = 'featured';
  let selectedBrands = [];
  let selectedRams = [];
  let selectedProcessors = [];
  let selectedScreenSizes = [];
  let minRating = 0;
  const isUAE = state.getActiveMarket() === 'UAE';
  const minSliderPrice = isUAE ? 500 : 30000;
  const maxSliderPrice = isUAE ? 10000 : 250000;
  const sliderStep = isUAE ? 100 : 5000;
  let maxPrice = maxSliderPrice;
  let inStockOnly = false;
  let loadedProducts = [];
  let isLoading = true;

  function formatPrice(val) {
    return state.formatPrice(val);
  }

  async function fetchProducts() {
    try {
      isLoading = true;
      const activeMarket = state.getActiveMarket();
      const res = await api.getProducts({ market: activeMarket });
      const prods = res.products || [];
      loadedProducts = state.filterProductsByMarket(prods, activeMarket);
    } catch (err) {
      console.warn('Backend fetch failed, falling back to local store:', err);
      const activeMarket = state.getActiveMarket();
      loadedProducts = state.filterProductsByMarket(state.getProducts().filter(p => p.status !== 'pending'), activeMarket);
    } finally {
      isLoading = false;
      renderLayout();
    }
  }

  function getFilteredProducts() {
    const activeMarket = state.getActiveMarket();
    let products = state.filterProductsByMarket(loadedProducts, activeMarket);

    // 1. Search Query
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.processor.toLowerCase().includes(q) ||
        p.graphics.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.series && p.series.toLowerCase().includes(q))
      );
    }

    // 2. Category
    if (activeCategory !== 'All') {
      products = products.filter(p => p.category && p.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // 3. Brands
    if (selectedBrands.length > 0) {
      products = products.filter(p => selectedBrands.includes(p.brand));
    }

    // 4. RAM
    if (selectedRams.length > 0) {
      products = products.filter(p => {
        return selectedRams.some(r => p.ram.toLowerCase().includes(r.toLowerCase()));
      });
    }

    // 5. Processor
    if (selectedProcessors.length > 0) {
      products = products.filter(p => {
        return selectedProcessors.some(proc => p.processor.toLowerCase().includes(proc.toLowerCase()));
      });
    }

    // 6. Screen Size
    if (selectedScreenSizes.length > 0) {
      products = products.filter(p => {
        const sizeNum = parseFloat(p.screenSize || '15.6');
        return selectedScreenSizes.some(bracket => {
          if (bracket === 'compact') return sizeNum < 14.5;
          if (bracket === 'standard') return sizeNum >= 14.5 && sizeNum <= 15.6;
          if (bracket === 'large') return sizeNum > 15.6;
          return true;
        });
      });
    }

    // 7. Minimum Rating
    if (minRating > 0) {
      products = products.filter(p => (p.rating || 4.0) >= minRating);
    }

    // 8. Max Price
    products = products.filter(p => p.price <= maxPrice);

    // 9. Stock Status Filter
    if (inStockOnly) {
      products = products.filter(p => p.inStock && p.stock > 0);
    }

    // 10. Sorting
    if (activeSort === 'price-asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'price-desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (activeSort === 'rating') {
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (activeSort === 'discount') {
      products.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } else if (activeSort === 'newest') {
      products.sort((a, b) => b.id.localeCompare(a.id));
    }

    return products;
  }

  let showFilters = false;

  function renderLayout() {
    if (isLoading) {
      container.innerHTML = `
        <div class="container" style="padding: 5rem 1rem; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">💻⏳</div>
          <h3>Loading Laptop Catalog...</h3>
          <p style="color: var(--text-muted);">Fetching latest verified stock from LapZon database.</p>
        </div>
      `;
      return;
    }

    const products = getFilteredProducts();
    const wishlist = state.getWishlist();

    let activeFilterCount = 0;
    if (selectedBrands.length > 0) activeFilterCount += selectedBrands.length;
    if (selectedProcessors.length > 0) activeFilterCount += selectedProcessors.length;
    if (selectedRams.length > 0) activeFilterCount += selectedRams.length;
    if (selectedScreenSizes.length > 0) activeFilterCount += selectedScreenSizes.length;
    if (minRating > 0) activeFilterCount += 1;
    if (maxPrice < 250000) activeFilterCount += 1;
    if (inStockOnly) activeFilterCount += 1;

    container.innerHTML = `
      <div class="store-page">
        <div class="container">
          
          <!-- Top Filter & Search Toolbar -->
          <div class="catalog-toolbar" style="margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <button type="button" class="btn ${showFilters ? 'btn-primary' : 'btn-outline'}" id="btn-toggle-filters" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; padding: 0.45rem 1.1rem; border-radius: 8px; cursor: pointer;">
                <span>⚡ ${showFilters ? 'Hide Filters ✕' : 'Filter Laptops ▾'}</span>
                ${activeFilterCount > 0 ? `<span class="badge" style="background: #ef4444; color: #fff; border-radius: 10px; font-size: 0.75rem; padding: 2px 7px; font-weight: 800;">${activeFilterCount}</span>` : ''}
              </button>

              <div class="results-count">
                Showing <strong>${products.length}</strong> laptops
                ${activeCategory !== 'All' ? ` in <em>${activeCategory}</em>` : ''}
                ${activeSearch ? ` matching "<em>${activeSearch}</em>"` : ''}
              </div>
            </div>

            <!-- Sorting Bar -->
            <div class="sorting-group">
              <span class="sort-label">Sort By:</span>
              <div class="sort-tabs">
                <button class="sort-tab-btn ${activeSort === 'featured' ? 'active' : ''}" data-sort="featured">Popularity</button>
                <button class="sort-tab-btn ${activeSort === 'price-asc' ? 'active' : ''}" data-sort="price-asc">Price: Low to High</button>
                <button class="sort-tab-btn ${activeSort === 'price-desc' ? 'active' : ''}" data-sort="price-desc">Price: High to Low</button>
                <button class="sort-tab-btn ${activeSort === 'rating' ? 'active' : ''}" data-sort="rating">Rating</button>
                <button class="sort-tab-btn ${activeSort === 'discount' ? 'active' : ''}" data-sort="discount">Discount</button>
              </div>
            </div>
          </div>

          <!-- Active Filter Chips -->
          ${activeFilterCount > 0 ? `
            <div class="active-filters-bar" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1.25rem; align-items: center;">
              <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 700;">Active Filters:</span>
              ${selectedBrands.map(b => `<span class="filter-pill">${b} <button type="button" data-remove-filter="brand" data-val="${b}">✕</button></span>`).join('')}
              ${selectedProcessors.map(p => `<span class="filter-pill">${p} <button type="button" data-remove-filter="proc" data-val="${p}">✕</button></span>`).join('')}
              ${selectedRams.map(r => `<span class="filter-pill">${r} <button type="button" data-remove-filter="ram" data-val="${r}">✕</button></span>`).join('')}
              ${selectedScreenSizes.map(s => `<span class="filter-pill">${s} <button type="button" data-remove-filter="screen" data-val="${s}">✕</button></span>`).join('')}
              ${minRating > 0 ? `<span class="filter-pill">${minRating}★+ <button type="button" data-remove-filter="rating">✕</button></span>` : ''}
              ${maxPrice < maxSliderPrice ? `<span class="filter-pill">≤ ${formatPrice(maxPrice)} <button type="button" data-remove-filter="price">✕</button></span>` : ''}
              ${inStockOnly ? `<span class="filter-pill">In Stock Only <button type="button" data-remove-filter="stock">✕</button></span>` : ''}
              <button type="button" class="btn-clear-filters" id="btn-clear-all-chips" style="margin-left: 6px; font-weight: 700;">Clear All Filters</button>
            </div>
          ` : ''}

          <div class="store-layout" style="display: block;">
            <!-- Collapsible Filter Panel Directly Above Products Grid -->
            ${showFilters ? `
              <div class="store-filters-top-panel">
                <div class="filters-panel-header">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 800; color: #0f172a; font-size: 1rem;">⚡ Filter Specifications</span>
                    <span style="font-size: 0.82rem; color: #64748b;">(Customise your laptop search)</span>
                  </div>
                  <button type="button" class="btn-clear-filters" id="btn-reset-filters">CLEAR ALL</button>
                </div>

                <div class="filters-panel-grid">
                  <!-- Section 1: Price Range & Stock -->
                  <div class="filter-col-block">
                    <div class="filter-title">Price & Stock</div>
                    <div class="stock-toggle-box" style="margin-bottom: 0.75rem;">
                      <span>In Stock Only</span>
                      <input type="checkbox" id="filter-stock-toggle" ${inStockOnly ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                    </div>
                    <div class="price-slider-wrap">
                      <input 
                        type="range" 
                        id="price-range-slider" 
                        min="${minSliderPrice}" 
                        max="${maxSliderPrice}" 
                        step="${sliderStep}" 
                        value="${maxPrice}"
                      />
                      <div class="price-labels">
                        <span>Min: ${formatPrice(minSliderPrice)}</span>
                        <strong id="price-slider-val">Max: ${formatPrice(maxPrice)}</strong>
                      </div>
                    </div>
                  </div>

                  <!-- Section 2: Brands -->
                  <div class="filter-col-block">
                    <div class="filter-title">Brand</div>
                    <div class="filter-options-list">
                      ${['Apple', 'ASUS', 'Dell', 'HP', 'Lenovo', 'Acer', 'MSI', 'Samsung'].map(brand => `
                        <label class="filter-checkbox-label">
                          <input type="checkbox" class="filter-brand-chk" value="${brand}" ${selectedBrands.includes(brand) ? 'checked' : ''}>
                          <span>${brand}</span>
                        </label>
                      `).join('')}
                    </div>
                  </div>

                  <!-- Section 3: Processor -->
                  <div class="filter-col-block">
                    <div class="filter-title">Processor</div>
                    <div class="filter-options-list">
                      ${[
                        { label: 'Apple M3 / M3 Pro', val: 'M3' },
                        { label: 'Intel Core Ultra 7', val: 'Core Ultra' },
                        { label: 'Intel Core i9', val: 'i9' },
                        { label: 'Intel Core i7', val: 'i7' },
                        { label: 'Intel Core i5', val: 'i5' },
                        { label: 'Intel Core i3', val: 'i3' },
                        { label: 'AMD Ryzen 7', val: 'Ryzen 7' },
                        { label: 'AMD Ryzen 5', val: 'Ryzen 5' }
                      ].map(p => `
                        <label class="filter-checkbox-label">
                          <input type="checkbox" class="filter-proc-chk" value="${p.val}" ${selectedProcessors.includes(p.val) ? 'checked' : ''}>
                          <span>${p.label}</span>
                        </label>
                      `).join('')}
                    </div>
                  </div>

                  <!-- Section 4: RAM & Screen Size -->
                  <div class="filter-col-block">
                    <div class="filter-title">RAM & Display</div>
                    <div class="filter-options-list">
                      ${['8GB', '16GB', '18GB', '32GB'].map(ram => `
                        <label class="filter-checkbox-label">
                          <input type="checkbox" class="filter-ram-chk" value="${ram}" ${selectedRams.includes(ram) ? 'checked' : ''}>
                          <span>${ram} RAM</span>
                        </label>
                      `).join('')}
                      <div style="height: 1px; background: #e2e8f0; margin: 4px 0;"></div>
                      <label class="filter-checkbox-label">
                        <input type="checkbox" class="filter-screen-chk" value="compact" ${selectedScreenSizes.includes('compact') ? 'checked' : ''}>
                        <span>13" - 14" Compact</span>
                      </label>
                      <label class="filter-checkbox-label">
                        <input type="checkbox" class="filter-screen-chk" value="standard" ${selectedScreenSizes.includes('standard') ? 'checked' : ''}>
                        <span>15.6" Standard</span>
                      </label>
                      <label class="filter-checkbox-label">
                        <input type="checkbox" class="filter-screen-chk" value="large" ${selectedScreenSizes.includes('large') ? 'checked' : ''}>
                        <span>16"+ Large</span>
                      </label>
                    </div>
                  </div>

                  <!-- Section 5: Ratings -->
                  <div class="filter-col-block">
                    <div class="filter-title">Customer Ratings</div>
                    <div class="filter-options-list">
                      <label class="filter-checkbox-label">
                        <input type="radio" name="rating-radio" class="filter-rating-radio" value="4.5" ${minRating === 4.5 ? 'checked' : ''}>
                        <span>4.5★ & above</span>
                      </label>
                      <label class="filter-checkbox-label">
                        <input type="radio" name="rating-radio" class="filter-rating-radio" value="4.0" ${minRating === 4.0 ? 'checked' : ''}>
                        <span>4.0★ & above</span>
                      </label>
                      <label class="filter-checkbox-label">
                        <input type="radio" name="rating-radio" class="filter-rating-radio" value="0" ${minRating === 0 ? 'checked' : ''}>
                        <span>All Ratings</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Main Catalog Area: 4-Column Responsive Grid -->
            <main class="catalog-main" style="width: 100%;">
              ${products.length === 0 ? `
                <div class="empty-catalog">
                  <div class="empty-catalog-icon">🔍💻</div>
                  <h3>No laptops match your criteria</h3>
                  <p>Try resetting filters or searching with broader keywords like "Intel", "MacBook", or "Gaming".</p>
                  <button type="button" class="btn btn-primary" id="btn-empty-reset">Reset All Filters</button>
                </div>
              ` : `
                <div class="store-products-grid products-list-wrap">
                  ${products.map(product => {
                    const isWishlisted = wishlist.includes(product.id);
                    const isInStock = product.inStock && product.stock > 0;
                    const discountPct = product.originalPrice > product.price
                      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                      : (product.discount || 14);
                    const originalPrice = product.originalPrice || product.mrp || Math.round(product.price * 1.18);
                    const reviewsCount = product.reviewsCount || (product.reviews ? product.reviews.length : 120);
                    const display = product.display || product.screenSize || '15.6"';

                    return `
                      <div class="product-grid-card" data-id="${product.id}">
                        <!-- Top Bar: Brand & Wishlist -->
                        <div class="product-card-top-bar">
                          <span class="product-brand-tag">${product.brand || 'Laptop'}</span>
                          <button 
                            type="button" 
                            class="product-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                            data-action="wishlist" 
                            data-id="${product.id}"
                            title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
                          >
                            ${isWishlisted ? '❤️' : '🤍'}
                          </button>
                        </div>

                        <!-- Laptop Image -->
                        <div class="product-card-img-wrap" data-action="quickview" data-id="${product.id}">
                          <img src="${product.image}" alt="${product.name}" loading="lazy" />
                        </div>

                        <!-- Card Info -->
                        <div class="product-card-info">
                          <!-- Laptop Name / Model -->
                          <h3 class="product-grid-title" data-action="quickview" data-id="${product.id}" title="${product.name}">
                            ${product.name}
                          </h3>

                          <!-- Rating, Reviews & Stock Status -->
                          <div class="product-meta-row">
                            <div class="product-rating-box">
                              <span class="badge-rating">${product.rating || 4.5} ★</span>
                              <span class="reviews-count">(${Number(reviewsCount).toLocaleString('en-IN')})</span>
                            </div>
                            <span class="stock-badge ${isInStock ? 'in-stock' : 'out-of-stock'}">
                              ${isInStock ? (product.stock <= 5 ? `Only ${product.stock} left` : 'In Stock') : 'Out of Stock'}
                            </span>
                          </div>

                          <!-- Key Specifications -->
                          <div class="product-specs-box">
                            <div class="spec-row" title="Processor">🚀 <span>${product.processor}</span></div>
                            <div class="spec-row" title="Memory & Storage">⚡ <span>${product.ram} | ${product.storage}</span></div>
                            <div class="spec-row" title="Display">🖥️ <span>${display}</span></div>
                          </div>

                          <!-- Pricing Block -->
                          <div class="product-price-box">
                            <div class="price-line">
                              <span class="current-price">${formatPrice(product.price)}</span>
                              <span class="mrp-price">${formatPrice(originalPrice)}</span>
                              <span class="discount-pill">${discountPct}% off</span>
                            </div>
                            <div class="delivery-hint">⚡ Free Express Air Delivery</div>
                          </div>

                          <!-- Action Buttons: Buy Now & Add to Cart -->
                          <div class="product-card-actions">
                            ${isInStock ? `
                              <button type="button" class="btn-card-buy" data-action="buy-now" data-id="${product.id}">
                                ⚡ Buy Now
                              </button>
                              <button type="button" class="btn-card-cart" data-action="add-cart" data-id="${product.id}">
                                🛒 Add to Cart
                              </button>
                            ` : `
                              <button type="button" class="btn-card-disabled" disabled>
                                Out of Stock
                              </button>
                            `}
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </main>
          </div>
        </div>
      </div>

      <!-- Quick View Modal Container -->
      <div id="quickview-modal" class="modal-overlay"></div>
    `;

    attachStoreEvents();
    trigger3DRefresh();
  }

  function attachStoreEvents() {
    // 0. Toggle Filters Drawer / Sidebar
    const toggleFiltersBtn = container.querySelector('#btn-toggle-filters');
    if (toggleFiltersBtn) {
      toggleFiltersBtn.addEventListener('click', () => {
        showFilters = !showFilters;
        renderLayout();
      });
    }

    // 0.1 Remove individual filter chips
    container.querySelectorAll('[data-remove-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.removeFilter;
        const val = btn.dataset.val;
        if (type === 'brand') selectedBrands = selectedBrands.filter(b => b !== val);
        else if (type === 'proc') selectedProcessors = selectedProcessors.filter(p => p !== val);
        else if (type === 'ram') selectedRams = selectedRams.filter(r => r !== val);
        else if (type === 'screen') selectedScreenSizes = selectedScreenSizes.filter(s => s !== val);
        else if (type === 'rating') minRating = 0;
        else if (type === 'price') maxPrice = 250000;
        else if (type === 'stock') inStockOnly = false;
        renderLayout();
      });
    });

    const clearChipsBtn = container.querySelector('#btn-clear-all-chips');
    if (clearChipsBtn) {
      clearChipsBtn.addEventListener('click', () => {
        selectedBrands = [];
        selectedProcessors = [];
        selectedRams = [];
        selectedScreenSizes = [];
        minRating = 0;
        maxPrice = 250000;
        inStockOnly = false;
        renderLayout();
      });
    }

    // 1. Reset Filters
    const resetBtn = container.querySelector('#btn-reset-filters');
    const emptyResetBtn = container.querySelector('#btn-empty-reset');
    [resetBtn, emptyResetBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          activeSearch = '';
          activeCategory = 'All';
          selectedBrands = [];
          selectedRams = [];
          selectedProcessors = [];
          selectedScreenSizes = [];
          minRating = 0;
          maxPrice = 250000;
          inStockOnly = false;
          renderLayout();
        });
      }
    });

    // 2. Stock toggle
    const stockChk = container.querySelector('#filter-stock-toggle');
    if (stockChk) {
      stockChk.addEventListener('change', (e) => {
        inStockOnly = e.target.checked;
        renderLayout();
      });
    }

    // 3. Price Slider
    const priceSlider = container.querySelector('#price-range-slider');
    if (priceSlider) {
      priceSlider.addEventListener('input', (e) => {
        maxPrice = Number(e.target.value);
        const valSpan = container.querySelector('#price-slider-val');
        if (valSpan) valSpan.textContent = `Max: ${formatPrice(maxPrice)}`;
      });
      priceSlider.addEventListener('change', () => {
        renderLayout();
      });
    }

    // 4. Brands Checkboxes
    container.querySelectorAll('.filter-brand-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        selectedBrands = Array.from(container.querySelectorAll('.filter-brand-chk:checked')).map(el => el.value);
        renderLayout();
      });
    });

    // 5. Processor Checkboxes
    container.querySelectorAll('.filter-proc-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        selectedProcessors = Array.from(container.querySelectorAll('.filter-proc-chk:checked')).map(el => el.value);
        renderLayout();
      });
    });

    // 6. RAM Checkboxes
    container.querySelectorAll('.filter-ram-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        selectedRams = Array.from(container.querySelectorAll('.filter-ram-chk:checked')).map(el => el.value);
        renderLayout();
      });
    });

    // 7. Screen Size Checkboxes
    container.querySelectorAll('.filter-screen-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        selectedScreenSizes = Array.from(container.querySelectorAll('.filter-screen-chk:checked')).map(el => el.value);
        renderLayout();
      });
    });

    // 8. Rating Radio
    container.querySelectorAll('.filter-rating-radio').forEach(r => {
      r.addEventListener('change', (e) => {
        minRating = parseFloat(e.target.value);
        renderLayout();
      });
    });

    // 9. Sorting Tabs
    container.querySelectorAll('.sort-tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        activeSort = tab.dataset.sort;
        renderLayout();
      });
    });

    // 10. Product Actions Delegation (Add to Cart, Buy Now, Quickview, Wishlist)
    const storePageEl = container.querySelector('.store-page');
    if (storePageEl) {
      storePageEl.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const productId = target.dataset.id;
        const product = loadedProducts.find(p => p.id === productId);

        if (!product) return;

        if (action === 'add-cart') {
          const res = state.addToCart(productId, 1, product);
          if (res.success) {
            showToast(res.message, 'success');
          } else {
            showToast(res.message, 'warning');
          }
        } else if (action === 'buy-now') {
          if (product.inStock === false) {
            showToast('Product is currently out of stock!', 'error');
            return;
          }
          state.addToCart(productId, 1, product);
          if (!auth.isAuthenticated()) {
            openAuthModal('login', {
              action: 'buy_now',
              productId: product.id,
              productData: product,
              returnHash: window.location.hash || '#store',
              redirectHash: '#checkout-address',
              subtitle: 'Please sign in or create an account to proceed with your laptop order'
            });
          } else {
            window.location.hash = '#checkout-address';
          }
        } else if (action === 'wishlist') {
          const added = state.toggleWishlist(productId);
          api.toggleWishlist(productId).catch(() => {});
          showToast(added ? `Added "${product.name}" to Wishlist! ❤️` : `Removed "${product.name}" from Wishlist.`, 'info');
          renderLayout();
        } else if (action === 'quickview' || action === 'view-product') {
          window.location.hash = `#product/${productId}`;
        }
      });
    }
  }

  function openQuickViewModal(product) {
    window.location.hash = `#product/${product.id}`;
  }

  // Listen to search events dispatched from navbar
  const searchHandler = (e) => {
    activeSearch = e.detail;
    renderLayout();
  };
  window.addEventListener('lapkart:search', searchHandler);
  window.addEventListener('lapkart:region-changed', fetchProducts);

  // Initial fetch from backend
  await fetchProducts();
}

