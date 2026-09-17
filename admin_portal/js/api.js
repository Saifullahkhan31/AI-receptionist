/* ═══════════════════════════════════════════════
   api.js — Supabase Data Layer
   All database calls in one place.
   Uses the native fetch() API against Supabase REST.
═══════════════════════════════════════════════ */

const API = (() => {
  'use strict';

  const BASE = CONFIG.SUPABASE_URL + '/rest/v1';
  function getHeaders() {
    return {
      'apikey':        CONFIG.SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + (localStorage.getItem(CONFIG.SESSION_KEY) || CONFIG.SUPABASE_ANON_KEY),
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
    };
  }

  // M4: always use Karachi timezone so Today's query is correct regardless of the doctor's device clock
  function localDateISO(date = new Date()) {
    // 'en-CA' locale produces YYYY-MM-DD format; timeZone ensures it's Karachi time, not local
    return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  }

  async function request(path, options = {}) {
    const res = await fetch(BASE + path, {
      headers: getHeaders(),
      ...options,
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(CONFIG.SESSION_KEY);
        localStorage.removeItem(CONFIG.SESSION_DOCTOR_KEY);
        sessionStorage.setItem('session_expired', 'true');
        location.reload();
        return;
      }
      const err = await res.text();
      throw new Error(`Supabase error ${res.status}: ${err}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  }

  return {
    // ── Appointments ─────────────────────────────
    async getTodayAppointments(doctorId) {
      const today = localDateISO();
      let path = `/appointments?appointment_date=eq.${today}&order=appointment_time.asc.nullslast`;
      if (doctorId) path += `&doctor_id=eq.${doctorId}`;
      return request(path);
    },

    async getAllTodayAppointments() {
      const today = localDateISO();
      return request(`/appointments?appointment_date=eq.${today}&order=appointment_time.asc.nullslast`);
    },

    async getWeekAppointments() {
      const today = localDateISO();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const end = localDateISO(nextWeek);
      return request(
        `/appointments?appointment_date=gte.${today}&appointment_date=lte.${end}` +
        `&status=neq.Appt Cancel/Postpone` +
        `&order=appointment_date.asc,appointment_time.asc.nullslast`
      );
    },

    async checkSlotAvailability(date, time) {
      if (!date || !time) return true; // Can't check without date/time
      // Format time correctly to ensure it matches DB (if time is e.g. "18:00")
      const path = `/appointments?appointment_date=eq.${date}&appointment_time=eq.${time}&status=neq.Appt Cancel/Postpone`;
      const rows = await request(path);
      return rows.length === 0;
    },

    async createAppointment(data) {
      return request('/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async updateAppointmentStatus(id, status) {
      return request(`/appointments?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    async deleteAppointment(id) {
      return request(`/appointments?id=eq.${id}`, {
        method: 'DELETE',
      });
    },

    // ── Patients ─────────────────────────────────
    async searchPatients(query) {
      const q = encodeURIComponent(query);
      return request(`/patients?or=(name.ilike.*${q}*,contact_number.ilike.*${q}*)&order=name.asc&limit=50`);
    },

    async getPatient(id) {
      const rows = await request(`/patients?id=eq.${id}`);
      return rows[0] || null;
    },

    async getPatientsByNames(names) {
      if (!names || names.length === 0) return [];
      // Supabase in filter takes a comma separated list inside parens
      // E.g. in.("Name 1","Name 2")
      const list = names.map(n => `%22${encodeURIComponent(n)}%22`).join(',');
      return request(`/patients?name=in.(${list})&order=name.asc`);
    },

    async getTreatmentsByMonth(monthStr) {
      // monthStr is like "2022-02"
      const start = `${monthStr}-01`;
      // Get last day of the month
      const [y, m] = monthStr.split('-');
      const end = new Date(y, m, 0).toISOString().split('T')[0];
      return request(`/treatments?date=gte.${start}&date=lte.${end}&order=date.desc`);
    },

    async createPatient(data) {
      return request('/patients', { method: 'POST', body: JSON.stringify(data) });
    },

    async updatePatient(id, data) {
      return request(`/patients?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },

    // C1 FIX: query by patient_id UUID, not patient_name text
    async getPatientTreatments(patientId) {
      return request(`/treatments?patient_id=eq.${patientId}&order=date.desc`);
    },

    async getLatestPatientTreatment(patientId) {
      const rows = await request(`/treatments?patient_id=eq.${patientId}&order=date.desc&limit=1`);
      return rows[0] || null;
    },

    // C1 FIX: use patient_id UUIDs for bulk last-visit lookup
    async getLatestTreatmentsForPatients(patientIds) {
      if (!patientIds || patientIds.length === 0) return [];
      const list = patientIds.join(',');
      return request(`/treatments?patient_id=in.(${list})&order=date.desc`);
    },

    // C2 FIX: query the appointments table (not treatments) for the Appointments tab
    async getPatientAppointments(patientId) {
      return request(`/appointments?patient_id=eq.${patientId}&order=appointment_date.desc,appointment_time.desc`);
    },

    // ── Services (for autocomplete) ───────────────
    async getServices() {
      return request('/services?order=category.asc,service_name.asc');
    },

    // ── Doctors ───────────────────────────────────
    async getDoctors() {
      return request('/doctors?select=id,name,display_name,role');
    },

    // ── Lab Work ──────────────────────────────────
    async getLabWork(status) {
      let path = '/lab_work?order=sending_date.desc';
      if (status) path += `&status=eq.${status}`;
      return request(path);
    },

    async updateLabStatus(id, status, receivingDate) {
      const data = { status };
      if (receivingDate) data.receiving_date = receivingDate;
      return request(`/lab_work?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },

    // ── Clinic Settings ───────────────────────────
    async getSettings() {
      const rows = await request('/clinic_settings');
      const map = {};
      rows.forEach(r => { map[r.key] = r.value; });
      return map;
    },

    async updateSetting(key, value) {
      return request(`/clinic_settings?key=eq.${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ value, updated_at: new Date().toISOString() }),
      });
    },
  };
})();
