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
import { AlertTriangle, Clock, UserMinus, ArrowRight } from 'lucide-react';
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
  danger:  { bg: 'bg-danger-soft',  text: 'text-danger'  },
  warning: { bg: 'bg-warning-soft', text: 'text-warning' },
  info:    { bg: 'bg-info-soft',    text: 'text-info'    },
};

function AlertRow({ icon: Icon, tone, title, subtitle, link, linkLabel }: AlertRowProps) {
  const palette = ALERT_TONES[tone];
  return (
    <div className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${palette.bg} ${palette.text}`}
      >
        <Icon className="w-4 h-4" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-muted mt-0.5">{subtitle}</p>
      </div>
      <Link
        to={link}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors whitespace-nowrap"
      >
        {linkLabel}
        <ArrowRight className="w-3 h-3" strokeWidth={2} />
      </Link>
    </div>
  );
}

export default function VisaoGeralPage() {
  return (
    <div className="flex flex-col gap-5 max-w-[1280px]">

      {/* Saudação */}
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-ink">Bom dia, Renata</h1>
        <p className="text-xs text-muted">Outubro de 2025</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Alertas */}
      <div className="bg-surface border border-line rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Precisa de atenção agora</h2>
          <span className="text-2xs text-subtle">3 itens</span>
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

      {/* Gráfico + Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        <div className="lg:col-span-7 bg-surface border border-line rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">Atendimentos por mês</h2>
            <span className="text-2xs text-subtle">Últimos 6 meses</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" vertical={false} />
                <XAxis
                  dataKey="mes"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgb(var(--surface))',
                    border: '1px solid rgb(var(--line))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'rgb(var(--muted))' }}
                  cursor={{ fill: 'rgb(var(--surface-soft))' }}
                />
                <Bar
                  dataKey="atendimentos"
                  fill="rgb(var(--brand))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                >
                  <LabelList
                    dataKey="atendimentos"
                    position="top"
                    style={{ fontSize: 10, fill: 'rgb(var(--ink))', fontWeight: 500 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-surface border border-line rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">Distribuição por programa</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm text-ink">Dentista do Bem</span>
                <span className="text-sm font-medium text-ink">576</span>
              </div>
              <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all" style={{ width: '68%' }} />
              </div>
              <p className="text-2xs text-subtle mt-1">68% do total</p>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm text-ink">Apolônias do Bem</span>
                <span className="text-sm font-medium text-ink">271</span>
              </div>
              <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: '32%' }} />
              </div>
              <p className="text-2xs text-subtle mt-1">32% do total</p>
            </div>
          </div>

          <div className="border-t border-line mt-5 pt-4 flex items-center justify-between text-xs">
            <span className="text-muted">Total no mês</span>
            <span className="font-medium text-ink">847 atendimentos</span>
          </div>
        </div>

      </div>

    </div>
  );
}