import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle, Bot, Clock, Inbox, MessageCircle, MessageSquare,
  RefreshCw, Send, ShieldAlert,
} from 'lucide-react';

import { Avatar } from './Avatar';
import {
  abrirConversaCanal, listarConversasCanais, parseDataBackend, responderConversaCanal,
  type ConversaCanal, type FiltroCanais, type MensagemCanal,
} from '../services/canais';

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const INTERVALO_ATUALIZACAO_MS = 25_000;
const JANELA_INSTAGRAM_MS = 24 * 60 * 60 * 1000;

const FILTROS: { id: FiltroCanais; label: string }[] = [
  { id: 'principal', label: 'Principal' },
  { id: 'em_triagem', label: 'Em triagem' },
  { id: 'voluntarios', label: 'Voluntários' },
  { id: 'outros', label: 'Outros' },
  { id: 'nao_elegiveis', label: 'Não elegíveis' },
  { id: 'todas', label: 'Todas' },
];

const PROGRAMA_LABEL: Record<string, string> = {
  dentista: 'Dentista do Bem',
  apolonias: 'Apolônias do Bem',
  voluntario: 'Voluntário',
  outro: 'Outro assunto',
};

const RESULTADO_CFG: Record<string, { label: string; cls: string }> = {
  elegivel:     { label: 'Elegível',           cls: 'bg-success-soft text-success' },
  humano:       { label: 'Atendimento humano', cls: 'bg-info-soft text-info' },
  pendente:     { label: 'Em triagem',         cls: 'bg-warning-soft text-warning' },
  nao_elegivel: { label: 'Não elegível',       cls: 'bg-surface-soft text-muted' },
};

