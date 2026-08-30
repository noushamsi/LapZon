/**
 * LapKart Central State Store
 * Handles localStorage persistence, reactive state management, product CRUD,
 * cart operations, order processing, and admin dispatch.
 */

import { INITIAL_PRODUCTS, INITIAL_ORDERS, SAVED_ADDRESSES } from './data.js';

const memoryStorage = {};
const safeStorage = {
  getItem: (k) => typeof localStorage !== 'undefined' ? localStorage.getItem(k) : (memoryStorage[k] || null),
  setItem: (k, v) => typeof localStorage !== 'undefined' ? localStorage.setItem(k, v) : (memoryStorage[k] = String(v)),
  removeItem: (k) => typeof localStorage !== 'undefined' ? localStorage.removeItem(k) : (delete memoryStorage[k]),
  clear: () => typeof localStorage !== 'undefined' ? localStorage.clear() : Object.keys(memoryStorage).forEach(k => delete memoryStorage[k])
};

const STORAGE_KEYS = {
  PRODUCTS: 'lapkart_products_v2',
  DRAFTS: 'lapkart_admin_drafts_v2',
  CART: 'lapkart_cart_v2',
  ORDERS: 'lapkart_orders_v2',
  ADDRESSES: 'lapkart_addresses_v2',
  ACTIVE_ADDRESS: 'lapkart_active_address_v2',
  WISHLIST: 'lapkart_wishlist_v2'
};

class StateStore {
  constructor() {
    this.listeners = new Map();
    this.init();
  }

  init() {
    // Check if products exist in storage; if not, seed with INITIAL_PRODUCTS
    if (!safeStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.setProducts(INITIAL_PRODUCTS);
    }
    if (!safeStorage.getItem(STORAGE_KEYS.ORDERS)) {
      this.setOrders([]);
    }
    if (!safeStorage.getItem(STORAGE_KEYS.ADDRESSES)) {
      this.setAddresses([]);
    }
    if (!safeStorage.getItem(STORAGE_KEYS.CART)) {
      this.setCart([]);
    }
    if (!safeStorage.getItem(STORAGE_KEYS.DRAFTS)) {
      this.setDrafts([]);
    }
    if (!safeStorage.getItem(STORAGE_KEYS.WISHLIST)) {
      this.setWishlist([]);
    }
  }

  // Subscribe to changes for a specific slice
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  notify(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in subscriber for ${event}:`, e);
        }
      });
    }
  }

  // --- PRODUCTS ---
  getProducts() {
    try {
      const raw = safeStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const parsed = raw ? JSON.parse(raw) : null;
      return (Array.isArray(parsed) && parsed.length > 0) ? parsed : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id) || null;
  }

  setProducts(products) {
    safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.notify('products', products);
  }

  addProduct(productData, isApproved = true) {
    const products = this.getProducts();
    const newProduct = {
      id: `lap-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      rating: 4.5,
      reviewsCount: 1,
      isBestSeller: false,
      isDealOfTheDay: false,
      tag: "New Arrival",
      ...productData
    };

