import {
  Repeat,
  Users,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import { KpiCard } from '../components/KpiCard';

import {
  obterKpisFinanceiro,
  obterChartReceitaCustos,
  listarDoacoesRecentes,
  listarParceiros,
} from '../services/financeiro';

import type {
  Doacao,
  Parceiro,
} from '../data/financeiro';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const MESES_CURTOS = [
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

function formatarR$(valor: number): string {
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toLocaleString('pt-BR', {
      maximumFractionDigits: 1,
    })}k`;
  }

  return `R$ ${valor.toLocaleString('pt-BR')}`;
}

function formatarDataCurta(iso: string): string {
  const d = new Date(iso + 'T12:00:00');

  return `${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
}

// ─────────────────────────────────────────────
// DOAÇÃO ROW
// ─────────────────────────────────────────────

function DoacaoRow({ d }: { d: Doacao }) {
  const acao = {
    agradecer: {
      label: 'Agradecer',
      disabled: false,
    },

    recibo: {
      label: 'Recibo',
      disabled: false,
    },

    'sem-contato': {
      label: 'Sem contato',
      disabled: true,
    },
  }[d.acaoSugerida];

  return (
    <div className="flex flex-col gap-4 border-t border-line py-4 first:border-t-0 first:pt-1 sm:flex-row sm:items-center">

      {/* DATA */}
      <div className="sm:min-w-[72px]">
        <p className="text-sm font-medium text-ink">
          {formatarDataCurta(d.data)}
        </p>
      </div>

      {/* INFO */}
      <div className="min-w-0 flex-1">

        <p className="inline-flex flex-wrap items-center gap-1.5 text-sm font-medium text-ink md:text-base">
          {d.doador}

          {d.isRecorrente && (
            <Repeat
              className="h-3.5 w-3.5 text-info"
              strokeWidth={2}
            />
          )}
        </p>

        <p className="mt-1 text-xs leading-relaxed text-subtle md:text-sm">
          {d.descricao}
        </p>
      </div>

      {/* VALOR */}
      <span className="text-base font-semibold text-success md:text-sm">
        {formatarR$(d.valor)}
      </span>

      {/* BUTTON */}
      <button
        disabled={acao.disabled}
        className={`w-full rounded-xl border border-line px-4 py-2 text-sm transition-colors sm:w-auto ${
          acao.disabled
            ? 'cursor-not-allowed text-subtle opacity-50'
            : 'text-ink hover:bg-surface-soft'
        }`}
      >
        {acao.label}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// PARCEIRO ROW
// ─────────────────────────────────────────────

function ParceiroRow({ p }: { p: Parceiro }) {
  const isAlerta =
    p.proximaRenovacao?.urgencia ===
    'iminente';

  return (
    <div className="flex flex-col gap-4 border-t border-line py-4 first:border-t-0 first:pt-1 sm:flex-row sm:items-center">

      {/* AVATAR */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-medium ${
        p.isConsolidado
          ? 'bg-info-soft text-info'
          : 'bg-surface-soft text-ink'
      }`}>
        {p.isConsolidado ? (
          <Users
            className="h-4 w-4"
            strokeWidth={2}
          />
        ) : (
          p.iniciais
        )}
      </div>

      {/* INFO */}
      <div className="min-w-0 flex-1">

        <p className="text-sm font-medium text-ink md:text-base">
          {p.nome}
        </p>

        <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">
          {p.isConsolidado
            ? `${p.contagemPessoas} ativos · ${formatarR$(p.valorAnual)}/ano consolidado`
            : `${p.tipoLabel} · ${formatarR$(p.valorAnual)}/ano`}
        </p>

        {p.proximaRenovacao && (
          <p className={`mt-1 inline-flex items-center gap-1 text-xs ${
            isAlerta
              ? 'text-warning'
              : 'text-subtle'
          }`}>
            {isAlerta && (
              <AlertTriangle
                className="h-3.5 w-3.5"
                strokeWidth={2}
              />
            )}

            {p.proximaRenovacao.label}
          </p>
        )}

        {p.detalhe && (
          <p className="mt-1 text-xs text-success">
            {p.detalhe}
          </p>
        )}
      </div>

      {/* BUTTON */}
      <button className={`w-full rounded-xl px-4 py-2 text-sm transition-colors sm:w-auto ${
        isAlerta
          ? 'bg-ink text-surface hover:opacity-90'
          : 'border border-line text-ink hover:bg-surface-soft'
      }`}>
        {isAlerta ? 'Renovar' : 'Ver'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function FinanceiroPage() {
  const kpis = obterKpisFinanceiro();

  const chart = obterChartReceitaCustos();

  const doacoes = listarDoacoesRecentes();

  const parceiros = listarParceiros();

  const variacaoCusto =
    kpis.variacao.custoPorAtendimento;

  const subCusto =
    `${variacaoCusto > 0 ? '+' : ''}R$ ${variacaoCusto} vs trimestre`;

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <KpiCard
          label="Doações no mês"
          value={formatarR$(kpis.doacoesNoMes)}
          valueTone="success"
          sub={`+${formatarR$(kpis.variacao.doacoes)} vs setembro`}
          subTone="success"
        />

        <KpiCard
          label="Custos no mês"
          value={formatarR$(kpis.custosNoMes)}
          valueTone="warning"
          sub="material, transporte, admin"
        />

        <KpiCard
          label="Saldo do mês"
          value={`+${formatarR$(kpis.saldoMes)}`}
          sub={`${kpis.margem}% de margem`}
          subTone="success"
        />

        <KpiCard
          label="Custo por atendimento"
          value={`R$ ${kpis.custoPorAtendimento}`}
          sub={subCusto}
          subTone={
            variacaoCusto < 0
              ? 'success'
              : 'warning'
          }
        />
      </div>

      {/* CHART */}
      <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <h2 className="text-base font-semibold text-ink md:text-sm">
            Receita vs custos · últimos 6 meses
          </h2>

          <span className="text-xs text-subtle">
            Valores em milhares de R$
          </span>
        </div>

        <div className="h-[320px] md:h-[260px]">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={chart}
              margin={{
                top: 10,
                right: 20,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgb(var(--line))"
                vertical={false}
              />

              <XAxis
                dataKey="mes"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fill: 'rgb(var(--muted))',
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fill: 'rgb(var(--muted))',
                }}
                tickFormatter={(v: number) =>
                  `${v / 1000}k`
                }
              />

              <Tooltip
                contentStyle={{
                  background:
                    'rgb(var(--surface))',
                  border:
                    '1px solid rgb(var(--line))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                labelStyle={{
                  color: 'rgb(var(--muted))',
                }}
                formatter={(value) =>
                  formatarR$(Number(value))
                }
              />

              <Legend
                wrapperStyle={{
                  fontSize: 11,
                  paddingTop: 10,
                }}
                iconType="line"
              />

              <Line
                type="monotone"
                dataKey="receita"
                name="Receita"
                stroke="rgb(var(--success))"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: 'rgb(var(--success))',
                }}
                activeDot={{ r: 5 }}
              />

              <Line
                type="monotone"
                dataKey="custos"
                name="Custos"
                stroke="rgb(var(--warning))"
                strokeWidth={2.5}
                strokeDasharray="4 3"
                dot={{
                  r: 3,
                  fill: 'rgb(var(--warning))',
                }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

        {/* DOAÇÕES */}
        <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">

          <div className="mb-5 flex items-center justify-between gap-3">

            <h2 className="text-base font-semibold text-ink md:text-sm">
              Doações recentes
            </h2>

            <button className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink">
              Ver todas

              <ArrowRight
                className="h-3.5 w-3.5"
                strokeWidth={2}
              />
            </button>
          </div>

          <div>
            {doacoes.map((d) => (
              <DoacaoRow key={d.id} d={d} />
            ))}
          </div>
        </div>

        {/* PARCEIROS */}
        <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">

          <div className="mb-5 flex items-center justify-between gap-3">

            <h2 className="text-base font-semibold text-ink md:text-sm">
              Parceiros e doadores
            </h2>

            <button className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink">
              Ver todos

              <ArrowRight
                className="h-3.5 w-3.5"
                strokeWidth={2}
              />
            </button>
          </div>

          <div>
            {parceiros.map((p) => (
              <ParceiroRow key={p.id} p={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}