/* ============================================================
   dashboard.js — Dashboard behavior.
   Pulls from FastAPI backend, falls back to demo data.
   Features: skeleton loaders, count-up KPIs, toast notifications,
   inline PDF generation, auto-refresh, alert banner for at-risk packs,
   scatter chart of fleet readings.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  mountComponents();
  initDashboardSidebar();
  loadDashboard();

  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadDashboard(true);
  });
  document.getElementById('battery-select')?.addEventListener('change', loadDashboard);

  // Auto-refresh every 60s
  setInterval(() => loadDashboard(false, true), 60_000);
});

/* ---- Demo fallback data ---- */
const DEMO = {
  kpis: {
    avg_soh: 84.6, soh_delta: '+1.2% this month',
    avg_rul_cycles: 612, rul_delta: '-38 cycles vs. last check',
    avg_charging_efficiency: 91.3, charging_delta: '+2.1% improved',
    flagged_count: 3, flagged_delta: '2 nearing end-of-life',
  },
  soh_trend: {
    labels: Array.from({ length: 14 }, (_, i) => `Wk ${i + 1}`),
    values: [96, 95.4, 94.2, 93.8, 92.5, 91.7, 90.9, 89.8, 88.6, 87.4, 86.1, 85.9, 85.0, 84.6],
  },
  degradation: {
    labels: Array.from({ length: 11 }, (_, i) => `Cyc ${i * 100}`),
    observed:  [100, 97.2, 94.1, 91.3, 88.5, 85.4, 82.1, null, null, null, null],
    predicted: [100, 97.2, 94.1, 91.3, 88.5, 85.4, 82.1, 79.3, 76.2, 73.0, 70.1],
  },
  charging: {
    labels: ['PACK-011', 'PACK-024', 'PACK-035', 'PACK-042', 'PACK-058', 'PACK-071'],
    values: [96, 88, 74, 92, 65, 83],
  },
  fleet_dist: { labels: ['Healthy', 'Watch', 'At-risk'], values: [21, 6, 3] },
  reports: [
    { battery_id: 'PACK-042', generated_at: '2026-07-09', soh: 88.2, rul: 540, status: 'healthy',  report_id: 'r1' },
    { battery_id: 'PACK-035', generated_at: '2026-07-08', soh: 74.1, rul: 180, status: 'watch',    report_id: 'r2' },
    { battery_id: 'PACK-071', generated_at: '2026-07-07', soh: 83.6, rul: 410, status: 'healthy',  report_id: 'r3' },
    { battery_id: 'PACK-058', generated_at: '2026-07-05', soh: 61.4, rul: 60,  status: 'at-risk',  report_id: 'r4' },
    { battery_id: 'PACK-024', generated_at: '2026-07-04', soh: 90.4, rul: 720, status: 'healthy',  report_id: 'r5' },
  ],
  fleet: [
    { battery_id: 'PACK-011', soh: 96.1, cycles: 120,  rul: 980, charging_efficiency: 96, status: 'healthy'  },
    { battery_id: 'PACK-024', soh: 90.4, cycles: 340,  rul: 720, charging_efficiency: 88, status: 'healthy'  },
    { battery_id: 'PACK-071', soh: 83.6, cycles: 620,  rul: 410, charging_efficiency: 83, status: 'healthy'  },
    { battery_id: 'PACK-035', soh: 74.1, cycles: 810,  rul: 180, charging_efficiency: 74, status: 'watch'    },
    { battery_id: 'PACK-042', soh: 88.2, cycles: 410,  rul: 540, charging_efficiency: 92, status: 'healthy'  },
    { battery_id: 'PACK-058', soh: 61.4, cycles: 1120, rul: 60,  charging_efficiency: 65, status: 'at-risk'  },
  ],
  alerts: [
    { battery_id: 'PACK-058', soh: 61.4, status: 'at-risk',  message: 'Critical — plan for replacement' },
    { battery_id: 'PACK-035', soh: 74.1, status: 'watch',    message: 'Schedule inspection within 30 days' },
  ],
};

let charts = {};

/* ---- Main load function ---- */
async function loadDashboard(showRefreshToast = false, silent = false) {
  const batteryId = document.getElementById('battery-select')?.value || undefined;

  if (!silent) showSkeletons();

  const [kpis, soh, deg, charging, fleet, reports, alerts] = await Promise.all([
    safe(() => api.getKpis(),                       DEMO.kpis),
    safe(() => api.getSohTrend(batteryId),           DEMO.soh_trend),
    safe(() => api.getDegradationTrend(batteryId),   DEMO.degradation),
    safe(() => api.getChargingEfficiency(batteryId), DEMO.charging),
    safe(() => api.listFleet(),                      DEMO.fleet),
    safe(() => api.listReports(),                    DEMO.reports),
    safe(() => api.getAlerts?.() || Promise.reject(), DEMO.alerts),
  ]);

  renderAlertBanner(alerts, fleet);
  renderKpis(kpis);
  renderCharts(soh, deg, charging, fleet);
  renderReportsTable(reports);
  renderFleetTable(fleet);
  populateBatterySelect(fleet);

  if (window.lucide) lucide.createIcons();
  if (showRefreshToast) showToast('Dashboard refreshed', 'info', 2500);
}

