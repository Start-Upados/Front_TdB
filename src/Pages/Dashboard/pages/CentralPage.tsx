import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Search, Plus, Sparkles, RefreshCw, Send, ArrowRight, Share2, Archive,
  MessageSquare, Globe, Mail, MessageCircle, Phone, AlertCircle,
  Inbox, FileCheck, RotateCcw, CheckCircle2,
} from 'lucide-react';

import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';
import { PriorityPill } from '../components/PriorityPill';
import { Modal } from '../components/Modal';

import {
  listarAtivas, listarArquivo, obterKpis,
  atualizarClassificacao, arquivarSolicitacao,
  responderSolicitacao, encaminharSolicitacao, promoverParaTriagem,
  resolverSolicitacao, reabrirSolicitacao, carregarSolicitacoesReais,
} from '../services/central';
import { classificarPrioridade } from '../services/ml';
import type { Canal, Prioridade, Solicitacao, MotivoFechamento } from '../data/central';

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────

const CHANNEL_ICONS: Record<Canal, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Site: Globe, WhatsApp: MessageSquare, Email: Mail, Instagram: MessageCircle, Telefone: Phone,
};

// ─────────────────────────────────────────────
// STATUS HELPERS
// ─────────────────────────────────────────────

function tempoRelativo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const horas = Math.floor(mins / 60);
  if (horas < 24) return `${horas}h`;
  return `${Math.floor(horas / 24)}d`;
}