const MOTIVO_LABEL: Record<string, string> = {
  menor_via_mulher: 'Possível adolescente pelo caminho de mulheres',
  renda_nao_sei: 'Não soube informar a renda',
  renda_acima: 'Renda acima do limite',
  idade_menor_11: 'Menos de 11 anos',
  idade_18_mais: '18 anos ou mais (recusou outro programa)',
  duvida_programa: 'Tem dúvidas sobre o programa',
  texto_livre: 'Escreveu sem usar os botões',
  voluntario: 'Quer ser voluntário',
  outro_assunto: 'Outro assunto',
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function tempoRelativo(valor: string | null): string {
  const d = parseDataBackend(valor);
  if (!d) return '';
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const horas = Math.floor(mins / 60);
  if (horas < 24) return `${horas}h`;
  return `${Math.floor(horas / 24)}d`;
}

function formatarHora(valor: string | null): string {
  const d = parseDataBackend(valor);
  return d ? d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
}

function iniciais(nome: string): string {
  const limpo = nome.replace(/^@/, '').trim();
  return (limpo.slice(0, 2) || '??').toUpperCase();
}

function nomeExibicao(c: ConversaCanal): string {
  return c.contatoNome?.trim() || c.contatoId;
}

/** Horas restantes da janela de 24h do Instagram, a partir da última msg do contato. */
function janelaRestante(mensagens: MensagemCanal[]): number | null {
  const ultima = [...mensagens].reverse().find((m) => m.autor === 'contato');
  const d = parseDataBackend(ultima?.dataEnvio ?? null);
  if (!d) return null;
  return JANELA_INSTAGRAM_MS - (Date.now() - d.getTime());
}

function CanalIcon({ canal, className }: { canal: string; className?: string }) {
  const Icon = canal === 'whatsapp' ? MessageSquare : MessageCircle;
  return <Icon className={className} strokeWidth={2} />;
}

// ─────────────────────────────────────────────
// SELETOR (Solicitações | Canais) — usado no topo da CentralPage
// ─────────────────────────────────────────────

export type ModoCentral = 'solicitacoes' | 'canais';

export function SeletorModoCentral({
  modo, onChange,
}: { modo: ModoCentral; onChange: (m: ModoCentral) => void }) {
  const base = 'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors';
  return (
    <div className="inline-flex w-full rounded-xl border border-line bg-surface p-1 sm:w-auto">
      <button
        onClick={() => onChange('solicitacoes')}
        className={`${base} flex-1 justify-center sm:flex-none ${modo === 'solicitacoes' ? 'bg-ink text-surface' : 'text-muted hover:text-ink'}`}
      >
        <Inbox className="h-3.5 w-3.5" strokeWidth={2} />
        Solicitações Site
      </button>
      <button
        onClick={() => onChange('canais')}
        className={`${base} flex-1 justify-center sm:flex-none ${modo === 'canais' ? 'bg-ink text-surface' : 'text-muted hover:text-ink'}`}
      >
        <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
        Instagram
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAINEL
// ─────────────────────────────────────────────

export default function CanaisPanel() {
  const [filtro, setFiltro] = useState<FiltroCanais>('principal');
  const [conversas, setConversas] = useState<ConversaCanal[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [erroLista, setErroLista] = useState<string | null>(null);

  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<MensagemCanal[]>([]);
  const [carregandoThread, setCarregandoThread] = useState(false);

  const [resposta, setResposta] = useState('');
  const [enviando, setEnviando] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);

  const selecionada = useMemo(
    () => conversas.find((c) => c.idConversa === selecionadaId) ?? null,
    [conversas, selecionadaId],
  );

  // ─── Carregamento ──────────────────────────

  const carregarLista = useCallback(async (silencioso = true) => {
    if (!silencioso) setCarregandoLista(true);
    try {
      const lista = await listarConversasCanais(filtro);
      setConversas(lista);
      setErroLista(null);
    } catch (err) {
      setErroLista(err instanceof Error ? err.message : 'Erro ao carregar conversas');
      if (!silencioso) toast.error('Não foi possível carregar as conversas');
    } finally {
      if (!silencioso) setCarregandoLista(false);
    }
  }, [filtro]);

  const carregarThread = useCallback(async (id: number, silencioso = true) => {
    if (!silencioso) setCarregandoThread(true);
    try {
      setMensagens(await abrirConversaCanal(id));
    } catch {
      if (!silencioso) toast.error('Não foi possível abrir a conversa');
    } finally {
      if (!silencioso) setCarregandoThread(false);
    }
  }, []);

  // Lista: ao trocar o filtro + atualização periódica (pausa com a aba escondida)
  useEffect(() => {
    carregarLista(false);
    const timer = window.setInterval(() => {
      if (!document.hidden) carregarLista(true);
    }, INTERVALO_ATUALIZACAO_MS);
    return () => window.clearInterval(timer);
  }, [carregarLista]);

  // Thread: ao selecionar + atualização periódica
  useEffect(() => {
    if (selecionadaId == null) { setMensagens([]); return; }
    carregarThread(selecionadaId, false);
    const timer = window.setInterval(() => {
      if (!document.hidden) carregarThread(selecionadaId, true);
    }, INTERVALO_ATUALIZACAO_MS);
    return () => window.clearInterval(timer);
  }, [selecionadaId, carregarThread]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [mensagens]);

  // ─── Ações ─────────────────────────────────

  function selecionar(c: ConversaCanal) {
    setSelecionadaId(c.idConversa);
    setResposta('');
    // abrir marca como lida no backend; zera o contador local na hora
    setConversas((lista) => lista.map((x) => (x.idConversa === c.idConversa ? { ...x, naoLidas: 0 } : x)));
  }

  async function handleResponder() {
    if (!selecionada || !resposta.trim()) return;
    setEnviando(true);
    try {
      const r = await responderConversaCanal(selecionada.idConversa, resposta.trim());
      if (r.entregue) {
        toast.success('Mensagem enviada', { description: `Via ${selecionada.canal === 'instagram' ? 'Instagram' : 'WhatsApp'}` });
      } else {
        toast.warning('Mensagem gravada, mas não entregue', {
          description: selecionada.canal === 'instagram'
            ? 'O Instagram só aceita respostas até 24h após a última mensagem da pessoa.'
            : 'O canal recusou o envio. Tente novamente mais tarde.',
        });
      }
      setResposta('');
      await carregarThread(selecionada.idConversa, true);
      carregarLista(true);
    } catch {
      toast.error('Não foi possível enviar a resposta');
    } finally {
      setEnviando(false);
    }
  }

  // ─── Render ────────────────────────────────

  const restante = selecionada?.canal === 'instagram' ? janelaRestante(mensagens) : null;
  const janelaFechada = restante !== null && restante <= 0;

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* FILTROS */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFiltro(f.id); setSelecionadaId(null); }}
              className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                filtro === f.id ? 'border-ink bg-ink text-surface' : 'border-line bg-surface text-muted hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => carregarLista(false)}
          disabled={carregandoLista}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50 xl:ml-auto xl:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${carregandoLista ? 'animate-spin' : ''}`} strokeWidth={2} />
          {carregandoLista ? 'Carregando...' : 'Recarregar'}
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-surface xl:grid-cols-12">

        {/* LISTA */}
        <div className="max-h-[420px] overflow-y-auto border-b border-line xl:col-span-5 xl:max-h-[760px] xl:border-b-0 xl:border-r">
          {erroLista && conversas.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted">
              <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-warning" strokeWidth={2} />
              Não foi possível carregar as conversas.
              <p className="mt-1 text-xs text-subtle">{erroLista}</p>
            </div>
          ) : conversas.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted">
              {carregandoLista ? 'Carregando...' : 'Nenhuma conversa neste filtro.'}
            </div>
          ) : (
            conversas.map((c) => {
              const ativa = c.idConversa === selecionadaId;
              const resultado = c.triagemResultado ? RESULTADO_CFG[c.triagemResultado] : null;
              const alerta = c.triagemMotivo === 'menor_via_mulher';
              return (
                <button
                  key={c.idConversa}
                  onClick={() => selecionar(c)}
                  className={`flex w-full gap-3 border-b border-line p-4 text-left transition-colors ${
                    ativa ? 'bg-info-soft' : 'hover:bg-surface-soft'
                  }`}
                >
                  <Avatar initials={iniciais(nomeExibicao(c))} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium text-ink md:text-base">{nomeExibicao(c)}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-subtle">{tempoRelativo(c.ultimoEm)}</span>
                        {c.naoLidas > 0 && (
                          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-2xs font-semibold text-surface">
                            {c.naoLidas}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted md:text-sm">
                      {c.ultimaMensagem ?? '—'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-subtle">
                      <span className="inline-flex items-center gap-1">
                        <CanalIcon canal={c.canal} className="h-3.5 w-3.5" />
                        {c.canal === 'instagram' ? 'Instagram' : 'WhatsApp'}
                      </span>
                      {c.programa && (
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-2xs font-medium text-brand">
                          {PROGRAMA_LABEL[c.programa] ?? c.programa}
                        </span>
                      )}
                      {resultado && (
                        <span className={`rounded-full px-2 py-0.5 text-2xs font-medium ${resultado.cls}`}>
                          {resultado.label}
                        </span>
                      )}
                      {alerta && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-2xs font-medium text-danger">
                          <ShieldAlert className="h-3 w-3" strokeWidth={2} />
                          Atenção
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* DETALHE */}
        {!selecionada ? (
          <div className="flex items-center justify-center p-10 xl:col-span-7">
            <p className="text-sm text-muted">Selecione uma conversa para ver as mensagens.</p>
          </div>
        ) : (
          <div className="flex flex-col xl:col-span-7 xl:max-h-[760px]">

            {/* HEADER */}
            <div className="border-b border-line p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Avatar initials={iniciais(nomeExibicao(selecionada))} size="md" tone="info" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink md:text-base">{nomeExibicao(selecionada)}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <CanalIcon canal={selecionada.canal} className="h-3.5 w-3.5" />
                      {selecionada.canal === 'instagram' ? 'Instagram' : 'WhatsApp'}
                    </span>
                    {selecionada.programa && <span>· {PROGRAMA_LABEL[selecionada.programa] ?? selecionada.programa}</span>}
                    {selecionada.triagemResultado && RESULTADO_CFG[selecionada.triagemResultado] && (
                      <span className={`rounded-full px-2 py-0.5 text-2xs font-medium ${RESULTADO_CFG[selecionada.triagemResultado].cls}`}>
                        {RESULTADO_CFG[selecionada.triagemResultado].label}
                      </span>
                    )}
                  </p>
                  {selecionada.triagemMotivo && selecionada.triagemMotivo !== 'menor_via_mulher' && (
                    <p className="mt-1 text-xs text-subtle">
                      Triagem: {MOTIVO_LABEL[selecionada.triagemMotivo] ?? selecionada.triagemMotivo}
                    </p>
                  )}
                </div>
              </div>

              {selecionada.triagemMotivo === 'menor_via_mulher' && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft p-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2} />
                  <p className="text-xs leading-relaxed text-ink">
                    <span className="font-semibold text-danger">Atenção: </span>
                    possível adolescente que chegou pelo caminho do programa para mulheres. Responda com cuidado
                    e discrição, avalie o encaminhamento para o Dentista do Bem e, se houver sinal de violência,
                    oriente sobre o Disque 100 e o 190.
                  </p>
                </div>
              )}
            </div>

            {/* THREAD */}
            <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto p-4 md:p-5">
              <p className="mb-2 text-xs tracking-wider text-muted">
                CONVERSA ({mensagens.length}){carregandoThread && ' · carregando...'}
              </p>
              {mensagens.map((m) => {
                const daEquipe = m.autor === 'ong';
                const doRobo = m.autor === 'bot';
                return (
                  <div key={m.idMensagem} className={`flex gap-2 ${daEquipe ? 'flex-row-reverse' : ''}`}>
                    {doRobo ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                        <Bot className="h-4 w-4" strokeWidth={2} />
                      </div>
                    ) : (
                      <Avatar
                        initials={daEquipe ? 'TDB' : iniciais(nomeExibicao(selecionada))}
                        size="sm"
                        tone={daEquipe ? 'info' : undefined}
                      />
                    )}
                    <div className={`flex max-w-[80%] flex-col ${daEquipe ? 'items-end' : 'items-start'}`}>
                      <div className={`whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        daEquipe ? 'rounded-tr-sm bg-ink text-surface'
                        : doRobo ? 'rounded-tl-sm border border-dashed border-line bg-surface text-muted'
                        : 'rounded-tl-sm bg-surface-soft text-ink'
                      }`}>
                        {m.conteudo}
                      </div>
                      <div className="mt-1 flex items-center gap-2 px-1 text-2xs text-subtle">
                        {daEquipe && <span>{m.nomeAutor ?? 'Equipe'}</span>}
                        {doRobo && <span>Robô de triagem</span>}
                        <span>{formatarHora(m.dataEnvio)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RESPOSTA */}
            <div className="border-t border-line p-4 md:p-5">
              {restante !== null && (
                <p className={`mb-2 inline-flex items-center gap-1.5 text-xs ${janelaFechada ? 'text-danger' : 'text-muted'}`}>
                  <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                  {janelaFechada
                    ? 'Janela de 24h encerrada: o Instagram não vai entregar novas respostas até a pessoa escrever de novo.'
                    : `Janela do Instagram: ${Math.max(1, Math.floor(restante / 3_600_000))}h restantes para responder.`}
                </p>
              )}
              <textarea
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                placeholder={`Responder ${nomeExibicao(selecionada)}...`}
                className="mb-3 min-h-[80px] w-full resize-none rounded-2xl border border-line bg-surface p-4 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <button
                onClick={handleResponder}
                disabled={enviando || !resposta.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Send className="h-4 w-4" strokeWidth={2} />
                {enviando ? 'Enviando...' : 'Responder'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
