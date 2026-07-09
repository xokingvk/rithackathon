/* ============================================================
   main.js — Landing page behavior.
   Features: scroll progress bar, reveal animations, hero battery
   animation, tab switching, CSV upload, manual BMS entry form,
   floating particles, confetti on success.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  mountComponents({ navActive: 'home' });
  initScrollProgress();
  initNavbarScroll();
  initReveal();
  initHeroBattery();
  initParticles();
  initTabs();
  initCsvUpload();
  initManualForm();
  initCountUpStats();
});

/* ---- Scroll progress bar ---- */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0%';
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ---- Navbar scroll state ---- */
function initNavbarScroll() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---- Reveal on scroll ---- */
function initReveal() {
  const items = document.querySelectorAll('.reveal, .stagger-children');
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
  items.forEach(el => io.observe(el));
}

/* ---- Hero battery animation ---- */
function initHeroBattery() {
  const fill    = document.getElementById('hero-fill');
  const readout = document.getElementById('hero-readout');
  const caption = document.getElementById('hero-caption');
  const metricSoh  = document.getElementById('hero-metric-soh');
  const metricRul  = document.getElementById('hero-metric-rul');
  const metricEff  = document.getElementById('hero-metric-eff');
  if (!fill) return;

  const target = 87;

  requestAnimationFrame(() => {
    setTimeout(() => {
      fill.style.width = `${target}%`;

      let current = 0;
      const step = () => {
        current = Math.min(current + 2, target);
        readout.textContent = `${current}%`;
        if (current < target) requestAnimationFrame(step);
        else {
          caption.textContent = 'estimated state of health';
          // Reveal metric pills
          if (metricSoh) setTimeout(() => { metricSoh.style.opacity = '1'; }, 300);
          if (metricRul) setTimeout(() => { metricRul.style.opacity = '1'; }, 500);
          if (metricEff) setTimeout(() => { metricEff.style.opacity = '1'; }, 700);
        }
      };
      setTimeout(step, 250);
    }, 300);
  });
}

/* ---- Floating particles ---- */
function initParticles() {
  const container = document.getElementById('particles-container');
  if (!container) return;

  const colors = ['rgba(59,91,255,0.5)', 'rgba(139,92,246,0.4)', 'rgba(34,197,94,0.35)', 'rgba(59,91,255,0.3)'];

  function spawnParticle() {
    const el = document.createElement('div');
    el.className = 'particle';
    const size = 4 + Math.random() * 8;
    const x    = Math.random() * 100;
    const duration = 8 + Math.random() * 14;
    const delay    = Math.random() * 6;
    const color    = colors[Math.floor(Math.random() * colors.length)];

    el.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${x}%;
      bottom: -20px;
      background: ${color};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), (duration + delay) * 1000 + 500);
  }

  // Initial batch
  for (let i = 0; i < 12; i++) spawnParticle();
  // Continuous spawn
  setInterval(spawnParticle, 1800);
}

/* ---- Animated stats (count-up) ---- */
function initCountUpStats() {
  const els = document.querySelectorAll('[data-count]');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
      let start = 0;
      const duration = 1200;
      const startTime = performance.now();
      function step(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = start + (target - start) * eased;
        el.textContent = decimals ? current.toFixed(decimals) + suffix : Math.round(current) + suffix;
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  els.forEach(el => io.observe(el));
}

/* ---- Tabs (CSV / Manual) ---- */
function initTabs() {
  const tabs   = document.querySelectorAll('.tab-btn');
  const panels = {
    csv:    document.getElementById('panel-csv'),
    manual: document.getElementById('manual-form'),
  };
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      Object.entries(panels).forEach(([key, el]) => {
        if (!el) return;
        el.classList.toggle('hidden', key !== tab.dataset.tab);
      });
    });
  });
}

/* ---- CSV Upload ---- */
function initCsvUpload() {
  const form     = document.getElementById('csv-form');
  const input    = document.getElementById('csv-input');
  const filename = document.getElementById('csv-filename');
  const result   = document.getElementById('csv-result');
  const submit   = document.getElementById('csv-submit');
  if (!form) return;

  // Drag & drop
  ['dragenter', 'dragover'].forEach(evt =>
    form.addEventListener(evt, e => { e.preventDefault(); form.classList.add('is-dragover'); }));
  ['dragleave', 'drop'].forEach(evt =>
    form.addEventListener(evt, e => { e.preventDefault(); form.classList.remove('is-dragover'); }));
  form.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) { input.files = e.dataTransfer.files; filename.textContent = `📄 ${file.name}`; }
  });
  input.addEventListener('change', () => {
    if (input.files[0]) filename.textContent = `📄 ${input.files[0].name}`;
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!input.files[0]) {
      result.innerHTML = errorLine('Choose a CSV file first.');
      refreshIcons();
      return;
    }

    const batteryIdInput = document.getElementById('csv-battery-id');
    const batteryId = batteryIdInput ? batteryIdInput.value.trim() : '';

    if (submit) { submit.disabled = true; submit.textContent = 'Uploading…'; }
    result.innerHTML = pendingLine('Uploading and scoring your data…');
    refreshIcons();

    try {
      const data = await api.uploadCsv(input.files[0], batteryId || undefined);
      result.innerHTML = successLine(
        `<strong>${data.battery_id}</strong> · SoH <strong>${data.soh}%</strong> · RUL <strong>${data.rul_cycles} cycles</strong> · ${data.rows_ingested} rows ingested. Full report saved to your dashboard.`
      );
      confettiBurst();
      showToast('Report generated! Check your dashboard for the full analysis.', 'success');
      setTimeout(() => {
        const dashboard = document.querySelector('a[href="dashboard.html"]');
        if (dashboard) {
          result.innerHTML += `<a href="dashboard.html" class="btn btn-accent btn-sm mt-3">View dashboard →</a>`;
        }
      }, 600);
    } catch (err) {
      result.innerHTML = errorLine(`Upload failed: ${err.message}`);
      showToast('Upload failed. Is the backend running?', 'error');
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = 'Upload & analyze'; }
      refreshIcons();
    }
  });
}

