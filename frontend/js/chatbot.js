/* ============================================================
   chatbot.js — Floating chatbot (landing + dashboard).
   Features: typing indicator, message timestamps, clear button,
   Ctrl+K shortcut, quick-prompt chips, character limit.
   ============================================================ */

function initChatbot() {
  if (window.__chatbot_initialized__) return;
  const fab      = document.getElementById('chat-fab');
  const panel    = document.getElementById('chat-panel');
  const closeBtn = document.getElementById('chat-close');
  const clearBtn = document.getElementById('chat-clear');
  const form     = document.getElementById('chat-form');
  const input    = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  const chips    = document.getElementById('quick-chips');
  if (!fab || !panel || !form) return;
  window.__chatbot_initialized__ = true;

  // ---- Toggle ----
  const open  = () => { panel.classList.add('is-open'); input.focus(); };
  const close = () => panel.classList.remove('is-open');
  const toggle = () => panel.classList.contains('is-open') ? close() : open();

  fab.addEventListener('click', toggle);
  closeBtn.addEventListener('click', close);

  // Ctrl+K shortcut
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); toggle(); }
    if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
  });

  // ---- Clear conversation ----
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      messages.innerHTML = `
        <div class="msg-bubble msg-bot">
          Chat cleared. How can I help you with your battery analytics?
        </div>
        <div class="chat-quick-chips" id="quick-chips">
          <button class="chat-chip" data-prompt="What does SoH mean?">What is SoH?</button>
          <button class="chat-chip" data-prompt="How is RUL calculated?">How is RUL calculated?</button>
          <button class="chat-chip" data-prompt="Which batteries are at risk?">At-risk packs</button>
          <button class="chat-chip" data-prompt="Tips to improve charging efficiency">Charging tips</button>
        </div>`;
      bindChips();
      if (window.lucide) lucide.createIcons();
    });
  }

  // ---- Quick prompt chips ----
  function bindChips() {
    document.querySelectorAll('.chat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        // Remove the chips container
        const chipsEl = document.getElementById('quick-chips');
        if (chipsEl) chipsEl.remove();
        sendMessage(prompt);
      });
    });
  }
  bindChips();

  // ---- Add message bubble ----
  function addMessage(text, from = 'bot') {
    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${from === 'user' ? 'msg-user' : 'msg-bot'}`;
    bubble.textContent = text;

    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messages.appendChild(bubble);
    messages.appendChild(time);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  // ---- Typing indicator ----
  function showTyping() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>`;
    messages.appendChild(indicator);
    messages.scrollTop = messages.scrollHeight;
    return indicator;
  }

  function removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  // ---- Send message ----
  async function sendMessage(text) {
    if (!text || !text.trim()) return;
    addMessage(text, 'user');
    input.value = '';

    const indicator = showTyping();

    try {
      const context = { page: document.body.dataset.page || 'landing' };
      const { reply } = await api.sendChatMessage(text, context);
      removeTyping();
      addMessage(reply, 'bot');
    } catch (err) {
      removeTyping();
      addMessage("I couldn't reach the analytics backend. Please check that the API is running at localhost:8000.", 'bot');
    }
  }

  // ---- Form submit ----
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = input.value.trim();
    sendMessage(text);
  });

  // ---- Input character counter (optional visual feedback) ----
  input.addEventListener('input', () => {
    const remaining = 500 - input.value.length;
    if (remaining < 50) {
      input.style.borderColor = remaining < 10 ? 'var(--volt-low)' : 'var(--volt-mid)';
    } else {
      input.style.borderColor = '';
    }
  });
}

document.addEventListener('DOMContentLoaded', initChatbot);
