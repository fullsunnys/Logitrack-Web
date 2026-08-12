// src/js/charts.js

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

let activeCharts = {};

export function renderDashboardCharts(inventory, transactions, isDarkTheme = false) {
  // Theme colors for Chart.js styling
  const gridColor = isDarkTheme ? '#374151' : '#e2e8f0';
  const textColor = isDarkTheme ? '#9ca3af' : '#64748b';
  const accentBlue = '#1e40af';
  const accentLightBlue = '#3b82f6';
  const accentTeal = '#10b981';
  const accentOrange = '#f59e0b';
  const accentPurple = '#8b5cf6';

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
        titleColor: isDarkTheme ? '#f9fafb' : '#0f172a',
        bodyColor: isDarkTheme ? '#d1d5db' : '#4b5563',
        borderColor: gridColor,
        borderWidth: 1,
        titleFont: { family: 'Plus Jakarta Sans', weight: '700' },
        bodyFont: { family: 'Plus Jakarta Sans' },
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
      }
    }
  };

  // Helper to destroy previous chart instances
  const setupCanvas = (id) => {
    if (activeCharts[id]) {
      activeCharts[id].destroy();
    }
    const canvas = document.getElementById(id);
    return canvas;
  };

  // 1. STATISTIK PEMINJAMAN BULANAN (Line Chart)
  const lineCanvas = setupCanvas('chart-monthly-borrowing');
  if (lineCanvas) {
    // Group transactions by month in 2026
    const monthlyCounts = Array(12).fill(0);
    transactions.forEach(t => {
      const date = new Date(t.borrowDate);
      if (date.getFullYear() === 2026) {
        monthlyCounts[date.getMonth()] += t.qty;
      }
    });

    activeCharts['chart-monthly-borrowing'] = new Chart(lineCanvas, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'],
        datasets: [{
          label: 'Jumlah Aset Dipinjam',
          data: monthlyCounts,
          borderColor: accentLightBlue,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: accentLightBlue,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: commonOptions
    });
  }

  // 2. KATEGORI INVENTARIS (Doughnut Chart)
  const doughnutCanvas = setupCanvas('chart-category-proportion');
  if (doughnutCanvas) {
    const categoryCounts = {};
    inventory.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + item.totalStock;
    });

    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);

    activeCharts['chart-category-proportion'] = new Chart(doughnutCanvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [accentBlue, accentTeal, accentOrange, accentPurple, '#ec4899', '#f43f5e', '#64748b'],
          borderWidth: isDarkTheme ? 2 : 1,
          borderColor: isDarkTheme ? '#1f2937' : '#ffffff'
        }]
      },
      options: {
        ...commonOptions,
        scales: {
          x: { display: false },
          y: { display: false }
        },
        plugins: {
          ...commonOptions.plugins,
          legend: {
            position: 'right',
            labels: {
              color: textColor,
              font: { family: 'Plus Jakarta Sans', size: 10 }
            }
          }
        }
      }
    });
  }

  // 3. AKTIVITAS INVENTARIS BULANAN (Grouped Bar Chart - Masuk vs Peminjaman)
  const barCanvas = setupCanvas('chart-inventory-activity');
  if (barCanvas) {
    const addedCounts = Array(12).fill(0);
    const borrowedCounts = Array(12).fill(0);

    inventory.forEach(item => {
      const date = new Date(item.dateAdded);
      if (date.getFullYear() === 2026) {
        addedCounts[date.getMonth()] += item.totalStock;
      }
    });

    transactions.forEach(t => {
      const date = new Date(t.borrowDate);
      if (date.getFullYear() === 2026) {
        borrowedCounts[date.getMonth()] += t.qty;
      }
    });

    activeCharts['chart-inventory-activity'] = new Chart(barCanvas, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'],
        datasets: [
          {
            label: 'Barang Masuk',
            data: addedCounts,
            backgroundColor: accentTeal,
            borderRadius: 4
          },
          {
            label: 'Barang Dipinjam',
            data: borrowedCounts,
            backgroundColor: accentOrange,
            borderRadius: 4
          }
        ]
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins
        }
      }
    });
  }

  // 4. TOP 10 PALING SERING DIPINJAM (Horizontal Bar Chart)
  const hBarCanvas = setupCanvas('chart-top-borrowed');
  if (hBarCanvas) {
    // Count borrowing frequency by item code
    const counts = {};
    transactions.forEach(t => {
      counts[t.itemCode] = (counts[t.itemCode] || 0) + t.qty;
    });

    // Map to array and sort
    const topBorrowed = inventory
      .map(item => ({
        name: item.name,
        count: counts[item.code] || 0
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const labels = topBorrowed.map(item => item.name);
    const data = topBorrowed.map(item => item.count);

    activeCharts['chart-top-borrowed'] = new Chart(hBarCanvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Frekuensi Peminjaman',
          data: data,
          backgroundColor: accentPurple,
          borderRadius: 4
        }]
      },
      options: {
        ...commonOptions,
        indexAxis: 'y',
        plugins: {
          ...commonOptions.plugins,
          legend: { display: false }
        },
        scales: {
          ...commonOptions.scales,
          y: {
            ...commonOptions.scales.y,
            ticks: {
              color: textColor,
              font: { family: 'Plus Jakarta Sans', size: 9 },
              callback: function(value) {
                // Shorten labels on Y-axis
                const label = this.getLabelForValue(value);
                return label.length > 18 ? label.substring(0, 15) + '...' : label;
              }
            }
          }
        }
      }
    });
  }
}
