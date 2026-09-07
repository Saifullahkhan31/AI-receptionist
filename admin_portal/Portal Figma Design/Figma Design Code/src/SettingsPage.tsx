import { useState } from "react";
import type { ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SettingsSection =
  | "profile" | "security" | "notifications"
  | "clinic-info" | "working-hours" | "services" | "staff"
  | "integrations" | "billing" | "privacy";

// ── Icons ─────────────────────────────────────────────────────────────────────

function PersonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="13.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function BellIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5a6 6 0 016 6v3l1.5 2.5h-15L4 11.5v-3a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 15.5c0 1.105.895 2 2 2s2-.895 2-2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BuildingIcon({ size = 18 }: { size?: number }) {
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

function ClockIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ToothIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M6.5 3C5 3 3 4.5 3 7c0 2 .5 4 1 5.5C4.5 14 5 17 6 17s1-2 2-2 1 2 2 2 1.5-3 2-4.5c.5-1.5 1-3.5 1-5.5 0-2.5-2-4-3.5-4C8.5 3 7.5 4 7.5 4S7 3 6.5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function PeopleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="7.5" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 17c0-2.761 2.462-5 5.5-5s5.5 2.239 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16.5 17c0-2.21-1.12-4.096-2.799-5.08" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PlugIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 6h12v3a6 6 0 01-12 0V6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 15v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CreditCardIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="9" x2="18" y2="9" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="12" width="4" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5l7 3v4.5c0 3.5-2.8 6.5-7 8-4.2-1.5-7-4.5-7-8V5.5l7-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 10.5l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2.5 4h11M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6 7v5M10 7v5M3.5 4l.5 9a1 1 0 001 1h6a1 1 0 001-1l.5-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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

function CameraIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="6" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="11.5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 6l1.5-2h3L13 6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Reusable UI Components ─────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: on ? "#1A73E8" : "#D1D5DB",
        border: "none",
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s ease",
        padding: 0,
      }}
    >
      <span style={{
        position: "absolute",
        top: 2,
        left: on ? 22 : 2,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "#FFFFFF",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        transition: "left 0.2s ease",
        display: "block",
      }} />
    </button>
  );
}

interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  suffix?: ReactNode;
}

function InputField({ label, type = "text", placeholder, value = "", onChange, disabled = false, suffix }: InputFieldProps) {
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
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            height: 44,
            border: `1.5px solid ${focused ? "#1A73E8" : "#E5E7EB"}`,
            borderRadius: 6,
            padding: suffix ? "0 44px 0 12px" : "0 12px",
            fontSize: 14,
            color: disabled ? "#9CA3AF" : "#1C1C1E",
            background: disabled ? "#F9FAFB" : "#FFFFFF",
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.15s ease",
            boxSizing: "border-box",
          }}
        />
        {suffix && (
          <div style={{ position: "absolute", right: 12, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

function SelectField({ label, value = "", onChange, options, disabled = false }: SelectFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#1C1C1E" }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 44,
          border: `1.5px solid ${focused ? "#1A73E8" : "#E5E7EB"}`,
          borderRadius: 6,
          padding: "0 36px 0 12px",
          fontSize: 14,
          color: disabled ? "#9CA3AF" : "#1C1C1E",
          background: disabled ? "#F9FAFB" : "#FFFFFF",
          outline: "none",
          fontFamily: "inherit",
          cursor: disabled ? "not-allowed" : "pointer",
          appearance: "none",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%236E6E73' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

function Modal({ title, onClose, children, width = 480 }: ModalProps) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#FFFFFF",
        borderRadius: 16,
        width,
        maxWidth: "90vw",
        maxHeight: "85vh",
        overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid #F3F4F6",
          position: "sticky", top: 0, background: "#FFFFFF",
          borderRadius: "16px 16px 0 0",
          zIndex: 1,
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1C1C1E" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: "#F3F4F6", border: "none", width: 32, height: 32,
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "#6E6E73", flexShrink: 0,
            }}
          >
            <XIcon size={16} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, danger = true }: ConfirmDialogProps) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1100,
      background: "rgba(0,0,0,0.35)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#FFFFFF", borderRadius: 16, width: 400,
        maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "20px 24px", display: "flex", alignItems: "center",
          justifyContent: "space-between", borderBottom: "1px solid #F3F4F6",
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1C1C1E" }}>{title}</h3>
          <button
            onClick={onCancel}
            style={{
              background: "#F3F4F6", border: "none", width: 32, height: 32,
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "#6E6E73",
            }}
          >
            <XIcon size={16} />
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6E6E73", lineHeight: 1.6 }}>{message}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={onCancel}
              style={{
                height: 40, padding: "0 20px", borderRadius: 8,
                border: "none", background: "none",
                color: "#6E6E73", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                height: 40, padding: "0 20px", borderRadius: 8, border: "none",
                background: danger ? "#EA4335" : "#1A73E8",
                color: "#FFFFFF", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, color: "#1C1C1E" }}>{title}</h2>
      {subtitle && <p style={{ margin: 0, fontSize: 13, color: "#6E6E73" }}>{subtitle}</p>}
      <hr style={{ margin: "16px 0 0", border: "none", borderTop: "1px solid #F3F4F6" }} />
    </div>
  );
}

