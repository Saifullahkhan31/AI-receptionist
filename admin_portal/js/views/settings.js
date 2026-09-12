/* ═══════════════════════════════════════════════
   settings.js — Settings workspace
   Vanilla implementation of the supplied desktop and mobile Figma screens.
═══════════════════════════════════════════════ */

const SettingsView = (() => {
  'use strict';

  const root = document.getElementById('settings-root');
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const SERVICE_COLORS = ['#1A73E8', '#34A853', '#FBBC04', '#EA4335', '#9C27B0', '#FF5722', '#00BCD4', '#607D8B'];
  const groups = [
    { label: 'Account', items: [['profile', 'Profile', 'person'], ['security', 'Security', 'lock'], ['notifications', 'Notifications', 'bell']] },
    { label: 'Clinic', items: [['clinic-info', 'Clinic Information', 'building'], ['working-hours', 'Working Hours', 'clock'], ['services', 'Services & Treatments', 'tooth'], ['staff', 'Staff Members', 'people']] },
    { label: 'System', items: [['integrations', 'Integrations', 'plug'], ['billing', 'Billing & Subscription', 'card'], ['privacy', 'Data & Privacy', 'shield']] },
  ];

  const state = {
    active: 'profile',
    mobileOpen: false,
    doctor: null,
    twoFA: true,
    notifs: { reminders: true, bookings: true, cancellations: true, labResults: false, push: true, sms: false },
    privacy: { analytics: true, dataSharing: false },
    hours: [
      ['09:00', '17:00', true, '13:00', '14:00', true], ['09:00', '17:00', true, '13:00', '14:00', true],
      ['09:00', '17:00', true, '13:00', '14:00', true], ['09:00', '17:00', true, '13:00', '14:00', true],
      ['09:00', '17:00', true, '13:00', '14:00', false], ['09:00', '14:00', true, '13:00', '14:00', false],
      ['09:00', '17:00', false, '13:00', '14:00', false],
    ],
    // Default services and fees mirror the clinic's existing MISC fee sheet (PKR).
    services: [
      ['Dental Cleaning & Scaling', '45', 4000, '#1A73E8', true], ['Root Canal Treatment', '90', 8000, '#EA4335', true],
      ['Teeth Whitening', '60', 25000, '#FBBC04', true], ['Dental Crown Fitting', '90', 8000, '#9C27B0', true],
      ['Orthodontic Consultation', '30', 500, '#34A853', true], ['Composite Filling', '45', 3000, '#FF5722', true],
      ['Tooth Extraction', '30', 1500, '#00BCD4', true], ['Implant Consultation', '30', 500, '#607D8B', false],
    ],
    staff: [
      ['Dr. Mustafa Al-Rahman', 'Lead Dentist', 'MA', '#673AB7', true], ['Dr. Layla Hassan', 'Orthodontist', 'LH', '#FF7B7B', true],
      ['Dr. Omar Khalid', 'Periodontist', 'OK', '#34A853', true], ['Sara Al-Mansoori', 'Head Nurse', 'SA', '#607D8B', true],
      ['Fatima Al-Jabri', 'Receptionist', 'FA', '#5AC8FA', true], ['Mohammed Rizwan', 'Lab Technician', 'MR', '#7B68EE', false],
    ],
    integrations: [['gcal', 'Google Calendar', 'Sync appointments automatically with Google Calendar', true], ['whatsapp', 'WhatsApp Business', 'Send appointment reminders and updates via WhatsApp', false], ['twilio', 'Twilio SMS', 'Send SMS alerts and appointment reminders to patients', true]],
    modal: null,
  };

  function safe(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function icon(name, size = 18) {
    const common = `width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" aria-hidden="true"`;
    const paths = {
      person: `<circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
      lock: `<rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="13.5" r="1.25" fill="currentColor"/>`,
      bell: `<path d="M10 2.5a6 6 0 0 1 6 6v3l1.5 2.5h-15L4 11.5v-3a6 6 0 0 1 6-6Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 15.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.5"/>`,
      building: `<rect x="2" y="3.5" width="16" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 7.5h16M7 16v-5h6v5" stroke="currentColor" stroke-width="1.5"/><path d="M4.5 9.5h2.5v2.5H4.5zM13 9.5h2.5v2.5H13z" fill="currentColor"/>`,
      clock: `<circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
      tooth: `<path d="M6.5 3C5 3 3 4.5 3 7c0 2 .5 4 1 5.5C4.5 14 5 17 6 17s1-2 2-2 1 2 2 2 1.5-3 2-4.5c.5-1.5 1-3.5 1-5.5 0-2.5-2-4-3.5-4C8.5 3 7.5 4 7.5 4S7 3 6.5 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
      people: `<circle cx="7.5" cy="7" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M2 17c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="14" cy="7" r="2" stroke="currentColor" stroke-width="1.4"/><path d="M16.5 17c0-2.2-1.1-4.1-2.8-5.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
      plug: `<path d="M7 2v4M13 2v4M4 6h12v3a6 6 0 0 1-12 0V6ZM10 15v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
      card: `<rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 9h16" stroke="currentColor" stroke-width="1.5"/><rect x="4" y="12" width="4" height="2" rx="1" fill="currentColor"/>`,
      shield: `<path d="M10 2.5l7 3v4.5c0 3.5-2.8 6.5-7 8-4.2-1.5-7-4.5-7-8V5.5l7-3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="m7.5 10.5 2 2 3-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
      plus: `<path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
      edit: `<path d="m11.5 2.5 2 2L5 13H3v-2l8.5-8.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>`,
      trash: `<path d="M2.5 4h11M5.5 4V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1M6 7v5M10 7v5M3.5 4l.5 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l.5-9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
      camera: `<rect x="2" y="6" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="11.5" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M7 6l1.5-2h3L13 6" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>`,
      download: `<path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
      eye: `<ellipse cx="10" cy="10" rx="7" ry="4.5" stroke="currentColor" stroke-width="1.3"/><circle cx="10" cy="10" r="1.7" fill="currentColor"/>`,
      eyeoff: `<path d="m3 3 14 14M5.8 5.8A8.2 8.2 0 0 0 3 10c1.4 2.3 3.8 4 7 4 1 0 2-.2 2.8-.5M14.2 7.1A8.2 8.2 0 0 1 17 10c-1.4 2.3-3.8 4-7 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`,
      arrow: `<path d="m11 4-6 6 6 6M5 10h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
      chevron: `<path d="m7 5 5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
      close: `<path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
      check: `<path d="m3 8 3.5 3.5 6.5-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    };
    return `<svg ${common}>${paths[name] || ''}</svg>`;
  }

  function toggle(key, checked, label = '') {
    return `<button class="settings-toggle ${checked ? 'is-on' : ''}" data-toggle-key="${key}" role="switch" aria-checked="${checked}" aria-label="${safe(label || key)}"><span></span></button>`;
  }

  function input(label, id, value = '', type = 'text', placeholder = '') {
    return `<label class="settings-field"><span>${safe(label)}</span><div class="settings-input-wrap"><input id="${id}" type="${type}" value="${safe(value)}" placeholder="${safe(placeholder)}"></div></label>`;
  }

  function passwordInput(label, id, placeholder) {
    return `<label class="settings-field"><span>${label}</span><div class="settings-input-wrap"><input id="${id}" type="password" placeholder="${placeholder}"><button class="settings-eye" data-eye-for="${id}" aria-label="Show password">${icon('eye', 16)}</button></div></label>`;
  }

  function sectionHeader(title, subtitle) {
    return `<div class="settings-section-header"><h2>${title}</h2><p>${subtitle}</p><hr></div>`;
  }

  function saveBar(label = 'Save Changes') {
    return `<div class="settings-savebar"><button class="settings-discard">Discard</button><button class="settings-save">${label}</button></div>`;
  }

  function renderProfile() {
    return `<div class="settings-section">${sectionHeader('Profile', 'Update your personal information')}
      <div class="settings-profile-photo"><div class="settings-large-avatar"><span>MA</span><div>${icon('camera', 22)}<small>Edit Photo</small></div></div><div><strong>Profile Photo</strong><p>JPG, PNG or GIF — max 2 MB</p><button class="settings-outline-btn">Upload Photo</button></div></div>
      <div class="settings-form-grid">${input('First Name', 'set-first', 'Mustafa')}${input('Last Name', 'set-last', 'Wasim')}${input('Email', 'set-email', 'mustafa@cmdclinic.pk', 'email')}${input('Phone', 'set-phone', '+92 320 2042302')}${input('Specialty', 'set-specialty', 'General Dentistry')}${input('License Number', 'set-license', '', 'text', 'e.g. PMDC-123456')}</div>${saveBar()}</div>`;
  }

  function renderSecurity() {
    return `<div class="settings-section">${sectionHeader('Change Password', 'Choose a strong password to keep your account secure')}
      <div class="settings-stack">${passwordInput('Current Password', 'set-current-pw', 'Enter current password')}${passwordInput('New Password', 'set-new-pw', 'Enter new password')}${passwordInput('Confirm New Password', 'set-confirm-pw', 'Confirm new password')}</div>
      <div class="settings-inline-end"><button class="settings-primary-btn">Update Password</button></div>
      <hr class="settings-divider"><div class="settings-section-header"><h2>Two-Factor Authentication</h2><p>Add an extra layer of security to your account</p><hr></div>
      <div class="settings-security-card"><div><strong>Authenticator App</strong><p>Generate one-time codes with an authenticator app</p></div><div class="settings-status-group"><span class="settings-status ${state.twoFA ? 'is-good' : ''}"><i></i>${state.twoFA ? 'Enabled' : 'Disabled'}</span>${toggle('twoFA', state.twoFA, 'Two-factor authentication')}</div></div></div>`;
  }

  const notificationRows = [
    ['reminders', 'Appointment Reminders', 'Receive a reminder 24 hours before each appointment'],
    ['bookings', 'New Bookings', 'Get notified when a new appointment is scheduled'],
    ['cancellations', 'Cancellations & Reschedules', 'Alerts when an appointment is cancelled or rescheduled'],
    ['labResults', 'Lab Results', 'Receive lab results directly to your email'],
  ];

  function renderNotificationGroup(title, rows) {
    return `<div class="settings-notification-group"><p class="settings-eyebrow">${title}</p>${rows.map((row, i) => `<div class="settings-notification-row ${i === rows.length - 1 ? 'last' : ''}"><div><strong>${row[1]}</strong><p>${row[2]}</p></div>${toggle(`notif-${row[0]}`, state.notifs[row[0]], row[1])}</div>`).join('')}</div>`;
  }

  function renderNotifications() {
    return `<div class="settings-section">${sectionHeader('Notifications', 'Control how and when you receive updates')}${renderNotificationGroup('Email', notificationRows)}${renderNotificationGroup('Other Channels', [['push', 'Push Notifications', 'Browser push notifications for urgent updates'], ['sms', 'SMS Alerts', 'Text message alerts for appointment reminders']])}<div class="settings-inline-end"><button class="settings-primary-btn">Save Preferences</button></div></div>`;
  }

  function renderClinicInfo() {
    return `<div class="settings-section">${sectionHeader('Clinic Information', "Your clinic's public-facing details")}
      <div class="settings-stack settings-clinic-form">${input('Clinic Name', 'set-clinic-name', 'CMD — Centre of Modern Dentistry')}${input('Street Address', 'set-street', 'Grey Skyline, Block 13, Jauhar Chowrangi Road, Gulistan-e-Johar, near Hussaini Blood Bank')}<div class="settings-form-grid">${input('City', 'set-city', 'Karachi')}${input('Country', 'set-country', 'Pakistan')}${input('Phone', 'set-clinic-phone', '+92 320 2042302')}${input('Email', 'set-clinic-email', 'info@cmdclinic.pk')}</div>${input('Website', 'set-website', 'www.cmdclinic.pk')}</div>
      <div class="settings-logo-upload"><label>Clinic Logo</label><div class="settings-dropzone"><strong>Upload Logo</strong><span>PNG, SVG — max 1 MB</span></div></div>${saveBar()}</div>`;
  }

  function renderWorkingHours() {
    return `<div class="settings-section">${sectionHeader('Working Hours', 'Set your clinic opening hours and break times')}
      <div class="settings-table-scroll"><table class="settings-hours-table"><thead><tr><th>Day</th><th>Open</th><th>From</th><th>To</th><th>Break</th><th>Break From</th><th>Break To</th></tr></thead><tbody>${DAYS.map((day, i) => { const h = state.hours[i]; const closed = !h[2]; return `<tr class="${closed ? 'is-closed' : ''}"><td>${day}</td><td>${toggle(`hours-open-${i}`, h[2], `${day} open`)}</td><td><input type="time" data-hours="${i}-0" value="${h[0]}" ${closed ? 'disabled' : ''}></td><td><input type="time" data-hours="${i}-1" value="${h[1]}" ${closed ? 'disabled' : ''}></td><td><input type="checkbox" data-hours-break="${i}" ${h[5] ? 'checked' : ''} ${closed ? 'disabled' : ''}></td><td><input type="time" data-hours="${i}-3" value="${h[3]}" ${closed || !h[5] ? 'disabled' : ''}></td><td><input type="time" data-hours="${i}-4" value="${h[4]}" ${closed || !h[5] ? 'disabled' : ''}></td></tr>`; }).join('')}</tbody></table></div>
      <div class="settings-hours-actions"><button class="settings-outline-btn" data-hours-apply>Apply Monday to all weekdays</button><button class="settings-primary-btn">Save Hours</button></div></div>`;
  }

  function renderServices() {
    return `<div class="settings-section"><div class="settings-section-title-row"><div><h2>Services & Treatments</h2><p>Manage the treatments your clinic offers</p></div><button class="settings-primary-btn" data-add-service>${icon('plus', 16)} Add Service</button></div><hr class="settings-title-rule">
      <div class="settings-table-scroll"><table class="settings-data-table"><thead><tr><th>Service</th><th>Duration</th><th>Price (PKR)</th><th>Active</th><th></th></tr></thead><tbody>${state.services.map((s, i) => `<tr class="${s[4] ? '' : 'is-inactive'}"><td><span class="service-color" style="background:${s[3]}"></span><strong>${safe(s[0])}</strong></td><td>${s[1]} min</td><td><strong>PKR ${Number(s[2]).toLocaleString('en-PK')}</strong></td><td>${toggle(`service-${i}`, s[4], `${s[0]} active`)}</td><td><div class="settings-row-actions"><button class="settings-icon-btn" data-edit-service="${i}" aria-label="Edit">${icon('edit', 14)}</button><button class="settings-icon-btn is-danger" data-delete-service="${i}" aria-label="Delete">${icon('trash', 14)}</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
  }

  function renderStaff() {
    return `<div class="settings-section"><div class="settings-section-title-row"><div><h2>Staff Members</h2><p>${state.staff.length} members in your clinic</p></div><button class="settings-primary-btn">${icon('plus', 16)} Invite Staff</button></div><hr class="settings-title-rule"><div class="settings-staff-grid">${state.staff.map(s => `<div class="settings-staff-card ${s[4] ? '' : 'is-inactive'}"><div class="settings-staff-top"><span class="settings-staff-avatar" style="background:${s[3]}">${s[2]}</span><span class="settings-status ${s[4] ? 'is-good' : ''}"><i></i>${s[4] ? 'Active' : 'Inactive'}</span></div><strong>${s[0]}</strong><p>${s[1]}</p><div class="settings-staff-actions"><button class="settings-outline-btn">Edit</button><button class="settings-outline-btn is-danger">Remove</button></div></div>`).join('')}</div></div>`;
  }

  function integrationLogo(id) {
    if (id === 'gcal') return `<span class="settings-integration-logo google">G</span>`;
    if (id === 'whatsapp') return `<span class="settings-integration-logo whatsapp">${icon('people', 24)}</span>`;
    return `<span class="settings-integration-logo twilio">●</span>`;
  }

  function renderIntegrations() {
    return `<div class="settings-section">${sectionHeader('Integrations', 'Connect external services to enhance your clinic workflow')}<div class="settings-integration-list">${state.integrations.map((s, i) => `<div class="settings-integration-card"><div>${integrationLogo(s[0])}</div><div class="settings-integration-copy"><strong>${s[1]}</strong><p>${s[2]}</p></div><div class="settings-integration-actions"><span class="settings-status ${s[3] ? 'is-good' : ''}"><i></i>${s[3] ? 'Connected' : 'Not Connected'}</span>${s[3] ? `<button class="settings-outline-btn is-danger" data-disconnect="${i}">Disconnect</button>` : `<button class="settings-primary-btn" data-connect="${i}">Connect</button>`}</div></div>`).join('')}</div></div>`;
  }

  function renderBilling() {
    const invoices = ['Aug 2026', 'Jul 2026', 'Jun 2026', 'May 2026', 'Apr 2026'];
    return `<div class="settings-section">${sectionHeader('Billing & Subscription', 'Manage your plan, payment method, and invoices')}<div class="settings-plan-card"><span>PRO PLAN</span><div><div><strong>PKR 4,999<small>/mo</small></strong><p>Billed monthly — renews 1 October 2026</p></div><button>Upgrade Plan</button></div></div><div class="settings-billing-block"><h3>Payment Method</h3><div class="settings-payment-card"><div class="settings-mastercard"><b></b><b></b></div><div><strong>Mastercard ending in 4821</strong><p>Expires 09/2028</p></div><button>Change Card</button></div></div><div class="settings-billing-block"><h3>Invoice History</h3><table class="settings-data-table"><thead><tr><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>${invoices.map(d => `<tr><td><strong>${d}</strong></td><td>PKR 4,999</td><td><span class="settings-status is-good"><i></i>Paid</span></td><td><button class="settings-icon-btn">${icon('download', 14)}</button></td></tr>`).join('')}</tbody></table></div></div>`;
  }

  function renderPrivacy() {
    return `<div class="settings-section">${sectionHeader('Data & Privacy', 'Control your data preferences and account settings')}<p class="settings-eyebrow">Privacy Settings</p><div class="settings-privacy-rows"><div><div><strong>Usage Analytics</strong><p>Help improve CMD by sharing anonymous usage data</p></div>${toggle('privacy-analytics', state.privacy.analytics, 'Usage Analytics')}</div><div><div><strong>Third-Party Data Sharing</strong><p>Allow sharing anonymized data with research partners</p></div>${toggle('privacy-sharing', state.privacy.dataSharing, 'Third-Party Data Sharing')}</div></div><p class="settings-eyebrow">Data Export</p><div class="settings-export-card"><div><strong>Download Your Data</strong><p>Export all clinic data as a JSON or CSV archive</p></div><button class="settings-outline-btn">${icon('download', 14)} Export Data</button></div><p class="settings-eyebrow danger">Danger Zone</p><div class="settings-danger-card"><div><strong>Delete Account</strong><p>Permanently delete your clinic account and all data. This cannot be undone.</p></div><button class="settings-danger-btn" data-delete-account>Delete Account</button></div></div>`;
  }

  function renderSection(section) {
    return ({ profile: renderProfile, security: renderSecurity, notifications: renderNotifications, 'clinic-info': renderClinicInfo, 'working-hours': renderWorkingHours, services: renderServices, staff: renderStaff, integrations: renderIntegrations, billing: renderBilling, privacy: renderPrivacy }[section] || renderProfile)();
  }

  function renderNavItem(item, mobile = false) {
    const [id, label, glyph] = item;
    if (mobile && id === 'profile') return `<button class="settings-mobile-row settings-mobile-profile" data-settings-nav="${id}"><span class="settings-mobile-avatar">MA</span><span><strong>Dr. Mustafa</strong><small>General Dentist</small></span>${icon('chevron', 18)}</button>`;
    return `<button class="${mobile ? 'settings-mobile-row' : 'settings-nav-item'} ${state.active === id ? 'is-active' : ''}" data-settings-nav="${id}"><span class="settings-nav-icon">${icon(glyph, mobile ? 18 : 18)}</span><span>${label}</span>${icon('chevron', 16)}</button>`;
  }

  function renderMobileMain() {
    return `<div class="settings-mobile-main"><div class="settings-mobile-heading"><h1>Settings</h1></div>${groups.map(group => `<div class="settings-mobile-group"><p>${group.label}</p><div>${group.items.map(item => renderNavItem(item, true)).join('')}</div></div>`).join('')}<button class="settings-mobile-logout" data-settings-logout>↪ &nbsp; Log Out</button><p class="settings-version">Version 1.0.0</p></div>`;
  }

  function renderModal() {
    if (!state.modal) return '';
    if (state.modal.type === 'confirm') return `<div class="settings-modal-overlay" data-modal-backdrop><div class="settings-dialog"><div class="settings-dialog-header"><h3>${state.modal.title}</h3><button data-close-modal>${icon('close', 16)}</button></div><div class="settings-dialog-body"><p>${state.modal.message}</p><div class="settings-dialog-actions"><button class="settings-discard" data-close-modal>Cancel</button><button class="settings-danger-btn" data-confirm-modal>${state.modal.confirm}</button></div></div></div></div>`;
    const service = state.modal.index == null ? null : state.services[state.modal.index];
    return `<div class="settings-modal-overlay" data-modal-backdrop><div class="settings-dialog"><div class="settings-dialog-header"><h3>${service ? 'Edit Service' : 'Add Service'}</h3><button data-close-modal>${icon('close', 16)}</button></div><div class="settings-dialog-body"><div class="settings-stack">${input('Service Name', 'modal-service-name', service ? service[0] : '', 'text', 'e.g. Dental Cleaning')}${input('Duration', 'modal-service-duration', service ? service[1] : '45', 'number')}${input('Price (PKR)', 'modal-service-price', service ? service[2] : '', 'number', '0')}<div class="settings-color-pick"><label>Calendar Color</label><div>${SERVICE_COLORS.map(c => `<button type="button" class="${(service ? service[3] : SERVICE_COLORS[0]) === c ? 'selected' : ''}" data-color="${c}" style="background:${c}">${(service ? service[3] : SERVICE_COLORS[0]) === c ? icon('check', 13) : ''}</button>`).join('')}</div></div></div><div class="settings-dialog-actions"><button class="settings-discard" data-close-modal>Cancel</button><button class="settings-primary-btn" data-save-service>${service ? 'Save Changes' : 'Add Service'}</button></div></div></div></div>`;
  }

  function render() {
    if (!root) return;
    root.innerHTML = `<div class="settings-layout"><aside class="settings-sidebar">${groups.map((group, gi) => `${gi ? '<hr>' : ''}<p class="settings-group-label">${group.label}</p>${group.items.map(item => renderNavItem(item)).join('')}`).join('')}</aside><section class="settings-content">${renderSection(state.active)}</section></div>${renderMobileMain()}${state.mobileOpen ? `<div class="settings-mobile-pushed is-visible"><header><button class="settings-mobile-back" data-settings-back>${icon('arrow', 18)}</button><strong>${groups.flatMap(g => g.items).find(i => i[0] === state.active)?.[1] || 'Settings'}</strong></header><div class="settings-mobile-content">${renderSection(state.active)}</div></div>` : ''}${renderModal()}<div class="settings-toast" id="settings-toast"></div>`;
  }

  function toast(message) {
    const el = document.getElementById('settings-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('is-visible'), 2200);
  }

  function setActive(section) {
    state.active = section;
    state.mobileOpen = true;
    render();
  }

  function handleClick(e) {
    const nav = e.target.closest('[data-settings-nav]');
    if (nav) { setActive(nav.dataset.settingsNav); return; }
    if (e.target.closest('[data-settings-back]')) { state.active = 'profile'; state.mobileOpen = false; render(); return; }
    const toggleBtn = e.target.closest('[data-toggle-key]');
    if (toggleBtn) {
      const key = toggleBtn.dataset.toggleKey;
      if (key === 'twoFA') state.twoFA = !state.twoFA;
      else if (key.startsWith('notif-')) state.notifs[key.slice(6)] = !state.notifs[key.slice(6)];
      else if (key === 'privacy-analytics') state.privacy.analytics = !state.privacy.analytics;
      else if (key === 'privacy-sharing') state.privacy.dataSharing = !state.privacy.dataSharing;
      else if (key.startsWith('service-')) state.services[Number(key.slice(8))][4] = !state.services[Number(key.slice(8))][4];
      else if (key.startsWith('hours-open-')) state.hours[Number(key.slice(11))][2] = !state.hours[Number(key.slice(11))][2];
      render(); return;
    }
    const eye = e.target.closest('[data-eye-for]');
    if (eye) { const field = document.getElementById(eye.dataset.eyeFor); if (field) { field.type = field.type === 'password' ? 'text' : 'password'; eye.innerHTML = icon(field.type === 'password' ? 'eye' : 'eyeoff', 16); } return; }
    if (e.target.closest('[data-add-service]')) { state.modal = { type: 'service', index: null }; render(); return; }
    const edit = e.target.closest('[data-edit-service]');
    if (edit) { state.modal = { type: 'service', index: Number(edit.dataset.editService) }; render(); return; }
    const del = e.target.closest('[data-delete-service]');
    if (del) { const service = state.services[Number(del.dataset.deleteService)]; state.modal = { type: 'confirm', title: 'Delete Service', message: `Are you sure you want to delete "${safe(service[0])}"? This action cannot be undone.`, confirm: 'Delete Service', action: 'delete-service', index: Number(del.dataset.deleteService) }; render(); return; }
    const color = e.target.closest('[data-color]');
    if (color) { document.querySelectorAll('[data-color]').forEach(btn => btn.classList.remove('selected')); color.classList.add('selected'); document.querySelectorAll('[data-color]').forEach(btn => { btn.innerHTML = btn.classList.contains('selected') ? icon('check', 13) : ''; }); return; }
    if (e.target.closest('[data-save-service]')) {
      const name = document.getElementById('modal-service-name')?.value.trim();
      if (!name) return;
      const duration = document.getElementById('modal-service-duration')?.value || '45';
      const price = Number(document.getElementById('modal-service-price')?.value || 0);
      const chosen = document.querySelector('[data-color].selected')?.dataset.color || SERVICE_COLORS[0];
      if (state.modal.index == null) state.services.push([name, duration, price, chosen, true]); else state.services[state.modal.index] = [name, duration, price, chosen, state.services[state.modal.index][4]];
      state.modal = null; render(); toast('Service saved'); return;
    }
    if (e.target.closest('[data-connect]')) { state.integrations[Number(e.target.closest('[data-connect]').dataset.connect)][3] = true; render(); toast('Integration connected'); return; }
    if (e.target.closest('[data-disconnect]')) { const i = Number(e.target.closest('[data-disconnect]').dataset.disconnect); state.modal = { type: 'confirm', title: 'Disconnect Integration', message: `Are you sure you want to disconnect ${safe(state.integrations[i][1])}? Your sync data may be affected.`, confirm: 'Disconnect', action: 'disconnect', index: i }; render(); return; }
    if (e.target.closest('[data-delete-account]')) { state.modal = { type: 'confirm', title: 'Delete Account', message: 'This will permanently delete all clinic data, patient records, appointments, and settings. This action is irreversible and cannot be undone.', confirm: 'Delete My Account', action: 'delete-account' }; render(); return; }
    if (e.target.closest('[data-confirm-modal]')) {
      if (state.modal.action === 'delete-service') state.services.splice(state.modal.index, 1);
      if (state.modal.action === 'disconnect') state.integrations[state.modal.index][3] = false;
      state.modal = null; render(); toast('Changes saved'); return;
    }
    if (e.target.closest('[data-close-modal]') || e.target === document.querySelector('[data-modal-backdrop]')) { state.modal = null; render(); return; }
    if (e.target.closest('[data-hours-apply]')) { const first = state.hours[0].slice(); state.hours = state.hours.map((h, i) => i < 5 ? first.slice() : h); render(); toast('Monday hours applied'); return; }
    if (e.target.closest('.settings-save')) { toast('Changes saved'); return; }
    if (e.target.closest('.settings-discard')) { toast('Changes discarded'); return; }
    if (e.target.closest('[data-settings-logout]')) { toast('Use the profile menu to log out'); return; }
  }

  function handleChange(e) {
    const inputEl = e.target;
    if (inputEl.matches('[data-hours]')) { const [row, col] = inputEl.dataset.hours.split('-').map(Number); state.hours[row][col] = inputEl.value; }
    if (inputEl.matches('[data-hours-break]')) state.hours[Number(inputEl.dataset.hoursBreak)][5] = inputEl.checked;
  }

  return {
    init(doctor) {
      state.doctor = doctor || null;
      render();
      root.addEventListener('click', handleClick);
      root.addEventListener('change', handleChange);
    },
    reload: render,
  };
})();
