import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SettingsScreen =
  | "main" | "profile" | "security" | "notifications"
  | "clinic-info" | "working-hours" | "services" | "staff"
  | "integrations" | "billing" | "privacy";

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="13.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function BellIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5a6 6 0 016 6v3l1.5 2.5h-15L4 11.5v-3a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 15.5c0 1.105.895 2 2 2s2-.895 2-2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BuildingIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3.5" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7.5h16" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7" y="11" width="6" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="4.5" y="9.5" width="2.5" height="2.5" rx="0.5" fill="currentColor" />
      <rect x="13" y="9.5" width="2.5" height="2.5" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function ClockIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ToothIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M6.5 3C5 3 3 4.5 3 7c0 2 .5 4 1 5.5C4.5 14 5 17 6 17s1-2 2-2 1 2 2 2 1.5-3 2-4.5c.5-1.5 1-3.5 1-5.5 0-2.5-2-4-3.5-4C8.5 3 7.5 4 7.5 4S7 3 6.5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function PeopleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="7.5" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 17c0-2.761 2.462-5 5.5-5s5.5 2.239 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16.5 17c0-2.21-1.12-4.096-2.799-5.08" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PlugIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 6h12v3a6 6 0 01-12 0V6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 15v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CreditCardIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="9" x2="18" y2="9" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="12" width="4" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5l7 3v4.5c0 3.5-2.8 6.5-7 8-4.2-1.5-7-4.5-7-8V5.5l7-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 10.5l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M8 3H4a1 1 0 00-1 1v12a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 7l4 3-4 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 10H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="8" rx="6" ry="4" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}

function EyeOffIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6.2 5.4A5.8 5.8 0 002 8c1.1 1.8 3.2 3 6 3 .8 0 1.5-.1 2.2-.3M13.8 6.5A5.8 5.8 0 0114 8c-1.1 1.8-3.2 3-6 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2.5 4h11M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6 7v5M10 7v5M3.5 4l.5 9a1 1 0 001 1h6a1 1 0 001-1l.5-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M9.5 2l2.5 2.5L4 12.5H1.5V10L9.5 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7l3.5 3.5 6-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Shared Data ───────────────────────────────────────────────────────────────

const SERVICE_COLORS = ["#1A73E8","#34A853","#FBBC04","#EA4335","#9C27B0","#FF5722","#00BCD4","#607D8B"];

interface Service { id: number; name: string; duration: string; price: number; color: string; active: boolean; }
const initialServices: Service[] = [
  { id: 1, name: "Dental Cleaning & Scaling", duration: "45", price: 200,  color: "#1A73E8", active: true  },
  { id: 2, name: "Root Canal Treatment",       duration: "90", price: 800,  color: "#EA4335", active: true  },
  { id: 3, name: "Teeth Whitening",            duration: "60", price: 600,  color: "#FBBC04", active: true  },
  { id: 4, name: "Dental Crown Fitting",       duration: "90", price: 1200, color: "#9C27B0", active: true  },
  { id: 5, name: "Orthodontic Consultation",   duration: "30", price: 150,  color: "#34A853", active: true  },
  { id: 6, name: "Composite Filling",          duration: "45", price: 300,  color: "#FF5722", active: true  },
  { id: 7, name: "Tooth Extraction",           duration: "30", price: 250,  color: "#00BCD4", active: true  },
];

interface StaffMember { id: number; name: string; role: string; initials: string; color: string; active: boolean; }
const initialStaff: StaffMember[] = [
  { id: 1, name: "Dr. Mustafa Al-Rahman", role: "Lead Dentist",    initials: "MA", color: "#673AB7", active: true  },
  { id: 2, name: "Dr. Layla Hassan",       role: "Orthodontist",   initials: "LH", color: "#FF7B7B", active: true  },
  { id: 3, name: "Dr. Omar Khalid",        role: "Periodontist",   initials: "OK", color: "#34A853", active: true  },
  { id: 4, name: "Sara Al-Mansoori",       role: "Head Nurse",     initials: "SA", color: "#607D8B", active: true  },
  { id: 5, name: "Fatima Al-Jabri",        role: "Receptionist",   initials: "FA", color: "#5AC8FA", active: true  },
  { id: 6, name: "Mohammed Rizwan",        role: "Lab Technician", initials: "MR", color: "#7B68EE", active: false },
];

// ── Reusable UI ───────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(); }}
      role="switch"
      aria-checked={on}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? "#1A73E8" : "#D1D5DB",
        border: "none", cursor: "pointer",
        position: "relative", flexShrink: 0,
        transition: "background 0.2s ease", padding: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: on ? 22 : 2,
        width: 20, height: 20, borderRadius: "50%",
        background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        transition: "left 0.2s ease", display: "block",
      }} />
    </button>
  );
}

interface MobileInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  suffix?: ReactNode;
}

