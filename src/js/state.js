// src/js/state.js

const INVENTORY_KEY = 'logitrack_inventory';
const TRANSACTIONS_KEY = 'logitrack_transactions';
const SETTINGS_KEY = 'logitrack_settings';
const NOTIFICATIONS_KEY = 'logitrack_notifications';
const AUTH_KEY = 'logitrack_auth';
const CATEGORIES_KEY = 'logitrack_categories';
const AUDIT_LOGS_KEY = 'logitrack_audit_logs';

const DEFAULT_CATEGORIES = ['Handphone', 'Mic Handphone', 'Elektronik', 'Mebel', 'Aksesoris', 'Alat Tulis Kantor'];

// Aggregated product groups from the user's data arsip.xlsx file
const DEFAULT_INVENTORY = [
  {
    "code": "ARS-2026-0001",
    "barcode": "8991001000018",
    "name": "IPHONE 17 PRO",
    "category": "Handphone",
    "brand": "IPHONE 17 PRO",
    "model": "17 Pro",
    "serialNumber": "-",
    "description": "Apple iPhone 17 Pro dari pengadaan 2026.",
    "location": "Gudang",
    "totalStock": 15,
    "availableStock": 14,
    "borrowedStock": 1,
    "condition": "Baik",
    "status": "Aktif",
    "dateAdded": "2026-01-15T08:30:00Z",
    "lastUpdated": "2026-08-01T10:00:00Z",
    "photo": "",
    "items": [
      {
        "code": "HP-IP-17P-001",
        "serialNumber": "355159677494267",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "DEEP BLUE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-002",
        "serialNumber": "359637829539739",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "WHITE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-003",
        "serialNumber": "355159677697414",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "WHITE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-004",
        "serialNumber": "359637829560248",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "WHITE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-005",
        "serialNumber": "355159677867900",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "WHITE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-006",
        "serialNumber": "355159677421153",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "DEEP BLUE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-007",
        "serialNumber": "355159678222808",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "WHITE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-008",
        "serialNumber": "355159678082392",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "WHITE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-009",
        "serialNumber": "359637829639844",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "WHITE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-010",
        "serialNumber": "355159678301255",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "WHITE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-011",
        "serialNumber": "355159677538949",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "WHITE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-012",
        "serialNumber": "355159677377843",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "DEEP BLUE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-013",
        "serialNumber": "355159677100021",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "ANNE",
        "status": "DIPINJAM",
        "warna": "DEEP BLUE",
        "keterangan": "ANNE"
      },
      {
        "code": "HP-IP-17P-014",
        "serialNumber": "355159677611290",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "DEEP BLUE",
        "keterangan": ""
      },
      {
        "code": "HP-IP-17P-015",
        "serialNumber": "3559637829594833",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "WHITE",
        "keterangan": ""
      }
    ]
  },
  {
    "code": "ARS-2026-0002",
    "barcode": "8991001000025",
    "name": "IPHONE 17 PRO MAX",
    "category": "Handphone",
    "brand": "IPHONE 17 PRO MAX",
    "model": "17 Pro Max",
    "serialNumber": "-",
    "description": "Apple iPhone 17 Pro Max dari pengadaan 2026.",
    "location": "Gudang",
    "totalStock": 1,
    "availableStock": 1,
    "borrowedStock": 0,
    "condition": "Baik",
    "status": "Aktif",
    "dateAdded": "2026-01-15T08:30:00Z",
    "lastUpdated": "2026-08-01T10:00:00Z",
    "photo": "",
    "items": [
      {
        "code": "HP-IP-17M-001",
        "serialNumber": "351459292116046",
        "regBmn": "-",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "DI BAWA MAS HENDY",
        "warna": "COSMIC ORANGE",
        "keterangan": "KARDUS TERBUKA"
      }
    ]
  },
  {
    "code": "ARS-2026-0004",
    "barcode": "8991001000049",
    "name": "SAMSUNG Z FOLD 7",
    "category": "Handphone",
    "brand": "SAMSUNG Z FOLD 7",
    "model": "Z Fold 7",
    "serialNumber": "-",
    "description": "Samsung Galaxy Z Fold 7 dari pengadaan 2026.",
    "location": "Gudang",
    "totalStock": 2,
    "availableStock": 2,
    "borrowedStock": 0,
    "condition": "Baik",
    "status": "Aktif",
    "dateAdded": "2026-01-15T08:30:00Z",
    "lastUpdated": "2026-08-01T10:00:00Z",
    "photo": "",
    "items": [
      {
        "code": "HP-SS-ZF-001",
        "serialNumber": "355626620368533",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "",
        "keterangan": ""
      },
      {
        "code": "HP-SS-ZF-002",
        "serialNumber": "-",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "RUMAH MAS ZOEL",
        "warna": "",
        "keterangan": ""
      }
    ]
  },
  {
    "code": "ARS-2026-0003",
    "barcode": "8991001000032",
    "name": "SAMSUNG S26 ULTRA",
    "category": "Handphone",
    "brand": "SAMSUNG S26 ULTRA",
    "model": "S26 Ultra",
    "serialNumber": "-",
    "description": "Samsung Galaxy S26 Ultra dari pengadaan 2026.",
    "location": "Gudang",
    "totalStock": 14,
    "availableStock": 13,
    "borrowedStock": 1,
    "condition": "Baik",
    "status": "Aktif",
    "dateAdded": "2026-01-15T08:30:00Z",
    "lastUpdated": "2026-08-01T10:00:00Z",
    "photo": "",
    "items": [
      {
        "code": "HP-SS-26U-001",
        "serialNumber": "358780495112919",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "COBALT VIOLET",
        "keterangan": ""
      },
      {
        "code": "HP-SS-26U-002",
        "serialNumber": "358780495102340",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "WHITE",
        "keterangan": ""
      },
      {
        "code": "HP-SS-26U-003",
        "serialNumber": "358780495173911",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "MAS RIDWAN",
        "status": "DIPINJAM",
        "warna": "SKYBLUE",
        "keterangan": "MAS RIDWAN"
      },
      {
        "code": "HP-SS-26U-004",
        "serialNumber": "358780495064730",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "BLACK",
        "keterangan": ""
      },
      {
        "code": "HP-SS-26U-005",
        "serialNumber": "358780495138674",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "BLACK",
        "keterangan": ""
      },
      {
        "code": "HP-SS-26U-006",
        "serialNumber": "358780495139383",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "BLACK",
        "keterangan": ""
      },
      {
        "code": "HP-SS-26U-007",
        "serialNumber": "358780495065778",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "BLACK",
        "keterangan": ""
      },
      {
        "code": "HP-SS-26U-008",
        "serialNumber": "358780495144292",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "BLACK",
        "keterangan": ""
      },
      {
        "code": "HP-SS-26U-009",
        "serialNumber": "358780495063351",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "BLACK",
        "keterangan": ""
      },
      {
        "code": "HP-SS-26U-010",
        "serialNumber": "358780495063534",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "BLACK",
        "keterangan": ""
      },
      {
        "code": "HP-SS-26U-011",
        "serialNumber": "358780495139102",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "BLACK",
        "keterangan": ""
      },
      {
        "code": "HP-SS-26U-012",
        "serialNumber": "358780495112984",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "COBALT VIOLET",
        "keterangan": ""
      },
      {
        "code": "HP-SS-26U-013",
        "serialNumber": "358780495039971",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "WHITE",
        "keterangan": ""
      },
      {
        "code": "HP-SS-26U-014",
        "serialNumber": "358780495109352",
        "regBmn": "3060201004",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "SKYBLUE",
        "keterangan": ""
      }
    ]
  },
  {
    "code": "ARS-2026-0005",
    "barcode": "8991001000056",
    "name": "HOLLYLAND LARK M2S",
    "category": "Mic Handphone",
    "brand": "HOLLYLAND LARK M2S",
    "model": "Lark M2S",
    "serialNumber": "-",
    "description": "Wireless Mic Hollyland Lark M2S dari pengadaan 2026.",
    "location": "Gudang",
    "totalStock": 9,
    "availableStock": 9,
    "borrowedStock": 0,
    "condition": "Baik",
    "status": "Aktif",
    "dateAdded": "2026-01-15T08:30:00Z",
    "lastUpdated": "2026-08-01T10:00:00Z",
    "photo": "",
    "items": [
      {
        "code": "MC-HL-001",
        "serialNumber": "94V22G3LH4G",
        "regBmn": "3060101036",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "",
        "keterangan": ""
      },
      {
        "code": "MC-HL-002",
        "serialNumber": "94V22G3Q9CC",
        "regBmn": "3060101036",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "",
        "keterangan": ""
      },
      {
        "code": "MC-HL-003",
        "serialNumber": "94V22G3LP3R",
        "regBmn": "3060101036",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "",
        "keterangan": ""
      },
      {
        "code": "MC-HL-004",
        "serialNumber": "94V22G3Q8BA",
        "regBmn": "3060101036",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "",
        "keterangan": ""
      },
      {
        "code": "MC-HL-005",
        "serialNumber": "94V22G3YAED",
        "regBmn": "3060101036",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "",
        "keterangan": ""
      },
      {
        "code": "MC-HL-006",
        "serialNumber": "94V22G3JNUH",
        "regBmn": "3060101036",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "",
        "keterangan": ""
      },
      {
        "code": "MC-HL-007",
        "serialNumber": "94V22G3LN7L",
        "regBmn": "3060101036",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "",
        "keterangan": ""
      },
      {
        "code": "MC-HL-008",
        "serialNumber": "94V22G3LK2L",
        "regBmn": "3060101036",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "",
        "keterangan": ""
      },
      {
        "code": "MC-HL-009",
        "serialNumber": "94T22G2PLR4",
        "regBmn": "3060101036",
        "kelengkapan": "LENGKAP",
        "user": "",
        "status": "STORAGE",
        "warna": "",
        "keterangan": ""
      }
    ]
  }
];

