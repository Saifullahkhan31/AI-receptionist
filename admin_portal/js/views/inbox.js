/* ═══════════════════════════════════════════════
   inbox.js — WhatsApp Chat Inbox View
   Two-pane layout: conversation list + chat window.
   Supports realtime new message events and doctor
   manually sending messages from the dashboard.
═══════════════════════════════════════════════ */

const InboxView = (() => {
  'use strict';

  let doctor = null;
  let conversations = [];
  let activePhone = null;
  let activePatientName = null;
  let initialized = false;

  // ── DOM refs ─────────────────────────────────
  const listEl      = () => document.getElementById('inbox-conversation-list');
  const countEl     = () => document.getElementById('inbox-count');
  const searchEl    = () => document.getElementById('inbox-search');
  const emptyEl     = () => document.getElementById('inbox-chat-empty');
  const activeEl    = () => document.getElementById('inbox-chat-active');
  const messagesEl  = () => document.getElementById('inbox-messages');
  const inputEl     = () => document.getElementById('inbox-input');
  const sendBtn     = () => document.getElementById('inbox-send-btn');
  const chatNameEl  = () => document.getElementById('inbox-chat-name');
  const chatPhoneEl = () => document.getElementById('inbox-chat-phone');
  const chatAvatar  = () => document.getElementById('inbox-chat-avatar');
  const layoutEl    = () => document.getElementById('inbox-layout');

  // ── Helpers ──────────────────────────────────
  function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return d.toLocaleDateString('en-GB', { weekday: 'short' });
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function initials(name) {
    if (!name) return '?';
    return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function formatMsgTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ── API calls ────────────────────────────────
  async function fetchConversations() {
    const backendUrl = CONFIG.RAILWAY_API_URL;
    const token = localStorage.getItem(CONFIG.SESSION_KEY);
    const res = await fetch(`${backendUrl}/api/admin/inbox`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch inbox');
    const data = await res.json();
    return data.conversations || [];
  }

  async function fetchMessages(phone) {
    const backendUrl = CONFIG.RAILWAY_API_URL;
    const token = localStorage.getItem(CONFIG.SESSION_KEY);
    const res = await fetch(`${backendUrl}/api/admin/inbox/${encodeURIComponent(phone)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    const data = await res.json();
    return data.messages || [];
  }

  async function sendMessage(phone, message, patientName) {
    const backendUrl = CONFIG.RAILWAY_API_URL;
    const token = localStorage.getItem(CONFIG.SESSION_KEY);
    const res = await fetch(`${backendUrl}/api/admin/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone_number: phone, message, patient_name: patientName })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  }

  // ── Render conversation list ──────────────────
  function renderList(filter = '') {
    const el = listEl();
    if (!el) return;

    const filtered = filter
      ? conversations.filter(c =>
          (c.patient_name || '').toLowerCase().includes(filter.toLowerCase()) ||
          c.phone_number.includes(filter)
        )
      : conversations;

    // Count is always total conversations, badge shown only if > 0
    const total = conversations.length;
    const cEl = countEl();
    if (cEl) {
      cEl.textContent = total;
      cEl.style.display = total > 0 ? '' : 'none';
    }

    if (filtered.length === 0) {
      el.innerHTML = `<div class="inbox-empty-list"><span>No conversations yet</span></div>`;
      return;
    }

    el.innerHTML = filtered.map(c => `
      <div class="inbox-convo-item ${c.phone_number === activePhone ? 'active' : ''}"
           data-phone="${c.phone_number}"
           data-name="${c.patient_name || 'Unknown'}">
        <div class="inbox-convo-avatar">${initials(c.patient_name)}</div>
        <div class="inbox-convo-body">
          <div class="inbox-convo-top">
            <strong class="inbox-convo-name">${c.patient_name || c.phone_number}</strong>
            <span class="inbox-convo-time">${formatTime(c.last_at)}</span>
          </div>
          <p class="inbox-convo-preview ${c.last_direction === 'outbound' ? 'outbound' : ''}">
            ${c.last_direction === 'outbound' ? '↩ ' : ''}${(c.last_message || '').slice(0, 60)}${(c.last_message || '').length > 60 ? '…' : ''}
          </p>
        </div>
      </div>
    `).join('');

    el.querySelectorAll('.inbox-convo-item').forEach(item => {
      item.addEventListener('click', () => openConversation(item.dataset.phone, item.dataset.name));
    });
  }

  // ── Render messages bubbles ───────────────────
  function renderMessages(messages) {
    const el = messagesEl();
    if (!el) return;

    if (messages.length === 0) {
      el.innerHTML = `<div class="inbox-no-messages">No messages yet. Start the conversation!</div>`;
      return;
    }

    el.innerHTML = messages.map(m => `
      <div class="inbox-bubble-row ${m.direction}">
        <div class="inbox-bubble ${m.direction}">
          <span class="bubble-text">${escapeHtml(m.content)}</span>
          <span class="bubble-time">${formatMsgTime(m.created_at)}</span>
        </div>
      </div>
    `).join('');

    el.scrollTop = el.scrollHeight;
  }

  function escapeHtml(text) {
    return (text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  // FIX 1: Mobile — add chat-open class to layout so CSS can swap panes
  function setChatOpen(open) {
    const layout = layoutEl();
    if (layout) layout.classList.toggle('chat-open', open);
  }

  // FIX 2: Close chat (mobile back button)
  function closeChat() {
    activePhone = null;
    activePatientName = null;
    setChatOpen(false);
    if (emptyEl()) emptyEl().hidden = false;
    if (activeEl()) activeEl().hidden = true;
    renderList(searchEl()?.value || '');
  }

  // FIX 2: Refresh chat
  async function refreshChat() {
    if (!activePhone) return;
    const refreshBtn = document.getElementById('inbox-refresh-btn');
    if (refreshBtn) {
      refreshBtn.classList.add('spinning');
      setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
    }
    if (messagesEl()) messagesEl().innerHTML = '<div class="inbox-loading">Loading messages…</div>';
    try {
      const msgs = await fetchMessages(activePhone);
      renderMessages(msgs);
    } catch (err) {
      if (messagesEl()) messagesEl().innerHTML = '<div class="inbox-error">Failed to load messages.</div>';
    }
  }

  // ── Open a conversation ───────────────────────
  async function openConversation(phone, name) {
    activePhone = phone;
    activePatientName = name;

    // Update header
    if (chatNameEl()) chatNameEl().textContent = name || phone;
    if (chatPhoneEl()) chatPhoneEl().textContent = '+' + phone;
    if (chatAvatar()) chatAvatar().textContent = initials(name);

    // Show chat panel — and on mobile switch to chat-open mode
    if (emptyEl()) emptyEl().hidden = true;
    if (activeEl()) activeEl().hidden = false;
    setChatOpen(true); // FIX 1: triggers mobile CSS swap

    // Highlight item and hide badge (FIX 3: reset count when reading)
    renderList(searchEl()?.value || '');
    const cEl = countEl();
    if (cEl) cEl.style.display = 'none'; // hide badge once a chat is opened

    // Load messages
    if (messagesEl()) messagesEl().innerHTML = '<div class="inbox-loading">Loading messages…</div>';
    try {
      const msgs = await fetchMessages(phone);
      renderMessages(msgs);
    } catch (err) {
      if (messagesEl()) messagesEl().innerHTML = '<div class="inbox-error">Failed to load messages.</div>';
      console.error('[Inbox] Failed to load messages:', err);
    }
  }

  // ── Load conversations ────────────────────────
  async function load() {
    try {
      conversations = await fetchConversations();
      conversations.sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
      renderList();
    } catch (err) {
      console.error('[Inbox] Failed to load conversations:', err);
    }
  }

  // ── Public: jump from another view ───────────
  function jumpToConversation(phone, name) {
    Router.switchView('inbox');
    setTimeout(() => openConversation(phone, name), 50);
  }

  // ── Send message ──────────────────────────────
  async function handleSend() {
    const el = inputEl();
    const text = (el?.value || '').trim();
    if (!text || !activePhone) return;

    el.value = '';
    el.style.height = 'auto';

    // FIX 4: Add optimistic bubble with a unique id so we can update it
    const optimisticId = 'opt-' + Date.now();
    const msgs = messagesEl();
    if (msgs) {
      const placeholder = msgs.querySelector('.inbox-no-messages');
      if (placeholder) placeholder.remove();

      const row = document.createElement('div');
      row.className = 'inbox-bubble-row outbound';
      row.id = optimisticId;
      row.innerHTML = `<div class="inbox-bubble outbound"><span class="bubble-text">${escapeHtml(text)}</span><span class="bubble-time bubble-sending">Sending…</span></div>`;
      msgs.appendChild(row);
      msgs.scrollTop = msgs.scrollHeight;
    }

    try {
      await sendMessage(activePhone, text, activePatientName);
      // FIX 4: Update "Sending…" to current time on success
      const sentRow = document.getElementById(optimisticId);
      if (sentRow) {
        const timeEl = sentRow.querySelector('.bubble-sending');
        if (timeEl) {
          timeEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          timeEl.classList.remove('bubble-sending');
        }
      }
    } catch (err) {
      console.error('[Inbox] Send failed:', err);
      // Mark the bubble as failed
      const sentRow = document.getElementById(optimisticId);
      if (sentRow) {
        const timeEl = sentRow.querySelector('.bubble-sending');
        if (timeEl) {
          timeEl.textContent = '✗ Failed';
          timeEl.style.color = '#ffcccc';
        }
      }
      alert('Failed to send message. Check your connection.');
    }
  }

  // ── Init ─────────────────────────────────────
  function init(doc) {
    doctor = doc;
    if (initialized) return;
    initialized = true;

    // FIX 2: Wire Refresh and Close (back) buttons
    const refreshBtn = document.getElementById('inbox-refresh-btn');
    const closeBtn = document.getElementById('inbox-close-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshChat);
    if (closeBtn) closeBtn.addEventListener('click', closeChat);

    // Load when view becomes active
    window.addEventListener('viewchange', e => {
      if (e.detail.view === 'inbox') load();
    });

    // Realtime: new message
    window.addEventListener('inbox-message', e => {
      const msg = e.detail;
      const existing = conversations.find(c => c.phone_number === msg.phone_number);
      if (existing) {
        existing.last_message = msg.content;
        existing.last_direction = msg.direction;
        existing.last_at = msg.created_at;
        conversations.sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
      } else {
        conversations.unshift({
          phone_number: msg.phone_number,
          patient_name: msg.patient_name || 'Unknown',
          last_message: msg.content,
          last_direction: msg.direction,
          last_at: msg.created_at,
        });
      }
      renderList(searchEl()?.value || '');

      // Append to open chat if it matches
      if (msg.phone_number === activePhone && messagesEl()) {
        const msgsList = messagesEl();
        const placeholder = msgsList.querySelector('.inbox-no-messages');
        if (placeholder) placeholder.remove();

        // Don't double-add outbound messages we already added optimistically
        // (realtime fires after send completes so the optimistic bubble is already there)
        // Only add inbound, or outbound sent by another session
        if (msg.direction === 'inbound') {
          const row = document.createElement('div');
          row.className = `inbox-bubble-row ${msg.direction}`;
          row.innerHTML = `<div class="inbox-bubble ${msg.direction}"><span class="bubble-text">${escapeHtml(msg.content)}</span><span class="bubble-time">${formatMsgTime(msg.created_at)}</span></div>`;
          msgsList.appendChild(row);
          msgsList.scrollTop = msgsList.scrollHeight;
        }
      }
    });

    // Search filter
    const sEl = searchEl();
    if (sEl) sEl.addEventListener('input', () => renderList(sEl.value));

    // Send button
    const sBtn = sendBtn();
    if (sBtn) sBtn.addEventListener('click', handleSend);

    // Textarea: Enter to send, Shift+Enter for newline, auto-resize
    const inp = inputEl();
    if (inp) {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
      inp.addEventListener('input', () => {
        inp.style.height = 'auto';
        inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
      });
    }
  }

  return { init, jumpToConversation, openConversation };
})();
