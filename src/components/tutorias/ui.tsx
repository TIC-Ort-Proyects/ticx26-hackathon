"use client";

import React from "react";
import {
  House, Gamepad2, Clock, Settings, ArrowRight, ArrowLeft, ArrowUp, Plus, Play,
  X, Paperclip, FileText, Upload, Pencil, Check, Coins, BookOpen, Trash2,
  Archive, ArchiveRestore, EllipsisVertical, Camera, Lock, ChevronRight,
  type LucideIcon as LucideIconType,
} from "lucide-react";

/* ---------- Icon helper (maps prototype string names → lucide) ---------- */
const ICONS: Record<string, LucideIconType> = {
  house: House, "gamepad-2": Gamepad2, clock: Clock, settings: Settings,
  "arrow-right": ArrowRight, "arrow-left": ArrowLeft, "arrow-up": ArrowUp,
  plus: Plus, play: Play, x: X, paperclip: Paperclip, "file-text": FileText,
  upload: Upload, pencil: Pencil, check: Check, coins: Coins, "book-open": BookOpen,
  "trash-2": Trash2, archive: Archive, "archive-restore": ArchiveRestore,
  "ellipsis-vertical": EllipsisVertical, camera: Camera, lock: Lock,
  "chevron-right": ChevronRight,
};

export function Icon({ n, s = 18, color = "currentColor", sw = 2 }: {
  n: string; s?: number; color?: string; sw?: number;
}) {
  const C = ICONS[n];
  if (!C) return null;
  return <C size={s} color={color} strokeWidth={sw} />;
}

type CSS = React.CSSProperties;

/* ---------- Button ---------- */
export function Button({
  children, variant = "primary", size = "md", fullWidth, disabled, onClick, iconRight,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean; disabled?: boolean; onClick?: () => void; iconRight?: React.ReactNode;
}) {
  const pad = size === "sm" ? "8px 14px" : size === "lg" ? "15px 22px" : "12px 18px";
  const fs = size === "sm" ? 13 : size === "lg" ? 16.5 : 15;
  const base: CSS = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: fullWidth ? "100%" : "auto", padding: pad, fontFamily: "var(--font-sans)",
    fontSize: fs, fontWeight: 700, borderRadius: "var(--radius-pill)", cursor: disabled ? "not-allowed" : "pointer",
    border: "none", transition: "transform var(--dur-fast) var(--ease-out), filter var(--dur-fast)",
    opacity: disabled ? 0.5 : 1, letterSpacing: "-0.01em", whiteSpace: "nowrap",
  };
  const skins: Record<string, CSS> = {
    primary: { background: "var(--gold-500)", color: "var(--navy-700)", boxShadow: "var(--depth-gold)" },
    success: { background: "var(--green-500)", color: "#fff", boxShadow: "var(--depth-green)" },
    ghost: { background: "var(--surface-card)", color: "var(--navy-700)", border: "1.5px solid var(--border-default)" },
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...skins[variant] }}
      onMouseDown={(e) => { if (!disabled) (e.currentTarget.style.transform = "translateY(2px)"); }}
      onMouseUp={(e) => (e.currentTarget.style.transform = "")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
    >
      {children}
      {iconRight}
    </button>
  );
}

/* ---------- IconButton ---------- */
export function IconButton({
  children, variant = "primary", round, label, onClick,
}: {
  children: React.ReactNode; variant?: "primary" | "ghost"; round?: boolean; label?: string; onClick?: () => void;
}) {
  const skin: CSS = variant === "primary"
    ? { background: "var(--gold-500)", color: "var(--navy-700)", boxShadow: "var(--depth-gold)" }
    : { background: "var(--surface-card)", color: "var(--navy-700)", border: "1.5px solid var(--border-default)" };
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{
        flex: "none", width: 42, height: 42, borderRadius: round ? "50%" : "var(--radius-md)",
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", ...skin,
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Card ---------- */
export function Card({
  children, interactive, padding = "md", onClick,
}: {
  children: React.ReactNode; interactive?: boolean; padding?: "sm" | "md"; onClick?: () => void;
}) {
  const pad = padding === "sm" ? 14 : 18;
  const style: CSS = {
    background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-xl)", padding: pad, boxShadow: "var(--shadow-xs)",
    textAlign: "left", width: "100%", cursor: interactive ? "pointer" : "default",
    transition: "transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast)",
  };
  if (interactive) {
    return (
      <button
        onClick={onClick}
        style={style}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; }}
      >
        {children}
      </button>
    );
  }
  return <div style={style}>{children}</div>;
}

/* ---------- Input ---------- */
export function Input({
  label, type = "text", placeholder, value, onChange,
}: {
  label?: string; type?: string; placeholder?: string; value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          {label}
        </span>
      )}
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{
          width: "100%", border: "1.5px solid var(--border-default)", borderRadius: "var(--radius-md)",
          padding: "12px 15px", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--navy-700)",
          outline: "none", background: "var(--surface-card)",
        }}
        onFocus={(e) => (e.currentTarget.style.boxShadow = "var(--ring-focus)")}
        onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
      />
    </label>
  );
}

