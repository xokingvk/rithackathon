/* ============================================================
   components.js — Reusable component templates (Navbar, Footer,
   ChatbotWidget, ToastNotification, AlertBanner).
   ============================================================ */

/* ---- Logo mark (shared) ---- */
function LogoMark(size = 'md') {
  const h = size === 'sm' ? 'h-[18px] w-[28px]' : 'h-[22px] w-[34px]';
  return `
    <span class="${h} rounded-[4px] border-[2.5px] border-[var(--ink)] relative flex items-center overflow-hidden">
      <span class="block h-full bg-gradient-to-r from-[var(--volt-mid)] to-[var(--volt-high)]" style="width:72%"></span>
    </span>`;
}

/* ---- Navbar ---- */
function Navbar(active = 'home') {
  const link = (href, label, key) =>
    `<a href="${href}" class="nav-link ${active === key ? '!text-[var(--ink)] font-semibold' : ''}">${label}</a>`;
  return `
  <nav class="navbar" id="site-navbar">
    <div class="container flex items-center justify-between h-16">
      <a href="index.html" class="flex items-center gap-2.5 font-bold text-[15px] z-10">
        ${LogoMark()}
        Voltaic<span class="text-[var(--ink-faint)] font-normal">IQ</span>
      </a>

      <div class="hidden md:flex items-center gap-7">
        ${link('index.html#platform', 'Platform', 'platform')}
        ${link('index.html#upload', 'Get started', 'upload')}
        ${link('dashboard.html', 'Dashboard', 'dashboard')}
        ${link('index.html#faq', 'FAQ', 'faq')}
      </div>

      <div class="flex items-center gap-3">
        <a href="dashboard.html" class="btn btn-ghost btn-sm hidden sm:inline-flex">Sign in</a>
        <a href="index.html#upload" class="btn btn-accent btn-sm">Analyze a battery</a>
        <button class="nav-hamburger md:hidden" id="nav-hamburger" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>

  <div class="mobile-nav" id="mobile-nav">
    <a href="index.html#platform" class="mobile-nav-link">Platform</a>
    <a href="index.html#upload" class="mobile-nav-link">Get started</a>
    <a href="dashboard.html" class="mobile-nav-link">Dashboard</a>
    <a href="index.html#faq" class="mobile-nav-link">FAQ</a>
    <div class="flex gap-3 mt-4">
      <a href="dashboard.html" class="btn btn-ghost">Sign in</a>
      <a href="index.html#upload" class="btn btn-accent">Analyze a battery</a>
    </div>
  </div>`;
}

/* ---- Footer ---- */
function Footer() {
  return `
  <footer class="border-t border-[var(--border)] mt-24">
    <div class="container py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
      <div class="col-span-2 md:col-span-1">
        <a href="index.html" class="flex items-center gap-2.5 font-bold text-[15px] mb-4">
          ${LogoMark()}
          VoltaicIQ
        </a>
        <p class="text-sm text-[var(--ink-soft)] leading-relaxed mb-5">
          Predictive battery health analytics for fleets, grids, and devices.
        </p>
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-[var(--volt-high)]" style="box-shadow: 0 0 0 3px rgba(34,197,94,0.2)"></span>
          <span class="text-xs text-[var(--ink-faint)]">All systems operational</span>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-[var(--ink-faint)] mb-4">Platform</p>
        <ul class="space-y-2.5 text-sm text-[var(--ink-soft)]">
          <li><a href="index.html#platform" class="hover:text-[var(--ink)] transition-colors">Health estimation</a></li>
          <li><a href="index.html#platform" class="hover:text-[var(--ink)] transition-colors">Remaining useful life</a></li>
          <li><a href="index.html#platform" class="hover:text-[var(--ink)] transition-colors">Charging analysis</a></li>
          <li><a href="dashboard.html#fleet" class="hover:text-[var(--ink)] transition-colors">Fleet analytics</a></li>
        </ul>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-[var(--ink-faint)] mb-4">Product</p>
        <ul class="space-y-2.5 text-sm text-[var(--ink-soft)]">
          <li><a href="dashboard.html" class="hover:text-[var(--ink)] transition-colors">Dashboard</a></li>
          <li><a href="index.html#upload" class="hover:text-[var(--ink)] transition-colors">Upload data</a></li>
          <li><a href="http://localhost:8000/docs" target="_blank" class="hover:text-[var(--ink)] transition-colors">API docs ↗</a></li>
          <li><a href="#" class="hover:text-[var(--ink)] transition-colors">Sample CSV</a></li>
        </ul>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-[var(--ink-faint)] mb-4">SDG Alignment</p>
        <ul class="space-y-2.5 text-sm text-[var(--ink-soft)]">
          <li class="flex items-start gap-2">
            <span class="mt-0.5 text-[var(--volt-high)]">⚡</span>
            SDG 7 — Affordable & Clean Energy
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-0.5 text-[var(--accent)]">🏭</span>
            SDG 9 — Industry & Innovation
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-0.5 text-[var(--volt-mid)]">🌱</span>
            SDG 13 — Climate Action
          </li>
        </ul>
      </div>
    </div>

    <div class="border-t border-[var(--border)]">
      <div class="container py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--ink-faint)]">
        <span>© 2026 VoltaicIQ. Built for reliable battery lifecycle management.</span>
        <div class="flex items-center gap-5">
          <a href="#" class="hover:text-[var(--ink)]">Privacy</a>
          <a href="#" class="hover:text-[var(--ink)]">Terms</a>
          <span>Powered by XGBoost + Groq AI</span>
        </div>
      </div>
    </div>
  </footer>`;
}

