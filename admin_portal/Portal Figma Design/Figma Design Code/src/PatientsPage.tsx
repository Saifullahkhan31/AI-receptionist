import { useState, useRef, useLayoutEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type PatientStatus = "Active" | "Inactive" | "New";
type ApptStatus = "Show" | "Pending" | "No Show" | "Confirmed";
type FilterType = "All" | "Active" | "Inactive" | "New";
type TabId = "appointments" | "history" | "xrays" | "notes" | "billing";

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: "Male" | "Female";
  phone: string;
  email: string;
  status: PatientStatus;
  lastVisit: string;
  lastTreatment: string;
  totalVisits: number;
  balance: number;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const patients: Patient[] = [
  { id:  1, name: "Sarah Al-Rashidi",  age: 32, gender: "Female", phone: "+971 50 123 4567", email: "sarah.rashidi@email.com",  status: "Active",   lastVisit: "Aug 15, 2026", lastTreatment: "Dental Cleaning",      totalVisits: 12, balance:   0 },
  { id:  2, name: "Mohammed Karimi",   age: 45, gender: "Male",   phone: "+971 55 234 5678", email: "m.karimi@email.com",        status: "Active",   lastVisit: "Aug 20, 2026", lastTreatment: "Root Canal Treatment", totalVisits:  8, balance: 150 },
  { id:  3, name: "Layla Hassan",      age: 28, gender: "Female", phone: "+971 52 345 6789", email: "layla.hassan@email.com",    status: "New",      lastVisit: "Sep 2, 2026",  lastTreatment: "Teeth Whitening",      totalVisits:  2, balance:   0 },
  { id:  4, name: "Omar Al-Farsi",     age: 38, gender: "Male",   phone: "+971 56 456 7890", email: "omar.alfarsi@email.com",    status: "Active",   lastVisit: "Jul 30, 2026", lastTreatment: "Dental Crown Fitting", totalVisits: 15, balance:   0 },
  { id:  5, name: "Fatima Nouri",      age: 52, gender: "Female", phone: "+971 50 567 8901", email: "f.nouri@email.com",         status: "Inactive", lastVisit: "Apr 10, 2026", lastTreatment: "Orthodontic Consult",  totalVisits:  6, balance: 200 },
  { id:  6, name: "Khalid Mansour",    age: 41, gender: "Male",   phone: "+971 55 678 9012", email: "k.mansour@email.com",       status: "Active",   lastVisit: "Aug 28, 2026", lastTreatment: "Tooth Extraction",     totalVisits: 10, balance:   0 },
  { id:  7, name: "Reem Al-Jabri",     age: 26, gender: "Female", phone: "+971 52 789 0123", email: "reem.jabri@email.com",      status: "Active",   lastVisit: "Sep 1, 2026",  lastTreatment: "Composite Filling",    totalVisits:  4, balance:   0 },
  { id:  8, name: "Yousef Qassim",     age: 55, gender: "Male",   phone: "+971 56 890 1234", email: "y.qassim@email.com",        status: "New",      lastVisit: "Aug 25, 2026", lastTreatment: "Implant Consultation", totalVisits:  3, balance:  75 },
  { id:  9, name: "Aisha Bakr",        age: 34, gender: "Female", phone: "+971 50 901 2345", email: "aisha.bakr@email.com",      status: "Active",   lastVisit: "Aug 10, 2026", lastTreatment: "Scaling & Polishing",  totalVisits:  9, balance:   0 },
  { id: 10, name: "Hassan Al-Mutairi", age: 60, gender: "Male",   phone: "+971 55 012 3456", email: "h.mutairi@email.com",       status: "Inactive", lastVisit: "Mar 5, 2026",  lastTreatment: "Denture Fitting",      totalVisits: 18, balance:   0 },
  { id: 11, name: "Nora Saleem",       age: 29, gender: "Female", phone: "+971 52 123 4568", email: "nora.saleem@email.com",     status: "Active",   lastVisit: "Aug 18, 2026", lastTreatment: "Fluoride Treatment",   totalVisits:  7, balance:   0 },
  { id: 12, name: "Ibrahim Al-Khaldi", age: 47, gender: "Male",   phone: "+971 56 234 5679", email: "i.khaldi@email.com",        status: "Active",   lastVisit: "Aug 22, 2026", lastTreatment: "Periodontal Therapy",  totalVisits: 11, balance: 300 },
];

// Deterministic color by first letter — consistent on every render
const letterColors: Record<string, string> = {
  A:"#4F9EF0", B:"#7B68EE", C:"#26B5A0", D:"#FF7B7B", E:"#34A853",
  F:"#5AC8FA", G:"#FF2D55", H:"#AF52DE", I:"#00BCD4", J:"#3F51B5",
  K:"#009688", L:"#FF5722", M:"#673AB7", N:"#795548", O:"#2196F3",
  P:"#4CAF50", Q:"#F44336", R:"#E91E63", S:"#607D8B", T:"#00ACC1",
  U:"#03A9F4", V:"#8BC34A", W:"#FF9800", X:"#00BCD4", Y:"#3949AB",
  Z:"#795548",
};
function avatarColor(name: string) { return letterColors[name[0]?.toUpperCase()] ?? "#6E6E73"; }
function initials(name: string) { return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(); }

// Template detail data (realistic demo per selected patient)
const upcomingAppts = [
  { date: "Sep 10, 2026", time: "10:00 AM", treatment: "Root Canal — Session 2",  status: "Confirmed" as ApptStatus },
  { date: "Sep 20, 2026", time: "02:00 PM", treatment: "Follow-up Checkup",        status: "Pending"   as ApptStatus },
];
const pastAppts = [
  { date: "Aug 15, 2026", time: "11:00 AM", treatment: "Dental Cleaning & Scaling",   status: "Show" as ApptStatus },
  { date: "Jul 22, 2026", time: "09:30 AM", treatment: "Periapical X-Ray",             status: "Show" as ApptStatus },
  { date: "Jun 10, 2026", time: "03:00 PM", treatment: "Root Canal — Session 1",       status: "Show" as ApptStatus },
  { date: "Feb 20, 2026", time: "11:00 AM", treatment: "Composite Filling — Tooth 36", status: "Show" as ApptStatus },
];
const history = [
  { date: "Aug 15, 2026", procedure: "Dental Cleaning & Scaling",    tooth: "Full Mouth",  note: "Excellent hygiene. Recommended electric toothbrush. Recall in 6 months." },
  { date: "Jun 10, 2026", procedure: "Root Canal Treatment",          tooth: "Tooth #46",   note: "Infected pulp confirmed on X-ray. Completed in two sessions. Prescribed Amoxicillin 500mg × 7 days." },
  { date: "Feb 20, 2026", procedure: "Composite Filling",             tooth: "Tooth #36",   note: "Class II cavity. Composite shade A2. Patient tolerated procedure well." },
  { date: "Jan 8, 2026",  procedure: "Periapical X-Ray",             tooth: "LR Region",   note: "Baseline radiograph. No periapical pathology detected." },
];
const files = [
  { name: "Panoramic X-Ray",   filename: "panoramic_aug2026.jpg", date: "Aug 15, 2026", type: "image" },
  { name: "Periapical LR",     filename: "periapical_jan2026.jpg",date: "Jan 8, 2026",  type: "image" },
  { name: "Treatment Plan",    filename: "treatment_plan.pdf",    date: "Jun 10, 2026", type: "pdf"   },
  { name: "Consent — RCT",     filename: "consent_rct.pdf",       date: "Jun 10, 2026", type: "pdf"   },
  { name: "Medical History",   filename: "medical_history.pdf",   date: "Jan 5, 2026",  type: "pdf"   },
  { name: "Insurance Copy",    filename: "insurance_2026.pdf",    date: "Jan 5, 2026",  type: "pdf"   },
];
const notesList = [
  { date: "Aug 15, 2026", author: "Dr. Mustafa",  text: "Patient is very compliant with recall schedule. Oral hygiene is above average. Recommended interdental brushes. No current concerns." },
  { date: "Jun 10, 2026", author: "Dr. Mustafa",  text: "RCT completed successfully. Post-op instructions given verbally and in writing. Prescribed Ibuprofen 400mg for 3 days for pain management." },
  { date: "Mar 5, 2026",  author: "Receptionist", text: "Patient called to reschedule March appointment due to travel. Rescheduled to March 22 at 11:00 AM. Confirmed via WhatsApp." },
];
const billing = [
  { date: "Aug 15, 2026", service: "Dental Cleaning & Scaling",   amount: 350,  paid: 350,  status: "Paid"    },
  { date: "Jun 10, 2026", service: "Root Canal Treatment",         amount: 1200, paid: 1050, status: "Partial" },
  { date: "Feb 20, 2026", service: "Composite Filling — Tooth 36", amount: 450,  paid: 450,  status: "Paid"    },
  { date: "Jan 8, 2026",  service: "Periapical X-Ray",             amount: 150,  paid: 150,  status: "Paid"    },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PersonPlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 14c0-3.314 2.686-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="9" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2 2h3l1 3-1.5 1.5a9 9 0 0 0 3 3L9 8l3 1v3a1 1 0 0 1-1 1A10 10 0 0 1 1 3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 4.5l6 4 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 2v7M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M5 2h8l4 4v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M13 2v5h4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="7" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7" y1="15" x2="12" y2="15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ImageIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect x="2" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="9" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 16l5-5 3 3 3-3 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function MessageIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <path d="M13 1H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2v2.5L7 11h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function DotsHorizIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="4"  cy="8" r="1.2" fill="currentColor" />
      <circle cx="8"  cy="8" r="1.2" fill="currentColor" />
      <circle cx="12" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function CalendarSmIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="3" width="11" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="1.5" y1="6" x2="12.5" y2="6" stroke="currentColor" strokeWidth="1.3" />
      <line x1="5" y1="1.5" x2="5" y2="4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="9" y1="1.5" x2="9" y2="4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PlusSmIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NoteIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M4 4h8l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M12 4v5h4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="6" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="15" x2="10" y2="15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Shared: Appointment Status Pill ──────────────────────────────────────────

const apptStatusStyles: Record<ApptStatus, { bg: string; text: string; dot: string }> = {
  Show:      { bg: "#EEFBF2", text: "#1E8A4A", dot: "#34A853" },
  Confirmed: { bg: "#EBF2FF", text: "#1558C0", dot: "#1A73E8" },
  Pending:   { bg: "#FFFBE6", text: "#A16207", dot: "#FBBC04" },
  "No Show": { bg: "#FEF2F2", text: "#B91C1C", dot: "#EA4335" },
};

function ApptPill({ status }: { status: ApptStatus }) {
  const s = apptStatusStyles[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 8,
        background: s.bg,
        color: s.text,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {status}
    </span>
  );
}

// ── Patient Card (left panel) ─────────────────────────────────────────────────

function PatientCard({
  patient,
  selected,
  onClick,
}: {
  patient: Patient;
  selected: boolean;
  onClick: () => void;
}) {
  const dotColor = patient.status === "Active" ? "#34A853" : patient.status === "New" ? "#1A73E8" : "#9CA3AF";

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: "none",
        borderLeft: selected ? "3px solid #1A73E8" : "3px solid transparent",
        background: selected ? "#EBF2FF" : "#FFFFFF",
        boxShadow: selected
          ? "0 4px 12px rgba(0,0,0,0.10)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = "#F5F9FF"; }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: avatarColor(patient.name),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 800,
          color: "#fff",
          flexShrink: 0,
          letterSpacing: "0.02em",
        }}
      >
        {initials(patient.name)}
      </div>

      {/* Info */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: selected ? "#1A73E8" : "#1C1C1E",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {patient.name}
        </span>
        <span style={{ fontSize: 12, color: "#6E6E73" }}>Last visit: {patient.lastVisit}</span>
      </div>

      {/* Status dot + chevron */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dotColor,
            display: "inline-block",
            boxShadow: `0 0 0 2px ${dotColor}22`,
          }}
          title={patient.status}
        />
        <span style={{ color: "#9CA3AF" }}>
          <ChevronRightIcon size={14} />
        </span>
      </div>
    </button>
  );
}

