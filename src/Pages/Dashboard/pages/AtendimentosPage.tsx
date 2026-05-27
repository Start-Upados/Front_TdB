import { useState, useMemo } from 'react';
import {
  Plus, Check, Clock, Play, X, ArrowRight,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';
import {
  listarPorData, contarPorFaixa, dataDeHoje,
} from '../services/atendimentos';
import type { StatusAtendimento } from '../data/atendimentos';

// ─── Helpers de data ─────────────────────────────────────
function formatarDataLonga(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const s = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function diaSemanaCurto(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').slice(0, 3);
}
function diaMes(iso: string): number {
  return parseInt(iso.slice(8, 10), 10);
}
function horaAtual(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Status pill ─────────────────────────────────────────
const STATUS_CONFIG: Record<  StatusAtendimento,
  { bg: string; text: string; label: string; Icon: typeof Check }
    > = {
  confirmado:     { bg: 'bg-success-soft', text: 'text-success', label: 'Confirmado',               Icon: Check },
  aguardando:     { bg: 'bg-warning-soft', text: 'text-warning', label: 'Aguardando confirmação',   Icon: Clock },
  'em-andamento': { bg: 'bg-info-soft',    text: 'text-info',    label: 'Em andamento',             Icon: Play  },
  realizado:      { bg: 'bg-success-soft', text: 'text-success', label: 'Realizado',                Icon: Check },
  'no-show':      { bg: 'bg-danger-soft',  text: 'text-danger',  label: 'No-show',                  Icon: X     },
};

function StatusPill({ status }: { status: StatusAtendimento }) {
  const { bg, text, label, Icon } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium ${bg} ${text}`}>
      <Icon className="w-3 h-3" strokeWidth={2.5} />
      {label}
    </span>
  );
}

// ─── Ação contextual ─────────────────────────────────────
function labelAcao(status: StatusAtendimento): string {
  switch (status) {
    case 'realizado':     return 'Ver';
    case 'aguardando':    return 'Contatar';
    case 'em-andamento':  return 'Acompanhar';
    case 'confirmado':    return 'Ver';
    case 'no-show':       return 'Reagendar';
  }
}

// ─── Página ──────────────────────────────────────────────
export default function AtendimentosPage() {
  const hoje = dataDeHoje();
  const [dataSelecionada, setDataSelecionada] = useState(hoje);

  // Semana: 4 dias antes + hoje + 2 depois = 7 boxes
  const semana = useMemo(() => {
    const inicio = new Date(hoje + 'T12:00:00');
    inicio.setDate(inicio.getDate() - 4);
    return contarPorFaixa(inicio.toISOString().slice(0, 10), 7);
  }, [hoje]);

  const atendimentos = useMemo(
    () => listarPorData(dataSelecionada),
    [dataSelecionada],
  );

  return (
    <div className="flex flex-col gap-5 max-w-[1280px]">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Atendimentos hoje" value="5" sub="3 confirmados" />
        <KpiCard label="Taxa de comparecimento" value="87%" sub="+4pp vs mês" subTone="success" />
        <KpiCard label="Próximos 7 dias" value="42" sub="agendados" />
        <KpiCard label="No-shows no mês" value="11" valueTone="warning" sub="1,3% dos agendamentos" />
      </div>

      {/* Faixa semanal */}
      <div className="grid grid-cols-7 gap-1.5">
        {semana.map(({ data, count }) => {
          const isHoje      = data === hoje;
          const isPast      = data < hoje;
          const isSelected  = data === dataSelecionada;
          return (
            <button
              key={data}
              onClick={() => setDataSelecionada(data)}
              className={`text-center py-2.5 px-1 rounded-md transition-colors ${
                isSelected
                  ? 'border-2 border-info bg-info-soft'
                  : 'border border-line bg-surface hover:bg-surface-soft'
              } ${isPast && !isSelected ? 'opacity-60' : ''}`}
              style={isSelected ? { padding: 'calc(0.625rem - 1px) calc(0.25rem - 1px)' } : undefined}
            >
              <p className={`text-2xs ${isSelected ? 'text-info' : 'text-muted'}`}>
                {diaSemanaCurto(data)}{isHoje && ' · hoje'}
              </p>
              <p className="text-base font-semibold text-ink mt-0.5 leading-none">
                {diaMes(data)}
              </p>
              <p className={`text-2xs mt-1 ${isSelected ? 'text-info' : 'text-subtle'}`}>
                {count === 0 ? '—' : `${count} atend.`}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 items-center flex-wrap">
        <select className="text-sm py-2 px-3 rounded-md border border-line bg-surface text-ink cursor-pointer">
          <option>Todos programas</option>
          <option>Dentista do Bem</option>
          <option>Apolônias do Bem</option>
          <option>Mutirão</option>
        </select>
        <select className="text-sm py-2 px-3 rounded-md border border-line bg-surface text-ink cursor-pointer">
          <option>Todas regiões</option>
          <option>Sudeste</option>
          <option>Sul</option>
          <option>Nordeste</option>
          <option>Centro-Oeste</option>
          <option>Norte</option>
        </select>
        <select className="text-sm py-2 px-3 rounded-md border border-line bg-surface text-ink cursor-pointer">
          <option>Todos dentistas</option>
        </select>
        <button className="ml-auto inline-flex items-center gap-1.5 text-sm py-2 px-3 rounded-md bg-ink text-surface hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Agendar atendimento
        </button>
      </div>

      {/* Lista do dia */}
      <div className="bg-surface border border-line rounded-xl p-5">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-sm font-medium text-ink">
            {formatarDataLonga(dataSelecionada)} · {atendimentos.length} atendimento{atendimentos.length === 1 ? '' : 's'}
          </p>
          {dataSelecionada === hoje && (
            <p className="text-2xs text-subtle">Agora · {horaAtual()}</p>
          )}
        </div>

        {atendimentos.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">
            Nenhum atendimento agendado para este dia.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {atendimentos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-3 first:pt-1">
                {/* Horário */}
                <div className="min-w-[56px] text-center">
                  <p className={`text-base font-medium leading-none ${
                    a.status === 'em-andamento' ? 'text-info' : 'text-ink'
                  }`}>
                    {a.hora}
                  </p>
                  <p className={`text-2xs mt-1 ${
                    a.status === 'em-andamento' ? 'text-info' : 'text-subtle'
                  }`}>
                    {a.status === 'em-andamento' ? 'em curso' : `${a.duracaoMinutos}min`}
                  </p>
                </div>

                <Avatar
                  initials={a.paciente.iniciais}
                  size="sm"
                  tone={a.status === 'em-andamento' ? 'info' : 'default'}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {a.paciente.nome}, {a.paciente.idade} · {a.dentista.nome}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {a.especialidade} · {a.local} · {a.programa}
                  </p>
                </div>

                <StatusPill status={a.status} />

                <button className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors">
                  {labelAcao(a.status)}
                  {a.status === 'no-show' && <ArrowRight className="w-3 h-3" strokeWidth={2} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}