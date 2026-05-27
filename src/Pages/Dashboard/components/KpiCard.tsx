interface KpiCardProps {
  label: string;
  value: string | number;
  valueTone?: 'default' | 'danger' | 'warning' | 'success';
  sub?: string;
  subTone?: 'default' | 'success' | 'warning' | 'danger';
}

const VALUE_TONES = {
  default: 'text-ink',
  danger:  'text-danger',
  warning: 'text-warning',
  success: 'text-success',
};

const SUB_TONES = {
  default: 'text-muted',
  success: 'text-success',
  warning: 'text-warning',
  danger:  'text-danger',
};

export function KpiCard({
  label,
  value,
  valueTone = 'default',
  sub,
  subTone = 'default',
}: KpiCardProps) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <p className="text-xs text-muted mb-1.5">{label}</p>
      <p className={`text-2xl font-semibold leading-tight ${VALUE_TONES[valueTone]}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-2xs mt-1.5 ${SUB_TONES[subTone]}`}>{sub}</p>
      )}
    </div>
  );
}