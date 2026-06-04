import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Search, Plus, MessageSquare, School, Clock,
  MapPin, CalendarDays, Star, ChevronDown, ChevronUp,
  ArrowRight, CheckCircle2,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';
import { SeverityPill } from '../components/SeverityPill';
import { Modal } from '../components/Modal';
import {
  listarFila,
  obterKpis,
  sugerirDentistas,
  convidarDentista,
  cancelarConvite,
  criarTriagem,
  type SugestaoDentista,
} from '../services/triagens';
import type { Paciente, StatusVinculacao, Programa, Severidade } from '../data/triagens';

const TOTAL_DENTISTAS_EXPANDIDO = 8;
const TOTAL_DENTISTAS_COMPACTO  = 3;

function OrigemBadge({ origem, statusVinculacao }: { origem: Paciente['origem']; statusVinculacao: StatusVinculacao }) {
  if (statusVinculacao === 'convite-enviado') {
    return (
      <div className="flex items-center gap-1.5 text-2xs text-warning">
        <Clock className="w-3 h-3" strokeWidth={2} />
        <span>Convite enviado · aguardando</span>
      </div>
    );
  }
  if (origem.tipo === 'central') {
    return (
      <div className="flex items-center gap-1.5 text-2xs text-subtle">
        <MessageSquare className="w-3 h-3" strokeWidth={2} />
        <span>via Central de Canais</span>
      </div>
    );
  }
  if (origem.tipo === 'escola') {
    return (
      <div className="flex items-center gap-1.5 text-2xs text-subtle">
        <School className="w-3 h-3" strokeWidth={2} />
        <span>via Triagem escolar</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-2xs text-subtle">
      <Plus className="w-3 h-3" strokeWidth={2} />
      <span>Cadastro manual</span>
    </div>
  );
}

export default function TriagensPage() {
  const kpis = obterKpis();

  const [pacientes, setPacientes] = useState<Paciente[]>(listarFila());
  const [selectedId, setSelectedId] = useState(pacientes[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [filtroPrograma, setPrograma] = useState('Todos');
  const [filtroTempo, setFiltroTempo] = useState('Todos');
  const [expandido, setExpandido] = useState(false);

  // Modais
  const [conviteAlvo, setConviteAlvo] = useState<{ dentista: SugestaoDentista['dentista']; match: SugestaoDentista['match'] } | null>(null);
  const [mostrarNovaTriagem, setMostrarNovaTriagem] = useState(false);
  const [processando, setProcessando] = useState(false);

  function refreshFila() {
    setPacientes(listarFila());
  }

  // Reset da expansão ao trocar de paciente
  useEffect(() => {
    setExpandido(false);
  }, [selectedId]);

  const filtered = pacientes.filter((p) => {
    if (filtroPrograma !== 'Todos' && p.programa !== filtroPrograma) return false;
    if (filtroTempo === 'ate7' && p.diasNaFila > 7) return false;
    if (filtroTempo === '8a30' && (p.diasNaFila < 8 || p.diasNaFila > 30)) return false;
    if (filtroTempo === '30a60' && (p.diasNaFila < 30 || p.diasNaFila > 60)) return false;
    if (filtroTempo === 'mais60' && p.diasNaFila <= 60) return false;
    if (search && !p.nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = pacientes.find((p) => p.id === selectedId) ?? pacientes[0];

  const dentistasSugeridos = useMemo(
    () => selected
      ? sugerirDentistas(selected, expandido ? TOTAL_DENTISTAS_EXPANDIDO : TOTAL_DENTISTAS_COMPACTO)
      : [],
    [selected, expandido, pacientes],
  );

  const totalDentistasDisponiveis = useMemo(
    () => selected ? sugerirDentistas(selected, 999).length : 0,
    [selected],
  );

  const podeExpandir = totalDentistasDisponiveis > TOTAL_DENTISTAS_COMPACTO;
  const conviteAtivo = selected?.statusVinculacao === 'convite-enviado';
  const dentistaConvidadoId = selected?.dentistaConvidadoId;

  // ─── Ações ─────────────────────────────────
  async function handleConfirmarConvite() {
    if (!conviteAlvo || !selected) return;
    setProcessando(true);
    try {
      await convidarDentista(selected.id, conviteAlvo.dentista.id);
      toast.success(`Convite enviado para ${conviteAlvo.dentista.nome}`, {
        description: `${selected.nome} está aguardando confirmação.`,
      });
      setConviteAlvo(null);
      refreshFila();
    } catch (err) {
      toast.error('Não foi possível enviar o convite. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  }

  async function handleCancelarConvite() {
    if (!selected) return;
    setProcessando(true);
    try {
      await cancelarConvite(selected.id);
      toast.success('Convite cancelado.');
      refreshFila();
    } catch (err) {
      toast.error('Não foi possível cancelar o convite.');
    } finally {
      setProcessando(false);
    }
  }

  async function handleCriarTriagem(data: NovaTriagemFormData) {
    setProcessando(true);
    try {
      const idade = calcularIdade(data.dataNascimento);
      const novo = await criarTriagem({
        nome: data.nome,
        idade,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        programa: data.programa,
        necessidade: data.necessidade,
        especialidadeNecessaria: data.especialidadeNecessaria,
        severidade: data.severidade,
        origemTipo: data.origemTipo,
        origemDetalhe: data.origemDetalhe || 'Cadastro manual',
      });
      toast.success(`${novo.nome} adicionado(a) à fila de triagens`);
      setMostrarNovaTriagem(false);
      refreshFila();
      setSelectedId(novo.id);
    } catch (err) {
      toast.error('Não foi possível criar a triagem.');
    } finally {
      setProcessando(false);
    }
  }

  if (!selected) {
    return (
      <div className="flex flex-col gap-5 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>
        <div className="bg-surface border border-line rounded-2xl p-12 text-center">
          <p className="text-sm text-muted mb-4">Nenhum paciente na fila</p>
          <button
            onClick={() => setMostrarNovaTriagem(true)}
            className="inline-flex items-center gap-2 text-sm py-2.5 px-4 rounded-xl bg-ink text-surface hover:opacity-90"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Nova triagem
          </button>
        </div>
        <NovaTriagemModal
          open={mostrarNovaTriagem}
          onClose={() => setMostrarNovaTriagem(false)}
          onSubmit={handleCriarTriagem}
          processando={processando}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-full">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-3 text-sm rounded-xl border border-line bg-surface text-ink placeholder:text-subtle focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3">
          <select
            value={filtroPrograma}
            onChange={(e) => setPrograma(e.target.value)}
            className="text-sm py-3 px-3 rounded-xl border border-line bg-surface text-ink cursor-pointer"
          >
            <option value="Todos">Todos programas</option>
            <option value="Dentista do Bem">Dentista do Bem</option>
            <option value="Apolônias do Bem">Apolônias do Bem</option>
          </select>

          <select
            value={filtroTempo}
            onChange={(e) => setFiltroTempo(e.target.value)}
            className="text-sm py-3 px-3 rounded-xl border border-line bg-surface text-ink cursor-pointer"
          >
            <option value="Todos">Tempo na fila</option>
            <option value="ate7">Até 7 dias</option>
            <option value="8a30">8 a 30 dias</option>
            <option value="30a60">30 a 60 dias</option>
            <option value="mais60">+60 dias</option>
          </select>
        </div>

        <button
          onClick={() => setMostrarNovaTriagem(true)}
          className="inline-flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl bg-ink text-surface hover:opacity-90 transition-opacity w-full lg:w-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Nova triagem
        </button>
      </div>

      {/* Fila + Matching */}
      <div className="grid grid-cols-1 xl:grid-cols-12 border border-line rounded-2xl overflow-hidden bg-surface">

        {/* Lista de pacientes */}
        <div className="xl:col-span-5 border-b xl:border-b-0 xl:border-r border-line overflow-y-auto max-h-[420px] xl:max-h-[720px]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">Nenhum paciente encontrado</div>
          ) : (
            filtered.map((p) => {
              const isSelected = selectedId === p.id;
              const diasDestaque = p.diasNaFila > 60 ? 'text-danger' : 'text-ink';
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left flex gap-3 p-4 border-b border-line transition-colors ${
                    isSelected ? 'bg-brand-soft' : 'hover:bg-surface-soft'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1 min-w-[56px]">
                    <span className={`text-lg font-semibold leading-none ${diasDestaque}`}>{p.diasNaFila}</span>
                    <span className={`text-2xs ${p.diasNaFila > 60 ? 'text-danger' : 'text-subtle'}`}>dias</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-ink truncate">{p.nome}, {p.idade}</p>
                      <SeverityPill severidade={p.severidade} />
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">{p.programa} · {p.cidade}-{p.estado}</p>
                    <div className="mt-1.5">
                      <OrigemBadge origem={p.origem} statusVinculacao={p.statusVinculacao} />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Painel de matching */}
        <div className="xl:col-span-7 p-4 md:p-5 overflow-y-auto max-h-none xl:max-h-[720px]">

          {/* Header do paciente */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <Avatar initials={selected.iniciais} size="md" tone="info" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">{selected.nome}, {selected.idade} anos</p>
              <p className="text-xs text-muted mt-0.5">{selected.programa} · {selected.cidade}-{selected.estado} · CEP {selected.cep}</p>
            </div>
            <SeverityPill severidade={selected.severidade} />
          </div>

          {/* Info card */}
          <div className="bg-surface-soft rounded-xl p-4 mb-5 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2">
              <span className="text-muted">Necessidade</span>
              <span className="font-medium text-ink">{selected.necessidade}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2">
              <span className="text-muted">Origem</span>
              <span className="text-ink text-right">{selected.origem.detalhe}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2">
              <span className="text-muted">Na fila há</span>
              <span className={`font-medium ${selected.diasNaFila > 60 ? 'text-danger' : 'text-ink'}`}>{selected.diasNaFila} dias</span>
            </div>
          </div>

          {/* Banner convite ativo */}
          {conviteAtivo && (
            <div className="bg-warning-soft border border-warning/30 rounded-xl p-3 mb-4 flex items-start sm:items-center gap-3 flex-col sm:flex-row">
              <Clock className="w-4 h-4 text-warning shrink-0" strokeWidth={2} />
              <p className="flex-1 text-xs text-ink">
                Convite enviado · aguardando resposta do dentista. Cancele para convidar outro.
              </p>
              <button
                onClick={handleCancelarConvite}
                disabled={processando}
                className="text-xs py-1.5 px-3 rounded-lg border border-line text-ink hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Cancelar convite
              </button>
            </div>
          )}

          {/* Sugeridos */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-ink">Dentistas sugeridos</p>
            <span className="text-2xs text-subtle">Ordenado por compatibilidade</span>
          </div>

          {dentistasSugeridos.map(({ dentista, match }, idx) => {
            const isTop = idx === 0;
            const ehConvidado = dentista.id === dentistaConvidadoId;
            const desabilitado = conviteAtivo && !ehConvidado;

            return (
              <div
                key={dentista.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl mb-3 ${
                  ehConvidado ? 'border-2 border-warning bg-warning-soft/40' :
                  isTop      ? 'border-2 border-info' :
                              'border border-line'
                }`}
              >
                <Avatar initials={dentista.iniciais} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <p className="text-sm font-medium text-ink truncate">{dentista.nome}</p>
                    <span className="text-xs font-medium text-ink shrink-0">Match {match.scorePercent}%</span>
                  </div>
                  <p className="text-2xs text-muted mt-0.5">{dentista.especialidade} · {dentista.vinculos} vínculos</p>
                  <div className="flex items-center gap-3 mt-1.5 text-2xs text-subtle flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" strokeWidth={2} />
                      {match.distanciaKm < 10 ? match.distanciaKm.toFixed(1) : Math.round(match.distanciaKm)} km
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" strokeWidth={2} />
                      {dentista.slotsDisponiveis} slots / 14d
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3 h-3" strokeWidth={2} />
                      {dentista.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                {ehConvidado ? (
                  <div className="inline-flex items-center gap-1.5 text-2xs font-medium text-warning px-3 py-2 rounded-xl bg-surface border border-warning/40 w-full sm:w-auto justify-center">
                    <Clock className="w-3 h-3" strokeWidth={2} />
                    Convite enviado
                  </div>
                ) : (
                  <button
                    onClick={() => setConviteAlvo({ dentista, match })}
                    disabled={desabilitado || processando}
                    className={`w-full sm:w-auto text-sm px-4 py-2 rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${
                      isTop ? 'bg-ink text-surface hover:opacity-90' : 'border border-line text-ink hover:bg-surface-soft'
                    }`}
                    title={desabilitado ? 'Cancele o convite ativo para convidar outro' : ''}
                  >
                    Convidar
                  </button>
                )}
              </div>
            );
          })}

          {podeExpandir && (
            <button
              onClick={() => setExpandido((e) => !e)}
              className="w-full inline-flex items-center justify-center gap-2 text-sm py-3 mt-3 rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors"
            >
              {expandido ? 'Ver menos' : `Ver mais opções (${totalDentistasDisponiveis - TOTAL_DENTISTAS_COMPACTO})`}
              {expandido ? <ChevronUp className="w-3.5 h-3.5" strokeWidth={2} /> : <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />}
            </button>
          )}
        </div>
      </div>

      {/* Modal: Confirmar convite */}
      <Modal
        open={!!conviteAlvo}
        onClose={() => !processando && setConviteAlvo(null)}
        title="Confirmar convite"
        description="O dentista será notificado e o paciente entra em 'aguardando confirmação'."
        size="md"
        footer={
          <>
            <button
              onClick={() => setConviteAlvo(null)}
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarConvite}
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
              {processando ? 'Enviando...' : 'Confirmar convite'}
            </button>
          </>
        }
      >
        {conviteAlvo && selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-line">
                <Avatar initials={selected.iniciais} size="sm" tone="info" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{selected.nome}</p>
                  <p className="text-2xs text-muted">Paciente · {selected.programa}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted shrink-0" strokeWidth={2} />
              <div className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-line">
                <Avatar initials={conviteAlvo.dentista.iniciais} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{conviteAlvo.dentista.nome}</p>
                  <p className="text-2xs text-muted">{conviteAlvo.dentista.especialidade}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-soft rounded-xl p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted">Compatibilidade</span>
                <span className="font-medium text-ink">{conviteAlvo.match.scorePercent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Distância</span>
                <span className="text-ink">
                  {conviteAlvo.match.distanciaKm < 10 ? conviteAlvo.match.distanciaKm.toFixed(1) : Math.round(conviteAlvo.match.distanciaKm)} km
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Slots disponíveis</span>
                <span className="text-ink">{conviteAlvo.dentista.slotsDisponiveis} em 14 dias</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Necessidade</span>
                <span className="text-ink">{selected.necessidade}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Nova triagem */}
      <NovaTriagemModal
        open={mostrarNovaTriagem}
        onClose={() => !processando && setMostrarNovaTriagem(false)}
        onSubmit={handleCriarTriagem}
        processando={processando}
      />
    </div>
  );
}

// ─── MODAL NOVA TRIAGEM ───────────────────────

interface NovaTriagemFormData {
  nome: string;
  dataNascimento: string;
  programa: Programa;
  cidade: string;
  estado: string;
  cep: string;
  necessidade: string;
  especialidadeNecessaria: string;
  severidade: Severidade;
  origemTipo: 'central' | 'escola' | 'manual';
  origemDetalhe: string;
}

const ESTADOS_UF = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

const ESPECIALIDADES = ['Clínico geral', 'Endodontia', 'Ortodontia', 'Periodontia', 'Cirurgia', 'Pediatria'];

const NECESSIDADES_SUGESTAO = [
  'Avaliação inicial',
  'Tratamento de canal',
  'Tratamento de canal · dor aguda',
  'Reabilitação completa',
  'Avaliação ortodôntica',
  'Limpeza e prevenção',
  'Trauma dental',
  'Consulta inicial',
];

function calcularIdade(dataNasc: string): number {
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function NovaTriagemModal({
  open, onClose, onSubmit, processando,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NovaTriagemFormData) => Promise<void>;
  processando: boolean;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<NovaTriagemFormData>({
    defaultValues: {
      programa: 'Dentista do Bem',
      severidade: 'Media',
      origemTipo: 'manual',
      especialidadeNecessaria: 'Clínico geral',
    },
  });

  async function submit(data: NovaTriagemFormData) {
    await onSubmit(data);
    reset();
  }

  function handleClose() {
    if (processando) return;
    reset();
    onClose();
  }

  const labelCls = "block text-2xs font-semibold uppercase tracking-wide text-muted mb-1.5";
  const inputCls = "w-full bg-surface border border-line text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors";
  const selectCls = inputCls + " cursor-pointer";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nova triagem"
      description="Cadastre manualmente um paciente na fila de triagens."
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-nova-triagem"
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Cadastrando...' : 'Cadastrar triagem'}
          </button>
        </>
      }
    >
      <form id="form-nova-triagem" onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Nome completo *</label>
            <input
              {...register('nome', { required: 'Obrigatório' })}
              placeholder="Nome do paciente"
              className={inputCls}
            />
            {errors.nome && <p className="text-2xs text-danger mt-1">{errors.nome.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Data de nascimento *</label>
            <input
              type="date"
              {...register('dataNascimento', { required: 'Obrigatório' })}
              className={inputCls}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.dataNascimento && <p className="text-2xs text-danger mt-1">{errors.dataNascimento.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Programa *</label>
            <select {...register('programa', { required: true })} className={selectCls}>
              <option value="Dentista do Bem">Dentista do Bem</option>
              <option value="Apolônias do Bem">Apolônias do Bem</option>
            </select>
          </div>

          <div className="md:col-span-2 grid grid-cols-12 gap-3">
            <div className="col-span-12 sm:col-span-7">
              <label className={labelCls}>Cidade *</label>
              <input
                {...register('cidade', { required: 'Obrigatório' })}
                placeholder="São Paulo"
                className={inputCls}
              />
              {errors.cidade && <p className="text-2xs text-danger mt-1">{errors.cidade.message}</p>}
            </div>
            <div className="col-span-4 sm:col-span-2">
              <label className={labelCls}>UF *</label>
              <select {...register('estado', { required: true })} className={selectCls}>
                {ESTADOS_UF.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
            <div className="col-span-8 sm:col-span-3">
              <label className={labelCls}>CEP *</label>
              <input
                {...register('cep', { required: 'Obrigatório' })}
                placeholder="00000-000"
                maxLength={9}
                className={inputCls}
              />
              {errors.cep && <p className="text-2xs text-danger mt-1">{errors.cep.message}</p>}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Necessidade *</label>
            <input
              {...register('necessidade', { required: 'Obrigatório' })}
              list="necessidades-list"
              placeholder="Ex.: Tratamento de canal · dor aguda"
              className={inputCls}
            />
            <datalist id="necessidades-list">
              {NECESSIDADES_SUGESTAO.map((n) => <option key={n} value={n} />)}
            </datalist>
            {errors.necessidade && <p className="text-2xs text-danger mt-1">{errors.necessidade.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Especialidade necessária *</label>
            <select {...register('especialidadeNecessaria', { required: true })} className={selectCls}>
              {ESPECIALIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Severidade *</label>
            <select {...register('severidade', { required: true })} className={selectCls}>
              <option value="Alta">Alta</option>
              <option value="Media">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Origem *</label>
            <select {...register('origemTipo', { required: true })} className={selectCls}>
              <option value="manual">Cadastro manual</option>
              <option value="central">Central de Canais</option>
              <option value="escola">Triagem escolar</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Detalhes da origem</label>
            <input
              {...register('origemDetalhe')}
              placeholder="Opcional · ex.: indicação CRAS"
              className={inputCls}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}