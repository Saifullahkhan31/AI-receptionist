import { useState, useRef, useLayoutEffect, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type PatientStatus = "Active" | "Inactive" | "New";
type ApptStatus = "Show" | "Pending" | "No Show" | "Confirmed";
type FilterType = "All" | "Active" | "Inactive" | "New";
type MobileTab = "appointments" | "history" | "files" | "notes" | "billing";

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

const letterColors: Record<string, string> = {
  A:"#4F9EF0", B:"#7B68EE", C:"#26B5A0", D:"#FF7B7B", E:"#34A853",
  F:"#5AC8FA", G:"#FF2D55", H:"#AF52DE", I:"#00BCD4", J:"#3F51B5",
  K:"#009688", L:"#FF5722", M:"#673AB7", N:"#795548", O:"#2196F3",
  P:"#4CAF50", Q:"#F44336", R:"#E91E63", S:"#607D8B", T:"#00ACC1",
  U:"#03A9F4", V:"#8BC34A", W:"#FF9800", X:"#00BCD4", Y:"#3949AB",
  Z:"#795548",
};
function ac(name: string) { return letterColors[name[0]?.toUpperCase()] ?? "#6E6E73"; }
function ini(name: string) { return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(); }

// Template detail data
const upcomingAppts = [
  { date: "Sep 10, 2026", time: "10:00 AM", treatment: "Root Canal — Session 2",  status: "Confirmed" as ApptStatus },
  { date: "Sep 20, 2026", time: "02:00 PM", treatment: "Follow-up Checkup",        status: "Pending"   as ApptStatus },
];
const pastAppts = [
  { date: "Aug 15, 2026", time: "11:00 AM", treatment: "Dental Cleaning & Scaling",   status: "Show" as ApptStatus },
  { date: "Jul 22, 2026", time: "09:30 AM", treatment: "Periapical X-Ray",             status: "Show" as ApptStatus },
  { date: "Jun 10, 2026", time: "03:00 PM", treatment: "Root Canal — Session 1",       status: "Show" as ApptStatus },
];
const history = [
  { date: "Aug 15, 2026", procedure: "Dental Cleaning & Scaling",  tooth: "Full Mouth", note: "Excellent hygiene. Recall in 6 months." },
  { date: "Jun 10, 2026", procedure: "Root Canal Treatment",        tooth: "Tooth #46",  note: "Completed in 2 sessions. Prescribed Amoxicillin." },
  { date: "Feb 20, 2026", procedure: "Composite Filling",           tooth: "Tooth #36",  note: "Class II cavity. Shade A2." },
  { date: "Jan 8, 2026",  procedure: "Periapical X-Ray",           tooth: "LR Region",  note: "Baseline. No pathology detected." },
];
const files = [
  { name: "Panoramic X-Ray",  date: "Aug 15, 2026", type: "image" },
  { name: "Periapical LR",    date: "Jan 8, 2026",  type: "image" },
  { name: "Treatment Plan",   date: "Jun 10, 2026", type: "pdf"   },
  { name: "Consent — RCT",    date: "Jun 10, 2026", type: "pdf"   },
  { name: "Medical History",  date: "Jan 5, 2026",  type: "pdf"   },
  { name: "Insurance Copy",   date: "Jan 5, 2026",  type: "pdf"   },
];
const notesList = [
  { date: "Aug 15, 2026", author: "Dr. Mustafa",  text: "Patient is very compliant. Oral hygiene is above average. No current concerns." },
  { date: "Jun 10, 2026", author: "Dr. Mustafa",  text: "RCT completed. Post-op instructions given. Prescribed Ibuprofen 400mg for 3 days." },
  { date: "Mar 5, 2026",  author: "Receptionist", text: "Patient rescheduled March appointment to March 22 at 11:00 AM." },
];
const billing = [
  { date: "Aug 15, 2026", service: "Dental Cleaning & Scaling",    amount: 350,  paid: 350,  status: "Paid"    },
  { date: "Jun 10, 2026", service: "Root Canal Treatment",          amount: 1200, paid: 1050, status: "Partial" },
  { date: "Feb 20, 2026", service: "Composite Filling — Tooth 36", amount: 450,  paid: 450,  status: "Paid"    },
  { date: "Jan 8, 2026",  service: "Periapical X-Ray",             amount: 150,  paid: 150,  status: "Paid"    },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <line x1="12" y1="12" x2="16" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ChevronLeftIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PhoneIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <path d="M2 2h3l1 3L4.5 6.5a9 9 0 0 0 4 4L10 9l3 1v3a1 1 0 0 1-1 1A11 11 0 0 1 1 3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function MailIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <rect x="1" y="3" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 5l6.5 4L14 5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function EyeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M1 7s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function DownloadIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M6.5 2v7M3.5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="1.5" y1="11" x2="11.5" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function FileIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M5 2h8l4 4v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M13 2v5h4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function ImageFileIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect x="2" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="9" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 16l5-5 3 3 3-3 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// ── Status utilities ──────────────────────────────────────────────────────────

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
        gap: 4,
        padding: "3px 8px",
        borderRadius: 8,
        background: s.bg,
        color: s.text,
        fontSize: 10,
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

// ── Swipeable Patient Card ────────────────────────────────────────────────────

function MobilePatientCard({
  patient,
  onTap,
}: {
  patient: Patient;
  onTap: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const isOpenRef = useRef(false);
  const didMoveRef = useRef(false);
  const REVEAL = 150;

  const slide = (offset: number, animate: boolean) => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = animate ? "transform 0.22s cubic-bezier(0.4,0,0.2,1)" : "none";
    cardRef.current.style.transform = `translateX(${offset}px)`;
  };

  const handleStart = (clientX: number) => {
    startXRef.current = clientX;
    didMoveRef.current = false;
    if (cardRef.current) cardRef.current.style.transition = "none";
  };

  const handleMove = (clientX: number, active: boolean) => {
    if (!active) return;
    const dx = clientX - startXRef.current;
    if (Math.abs(dx) > 4) didMoveRef.current = true;
    const base = isOpenRef.current ? -REVEAL : 0;
    const next = Math.max(Math.min(base + dx, 0), -REVEAL);
    if (cardRef.current) {
      cardRef.current.style.transition = "none";
      cardRef.current.style.transform = `translateX(${next}px)`;
    }
  };

  const handleEnd = (clientX: number) => {
    const dx = clientX - startXRef.current;
    if (!didMoveRef.current) {
      if (isOpenRef.current) { slide(0, true); isOpenRef.current = false; }
      else onTap();
      return;
    }
    let final: number;
    if (!isOpenRef.current && dx < -50) { final = -REVEAL; isOpenRef.current = true; }
    else if (isOpenRef.current && dx > 50) { final = 0; isOpenRef.current = false; }
    else { final = isOpenRef.current ? -REVEAL : 0; }
    slide(final, true);
  };

  const dotColor =
    patient.status === "Active" ? "#34A853" : patient.status === "New" ? "#1A73E8" : "#9CA3AF";

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Swipe actions */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: REVEAL, display: "flex" }}>
        <button
          onClick={() => { slide(0, true); isOpenRef.current = false; }}
          style={{
            width: 80,
            border: "none",
            background: "#1A73E8",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <PhoneIcon size={16} />
          Call
        </button>
        <button
          onClick={() => { slide(0, true); isOpenRef.current = false; onTap(); }}
          style={{
            width: 70,
            border: "none",
            background: "#6B7280",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <EyeIcon size={16} />
          View
        </button>
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className="swipe-card"
        style={{
          background: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          position: "relative",
          zIndex: 1,
          minHeight: 72,
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => { handleMove(e.touches[0].clientX, true); }}
        onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX, e.buttons === 1)}
        onMouseUp={(e) => handleEnd(e.clientX)}
      >
        {/* Avatar 48px */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: ac(patient.name),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {ini(patient.name)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#1C1C1E",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {patient.name}
          </span>
          <span style={{ fontSize: 12, color: "#6E6E73" }}>Last visit: {patient.lastVisit}</span>
        </div>

        {/* Status + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dotColor,
              display: "inline-block",
              boxShadow: `0 0 0 2.5px ${dotColor}33`,
            }}
          />
          <span style={{ color: "#C4C4C6" }}>
            <ChevronRightIcon size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Mini stat card for detail header ─────────────────────────────────────────

function MiniStat({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        minWidth: 120,
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 700, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </span>
      <span style={{ fontSize: 18, fontWeight: 800, color: valueColor ?? "#1C1C1E", letterSpacing: "-0.3px", lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{sub}</span>
    </div>
  );
}

// ── Tab content ───────────────────────────────────────────────────────────────

function AppointmentsTabMobile() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 16 }}>
      {[
        { title: "Upcoming", count: upcomingAppts.length, appts: upcomingAppts, muted: false },
        { title: "Past",     count: pastAppts.length,     appts: pastAppts,     muted: true  },
      ].map(({ title, count, appts, muted }) => (
        <div key={title}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>{title}</span>
            <span style={{ padding: "1px 6px", borderRadius: 5, background: muted ? "#F3F4F6" : "#EBF2FF", color: muted ? "#6E6E73" : "#1A73E8", fontSize: 11, fontWeight: 700 }}>
              {count}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {appts.map((a, i) => (
              <div
                key={i}
                style={{
                  background: muted ? "#FAFAFA" : "#FFFFFF",
                  borderRadius: 10,
                  border: "1px solid #F0F0F2",
                  boxShadow: muted ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: muted ? "#6E6E73" : "#1C1C1E" }}>{a.date}</span>
                  <ApptPill status={a.status} />
                </div>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{a.time} · {a.treatment}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryTabMobile() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingBottom: 16 }}>
      {history.map((h, i) => (
        <div key={i} style={{ display: "flex", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#EBF2FF",
                border: "2px solid #1A73E8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#1A73E8" }} />
            </div>
            {i < history.length - 1 && (
              <div style={{ width: 2, flex: 1, background: "#E5E7EB", margin: "3px 0" }} />
            )}
          </div>
          <div style={{ flex: 1, paddingBottom: i < history.length - 1 ? 16 : 0 }}>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 10,
                border: "1px solid #F0F0F2",
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>{h.procedure}</span>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>{h.date}</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <span style={{ padding: "2px 7px", borderRadius: 5, background: "#F3F4F6", color: "#4B5563", fontSize: 10, fontWeight: 600 }}>{h.tooth}</span>
                <span style={{ padding: "2px 7px", borderRadius: 5, background: "#F3F4F6", color: "#4B5563", fontSize: 10, fontWeight: 600 }}>Dr. Mustafa</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#6E6E73", lineHeight: 1.5 }}>{h.note}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FilesTabMobile() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingBottom: 16 }}>
      {files.map((f, i) => (
        <div
          key={i}
          style={{
            background: "#FFFFFF",
            borderRadius: 10,
            border: "1px solid #F0F0F2",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              height: 56,
              borderRadius: 8,
              background: f.type === "image" ? "#EBF2FF" : "#FEF3C7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: f.type === "image" ? "#1A73E8" : "#D97706",
            }}
          >
            {f.type === "image" ? <ImageFileIcon size={24} /> : <FileIcon size={24} />}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#1C1C1E", lineHeight: 1.3 }}>{f.name}</p>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9CA3AF" }}>{f.date}</p>
          </div>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "6px 0",
              borderRadius: 7,
              border: "1.5px solid #E5E7EB",
              background: "transparent",
              color: "#6E6E73",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <DownloadIcon size={12} />
            Download
          </button>
        </div>
      ))}
    </div>
  );
}

function NotesTabMobile() {
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 16 }}>
      {notesList.map((n, i) => (
        <div
          key={i}
          style={{
            background: "#FFFFFF",
            borderRadius: 10,
            border: "1px solid #F0F0F2",
            padding: "12px 14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: n.author === "Dr. Mustafa" ? "linear-gradient(135deg,#1A73E8,#0D47A1)" : "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 800,
                color: n.author === "Dr. Mustafa" ? "#fff" : "#6E6E73",
                flexShrink: 0,
              }}
            >
              {n.author === "Dr. Mustafa" ? "DM" : "RC"}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", flex: 1 }}>{n.author}</span>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>{n.date}</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#4B5563", lineHeight: 1.55, paddingLeft: 34 }}>{n.text}</p>
        </div>
      ))}

      {showInput ? (
        <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid #1A73E8", padding: "12px 14px" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add a note…"
            style={{
              width: "100%",
              minHeight: 70,
              border: "none",
              outline: "none",
              fontSize: 13,
              color: "#1C1C1E",
              fontFamily: "inherit",
              resize: "vertical",
              background: "transparent",
              boxSizing: "border-box",
              lineHeight: 1.5,
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => { setShowInput(false); setText(""); }} style={{ flex: 1, height: 40, borderRadius: 8, border: "1.5px solid #E5E7EB", background: "transparent", fontSize: 13, fontWeight: 600, color: "#6E6E73", cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button onClick={() => { setShowInput(false); setText(""); }} style={{ flex: 1, height: 40, borderRadius: 8, border: "none", background: "#1A73E8", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 10,
            border: "1.5px dashed #D1D5DB",
            background: "transparent",
            color: "#6E6E73",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
          }}
        >
          <PlusIcon size={14} />
          Add Note
        </button>
      )}
    </div>
  );
}

function BillingTabMobile() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 16 }}>
      {billing.map((row, i) => {
        const sc = row.status === "Paid"
          ? { bg: "#EEFBF2", text: "#1E8A4A" }
          : { bg: "#FFFBE6", text: "#A16207" };
        return (
          <div
            key={i}
            style={{
              background: "#FFFFFF",
              borderRadius: 10,
              border: "1px solid #F0F0F2",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1C1C1E", lineHeight: 1.3 }}>{row.service}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9CA3AF" }}>{row.date}</p>
              </div>
              <span style={{ padding: "2px 8px", borderRadius: 6, background: sc.bg, color: sc.text, fontSize: 10, fontWeight: 700, flexShrink: 0, marginLeft: 10 }}>
                {row.status}
              </span>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontSize: 11, color: "#6E6E73" }}>Charged: <strong style={{ color: "#1C1C1E" }}>AED {row.amount.toLocaleString()}</strong></span>
              <span style={{ fontSize: 11, color: "#6E6E73" }}>Paid: <strong style={{ color: "#1E8A4A" }}>AED {row.paid.toLocaleString()}</strong></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Mobile Patient Detail (full-screen overlay) ───────────────────────────────

const mobileTabs: { id: MobileTab; label: string }[] = [
  { id: "appointments", label: "Appointments" },
  { id: "history",      label: "History"      },
  { id: "files",        label: "Files"        },
  { id: "notes",        label: "Notes"        },
  { id: "billing",      label: "Billing"      },
];

function MobilePatientDetail({
  patient,
  onBack,
}: {
  patient: Patient;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<MobileTab>("appointments");
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = mobileTabs.findIndex((t) => t.id === activeTab);
    const el = tabRefs.current[idx];
    if (el && tabContainerRef.current) {
      const cRect = tabContainerRef.current.getBoundingClientRect();
      const tRect = el.getBoundingClientRect();
      setIndicator({ left: tRect.left - cRect.left, width: tRect.width });
    }
  }, [activeTab]);

  const col = ac(patient.name);
  const totalCharged = billing.reduce((s, r) => s + r.amount, 0);
  const totalPaid    = billing.reduce((s, r) => s + r.paid,   0);
  const balance      = totalCharged - totalPaid;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#F7F8FA",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Back header */}
      <div
        style={{
          height: 56,
          background: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "#1A73E8",
            border: "none",
            background: "transparent",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            padding: "8px 0",
            minWidth: 80,
          }}
          aria-label="Back to Patients"
        >
          <ChevronLeftIcon size={18} />
          Patients
        </button>
        <span
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 15,
            fontWeight: 800,
            color: "#1C1C1E",
            letterSpacing: "-0.2px",
            maxWidth: 180,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {patient.name.split(" ")[0]}
        </span>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Profile section */}
        <div
          style={{
            background: "#FFFFFF",
            padding: "20px 16px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid #F0F0F2",
          }}
        >
          {/* 72px avatar */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: col,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              color: "#fff",
              boxShadow: `0 4px 16px ${col}44`,
            }}
          >
            {ini(patient.name)}
          </div>

          {/* Name + status badge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.3px" }}>
              {patient.name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#6E6E73", fontWeight: 500 }}>
                {patient.age} · {patient.gender}
              </span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 7,
                  background: patient.status === "Active" ? "#EEFBF2" : patient.status === "New" ? "#EBF2FF" : "#F3F4F6",
                  color: patient.status === "Active" ? "#1E8A4A" : patient.status === "New" ? "#1558C0" : "#6E6E73",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {patient.status}
              </span>
            </div>
          </div>

          {/* Tap-to-call and tap-to-email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 300 }}>
            <a
              href={`tel:${patient.phone}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1.5px solid #E5E7EB",
                background: "#F7F8FA",
                color: "#1A73E8",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <PhoneIcon size={14} />
              {patient.phone}
            </a>
            <a
              href={`mailto:${patient.email}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1.5px solid #E5E7EB",
                background: "#F7F8FA",
                color: "#6E6E73",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <MailIcon size={14} />
              {patient.email}
            </a>
          </div>
        </div>

        {/* Horizontal stat mini cards */}
        <div
          className="hide-scroll"
          style={{ display: "flex", gap: 10, padding: "14px 16px 0", overflowX: "auto" }}
        >
          <MiniStat label="Last Visit"  value={patient.lastVisit}        sub={patient.lastTreatment} />
          <MiniStat label="Total Visits" value={String(patient.totalVisits)} sub="appointments"           />
          <MiniStat
            label="Balance"
            value={patient.balance > 0 ? `AED ${patient.balance}` : "Clear"}
            sub={patient.balance > 0 ? "outstanding" : "no balance due"}
            valueColor={patient.balance > 0 ? "#B91C1C" : "#1E8A4A"}
          />
        </div>

        {/* Tab row — sticky, horizontally scrollable */}
        <div
          ref={tabContainerRef}
          className="hide-scroll"
          style={{
            position: "sticky",
            top: 0,
            background: "#FFFFFF",
            zIndex: 10,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            overflowX: "auto",
            marginTop: 14,
          }}
        >
          {mobileTabs.map((tab, i) => (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "11px 16px",
                border: "none",
                background: "transparent",
                color: activeTab === tab.id ? "#1A73E8" : "#6E6E73",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "color 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
          {/* Sliding indicator */}
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
        <div style={{ padding: "16px 16px 0" }}>
          {activeTab === "appointments" && <AppointmentsTabMobile />}
          {activeTab === "history"      && <HistoryTabMobile />}
          {activeTab === "files"        && <FilesTabMobile />}
          {activeTab === "notes"        && <NotesTabMobile />}
          {activeTab === "billing"      && <BillingTabMobile />}
        </div>
      </div>

      {/* Billing balance — pinned above safe area, only when billing tab */}
      {activeTab === "billing" && (
        <div
          style={{
            flexShrink: 0,
            background: "#FFFFFF",
            borderTop: "2px solid #E5E7EB",
            padding: "14px 16px",
            paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Total Balance
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 22, fontWeight: 800, color: balance > 0 ? "#B91C1C" : "#1E8A4A", letterSpacing: "-0.4px" }}>
              {balance > 0 ? `AED ${balance.toLocaleString()} due` : "All Clear"}
            </p>
          </div>
          {balance > 0 && (
            <button
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: "#1A73E8",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Collect Payment
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add Patient Bottom Sheet ───────────────────────────────────────────────────

function AddPatientSheet({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", dob: "", gender: "",
  });

  const field = (
    label: string,
    key: keyof typeof form,
    placeholder: string,
    type: string = "text"
  ) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#6E6E73", letterSpacing: "0.03em" }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        style={{
          height: 48,
          borderRadius: 8,
          border: "1.5px solid #E5E7EB",
          padding: "0 14px",
          fontSize: 15,
          color: "#1C1C1E",
          fontFamily: "inherit",
          outline: "none",
          background: "#F7F8FA",
          width: "100%",
          boxSizing: "border-box",
          transition: "border-color 0.15s, background 0.15s",
        }}
        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#1A73E8"; (e.target as HTMLInputElement).style.background = "#fff"; }}
        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#E5E7EB"; (e.target as HTMLInputElement).style.background = "#F7F8FA"; }}
      />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300 }}>
      {/* Backdrop */}
      <div
        className="overlay-enter"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      />

      {/* Sheet */}
      <div
        className="sheet-enter"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#FFFFFF",
          borderRadius: "24px 24px 0 0",
          padding: "12px 20px 32px",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 20px" }} />

        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.3px" }}>
            Add Patient
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "#F3F4F6",
              color: "#6E6E73",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {field("Full Name",    "name",  "e.g. Sarah Al-Rashidi")}
          {field("Phone Number", "phone", "+971 50 000 0000",  "tel")}
          {field("Email",        "email", "patient@email.com", "email")}
          {field("Date of Birth","dob",   "DD / MM / YYYY")}

          {/* Gender pills */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#6E6E73", letterSpacing: "0.03em" }}>Gender</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["Male", "Female", "Other"].map((g) => (
                <button
                  key={g}
                  onClick={() => setForm((f) => ({ ...f, gender: g }))}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 10,
                    border: form.gender === g ? "none" : "1.5px solid #E5E7EB",
                    background: form.gender === g ? "#1A73E8" : "#F7F8FA",
                    color: form.gender === g ? "#fff" : "#6E6E73",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={onClose}
            style={{
              width: "100%",
              height: 52,
              marginTop: 6,
              borderRadius: 12,
              border: "none",
              background: "#1A73E8",
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(26,115,232,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <PersonPlusIcon size={16} />
            Save Patient
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main: MobilePatientsPage ──────────────────────────────────────────────────

export function MobilePatientsPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    requestAnimationFrame(() => setDetailVisible(true));
  };

  const handleBack = () => {
    setDetailVisible(false);
    setTimeout(() => setSelectedPatient(null), 320);
  };

  useEffect(() => {
    if (searchExpanded) searchInputRef.current?.focus();
    else setSearch("");
  }, [searchExpanded]);

  const filtered = patients.filter((p) => {
    const mf = filter === "All" || p.status === filter;
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const filters: FilterType[] = ["All", "Active", "Inactive", "New"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#F7F8FA", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div
        style={{
          height: 56,
          background: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Normal header */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: searchExpanded ? 0 : 1,
            transform: searchExpanded ? "translateY(-6px)" : "translateY(0)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
            pointerEvents: searchExpanded ? "none" : "auto",
            background: "#fff",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.3px" }}>
            Patients
          </h1>
          <button
            onClick={() => setSearchExpanded(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "1.5px solid #E5E7EB",
              background: "transparent",
              color: "#6E6E73",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Search"
          >
            <SearchIcon size={17} />
          </button>
        </div>

        {/* Search header */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: searchExpanded ? 1 : 0,
            transform: searchExpanded ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
            pointerEvents: searchExpanded ? "auto" : "none",
            background: "#fff",
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9CA3AF",
                display: "flex",
                pointerEvents: "none",
              }}
            >
              <SearchIcon size={15} />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients…"
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1.5px solid #E5E7EB",
                paddingLeft: 32,
                paddingRight: 10,
                fontSize: 15,
                color: "#1C1C1E",
                fontFamily: "inherit",
                outline: "none",
                background: "#F7F8FA",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#1A73E8"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#E5E7EB"; }}
            />
          </div>
          <button
            onClick={() => setSearchExpanded(false)}
            style={{
              border: "none",
              background: "transparent",
              color: "#1A73E8",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              padding: "4px 0",
              flexShrink: 0,
              minHeight: 44,
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div
        className="hide-scroll"
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 16px 0",
          overflowX: "auto",
          flexShrink: 0,
          background: "#F7F8FA",
        }}
      >
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: filter === f ? "none" : "1.5px solid #E5E7EB",
              background: filter === f ? "#1A73E8" : "#FFFFFF",
              color: filter === f ? "#fff" : "#6E6E73",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              flexShrink: 0,
              minHeight: 32,
              transition: "all 0.15s",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ padding: "8px 16px 4px" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {filtered.length} {filter === "All" ? "patients" : filter.toLowerCase()}
        </span>
      </div>

      {/* Patient list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 16px 112px",
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
            <MobilePatientCard
              key={p.id}
              patient={p}
              onTap={() => handleSelectPatient(p)}
            />
          ))
        )}
      </div>

      {/* Add Patient pill FAB — above tab bar */}
      <div
        style={{
          position: "fixed",
          bottom: 80,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
        }}
      >
        <button
          onClick={() => setShowAddSheet(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "13px 28px",
            borderRadius: 999,
            border: "none",
            background: "#1A73E8",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 20px rgba(26,115,232,0.45)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          <PersonPlusIcon size={15} />
          Add Patient
        </button>
      </div>

      {/* Patient Detail overlay (covers tab bar) */}
      {selectedPatient && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "#F7F8FA",
            transform: detailVisible ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <MobilePatientDetail patient={selectedPatient} onBack={handleBack} />
        </div>
      )}

      {/* Add Patient sheet */}
      {showAddSheet && <AddPatientSheet onClose={() => setShowAddSheet(false)} />}
    </div>
  );
}
