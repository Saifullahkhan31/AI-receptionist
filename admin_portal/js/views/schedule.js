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
          section.appendChild(renderApptRow(appt));
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

  // ── Single appointment row ───────────────────────
  function renderApptRow(appt) {
    const badge  = badgeClass(appt.status);
    const label  = badgeLabel(appt.status);
    const time   = formatTime(appt.appointment_time);
    const initials = (appt.patient_name || 'P').split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const avatarColors = ['blue', 'purple', 'coral', 'green', 'orange', 'cyan'];
    const avatarColor  = avatarColors[(appt.patient_name || '').length % avatarColors.length];

    const row = document.createElement('div');
    row.className = 'schedule-appt-row';
    row.innerHTML = `
      <div class="schedule-time">${escape(time)}</div>
      <div class="patient-group">
        <div class="patient-avatar patient-avatar--${avatarColor}">${escape(initials)}</div>
        <div class="appt-info">
          <div class="appt-name">${escape(appt.patient_name || 'Unknown Patient')}</div>
          <div class="appt-treatment">${escape(appt.treatment_planned || 'No treatment specified')}</div>
        </div>
      </div>
      <span class="status-badge ${badge}">${label}</span>
    `;
    return row;
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

  // ── Listen for view switch ───────────────────────
  window.addEventListener('viewchange', e => {
    if (e.detail.view === 'schedule') load();
  });

  return { load };
})();
