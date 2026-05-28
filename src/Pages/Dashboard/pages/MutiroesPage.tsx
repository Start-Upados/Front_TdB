import {
  Plus,
  Check,
  Clock,
  AlertTriangle,
  UserPlus,
  ArrowRight,
} from 'lucide-react';

import { KpiCard } from '../components/KpiCard';

import {
  listarProximos,
  listarRecentes,
  diasAte,
} from '../services/mutiroes';

import type {
  Mutirao,
  StatusMutirao,
} from '../data/mutiroes';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const DIAS_SEMANA = [
  'DOM',
  'SEG',
  'TER',
  'QUA',
  'QUI',
  'SEX',
  'SÁB',
];

const MESES = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

function diaSemanaUpper(iso: string): string {
  return DIAS_SEMANA[
    new Date(iso + 'T12:00:00').getDay()
  ];
}

function diaMes(iso: string): number {
  return parseInt(iso.slice(8, 10), 10);
}

function mesAbrev(iso: string): string {
  return MESES[
    parseInt(iso.slice(5, 7), 10) - 1
  ];
}

function dataDiaMes(iso: string): string {
  return `${diaMes(iso)} ${mesAbrev(iso)}`;
}

function diaSemanaCompleto(iso: string): string {
  const d = new Date(iso + 'T12:00:00');

  const s = d.toLocaleDateString('pt-BR', {
    weekday: 'long',
  });

  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────

type ConfigStatus = {
  bg: string;
  text: string;
  label: string;
  Icon: typeof Check;
  cardBorderClass: string;
  dateBg: string;
  dateText: string;
};

const STATUS_CONFIG: Record<
  Exclude<StatusMutirao, 'realizado'>,
  ConfigStatus
> = {
  pronto: {
    bg: 'bg-success-soft',
    text: 'text-success',
    label: 'Pronto',
    Icon: Check,
    cardBorderClass: 'border border-line',
    dateBg: 'bg-surface-soft',
    dateText: 'text-ink',
  },

  'em-preparacao': {
    bg: 'bg-warning-soft',
    text: 'text-warning',
    label: 'Em preparação',
    Icon: Clock,
    cardBorderClass: 'border border-line',
    dateBg: 'bg-surface-soft',
    dateText: 'text-ink',
  },

  atencao: {
    bg: 'bg-danger-soft',
    text: 'text-danger',
    label: 'Atenção',
    Icon: AlertTriangle,
    cardBorderClass: 'border-2 border-danger',
    dateBg: 'bg-danger-soft',
    dateText: 'text-danger',
  },
};

// ─────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────

function MutiraoCard({ m }: { m: Mutirao }) {
  const cfg =
    STATUS_CONFIG[
      m.status as Exclude<
        StatusMutirao,
        'realizado'
      >
    ];

  const dentistasFaltam =
    m.dentistasNecessarios -
    m.dentistasConfirmados;

  const dentistasTone =
    dentistasFaltam === 0
      ? 'text-ink'
      : dentistasFaltam /
          m.dentistasNecessarios >
        0.5
        ? 'text-danger'
        : 'text-ink';

  return (
    <div className={`mb-3 rounded-2xl bg-surface p-4 md:p-5 ${cfg.cardBorderClass}`}>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">

        {/* DATA */}
        <div className={`flex min-w-[88px] flex-row items-center justify-center gap-3 rounded-2xl px-4 py-3 lg:flex-col lg:gap-1 ${cfg.dateBg}`}>

          <span className={`text-xs ${
            cfg.dateText === 'text-ink'
              ? 'text-muted'
              : cfg.dateText
          }`}>
            {diaSemanaUpper(m.data)}
          </span>

          <span className={`text-3xl font-semibold leading-none ${
            cfg.dateText
          }`}>
            {diaMes(m.data)}
          </span>

          <span className={`text-xs ${
            cfg.dateText === 'text-ink'
              ? 'text-muted'
              : cfg.dateText
          }`}>
            {mesAbrev(m.data)}
          </span>
        </div>

        {/* CONTEÚDO */}
        <div className="min-w-0 flex-1">

          <div className="mb-2 flex flex-wrap items-center gap-2">

            <p className="text-base font-semibold text-ink md:text-sm">
              {m.local}
            </p>

            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
              <cfg.Icon
                className="h-3.5 w-3.5"
                strokeWidth={2.5}
              />

              {cfg.label}
            </span>
          </div>

          <p className="mb-5 text-sm leading-relaxed text-muted">
            {m.tipo} · {m.cidade}-{m.estado} · {m.horario}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div>
              <p className="text-xs text-subtle">
                Programa
              </p>

              <p className="mt-1 text-sm font-medium text-ink">
                {m.programa}
              </p>
            </div>

            <div>
              <p className="text-xs text-subtle">
                Dentistas
              </p>

              <p className={`mt-1 text-sm font-medium ${dentistasTone}`}>
                {m.dentistasConfirmados} /{' '}
                {m.dentistasNecessarios}{' '}
                confirmados
              </p>
            </div>

            <div>
              <p className="text-xs text-subtle">
                Pacientes esperados
              </p>

              <p className="mt-1 text-sm font-medium text-ink">
                ~{m.pacientesEsperados}
              </p>
            </div>
          </div>
        </div>

        {/* ACTION */}
        {m.status === 'atencao' ? (
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-surface transition-opacity hover:opacity-90 lg:w-auto">
            <UserPlus
              className="h-4 w-4"
              strokeWidth={2}
            />

            Convocar
          </button>
        ) : (
          <button className="w-full rounded-xl border border-line px-4 py-3 text-sm text-ink transition-colors hover:bg-surface-soft lg:w-auto">
            Ver detalhes
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function MutiroesPage() {
  const proximos = listarProximos();

  const recentes = listarRecentes(3);

  const proximo = proximos[0];

  const diasAteProximo = proximo
    ? diasAte(proximo.data)
    : null;

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <KpiCard
          label="Próximos mutirões"
          value={proximos.length}
          sub="nas próximas 3 semanas"
        />

        <KpiCard
          label="Próximo"
          value={
            proximo
              ? `${diaSemanaCompleto(proximo.data).slice(0, 3)} ${diaMes(proximo.data)}/${proximo.data.slice(5, 7)}`
              : '—'
          }
          sub={
            proximo &&
            diasAteProximo !== null
              ? `em ${diasAteProximo} dias · ${proximo.cidade}-${proximo.estado}`
              : 'sem agendamentos'
          }
        />

        <KpiCard
          label="Atendimentos no mês"
          value="89"
          sub="via mutirões"
          subTone="success"
        />

        <KpiCard
          label="Total no ano"
          value="1.247"
          sub="23 mutirões realizados"
        />
      </div>

      {/* PRÓXIMOS */}
      <div>

        <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-base font-medium text-ink md:text-sm">
            Próximos mutirões
          </p>

          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-surface transition-opacity hover:opacity-90 sm:w-auto">
            <Plus
              className="h-4 w-4"
              strokeWidth={2}
            />

            Cadastrar mutirão
          </button>
        </div>

        {proximos.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface py-10 text-center text-sm text-muted">
            Nenhum mutirão agendado.
          </p>
        ) : (
          proximos.map((m) => (
            <MutiraoCard key={m.id} m={m} />
          ))
        )}
      </div>

      {/* RECENTES */}
      <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">

        <div className="mb-5 flex items-center justify-between gap-3">

          <p className="text-base font-medium text-ink md:text-sm">
            Mutirões recentes
          </p>

          <button className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink">
            Ver histórico

            <ArrowRight
              className="h-3.5 w-3.5"
              strokeWidth={2}
            />
          </button>
        </div>

        <div className="divide-y divide-line">

          {recentes.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-4 py-4 first:pt-1 lg:flex-row lg:items-center"
            >

              {/* DATA */}
              <div className="lg:min-w-[88px]">

                <p className="text-sm font-medium text-ink">
                  {dataDiaMes(m.data)}
                </p>

                <p className="mt-1 text-xs text-subtle">
                  {diaSemanaCompleto(m.data).toLowerCase()}
                </p>
              </div>

              {/* INFO */}
              <div className="min-w-0 flex-1">

                <p className="text-sm font-medium text-ink md:text-base">
                  {m.local} · {m.cidade}-{m.estado}
                </p>

                <p className="mt-1 text-xs text-subtle md:text-sm">
                  {m.tipo} · {m.programa}
                </p>
              </div>

              {/* RESULTADO */}
              <div className="lg:text-right">

                <p className="text-sm text-ink">
                  <span className="font-semibold">
                    {m.atendimentosRealizados}
                  </span>{' '}
                  atendimentos
                </p>

                <p className="mt-1 text-xs text-subtle">
                  {m.encaminhamentos} encaminhados pra tratamento
                </p>
              </div>

              {/* BUTTON */}
              <button className="w-full rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft lg:w-auto">
                Relatório
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}