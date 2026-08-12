// src/js/ui.js

import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import * as XLSX from 'xlsx';

// Toast Notification System
export function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-alert toast-${type}`;
  
  let iconName = 'check-circle';
  if (type === 'warning') iconName = 'alert-circle';
  if (type === 'danger') iconName = 'alert-triangle';

  toast.innerHTML = `
    <div class="toast-content">
      <i data-lucide="${iconName}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close-btn">&times;</button>
  `;

  container.appendChild(toast);
  
  // Re-run lucide icons render for the toast
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Bind close button
  toast.querySelector('.toast-close-btn').addEventListener('click', () => {
    toast.remove();
  });

  // Auto remove
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Confirmation Dialog Modal
export function showConfirm(title, message, onConfirm, isDanger = true) {
  const modal = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('confirm-modal-title');
  const msgEl = document.getElementById('confirm-modal-message');
  const cancelBtn = document.getElementById('confirm-modal-cancel');
  const confirmBtn = document.getElementById('confirm-modal-confirm');
  const iconContainer = document.getElementById('confirm-modal-icon-container');
  const iconEl = document.getElementById('confirm-modal-icon');

  if (!modal || !titleEl || !msgEl || !cancelBtn || !confirmBtn) return;

  titleEl.textContent = title;
  msgEl.textContent = message;

  // Change icon and button colors based on risk
  if (isDanger) {
    iconContainer.className = 'modal-icon-wrapper danger';
    iconEl.setAttribute('data-lucide', 'alert-triangle');
    confirmBtn.className = 'btn btn-danger';
  } else {
    iconContainer.className = 'modal-icon-wrapper info';
    iconEl.setAttribute('data-lucide', 'help-circle');
    confirmBtn.className = 'btn btn-primary';
  }

  if (window.lucide) window.lucide.createIcons();

  modal.classList.remove('hidden');

  // Clean listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

  newConfirmBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    onConfirm();
  });

  newCancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

// Print QR Code & Barcode Modal
export function showQRCodeModal(item) {
  const modal = document.getElementById('qr-modal');
  if (!modal) return;

  const itemName = document.getElementById('print-item-name');
  const itemCode = document.getElementById('print-item-code');
  const closeBtn = document.getElementById('qr-modal-close');
  const cancelBtn = document.getElementById('qr-modal-cancel');
  const printBtn = document.getElementById('qr-modal-print');

  itemName.textContent = item.name;
  itemCode.textContent = item.code;

  // Render Barcode using JsBarcode SVG
  try {
    JsBarcode("#print-barcode", item.barcode, {
      format: "CODE128",
      width: 1.5,
      height: 35,
      displayValue: true,
      fontSize: 10,
      margin: 0
    });
  } catch (err) {
    console.error("Barcode generation failed", err);
  }

  // Render QR Code using qrcode package on Canvas
  const qrCanvas = document.getElementById('print-qrcode');
  if (qrCanvas) {
    QRCode.toCanvas(qrCanvas, `${item.code} | ${item.name} | SN: ${item.serialNumber || '-'}`, {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }, function (error) {
      if (error) console.error(error);
    });
  }

  modal.classList.remove('hidden');

  // Bind close buttons
  closeBtn.onclick = () => modal.classList.add('hidden');
  cancelBtn.onclick = () => modal.classList.add('hidden');

  // Print execution
  printBtn.onclick = () => {
    document.body.classList.add('printing-label');
    window.print();
    // Remove class after print completes
    setTimeout(() => {
      document.body.classList.remove('printing-label');
    }, 1000);
  };
}

// SheetJS Excel/CSV Export
export function exportToExcel(data, filename = 'logistics-export') {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}.xlsx`);
    showToast("Berhasil mengekspor data ke Excel", "success");
  } catch (err) {
    showToast("Gagal mengekspor data ke Excel", "danger");
    console.error(err);
  }
}

export function exportToCSV(data, filename = 'logistics-export') {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Berhasil mengekspor data ke CSV", "success");
  } catch (err) {
    showToast("Gagal mengekspor data ke CSV", "danger");
    console.error(err);
  }
}

// Native PDF Print Handler
export function exportToPDF() {
  document.body.classList.add('printing-report');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-report');
  }, 1000);
}
