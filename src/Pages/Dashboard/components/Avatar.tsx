interface AvatarProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'info';
}

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-16 h-16 text-xl',
};

const TONES = {
  default: 'bg-surface-soft text-ink',
  info:    'bg-info-soft text-info',
};

export function Avatar({ initials, size = 'md', tone = 'default' }: AvatarProps) {
  return (
    <div
      className={`rounded-full flex items-center justify-center font-medium shrink-0 ${SIZES[size]} ${TONES[tone]}`}
    >
      {initials}
    </div>
  );
}