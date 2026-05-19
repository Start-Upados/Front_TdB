import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { KPICard, Card, AlertCard, SectionTitle, LegendRow } from '../components/Shared';
import { MONTHLY_DATA, ALERTS } from '../mockData';

const TT = {
  contentStyle: { background: '#152843', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 8, color: '#E8F4FD', fontSize: 11 },
  labelStyle:   { color: '#7EB3CE', fontWeight: 600 },
};
const TICK = { fill: '#3D6A85', fontSize: 10 };

const PROGRAMS = [
  { name: 'Dentista do Bem',  value: 75.5 },
  { name: 'Apolônias do Bem', value: 24.5 },
];

export default function OverviewPage() {
  return (
    <div>
      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 mb-3.5">
        <KPICard label="Total de pacientes"      value="247.893" change="+12,4% vs 2024" changeType="up"      accentColor="#00D4AA" />
        <KPICard label="Atendimentos concluídos" value="198.234" change="+9,8% vs 2024"  changeType="up"      accentColor="#40C4FF" />
        <KPICard label="Dentistas voluntários"   value="4.218"   change="+6,2% vs 2024"  changeType="up"      accentColor="#B39DDB" />
        <KPICard label="Cidades atendidas"       value="1.847"   change="+134 novas"     changeType="up"      accentColor="#00E676" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 mb-3.5">
        <KPICard label="Tratamentos ativos"   value="8.432"  change="Em andamento"    changeType="neutral" accentColor="#FF9557" />
        <KPICard label="Alta complexidade"    value="23,4%"  change="+2,1pp vs 2024"  changeType="down"    accentColor="#FF4757" />
        <KPICard label="Novos pacientes/mês"  value="1.243"  change="+8,7% vs mar"    changeType="up"      accentColor="#00D4AA" />
        <KPICard label="Taxa de sucesso"      value="94,7%"  change="+0,3pp vs 2024"  changeType="up"      accentColor="#00E676" />
      </div>

      {/* Charts Row — stack no mobile, 2/3 + 1/3 no desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 mb-3.5">

        {/* Area chart */}
        <Card title="Evolução mensal de atendimentos — 2025">
          <LegendRow items={[
            { color: '#00D4AA', label: 'Atendimentos'   },
            { color: '#40C4FF', label: 'Novos pacientes' },
          ]} />
          <div className="h-[180px] lg:h-[155px] mt-2.5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_DATA} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00D4AA" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#40C4FF" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#40C4FF" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={TICK} tickLine={false} axisLine={false} />
                <YAxis tick={TICK} tickLine={false} axisLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
                <Tooltip {...TT} />
                <Area type="monotone" dataKey="atendimentos" name="Atendimentos"
                  stroke="#00D4AA" strokeWidth={2} fill="url(#gTeal)"
                  dot={false} activeDot={{ r: 4, fill: '#00D4AA' }} />
                <Area type="monotone" dataKey="novos" name="Novos pacientes"
                  stroke="#40C4FF" strokeWidth={2} fill="url(#gBlue)"
                  dot={false} activeDot={{ r: 4, fill: '#40C4FF' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut */}
        <Card title="Distribuição por programa">
          <div className="h-[180px] lg:h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PROGRAMS} cx="50%" cy="50%" innerRadius={44} outerRadius={62} paddingAngle={3} dataKey="value">
                  <Cell fill="#00D4AA" />
                  <Cell fill="#B39DDB" />
                </Pie>
                <Tooltip contentStyle={TT.contentStyle} formatter={(v) => [`${v}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-1.5 mt-1 text-[11px] text-[#7EB3CE]">
            {PROGRAMS.map((p, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: i === 0 ? '#00D4AA' : '#B39DDB' }} />
                {p.name} — {p.value}%
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Alerts — empilham no mobile */}
      <SectionTitle>Alertas do sistema</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>{ALERTS.slice(0, 3).map((a, i) => <AlertCard key={i} {...a} />)}</div>
        <div>{ALERTS.slice(3).map((a, i) => <AlertCard key={i} {...a} />)}</div>
      </div>
    </div>
  );
}