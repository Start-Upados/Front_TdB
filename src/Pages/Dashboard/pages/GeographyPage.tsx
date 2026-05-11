import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { KPICard, Card, AlertCard, SectionTitle } from '../components/Shared';
import { REGIONS, TOP_STATES, LOW_COVERAGE } from '../mockData';

const TT = {
  contentStyle: { background: '#152843', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 8, color: '#E8F4FD', fontSize: 11 },
  labelStyle:   { color: '#7EB3CE', fontWeight: 600 },
};
const TICK = { fill: '#3D6A85', fontSize: 10 };

function coverageColor(pct: number) {
  if (pct >= 80) return '#00D4AA';
  if (pct >= 60) return '#40C4FF';
  if (pct >= 40) return '#FFD740';
  return '#FF4757';
}

export default function GeographyPage() {
  return (
    <div>
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3 mb-3.5">
        <KPICard label="Estados cobertos"   value="27/27"  change="Cobertura total"  changeType="up"      accentColor="#00D4AA" />
        <KPICard label="Cidades atendidas"  value="1.847"  change="+134 em 2025"     changeType="up"      accentColor="#40C4FF" />
        <KPICard label="Países atendidos"   value="3"      change="BR · AR · PE"     changeType="neutral" accentColor="#B39DDB" />
        <KPICard label="Cobertura no Norte" value="34%"    change="Região crítica"   changeType="down"    accentColor="#FF4757" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[2fr_1fr] gap-3 mb-3.5">

        {/* Regional bar chart */}
        <Card title="Dentistas por região">
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={REGIONS} margin={{ top: 4, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={TICK} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name"
                  tick={{ ...TICK, fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip {...TT} formatter={(v: any) => [v.toLocaleString('pt-BR'), 'Dentistas']} />
                <Bar dataKey="dentistas" name="Dentistas" radius={[0, 4, 4, 0]}>
                  {REGIONS.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Patients summary */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-[rgba(0,212,170,0.1)] flex-wrap">
            {REGIONS.map((r) => (
              <div
                key={r.name}
                className="flex-1 min-w-[90px] bg-[#0C1B2E] rounded-[8px] px-2.5 py-[7px] border-t-2"
                style={{ borderTopColor: r.color }}
              >
                <p className="text-[13px] font-bold text-[#E8F4FD]">
                  {r.pacientes.toLocaleString('pt-BR')}
                </p>
                <p className="text-[10px] text-[#3D6A85] mt-0.5">{r.name}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Right column */}
        <div>
          <Card title="Baixa cobertura — alertas" className="mb-3">
            {LOW_COVERAGE.map((lc) => (
              <AlertCard
                key={lc.state}
                type={lc.type}
                title={`${lc.state} — ${lc.dentists} dentistas`}
                description={`Precisa de ${lc.need} · Déficit: ${lc.gap}`}
              />
            ))}
          </Card>

          <Card title="Tempo médio de permanência">
            <div className="grid grid-cols-3 gap-2 text-center py-1">
              {[
                { label: 'Nacional', value: '127', unit: 'dias', color: 'text-[#E8F4FD]'  },
                { label: 'Sudeste',  value: '89',  unit: 'dias', color: 'text-[#00D4AA]'  },
                { label: 'Norte',    value: '198', unit: 'dias', color: 'text-[#FF4757]'  },
              ].map(({ label, value, unit, color }) => (
                <div key={label}>
                  <p className={`text-[20px] font-bold leading-none ${color}`}>{value}</p>
                  <p className="text-[9.5px] text-[#3D6A85] mt-1">{unit}</p>
                  <p className="text-[10px] text-[#7EB3CE] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Top states table */}
      <SectionTitle>Top 10 estados — dentistas e cobertura</SectionTitle>
      <Card>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Estado', 'Dentistas', 'Cobertura', '%'].map((h) => (
                <th key={h} className="text-left px-2.5 py-1.5 text-[10px] text-[#3D6A85] border-b border-[rgba(0,212,170,0.1)] font-semibold uppercase tracking-[0.5px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOP_STATES.map((s) => (
              <tr key={s.state} className="hover:bg-[rgba(0,212,170,0.025)]">
                <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)]">
                  <span className="font-semibold text-[#E8F4FD] text-[12.5px]">{s.state}</span>
                  <span className="ml-2 text-[11px] text-[#3D6A85]">{s.fullName}</span>
                </td>
                <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] text-[12.5px] text-[#7EB3CE]">
                  {s.dentists.toLocaleString('pt-BR')}
                </td>
                <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] w-[35%]">
                  <div className="h-[5px] bg-white/[0.06] rounded-[3px] overflow-hidden">
                    <div className="h-full rounded-[3px]"
                      style={{ width: `${s.coverage}%`, background: coverageColor(s.coverage) }} />
                  </div>
                </td>
                <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] text-[12.5px] font-semibold"
                  style={{ color: coverageColor(s.coverage) }}>
                  {s.coverage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="flex gap-4 mt-3.5 pt-2.5 border-t border-[rgba(0,212,170,0.1)] text-[10.5px] text-[#3D6A85] flex-wrap">
          {[
            { color: '#00D4AA', label: '≥ 80% — Excelente' },
            { color: '#40C4FF', label: '60–79% — Bom'      },
            { color: '#FFD740', label: '40–59% — Regular'  },
            { color: '#FF4757', label: '< 40% — Crítico'   },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="w-[9px] h-[9px] rounded-[2px]" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}