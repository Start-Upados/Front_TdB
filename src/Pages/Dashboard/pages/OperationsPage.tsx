import { Card, ProgressBar, StatusBadge } from '../components/Shared';
import { UPCOMING_APPOINTMENTS, RECENT_ATTENDANCES } from '../mockData';

// ─── CALENDAR ──────────────────────────────────
function CalendarApril() {
  const eventDays = [17, 18, 19, 22, 24, 25, 28];
  const today = 15;
  const firstDay = 2;
  const totalDays = 30;
  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  function cellCls(day: number) {
    if (day === today)           return 'bg-[#00D4AA] text-[#07111E] font-bold';
    if (eventDays.includes(day)) return 'bg-[rgba(0,212,170,0.15)] text-[#00D4AA] font-semibold';
    return 'text-[#7EB3CE]';
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[13px] font-semibold text-[#E8F4FD]">Abril 2025</span>
        <span className="text-[11px] text-[#3D6A85]">7 eventos</span>
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {dayLabels.map((d) => (
          <div key={d} className="text-center text-[9.5px] font-semibold text-[#3D6A85] uppercase py-1">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`e${i}`} className="aspect-square flex items-center justify-center text-[10px] text-[#7EB3CE] opacity-20">
            {28 + i}
          </div>
        ))}
        {Array.from({ length: totalDays }, (_, i) => {
          const d = i + 1;
          return (
            <div key={d} className={`aspect-square flex items-center justify-center text-[11px] rounded-[5px] ${cellCls(d)}`}>
              {d}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-2.5 text-[10px] text-[#3D6A85]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-[2px] bg-[#00D4AA]" /> Hoje
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-[2px] bg-[rgba(0,212,170,0.15)]" /> Com eventos
        </span>
      </div>
    </div>
  );
}

// ─── OPERATIONS PAGE ───────────────────────────
export default function OperationsPage() {
  return (
    <div className="grid grid-cols-[1fr_2fr] gap-3">

      {/* Left column */}
      <div>
        <Card title="Calendário — Abril 2025" className="mb-3">
          <CalendarApril />
        </Card>

        <Card title="Métricas de qualidade">
          <ProgressBar label="Taxa de sucesso"            value={94.7} color="#00D4AA" />
          <ProgressBar label="Satisfação do paciente"     value={97.2} color="#40C4FF" />
          <ProgressBar label="Pontualidade dos dentistas" value={88.4} color="#B39DDB" />
          <ProgressBar label="Sem retrabalho"             value={91.3} color="#00E676" />
          <ProgressBar label="Resposta rápida ONG"        value={86.1} color="#FF9557" />

          <div className="grid grid-cols-2 gap-2.5 mt-3.5 pt-3.5 border-t border-[rgba(0,212,170,0.1)] text-center">
            {[
              { label: 'Tempo médio de tto.', value: '127 dias' },
              { label: 'Retrabalho',          value: '8,7%'     },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[18px] font-bold text-[#E8F4FD] leading-none">{value}</p>
                <p className="text-[10.5px] text-[#3D6A85] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Right column */}
      <div>
        <Card title=" atendimentos" className="mb-3">
          {UPCOMING_APPOINTMENTS.map((apt) => (
            <div
              key={apt.id}
              className="flex items-center gap-3 px-2.5 py-2 bg-[#0C1B2E] rounded-[9px] mb-1.5 border border-[rgba(0,212,170,0.1)]"
            >
              <div className="text-center min-w-[34px] shrink-0">
                <p className="text-[16px] font-bold text-[#E8F4FD] leading-none">{apt.day}</p>
                <p className="text-[9px] text-[#3D6A85] uppercase mt-0.5">{apt.month}</p>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-[#E8F4FD] whitespace-nowrap overflow-hidden text-ellipsis">
                  {apt.patient} — {apt.type}
                </p>
                <p className="text-[11px] text-[#7EB3CE] mt-0.5">{apt.dentist} · {apt.time}</p>
              </div>

              <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold
                ${apt.priority === 'high'
                  ? 'bg-[rgba(255,71,87,0.12)] text-[#FF4757]'
                  : 'bg-[rgba(64,196,255,0.12)] text-[#40C4FF]'
                }`}>
                {apt.priority === 'high' ? 'Urgente' : 'Normal'}
              </span>
            </div>
          ))}
        </Card>

        <Card title="Histórico recente de atendimentos">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['ID', 'Paciente', 'Procedimento', 'Dentista', 'Data', 'Status'].map((h) => (
                  <th key={h} className="text-left px-2.5 py-1.5 text-[10px] text-[#3D6A85] border-b border-[rgba(0,212,170,0.1)] font-semibold uppercase tracking-[0.5px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_ATTENDANCES.map((att) => (
                <tr key={att.id} className="hover:bg-[rgba(0,212,170,0.025)]">
                  <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] text-[10.5px] text-[#3D6A85]">{att.id}</td>
                  <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] text-[12.5px] text-[#E8F4FD]">{att.patient}</td>
                  <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] text-[12.5px] text-[#7EB3CE]">{att.type}</td>
                  <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] text-[12.5px] text-[#7EB3CE]">{att.dentist}</td>
                  <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)] text-[11px] text-[#3D6A85]">{att.date}</td>
                  <td className="px-2.5 py-[9px] border-b border-[rgba(0,212,170,0.05)]"><StatusBadge status={att.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}