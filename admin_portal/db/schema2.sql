-- ═══════════════════════════════════════════════════════════════
-- CMD Admin Portal — schema2.sql
-- Run in Supabase SQL Editor (safe to re-run; uses IF NOT EXISTS
-- and UPDATE ... WHERE ... IS NULL to avoid touching existing data)
-- ═══════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
-- FIX C1 — Backfill treatments.patient_id from patient name match
-- ────────────────────────────────────────────────────────────────
-- Context: treatments imported from Excel only have patient_name.
-- This links each treatment row to the correct patients.id UUID
-- so that the portal's "Treatment History" tab queries by patient_id
-- instead of the fragile patient_name text match.
--
-- NOTE: If two patients share the same name, this picks the one
-- with the earliest created_at. Review any ambiguous matches with
-- the diagnostic query at the bottom of this file.
-- ────────────────────────────────────────────────────────────────

UPDATE treatments t
SET    patient_id = (
    SELECT p.id
    FROM   patients p
    WHERE  LOWER(TRIM(p.name)) = LOWER(TRIM(t.patient_name))
    ORDER BY p.created_at ASC   -- pick earliest if duplicates exist
    LIMIT  1
)
WHERE  t.patient_id IS NULL
  AND  t.patient_name IS NOT NULL;


-- ────────────────────────────────────────────────────────────────
-- FIX C2 — Backfill appointments.patient_id from patient name match
-- ────────────────────────────────────────────────────────────────
-- Context: manually-added and bot-booked appointments only store
-- patient_name. This links each appointment to patients.id so the
-- portal's "Appointments" tab can query by patient_id.
-- ────────────────────────────────────────────────────────────────

UPDATE appointments a
SET    patient_id = (
    SELECT p.id
    FROM   patients p
    WHERE  LOWER(TRIM(p.name)) = LOWER(TRIM(a.patient_name))
    ORDER BY p.created_at ASC
    LIMIT  1
)
WHERE  a.patient_id IS NULL
  AND  a.patient_name IS NOT NULL;


-- ────────────────────────────────────────────────────────────────
-- DIAGNOSTIC — Run these SELECT queries to verify the backfill
-- ────────────────────────────────────────────────────────────────

-- How many treatments still have no patient_id after backfill?
-- (These are treatments whose patient_name has no match in patients table)
SELECT COUNT(*) AS unlinked_treatments
FROM   treatments
WHERE  patient_id IS NULL;

-- How many appointments still have no patient_id after backfill?
SELECT COUNT(*) AS unlinked_appointments
FROM   appointments
WHERE  patient_id IS NULL;

-- Show unlinked treatments so you can manually review / fix them:
-- SELECT id, patient_name, date, treatment
-- FROM   treatments
-- WHERE  patient_id IS NULL
-- ORDER BY date DESC;

-- Show unlinked appointments so you can manually review / fix them:
-- SELECT id, patient_name, appointment_date, treatment_planned
-- FROM   appointments
-- WHERE  patient_id IS NULL
-- ORDER BY appointment_date DESC;
