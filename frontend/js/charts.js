/* ============================================================
   charts.js — Chart.js configuration helpers (dark-card themed)
   All charts use the dark surface palette from CSS variables.
   ============================================================ */

// ---- Global defaults ----
if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family  = "'Inter', -apple-system, sans-serif";
  Chart.defaults.font.size    = 12;
  Chart.defaults.color        = '#8A96AF';
  Chart.defaults.borderColor  = '#2A3350';

  if (!Chart.defaults.plugins) Chart.defaults.plugins = {};
  if (!Chart.defaults.plugins.tooltip) Chart.defaults.plugins.tooltip = {};

  Chart.defaults.plugins.tooltip.padding    = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.titleFont  = { weight: '600', size: 12 };
  Chart.defaults.plugins.tooltip.bodyFont   = { size: 12 };
  Chart.defaults.plugins.tooltip.backgroundColor = '#1C2235';
  Chart.defaults.plugins.tooltip.borderColor = '#2A3350';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.displayColors = true;
  Chart.defaults.plugins.tooltip.boxPadding = 4;
  Chart.defaults.animation    = { duration: 900, easing: 'easeOutQuart' };
}

// ---- Helpers ----
function gradient(ctx, area, fromColor, toColor) {
  if (!area) return 'transparent';
  const g = ctx.createLinearGradient(0, area.top || 0, 0, area.bottom || 0);
  g.addColorStop(0, fromColor);
  g.addColorStop(1, toColor);
  return g;
}

function voltageColor(v) {
  if (v >= 90) return '#22C55E';
  if (v >= 75) return '#F59E0B';
  return '#EF4444';
}

// ---- SoH Trend Chart ----
function renderSohTrendChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const safeLabels = labels || [];
  const safeValues = values || [];

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: safeLabels,
      datasets: [{
        label: 'State of Health (%)',
        data: safeValues,
        borderColor: '#3B5BFF',
        backgroundColor: (c) => {
          if (!c || !c.chart) return 'transparent';
          const { chartArea, ctx: cx } = c.chart;
          if (!chartArea) return 'transparent';
          return gradient(cx, chartArea, 'rgba(59,91,255,0.32)', 'rgba(59,91,255,0)');
        },
        tension: 0.38,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#3B5BFF',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2.5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` SoH: ${ctx.parsed.y != null ? ctx.parsed.y.toFixed(1) + '%' : 'N/A'}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { maxTicksLimit: 8 },
        },
        y: {
          min: 55,
          max: 100,
          grid: { color: 'rgba(42,51,80,0.6)' },
          border: { display: false, dash: [4, 4] },
          ticks: { callback: v => `${v}%` },
        },
      },
    },
  });
}

// ---- Degradation Observed vs Predicted ----
function renderDegradationChart(canvasId, labels, actual, predicted) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const safeLabels = labels || [];
  const safeActual = actual || [];
  const safePredicted = predicted || [];

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: safeLabels,
      datasets: [
        {
          label: 'Observed SoH',
          data: safeActual,
          borderColor: '#22C55E',
          backgroundColor: 'rgba(34,197,94,0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#22C55E',
          borderWidth: 2.5,
          spanGaps: false,
        },
        {
          label: 'Predicted SoH',
          data: safePredicted,
          borderColor: '#F59E0B',
          borderDash: [6, 4],
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#F59E0B',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 10, boxHeight: 10,
            usePointStyle: true, pointStyle: 'circle',
            padding: 16,
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y != null ? ctx.parsed.y.toFixed(1) + '%' : 'N/A'}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { maxTicksLimit: 6 },
        },
        y: {
          grid: { color: 'rgba(42,51,80,0.6)' },
          border: { display: false },
          ticks: { callback: v => `${v}%` },
        },
      },
    },
  });
}

