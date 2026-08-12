// src/js/router.js

import { state } from './state.js';
import { renderDashboardCharts } from './charts.js';
import {
  showToast,
  showConfirm,
  showQRCodeModal,
  exportToExcel,
  exportToCSV,
  exportToPDF
} from './ui.js';

export const router = {
  activeView: 'dashboard',
  currentPage: 1,
  pageSize: 5,
  selectedArchiveCodes: [], // For bulk deletion
  uploadedPhotoBase64: "", // For photo preview
  dataArsipFilter: {
    searchQuery: '',
    categoryFilter: '',
    lowStockOnly: false,
    damagedOnly: false
  },
  riwayatTrxFilter: {
    activeFilter: 'all',
    searchQuery: ''
  },

  adjustUIForRole(role) {
    const isPeminjam = role === "Peminjam";
    
    // Sidebar elements to show/hide
    const adminViews = ['dashboard', 'tambah-arsip', 'cari-arsip', 'riwayat-transaksi', 'audit-logs', 'laporan', 'pengaturan'];
    adminViews.forEach(view => {
      const item = document.querySelector(`.sidebar-menu [data-view="${view}"]`);
      if (item) {
        item.style.display = isPeminjam ? 'none' : 'flex';
      }
    });

    // Rename Data Arsip for Borrower
    const dataArsipMenu = document.querySelector('.sidebar-menu [data-view="data-arsip"]');
    if (dataArsipMenu) {
      const span = dataArsipMenu.querySelector('span');
      if (span) {
        span.textContent = isPeminjam ? 'Sisa Stok Barang' : 'Data Arsip';
      }
    }

    // Hide notifications button for borrower
    const notifBtn = document.getElementById('notification-toggle-btn');
    if (notifBtn) {
      notifBtn.style.display = isPeminjam ? 'none' : 'flex';
    }
  },

  init() {
    // Listen to hash changes or menu clicks
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      // Handle logout hash
      if (hash === 'logout') {
        state.logout();
        showToast("Anda telah keluar dari sistem.", "success");
        window.location.hash = "";
        location.reload(); // Re-trigger auth flow
        return;
      }
      this.navigate(hash);
    });

    // Handle initial load
    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    this.navigate(initialHash);
  },

  navigate(viewName) {
    // Check if user is authenticated
    const session = state.getCurrentUser();
    if (!session) {
      document.getElementById('login-overlay').classList.remove('hidden');
      document.getElementById('app-wrapper').classList.add('hidden');
      return;
    }

    // Adjust UI based on role
    this.adjustUIForRole(session.user.role);

    // Route Protection
    if (session.user.role === "Peminjam") {
      const allowedViews = ['peminjaman', 'pengembalian', 'data-arsip', 'logout'];
      if (!allowedViews.includes(viewName)) {
        this.activeView = 'peminjaman';
        window.location.hash = '#peminjaman';
        return;
      }
    }

    this.activeView = viewName;
    this.currentPage = 1;
    this.selectedArchiveCodes = [];
    this.uploadedPhotoBase64 = "";

    // Clear filters unless transitioning to their respective views
    if (viewName !== 'data-arsip') {
      this.dataArsipFilter = {
        searchQuery: '',
        categoryFilter: '',
        lowStockOnly: false,
        damagedOnly: false
      };
    }
    if (viewName !== 'riwayat-transaksi') {
      this.riwayatTrxFilter = {
        activeFilter: 'all',
        searchQuery: ''
      };
    }

    // Update active state in sidebar menu
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    menuItems.forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update Breadcrumb
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent) {
      // Map view name to human readable string
      const viewNames = {
        'dashboard': 'Dashboard',
        'data-arsip': session.user.role === "Peminjam" ? 'Sisa Stok Barang' : 'Data Arsip',
        'tambah-arsip': 'Tambah Arsip',
        'cari-arsip': 'Cari Arsip',
        'peminjaman': 'Peminjaman Barang',
        'pengembalian': 'Pengembalian Barang',
        'riwayat-transaksi': 'Riwayat Transaksi',
        'audit-logs': 'Log Aktivitas Admin',
        'laporan': 'Laporan & Statistik',
        'pengaturan': 'Pengaturan Sistem'
      };
      breadcrumbCurrent.textContent = viewNames[viewName] || 'Dashboard';
    }

    this.renderActiveView();
  },

  renderActiveView() {
    const viewport = document.getElementById('app-viewport');
    if (!viewport) return;

    // Fade animation trigger
    viewport.style.opacity = '0';

    setTimeout(() => {
      switch (this.activeView) {
        case 'dashboard':
          this.renderDashboard(viewport);
          break;
        case 'data-arsip':
          this.renderDataArsip(viewport);
          break;
        case 'tambah-arsip':
          this.renderTambahArsip(viewport);
          break;
        case 'cari-arsip':
          this.renderCariArsip(viewport);
          break;
        case 'peminjaman':
          this.renderPeminjaman(viewport);
          break;
        case 'pengembalian':
          this.renderPengembalian(viewport);
          break;
        case 'riwayat-transaksi':
          this.renderRiwayatTransaksi(viewport);
          break;
        case 'audit-logs':
          this.renderAuditLogs(viewport);
          break;
        case 'laporan':
          this.renderLaporan(viewport);
          break;
        case 'pengaturan':
          this.renderPengaturan(viewport);
          break;
        default:
          this.renderDashboard(viewport);
      }
      viewport.style.opacity = '1';
      
      // Re-run lucide icons rendering
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 150);
  },

  // ==========================================
  // DASHBOARD VIEW
  // ==========================================
  renderDashboard(container) {
    const inventory = state.getInventory();
    const transactions = state.getTransactions();

    // Summary calculations
    const totalInventoryCount = inventory.reduce((acc, curr) => acc + curr.totalStock, 0);
    const totalArchiveItems = inventory.length;
    const availableItems = inventory.reduce((acc, curr) => acc + curr.availableStock, 0);
    const borrowedItems = inventory.reduce((acc, curr) => acc + curr.borrowedStock, 0);
    
    // Returned today
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const returnedTodayCount = transactions
      .filter(t => t.status === "Kembali" && t.actualReturnDate && new Date(t.actualReturnDate) >= startOfToday)
      .reduce((acc, curr) => acc + curr.qty, 0);

    const lowStockItems = inventory.filter(item => item.availableStock < 3 && item.status === "Aktif").length;
    const damagedItems = inventory.filter(item => item.condition === "Rusak" || item.condition === "Rusak Berat").length;

    // Timeline calculations
    const latestBorrowings = transactions.filter(t => t.status === "Dipinjam" || t.status === "Terlambat").slice(0, 3);
    const latestReturns = transactions.filter(t => t.status === "Kembali").slice(0, 3);
    const recentlyAdded = [...inventory].sort((a,b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, 3);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-area">
          <h1>Dashboard Logistik</h1>
          <p>Pemantauan real-time inventaris, status peminjaman, dan aktivitas kantor.</p>
        </div>
      </div>

      <!-- Summary Cards Grid -->
      <div class="dashboard-grid">
        <div class="stat-card card-total">
          <div class="stat-card-header">
            <span class="stat-card-title">Total Stok Fisik</span>
            <div class="stat-card-icon-box bg-info-soft text-info">
              <i data-lucide="package"></i>
            </div>
          </div>
          <span class="stat-card-value">${totalInventoryCount}</span>
        </div>

        <div class="stat-card card-archive">
          <div class="stat-card-header">
            <span class="stat-card-title">Jenis Barang</span>
            <div class="stat-card-icon-box bg-info-soft text-info">
              <i data-lucide="archive"></i>
            </div>
          </div>
          <span class="stat-card-value">${totalArchiveItems}</span>
        </div>

        <div class="stat-card card-available">
          <div class="stat-card-header">
            <span class="stat-card-title">Tersedia</span>
            <div class="stat-card-icon-box bg-success-soft text-success">
              <i data-lucide="check-circle-2"></i>
            </div>
          </div>
          <span class="stat-card-value">${availableItems}</span>
        </div>

        <div class="stat-card card-borrowed">
          <div class="stat-card-header">
            <span class="stat-card-title">Dipinjam</span>
            <div class="stat-card-icon-box bg-warning-soft text-warning">
              <i data-lucide="arrow-up-right"></i>
            </div>
          </div>
          <span class="stat-card-value">${borrowedItems}</span>
        </div>

        <div class="stat-card card-returned">
          <div class="stat-card-header">
            <span class="stat-card-title">Kembali Hari Ini</span>
            <div class="stat-card-icon-box bg-primary-soft text-primary">
              <i data-lucide="arrow-down-left"></i>
            </div>
          </div>
          <span class="stat-card-value">${returnedTodayCount}</span>
        </div>

        <div class="stat-card card-lowstock">
          <div class="stat-card-header">
            <span class="stat-card-title">Stok Rendah</span>
            <div class="stat-card-icon-box bg-danger-soft text-danger">
              <i data-lucide="alert-triangle"></i>
            </div>
          </div>
          <span class="stat-card-value">${lowStockItems}</span>
        </div>

        <div class="stat-card card-damaged">
          <div class="stat-card-header">
            <span class="stat-card-title">Barang Rusak</span>
            <div class="stat-card-icon-box text-purple" style="background-color:rgba(139,92,246,0.1); color:#8b5cf6;">
              <i data-lucide="wrench"></i>
            </div>
          </div>
          <span class="stat-card-value">${damagedItems}</span>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Statistik Peminjaman Bulanan (2026)</h3>
            <i data-lucide="trending-up" class="text-muted"></i>
          </div>
          <div class="chart-container">
            <canvas id="chart-monthly-borrowing"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Komposisi Kategori Aset</h3>
            <i data-lucide="pie-chart" class="text-muted"></i>
          </div>
          <div class="chart-container">
            <canvas id="chart-category-proportion"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Volume Masuk vs Peminjaman Aset</h3>
            <i data-lucide="bar-chart-3" class="text-muted"></i>
          </div>
          <div class="chart-container">
            <canvas id="chart-inventory-activity"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Top 10 Aset Paling Sering Dipinjam</h3>
            <i data-lucide="award" class="text-muted"></i>
          </div>
          <div class="chart-container">
            <canvas id="chart-top-borrowed"></canvas>
          </div>
        </div>
      </div>

      <!-- Bottom Layout Section -->
      <div class="dashboard-bottom-grid">
        <!-- Timeline Card -->
        <div class="activity-card">
          <div class="activity-tabs">
            <button class="activity-tab-btn active" id="tab-timeline-borrow">Peminjaman Terbaru</button>
            <button class="activity-tab-btn" id="tab-timeline-return">Pengembalian Terbaru</button>
            <button class="activity-tab-btn" id="tab-timeline-added">Arsip Masuk Baru</button>
          </div>
          
          <div id="timeline-container">
            <!-- Injected via JS based on Active Tab -->
          </div>
        </div>

        <!-- Quick Actions & Alerts Panel -->
        <div class="quick-actions-card">
          <h3 class="chart-card-title" style="margin-bottom:8px;">Aksi Cepat</h3>
          <button class="quick-action-btn" data-action="tambah-arsip">
            <div class="quick-action-left">
              <i data-lucide="plus-circle" class="text-primary"></i>
              <span>Tambah Arsip Baru</span>
            </div>
            <i data-lucide="chevron-right"></i>
          </button>
          <button class="quick-action-btn" data-action="peminjaman">
            <div class="quick-action-left">
              <i data-lucide="arrow-up-right" class="text-warning"></i>
              <span>Pinjamkan Barang</span>
            </div>
            <i data-lucide="chevron-right"></i>
          </button>
          <button class="quick-action-btn" data-action="pengembalian">
            <div class="quick-action-left">
              <i data-lucide="arrow-down-left" class="text-success"></i>
              <span>Kembalikan Barang</span>
            </div>
            <i data-lucide="chevron-right"></i>
          </button>
          <button class="quick-action-btn" data-action="cari-arsip">
            <div class="quick-action-left">
              <i data-lucide="search" class="text-info"></i>
              <span>Cari Detail Arsip</span>
            </div>
            <i data-lucide="chevron-right"></i>
          </button>
          <button class="quick-action-btn" data-action="laporan">
            <div class="quick-action-left">
              <i data-lucide="file-text" style="color:#8b5cf6;"></i>
              <span>Cetak Laporan</span>
            </div>
            <i data-lucide="chevron-right"></i>
          </button>
        </div>
      </div>
    `;

    // Render Charts
    const isDark = document.body.classList.contains('dark-theme');
    renderDashboardCharts(inventory, transactions, isDark);

    // Timeline Rendering Helpers
    const renderTimeline = (type) => {
      const el = document.getElementById('timeline-container');
      if (!el) return;

      let html = '';
      if (type === 'borrow') {
        if (latestBorrowings.length === 0) {
          html = `<div class="empty-state"><p>Tidak ada peminjaman aktif saat ini.</p></div>`;
        } else {
          html = `<div class="activity-timeline">`;
          latestBorrowings.forEach(t => {
            const isLate = t.status === "Terlambat";
            html += `
              <div class="timeline-item">
                <div class="timeline-icon-box ${isLate ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning'}">
                  <i data-lucide="arrow-up-right"></i>
                </div>
                <div class="timeline-content">
                  <h4>${t.borrowerName} meminjam ${t.qty} x ${t.itemName}</h4>
                  <p>Divisi: ${t.department} | Pengembalian: ${new Date(t.expectedReturnDate).toLocaleDateString("id-ID")}</p>
                </div>
                <span class="timeline-time">${isLate ? `Terlambat ${t.lateDays} hari` : 'Aktif'}</span>
              </div>
            `;
          });
          html += `</div>`;
        }
      } else if (type === 'return') {
        if (latestReturns.length === 0) {
          html = `<div class="empty-state"><p>Belum ada pengembalian yang tercatat.</p></div>`;
        } else {
          html = `<div class="activity-timeline">`;
          latestReturns.forEach(t => {
            html += `
              <div class="timeline-item">
                <div class="timeline-icon-box bg-success-soft text-success">
                  <i data-lucide="check-circle"></i>
                </div>
                <div class="timeline-content">
                  <h4>${t.borrowerName} mengembalikan ${t.qty} x ${t.itemName}</h4>
                  <p>Kondisi saat kembali: <strong>${t.conditionOnReturn}</strong></p>
                </div>
                <span class="timeline-time">${new Date(t.actualReturnDate).toLocaleDateString("id-ID")}</span>
              </div>
            `;
          });
          html += `</div>`;
        }
      } else {
        if (recentlyAdded.length === 0) {
          html = `<div class="empty-state"><p>Tidak ada data inventaris.</p></div>`;
        } else {
          html = `<div class="activity-timeline">`;
          recentlyAdded.forEach(item => {
            html += `
              <div class="timeline-item">
                <div class="timeline-icon-box bg-info-soft text-info">
                  <i data-lucide="plus-circle"></i>
                </div>
                <div class="timeline-content">
                  <h4>${item.name} ditambahkan ke sistem</h4>
                  <p>Kategori: ${item.category} | Lokasi: ${item.location} | Stok: ${item.totalStock}</p>
                </div>
                <span class="timeline-time">${new Date(item.dateAdded).toLocaleDateString("id-ID")}</span>
              </div>
            `;
          });
          html += `</div>`;
        }
      }

      el.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();
    };

    // Render default borrow timeline
    renderTimeline('borrow');

    // Bind Timeline Tabs
    document.getElementById('tab-timeline-borrow').onclick = (e) => {
      document.querySelectorAll('.activity-tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderTimeline('borrow');
    };
    document.getElementById('tab-timeline-return').onclick = (e) => {
      document.querySelectorAll('.activity-tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderTimeline('return');
    };
    document.getElementById('tab-timeline-added').onclick = (e) => {
      document.querySelectorAll('.activity-tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderTimeline('added');
    };

    // Bind Quick Actions buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.onclick = () => {
        const action = btn.getAttribute('data-action');
        this.navigate(action);
        window.location.hash = `#${action}`;
      };
    });

    // Bind Stat Cards clicks
    const bindCardClick = (selector, viewName, filterCallback) => {
      const card = container.querySelector(selector);
      if (card) {
        card.onclick = () => {
          if (filterCallback) filterCallback();
          this.navigate(viewName);
          window.location.hash = `#${viewName}`;
        };
      }
    };

    bindCardClick('.card-total', 'data-arsip');
    bindCardClick('.card-archive', 'data-arsip');
    bindCardClick('.card-available', 'data-arsip');
    
    bindCardClick('.card-borrowed', 'riwayat-transaksi', () => {
      this.riwayatTrxFilter = {
        activeFilter: 'active',
        searchQuery: ''
      };
    });
    
    bindCardClick('.card-returned', 'riwayat-transaksi', () => {
      this.riwayatTrxFilter = {
        activeFilter: 'today',
        searchQuery: ''
      };
    });
    
    bindCardClick('.card-lowstock', 'data-arsip', () => {
      this.dataArsipFilter = {
        searchQuery: '',
        categoryFilter: '',
        lowStockOnly: true,
        damagedOnly: false
      };
    });
    
    bindCardClick('.card-damaged', 'data-arsip', () => {
      this.dataArsipFilter = {
        searchQuery: '',
        categoryFilter: '',
        lowStockOnly: false,
        damagedOnly: true
      };
    });
  },

  // ==========================================
  // DATA ARSIP VIEW (CRUD table)
  // ==========================================
  renderDataArsip(container) {
    const inventory = state.getInventory();
    const currentUser = state.getCurrentUser().user;
    const isPeminjam = currentUser.role === "Peminjam";
    
    // Sort, search, category filters state
    let filteredInventory = [...inventory];
    let searchQuery = this.dataArsipFilter?.searchQuery || '';
    let categoryFilter = this.dataArsipFilter?.categoryFilter || '';
    let lowStockOnly = this.dataArsipFilter?.lowStockOnly || false;
    let damagedOnly = this.dataArsipFilter?.damagedOnly || false;
    let sortColumn = 'code';
    let sortDirection = 'asc';

    const renderTableContent = () => {
      // Apply filters
      let data = [...inventory];
      if (searchQuery) {
        data = data.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.barcode.includes(searchQuery) ||
          item.brand.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (categoryFilter) {
        data = data.filter(item => item.category === categoryFilter);
      }
      if (lowStockOnly) {
        data = data.filter(item => item.availableStock < 3 && item.status === "Aktif");
      }
      if (damagedOnly) {
        data = data.filter(item => item.condition === "Rusak" || item.condition === "Rusak Berat");
      }

      // Apply sorting
      data.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];
        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
      });

      filteredInventory = data;

      // Handle Pagination
      const totalItems = data.length;
      const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
      if (this.currentPage > totalPages) this.currentPage = totalPages;
      const startIdx = (this.currentPage - 1) * this.pageSize;
      const endIdx = startIdx + this.pageSize;
      const paginatedData = data.slice(startIdx, endIdx);

      // Render Bulk Action Bar if items selected
      const bulkBar = document.getElementById('bulk-actions-bar');
      if (bulkBar && !isPeminjam) {
        if (this.selectedArchiveCodes.length > 0) {
          bulkBar.classList.remove('hidden');
          document.getElementById('selected-count-label').textContent = `${this.selectedArchiveCodes.length} barang terpilih`;
        } else {
          bulkBar.classList.add('hidden');
        }
      }

      // Render Checkboxes state
      const masterCheckbox = document.getElementById('bulk-select-all');
      if (masterCheckbox && !isPeminjam) {
        masterCheckbox.checked = paginatedData.length > 0 && paginatedData.every(item => this.selectedArchiveCodes.includes(item.code));
      }

      // Render Rows HTML
      const tbody = document.getElementById('inventory-table-body');
      if (!tbody) return;

      if (paginatedData.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="${isPeminjam ? '7' : '8'}" class="text-center">
              <div class="empty-state">
                <i data-lucide="archive" class="empty-state-icon"></i>
                <h3>Tidak Ada Data Barang</h3>
                <p>Silakan tambahkan data arsip baru atau ubah filter pencarian Anda.</p>
              </div>
            </td>
          </tr>
        `;
        if (window.lucide) window.lucide.createIcons();
        document.getElementById('pagination-info').textContent = "Menampilkan 0 - 0 dari 0 barang";
        document.getElementById('btn-prev-page').disabled = true;
        document.getElementById('btn-next-page').disabled = true;
        return;
      }

      let rowsHtml = '';
      paginatedData.forEach(item => {
        const isChecked = this.selectedArchiveCodes.includes(item.code);
        
        rowsHtml += `
          <tr>
            ${isPeminjam ? '' : `
            <td>
              <label class="checkbox-container">
                <input type="checkbox" class="row-selector" data-code="${item.code}" ${isChecked ? 'checked' : ''} />
                <span class="checkmark"></span>
              </label>
            </td>
            `}
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td>${item.brand}</td>
            <td><span class="badge bg-info">${item.totalStock}</span></td>
            <td><span class="badge bg-success">${item.availableStock}</span></td>
            <td><span class="badge bg-warning">${item.borrowedStock}</span></td>
            <td>
              <div class="table-actions">
                <button class="btn-icon btn-view-item" data-code="${item.code}" title="Detail"><i data-lucide="eye"></i></button>
                ${isPeminjam ? '' : `
                <button class="btn-icon btn-edit-item" data-code="${item.code}" title="Ubah"><i data-lucide="edit-3"></i></button>
                <button class="btn-icon btn-print-qr" data-code="${item.code}" title="Cetak QR"><i data-lucide="qr-code"></i></button>
                <button class="btn-icon btn-icon-danger btn-delete-item" data-code="${item.code}" title="Hapus"><i data-lucide="trash-2"></i></button>
                `}
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = rowsHtml;
      if (window.lucide) window.lucide.createIcons();

      // Update Pagination Text
      document.getElementById('pagination-info').textContent = `Menampilkan ${startIdx + 1} - ${Math.min(endIdx, totalItems)} dari ${totalItems} barang`;
      document.getElementById('btn-prev-page').disabled = this.currentPage === 1;
      document.getElementById('btn-next-page').disabled = this.currentPage === totalPages;

      // Bind row selectors (Admin only)
      if (!isPeminjam) {
        tbody.querySelectorAll('.row-selector').forEach(cb => {
          cb.addEventListener('change', (e) => {
            const code = cb.getAttribute('data-code');
            if (e.target.checked) {
              this.selectedArchiveCodes.push(code);
            } else {
              this.selectedArchiveCodes = this.selectedArchiveCodes.filter(c => c !== code);
            }
            renderTableContent();
          });
        });
      }

      // Actions bindings
      tbody.querySelectorAll('.btn-view-item').forEach(btn => {
        btn.onclick = () => showDetailModal(btn.getAttribute('data-code'));
      });
      
      if (!isPeminjam) {
        tbody.querySelectorAll('.btn-edit-item').forEach(btn => {
          btn.onclick = () => triggerEditView(btn.getAttribute('data-code'));
        });
        tbody.querySelectorAll('.btn-print-qr').forEach(btn => {
          btn.onclick = () => {
            const item = inventory.find(i => i.code === btn.getAttribute('data-code'));
            if (item) showQRCodeModal(item);
          };
        });
        tbody.querySelectorAll('.btn-delete-item').forEach(btn => {
          btn.onclick = () => {
            const code = btn.getAttribute('data-code');
            const item = inventory.find(i => i.code === code);
            showConfirm("Hapus Barang", `Apakah Anda yakin ingin menghapus barang ${item.name} (${code})?`, () => {
              try {
                state.deleteInventoryItem(code);
                showToast(`Barang ${item.name} berhasil dihapus.`, "success");
                this.renderActiveView(); // reload view
              } catch (err) {
                showToast(err.message, "danger");
              }
            });
          };
        });
      }
    };

    // Helper functions inside view scope
    const showDetailModal = (code) => {
      const item = inventory.find(i => i.code === code);
      if (!item) return;

      const detailModal = document.getElementById('detail-modal');
      const detailTitle = document.getElementById('detail-modal-title');
      const detailBody = document.getElementById('detail-modal-body');
      const detailCloseBtn1 = document.getElementById('detail-modal-close');
      const detailCloseBtn2 = document.getElementById('detail-modal-close-btn');

      if (!detailModal || !detailBody) return;

      detailTitle.textContent = `Detail Arsip: ${item.name}`;

      // Build units table HTML
      let itemsTableHtml = '';
      if (item.items && item.items.length > 0) {
        itemsTableHtml = `
          <h4 style="margin-top: 24px; margin-bottom: 12px; font-size: 1rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
            <i data-lucide="layers" style="width: 18px; height: 18px;"></i> Daftar Unit Fisik (${item.items.length} unit)
          </h4>
          <div class="table-responsive" style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; margin-top: 8px; max-height: 400px; overflow-y: auto;">
            <table class="table-custom" style="margin-bottom: 0; font-size: 0.8125rem; width: 100%;">
              <thead style="background: var(--bg-secondary); position: sticky; top: 0; z-index: 1;">
                <tr>
                  <th style="padding: 12px; font-weight: 600; text-align: left; background: var(--bg-secondary);">Kode Unik</th>
                  <th style="padding: 12px; font-weight: 600; text-align: left; background: var(--bg-secondary);">No. Seri / IMEI</th>
                  <th style="padding: 12px; font-weight: 600; text-align: left; background: var(--bg-secondary);">No. Reg BMN</th>
                  <th style="padding: 12px; font-weight: 600; text-align: left; background: var(--bg-secondary);">Warna</th>
                  <th style="padding: 12px; font-weight: 600; text-align: left; background: var(--bg-secondary);">Kelengkapan</th>
                  <th style="padding: 12px; font-weight: 600; text-align: left; background: var(--bg-secondary);">Status / User</th>
                </tr>
              </thead>
              <tbody>
                ${item.items.map(unit => {
                  let statusBadgeClass = 'bg-success';
                  let statusText = unit.status || 'STORAGE';
                  
                  const statusUpper = statusText.toUpperCase();
                  if (statusUpper === 'DIPINJAM' || statusUpper === 'BORROWED') {
                    statusBadgeClass = 'bg-warning';
                    statusText = 'DIPINJAM';
                    if (unit.user) {
                      statusText = `DIPINJAM (${unit.user})`;
                    }
                  } else if (statusUpper === 'STORAGE') {
                    statusBadgeClass = 'bg-success';
                  } else if (statusUpper.includes('RUMAH') || statusUpper.includes('DI BAWA')) {
                    statusBadgeClass = 'bg-danger';
                  } else {
                    statusBadgeClass = 'bg-secondary';
                  }

                  return `
                    <tr>
                      <td style="padding: 12px; font-weight: 600; color: var(--primary-color);">${unit.code || '-'}</td>
                      <td style="padding: 12px; font-family: monospace; font-size: 0.775rem;">${unit.serialNumber || '-'}</td>
                      <td style="padding: 12px;">${unit.regBmn || '-'}</td>
                      <td style="padding: 12px;">${unit.warna ? `<span style="display:inline-block; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color); font-size:0.75rem;">${unit.warna}</span>` : '-'}</td>
                      <td style="padding: 12px;">${unit.kelengkapan || '-'}</td>
                      <td style="padding: 12px;">
                        <span class="badge ${statusBadgeClass}" style="padding: 4px 8px; border-radius: 4px; font-weight: 500;">${statusText}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        itemsTableHtml = `
          <p style="text-align: center; color: var(--text-muted); margin-top: 24px;">Tidak ada rincian unit fisik untuk barang ini.</p>
        `;
      }

      const detailHtml = `
        <div style="text-align:left;">
          <!-- Meta Card -->
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Nama Kategori</span>
              <strong style="font-size: 0.95rem; color: var(--text-main);">${item.category}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Merek / Brand</span>
              <strong style="font-size: 0.95rem; color: var(--text-main);">${item.brand}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Model / Tipe</span>
              <strong style="font-size: 0.95rem; color: var(--text-main);">${item.model || '-'}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Total Stok</span>
              <strong style="font-size: 0.95rem; color: var(--text-main);">${item.totalStock} Unit</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Tersedia</span>
              <strong style="font-size: 0.95rem; color: var(--text-success);">${item.availableStock} Unit</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Sedang Dipinjam</span>
              <strong style="font-size: 0.95rem; color: var(--text-warning);">${item.borrowedStock} Unit</strong>
            </div>
          </div>
          
          <!-- Physical Units Table -->
          ${itemsTableHtml}
        </div>
      `;

      detailBody.innerHTML = detailHtml;
      detailModal.classList.remove('hidden');

      if (window.lucide) window.lucide.createIcons();

      const closeModal = () => {
        detailModal.classList.add('hidden');
      };

      detailCloseBtn1.onclick = closeModal;
      detailCloseBtn2.onclick = closeModal;
    };

    const triggerEditView = (code) => {
      const item = inventory.find(i => i.code === code);
      if (!item) return;

      this.navigate('tambah-arsip');
      // Update form after navigation renders Tambah Arsip
      setTimeout(() => {
        const title = document.querySelector('.view-title-area h1');
        if (title) title.textContent = "Ubah Arsip Logistik";
        
        document.getElementById('form-mode').value = "edit";
        document.getElementById('form-edit-code').value = item.code;
        document.getElementById('archive-code-display').value = item.code;
        document.getElementById('archive-barcode').value = item.barcode;
        document.getElementById('archive-name').value = item.name;
        document.getElementById('archive-category').value = item.category;
        document.getElementById('archive-brand').value = item.brand;
        document.getElementById('archive-model').value = item.model;
        document.getElementById('archive-serial').value = item.serialNumber;
        document.getElementById('archive-location').value = item.location;
        document.getElementById('archive-stock').value = item.totalStock;
        document.getElementById('archive-description').value = item.description;
        document.getElementById('archive-condition').value = item.condition;

        if (item.photo) {
          this.uploadedPhotoBase64 = item.photo;
          const dropzone = document.getElementById('photo-dropzone');
          if (dropzone) {
            dropzone.innerHTML = `
              <div class="image-preview-container">
                <div class="image-preview-box">
                  <img src="${item.photo}" alt="Preview" />
                  <button type="button" class="btn-remove-preview" id="btn-remove-photo">&times;</button>
                </div>
                <p style="font-size:0.75rem; color:var(--text-muted);">Klik tombol silang untuk menghapus foto</p>
              </div>
            `;
            document.getElementById('btn-remove-photo').onclick = (e) => {
              e.stopPropagation();
              this.uploadedPhotoBase64 = "";
              resetDropzone();
            };
          }
        }
      }, 200);
    };

    const resetDropzone = () => {
      const dropzone = document.getElementById('photo-dropzone');
      if (dropzone) {
        dropzone.innerHTML = `
          <div class="file-upload-content">
            <i data-lucide="cloud-lightning"></i>
            <h4>Seret foto ke sini atau klik untuk unggah</h4>
            <p>PNG, JPG, atau WEBP hingga 2MB</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
    };

    // Get categories from settings database
    const categories = state.getCategories();
    let categoryOptions = '<option value="">Semua Kategori</option>';
    categories.forEach(cat => {
      categoryOptions += `<option value="${cat}">${cat}</option>`;
    });

    // Layout
    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-area">
          <h1>${isPeminjam ? 'Sisa Stok Barang' : 'Data Arsip Logistik'}</h1>
          <p>${isPeminjam ? 'Pantau ketersediaan stok fisik barang logistik kantor.' : 'Kelola seluruh berkas inventaris, kondisi, pencetakan QR Code, dan volume stok.'}</p>
        </div>
        ${isPeminjam ? '' : '<button class="btn btn-primary" id="btn-nav-tambah"><i data-lucide="plus"></i>Tambah Arsip</button>'}
      </div>

      <!-- Bulk Actions Bar -->
      ${isPeminjam ? '' : `
      <div class="bulk-actions-bar hidden" id="bulk-actions-bar">
        <span class="bulk-actions-left" id="selected-count-label">0 barang terpilih</span>
        <div class="table-actions">
          <button class="btn btn-secondary" id="btn-bulk-cancel">Batal</button>
          <button class="btn btn-danger" id="btn-bulk-delete"><i data-lucide="trash-2"></i>Hapus Terpilih</button>
        </div>
      </div>
      `}

      <!-- Core Table Wrapper -->
      <div class="main-card">
        <div class="table-controls">
          <div class="controls-left">
            <div class="search-wrapper">
              <i data-lucide="search"></i>
              <input type="text" id="table-search" placeholder="Cari Kode, Nama, Barcode, Merek..." />
            </div>

            <div class="select-wrapper">
              <select id="filter-category">
                ${categoryOptions}
              </select>
            </div>
          </div>

          <div class="controls-right">
            <div class="select-wrapper">
              <select id="sort-column-select">
                <option value="code">Kode Arsip</option>
                <option value="name">Nama Barang</option>
                <option value="category">Kategori</option>
                <option value="totalStock">Total Stok</option>
                <option value="availableStock">Stok Tersedia</option>
              </select>
            </div>
            
            <button class="btn btn-secondary" id="btn-toggle-sort-direction" title="Ganti Arah Urutan">
              <i data-lucide="arrow-up-narrow-wide" id="sort-direction-icon"></i>
            </button>

            <button class="btn btn-secondary" id="btn-export-excel"><i data-lucide="file-spreadsheet"></i>Excel</button>
            <button class="btn btn-secondary" id="btn-export-csv">CSV</button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                ${isPeminjam ? '' : `
                <th width="40">
                  <label class="checkbox-container">
                    <input type="checkbox" id="bulk-select-all" />
                    <span class="checkmark"></span>
                  </label>
                </th>
                `}
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Merek</th>
                <th>Total</th>
                <th>Tersedia</th>
                <th>Dipinjam</th>
                <th width="${isPeminjam ? '60' : '150'}">Aksi</th>
              </tr>
            </thead>
            <tbody id="inventory-table-body">
              <!-- Injected dynamically -->
            </tbody>
          </table>
        </div>

        <div class="table-pagination">
          <span id="pagination-info">Menampilkan 0 - 0 dari 0 barang</span>
          <div class="pagination-buttons">
            <button class="pagination-btn" id="btn-prev-page">Sebelumnya</button>
            <button class="pagination-btn" id="btn-next-page">Berikutnya</button>
          </div>
        </div>
      </div>
    `;

    // Pre-populate input values from router filter
    const searchInput = document.getElementById('table-search');
    if (searchInput) searchInput.value = searchQuery;

    const catSelect = document.getElementById('filter-category');
    if (catSelect) catSelect.value = categoryFilter;

    // Render table
    renderTableContent();

    // Event Bindings
    if (!isPeminjam) {
      document.getElementById('btn-nav-tambah').onclick = () => {
        this.navigate('tambah-arsip');
        window.location.hash = '#tambah-arsip';
      };
    }

    // Live search input
    document.getElementById('table-search').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      lowStockOnly = false;
      damagedOnly = false;
      if (this.dataArsipFilter) {
        this.dataArsipFilter.searchQuery = searchQuery;
        this.dataArsipFilter.lowStockOnly = false;
        this.dataArsipFilter.damagedOnly = false;
      }
      this.currentPage = 1;
      renderTableContent();
    });

    // Category filter
    document.getElementById('filter-category').addEventListener('change', (e) => {
      categoryFilter = e.target.value;
      lowStockOnly = false;
      damagedOnly = false;
      if (this.dataArsipFilter) {
        this.dataArsipFilter.categoryFilter = categoryFilter;
        this.dataArsipFilter.lowStockOnly = false;
        this.dataArsipFilter.damagedOnly = false;
      }
      this.currentPage = 1;
      renderTableContent();
    });

    // Sorting column
    document.getElementById('sort-column-select').addEventListener('change', (e) => {
      sortColumn = e.target.value;
      renderTableContent();
    });

    // Sorting direction
    const directionBtn = document.getElementById('btn-toggle-sort-direction');
    directionBtn.onclick = () => {
      const icon = document.getElementById('sort-direction-icon');
      if (sortDirection === 'asc') {
        sortDirection = 'desc';
        icon.setAttribute('data-lucide', 'arrow-down-wide-narrow');
      } else {
        sortDirection = 'asc';
        icon.setAttribute('data-lucide', 'arrow-up-narrow-wide');
      }
      if (window.lucide) window.lucide.createIcons();
      renderTableContent();
    };

    // Pagination Click events
    document.getElementById('btn-prev-page').onclick = () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        renderTableContent();
      }
    };
    document.getElementById('btn-next-page').onclick = () => {
      this.currentPage++;
      renderTableContent();
    };

    // Export Excel/CSV triggers
    document.getElementById('btn-export-excel').onclick = () => {
      // Export current filtered rows
      const exportData = filteredInventory.map(item => ({
        "Kode Arsip": item.code,
        "Barcode": item.barcode,
        "Nama Barang": item.name,
        "Kategori": item.category,
        "Merek": item.brand,
        "Model": item.model,
        "No Seri": item.serialNumber,
        "Lokasi Penyimpanan": item.location,
        "Total Stok": item.totalStock,
        "Stok Tersedia": item.availableStock,
        "Stok Dipinjam": item.borrowedStock,
        "Kondisi": item.condition,
        "Status": item.status,
        "Tanggal Dibuat": new Date(item.dateAdded).toLocaleDateString("id-ID")
      }));
      exportToExcel(exportData, `Arsip-Logistik-${new Date().toISOString().substring(0, 10)}`);
    };

    document.getElementById('btn-export-csv').onclick = () => {
      const exportData = filteredInventory.map(item => ({
        "Kode Arsip": item.code,
        "Barcode": item.barcode,
        "Nama Barang": item.name,
        "Kategori": item.category,
        "Merek": item.brand,
        "Model": item.model,
        "No Seri": item.serialNumber,
        "Lokasi Penyimpanan": item.location,
        "Total Stok": item.totalStock,
        "Stok Tersedia": item.availableStock,
        "Stok Dipinjam": item.borrowedStock,
        "Kondisi": item.condition,
        "Status": item.status,
        "Tanggal Dibuat": new Date(item.dateAdded).toLocaleDateString("id-ID")
      }));
      exportToCSV(exportData, `Arsip-Logistik-${new Date().toISOString().substring(0, 10)}`);
    };

    // Master check selector (Admin only)
    if (!isPeminjam) {
      document.getElementById('bulk-select-all').addEventListener('change', (e) => {
        const startIdx = (this.currentPage - 1) * this.pageSize;
        const paginatedData = filteredInventory.slice(startIdx, startIdx + this.pageSize);

        if (e.target.checked) {
          paginatedData.forEach(item => {
            if (!this.selectedArchiveCodes.includes(item.code)) {
              this.selectedArchiveCodes.push(item.code);
            }
          });
        } else {
          const paginatedCodes = paginatedData.map(item => item.code);
          this.selectedArchiveCodes = this.selectedArchiveCodes.filter(code => !paginatedCodes.includes(code));
        }
        renderTableContent();
      });

      // Bulk action cancel
      document.getElementById('btn-bulk-cancel').onclick = () => {
        this.selectedArchiveCodes = [];
        renderTableContent();
      };

      // Bulk action delete
      document.getElementById('btn-bulk-delete').onclick = () => {
        showConfirm(
          "Hapus Masal Barang",
          `Apakah Anda yakin ingin menghapus ${this.selectedArchiveCodes.length} barang secara permanen?`,
          () => {
            try {
              state.bulkDeleteInventoryItems(this.selectedArchiveCodes);
              showToast(`${this.selectedArchiveCodes.length} barang berhasil dihapus.`, "success");
              this.selectedArchiveCodes = [];
              this.renderActiveView(); // reload layout
            } catch (err) {
              showToast(err.message, "danger");
            }
          }
        );
      };
    }
  },

  // ==========================================
  // TAMBAH ARSIP VIEW
  // ==========================================
  renderTambahArsip(container) {
    const isEdit = false;
    const generatedCode = state.generateArchiveCode();
    const generatedBarcode = String(Math.floor(1000000000000 + Math.random() * 9000000000000));

    const categories = state.getCategories();
    let categorySelectOptions = '<option value="">Pilih Kategori</option>';
    categories.forEach(cat => {
      categorySelectOptions += `<option value="${cat}">${cat}</option>`;
    });

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-area">
          <h1>Registrasi Arsip Inventaris</h1>
          <p>Masukkan detail logistik kantor ke dalam sistem log database.</p>
        </div>
      </div>

      <div class="main-card form-card">
        <form id="form-register-archive">
          <!-- Hidden helper flags and auto generated fields -->
          <input type="hidden" id="form-mode" value="add" />
          <input type="hidden" id="form-edit-code" value="" />
          <input type="hidden" id="archive-code-display" value="${generatedCode}" />
          <input type="hidden" id="archive-barcode" value="${generatedBarcode}" />
          <input type="hidden" id="archive-model" value="-" />
          <input type="hidden" id="archive-serial" value="-" />
          <input type="hidden" id="archive-location" value="Gudang" />
          <input type="hidden" id="archive-condition" value="Baik" />
          <input type="hidden" id="archive-description" value="" />

          <div class="form-grid">
            <div class="form-group">
              <label for="archive-name">Nama Barang *</label>
              <input type="text" id="archive-name" placeholder="Contoh: Laptop ThinkPad T490" required />
            </div>

            <div class="form-group">
              <label for="archive-category">Kategori *</label>
              <select id="archive-category" required>
                ${categorySelectOptions}
              </select>
            </div>

            <div class="form-group">
              <label for="archive-brand">Merek *</label>
              <input type="text" id="archive-brand" placeholder="Contoh: Lenovo, Epson, Uticon" required />
            </div>

            <div class="form-group">
              <label for="archive-stock">Jumlah Stok Awal *</label>
              <input type="number" id="archive-stock" min="1" placeholder="Contoh: 10" required />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="btn-form-cancel">Batal</button>
            <button type="button" class="btn btn-secondary" id="btn-form-reset">Reset</button>
            <button type="submit" class="btn btn-primary" id="btn-form-save">Simpan Registrasi</button>
          </div>
        </form>
      </div>
    `;

    // Dropzone File Upload Binding
    const dropzone = document.getElementById('photo-dropzone');
    const fileInput = document.getElementById('file-photo-input');

    const handleFile = (file) => {
      if (!file || !dropzone) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast("Ukuran berkas melebihi batas 2MB.", "danger");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadedPhotoBase64 = e.target.result;
        dropzone.innerHTML = `
          <div class="image-preview-container">
            <div class="image-preview-box">
              <img src="${e.target.result}" alt="Preview" />
              <button type="button" class="btn-remove-preview" id="btn-remove-photo">&times;</button>
            </div>
            <p style="font-size:0.75rem; color:var(--text-muted);">Foto terpilih: ${file.name}</p>
          </div>
        `;
        const removePhotoBtn = document.getElementById('btn-remove-photo');
        if (removePhotoBtn) {
          removePhotoBtn.onclick = (e) => {
            e.stopPropagation();
            this.uploadedPhotoBase64 = "";
            resetDropzone();
          };
        }
      };
      reader.readAsDataURL(file);
    };

    const resetDropzone = () => {
      if (dropzone) {
        dropzone.innerHTML = `
          <div class="file-upload-content">
            <i data-lucide="upload-cloud"></i>
            <h4>Seret foto ke sini atau klik untuk unggah</h4>
            <p>PNG, JPG, atau WEBP hingga 2MB</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
    };

    if (dropzone) {
      dropzone.onclick = () => fileInput.click();
    }
    if (fileInput) {
      fileInput.onchange = (e) => handleFile(e.target.files[0]);
    }

    // Drag-n-drop events
    if (dropzone) {
      dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary)';
        dropzone.style.backgroundColor = 'var(--primary-soft)';
      };
      dropzone.ondragleave = () => {
        dropzone.style.borderColor = 'var(--border-color)';
        dropzone.style.backgroundColor = 'var(--bg-app)';
      };
      dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border-color)';
        dropzone.style.backgroundColor = 'var(--bg-app)';
        handleFile(e.dataTransfer.files[0]);
      };
    }

    // Cancel and Reset clicks
    document.getElementById('btn-form-cancel').onclick = () => {
      this.navigate('data-arsip');
      window.location.hash = '#data-arsip';
    };

    document.getElementById('btn-form-reset').onclick = () => {
      document.getElementById('form-register-archive').reset();
      this.uploadedPhotoBase64 = "";
      resetDropzone();
    };

    // Form submit
    document.getElementById('form-register-archive').onsubmit = (e) => {
      e.preventDefault();
      const mode = document.getElementById('form-mode').value;
      const editCode = document.getElementById('form-edit-code').value;

      const itemData = {
        barcode: document.getElementById('archive-barcode').value,
        name: document.getElementById('archive-name').value,
        category: document.getElementById('archive-category').value,
        brand: document.getElementById('archive-brand').value,
        model: document.getElementById('archive-model').value,
        serialNumber: document.getElementById('archive-serial').value,
        location: document.getElementById('archive-location').value,
        totalStock: document.getElementById('archive-stock').value,
        condition: document.getElementById('archive-condition').value,
        description: document.getElementById('archive-description').value,
        photo: this.uploadedPhotoBase64
      };

      try {
        if (mode === "edit") {
          state.updateInventoryItem(editCode, itemData);
          showToast(`Berhasil mengubah arsip ${itemData.name}.`, "success");
        } else {
          state.addInventoryItem(itemData);
          showToast(`Berhasil mendaftarkan arsip ${itemData.name}.`, "success");
        }
        this.navigate('data-arsip');
        window.location.hash = '#data-arsip';
      } catch (err) {
        showToast(err.message, "danger");
      }
    };
  },

  // ==========================================
  // CARI ARSIP VIEW (Advanced search)
  // ==========================================
  renderCariArsip(container) {
    const inventory = state.getInventory();
    const categories = state.getCategories();
    let searchCategoryOptions = '<option value="">Semua Kategori</option>';
    categories.forEach(cat => {
      searchCategoryOptions += `<option value="${cat}">${cat}</option>`;
    });

    const triggerAdvancedSearch = () => {
      const nameQ = document.getElementById('search-name').value.toLowerCase();
      const catQ = document.getElementById('search-category').value;
      const brandQ = document.getElementById('search-brand').value.toLowerCase();

      let results = inventory.filter(item => {
        if (nameQ && !item.name.toLowerCase().includes(nameQ)) return false;
        if (catQ && item.category !== catQ) return false;
        if (brandQ && !item.brand.toLowerCase().includes(brandQ)) return false;
        return true;
      });

      const body = document.getElementById('search-results-tbody');
      if (!body) return;

      if (results.length === 0) {
        body.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">
              <div class="empty-state">
                <i data-lucide="search" class="empty-state-icon"></i>
                <h3>Hasil Tidak Ditemukan</h3>
                <p>Silakan sesuaikan filter pencarian Anda untuk mencari barang lainnya.</p>
              </div>
            </td>
          </tr>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      let rows = '';
      results.forEach(item => {
        rows += `
          <tr>
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td>${item.brand}</td>
            <td><span class="badge bg-success">${item.availableStock} / ${item.totalStock}</span></td>
            <td>
              <button class="btn btn-secondary btn-quick-borrow" data-code="${item.code}"><i data-lucide="arrow-up-right"></i>Pinjam</button>
            </td>
          </tr>
        `;
      });
      body.innerHTML = rows;
      if (window.lucide) window.lucide.createIcons();

      // Bind quick borrow button
      body.querySelectorAll('.btn-quick-borrow').forEach(btn => {
        btn.onclick = () => {
          const code = btn.getAttribute('data-code');
          this.navigate('peminjaman');
          window.location.hash = '#peminjaman';
          // Auto select item in borrow view
          setTimeout(() => {
            const select = document.getElementById('borrow-item-code');
            if (select) {
              select.value = code;
              select.dispatchEvent(new Event('change'));
            }
          }, 200);
        };
      });
    };

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-area">
          <h1>Pencarian Arsip Lanjutan</h1>
          <p>Gunakan pencarian granular untuk memantau status fisik barang.</p>
        </div>
      </div>

      <div class="main-card form-card" style="margin-bottom: 24px;">
        <div class="form-grid">
          <div class="form-group">
            <label for="search-name">Nama Barang</label>
            <input type="text" id="search-name" placeholder="Masukkan nama barang" />
          </div>

          <div class="form-group">
            <label for="search-category">Kategori</label>
            <select id="search-category">
              ${searchCategoryOptions}
            </select>
          </div>

          <div class="form-group">
            <label for="search-brand">Merek</label>
            <input type="text" id="search-brand" placeholder="Contoh: Lenovo, Epson" />
          </div>
        </div>

        <div class="form-actions" style="border:none; padding-top:0;">
          <button class="btn btn-secondary" id="btn-search-reset">Reset Parameter</button>
          <button class="btn btn-primary" id="btn-search-submit"><i data-lucide="search"></i>Cari Sekarang</button>
        </div>
      </div>

      <!-- Results Grid -->
      <div class="main-card">
        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Merek</th>
                <th>Tersedia / Total</th>
                <th width="100">Aksi</th>
              </tr>
            </thead>
            <tbody id="search-results-tbody">
              <tr>
                <td colspan="5" class="text-center text-muted" style="padding:48px;">
                  Masukkan parameter pencarian di atas untuk memfilter data arsip logistik.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bindings
    document.getElementById('btn-search-submit').onclick = triggerAdvancedSearch;
    document.getElementById('btn-search-reset').onclick = () => {
      document.getElementById('search-name').value = '';
      document.getElementById('search-category').value = '';
      document.getElementById('search-brand').value = '';
      document.getElementById('search-results-tbody').innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted" style="padding:48px;">
            Masukkan parameter pencarian di atas untuk memfilter data arsip logistik.
          </td>
        </tr>
      `;
    };
  },

  // ==========================================
  // PEMINJAMAN VIEW
  // ==========================================
  renderPeminjaman(container) {
    const inventory = state.getInventory().filter(i => i.status === "Aktif");
    const generatedTrxId = state.generateTransactionId();
    const currentUser = state.getCurrentUser().user;
    const isPeminjam = currentUser.role === "Peminjam";

    // Populate Item select options
    let itemOptions = '<option value="">Pilih Aset Logistik</option>';
    inventory.forEach(item => {
      itemOptions += `<option value="${item.code}">${item.name} (${item.code})</option>`;
    });

    let deptOptions = '';
    if (isPeminjam) {
      deptOptions = `
        <option value="">Pilih Subbagian</option>
        <option value="Metak">Metak</option>
        <option value="Medsos">Medsos</option>
        <option value="Analisis">Analisis</option>
      `;
    } else {
      deptOptions = `
        <option value="">Pilih Divisi</option>
        <option value="Metak">Metak</option>
        <option value="Medsos">Medsos</option>
        <option value="Analisis">Analisis</option>
        <option value="Divisi IT">Divisi IT</option>
        <option value="Divisi Kehumasan">Divisi Kehumasan</option>
        <option value="Divisi Keuangan">Divisi Keuangan</option>
        <option value="Divisi Perencanaan">Divisi Perencanaan</option>
        <option value="Divisi Umum & Rumah Tangga">Divisi Umum & Rumah Tangga</option>
      `;
    }

    let purposeFieldHtml = '';
    if (isPeminjam) {
      purposeFieldHtml = `
        <label for="borrow-purpose">Keperluan *</label>
        <select id="borrow-purpose" required>
          <option value="">Pilih Keperluan</option>
          <option value="Dinas">Dinas</option>
          <option value="Liputan">Liputan</option>
        </select>
      `;
    } else {
      purposeFieldHtml = `
        <label for="borrow-purpose">Tujuan Peminjaman *</label>
        <input type="text" id="borrow-purpose" class="form-control" placeholder="Tuliskan tujuan peminjaman secara jelas..." required style="width:100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; background: var(--bg-card); color: var(--text-main);" />
      `;
    }

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-area">
          <h1>Registrasi Transaksi Peminjaman</h1>
          <p>Keluarkan logistik kantor untuk kebutuhan pekerjaan operasional internal staf.</p>
        </div>
      </div>

      <form id="form-borrow-item">
        <!-- Borrower details card -->
        <div class="main-card form-card" style="margin-bottom: 24px;">
          <h3 style="margin-top:0; margin-bottom:20px; font-size:1.1rem; font-weight:600; display:flex; align-items:center; gap:8px;">
            <i data-lucide="user" style="color:var(--primary);"></i> Informasi Peminjam
          </h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="borrow-trx-id">ID Transaksi (Auto Generated)</label>
              <input type="text" id="borrow-trx-id" value="${generatedTrxId}" disabled />
            </div>

            <div class="form-group">
              <label for="borrower-name">Nama Peminjam *</label>
              <input type="text" id="borrower-name" placeholder="Nama lengkap pegawai" required />
            </div>

            <div class="form-group">
              <label for="borrower-nip">Nomor NIP / ID Pegawai *</label>
              <input type="text" id="borrower-nip" placeholder="Contoh: 19881023..." required />
            </div>

            <div class="form-group">
              <label for="borrower-dept">${isPeminjam ? 'Subbagian *' : 'Divisi / Bagian *'}</label>
              <select id="borrower-dept" required>
                ${deptOptions}
              </select>
            </div>

            <div class="form-group">
              <label for="borrower-phone">Nomor Telepon / WhatsApp *</label>
              <input type="tel" id="borrower-phone" placeholder="Contoh: 0812..." required />
            </div>

            <div class="form-group">
              <label for="execution-date">Tanggal Pelaksanaan *</label>
              <input type="date" id="execution-date" required />
            </div>

            <div class="form-group">
              <label for="borrow-date">Tanggal Peminjaman *</label>
              <input type="date" id="borrow-date" required />
            </div>

            <div class="form-group">
              <label for="borrow-expected-date">Tanggal Rencana Kembali *</label>
              <input type="date" id="borrow-expected-date" required />
            </div>

            <div class="form-group col-span-2">
              ${purposeFieldHtml}
            </div>

            <div class="form-group col-span-2">
              <label for="borrow-notes">Catatan Tambahan</label>
              <textarea id="borrow-notes" placeholder="Catatan kelengkapan aksesoris, kondisi khusus, dll..."></textarea>
            </div>
          </div>
        </div>

        <!-- Cart items card -->
        <div class="main-card form-card" style="margin-bottom: 24px;">
          <h3 style="margin-top:0; margin-bottom:20px; font-size:1.1rem; font-weight:600; display:flex; align-items:center; gap:8px;">
            <i data-lucide="shopping-bag" style="color:var(--primary);"></i> Daftar Barang yang Dipinjam
          </h3>
          
          <div id="borrow-cart-items" style="display:flex; flex-direction:column; gap:16px;">
            <!-- Injected dynamically -->
          </div>
          
          <button type="button" class="btn btn-secondary" id="btn-add-cart-item" style="margin-top:16px;">
            <i data-lucide="plus"></i> Tambah Barang Lain
          </button>
        </div>

        <!-- Evidence Upload Card -->
        <div class="main-card form-card" style="margin-bottom: 24px;">
          <h3 style="margin-top:0; margin-bottom:20px; font-size:1.1rem; font-weight:600; display:flex; align-items:center; gap:8px;">
            <i data-lucide="image" style="color:var(--primary);"></i> Unggah Bukti Peminjaman (Evidence)
          </h3>
          <div class="file-upload-wrapper" id="borrow-evidence-wrapper" style="border: 2px dashed var(--border-color); border-radius: 8px; padding: 20px; text-align: center; background: var(--bg-card); cursor: pointer; transition: border-color 0.2s;">
            <input type="file" id="borrow-evidence" accept="image/*" style="display:none;" />
            <div id="borrow-evidence-preview-container" style="display:none; margin-bottom: 12px; position: relative; max-width: 200px; margin-left: auto; margin-right: auto;">
              <img id="borrow-evidence-preview" src="" style="width:100%; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 150px; object-fit: cover;" />
              <button type="button" id="btn-remove-borrow-evidence" style="position: absolute; top: -8px; right: -8px; background: var(--danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">&times;</button>
            </div>
            <div id="borrow-evidence-placeholder">
              <i data-lucide="upload-cloud" style="width: 32px; height: 32px; color: var(--primary); margin-bottom: 8px;"></i>
              <p style="font-weight: 500; font-size: 0.875rem; margin: 0;">Klik untuk Unggah Gambar Bukti / Nota</p>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 0;">Format: PNG, JPG, JPEG (Max. 2MB)</p>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="btn-borrow-cancel">Batal</button>
          <button type="submit" class="btn btn-primary">Konfirmasi Peminjaman</button>
        </div>
      </form>
    `;

    // Set default borrow date to today, execution date to today, expected return to 3 days in future
    const todayStr = new Date().toISOString().substring(0, 10);
    document.getElementById('borrow-date').value = todayStr;
    document.getElementById('execution-date').value = todayStr;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    document.getElementById('borrow-expected-date').value = futureDate.toISOString().substring(0, 10);

    // Prepopulate logged in borrower details
    if (isPeminjam) {
      document.getElementById('borrower-name').value = currentUser.name || "Peminjam Logistik";
      document.getElementById('borrower-phone').value = "08123456789";
      document.getElementById('borrower-nip').value = "199510122020121002";
    }

    // Cart-based local state
    let cart = [];
    let cartIdCounter = 0;

    const addCartRow = (initialCode = '') => {
      const rowId = ++cartIdCounter;
      cart.push({ id: rowId, itemCode: initialCode, qty: 1, selectedUnits: [] });
      renderCart();
    };

    const renderCart = () => {
      const cartContainer = document.getElementById('borrow-cart-items');
      if (!cartContainer) return;

      if (cart.length === 0) {
        cartContainer.innerHTML = `
          <div style="text-align:center; padding:32px; border:2px dashed var(--border-color); border-radius:8px; color:var(--text-muted);">
            <i data-lucide="shopping-cart" style="width:32px; height:32px; margin-bottom:8px;"></i>
            <p style="margin:0;">Keranjang peminjaman kosong. Klik tombol di bawah untuk menambah barang.</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      let html = '';
      cart.forEach((row) => {
        // Pre-build options with selected status
        let options = `<option value="">Pilih Aset Logistik</option>`;
        inventory.forEach(item => {
          options += `<option value="${item.code}" ${row.itemCode === item.code ? 'selected' : ''}>${item.name} (${item.code})</option>`;
        });

        // Stock preview text
        let stockText = '-';
        let isLowStock = false;
        let matchedItem = inventory.find(i => i.code === row.itemCode);
        if (matchedItem) {
          stockText = `Tersedia: ${matchedItem.availableStock} Unit (Total: ${matchedItem.totalStock})`;
          if (matchedItem.availableStock === 0) isLowStock = true;
        }

        // Build Unit Selection Inputs based on quantity (qty)
        let unitsSelectHtml = '';
        if (matchedItem && matchedItem.items && matchedItem.items.length > 0) {
          const availableUnits = matchedItem.items.filter(u => u.status === 'STORAGE');
          
          unitsSelectHtml = `
            <div style="font-size:0.8rem; font-weight:600; color:var(--text-muted); margin-bottom:4px; margin-top:8px;">Pilih Unit Fisik (Serial Number / IMEI):</div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
          `;
          
          for (let q = 0; q < row.qty; q++) {
            let selectedUnitCode = row.selectedUnits[q] || '';
            
            // Build option list for this specific unit input
            let unitOptionsHtml = `<option value="">Pilih Unit / IMEI</option>`;
            availableUnits.forEach(u => {
              const isSelectedElsewhere = row.selectedUnits.some((val, idx) => val === u.code && idx !== q);
              if (!isSelectedElsewhere) {
                unitOptionsHtml += `<option value="${u.code}" ${selectedUnitCode === u.code ? 'selected' : ''}>${u.serialNumber} (${u.code})</option>`;
              }
            });

            unitsSelectHtml += `
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block;">Unit ${q + 1} *</label>
                <select class="cart-unit-select" data-row-id="${row.id}" data-unit-index="${q}" required style="padding: 8px 12px; font-size: 0.8125rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-card); color: var(--text-main); width:100%;">
                  ${unitOptionsHtml}
                </select>
              </div>
            `;
          }
          unitsSelectHtml += `</div>`;
        }

        html += `
          <div class="cart-item-row" data-row-id="${row.id}" style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px; padding:16px; position:relative; display:flex; flex-direction:column; gap:12px;">
            <button type="button" class="btn-remove-cart-item" data-row-id="${row.id}" style="position:absolute; top:8px; right:8px; background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem; line-height:1;">&times;</button>
            
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:16px;">
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.8rem; font-weight:600; margin-bottom:8px; display:block;">Nama Barang *</label>
                <select class="cart-item-select" data-row-id="${row.id}" required style="border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; background: var(--bg-card); color: var(--text-main); width:100%;">
                  ${options}
                </select>
                <span style="font-size:0.75rem; margin-top:4px; display:block; color:${isLowStock ? 'var(--danger)' : 'var(--text-muted)'};">${stockText}</span>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.8rem; font-weight:600; margin-bottom:8px; display:block;">Jumlah (Qty) *</label>
                <input type="number" class="cart-item-qty" data-row-id="${row.id}" min="1" max="${matchedItem ? matchedItem.availableStock : 1}" value="${row.qty}" required ${isLowStock ? 'disabled' : ''} style="border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; background: var(--bg-card); color: var(--text-main); width:100%;" />
              </div>
            </div>

            ${unitsSelectHtml}
          </div>
        `;
      });

      cartContainer.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      // Bind events inside the cart
      cartContainer.querySelectorAll('.btn-remove-cart-item').forEach(btn => {
        btn.onclick = () => {
          const rowId = parseInt(btn.getAttribute('data-row-id'));
          cart = cart.filter(r => r.id !== rowId);
          renderCart();
        };
      });

      cartContainer.querySelectorAll('.cart-item-select').forEach(select => {
        select.onchange = (e) => {
          const rowId = parseInt(select.getAttribute('data-row-id'));
          const code = e.target.value;
          const row = cart.find(r => r.id === rowId);
          if (row) {
            row.itemCode = code;
            row.qty = 1;
            row.selectedUnits = [];
            renderCart();
          }
        };
      });

      cartContainer.querySelectorAll('.cart-item-qty').forEach(input => {
        input.onchange = (e) => {
          const rowId = parseInt(input.getAttribute('data-row-id'));
          const qty = Math.max(1, parseInt(e.target.value) || 1);
          const row = cart.find(r => r.id === rowId);
          if (row) {
            const matchedItem = inventory.find(i => i.code === row.itemCode);
            if (matchedItem && qty > matchedItem.availableStock) {
              showToast(`Stok tidak mencukupi untuk ${matchedItem.name}. Tersedia: ${matchedItem.availableStock}`, 'danger');
              input.value = matchedItem.availableStock;
              row.qty = matchedItem.availableStock;
            } else {
              row.qty = qty;
            }
            while (row.selectedUnits.length > row.qty) {
              row.selectedUnits.pop();
            }
            renderCart();
          }
        };
      });

      cartContainer.querySelectorAll('.cart-unit-select').forEach(select => {
        select.onchange = (e) => {
          const rowId = parseInt(select.getAttribute('data-row-id'));
          const unitIdx = parseInt(select.getAttribute('data-unit-index'));
          const unitCode = e.target.value;
          const row = cart.find(r => r.id === rowId);
          if (row) {
            row.selectedUnits[unitIdx] = unitCode;
            renderCart();
          }
        };
      });
    };

    // Bind outer actions
    document.getElementById('btn-add-cart-item').onclick = () => {
      addCartRow();
    };

    // Add first row automatically
    addCartRow();

    // File Upload Handler for Borrowing Evidence
    let borrowEvidenceBase64 = "";
    const evidenceWrapper = document.getElementById('borrow-evidence-wrapper');
    const evidenceInput = document.getElementById('borrow-evidence');
    const previewContainer = document.getElementById('borrow-evidence-preview-container');
    const previewImg = document.getElementById('borrow-evidence-preview');
    const placeholderDiv = document.getElementById('borrow-evidence-placeholder');
    const removeBtn = document.getElementById('btn-remove-borrow-evidence');

    evidenceWrapper.onclick = (e) => {
      if (e.target.id === 'btn-remove-borrow-evidence' || e.target.closest('#btn-remove-borrow-evidence')) {
        return;
      }
      evidenceInput.click();
    };

    evidenceInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          showToast("Ukuran file tidak boleh melebihi 2MB", "danger");
          evidenceInput.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          borrowEvidenceBase64 = event.target.result;
          previewImg.src = borrowEvidenceBase64;
          previewContainer.style.display = 'block';
          placeholderDiv.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    };

    removeBtn.onclick = (e) => {
      e.stopPropagation();
      borrowEvidenceBase64 = "";
      evidenceInput.value = "";
      previewImg.src = "";
      previewContainer.style.display = 'none';
      placeholderDiv.style.display = 'block';
    };

    document.getElementById('btn-borrow-cancel').onclick = () => {
      this.navigate(isPeminjam ? 'data-arsip' : 'dashboard');
      window.location.hash = isPeminjam ? '#data-arsip' : '#dashboard';
    };

    // Form Submit handling
    document.getElementById('form-borrow-item').onsubmit = (e) => {
      e.preventDefault();

      if (cart.length === 0) {
        showToast("Mohon tambahkan minimal satu barang ke dalam daftar pinjaman.", "danger");
        return;
      }

      // Validate cart items
      const borrowItemsData = [];
      for (const row of cart) {
        if (!row.itemCode) {
          showToast("Mohon pilih barang untuk setiap baris yang ditambahkan.", "danger");
          return;
        }

        const selectedItem = inventory.find(i => i.code === row.itemCode);
        if (!selectedItem) {
          showToast("Barang tidak valid.", "danger");
          return;
        }

        if (selectedItem.availableStock < row.qty) {
          showToast(`Stok ${selectedItem.name} tidak mencukupi.`, "danger");
          return;
        }

        // Validate unit selections if units exist
        if (selectedItem.items && selectedItem.items.length > 0) {
          const filledUnits = row.selectedUnits.filter(Boolean);
          if (filledUnits.length < row.qty) {
            showToast(`Mohon pilih unit fisik (IMEI/SN) sebanyak ${row.qty} untuk ${selectedItem.name}.`, "danger");
            return;
          }
          
          const serials = filledUnits.map(code => {
            const unit = selectedItem.items.find(u => u.code === code);
            return unit ? unit.serialNumber : "";
          });

          borrowItemsData.push({
            itemCode: row.itemCode,
            qty: row.qty,
            unitCodes: filledUnits,
            unitSerials: serials
          });
        } else {
          borrowItemsData.push({
            itemCode: row.itemCode,
            qty: row.qty,
            unitCodes: [],
            unitSerials: []
          });
        }
      }

      const borrowDateVal = document.getElementById('borrow-date').value;
      const expectedDateVal = document.getElementById('borrow-expected-date').value;
      const executionDateVal = document.getElementById('execution-date').value;

      if (new Date(expectedDateVal) < new Date(borrowDateVal)) {
        showToast("Tanggal rencana pengembalian tidak boleh sebelum tanggal peminjaman.", "danger");
        return;
      }

      const borrowData = {
        borrowerName: document.getElementById('borrower-name').value,
        nip: document.getElementById('borrower-nip').value,
        department: document.getElementById('borrower-dept').value,
        phone: document.getElementById('borrower-phone').value,
        borrowDate: new Date(borrowDateVal).toISOString(),
        expectedReturnDate: new Date(expectedDateVal).toISOString(),
        executionDate: new Date(executionDateVal).toISOString(),
        purpose: document.getElementById('borrow-purpose').value,
        notes: document.getElementById('borrow-notes').value,
        evidenceUrl: borrowEvidenceBase64,
        items: borrowItemsData
      };

      try {
        state.borrowItem(borrowData);
        showToast("Registrasi peminjaman multi-item berhasil disimpan!", "success");
        if (isPeminjam) {
          this.navigate('pengembalian');
          window.location.hash = '#pengembalian';
        } else {
          this.navigate('riwayat-transaksi');
          window.location.hash = '#riwayat-transaksi';
        }
      } catch (err) {
        showToast(err.message, "danger");
      }
    };
  },

  renderPengembalian(container) {
    const currentUser = state.getCurrentUser().user;
    const isPeminjam = currentUser.role === "Peminjam";
    let transactions = state.getTransactions().filter(t => t.status === "Dipinjam" || t.status === "Terlambat");

    if (isPeminjam) {
      transactions = transactions.filter(t => t.username === currentUser.username || (currentUser.name && t.borrowerName.toLowerCase().includes(currentUser.name.toLowerCase())));
    }

    // Populate transaction options
    let trxOptions = '<option value="">Pilih Transaksi Peminjaman</option>';
    transactions.forEach(t => {
      trxOptions += `<option value="${t.id}">${t.id} - ${t.borrowerName} (${t.itemName})</option>`;
    });

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-area">
          <h1>Registrasi Transaksi Pengembalian</h1>
          <p>Proses pemulihan stok aset inventaris kantor dari peminjam internal.</p>
        </div>
      </div>

      <div class="main-card form-card">
        <form id="form-return-item">
          <div class="form-grid">
            <div class="form-group col-span-2">
              <label for="return-trx-id">Pilih ID Transaksi Aktif *</label>
              <select id="return-trx-id" required>
                ${trxOptions}
              </select>
            </div>

            <!-- Pre-filled info cards -->
            <div class="form-group">
              <label>Nama Peminjam</label>
              <input type="text" id="return-borrower-name" disabled />
            </div>

            <div class="form-group">
              <label>Barang Dipinjam</label>
              <input type="text" id="return-item-name" disabled />
            </div>

            <div class="form-group">
              <label>Jumlah (Qty) Dipinjam</label>
              <input type="text" id="return-qty" disabled />
            </div>

            <div class="form-group">
              <label>Tanggal Pinjam</label>
              <input type="text" id="return-borrow-date" disabled />
            </div>

            <div class="form-group">
              <label>Rencana Pengembalian</label>
              <input type="text" id="return-expected-date" disabled />
            </div>

            <div class="form-group">
              <label>Keterlambatan (Hari)</label>
              <input type="text" id="return-late-days" disabled style="font-weight:700;" />
            </div>

            <div class="form-group">
              <label for="return-date">Tanggal Dikembalikan *</label>
              <input type="date" id="return-date" required />
            </div>

            <div class="form-group">
              <label for="return-condition">Kondisi Aset Saat Kembali *</label>
              <select id="return-condition" required>
                <option value="Baik">Baik (Normal)</option>
                <option value="Rusak">Rusak Ringan / Berat</option>
              </select>
            </div>
            <div class="form-group col-span-2">
              <label for="return-notes">Catatan Kondisi / Keterangan</label>
              <textarea id="return-notes" placeholder="Catatan kondisi saat dikembalikan, denda jika rusak/terlambat, dll..."></textarea>
            </div>

            <div class="form-group col-span-2">
              <label>Unggah Bukti Pengembalian (Evidence - Foto Kondisi Aset Saat Kembali)</label>
              <div class="file-upload-wrapper" id="return-evidence-wrapper" style="border: 2px dashed var(--border-color); border-radius: 8px; padding: 20px; text-align: center; background: var(--bg-card); cursor: pointer; transition: border-color 0.2s;">
                <input type="file" id="return-evidence" accept="image/*" style="display:none;" />
                <div id="return-evidence-preview-container" style="display:none; margin-bottom: 12px; position: relative; max-width: 200px; margin-left: auto; margin-right: auto;">
                  <img id="return-evidence-preview" src="" style="width:100%; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 150px; object-fit: cover;" />
                  <button type="button" id="btn-remove-return-evidence" style="position: absolute; top: -8px; right: -8px; background: var(--danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">&times;</button>
                </div>
                <div id="return-evidence-placeholder">
                  <i data-lucide="upload-cloud" style="width: 32px; height: 32px; color: var(--primary); margin-bottom: 8px;"></i>
                  <p style="font-weight: 500; font-size: 0.875rem; margin: 0;">Klik untuk Unggah Gambar Bukti Pengembalian</p>
                  <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 0;">Format: PNG, JPG, JPEG (Max. 2MB)</p>
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="btn-return-cancel">Batal</button>
            <button type="submit" class="btn btn-primary" id="btn-return-submit" disabled>Konfirmasi Pengembalian</button>
          </div>
        </form>
      </div>
    `;

    // Set return date to today
    const todayStr = new Date().toISOString().substring(0, 10);
    document.getElementById('return-date').value = todayStr;

    // Transaction select handler
    const trxSelect = document.getElementById('return-trx-id');
    const submitBtn = document.getElementById('btn-return-submit');

    trxSelect.onchange = (e) => {
      const trxId = e.target.value;
      if (!trxId) {
        // clear fields
        document.getElementById('return-borrower-name').value = '';
        document.getElementById('return-item-name').value = '';
        document.getElementById('return-qty').value = '';
        document.getElementById('return-borrow-date').value = '';
        document.getElementById('return-expected-date').value = '';
        document.getElementById('return-late-days').value = '';
        submitBtn.disabled = true;
        return;
      }

      const trx = transactions.find(t => t.id === trxId);
      document.getElementById('return-borrower-name').value = trx.borrowerName;
      document.getElementById('return-item-name').value = trx.itemName;
      document.getElementById('return-qty').value = `${trx.qty} Unit`;
      document.getElementById('return-borrow-date').value = new Date(trx.borrowDate).toLocaleDateString("id-ID");
      document.getElementById('return-expected-date').value = new Date(trx.expectedReturnDate).toLocaleDateString("id-ID");
      
      // Calculate active late days based on current selected return date
      const returnDate = new Date(document.getElementById('return-date').value);
      const expected = new Date(trx.expectedReturnDate);
      if (returnDate > expected) {
        const diffTime = Math.abs(returnDate - expected);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        document.getElementById('return-late-days').value = `${days} Hari`;
        document.getElementById('return-late-days').className = "text-danger";
      } else {
        document.getElementById('return-late-days').value = "0 Hari";
        document.getElementById('return-late-days').className = "text-success";
      }

      submitBtn.disabled = false;
    };

    // Live late days update when return date changes
    document.getElementById('return-date').onchange = (e) => {
      const trxId = trxSelect.value;
      if (!trxId) return;

      const trx = transactions.find(t => t.id === trxId);
      const returnDate = new Date(e.target.value);
      const expected = new Date(trx.expectedReturnDate);
      if (returnDate > expected) {
        const diffTime = Math.abs(returnDate - expected);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        document.getElementById('return-late-days').value = `${days} Hari`;
        document.getElementById('return-late-days').className = "text-danger";
      } else {
        document.getElementById('return-late-days').value = "0 Hari";
        document.getElementById('return-late-days').className = "text-success";
      }
    };

    // Return file upload handling
    let returnEvidenceBase64 = "";
    const retWrapper = document.getElementById('return-evidence-wrapper');
    const retInput = document.getElementById('return-evidence');
    const retPreviewContainer = document.getElementById('return-evidence-preview-container');
    const retPreviewImg = document.getElementById('return-evidence-preview');
    const retPlaceholderDiv = document.getElementById('return-evidence-placeholder');
    const retRemoveBtn = document.getElementById('btn-remove-return-evidence');

    if (retWrapper) {
      retWrapper.onclick = (e) => {
        if (e.target.id === 'btn-remove-return-evidence' || e.target.closest('#btn-remove-return-evidence')) {
          return;
        }
        retInput.click();
      };
    }

    if (retInput) {
      retInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            showToast("Ukuran file tidak boleh melebihi 2MB", "danger");
            retInput.value = "";
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            returnEvidenceBase64 = event.target.result;
            retPreviewImg.src = returnEvidenceBase64;
            retPreviewContainer.style.display = 'block';
            retPlaceholderDiv.style.display = 'none';
          };
          reader.readAsDataURL(file);
        }
      };
    }

    if (retRemoveBtn) {
      retRemoveBtn.onclick = (e) => {
        e.stopPropagation();
        returnEvidenceBase64 = "";
        retInput.value = "";
        retPreviewImg.src = "";
        retPreviewContainer.style.display = 'none';
        retPlaceholderDiv.style.display = 'block';
      };
    }

    document.getElementById('btn-return-cancel').onclick = () => {
      this.navigate('dashboard');
      window.location.hash = '#dashboard';
    };

    document.getElementById('form-return-item').onsubmit = (e) => {
      e.preventDefault();
      const trxId = trxSelect.value;

      const returnData = {
        returnDate: new Date(document.getElementById('return-date').value).toISOString(),
        itemCondition: document.getElementById('return-condition').value,
        notes: document.getElementById('return-notes').value,
        returnEvidenceUrl: returnEvidenceBase64
      };

      try {
        state.returnItem(trxId, returnData);
        showToast("Pengembalian barang berhasil dicatat. Stok fisik dipulihkan.", "success");
        this.navigate('riwayat-transaksi');
        window.location.hash = '#riwayat-transaksi';
      } catch (err) {
        showToast(err.message, "danger");
      }
    };
  },

  // ==========================================
  // RIWAYAT TRANSAKSI VIEW
  // ==========================================
  renderRiwayatTransaksi(container) {
    const transactions = state.getTransactions();
    
    let activeFilter = this.riwayatTrxFilter?.activeFilter || 'all'; // 'all', 'today', 'week', 'month', 'active', 'returned'
    let searchQuery = this.riwayatTrxFilter?.searchQuery || '';

    const renderHistoryTable = () => {
      let data = [...transactions];

      // Apply tab filters
      const now = new Date();
      if (activeFilter === 'today') {
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        data = data.filter(t => new Date(t.borrowDate) >= startOfToday || (t.actualReturnDate && new Date(t.actualReturnDate) >= startOfToday));
      } else if (activeFilter === 'week') {
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - 7);
        data = data.filter(t => new Date(t.borrowDate) >= startOfWeek);
      } else if (activeFilter === 'month') {
        const startOfMonth = new Date();
        startOfMonth.setMonth(now.getMonth() - 1);
        data = data.filter(t => new Date(t.borrowDate) >= startOfMonth);
      } else if (activeFilter === 'active') {
        data = data.filter(t => t.status === "Dipinjam" || t.status === "Terlambat");
      } else if (activeFilter === 'returned') {
        data = data.filter(t => t.status === "Kembali");
      }

      // Apply search query
      if (searchQuery) {
        data = data.filter(t =>
          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.department.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Render table rows
      const tbody = document.getElementById('history-table-body');
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="10" class="text-center">
              <div class="empty-state">
                <i data-lucide="history" class="empty-state-icon"></i>
                <h3>Tidak Ada Riwayat Transaksi</h3>
                <p>Belum ada riwayat transaksi peminjaman/pengembalian yang memenuhi filter ini.</p>
              </div>
            </td>
          </tr>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      let rows = '';
      data.forEach(t => {
        let statusBadge = "bg-warning";
        if (t.status === "Kembali") statusBadge = "bg-success";
        if (t.status === "Terlambat") statusBadge = "bg-danger";

        const retDate = t.actualReturnDate ? new Date(t.actualReturnDate).toLocaleDateString("id-ID") : "-";

        rows += `
          <tr>
            <td><strong class="text-info">${t.id}</strong></td>
            <td><strong>${t.borrowerName}</strong><div style="font-size:0.75rem; color:var(--text-muted);">NIP: ${t.nip}</div></td>
            <td>${t.department}</td>
            <td>${t.itemName}<div style="font-size:0.75rem; color:var(--text-muted);">${t.itemCode}</div></td>
            <td><span class="badge bg-info">${t.qty}</span></td>
            <td>${new Date(t.borrowDate).toLocaleDateString("id-ID")}</td>
            <td>${retDate}</td>
            <td><span class="badge ${statusBadge}">${t.status}</span></td>
            <td>${t.lateDays > 0 ? `<span class="badge bg-danger">${t.lateDays} Hari</span>` : `<span class="badge bg-success">Tepat Waktu</span>`}</td>
            <td>
              <div class="table-actions">
                <button class="btn btn-secondary btn-trx-details" data-id="${t.id}" title="Detail"><i data-lucide="eye"></i>Detail</button>
                ${(t.status === "Dipinjam" || t.status === "Terlambat") ? `
                  <button class="btn-whatsapp btn-trx-wa" data-id="${t.id}" title="Kirim Pengingat WhatsApp" style="display:inline-flex; align-items:center; gap:6px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 1.98 14.13 .95 11.517.95c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.452 3.393 1.312 4.88L2.002 21.82l6.455-1.693z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = rows;
      if (window.lucide) window.lucide.createIcons();

      // Bind detail modal click
      tbody.querySelectorAll('.btn-trx-details').forEach(btn => {
        btn.onclick = () => showTrxDetailModal(btn.getAttribute('data-id'));
      });

      // Bind WhatsApp click
      tbody.querySelectorAll('.btn-trx-wa').forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          const t = transactions.find(trx => trx.id === id);
          if (!t) return;

          let phoneStr = t.phone.trim();
          if (phoneStr.startsWith('0')) {
            phoneStr = '62' + phoneStr.substring(1);
          } else if (phoneStr.startsWith('+')) {
            phoneStr = phoneStr.substring(1);
          }

          const isOverdue = t.status === "Terlambat";
          const formattedExpectedDate = new Date(t.expectedReturnDate).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          let message = `Halo ${t.borrowerName},\n\n`;
          if (isOverdue) {
            message += `⚠️ *PENGINGAT PENGEMBALIAN BARANG LOGISTIK*\n\n`;
            message += `Peminjaman barang *${t.itemName}* (Jumlah: ${t.qty} unit) dengan nomor transaksi *${t.id}* telah *MELEWATI TENGGAT WAKTU* pengembalian pada *${formattedExpectedDate}* (${t.lateDays} hari terlambat).\n\n`;
          } else {
            message += `📢 *PENGINGAT PENGEMBALIAN BARANG LOGISTIK*\n\n`;
            message += `Kami mengingatkan bahwa Anda meminjam barang *${t.itemName}* (Jumlah: ${t.qty} unit) dengan nomor transaksi *${t.id}*.\n`;
            message += `Batas waktu pengembalian barang adalah *${formattedExpectedDate}*.\n\n`;
          }
          message += `Mohon segera mengembalikan barang ke bagian Logistik dalam kondisi baik.\n\nTerima kasih.\n*LogiTrack Systems*`;

          const waUrl = `https://wa.me/${phoneStr}?text=${encodeURIComponent(message)}`;
          window.open(waUrl, '_blank');
          
          state.logActivity(`Mengirim pengingat WhatsApp`, `Transaksi: ${t.id}, Penerima: ${t.borrowerName} (${t.phone})`, "info");
          showToast(`Pengingat WhatsApp untuk ${t.borrowerName} telah dibuka.`, "success");
        };
      });
    };

    const showTrxDetailModal = (id) => {
      const t = transactions.find(trx => trx.id === id);
      if (!t) return;

      const isLate = t.status === "Terlambat";
      const statusBadge = t.status === "Kembali" ? "bg-success" : (isLate ? "bg-danger" : "bg-warning");

      let itemsListHtml = '';
      if (t.items && Array.isArray(t.items)) {
        itemsListHtml = `
          <div style="margin-top: 10px; border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; background: var(--bg-card);">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8125rem; text-align: left;">
              <thead>
                <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);">
                  <th style="padding: 10px 12px; font-weight: 600; color: var(--text-main);">Nama Barang</th>
                  <th style="padding: 10px 12px; font-weight: 600; text-align: center; width: 60px; color: var(--text-main);">Qty</th>
                  <th style="padding: 10px 12px; font-weight: 600; color: var(--text-main);">Unit / SN / IMEI</th>
                </tr>
              </thead>
              <tbody>
        `;
        t.items.forEach(item => {
          const serials = item.unitSerials && item.unitSerials.length > 0
            ? item.unitSerials.map((s, idx) => `<div>${s} <span style="font-size:0.7rem; color:var(--text-muted);">(${item.unitCodes[idx] || ''})</span></div>`).join('')
            : '<span style="color:var(--text-muted);">-</span>';
          itemsListHtml += `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 10px 12px; color: var(--text-main);"><strong>${item.itemName}</strong><div style="font-size:0.7rem; color:var(--text-muted);">${item.itemCode}</div></td>
              <td style="padding: 10px 12px; text-align: center; color: var(--text-main);"><span class="badge bg-info">${item.qty}</span></td>
              <td style="padding: 10px 12px; line-height: 1.4; color: var(--text-main);">${serials}</td>
            </tr>
          `;
        });
        itemsListHtml += `
              </tbody>
            </table>
          </div>
        `;
      } else {
        itemsListHtml = `
          <div style="margin-top: 10px; padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-card);">
            <p style="margin:0 0 6px 0; color: var(--text-main);">Barang: <strong>${t.itemName}</strong></p>
            <p style="margin:0 0 6px 0; color: var(--text-main);">Kode: ${t.itemCode}</p>
            <p style="margin:0; color: var(--text-main);">Jumlah Pinjam: <span class="badge bg-info">${t.qty} Unit</span></p>
          </div>
        `;
      }

      const detailHtml = `
        <div style="text-align:left; font-size:0.875rem; line-height:1.6;">
          <div style="border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h3 style="color:var(--text-main); font-size:1.1rem; margin:0;">Detail Transaksi</h3>
              <p style="font-family:monospace; font-weight:700; color:var(--primary); margin: 4px 0 0 0;">${t.id}</p>
            </div>
            <span class="badge ${statusBadge}">${t.status}</span>
          </div>
          <div style="display:grid; grid-template-columns:1fr; gap:16px;">
            <div>
              <strong>DATA PEMINJAM:</strong>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top:8px; background:var(--bg-secondary); padding:12px; border-radius:6px; border:1px solid var(--border-color);">
                <div>
                  <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Nama Lengkap</span>
                  <strong style="color:var(--text-main);">${t.borrowerName}</strong>
                </div>
                <div>
                  <span style="font-size:0.75rem; color:var(--text-muted); display:block;">NIP / ID</span>
                  <strong style="color:var(--text-main);">${t.nip}</strong>
                </div>
                <div style="margin-top:8px;">
                  <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Divisi / Subbagian</span>
                  <strong style="color:var(--text-main);">${t.department}</strong>
                </div>
                <div style="margin-top:8px;">
                  <span style="font-size:0.75rem; color:var(--text-muted); display:block;">No Telp / WA</span>
                  <strong style="color:var(--text-main);">${t.phone}</strong>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top:16px;">
            <strong>DAFTAR BARANG YANG DIPINJAM:</strong>
            ${itemsListHtml}
          </div>

          <div style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:12px; display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <div><strong>Tanggal Pinjam:</strong> <span style="color:var(--text-main);">${new Date(t.borrowDate).toLocaleString("id-ID")}</span></div>
            <div><strong>Tanggal Pelaksanaan:</strong> <span style="color:var(--text-main);">${t.executionDate ? new Date(t.executionDate).toLocaleDateString("id-ID") : '-'}</span></div>
            <div><strong>Rencana Kembali:</strong> <span style="color:var(--text-main);">${new Date(t.expectedReturnDate).toLocaleDateString("id-ID")}</span></div>
            <div><strong>Tanggal Kembali:</strong> <span style="color:var(--text-main);">${t.actualReturnDate ? new Date(t.actualReturnDate).toLocaleString("id-ID") : '<span class="text-warning">Belum Dikembalikan</span>'}</span></div>
            <div class="col-span-2"><strong>Keterlambatan:</strong> ${t.lateDays > 0 ? `<span class="text-danger" style="font-weight:600;">${t.lateDays} Hari</span>` : '<span class="text-success" style="font-weight:600;">Tidak Ada Keterlambatan</span>'}</div>
          </div>
          <div style="margin-top:16px; background:var(--bg-app); padding:12px; border-radius:6px; border:1px solid var(--border-color);">
            <p style="margin:0 0 4px 0;"><strong>Keperluan Peminjaman:</strong></p>
            <p style="color:var(--text-main); font-size:0.8125rem; margin:0 0 12px 0;">${t.purpose || '-'}</p>
            <p style="margin:0 0 4px 0;"><strong>Catatan Peminjaman:</strong></p>
            <p style="color:var(--text-main); font-size:0.8125rem; margin:0 0 8px 0;">${t.notes || '-'}</p>
            ${t.conditionOnReturn ? `<p style="margin:8px 0 0 0;"><strong>Kondisi Saat Dikembalikan:</strong> <span class="badge bg-success">${t.conditionOnReturn}</span></p>` : ''}
          </div>
          <div style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:12px;">
            <p style="margin-bottom:8px;"><strong>Bukti Transaksi (Evidence):</strong></p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">Bukti Peminjaman:</p>
                ${t.evidenceUrl ? `
                  <div style="border:1px solid var(--border-color); border-radius:6px; overflow:hidden; cursor:pointer;" onclick="const w=window.open(); w.document.write('<img src=\x22'+this.querySelector('img').src+'\x22 style=\x22max-width:100%;\x22 />');">
                    <img src="${t.evidenceUrl}" style="width:100%; height:100px; object-fit:cover; display:block;" />
                  </div>
                ` : `
                  <div style="border: 1px dashed var(--border-color); border-radius: 6px; padding: 24px 12px; text-align: center; color: var(--text-muted); font-size: 0.75rem;">
                    <i data-lucide="image-off" style="width: 16px; height: 16px; display: block; margin: 0 auto 6px; color: var(--text-muted);"></i>
                    Tidak ada bukti peminjaman
                  </div>
                `}
              </div>
              <div>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">Bukti Pengembalian:</p>
                ${t.returnEvidenceUrl ? `
                  <div style="border:1px solid var(--border-color); border-radius:6px; overflow:hidden; cursor:pointer;" onclick="const w=window.open(); w.document.write('<img src=\x22'+this.querySelector('img').src+'\x22 style=\x22max-width:100%;\x22 />');">
                    <img src="${t.returnEvidenceUrl}" style="width:100%; height:100px; object-fit:cover; display:block;" />
                  </div>
                ` : `
                  <div style="border: 1px dashed var(--border-color); border-radius: 6px; padding: 24px 12px; text-align: center; color: var(--text-muted); font-size: 0.75rem;">
                    <i data-lucide="image-off" style="width: 16px; height: 16px; display: block; margin: 0 auto 6px; color: var(--text-muted);"></i>
                    Belum dikembalikan / tidak ada bukti
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>
      `;

      showConfirm(`Transaksi ${t.id}`, "", () => {}, false);
      const msgEl = document.getElementById('confirm-modal-message');
      if (msgEl) {
        msgEl.innerHTML = detailHtml;
        if (window.lucide) window.lucide.createIcons();
      }
    };

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-area">
          <h1>Riwayat Transaksi Inventaris</h1>
          <p>Audit trail lengkap pengeluaran dan pemulihan logistik kantor secara kronologis.</p>
        </div>
      </div>

      <div class="main-card">
        <!-- History tab options -->
        <div class="table-controls" style="border-bottom: 1px solid var(--border-color);">
          <div class="controls-left" style="flex:1;">
            <div class="activity-tabs" style="border:none; margin-bottom:0; padding:0;">
              <button class="activity-tab-btn active" id="tab-hist-all">Semua Transaksi</button>
              <button class="activity-tab-btn" id="tab-hist-today">Hari Ini</button>
              <button class="activity-tab-btn" id="tab-hist-week">7 Hari Terakhir</button>
              <button class="activity-tab-btn" id="tab-hist-month">30 Hari Terakhir</button>
              <button class="activity-tab-btn" id="tab-hist-active">Masih Dipinjam</button>
            </div>
          </div>
          <div class="controls-right">
            <div class="search-wrapper">
              <i data-lucide="search"></i>
              <input type="text" id="hist-search" placeholder="Cari ID, Peminjam, Barang..." />
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                <th>ID Transaksi</th>
                <th>Peminjam</th>
                <th>Divisi</th>
                <th>Barang</th>
                <th>Qty</th>
                <th>Tgl Pinjam</th>
                <th>Tgl Kembali</th>
                <th>Status</th>
                <th>Terlambat</th>
                <th width="100">Aksi</th>
              </tr>
            </thead>
            <tbody id="history-table-body">
              <!-- Injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Set active tab class and input value initially
    const tabMap = {
      'all': 'tab-hist-all',
      'today': 'tab-hist-today',
      'week': 'tab-hist-week',
      'month': 'tab-hist-month',
      'active': 'tab-hist-active'
    };
    
    const activeTabId = tabMap[activeFilter];
    if (activeTabId) {
      document.querySelectorAll('.activity-tab-btn').forEach(btn => btn.classList.remove('active'));
      const activeTabEl = document.getElementById(activeTabId);
      if (activeTabEl) activeTabEl.classList.add('active');
    }
    
    const histSearchInput = document.getElementById('hist-search');
    if (histSearchInput) histSearchInput.value = searchQuery;

    renderHistoryTable();

    // Event bindings for history filter tabs
    const bindTabClick = (tabId, filterValue) => {
      document.getElementById(tabId).onclick = (e) => {
        document.querySelectorAll('.activity-tab-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        activeFilter = filterValue;
        if (this.riwayatTrxFilter) {
          this.riwayatTrxFilter.activeFilter = filterValue;
        }
        renderHistoryTable();
      };
    };

    bindTabClick('tab-hist-all', 'all');
    bindTabClick('tab-hist-today', 'today');
    bindTabClick('tab-hist-week', 'week');
    bindTabClick('tab-hist-month', 'month');
    bindTabClick('tab-hist-active', 'active');

    // Search bar
    document.getElementById('hist-search').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (this.riwayatTrxFilter) {
        this.riwayatTrxFilter.searchQuery = searchQuery;
      }
      renderHistoryTable();
    });
  },

  // ==========================================
  // LAPORAN VIEW
  // ==========================================
  renderLaporan(container) {
    let currentFilters = {
      type: 'inventory',
      period: 'all',
      startDate: '',
      endDate: ''
    };

    const renderPreviewReport = () => {
      const data = state.getReportData(currentFilters);
      const paperBody = document.getElementById('report-paper-body');
      const tablePrintHeader = document.getElementById('report-table-print-thead');
      const tablePrintBody = document.getElementById('report-table-print-tbody');
      const reportTitle = document.getElementById('report-title-display');
      const reportDateRange = document.getElementById('report-daterange-display');
      const summaryBoxes = document.getElementById('report-paper-summary-boxes');
      const signDate = document.getElementById('report-signature-date-display');

      if (!paperBody || !tablePrintHeader || !tablePrintBody || !reportTitle) return;

      // Update Header details
      const titles = {
        inventory: 'Laporan Rekapitulasi Inventaris Aset Kantor',
        borrowing: 'Laporan Transaksi Peminjaman Aktif Staf',
        return: 'Laporan Transaksi Pengembalian Logistik',
        damaged: 'Laporan Inventaris Barang Kondisi Rusak',
        lowstock: 'Laporan Stok Kritis Inventaris (Stok < 3)',
        mostborrowed: 'Laporan Aset Terpopuler Paling Sering Dipinjam',
        statistics: 'Laporan Ringkasan Statistik Logistik Kantor'
      };

      reportTitle.textContent = titles[currentFilters.type] || 'Laporan Logistik';
      signDate.textContent = `Jakarta, ${new Date().toLocaleDateString("id-ID")}`;

      // Date range display
      if (currentFilters.period === 'all') {
        reportDateRange.textContent = 'Periode: Semua Data Tersimpan';
      } else if (currentFilters.period === 'daily') {
        reportDateRange.textContent = `Periode: Harian (${new Date().toLocaleDateString("id-ID")})`;
      } else if (currentFilters.period === 'weekly') {
        reportDateRange.textContent = 'Periode: 7 Hari Terakhir';
      } else if (currentFilters.period === 'monthly') {
        reportDateRange.textContent = 'Periode: 30 Hari Terakhir';
      } else if (currentFilters.period === 'custom' && currentFilters.startDate && currentFilters.endDate) {
        reportDateRange.textContent = `Periode: ${new Date(currentFilters.startDate).toLocaleDateString("id-ID")} s/d ${new Date(currentFilters.endDate).toLocaleDateString("id-ID")}`;
      } else {
        reportDateRange.textContent = 'Periode: Semua Data';
      }

      // Render summary boxes based on report type
      summaryBoxes.innerHTML = '';
      if (currentFilters.type === 'inventory') {
        const totalItems = state.getInventory().reduce((acc, cur) => acc + cur.totalStock, 0);
        const categories = [...new Set(state.getInventory().map(i => i.category))].length;
        summaryBoxes.innerHTML = `
          <div class="report-summary-box"><div class="report-summary-label">Total Jenis Barang</div><div class="report-summary-val">${state.getInventory().length}</div></div>
          <div class="report-summary-box"><div class="report-summary-label">Total Stok Fisik</div><div class="report-summary-val">${totalItems}</div></div>
          <div class="report-summary-box"><div class="report-summary-label">Kategori Aset</div><div class="report-summary-val">${categories}</div></div>
          <div class="report-summary-box"><div class="report-summary-label">Kondisi Baik</div><div class="report-summary-val">${state.getInventory().filter(i => i.condition === "Baik").length}</div></div>
        `;
      } else if (currentFilters.type === 'borrowing') {
        const totalQty = data.reduce((acc, cur) => acc + cur.qty, 0);
        summaryBoxes.innerHTML = `
          <div class="report-summary-box"><div class="report-summary-label">Total Transaksi</div><div class="report-summary-val">${data.length}</div></div>
          <div class="report-summary-box"><div class="report-summary-label">Total Volume Pinjam</div><div class="report-summary-val">${totalQty}</div></div>
          <div class="report-summary-box" style="grid-column: span 2;"><div class="report-summary-label">Status Terlambat</div><div class="report-summary-val text-danger">${data.filter(t => t.status.includes('Terlambat')).length} Transaksi</div></div>
        `;
      } else if (currentFilters.type === 'return') {
        const totalQty = data.reduce((acc, cur) => acc + cur.qty, 0);
        summaryBoxes.innerHTML = `
          <div class="report-summary-box"><div class="report-summary-label">Pengembalian Selesai</div><div class="report-summary-val">${data.length}</div></div>
          <div class="report-summary-box"><div class="report-summary-label">Volume Dipulihkan</div><div class="report-summary-val">${totalQty}</div></div>
          <div class="report-summary-box"><div class="report-summary-label">Kembali Baik</div><div class="report-summary-val text-success">${data.filter(t => t.condition === 'Baik').length}</div></div>
          <div class="report-summary-box"><div class="report-summary-label">Kembali Rusak</div><div class="report-summary-val text-warning">${data.filter(t => t.condition === 'Rusak').length}</div></div>
        `;
      }

      // Update table headers and data columns
      tablePrintHeader.innerHTML = '';
      tablePrintBody.innerHTML = '';

      if (data.length === 0) {
        tablePrintHeader.innerHTML = `<tr><th>Data Laporan</th></tr>`;
        tablePrintBody.innerHTML = `<tr><td class="text-center" style="padding: 24px;">Tidak ada catatan data logistik yang cocok untuk filter ini.</td></tr>`;
        return;
      }

      // Construct columns
      let headers = [];
      if (currentFilters.type === 'inventory') {
        headers = ['Kode', 'Nama Barang', 'Kategori', 'Merek', 'Lokasi', 'Stok (Tersedia/Total) & Kondisi'];
        tablePrintHeader.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tablePrintBody.innerHTML = data.map(item => `
          <tr>
            <td><strong>${item.code}</strong></td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.brand}</td>
            <td>${item.location}</td>
            <td>${item.stock}</td>
          </tr>
        `).join('');
      } else if (currentFilters.type === 'borrowing') {
        headers = ['ID Trx', 'Nama Peminjam', 'Barang', 'Qty', 'Tgl Pinjam', 'Keterangan'];
        tablePrintHeader.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tablePrintBody.innerHTML = data.map(t => `
          <tr>
            <td><strong>${t.id}</strong></td>
            <td>${t.borrower}</td>
            <td>${t.item}</td>
            <td>${t.qty} Unit</td>
            <td>${t.borrowDate}</td>
            <td>${t.status}</td>
          </tr>
        `).join('');
      } else if (currentFilters.type === 'return') {
        headers = ['ID Trx', 'Peminjam', 'Aset Logistik', 'Qty', 'Tanggal Kembali', 'Kondisi Kembali'];
        tablePrintHeader.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tablePrintBody.innerHTML = data.map(t => `
          <tr>
            <td><strong>${t.id}</strong></td>
            <td>${t.borrower}</td>
            <td>${t.item}</td>
            <td>${t.qty} Unit</td>
            <td>${t.returnDate}</td>
            <td>${t.condition}</td>
          </tr>
        `).join('');
      } else if (currentFilters.type === 'damaged') {
        headers = ['Kode', 'Nama Barang', 'Kategori', 'Lokasi Penyimpanan', 'Stok Fisik', 'Status Kondisi'];
        tablePrintHeader.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tablePrintBody.innerHTML = data.map(item => `
          <tr>
            <td><strong>${item.code}</strong></td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.location}</td>
            <td>${item.totalStock} Unit</td>
            <td><span class="text-danger">${item.condition}</span></td>
          </tr>
        `).join('');
      } else if (currentFilters.type === 'lowstock') {
        headers = ['Kode', 'Nama Barang', 'Kategori', 'Stok Tersedia', 'Stok Total', 'Lokasi'];
        tablePrintHeader.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tablePrintBody.innerHTML = data.map(item => `
          <tr>
            <td><strong>${item.code}</strong></td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td><strong class="text-danger">${item.availableStock} Unit</strong></td>
            <td>${item.totalStock} Unit</td>
            <td>${item.location}</td>
          </tr>
        `).join('');
      } else if (currentFilters.type === 'mostborrowed') {
        headers = ['Kode', 'Nama Barang', 'Kategori', 'Lokasi Penyimpanan', 'Frekuensi Peminjaman'];
        tablePrintHeader.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tablePrintBody.innerHTML = data.map(item => `
          <tr>
            <td><strong>${item.code}</strong></td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.location}</td>
            <td><strong>${item.timesBorrowed} Kali Dipinjam</strong></td>
          </tr>
        `).join('');
      } else { // Statistics
        headers = ['Parameter Penilaian', 'Nilai Kalkulasi'];
        tablePrintHeader.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tablePrintBody.innerHTML = data.map(s => `
          <tr>
            <td><strong>${s.label}</strong></td>
            <td><strong>${s.value}</strong></td>
          </tr>
        `).join('');
      }
    };

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-area">
          <h1>Pusat Laporan & Rekapitulasi</h1>
          <p>Tingkatkan transparansi dengan membuat laporan dinamis, cetak PDF resmi, dan ekspor spreadsheet.</p>
        </div>
      </div>

      <div class="reports-layout">
        <!-- Left Filter Panel -->
        <div class="report-settings-panel">
          <h3 class="chart-card-title">Parameter Laporan</h3>
          
          <div class="form-group">
            <label for="report-type">Jenis Data Laporan</label>
            <select id="report-type">
              <option value="inventory">Daftar Inventaris (Semua Aset)</option>
              <option value="borrowing">Transaksi Peminjaman Aktif</option>
              <option value="return">Transaksi Pengembalian Selesai</option>
              <option value="damaged">Aset Kondisi Rusak</option>
              <option value="lowstock">Aset Stok Kritis (< 3)</option>
              <option value="mostborrowed">Barang Paling Populer</option>
              <option value="statistics">Ringkasan Statistik Umum</option>
            </select>
          </div>

          <div class="form-group">
            <label for="report-period">Periode Waktu</label>
            <select id="report-period">
              <option value="all">Semua Waktu</option>
              <option value="daily">Harian (Hari Ini)</option>
              <option value="weekly">Mingguan (7 Hari Terakhir)</option>
              <option value="monthly">Bulanan (30 Hari Terakhir)</option>
              <option value="custom">Rentang Tanggal Custom</option>
            </select>
          </div>

          <!-- Custom range dates (shown only if custom selected) -->
          <div id="report-custom-dates" class="hidden" style="display:flex; flex-direction:column; gap:12px;">
            <div class="form-group">
              <label for="report-start-date">Tanggal Mulai</label>
              <input type="date" id="report-start-date" />
            </div>
            <div class="form-group">
              <label for="report-end-date">Tanggal Selesai</label>
              <input type="date" id="report-end-date" />
            </div>
          </div>

          <div style="margin-top:auto; display:flex; flex-direction:column; gap:12px;">
            <button class="btn btn-secondary btn-block" id="btn-report-export-excel"><i data-lucide="file-spread-sheet"></i>Ekspor Excel</button>
            <button class="btn btn-secondary btn-block" id="btn-report-export-csv">Ekspor CSV</button>
            <button class="btn btn-primary btn-block" id="btn-report-print-pdf"><i data-lucide="printer"></i>Cetak Laporan (PDF)</button>
          </div>
        </div>

        <!-- Right Preview Panel -->
        <div class="report-preview-panel">
          <div class="report-preview-header">
            <span style="font-weight:600; font-size:0.875rem;"><i data-lucide="file-text" style="vertical-align:middle; margin-right:8px; width:16px;"></i>Preview Lembar Cetak</span>
          </div>

          <div class="report-sheet-wrapper">
            <div class="report-sheet-paper" id="report-paper-body">
              <div class="report-paper-header">
                <h2>LOGITRACK LOGISTICS SYSTEMS</h2>
                <p>Jalan Medan Merdeka Barat No. 9, Jakarta Pusat | Telp: (021) 123456 | email: logistik@logitrack.go.id</p>
              </div>

              <h3 id="report-title-display" style="text-align:center; font-size:1.1rem; margin-bottom:4px; text-transform:uppercase;">LAPORAN INVENTARIS KANTOR</h3>
              <p id="report-daterange-display" style="text-align:center; font-size:0.75rem; color:#666; margin-bottom:24px;">Periode: Semua Waktu</p>

              <!-- Dynamic Summary Boxes -->
              <div class="report-paper-summary" id="report-paper-summary-boxes">
                <!-- Injected via JS -->
              </div>

              <!-- Main Table -->
              <table class="report-table-print">
                <thead id="report-table-print-thead">
                  <!-- Injected via JS -->
                </thead>
                <tbody id="report-table-print-tbody">
                  <!-- Injected via JS -->
                </tbody>
              </table>

              <div class="report-paper-footer">
                <div class="report-signature">
                  <p id="report-signature-date-display">Jakarta, 4 Agustus 2026</p>
                  <p style="margin-bottom:64px; font-size:0.75rem;">Petugas Logistik Kantor,</p>
                  <p class="report-signature-name">Naila Olivia Ramadhani</p>
                  <p style="font-size:0.6875rem; color:#666;">NIP. 199912042025012001</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render initial
    renderPreviewReport();

    // Event Bindings
    const typeSelect = document.getElementById('report-type');
    const periodSelect = document.getElementById('report-period');
    const customDatesWrapper = document.getElementById('report-custom-dates');
    const startInput = document.getElementById('report-start-date');
    const endInput = document.getElementById('report-end-date');

    typeSelect.onchange = (e) => {
      currentFilters.type = e.target.value;
      renderPreviewReport();
    };

    periodSelect.onchange = (e) => {
      currentFilters.period = e.target.value;
      if (currentFilters.period === 'custom') {
        customDatesWrapper.classList.remove('hidden');
      } else {
        customDatesWrapper.classList.add('hidden');
      }
      renderPreviewReport();
    };

    startInput.onchange = (e) => {
      currentFilters.startDate = e.target.value;
      renderPreviewReport();
    };
    endInput.onchange = (e) => {
      currentFilters.endDate = e.target.value;
      renderPreviewReport();
    };

    // Export Excel Button
    document.getElementById('btn-report-export-excel').onclick = () => {
      const data = state.getReportData(currentFilters);
      exportToExcel(data, `Laporan-${currentFilters.type}-${new Date().toISOString().substring(0,10)}`);
    };

    // Export CSV
    document.getElementById('btn-report-export-csv').onclick = () => {
      const data = state.getReportData(currentFilters);
      exportToCSV(data, `Laporan-${currentFilters.type}-${new Date().toISOString().substring(0,10)}`);
    };

    // Print PDF Button
    document.getElementById('btn-report-print-pdf').onclick = () => {
      exportToPDF();
    };
  },

  // ==========================================
  // AUDIT LOGS VIEW
  // ==========================================
  renderAuditLogs(container) {
    const logs = state.getAuditLogs();

    let typeFilter = 'all';
    let searchQuery = '';

    const renderLogsList = () => {
      let filtered = [...logs];
      if (typeFilter !== 'all') {
        filtered = filtered.filter(l => l.type === typeFilter);
      }
      if (searchQuery) {
        filtered = filtered.filter(l => 
          l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.user.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      const listEl = document.getElementById('audit-logs-list');
      if (!listEl) return;

      if (filtered.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state" style="padding: 48px 0;">
            <i data-lucide="shield-alert" class="empty-state-icon"></i>
            <h3>Tidak Ada Log Aktivitas</h3>
            <p>Belum ada aktivitas yang tercatat untuk filter pencarian ini.</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      let html = '<div class="audit-timeline">';
      filtered.forEach(log => {
        const dotClass = log.type || 'info'; // 'info', 'success', 'warning', 'danger'
        const timeStr = new Date(log.timestamp).toLocaleString('id-ID');
        html += `
          <div class="audit-item animate-fade-in">
            <div class="audit-dot ${dotClass}"></div>
            <div class="audit-meta">
              <span style="font-weight: 700; color: var(--primary);">${log.user}</span>
              <span>${timeStr}</span>
            </div>
            <div class="audit-desc">${log.action}</div>
            ${log.details ? `<div class="audit-details">${log.details}</div>` : ''}
          </div>
        `;
      });
      html += '</div>';
      listEl.innerHTML = html;
    };

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-area">
          <h1>Audit Log Aktivitas</h1>
          <p>Pelacakan lengkap dan transparan dari semua aksi pengubahan, penambahan, dan penghapusan sistem.</p>
        </div>
      </div>

      <div class="main-card">
        <div class="table-controls">
          <div class="controls-left">
            <div class="search-wrapper">
              <i data-lucide="search"></i>
              <input type="text" id="audit-search" placeholder="Cari aksi, detail, admin..." />
            </div>

            <div class="select-wrapper">
              <select id="audit-filter-type">
                <option value="all">Semua Tipe</option>
                <option value="info">Info</option>
                <option value="success">Success / Penambahan</option>
                <option value="warning">Warning / Edit</option>
                <option value="danger">Danger / Hapus</option>
              </select>
            </div>
          </div>
        </div>

        <div id="audit-logs-list" style="max-height: 600px; overflow-y: auto; padding: 8px 16px;">
          <!-- Timeline will be injected here -->
        </div>
      </div>
    `;

    renderLogsList();

    // Event listeners
    document.getElementById('audit-search').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderLogsList();
    });

    document.getElementById('audit-filter-type').addEventListener('change', (e) => {
      typeFilter = e.target.value;
      renderLogsList();
    });
  },

  // ==========================================
  // PENGATURAN VIEW
  // ==========================================
  renderPengaturan(container) {
    let settings = state.getSettings();

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-area">
          <h1>Pengaturan Sistem</h1>
          <p>Kelola profil admin, preferensi notifikasi, tema warna, dan cadangkan database sistem.</p>
        </div>
      </div>

      <div class="settings-grid">
        <!-- Left Tab List -->
        <div class="settings-list">
          <div class="settings-tab-item active" id="tab-set-profile"><i data-lucide="user"></i>Profil Pengguna</div>
          <div class="settings-tab-item" id="tab-set-category"><i data-lucide="grid"></i>Manajemen Kategori</div>
          <div class="settings-tab-item" id="tab-set-notifications"><i data-lucide="bell"></i>Notifikasi</div>
          <div class="settings-tab-item" id="tab-set-theme"><i data-lucide="palette"></i>Tema Tampilan</div>
          <div class="settings-tab-item" id="tab-set-backup"><i data-lucide="database"></i>Backup & Restore</div>
        </div>

        <!-- Right Content Cards -->
        <div id="settings-content-container">
          <!-- Injected via JS based on active tab -->
        </div>
      </div>
    `;

    const renderSettingsTab = (tab) => {
      const wrapper = document.getElementById('settings-content-container');
      if (!wrapper) return;

      document.querySelectorAll('.settings-tab-item').forEach(b => b.classList.remove('active'));
      document.getElementById(`tab-set-${tab}`).classList.add('active');

      if (tab === 'profile') {
        wrapper.innerHTML = `
          <div class="settings-content-card animate-scale">
            <div class="settings-section-header">
              <h3>Profil Pengguna</h3>
              <p>Kelola informasi identitas Anda yang tertera di dokumen laporan resmi.</p>
            </div>

            <form id="form-settings-profile">
              <div class="avatar-edit-box">
                <img src="${settings.profile.avatar}" class="avatar-preview-lg" id="settings-avatar-preview" />
                <div>
                  <button type="button" class="btn btn-secondary" id="btn-change-avatar">Ubah Foto Profil</button>
                  <input type="file" id="file-avatar-input" accept="image/*" class="hidden" />
                  <p style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">Format PNG/JPG/WEBP maks 1MB</p>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">
                <div class="form-group">
                  <label for="set-username">Username Pengguna</label>
                  <input type="text" id="set-username" value="${settings.profile.username}" required />
                </div>
                <div class="form-group">
                  <label for="set-name">Nama Lengkap Petugas *</label>
                  <input type="text" id="set-name" value="${settings.profile.name}" required />
                </div>
                <div class="form-group">
                  <label for="set-email">Alamat Email *</label>
                  <input type="email" id="set-email" value="${settings.profile.email}" required />
                </div>
                <div class="form-group">
                  <label for="set-role">Jabatan / Role *</label>
                  <input type="text" id="set-role" value="${settings.profile.role}" required />
                </div>
              </div>

              <div class="form-actions" style="border-top: 1px solid var(--border-color); padding-top:20px;">
                <button type="submit" class="btn btn-primary">Simpan Perubahan Profil</button>
              </div>
            </form>
          </div>
        `;

        // Handle Avatar File Upload
        const fileInput = document.getElementById('file-avatar-input');
        const changeBtn = document.getElementById('btn-change-avatar');
        const previewImg = document.getElementById('settings-avatar-preview');

        changeBtn.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          if (file.size > 1 * 1024 * 1024) {
            showToast("Ukuran berkas avatar melebihi batas 1MB.", "danger");
            return;
          }
          const reader = new FileReader();
          reader.onload = (ev) => {
            previewImg.src = ev.target.result;
            settings.profile.avatar = ev.target.result;
          };
          reader.readAsDataURL(file);
        };

        // Form Submit
        document.getElementById('form-settings-profile').onsubmit = (e) => {
          e.preventDefault();
          settings.profile.username = document.getElementById('set-username').value;
          settings.profile.name = document.getElementById('set-name').value;
          settings.profile.email = document.getElementById('set-email').value;
          settings.profile.role = document.getElementById('set-role').value;

          state.setSettings(settings);
          showToast("Profil admin berhasil diperbarui.", "success");
          
          // Update sidebar / header details immediately
          document.getElementById('sidebar-user-name').textContent = settings.profile.name;
          document.getElementById('sidebar-user-role').textContent = settings.profile.role;
          document.getElementById('header-user-name').textContent = settings.profile.name;
          document.getElementById('drop-user-name').textContent = settings.profile.name;
          document.getElementById('drop-user-email').textContent = settings.profile.email;
          document.getElementById('sidebar-user-avatar').src = settings.profile.avatar;
          document.getElementById('header-user-avatar').src = settings.profile.avatar;
        };

      } else if (tab === 'category') {
        const renderCategoryView = () => {
          const cats = state.getCategories();
          let chipsHtml = '';
          cats.forEach(c => {
            chipsHtml += `
              <div class="category-chip">
                <span>${c}</span>
                <button type="button" class="btn-delete-chip" data-category="${c}">&times;</button>
              </div>
            `;
          });

          wrapper.innerHTML = `
            <div class="settings-content-card animate-scale">
              <div class="settings-section-header">
                <h3>Manajemen Kategori Barang</h3>
                <p>Tambah atau hapus kategori kustom untuk klasifikasi inventaris logistik.</p>
              </div>

              <div class="category-manager-wrapper">
                <div class="category-chips-list" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px;">
                  ${chipsHtml || '<p style="color:var(--text-muted); font-size:0.875rem;">Belum ada kategori terdaftar.</p>'}
                </div>

                <form id="form-add-category" style="display:flex; gap:12px; border-top:1px solid var(--border-color); padding-top:20px;">
                  <div class="form-group" style="flex:1; margin-bottom:0;">
                    <input type="text" id="new-category-input" placeholder="Masukkan nama kategori baru (contoh: Perkakas)" required />
                  </div>
                  <button type="submit" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:6px;"><i data-lucide="plus"></i>Tambah</button>
                </form>
              </div>
            </div>
          `;

          if (window.lucide) window.lucide.createIcons();

          // Bind delete chips
          wrapper.querySelectorAll('.btn-delete-chip').forEach(btn => {
            btn.onclick = () => {
              const catName = btn.getAttribute('data-category');
              showConfirm("Hapus Kategori", `Apakah Anda yakin ingin menghapus kategori '${catName}'?`, () => {
                const res = state.deleteCategory(catName);
                if (res.success) {
                  showToast(`Kategori '${catName}' berhasil dihapus.`, "success");
                  renderCategoryView();
                } else {
                  showToast(res.message, "danger");
                }
              });
            };
          });

          // Bind add category form
          document.getElementById('form-add-category').onsubmit = (e) => {
            e.preventDefault();
            const input = document.getElementById('new-category-input');
            const catName = input.value.trim();
            if (!catName) return;

            const res = state.addCategory(catName);
            if (res.success) {
              showToast(`Kategori '${catName}' berhasil ditambahkan.`, "success");
              input.value = '';
              renderCategoryView();
            } else {
              showToast(res.message, "danger");
            }
          };
        };

        renderCategoryView();

      } else if (tab === 'notifications') {
        wrapper.innerHTML = `
          <div class="settings-content-card animate-scale">
            <div class="settings-section-header">
              <h3>Pengaturan Notifikasi</h3>
              <p>Aktifkan atau matikan jenis notifikasi sistem yang muncul di header panel.</p>
            </div>

            <div style="display:flex; flex-direction:column; gap:20px; margin-bottom:32px;">
              <label class="checkbox-container">
                <input type="checkbox" id="notif-lowstock" ${settings.notifications.lowStock ? 'checked' : ''} />
                <span class="checkmark"></span>
                <strong>Peringatan Stok Rendah (Tersedia < 3 Unit)</strong>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Kirim alert bila persediaan unit mendekati limit kritis.</div>
              </label>

              <label class="checkbox-container">
                <input type="checkbox" id="notif-overdue" ${settings.notifications.overdue ? 'checked' : ''} />
                <span class="checkmark"></span>
                <strong>Peringatan Keterlambatan Pengembalian</strong>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Berikan tanda warna merah jika pegawai melewati batas tenggat kembali.</div>
              </label>
            </div>

            <div class="form-actions" style="border-top: 1px solid var(--border-color); padding-top:20px;">
              <button class="btn btn-primary" id="btn-save-notif-settings">Simpan Preferensi Notifikasi</button>
            </div>
          </div>
        `;

        document.getElementById('btn-save-notif-settings').onclick = () => {
          settings.notifications.lowStock = document.getElementById('notif-lowstock').checked;
          settings.notifications.overdue = document.getElementById('notif-overdue').checked;

          state.setSettings(settings);
          state.refreshNotifications(); // Trigger updates
          showToast("Pengaturan notifikasi berhasil diperbarui.", "success");
          
          // Refresh navbar badge count on load
          const notifs = state.getNotifications().filter(n => !n.read);
          const badge = document.getElementById('notification-count');
          if (badge) {
            if (notifs.length > 0) {
              badge.textContent = notifs.length;
              badge.classList.remove('hidden');
            } else {
              badge.classList.add('hidden');
            }
          }
        };

      } else if (tab === 'theme') {
        const isDarkTheme = document.body.classList.contains('dark-theme');
        wrapper.innerHTML = `
          <div class="settings-content-card animate-scale">
            <div class="settings-section-header">
              <h3>Tema Tampilan</h3>
              <p>Pilih tema tampilan warna antarmuka sistem yang sesuai dengan preferensi kenyamanan Anda.</p>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div class="quick-action-btn" id="btn-theme-light-select" style="justify-content:center; padding: 24px; border-color:${!isDarkTheme ? 'var(--primary)' : 'var(--border-color)'};">
                <div style="text-align:center;">
                  <i data-lucide="sun" style="width:36px; height:36px; color:var(--primary); margin-bottom:8px;"></i>
                  <h4>Mode Terang (Light Mode)</h4>
                </div>
              </div>

              <div class="quick-action-btn" id="btn-theme-dark-select" style="justify-content:center; padding: 24px; border-color:${isDarkTheme ? 'var(--primary)' : 'var(--border-color)'};">
                <div style="text-align:center;">
                  <i data-lucide="moon" style="width:36px; height:36px; color:var(--primary); margin-bottom:8px;"></i>
                  <h4>Mode Gelap (Dark Mode)</h4>
                </div>
              </div>
            </div>
          </div>
        `;

        const applySelectedTheme = (theme) => {
          if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
            settings.theme = 'dark';
            
            // Adjust toggle header icons
            document.querySelector('.theme-icon-light').classList.remove('hidden');
            document.querySelector('.theme-icon-dark').classList.add('hidden');
          } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
            settings.theme = 'light';

            document.querySelector('.theme-icon-light').classList.add('hidden');
            document.querySelector('.theme-icon-dark').classList.remove('hidden');
          }
          state.setSettings(settings);
          renderSettingsTab('theme'); // Redraw grid selected borders
          showToast(`Berhasil beralih ke Mode ${theme === 'dark' ? 'Gelap' : 'Terang'}`, "success");
        };

        document.getElementById('btn-theme-light-select').onclick = () => applySelectedTheme('light');
        document.getElementById('btn-theme-dark-select').onclick = () => applySelectedTheme('dark');

      } else { // Backup & Restore
        wrapper.innerHTML = `
          <div class="settings-content-card animate-scale">
            <div class="settings-section-header">
              <h3>Backup & Restore Database</h3>
              <p>Cadangkan seluruh database lokal Anda menjadi file JSON untuk pengamanan atau pulihkan data lama Anda.</p>
            </div>

            <div style="display:flex; flex-direction:column; gap:20px;">
              <div style="background:var(--bg-app); border:1px solid var(--border-color); padding:16px; border-radius:8px;">
                <h4 style="margin-bottom:6px;"><i data-lucide="download" style="vertical-align:middle; margin-right:8px; width:16px;"></i>Cadangkan Data (Backup)</h4>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:12px;">Semua data inventaris, data transaksi peminjaman, dan konfigurasi profil admin akan diekspor sebagai file terenkripsi JSON.</p>
                <button class="btn btn-primary" id="btn-execute-backup">Unduh File Cadangan (.json)</button>
              </div>

              <div style="background:var(--bg-app); border:1px solid var(--border-color); padding:16px; border-radius:8px;">
                <h4 style="margin-bottom:6px;"><i data-lucide="upload" style="vertical-align:middle; margin-right:8px; width:16px;"></i>Pulihkan Data (Restore)</h4>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:12px;">Unggah file JSON cadangan untuk memulihkan seluruh record data logistik kantor. <strong>Peringatan:</strong> Data saat ini di sistem akan tertimpa sepenuhnya.</p>
                
                <input type="file" id="restore-file-input" accept=".json" class="hidden" />
                <button class="btn btn-secondary" id="btn-trigger-restore">Pilih File & Mulai Restore</button>
              </div>
            </div>
          </div>
        `;

        // Backup downloader
        document.getElementById('btn-execute-backup').onclick = () => {
          try {
            const dbDump = {
              inventory: state.getInventory(),
              transactions: state.getTransactions(),
              settings: state.getSettings(),
              notifications: state.getNotifications()
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbDump, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `LogiTrack_Backup_${new Date().toISOString().substring(0,10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast("Database berhasil diekspor.", "success");
          } catch (err) {
            showToast("Gagal melakukan backup data.", "danger");
          }
        };

        // Restore trigger
        const fileInput = document.getElementById('restore-file-input');
        document.getElementById('btn-trigger-restore').onclick = () => fileInput.click();

        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const dump = JSON.parse(ev.target.result);
              if (!dump.inventory || !dump.transactions || !dump.settings) {
                throw new Error("Struktur file backup tidak valid.");
              }

              showConfirm(
                "Pulihkan Database",
                "Apakah Anda yakin ingin melakukan pemulihan data? Semua data transaksi saat ini akan terhapus dan ditimpa.",
                () => {
                  state.setInventory(dump.inventory);
                  state.setTransactions(dump.transactions);
                  state.setSettings(dump.settings);
                  if (dump.notifications) state.setNotifications(dump.notifications);
                  
                  showToast("Database lokal berhasil dipulihkan!", "success");
                  setTimeout(() => location.reload(), 1000); // Reload to re-initialize
                }
              );

            } catch (err) {
              showToast("Gagal membaca file backup. " + err.message, "danger");
            }
          };
          reader.readAsText(file);
        };
      }

      if (window.lucide) window.lucide.createIcons();
    };

    // Render default tab
    renderSettingsTab('profile');

    // Bind tab clicks
    document.getElementById('tab-set-profile').onclick = () => renderSettingsTab('profile');
    document.getElementById('tab-set-category').onclick = () => renderSettingsTab('category');
    document.getElementById('tab-set-notifications').onclick = () => renderSettingsTab('notifications');
    document.getElementById('tab-set-theme').onclick = () => renderSettingsTab('theme');
    document.getElementById('tab-set-backup').onclick = () => renderSettingsTab('backup');
  }
};