function formatarHora(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function configMotivo(motivo: MotivoFechamento) {
  switch (motivo) {
    case 'resolvida':   return { label: 'Resolvida',   bg: 'bg-success-soft', text: 'text-success', Icon: CheckCircle2 };
    case 'arquivada':   return { label: 'Arquivada',   bg: 'bg-surface-soft', text: 'text-muted',   Icon: Archive };
    case 'encaminhada': return { label: 'Encaminhada', bg: 'bg-info-soft',    text: 'text-info',    Icon: Share2 };
    case 'promovida':   return { label: 'Promovida',   bg: 'bg-brand-soft',   text: 'text-brand',   Icon: ArrowRight };
  }
}

// ─────────────────────────────────────────────
// FEATURE ROW
// ─────────────────────────────────────────────

function FeatureRow({ label, value, prioridade }: { label: string; value: string; prioridade: Prioridade }) {
  const tone = prioridade === 'Alta' ? 'text-danger' : prioridade === 'Media' ? 'text-warning' : 'text-muted';
  const [main, detail] = value.split(' · ');
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm">
        <span className="font-medium text-ink">{main}</span>
        {detail && (<>{' · '}<span className={tone}>{detail}</span></>)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

type Vista = 'ativas' | 'arquivo';
type AcaoModal = 'encaminhar' | 'arquivar' | 'resolver' | null;

export default function CentralPage() {
  const navigate = useNavigate();
  const [versao, setVersao] = useState(0);
  const [vista, setVista] = useState<Vista>('ativas');

  const todas = useMemo(
    () => (vista === 'ativas' ? listarAtivas() : listarArquivo()),
    [versao, vista],
  );
  const kpis = useMemo(() => obterKpis(), [versao]);

  const [selectedId, setSelectedId] = useState<string>(todas[0]?.id ?? '');
  const [filterCanal, setFilterCanal] = useState('Todos');
  const [filterPrioridade, setFilterPrior] = useState('Todas');
  const [search, setSearch] = useState('');

  const [reclassificando, setReclassificando] = useState(false);
  const [respondendo, setRespondendo] = useState(false);
  const [promovendo, setPromovendo] = useState(false);
  const [reabrindo, setReabrindo] = useState(false);
  const [resposta, setResposta] = useState('');
  const [acaoModal, setAcaoModal] = useState<AcaoModal>(null);
  const [processandoModal, setProcessandoModal] = useState(false);
  const [carregandoBackend, setCarregandoBackend] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);

  // Função pra recarregar do backend Java
  async function recarregarDoBackend(silencioso = false) {
    setCarregandoBackend(true);
    try {
      const resultado = await carregarSolicitacoesReais();
      refresh();
      if (!silencioso) {
        if (resultado.fonte === 'backend') {
          toast.success(`${resultado.count} ${resultado.count === 1 ? 'solicitação carregada' : 'solicitações carregadas'} do backend`);
        } else {
          toast.warning('Backend indisponível', {
            description: 'Mostrando dados de demonstração.',
          });
        }
      }
    } catch {
      if (!silencioso) toast.error('Erro ao carregar solicitações');
    } finally {
      setCarregandoBackend(false);
    }
  }

  function refresh() { setVersao((v) => v + 1); }

  // Garante que sempre há algo selecionado quando a vista muda
  useEffect(() => {
    if (!todas.find((s) => s.id === selectedId) && todas.length > 0) {
      setSelectedId(todas[0].id);
      setResposta('');
    } else if (todas.length === 0) {
      setSelectedId('');
    }
  }, [todas, selectedId]);

  // Auto-scroll do thread pra última mensagem
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [selectedId, versao]);

  // Carrega do backend Java no mount (silencioso — sem toast)
  useEffect(() => {
    recarregarDoBackend(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = todas.filter((s) => {
    if (filterCanal !== 'Todos' && s.canal !== filterCanal) return false;
    if (filterPrioridade !== 'Todas' && s.prioridade !== filterPrioridade) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.nome.toLowerCase().includes(q) && !s.preview.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selected = todas.find((s) => s.id === selectedId);

  // ─── Handlers ──────────────────────────────

  async function handleReclassificar() {
    if (!selected) return;
    setReclassificando(true);
    try {
      const programa =
        selected.tipo.includes('Voluntário') ? 'Voluntariado' :
        (selected.idade !== undefined && selected.idade < 18) ? 'Dentista do Bem' :
        selected.tipo.includes('Doador') ? 'Doações' : 'Apolônias do Bem';

      const textoCompleto = selected.mensagens.filter((m) => m.autor === 'paciente').map((m) => m.texto).join(' ');

      const resultado = await classificarPrioridade({
        texto: textoCompleto,
        idade: selected.idade,
        canal: selected.canal,
        programa,
        tipo: selected.tipo,
      });

      await atualizarClassificacao(selected.id, {
        prioridade: resultado.prioridade,
        score: resultado.score,
        featuresUsadas: resultado.featuresUsadas,
      });
      refresh();

      const mudou = resultado.prioridade !== selected.prioridade;
      toast.success(
        mudou ? `Reclassificada como ${resultado.prioridade}` : 'Classificação confirmada',
        { description: `${Math.round(resultado.score * 100)}% de confiança · ${resultado.modeloVersao ?? 'modelo atual'}` },
      );
    } catch (err) {
      toast.error('Não foi possível reclassificar', {
        description: err instanceof Error ? err.message : 'Verifique a API ML.',
      });
    } finally {
      setReclassificando(false);
    }
  }

  async function handleResponder() {
    if (!selected || !resposta.trim()) {
      toast.error('Digite uma resposta antes de enviar');
      return;
    }
    setRespondendo(true);
    try {
      await responderSolicitacao(selected.id, resposta);
      toast.success('Mensagem enviada', { description: `Via ${selected.canal} para ${selected.nome.split(' ')[0]}` });
      setResposta('');
      refresh();
    } catch {
      toast.error('Não foi possível enviar');
    } finally {
      setRespondendo(false);
    }
  }

  async function handlePromover() {
    if (!selected) return;
    setPromovendo(true);
    try {
      await promoverParaTriagem(selected.id);
      toast.success('Promovida para triagem', { description: 'Disponível na fila de triagens.' });
      refresh();
      navigate('/dashboard/triagens');
    } catch {
      toast.error('Não foi possível promover');
    } finally {
      setPromovendo(false);
    }
  }

  async function handleReabrir() {
    if (!selected) return;
    setReabrindo(true);
    try {
      await reabrirSolicitacao(selected.id);
      toast.success('Conversa reaberta');
      setVista('ativas');
      refresh();
    } catch {
      toast.error('Não foi possível reabrir');
    } finally {
      setReabrindo(false);
    }
  }

  async function handleConfirmarResolver() {
    if (!selected) return;
    setProcessandoModal(true);
    try {
      await resolverSolicitacao(selected.id);
      toast.success('Conversa marcada como resolvida', { description: 'Movida para o arquivo.' });
      setAcaoModal(null);
      refresh();
    } catch {
      toast.error('Não foi possível resolver');
    } finally {
      setProcessandoModal(false);
    }
  }

  async function handleConfirmarEncaminhar(destinatario: string, nota: string) {
    if (!selected) return;
    setProcessandoModal(true);
    try {
      await encaminharSolicitacao(selected.id, destinatario, nota);
      toast.success(`Encaminhada para ${destinatario}`);
      setAcaoModal(null);
      refresh();
    } catch {
      toast.error('Não foi possível encaminhar');
    } finally {
      setProcessandoModal(false);
    }
  }

  async function handleConfirmarArquivar() {
    if (!selected) return;
    setProcessandoModal(true);
    try {
      await arquivarSolicitacao(selected.id);
      toast.success('Solicitação arquivada');
      setAcaoModal(null);
      refresh();
    } catch {
      toast.error('Não foi possível arquivar');
    } finally {
      setProcessandoModal(false);
    }
  }

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* TABS (Ativas / Arquivo) + FILTERS */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="inline-flex rounded-xl border border-line bg-surface shadow-cardp-1">
          <button
            onClick={() => setVista('ativas')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
              vista === 'ativas' ? 'bg-ink text-surface' : 'text-muted hover:text-ink'
            }`}
          >
            <Inbox className="h-3.5 w-3.5" strokeWidth={2} />
            Ativas
            <span className={`text-xs ${vista === 'ativas' ? 'text-surface/70' : 'text-subtle'}`}>
              {listarAtivas().length}
            </span>
          </button>
          <button
            onClick={() => setVista('arquivo')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
              vista === 'arquivo' ? 'bg-ink text-surface' : 'text-muted hover:text-ink'
            }`}
          >
            <FileCheck className="h-3.5 w-3.5" strokeWidth={2} />
            Arquivo
            <span className={`text-xs ${vista === 'arquivo' ? 'text-surface/70' : 'text-subtle'}`}>
              {listarArquivo().length}
            </span>
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={2} />
          <input
            type="text" placeholder="Buscar solicitação..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface shadow-cardpy-3 pl-10 pr-3 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">
          <select value={filterCanal} onChange={(e) => setFilterCanal(e.target.value)}
            className="min-w-[140px] cursor-pointer rounded-xl border border-line bg-surface shadow-cardpx-3 py-3 text-sm text-ink">
            <option value="Todos">Todos canais</option>
            <option value="Site">Site</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Email</option>
            <option value="Instagram">Instagram</option>
            <option value="Telefone">Telefone</option>
          </select>
          <select value={filterPrioridade} onChange={(e) => setFilterPrior(e.target.value)}
            className="min-w-[140px] cursor-pointer rounded-xl border border-line bg-surface shadow-cardpx-3 py-3 text-sm text-ink">
            <option value="Todas">Todas prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Media">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>

        <button
          onClick={() => recarregarDoBackend(false)}
          disabled={carregandoBackend}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface shadow-cardpx-4 py-3 text-sm text-ink transition-colors hover:bg-surface-soft disabled:opacity-50 disabled:cursor-not-allowed xl:w-auto"
          >
          <RefreshCw className={`h-4 w-4 ${carregandoBackend ? 'animate-spin' : ''}`} strokeWidth={2} />
          {carregandoBackend ? 'Carregando...' : 'Recarregar'}
        </button>

        {vista === 'ativas' && (
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface shadow-cardpx-4 py-3 text-sm text-ink transition-colors hover:bg-surface-soft xl:w-auto">
            <Plus className="h-4 w-4" strokeWidth={2} />
            Manual
          </button>
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-surface shadow-cardxl:grid-cols-12">

        {/* LIST */}
        <div className="max-h-[420px] overflow-y-auto border-b border-line xl:col-span-5 xl:max-h-[760px] xl:border-b-0 xl:border-r">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted">
              {vista === 'ativas' ? 'Nenhuma solicitação ativa.' : 'Arquivo vazio.'}
            </div>
          ) : (
            filtered.map((item) => {
              const ItemChannelIcon = CHANNEL_ICONS[item.canal];
              const isSelected = selectedId === item.id;
              const motivoCfg = item.motivoFechamento ? configMotivo(item.motivoFechamento) : null;
              return (
                <button
                  key={item.id}
                  onClick={() => { setSelectedId(item.id); setResposta(''); }}
                  className={`flex w-full gap-4 border-b border-line p-4 text-left transition-colors ${
                    isSelected ? 'bg-info-soft' : 'hover:bg-surface-soft'
                  }`}
                >
                  <div className="flex min-w-[60px] flex-col items-center gap-2">
                    <PriorityPill prioridade={item.prioridade} />
                    <span className="text-xs text-subtle">{Math.round(item.score * 100)}%</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <p className="truncate text-sm font-medium text-ink md:text-base">{item.nome}</p>
                      <span className="shrink-0 text-xs text-subtle">{item.data}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted md:text-sm">{item.preview}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-subtle">
                      <span className="inline-flex items-center gap-1">
                        <ItemChannelIcon className="h-3.5 w-3.5" strokeWidth={2} />
                        {item.canal} · {item.tipo}
                      </span>

                      {item.status === 'aguardando-paciente' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-warning-soft text-warning text-2xs font-medium">
                          aguardando resposta
                        </span>
                      )}
                      {motivoCfg && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${motivoCfg.bg} ${motivoCfg.text} text-2xs font-medium`}>
                          <motivoCfg.Icon className="h-3 w-3" strokeWidth={2} />
                          {motivoCfg.label}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* DETAIL */}
        {!selected ? (
          <div className="flex items-center justify-center xl:col-span-7 xl:max-h-[760px] p-10">
            <p className="text-sm text-muted">
              {vista === 'ativas'
                ? 'Selecione uma solicitação para ver a conversa.'
                : 'Selecione uma conversa do arquivo para revisar.'}
            </p>
          </div>
        ) : (
          <DetalheConversa
            selected={selected}
            vista={vista}
            threadRef={threadRef}
            resposta={resposta}
            setResposta={setResposta}
            reclassificando={reclassificando}
            respondendo={respondendo}
            promovendo={promovendo}
            reabrindo={reabrindo}
            onReclassificar={handleReclassificar}
            onResponder={handleResponder}
            onPromover={handlePromover}
            onAbrirEncaminhar={() => setAcaoModal('encaminhar')}
            onAbrirArquivar={() => setAcaoModal('arquivar')}
            onAbrirResolver={() => setAcaoModal('resolver')}
            onReabrir={handleReabrir}
          />
        )}
      </div>

      {/* MODAIS */}
      <ResolverModal
        open={acaoModal === 'resolver'}
        nome={selected?.nome ?? ''}
        onClose={() => !processandoModal && setAcaoModal(null)}
        onConfirmar={handleConfirmarResolver}
        processando={processandoModal}
      />
      <EncaminharModal
        open={acaoModal === 'encaminhar'}
        nome={selected?.nome ?? ''}
        onClose={() => !processandoModal && setAcaoModal(null)}
        onConfirmar={handleConfirmarEncaminhar}
        processando={processandoModal}
      />
      <ArquivarModal
        open={acaoModal === 'arquivar'}
        nome={selected?.nome ?? ''}
        onClose={() => !processandoModal && setAcaoModal(null)}
        onConfirmar={handleConfirmarArquivar}
        processando={processandoModal}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// DETALHE / THREAD DE CONVERSA
// ─────────────────────────────────────────────

function DetalheConversa({
  selected, vista, threadRef,
  resposta, setResposta,
  reclassificando, respondendo, promovendo, reabrindo,
  onReclassificar, onResponder, onPromover,
  onAbrirEncaminhar, onAbrirArquivar, onAbrirResolver, onReabrir,
}: {
  selected: Solicitacao;
  vista: Vista;
  threadRef: React.RefObject<HTMLDivElement | null>;
  resposta: string;
  setResposta: (v: string) => void;
  reclassificando: boolean;
  respondendo: boolean;
  promovendo: boolean;
  reabrindo: boolean;
  onReclassificar: () => void;
  onResponder: () => void;
  onPromover: () => void;
  onAbrirEncaminhar: () => void;
  onAbrirArquivar: () => void;
  onAbrirResolver: () => void;
  onReabrir: () => void;
}) {
  const ChannelIcon = CHANNEL_ICONS[selected.canal];
  const isFechada = selected.status === 'fechada';
  const motivoCfg = selected.motivoFechamento ? configMotivo(selected.motivoFechamento) : null;

  return (
    <div className="flex flex-col xl:col-span-7 xl:max-h-[760px]">

      {/* HEADER */}
      <div className="border-b border-line p-4 md:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar initials={selected.iniciais} size="md" tone="info" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-ink md:text-base">{selected.nome}</p>
              {motivoCfg && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${motivoCfg.bg} ${motivoCfg.text} text-2xs font-medium`}>
                  <motivoCfg.Icon className="h-3 w-3" strokeWidth={2} />
                  {motivoCfg.label}
                  {selected.destinatarioEncaminhamento && ` · ${selected.destinatarioEncaminhamento}`}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">
              {selected.tipo}{selected.idade && ` · ${selected.idade} anos`}{selected.cidade && ` · ${selected.cidade}`}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-subtle">{selected.data} atrás</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-subtle sm:justify-end">
              via {selected.canal}
              <ChannelIcon className="h-3.5 w-3.5" strokeWidth={2} />
            </p>
          </div>
        </div>
      </div>

      {/* ML CARD */}
      <div className="border-b border-line p-4 md:p-5">
        <div className="rounded-2xl border border-line p-4">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-info" strokeWidth={2} />
              <span className="text-sm text-muted">Classificação por ML</span>
            </div>
            {!isFechada && (
              <button
                onClick={onReclassificar}
                disabled={reclassificando}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-soft disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${reclassificando ? 'animate-spin' : ''}`} strokeWidth={2} />
                {reclassificando ? 'Reclassificando...' : 'Reclassificar'}
              </button>
            )}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <PriorityPill prioridade={selected.prioridade} size="md" />
            <span className="text-sm text-ink">{Math.round(selected.score * 100)}% de confiança</span>
          </div>

          {selected.featuresUsadas && (
            <>
              <p className="mb-2 text-xs tracking-wider text-muted">POR QUE ESSA PRIORIDADE</p>
              <div className="divide-y divide-line">
                {selected.featuresUsadas.idade && (
                  <FeatureRow label="Idade" value={selected.featuresUsadas.idade} prioridade={selected.prioridade} />
                )}
                {selected.featuresUsadas.programa && (
                  <FeatureRow label="Programa" value={selected.featuresUsadas.programa} prioridade={selected.prioridade} />
                )}
                {selected.featuresUsadas.canal && (
                  <FeatureRow label="Canal" value={selected.featuresUsadas.canal} prioridade={selected.prioridade} />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* THREAD */}
      <div ref={threadRef} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
        <p className="text-xs tracking-wider text-muted mb-2">CONVERSA ({selected.mensagens.length})</p>
        {selected.mensagens.map((msg) => {
          const isAdmin = msg.autor === 'admin';
          return (
            <div key={msg.id} className={`flex gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
              <Avatar
                initials={isAdmin ? (msg.autorIniciais ?? 'TDB') : selected.iniciais}
                size="sm"
                tone={isAdmin ? 'info' : undefined}
              />
              <div className={`max-w-[80%] flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isAdmin
                    ? 'bg-ink text-surface rounded-tr-sm'
                    : 'bg-surface-soft text-ink rounded-tl-sm'
                }`}>
                  {msg.texto}
                </div>
                <div className="flex items-center gap-2 mt-1 text-2xs text-subtle px-1">
                  {isAdmin && <span>{msg.autorNome ?? 'Admin'}</span>}
                  <span>{formatarHora(msg.timestamp)}</span>
                  <span>·</span>
                  <span>{tempoRelativo(msg.timestamp)} atrás</span>
                </div>
              </div>
            </div>
          );
        })}

        {isFechada && (
          <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted">
            <div className="flex-1 border-t border-line" />
            <span>Conversa fechada</span>
            <div className="flex-1 border-t border-line" />
          </div>
        )}
      </div>

      {/* REPLY + ACTIONS */}
      <div className="border-t border-line p-4 md:p-5">
        {isFechada ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              {motivoCfg && `Fechada como ${motivoCfg.label.toLowerCase()}`}
              {selected.destinatarioEncaminhamento && ` para ${selected.destinatarioEncaminhamento}`}
            </p>
            <button
              onClick={onReabrir}
              disabled={reabrindo}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              {reabrindo ? 'Reabrindo...' : 'Reabrir conversa'}
            </button>
          </div>
        ) : (
          <>
            <textarea
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              placeholder={`Responder ${selected.nome.split(' ')[0]}...`}
              className="mb-3 min-h-[80px] w-full resize-none rounded-2xl border border-line bg-surface shadow-cardp-4 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 xl:flex xl:flex-row xl:flex-wrap">
              <button
                onClick={onResponder}
                disabled={respondendo || !resposta.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm text-surface transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" strokeWidth={2} />
                {respondendo ? 'Enviando...' : 'Responder'}
              </button>
              <button
                onClick={onAbrirResolver}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-success transition-colors hover:bg-success-soft"
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                Resolver
              </button>
              <button
                onClick={onPromover}
                disabled={promovendo}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-soft disabled:opacity-50"
              >
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
                {promovendo ? 'Promovendo...' : 'Promover'}
              </button>
              <button
                onClick={onAbrirEncaminhar}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-soft"
              >
                <Share2 className="h-4 w-4" strokeWidth={2} />
                Encaminhar
              </button>
              <button
                onClick={onAbrirArquivar}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-soft"
              >
                <Archive className="h-4 w-4" strokeWidth={2} />
                Arquivar
              </button>
            </div>
          </>
        )}
      </div>
      {void vista}
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL — RESOLVER
// ─────────────────────────────────────────────

function ResolverModal({
  open, nome, onClose, onConfirmar, processando,
}: { open: boolean; nome: string; onClose: () => void; onConfirmar: () => Promise<void>; processando: boolean }) {
  return (
    <Modal
      open={open} onClose={onClose}
      title="Marcar como resolvida"
      size="sm"
      footer={
        <>
          <button onClick={onClose} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-success text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Resolvendo...' : 'Marcar como resolvida'}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-sm text-ink leading-relaxed">
          A conversa com <span className="font-medium">{nome}</span> será marcada como resolvida e movida para o arquivo. Você pode reabrir depois se precisar.
        </p>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// MODAL — ENCAMINHAR
// ─────────────────────────────────────────────

interface FormEncaminhar { destinatario: string; nota: string; }

function EncaminharModal({
  open, nome, onClose, onConfirmar, processando,
}: {
  open: boolean; nome: string; onClose: () => void;
  onConfirmar: (destinatario: string, nota: string) => Promise<void>;
  processando: boolean;
}) {
  const { register, handleSubmit, reset } = useForm<FormEncaminhar>({
    defaultValues: { destinatario: 'Equipe de Voluntariado', nota: '' },
  });

  useEffect(() => {
    if (open) reset({ destinatario: 'Equipe de Voluntariado', nota: '' });
  }, [open, reset]);

  async function submit(data: FormEncaminhar) {
    await onConfirmar(data.destinatario, data.nota);
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title="Encaminhar conversa"
      description={`De ${nome} para outra equipe`}
      size="md"
      footer={
        <>
          <button onClick={onClose} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" form="form-encaminhar" disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50">
            <Share2 className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Encaminhando...' : 'Encaminhar'}
          </button>
        </>
      }
    >
      <form id="form-encaminhar" onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">Destinatário *</label>
          <select {...register('destinatario', { required: true })}
            className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand">
            <option value="Equipe de Voluntariado">Equipe de Voluntariado</option>
            <option value="Equipe Apolônias">Equipe Apolônias do Bem</option>
            <option value="Equipe de Doações">Equipe de Doações</option>
            <option value="Equipe Jurídica">Equipe Jurídica</option>
            <option value="Direção">Direção</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
            Nota interna <span className="font-normal normal-case">(opcional)</span>
          </label>
          <textarea {...register('nota')} rows={3}
            placeholder="Contexto para a equipe destinatária..."
            className="w-full bg-surface border border-line text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// MODAL — ARQUIVAR
// ─────────────────────────────────────────────

function ArquivarModal({
  open, nome, onClose, onConfirmar, processando,
}: { open: boolean; nome: string; onClose: () => void; onConfirmar: () => Promise<void>; processando: boolean }) {
  return (
    <Modal
      open={open} onClose={onClose}
      title="Arquivar conversa"
      size="sm"
      footer={
        <>
          <button onClick={onClose} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-danger text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50">
            <Archive className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Arquivando...' : 'Confirmar arquivamento'}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-sm text-ink leading-relaxed">
          A conversa com <span className="font-medium">{nome}</span> será arquivada. Você pode consultá-la no Arquivo e reabrir se precisar.
        </p>
      </div>
    </Modal>
  );
}