function SaveBar({ onSave, onDiscard }: { onSave: () => void; onDiscard: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16, justifyContent: "flex-end",
      marginTop: 32, paddingTop: 24, borderTop: "1px solid #F3F4F6",
    }}>
      <button
        onClick={onDiscard}
        style={{
          background: "none", border: "none", color: "#6E6E73",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", padding: "0 4px",
        }}
      >
        Discard
      </button>
      <button
        onClick={onSave}
        style={{
          height: 40, padding: "0 24px", borderRadius: 8, border: "none",
          background: "#1A73E8", color: "#FFFFFF", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        Save Changes
      </button>
    </div>
  );
}

// ── Profile Section ───────────────────────────────────────────────────────────

function ProfileSection() {
  const [firstName, setFirstName] = useState("Mustafa");
  const [lastName, setLastName] = useState("Al-Rahman");
  const [email, setEmail] = useState("mustafa@cmdclinic.ae");
  const [phone, setPhone] = useState("+971 50 123 4567");
  const [specialty, setSpecialty] = useState("General Dentistry");
  const [license, setLicense] = useState("UAE-DEN-2019-04821");
  const [avatarHovered, setAvatarHovered] = useState(false);

  return (
    <div>
      <SectionHeader title="Profile" subtitle="Update your personal information" />

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
        <div
          style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
          onMouseEnter={() => setAvatarHovered(true)}
          onMouseLeave={() => setAvatarHovered(false)}
        >
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            background: "#673AB7",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 800, color: "#FFFFFF",
            letterSpacing: "-0.5px", position: "relative", overflow: "hidden",
          }}>
            MA
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
              opacity: avatarHovered ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}>
              <CameraIcon size={22} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.02em" }}>Edit Photo</span>
            </div>
          </div>
        </div>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#1C1C1E" }}>Profile Photo</p>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#6E6E73" }}>JPG, PNG or GIF — max 2 MB</p>
          <button style={{
            height: 34, padding: "0 16px", borderRadius: 8,
            border: "1.5px solid #E5E7EB", background: "#FFFFFF",
            color: "#1C1C1E", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Upload Photo
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <InputField label="First Name" value={firstName} onChange={setFirstName} />
        <InputField label="Last Name" value={lastName} onChange={setLastName} />
        <InputField label="Email" type="email" value={email} onChange={setEmail} />
        <InputField label="Phone" value={phone} onChange={setPhone} />
        <InputField label="Specialty" value={specialty} onChange={setSpecialty} />
        <InputField label="License Number" value={license} onChange={setLicense} />
      </div>

      <SaveBar onSave={() => {}} onDiscard={() => {}} />
    </div>
  );
}

// ── Security Section ──────────────────────────────────────────────────────────

function SecuritySection() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);

  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button
      onClick={toggle}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: "#9CA3AF", padding: 0, display: "flex", alignItems: "center",
      }}
    >
      {show ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
    </button>
  );

  return (
    <div>
      <SectionHeader title="Change Password" subtitle="Choose a strong password to keep your account secure" />

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 8 }}>
        <InputField
          label="Current Password"
          type={showCurrent ? "text" : "password"}
          placeholder="Enter current password"
          value={currentPw}
          onChange={setCurrentPw}
          suffix={eyeBtn(showCurrent, () => setShowCurrent(!showCurrent))}
        />
        <InputField
          label="New Password"
          type={showNew ? "text" : "password"}
          placeholder="Enter new password"
          value={newPw}
          onChange={setNewPw}
          suffix={eyeBtn(showNew, () => setShowNew(!showNew))}
        />
        <InputField
          label="Confirm New Password"
          type={showConfirm ? "text" : "password"}
          placeholder="Confirm new password"
          value={confirmPw}
          onChange={setConfirmPw}
          suffix={eyeBtn(showConfirm, () => setShowConfirm(!showConfirm))}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button style={{
          height: 40, padding: "0 24px", borderRadius: 8, border: "none",
          background: "#1A73E8", color: "#FFFFFF", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          Update Password
        </button>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #F3F4F6", margin: "32px 0" }} />

      <SectionHeader title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account" />
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: 20, borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#FAFAFA",
      }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#1C1C1E" }}>Authenticator App</p>
          <p style={{ margin: 0, fontSize: 13, color: "#6E6E73" }}>Generate one-time codes with an authenticator app</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{
            height: 24, padding: "0 10px", borderRadius: 6,
            background: twoFAEnabled ? "#EEFBF2" : "#F3F4F6",
            color: twoFAEnabled ? "#1E8A4A" : "#6E6E73",
            fontSize: 12, fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: twoFAEnabled ? "#34A853" : "#9CA3AF" }} />
            {twoFAEnabled ? "Enabled" : "Disabled"}
          </span>
          <Toggle on={twoFAEnabled} onChange={() => setTwoFAEnabled(!twoFAEnabled)} />
        </div>
      </div>
    </div>
  );
}

// ── Notifications Section ─────────────────────────────────────────────────────

type NotifKey = "reminders" | "bookings" | "cancellations" | "labResults" | "push" | "sms";

