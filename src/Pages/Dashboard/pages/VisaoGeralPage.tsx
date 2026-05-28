import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';

import {
  AlertTriangle,
  Clock,
  UserMinus,
  ArrowRight,
} from 'lucide-react';

import { KpiCard } from '../components/KpiCard';

const monthlyData = [
  { mes: 'Mai', atendimentos: 612 },
  { mes: 'Jun', atendimentos: 678 },
  { mes: 'Jul', atendimentos: 721 },
  { mes: 'Ago', atendimentos: 765 },
  { mes: 'Set', atendimentos: 792 },
  { mes: 'Out', atendimentos: 847 },
];

interface AlertRowProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: 'danger' | 'warning' | 'info';
  title: string;
  subtitle: string;
  link: string;
  linkLabel: string;
}

const ALERT_TONES = {
  danger: {
    bg: 'bg-danger-soft',
    text: 'text-danger',
  },
  warning: {
    bg: 'bg-warning-soft',
    text: 'text-warning',
  },
  info: {
    bg: 'bg-info-soft',
    text: 'text-info',
  },
};

function AlertRow({
  icon: Icon,
  tone,
  title,
  subtitle,
  link,
  linkLabel,
}: AlertRowProps) {
  const palette = ALERT_TONES[tone];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 first:pt-1 last:pb-1">

      <div className="flex items-start gap-3 flex-1 min-w-0">

        <div
          className={`
            w-10
            h-10
            rounded-full
            flex
            items-center
            justify-center
            shrink-0
            ${palette.bg}
            ${palette.text}
          `}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>

        <div className="min-w-0">
          <p className="text-sm md:text-base font-medium text-ink leading-relaxed">
            {title}
          </p>

          <p className="text-xs md:text-sm text-muted mt-1 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      <Link
        to={link}
        className="
          inline-flex
          items-center
          justify-center
          gap-1.5
          text-sm
          px-4
          py-2
          rounded-xl
          border
          border-line
          text-ink
          hover:bg-surface-soft
          transition-colors
          whitespace-nowrap
          w-full
          sm:w-auto
        "
      >
        {linkLabel}

        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </Link>
    </div>
  );
}

export default function VisaoGeralPage() {
  return (
    <div className="flex flex-col gap-5 w-full max-w-full">

      {/* SAUDAÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl md:text-xl font-semibold text-ink">
          Bom dia, Renata
        </h1>

        <p className="text-sm md:text-xs text-muted">
          Outubro de 2025
        </p>
      </div>

      {/* KPIS */}
      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        xl:grid-cols-4
        gap-4
      ">
        <KpiCard
          label="Atendimentos no mês"
          value="847"
          sub="+11% vs setembro"
          subTone="success"
        />

        <KpiCard
          label="Pacientes em tratamento"
          value="312"
          sub="47 na fila de espera"
        />

        <KpiCard
          label="Dentistas ativos"
          value="1.284"
          sub="de 1.452 cadastrados"
        />

        <KpiCard
          label="Doações no mês"
          value="R$ 84k"
          sub="+R$ 12k vs setembro"
          subTone="success"
        />
      </div>

      {/* ALERTAS */}
      <div className="
        bg-surface
        border
        border-line
        rounded-2xl
        p-4
        md:p-5
      ">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-base md:text-sm font-semibold text-ink">
            Precisa de atenção agora
          </h2>

          <span className="text-xs text-subtle whitespace-nowrap">
            3 itens
          </span>
        </div>

        <div className="divide-y divide-line">
          <AlertRow
            icon={AlertTriangle}
            tone="danger"
            title="5 solicitações Alta sem resposta há +24h"
            subtitle="3 do WhatsApp, 2 do site · risco de perder contato"
            link="/dashboard/comunicacoes"
            linkLabel="Abrir Central"
          />

          <AlertRow
            icon={Clock}
            tone="warning"
            title="3 pacientes na fila há +60 dias"
            subtitle="Risco de evasão · sem dentista compatível na região"
            link="/dashboard/triagens"
            linkLabel="Abrir Triagens"
          />

          <AlertRow
            icon={UserMinus}
            tone="info"
            title="8 dentistas sem atividade há +90 dias"
            subtitle="Vale enviar reengajamento ou consultar disponibilidade"
            link="/dashboard/voluntarios"
            linkLabel="Abrir Voluntários"
          />
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* CHART */}
        <div className="
          xl:col-span-7
          bg-surface
          border
          border-line
          rounded-2xl
          p-4
          md:p-5
        ">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="text-base md:text-sm font-semibold text-ink">
              Atendimentos por mês
            </h2>

            <span className="text-xs text-subtle">
              Últimos 6 meses
            </span>
          </div>

          <div className="h-[260px] md:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{
                  top: 20,
                  right: 10,
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
                />

                <Tooltip
                  contentStyle={{
                    background: 'rgb(var(--surface))',
                    border: '1px solid rgb(var(--line))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  labelStyle={{
                    color: 'rgb(var(--muted))',
                  }}
                  cursor={{
                    fill: 'rgb(var(--surface-soft))',
                  }}
                />

                <Bar
                  dataKey="atendimentos"
                  fill="rgb(var(--brand))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                >
                  <LabelList
                    dataKey="atendimentos"
                    position="top"
                    style={{
                      fontSize: 10,
                      fill: 'rgb(var(--ink))',
                      fontWeight: 500,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DISTRIBUIÇÃO */}
        <div className="
          xl:col-span-5
          bg-surface
          border
          border-line
          rounded-2xl
          p-4
          md:p-5
        ">
          <div className="mb-5">
            <h2 className="text-base md:text-sm font-semibold text-ink">
              Distribuição por programa
            </h2>
          </div>

          <div className="space-y-5">

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-ink">
                  Dentista do Bem
                </span>

                <span className="text-sm font-medium text-ink">
                  576
                </span>
              </div>

              <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: '68%' }}
                />
              </div>

              <p className="text-xs text-subtle mt-1">
                68% do total
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-ink">
                  Apolônias do Bem
                </span>

                <span className="text-sm font-medium text-ink">
                  271
                </span>
              </div>

              <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: '32%' }}
                />
              </div>

              <p className="text-xs text-subtle mt-1">
                32% do total
              </p>
            </div>
          </div>

          <div className="
            border-t
            border-line
            mt-6
            pt-4
            flex
            items-center
            justify-between
            text-sm
          ">
            <span className="text-muted">
              Total no mês
            </span>

            <span className="font-medium text-ink">
              847 atendimentos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}