// Helper to generate dynamic dates
const getDateNDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

// Default transaction logs populated from active borrowings in data arsip.xlsx
const DEFAULT_TRANSACTIONS = [
  {
    id: "TRX-2026-0001",
    borrowerName: "ANNE",
    nip: "-",
    department: "Divisi Umum",
    phone: "-",
    itemCode: "ARS-2026-0001",
    itemName: "IPHONE 17 PRO",
    qty: 1,
    borrowDate: getDateNDaysAgo(11),
    expectedReturnDate: getDateNDaysAgo(4),
    actualReturnDate: "",
    status: "Terlambat",
    lateDays: 4,
    purpose: "Operasional Staf",
    notes: "Kondisi unit lengkap.",
    conditionOnReturn: ""
  },
  {
    id: "TRX-2026-0002",
    borrowerName: "MAS RIDWAN",
    nip: "-",
    department: "Divisi IT",
    phone: "-",
    itemCode: "ARS-2026-0003",
    itemName: "SAMSUNG S26 ULTRA",
    qty: 1,
    borrowDate: getDateNDaysAgo(7),
    expectedReturnDate: getDateNDaysAgo(0),
    actualReturnDate: "",
    status: "Dipinjam",
    lateDays: 0,
    purpose: "Uji Coba Jaringan",
    notes: "Dipinjam beserta charger.",
    conditionOnReturn: ""
  }
];

