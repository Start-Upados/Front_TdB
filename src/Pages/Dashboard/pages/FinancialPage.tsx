import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { KPICard, Card, SectionTitle, LegendRow, PartnerRow } from '../components/Shared';
import { MONTHLY_DONATIONS, COST_BREAKDOWN, PARTNERS } from '../mockData';

const TT = {
  contentStyle: { background: '#152843', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 8, color: '#E8F4FD', fontSize: 11 },
  labelStyle:   { color: '#7EB3CE', fontWeight: 600 },
};
const TICK = { fill: '#3D6A85', fontSize: 10 };
const CURRENT_MONTHS = 4;

export default function FinancialPage() {
  return (
    <div>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3.5">
        <KPICard label="Doações YTD 2025"       value="R$ 4,28M" change="+11% vs 2024"       changeType="up" accentColor="#00D4AA" />
        <KPICard label="Custo médio/tratamento"  value="R$ 380"   change="-4,2% otimizado"    changeType="up" accentColor="#40C4FF" />
        <KPICard label="ROI social"              value="R$ 8,70"  change="por R$1,00 invest."  changeType="up" accentColor="#B39DDB" />
        <KPICard label="Empresas parceiras"      value="5"        change="1 nova em 2025"       changeType="up" accentColor="#FFD740" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 mb-3.5">

        {/* Donations bar chart */}
        <Card title="Doações mensais — 2025 (R$ mil)">
          <LegendRow items={[
            { color: '#00D4AA',               label: 'Recebido (Jan–Abr)'     },
            { color: 'rgba(0,212,170,0.25)',  label: 'Projeção (Mai–Dez)'     },
          ]} />
          <div className="h-[162px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_DONATIONS} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={TICK} tickLine={false} axisLine={false} />
                <YAxis tick={TICK} tickLine={false} axisLine={false}
                  tickFormatter={(v: number) => `R$${v}k`} />
                <Tooltip {...TT} formatter={(v) => [`${v ?? 0}%`, 'Doações']} />
                <Bar dataKey="valor" name="Doações" radius={[3, 3, 0, 0]}>
                  {MONTHLY_DONATIONS.map((_, i) => (
                    <Cell key={i} fill={i < CURRENT_MONTHS ? '#00D4AA' : 'rgba(0,212,170,0.25)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2.5 mt-3.5 pt-3.5 border-t border-[rgba(0,212,170,0.1)] text-center">
            {[
              { label: 'Média mensal',  value: 'R$ 355k',       color: 'text-[#E8F4FD]' },
              { label: 'Maior mês',    value: 'Set · R$ 512k',  color: 'text-[#00D4AA]' },
              { label: 'Projeção Dez', value: 'R$ 4,9M',        color: 'text-[#B39DDB]' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className={`text-[14px] font-bold leading-none ${color}`}>{value}</p>
                <p className="text-[10.5px] text-[#3D6A85] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Right column */}
        <div>
          {/* Cost donut */}
          <Card title="Distribuição de custos" className="mb-3">
            <div className="h-[128px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={COST_BREAKDOWN} cx="50%" cy="50%" innerRadius={36} outerRadius={54} paddingAngle={2} dataKey="value">
                    {COST_BREAKDOWN.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TT.contentStyle} formatter={(v) => [`${v}%`, 'Distribuição de custos']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <LegendRow items={COST_BREAKDOWN.slice(0, 3).map((c) => ({
              color: c.color,
              label: `${c.name.split(' ')[0]} ${c.value}%`,
            }))} />
          </Card>

          {/* ROI card */}
          <Card title="ROI social — retorno sobre investimento">
            <div className="text-center py-2">
              <p className="text-[36px] font-bold text-[#00D4AA] leading-none">8,7x</p>
              <p className="text-[11px] text-[#3D6A85] mt-1.5">Para cada R$1,00 investido</p>
              <div className="mt-3 px-3 py-2 bg-[#0C1B2E] rounded-[8px] text-[11px] text-[#7EB3CE] leading-relaxed">
                R$ 4,28M investidos gerou{' '}
                <span className="text-[#00D4AA] font-semibold">R$ 37,2M</span>{' '}
                em valor social estimado
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Partners */}
      <SectionTitle>Empresas parceiras 2025</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] mb-3.5">
        <div>
          {PARTNERS.slice(0, 3).map((p) => <PartnerRow key={p.name} {...p} />)}
        </div>
        <div>
          {PARTNERS.slice(3).map((p) => <PartnerRow key={p.name} {...p} />)}

          {/* CTA */}
          <div className="px-3.5 py-3 bg-[rgba(0,212,170,0.08)] border border-dashed border-[rgba(0,212,170,0.35)] rounded-[9px] mt-1.5 text-center">
            <p className="text-[12px] font-semibold text-[#00D4AA]">+ Torne-se um parceiro</p>
            <p className="text-[10.5px] text-[#3D6A85] mt-1">
              Transforme investimento em impacto social real
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}