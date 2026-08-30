/**
 * Store Component - Flipkart Style Laptop Catalog
 * Multi-faceted filtering, instant search, sorting, and live API synchronization.
 */

import { api } from '../services/api.js';
import { state } from '../state.js';
import { showToast } from '../app.js';

export async function renderStorePage(container, queryParams = {}) {
  let activeSearch = queryParams.q ? decodeURIComponent(queryParams.q) : '';
  let activeCategory = queryParams.cat || 'All';
  let activeSort = 'featured';
  let selectedBrands = [];
  let selectedRams = [];
  let selectedProcessors = [];
  let selectedScreenSizes = [];
  let minRating = 0;
  let maxPrice = 250000;
  let inStockOnly = false;
  let loadedProducts = [];
  let isLoading = true;

  function formatPrice(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  async function fetchProducts() {
    try {
      isLoading = true;
      const res = await api.getProducts();
      loadedProducts = res.products || [];
    } catch (err) {
      console.warn('Backend fetch failed, falling back to local store:', err);
      loadedProducts = state.getProducts().filter(p => p.status !== 'pending');
    } finally {
      isLoading = false;
      renderLayout();
    }
  }

  function getFilteredProducts() {
    let products = [...loadedProducts];

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

  function renderLayout() {
    if (isLoading) {
      container.innerHTML = `
        <div class="container" style="padding: 5rem 1rem; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">💻⏳</div>
          <h3>Loading Laptop Catalog...</h3>
          <p style="color: var(--text-muted);">Fetching latest verified stock from LapKart database.</p>
        </div>
      `;
      return;
    }

    const products = getFilteredProducts();
    const wishlist = state.getWishlist();

    container.innerHTML = `
      <div class="store-page">
        <div class="container">
          <div class="store-layout">
            <!-- Sidebar Filter Panel -->
            <aside class="filters-sidebar">
              <div class="filter-header">
                <h3>Filters</h3>
                <button type="button" class="btn-clear-filters" id="btn-reset-filters">CLEAR ALL</button>
              </div>

              <!-- Stock Availability Toggle -->
              <div class="filter-section">
                <div class="stock-toggle-box">
                  <span>In Stock Only</span>
                  <input type="checkbox" id="filter-stock-toggle" ${inStockOnly ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                </div>
              </div>

              <!-- Price Filter Slider -->
              <div class="filter-section">
                <div class="filter-title">
                  <span>Price Range</span>
                </div>
                <div class="price-slider-wrap">
                  <input 
                    type="range" 
                    id="price-range-slider" 
                    min="30000" 
                    max="250000" 
                    step="5000" 
                    value="${maxPrice}"
                  />
                  <div class="price-labels">
                    <span>Min: ₹30,000</span>
                    <strong id="price-slider-val">Max: ${formatPrice(maxPrice)}</strong>
                  </div>
                </div>
              </div>

              <!-- Brand Filter -->
              <div class="filter-section">
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

              <!-- Processor Filter -->
              <div class="filter-section">
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

              <!-- RAM Filter -->
              <div class="filter-section">
                <div class="filter-title">RAM Capacity</div>
                <div class="filter-options-list">
                  ${['8GB', '16GB', '18GB', '32GB'].map(ram => `
                    <label class="filter-checkbox-label">
                      <input type="checkbox" class="filter-ram-chk" value="${ram}" ${selectedRams.includes(ram) ? 'checked' : ''}>
                      <span>${ram}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- Screen Size -->
              <div class="filter-section">
                <div class="filter-title">Screen Size</div>
                <div class="filter-options-list">
                  <label class="filter-checkbox-label">
                    <input type="checkbox" class="filter-screen-chk" value="compact" ${selectedScreenSizes.includes('compact') ? 'checked' : ''}>
                    <span>13" to 14.2" (Compact)</span>
                  </label>
                  <label class="filter-checkbox-label">
                    <input type="checkbox" class="filter-screen-chk" value="standard" ${selectedScreenSizes.includes('standard') ? 'checked' : ''}>
                    <span>15.6" (Standard Workspace)</span>
                  </label>
                  <label class="filter-checkbox-label">
                    <input type="checkbox" class="filter-screen-chk" value="large" ${selectedScreenSizes.includes('large') ? 'checked' : ''}>
                    <span>16" to 17.3" (Large Display)</span>
                  </label>
                </div>
              </div>

              <!-- Customer Rating Filter -->
              <div class="filter-section">
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
            </aside>

            <!-- Main Catalog Area -->
            <main class="catalog-main">
              <!-- Top Toolbar -->
              <div class="catalog-toolbar">
                <div class="results-count">
                  Showing <strong>${products.length}</strong> laptops
                  ${activeCategory !== 'All' ? ` in <em>${activeCategory}</em>` : ''}
                  ${activeSearch ? ` matching "<em>${activeSearch}</em>"` : ''}
                </div>

                <!-- Sorting Bar -->
                <div class="sorting-group">
                  <span class="sort-label">Sort By:</span>
                  <div class="sort-tabs">
                    <button class="sort-tab-btn ${activeSort === 'featured' ? 'active' : ''}" data-sort="featured">Popularity</button>
                    <button class="sort-tab-btn ${activeSort === 'price-asc' ? 'active' : ''}" data-sort="price-asc">Price -- Low to High</button>
                    <button class="sort-tab-btn ${activeSort === 'price-desc' ? 'active' : ''}" data-sort="price-desc">Price -- High to Low</button>
                    <button class="sort-tab-btn ${activeSort === 'rating' ? 'active' : ''}" data-sort="rating">Customer Rating</button>
                    <button class="sort-tab-btn ${activeSort === 'discount' ? 'active' : ''}" data-sort="discount">Discount</button>
                  </div>
                </div>
              </div>

              <!-- Product List Grid -->
              ${products.length === 0 ? `
                <div class="empty-catalog">
                  <div class="empty-catalog-icon">🔍💻</div>
                  <h3>No laptops match your criteria</h3>
                  <p>Try resetting filters or searching with broader keywords like "Intel", "MacBook", or "Gaming".</p>
                  <button type="button" class="btn btn-primary" id="btn-empty-reset">Reset All Filters</button>
                </div>
              ` : `
                <div class="products-list-wrap">
                  ${products.map(product => {
                    const isWishlisted = wishlist.includes(product.id);
                    const isInStock = product.inStock && product.stock > 0;

                    return `
                      <div class="product-row-card" data-id="${product.id}">
                        <!-- Col 1: Image & Wishlist -->
                        <div class="product-card-img-col">
                          <div class="product-img-wrapper" data-action="quickview" data-id="${product.id}">
                            <img src="${product.image}" alt="${product.name}" loading="lazy" />
                          </div>
                          <button 
                            class="product-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                            data-action="wishlist" 
                            data-id="${product.id}"
                            title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
                          >
                            ${isWishlisted ? '❤️' : '🤍'}
                          </button>
                        </div>

                        <!-- Col 2: Name, Rating & Key Highlights -->
                        <div class="product-card-info-col" data-action="quickview" data-id="${product.id}" style="cursor: pointer;">
                          <div class="product-title-row">
                            <h3 class="product-title" data-action="quickview" data-id="${product.id}" style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 0.4rem; line-height: 1.35;">
                              ${product.name}
                            </h3>
                          </div>

                          <div class="product-ratings-row" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 0.75rem;">
                            <span class="badge badge-rating" style="background: #16a34a; color: #fff; font-weight: 800; font-size: 0.82rem; padding: 2px 8px; border-radius: 4px;">${product.rating || 4.5} ★</span>
                            <span class="reviews-text" style="font-size: 0.82rem; color: #64748b; font-weight: 600;">(${Number(product.reviewsCount || 120).toLocaleString('en-IN')} Ratings & Reviews)</span>
                            <span class="badge badge-assured" style="background: #2563eb; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 4px;">⚡ Assured</span>
                            ${product.tag ? `<span class="badge badge-tag" style="background: #fef3c7; color: #92400e; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 4px;">${product.tag}</span>` : ''}
                          </div>

                          <!-- Key Highlight Chips -->
                          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 0.75rem;">
                            <span style="background: #f1f5f9; color: #334155; font-size: 0.8rem; font-weight: 600; padding: 3px 8px; border-radius: 4px;">🚀 ${product.processor}</span>
                            <span style="background: #f1f5f9; color: #334155; font-size: 0.8rem; font-weight: 600; padding: 3px 8px; border-radius: 4px;">⚡ ${product.ram} | ${product.storage}</span>
                            <span style="background: #f1f5f9; color: #334155; font-size: 0.8rem; font-weight: 600; padding: 3px 8px; border-radius: 4px;">🖥️ ${product.display}</span>
                          </div>

                          <div style="font-size: 0.82rem; color: #16a34a; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                            <span>🛡️ 1 Year Warranty • 7 Days Replacement</span>
                            <span style="color: #2874f0; margin-left: auto; font-weight: 700;">View Full Specs ➔</span>
                          </div>
                        </div>

                        <!-- Col 3: Price, Stock & Buttons -->
                        <div class="product-card-price-col">
                          <div class="price-block">
                            <div class="current-price">${formatPrice(product.price)}</div>
                            <div class="original-price-row">
                              <span class="mrp-price">${formatPrice(product.mrp)}</span>
                              <span class="discount-tag">${product.discount}% off</span>
                            </div>
                            <div class="delivery-promo">
                              <strong>Free Delivery</strong> by Express Air
                            </div>
                            <div class="bank-offer-note">
                              💳 ₹5,000 off with Coupon LAPTOP5000
                            </div>
                          </div>

                          <!-- Stock Status Badge -->
                          <div class="product-stock-status-row">
                            ${isInStock ? `
                              <span class="badge badge-in-stock">
                                ✓ In Stock ${product.stock <= 5 ? `(Only ${product.stock} left!)` : ''}
                              </span>
                            ` : `
                              <span class="badge badge-out-stock">
                                ✕ Currently Out of Stock
                              </span>
                            `}
                          </div>

                          <!-- Buttons -->
                          <div class="card-actions-group">
                            ${isInStock ? `
                              <button class="btn btn-orange btn-block btn-buy-now" data-action="buy-now" data-id="${product.id}">
                                ⚡ Buy Now
                              </button>
                              <button class="btn btn-outline-primary btn-block btn-add-cart" data-action="add-cart" data-id="${product.id}">
                                🛒 Add to Cart
                              </button>
                            ` : `
                              <button class="btn btn-outline btn-block" disabled>
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
  }

  function attachStoreEvents() {
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
    container.addEventListener('click', (e) => {
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
        window.location.hash = '#checkout-address';
      } else if (action === 'wishlist') {
        const added = state.toggleWishlist(productId);
        api.toggleWishlist(productId).catch(() => {});
        showToast(added ? `Added "${product.name}" to Wishlist! ❤️` : `Removed from Wishlist.`, 'success');
        renderLayout();
      } else if (action === 'quickview' || action === 'view-product') {
        window.location.hash = `#product/${productId}`;
      }
    });
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

  // Initial fetch from backend
  await fetchProducts();
}

