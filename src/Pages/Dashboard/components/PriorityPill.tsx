import { Flame, Clock } from 'lucide-react';

export type Prioridade = 'Alta' | 'Media' | 'Baixa';

interface PriorityPillProps {
  prioridade: Prioridade;
  size?: 'sm' | 'md';
}

const STYLES = {
  Alta:  { bg: 'bg-danger-soft',  text: 'text-danger',  Icon: Flame },
  Media: { bg: 'bg-warning-soft', text: 'text-warning', Icon: Clock },
  Baixa: { bg: 'bg-surface-soft', text: 'text-muted',   Icon: null  },
};

const LABELS: Record<Prioridade, string> = {
  Alta:  'Alta',
  Media: 'Média',
  Baixa: 'Baixa',
};

export function PriorityPill({ prioridade, size = 'sm' }: PriorityPillProps) {
  const { bg, text, Icon } = STYLES[prioridade];
  const sizing =
    size === 'sm' ? 'text-2xs px-2 py-0.5 gap-1' : 'text-xs px-3 py-1 gap-1.5';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${bg} ${text} ${sizing}`}>
      {Icon && <Icon className={iconSize} strokeWidth={2.5} />}
      {LABELS[prioridade]}
    </span>
  );
}