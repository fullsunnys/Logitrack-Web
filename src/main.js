// src/main.js

import './style.css';
import { state } from './js/state.js';
import { router } from './js/router.js';
import { showToast } from './js/ui.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize State DB
  state.init();

  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Initial Theme & Settings Setup
  const settings = state.getSettings();
  const body = document.body;
  if (settings.theme === 'dark') {
    body.classList.add('dark-theme');
    body.classList.remove('light-theme');
    document.querySelector('.theme-icon-light')?.classList.remove('hidden');
    document.querySelector('.theme-icon-dark')?.classList.add('hidden');
  } else {
    body.classList.add('light-theme');
    body.classList.remove('dark-theme');
    document.querySelector('.theme-icon-light')?.classList.add('hidden');
    document.querySelector('.theme-icon-dark')?.classList.remove('hidden');
  }

  // 3. User Authentication Check
  const session = state.getCurrentUser();
  const loginOverlay = document.getElementById('login-overlay');
  const appWrapper = document.getElementById('app-wrapper');
  
  if (session && session.authenticated) {
    // Already logged in
    loginOverlay.classList.add('hidden');
    appWrapper.classList.remove('hidden');
    updateHeaderUserProfile(session.user);
    // Initialize routing
    router.init();
  } else {
    // Show login
    loginOverlay.classList.remove('hidden');
    appWrapper.classList.add('hidden');
  }

  // Hide global screen loader
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.classList.add('hidden');
  }

  // 4. Bind Login Form Events
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('login-username').value;
      const passwordInput = document.getElementById('login-password').value;
      const rememberInput = document.getElementById('login-remember').checked;

      const res = state.login(usernameInput, passwordInput, rememberInput);
      if (res.success) {
        showToast("Login berhasil! Selamat datang kembali.", "success");

        // Hide overlay, show layout
        loginOverlay.classList.add('hidden');
        appWrapper.classList.remove('hidden');

        const activeUser = state.getCurrentUser().user;
        updateHeaderUserProfile(activeUser);

        // Bootstrap router
        router.init();
      } else {
        showToast(res.message, "danger");
      }
    };
  }

  // Bind forgot password click
  const forgotBtn = document.getElementById('btn-forgot-password');
  if (forgotBtn) {
    forgotBtn.onclick = (e) => {
      e.preventDefault();
      showToast("Gunakan kredensial default: admin / admin123", "warning", 5000);
    };
  }

  // Bind password visibility toggle
  const togglePasswordBtn = document.getElementById('toggle-password-btn');
  const loginPasswordInput = document.getElementById('login-password');

  if (togglePasswordBtn && loginPasswordInput) {
    togglePasswordBtn.onclick = (e) => {
      e.preventDefault();
      const openIcon = togglePasswordBtn.querySelector('.eye-open-icon');
      const closedIcon = togglePasswordBtn.querySelector('.eye-closed-icon');

      if (loginPasswordInput.type === 'password') {
        loginPasswordInput.type = 'text';
        openIcon?.classList.add('hidden');
        closedIcon?.classList.remove('hidden');
      } else {
        loginPasswordInput.type = 'password';
        openIcon?.classList.remove('hidden');
        closedIcon?.classList.add('hidden');
      }
    };
  }

  // 5. Sidebar Toggle Controls (Mobile Drawer)
  const sidebar = document.getElementById('app-sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle-btn');
  const sidebarClose = document.getElementById('sidebar-close-btn');

  if (sidebarToggle && sidebar && sidebarClose) {
    sidebarToggle.onclick = () => {
      sidebar.classList.toggle('open');
    };
    sidebarClose.onclick = () => {
      sidebar.classList.remove('open');
    };
  }

  // 6. Header Theme Toggle Click
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.onclick = () => {
      const activeSettings = state.getSettings();
      const darkIcon = document.querySelector('.theme-icon-dark');
      const lightIcon = document.querySelector('.theme-icon-light');

      if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        darkIcon.classList.remove('hidden');
        lightIcon.classList.add('hidden');
        activeSettings.theme = 'light';
      } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
        activeSettings.theme = 'dark';
      }

      state.setSettings(activeSettings);
      // Re-trigger chart coloring updates if on dashboard
      if (router.activeView === 'dashboard') {
        router.renderActiveView();
      }
      showToast(`Tema warna diubah ke Mode ${activeSettings.theme === 'dark' ? 'Gelap' : 'Terang'}.`, "success");
    };
  }

  // 7. Profile Dropdown Panel
  const profileToggle = document.getElementById('profile-toggle-btn');
  const profileDropdown = document.getElementById('profile-dropdown');
  if (profileToggle && profileDropdown) {
    profileToggle.onclick = (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('hidden');
      notificationDropdown.classList.add('hidden'); // close other dropdown
    };
  }

  // 8. Notifications Dropdown Panel
  const notifToggle = document.getElementById('notification-toggle-btn');
  const notificationDropdown = document.getElementById('notification-dropdown');
  if (notifToggle && notificationDropdown) {
    notifToggle.onclick = (e) => {
      e.stopPropagation();
      notificationDropdown.classList.toggle('hidden');
      profileDropdown.classList.add('hidden'); // close other dropdown
      if (!notificationDropdown.classList.contains('hidden')) {
        renderNotificationDropdownItems();
      }
    };
  }

  // Mark all notifications read
  const markReadBtn = document.getElementById('btn-mark-notifications-read');
  if (markReadBtn) {
    markReadBtn.onclick = () => {
      state.markAllNotificationsRead();
      renderNotificationDropdownItems();
      updateNotificationsBadge();
      showToast("Semua pemberitahuan ditandai telah dibaca.", "success");
    };
  }

  // Close dropdowns on outside clicks
  document.addEventListener('click', () => {
    profileDropdown?.classList.add('hidden');
    notificationDropdown?.classList.add('hidden');
  });

  // Sidebar navigation click mapping (fallback for direct layout routing clicks)
  document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const view = item.getAttribute('data-view');
      // If mobile, close drawer on click
      if (window.innerWidth <= 992) {
        sidebar?.classList.remove('open');
      }
      if (view === 'logout') {
        e.preventDefault();
        state.logout();
        showToast("Anda telah keluar dari sistem.", "success");
        window.location.hash = "";
        location.reload();
      }
    });
  });

  // Profile dropdown link routing click
  document.querySelectorAll('.profile-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      profileDropdown?.classList.add('hidden');
    });
  });

  // Logout triggers
  const sidebarLogout = document.getElementById('btn-sidebar-logout');
  const profileLogout = document.getElementById('btn-profile-logout');
  const logoutAction = (e) => {
    e.preventDefault();
    state.logout();
    showToast("Anda telah keluar dari sistem.", "success");
    setTimeout(() => {
      location.reload();
    }, 500);
  };
  if (sidebarLogout) sidebarLogout.onclick = logoutAction;
  if (profileLogout) profileLogout.onclick = logoutAction;

  // Initialize notifications badge count
  updateNotificationsBadge();

  // Helper updates
  function updateHeaderUserProfile(user) {
    document.getElementById('sidebar-user-name').textContent = user.name;
    document.getElementById('sidebar-user-role').textContent = user.role;
    document.getElementById('header-user-name').textContent = user.name;
    document.getElementById('drop-user-name').textContent = user.name;
    document.getElementById('drop-user-email').textContent = user.email;
    document.getElementById('sidebar-user-avatar').src = user.avatar;
    document.getElementById('header-user-avatar').src = user.avatar;
  }

  function updateNotificationsBadge() {
    const unreadCount = state.getNotifications().filter(n => !n.read).length;
    const badge = document.getElementById('notification-count');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  function renderNotificationDropdownItems() {
    const listEl = document.getElementById('notification-list');
    if (!listEl) return;

    const notifs = state.getNotifications();
    if (notifs.length === 0) {
      listEl.innerHTML = `
        <div class="empty-notifications">
          <i data-lucide="bell-off"></i>
          <p>Tidak ada pemberitahuan baru</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let itemsHtml = '';
    notifs.forEach(n => {
      const isUnread = !n.read;
      let iconColorClass = 'text-warning bg-warning-soft';
      let iconName = 'alert-circle';
      if (n.type === 'danger') {
        iconColorClass = 'text-danger bg-danger-soft';
        iconName = 'alert-triangle';
      }

      itemsHtml += `
        <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${n.id}">
          <div class="notification-icon-box ${iconColorClass}">
            <i data-lucide="${iconName}"></i>
          </div>
          <div class="notification-content">
            <p>${n.message}</p>
            <span class="notification-time">${new Date(n.date).toLocaleTimeString("id-ID")} - ${new Date(n.date).toLocaleDateString("id-ID")}</span>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = itemsHtml;
    if (window.lucide) window.lucide.createIcons();

    // Bind item click to mark read individual
    listEl.querySelectorAll('.notification-item').forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation(); // prevent dropdown close
        const id = item.getAttribute('data-id');
        const allNotifs = state.getNotifications();
        const found = allNotifs.find(n => n.id === id);
        if (found) {
          found.read = true;
          state.setNotifications(allNotifs);
          renderNotificationDropdownItems();
          updateNotificationsBadge();
        }
      };
    });
  }
});
