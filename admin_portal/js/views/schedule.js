/* ═══════════════════════════════════════════════
   schedule.js — This Week's Schedule View
   Shows all upcoming appointments for the next 7
   days, grouped by date with a day-strip navigator.
═══════════════════════════════════════════════ */

const ScheduleView = (() => {
  'use strict';

  // ── DOM Refs ────────────────────────────────────
  const bodyEl      = document.getElementById('schedule-body');
  const stripEl     = document.getElementById('schedule-day-strip');
  const rangeEl     = document.getElementById('schedule-range');
  const backBtn     = document.getElementById('back-to-today-btn');

  // ── State ───────────────────────────────────────
  let allAppointments = [];
  let activeDayIdx    = 0; // index into the 7-day strip
  let activeCard      = null;
  let currentDays     = [];

  // ── Helpers ─────────────────────────────────────
  const escape = v => String(v ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function localDateISO(date = new Date()) {
    return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  }

  function formatTime(timeStr) {
    if (!timeStr) return '—';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function badgeClass(status) {
    if (!status) return 'badge-tentative';
    const s = status.toLowerCase();
    if (s === 'show') return 'badge-show';
    if (s === 'no show') return 'badge-noshow';
    if (s.includes('cancel') || s.includes('postpone')) return 'badge-cancel';
    return 'badge-tentative';
  }

  function badgeLabel(status) {
    if (!status) return 'Scheduled';
    const s = status.toLowerCase();
    if (s === 'show') return 'Arrived';
    if (s === 'no show') return 'Did Not Arrive';
    if (s.includes('cancel') || s.includes('postpone')) return 'Cancelled';
    return 'Scheduled';
  }

  // Build the 7-day array starting from today (Karachi time)
  function buildDays() {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        iso: localDateISO(d),
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        num: d.getDate(),
      });
    }
    return days;
  }

  // ── Render 7-day strip ──────────────────────────
  function renderStrip(days) {
    stripEl.innerHTML = '';
    days.forEach((day, idx) => {
      // Count appointments on this day
      const count = allAppointments.filter(a => a.appointment_date === day.iso).length;

      const btn = document.createElement('button');
      btn.className = 'strip-day' + (idx === activeDayIdx ? ' strip-day--active' : '');
      btn.setAttribute('aria-label', `${day.label} ${day.num}`);
      btn.innerHTML = `
        <span class="strip-day-label">${escape(day.label)}</span>
        <span class="strip-day-num">${day.num}</span>
        ${count > 0 ? `<span class="strip-day-dot">${count}</span>` : '<span class="strip-day-dot strip-day-dot--empty"></span>'}
      `;
      btn.addEventListener('click', () => {
        activeDayIdx = idx;
        renderStrip(days);
        scrollToDay(day.iso);
      });
      stripEl.appendChild(btn);
    });
  }

  // ── Scroll body to a specific day section ───────
  function scrollToDay(iso) {
    const section = bodyEl.querySelector(`[data-day-iso="${iso}"]`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ── Render full grouped list ─────────────────────
  function renderBody(days) {
    bodyEl.innerHTML = '';

    // Group appointments by date
    const grouped = {};
    allAppointments.forEach(appt => {
      const d = appt.appointment_date;
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(appt);
    });

    let hasAny = false;

    days.forEach(day => {
      const dayAppts = grouped[day.iso] || [];

      // Day section header
      const section = document.createElement('div');
      section.className = 'schedule-day-section';
      section.setAttribute('data-day-iso', day.iso);

      const dayLabel = day.date.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long',
      });
      const isToday = day.iso === localDateISO();

      section.innerHTML = `
        <div class="schedule-day-header">
          <span class="schedule-day-name">${escape(dayLabel)}${isToday ? ' <span class="today-badge">Today</span>' : ''}</span>
          <span class="schedule-day-count">${dayAppts.length} appt${dayAppts.length !== 1 ? 's' : ''}</span>
        </div>
      `;

      if (dayAppts.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'schedule-day-empty';
        empty.textContent = 'No appointments';
        section.appendChild(empty);
      } else {
        hasAny = true;
        dayAppts.forEach(appt => {
          section.appendChild(renderCard(appt));
        });
      }

      bodyEl.appendChild(section);
    });

    if (!hasAny) {
      bodyEl.innerHTML = `
        <div class="schedule-empty-state">
          <div class="empty-icon">📅</div>
          <p class="empty-title">No appointments this week</p>
          <p class="empty-sub">Tap + on the Today tab to add one</p>
        </div>
      `;
    }
  }

  // ── Toggle card expand ──────────────────────────
  function toggleCard(id) {
    activeCard = activeCard === id ? null : id;
    renderBody(currentDays);
  }

  // ── Single appointment card (like Today's) ────────
  function renderCard(appt) {
    const t = formatTime(appt.appointment_time);
    const badge = badgeClass(appt.status);
    const label = badgeLabel(appt.status);
    const isOpen = activeCard === appt.id;
    const initials = (appt.patient_name || 'P').split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const avatarColors = ['blue', 'purple', 'coral', 'green', 'orange', 'cyan'];
    const avatarColor = avatarColors[(appt.patient_name || '').length % avatarColors.length];

    const docColors = [
      { bg: '#edf4ff', text: '#1669d8' },
      { bg: '#eefaf3', text: '#159447' },
      { bg: '#fff9e7', text: '#bd8100' },
      { bg: '#f3e8ff', text: '#7e22ce' },
      { bg: '#ffe4e6', text: '#e11d48' },
      { bg: '#e0f2fe', text: '#0369a1' }
    ];
    let docColor = docColors[0];
    
    let docName = appt.doctor_name || appt.requested_doctor || null;
    if (typeof TodayView !== 'undefined' && TodayView.doctorDirectory) {
      const doctor = TodayView.doctorDirectory.get(appt.doctor_id);
      if (doctor && (doctor.display_name || doctor.name)) docName = doctor.display_name || doctor.name;
    }

    if (docName) {
      let hash = 0;
      for (let i = 0; i < docName.length; i++) hash = docName.charCodeAt(i) + ((hash << 5) - hash);
      docColor = docColors[Math.abs(hash) % docColors.length];
    }

    const card = document.createElement('div');
    card.className = 'appt-card';
    card.dataset.id = appt.id;

    card.innerHTML = `
      <div class="appt-card-main">
        <div class="appt-time-col">
          <div class="appt-time">${escape(t.split(' ')[0])}</div>
          <div class="appt-time-ampm">${escape(t.split(' ')[1] || '')}</div>
        </div>
        <div class="patient-group">
          <div class="patient-avatar patient-avatar--${avatarColor}">${escape(initials)}</div>
          <div class="appt-info">
            <div class="appt-name">${escape(appt.patient_name)}</div>
            <div class="appt-treatment">${escape(appt.treatment_planned || 'No treatment specified')}</div>
          </div>
        </div>
        <div class="appt-doctor">
          ${docName
            ? `<span class="status-badge" style="background: ${docColor.bg}; color: ${docColor.text}; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escape(docName)}</span>`
            : ''}
        </div>
        <button class="status-badge ${badge}" data-appt-id="${escape(appt.id)}" aria-label="Change status">
          ${label}
        </button>
        <div class="appt-actions">
          <button class="appt-view" aria-label="View appointment"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5Z"/><circle cx="10" cy="10" r="2"/></svg><span>View</span></button>
          <button class="appt-more" aria-label="More appointment actions">⋮</button>
        </div>
      </div>
      ${isOpen ? renderDetail(appt) : ''}
    `;

    // Tap card body → expand detail
    card.querySelector('.appt-card-main').addEventListener('click', e => {
      if (e.target.closest('.status-badge')) return;
      toggleCard(appt.id);
    });

    // Tap status badge → open status picker
    card.querySelector('button.status-badge').addEventListener('click', e => {
      e.stopPropagation();
      if (typeof TodayView !== 'undefined' && TodayView.openStatusPicker) {
        TodayView.openStatusPicker(appt);
      }
    });

    card.querySelector('.appt-view').addEventListener('click', e => {
      e.stopPropagation();
      if (typeof TodayView !== 'undefined' && TodayView.openAppointmentView) {
        TodayView.openAppointmentView(appt);
      }
    });

    card.querySelector('.appt-more').addEventListener('click', e => {
      e.stopPropagation();
      toggleCard(appt.id);
    });

    return card;
  }

  function renderDetail(appt) {
    const phone = appt.contact_number;
    let docName = appt.doctor_name || appt.requested_doctor || 'Not assigned';
    if (typeof TodayView !== 'undefined' && TodayView.doctorDirectory) {
      const doctor = TodayView.doctorDirectory.get(appt.doctor_id);
      if (doctor && (doctor.display_name || doctor.name)) docName = doctor.display_name || doctor.name;
    } else if (typeof doctorDirectory !== 'undefined') {
      const doctor = doctorDirectory.get(appt.doctor_id);
      if (doctor && (doctor.display_name || doctor.name)) docName = doctor.display_name || doctor.name;
    }

    return `
      <div class="appt-detail" data-detail-id="${escape(appt.id)}">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; font-size: 13px; color: #4a5568;">
          <div><strong>Patient:</strong> ${escape(appt.patient_name)}</div>
          <div><strong>Phone:</strong> ${phone ? `<a href="tel:${escape(phone)}" style="color: #1669d8; text-decoration: none;">${escape(phone)}</a>` : '<span style="color:#a0aec0">No phone</span>'}</div>
          <div><strong>Treatment:</strong> ${escape(appt.treatment_planned || 'Not specified')}</div>
          <div><strong>Doctor:</strong> ${escape(docName)}</div>
          ${appt.notes ? `<div style="grid-column: 1 / -1;"><strong>Notes:</strong> ${escape(appt.notes)}</div>` : ''}
        </div>
        <div class="detail-actions" style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn-detail" data-view-appt="${escape(appt.id)}" style="background: white; border: 1px solid #d1d5db; color: #374151;">View Full Details</button>
          <button class="btn-detail" data-delete-appt="${escape(appt.id)}" style="background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626;">Delete</button>
        </div>
      </div>
    `;
  }

  // ── Main load ────────────────────────────────────
  async function load() {
    bodyEl.innerHTML = `
      <div class="appt-skeleton"></div>
      <div class="appt-skeleton"></div>
      <div class="appt-skeleton"></div>
    `;
    stripEl.innerHTML = '';

    try {
      allAppointments = await API.getWeekAppointments();
    } catch (err) {
      console.error('[SCHEDULE] Load error:', err);
      allAppointments = [];
    }

    const days = buildDays();
    currentDays = days;

    // Set range label
    if (rangeEl) {
      const start = days[0].date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const end   = days[6].date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      rangeEl.textContent = `${start} – ${end}`;
    }

    renderStrip(days);
    renderBody(days);

    // Sync strip active state on scroll
    setupScrollObserver(days);
  }

  // ── Intersection observer to sync strip ─────────
  function setupScrollObserver(days) {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const iso = entry.target.getAttribute('data-day-iso');
          const idx = days.findIndex(d => d.iso === iso);
          if (idx !== -1 && idx !== activeDayIdx) {
            activeDayIdx = idx;
            renderStrip(days);
          }
        }
      });
    }, { root: null, rootMargin: '-40% 0px -55% 0px' });

    bodyEl.querySelectorAll('.schedule-day-section').forEach(el => observer.observe(el));
  }

  // ── Wire up Back to Today ────────────────────────
  if (backBtn) {
    backBtn.addEventListener('click', () => Router.switchView('today'));
  }

  // ── Delete appointment ──────────────────────────
  async function deleteAppt(id) {
    const confirmed = await window.cmdConfirm('Delete Appointment?', 'Are you sure you want to delete this appointment? This action cannot be undone.', 'Delete', '#e53935');
    if (!confirmed) return;
    allAppointments = allAppointments.filter(a => a.id !== id);
    renderBody(currentDays);
    try {
      await API.deleteAppointment(id);
      if (window.TodayView) TodayView.reload();
    } catch (err) {
      console.error('[SCHEDULE] Delete failed:', err);
      await load();
    }
  }

  bodyEl.addEventListener('click', e => {
    const delBtn = e.target.closest('[data-delete-appt]');
    if (delBtn) deleteAppt(delBtn.dataset.deleteAppt);

    const viewBtn = e.target.closest('[data-view-appt]');
    if (viewBtn) {
      const apptId = viewBtn.dataset.viewAppt;
      const appt = allAppointments.find(a => String(a.id) === String(apptId));
      if (appt && typeof TodayView !== 'undefined' && TodayView.openAppointmentView) {
        TodayView.openAppointmentView(appt);
      }
    }
  });

  // ── Listen for view switch ───────────────────────
  window.addEventListener('viewchange', e => {
    if (e.detail.view === 'schedule') load();
  });

  window.addEventListener('appointments-updated', () => {
    if (Router.getCurrent() === 'schedule') {
      load();
    }
  });

  return { load, reload: load };
})();