/* ---- ChatbotWidget ---- */
function ChatbotWidget() {
  return `
  <div id="chat-panel" class="chat-panel">
    <div class="chat-header">
      <div class="flex items-center gap-2.5">
        <span class="chat-status-dot"></span>
        <div>
          <p class="text-sm font-semibold text-[var(--dark-ink)] leading-tight">Cell Assistant</p>
          <p class="text-[10px] text-[var(--dark-ink-soft)]">Powered by Groq · LLaMA 3.3</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button id="chat-clear" class="text-[var(--dark-ink-soft)] hover:text-[var(--dark-ink)] transition-colors" title="Clear chat" style="background:none;border:none;cursor:pointer;padding:4px;">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
        </button>
        <button id="chat-close" class="text-[var(--dark-ink-soft)] hover:text-[var(--dark-ink)] transition-colors" aria-label="Close chat" style="background:none;border:none;cursor:pointer;padding:4px;">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
    </div>

    <div id="chat-messages" class="chat-messages">
      <div class="msg-bubble msg-bot">
        Hi! I'm your battery analytics assistant. Ask me about SoH trends, RUL predictions, or charging recommendations.
      </div>
      <div class="chat-quick-chips" id="quick-chips">
        <button class="chat-chip" data-prompt="What does SoH mean?">What is SoH?</button>
        <button class="chat-chip" data-prompt="How is RUL calculated?">How is RUL calculated?</button>
        <button class="chat-chip" data-prompt="Which batteries are at risk?">At-risk packs</button>
        <button class="chat-chip" data-prompt="Tips to improve charging efficiency">Charging tips</button>
      </div>
    </div>

    <form id="chat-form" class="chat-input-area">
      <input id="chat-input" type="text" autocomplete="off"
        placeholder="Ask about your fleet…" class="chat-input" maxlength="500" />
      <button type="submit" class="chat-send-btn" aria-label="Send message">
        <i data-lucide="arrow-up" class="w-4 h-4"></i>
      </button>
    </form>
  </div>

  <button id="chat-fab" class="chat-fab" aria-label="Open chat assistant">
    <i data-lucide="message-circle" class="w-6 h-6"></i>
  </button>

  <div id="toast-container"></div>`;
}

/* ---- Toast Notifications ---- */
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const iconMap = { success: 'check-circle-2', error: 'alert-circle', warn: 'alert-triangle', info: 'info' };
  const icon = iconMap[type] || 'info';

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i><span>${message}</span>`;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons({ nodes: [toast] });

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

/* ---- Alert Banner ---- */
function AlertBanner({ type = 'warn', message, icon = 'alert-triangle' } = {}) {
  return `
  <div class="alert-banner alert-banner-${type}" id="fleet-alert-banner">
    <i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i>
    <span>${message}</span>
  </div>`;
}

/* ---- Mount all components ---- */
function mountComponents({ navActive = 'home' } = {}) {
  document.querySelectorAll('[data-component="navbar"]').forEach(el => {
    el.innerHTML = Navbar(navActive);
  });
  document.querySelectorAll('[data-component="footer"]').forEach(el => {
    el.innerHTML = Footer();
  });
  document.querySelectorAll('[data-component="chatbot"]').forEach(el => {
    el.innerHTML = ChatbotWidget();
  });

  if (window.lucide) lucide.createIcons();

  if (typeof initChatbot === 'function') {
    initChatbot();
  }

  // Hamburger toggle
  const hamburger = document.getElementById('nav-hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('is-open');
      mobileNav.classList.toggle('is-open');
      document.body.style.overflow = mobileNav.classList.contains('is-open') ? 'hidden' : '';
    });
    // Close on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-open');
        mobileNav.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }
}