const DEFAULT_SETTINGS = {
  profile: {
    username: "admin",
    name: "Naila Olivia R.",
    email: "admin@logitrack.go.id",
    role: "Administrator Utama",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
  },
  theme: "light",
  notifications: {
    lowStock: true,
    overdue: true,
    newInventory: true
  }
};

const DEFAULT_NOTIFICATIONS = [
  {
    id: "NOT-2026-0001",
    title: "Pemberitahuan Stok Rendah",
    message: "Stok untuk barang IPHONE 17 PRO MAX tersisa 1 unit.",
    type: "warning",
    read: false,
    date: getDateNDaysAgo(0)
  },
  {
    id: "NOT-2026-0002",
    title: "Peminjaman Terlambat Terdeteksi",
    message: "Peminjaman TRX-2026-0001 oleh ANNE telah terlambat selama 4 hari.",
    type: "danger",
    read: false,
    date: getDateNDaysAgo(0)
  }
];

export const state = {
  // Direct localStorage properties getters
  getInventory() {
    let inv = localStorage.getItem(INVENTORY_KEY);
    if (!inv) {
      inv = JSON.stringify(DEFAULT_INVENTORY);
      localStorage.setItem(INVENTORY_KEY, inv);
    }
    return JSON.parse(inv);
  },

  setInventory(data) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(data));
  },

  getTransactions() {
    let trxs = localStorage.getItem(TRANSACTIONS_KEY);
    if (!trxs) {
      trxs = JSON.stringify(DEFAULT_TRANSACTIONS);
      localStorage.setItem(TRANSACTIONS_KEY, trxs);
    }
    const parsed = JSON.parse(trxs);
    
    // Dynamically calculate lateDays on retrieval for active borrowings
    let updated = false;
    const now = new Date();
    parsed.forEach(t => {
      if (t.status === "Dipinjam" || t.status === "Terlambat") {
        const expDate = new Date(t.expectedReturnDate);
        if (now > expDate) {
          const diffTime = Math.abs(now - expDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (t.lateDays !== diffDays || t.status !== "Terlambat") {
            t.lateDays = diffDays;
            t.status = "Terlambat";
            updated = true;
          }
        } else {
          if (t.lateDays !== 0 || t.status !== "Dipinjam") {
            t.lateDays = 0;
            t.status = "Dipinjam";
            updated = true;
          }
        }
      }
    });

    if (updated) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  },

  setTransactions(data) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(data));
  },

  getSettings() {
    let settings = localStorage.getItem(SETTINGS_KEY);
    if (!settings) {
      settings = JSON.stringify(DEFAULT_SETTINGS);
      localStorage.setItem(SETTINGS_KEY, settings);
    }
    return JSON.parse(settings);
  },

  setSettings(data) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  },

  getNotifications() {
    let notifs = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!notifs) {
      notifs = JSON.stringify(DEFAULT_NOTIFICATIONS);
      localStorage.setItem(NOTIFICATIONS_KEY, notifs);
    }
    return JSON.parse(notifs);
  },

  setNotifications(data) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(data));
  },

  // Initialize the state layer safely without recursion loops
  init() {
    // If user has the old Lenovo dummy database, intermediate database, or prefixed names, auto-reset it
    const currentInv = localStorage.getItem(INVENTORY_KEY);
    if (currentInv) {
      try {
        const parsed = JSON.parse(currentInv);
        const hasLenovo = Array.isArray(parsed) && parsed.some(item => item.name && item.name.includes("Lenovo"));
        const hasItems = Array.isArray(parsed) && parsed.every(item => item.items && item.items.length > 0);
        const hasPrefix = Array.isArray(parsed) && parsed.some(item => item.name && (item.name.startsWith("Handphone ") || item.name.startsWith("Mic Handphone ")));
        if (hasLenovo || (Array.isArray(parsed) && parsed.length === 16) || !hasItems || hasPrefix) {
          localStorage.removeItem(INVENTORY_KEY);
          localStorage.removeItem(TRANSACTIONS_KEY);
          localStorage.removeItem(NOTIFICATIONS_KEY);
          localStorage.removeItem(AUDIT_LOGS_KEY);
          localStorage.removeItem(CATEGORIES_KEY);
        }
      } catch (e) {
        // Ignore
      }
    }

    // Expose a global helper for manual database reset
    window.resetDatabase = () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    };

    this.getInventory();
    this.getTransactions();
    this.getSettings();
    this.getNotifications();
    this.getCategories();
    this.getAuditLogs();
    this.refreshNotifications();
  },

  // Auth Operations
  login(username, password, remember) {
    const settings = this.getSettings();
    let sessionUser = null;

    if (username.toLowerCase() === settings.profile.username && password === "admin123") {
      sessionUser = settings.profile;
    } else if (username.toLowerCase() === "peminjam" && password === "peminjam123") {
      sessionUser = {
        username: "peminjam",
        name: "Peminjam Logistik",
        email: "peminjam@logitrack.go.id",
        role: "Peminjam",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80"
      };
    }

    if (sessionUser) {
      const session = {
        authenticated: true,
        user: sessionUser,
        loginTime: new Date().toISOString()
      };
      if (remember) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      } else {
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
      }
      this.logActivity("Pengguna masuk ke sistem", `Username: ${username}`, "success");
      return { success: true };
    }
    return { success: false, message: "Kredensial yang dimasukkan salah." };
  },

  logout() {
    this.logActivity("Pengguna keluar dari sistem", "", "info");
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  },

  getCurrentUser() {
    const localAuth = localStorage.getItem(AUTH_KEY);
    const sessionAuth = sessionStorage.getItem(AUTH_KEY);
    if (localAuth) return JSON.parse(localAuth);
    if (sessionAuth) return JSON.parse(sessionAuth);
    return null;
  },

  // Archive CRUD operations
  generateArchiveCode() {
    const inventory = this.getInventory();
    const currentYear = new Date().getFullYear();
    let maxNum = 0;
    inventory.forEach(item => {
      const match = item.code.match(/ARS-(\d{4})-(\d{4})/);
      if (match) {
        const year = parseInt(match[1]);
        const num = parseInt(match[2]);
        if (year === currentYear && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = String(maxNum + 1).padStart(4, '0');
    return `ARS-${currentYear}-${nextNum}`;
  },

  addInventoryItem(itemData) {
    const inventory = this.getInventory();
    const newItem = {
      code: itemData.code || this.generateArchiveCode(),
      barcode: itemData.barcode || String(Math.floor(1000000000000 + Math.random() * 9000000000000)),
      name: itemData.name,
      category: itemData.category,
      brand: itemData.brand,
      model: itemData.model || "-",
      serialNumber: itemData.serialNumber || "-",
      description: itemData.description || "",
      location: itemData.location,
      totalStock: parseInt(itemData.totalStock || itemData.initialStock || 0),
      availableStock: parseInt(itemData.availableStock !== undefined ? itemData.availableStock : (itemData.totalStock || itemData.initialStock || 0)),
      borrowedStock: 0,
      condition: itemData.condition || "Baik",
      status: "Aktif",
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      photo: itemData.photo || ""
    };

    inventory.push(newItem);
    this.setInventory(inventory);
    this.refreshNotifications();
    this.logActivity(`Menambahkan barang baru: ${newItem.name}`, `Kode: ${newItem.code}, Kategori: ${newItem.category}, Stok Awal: ${newItem.totalStock}`, "success");
    return newItem;
  },

  updateInventoryItem(code, updatedFields) {
    const inventory = this.getInventory();
    const idx = inventory.findIndex(item => item.code === code);
    if (idx === -1) return false;

    // Preserve stocks
    const currentItem = inventory[idx];
    const newTotalStock = updatedFields.totalStock !== undefined ? parseInt(updatedFields.totalStock) : currentItem.totalStock;
    const diff = newTotalStock - currentItem.totalStock;
    
    let newAvailableStock = currentItem.availableStock + diff;
    if (newAvailableStock < 0) {
      newAvailableStock = 0;
    }

    inventory[idx] = {
      ...currentItem,
      ...updatedFields,
      totalStock: newTotalStock,
      availableStock: newAvailableStock,
      lastUpdated: new Date().toISOString()
    };

    this.setInventory(inventory);
    this.refreshNotifications();
    this.logActivity(`Mengubah informasi barang: ${currentItem.name}`, `Kode: ${code}, Kolom diubah: ${Object.keys(updatedFields).filter(k => k !== 'photo').join(", ")}`, "warning");
    return inventory[idx];
  },

  deleteInventoryItem(code) {
    let inventory = this.getInventory();
    const idx = inventory.findIndex(item => item.code === code);
    if (idx === -1) return false;
    
    // Prevent delete if item has active borrowed stock
    if (inventory[idx].borrowedStock > 0) {
      throw new Error(`Barang ${inventory[idx].name} tidak dapat dihapus karena sedang dipinjam.`);
    }

    const currentItem = inventory[idx];
    inventory.splice(idx, 1);
    this.setInventory(inventory);
    this.refreshNotifications();
    this.logActivity(`Menghapus barang dari arsip: ${currentItem.name}`, `Kode: ${code}`, "danger");
    return true;
  },

  bulkDeleteInventoryItems(codes) {
    const inventory = this.getInventory();
    const itemsToDelete = inventory.filter(item => codes.includes(item.code));
    
    // Check if any of them are borrowed
    const activeBorrowed = itemsToDelete.some(item => item.borrowedStock > 0);
    if (activeBorrowed) {
      throw new Error("Beberapa barang yang Anda pilih tidak dapat dihapus karena masih dipinjam.");
    }

    const filtered = inventory.filter(item => !codes.includes(item.code));
    this.setInventory(filtered);
    this.refreshNotifications();
    this.logActivity(`Menghapus massal barang arsip`, `Jumlah: ${codes.length} barang, Kode: ${codes.join(", ")}`, "danger");
    return true;
  },

  // Borrowing and Returning Lifecycle Operations
  generateTransactionId() {
    const transactions = this.getTransactions();
    const currentYear = new Date().getFullYear();
    let maxNum = 0;
    transactions.forEach(t => {
      const match = t.id.match(/TRX-(\d{4})-(\d{4})/);
      if (match) {
        const year = parseInt(match[1]);
        const num = parseInt(match[2]);
        if (year === currentYear && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = String(maxNum + 1).padStart(4, '0');
    return `TRX-${currentYear}-${nextNum}`;
  },

  borrowItem(data) {
    const inventory = this.getInventory();
    const transactions = this.getTransactions();
    const newTrxId = this.generateTransactionId();

    const currentUser = this.getCurrentUser();
    const username = currentUser ? currentUser.user.username : "";

    // Support both single item (legacy) and multi-item requests
    let itemsToBorrow = [];
    if (data.items && Array.isArray(data.items)) {
      itemsToBorrow = data.items;
    } else {
      // Wrap legacy single item call into the same array structure
      itemsToBorrow = [{
        itemCode: data.itemCode,
        qty: parseInt(data.qty),
        unitCodes: data.unitCodes || [],
        unitSerials: data.unitSerials || []
      }];
    }

    // Verify stock availability for all items first
    for (const itemRequest of itemsToBorrow) {
      const itemIdx = inventory.findIndex(item => item.code === itemRequest.itemCode);
      if (itemIdx === -1) throw new Error(`Barang dengan kode ${itemRequest.itemCode} tidak ditemukan di sistem.`);
      
      const item = inventory[itemIdx];
      const qty = parseInt(itemRequest.qty);
      if (item.availableStock < qty) {
        throw new Error(`Stok tidak mencukupi untuk ${item.name}. Tersedia: ${item.availableStock}, diminta: ${qty}.`);
      }
    }

    // Process borrowing for each item
    const processedItems = [];
    for (const itemRequest of itemsToBorrow) {
      const itemIdx = inventory.findIndex(item => item.code === itemRequest.itemCode);
      const item = inventory[itemIdx];
      const qty = parseInt(itemRequest.qty);

      // Deduct stock
      item.availableStock -= qty;
      item.borrowedStock += qty;

      // Update physical units' status if physical units are selected or matched
      const selectedUnitCodes = itemRequest.unitCodes || [];
      if (selectedUnitCodes.length > 0 && item.items) {
        item.items.forEach(u => {
          if (selectedUnitCodes.includes(u.code)) {
            u.status = "BORROWED";
            u.user = data.borrowerName;
          }
        });
      } else if (item.items && item.items.length > 0) {
        // Fallback: If physical units exist but none were selected, allocate the first available STORAGE units automatically
        let allocated = 0;
        for (let i = 0; i < item.items.length; i++) {
          if (item.items[i].status === "STORAGE") {
            item.items[i].status = "BORROWED";
            item.items[i].user = data.borrowerName;
            selectedUnitCodes.push(item.items[i].code);
            allocated++;
            if (allocated >= qty) break;
          }
        }
      }

      item.lastUpdated = new Date().toISOString();
      processedItems.push({
        itemCode: item.code,
        itemName: item.name,
        qty: qty,
        unitCodes: selectedUnitCodes,
        unitSerials: itemRequest.unitSerials || selectedUnitCodes.map(c => {
          const unit = item.items?.find(u => u.code === c);
          return unit ? unit.serialNumber : "";
        }).filter(Boolean)
      });
    }

    this.setInventory(inventory);

    // Save transaction
    const newTrx = {
      id: newTrxId,
      username: username,
      borrowerName: data.borrowerName,
      nip: data.nip || "-",
      department: data.department,
      phone: data.phone,
      itemCode: processedItems.map(i => i.itemCode).join(", "),
      itemName: processedItems.map(i => `${i.itemName} (${i.qty}x)`).join(", "),
      qty: processedItems.reduce((sum, i) => sum + i.qty, 0),
      borrowDate: data.borrowDate || new Date().toISOString(),
      expectedReturnDate: data.expectedReturnDate,
      executionDate: data.executionDate || data.borrowDate || new Date().toISOString(),
      actualReturnDate: "",
      status: "Dipinjam",
      lateDays: 0,
      purpose: data.purpose || "",
      notes: data.notes || "",
      conditionOnReturn: "",
      evidenceUrl: data.evidenceUrl || "",
      items: processedItems
    };

    transactions.unshift(newTrx);
    this.setTransactions(transactions);
    
    this.refreshNotifications();
    this.logActivity(`Meminjamkan barang: ${newTrx.itemName}`, `TRX: ${newTrx.id}, Peminjam: ${newTrx.borrowerName} (${newTrx.department}), Qty: ${newTrx.qty}`, "info");
    return newTrx;
  },

  returnItem(trxId, returnData) {
    const transactions = this.getTransactions();
    const trxIdx = transactions.findIndex(t => t.id === trxId);
    if (trxIdx === -1) throw new Error("ID Transaksi tidak ditemukan.");

    const trx = transactions[trxIdx];
    if (trx.status === "Kembali") throw new Error("Transaksi peminjaman ini sudah dikembalikan.");

    const inventory = this.getInventory();

    // Support both multi-item transactions and legacy single item transactions
    const itemsToReturn = trx.items || [{
      itemCode: trx.itemCode,
      qty: trx.qty,
      unitCodes: []
    }];

    for (const returnReq of itemsToReturn) {
      const itemIdx = inventory.findIndex(item => item.code === returnReq.itemCode);
      if (itemIdx !== -1) {
        const item = inventory[itemIdx];
        const qty = returnReq.qty;

        // Restore stock
        item.borrowedStock -= qty;
        if (item.borrowedStock < 0) item.borrowedStock = 0;
        item.availableStock += qty;

        // Update physical items
        const selectedUnitCodes = returnReq.unitCodes || [];
        if (item.items) {
          item.items.forEach(u => {
            if (selectedUnitCodes.includes(u.code) || (selectedUnitCodes.length === 0 && u.user === trx.borrowerName && u.status === "BORROWED")) {
              u.status = "STORAGE";
              u.user = "";
              if (returnData.itemCondition === "Rusak") {
                u.keterangan = returnData.notes ? `Rusak saat kembali: ${returnData.notes}` : "Rusak saat kembali";
              }
            }
          });
        }

        if (returnData.itemCondition === "Rusak") {
          item.condition = "Rusak";
        }
        item.lastUpdated = new Date().toISOString();
      }
    }

    this.setInventory(inventory);

    // Update Transaction record
    trx.actualReturnDate = returnData.returnDate || new Date().toISOString();
    trx.status = "Kembali";
    trx.conditionOnReturn = returnData.itemCondition || "Baik";
    trx.notes = returnData.notes ? `${trx.notes} | Catatan Pengembalian: ${returnData.notes}` : trx.notes;
    trx.returnEvidenceUrl = returnData.returnEvidenceUrl || "";
    
    // Re-calculate lateDays
    const expected = new Date(trx.expectedReturnDate);
    const actual = new Date(trx.actualReturnDate);
    if (actual > expected) {
      const diffTime = Math.abs(actual - expected);
      trx.lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      trx.lateDays = 0;
    }

    this.setTransactions(transactions);
    this.refreshNotifications();
    this.logActivity(`Menerima pengembalian barang: ${trx.itemName}`, `TRX: ${trxId}, Peminjam: ${trx.borrowerName}, Kondisi: ${trx.conditionOnReturn}`, "success");
    return trx;
  },

  // Notification generation & background checks
  refreshNotifications() {
    const settings = this.getSettings();
    if (!settings.notifications) return;

    let notifs = [];
    let count = 1;

    // Check low stock (< 3 items)
    if (settings.notifications.lowStock) {
      const inventory = this.getInventory();
      inventory.forEach(item => {
        if (item.availableStock < 3 && item.status === "Aktif") {
          notifs.push({
            id: `NOT-AUTO-LOW-${count++}`,
            title: "Pemberitahuan Stok Rendah",
            message: `Stok untuk barang ${item.name} tersisa ${item.availableStock} unit.`,
            type: "warning",
            read: false,
            date: new Date().toISOString()
          });
        }
      });
    }

    // Check active borrowings and overdue transactions
    const transactions = this.getTransactions();
    transactions.forEach(t => {
      if (t.status === "Dipinjam" || t.status === "Terlambat") {
        if (t.lateDays > 0 && settings.notifications.overdue) {
          notifs.push({
            id: `NOT-AUTO-LATE-${count++}`,
            title: "Peminjaman Terlambat Terdeteksi",
            message: `Peminjaman ${t.id} oleh ${t.borrowerName} terlambat selama ${t.lateDays} hari.`,
            type: "danger",
            read: false,
            date: t.borrowDate || new Date().toISOString()
          });
        } else {
          notifs.push({
            id: `NOT-AUTO-BORROW-${count++}`,
            title: "Peminjaman Aktif",
            message: `Peminjaman Aktif: ${t.borrowerName} meminjam ${t.itemName || 'Barang'} (${t.qty || 1} Unit) - [${t.id}]`,
            type: "warning",
            read: false,
            date: t.borrowDate || new Date().toISOString()
          });
        }
      }
    });

    // Preserve manual notifications if any, merging them
    const currentNotifs = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    const manualNotifs = currentNotifs.filter(n => !n.id.startsWith("NOT-AUTO"));
    
    const merged = [...notifs, ...manualNotifs];
    this.setNotifications(merged);
  },

  markAllNotificationsRead() {
    const notifs = this.getNotifications();
    notifs.forEach(n => n.read = true);
    this.setNotifications(notifs);
  },

  // Report statistics calculators
  getReportData(filters) {
    const inventory = this.getInventory();
    const transactions = this.getTransactions();
    
    let reportList = [];
    const reportType = filters.type; // "inventory", "borrowing", "return", "damaged", "lowstock", "mostborrowed", "statistics"
    const period = filters.period; // "daily", "weekly", "monthly", "custom"
    
    // Filter date ranges
    let startDate = null;
    let endDate = new Date();

    if (period === "daily") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "monthly") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "custom" && filters.startDate && filters.endDate) {
      startDate = new Date(filters.startDate);
      endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
    }

    if (reportType === "inventory") {
      reportList = inventory.map(item => ({
        code: item.code,
        name: item.name,
        category: item.category,
        brand: item.brand,
        location: item.location,
        stock: `${item.availableStock}/${item.totalStock} ${item.condition}`,
        status: item.status
      }));
    } else if (reportType === "borrowing") {
      reportList = transactions
        .filter(t => t.status === "Dipinjam" || t.status === "Terlambat")
        .filter(t => {
          if (!startDate) return true;
          const bDate = new Date(t.borrowDate);
          return bDate >= startDate && bDate <= endDate;
        })
        .map(t => ({
          id: t.id,
          borrower: `${t.borrowerName} (${t.department})`,
          item: t.itemName,
          qty: t.qty,
          borrowDate: new Date(t.borrowDate).toLocaleDateString("id-ID"),
          status: t.status === "Terlambat" ? `Terlambat (${t.lateDays} Hari)` : "Dipinjam"
        }));
    } else if (reportType === "return") {
      reportList = transactions
        .filter(t => t.status === "Kembali")
        .filter(t => {
          if (!startDate) return true;
          const rDate = new Date(t.actualReturnDate);
          return rDate >= startDate && rDate <= endDate;
        })
        .map(t => ({
          id: t.id,
          borrower: `${t.borrowerName} (${t.department})`,
          item: t.itemName,
          qty: t.qty,
          returnDate: new Date(t.actualReturnDate).toLocaleDateString("id-ID"),
          condition: t.conditionOnReturn
        }));
    } else if (reportType === "damaged") {
      reportList = inventory
        .filter(item => item.condition === "Rusak" || item.condition === "Rusak Berat")
        .map(item => ({
          code: item.code,
          name: item.name,
          category: item.category,
          location: item.location,
          totalStock: item.totalStock,
          condition: item.condition
        }));
    } else if (reportType === "lowstock") {
      reportList = inventory
        .filter(item => item.availableStock < 3)
        .map(item => ({
          code: item.code,
          name: item.name,
          category: item.category,
          availableStock: item.availableStock,
          totalStock: item.totalStock,
          location: item.location
        }));
    } else if (reportType === "mostborrowed") {
      // Calculate times borrowed
      const counts = {};
      transactions.forEach(t => {
        counts[t.itemCode] = (counts[t.itemCode] || 0) + t.qty;
      });
      reportList = inventory
        .map(item => ({
          code: item.code,
          name: item.name,
          category: item.category,
          location: item.location,
          timesBorrowed: counts[item.code] || 0
        }))
        .filter(item => item.timesBorrowed > 0)
        .sort((a, b) => b.timesBorrowed - a.timesBorrowed);
    } else { // "statistics" summary
      reportList = [
        { label: "Total Jenis Barang", value: inventory.length },
        { label: "Total Jumlah Fisik Aset", value: inventory.reduce((acc, cur) => acc + cur.totalStock, 0) },
        { label: "Total Aset Tersedia", value: inventory.reduce((acc, cur) => acc + cur.availableStock, 0) },
        { label: "Total Aset Sedang Dipinjam", value: inventory.reduce((acc, cur) => acc + cur.borrowedStock, 0) },
        { label: "Total Aset Kondisi Rusak", value: inventory.filter(i => i.condition === "Rusak").reduce((acc, cur) => acc + cur.totalStock, 0) },
        { label: "Total Transaksi Peminjaman Selesai", value: transactions.filter(t => t.status === "Kembali").length },
        { label: "Total Peminjaman Aktif", value: transactions.filter(t => t.status === "Dipinjam" || t.status === "Terlambat").length }
      ];
    }
    
    return reportList;
  },

  // Audit Logs Management
  logActivity(action, details = "", type = "info") {
    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem(AUDIT_LOGS_KEY) || "[]");
    } catch (e) {
      logs = [];
    }
    
    const settings = this.getSettings();
    const newLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      details,
      type, // 'info', 'success', 'warning', 'danger'
      timestamp: new Date().toISOString(),
      user: settings?.profile?.name || "System"
    };
    
    logs.unshift(newLog);
    if (logs.length > 200) {
      logs = logs.slice(0, 200);
    }
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
    return newLog;
  },

  getAuditLogs() {
    let logs = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!logs) {
      logs = JSON.stringify([]);
      localStorage.setItem(AUDIT_LOGS_KEY, logs);
    }
    return JSON.parse(logs);
  },

  // Dynamic Categories Management
  getCategories() {
    let cats = localStorage.getItem(CATEGORIES_KEY);
    if (!cats) {
      cats = JSON.stringify(DEFAULT_CATEGORIES);
      localStorage.setItem(CATEGORIES_KEY, cats);
    }
    return JSON.parse(cats);
  },

  addCategory(categoryName) {
    const cats = this.getCategories();
    const clean = categoryName.trim();
    if (!clean) return { success: false, message: "Nama kategori tidak boleh kosong." };
    if (cats.some(c => c.toLowerCase() === clean.toLowerCase())) {
      return { success: false, message: "Kategori tersebut sudah terdaftar." };
    }
    cats.push(clean);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
    this.logActivity(`Menambahkan kategori baru: ${clean}`, "", "success");
    return { success: true, categories: cats };
  },

  deleteCategory(categoryName) {
    const cats = this.getCategories();
    const idx = cats.findIndex(c => c.toLowerCase() === categoryName.toLowerCase());
    if (idx === -1) return { success: false, message: "Kategori tidak ditemukan." };
    
    // Validate if any inventory items use this category
    const inventory = this.getInventory();
    const hasItems = inventory.some(item => item.category.toLowerCase() === categoryName.toLowerCase());
    if (hasItems) {
      return { success: false, message: `Kategori '${categoryName}' tidak dapat dihapus karena sedang digunakan oleh barang.` };
    }

    cats.splice(idx, 1);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
    this.logActivity(`Menghapus kategori: ${categoryName}`, "", "danger");
    return { success: true, categories: cats };
  }
};
