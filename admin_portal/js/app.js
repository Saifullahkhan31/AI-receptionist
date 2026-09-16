/* ═══════════════════════════════════════════════
   app.js — Main App Init
   Called after successful PIN login.
═══════════════════════════════════════════════ */

function initApp(doctor) {
  'use strict';

  const appShell = document.getElementById('screen-app');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarCollapsedKey = 'cmd_portal_sidebar_collapsed';
  const setSidebarCollapsed = (collapsed) => {
    appShell.classList.toggle('sidebar-collapsed', collapsed);
    if (sidebarToggle) {
      sidebarToggle.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
      sidebarToggle.title = collapsed ? 'Expand navigation' : 'Collapse navigation';
    }
  };
  if (sidebarToggle) {
    setSidebarCollapsed(localStorage.getItem(sidebarCollapsedKey) === 'true');
    sidebarToggle.addEventListener('click', () => {
      const collapsed = !appShell.classList.contains('sidebar-collapsed');
      setSidebarCollapsed(collapsed);
      localStorage.setItem(sidebarCollapsedKey, String(collapsed));
    });
  }

  // ── Update top bar ──────────────────────────────
  const displayName = (doctor && doctor.display_name) || (doctor && doctor.name) || 'Doctor';
  document.getElementById('top-bar-doctor').textContent = displayName;
  const initials = displayName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  ['sidebar-doctor', 'greeting-doctor'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = displayName;
  });
  ['sidebar-avatar', 'top-avatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initials;
  });
  const profileName = document.getElementById('profile-doctor-name');
  const profileAvatar = document.getElementById('profile-avatar');
  if (profileName) profileName.textContent = displayName;
  if (profileAvatar) profileAvatar.textContent = initials;

  // Format date: "Fri, 5 Sep"
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('top-bar-date').textContent = dateStr;
  const mobileDate = document.getElementById('top-bar-date-mobile');
  if (mobileDate) mobileDate.textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // ── Logout ──────────────────────────────────────
  const logoutModal = document.getElementById('modal-logout');
  const performLogout = () => {
    localStorage.removeItem(CONFIG.SESSION_KEY);
    localStorage.removeItem(CONFIG.SESSION_DOCTOR_KEY);
    location.reload();
  };
  const requestLogout = () => {
    if (profileModal) profileModal.hidden = true;
    if (logoutModal) logoutModal.hidden = false;
  };
  const logoutBtn = document.getElementById('btn-logout');
  const sidebarLogoutBtn = document.getElementById('sidebar-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', requestLogout);
  if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', requestLogout);
  const cancelLogout = document.getElementById('cancel-logout');
  const confirmLogout = document.getElementById('confirm-logout');
  if (cancelLogout) cancelLogout.addEventListener('click', () => { logoutModal.hidden = true; });
  if (confirmLogout) confirmLogout.addEventListener('click', performLogout);
  if (logoutModal) logoutModal.addEventListener('click', e => { if (e.target === logoutModal) logoutModal.hidden = true; });
  const profileModal = document.getElementById('modal-doctor-profile');
  const profileBtn = document.getElementById('profile-btn');
  const profileLogout = document.getElementById('doctor-profile-logout');
  if (profileBtn && profileModal) profileBtn.addEventListener('click', e => {
    if (window.matchMedia('(max-width: 899px)').matches) {
      e.stopPropagation();
      profileModal.hidden = false;
    }
  });
  const profileSheet = document.querySelector('#modal-doctor-profile .doctor-profile-sheet');
  if (profileSheet) profileSheet.addEventListener('click', e => e.stopPropagation());
  if (profileModal) profileModal.addEventListener('click', e => { if (e.target === profileModal) profileModal.hidden = true; });
  if (profileLogout) profileLogout.addEventListener('click', requestLogout);

  // ── Initialise first view (Today) ───────────────
  TodayView.init(doctor);
  PatientsView.init();
  SettingsView.init(doctor);

  // ── Show FAB only on Today ─────────────────────
  const fab = document.getElementById('fab-add');
  window.addEventListener('viewchange', e => {
    const v = e.detail.view;
    fab.style.display = v === 'today' ? 'flex' : 'none';
    const appMain = document.getElementById('app-main');
    if (appMain) {
      appMain.classList.toggle('patients-view-active', v === 'patients');
      if (v === 'patients') appMain.scrollTop = 0;
    }
    appShell.classList.toggle('settings-active', v === 'settings');
    const title = document.querySelector('.top-bar-title');
    const date = document.getElementById('top-bar-date');
    const mobileDate = document.getElementById('top-bar-date-mobile');
    if (title) title.textContent = v === 'patients' ? 'Patients' : v === 'settings' ? 'Settings' : "Today's Appointments";
    if (date) date.textContent = v === 'patients' ? 'Patient records & history' : v === 'settings' ? 'Clinic configuration' : dateStr;
    if (mobileDate) mobileDate.textContent = v === 'patients'
      ? 'Patient records & history'
      : v === 'settings'
        ? 'Clinic configuration'
        : now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  });

  console.log('[APP] Initialised for', displayName);
}

/* ═══════════════════════════════════════════════
   GLOBAL UTILITIES
════════════════════════════════════════════════ */
window.cmdConfirm = function(title, text, confirmText = 'Confirm', confirmColor = '#2196D3') {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal-delete');
    if (!modal) return resolve(confirm(title + '\n' + text)); // fallback

    const titleEl = modal.querySelector('h2');
    const textEl = modal.querySelector('p');
    const confirmBtn = document.getElementById('confirm-delete');
    const cancelBtn = document.getElementById('cancel-delete');
    
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    if (confirmBtn) {
      confirmBtn.textContent = confirmText;
      confirmBtn.style.background = confirmColor;
    }
    
    modal.hidden = false;
    
    const cleanup = () => {
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      modal.hidden = true;
    };
    
    const onConfirm = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    const onBackdrop = (e) => { if (e.target === modal) onCancel(); };
    
    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
  });
};