function NotificationsSection() {
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    reminders: true,
    bookings: true,
    cancellations: true,
    labResults: false,
    push: true,
    sms: false,
  });

  const toggle = (k: NotifKey) => setNotifs(prev => ({ ...prev, [k]: !prev[k] }));

  type RowProps = { k: NotifKey; label: string; desc: string; last?: boolean };
  function Row({ k, label, desc, last }: RowProps) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: last ? "none" : "1px solid #F3F4F6",
      }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#1C1C1E" }}>{label}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#6E6E73" }}>{desc}</p>
        </div>
        <Toggle on={notifs[k]} onChange={() => toggle(k)} />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Notifications" subtitle="Control how and when you receive updates" />

      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</p>
      <div style={{ marginBottom: 32 }}>
        <Row k="reminders" label="Appointment Reminders" desc="Receive a reminder 24 hours before each appointment" />
        <Row k="bookings" label="New Bookings" desc="Get notified when a new appointment is scheduled" />
        <Row k="cancellations" label="Cancellations & Reschedules" desc="Alerts when an appointment is cancelled or rescheduled" />
        <Row k="labResults" label="Lab Results" desc="Receive lab results directly to your email" last />
      </div>

      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Other Channels</p>
      <div style={{ marginBottom: 32 }}>
        <Row k="push" label="Push Notifications" desc="Browser push notifications for urgent updates" />
        <Row k="sms" label="SMS Alerts" desc="Text message alerts for appointment reminders" last />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button style={{
          height: 40, padding: "0 24px", borderRadius: 8, border: "none",
          background: "#1A73E8", color: "#FFFFFF", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          Save Preferences
        </button>
      </div>
    </div>
  );
}

// ── Clinic Information Section ────────────────────────────────────────────────

