/* ═══════════════════════════════════════════════
   today.js — Today's Patients Screen
   Loads appointments for the logged-in doctor,
   renders cards, handles status changes and the
   Add Appointment bottom sheet.
═══════════════════════════════════════════════ */

const TodayView = (() => {
  'use strict';

  // ── State ───────────────────────────────────────
  let appointments = [];
  let doctorData = null;
  let activeCard = null;
  let statusTarget = null;
  let viewTarget = null;
  let doctorDirectory = new Map();
  let activeFilter = 'all';
  let activeDoctorFilter = 'all'; // C5: 'all' | 'mustafa' | 'qasim'

  // ── DOM Refs ────────────────────────────────────
  const listEl = document.getElementById('appt-list');
  const emptyEl = document.getElementById('today-empty');
  const statTotal = document.getElementById('stat-num-total');
  const statShow = document.getElementById('stat-num-show');
  const statPending = document.getElementById('stat-num-pending');
  const statNoShow = document.getElementById('stat-num-noshow');
  const appointmentCount = document.getElementById('appointment-count');
  const filterButtons = document.querySelectorAll('.appointment-filters button');

  // Add Appointment modal
  const modalAdd = document.getElementById('modal-add-appt');
  const formAdd = document.getElementById('form-add-appt');
  const btnFab = document.getElementById('fab-add');
  const btnCloseAdd = document.getElementById('close-add-appt');
  const btnCancelAdd = document.getElementById('cancel-add-appt');
  const addApptDateLabel = document.getElementById('add-appt-date-label');
  const inputName = document.getElementById('appt-patient-name');
  const inputPhone = document.getElementById('appt-phone');
  const inputDate = document.getElementById('appt-date');
  const inputTime = document.getElementById('appt-time');
  const inputTreat = document.getElementById('appt-treatment');
  const servicesList = document.getElementById('services-list');
  const btnSave = document.getElementById('btn-save-appt');
  const docBtns = document.querySelectorAll('.doctor-btn');

  function updateSaveButtonState() {
    if (!btnSave) return;
    const complete = [inputName, inputPhone, inputDate, inputTime, inputTreat]
      .every(input => input && input.value.trim().length > 0);
    btnSave.classList.toggle('is-ready', complete);
    btnSave.setAttribute('aria-disabled', complete ? 'false' : 'true');
  }

  // Status picker modal
  const modalStatus = document.getElementById('modal-status');
  const statusName = document.getElementById('status-sheet-name');
  const statusOpts = document.getElementById('status-options');

  // Appointment details modal
  const modalView = document.getElementById('modal-appt-view');
  const viewName = document.getElementById('view-appt-name');
  const viewSource = document.getElementById('view-appt-source');
  const viewDate = document.getElementById('view-appt-date');
  const viewTime = document.getElementById('view-appt-time');
  const viewStatus = document.getElementById('view-appt-status');
  const viewTreatment = document.getElementById('view-appt-treatment');
  const viewPhone = document.getElementById('view-appt-phone');
  const viewDoctor = document.getElementById('view-appt-doctor');
  const viewBooked = document.getElementById('view-appt-booked');
  const viewNotes = document.getElementById('view-appt-notes');
  const closeViewBtn = document.getElementById('close-appt-view');
  const dismissViewBtn = document.getElementById('dismiss-appt-view');
  const updateViewStatusBtn = document.getElementById('view-update-status');

  // ── Format helpers ──────────────────────────────
  function formatTime(timeStr) {
    if (!timeStr) return { h: '--', ampm: '' };
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return { h: h12 + ':' + String(m).padStart(2, '0'), ampm };
  }

  // C6: treat 'Confirmed' (bot-saved status) same as 'Tentative Appt' (Scheduled)
  function badgeClass(status) {
    if (!status) return 'badge-tentative';
    const s = status.toLowerCase();
    if (s === 'show') return 'badge-show';
    if (s === 'no show') return 'badge-noshow';
    if (s.includes('cancel') || s.includes('postpone')) return 'badge-cancel';
    return 'badge-tentative'; // covers 'Confirmed', 'Tentative Appt', ''
  }

  function badgeLabel(status) {
    if (!status) return 'Scheduled';
    const s = status.toLowerCase();
    if (s === 'show') return 'Arrived';
    if (s === 'no show') return 'Did Not Arrive';
    if (s.includes('cancel') || s.includes('postpone')) return 'Cancelled';
    return 'Scheduled'; // covers 'Confirmed', 'Tentative Appt', ''
  }

  function formatAppointmentDate(dateStr) {
    if (!dateStr) return 'Not recorded';
    const parts = String(dateStr).split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return String(dateStr);
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  function formatBookedAt(value) {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('en-GB', {
      timeZone: 'Asia/Karachi', weekday: 'short', day: 'numeric', month: 'short',
      year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  function requestedDoctor(appt) {
    const doctor = doctorDirectory.get(appt.doctor_id);
    return appt.doctor_name || appt.requested_doctor || doctor?.display_name || doctor?.name || null;
  }

  function bookingSource(appt) {
    const rawSource = String(appt.booked_by || '');
    const source = rawSource.toLowerCase();
    if (source === 'ai_bot' || source === 'whatsapp' || source.includes('whatsapp')) return 'Booked through WhatsApp';
    if (source.startsWith('manual:')) return `Booked manually by ${rawSource.slice(7).trim() || 'a doctor'}`;
    if (source === 'manual') return `Booked manually by ${doctorData?.display_name || doctorData?.name || 'a doctor'}`;
    if (source === 'voice' || source.includes('call')) return 'Booked through phone call';
    return appt.booked_by ? `Booked via ${appt.booked_by}` : 'Booking source not recorded';
  }

  // M1: HTML escape helper — prevents XSS from patient names, notes, phone numbers
  const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ── Render appointment card ─────────────────────
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
    const docName = requestedDoctor(appt);
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
          <div class="appt-time">${escape(t.h)}</div>
          <div class="appt-time-ampm">${escape(t.ampm)}</div>
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
      // If tapped on the status badge, open status picker instead
      if (e.target.closest('.status-badge')) return;
      toggleCard(appt.id);
    });

    // Tap status badge → open status picker
    card.querySelector('button.status-badge').addEventListener('click', e => {
      e.stopPropagation();
      openStatusPicker(appt);
    });

    card.querySelector('.appt-view').addEventListener('click', e => {
      e.stopPropagation();
      openAppointmentView(appt);
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
    if (typeof doctorDirectory !== 'undefined') {
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

  // ── Toggle card expand ──────────────────────────
  function toggleCard(id) {
    activeCard = activeCard === id ? null : id;
    render(); // re-render to open/close detail
  }

  // ── Update stats bar ────────────────────────────
  // C6: count 'Confirmed' in the Scheduled (pending) bucket
  function updateStats() {
    const total = appointments.length;
    const show = appointments.filter(a => a.status === 'Show').length;
    const noshow = appointments.filter(a => a.status === 'No Show').length;
    const pending = appointments.filter(a =>
      !a.status || a.status === 'Tentative Appt' || a.status === 'Confirmed').length;

    statTotal.textContent = total;
    statShow.textContent = show;
    statNoShow.textContent = noshow;
    statPending.textContent = pending;
    if (appointmentCount) appointmentCount.textContent = total;
  }

  // C5: helper — does this appointment match the selected doctor filter?
  function matchesDoctor(appt) {
    if (activeDoctorFilter === 'all') return true;
    // Match by doctor_id UUID (preferred)
    const doc = doctorDirectory.get(appt.doctor_id);
    if (doc) {
      const name = (doc.display_name || doc.name || '').toLowerCase();
      return name.includes(activeDoctorFilter); // 'mustafa' or 'qasim'
    }
    // Fallback: match by doctor_name field or requested_doctor text
    const nameField = (appt.doctor_name || appt.requested_doctor || '').toLowerCase();
    if (nameField) return nameField.includes(activeDoctorFilter);
    // No doctor info — only show in 'all'
    return false;
  }

  // ── Render full list ─────────────────────────────
  function render() {
    listEl.innerHTML = '';

    if (appointments.length === 0) {
      emptyEl.hidden = false;
      updateStats();
      return;
    }

    emptyEl.hidden = true;
    // C5: apply doctor filter first, then status filter
    const visibleAppointments = appointments.filter(appt => {
      if (!matchesDoctor(appt)) return false;
      // C6: 'Confirmed' treated same as 'Tentative Appt' in status filter
      if (activeFilter === 'show') return appt.status === 'Show';
      if (activeFilter === 'pending') return !appt.status || appt.status === 'Tentative Appt' || appt.status === 'Confirmed';
      if (activeFilter === 'no-show') return appt.status === 'No Show';
      return true;
    });
    if (!visibleAppointments.length) {
      listEl.innerHTML = '<div class="filtered-empty">No appointments match this filter.</div>';
      updateStats();
      return;
    }
    visibleAppointments.forEach(appt => {
      listEl.appendChild(renderCard(appt));
    });
    updateStats();
  }

  // C5: doctor filter buttons
  const doctorFilterBtns = document.querySelectorAll('.doctor-filter');
  doctorFilterBtns.forEach(button => {
    button.addEventListener('click', () => {
      activeDoctorFilter = button.dataset.doctor;
      doctorFilterBtns.forEach(btn => btn.classList.toggle('active', btn === button));
      render();
    });
  });

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter || button.textContent.trim().toLowerCase().replace(' ', '-');
      filterButtons.forEach(btn => btn.classList.toggle('active', btn === button));
      render();
    });
  });

  // ── Show skeleton loaders ───────────────────────
  function showSkeletons() {
    listEl.innerHTML = `
      <div class="appt-skeleton"></div>
      <div class="appt-skeleton"></div>
      <div class="appt-skeleton"></div>
    `;
    emptyEl.hidden = true;
  }

  // ── Load today's appointments from Supabase ─────
  async function load() {
    showSkeletons();
    try {
      const [rows, doctors] = await Promise.all([
        API.getAllTodayAppointments(),
        API.getDoctors().catch(() => []),
      ]);
      appointments = rows;
      doctorDirectory = new Map((doctors || []).map(d => [d.id, d]));
      
      // M5: Store doctor UUID on the button elements directly for robust form submission
      (doctors || []).forEach(doc => {
        const nameStr = (doc.display_name || doc.name || '').toLowerCase();
        const btnMustafa = document.getElementById('doc-btn-mustafa');
        const btnQasim = document.getElementById('doc-btn-qasim');
        if (nameStr.includes('mustafa') && btnMustafa) btnMustafa.dataset.doctorId = doc.id;
        if (nameStr.includes('qasim') && btnQasim) btnQasim.dataset.doctorId = doc.id;
      });
      
      render();
    } catch (err) {
      console.error('[TODAY] Load error:', err);
      listEl.innerHTML = `<p style="padding:1rem;color:#EF4444;text-align:center;">
        Could not load appointments. Check your connection.</p>`;
    }
  }

  // ── Status Picker ───────────────────────────────
  function openAppointmentView(appt) {
    viewTarget = appt;
    viewName.textContent = appt.patient_name || 'Patient';
    viewSource.textContent = bookingSource(appt);
    viewDate.textContent = formatAppointmentDate(appt.appointment_date);
    const time = formatTime(appt.appointment_time);
    viewTime.textContent = time.ampm ? `${time.h} ${time.ampm}` : 'Not recorded';
    viewStatus.textContent = badgeLabel(appt.status);
    viewTreatment.textContent = appt.treatment_planned || 'No treatment specified';
    viewPhone.textContent = appt.contact_number || 'No phone number';
    
    const docName = requestedDoctor(appt);
    if (docName && docName !== 'Not recorded') {
      viewDoctor.textContent = docName;
      viewDoctor.parentElement.hidden = false;
    } else {
      viewDoctor.parentElement.hidden = true;
    }

    viewBooked.textContent = formatBookedAt(appt.created_at);
    if (appt.notes) {
      viewNotes.hidden = false;
      viewNotes.textContent = `Notes: ${appt.notes}`;
    } else {
      viewNotes.hidden = true;
      viewNotes.textContent = '';
    }
    modalView.hidden = false;
  }

  function closeAppointmentView() {
    modalView.hidden = true;
    viewTarget = null;
  }

  function openStatusPicker(appt) {
    statusTarget = appt;
    statusName.textContent = appt.patient_name;
    modalStatus.hidden = false;
  }

  function closeStatusPicker() {
    modalStatus.hidden = true;
    statusTarget = null;
  }

  statusOpts.addEventListener('click', async e => {
    const btn = e.target.closest('.status-opt');
    if (!btn || !statusTarget) return;

    const newStatus = btn.dataset.status;
    const id = statusTarget.id;

    closeStatusPicker();

    // Optimistic UI — update immediately without waiting for server
    const appt = appointments.find(a => a.id === id);
    if (appt) {
      appt.status = newStatus;
      render(); // instant visual update
    }

    // Save to Supabase in background
    try {
      await API.updateAppointmentStatus(id, newStatus);
      if (typeof ScheduleView !== 'undefined' && document.getElementById('view-schedule').classList.contains('active-view')) {
        ScheduleView.reload();
      }
    } catch (err) {
      console.error('[TODAY] Status update failed:', err);
      // Revert on failure
      await load();
    }
  });

  // Close status modal on backdrop tap
  modalStatus.addEventListener('click', e => {
    if (e.target === modalStatus) closeStatusPicker();
  });

  closeViewBtn.addEventListener('click', closeAppointmentView);
  dismissViewBtn.addEventListener('click', closeAppointmentView);
  modalView.addEventListener('click', e => {
    if (e.target === modalView) closeAppointmentView();
  });
  updateViewStatusBtn.addEventListener('click', () => {
    if (!viewTarget) return;
    const target = viewTarget;
    closeAppointmentView();
    openStatusPicker(target);
  });

  // ── Add Appointment ─────────────────────────────
  function openAddModal() {
    // Pre-fill today's date
    const now = new Date();
    inputDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    inputName.value = '';
    inputPhone.value = '';
    inputTime.value = '';
    inputTreat.value = '';
    if (addApptDateLabel) {
      addApptDateLabel.textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    modalAdd.hidden = false;

    // Pre-select the logged-in doctor
    if (doctorData) {
      const isDrMustafa = doctorData.name.toLowerCase().includes('mustafa');
      document.getElementById('doc-btn-mustafa').classList.toggle('active', isDrMustafa);
      document.getElementById('doc-btn-qasim').classList.toggle('active', !isDrMustafa);
    }

    setTimeout(() => inputName.focus(), 300);
  }

  function closeAddModal() {
    modalAdd.hidden = true;
    formAdd.reset();
    updateSaveButtonState();
  }

  btnFab.addEventListener('click', openAddModal);
  if (btnCloseAdd) btnCloseAdd.addEventListener('click', closeAddModal);
  if (btnCancelAdd) btnCancelAdd.addEventListener('click', closeAddModal);
  modalAdd.addEventListener('click', e => {
    if (e.target === modalAdd) closeAddModal();
  });
  [inputName, inputPhone, inputDate, inputTime, inputTreat].forEach(input => {
    input.addEventListener('input', updateSaveButtonState);
    input.addEventListener('change', updateSaveButtonState);
  });
  updateSaveButtonState();

  // Doctor toggle buttons
  docBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      docBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Form submit — save appointment
  formAdd.addEventListener('submit', async e => {
    e.preventDefault();

    const name = inputName.value.trim();
    if (!name) { inputName.focus(); return; }
    
    const timeVal = inputTime.value || null;
    const dateVal = inputDate.value;

    if (timeVal && dateVal) {
      btnSave.disabled = true;
      btnSave.textContent = 'Checking availability...';
      const isAvailable = await API.checkSlotAvailability(dateVal, timeVal);
      if (!isAvailable) {
        alert("This time slot is already booked. Please choose another time.");
        btnSave.disabled = false;
        btnSave.textContent = 'Add Appointment';
        return;
      }
    }

    btnSave.disabled = true;
    btnSave.textContent = 'Saving...';

    try {
      const activeDoc = document.querySelector('.doctor-btn.active');
      const docName = activeDoc ? activeDoc.textContent.trim() : null;

      const data = {
        patient_name: name,
        contact_number: inputPhone.value.trim() || null,
        appointment_date: dateVal,
        appointment_time: timeVal,
        treatment_planned: inputTreat.value.trim() || null,
        status: 'Tentative Appt',
        booked_by: 'manual',
      };

      // M5: Read doctor_id directly from the button's dataset
      if (activeDoc && activeDoc.dataset.doctorId) {
        data.doctor_id = activeDoc.dataset.doctorId;
      } else {
        // Fallback if dataset wasn't set (e.g. Supabase doctors fetch failed on load)
        const doctors = await API.getDoctors().catch(()=>[]);
        const doc = doctors.find(d => d.name === docName || d.display_name === docName);
        if (doc) data.doctor_id = doc.id;
      }

      const matchedDoc = data.doctor_id ? doctorDirectory.get(data.doctor_id) : null;
      const actualDocName = matchedDoc ? (matchedDoc.display_name || matchedDoc.name) : docName;

      // Store the actual doctor name so bookingSource() correctly attributes the appointment
      data.booked_by = `manual:${actualDocName || doctorData?.display_name || doctorData?.name || 'Doctor'}`;

      await API.createAppointment(data);
      closeAddModal();
      await load(); // refresh list

    } catch (err) {
      console.error('[TODAY] Save appointment failed:', err);
      btnSave.textContent = 'Could not save — Try again';
      btnSave.classList.remove('is-ready');
    } finally {
      btnSave.disabled = false;
      if (btnSave.textContent === 'Saving...' || btnSave.textContent === 'Could not save — Try again') {
        btnSave.textContent = 'Add Appointment';
      }
      updateSaveButtonState();
    }
  });

  // ── Delete appointment ──────────────────────────
  async function deleteAppt(id) {
    const confirmed = await window.cmdConfirm('Delete Appointment?', 'Are you sure you want to delete this appointment? This action cannot be undone.', 'Delete', '#e53935');
    if (!confirmed) return;
    appointments = appointments.filter(a => a.id !== id);
    render();
    try {
      await API.deleteAppointment(id);
    } catch (err) {
      console.error('[TODAY] Delete failed:', err);
      await load();
    }
  }

  // M1: event delegation for delete button (replaces removed inline onclick)
  listEl.addEventListener('click', e => {
    const delBtn = e.target.closest('[data-delete-appt]');
    if (delBtn) deleteAppt(delBtn.dataset.deleteAppt);

    const viewBtn = e.target.closest('[data-view-appt]');
    if (viewBtn) {
      const apptId = viewBtn.dataset.viewAppt;
      const appt = appointments.find(a => String(a.id) === String(apptId));
      if (appt) openAppointmentView(appt);
    }
  });

  // ── Load services for autocomplete ─────────────
  async function loadServices() {
    const fallbackServices = ['Dental Cleaning & Scaling', 'Root Canal Treatment', 'Teeth Whitening', 'Dental Crown Fitting', 'Orthodontic Consultation', 'Tooth Extraction', 'Composite Filling', 'Implant Consultation', 'Checkup'];
    try {
      const services = await API.getServices();
      [...services.map(s => s.service_name), ...fallbackServices].forEach(serviceName => {
        const opt = document.createElement('option');
        opt.value = serviceName;
        servicesList.appendChild(opt);
      });
    } catch (e) {
      fallbackServices.forEach(serviceName => {
        const opt = document.createElement('option');
        opt.value = serviceName;
        servicesList.appendChild(opt);
      });
    }
  }

  // ── "This Week" shortcut button ─────────────────
  const viewWeekBtn = document.getElementById('view-week-btn');
  if (viewWeekBtn) {
    viewWeekBtn.addEventListener('click', () => Router.switchView('schedule'));
  }

  // ── Listen for view switch ──────────────────────
  window.addEventListener('viewchange', e => {
    if (e.detail.view === 'today') load();
  });

  // ── Public API ──────────────────────────────────
  return {
    init(doctor) {
      doctorData = doctor;
      loadServices();
      load();
    },
    reload: load,
    deleteAppt,
    openAppointmentView,
    openStatusPicker,
    get doctorDirectory() { return doctorDirectory; }
  };

})();
