import { useState, useMemo } from 'react';
import {
  Plus,
  Check,
  Clock,
  Play,
  X,
  ArrowRight,
} from 'lucide-react';

import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';

import {
  listarPorData,
  contarPorFaixa,
  dataDeHoje,
} from '../services/atendimentos';

import type { StatusAtendimento } from '../data/atendimentos';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function formatarDataLonga(iso: string): string {
  const d = new Date(iso + 'T12:00:00');

  const s = d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return s.charAt(0).toUpperCase() + s.slice(1);
}

function diaSemanaCurto(iso: string): string {
  const d = new Date(iso + 'T12:00:00');

  return d
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '')
    .slice(0, 3);
}

function diaMes(iso: string): number {
  return parseInt(iso.slice(8, 10), 10);
}

function horaAtual(): string {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────

const STATUS_CONFIG: Record<
  StatusAtendimento,
  {
    bg: string;
    text: string;
    label: string;
    Icon: typeof Check;
  }
> = {
  confirmado: {
    bg: 'bg-success-soft',
    text: 'text-success',
    label: 'Confirmado',
    Icon: Check,
  },

  aguardando: {
    bg: 'bg-warning-soft',
    text: 'text-warning',
    label: 'Aguardando confirmação',
    Icon: Clock,
  },

  'em-andamento': {
    bg: 'bg-info-soft',
    text: 'text-info',
    label: 'Em andamento',
    Icon: Play,
  },

  realizado: {
    bg: 'bg-success-soft',
    text: 'text-success',
    label: 'Realizado',
    Icon: Check,
  },

  'no-show': {
    bg: 'bg-danger-soft',
    text: 'text-danger',
    label: 'No-show',
    Icon: X,
  },
};

function StatusPill({ status }: { status: StatusAtendimento }) {
  const { bg, text, label, Icon } = STATUS_CONFIG[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${bg} ${text}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </span>
  );
}

function labelAcao(status: StatusAtendimento): string {
  switch (status) {
    case 'realizado':
      return 'Ver';

    case 'aguardando':
      return 'Contatar';

    case 'em-andamento':
      return 'Acompanhar';

    case 'confirmado':
      return 'Ver';

    case 'no-show':
      return 'Reagendar';
  }
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function AtendimentosPage() {
  const hoje = dataDeHoje();

  const [dataSelecionada, setDataSelecionada] = useState(hoje);

  const semana = useMemo(() => {
    const inicio = new Date(hoje + 'T12:00:00');

    inicio.setDate(inicio.getDate() - 4);

    return contarPorFaixa(
      inicio.toISOString().slice(0, 10),
      7
    );
  }, [hoje]);

  const atendimentos = useMemo(
    () => listarPorData(dataSelecionada),
    [dataSelecionada]
  );

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Atendimentos hoje" value="5" sub="3 confirmados" />

        <KpiCard
          label="Taxa de comparecimento"
          value="87%"
          sub="+4pp vs mês"
          subTone="success"
        />

        <KpiCard
          label="Próximos 7 dias"
          value="42"
          sub="agendados"
        />

        <KpiCard
          label="No-shows no mês"
          value="11"
          valueTone="warning"
          sub="1,3% dos agendamentos"
        />
      </div>

      {/* CALENDÁRIO */}
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[720px] grid-cols-7 gap-3">

          {semana.map(({ data, count }) => {
            const isHoje = data === hoje;

            const isPast = data < hoje;

            const isSelected = data === dataSelecionada;

            return (
              <button
                key={data}
                onClick={() => setDataSelecionada(data)}
                className={`rounded-2xl border px-2 py-4 text-center transition-all ${
                  isSelected
                    ? 'border-info bg-info-soft'
                    : 'border-line bg-surface hover:bg-surface-soft'
                } ${isPast && !isSelected ? 'opacity-60' : ''}`}
              >
                <p className={`text-xs ${isSelected ? 'text-info' : 'text-muted'}`}>
                  {diaSemanaCurto(data)}
                  {isHoje && ' · hoje'}
                </p>

                <p className="mt-1 text-2xl font-semibold leading-none text-ink">
                  {diaMes(data)}
                </p>

                <p className={`mt-2 text-xs ${isSelected ? 'text-info' : 'text-subtle'}`}>
                  {count === 0 ? '—' : `${count} atend.`}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-3 lg:flex-row">

        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">

          <select className="cursor-pointer rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink">
            <option>Todos programas</option>
            <option>Dentista do Bem</option>
            <option>Apolônias do Bem</option>
            <option>Mutirão</option>
          </select>

          <select className="cursor-pointer rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink">
            <option>Todas regiões</option>
            <option>Sudeste</option>
            <option>Sul</option>
            <option>Nordeste</option>
            <option>Centro-Oeste</option>
            <option>Norte</option>
          </select>

          <select className="cursor-pointer rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink">
            <option>Todos dentistas</option>
          </select>
        </div>

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-surface transition-opacity hover:opacity-90 lg:w-auto">
          <Plus className="h-4 w-4" strokeWidth={2} />
          Agendar atendimento
        </button>
      </div>

      {/* LISTA */}
      <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-medium text-ink md:text-sm">
            {formatarDataLonga(dataSelecionada)} · {atendimentos.length} atendimento{atendimentos.length === 1 ? '' : 's'}
          </p>

          {dataSelecionada === hoje && (
            <p className="text-xs text-subtle">
              Agora · {horaAtual()}
            </p>
          )}
        </div>

        {atendimentos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            Nenhum atendimento agendado para este dia.
          </p>
        ) : (
          <div className="divide-y divide-line">

            {atendimentos.map((a) => (
              <div key={a.id} className="flex flex-col gap-4 py-4 first:pt-1 lg:flex-row lg:items-center">

                {/* HORA */}
                <div className="lg:min-w-[72px]">
                  <p className={`text-xl font-semibold leading-none lg:text-base ${
                    a.status === 'em-andamento'
                      ? 'text-info'
                      : 'text-ink'
                  }`}>
                    {a.hora}
                  </p>

                  <p className={`mt-1 text-xs ${
                    a.status === 'em-andamento'
                      ? 'text-info'
                      : 'text-subtle'
                  }`}>
                    {a.status === 'em-andamento'
                      ? 'em curso'
                      : `${a.duracaoMinutos}min`}
                  </p>
                </div>

                {/* CONTEÚDO */}
                <div className="flex min-w-0 flex-1 items-start gap-3">

                  <Avatar
                    initials={a.paciente.iniciais}
                    size="sm"
                    tone={a.status === 'em-andamento' ? 'info' : 'default'}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-relaxed text-ink md:text-base">
                      {a.paciente.nome}, {a.paciente.idade} · {a.dentista.nome}
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">
                      {a.especialidade} · {a.local} · {a.programa}
                    </p>
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="flex flex-col gap-3 sm:flex-row lg:items-center">

                  <StatusPill status={a.status} />

                  <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto">
                    {labelAcao(a.status)}

                    {a.status === 'no-show' && (
                      <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}