function ClinicInfoSection() {
  const [clinicName, setClinicName] = useState("CMD — Center of Modern Dentistry");
  const [street, setStreet] = useState("Al Wasl Road, Jumeirah 1");
  const [city, setCity] = useState("Dubai");
  const [country, setCountry] = useState("United Arab Emirates");
  const [phone, setPhone] = useState("+971 4 321 0000");
  const [email, setEmail] = useState("hello@cmdclinic.ae");
  const [website, setWebsite] = useState("www.cmdclinic.ae");
  const [logoDragOver, setLogoDragOver] = useState(false);

  return (
    <div>
      <SectionHeader title="Clinic Information" subtitle="Your clinic's public-facing details" />

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        <InputField label="Clinic Name" value={clinicName} onChange={setClinicName} />
        <InputField label="Street Address" value={street} onChange={setStreet} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <InputField label="City" value={city} onChange={setCity} />
          <InputField label="Country" value={country} onChange={setCountry} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <InputField label="Phone" value={phone} onChange={setPhone} />
          <InputField label="Email" type="email" value={email} onChange={setEmail} />
        </div>
        <InputField label="Website" value={website} onChange={setWebsite} />
      </div>

      <div style={{ marginBottom: 32 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1C1C1E", marginBottom: 10 }}>Clinic Logo</label>
        <div
          onDragOver={e => { e.preventDefault(); setLogoDragOver(true); }}
          onDragLeave={() => setLogoDragOver(false)}
          onDrop={e => { e.preventDefault(); setLogoDragOver(false); }}
          style={{
            width: 200, height: 80, borderRadius: 10,
            border: `2px dashed ${logoDragOver ? "#1A73E8" : "#D1D5DB"}`,
            background: logoDragOver ? "#EBF2FF" : "#FAFAFA",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 4,
            cursor: "pointer",
            transition: "border-color 0.15s ease, background 0.15s ease",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#6E6E73" }}>Upload Logo</p>
          <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>PNG, SVG — max 1 MB</p>
        </div>
      </div>

      <SaveBar onSave={() => {}} onDiscard={() => {}} />
    </div>
  );
}

// ── Working Hours Section ─────────────────────────────────────────────────────

interface DayHours {
  open: boolean;
  from: string;
  to: string;
  breakEnabled: boolean;
  breakFrom: string;
  breakTo: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const defaultHours: DayHours[] = [
  { open: true,  from: "09:00", to: "17:00", breakEnabled: true,  breakFrom: "13:00", breakTo: "14:00" },
  { open: true,  from: "09:00", to: "17:00", breakEnabled: true,  breakFrom: "13:00", breakTo: "14:00" },
  { open: true,  from: "09:00", to: "17:00", breakEnabled: true,  breakFrom: "13:00", breakTo: "14:00" },
  { open: true,  from: "09:00", to: "17:00", breakEnabled: true,  breakFrom: "13:00", breakTo: "14:00" },
  { open: true,  from: "09:00", to: "17:00", breakEnabled: false, breakFrom: "13:00", breakTo: "14:00" },
  { open: true,  from: "09:00", to: "14:00", breakEnabled: false, breakFrom: "13:00", breakTo: "14:00" },
  { open: false, from: "09:00", to: "17:00", breakEnabled: false, breakFrom: "13:00", breakTo: "14:00" },
];

interface TimeInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}

function TimeInput({ value, onChange, disabled }: TimeInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        height: 36,
        border: `1.5px solid ${focused ? "#1A73E8" : "#E5E7EB"}`,
        borderRadius: 6,
        padding: "0 8px",
        fontSize: 13,
        color: disabled ? "#9CA3AF" : "#1C1C1E",
        background: disabled ? "#F9FAFB" : "#FFFFFF",
        outline: "none",
        fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "default",
        width: 112,
        boxSizing: "border-box",
      }}
    />
  );
}

function WorkingHoursSection() {
  const [hours, setHours] = useState<DayHours[]>(defaultHours);

  const update = (i: number, patch: Partial<DayHours>) =>
    setHours(prev => prev.map((h, idx) => idx === i ? { ...h, ...patch } : h));

  const applyToWeekdays = () => {
    const mon = hours[0];
    setHours(prev => prev.map((h, i) => i < 5 ? { ...mon } : h));
  };

  const thStyle: React.CSSProperties = {
    padding: "0 8px 12px",
    fontSize: 12, fontWeight: 700, color: "#9CA3AF",
    textTransform: "uppercase", letterSpacing: "0.06em",
    textAlign: "center", borderBottom: "1px solid #F3F4F6",
    whiteSpace: "nowrap",
  };

  return (
    <div>
      <SectionHeader title="Working Hours" subtitle="Set your clinic opening hours and break times" />

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: "left", paddingLeft: 0 }}>Day</th>
              <th style={thStyle}>Open</th>
              <th style={thStyle}>From</th>
              <th style={thStyle}>To</th>
              <th style={thStyle}>Break</th>
              <th style={thStyle}>Break From</th>
              <th style={thStyle}>Break To</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, i) => {
              const h = hours[i];
              const closed = !h.open;
              return (
                <tr key={day} style={{ opacity: closed ? 0.45 : 1, transition: "opacity 0.2s ease" }}>
                  <td style={{ padding: "12px 8px 12px 0", fontSize: 14, fontWeight: 600, color: "#1C1C1E", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>
                    {day}
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
                    <Toggle on={h.open} onChange={() => update(i, { open: !h.open })} />
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
                    <TimeInput value={h.from} onChange={v => update(i, { from: v })} disabled={closed} />
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
                    <TimeInput value={h.to} onChange={v => update(i, { to: v })} disabled={closed} />
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
                    <input
                      type="checkbox"
                      checked={h.breakEnabled}
                      onChange={() => update(i, { breakEnabled: !h.breakEnabled })}
                      disabled={closed}
                      style={{ width: 16, height: 16, accentColor: "#1A73E8", cursor: closed ? "not-allowed" : "pointer" }}
                    />
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
                    <TimeInput value={h.breakFrom} onChange={v => update(i, { breakFrom: v })} disabled={closed || !h.breakEnabled} />
                  </td>
                  <td style={{ padding: "12px 0 12px 8px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
                    <TimeInput value={h.breakTo} onChange={v => update(i, { breakTo: v })} disabled={closed || !h.breakEnabled} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={applyToWeekdays}
          style={{
            height: 36, padding: "0 16px", borderRadius: 8,
            border: "1.5px solid #E5E7EB", background: "#FFFFFF",
            color: "#1C1C1E", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Apply Monday to all weekdays
        </button>
        <button style={{
          height: 40, padding: "0 24px", borderRadius: 8, border: "none",
          background: "#1A73E8", color: "#FFFFFF", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          Save Hours
        </button>
      </div>
    </div>
  );
}

// ── Services & Treatments Section ─────────────────────────────────────────────

interface Service {
  id: number;
  name: string;
  duration: string;
  price: number;
  color: string;
  active: boolean;
}

const SERVICE_COLORS = ["#1A73E8", "#34A853", "#FBBC04", "#EA4335", "#9C27B0", "#FF5722", "#00BCD4", "#607D8B"];

const initialServices: Service[] = [
  { id: 1, name: "Dental Cleaning & Scaling",  duration: "45", price: 200,  color: "#1A73E8", active: true },
  { id: 2, name: "Root Canal Treatment",        duration: "90", price: 800,  color: "#EA4335", active: true },
  { id: 3, name: "Teeth Whitening",             duration: "60", price: 600,  color: "#FBBC04", active: true },
  { id: 4, name: "Dental Crown Fitting",        duration: "90", price: 1200, color: "#9C27B0", active: true },
  { id: 5, name: "Orthodontic Consultation",    duration: "30", price: 150,  color: "#34A853", active: true },
  { id: 6, name: "Composite Filling",           duration: "45", price: 300,  color: "#FF5722", active: true },
  { id: 7, name: "Tooth Extraction",            duration: "30", price: 250,  color: "#00BCD4", active: true },
  { id: 8, name: "Implant Consultation",        duration: "30", price: 200,  color: "#607D8B", active: false },
];

const durationOptions = [
  { value: "15", label: "15 min" }, { value: "30", label: "30 min" },
  { value: "45", label: "45 min" }, { value: "60", label: "60 min" },
  { value: "75", label: "75 min" }, { value: "90", label: "90 min" },
  { value: "120", label: "2 hours" },
];

function ServicesSection() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Service | null>(null);
  const [formName, setFormName] = useState("");
  const [formDuration, setFormDuration] = useState("45");
  const [formPrice, setFormPrice] = useState("");
  const [formColor, setFormColor] = useState(SERVICE_COLORS[0]);

  const openAdd = () => {
    setEditingService(null);
    setFormName(""); setFormDuration("45"); setFormPrice(""); setFormColor(SERVICE_COLORS[0]);
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    setFormName(s.name); setFormDuration(s.duration);
    setFormPrice(String(s.price)); setFormColor(s.color);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    if (editingService) {
      setServices(prev => prev.map(s =>
        s.id === editingService.id
          ? { ...s, name: formName, duration: formDuration, price: Number(formPrice), color: formColor }
          : s
      ));
    } else {
      const newId = Math.max(...services.map(s => s.id)) + 1;
      setServices(prev => [...prev, { id: newId, name: formName, duration: formDuration, price: Number(formPrice), color: formColor, active: true }]);
    }
    setShowModal(false);
  };

  const handleDelete = (s: Service) => {
    setServices(prev => prev.filter(x => x.id !== s.id));
    setDeleteConfirm(null);
  };

  const thStyle: React.CSSProperties = {
    padding: "0 12px 12px",
    fontSize: 12, fontWeight: 700, color: "#9CA3AF",
    textTransform: "uppercase", letterSpacing: "0.06em",
    textAlign: "center", borderBottom: "1px solid #F3F4F6",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, color: "#1C1C1E" }}>Services & Treatments</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#6E6E73" }}>Manage the treatments your clinic offers</p>
        </div>
        <button
          onClick={openAdd}
          style={{
            height: 40, padding: "0 16px", borderRadius: 8, border: "none",
            background: "#1A73E8", color: "#FFFFFF", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <PlusIcon size={16} />
          Add Service
        </button>
      </div>
      <hr style={{ border: "none", borderTop: "1px solid #F3F4F6", marginBottom: 24 }} />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: "left", paddingLeft: 0 }}>Service</th>
            <th style={thStyle}>Duration</th>
            <th style={thStyle}>Price (AED)</th>
            <th style={thStyle}>Active</th>
            <th style={{ ...thStyle, width: 80 }}></th>
          </tr>
        </thead>
        <tbody>
          {services.map(s => (
            <tr key={s.id} style={{ opacity: s.active ? 1 : 0.5 }}>
              <td style={{ padding: "14px 12px 14px 0", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1C1C1E" }}>{s.name}</span>
                </div>
              </td>
              <td style={{ padding: "14px 12px", textAlign: "center", fontSize: 14, color: "#6E6E73", borderBottom: "1px solid #F3F4F6" }}>
                {s.duration} min
              </td>
              <td style={{ padding: "14px 12px", textAlign: "center", fontSize: 14, fontWeight: 600, color: "#1C1C1E", borderBottom: "1px solid #F3F4F6" }}>
                {s.price.toLocaleString()}
              </td>
              <td style={{ padding: "14px 12px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
                <Toggle on={s.active} onChange={() => setServices(prev => prev.map(x => x.id === s.id ? { ...x, active: !x.active } : x))} />
              </td>
              <td style={{ padding: "14px 0 14px 12px", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                  <button
                    onClick={() => openEdit(s)}
                    style={{
                      width: 32, height: 32, borderRadius: 6,
                      border: "1.5px solid #E5E7EB", background: "#FFFFFF",
                      color: "#6E6E73", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <EditIcon size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(s)}
                    style={{
                      width: 32, height: 32, borderRadius: 6,
                      border: "1.5px solid #FEE2E2", background: "#FEF2F2",
                      color: "#EA4335", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <Modal title={editingService ? "Edit Service" : "Add Service"} onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <InputField label="Service Name" value={formName} onChange={setFormName} placeholder="e.g. Dental Cleaning" />
            <SelectField label="Duration" value={formDuration} onChange={setFormDuration} options={durationOptions} />
            <InputField label="Price (AED)" type="number" value={formPrice} onChange={setFormPrice} placeholder="0" />
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1C1C1E", marginBottom: 10 }}>Calendar Color</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {SERVICE_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setFormColor(c)}
                    style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: c,
                      border: formColor === c ? "3px solid #1C1C1E" : "3px solid transparent",
                      cursor: "pointer", outline: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#FFFFFF",
                    }}
                  >
                    {formColor === c && <CheckIcon size={13} />}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  height: 40, padding: "0 20px", borderRadius: 8, border: "none",
                  background: "none", color: "#6E6E73", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  height: 40, padding: "0 24px", borderRadius: 8, border: "none",
                  background: "#1A73E8", color: "#FFFFFF", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {editingService ? "Save Changes" : "Add Service"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Service"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          confirmLabel="Delete Service"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          danger
        />
      )}
    </div>
  );
}

// ── Staff Members Section ─────────────────────────────────────────────────────

interface StaffMember {
  id: number;
  name: string;
  role: string;
  initials: string;
  color: string;
  active: boolean;
}

const initialStaff: StaffMember[] = [
  { id: 1, name: "Dr. Mustafa Al-Rahman", role: "Lead Dentist",    initials: "MA", color: "#673AB7", active: true  },
  { id: 2, name: "Dr. Layla Hassan",       role: "Orthodontist",   initials: "LH", color: "#FF7B7B", active: true  },
  { id: 3, name: "Dr. Omar Khalid",        role: "Periodontist",   initials: "OK", color: "#34A853", active: true  },
  { id: 4, name: "Sara Al-Mansoori",       role: "Head Nurse",     initials: "SA", color: "#607D8B", active: true  },
  { id: 5, name: "Fatima Al-Jabri",        role: "Receptionist",   initials: "FA", color: "#5AC8FA", active: true  },
  { id: 6, name: "Mohammed Rizwan",        role: "Lab Technician", initials: "MR", color: "#7B68EE", active: false },
];

const roleOptions = [
  { value: "dentist", label: "Dentist" },
  { value: "specialist", label: "Specialist" },
  { value: "nurse", label: "Nurse" },
  { value: "receptionist", label: "Receptionist" },
  { value: "lab-tech", label: "Lab Technician" },
  { value: "admin", label: "Administrator" },
];

function StaffSection() {
  const [staff] = useState<StaffMember[]>(initialStaff);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("dentist");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, color: "#1C1C1E" }}>Staff Members</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#6E6E73" }}>{staff.length} members in your clinic</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          style={{
            height: 40, padding: "0 16px", borderRadius: 8, border: "none",
            background: "#1A73E8", color: "#FFFFFF", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <PlusIcon size={16} />
          Invite Staff
        </button>
      </div>
      <hr style={{ border: "none", borderTop: "1px solid #F3F4F6", marginBottom: 24 }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {staff.map(m => (
          <div key={m.id} style={{
            background: "#FAFAFA", borderRadius: 12, padding: 20,
            border: "1.5px solid #F3F4F6",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: m.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.5px",
            }}>
              {m.initials}
            </div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>{m.name}</p>
              <p style={{ margin: 0, fontSize: 13, color: "#6E6E73" }}>{m.role}</p>
            </div>
            <span style={{
              height: 22, padding: "0 10px", borderRadius: 6,
              background: m.active ? "#EEFBF2" : "#F3F4F6",
              color: m.active ? "#1E8A4A" : "#6E6E73",
              fontSize: 12, fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.active ? "#34A853" : "#9CA3AF" }} />
              {m.active ? "Active" : "Inactive"}
            </span>
            <button style={{
              width: "100%", height: 34, borderRadius: 8,
              border: "1.5px solid #E5E7EB", background: "#FFFFFF",
              color: "#1C1C1E", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <EditIcon size={13} />
              Edit
            </button>
          </div>
        ))}
      </div>

      {showInvite && (
        <Modal title="Invite Staff Member" onClose={() => setShowInvite(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <InputField
              label="Email Address"
              type="email"
              value={inviteEmail}
              onChange={setInviteEmail}
              placeholder="colleague@example.com"
            />
            <SelectField label="Role" value={inviteRole} onChange={setInviteRole} options={roleOptions} />
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6E6E73", lineHeight: 1.5 }}>
              An invitation email will be sent to this address to join CMD clinic.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={() => setShowInvite(false)}
                style={{
                  height: 40, padding: "0 20px", borderRadius: 8, border: "none",
                  background: "none", color: "#6E6E73", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowInvite(false)}
                style={{
                  height: 40, padding: "0 24px", borderRadius: 8, border: "none",
                  background: "#1A73E8", color: "#FFFFFF", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Send Invite
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Integrations Section ───────────────────────────────────────────────────────

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  logo: ReactNode;
}

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

function IntegrationsSection() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: "gcal",      name: "Google Calendar",    description: "Sync appointments automatically with Google Calendar",          connected: true,  logo: <GoogleLogo />   },
    { id: "whatsapp",  name: "WhatsApp Business",  description: "Send appointment reminders and updates via WhatsApp",          connected: false, logo: <WhatsAppLogo /> },
    { id: "twilio",    name: "Twilio SMS",          description: "Send SMS alerts and appointment reminders to patients",        connected: true,  logo: <TwilioLogo />   },
  ]);
  const [disconnectConfirm, setDisconnectConfirm] = useState<Integration | null>(null);

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: false } : i));
    setDisconnectConfirm(null);
  };

  const handleConnect = (id: string) =>
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: true } : i));

  return (
    <div>
      <SectionHeader title="Integrations" subtitle="Connect external services to enhance your clinic workflow" />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {integrations.map(integration => (
          <div key={integration.id} style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: 20, borderRadius: 12,
            border: "1.5px solid #F3F4F6", background: "#FAFAFA",
          }}>
            <div style={{ flexShrink: 0 }}>{integration.logo}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700, color: "#1C1C1E" }}>{integration.name}</p>
              <p style={{ margin: 0, fontSize: 13, color: "#6E6E73" }}>{integration.description}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <span style={{
                height: 24, padding: "0 10px", borderRadius: 6,
                background: integration.connected ? "#EEFBF2" : "#F3F4F6",
                color: integration.connected ? "#1E8A4A" : "#9CA3AF",
                fontSize: 12, fontWeight: 700,
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: integration.connected ? "#34A853" : "#D1D5DB" }} />
                {integration.connected ? "Connected" : "Not Connected"}
              </span>
              {integration.connected ? (
                <button
                  onClick={() => setDisconnectConfirm(integration)}
                  style={{
                    height: 36, padding: "0 16px", borderRadius: 8,
                    border: "1.5px solid #FCA5A5", background: "#FFFFFF",
                    color: "#EA4335", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(integration.id)}
                  style={{
                    height: 36, padding: "0 16px", borderRadius: 8, border: "none",
                    background: "#1A73E8", color: "#FFFFFF",
                    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {disconnectConfirm && (
        <ConfirmDialog
          title="Disconnect Integration"
          message={`Are you sure you want to disconnect ${disconnectConfirm.name}? Your sync data may be affected.`}
          confirmLabel="Disconnect"
          onConfirm={() => handleDisconnect(disconnectConfirm.id)}
          onCancel={() => setDisconnectConfirm(null)}
          danger
        />
      )}
    </div>
  );
}

// ── Billing & Subscription Section ────────────────────────────────────────────

interface Invoice {
  id: number;
  date: string;
  amount: number;
  status: "Paid" | "Pending";
}

const invoices: Invoice[] = [
  { id: 1, date: "Aug 2026", amount: 499, status: "Paid" },
  { id: 2, date: "Jul 2026", amount: 499, status: "Paid" },
  { id: 3, date: "Jun 2026", amount: 499, status: "Paid" },
  { id: 4, date: "May 2026", amount: 499, status: "Paid" },
  { id: 5, date: "Apr 2026", amount: 499, status: "Paid" },
];

function BillingSection() {
  const thStyle: React.CSSProperties = {
    padding: "0 12px 12px",
    fontSize: 12, fontWeight: 700, color: "#9CA3AF",
    textTransform: "uppercase", letterSpacing: "0.06em",
    textAlign: "center", borderBottom: "1px solid #F3F4F6",
  };

  return (
    <div>
      <SectionHeader title="Billing & Subscription" subtitle="Manage your plan, payment method, and invoices" />

      {/* Plan card */}
      <div style={{
        padding: 24, borderRadius: 14,
        background: "linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)",
        color: "#FFFFFF", marginBottom: 32,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -24, right: -24, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -36, right: 48, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <span style={{
          display: "inline-flex", alignItems: "center", padding: "4px 12px", borderRadius: 6,
          background: "rgba(255,255,255,0.18)", fontSize: 11, fontWeight: 800,
          letterSpacing: "0.08em", marginBottom: 14,
        }}>
          PRO PLAN
        </span>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 30, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1 }}>
              AED 499<span style={{ fontSize: 15, fontWeight: 500, opacity: 0.8 }}>/mo</span>
            </p>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>Billed monthly — renews 1 October 2026</p>
          </div>
          <button style={{
            height: 40, padding: "0 20px", borderRadius: 8, border: "none",
            background: "#FFFFFF", color: "#1A73E8",
            fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
          }}>
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Payment method */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1C1C1E" }}>Payment Method</h3>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: 16, borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#FAFAFA",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 34, borderRadius: 6,
              background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
                <circle cx="13" cy="11" r="7" fill="#EA4335" fillOpacity="0.9" />
                <circle cx="23" cy="11" r="7" fill="#FBBC04" fillOpacity="0.9" />
              </svg>
            </div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>Mastercard ending in 4821</p>
              <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>Expires 09/2028</p>
            </div>
          </div>
          <button style={{
            background: "none", border: "none", color: "#1A73E8",
            fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            Change Card
          </button>
        </div>
      </div>

      {/* Invoice history */}
      <div>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1C1C1E" }}>Invoice History</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: "left", paddingLeft: 0 }}>Date</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td style={{ padding: "14px 12px 14px 0", fontSize: 14, fontWeight: 600, color: "#1C1C1E", borderBottom: "1px solid #F3F4F6" }}>
                  {inv.date}
                </td>
                <td style={{ padding: "14px 12px", textAlign: "center", fontSize: 14, color: "#1C1C1E", borderBottom: "1px solid #F3F4F6" }}>
                  AED {inv.amount.toLocaleString()}
                </td>
                <td style={{ padding: "14px 12px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{
                    height: 24, padding: "0 10px", borderRadius: 6,
                    background: inv.status === "Paid" ? "#EEFBF2" : "#FFFBE6",
                    color: inv.status === "Paid" ? "#1E8A4A" : "#A16207",
                    fontSize: 12, fontWeight: 700,
                    display: "inline-flex", alignItems: "center",
                  }}>
                    {inv.status}
                  </span>
                </td>
                <td style={{ padding: "14px 0 14px 12px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
                  <button style={{
                    width: 32, height: 32, borderRadius: 6,
                    border: "1.5px solid #E5E7EB", background: "#FFFFFF",
                    color: "#6E6E73", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <DownloadIcon size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Data & Privacy Section ────────────────────────────────────────────────────

function PrivacySection() {
  const [analytics, setAnalytics] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <div>
      <SectionHeader title="Data & Privacy" subtitle="Control your data preferences and account settings" />

      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Privacy Settings</p>
      <div style={{ marginBottom: 32 }}>
        {[
          { key: "analytics", label: "Usage Analytics", desc: "Help improve CMD by sharing anonymous usage data", on: analytics, toggle: () => setAnalytics(!analytics) },
          { key: "dataSharing", label: "Third-Party Data Sharing", desc: "Allow sharing anonymized data with research partners", on: dataSharing, toggle: () => setDataSharing(!dataSharing) },
        ].map(({ key, label, desc, on, toggle }, i, arr) => (
          <div key={key} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 0",
            borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none",
          }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#1C1C1E" }}>{label}</p>
              <p style={{ margin: 0, fontSize: 13, color: "#6E6E73" }}>{desc}</p>
            </div>
            <Toggle on={on} onChange={toggle} />
          </div>
        ))}
      </div>

      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Data Export</p>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: 20, borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#FAFAFA",
        }}>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: "#1C1C1E" }}>Download Your Data</p>
            <p style={{ margin: 0, fontSize: 13, color: "#6E6E73" }}>Export all clinic data as a JSON or CSV archive</p>
          </div>
          <button style={{
            height: 36, padding: "0 16px", borderRadius: 8,
            border: "1.5px solid #E5E7EB", background: "#FFFFFF",
            color: "#1C1C1E", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <DownloadIcon size={14} />
            Export Data
          </button>
        </div>
      </div>

      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#EA4335", textTransform: "uppercase", letterSpacing: "0.08em" }}>Danger Zone</p>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: 20, borderRadius: 12,
        border: "1.5px solid #FCA5A5", background: "#FEF2F2",
      }}>
        <div>
          <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: "#B91C1C" }}>Delete Account</p>
          <p style={{ margin: 0, fontSize: 13, color: "#EF4444" }}>Permanently delete your clinic account and all data. This cannot be undone.</p>
        </div>
        <button
          onClick={() => setDeleteConfirm(true)}
          style={{
            height: 36, padding: "0 16px", borderRadius: 8, border: "none",
            background: "#EA4335", color: "#FFFFFF",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", flexShrink: 0,
          }}
        >
          Delete Account
        </button>
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Account"
          message="This will permanently delete all clinic data, patient records, appointments, and settings. This action is irreversible and cannot be undone."
          confirmLabel="Delete My Account"
          onConfirm={() => setDeleteConfirm(false)}
          onCancel={() => setDeleteConfirm(false)}
          danger
        />
      )}
    </div>
  );
}

// ── Left Nav Item ─────────────────────────────────────────────────────────────

function NavItem({
  item, active, onClick,
}: {
  item: { id: string; label: string; icon: ReactNode };
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "calc(100% - 16px)",
        margin: "1px 8px",
        display: "flex", alignItems: "center", gap: 10,
        padding: "0 12px", height: 44,
        borderRadius: 8, border: "none",
        cursor: "pointer",
        background: active ? "#EBF2FF" : hovered ? "#F3F4F6" : "transparent",
        color: active ? "#1A73E8" : "#374151",
        fontFamily: "inherit", fontSize: 14,
        fontWeight: active ? 700 : 500,
        textAlign: "left",
        transition: "background 0.12s ease, color 0.12s ease",
      }}
    >
      <span style={{ color: active ? "#1A73E8" : "#9CA3AF", flexShrink: 0, display: "flex", alignItems: "center" }}>
        {item.icon}
      </span>
      {item.label}
    </button>
  );
}

// ── Menu definition ───────────────────────────────────────────────────────────

const menuGroups: { label: string; items: { id: SettingsSection; label: string; icon: ReactNode }[] }[] = [
  {
    label: "Account",
    items: [
      { id: "profile",       label: "Profile",       icon: <PersonIcon />      },
      { id: "security",      label: "Security",      icon: <LockIcon />        },
      { id: "notifications", label: "Notifications", icon: <BellIcon />        },
    ],
  },
  {
    label: "Clinic",
    items: [
      { id: "clinic-info",    label: "Clinic Information",    icon: <BuildingIcon /> },
      { id: "working-hours",  label: "Working Hours",         icon: <ClockIcon />    },
      { id: "services",       label: "Services & Treatments", icon: <ToothIcon />    },
      { id: "staff",          label: "Staff Members",         icon: <PeopleIcon />   },
    ],
  },
  {
    label: "System",
    items: [
      { id: "integrations", label: "Integrations",          icon: <PlugIcon />        },
      { id: "billing",      label: "Billing & Subscription", icon: <CreditCardIcon /> },
      { id: "privacy",      label: "Data & Privacy",         icon: <ShieldIcon />     },
    ],
  },
];

// ── Main Export ───────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");

  return (
    <div style={{ display: "flex", gap: 24, height: "100%", overflow: "hidden" }}>
      {/* Left settings menu */}
      <div style={{
        width: 260, flexShrink: 0,
        background: "#FFFFFF", borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        overflowY: "auto", padding: "8px 0",
      }}>
        {menuGroups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && (
              <hr style={{ margin: "6px 16px", border: "none", borderTop: "1px solid #F3F4F6" }} />
            )}
            <p style={{
              margin: "14px 20px 4px",
              fontSize: 11, fontWeight: 700, color: "#9CA3AF",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {group.label}
            </p>
            {group.items.map(item => (
              <NavItem
                key={item.id}
                item={item}
                active={activeSection === item.id}
                onClick={() => setActiveSection(item.id)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Right content panel */}
      <div style={{
        flex: 1, background: "#FFFFFF", borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        overflowY: "auto", padding: 32, minWidth: 0,
      }}>
        {activeSection === "profile"       && <ProfileSection />}
        {activeSection === "security"      && <SecuritySection />}
        {activeSection === "notifications" && <NotificationsSection />}
        {activeSection === "clinic-info"   && <ClinicInfoSection />}
        {activeSection === "working-hours" && <WorkingHoursSection />}
        {activeSection === "services"      && <ServicesSection />}
        {activeSection === "staff"         && <StaffSection />}
        {activeSection === "integrations"  && <IntegrationsSection />}
        {activeSection === "billing"       && <BillingSection />}
        {activeSection === "privacy"       && <PrivacySection />}
      </div>
    </div>
  );
}
