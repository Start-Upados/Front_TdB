import { solicitacaoService, type SolicitacaoBody } from '../../../Services/api';

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

/** Resposta do PACIENTE — devolve a conversa pra status 'aberta' (admin precisa atender). */
export async function responderComoPaciente(id: string, texto: string): Promise<void> {
  // PROD: POST /api/solicitacoes/{id}/mensagens { texto, autor: 'paciente' }
  await new Promise((r) => setTimeout(r, 400));
  const ts = new Date().toISOString();
  patch(id, (s) => ({
    ...s,
    mensagens: [...s.mensagens, {
      id: `msg-${id}-${Date.now()}`,
      autor: 'paciente',
      texto,
      timestamp: ts,
    }],
    status: 'aberta',
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

/**
 * Puxa todas as solicitações do backend Java e SUBSTITUI o array em memória.
 * Se o backend falhar ou retornar vazio, mantém o que já está (mock como fallback).
 *
 * Importante: como o backend ainda não tem endpoint de mensagens, os threads de chat
 * (respostas do admin/paciente) continuam vivendo só em memória do navegador.
 */
export async function carregarSolicitacoesReais(): Promise<{
  count: number;
  fonte: 'backend' | 'mock';
}> {
  try {
    const lista = await solicitacaoService.listar();
    if (Array.isArray(lista) && lista.length > 0) {
      solicitacoes = lista.map(mapearSolicitacaoBackend);
      return { count: solicitacoes.length, fonte: 'backend' };
    }
    return { count: solicitacoes.length, fonte: 'mock' };
  } catch (err) {
    console.warn('[central] backend indisponível, mantendo dados atuais:', err);
    return { count: solicitacoes.length, fonte: 'mock' };
  }
}

// ─── Backend Java (real) ─────────────────────────
// Conecta com solicitacaoService.listar() do backend Java + Oracle.
// Substitui o array `solicitacoes` em memória pelos dados reais.



function gerarIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter((p) => !['Dr.', 'Dra.'].includes(p));
  if (partes.length === 0) return 'XX';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function calcularIdade(dataNasc: string): number | undefined {
  if (!dataNasc) return undefined;
  const nasc = new Date(dataNasc);
  if (isNaN(nasc.getTime())) return undefined;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade >= 0 ? idade : undefined;
}

function mapearSolicitacaoBackend(body: SolicitacaoBody): Solicitacao {
  const ts = new Date().toISOString();

  // Infere o tipo pelo prefixo do protocolo
  const tipo = body.protocolo?.startsWith('APO-')
    ? 'Apolônia do Bem'
    : 'Beneficiário';

  // Primeira mensagem do thread = necessidade + descrição (se houver)
  const textoInicial = body.descricao && body.descricao.trim()
    ? `${body.necessidade}\n\n${body.descricao}`
    : body.necessidade;

  const preview = body.necessidade.length > 80
    ? body.necessidade.slice(0, 80) + '…'
    : body.necessidade;

  return {
    id: body.rgCpf,                         // backend usa rgCpf como PK
    nome: body.nome,
    iniciais: gerarIniciais(body.nome),
    idade: calcularIdade(body.dataNasc),
    cidade: undefined,                       // backend ainda não tem campo cidade
    canal: 'Site',                           // formulários públicos vêm do site
    tipo,
    preview,
    mensagens: [
      {
        id: `msg-${body.rgCpf}-init`,
        autor: 'paciente',
        texto: textoInicial,
        timestamp: ts,
      },
    ],
    data: 'agora',
    ultimaAtualizacao: ts,
    prioridade: 'Media',                     // default até admin clicar "Reclassificar"
    score: 0.5,
    status: 'aberta',
  };
}