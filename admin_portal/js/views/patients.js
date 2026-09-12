/* Patients view: Figma-style responsive list, detail panel and add-patient flow. */
const PatientsView = (() => {
  'use strict';
  let allPatients = [], selected = null, activeFilter = 'All', activeTab = 'appointments', timer;
  // C1+C2: separate caches for the two tables
  let currentTreatments = [], currentAppointments = [];
  // M2: request counter — discards stale responses when patient is switched quickly
  let selectRequestId = 0;
  const $ = id => document.getElementById(id);
  const searchInput = $('patient-search'), listEl = $('patient-list'), emptyEl = $('patients-empty');
  const modalProfile = $('modal-patient-profile');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials = name => String(name || '?').split(/\s+/).filter(Boolean).map(x => x[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#607D8B','#673AB7','#2196F3','#009688','#E91E63','#42A5F5','#795548','#00ACC1','#AB47BC'];
  const fileIcon = type => type === 'image'
    ? '<svg class="file-card-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 3 3 2-2 6 5"/></svg>'
    : '<svg class="file-card-icon file-card-icon--doc" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4M9 13h6M9 17h6"/></svg>';
  const colorFor = p => colors[Math.abs(String(p.id || p.name).split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % colors.length];
  const toDateOnly = value => {
    if (!value) return null;
    const raw = String(value).slice(0, 10);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const today = () => { const date = new Date(); date.setHours(0, 0, 0, 0); return date; };
  const formatDate = value => { const d = toDateOnly(value); return d ? d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'Not recorded'; };
  const statusFor = p => p.status || p.patient_status || 'Active';
  const lastVisitFor = p => p._lastTreatment?.date || p.last_visit || p.last_visit_date || null;
  const treatmentName = t => t?.treatment || t?.visit_type || 'Treatment';
  const treatmentTime = t => t?.time || t?.appointment_time || 'Time not recorded';
  const sortedTreatments = treatments => [...treatments].sort((a, b) => (toDateOnly(b.date)?.getTime() || 0) - (toDateOnly(a.date)?.getTime() || 0));
  const classifyTreatments = treatments => {
    const now = today();
    const dated = treatments.filter(t => toDateOnly(t.date));
    const upcoming = dated.filter(t => toDateOnly(t.date) >= now).sort((a, b) => toDateOnly(a.date) - toDateOnly(b.date));
    const past = dated.filter(t => toDateOnly(t.date) < now).sort((a, b) => toDateOnly(b.date) - toDateOnly(a.date));
    const undated = treatments.filter(t => !toDateOnly(t.date));
    return { upcoming, past, undated };
  };
  const latestPastTreatment = treatments => sortedTreatments(treatments).find(t => toDateOnly(t.date) && toDateOnly(t.date) <= today()) || null;
  const balanceFor = p => p.outstanding_balance ?? p.balance_due ?? p.balance ?? null;
  const filtered = () => allPatients.filter(p => (activeFilter === 'All' || statusFor(p) === activeFilter) && (!searchInput.value.trim() || `${p.name} ${p.contact_number || ''}`.toLowerCase().includes(searchInput.value.trim().toLowerCase())));
  function renderCard(p) {
    const card = document.createElement('button'); card.type = 'button'; card.className = `patient-card${selected && selected.id === p.id ? ' selected' : ''}`;
    const lastVisit = lastVisitFor(p);
    card.innerHTML = `<span class="patient-card-avatar" style="background:${colorFor(p)}">${escape(initials(p.name))}</span><span class="patient-card-copy"><strong>${escape(p.name)}</strong><small>Last visit: ${escape(formatDate(lastVisit))}</small></span><span class="patient-card-chevron">›</span>`;
    card.addEventListener('click', () => selectPatient(p)); return card;
  }
  function renderList() {
    const rows = filtered(); listEl.innerHTML = '';
    $('patients-total').textContent = allPatients.length; $('patient-count').textContent = `${rows.length} ${activeFilter === 'All' ? 'PATIENTS' : activeFilter.toUpperCase()}`;
    if (!rows.length) { emptyEl.hidden = false; return; } emptyEl.hidden = true; rows.forEach(p => listEl.appendChild(renderCard(p)));
  }
  function clearSelection() {
    selected = null;
    $('patient-detail-content').hidden = true;
    $('patient-detail-empty').hidden = false;
    renderList();
  }
  function moveSelection(direction) {
    const rows = filtered();
    if (!rows.length) return;
    const currentIndex = selected ? rows.findIndex(p => p.id === selected.id) : -1;
    const nextIndex = currentIndex < 0
      ? (direction > 0 ? 0 : rows.length - 1)
      : Math.max(0, Math.min(rows.length - 1, currentIndex + direction));
    selectPatient(rows[nextIndex]);
    requestAnimationFrame(() => {
      const card = [...listEl.querySelectorAll('.patient-card')][nextIndex];
      if (card) card.scrollIntoView({ block: 'nearest' });
    });
  }
  function renderAppointments(treatments) {
    const { upcoming, past, undated } = classifyTreatments(treatments);
    const row = t => `<div class="detail-visit-row"><div><strong>${escape(formatDate(t.date))}</strong><small>${escape(treatmentTime(t))}</small></div><span>${escape(treatmentName(t))}</span>${t.status ? `<b class="visit-status">• ${escape(t.status)}</b>` : '<span class="visit-status visit-status--muted">Date recorded</span>'}</div>`;
    const undatedBlock = undated.length ? `<div class="detail-section-title past-title">Unscheduled <em>${undated.length}</em></div>${undated.map(row).join('')}` : '';
    return `<div class="detail-section-title">Upcoming <em>${upcoming.length}</em></div>${upcoming.length ? upcoming.map(row).join('') : '<div class="detail-no-data">No upcoming visits recorded</div>'}<div class="detail-section-title past-title">Past <em>${past.length}</em></div>${past.length ? past.map(row).join('') : '<div class="detail-no-data">No past visits recorded</div>'}${undatedBlock}`;
  }
  // C2: dedicated renderer for the appointments table (uses appointment_date, treatment_planned, status)
  function renderAppointmentsList(appts) {
    const now = today();
    const toApptDate = a => toDateOnly(a.appointment_date);
    const upcoming = appts.filter(a => toApptDate(a) && toApptDate(a) >= now).sort((a, b) => toApptDate(a) - toApptDate(b));
    const past = appts.filter(a => toApptDate(a) && toApptDate(a) < now).sort((a, b) => toApptDate(b) - toApptDate(a));
    const undated = appts.filter(a => !toApptDate(a));
    const statusBadge = a => {
      const s = (a.status || '').toLowerCase();
      if (s === 'show') return '<b class="visit-status visit-status--green">• Arrived</b>';
      if (s === 'no show') return '<b class="visit-status visit-status--red">• Did Not Arrive</b>';
      if (s.includes('cancel') || s.includes('postpone')) return '<b class="visit-status visit-status--muted">• Cancelled</b>';
      return '<b class="visit-status">• Scheduled</b>';
    };
    const row = a => `<div class="detail-visit-row"><div><strong>${escape(formatDate(a.appointment_date))}</strong><small>${escape(a.appointment_time || 'Time not set')}</small></div><span>${escape(a.treatment_planned || 'Dental Visit')}</span>${statusBadge(a)}</div>`;
    const undatedBlock = undated.length ? `<div class="detail-section-title past-title">Unscheduled <em>${undated.length}</em></div>${undated.map(row).join('')}` : '';
    return `<div class="detail-section-title">Upcoming <em>${upcoming.length}</em></div>${upcoming.length ? upcoming.map(row).join('') : '<div class="detail-no-data">No upcoming appointments</div>'}<div class="detail-section-title past-title">Past <em>${past.length}</em></div>${past.length ? past.map(row).join('') : '<div class="detail-no-data">No past appointments recorded</div>'}${undatedBlock}`;
  }
  function renderTreatmentHistory(treatments) {
    if (!treatments.length) return '<div class="detail-no-data">No treatment history recorded.</div>';
    return `<div class="treatment-timeline">${sortedTreatments(treatments).map(t => `<article><i></i><div><strong>${escape(treatmentName(t))}</strong><time>${escape(formatDate(t.date))}</time><p>${escape(t.notes || 'No notes recorded.')}</p>${t.doctor ? `<small>${escape(t.doctor)}</small>` : ''}</div></article>`).join('')}</div>`;
  }
  // C2: renderDetailBody dispatches to the correct renderer based on the active tab
  function renderDetailBody() {
    const body = $('patient-detail-body'); if (!selected) return;
    if (activeTab === 'appointments') body.innerHTML = renderAppointmentsList(currentAppointments);
    else body.innerHTML = renderTreatmentHistory(currentTreatments);
  }
  async function selectPatient(p) {
    // M2: capture this request's ID — if the user picks another patient before this resolves, we discard
    const myRequestId = ++selectRequestId;
    selected = p; renderList(); $('patient-detail-empty').hidden = true; $('patient-detail-content').hidden = false;
    $('detail-avatar').textContent = initials(p.name); $('detail-avatar').style.background = colorFor(p); $('detail-name').textContent = p.name;
    $('detail-meta').textContent = `${p.age ? `${p.age} years` : 'Patient'} · ${p.gender || 'Gender not recorded'}  ☎ ${p.contact_number || 'No phone'}`;
    $('detail-last-visit').textContent = formatDate(lastVisitFor(p)); $('detail-last-treatment').textContent = 'Loading…'; $('detail-total-visits').textContent = '—'; $('patient-detail-body').innerHTML = '<div class="detail-loading">Loading patient history…</div>';
    const rawBalance = balanceFor(p);
    if (rawBalance === null || rawBalance === '') { $('detail-balance-value').textContent = '—'; $('detail-balance-value').className = ''; $('detail-balance-note').textContent = 'Not recorded'; }
    else if (Number(rawBalance) <= 0) { $('detail-balance-value').textContent = 'Clear'; $('detail-balance-value').className = 'balance-clear'; $('detail-balance-note').textContent = 'No balance due'; }
    else { $('detail-balance-value').textContent = `Rs ${rawBalance}`; $('detail-balance-value').className = 'balance-due'; $('detail-balance-note').textContent = 'Outstanding'; }
    try {
      // C1+C2: fetch treatments (by patient_id) and appointments in parallel
      const [treatments, appts] = await Promise.all([
        API.getPatientTreatments(p.id),
        API.getPatientAppointments(p.id),
      ]);
      // M2: if a newer selectPatient() was called while we were awaiting, discard this stale response
      if (myRequestId !== selectRequestId) return;
      currentTreatments = treatments;
      currentAppointments = appts;
      const latestPast = latestPastTreatment(treatments);
      $('detail-total-visits').textContent = treatments.length;
      $('detail-last-visit').textContent = latestPast ? formatDate(latestPast.date) : 'No visits yet';
      $('detail-last-treatment').textContent = latestPast ? treatmentName(latestPast) : 'No visit recorded';
      p._lastTreatment = latestPast;
      renderList(); renderDetailBody(); openMobileProfile(p, treatments);
    } catch (e) { $('detail-last-treatment').textContent = 'Not available'; $('patient-detail-body').innerHTML = '<div class="detail-no-data">Could not load patient history.</div>'; }
  }
  function openMobileProfile(p, treatments) {
    if (window.matchMedia('(min-width: 900px)').matches) return;
    $('profile-name').textContent = p.name; $('profile-phone').textContent = p.contact_number || 'No Phone'; $('profile-age').textContent = p.age ? `${p.age} yrs` : 'Unknown Age'; $('profile-gender').textContent = p.gender || 'Unknown Gender';
    $('treatment-list').innerHTML = treatments.length ? sortedTreatments(treatments).map(t => `<div class="treatment-item"><div class="treatment-header"><span>${escape(formatDate(t.date))}</span><span>${escape(treatmentName(t))}</span></div><div>${escape(t.notes || 'No notes recorded.')}</div></div>`).join('') : '';
    $('treatments-empty').hidden = treatments.length > 0; modalProfile.hidden = false;
  }
  async function load(query = '') {
    try {
      allPatients = await API.searchPatients(query);
    // C1: key the last-visit map by patient_id, not patient_name
      const latestRows = await API.getLatestTreatmentsForPatients(allPatients.map(patient => patient.id));
      const latestByPatient = new Map();
      sortedTreatments(latestRows).forEach(treatment => {
        if (!latestByPatient.has(treatment.patient_id) && toDateOnly(treatment.date) && toDateOnly(treatment.date) <= today()) latestByPatient.set(treatment.patient_id, treatment);
      });
      allPatients.forEach(patient => { patient._lastTreatment = latestByPatient.get(patient.id) || null; });
      renderList();
    } catch (e) { listEl.innerHTML = '<div class="detail-no-data">Could not load patients.</div>'; }
  }
  function setupAddPatient() {
    const modal = $('modal-add-patient'), form = $('add-patient-form'); let gender = '';
    $('patients-add-btn').addEventListener('click', () => { modal.hidden = false; }); $('patients-mobile-add').addEventListener('click', () => { modal.hidden = false; }); $('close-add-patient').addEventListener('click', () => { modal.hidden = true; }); modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
    document.querySelectorAll('.gender-options button').forEach(btn => btn.addEventListener('click', () => { gender = btn.dataset.gender; document.querySelectorAll('.gender-options button').forEach(x => x.classList.toggle('selected', x === btn)); }));
    form.addEventListener('submit', async e => { e.preventDefault(); const button = form.querySelector('.save-patient-btn'); button.disabled = true; try { await API.createPatient({ name: $('new-patient-name').value.trim(), contact_number: $('new-patient-phone').value.trim(), email: $('new-patient-email').value.trim(), date_of_birth: $('new-patient-dob').value || null, gender }); modal.hidden = true; form.reset(); await load(searchInput.value.trim()); } catch (err) { alert('Could not save patient. Please try again.'); } finally { button.disabled = false; } });
  }
  function init() {
    searchInput.addEventListener('input', () => { $('search-clear').hidden = !searchInput.value; clearTimeout(timer); timer = setTimeout(() => load(searchInput.value.trim()), 250); });
    $('search-clear').addEventListener('click', () => { searchInput.value = ''; $('search-clear').hidden = true; load(); searchInput.focus(); });
    document.querySelectorAll('.patient-filter').forEach(btn => btn.addEventListener('click', () => { activeFilter = btn.dataset.filter; document.querySelectorAll('.patient-filter').forEach(x => x.classList.toggle('active', x === btn)); renderList(); }));
    // C2: tab switch just re-renders from cached data — no extra network call needed
    document.querySelectorAll('[data-detail-tab]').forEach(btn => btn.addEventListener('click', () => { activeTab = btn.dataset.detailTab; document.querySelectorAll('[data-detail-tab]').forEach(x => x.classList.toggle('active', x === btn)); if (selected) renderDetailBody(); }));
    $('patient-detail-close').addEventListener('click', clearSelection);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!modalProfile.hidden) modalProfile.hidden = true;
        else if (!$('modal-add-patient').hidden) $('modal-add-patient').hidden = true;
        else if (selected && window.matchMedia('(min-width: 900px)').matches) clearSelection();
      } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && window.matchMedia('(min-width: 900px)').matches && document.activeElement !== searchInput) {
        e.preventDefault(); moveSelection(e.key === 'ArrowDown' ? 1 : -1);
      }
    });
    modalProfile.addEventListener('click', e => { if (e.target === modalProfile) modalProfile.hidden = true; }); setupAddPatient(); load();
  }
  return { init, reload: () => load(searchInput.value.trim()) };
})();
