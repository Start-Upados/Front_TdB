import React from 'react';

// ─── KPI CARD ─────────────────────────────────
interface KPICardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  accentColor?: string;
}

export function KPICard({ label, value, change, changeType = 'up', accentColor = '#00D4AA' }: KPICardProps) {
  const arrow = changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : '→';
  const changeColor =
    changeType === 'up' ? '#00E676' : changeType === 'down' ? '#FF4757' : '#40C4FF';

  return (
    <div
      className="bg-[#0F2035] border border-[rgba(0,212,170,0.1)] border-t-2 rounded-xl py-3.5 px-4 transition-transform hover:-translate-y-0.5"
      style={{ borderTopColor: accentColor }}
    >
      <p className="text-[10.5px] text-[#3D6A85] uppercase tracking-[0.6px] font-semibold mb-2">
        {label}
      </p>
      <p className="text-[22px] font-bold text-[#E8F4FD] leading-tight">{value}</p>
      {change && (
        <p className="text-[11px] font-medium mt-1.5" style={{ color: changeColor }}>
          {arrow} {change}
        </p>
      )}
    </div>
  );
}

// ─── CARD ─────────────────────────────────────
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, subtitle, children, className = '' }: CardProps) {
  return (
    <div className={`bg-[#0F2035] border border-[rgba(0,212,170,0.1)] rounded-xl p-4 ${className}`}>
      {title && (
        <p className={`text-[12px] font-semibold text-[#E8F4FD] tracking-[0.3px] ${subtitle ? 'mb-1' : 'mb-3'}`}>
          {title}
        </p>
      )}
      {subtitle && <p className="text-[11px] text-[#3D6A85] mb-3">{subtitle}</p>}
      {children}
    </div>
  );
}

// ─── ALERT CARD ───────────────────────────────
interface AlertCardProps {
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
}

const ALERT_CONFIG = {
  danger:  { cls: 'bg-[rgba(255,71,87,0.08)] border-[rgba(255,71,87,0.28)]',   icon: '⚠' },
  warning: { cls: 'bg-[rgba(186,117,23,0.08)] border-[rgba(255,215,64,0.28)]', icon: '⏰' },
  info:    { cls: 'bg-[rgba(64,196,255,0.08)] border-[rgba(64,196,255,0.28)]', icon: 'ℹ' },
  success: { cls: 'bg-[rgba(0,230,118,0.08)] border-[rgba(0,230,118,0.28)]',   icon: '✓' },
};

export function AlertCard({ type, title, description }: AlertCardProps) {
  const cfg = ALERT_CONFIG[type];
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-[9px] mb-[7px] border border-l-[3px] ${cfg.cls}`}>
      <span className="text-[13px] shrink-0 mt-0.5">{cfg.icon}</span>
      <div>
        <p className="text-[12.5px] font-semibold text-[#E8F4FD]">{title}</p>
        <p className="text-[11px] text-[#7EB3CE] mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────
interface ProgressBarProps {
  label: string;
  value: number;
  color?: string;
  suffix?: string;
}

export function ProgressBar({ label, value, color = '#00D4AA', suffix = '%' }: ProgressBarProps) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-[#7EB3CE]">{label}</span>
        <span className="text-[#E8F4FD] font-medium">{value}{suffix}</span>
      </div>
      <div className="h-[5px] bg-white/[0.06] rounded-[3px] overflow-hidden">
        <div
          className="h-full rounded-[3px] transition-all duration-700"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── SECTION TITLE ────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[10.5px] font-bold text-[#3D6A85] uppercase tracking-[0.8px] mb-2.5 mt-1">
      {children}
      <div className="flex-1 h-px bg-[rgba(0,212,170,0.1)]" />
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────
type StatusType = 'concluded' | 'active' | 'pending' | 'alert';

const STATUS_CONFIG: Record<StatusType, { cls: string; label: string }> = {
  active:    { cls: 'bg-[rgba(0,230,118,0.12)] text-[#00E676]',   label: 'Ativo'     },
  concluded: { cls: 'bg-[rgba(64,196,255,0.12)] text-[#40C4FF]',  label: 'Concluído' },
  pending:   { cls: 'bg-[rgba(255,149,87,0.12)] text-[#FF9557]',  label: 'Pendente'  },
  alert:     { cls: 'bg-[rgba(255,71,87,0.12)] text-[#FF4757]',   label: 'Alerta'    },
};

export function StatusBadge({ status }: { status: StatusType }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-[7px] py-[2px] rounded-full ${cfg.cls}`}>
      <span className="w-1 h-1 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

// ─── LEGEND ROW ───────────────────────────────
export function LegendRow({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3.5 mt-2 text-[11px] text-[#7EB3CE]">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="w-[9px] h-[9px] rounded-[2px]" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

// ─── PARTNER ROW ──────────────────────────────
export function PartnerRow({ name, tier, contribution }: { name: string; tier: string; contribution: string }) {
  return (
    <div className="flex items-center justify-between px-2.5 py-2 bg-[#0C1B2E] rounded-[9px] mb-1.5 border border-[rgba(0,212,170,0.1)]">
      <div>
        <p className="text-[12.5px] font-semibold text-[#E8F4FD]">{name}</p>
        <p className="text-[10.5px] text-[#3D6A85] mt-0.5">{tier}</p>
      </div>
      <span className="text-[13px] font-bold text-[#00D4AA]">{contribution}</span>
    </div>
  );
}