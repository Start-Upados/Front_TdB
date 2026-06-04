import {
  SOLICITACOES_MOCK, KPIS_CENTRAL_MOCK,
  type Solicitacao, type KpiData, type Prioridade,
  type Mensagem, type MotivoFechamento,
} from '../data/central';

let solicitacoes: Solicitacao[] = [...SOLICITACOES_MOCK];

// ─── Leitura ──────────────────────────────────────

export function listarSolicitacoes(): Solicitacao[] {
  return solicitacoes;
}

export function listarAtivas(): Solicitacao[] {
  return solicitacoes.filter((s) => s.status !== 'fechada');
}

export function listarArquivo(): Solicitacao[] {
  return solicitacoes.filter((s) => s.status === 'fechada');
}

export function obterKpis(): KpiData[] {
  return KPIS_CENTRAL_MOCK;
}

export function obterSolicitacao(id: string): Solicitacao | undefined {
  return solicitacoes.find((s) => s.id === id);
}

// ─── Helper interno ───────────────────────────────

function atualizarTempoRelativo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const horas = Math.floor(mins / 60);
  if (horas < 24) return `${horas}h${mins % 60 > 0 ? (mins % 60) + 'min' : ''}`.slice(0, 8);
  return `${Math.floor(horas / 24)}d`;
}

function patch(id: string, mod: (s: Solicitacao) => Solicitacao): void {
  solicitacoes = solicitacoes.map((s) => (s.id === id ? mod(s) : s));
}

// ─── Mutações ────────────────────────────────────

export async function atualizarClassificacao(
  id: string,
  novaClassificacao: {
    prioridade: Prioridade;
    score: number;
    featuresUsadas?: Solicitacao['featuresUsadas'];
  },
): Promise<void> {
  patch(id, (s) => ({ ...s, ...novaClassificacao }));
}

export async function responderSolicitacao(id: string, texto: string): Promise<void> {
  // PROD: POST /api/solicitacoes/{id}/mensagens { texto }
  await new Promise((r) => setTimeout(r, 400));
  const ts = new Date().toISOString();
  const novaMsg: Mensagem = {
    id: `msg-${id}-${Date.now()}`,
    autor: 'admin',
    autorNome: 'Admin TdB',
    autorIniciais: 'TDB',
    texto,
    timestamp: ts,
  };
  patch(id, (s) => ({
    ...s,
    mensagens: [...s.mensagens, novaMsg],
    status: 'aguardando-paciente',
    ultimaAtualizacao: ts,
    data: atualizarTempoRelativo(ts),
  }));
}

export async function resolverSolicitacao(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  fechar(id, 'resolvida');
}

export async function arquivarSolicitacao(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  fechar(id, 'arquivada');
}

export async function encaminharSolicitacao(
  id: string,
  destinatario: string,
  _nota?: string,
): Promise<void> {
  await new Promise((r) => setTimeout(r, 400));
  fechar(id, 'encaminhada', destinatario);
}

export async function promoverParaTriagem(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 400));
  fechar(id, 'promovida');
}

export async function reabrirSolicitacao(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  patch(id, (s) => ({
    ...s,
    status: 'aberta',
    motivoFechamento: undefined,
    destinatarioEncaminhamento: undefined,
  }));
}

function fechar(id: string, motivo: MotivoFechamento, destinatario?: string): void {
  const ts = new Date().toISOString();
  patch(id, (s) => ({
    ...s,
    status: 'fechada',
    motivoFechamento: motivo,
    destinatarioEncaminhamento: destinatario,
    ultimaAtualizacao: ts,
    data: atualizarTempoRelativo(ts),
  }));
}