// ── Info Card ─────────────────────────────────────────────────────────────────

function InfoCard({
  label,
  main,
  sub,
  mainColor,
}: {
  label: string;
  main: string;
  sub: string;
  mainColor?: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 800, color: mainColor ?? "#1C1C1E", letterSpacing: "-0.4px" }}>
        {main}
      </span>
      <span style={{ fontSize: 12, color: "#6E6E73" }}>{sub}</span>
    </div>
  );
}

// ── Tab: Appointments ─────────────────────────────────────────────────────────

function AppointmentsTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Upcoming */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>Upcoming</h3>
          <span style={{ padding: "2px 7px", borderRadius: 6, background: "#EBF2FF", color: "#1A73E8", fontSize: 11, fontWeight: 700 }}>
            {upcomingAppts.length}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {upcomingAppts.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "12px 16px",
                background: "#FFFFFF",
                borderRadius: 10,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                border: "1px solid #F0F0F2",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", minWidth: 80, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E" }}>{a.date}</span>
                <span style={{ fontSize: 11, color: "#6E6E73" }}>{a.time}</span>
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#1C1C1E" }}>{a.treatment}</span>
              <ApptPill status={a.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Past */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>Past</h3>
          <span style={{ padding: "2px 7px", borderRadius: 6, background: "#F3F4F6", color: "#6E6E73", fontSize: 11, fontWeight: 700 }}>
            {pastAppts.length}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pastAppts.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "12px 16px",
                background: "#FAFAFA",
                borderRadius: 10,
                border: "1px solid #F0F0F2",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", minWidth: 80, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73" }}>{a.date}</span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{a.time}</span>
              </div>
              <span style={{ flex: 1, fontSize: 13, color: "#6E6E73" }}>{a.treatment}</span>
              <ApptPill status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Treatment History ────────────────────────────────────────────────────

function TreatmentHistoryTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {history.map((h, i) => (
        <div key={i} style={{ display: "flex", gap: 16 }}>
          {/* Timeline spine */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#EBF2FF",
                border: "2px solid #1A73E8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                zIndex: 1,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1A73E8" }} />
            </div>
            {i < history.length - 1 && (
              <div style={{ width: 2, flex: 1, background: "#E5E7EB", margin: "4px 0" }} />
            )}
          </div>

          {/* Entry card */}
          <div style={{ flex: 1, paddingBottom: i < history.length - 1 ? 20 : 0 }}>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 10,
                border: "1px solid #F0F0F2",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                padding: "14px 16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>{h.procedure}</span>
                <span style={{ fontSize: 11, color: "#6E6E73", flexShrink: 0, marginLeft: 12 }}>{h.date}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#F3F4F6",
                    color: "#4B5563",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {h.tooth}
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#F3F4F6",
                    color: "#4B5563",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Dr. Mustafa
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#6E6E73", lineHeight: 1.5 }}>{h.note}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: X-Rays & Files ───────────────────────────────────────────────────────

function XRaysTab() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {files.map((f, i) => (
        <div
          key={i}
          style={{
            background: "#FFFFFF",
            borderRadius: 10,
            border: "1px solid #F0F0F2",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Thumbnail area */}
          <div
            style={{
              height: 72,
              borderRadius: 8,
              background: f.type === "image" ? "#EBF2FF" : "#FEF3C7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: f.type === "image" ? "#1A73E8" : "#D97706",
            }}
          >
            {f.type === "image" ? <ImageIcon size={28} /> : <FileIcon size={28} />}
          </div>

          {/* File info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#1C1C1E",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {f.name}
            </span>
            <span style={{ fontSize: 11, color: "#6E6E73" }}>{f.date}</span>
          </div>

          {/* Download */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "6px 0",
              borderRadius: 8,
              border: "1.5px solid #E5E7EB",
              background: "transparent",
              color: "#6E6E73",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EBF2FF"; (e.currentTarget as HTMLButtonElement).style.color = "#1A73E8"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#BFDBFE"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#6E6E73"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB"; }}
          >
            <DownloadIcon size={13} />
            Download
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Notes ────────────────────────────────────────────────────────────────

function NotesTab() {
  const [newNote, setNewNote] = useState("");
  const [showInput, setShowInput] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {notesList.map((n, i) => (
        <div
          key={i}
          style={{
            background: "#FFFFFF",
            borderRadius: 10,
            border: "1px solid #F0F0F2",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: n.author === "Dr. Mustafa" ? "linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)" : "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: n.author === "Dr. Mustafa" ? "#fff" : "#6E6E73",
                flexShrink: 0,
              }}
            >
              {n.author === "Dr. Mustafa" ? "DM" : "RC"}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E" }}>{n.author}</span>
            </div>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{n.date}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#4B5563", lineHeight: 1.6, paddingLeft: 38 }}>{n.text}</p>
        </div>
      ))}

      {/* Add Note */}
      {showInput ? (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 10,
            border: "1.5px solid #1A73E8",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Type your note here..."
            autoFocus
            style={{
              width: "100%",
              minHeight: 80,
              border: "none",
              outline: "none",
              resize: "vertical",
              fontSize: 13,
              color: "#1C1C1E",
              fontFamily: "inherit",
              lineHeight: 1.6,
              background: "transparent",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => { setShowInput(false); setNewNote(""); }}
              style={{ padding: "6px 16px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "transparent", fontSize: 13, fontWeight: 600, color: "#6E6E73", cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancel
            </button>
            <button
              onClick={() => { setShowInput(false); setNewNote(""); }}
              style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "#1A73E8", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              Save Note
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1.5px dashed #D1D5DB",
            background: "transparent",
            color: "#6E6E73",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1A73E8"; (e.currentTarget as HTMLButtonElement).style.color = "#1A73E8"; (e.currentTarget as HTMLButtonElement).style.background = "#EBF2FF"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#D1D5DB"; (e.currentTarget as HTMLButtonElement).style.color = "#6E6E73"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <PlusSmIcon size={14} />
          Add Note
        </button>
      )}
    </div>
  );
}

// ── Tab: Billing ──────────────────────────────────────────────────────────────

function BillingTab({ patient }: { patient: Patient }) {
  const totalCharged = billing.reduce((s, r) => s + r.amount, 0);
  const totalPaid    = billing.reduce((s, r) => s + r.paid, 0);
  const balance      = totalCharged - totalPaid;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Total Charges",  value: `AED ${totalCharged.toLocaleString()}`, color: "#1C1C1E" },
          { label: "Payments Made",  value: `AED ${totalPaid.toLocaleString()}`,    color: "#1E8A4A" },
          { label: "Balance Due",    value: balance > 0 ? `AED ${balance.toLocaleString()}` : "Clear", color: balance > 0 ? "#B91C1C" : "#1E8A4A" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#FFFFFF",
              borderRadius: 10,
              border: "1px solid #F0F0F2",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              padding: "14px 16px",
            }}
          >
            <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              {s.label}
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: "-0.3px" }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Line items table */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 10,
          border: "1px solid #F0F0F2",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 100px 100px 80px",
            gap: 0,
            padding: "10px 16px",
            background: "#FAFAFA",
            borderBottom: "1px solid #F0F0F2",
          }}
        >
          {["Date", "Service", "Charged", "Paid", "Status"].map((h) => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {billing.map((row, i) => {
          const statusColor = row.status === "Paid" ? { bg: "#EEFBF2", text: "#1E8A4A" } : { bg: "#FFFBE6", text: "#A16207" };
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 100px 100px 80px",
                gap: 0,
                padding: "12px 16px",
                borderBottom: i < billing.length - 1 ? "1px solid #F7F8FA" : "none",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 12, color: "#6E6E73" }}>{row.date}</span>
              <span style={{ fontSize: 13, color: "#1C1C1E", fontWeight: 500 }}>{row.service}</span>
              <span style={{ fontSize: 13, color: "#1C1C1E", fontWeight: 600 }}>AED {row.amount.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: "#1E8A4A", fontWeight: 600 }}>AED {row.paid.toLocaleString()}</span>
              <span
                style={{
                  display: "inline-flex",
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: statusColor.bg,
                  color: statusColor.text,
                  fontSize: 11,
                  fontWeight: 700,
                  width: "fit-content",
                }}
              >
                {row.status}
              </span>
            </div>
          );
        })}

        {/* Totals row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 100px 100px 80px",
            gap: 0,
            padding: "12px 16px",
            borderTop: "2px solid #E5E7EB",
            background: "#FAFAFA",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", gridColumn: "1 / 3" }}>Total</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#1C1C1E" }}>AED {totalCharged.toLocaleString()}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#1E8A4A" }}>AED {totalPaid.toLocaleString()}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: balance > 0 ? "#B91C1C" : "#1E8A4A" }}>
            {balance > 0 ? `−${balance.toLocaleString()}` : "✓"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Patient Detail (right panel) ──────────────────────────────────────────────

const tabs: { id: TabId; label: string }[] = [
  { id: "appointments", label: "Appointments"      },
  { id: "history",      label: "Treatment History" },
  { id: "xrays",        label: "X-Rays & Files"    },
  { id: "notes",        label: "Notes"             },
  { id: "billing",      label: "Billing"           },
];

function PatientDetail({ patient }: { patient: Patient }) {
  const [activeTab, setActiveTab] = useState<TabId>("appointments");
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = tabs.findIndex((t) => t.id === activeTab);
    const el = tabRefs.current[idx];
    if (el && tabContainerRef.current) {
      const cRect = tabContainerRef.current.getBoundingClientRect();
      const tRect = el.getBoundingClientRect();
      setIndicator({ left: tRect.left - cRect.left, width: tRect.width });
    }
  }, [activeTab]);

  const col = avatarColor(patient.name);

  return (
    <div>
      {/* Profile header */}
      <div
        style={{
          padding: "28px 28px 20px",
          borderBottom: "1px solid #F0F0F2",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
          {/* Large avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: col,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
              boxShadow: `0 4px 16px ${col}44`,
            }}
          >
            {initials(patient.name)}
          </div>

          {/* Name + details */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.4px" }}>
                {patient.name}
              </h2>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 8,
                  background: patient.status === "Active" ? "#EEFBF2" : patient.status === "New" ? "#EBF2FF" : "#F3F4F6",
                  color: patient.status === "Active" ? "#1E8A4A" : patient.status === "New" ? "#1558C0" : "#6E6E73",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {patient.status}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#6E6E73", fontWeight: 500 }}>
                {patient.age} years · {patient.gender}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6E6E73" }}>
                <PhoneIcon size={13} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{patient.phone}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6E6E73" }}>
                <MailIcon size={13} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{patient.email}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                style={{
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#1A73E8",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "opacity 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              >
                <CalendarSmIcon size={13} />
                Book Appointment
              </button>
              <button
                style={{
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "1.5px solid #E5E7EB",
                  background: "transparent",
                  color: "#1C1C1E",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F7F8FA"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <MessageIcon size={13} />
                Send Message
              </button>
              <button
                style={{
                  height: 36,
                  width: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  border: "1.5px solid #E5E7EB",
                  background: "transparent",
                  color: "#6E6E73",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                aria-label="More options"
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F7F8FA"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <DotsHorizIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, padding: "20px 28px" }}>
        <InfoCard
          label="Last Visit"
          main={patient.lastVisit}
          sub={patient.lastTreatment}
        />
        <InfoCard
          label="Total Visits"
          main={String(patient.totalVisits)}
          sub="appointments"
        />
        <InfoCard
          label="Outstanding Balance"
          main={patient.balance > 0 ? `AED ${patient.balance.toLocaleString()}` : "Clear"}
          sub={patient.balance > 0 ? "Payment pending" : "No balance due"}
          mainColor={patient.balance > 0 ? "#B91C1C" : "#1E8A4A"}
        />
      </div>

      {/* Tab bar — sticky */}
      <div
        ref={tabContainerRef}
        style={{
          position: "sticky",
          top: 0,
          background: "#FFFFFF",
          zIndex: 10,
          borderBottom: "1px solid #E5E7EB",
          padding: "0 28px",
          display: "flex",
          gap: 0,
          overflowX: "auto",
        }}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[i] = el; }}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 16px",
              border: "none",
              background: "transparent",
              color: activeTab === tab.id ? "#1A73E8" : "#6E6E73",
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
        {/* Animated underline indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            height: 2,
            background: "#1A73E8",
            borderRadius: "1px 1px 0 0",
            left: indicator.left,
            width: indicator.width,
            transition: "left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>

      {/* Tab content */}
      <div style={{ padding: 28, background: "#F7F8FA", minHeight: 320 }}>
        {activeTab === "appointments" && <AppointmentsTab />}
        {activeTab === "history"      && <TreatmentHistoryTab />}
        {activeTab === "xrays"        && <XRaysTab />}
        {activeTab === "notes"        && <NotesTab />}
        {activeTab === "billing"      && <BillingTab patient={patient} />}
      </div>
    </div>
  );
}

// ── Empty Detail State ────────────────────────────────────────────────────────

function EmptyDetail() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 10,
        padding: 40,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "#F3F4F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <circle cx="18" cy="14" r="9" fill="#D1D5DB" />
          <path d="M2 38c0-8.837 7.163-16 16-16s16 7.163 16 16" fill="#D1D5DB" />
          <circle cx="36" cy="36" r="9" fill="#1A73E8" />
          <path d="M36 31v10M31 36h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#4B5563" }}>
        Select a patient
      </p>
      <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF" }}>
        to view their details
      </p>
    </div>
  );
}

// ── Main: PatientsPage ────────────────────────────────────────────────────────

export function PatientsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>("All");
  const [search, setSearch] = useState("");

  const selectedPatient = patients.find((p) => p.id === selectedId) ?? null;

  const filtered = patients.filter((p) => {
    const matchesFilter = filter === "All" || p.status === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters: FilterType[] = ["All", "Active", "Inactive", "New"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid #E5E7EB",
          background: "#FFFFFF",
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.4px" }}>
            Patients
          </h1>
          <span style={{ fontSize: 13, color: "#6E6E73", fontWeight: 500 }}>
            {patients.length} patients registered
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Search bar */}
          <div style={{ position: "relative", width: 380 }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9CA3AF",
                pointerEvents: "none",
                display: "flex",
              }}
            >
              <SearchIcon size={15} />
            </span>
            <input
              type="text"
              placeholder="Search patients by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: 38,
                paddingLeft: 36,
                paddingRight: 12,
                borderRadius: 8,
                border: "1.5px solid #E5E7EB",
                background: "#F7F8FA",
                fontSize: 13,
                color: "#1C1C1E",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#1A73E8"; (e.target as HTMLInputElement).style.background = "#FFFFFF"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#E5E7EB"; (e.target as HTMLInputElement).style.background = "#F7F8FA"; }}
            />
          </div>

          {/* Add Patient */}
          <button
            style={{
              height: 38,
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0 18px",
              borderRadius: 8,
              border: "none",
              background: "#1A73E8",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              transition: "opacity 0.12s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            <PersonPlusIcon size={15} />
            Add Patient
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left panel — patient list */}
        <div
          style={{
            width: 380,
            flexShrink: 0,
            background: "#F7F8FA",
            borderRight: "1px solid #E5E7EB",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Filter pills */}
          <div style={{ padding: "12px 14px 8px", display: "flex", gap: 6, flexShrink: 0 }}>
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "5px 13px",
                  borderRadius: 8,
                  border: filter === f ? "none" : "1.5px solid #E5E7EB",
                  background: filter === f ? "#1A73E8" : "#FFFFFF",
                  color: filter === f ? "#fff" : "#6E6E73",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (filter !== f) { (e.currentTarget as HTMLButtonElement).style.background = "#F0F0F5"; } }}
                onMouseLeave={(e) => { if (filter !== f) { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; } }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Count label */}
          <div style={{ padding: "4px 14px 8px" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {filtered.length} {filter === "All" ? "patients" : filter.toLowerCase()}
            </span>
          </div>

          {/* Patient cards */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "4px 14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF", fontSize: 13 }}>
                No patients found
              </div>
            ) : (
              filtered.map((p) => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  selected={selectedId === p.id}
                  onClick={() => setSelectedId(p.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right panel — patient detail */}
        <div style={{ flex: 1, overflowY: "auto", background: "#FFFFFF" }}>
          {selectedPatient ? (
            <PatientDetail patient={selectedPatient} />
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>
    </div>
  );
}