/* ---------- Badge ---------- */
export function Badge({ children, variant = "gold" }: { children: React.ReactNode; variant?: "gold" }) {
  const skin = variant === "gold"
    ? { background: "var(--gold-100)", color: "var(--navy-700)", border: "1.5px solid var(--gold-300)" }
    : {};
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)",
      padding: "3px 10px", fontSize: 12, fontWeight: 700, ...skin,
    }}>
      {children}
    </span>
  );
}

/* ---------- Switch ---------- */
export function Switch({ checked, onChange }: { checked: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      role="switch" aria-checked={checked} onClick={() => onChange?.(!checked)}
      style={{
        flex: "none", width: 48, height: 28, borderRadius: 999, border: "none", cursor: "pointer",
        background: checked ? "var(--gold-500)" : "var(--gray-300)", position: "relative",
        transition: "background var(--dur-base)",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 23 : 3, width: 22, height: 22, borderRadius: "50%",
        background: "#fff", boxShadow: "var(--shadow-sm)", transition: "left var(--dur-base) var(--ease-spring)",
      }} />
    </button>
  );
}

/* ---------- ProgressBar ---------- */
export function ProgressBar({ value, color = "gold", size = "md" }: {
  value: number; color?: "gold" | "green"; size?: "sm" | "md";
}) {
  const h = size === "sm" ? 8 : 10;
  const fill = color === "green" ? "var(--green-500)" : "var(--gold-500)";
  return (
    <div style={{ width: "100%", height: h, background: "var(--cream-200)", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", background: fill, borderRadius: 999, transition: "width var(--dur-slow) var(--ease-out)" }} />
    </div>
  );
}

/* ---------- InterestChip ---------- */
export function InterestChip({
  label, emoji, selected, removable, onClick, onRemove,
}: {
  label: string; emoji?: string; selected?: boolean; removable?: boolean;
  onClick?: () => void; onRemove?: () => void;
}) {
  return (
    <button
      onClick={removable ? onRemove : onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px",
        borderRadius: "var(--radius-pill)", cursor: "pointer", fontFamily: "var(--font-sans)",
        fontSize: 14, fontWeight: 700,
        background: selected ? "var(--gold-100)" : "var(--surface-card)",
        color: "var(--navy-700)",
        border: selected ? "1.5px solid var(--gold-400)" : "1.5px solid var(--border-subtle)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {emoji && <span style={{ fontSize: 16, lineHeight: 1 }}>{emoji}</span>}
      <span>{label}</span>
      {removable && <X size={14} color="var(--text-muted)" />}
    </button>
  );
}

/* ---------- ModeCard ---------- */
const ACCENT_SOFT: Record<string, string> = {
  gold: "var(--gold-100)", navy: "var(--navy-50)", green: "var(--green-100)",
  sky: "var(--sky-100)", coral: "var(--coral-100)",
};
export function ModeCard({
  title, description, icon, accent = "gold", selected, onClick,
}: {
  title: string; description: string; icon: React.ReactNode; accent?: string; selected?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left", cursor: "pointer", borderRadius: "var(--radius-lg)", padding: 14,
        background: "var(--surface-card)",
        border: selected ? "2px solid var(--gold-500)" : "1.5px solid var(--border-subtle)",
        boxShadow: selected ? "var(--shadow-sm)" : "var(--shadow-xs)",
        display: "flex", flexDirection: "column", gap: 8, minHeight: 140,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: "var(--radius-md)", display: "flex",
        alignItems: "center", justifyContent: "center", background: ACCENT_SOFT[accent] || ACCENT_SOFT.gold,
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--navy-700)", letterSpacing: "-0.01em" }}>
        {title}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.35 }}>{description}</div>
    </button>
  );
}

/* ---------- StreakChip ---------- */
export function StreakChip({ days }: { days: number }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5, background: "var(--gold-100)",
      border: "1.5px solid var(--gold-300)", borderRadius: "var(--radius-pill)", padding: "6px 12px",
    }}>
      <span style={{ fontSize: 15 }}>🔥</span>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--navy-700)" }}>{days}</span>
    </div>
  );
}

/* ---------- SqueakyBubble ---------- */
export function SqueakyBubble({ message, size = "md" }: { message: string; size?: "sm" | "md" }) {
  const avatar = size === "sm" ? 40 : 52;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <div style={{
        width: avatar, height: avatar, flex: "none", borderRadius: "var(--radius-md)",
        background: "radial-gradient(circle at 50% 42%, var(--gold-100), var(--cream-100))",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-mascot="" src="/squeaky/squeaky-chat.png" alt="Squeaky" style={{ width: "80%" }} />
      </div>
      <div style={{
        flex: 1, background: "var(--surface-card)", border: "1.5px solid var(--border-subtle)",
        borderRadius: "18px 18px 18px 6px", padding: "11px 14px", fontSize: 13.5, lineHeight: 1.45, color: "var(--navy-700)",
      }}>
        {message}
      </div>
    </div>
  );
}