    if (isApproved) {
      products.unshift(newProduct);
      this.setProducts(products);
      return newProduct;
    } else {
      const drafts = this.getDrafts();
      drafts.unshift(newProduct);
      this.setDrafts(drafts);
      return newProduct;
    }
  }

  updateProduct(id, updates) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      this.setProducts(products);
      return products[index];
    }
    return null;
  }

  toggleProductStock(id) {
    const products = this.getProducts();
    const product = products.find(p => p.id === id);
    if (product) {
      product.inStock = !product.inStock;
      if (product.inStock && product.stock === 0) {
        product.stock = 10;
      }
      this.setProducts(products);
      return product;
    }
    return null;
  }

  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.setProducts(products);
  }

  // --- DRAFTS / OWNER CONFIRMATION QUEUE ---
  getDrafts() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.DRAFTS)) || [];
    } catch {
      return [];
    }
  }

  setDrafts(drafts) {
    safeStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    this.notify('drafts', drafts);
  }

  confirmDraftProduct(draftId) {
    const drafts = this.getDrafts();
    const draftIndex = drafts.findIndex(d => d.id === draftId);
    if (draftIndex !== -1) {
      const [approvedProduct] = drafts.splice(draftIndex, 1);
      this.setDrafts(drafts);

      const products = this.getProducts();
      products.unshift(approvedProduct);
      this.setProducts(products);
      return approvedProduct;
    }
    return null;
  }

  rejectDraftProduct(draftId) {
    const drafts = this.getDrafts().filter(d => d.id !== draftId);
    this.setDrafts(drafts);
  }

  // --- CART ---
  getCart() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.CART)) || [];
    } catch {
      return [];
    }
  }

  setCart(cart) {
    safeStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    this.notify('cart', cart);
  }

  addToCart(productId, quantity = 1, productObj = null) {
    let product = productObj || this.getProductById(productId);
    if (!product) {
      const allProds = this.getProducts();
      product = allProds.find(p => p.id === productId);
    }
    if (!product) {
      return { success: false, message: "Product details not found." };
    }
    if (product.inStock === false || (product.stock !== undefined && Number(product.stock) <= 0)) {
      return { success: false, message: "Product is currently out of stock!" };
    }

    const defaultImg = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
    const prodImg = (product.image && product.image.trim()) ? product.image : defaultImg;

    const cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.id === productId);

    if (existingIndex !== -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        image: prodImg,
        price: Number(product.price),
        mrp: Number(product.mrp || product.price),
        discount: Number(product.discount || 0),
        specsSummary: `${product.processor || ''} | ${product.ram || ''} | ${product.storage || ''}`,
        quantity
      });
    }

    this.setCart(cart);
    return { success: true, message: `"${product.name}" added to cart!` };
  }

  updateCartQuantity(productId, delta) {
    let cart = this.getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
      }
      this.setCart(cart);
    }
  }

  removeFromCart(productId) {
    const cart = this.getCart().filter(i => i.id !== productId);
    this.setCart(cart);
  }

  clearCart() {
    this.setCart([]);
  }

  getCartTotals(couponDiscount = 0) {
    const cart = this.getCart();
    const itemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);
    const mrpTotal = cart.reduce((sum, i) => sum + (i.mrp * i.quantity), 0);
    const sellingTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const catalogDiscount = mrpTotal - sellingTotal;
    const finalDiscount = catalogDiscount + couponDiscount;
    const delivery = sellingTotal > 500 ? 0 : 99;
    const packaging = sellingTotal > 0 ? 99 : 0;
    const totalPayable = Math.max(0, sellingTotal - couponDiscount + (packaging > 0 ? 0 : 0)); // free delivery promo

    return {
      itemsCount,
      mrpTotal,
      sellingTotal,
      catalogDiscount,
      couponDiscount,
      totalDiscount: finalDiscount,
      delivery,
      packaging: 0,
      totalPayable: sellingTotal - couponDiscount
    };
  }

  // --- WISHLIST ---
  getWishlist() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.WISHLIST)) || [];
    } catch {
      return [];
    }
  }

  setWishlist(wishlist) {
    safeStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
    this.notify('wishlist', wishlist);
  }

  toggleWishlist(productId) {
    let list = this.getWishlist();
    const exists = list.includes(productId);
    if (exists) {
      list = list.filter(id => id !== productId);
    } else {
      list.push(productId);
    }
    this.setWishlist(list);
    return !exists;
  }

  // --- ADDRESSES ---
  getAddresses() {
    try {
      const raw = safeStorage.getItem(STORAGE_KEYS.ADDRESSES);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(parsed)) return [];
      
      // Deduplicate addresses by key details (phone + houseNo + pinCode)
      const seen = new Set();
      const unique = [];
      for (const addr of parsed) {
        if (!addr || !addr.phone) continue;
        const key = `${addr.phone}_${(addr.houseNo || '').toLowerCase()}_${addr.pinCode}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(addr);
        }
      }
      return unique;
    } catch {
      return [];
    }
  }

  setAddresses(addresses) {
    safeStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(addresses || []));
    this.notify('addresses', addresses || []);
  }

  getActiveAddress() {
    try {
      const saved = safeStorage.getItem(STORAGE_KEYS.ACTIVE_ADDRESS);
      if (saved) return JSON.parse(saved);
    } catch {}
    const addrs = this.getAddresses();
    return addrs[0] || null;
  }

  setActiveAddress(address) {
    safeStorage.setItem(STORAGE_KEYS.ACTIVE_ADDRESS, JSON.stringify(address));
    this.notify('activeAddress', address);
  }

  addAddress(addressData) {
    let addresses = this.getAddresses();
    // Remove identical previous address
    addresses = addresses.filter(a => !(a.phone === addressData.phone && a.houseNo === addressData.houseNo && a.pinCode === addressData.pinCode));
    const newAddress = {
      id: `addr-${Date.now()}`,
      ...addressData,
      isDefault: addresses.length === 0
    };
    addresses.unshift(newAddress);
    this.setAddresses(addresses);
    this.setActiveAddress(newAddress);
    return newAddress;
  }

  deleteAddress(id) {
    let addresses = this.getAddresses().filter(a => a.id !== id);
    this.setAddresses(addresses);
    const active = this.getActiveAddress();
    if (active && active.id === id) {
      this.setActiveAddress(addresses[0] || null);
    }
    return addresses;
  }

  // --- ORDERS ---
  getOrders() {
    try {
      const raw = safeStorage.getItem(STORAGE_KEYS.ORDERS);
      const parsed = raw ? JSON.parse(raw) : null;
      return (Array.isArray(parsed)) ? parsed : [];
    } catch {
      return [];
    }
  }

  setOrders(orders) {
    safeStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders || []));
    this.notify('orders', orders || []);
  }

  getOrderById(orderId) {
    return this.getOrders().find(o => o.orderId === orderId) || null;
  }

  createOrder({ customer, items, pricing, paymentMethod }) {
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    const orderId = `OD-LK-${randomDigits}`;
    const now = new Date();

    // Calculate expected delivery date (3 days from now)
    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 3);
    const expectedDateStr = expectedDelivery.toISOString().split('T')[0];

    const newOrder = {
      orderId,
      createdAt: now.toISOString(),
      customer,
      items,
      pricing,
      paymentMethod,
      paymentStatus: paymentMethod.toLowerCase().includes('cash on delivery') ? 'Pending (COD)' : 'Paid',
      status: 'Confirmed',
      deliveryDetails: {
        courierPartner: 'Ekart Express Logistics',
        trackingNumber: `EK-EXP-${Math.floor(10000000 + Math.random() * 90000000)}IN`,
        currentLocation: 'LapKart Fulfillment Center, Electronic City, Bengaluru',
        expectedDate: expectedDateStr,
        deliveredAt: null
      },
      timeline: [
        {
          stage: "Order Confirmed",
          timestamp: now.toISOString(),
          completed: true,
          note: `Order placed successfully with payment mode: ${paymentMethod}.`
        },
        {
          stage: "Product Packed",
          timestamp: null,
          completed: false,
          note: "Item verification and anti-static bubble packaging scheduled."
        },
        {
          stage: "Shipped",
          timestamp: null,
          completed: false,
          note: "Courier assignment pending."
        },
        {
          stage: "In Transit",
          timestamp: null,
          completed: false,
          note: "Highway express transit to destination hub."
        },
        {
          stage: "Out for Delivery",
          timestamp: null,
          completed: false,
          note: "Local hub dispatch & delivery executive assignment."
        },
        {
          stage: "Delivered",
          timestamp: null,
          completed: false,
          note: "Handover to recipient."
        }
      ]
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    this.setOrders(orders);

    // Deduct stock for ordered items
    const products = this.getProducts();
    items.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        if (prod.stock === 0) prod.inStock = false;
      }
    });
    this.setProducts(products);

    return newOrder;
  }

  updateOrderStatus(orderId, nextStatus, customDetails = {}) {
    const STAGES = ["Confirmed", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered"];
    const orders = this.getOrders();
    const order = orders.find(o => o.orderId === orderId);

    if (!order) return null;

    order.status = nextStatus;
    const now = new Date().toISOString();

    if (customDetails.courierPartner !== undefined) order.deliveryDetails.courierPartner = customDetails.courierPartner;
    if (customDetails.trackingNumber !== undefined) order.deliveryDetails.trackingNumber = customDetails.trackingNumber;
    if (customDetails.deliveryPersonName !== undefined) order.deliveryDetails.deliveryPersonName = customDetails.deliveryPersonName;
    if (customDetails.deliveryPersonPhone !== undefined) order.deliveryDetails.deliveryPersonPhone = customDetails.deliveryPersonPhone;
    if (customDetails.currentLocation !== undefined) order.deliveryDetails.currentLocation = customDetails.currentLocation;
    if (customDetails.expectedDate !== undefined) order.deliveryDetails.expectedDate = customDetails.expectedDate;

    if (nextStatus === "Delivered") {
      order.deliveryDetails.deliveredAt = now;
      order.paymentStatus = "Paid";
    }

    const currentStageIndex = STAGES.indexOf(nextStatus);

    order.timeline = order.timeline.map((item, idx) => {
      const isPastOrCurrent = idx <= currentStageIndex;
      let timestamp = item.timestamp;
      if (isPastOrCurrent && !timestamp) {
        timestamp = now;
      }
      return {
        ...item,
        completed: isPastOrCurrent,
        timestamp: isPastOrCurrent ? timestamp : null
      };
    });

    this.setOrders(orders);
    return order;
  }

  // Reset entire application to initial demo state
  resetToDemoData() {
    safeStorage.clear();
    this.setProducts(INITIAL_PRODUCTS);
    this.setOrders(INITIAL_ORDERS);
    this.setAddresses(SAVED_ADDRESSES);
    this.setCart([]);
    this.setDrafts([]);
    this.setWishlist([]);
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  }
}

export const state = new StateStore();