/* ---- Manual BMS Form ---- */
function initManualForm() {
  const form   = document.getElementById('manual-form');
  const result = document.getElementById('manual-result');
  const detailCard = document.getElementById('manual-detail-card');
  if (!form) return;
  
  let currentBatteryId = '';
  
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    ['voltage', 'current', 'temperature', 'cycle_count', 'soc'].forEach(k => {
      if (payload[k] !== '') payload[k] = Number(payload[k]);
    });
    result.textContent = 'Analyzing and scoring BMS reading…';
    detailCard?.classList.add('hidden');
    
    try {
      const data = await api.submitManualEntry(payload);
      currentBatteryId = data.battery_id;
      
      // Update result status message
      result.innerHTML = `<span class="text-[var(--volt-high)] font-semibold">✓ Recorded.</span> Diagnostics generated.`;
      
      // Populate detail panel elements
      const sohVal = document.getElementById('detail-soh-val');
      const rulVal = document.getElementById('detail-rul-val');
      const effVal = document.getElementById('detail-eff-val');
      const statusBadge = document.getElementById('detail-status-badge');
      const statusDesc = document.getElementById('detail-status-desc');
      const needle = document.getElementById('gauge-needle');
      const notes = document.getElementById('detail-inference-notes');
      
      if (sohVal) sohVal.textContent = `${data.soh}%`;
      if (rulVal) rulVal.textContent = `${data.rul_cycles} cycles`;
      if (effVal) effVal.textContent = `${data.charging_efficiency}%`;
      
      // Rotate gauge needle (SOH range 0-100 maps to -90 to +90 degrees)
      if (needle) {
        const rotationAngle = -90 + (data.soh / 100) * 180;
        needle.style.transform = `rotate(${rotationAngle}deg)`;
      }
      
      // Status classifications and text updates
      if (statusBadge) {
        statusBadge.textContent = data.status;
        statusBadge.className = `px-3 py-1 text-[10px] font-bold rounded-full uppercase `;
        
        if (data.status === 'healthy') {
          statusBadge.classList.add('bg-green-500/15', 'text-green-400');
          if (statusDesc) statusDesc.textContent = 'Excellent state of health. Battery is functioning within parameters.';
          if (notes) notes.textContent = `The ML models indicate high capacity retention and low fade rates. Recommended for normal field operations.`;
        } else if (data.status === 'watch') {
          statusBadge.classList.add('bg-amber-500/15', 'text-amber-400');
          if (statusDesc) statusDesc.textContent = 'Moderate degradation detected. Monitor pack parameters closely.';
          if (notes) notes.textContent = `Slight deviation in charge capacity fade detected. Keep charging temperatures under 35°C to preserve lifetime cycles.`;
        } else {
          statusBadge.classList.add('bg-red-500/15', 'text-red-400');
          if (statusDesc) statusDesc.textContent = 'Critical health alert! Heavy degradation and potential anomaly.';
          if (notes) notes.textContent = `At-risk alert triggered by Isolation Forest (anomaly score exceeded threshold). Immediate field replacement is highly recommended.`;
        }
      }
      
      // Show details block
      detailCard?.classList.remove('hidden');
      confettiBurst();
      showToast(`Diagnostics generated for ${data.battery_id}!`, 'success');
      
    } catch (err) {
      result.textContent = `Inference failed: ${err.message}`;
      showToast('Submission failed. Check backend connectivity.', 'error');
    }
  });

  // Report Download handler
  const downloadBtn = document.getElementById('download-manual-report-btn');
  downloadBtn?.addEventListener('click', async () => {
    if (!currentBatteryId) return;
    try {
      showToast('Compiling analytical PDF report…', 'info', 2500);
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Generating…`;
      if (window.lucide) lucide.createIcons({ nodes: [downloadBtn] });

      const report = await api.generateReport(currentBatteryId);
      const blob = await api.downloadReport(report.report_id);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HealthReport_${currentBatteryId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      showToast(`Failed to download report: ${err.message}`, 'error');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i> Download PDF`;
      if (window.lucide) lucide.createIcons({ nodes: [downloadBtn] });
    }
  });
}

/* ---- Confetti burst ---- */
function confettiBurst() {
  const colors = ['#3B5BFF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const size = 6 + Math.random() * 8;
    el.style.cssText = `
      left: ${20 + Math.random() * 60}%;
      width: ${size}px; height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
}

/* ---- Inline result helpers ---- */
const successLine = msg => `<p class="flex items-start gap-2 text-[var(--volt-high)]"><i data-lucide="check-circle-2" class="w-4 h-4 shrink-0 mt-0.5"></i><span>${msg}</span></p>`;
const errorLine   = msg => `<p class="flex items-start gap-2 text-[var(--volt-low)]"><i data-lucide="alert-circle" class="w-4 h-4 shrink-0 mt-0.5"></i><span>${msg}</span></p>`;
const pendingLine = msg => `<p class="flex items-start gap-2 text-[var(--ink-soft)]"><i data-lucide="loader" class="w-4 h-4 shrink-0 mt-0.5 animate-spin"></i><span>${msg}</span></p>`;
function refreshIcons() { setTimeout(() => window.lucide && lucide.createIcons(), 0); }