function MobileInput({ label, type = "text", placeholder, value = "", onChange, suffix }: MobileInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#1C1C1E" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", height: 48,
            border: `1.5px solid ${focused ? "#1A73E8" : "#E5E7EB"}`,
            borderRadius: 12, padding: suffix ? "0 48px 0 14px" : "0 14px",
            fontSize: 15, color: "#1C1C1E", background: "#FFFFFF",
            outline: "none", fontFamily: "inherit",
            transition: "border-color 0.15s ease", boxSizing: "border-box",
          }}
        />
        {suffix && (
          <div style={{ position: "absolute", right: 14, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}

interface MobileSelectProps {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  options: { value: string; label: string }[];
}

function MobileSelect({ label, value = "", onChange, options }: MobileSelectProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#1C1C1E" }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 48, border: `1.5px solid ${focused ? "#1A73E8" : "#E5E7EB"}`,
          borderRadius: 12, padding: "0 40px 0 14px",
          fontSize: 15, color: "#1C1C1E", background: "#FFFFFF",
          outline: "none", fontFamily: "inherit", cursor: "pointer",
          appearance: "none",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%236E6E73' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// Bottom sheet with drag handle
interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

function MobileBottomSheet({ title, onClose, children }: BottomSheetProps) {
  return (
    <>
      <div
        className="overlay-enter"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 400,
          background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)",
        }}
      />
      <div
        className="sheet-enter"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 401,
          background: "#FFFFFF", borderRadius: "24px 24px 0 0",
          maxHeight: "88vh", display: "flex", flexDirection: "column",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
        }}
      >
        {/* drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E5E7EB" }} />
        </div>
        {/* header */}
        <div style={{
          padding: "12px 20px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid #F3F4F6", flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1C1C1E" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: "#F3F4F6", border: "none", width: 32, height: 32,
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "#6E6E73",
            }}
          >
            <XIcon />
          </button>
        </div>
        {/* scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
          {children}
        </div>
      </div>
    </>
  );
}

// Mobile-native style confirm (action sheet from bottom)
interface MobileConfirmProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

function MobileConfirm({ title, message, confirmLabel, onConfirm, onCancel, danger = true }: MobileConfirmProps) {
  return (
    <>
      <div
        className="overlay-enter"
        onClick={onCancel}
        style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.35)" }}
      />
      <div
        className="sheet-enter"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 501,
          background: "transparent", padding: "0 16px",
          paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Main action card */}
        <div style={{ background: "#FFFFFF", borderRadius: 16, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ padding: "16px 16px 12px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
            <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>{title}</p>
            <p style={{ margin: 0, fontSize: 13, color: "#6E6E73", lineHeight: 1.5 }}>{message}</p>
          </div>
          <button
            onClick={onConfirm}
            style={{
              width: "100%", height: 52, border: "none",
              background: "none", color: danger ? "#EA4335" : "#1A73E8",
              fontSize: 16, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {confirmLabel}
          </button>
        </div>
        {/* Cancel as separate pill */}
        <button
          onClick={onCancel}
          style={{
            width: "100%", height: 52, border: "none",
            background: "#FFFFFF", borderRadius: 14,
            color: "#1C1C1E", fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Cancel
        </button>
      </div>
    </>
  );
}

// ── PushedScreen container ────────────────────────────────────────────────────

interface PushedScreenProps {
  title: string;
  onBack: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

function PushedScreen({ title, onBack, footer, children }: PushedScreenProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", background: "#F7F8FA",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        height: 56, background: "#FFFFFF",
        borderBottom: "1px solid #F3F4F6",
        display: "flex", alignItems: "center",
        padding: "0 4px 0 0", flexShrink: 0, position: "relative",
      }}>
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 2,
            height: 56, padding: "0 12px",
            background: "none", border: "none",
            color: "#1A73E8", cursor: "pointer",
            fontSize: 15, fontWeight: 600, fontFamily: "inherit",
          }}
        >
          <BackArrowIcon />
          Back
        </button>
        <h1 style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          margin: 0, fontSize: 17, fontWeight: 700, color: "#1C1C1E",
          whiteSpace: "nowrap",
        }}>
          {title}
        </h1>
      </div>
      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </div>
      {/* Pinned footer */}
      {footer && (
        <div style={{
          flexShrink: 0, background: "#FFFFFF",
          borderTop: "1px solid #F3F4F6",
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}

// ── Settings list primitives ──────────────────────────────────────────────────

function SettingsRow({
  icon, label, subtitle, rightNode, onTap, danger = false, first = false, last = false
}: {
  icon?: ReactNode;
  label: string;
  subtitle?: string;
  rightNode?: ReactNode;
  onTap?: () => void;
  danger?: boolean;
  first?: boolean;
  last?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onTap}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: "100%", minHeight: 52,
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 14px",
        background: pressed ? "#F3F4F6" : "#FFFFFF",
        border: "none", cursor: "pointer",
        borderBottom: last ? "none" : "1px solid #F3F4F6",
        borderRadius: first && last ? 12 : first ? "12px 12px 0 0" : last ? "0 0 12px 12px" : 0,
        textAlign: "left", fontFamily: "inherit",
        transition: "background 0.08s ease",
      }}
    >
      {icon && (
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: danger ? "#FEF2F2" : "#EBF2FF",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: danger ? "#EA4335" : "#1A73E8", flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: danger ? "#EA4335" : "#1C1C1E" }}>{label}</p>
        {subtitle && <p style={{ margin: "1px 0 0", fontSize: 12, color: "#9CA3AF" }}>{subtitle}</p>}
      </div>
      {rightNode !== undefined ? (
        <div style={{ flexShrink: 0 }}>{rightNode}</div>
      ) : onTap ? (
        <span style={{ color: "#C7C7CC", flexShrink: 0 }}><ChevronRightIcon /></span>
      ) : null}
    </button>
  );
}

// ── Profile Screen ────────────────────────────────────────────────────────────

function ProfileScreen({ onBack }: { onBack: () => void }) {
  const [firstName, setFirstName] = useState("Mustafa");
  const [lastName, setLastName] = useState("Al-Rahman");
  const [email, setEmail] = useState("mustafa@cmdclinic.ae");
  const [phone, setPhone] = useState("+971 50 123 4567");
  const [specialty, setSpecialty] = useState("General Dentistry");
  const [license, setLicense] = useState("UAE-DEN-2019-04821");

  const footer = (
    <button style={{
      width: "100%", height: 52, borderRadius: 12, border: "none",
      background: "#1A73E8", color: "#FFFFFF",
      fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    }}>
      Save Changes
    </button>
  );

  return (
    <PushedScreen title="Profile" onBack={onBack} footer={footer}>
      <div style={{ padding: "28px 16px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#673AB7",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: "#FFFFFF",
          marginBottom: 12, letterSpacing: "-0.5px",
        }}>
          MA
        </div>
        <button style={{ background: "none", border: "none", color: "#1A73E8", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Edit Photo
        </button>
      </div>
      <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <MobileInput label="First Name" value={firstName} onChange={setFirstName} />
        <MobileInput label="Last Name" value={lastName} onChange={setLastName} />
        <MobileInput label="Email" type="email" value={email} onChange={setEmail} />
        <MobileInput label="Phone" value={phone} onChange={setPhone} />
        <MobileInput label="Specialty" value={specialty} onChange={setSpecialty} />
        <MobileInput label="License Number" value={license} onChange={setLicense} />
      </div>
    </PushedScreen>
  );
}

// ── Security Screen ───────────────────────────────────────────────────────────

function SecurityScreen({ onBack }: { onBack: () => void }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFA, setTwoFA] = useState(true);

  const eye = (show: boolean, toggle: () => void) => (
    <button onClick={toggle} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, display: "flex", alignItems: "center" }}>
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );

  return (
    <PushedScreen title="Security" onBack={onBack}>
      <div style={{ padding: "20px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        <MobileInput label="Current Password" type={showCurrent ? "text" : "password"} placeholder="••••••••" value={currentPw} onChange={setCurrentPw} suffix={eye(showCurrent, () => setShowCurrent(!showCurrent))} />
        <MobileInput label="New Password" type={showNew ? "text" : "password"} placeholder="••••••••" value={newPw} onChange={setNewPw} suffix={eye(showNew, () => setShowNew(!showNew))} />
        <MobileInput label="Confirm New Password" type={showConfirm ? "text" : "password"} placeholder="••••••••" value={confirmPw} onChange={setConfirmPw} suffix={eye(showConfirm, () => setShowConfirm(!showConfirm))} />
        <button style={{
          width: "100%", height: 52, borderRadius: 12, border: "none",
          background: "#1A73E8", color: "#FFFFFF",
          fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          marginTop: 4,
        }}>
          Update Password
        </button>
      </div>

      {/* Divider with OR */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 16px" }}>
        <hr style={{ flex: 1, border: "none", borderTop: "1px solid #E5E7EB" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF" }}>OR</span>
        <hr style={{ flex: 1, border: "none", borderTop: "1px solid #E5E7EB" }} />
      </div>

      {/* 2FA */}
      <div style={{ margin: "0 16px 24px" }}>
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 2 }}>
          Two-Factor Authentication
        </p>
        <div style={{ background: "#FFFFFF", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 14px", minHeight: 64,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 600, color: "#1C1C1E" }}>Authenticator App</p>
              <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF", lineHeight: 1.4 }}>Use an authenticator app to generate one-time codes</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 12 }}>
              <span style={{
                height: 22, padding: "0 8px", borderRadius: 6,
                background: twoFA ? "#EEFBF2" : "#F3F4F6",
                color: twoFA ? "#1E8A4A" : "#9CA3AF",
                fontSize: 11, fontWeight: 700,
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: twoFA ? "#34A853" : "#D1D5DB" }} />
                {twoFA ? "Enabled" : "Disabled"}
              </span>
              <Toggle on={twoFA} onChange={() => setTwoFA(!twoFA)} />
            </div>
          </div>
        </div>
      </div>
    </PushedScreen>
  );
}

// ── Notifications Screen ──────────────────────────────────────────────────────

type NotifKey = "reminders" | "bookings" | "cancellations" | "labResults" | "push" | "sms";

function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    reminders: true, bookings: true, cancellations: true,
    labResults: false, push: true, sms: false,
  });
  const toggle = (k: NotifKey) => setNotifs(prev => ({ ...prev, [k]: !prev[k] }));

  const groups: { label: string; items: { k: NotifKey; label: string; desc: string }[] }[] = [
    { label: "Email", items: [
      { k: "reminders", label: "Appointment Reminders", desc: "24 hrs before each appointment" },
      { k: "bookings", label: "New Bookings", desc: "When a new appointment is scheduled" },
      { k: "cancellations", label: "Cancellations", desc: "When an appointment is cancelled" },
      { k: "labResults", label: "Lab Results", desc: "Receive lab results by email" },
    ]},
    { label: "Other", items: [
      { k: "push", label: "Push Notifications", desc: "Browser and mobile push alerts" },
      { k: "sms", label: "SMS Alerts", desc: "Text message appointment reminders" },
    ]},
  ];

  const footer = (
    <button style={{
      width: "100%", height: 52, borderRadius: 12, border: "none",
      background: "#1A73E8", color: "#FFFFFF", fontSize: 16, fontWeight: 700,
      cursor: "pointer", fontFamily: "inherit",
    }}>
      Save Preferences
    </button>
  );

  return (
    <PushedScreen title="Notifications" onBack={onBack} footer={footer}>
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {groups.map(group => (
          <div key={group.label}>
            <p style={{ margin: "0 0 8px 2px", fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {group.label}
            </p>
            <div style={{ background: "#FFFFFF", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              {group.items.map((item, i) => (
                <div key={item.k} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 14px",
                  borderBottom: i < group.items.length - 1 ? "1px solid #F3F4F6" : "none",
                  minHeight: 52,
                }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 500, color: "#1C1C1E" }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>{item.desc}</p>
                  </div>
                  <Toggle on={notifs[item.k]} onChange={() => toggle(item.k)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PushedScreen>
  );
}

// ── Clinic Information Screen ─────────────────────────────────────────────────

function ClinicInfoScreen({ onBack }: { onBack: () => void }) {
  const [clinicName, setClinicName] = useState("CMD — Center of Modern Dentistry");
  const [street, setStreet] = useState("Al Wasl Road, Jumeirah 1");
  const [city, setCity] = useState("Dubai");
  const [country, setCountry] = useState("United Arab Emirates");
  const [phone, setPhone] = useState("+971 4 321 0000");
  const [email, setEmail] = useState("hello@cmdclinic.ae");
  const [website, setWebsite] = useState("www.cmdclinic.ae");

  const footer = (
    <button style={{
      width: "100%", height: 52, borderRadius: 12, border: "none",
      background: "#1A73E8", color: "#FFFFFF", fontSize: 16, fontWeight: 700,
      cursor: "pointer", fontFamily: "inherit",
    }}>
      Save Changes
    </button>
  );

  return (
    <PushedScreen title="Clinic Information" onBack={onBack} footer={footer}>
      <div style={{ padding: "20px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <MobileInput label="Clinic Name" value={clinicName} onChange={setClinicName} />
        <MobileInput label="Street Address" value={street} onChange={setStreet} />
        <MobileInput label="City" value={city} onChange={setCity} />
        <MobileInput label="Country" value={country} onChange={setCountry} />
        <MobileInput label="Phone" value={phone} onChange={setPhone} />
        <MobileInput label="Email" type="email" value={email} onChange={setEmail} />
        <MobileInput label="Website" value={website} onChange={setWebsite} />
        {/* Logo upload zone */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1C1C1E", marginBottom: 10 }}>Clinic Logo</label>
          <div style={{
            height: 72, borderRadius: 12, border: "2px dashed #D1D5DB",
            background: "#FAFAFA", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer",
          }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#6E6E73" }}>Upload Logo</p>
            <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>PNG, SVG — max 1 MB</p>
          </div>
        </div>
      </div>
    </PushedScreen>
  );
}

// ── Working Hours Screen ──────────────────────────────────────────────────────

interface DayHours { open: boolean; from: string; to: string; }
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const defaultHours: DayHours[] = [
  { open: true,  from: "09:00", to: "17:00" },
  { open: true,  from: "09:00", to: "17:00" },
  { open: true,  from: "09:00", to: "17:00" },
  { open: true,  from: "09:00", to: "17:00" },
  { open: true,  from: "09:00", to: "17:00" },
  { open: true,  from: "09:00", to: "14:00" },
  { open: false, from: "09:00", to: "17:00" },
];

function WorkingHoursScreen({ onBack }: { onBack: () => void }) {
  const [hours, setHours] = useState<DayHours[]>(defaultHours);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const update = (i: number, patch: Partial<DayHours>) =>
    setHours(prev => prev.map((h, idx) => idx === i ? { ...h, ...patch } : h));

  const toggleDay = (i: number) => {
    const wasOpen = hours[i].open;
    update(i, { open: !wasOpen });
    if (!wasOpen) setExpandedDay(i);
    else if (expandedDay === i) setExpandedDay(null);
  };

  const tapRow = (i: number) => {
    if (!hours[i].open) return;
    setExpandedDay(expandedDay === i ? null : i);
  };

  const footer = (
    <button style={{
      width: "100%", height: 52, borderRadius: 12, border: "none",
      background: "#1A73E8", color: "#FFFFFF", fontSize: 16, fontWeight: 700,
      cursor: "pointer", fontFamily: "inherit",
    }}>
      Save Hours
    </button>
  );

  return (
    <PushedScreen title="Working Hours" onBack={onBack} footer={footer}>
      <div style={{ padding: "16px 16px 24px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {DAYS.map((day, i) => {
            const h = hours[i];
            const isExpanded = expandedDay === i && h.open;
            return (
              <div key={day} style={{ borderBottom: i < DAYS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                {/* Day row */}
                <div
                  onClick={() => tapRow(i)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0 14px", minHeight: 56, cursor: h.open ? "pointer" : "default",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {h.open && (
                      <span style={{
                        color: "#C7C7CC", display: "flex", alignItems: "center",
                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}>
                        <ChevronRightIcon />
                      </span>
                    )}
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: h.open ? "#1C1C1E" : "#9CA3AF" }}>{day}</p>
                      {h.open && !isExpanded && (
                        <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>{h.from} – {h.to}</p>
                      )}
                    </div>
                  </div>
                  <Toggle on={h.open} onChange={() => toggleDay(i)} />
                </div>
                {/* Expanded time pickers */}
                {isExpanded && (
                  <div style={{ padding: "0 14px 16px 38px", display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6E6E73", marginBottom: 6 }}>Open</label>
                      <input
                        type="time"
                        value={h.from}
                        onChange={e => update(i, { from: e.target.value })}
                        style={{
                          width: "100%", height: 42, border: "1.5px solid #E5E7EB",
                          borderRadius: 10, padding: "0 10px", fontSize: 14,
                          color: "#1C1C1E", background: "#F7F8FA",
                          outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6E6E73", marginBottom: 6 }}>Close</label>
                      <input
                        type="time"
                        value={h.to}
                        onChange={e => update(i, { to: e.target.value })}
                        style={{
                          width: "100%", height: 42, border: "1.5px solid #E5E7EB",
                          borderRadius: 10, padding: "0 10px", fontSize: 14,
                          color: "#1C1C1E", background: "#F7F8FA",
                          outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PushedScreen>
  );
}

// ── Services Screen ───────────────────────────────────────────────────────────

const durationOptions = [
  { value: "15", label: "15 min" }, { value: "30", label: "30 min" },
  { value: "45", label: "45 min" }, { value: "60", label: "60 min" },
  { value: "75", label: "75 min" }, { value: "90", label: "90 min" },
  { value: "120", label: "2 hours" },
];

function ServiceSwipeCard({
  service, onEdit, onDelete, onToggle,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const isOpenRef = useRef(false);
  const didMoveRef = useRef(false);
  const REVEAL = 132;

  const slide = (offset: number, animate: boolean) => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = animate ? "transform 0.22s cubic-bezier(0.4,0,0.2,1)" : "none";
    cardRef.current.style.transform = `translateX(${offset}px)`;
  };

  const handleStart = (clientX: number) => {
    startXRef.current = clientX;
    didMoveRef.current = false;
  };
  const handleMove = (clientX: number) => {
    const dx = clientX - startXRef.current;
    if (Math.abs(dx) > 4) didMoveRef.current = true;
    const current = isOpenRef.current ? -REVEAL : 0;
    const next = Math.max(-REVEAL, Math.min(0, current + dx));
    slide(next, false);
  };
  const handleEnd = (clientX: number) => {
    if (!didMoveRef.current) {
      if (isOpenRef.current) { slide(0, true); isOpenRef.current = false; }
      return;
    }
    const dx = clientX - startXRef.current;
    if (dx < -40) { slide(-REVEAL, true); isOpenRef.current = true; }
    else { slide(0, true); isOpenRef.current = false; }
  };

  return (
    <div className="swipe-card" style={{ position: "relative", overflow: "hidden" }}>
      {/* Action buttons behind */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 0 }}>
        <button
          onClick={onEdit}
          style={{
            width: 64, height: "100%", border: "none",
            background: "#1A73E8", color: "#FFFFFF",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 3, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <EditIcon size={16} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>Edit</span>
        </button>
        <button
          onClick={onDelete}
          style={{
            width: 68, height: "100%", border: "none",
            background: "#EA4335", color: "#FFFFFF",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 3, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <TrashIcon size={16} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>Delete</span>
        </button>
      </div>
      {/* Card face */}
      <div
        ref={cardRef}
        style={{ background: "#FFFFFF", position: "relative", zIndex: 1 }}
        onMouseDown={e => handleStart(e.clientX)}
        onMouseMove={e => { if (e.buttons === 1) handleMove(e.clientX); }}
        onMouseUp={e => handleEnd(e.clientX)}
        onTouchStart={e => handleStart(e.touches[0].clientX)}
        onTouchMove={e => handleMove(e.touches[0].clientX)}
        onTouchEnd={e => handleEnd(e.changedTouches[0].clientX)}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 14px", minHeight: 64,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: service.color, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{service.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>{service.duration} min · AED {service.price.toLocaleString()}</p>
            </div>
          </div>
          <Toggle on={service.active} onChange={onToggle} />
        </div>
      </div>
    </div>
  );
}

function ServicesScreen({ onBack }: { onBack: () => void }) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [showSheet, setShowSheet] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Service | null>(null);
  const [formName, setFormName] = useState("");
  const [formDuration, setFormDuration] = useState("45");
  const [formPrice, setFormPrice] = useState("");
  const [formColor, setFormColor] = useState(SERVICE_COLORS[0]);

  const openAdd = () => {
    setEditingService(null);
    setFormName(""); setFormDuration("45"); setFormPrice(""); setFormColor(SERVICE_COLORS[0]);
    setShowSheet(true);
  };
  const openEdit = (s: Service) => {
    setEditingService(s);
    setFormName(s.name); setFormDuration(s.duration);
    setFormPrice(String(s.price)); setFormColor(s.color);
    setShowSheet(true);
  };
  const handleSave = () => {
    if (!formName.trim()) return;
    if (editingService) {
      setServices(prev => prev.map(s => s.id === editingService.id
        ? { ...s, name: formName, duration: formDuration, price: Number(formPrice), color: formColor }
        : s
      ));
    } else {
      const newId = Math.max(...services.map(s => s.id)) + 1;
      setServices(prev => [...prev, { id: newId, name: formName, duration: formDuration, price: Number(formPrice), color: formColor, active: true }]);
    }
    setShowSheet(false);
  };

  const footer = (
    <button
      onClick={openAdd}
      style={{
        width: "100%", height: 52, borderRadius: 12,
        border: "1.5px solid #1A73E8", background: "transparent",
        color: "#1A73E8", fontSize: 16, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      <PlusIcon size={18} />
      Add Service
    </button>
  );

  return (
    <PushedScreen title="Services & Treatments" onBack={onBack} footer={footer}>
      <div style={{ padding: "16px 16px 8px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {services.map((s, i) => (
            <div key={s.id} style={{ borderBottom: i < services.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <ServiceSwipeCard
                service={s}
                onEdit={() => openEdit(s)}
                onDelete={() => setDeleteConfirm(s)}
                onToggle={() => setServices(prev => prev.map(x => x.id === s.id ? { ...x, active: !x.active } : x))}
              />
            </div>
          ))}
        </div>
        <p style={{ margin: "10px 4px 0", fontSize: 12, color: "#9CA3AF" }}>Swipe left on a service to edit or delete it.</p>
      </div>

      {showSheet && (
        <MobileBottomSheet title={editingService ? "Edit Service" : "Add Service"} onClose={() => setShowSheet(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
            <MobileInput label="Service Name" value={formName} onChange={setFormName} placeholder="e.g. Dental Cleaning" />
            <MobileSelect label="Duration" value={formDuration} onChange={setFormDuration} options={durationOptions} />
            <MobileInput label="Price (AED)" type="number" value={formPrice} onChange={setFormPrice} placeholder="0" />
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1C1C1E", marginBottom: 10 }}>Calendar Color</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {SERVICE_COLORS.map(c => (
                  <button key={c} onClick={() => setFormColor(c)} style={{
                    width: 36, height: 36, borderRadius: "50%", background: c,
                    border: formColor === c ? "3px solid #1C1C1E" : "3px solid transparent",
                    cursor: "pointer", outline: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF",
                  }}>
                    {formColor === c && <CheckIcon size={14} />}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSave} style={{
              width: "100%", height: 52, borderRadius: 12, border: "none",
              background: "#1A73E8", color: "#FFFFFF", fontSize: 16, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", marginTop: 4,
            }}>
              {editingService ? "Save Changes" : "Add Service"}
            </button>
          </div>
        </MobileBottomSheet>
      )}

      {deleteConfirm && (
        <MobileConfirm
          title="Delete Service"
          message={`Delete "${deleteConfirm.name}"? This cannot be undone.`}
          confirmLabel="Delete Service"
          onConfirm={() => { setServices(prev => prev.filter(s => s.id !== deleteConfirm.id)); setDeleteConfirm(null); }}
          onCancel={() => setDeleteConfirm(null)}
          danger
        />
      )}
    </PushedScreen>
  );
}

// ── Staff Screen ──────────────────────────────────────────────────────────────

const roleOptions = [
  { value: "dentist", label: "Dentist" },
  { value: "specialist", label: "Specialist" },
  { value: "nurse", label: "Nurse" },
  { value: "receptionist", label: "Receptionist" },
  { value: "lab-tech", label: "Lab Technician" },
  { value: "admin", label: "Administrator" },
];

function StaffScreen({ onBack }: { onBack: () => void }) {
  const [staff] = useState<StaffMember[]>(initialStaff);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("dentist");

  const footer = (
    <button onClick={() => setShowInvite(true)} style={{
      width: "100%", height: 52, borderRadius: 12, border: "none",
      background: "#1A73E8", color: "#FFFFFF", fontSize: 16, fontWeight: 700,
      cursor: "pointer", fontFamily: "inherit",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    }}>
      <PlusIcon size={18} />
      Invite Staff
    </button>
  );

  return (
    <PushedScreen title="Staff Members" onBack={onBack} footer={footer}>
      <div style={{ padding: "16px 16px 8px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {staff.map((m, i) => (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              borderBottom: i < staff.length - 1 ? "1px solid #F3F4F6" : "none",
              minHeight: 64,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", background: m.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800, color: "#FFFFFF", flexShrink: 0,
              }}>
                {m.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>{m.role}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{
                  height: 22, padding: "0 8px", borderRadius: 6,
                  background: m.active ? "#EEFBF2" : "#F3F4F6",
                  color: m.active ? "#1E8A4A" : "#9CA3AF",
                  fontSize: 11, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", gap: 3,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.active ? "#34A853" : "#D1D5DB" }} />
                  {m.active ? "Active" : "Inactive"}
                </span>
                <button style={{
                  background: "none", border: "none", color: "#1A73E8",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0,
                }}>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showInvite && (
        <MobileBottomSheet title="Invite Staff Member" onClose={() => setShowInvite(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
            <MobileInput label="Email Address" type="email" value={inviteEmail} onChange={setInviteEmail} placeholder="colleague@example.com" />
            <MobileSelect label="Role" value={inviteRole} onChange={setInviteRole} options={roleOptions} />
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9CA3AF", lineHeight: 1.5 }}>
              An invitation will be sent to this email to join CMD clinic.
            </p>
            <button onClick={() => setShowInvite(false)} style={{
              width: "100%", height: 52, borderRadius: 12, border: "none",
              background: "#1A73E8", color: "#FFFFFF", fontSize: 16, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", marginTop: 4,
            }}>
              Send Invite
            </button>
          </div>
        </MobileBottomSheet>
      )}
    </PushedScreen>
  );
}

// ── Integrations Screen ───────────────────────────────────────────────────────

function GoogleLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#F3F4F6" />
      <path d="M28.3 18.2c0-.7-.1-1.3-.2-1.9H18v3.7h5.8c-.3 1.2-1 2.2-2.1 2.9v2.4h3.4c2-1.8 3.2-4.5 3.2-7.1z" fill="#4285F4" />
      <path d="M18 29c2.9 0 5.3-1 7.1-2.6l-3.4-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6-4.5H8.4v2.8C10.2 26.5 13.8 29 18 29z" fill="#34A853" />
      <path d="M12 20.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2v-2.8H8.4C7.5 14.7 7 16.3 7 18s.5 3.3 1.4 5l3.6-2.8z" fill="#FBBC05" />
      <path d="M18 12.5c1.6 0 3 .5 4.1 1.6l3.1-3.1C23.3 9.3 20.9 8 18 8c-4.2 0-7.8 2.5-9.6 6.2l3.6 2.8c.8-2.6 3.2-4.5 6-4.5z" fill="#EA4335" />
    </svg>
  );
}
function WhatsAppLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#25D366" />
      <path d="M24.8 11.2A9.5 9.5 0 008.5 21.7l-1.5 5.8 6-1.6a9.5 9.5 0 0011.8-14.7z" fill="#25D366" stroke="white" strokeWidth="1.2" />
      <path d="M22.2 20.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.7 1-1 1.2-.2.2-.4.2-.7 0-.3-.2-1.3-.5-2.5-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4-.1-.6-.1-.2-.7-1.7-.9-2.2-.2-.5-.5-.4-.7-.4h-.5c-.2 0-.5.1-.7.3C11.3 13 10.8 14 10.8 15.2c0 1.3.7 2.4.9 2.6.1.2 1.5 2.4 3.8 3.4.5.2 1 .3 1.3.4.5.2 1 .2 1.5.1.4-.1 1.4-.6 1.6-1.2.2-.5.2-1.1.1-1.2-.1-.1-.3-.2-.5-.3z" fill="white" />
    </svg>
  );
}
function TwilioLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#F22F46" />
      <circle cx="18" cy="18" r="7" stroke="white" strokeWidth="2.5" fill="none" />
      <circle cx="14" cy="14" r="2.2" fill="white" />
      <circle cx="22" cy="14" r="2.2" fill="white" />
      <circle cx="14" cy="22" r="2.2" fill="white" />
      <circle cx="22" cy="22" r="2.2" fill="white" />
    </svg>
  );
}

interface Integration { id: string; name: string; description: string; connected: boolean; logo: ReactNode; }

function IntegrationsScreen({ onBack }: { onBack: () => void }) {
  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: "gcal",     name: "Google Calendar",   description: "Sync appointments with Google Calendar",          connected: true,  logo: <GoogleLogo />   },
    { id: "whatsapp", name: "WhatsApp Business", description: "Send reminders and updates via WhatsApp",         connected: false, logo: <WhatsAppLogo /> },
    { id: "twilio",   name: "Twilio SMS",         description: "SMS alerts and appointment reminders",            connected: true,  logo: <TwilioLogo />   },
  ]);
  const [disconnectConfirm, setDisconnectConfirm] = useState<Integration | null>(null);

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: false } : i));
    setDisconnectConfirm(null);
  };

  return (
    <PushedScreen title="Integrations" onBack={onBack}>
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {integrations.map(int => (
          <div key={int.id} style={{
            background: "#FFFFFF", borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: 16,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <div style={{ flexShrink: 0 }}>{int.logo}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1C1C1E" }}>{int.name}</p>
                  <span style={{
                    height: 20, padding: "0 8px", borderRadius: 5,
                    background: int.connected ? "#EEFBF2" : "#F3F4F6",
                    color: int.connected ? "#1E8A4A" : "#9CA3AF",
                    fontSize: 11, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", gap: 3,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: int.connected ? "#34A853" : "#D1D5DB" }} />
                    {int.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#6E6E73" }}>{int.description}</p>
              </div>
            </div>
            {int.connected ? (
              <button
                onClick={() => setDisconnectConfirm(int)}
                style={{
                  width: "100%", height: 44, borderRadius: 10,
                  border: "1.5px solid #FCA5A5", background: "#FEF2F2",
                  color: "#EA4335", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => setIntegrations(prev => prev.map(i => i.id === int.id ? { ...i, connected: true } : i))}
                style={{
                  width: "100%", height: 44, borderRadius: 10, border: "none",
                  background: "#1A73E8", color: "#FFFFFF",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Connect
              </button>
            )}
          </div>
        ))}
      </div>

      {disconnectConfirm && (
        <MobileConfirm
          title="Disconnect Integration"
          message={`Disconnect ${disconnectConfirm.name}? Your sync data may be affected.`}
          confirmLabel="Disconnect"
          onConfirm={() => handleDisconnect(disconnectConfirm.id)}
          onCancel={() => setDisconnectConfirm(null)}
          danger
        />
      )}
    </PushedScreen>
  );
}

// ── Billing Screen ────────────────────────────────────────────────────────────

function BillingScreen({ onBack }: { onBack: () => void }) {
  const invoices = [
    { date: "Aug 2026", amount: 499, status: "Paid" as const },
    { date: "Jul 2026", amount: 499, status: "Paid" as const },
    { date: "Jun 2026", amount: 499, status: "Paid" as const },
    { date: "May 2026", amount: 499, status: "Paid" as const },
    { date: "Apr 2026", amount: 499, status: "Paid" as const },
  ];

  return (
    <PushedScreen title="Billing & Subscription" onBack={onBack}>
      <div style={{ padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Plan card */}
        <div style={{
          borderRadius: 14, padding: 20,
          background: "linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)",
          color: "#FFFFFF", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <span style={{
            display: "inline-block", padding: "3px 10px", borderRadius: 6,
            background: "rgba(255,255,255,0.2)",
            fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", marginBottom: 12,
          }}>
            PRO PLAN
          </span>
          <p style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" }}>
            AED 499<span style={{ fontSize: 14, fontWeight: 500, opacity: 0.8 }}>/mo</span>
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 12, opacity: 0.75 }}>Renews 1 October 2026</p>
          <button style={{
            width: "100%", height: 44, borderRadius: 10, border: "none",
            background: "#FFFFFF", color: "#1A73E8",
            fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            Upgrade Plan
          </button>
        </div>

        {/* Payment method */}
        <div>
          <p style={{ margin: "0 0 8px 2px", fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Payment Method
          </p>
          <div style={{ background: "#FFFFFF", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "14px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 48, height: 32, borderRadius: 6,
                  background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="34" height="20" viewBox="0 0 34 20" fill="none">
                    <circle cx="13" cy="10" r="7" fill="#EA4335" fillOpacity="0.9" />
                    <circle cx="21" cy="10" r="7" fill="#FBBC04" fillOpacity="0.9" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>Mastercard ••4821</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>Expires 09/2028</p>
                </div>
              </div>
              <button style={{ background: "none", border: "none", color: "#1A73E8", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Invoice history */}
        <div>
          <p style={{ margin: "0 0 8px 2px", fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Invoice History
          </p>
          <div style={{ background: "#FFFFFF", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            {invoices.map((inv, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 14px", minHeight: 56,
                borderBottom: i < invoices.length - 1 ? "1px solid #F3F4F6" : "none",
              }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600, color: "#1C1C1E" }}>{inv.date}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>AED {inv.amount}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    height: 22, padding: "0 8px", borderRadius: 5,
                    background: "#EEFBF2", color: "#1E8A4A",
                    fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center",
                  }}>
                    {inv.status}
                  </span>
                  <button style={{
                    width: 34, height: 34, borderRadius: 8,
                    border: "1.5px solid #E5E7EB", background: "#FFFFFF",
                    color: "#6E6E73", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <DownloadIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PushedScreen>
  );
}

// ── Data & Privacy Screen ─────────────────────────────────────────────────────

function PrivacyScreen({ onBack }: { onBack: () => void }) {
  const [analytics, setAnalytics] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <PushedScreen title="Data & Privacy" onBack={onBack}>
      <div style={{ padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <p style={{ margin: "0 0 8px 2px", fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Privacy Settings
          </p>
          <div style={{ background: "#FFFFFF", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", minHeight: 56, borderBottom: "1px solid #F3F4F6" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 500, color: "#1C1C1E" }}>Usage Analytics</p>
                <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>Share anonymous usage data</p>
              </div>
              <Toggle on={analytics} onChange={() => setAnalytics(!analytics)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", minHeight: 56 }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 500, color: "#1C1C1E" }}>Third-Party Sharing</p>
                <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>Share data with research partners</p>
              </div>
              <Toggle on={dataSharing} onChange={() => setDataSharing(!dataSharing)} />
            </div>
          </div>
        </div>

        <div>
          <p style={{ margin: "0 0 8px 2px", fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Data Export
          </p>
          <button style={{
            width: "100%", height: 52, borderRadius: 12,
            border: "1.5px solid #E5E7EB", background: "#FFFFFF",
            color: "#1C1C1E", fontSize: 15, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <DownloadIcon size={16} />
            Export All Data
          </button>
        </div>

        <div>
          <p style={{ margin: "0 0 8px 2px", fontSize: 12, fontWeight: 700, color: "#EA4335", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Danger Zone
          </p>
          <button
            onClick={() => setDeleteConfirm(true)}
            style={{
              width: "100%", height: 52, borderRadius: 12, border: "none",
              background: "#EA4335", color: "#FFFFFF",
              fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Delete Account
          </button>
        </div>
      </div>

      {deleteConfirm && (
        <MobileConfirm
          title="Delete Account"
          message="This will permanently delete all clinic data, patient records, and settings. This action cannot be undone."
          confirmLabel="Delete My Account"
          onConfirm={() => setDeleteConfirm(false)}
          onCancel={() => setDeleteConfirm(false)}
          danger
        />
      )}
    </PushedScreen>
  );
}

// ── Main Settings Screen ──────────────────────────────────────────────────────

interface MainSettingsProps {
  onNavigate: (s: SettingsScreen) => void;
  onLogOut: () => void;
}

function MainSettingsScreen({ onNavigate, onLogOut }: MainSettingsProps) {
  const groups = [
    {
      label: "Account",
      items: [
        {
          id: "profile" as SettingsScreen,
          type: "avatar" as const,
          label: "Dr. Mustafa",
          subtitle: "General Dentist",
        },
        { id: "security" as SettingsScreen, type: "icon" as const, label: "Security", icon: <LockIcon size={18} /> },
        { id: "notifications" as SettingsScreen, type: "icon" as const, label: "Notifications", icon: <BellIcon size={18} /> },
      ],
    },
    {
      label: "Clinic",
      items: [
        { id: "clinic-info" as SettingsScreen, type: "icon" as const, label: "Clinic Information", icon: <BuildingIcon size={18} /> },
        { id: "working-hours" as SettingsScreen, type: "icon" as const, label: "Working Hours", icon: <ClockIcon size={18} /> },
        { id: "services" as SettingsScreen, type: "icon" as const, label: "Services & Treatments", icon: <ToothIcon size={18} /> },
        { id: "staff" as SettingsScreen, type: "icon" as const, label: "Staff Members", icon: <PeopleIcon size={18} /> },
      ],
    },
    {
      label: "System",
      items: [
        { id: "integrations" as SettingsScreen, type: "icon" as const, label: "Integrations", icon: <PlugIcon size={18} /> },
        { id: "billing" as SettingsScreen, type: "icon" as const, label: "Billing & Subscription", icon: <CreditCardIcon size={18} /> },
        { id: "privacy" as SettingsScreen, type: "icon" as const, label: "Data & Privacy", icon: <ShieldIcon size={18} /> },
      ],
    },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
      {/* Page heading */}
      <div style={{ padding: "20px 16px 8px" }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.4px" }}>Settings</h1>
      </div>

      {groups.map(group => (
        <div key={group.label} style={{ marginBottom: 24 }}>
          <p style={{ margin: "0 0 6px 16px", fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {group.label}
          </p>
          <div style={{ margin: "0 16px", background: "#FFFFFF", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            {group.items.map((item, i) => {
              const isFirst = i === 0;
              const isLast = i === group.items.length - 1;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  style={{
                    width: "100%", minHeight: 56,
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px",
                    background: "#FFFFFF", border: "none",
                    borderBottom: isLast ? "none" : "1px solid #F3F4F6",
                    borderRadius: isFirst && isLast ? 12 : isFirst ? "12px 12px 0 0" : isLast ? "0 0 12px 12px" : 0,
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  {item.type === "avatar" ? (
                    <>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: "#673AB7", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 800, color: "#FFFFFF",
                      }}>
                        MA
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 1px", fontSize: 15, fontWeight: 700, color: "#1C1C1E" }}>{item.label}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>{item.subtitle}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: "#EBF2FF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#1A73E8", flexShrink: 0,
                      }}>
                        {item.icon}
                      </div>
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "#1C1C1E" }}>{item.label}</span>
                    </>
                  )}
                  <span style={{ color: "#C7C7CC", flexShrink: 0 }}><ChevronRightIcon /></span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Log Out button */}
      <div style={{ margin: "4px 16px 0" }}>
        <button
          onClick={onLogOut}
          style={{
            width: "100%", height: 52, borderRadius: 12, border: "none",
            background: "#EA4335", color: "#FFFFFF",
            fontSize: 16, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          <LogOutIcon />
          Log Out
        </button>
      </div>

      {/* Version */}
      <p style={{ textAlign: "center", fontSize: 12, color: "#C7C7CC", margin: "14px 0 0" }}>Version 1.0.0</p>
    </div>
  );
}

// ── Root Export ───────────────────────────────────────────────────────────────

export function MobileSettingsPage() {
  const [currentScreen, setCurrentScreen] = useState<SettingsScreen>("main");
  const [screenVisible, setScreenVisible] = useState(false);
  const [showLogOut, setShowLogOut] = useState(false);

  const navigateTo = (screen: SettingsScreen) => {
    setCurrentScreen(screen);
    requestAnimationFrame(() => setScreenVisible(true));
  };

  const goBack = () => {
    setScreenVisible(false);
    setTimeout(() => setCurrentScreen("main"), 320);
  };

  const subScreens: Partial<Record<SettingsScreen, ReactNode>> = {
    profile:       <ProfileScreen onBack={goBack} />,
    security:      <SecurityScreen onBack={goBack} />,
    notifications: <NotificationsScreen onBack={goBack} />,
    "clinic-info": <ClinicInfoScreen onBack={goBack} />,
    "working-hours": <WorkingHoursScreen onBack={goBack} />,
    services:      <ServicesScreen onBack={goBack} />,
    staff:         <StaffScreen onBack={goBack} />,
    integrations:  <IntegrationsScreen onBack={goBack} />,
    billing:       <BillingScreen onBack={goBack} />,
    privacy:       <PrivacyScreen onBack={goBack} />,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <MainSettingsScreen onNavigate={navigateTo} onLogOut={() => setShowLogOut(true)} />

      {/* Sub-screen overlay */}
      {currentScreen !== "main" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "#F7F8FA",
          transform: screenVisible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
        }}>
          {subScreens[currentScreen]}
        </div>
      )}

      {/* Log out confirm */}
      {showLogOut && (
        <MobileConfirm
          title="Log Out"
          message="Are you sure you want to log out of CMD?"
          confirmLabel="Log Out"
          onConfirm={() => setShowLogOut(false)}
          onCancel={() => setShowLogOut(false)}
          danger
        />
      )}
    </div>
  );
}
