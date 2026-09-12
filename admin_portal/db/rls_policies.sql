-- ═══════════════════════════════════════════════════════
-- CMD Admin Portal — Row Level Security Policies
-- Run this in Supabase SQL Editor AFTER schema.sql
--
-- Context: This portal is private (2 doctors only).
-- Authentication is handled by our custom PIN system on Render.
-- To secure the database, Render signs a custom Supabase-compatible JWT
-- upon successful PIN login. The frontend passes this JWT to Supabase.
--
-- Security Posture:
-- These policies restrict all access to the `authenticated` role.
-- Anyone trying to access the database with just the public `anon` key
-- will be blocked entirely.
-- ═══════════════════════════════════════════════════════

-- ── doctors ────────────────────────────────────────────
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_doctors" ON doctors;
DROP POLICY IF EXISTS "authenticated_all_doctors" ON doctors;
CREATE POLICY "authenticated_all_doctors" ON doctors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── patients ───────────────────────────────────────────
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_patients" ON patients;
DROP POLICY IF EXISTS "authenticated_all_patients" ON patients;
CREATE POLICY "authenticated_all_patients" ON patients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── treatments ─────────────────────────────────────────
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_treatments" ON treatments;
DROP POLICY IF EXISTS "authenticated_all_treatments" ON treatments;
CREATE POLICY "authenticated_all_treatments" ON treatments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── appointments ───────────────────────────────────────
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_appointments" ON appointments;
DROP POLICY IF EXISTS "authenticated_all_appointments" ON appointments;
CREATE POLICY "authenticated_all_appointments" ON appointments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── lab_work ───────────────────────────────────────────
ALTER TABLE lab_work ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_lab_work" ON lab_work;
DROP POLICY IF EXISTS "authenticated_all_lab_work" ON lab_work;
CREATE POLICY "authenticated_all_lab_work" ON lab_work
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── services ───────────────────────────────────────────
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_services" ON services;
DROP POLICY IF EXISTS "authenticated_all_services" ON services;
CREATE POLICY "authenticated_all_services" ON services
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── clinic_settings ────────────────────────────────────
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_clinic_settings" ON clinic_settings;
DROP POLICY IF EXISTS "authenticated_all_clinic_settings" ON clinic_settings;
CREATE POLICY "authenticated_all_clinic_settings" ON clinic_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
