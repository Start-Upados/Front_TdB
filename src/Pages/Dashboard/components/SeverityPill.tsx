type Severidade = 'Alta' | 'Media' | 'Baixa';

const STYLES: Record<Severidade, string> = {
  Alta:  'bg-danger-soft text-danger',
  Media: 'bg-warning-soft text-warning',
  Baixa: 'bg-surface-soft text-muted',
};

const LABELS: Record<Severidade, string> = {
  Alta:  'Alta',
  Media: 'Média',
  Baixa: 'Leve',
};

export function SeverityPill({ severidade }: { severidade: Severidade }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium ${STYLES[severidade]}`}>
      {LABELS[severidade]}
    </span>
  );
}

export type { Severidade };