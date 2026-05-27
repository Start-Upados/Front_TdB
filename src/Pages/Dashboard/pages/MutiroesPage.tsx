import {
  Plus, Check, Clock, AlertTriangle, UserPlus, ArrowRight,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { listarProximos, listarRecentes, diasAte } from '../services/mutiroes';
import type { Mutirao, StatusMutirao } from '../data/mutiroes';

// ─── Helpers de data ─────────────────────────────────────
const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function diaSemanaUpper(iso: string): string {
  return DIAS_SEMANA[new Date(iso + 'T12:00:00').getDay()];
}
function diaMes(iso: string): number {
  return parseInt(iso.slice(8, 10), 10);
}
function mesAbrev(iso: string): string {
  return MESES[parseInt(iso.slice(5, 7), 10) - 1];
}
function dataDiaMes(iso: string): string {
  return `${diaMes(iso)} ${mesAbrev(iso)}`;
}
function diaSemanaCompleto(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const s = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Status config ───────────────────────────────────────
type ConfigStatus = {
  bg: string; text: string; label: string;
  Icon: typeof Check;
  cardBorderClass: string;
  dateBg: string; dateText: string;
};

const STATUS_CONFIG: Record<Exclude<StatusMutirao, 'realizado'>, ConfigStatus> = {
  pronto: {
    bg: 'bg-success-soft', text: 'text-success', label: 'Pronto', Icon: Check,
    cardBorderClass: 'border border-line',
    dateBg: 'bg-surface-soft', dateText: 'text-ink',
  },
  'em-preparacao': {
    bg: 'bg-warning-soft', text: 'text-warning', label: 'Em preparação', Icon: Clock,
    cardBorderClass: 'border border-line',
    dateBg: 'bg-surface-soft', dateText: 'text-ink',
  },
  atencao: {
    bg: 'bg-danger-soft', text: 'text-danger', label: 'Atenção', Icon: AlertTriangle,
    cardBorderClass: 'border-2 border-danger',
    dateBg: 'bg-danger-soft', dateText: 'text-danger',
  },
};

// ─── Card de mutirão futuro ──────────────────────────────
function MutiraoCard({ m }: { m: Mutirao }) {
  const cfg = STATUS_CONFIG[m.status as Exclude<StatusMutirao, 'realizado'>];
  const dentistasFaltam = m.dentistasNecessarios - m.dentistasConfirmados;
  const dentistasTone =
    dentistasFaltam === 0
      ? 'text-ink'
      : dentistasFaltam / m.dentistasNecessarios > 0.5
        ? 'text-danger'
        : 'text-ink';

  return (
    <div className={`bg-surface rounded-xl p-4 mb-2.5 ${cfg.cardBorderClass}`}>
      <div className="flex items-start gap-4">
        {/* Date block */}
        <div className={`flex flex-col items-center px-3 py-2 rounded-md min-w-[60px] ${cfg.dateBg}`}>
          <span className={`text-2xs ${cfg.dateText === 'text-ink' ? 'text-muted' : cfg.dateText}`}>{diaSemanaUpper(m.data)}</span>
          <span className={`text-2xl font-semibold leading-none mt-1 ${cfg.dateText}`}>{diaMes(m.data)}</span>
          <span className={`text-2xs mt-0.5 ${cfg.dateText === 'text-ink' ? 'text-muted' : cfg.dateText}`}>{mesAbrev(m.data)}</span>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-ink">{m.local}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium ${cfg.bg} ${cfg.text}`}>
              <cfg.Icon className="w-3 h-3" strokeWidth={2.5} />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-muted mb-3">
            {m.tipo} · {m.cidade}-{m.estado} · {m.horario}
          </p>

          <div className="flex gap-6 flex-wrap">
            <div>
              <p className="text-2xs text-subtle">Programa</p>
              <p className="text-sm font-medium text-ink mt-0.5">{m.programa}</p>
            </div>
            <div>
              <p className="text-2xs text-subtle">Dentistas</p>
              <p className={`text-sm font-medium mt-0.5 ${dentistasTone}`}>
                {m.dentistasConfirmados} / {m.dentistasNecessarios} confirmados
              </p>
            </div>
            <div>
              <p className="text-2xs text-subtle">Pacientes esperados</p>
              <p className="text-sm font-medium text-ink mt-0.5">~{m.pacientesEsperados}</p>
            </div>
          </div>
        </div>

        {/* Action */}
        {m.status === 'atencao' ? (
          <button className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-ink text-surface hover:opacity-90 transition-opacity shrink-0">
            <UserPlus className="w-3.5 h-3.5" strokeWidth={2} />
            Convocar
          </button>
        ) : (
          <button className="text-sm px-3 py-1.5 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors shrink-0">
            Ver detalhes
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────
export default function MutiroesPage() {
  const proximos = listarProximos();
  const recentes = listarRecentes(3);
  const proximo = proximos[0];
  const diasAteProximo = proximo ? diasAte(proximo.data) : null;

  return (
    <div className="flex flex-col gap-5 max-w-[1280px]">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Próximos mutirões" value={proximos.length} sub="nas próximas 3 semanas" />
        <KpiCard
          label="Próximo"
          value={proximo ? `${diaSemanaCompleto(proximo.data).slice(0,3)} ${diaMes(proximo.data)}/${proximo.data.slice(5,7)}` : '—'}
          sub={proximo && diasAteProximo !== null ? `em ${diasAteProximo} dias · ${proximo.cidade}-${proximo.estado}` : 'sem agendamentos'}
        />
        <KpiCard label="Atendimentos no mês" value="89" sub="via mutirões" subTone="success" />
        <KpiCard label="Total no ano" value="1.247" sub="23 mutirões realizados" />
      </div>

      {/* Próximos */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-sm font-medium text-ink">Próximos mutirões</p>
          <button className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-ink text-surface hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Cadastrar mutirão
          </button>
        </div>

        {proximos.length === 0 ? (
          <p className="text-sm text-muted text-center py-8 bg-surface border border-line rounded-xl">
            Nenhum mutirão agendado.
          </p>
        ) : (
          proximos.map((m) => <MutiraoCard key={m.id} m={m} />)
        )}
      </div>

      {/* Recentes */}
      <div className="bg-surface border border-line rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-ink">Mutirões recentes</p>
          <button className="inline-flex items-center gap-1 text-2xs text-muted hover:text-ink transition-colors">
            Ver histórico
            <ArrowRight className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>

        <div className="divide-y divide-line">
          {recentes.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1 text-xs">
              <div className="min-w-[64px]">
                <p className="font-medium text-ink">{dataDiaMes(m.data)}</p>
                <p className="text-2xs text-subtle mt-0.5">{diaSemanaCompleto(m.data).toLowerCase()}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink">{m.local} · {m.cidade}-{m.estado}</p>
                <p className="text-2xs text-subtle mt-0.5">{m.tipo} · {m.programa}</p>
              </div>
              <div className="text-right">
                <p className="text-ink"><span className="font-semibold">{m.atendimentosRealizados}</span> atendimentos</p>
                <p className="text-2xs text-subtle mt-0.5">{m.encaminhamentos} encaminhados pra tratamento</p>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors">
                Relatório
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}