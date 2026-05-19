import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { KPICard, Card, ProgressBar, SectionTitle, LegendRow } from '../components/Shared';
import { AGE_DATA, SEVERITY_DATA, BEFORE_AFTER_DATA } from '../mockData';

const TT = {
  contentStyle: { background: '#152843', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 8, color: '#E8F4FD', fontSize: 11 },
  labelStyle:   { color: '#7EB3CE', fontWeight: 600 },
};
const TICK = { fill: '#3D6A85', fontSize: 10 };

const AGE_COLORS = ['#9FE1CB', '#1D9E75', '#0F6E56', '#085041'];

export default function SocialImpactPage() {
  return (
    <div>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3.5">
        <KPICard label="Retorno à escola"      value="89,3%" change="dos pacientes"       changeType="up"   accentColor="#00D4AA" />
        <KPICard label="Melhora de autoestima" value="94,2%" change="índice antes/depois" changeType="up"   accentColor="#B39DDB" />
        <KPICard label="Inserção no mercado"   value="34,7%" change="acima da média"      changeType="up"   accentColor="#40C4FF" />
        <KPICard label="Casos de violência"    value="1.847" change="0,74% do total"      changeType="down" accentColor="#FF4757" />
      </div>

      {/* Main row */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 mb-3.5">

        {/* Left */}
        <div>
          <Card title="Perfil dos beneficiários — faixa etária" className="mb-3">
            <LegendRow items={AGE_DATA.map((a, i) => ({ color: AGE_COLORS[i], label: `${a.grupo} (${a.pct}%)` }))} />
            <div className="h-[160px] lg:h-[130px] mt-2.5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={AGE_DATA} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="grupo" tick={TICK} tickLine={false} axisLine={false} />
                  <YAxis tick={TICK} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip {...TT} formatter={(v) => [`${v}%`, 'Participação']} />
                  <Bar dataKey="pct" name="%" radius={[4, 4, 0, 0]}>
                    {AGE_DATA.map((_, i) => <Cell key={i} fill={AGE_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card title="Gênero">
              <ProgressBar label="Feminino"  value={54} color="#D4537E" />
              <ProgressBar label="Masculino" value={46} color="#40C4FF" />
            </Card>
            <Card title="Vulnerabilidade social">
              <ProgressBar label="Alta"  value={67} color="#FF4757" />
              <ProgressBar label="Média" value={24} color="#FF9557" />
              <ProgressBar label="Baixa" value={9}  color="#00E676" />
            </Card>
          </div>
        </div>

        {/* Right */}
        <div>
          <Card title="Severidade dos casos" className="mb-3">
            <div className="h-[180px] lg:h-[128px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={SEVERITY_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={56} paddingAngle={3} dataKey="value">
                    {SEVERITY_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TT.contentStyle} formatter={(v) => [`${v}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <LegendRow items={SEVERITY_DATA.map((s) => ({ color: s.color, label: `${s.name} ${s.value}%` }))} />
          </Card>

          <Card title="Antes vs Depois do tratamento">
            <div className="h-[180px] lg:h-[128px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={BEFORE_AFTER_DATA} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={TICK} tickLine={false} axisLine={false}
                    domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis type="category" dataKey="metrica"
                    tick={{ ...TICK, fontSize: 10 }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip {...TT} formatter={(v) => [`${v}%`, '']} />
                  <Bar dataKey="antes"  name="Antes"  fill="rgba(255,71,87,0.5)"  radius={[0, 3, 3, 0]} />
                  <Bar dataKey="depois" name="Depois" fill="#00D4AA"               radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <LegendRow items={[
              { color: 'rgba(255,71,87,0.5)', label: 'Antes'  },
              { color: '#00D4AA',             label: 'Depois' },
            ]} />
          </Card>
        </div>
      </div>

      {/* Accumulated impact */}
      <SectionTitle>Impacto social acumulado</SectionTitle>
      <Card>
        <div className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-[rgba(0,212,170,0.1)] gap-y-3 lg:gap-y-0">
          {[
            { value: '247.893',  label: 'vidas transformadas',      color: '#00D4AA' },
            { value: 'R$ 8,70',  label: 'ROI social por R$1,00',    color: '#00E676' },
            { value: '22 anos',  label: 'de voluntariado contínuo', color: '#40C4FF' },
            { value: '3 países', label: 'Brasil · Argentina · Peru', color: '#B39DDB' },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-center py-2.5 px-2 sm:px-4">
              <p className="text-[22px] sm:text-[26px] font-bold leading-none whitespace-nowrap" style={{ color }}>{value}</p>
              <p className="text-[10.5px] text-[#3D6A85] mt-1 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Programs */}
      <div className="mt-3.5">
        <SectionTitle>Por programa</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card title="Dentista do Bem">
            <p className="text-[22px] font-bold text-[#00D4AA] mb-1">187.234</p>
            <p className="text-[11px] text-[#3D6A85] mb-3">75,5% dos pacientes atendidos</p>
            <ProgressBar label="Progresso da meta 2025" value={84} color="#00D4AA" />
          </Card>
          <Card title="Apolônias do Bem">
            <p className="text-[22px] font-bold text-[#B39DDB] mb-1">60.659</p>
            <p className="text-[11px] text-[#3D6A85] mb-3">24,5% dos pacientes atendidos</p>
            <ProgressBar label="Progresso da meta 2025" value={76} color="#B39DDB" />
          </Card>
        </div>
      </div>
    </div>
  );
}