async function safe(fn, fallback) {
  try { return await fn(); } catch (_) { return fallback; }
}

/* ---- Skeleton loading ---- */
function showSkeletons() {
  ['kpi-soh', 'kpi-rul', 'kpi-charging', 'kpi-flagged'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = '<div class="skeleton h-8 w-20 inline-block rounded"></div>'; }
  });
}

/* ---- Alert banner ---- */
function renderAlertBanner(alerts, fleet) {
  const container = document.getElementById('alert-container');
  if (!container) return;

  const atRisk = (alerts && alerts.length)
    ? alerts.filter(a => a.status === 'at-risk')
    : fleet.filter(b => b.status === 'at-risk');

  if (atRisk.length === 0) { container.innerHTML = ''; return; }

  const ids = atRisk.map(b => b.battery_id).join(', ');
  container.innerHTML = `
    <div class="alert-banner alert-banner-error">
      <i data-lucide="alert-octagon" class="w-4 h-4 shrink-0"></i>
      <span><strong>${atRisk.length} pack${atRisk.length > 1 ? 's' : ''} at risk:</strong> ${ids} — plan replacements immediately.</span>
      <a href="#fleet" class="ml-auto text-xs font-semibold underline whitespace-nowrap">View fleet →</a>
    </div>`;
  if (window.lucide) lucide.createIcons();
}

/* ---- KPI rendering with count-up ---- */
function renderKpis(k) {
  function setKpi(id, value, suffix, deltaId, delta) {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof animateCounter === 'function') {
      const num = parseFloat(value);
      animateCounter(el, num, suffix);
    } else {
      el.textContent = value + suffix;
    }
    const deltaEl = document.getElementById(deltaId);
    if (deltaEl) deltaEl.textContent = delta;
  }

  setKpi('kpi-soh',      k.avg_soh,                '%', 'kpi-soh-delta',      k.soh_delta);
  setKpi('kpi-rul',      k.avg_rul_cycles,          '',  'kpi-rul-delta',      k.rul_delta);
  setKpi('kpi-charging', k.avg_charging_efficiency, '%', 'kpi-charging-delta', k.charging_delta);
  setKpi('kpi-flagged',  k.flagged_count,           '',  'kpi-flagged-delta',  k.flagged_delta);
}

/* ---- Charts ---- */
function renderCharts(soh, deg, charging, fleet) {
  Object.values(charts).forEach(c => { if (c) c.destroy(); });
  charts = {};

  charts.soh         = renderSohTrendChart('chart-soh', soh.labels, soh.values);
  charts.degradation = renderDegradationChart('chart-degradation', deg.labels, deg.observed, deg.predicted);
  charts.charging    = renderChargingEfficiencyChart('chart-charging', charging.labels, charging.values);

  const dist = { healthy: 0, watch: 0, 'at-risk': 0 };
  fleet.forEach(b => { dist[b.status] = (dist[b.status] || 0) + 1; });
  charts.fleetDist = renderFleetDistributionChart(
    'chart-fleet-dist',
    ['Healthy', 'Watch', 'At-risk'],
    [dist.healthy, dist.watch, dist['at-risk']]
  );
}

/* ---- Status chip ---- */
function statusChip(status) {
  const map = { healthy: 'chip-good', watch: 'chip-warn', 'at-risk': 'chip-bad' };
  const label = { healthy: 'Healthy', watch: 'Watch', 'at-risk': 'At-risk' };
  return `<span class="chip ${map[status] || 'chip-warn'}">${label[status] || status}</span>`;
}

/* ---- SoH progress bar ---- */
function sohBar(soh) {
  let cls = 'progress-fill-green';
  if (soh < 75) cls = 'progress-fill-red';
  else if (soh < 85) cls = 'progress-fill-amber';
  return `
    <div class="progress-bar mt-1.5" style="width:80px">
      <div class="progress-fill ${cls}" style="width:${soh}%"></div>
    </div>`;
}