// ---- Charging Efficiency Bar Chart ----
function renderChargingEfficiencyChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const safeLabels = labels || [];
  const safeValues = values || [];

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: safeLabels,
      datasets: [{
        label: 'Charging Efficiency (%)',
        data: safeValues,
        backgroundColor: safeValues.map(v => {
          if (v >= 90) return 'rgba(34,197,94,0.80)';
          if (v >= 75) return 'rgba(245,158,11,0.80)';
          return 'rgba(239,68,68,0.80)';
        }),
        hoverBackgroundColor: safeValues.map(v => {
          if (v >= 90) return '#22C55E';
          if (v >= 75) return '#F59E0B';
          return '#EF4444';
        }),
        borderRadius: 7,
        borderSkipped: false,
        maxBarThickness: 32,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` Efficiency: ${ctx.parsed.y != null ? ctx.parsed.y.toFixed(1) + '%' : 'N/A'}`,
            afterLabel: ctx => {
              const v = ctx.parsed.y;
              if (v == null) return '';
              return v >= 90 ? ' ✓ Good' : v >= 75 ? ' ⚠ Watch' : ' ✗ At Risk';
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { font: { size: 11 } },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(42,51,80,0.6)' },
          border: { display: false },
          ticks: { callback: v => `${v}%`, stepSize: 25 },
        },
      },
    },
  });
}

// ---- Fleet Distribution Doughnut ----
function renderFleetDistributionChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const safeLabels = labels || [];
  const safeValues = values || [];
  const total = safeValues.reduce((a, b) => a + b, 0) || 1;

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: safeLabels,
      datasets: [{
        data: safeValues,
        backgroundColor: ['rgba(34,197,94,0.85)', 'rgba(245,158,11,0.85)', 'rgba(239,68,68,0.85)'],
        hoverBackgroundColor: ['#22C55E', '#F59E0B', '#EF4444'],
        borderColor: '#161B27',
        borderWidth: 3,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 10, boxHeight: 10,
            usePointStyle: true, pointStyle: 'circle',
            padding: 16, font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} packs (${Math.round(ctx.parsed / total * 100)}%)`,
          },
        },
      },
    },
  });
}

// ---- Voltage / Temperature Scatter (heatmap-style) ----
function renderScatterChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');

  return new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Readings (Voltage vs Temp)',
        data,
        backgroundColor: data.map(d => {
          const soh = 100 - (d.x - 3.5) * 20 - (d.y - 25) * 0.5;
          if (soh >= 85) return 'rgba(34,197,94,0.70)';
          if (soh >= 70) return 'rgba(245,158,11,0.70)';
          return 'rgba(239,68,68,0.70)';
        }),
        pointRadius: 5,
        pointHoverRadius: 8,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` V: ${ctx.parsed.x.toFixed(2)}V  Temp: ${ctx.parsed.y.toFixed(1)}°C`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Voltage (V)', color: '#8A96AF', font: { size: 11 } },
          grid: { color: 'rgba(42,51,80,0.6)' },
          border: { display: false },
        },
        y: {
          title: { display: true, text: 'Temperature (°C)', color: '#8A96AF', font: { size: 11 } },
          grid: { color: 'rgba(42,51,80,0.6)' },
          border: { display: false },
        },
      },
    },
  });
}

// ---- Animated KPI counter ----
function animateCounter(el, target, suffix = '', duration = 900) {
  if (!el) return;
  const start = parseFloat(el.dataset.value || '0') || 0;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out quad
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;
    el.textContent = Number.isInteger(target)
      ? Math.round(current) + suffix
      : current.toFixed(1) + suffix;
    el.dataset.value = String(current);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(step);
}

// ---- Predicted vs Actual SoH Scatter Chart ----
function renderPredictedVsActualChart(canvasId, points) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const safePoints = points || [];

  return new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Prediction Points',
          data: safePoints,
          backgroundColor: 'rgba(59, 130, 246, 0.55)',
          pointRadius: 4.5,
          pointHoverRadius: 7,
          borderWidth: 0,
        },
        {
          label: 'Perfect Fit (y = x)',
          type: 'line',
          data: [{ x: 0, y: 0 }, { x: 200, y: 200 }],
          borderColor: '#EF4444',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 10, boxHeight: 10,
            usePointStyle: true, pointStyle: 'circle',
            color: '#8A96AF',
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` Actual: ${ctx.parsed.x.toFixed(1)}%  Predicted: ${ctx.parsed.y.toFixed(1)}%`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Actual SoH (%)', color: '#8A96AF', font: { size: 12 } },
          grid: { color: 'rgba(42,51,80,0.6)' },
          border: { display: false },
          min: 0,
          max: 200,
          ticks: { color: '#8A96AF' }
        },
        y: {
          title: { display: true, text: 'Predicted SoH (%)', color: '#8A96AF', font: { size: 12 } },
          grid: { color: 'rgba(42,51,80,0.6)' },
          border: { display: false },
          min: 0,
          max: 200,
          ticks: { color: '#8A96AF' }
        }
      }
    }
  });
}
