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
import {
  obterKpis,
  obterGraficoMensal,
  listarAlertas,
  obterDistribuicao,
} from '../services/visaoGeral';
import type { IconeAlerta } from '../data/visaoGeral';

// Mapa chave -> componente de ícone (o data não guarda componentes React)
const ICONES_ALERTA: Record<IconeAlerta, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  alerta:  AlertTriangle,
  relogio: Clock,
  usuario: UserMinus,
};

const COR_BARRA: Record<'brand' | 'accent', string> = {
  brand:  'bg-brand',
  accent: 'bg-accent',
};

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
  const kpis = obterKpis();
  const grafico = obterGraficoMensal();
  const alertas = listarAlertas();
  const { itens: distribuicao, total } = obterDistribuicao();

  return (
    <div className="flex flex-col gap-5 w-full max-w-full">

      {/* SAUDAÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl md:text-xl font-extrabold text-[#CED600]">
          Bem vindo(a)!
          <p className="text-2xl md:text-xl font-extrabold text-[#E88407]">Admin</p>
        </h1>

        <p className="text-sm md:text-xs text-muted">
          Junho de 2026
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
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
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
            {alertas.length} itens
          </span>
        </div>

        <div className="divide-y divide-line">
          {alertas.map((a) => (
            <AlertRow
              key={a.id}
              icon={ICONES_ALERTA[a.icone]}
              tone={a.tone}
              title={a.titulo}
              subtitle={a.subtitulo}
              link={a.link}
              linkLabel={a.linkLabel}
            />
          ))}
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
                data={grafico}
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
                  fill="#2563EB"
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
            {distribuicao.map((d) => (
              <div key={d.programa}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink">
                    {d.programa}
                  </span>

                  <span className="text-sm font-medium text-ink">
                    {d.valor}
                  </span>
                </div>

                <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
                  <div
                    className={`h-full ${COR_BARRA[d.cor]} rounded-full transition-all`}
                    style={{ width: `${d.percent}%` }}
                  />
                </div>

                <p className="text-xs text-subtle mt-1">
                  {d.percent}% do total
                </p>
              </div>
            ))}
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
              {total} atendimentos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}