/* ---- Reports table ---- */
function renderReportsTable(reports) {
  const tbody = document.getElementById('reports-table');
  if (!tbody) return;

  if (!reports || reports.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center dash-card-muted text-sm">No reports yet. Upload a CSV or submit a manual reading.</td></tr>`;
    return;
  }

  tbody.innerHTML = reports.map(r => `
    <tr class="border-b border-[var(--dark-border)] last:border-0 hover:bg-[rgba(255,255,255,0.03)] transition-colors">
      <td class="py-3 px-2 font-mono text-sm">${r.battery_id}</td>
      <td class="py-3 px-2 dash-card-muted text-sm">${r.generated_at}</td>
      <td class="py-3 px-2">
        <span class="font-mono text-sm">${r.soh}%</span>
        ${sohBar(r.soh)}
      </td>
      <td class="py-3 px-2 font-mono text-sm">${r.rul} <span class="dash-card-muted text-xs">cyc</span></td>
      <td class="py-3 px-2">${statusChip(r.status)}</td>
      <td class="py-3 px-2 text-right">
        <button
          class="btn btn-ghost btn-xs inline-flex gap-1.5 text-[var(--dark-ink-soft)] border-[var(--dark-border)] hover:text-[var(--dark-ink)] hover:border-[var(--dark-ink-soft)]"
          onclick="downloadReport('${r.report_id}', '${r.battery_id}')"
          title="Download PDF">
          <i data-lucide="download" class="w-3.5 h-3.5"></i> PDF
        </button>
      </td>
    </tr>`).join('');
}

/* ---- Fleet table ---- */
function renderFleetTable(fleet) {
  const tbody = document.getElementById('fleet-table');
  if (!tbody) return;

  if (!fleet || fleet.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center dash-card-muted text-sm">No batteries registered yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = fleet.map(b => `
    <tr class="border-b border-[var(--dark-border)] last:border-0 hover:bg-[rgba(255,255,255,0.03)] transition-colors">
      <td class="py-3 px-2 font-mono text-sm font-semibold">${b.battery_id}</td>
      <td class="py-3 px-2">
        <span class="font-mono text-sm">${b.soh}%</span>
        ${sohBar(b.soh)}
      </td>
      <td class="py-3 px-2 font-mono text-sm dash-card-muted">${b.cycles.toLocaleString()}</td>
      <td class="py-3 px-2 font-mono text-sm">${b.rul.toLocaleString()}</td>
      <td class="py-3 px-2">
        <div class="flex items-center gap-2">
          <span class="font-mono text-sm">${b.charging_efficiency}%</span>
          <div class="w-16 progress-bar">
            <div class="progress-fill ${b.charging_efficiency >= 90 ? 'progress-fill-green' : b.charging_efficiency >= 75 ? 'progress-fill-amber' : 'progress-fill-red'}"
              style="width:${b.charging_efficiency}%"></div>
          </div>
        </div>
      </td>
      <td class="py-3 px-2">${statusChip(b.status)}</td>
      <td class="py-3 px-2 text-right">
        <button
          class="btn btn-ghost btn-xs inline-flex gap-1.5 text-[var(--dark-ink-soft)] border-[var(--dark-border)] hover:text-[var(--dark-ink)]"
          onclick="generateReport('${b.battery_id}')"
          title="Generate PDF report">
          <i data-lucide="file-plus" class="w-3.5 h-3.5"></i> Report
        </button>
      </td>
    </tr>`).join('');
}

/* ---- Battery select ---- */
function populateBatterySelect(fleet) {
  const select = document.getElementById('battery-select');
  if (!select) return;
  const current = select.value;
  const ids = fleet.map(b => b.battery_id);
  select.innerHTML = `<option value="">All batteries</option>` +
    ids.map(id => `<option value="${id}">${id}</option>`).join('');
  if (ids.includes(current)) select.value = current;
}

/* ---- Download report ---- */
async function downloadReport(reportId, batteryId = 'report') {
  try {
    showToast('Generating PDF…', 'info', 2000);
    const blob = await api.downloadReport(reportId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batteryId}_${reportId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('PDF downloaded!', 'success');
  } catch (err) {
    showToast(`Couldn't download: ${err.message}`, 'error');
  }
}

/* ---- Generate report on demand ---- */
async function generateReport(batteryId) {
  showToast(`Generating report for ${batteryId}…`, 'info', 3000);
  try {
    const report = await api.generateReport(batteryId);
    showToast(`Report for ${batteryId} created! SoH: ${report.soh}%`, 'success');
    setTimeout(loadDashboard, 800);
  } catch (err) {
    showToast(`Couldn't generate report: ${err.message}`, 'error');
  }
}

/* ---- Sidebar mobile toggle ---- */
function initDashboardSidebar() {
  const sidebar  = document.querySelector('.dash-sidebar');
  const overlay  = document.getElementById('dash-overlay');
  const openBtn  = document.getElementById('sidebar-open');
  const closeBtn = document.getElementById('sidebar-close');
  if (!sidebar) return;

  function openSidebar() {
    sidebar.classList.add('is-open');
    overlay?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('is-open');
    overlay?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  openBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  // Close on nav link click (mobile)
  sidebar.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 1024) closeSidebar();
    });
  });
}
