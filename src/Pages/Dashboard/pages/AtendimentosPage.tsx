import { useSearchParams } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Plus, Check, Clock, Play, X, ArrowRight, Square,
  Phone, Mail, MessageCircle, Calendar, MapPin, Stethoscope,
  CheckCircle2, Copy,
} from 'lucide-react';

import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';
import { Modal } from '../components/Modal';

import {
  listarPorData, contarPorFaixa, dataDeHoje,
  listarDentistasFiltro, listarPacientes, listarDentistasCadastrados,
  marcarConfirmado, iniciarAtendimento, finalizarAtendimento,
  reagendarAtendimento, criarAtendimento,
  carregarAtendimentosReais,
  type FiltrosAtendimentos, type NovoAtendimentoInput, type ReagendarInput,
} from '../services/atendimentos';
import type { Atendimento, StatusAtendimento, ProgramaAtendimento } from '../data/atendimentos';
import { ESPECIALIDADES_DISPONIVEIS, PROGRAMAS_FILTRO, REGIOES } from '../data/atendimentos';

// ─── HELPERS ─────────────────────────────────────

function formatarDataLonga(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const s = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatarDataCurta(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

function formatarTelefone(numero: string): string {
  // Aceita "5511999990001" ou "+551133330001" e devolve formato legível
  const limpo = numero.replace(/\D/g, '');
  if (limpo.length === 13) return `+${limpo.slice(0,2)} (${limpo.slice(2,4)}) ${limpo.slice(4,9)}-${limpo.slice(9)}`;
  if (limpo.length === 12) return `+${limpo.slice(0,2)} (${limpo.slice(2,4)}) ${limpo.slice(4,8)}-${limpo.slice(8)}`;
  return numero;
}

// ─── STATUS ──────────────────────────────────────

const STATUS_CONFIG: Record<StatusAtendimento, {
  bg: string; text: string; label: string; Icon: typeof Check;
}> = {
  confirmado:     { bg: 'bg-success-soft', text: 'text-success', label: 'Confirmado',              Icon: Check },
  aguardando:     { bg: 'bg-warning-soft', text: 'text-warning', label: 'Aguardando confirmação',  Icon: Clock },
  'em-andamento': { bg: 'bg-info-soft',    text: 'text-info',    label: 'Em andamento',            Icon: Play },
  realizado:      { bg: 'bg-success-soft', text: 'text-success', label: 'Realizado',               Icon: Check },
  'no-show':      { bg: 'bg-danger-soft',  text: 'text-danger',  label: 'No-show',                 Icon: X },
};

function StatusPill({ status, size = 'sm' }: { status: StatusAtendimento; size?: 'sm' | 'md' }) {
  const { bg, text, label, Icon } = STATUS_CONFIG[status];
  const sz = size === 'md' ? 'px-3.5 py-1.5 text-sm' : 'px-3 py-1 text-xs';
  const ic = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${bg} ${text} ${sz}`}>
      <Icon className={ic} strokeWidth={2.5} />
      {label}
    </span>
  );
}

function labelAcao(status: StatusAtendimento): string {
  switch (status) {
    case 'realizado':     return 'Ver';
    case 'aguardando':    return 'Contatar';
    case 'em-andamento':  return 'Acompanhar';
    case 'confirmado':    return 'Ver';
    case 'no-show':       return 'Reagendar';
  }
}

// ─── PAGE ─────────────────────────────────────────

type AcaoModal = 'ver' | 'contatar' | 'acompanhar' | 'reagendar' | 'novo' | null;

export default function AtendimentosPage() {
  const hoje = dataDeHoje();
  const [dataSelecionada, setDataSelecionada] = useState(hoje);

  // Filtros
  const [searchParams] = useSearchParams();
  const dentistaInicial = searchParams.get('dentistaId') ?? 'Todos';
  const [filtroPrograma, setFiltroPrograma] = useState('Todos');
  const [filtroRegiao,   setFiltroRegiao]   = useState('Todas');
  const [filtroDentista, setFiltroDentista] = useState(dentistaInicial);

  // Modais
  const [atendimentoAlvo, setAtendimentoAlvo] = useState<Atendimento | null>(null);
  const [acaoAtiva, setAcaoAtiva] = useState<AcaoModal>(null);
  const [processando, setProcessando] = useState(false);
  const [versao, setVersao] = useState(0); // força re-fetch após mutações

  const semana = useMemo(() => {
    const inicio = new Date(hoje + 'T12:00:00');
    inicio.setDate(inicio.getDate() - 4);
    return contarPorFaixa(inicio.toISOString().slice(0, 10), 7);
  }, [hoje, versao]);

  const filtros: FiltrosAtendimentos = {
    programa:   filtroPrograma,
    regiao:     filtroRegiao,
    dentistaId: filtroDentista,
  };

  const atendimentos = useMemo(
    () => listarPorData(dataSelecionada, filtros),
    [dataSelecionada, filtroPrograma, filtroRegiao, filtroDentista, versao],
  );

  const dentistasFiltro = useMemo(() => listarDentistasFiltro(), [versao]);

  function refresh() {
    setVersao((v) => v + 1);
  }

  // Carrega atendimentos do backend no mount + sincroniza estado local
  useEffect(() => {
    carregarAtendimentosReais()
      .then(() => refresh())
      .catch(() => { /* silencioso — fallback pro localStorage */ });
  }, []);

  function abrirAcao(a: Atendimento) {
    setAtendimentoAlvo(a);
    switch (a.status) {
      case 'realizado':
      case 'confirmado':    setAcaoAtiva('ver'); break;
      case 'aguardando':    setAcaoAtiva('contatar'); break;
      case 'em-andamento':  setAcaoAtiva('acompanhar'); break;
      case 'no-show':       setAcaoAtiva('reagendar'); break;
    }
  }

  function fecharModal() {
    if (processando) return;
    setAcaoAtiva(null);
    setAtendimentoAlvo(null);
  }

  // ─── Handlers de ações ─────────────────────

  async function handleMarcarConfirmado(id: string) {
    setProcessando(true);
    try {
      await marcarConfirmado(id);
      toast.success('Atendimento confirmado');
      refresh();
      fecharModal();
    } catch {
      toast.error('Não foi possível confirmar');
    } finally {
      setProcessando(false);
    }
  }

  async function handleIniciarAtendimento(id: string) {
    setProcessando(true);
    try {
      await iniciarAtendimento(id);
      toast.success('Atendimento iniciado');
      refresh();
      fecharModal();
    } catch {
      toast.error('Não foi possível iniciar');
    } finally {
      setProcessando(false);
    }
  }

  async function handleFinalizarAtendimento(id: string, observacoes: string) {
    setProcessando(true);
    try {
      await finalizarAtendimento(id, observacoes || undefined);
      toast.success('Atendimento finalizado');
      refresh();
      fecharModal();
    } catch {
      toast.error('Não foi possível finalizar');
    } finally {
      setProcessando(false);
    }
  }

  async function handleReagendar(input: ReagendarInput) {
    setProcessando(true);
    try {
      const novo = await reagendarAtendimento(input);
      toast.success('Reagendamento confirmado', {
        description: `Novo atendimento em ${formatarDataCurta(input.novaData)} às ${input.novaHora}.`,
      });
      refresh();
      fecharModal();
      setDataSelecionada(novo.data);
    } catch {
      toast.error('Não foi possível reagendar');
    } finally {
      setProcessando(false);
    }
  }

  async function handleCriarAtendimento(input: NovoAtendimentoInput) {
    setProcessando(true);
    try {
      const novo = await criarAtendimento(input);
      toast.success('Atendimento agendado', {
        description: `${novo.paciente.nome} · ${formatarDataCurta(novo.data)} às ${novo.hora}.`,
      });
      refresh();
      fecharModal();
      setDataSelecionada(novo.data);
    } catch {
      toast.error('Não foi possível agendar');
    } finally {
      setProcessando(false);
    }
  }

  // ─── RENDER ────────────────────────────────

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Atendimentos hoje" value="5" sub="3 confirmados" />
        <KpiCard label="Taxa de comparecimento" value="87%" sub="+4pp vs mês" subTone="success" />
        <KpiCard label="Próximos 7 dias" value="42" sub="agendados" />
        <KpiCard label="No-shows no mês" value="11" valueTone="warning" sub="1,3% dos agendamentos" />
      </div>

      {/* CALENDÁRIO SEMANAL */}
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[720px] grid-cols-7 gap-3">
          {semana.map(({ data, count }) => {
            const isHoje = data === hoje;
            const isPast = data < hoje;
            const isSelected = data === dataSelecionada;
            return (
              <button
                key={data}
                onClick={() => setDataSelecionada(data)}
                className={`rounded-2xl border px-2 py-4 text-center transition-all ${
                  isSelected ? 'border-info bg-info-soft' : 'border-line bg-surface hover:bg-surface-soft'
                } ${isPast && !isSelected ? 'opacity-60' : ''}`}
              >
                <p className={`text-xs ${isSelected ? 'text-info' : 'text-muted'}`}>
                  {diaSemanaCurto(data)}{isHoje && ' · hoje'}
                </p>
                <p className="mt-1 text-2xl font-semibold leading-none text-ink">{diaMes(data)}</p>
                <p className={`mt-2 text-xs ${isSelected ? 'text-info' : 'text-subtle'}`}>
                  {count === 0 ? '—' : `${count} atend.`}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <select
            value={filtroPrograma}
            onChange={(e) => setFiltroPrograma(e.target.value)}
            className="cursor-pointer rounded-xl border border-line bg-surface shadow-cardpx-3 py-3 text-sm text-ink"
          >
            {PROGRAMAS_FILTRO.map((p) => (
              <option key={p} value={p}>{p === 'Todos' ? 'Todos programas' : p}</option>
            ))}
          </select>

          <select
            value={filtroRegiao}
            onChange={(e) => setFiltroRegiao(e.target.value)}
            className="cursor-pointer rounded-xl border border-line bg-surface shadow-cardpx-3 py-3 text-sm text-ink"
          >
            {REGIOES.map((r) => (
              <option key={r} value={r}>{r === 'Todas' ? 'Todas regiões' : r}</option>
            ))}
          </select>

          <select
            value={filtroDentista}
            onChange={(e) => setFiltroDentista(e.target.value)}
            className="cursor-pointer rounded-xl border border-line bg-surface shadow-cardpx-3 py-3 text-sm text-ink"
          >
            <option value="Todos">Todos dentistas</option>
            {dentistasFiltro.map((d) => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setAcaoAtiva('novo'); setAtendimentoAlvo(null); }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-surface transition-opacity hover:opacity-90 lg:w-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Agendar atendimento
        </button>
      </div>

      {/* LISTA */}
      <div className="rounded-2xl border border-line bg-surface shadow-cardp-4 md:p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-medium text-ink md:text-sm">
            {formatarDataLonga(dataSelecionada)} · {atendimentos.length} atendimento{atendimentos.length === 1 ? '' : 's'}
          </p>
          {dataSelecionada === hoje && (
            <p className="text-xs text-subtle">Agora · {horaAtual()}</p>
          )}
        </div>

        {atendimentos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Nenhum atendimento agendado para este dia.</p>
        ) : (
          <div className="divide-y divide-line">
            {atendimentos.map((a) => (
              <div key={a.id} className="flex flex-col gap-4 py-4 first:pt-1 lg:flex-row lg:items-center">

                {/* HORA */}
                <div className="lg:min-w-[72px]">
                  <p className={`text-xl font-semibold leading-none lg:text-base ${a.status === 'em-andamento' ? 'text-info' : 'text-ink'}`}>
                    {a.hora}
                  </p>
                  <p className={`mt-1 text-xs ${a.status === 'em-andamento' ? 'text-info' : 'text-subtle'}`}>
                    {a.status === 'em-andamento' ? 'em curso' : `${a.duracaoMinutos}min`}
                  </p>
                </div>

                {/* CONTEÚDO */}
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar
                    initials={a.paciente.iniciais}
                    size="sm"
                    tone={a.status === 'em-andamento' ? 'info' : 'default'}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-relaxed text-ink md:text-base">
                      {a.paciente.nome}, {a.paciente.idade} · {a.dentista.nome}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">
                      {a.especialidade} · {a.local} · {a.programa}
                    </p>
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
                  <StatusPill status={a.status} />
                  <button
                    onClick={() => abrirAcao(a)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto"
                  >
                    {labelAcao(a.status)}
                    {a.status === 'no-show' && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAIS */}
      <DetalhesAtendimentoModal
        open={acaoAtiva === 'ver'}
        atendimento={atendimentoAlvo}
        onClose={fecharModal}
        onIniciar={handleIniciarAtendimento}
        processando={processando}
      />

      <ContatarPacienteModal
        open={acaoAtiva === 'contatar'}
        atendimento={atendimentoAlvo}
        onClose={fecharModal}
        onMarcarConfirmado={handleMarcarConfirmado}
        processando={processando}
      />

      <AcompanharAtendimentoModal
        open={acaoAtiva === 'acompanhar'}
        atendimento={atendimentoAlvo}
        onClose={fecharModal}
        onFinalizar={handleFinalizarAtendimento}
        processando={processando}
      />

      <ReagendarAtendimentoModal
        open={acaoAtiva === 'reagendar'}
        atendimento={atendimentoAlvo}
        onClose={fecharModal}
        onReagendar={handleReagendar}
        processando={processando}
      />

      <NovoAtendimentoModal
        open={acaoAtiva === 'novo'}
        onClose={fecharModal}
        onCriar={handleCriarAtendimento}
        processando={processando}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────
// MODAL 1 — DETALHES (Ver)
// ──────────────────────────────────────────────────

function DetalhesAtendimentoModal({
  open, atendimento, onClose, onIniciar, processando,
}: {
  open: boolean;
  atendimento: Atendimento | null;
  onClose: () => void;
  onIniciar: (id: string) => Promise<void>;
  processando: boolean;
}) {
  if (!atendimento) return null;
  const podeIniciar = atendimento.status === 'confirmado';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalhes do atendimento"
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors"
          >
            Fechar
          </button>
          {podeIniciar && (
            <button
              onClick={() => onIniciar(atendimento.id)}
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" strokeWidth={2} />
              {processando ? 'Iniciando...' : 'Iniciar atendimento'}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Paciente + Status */}
        <div className="flex items-center gap-3">
          <Avatar initials={atendimento.paciente.iniciais} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-ink truncate">{atendimento.paciente.nome}, {atendimento.paciente.idade}</p>
            <p className="text-xs text-muted">{atendimento.programa}</p>
          </div>
          <StatusPill status={atendimento.status} />
        </div>

        {/* Info card */}
        <div className="bg-surface-soft rounded-xl p-4 space-y-2 text-sm">
          <Row icon={<Calendar className="w-3.5 h-3.5" strokeWidth={2} />} label="Data e hora" value={`${formatarDataCurta(atendimento.data)} · ${atendimento.hora} (${atendimento.duracaoMinutos}min)`} />
          <Row icon={<Stethoscope className="w-3.5 h-3.5" strokeWidth={2} />} label="Dentista" value={atendimento.dentista.nome} />
          <Row icon={<MapPin className="w-3.5 h-3.5" strokeWidth={2} />} label="Local" value={atendimento.local} />
          <Row icon={<Check className="w-3.5 h-3.5" strokeWidth={2} />} label="Especialidade" value={atendimento.especialidade} />
        </div>

        {/* Confirmações enviadas (status confirmado) */}
        {atendimento.status === 'confirmado' && atendimento.confirmacoesEnviadas && atendimento.confirmacoesEnviadas.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Confirmações enviadas</p>
            <div className="space-y-1.5">
              {atendimento.confirmacoesEnviadas.map((c, i) => (
                <div key={i} className="text-xs text-ink bg-surface-soft px-3 py-2 rounded-lg flex items-center justify-between">
                  <span>{c.canal}</span>
                  <span className="text-muted">{c.quando}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observações pós (status realizado) */}
        {atendimento.observacoesPos && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Observações</p>
            <p className="text-sm text-ink bg-surface-soft rounded-lg px-3 py-2.5 leading-relaxed">{atendimento.observacoesPos}</p>
          </div>
        )}

        {/* Próxima consulta */}
        {atendimento.proximaConsulta && (
          <div className="bg-info-soft border border-info/30 rounded-xl p-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-info" strokeWidth={2} />
            <p className="text-xs text-ink">
              Próxima consulta: <span className="font-medium">{formatarDataCurta(atendimento.proximaConsulta)}</span>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="text-muted flex items-center gap-1.5 shrink-0">{icon} {label}</span>
      <span className="text-ink text-right">{value}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────
// MODAL 2 — CONTATAR
// ──────────────────────────────────────────────────

const TEMPLATES_CONTATO = [
  {
    id: 'confirmacao',
    label: 'Confirmação',
    gerar: (a: Atendimento) =>
      `Olá ${a.paciente.nome.split(' ')[0]}, aqui é da Turma do Bem. Confirmando seu atendimento dia ${formatarDataCurta(a.data)} às ${a.hora} com ${a.dentista.nome} em ${a.local}. Poderá comparecer?`,
  },
  {
    id: 'lembrete',
    label: 'Lembrete do dia',
    gerar: (a: Atendimento) =>
      `Olá ${a.paciente.nome.split(' ')[0]}, lembrete do seu atendimento hoje às ${a.hora} com ${a.dentista.nome} em ${a.local}. Te esperamos!`,
  },
  {
    id: 'reagendamento',
    label: 'Pedido de reagendamento',
    gerar: (a: Atendimento) =>
      `Olá ${a.paciente.nome.split(' ')[0]}, precisamos reagendar seu atendimento previsto para ${formatarDataCurta(a.data)} às ${a.hora}. Pode nos retornar com seus horários disponíveis?`,
  },
];

function ContatarPacienteModal({
  open, atendimento, onClose, onMarcarConfirmado, processando,
}: {
  open: boolean;
  atendimento: Atendimento | null;
  onClose: () => void;
  onMarcarConfirmado: (id: string) => Promise<void>;
  processando: boolean;
}) {
  const [templateId, setTemplateId] = useState('confirmacao');

  if (!atendimento) return null;

  const template = TEMPLATES_CONTATO.find((t) => t.id === templateId)!;
  const mensagem = template.gerar(atendimento);
  const contato = atendimento.paciente.contato;

  function abrirWhatsApp() {
    if (!contato?.whatsapp) return;
    const url = `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp aberto com a mensagem');
  }

  function abrirEmail() {
    if (!contato?.email || !atendimento) return;
    const subject = `Atendimento Turma do Bem · ${formatarDataCurta(atendimento.data)}`;
    const url = `mailto:${contato.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mensagem)}`;
    window.location.href = url;
    toast.success('Cliente de email aberto');
  }

  function copiarTelefone() {
    if (!contato?.telefone) return;
    navigator.clipboard.writeText(contato.telefone);
    toast.success(`Telefone copiado: ${formatarTelefone(contato.telefone)}`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Contatar paciente"
      description="Envie a confirmação pelo canal preferido."
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onMarcarConfirmado(atendimento.id)}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Marcando...' : 'Marcar como confirmado'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Paciente */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-line">
          <Avatar initials={atendimento.paciente.iniciais} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{atendimento.paciente.nome}, {atendimento.paciente.idade}</p>
            <p className="text-xs text-muted">{formatarDataCurta(atendimento.data)} · {atendimento.hora} · {atendimento.dentista.nome}</p>
          </div>
        </div>

        {/* Template */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">Template de mensagem</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            {TEMPLATES_CONTATO.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <p className="text-xs text-ink bg-surface-soft rounded-lg px-3 py-2.5 mt-2 leading-relaxed">{mensagem}</p>
        </div>

        {/* Canais */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Canais disponíveis</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={abrirWhatsApp}
              disabled={!contato?.whatsapp}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
              WhatsApp
            </button>
            <button
              onClick={abrirEmail}
              disabled={!contato?.email}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-info text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              <Mail className="w-4 h-4" strokeWidth={2.5} />
              Email
            </button>
            <button
              onClick={copiarTelefone}
              disabled={!contato?.telefone}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-line text-ink text-sm font-medium hover:bg-surface-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Phone className="w-4 h-4" strokeWidth={2} />
              {contato?.telefone ? formatarTelefone(contato.telefone).split(' ').slice(-2).join(' ') : 'Telefone'}
              {contato?.telefone && <Copy className="w-3 h-3 opacity-60" />}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────
// MODAL 3 — ACOMPANHAR
// ──────────────────────────────────────────────────

function AcompanharAtendimentoModal({
  open, atendimento, onClose, onFinalizar, processando,
}: {
  open: boolean;
  atendimento: Atendimento | null;
  onClose: () => void;
  onFinalizar: (id: string, observacoes: string) => Promise<void>;
  processando: boolean;
}) {
  const [observacoes, setObservacoes] = useState('');
  const [tempoDecorrido, setTempoDecorrido] = useState('0min 00s');

  // Início simulado: 18min antes da abertura do modal (mock)
  const inicio = useMemo(() => new Date(Date.now() - 18 * 60 * 1000), [open]);

  useEffect(() => {
    if (!open) return;
    function tick() {
      const diff = Date.now() - inicio.getTime();
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setTempoDecorrido(`${min}min ${String(sec).padStart(2, '0')}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open, inicio]);

  useEffect(() => {
    if (!open) setObservacoes('');
  }, [open]);

  if (!atendimento) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Acompanhar atendimento"
      description="Em andamento agora."
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
          >
            Fechar
          </button>
          <button
            onClick={() => onFinalizar(atendimento.id, observacoes)}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Square className="w-4 h-4" strokeWidth={2} fill="currentColor" />
            {processando ? 'Finalizando...' : 'Finalizar atendimento'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Paciente + dentista */}
        <div className="flex items-center gap-3">
          <Avatar initials={atendimento.paciente.iniciais} size="md" tone="info" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-ink truncate">{atendimento.paciente.nome}, {atendimento.paciente.idade}</p>
            <p className="text-xs text-muted">{atendimento.dentista.nome} · {atendimento.especialidade}</p>
          </div>
          <StatusPill status="em-andamento" />
        </div>

        {/* Live timer */}
        <div className="bg-info-soft border border-info/30 rounded-xl p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-info font-semibold mb-2">Tempo decorrido</p>
          <p className="text-4xl font-bold text-info tabular-nums">{tempoDecorrido}</p>
          <p className="text-xs text-muted mt-2">
            Início {atendimento.hora} · Previsão {addMinutes(atendimento.hora, atendimento.duracaoMinutos)} ({atendimento.duracaoMinutos}min)
          </p>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
            Observações pós-atendimento <span className="font-normal normal-case">(opcional)</span>
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            placeholder="Registre o que foi realizado, próximos passos, recomendações..."
            className="w-full bg-surface border border-line text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>
    </Modal>
  );
}

function addMinutes(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

// ──────────────────────────────────────────────────
// MODAL 4 — REAGENDAR
// ──────────────────────────────────────────────────

interface ReagendarForm {
  novaData: string;
  novaHora: string;
  duracaoMinutos: number;
  motivoNoShow: string;
  observacoes: string;
}

function ReagendarAtendimentoModal({
  open, atendimento, onClose, onReagendar, processando,
}: {
  open: boolean;
  atendimento: Atendimento | null;
  onClose: () => void;
  onReagendar: (input: ReagendarInput) => Promise<void>;
  processando: boolean;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReagendarForm>({
    defaultValues: { motivoNoShow: 'Não respondeu confirmação' },
  });

  useEffect(() => {
    if (open && atendimento) {
      reset({
        novaData: '',
        novaHora: atendimento.hora,
        duracaoMinutos: atendimento.duracaoMinutos,
        motivoNoShow: atendimento.motivoNoShow || 'Não respondeu confirmação',
        observacoes: '',
      });
    }
  }, [open, atendimento, reset]);

  if (!atendimento) return null;

  async function submit(data: ReagendarForm) {
    await onReagendar({
      idOriginal: atendimento!.id,
      novaData: data.novaData,
      novaHora: data.novaHora,
      duracaoMinutos: Number(data.duracaoMinutos),
      motivoNoShow: data.motivoNoShow,
      observacoes: data.observacoes,
    });
  }

  const inputCls  = "w-full bg-surface border border-line text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand";
  const labelCls  = "block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5";
  const selectCls = inputCls + " cursor-pointer";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reagendar atendimento"
      description="Crie um novo agendamento. O original ficará registrado como no-show."
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-reagendar"
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Reagendando...' : 'Confirmar reagendamento'}
          </button>
        </>
      }
    >
      <form id="form-reagendar" onSubmit={handleSubmit(submit)} className="space-y-4">
        {/* Original */}
        <div className="bg-danger-soft border border-danger/30 rounded-xl p-3 flex items-center gap-3">
          <X className="w-4 h-4 text-danger shrink-0" strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink">
              <span className="font-medium">{atendimento.paciente.nome}</span> · {formatarDataCurta(atendimento.data)} às {atendimento.hora} com {atendimento.dentista.nome}
            </p>
            <p className="text-2xs text-danger">No-show</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Nova data *</label>
            <input
              type="date"
              {...register('novaData', { required: 'Obrigatório' })}
              min={new Date().toISOString().split('T')[0]}
              className={inputCls}
            />
            {errors.novaData && <p className="text-2xs text-danger mt-1">{errors.novaData.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Horário *</label>
            <input
              type="time"
              {...register('novaHora', { required: 'Obrigatório' })}
              className={inputCls}
            />
            {errors.novaHora && <p className="text-2xs text-danger mt-1">{errors.novaHora.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Duração (min) *</label>
            <input
              type="number"
              min="15"
              step="15"
              {...register('duracaoMinutos', { required: 'Obrigatório', valueAsNumber: true })}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Motivo do no-show</label>
          <select {...register('motivoNoShow')} className={selectCls}>
            <option value="Não respondeu confirmação">Não respondeu confirmação</option>
            <option value="Esqueceu do atendimento">Esqueceu do atendimento</option>
            <option value="Imprevisto">Imprevisto</option>
            <option value="Doente">Doente</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Observações <span className="font-normal normal-case">(opcional)</span></label>
          <textarea
            {...register('observacoes')}
            rows={3}
            placeholder="Detalhes sobre o reagendamento..."
            className={`${inputCls} resize-none`}
          />
        </div>
      </form>
    </Modal>
  );
}

// ──────────────────────────────────────────────────
// MODAL 5 — NOVO ATENDIMENTO
// ──────────────────────────────────────────────────

interface NovoAtendimentoForm {
  pacienteId: string;
  dentistaId: string;
  data: string;
  hora: string;
  duracaoMinutos: number;
  programa: ProgramaAtendimento;
  especialidade: string;
  local: string;
  observacoes: string;
}

function NovoAtendimentoModal({
  open, onClose, onCriar, processando,
}: {
  open: boolean;
  onClose: () => void;
  onCriar: (input: NovoAtendimentoInput) => Promise<void>;
  processando: boolean;
}) {
  const pacientes = listarPacientes();
  const dentistas = listarDentistasCadastrados();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<NovoAtendimentoForm>({
    defaultValues: {
      duracaoMinutos: 30,
      programa: 'Dentista do Bem',
    },
  });

  const dentistaIdSelecionado = watch('dentistaId');

  // Auto-preenche especialidade e local quando muda dentista
  useEffect(() => {
    if (!dentistaIdSelecionado) return;
    const d = dentistas.find((x) => x.id === dentistaIdSelecionado);
    if (d) {
      setValue('especialidade', d.especialidade);
      setValue('local', d.local);
    }
  }, [dentistaIdSelecionado, setValue, dentistas]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  async function submit(data: NovoAtendimentoForm) {
    await onCriar({
      pacienteId: data.pacienteId,
      dentistaId: data.dentistaId,
      data: data.data,
      hora: data.hora,
      duracaoMinutos: Number(data.duracaoMinutos),
      programa: data.programa,
      especialidade: data.especialidade,
      local: data.local,
      observacoes: data.observacoes,
    });
  }

  const inputCls  = "w-full bg-surface border border-line text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand";
  const labelCls  = "block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5";
  const selectCls = inputCls + " cursor-pointer";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo atendimento"
      description="Agendamento manual via dashboard."
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-novo-atendimento"
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Agendando...' : 'Agendar atendimento'}
          </button>
        </>
      }
    >
      <form id="form-novo-atendimento" onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Paciente *</label>
            <select {...register('pacienteId', { required: 'Selecione' })} className={selectCls} defaultValue="">
              <option value="" disabled>Selecione um paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}, {p.idade}</option>
              ))}
            </select>
            {errors.pacienteId && <p className="text-2xs text-danger mt-1">{errors.pacienteId.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Dentista *</label>
            <select {...register('dentistaId', { required: 'Selecione' })} className={selectCls} defaultValue="">
              <option value="" disabled>Selecione um dentista</option>
              {dentistas.map((d) => (
                <option key={d.id} value={d.id}>{d.nome} · {d.especialidade}</option>
              ))}
            </select>
            {errors.dentistaId && <p className="text-2xs text-danger mt-1">{errors.dentistaId.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Data *</label>
            <input
              type="date"
              {...register('data', { required: 'Obrigatório' })}
              min={new Date().toISOString().split('T')[0]}
              className={inputCls}
            />
            {errors.data && <p className="text-2xs text-danger mt-1">{errors.data.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Horário *</label>
            <input
              type="time"
              {...register('hora', { required: 'Obrigatório' })}
              className={inputCls}
            />
            {errors.hora && <p className="text-2xs text-danger mt-1">{errors.hora.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Duração (min) *</label>
            <input
              type="number"
              min="15"
              step="15"
              {...register('duracaoMinutos', { required: 'Obrigatório', valueAsNumber: true })}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Programa *</label>
            <select {...register('programa', { required: true })} className={selectCls}>
              <option value="Dentista do Bem">Dentista do Bem</option>
              <option value="Apolônias do Bem">Apolônias do Bem</option>
              <option value="Mutirão">Mutirão</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Especialidade *</label>
            <select {...register('especialidade', { required: 'Obrigatório' })} className={selectCls}>
              <option value="">Selecione</option>
              {ESPECIALIDADES_DISPONIVEIS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            {errors.especialidade && <p className="text-2xs text-danger mt-1">{errors.especialidade.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Local *</label>
          <input
            {...register('local', { required: 'Obrigatório' })}
            placeholder="Ex.: São Paulo-SP"
            className={inputCls}
          />
          {errors.local && <p className="text-2xs text-danger mt-1">{errors.local.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Observações <span className="font-normal normal-case">(opcional)</span></label>
          <textarea
            {...register('observacoes')}
            rows={2}
            placeholder="Detalhes pré-atendimento..."
            className={`${inputCls} resize-none`}
          />
        </div>
      </form>
    </Modal>
  );
}