import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { KPICard, Card, ProgressBar, SectionTitle, AlertCard, LegendRow } from '../components/Shared';
import { TOP_VOLUNTEERS, VOLUNTEER_GROWTH, NEW_VOLUNTEERS_MONTHLY } from '../mockData';

const TT = {
  contentStyle: { background: '#152843', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 8, color: '#E8F4FD', fontSize: 11 },
  labelStyle:   { color: '#7EB3CE', fontWeight: 600 },
};
const TICK = { fill: '#3D6A85', fontSize: 10 };

const RANK_STYLE: Record<number, string> = {
  1: 'bg-[rgba(255,215,64,0.15)] text-[#FFD740]',
  2: 'bg-[rgba(179,157,219,0.15)] text-[#B39DDB]',
  3: 'bg-[rgba(255,149,87,0.15)] text-[#FF9557]',
};

export default function VolunteersPage() {
  return (
    <div>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3.5">
        <KPICard label="Dentistas ativos"        value="3.156" change="74,8% do total" changeType="up"   accentColor="#00D4AA" />
        <KPICard label="Dentistas inativos"      value="1.062" change="25,2% do total" changeType="down" accentColor="#FF4757" />
        <KPICard label="Novos voluntários/mês"   value="87"    change="+14% vs mar"    changeType="up"   accentColor="#B39DDB" />
        <KPICard label="Média pacientes/dentista" value="58,7" change="+4,2 vs 2024"   changeType="up"   accentColor="#FFD740" />
      </div>

      {/* Main grid — stack no mobile, 3/2 no desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3 mb-3.5">

        {/* Top volunteers table */}
        <Card title="Top voluntários — pacientes atendidos em 2025">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>
                  {['#', 'Dentista', 'Cidade', 'Pacientes', 'Avaliação', 'Status'].map((h) => (
                    <th key={h} className="text-left px-2.5 py-1.5 text-[10px] text-[#3D6A85] border-b border-[rgba(0,212,170,0.1)] font-semibold uppercase tracking-[0.5px] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_VOLUNTEERS.map((v) => (
                  <tr key={v.rank} className="hover:bg-[rgba(0,212,170,0.025)]">
                    <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)]">
                      {RANK_STYLE[v.rank] ? (
                        <span className={`inline-flex items-center justify-center w-[22px] h-[22px] rounded-[5px] text-[11px] font-bold ${RANK_STYLE[v.rank]}`}>
                          {v.rank}
                        </span>
                      ) : (
                        <span className="text-[#3D6A85] text-[12px]">{v.rank}</span>
                      )}
                    </td>
                    <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] text-[12.5px] text-[#E8F4FD] whitespace-nowrap">{v.name}</td>
                    <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] text-[11.5px] text-[#7EB3CE] whitespace-nowrap">{v.city}</td>
                    <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] text-[12.5px] text-[#7EB3CE]">
                      <span className="font-semibold text-[#00D4AA]">{v.patients}</span>
                    </td>
                    <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] text-[12.5px] text-[#7EB3CE]">
                      <span className="flex items-center gap-1">
                        <span className="text-[#FFD740] text-[11px]">★</span>
                        {v.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-[7px] py-[2px] rounded-full
                        ${v.status === 'active'
                          ? 'bg-[rgba(0,230,118,0.12)] text-[#00E676]'
                          : 'bg-[rgba(255,149,87,0.12)] text-[#FF9557]'}`}>
                        <span className="w-1 h-1 rounded-full bg-current" />
                        {v.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right column */}
        <div>
          <Card title="Crescimento da rede — 2021–2025" className="mb-3">
            <div className="h-[140px] lg:h-[112px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={VOLUNTEER_GROWTH} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={TICK} tickLine={false} axisLine={false} />
                  <YAxis tick={TICK} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} />
                  <Tooltip {...TT} formatter={(v: any) => [v.toLocaleString('pt-BR'), 'Voluntários']} />
                  <Line type="monotone" dataKey="total" name="Voluntários"
                    stroke="#B39DDB" strokeWidth={2.5} dot={{ fill: '#B39DDB', r: 4 }} activeDot={{ r: 5, fill: '#B39DDB' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Taxa de engajamento por região">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-3.5">
              <div className="text-center shrink-0">
                <p className="text-[28px] font-bold text-[#E8F4FD] leading-none">74,8%</p>
                <p className="text-[10.5px] text-[#3D6A85] mt-1">engajamento geral</p>
              </div>
              <div className="flex-1 w-full">
                <ProgressBar label="Sudeste"      value={89} color="#00D4AA" />
                <ProgressBar label="Sul"          value={82} color="#40C4FF" />
                <ProgressBar label="Nordeste"     value={67} color="#FFD740" />
                <ProgressBar label="Centro-Oeste" value={54} color="#FF9557" />
                <ProgressBar label="Norte"        value={38} color="#FF4757" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* New volunteers chart */}
      <Card title="Novos voluntários por mês — 2026">
        <LegendRow items={[
          { color: '#B39DDB', label: 'Novos cadastros' },
          { color: 'rgba(179,157,219,0.25)', label: 'Mai–Dez: período futuro' },
        ]} />
        <div className="h-[140px] lg:h-[100px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={NEW_VOLUNTEERS_MONTHLY} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={TICK} tickLine={false} axisLine={false} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} />
              <Tooltip {...TT} formatter={(v: any) => [v > 0 ? v : '—', 'Novos']} />
              <Bar dataKey="novos" name="Novos voluntários" radius={[3, 3, 0, 0]}
                fill="#B39DDB"
                fillOpacity={1} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Low coverage alerts */}
      <div className="mt-3.5">
        <SectionTitle>Regiões com baixa adesão</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AlertCard type="danger"  title="Norte: 4 estados abaixo de 30%"   description="Acre, Roraima, Amapá e Tocantins precisam de recrutamento urgente" />
          <AlertCard type="warning" title="Queda de 18% no Amapá"            description="Redução no número de atendimentos em março de 2025" />
        </div>
      </div>
    </div>
  );
}