/**
 * LapKart Persistent JSON Database Layer
 * Atomic file persistence for products, orders, users, and addresses.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Initial seed dataset
const SEED_DATA = {
  users: [
    {
      id: "usr-admin-01",
      name: "Master Admin (Store Owner)",
      email: "admin@lapkart.com",
      password: "Admin@123", // In production hash with bcrypt
      role: "admin",
      createdAt: "2026-08-01T00:00:00.000Z"
    },
    {
      id: "usr-cust-01",
      name: "Rahul Sharma",
      email: "customer@gmail.com",
      password: "User@123",
      role: "user",
      createdAt: "2026-08-15T00:00:00.000Z"
    }
  ],
  products: [
    {
      id: "lap-001",
      name: "Apple MacBook Pro 14 (M3 Pro Chip)",
      brand: "Apple",
      category: "Ultrabook",
      series: "MacBook Pro",
      status: "approved", // 'approved' | 'pending'
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "Apple M3 Pro (11-Core CPU, 14-Core GPU)",
      ram: "18GB",
      ramSize: 18,
      storage: "512GB SSD",
      storageSize: 512,
      screenSize: "14.2",
      display: "14.2-inch Liquid Retina XDR (3024x1964) 120Hz ProMotion",
      graphics: "Integrated Apple 14-Core GPU",
      os: "macOS Sonoma",
      weight: "1.61 kg",
      battery: "Up to 18 Hours Battery Life",
      mrp: 199900,
      price: 179900,
      discount: 10,
      rating: 4.8,
      reviewsCount: 342,
      stock: 12,
      inStock: true,
      isBestSeller: true,
      tag: "Pro Power",
      description: "Supercharged by M3 Pro chip with an advanced 11-core CPU and 14-core GPU. Stunning Liquid Retina XDR display with ProMotion technology."
    },
    {
      id: "lap-002",
      name: "ASUS ROG Strix G16 (2024) Gaming Laptop",
      brand: "ASUS",
      category: "Gaming",
      series: "ROG Strix",
      status: "approved",
      image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "Intel Core i9 14th Gen 14900HX",
      ram: "32GB",
      ramSize: 32,
      storage: "1TB SSD",
      storageSize: 1024,
      screenSize: "16.0",
      display: "16-inch QHD+ 240Hz 3ms ROG Nebula Display (2560x1600)",
      graphics: "NVIDIA GeForce RTX 4070 8GB GDDR6 (140W TGP)",
      os: "Windows 11 Home",
      weight: "2.50 kg",
      battery: "90WHr Battery with 280W Fast Charger",
      mrp: 219990,
      price: 174990,
      discount: 20,
      rating: 4.7,
      reviewsCount: 890,
      stock: 8,
      inStock: true,
      isBestSeller: true,
      tag: "Top Gaming Pick",
      description: "Dominate AAA games and esports with Intel Core i9-14900HX and NVIDIA RTX 4070. ROG Intelligent Cooling with liquid metal and Tri-Fan Technology."
    },
    {
      id: "lap-003",
      name: "Apple MacBook Air 13 (M3 Chip)",
      brand: "Apple",
      category: "Ultrabook",
      series: "MacBook Air",
      status: "approved",
      image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "Apple M3 (8-Core CPU, 10-Core GPU)",
      ram: "16GB",
      ramSize: 16,
      storage: "512GB SSD",
      storageSize: 512,
      screenSize: "13.6",
      display: "13.6-inch Liquid Retina Display with True Tone (2560x1664)",
      graphics: "Integrated Apple 10-Core GPU",
      os: "macOS Sonoma",
      weight: "1.24 kg",
      battery: "Up to 18 Hours Battery Life",
      mrp: 134900,
      price: 119900,
      discount: 11,
      rating: 4.9,
      reviewsCount: 1420,
      stock: 25,
      inStock: true,
      isBestSeller: true,
      tag: "Featherlight",
      description: "Lean, mean, M3 machine. Incredibly thin, fanless silent design, blazing fast neural engine for on-device AI and stunning battery endurance."
    },
    {
      id: "lap-004",
      name: "Dell XPS 13 Plus (Intel Core Ultra 7)",
      brand: "Dell",
      category: "Ultrabook",
      series: "XPS",
      status: "approved",
      image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "Intel Core Ultra 7 155H with Intel AI Boost NPU",
      ram: "16GB",
      ramSize: 16,
      storage: "1TB SSD",
      storageSize: 1024,
      screenSize: "13.4",
      display: "13.4-inch 3.5K OLED InfinityEdge Touch (3456x2160) 400 nits",
      graphics: "Intel Arc Graphics",
      os: "Windows 11 Pro",
      weight: "1.26 kg",
      battery: "55WHr with ExpressCharge",
      mrp: 189990,
      price: 164990,
      discount: 13,
      rating: 4.6,
      reviewsCount: 195,
      stock: 5,
      inStock: true,
      isBestSeller: false,
      tag: "Futuristic Design",
      description: "Zero-lattice keyboard, seamless glass haptic touchpad, capacitive touch function row, and mesmerizing 3.5K OLED touch display."
    },
    {
      id: "lap-005",
      name: "Lenovo Legion Pro 5 Gen 9 AMD Ryzen 7",
      brand: "Lenovo",
      category: "Gaming",
      series: "Legion",
      status: "approved",
      image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "AMD Ryzen 7 7745HX (8-Core, 16-Thread, Up to 5.1GHz)",
      ram: "16GB",
      ramSize: 16,
      storage: "1TB SSD",
      storageSize: 1024,
      screenSize: "16.0",
      display: "16-inch WQXGA (2560x1600) IPS 240Hz 500nits 100% sRGB",
      graphics: "NVIDIA GeForce RTX 4060 8GB GDDR6 (140W TGP)",
      os: "Windows 11 Home",
      weight: "2.55 kg",
      battery: "80WHr Battery with Rapid Charge Pro",
      mrp: 164990,
      price: 134990,
      discount: 18,
      rating: 4.6,
      reviewsCount: 420,
      stock: 14,
      inStock: true,
      isBestSeller: false,
      tag: "Heavy Hitter",
      description: "Lenovo AI Engine+ driven by LA1 AI Chip for optimized frame rates. Legion Coldfront 5.0 thermal technology for peak sustained gaming performance."
    },
    {
      id: "lap-006",
      name: "HP Pavilion 15 (13th Gen Intel Core i5)",
      brand: "HP",
      category: "Student",
      series: "Pavilion",
      status: "approved",
      image: "https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "Intel Core i5 13th Gen 1335U (10 Cores, 12 Threads)",
      ram: "16GB",
      ramSize: 16,
      storage: "512GB SSD",
      storageSize: 512,
      screenSize: "15.6",
      display: "15.6-inch FHD (1920x1080) IPS Anti-Glare Micro-Edge",
      graphics: "Intel Iris Xe Graphics",
      os: "Windows 11 Home + MS Office 2021",
      weight: "1.75 kg",
      battery: "41WHr with Fast Charging",
      mrp: 74990,
      price: 57990,
      discount: 22,
      rating: 4.4,
      reviewsCount: 1830,
      stock: 30,
      inStock: true,
      isBestSeller: true,
      tag: "Value King",
      description: "The ideal everyday powerhouse for college, coding, and work. Audio by B&O, backlit keyboard, fingerprint reader and all-day battery life."
    },
    {
      id: "lap-007",
      name: "Acer Predator Helios 16 Gaming",
      brand: "Acer",
      category: "Gaming",
      series: "Predator",
      status: "approved",
      image: "https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "Intel Core i7 14th Gen 14700HX (20 Cores)",
      ram: "16GB",
      ramSize: 16,
      storage: "1TB SSD",
      storageSize: 1024,
      screenSize: "16.0",
      display: "16-inch WQXGA 240Hz 500nits IPS Display (2560x1600)",
      graphics: "NVIDIA GeForce RTX 4070 8GB GDDR6",
      os: "Windows 11 Home",
      weight: "2.60 kg",
      battery: "90WHr 330W Power Adapter",
      mrp: 179990,
      price: 149990,
      discount: 16,
      rating: 4.5,
      reviewsCount: 310,
      stock: 0,
      inStock: false, // Out of Stock demonstration
      isBestSeller: false,
      tag: "High Demand",
      description: "Features 5th Gen AeroBlade 3D Fan technology, liquid metal thermal grease, and per-key RGB backlit keyboard."
    },
    {
      id: "lap-008",
      name: "Samsung Galaxy Book4 Pro 360 (Intel Core Ultra 7)",
      brand: "Samsung",
      category: "Business",
      series: "Galaxy Book",
      status: "approved",
      image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "Intel Core Ultra 7 155H (16 Cores, NPU AI)",
      ram: "16GB",
      ramSize: 16,
      storage: "512GB SSD",
      storageSize: 512,
      screenSize: "16.0",
      display: "16-inch 3K Dynamic AMOLED 2X Touchscreen 120Hz (2880x1800)",
      graphics: "Intel Arc Graphics",
      os: "Windows 11 Home",
      weight: "1.66 kg",
      battery: "76WHr with 65W USB-C Fast Charger",
      mrp: 182990,
      price: 154990,
      discount: 15,
      rating: 4.7,
      reviewsCount: 220,
      stock: 9,
      inStock: true,
      isBestSeller: false,
      tag: "2-in-1 AMOLED",
      description: "Versatile 2-in-1 convertible with S-Pen included in box. Dynamic AMOLED 2X display with anti-reflective glass."
    },
    {
      id: "lap-009",
      name: "HP Omen 16 (AMD Ryzen 7 7840HS)",
      brand: "HP",
      category: "Gaming",
      series: "Omen",
      status: "approved",
      image: "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "AMD Ryzen 7 7840HS (8 Cores, 16 Threads, Up to 5.1 GHz)",
      ram: "16GB",
      ramSize: 16,
      storage: "1TB SSD",
      storageSize: 1024,
      screenSize: "16.1",
      display: "16.1-inch FHD 165Hz IPS 7ms Anti-Glare (1920x1080)",
      graphics: "NVIDIA GeForce RTX 4060 8GB GDDR6",
      os: "Windows 11 Home",
      weight: "2.37 kg",
      battery: "83WHr Battery",
      mrp: 139990,
      price: 114990,
      discount: 17,
      rating: 4.5,
      reviewsCount: 540,
      stock: 11,
      inStock: true,
      isBestSeller: false,
      tag: "Esports Ready",
      description: "OMEN Tempest Cooling Technology, 4-zone RGB backlit keyboard, Bang & Olufsen sound."
    },
    {
      id: "lap-010",
      name: "Lenovo IdeaPad Slim 3 (13th Gen Intel Core i3)",
      brand: "Lenovo",
      category: "Student",
      series: "IdeaPad",
      status: "approved",
      image: "https://images.unsplash.com/photo-1593642702749-b7d2a804fbcf?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1593642702749-b7d2a804fbcf?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "Intel Core i3 13th Gen 1305U (5 Cores, 6 Threads)",
      ram: "8GB",
      ramSize: 8,
      storage: "512GB SSD",
      storageSize: 512,
      screenSize: "15.6",
      display: "15.6-inch FHD (1920x1080) TN 250nits Anti-Glare",
      graphics: "Intel UHD Graphics",
      os: "Windows 11 Home",
      weight: "1.62 kg",
      battery: "47WHr with Rapid Charge",
      mrp: 49990,
      price: 36990,
      discount: 26,
      rating: 4.2,
      reviewsCount: 2640,
      stock: 45,
      inStock: true,
      isBestSeller: true,
      tag: "Budget Champion",
      description: "Military-grade durability (MIL-STD-810H), privacy camera shutter, Dolby Audio speakers."
    },
    {
      id: "lap-011",
      name: "ASUS Vivobook 15 (AMD Ryzen 5 7520U)",
      brand: "ASUS",
      category: "Student",
      series: "Vivobook",
      status: "approved",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "AMD Ryzen 5 7520U (4 Cores, 8 Threads)",
      ram: "16GB",
      ramSize: 16,
      storage: "512GB SSD",
      storageSize: 512,
      screenSize: "15.6",
      display: "15.6-inch FHD (1920x1080) NanoEdge Anti-Glare",
      graphics: "AMD Radeon 610M",
      os: "Windows 11 Home",
      weight: "1.63 kg",
      battery: "42WHr with Fast Charge",
      mrp: 58990,
      price: 43990,
      discount: 25,
      rating: 4.3,
      reviewsCount: 1180,
      stock: 18,
      inStock: true,
      isBestSeller: false,
      tag: "Super Saver",
      description: "ASUS Antimicrobial Guard Plus protection, 180° lay-flat hinge, full-size ASUS ErgoSense keyboard."
    },
    {
      id: "lap-012",
      name: "MSI Katana 15 (13th Gen Intel Core i7)",
      brand: "MSI",
      category: "Gaming",
      series: "Katana",
      status: "approved",
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "Intel Core i7 13th Gen 13620H (10 Cores, 16 Threads)",
      ram: "16GB",
      ramSize: 16,
      storage: "1TB SSD",
      storageSize: 1024,
      screenSize: "15.6",
      display: "15.6-inch FHD (1920x1080) 144Hz IPS-Level Display",
      graphics: "NVIDIA GeForce RTX 4050 6GB GDDR6",
      os: "Windows 11 Home",
      weight: "2.25 kg",
      battery: "53.5WHr 3-Cell Battery",
      mrp: 114990,
      price: 89990,
      discount: 21,
      rating: 4.4,
      reviewsCount: 680,
      stock: 0,
      inStock: false,
      isBestSeller: false,
      tag: "Sold Out",
      description: "Sharpen your game with Cooler Boost 5 with shared-pipe design for CPU & GPU. 4-zone RGB keyboard."
    },
    // INITIAL PENDING PRODUCTS FOR DEMONSTRATING ADMIN APPROVAL WORKFLOW
    {
      id: "lap-draft-01",
      name: "Acer Swift Go 14 AI OLED (Pending Approval)",
      brand: "Acer",
      category: "Ultrabook",
      series: "Swift Go",
      status: "pending", // Waiting for Admin to approve
      image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"
      ],
      processor: "Intel Core Ultra 7 155H with NPU AI",
      ram: "16GB",
      ramSize: 16,
      storage: "1TB SSD",
      storageSize: 1024,
      screenSize: "14.0",
      display: "14-inch 2.8K 120Hz OLED (2880x1800)",
      graphics: "Intel Arc Graphics",
      os: "Windows 11 Home",
      weight: "1.32 kg",
      battery: "65WHr Battery",
      mrp: 99990,
      price: 79990,
      discount: 20,
      rating: 4.5,
      reviewsCount: 1,
      stock: 15,
      inStock: true,
      isBestSeller: false,
      tag: "Pending Review",
      description: "Submitted by vendor. Requires Admin confirmation before going live in customer store."
    }
  ],
  orders: [
    {
      orderId: "OD-LK-92837418",
      createdAt: "2026-08-28T10:30:00.000Z",
      userId: "usr-cust-01",
      customer: {
        fullName: "Rahul Sharma",
        phone: "9876543210",
        houseNo: "Flat 402, Royal Palms Residency",
        street: "100 Feet Ring Road, Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        pinCode: "560038",
        addressType: "Home"
      },
      items: [
        {
          id: "lap-001",
          name: "Apple MacBook Pro 14 (M3 Pro Chip)",
          brand: "Apple",
          image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
          price: 179900,
          mrp: 199900,
          quantity: 1,
          specsSummary: "Apple M3 Pro | 18GB RAM | 512GB SSD"
        }
      ],
      pricing: {
        itemsTotal: 199900,
        discount: 20000,
        delivery: 0,
        totalAmount: 179900
      },
      paymentMethod: "Google Pay UPI (rahul@okaxis)",
      paymentStatus: "Paid",
      status: "In Transit", // Confirmed, Packed, Shipped, In Transit, Out for Delivery, Delivered
      deliveryDetails: {
        courierPartner: "Ekart Express Logistics",
        trackingNumber: "EK-BLR-84729103IN",
        currentLocation: "Bengaluru East Sorting Hub, Karnataka",
        expectedDate: "2026-09-02",
        deliveredAt: null
      },
      timeline: [
        {
          stage: "Order Confirmed",
          timestamp: "2026-08-28T10:30:00.000Z",
          completed: true,
          note: "Order verified and payment confirmed via Google Pay."
        },
        {
          stage: "Product Packed",
          timestamp: "2026-08-28T16:45:00.000Z",
          completed: true,
          note: "Item securely packed in anti-static tamper-evident casing at Hoskote Central Warehouse."
        },
        {
          stage: "Shipped",
          timestamp: "2026-08-29T09:15:00.000Z",
          completed: true,
          note: "Package handed over to Ekart Logistics. Tracking ID: EK-BLR-84729103IN."
        },
        {
          stage: "In Transit",
          timestamp: "2026-08-29T21:00:00.000Z",
          completed: true,
          note: "Arrived at Bengaluru East Sorting Hub. Sorting in progress."
        },
        {
          stage: "Out for Delivery",
          timestamp: null,
          completed: false,
          note: "Will be assigned to delivery executive on arrival at your local hub."
        },
        {
          stage: "Delivered",
          timestamp: null,
          completed: false,
          note: "Package awaiting final handover."
        }
      ]
    }
  ]
};

class JsonDb {
  constructor() {
    this.ensureDbExists();
  }

  ensureDbExists() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      this.writeDb(SEED_DATA);
    }
  }

  readDb() {
    try {
      this.ensureDbExists();
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading database file, using seed data:', err);
      return SEED_DATA;
    }
  }

  writeDb(data) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing to database:', err);
    }
  }

  getUserByGoogleId(googleId) {
    if (!googleId) return null;
    const db = this.readDb();
    const str = String(googleId).trim();
    return (db.users || []).find(u => u.googleId && String(u.googleId).trim() === str) || null;
  }

  getUserByEmail(email) {
    if (!email) return null;
    const db = this.readDb();
    return db.users.find(u => u.email && u.email.toLowerCase() === String(email).trim().toLowerCase()) || null;
  }

  getUserByPhone(phone) {
    if (!phone) return null;
    const cleanDigits = String(phone).replace(/\D/g, '');
    if (!cleanDigits) return null;
    const db = this.readDb();
    return db.users.find(u => {
      if (!u.phone) return false;
      const uDigits = String(u.phone).replace(/\D/g, '');
      return uDigits === cleanDigits || (cleanDigits.length >= 7 && (uDigits.endsWith(cleanDigits) || cleanDigits.endsWith(uDigits)));
    }) || null;
  }

  getUserByEmailOrPhone(identifier) {
    if (!identifier) return null;
    const str = String(identifier).trim();
    if (str.includes('@')) {
      return this.getUserByEmail(str);
    }
    return this.getUserByPhone(str) || this.getUserByEmail(str);
  }

  getUserById(id) {
    const db = this.readDb();
    return db.users.find(u => u.id === id) || null;
  }

  createUser(userData) {
    const db = this.readDb();
    const newUser = {
      id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      role: 'user',
      createdAt: new Date().toISOString(),
      ...userData
    };
    db.users.push(newUser);
    this.writeDb(db);
    return newUser;
  }

  updateUser(id, updates) {
    const db = this.readDb();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...updates };
    this.writeDb(db);
    return db.users[idx];
  }

  // --- PRODUCTS ---
  // Returns only approved laptops for public user store (optionally filtered by market)
  getApprovedProducts(market = null) {
    const db = this.readDb();
    let products = (db.products || []).filter(p => p.status === 'approved');
    if (market) {
      const tm = market.toLowerCase();
      products = products.filter(p => (p.market || (p.currency === 'AED' ? 'UAE' : 'India')).toLowerCase() === tm);
    }
    return products;
  }

  // Returns all products including pending drafts for Admin
  getAllProducts() {
    const db = this.readDb();
    return db.products || [];
  }

  getProductById(id) {
    const db = this.readDb();
    return (db.products || []).find(p => p.id === id) || null;
  }

  createProduct(productData, status = 'pending') {
    const db = this.readDb();
    const market = productData.market === 'UAE' ? 'UAE' : 'India';
    const currency = productData.currency || (market === 'UAE' ? 'AED' : 'INR');
    const newProduct = {
      id: `lap-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      rating: 4.5,
      reviewsCount: 1,
      isBestSeller: false,
      isDealOfTheDay: false,
      tag: status === 'approved' ? 'New Arrival' : 'Pending Review',
      status, // 'approved' or 'pending'
      ...productData,
      market,
      currency
    };
    db.products.unshift(newProduct);
    this.writeDb(db);
    return newProduct;
  }

  approveProduct(id) {
    const db = this.readDb();
    const product = db.products.find(p => p.id === id);
    if (product) {
      product.status = 'approved';
      product.tag = 'Verified & Approved';
      this.writeDb(db);
      return product;
    }
    return null;
  }

  updateProduct(id, updates) {
    const db = this.readDb();
    const index = db.products.findIndex(p => p.id === id);
    if (index !== -1) {
      db.products[index] = { ...db.products[index], ...updates };
      this.writeDb(db);
      return db.products[index];
    }
    return null;
  }

  toggleProductStock(id) {
    const db = this.readDb();
    const product = db.products.find(p => p.id === id);
    if (product) {
      product.inStock = !product.inStock;
      if (product.inStock && product.stock === 0) {
        product.stock = 10;
      }
      this.writeDb(db);
      return product;
    }
    return null;
  }

  deleteProduct(id) {
    const db = this.readDb();
    db.products = db.products.filter(p => p.id !== id);
    this.writeDb(db);
    return true;
  }

  // --- ORDERS ---
  getOrders() {
    const db = this.readDb();
    return db.orders || [];
  }

  getOrderById(orderId) {
    const db = this.readDb();
    return (db.orders || []).find(o => o.orderId === orderId) || null;
  }

  getUserOrders(userId, email = null) {
    const db = this.readDb();
    return (db.orders || []).filter(o => {
      if (userId && (o.userId === userId || o.customer?.userId === userId)) return true;
      if (email && (o.customer?.email?.toLowerCase() === email.toLowerCase() || o.userId === email)) return true;
      return false;
    });
  }

  createOrder({ userId, customer, items, pricing, paymentMethod, market, currency }) {
    const db = this.readDb();
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    const orderId = `OD-LK-${randomDigits}`;
    const now = new Date();

    const orderCurrency = currency || pricing?.currency || (customer?.country === 'AE' ? 'AED' : 'INR');
    const orderMarket = market || (orderCurrency === 'AED' ? 'UAE' : 'India');

    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 3);
    const expectedDateStr = expectedDelivery.toISOString().split('T')[0];

    const customerObj = {
      ...(customer || {}),
      userId: userId || customer?.userId || null
    };

    const newOrder = {
      orderId,
      userId: userId || customer?.userId || null,
      createdAt: now.toISOString(),
      customer: customerObj,
      items,
      market: orderMarket,
      currency: orderCurrency,
      pricing: {
        currency: orderCurrency,
        ...(pricing || {})
      },
      paymentMethod: paymentMethod || 'Cash on Delivery',
      paymentStatus: 'Pending (Cash on Delivery)',
      status: 'Waiting for Admin Confirmation',
      deliveryDetails: {
        courierPartner: 'Ekart Express Logistics',
        trackingNumber: `EK-EXP-${Math.floor(10000000 + Math.random() * 90000000)}IN`,
        currentLocation: 'LapKart National Fulfillment Hub, Electronic City, Bengaluru',
        expectedDate: expectedDateStr,
        deliveredAt: null
      },
      timeline: [
        {
          stage: "Order Placed",
          timestamp: now.toISOString(),
          completed: true,
          note: "Order placed successfully. Waiting for store administrator approval."
        },
        {
          stage: "Order Confirmed",
          timestamp: null,
          completed: false,
          note: "Admin approval and inventory reservation pending."
        },
        {
          stage: "Packed",
          timestamp: null,
          completed: false,
          note: "Anti-static bubble packaging and seal inspection."
        },
        {
          stage: "Shipped",
          timestamp: null,
          completed: false,
          note: "Handover to Ekart Express Courier partner."
        },
        {
          stage: "In Transit",
          timestamp: null,
          completed: false,
          note: "Highway air cargo express to destination hub."
        },
        {
          stage: "Out for Delivery",
          timestamp: null,
          completed: false,
          note: "Delivery agent assigned with OTP verification."
        },
        {
          stage: "Delivered",
          timestamp: null,
          completed: false,
          note: "Handover to customer with cash collection & open-box verification."
        }
      ]
    };

    if (!db.orders) db.orders = [];
    db.orders.unshift(newOrder);

    // Deduct stock for each item
    items.forEach(item => {
      const prod = db.products.find(p => p.id === item.id);
      if (prod) {
        prod.stock = Math.max(0, (prod.stock || 10) - item.quantity);
        if (prod.stock === 0) prod.inStock = false;
      }
    });

    this.writeDb(db);
    return newOrder;
  }

  confirmOrder(orderId) {
    const db = this.readDb();
    const order = db.orders.find(o => o.orderId === orderId);

    if (!order) return null;

    order.status = 'Order Confirmed';
    const now = new Date().toISOString();

    if (order.timeline) {
      const confStage = order.timeline.find(t => t.stage === 'Order Confirmed');
      if (confStage) {
        confStage.completed = true;
        confStage.timestamp = now;
        confStage.note = 'Order verified and confirmed by Store Administrator.';
      }
    }

    this.writeDb(db);
    return order;
  }

  cancelOrder(orderId, cancelledBy = 'user', reason = '') {
    const db = this.readDb();
    const order = db.orders.find(o => o.orderId === orderId);

    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    // Cancellation eligibility rule: Can only cancel before shipping
    const nonCancellableStages = ['Shipped', 'In Transit', 'Out for Delivery', 'Delivered'];
    if (nonCancellableStages.includes(order.status)) {
      return {
        success: false,
        error: `Order cannot be cancelled because it is already "${order.status}". Cancellation is allowed only before dispatch.`
      };
    }

    if (order.status.startsWith('Cancelled')) {
      return { success: false, error: 'This order is already cancelled.' };
    }

    order.status = cancelledBy === 'admin' ? 'Cancelled by Admin' : 'Cancelled by User';
    order.cancellationReason = reason || `Order cancelled by ${cancelledBy}.`;
    const now = new Date().toISOString();

    if (order.timeline) {
      order.timeline.push({
        stage: "Order Cancelled",
        timestamp: now,
        completed: true,
        note: `Order cancelled by ${cancelledBy}. ${reason}`
      });
    }

    // Restore laptop stock back to inventory
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const prod = db.products.find(p => p.id === item.id);
        if (prod) {
          prod.stock = (prod.stock || 0) + item.quantity;
          prod.inStock = prod.stock > 0;
        }
      });
    }

    this.writeDb(db);
    return { success: true, order };
  }

  updateOrderStatus(orderId, nextStatus, customDetails = {}) {
    const STAGES = ["Order Placed", "Order Confirmed", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered"];
    const db = this.readDb();
    const order = db.orders.find(o => o.orderId === orderId);

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
      order.paymentStatus = "Paid (Cash Collected)";
    }

    const currentStageIndex = STAGES.indexOf(nextStatus);

    if (order.timeline) {
      order.timeline = order.timeline.map((item) => {
        const idx = STAGES.indexOf(item.stage);
        if (idx === -1) return item;
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
    }

    this.writeDb(db);
    return order;
  }

  // --- REFERRALS & 30% COUPONS ---
  getReferralData(userIdOrCode) {
    const db = this.readDb();
    if (!db.referrals) db.referrals = {};
    if (!db.coupons) db.coupons = [];

    const refInfo = db.referrals[userIdOrCode] || { count: 0, referredUsers: [], unlockedCoupon: null };
    return refInfo;
  }

  registerReferral(referrerCode, newUserInfo) {
    const db = this.readDb();
    if (!db.referrals) db.referrals = {};
    if (!db.coupons) db.coupons = [];

    if (!referrerCode) return { success: false, error: 'Referrer code is required' };

    let refInfo = db.referrals[referrerCode];
    if (!refInfo) {
      refInfo = { count: 0, referredUsers: [], unlockedCoupon: null };
      db.referrals[referrerCode] = refInfo;
    }

    // Check if new user is already referred
    const email = newUserInfo.email || newUserInfo.id || 'guest';
    const alreadyReferred = refInfo.referredUsers.some(u => u.email === email);
    if (alreadyReferred) {
      return { success: false, message: 'User already counted for this referral code.', refInfo };
    }

    if (refInfo.count < 5) {
      refInfo.count += 1;
      refInfo.referredUsers.push({
        name: newUserInfo.name || 'New Friend',
        email: email,
        joinedAt: new Date().toISOString()
      });

      // If milestone 5 is reached, generate 30% OFF Coupon
      if (refInfo.count === 5 && !refInfo.unlockedCoupon) {
        const randomCode = `LAP30-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        const coupon = {
          code: randomCode,
          discountPercent: 30,
          ownerReferralCode: referrerCode,
          createdAt: new Date().toISOString(),
          validUntil: expiryDate.toISOString(),
          isUsed: false,
          usedInOrder: null
        };

        refInfo.unlockedCoupon = coupon;
        db.coupons.push(coupon);
      }
    }

    this.writeDb(db);
    return { 
      success: true, 
      refInfo, 
      milestoneReached: refInfo.count >= 5 && Boolean(refInfo.unlockedCoupon), 
      couponCode: refInfo.unlockedCoupon?.code || null 
    };
  }

  validateCoupon(code, orderTotal) {
    const db = this.readDb();
    if (!db.coupons) db.coupons = [];

    const coupon = db.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code.' };
    }

    if (coupon.isUsed) {
      return { valid: false, error: 'This coupon has already been redeemed and can only be used once.' };
    }

    const now = new Date();
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return { valid: false, error: 'This 30% OFF referral coupon has expired.' };
    }

    const discountAmount = Math.round((orderTotal * coupon.discountPercent) / 100);

    return {
      valid: true,
      couponCode: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount,
      validUntil: coupon.validUntil
    };
  }

  markCouponUsed(code, orderId) {
    const db = this.readDb();
    if (!db.coupons) return false;

    const coupon = db.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (coupon) {
      coupon.isUsed = true;
      coupon.usedInOrder = orderId;
      coupon.usedAt = new Date().toISOString();
      this.writeDb(db);
      return true;
    }
    return false;
  }

  // --- USER PROFILE & ADDRESSES ---
  updateUserProfile(userId, { name, phone, password }) {
    const db = this.readDb();
    const user = db.users.find(u => u.id === userId);
    if (!user) return null;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (password) user.password = password;
    this.writeDb(db);
    return { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone };
  }

  resetPassword(email, newPassword) {
    const db = this.readDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    user.password = newPassword;
    this.writeDb(db);
    return true;
  }

  getUserAddresses(userId) {
    const db = this.readDb();
    if (!db.addresses) db.addresses = [];
    return db.addresses.filter(a => a.userId === userId);
  }

  addUserAddress(userId, addressData) {
    const db = this.readDb();
    if (!db.addresses) db.addresses = [];
    const userAddrs = db.addresses.filter(a => a.userId === userId);
    const newAddress = {
      id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      isDefault: userAddrs.length === 0,
      createdAt: new Date().toISOString(),
      ...addressData
    };
    db.addresses.unshift(newAddress);
    this.writeDb(db);
    return newAddress;
  }

  deleteUserAddress(userId, addressId) {
    const db = this.readDb();
    if (!db.addresses) db.addresses = [];
    const initialLen = db.addresses.length;
    db.addresses = db.addresses.filter(a => !(a.id === addressId && a.userId === userId));
    this.writeDb(db);
    return db.addresses.length < initialLen;
  }

  // --- WISHLIST ---
  getUserWishlist(userId) {
    const db = this.readDb();
    if (!db.wishlists) db.wishlists = {};
    const itemIds = db.wishlists[userId] || [];
    const products = (db.products || []).filter(p => p.status === 'approved' && itemIds.includes(p.id));
    return { itemIds, products };
  }

  toggleWishlist(userId, productId) {
    const db = this.readDb();
    if (!db.wishlists) db.wishlists = {};
    if (!db.wishlists[userId]) db.wishlists[userId] = [];
    const idx = db.wishlists[userId].indexOf(productId);
    let added = false;
    if (idx !== -1) {
      db.wishlists[userId].splice(idx, 1);
    } else {
      db.wishlists[userId].push(productId);
      added = true;
    }
    this.writeDb(db);
    return { added, itemIds: db.wishlists[userId] };
  }

  // --- REVIEWS & RATINGS ---
  getProductReviews(productId) {
    const db = this.readDb();
    if (!db.reviews) db.reviews = [];
    return db.reviews.filter(r => r.productId === productId && (r.status === 'approved' || !r.status));
  }

  getAllReviews() {
    const db = this.readDb();
    return db.reviews || [];
  }

  addReview({ userId, userName, productId, rating, title, comment, reviewImage }) {
    const db = this.readDb();
    if (!db.reviews) db.reviews = [];

    // Verify if user had a delivered order for this product
    const orders = db.orders || [];
    const hasDelivered = orders.some(o => 
      (o.userId === userId || o.customer?.email === userId) && 
      o.items?.some(i => i.id === productId) &&
      o.status === 'Delivered'
    );

    const newReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: userId || 'anonymous',
      userName: userName || 'Verified Buyer',
      productId,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      title: title || 'Great laptop purchase!',
      comment: comment || '',
      reviewImage: reviewImage || null,
      isVerifiedPurchase: hasDelivered,
      status: 'approved', // Live approved by default, subject to moderation
      createdAt: new Date().toISOString()
    };

    db.reviews.unshift(newReview);

    // Recalculate product rating
    const productReviews = db.reviews.filter(r => r.productId === productId);
    const prod = db.products.find(p => p.id === productId);
    if (prod && productReviews.length > 0) {
      const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
      prod.rating = Number(avg.toFixed(1));
      prod.reviewsCount = productReviews.length;
    }

    this.writeDb(db);
    return newReview;
  }

  approveReview(reviewId) {
    const db = this.readDb();
    if (!db.reviews) return false;
    const review = db.reviews.find(r => r.id === reviewId);
    if (review) {
      review.status = 'approved';
      this.writeDb(db);
      return true;
    }
    return false;
  }

  deleteReview(reviewId) {
    const db = this.readDb();
    if (!db.reviews) return false;
    db.reviews = db.reviews.filter(r => r.id !== reviewId);
    this.writeDb(db);
    return true;
  }

  // --- RETURNS & REPLACEMENTS ---
  createReturnRequest({ orderId, userId, reason, description, images, type = 'Replacement' }) {
    const db = this.readDb();
    if (!db.returns) db.returns = [];

    const order = db.orders.find(o => o.orderId === orderId);
    if (!order) return { success: false, error: 'Order not found.' };

    if (order.status !== 'Delivered') {
      return { success: false, error: 'Returns or replacements can only be requested for Delivered orders.' };
    }

    const returnReq = {
      id: `RET-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderId,
      userId: userId || order.userId,
      customer: order.customer,
      items: order.items,
      type, // 'Replacement' or 'Refund'
      reason,
      description,
      images: images || [],
      status: 'Return Requested', // Return Requested -> Approved -> Pickup Scheduled -> Product Received -> Completed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminNotes: ''
    };

    db.returns.unshift(returnReq);
    order.returnStatus = 'Return Requested';
    order.returnId = returnReq.id;
    this.writeDb(db);
    return { success: true, returnRequest: returnReq };
  }

  getUserReturns(userId) {
    const db = this.readDb();
    if (!db.returns) return [];
    return db.returns.filter(r => r.userId === userId);
  }

  getAllReturns() {
    const db = this.readDb();
    return db.returns || [];
  }

  updateReturnStatus(returnId, status, adminNotes = '') {
    const db = this.readDb();
    if (!db.returns) return null;
    const req = db.returns.find(r => r.id === returnId);
    if (!req) return null;
    req.status = status;
    req.adminNotes = adminNotes || req.adminNotes;
    req.updatedAt = new Date().toISOString();

    const order = db.orders.find(o => o.orderId === req.orderId);
    if (order) {
      order.returnStatus = status;
    }

    this.writeDb(db);
    return req;
  }

  // --- SUPPORT TICKETS ---
  createSupportTicket({ userId, name, email, orderId, subject, message }) {
    const db = this.readDb();
    if (!db.supportTickets) db.supportTickets = [];

    const ticket = {
      id: `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: userId || null,
      name,
      email,
      orderId: orderId || null,
      subject,
      message,
      status: 'Open', // 'Open' | 'In Progress' | 'Resolved'
      reply: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.supportTickets.unshift(ticket);
    this.writeDb(db);
    return ticket;
  }

  getUserTickets(userId, email) {
    const db = this.readDb();
    if (!db.supportTickets) return [];
    return db.supportTickets.filter(t => (userId && t.userId === userId) || (email && t.email === email));
  }

  getAllTickets() {
    const db = this.readDb();
    return db.supportTickets || [];
  }

  replyTicket(ticketId, replyMessage, status = 'Resolved') {
    const db = this.readDb();
    if (!db.supportTickets) return null;
    const ticket = db.supportTickets.find(t => t.id === ticketId);
    if (!ticket) return null;
    ticket.reply = replyMessage;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    this.writeDb(db);
    return ticket;
  }

  resetDatabase() {
    this.writeDb(SEED_DATA);
    return true;
  }
}

export const db = new JsonDb();
