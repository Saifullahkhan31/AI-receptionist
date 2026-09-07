import { useState, useRef, useEffect } from "react";
import cmdLogo from "@/imports/cmd-logo.png";
import { PatientsPage } from "./PatientsPage";
import { MobilePatientsPage } from "./MobilePatientsPage";
import { SettingsPage } from "./SettingsPage";
import { MobileSettingsPage } from "./MobileSettingsPage";

// ── Types & Data ─────────────────────────────────────────────────────────────

type Status = "Show" | "Pending" | "No Show" | "Confirmed";
type NavSection = "schedule" | "patients" | "lab" | "settings";

interface Appointment {
  id: number;
  time: string;
  patient: string;
  initials: string;
  color: string;
  treatment: string;
  status: Status;
}

const appointments: Appointment[] = [
  { id: 1, time: "09:00 AM", patient: "Sarah Al-Rashidi",  initials: "SA", color: "#4F9EF0", treatment: "Dental Cleaning & Scaling",    status: "Show"      },
  { id: 2, time: "09:30 AM", patient: "Mohammed Karimi",   initials: "MK", color: "#7B68EE", treatment: "Root Canal Treatment",          status: "Confirmed" },
  { id: 3, time: "10:15 AM", patient: "Layla Hassan",      initials: "LH", color: "#FF7B7B", treatment: "Teeth Whitening",               status: "Pending"   },
  { id: 4, time: "11:00 AM", patient: "Omar Al-Farsi",     initials: "OF", color: "#34A853", treatment: "Dental Crown Fitting",          status: "Show"      },
  { id: 5, time: "11:45 AM", patient: "Fatima Nouri",      initials: "FN", color: "#FF9500", treatment: "Orthodontic Consultation",      status: "No Show"   },
  { id: 6, time: "02:00 PM", patient: "Khalid Mansour",    initials: "KM", color: "#5AC8FA", treatment: "Tooth Extraction",              status: "Confirmed" },
  { id: 7, time: "02:45 PM", patient: "Reem Al-Jabri",     initials: "RJ", color: "#FF2D55", treatment: "Composite Filling",             status: "Pending"   },
  { id: 8, time: "03:30 PM", patient: "Yousef Qassim",     initials: "YQ", color: "#AF52DE", treatment: "Implant Consultation",          status: "Show"      },
];

const statusStyles: Record<Status, { bg: string; text: string; dot: string }> = {
  Show:      { bg: "#EEFBF2", text: "#1E8A4A", dot: "#34A853" },
  Confirmed: { bg: "#EBF2FF", text: "#1558C0", dot: "#1A73E8" },
  Pending:   { bg: "#FFFBE6", text: "#A16207", dot: "#FBBC04" },
  "No Show": { bg: "#FEF2F2", text: "#B91C1C", dot: "#EA4335" },
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useWindowWidth() {
  const [w, setW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1200));
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="4.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2.5" y1="8.5" x2="17.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="2.5" x2="7" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="2.5" x2="13" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="12" r="1" fill="currentColor" />
      <circle cx="10" cy="12" r="1" fill="currentColor" />
      <circle cx="13" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function PersonIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FlaskIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M7.5 3v6.5L3.5 16a1 1 0 0 0 .9 1.5h11.2a1 1 0 0 0 .9-1.5L12.5 9.5V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="6.5" y1="3" x2="13.5" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8.5" cy="13.5" r="1" fill="currentColor" />
      <circle cx="11.5" cy="15" r="0.7" fill="currentColor" />
    </svg>
  );
}

function GearIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.41 1.41M14.37 14.37l1.41 1.41M15.78 4.22l-1.41 1.41M5.63 14.37l-1.41 1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2a6 6 0 0 0-6 6v4l-1.5 2.5h15L16 12V8a6 6 0 0 0-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 15.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogOutIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.5 11L14 8l-3.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="14" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 9l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XCircleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function DotsVerticalIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="3.5" r="1.2" fill="currentColor" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8" cy="12.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function PlusIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M12 2.5A6 6 0 1 1 2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 3V7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Shared: StatusPill ────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Status }) {
  const s = statusStyles[status];
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
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: s.dot,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DESKTOP COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#1C1C1E",
              lineHeight: 1,
              letterSpacing: "-0.5px",
            }}
          >
            {value}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#6E6E73",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {label}
          </span>
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: iconBg,
            color: iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function AppointmentRow({
  appt,
  openMenuId,
  onMenuToggle,
  isLast,
}: {
  appt: Appointment;
  openMenuId: number | null;
  onMenuToggle: (id: number | null) => void;
  isLast: boolean;
}) {
  return (
    <div
      className="row-hover"
      style={{
        display: "grid",
        gridTemplateColumns: "100px 1fr auto auto",
        alignItems: "center",
        gap: 16,
        padding: "14px 24px",
        borderBottom: isLast ? "none" : "1px solid #F0F0F2",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E", letterSpacing: "-0.1px" }}>
        {appt.time}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: appt.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 700,
            color: "white",
          }}
        >
          {appt.initials}
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#1C1C1E",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {appt.patient}
          </span>
          <span style={{ fontSize: 12, color: "#6E6E73", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {appt.treatment}
          </span>
        </div>
      </div>
      <StatusPill status={appt.status} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          className="view-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 14px",
            borderRadius: 8,
            border: "1.5px solid #E5E7EB",
            background: "transparent",
            color: "#1C1C1E",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <EyeIcon size={14} />
          View
        </button>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => onMenuToggle(openMenuId === appt.id ? null : appt.id)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1.5px solid #E5E7EB",
              background: openMenuId === appt.id ? "#F7F8FA" : "transparent",
              color: "#6E6E73",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="More options"
          >
            <DotsVerticalIcon size={14} />
          </button>
          {openMenuId === appt.id && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 6px)",
                background: "#FFFFFF",
                borderRadius: 10,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                border: "1px solid #F0F0F2",
                minWidth: 160,
                zIndex: 50,
                overflow: "hidden",
              }}
            >
              {["View Details", "Edit Appointment", "Send Reminder", "Cancel Appointment"].map((item, i) => (
                <button
                  key={item}
                  onClick={() => onMenuToggle(null)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "9px 16px",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 500,
                    color: i === 3 ? "#EA4335" : "#1C1C1E",
                    cursor: "pointer",
                    borderBottom: i < 3 ? "1px solid #F7F8FA" : "none",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "#F7F8FA"; }}
                  onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({
  id,
  label,
  icon,
  active,
  collapsed,
  onClick,
}: {
  id: NavSection;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={collapsed ? "nav-item-collapsed" : ""}
      style={{
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 10,
        padding: collapsed ? "10px" : "10px 12px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        background: active ? "#1A73E8" : "transparent",
        color: active ? "#FFFFFF" : "#6E6E73",
        width: "100%",
        justifyContent: collapsed ? "center" : "flex-start",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        transition: "background 0.15s, color 0.15s",
        position: "relative",
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "#F7F8FA"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      aria-label={label}
    >
      {icon}
      {!collapsed && <span style={{ letterSpacing: "-0.1px" }}>{label}</span>}
      {collapsed && (
        <span
          className="nav-tooltip"
          style={{
            position: "absolute",
            left: "calc(100% + 8px)",
            top: "50%",
            transform: "translateY(-50%)",
            background: "#1C1C1E",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

function DesktopEmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "#EBF2FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="4" y="8" width="32" height="28" rx="4" fill="#BFDBFE" />
          <rect x="4" y="8" width="32" height="9" rx="4" fill="#1A73E8" />
          <line x1="14" y1="4" x2="14" y2="12" stroke="#1A73E8" strokeWidth="3" strokeLinecap="round" />
          <line x1="26" y1="4" x2="26" y2="12" stroke="#1A73E8" strokeWidth="3" strokeLinecap="round" />
          <path d="M15 26l3 3 7-8" stroke="#1A73E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1C1C1E" }}>No appointments today</p>
      <p style={{ margin: 0, fontSize: 14, color: "#6E6E73" }}>Tap + to schedule one</p>
      <button
        style={{
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 24px",
          borderRadius: 8,
          border: "none",
          background: "#1A73E8",
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 2px 8px rgba(26,115,232,0.3)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Add Appointment
      </button>
    </div>
  );
}

function DesktopApp() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState<NavSection>("schedule");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const total   = appointments.length;
  const show    = appointments.filter((a) => a.status === "Show").length;
  const pending = appointments.filter((a) => a.status === "Pending" || a.status === "Confirmed").length;
  const noShow  = appointments.filter((a) => a.status === "No Show").length;

  useEffect(() => {
    if (openMenuId === null) return;
    const h = () => setOpenMenuId(null);
    document.addEventListener("click", h, true);
    return () => document.removeEventListener("click", h, true);
  }, [openMenuId]);

  const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: "schedule", label: "Today's Schedule", icon: <CalendarIcon /> },
    { id: "patients", label: "Patients",          icon: <PersonIcon /> },
    { id: "lab",      label: "Lab",               icon: <FlaskIcon /> },
    { id: "settings", label: "Settings",          icon: <GearIcon /> },
  ];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        background: "#F7F8FA",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? 72 : 220,
          flexShrink: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#FFFFFF",
          borderRight: "1px solid #F0F0F2",
          transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 16px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <img
            src={cmdLogo}
            alt="CMD"
            style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
          />
          {!collapsed && (
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
                CMD
              </span>
              <span style={{ fontSize: 10, fontWeight: 500, color: "#6E6E73", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Center of Modern Dentistry
              </span>
            </div>
          )}
        </div>
        <nav style={{ flex: 1, padding: "4px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              active={activeNav === item.id}
              collapsed={collapsed}
              onClick={() => setActiveNav(item.id)}
            />
          ))}
        </nav>
        <div
          style={{
            padding: collapsed ? "12px 8px" : "12px",
            borderTop: "1px solid #F0F0F2",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              overflow: "hidden",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              DM
            </div>
            {!collapsed && (
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Dr. Mustafa
                </span>
                <span style={{ fontSize: 11, color: "#6E6E73", whiteSpace: "nowrap" }}>General Dentist</span>
              </div>
            )}
          </div>
          <button
            className="logout-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "8px" : "8px 10px",
              borderRadius: 8,
              border: "1.5px solid #FECACA",
              background: "transparent",
              color: "#EA4335",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
              fontFamily: "inherit",
            }}
            aria-label="Log Out"
            title={collapsed ? "Log Out" : undefined}
          >
            <LogOutIcon size={15} />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Header */}
        <header
          style={{
            height: 64,
            background: "#FFFFFF",
            borderBottom: "1px solid #F0F0F2",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 16,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1.5px solid #E5E7EB",
              background: "transparent",
              color: "#6E6E73",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F7F8FA"; (e.currentTarget as HTMLButtonElement).style.color = "#1C1C1E"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#6E6E73"; }}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <MenuIcon size={17} /> : <ChevronLeftIcon size={16} />}
          </button>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
              {activeNav === "schedule" ? "Today's Appointments" : activeNav === "patients" ? "Patients" : activeNav === "lab" ? "Lab" : "Settings"}
            </h1>
            <span style={{ fontSize: 12, color: "#6E6E73", fontWeight: 500 }}>
              {activeNav === "schedule" ? "Sunday, 6 September 2026" : activeNav === "patients" ? "Patient records & history" : activeNav === "lab" ? "Laboratory orders" : "Clinic configuration"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              style={{
                position: "relative",
                width: 38,
                height: 38,
                borderRadius: 10,
                border: "1.5px solid #E5E7EB",
                background: "transparent",
                color: "#6E6E73",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Notifications"
            >
              <BellIcon size={18} />
              <span
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#EA4335",
                  border: "1.5px solid white",
                }}
              />
            </button>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px 4px 4px",
                borderRadius: 10,
                border: "1.5px solid #E5E7EB",
                background: "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F7F8FA"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                DM
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1C1E" }}>Dr. Mustafa</span>
              <span style={{ color: "#6E6E73" }}><ChevronDownIcon size={14} /></span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: (activeNav === "patients" || activeNav === "settings") ? "hidden" : "auto", display: "flex", flexDirection: "column", ...((activeNav !== "patients" && activeNav !== "settings") && { padding: 24, gap: 20 }), ...(activeNav === "settings" && { padding: 24 }) }}>
          {activeNav === "patients" && <PatientsPage />}
          {activeNav === "settings" && <SettingsPage />}
          {activeNav === "schedule" && <>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <StatCard label="Total Today" value={total}   iconBg="#EBF2FF" iconColor="#1A73E8" icon={<CalendarIcon size={18} />} />
            <StatCard label="Show"        value={show}    iconBg="#EEFBF2" iconColor="#1E8A4A" icon={<CheckCircleIcon size={18} />} />
            <StatCard label="Pending"     value={pending} iconBg="#FFFBE6" iconColor="#A16207" icon={<ClockIcon size={18} />} />
            <StatCard label="No Show"     value={noShow}  iconBg="#FEF2F2" iconColor="#B91C1C" icon={<XCircleIcon size={18} />} />
          </div>

          {/* Appointments */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              overflow: "hidden",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderBottom: "1px solid #F0F0F2",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1C1C1E", letterSpacing: "-0.2px" }}>
                  Appointments
                </h2>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#EBF2FF",
                    color: "#1A73E8",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {appointments.length}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["All", "Show", "Pending", "No Show"] as const).map((f) => (
                  <button
                    key={f}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 8,
                      border: f === "All" ? "none" : "1.5px solid #E5E7EB",
                      background: f === "All" ? "#1A73E8" : "transparent",
                      color: f === "All" ? "#fff" : "#6E6E73",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => { if (f !== "All") { (e.currentTarget as HTMLButtonElement).style.background = "#F7F8FA"; (e.currentTarget as HTMLButtonElement).style.color = "#1C1C1E"; } }}
                    onMouseLeave={(e) => { if (f !== "All") { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#6E6E73"; } }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr auto auto",
                gap: 16,
                padding: "9px 24px",
                borderBottom: "1px solid #F0F0F2",
                background: "#FAFAFA",
              }}
            >
              {["Time", "Patient", "Status", "Actions"].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {h}
                </span>
              ))}
            </div>
            {appointments.length === 0 ? (
              <DesktopEmptyState />
            ) : (
              appointments.map((appt, i) => (
                <AppointmentRow
                  key={appt.id}
                  appt={appt}
                  openMenuId={openMenuId}
                  onMenuToggle={setOpenMenuId}
                  isLast={i === appointments.length - 1}
                />
              ))
            )}
          </div>
          </>}
          {activeNav === "lab" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "#9CA3AF", fontSize: 14 }}>
              This section is under construction.
            </div>
          )}
        </main>
      </div>

      {/* FAB */}
      <div style={{ position: "fixed", bottom: 32, right: 32 }}>
        <button
          className="fab-btn"
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "none",
            background: "#1A73E8",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(26, 115, 232, 0.4)",
            transition: "transform 0.15s, box-shadow 0.15s",
            position: "relative",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(26,115,232,0.5)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(26,115,232,0.4)"; }}
          aria-label="Add Appointment"
        >
          <PlusIcon size={24} />
          <span
            className="fab-tooltip"
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              right: 0,
              background: "#1C1C1E",
              color: "#fff",
              padding: "5px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Add Appointment
          </span>
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MOBILE COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function MobileStatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div
      style={{
        minWidth: 140,
        height: 88,
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        padding: "14px 14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: iconBg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: "#1C1C1E", lineHeight: 1, letterSpacing: "-0.5px" }}>
          {value}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function MobileAppointmentCard({ appt }: { appt: Appointment }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const isOpenRef = useRef(false);
  const REVEAL = 168;

  const slide = (offset: number, animate: boolean) => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = animate
      ? "transform 0.22s cubic-bezier(0.4,0,0.2,1)"
      : "none";
    cardRef.current.style.transform = `translateX(${offset}px)`;
  };

  const handleStart = (clientX: number) => {
    startXRef.current = clientX;
    if (cardRef.current) cardRef.current.style.transition = "none";
  };

  const handleMove = (clientX: number, buttons?: number) => {
    if (buttons !== undefined && buttons !== 1) return;
    const dx = clientX - startXRef.current;
    const base = isOpenRef.current ? -REVEAL : 0;
    const next = Math.max(Math.min(base + dx, 0), -REVEAL);
    if (cardRef.current) {
      cardRef.current.style.transition = "none";
      cardRef.current.style.transform = `translateX(${next}px)`;
    }
  };

  const handleEnd = (clientX: number) => {
    const dx = clientX - startXRef.current;
    let final: number;
    if (!isOpenRef.current && dx < -50) {
      final = -REVEAL;
      isOpenRef.current = true;
    } else if (isOpenRef.current && dx > 50) {
      final = 0;
      isOpenRef.current = false;
    } else {
      final = isOpenRef.current ? -REVEAL : 0;
    }
    slide(final, true);
  };

  const [timePart, ampm] = appt.time.replace(/^0/, "").split(" ");

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Action buttons — revealed on swipe */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          display: "flex",
          width: REVEAL,
        }}
      >
        {[
          { label: "View",       icon: <EyeIcon size={15} />,      bg: "#1A73E8" },
          { label: "Reschedule", icon: <RefreshIcon size={15} />,  bg: "#FBBC04" },
          { label: "Cancel",     icon: <XCircleIcon size={15} />,  bg: "#EA4335" },
        ].map(({ label, icon, bg }) => (
          <button
            key={label}
            onClick={() => { slide(0, true); isOpenRef.current = false; }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              background: bg,
              border: "none",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Card content */}
      <div
        ref={cardRef}
        className="swipe-card"
        style={{
          background: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          padding: "14px 16px",
          gap: 12,
          position: "relative",
          zIndex: 1,
          cursor: "grab",
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX, e.buttons)}
        onMouseUp={(e) => handleEnd(e.clientX)}
        onMouseLeave={(e) => { if (e.buttons === 1) handleEnd(e.clientX); }}
      >
        {/* Time */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 48,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, color: "#1A73E8", lineHeight: 1, letterSpacing: "-0.3px" }}>
            {timePart}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#6E6E73",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {ampm}
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 38, background: "#E5E7EB", flexShrink: 0 }} />

        {/* Patient */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: appt.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {appt.initials}
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#1C1C1E",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {appt.patient}
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              color: "#6E6E73",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              paddingLeft: 33,
            }}
          >
            {appt.treatment}
          </span>
        </div>

        {/* Status + chevron hint */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <StatusPill status={appt.status} />
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3 1.5l3.5 3.5L3 8.5" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function DoctorBottomSheet({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      {/* Overlay */}
      <div
        className="overlay-enter"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)",
        }}
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
          padding: "12px 24px 40px",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 36,
            height: 4,
            background: "#E5E7EB",
            borderRadius: 2,
            margin: "0 auto 24px",
          }}
        />

        {/* Doctor info */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            DM
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.3px" }}>
              Dr. Mustafa
            </span>
            <span style={{ fontSize: 13, color: "#6E6E73", fontWeight: 500 }}>General Dentist</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
                padding: "2px 8px",
                borderRadius: 6,
                background: "#EEFBF2",
                color: "#1E8A4A",
                fontSize: 11,
                fontWeight: 700,
                width: "fit-content",
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34A853", display: "inline-block" }} />
              On Duty
            </span>
          </div>
        </div>

        {/* Log Out */}
        <button
          style={{
            width: "100%",
            height: 50,
            borderRadius: 12,
            border: "1.5px solid #FECACA",
            background: "transparent",
            color: "#EA4335",
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <LogOutIcon size={17} />
          Log Out
        </button>
      </div>
    </div>
  );
}

function MobileTabBar({
  active,
  onChange,
}: {
  active: NavSection;
  onChange: (s: NavSection) => void;
}) {
  const tabs: { id: NavSection; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    {
      id: "schedule",
      label: "Schedule",
      icon: (a) => <CalendarIcon size={a ? 22 : 20} />,
    },
    {
      id: "patients",
      label: "Patients",
      icon: (a) => <PersonIcon size={a ? 22 : 20} />,
    },
    {
      id: "lab",
      label: "Lab",
      icon: (a) => <FlaskIcon size={a ? 22 : 20} />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: (a) => <GearIcon size={a ? 22 : 20} />,
    },
  ];

  return (
    <nav
      className="tab-bar-safe"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: "#FFFFFF",
        borderTop: "1px solid #E5E7EB",
        display: "flex",
        zIndex: 100,
      }}
    >
      {tabs.map(({ id, label, icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              border: "none",
              background: "transparent",
              color: isActive ? "#1A73E8" : "#6E6E73",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: "4px 0 0",
              position: "relative",
            }}
            aria-label={label}
          >
            {/* Active dot indicator */}
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#1A73E8",
                }}
              />
            )}
            <span style={{ marginTop: isActive ? 6 : 0, transition: "margin 0.15s" }}>
              {icon(isActive)}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.01em",
                transition: "font-weight 0.1s",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function MobileApp() {
  const [activeTab, setActiveTab] = useState<NavSection>("schedule");
  const [showSheet, setShowSheet] = useState(false);

  const total   = appointments.length;
  const show    = appointments.filter((a) => a.status === "Show").length;
  const pending = appointments.filter((a) => a.status === "Pending" || a.status === "Confirmed").length;
  const noShow  = appointments.filter((a) => a.status === "No Show").length;

  const hasAppointments = appointments.length > 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#F7F8FA",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          height: 60,
          background: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Left: logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src={cmdLogo}
            alt="CMD"
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }}
          />
          <span style={{ fontSize: 15, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.3px" }}>CMD</span>
        </div>

        {/* Center: page title */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.3px" }}>Today</span>
          <span style={{ fontSize: 10, color: "#6E6E73", fontWeight: 500 }}>Sun, 6 Sep 2026</span>
        </div>

        {/* Right: avatar */}
        <button
          onClick={() => setShowSheet(true)}
          style={{
            marginLeft: "auto",
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)",
            border: "2px solid #E0EEFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
            color: "#fff",
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label="Doctor profile"
        >
          DM
        </button>
      </header>

      {/* Patients tab — fills content area, manages its own scroll */}
      {activeTab === "patients" && (
        <div style={{ flex: 1, overflow: "hidden" }}>
          <MobilePatientsPage />
        </div>
      )}

      {/* Settings tab */}
      {activeTab === "settings" && (
        <div style={{ flex: 1, overflow: "hidden" }}>
          <MobileSettingsPage />
        </div>
      )}

      {/* Schedule content — scrollable */}
      {activeTab === "schedule" && <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: hasAppointments ? 140 : 80,
        }}
      >
        {/* Date & greeting */}
        <div style={{ padding: "20px 16px 0" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#6E6E73", fontWeight: 500 }}>
            Good morning, Dr. Mustafa 👋
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.4px" }}>
            {"Today's Overview"}
          </h2>
        </div>

        {/* Stat cards — horizontal scroll */}
        <div
          className="hide-scroll"
          style={{
            display: "flex",
            gap: 12,
            padding: "16px 16px 0",
            overflowX: "auto",
          }}
        >
          <MobileStatCard label="Total Today" value={total}   iconBg="#EBF2FF" iconColor="#1A73E8" icon={<CalendarIcon size={15} />} />
          <MobileStatCard label="Show"         value={show}    iconBg="#EEFBF2" iconColor="#1E8A4A" icon={<CheckCircleIcon size={15} />} />
          <MobileStatCard label="Pending"      value={pending} iconBg="#FFFBE6" iconColor="#A16207" icon={<ClockIcon size={15} />} />
          <MobileStatCard label="No Show"      value={noShow}  iconBg="#FEF2F2" iconColor="#B91C1C" icon={<XCircleIcon size={15} />} />
        </div>

        {/* Appointments section */}
        {hasAppointments ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 16px 12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.2px" }}>
                  Appointments
                </h3>
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 6,
                    background: "#EBF2FF",
                    color: "#1A73E8",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {appointments.length}
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#6E6E73", fontWeight: 500 }}>
                ← swipe to act
              </span>
            </div>

            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {appointments.map((appt) => (
                <MobileAppointmentCard key={appt.id} appt={appt} />
              ))}
            </div>
          </>
        ) : (
          /* Empty state */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 32px 32px",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: "#EBF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                <rect x="4" y="8" width="32" height="28" rx="4" fill="#BFDBFE" />
                <rect x="4" y="8" width="32" height="9" rx="4" fill="#1A73E8" />
                <line x1="14" y1="4" x2="14" y2="12" stroke="#1A73E8" strokeWidth="3" strokeLinecap="round" />
                <line x1="26" y1="4" x2="26" y2="12" stroke="#1A73E8" strokeWidth="3" strokeLinecap="round" />
                <path d="M15 26l3 3 7-8" stroke="#1A73E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1C1C1E" }}>
              No appointments today
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#6E6E73" }}>Tap + to schedule one</p>
          </div>
        )}
      </div>}

      {/* FAB — just above tab bar, when appointments exist */}
      {activeTab === "schedule" && hasAppointments && (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            right: 20,
            zIndex: 50,
          }}
        >
          <button
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              border: "none",
              background: "#1A73E8",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(26,115,232,0.4)",
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            aria-label="Add Appointment"
          >
            <PlusIcon size={22} />
          </button>
        </div>
      )}

      {/* Full-width Add button — empty state only, fixed above tab bar */}
      {activeTab === "schedule" && !hasAppointments && (
        <div
          style={{
            position: "fixed",
            bottom: 72,
            left: 16,
            right: 16,
            zIndex: 50,
          }}
        >
          <button
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: "none",
              background: "#1A73E8",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(26,115,232,0.35)",
            }}
          >
            <PlusIcon size={18} />
            Add Appointment
          </button>
        </div>
      )}

      {/* Bottom tab bar */}
      <MobileTabBar active={activeTab} onChange={setActiveTab} />

      {/* Doctor bottom sheet */}
      {showSheet && <DoctorBottomSheet onClose={() => setShowSheet(false)} />}
    </div>
  );
}

// ── Root: responsive selector ─────────────────────────────────────────────────

export default function App() {
  const width = useWindowWidth();
  return width < 700 ? <MobileApp /> : <DesktopApp />;
}
