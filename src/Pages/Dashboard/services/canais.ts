/**
 * Central de Mensagens — canais externos (Instagram / WhatsApp).
 *
 * Fala direto com o backend Java (CanalMensagemResource):
 *   GET  /mensagens/conversas?filtro=...    → lista do inbox
 *   GET  /mensagens/conversas/{id}          → thread (e marca como lida)
 *   POST /mensagens/conversas/{id}/responder → grava e envia pelo canal
 *
 * Diferente das solicitações (central.ts), aqui NÃO há localStorage nem mock:
 * o Oracle é a fonte única da verdade.
 */

import { tokenAtual, sessaoExpirada } from '../../../Services/sessao';

// Mesma base do backend usada no resto do app. Se o projeto já exporta a URL
// em Services/api.ts, troque esta constante pelo import de lá.
const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://backend-mjgv.onrender.com';

export type FiltroCanais = 'principal' | 'em_triagem' | 'voluntarios' | 'outros' | 'nao_elegiveis' | 'todas';
export type CanalExterno = 'instagram' | 'whatsapp';
export type ProgramaTriagem = 'dentista' | 'apolonias' | 'voluntario' | 'outro';
export type ResultadoTriagem = 'pendente' | 'elegivel' | 'nao_elegivel' | 'humano';

export interface ConversaCanal {
  idConversa: number;
  canal: CanalExterno;
  contatoId: string;
  contatoNome: string | null;
  ultimaMensagem: string | null;
  ultimoEm: string | null;
  naoLidas: number;
  programa: ProgramaTriagem | null;
  triagemResultado: ResultadoTriagem | null;
  triagemMotivo: string | null;
}

export type AutorCanal = 'contato' | 'bot' | 'ong';

export interface MensagemCanal {
  idMensagem: number;
  idConversa: number;
  autor: AutorCanal;
  nomeAutor: string | null;
  conteudo: string;
  dataEnvio: string | null;
}

export interface ResultadoResposta {
  gravada: boolean;
  entregue: boolean;
}

/** Cabeçalhos comuns, com o token de login do painel. */
function headers(extra?: Record<string, string>): HeadersInit {
  const token = tokenAtual();
  return { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

async function lerJson<T>(res: Response): Promise<T> {
  if (res.status === 401) sessaoExpirada();
  if (!res.ok) {
    const corpo = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${corpo ? ` — ${corpo}` : ''}`);
  }
  return (await res.json()) as T;
}

export async function listarConversasCanais(filtro: FiltroCanais = 'principal'): Promise<ConversaCanal[]> {
  const res = await fetch(`${API_BASE}/mensagens/conversas?filtro=${encodeURIComponent(filtro)}`, {
    headers: headers(),
  });
  return lerJson<ConversaCanal[]>(res);
}

export async function abrirConversaCanal(idConversa: number): Promise<MensagemCanal[]> {
  const res = await fetch(`${API_BASE}/mensagens/conversas/${idConversa}`, { headers: headers() });
  return lerJson<MensagemCanal[]>(res);
}

export async function responderConversaCanal(
  idConversa: number,
  texto: string,
  autorNome = 'Equipe TdB',
): Promise<ResultadoResposta> {
  const res = await fetch(`${API_BASE}/mensagens/conversas/${idConversa}/responder`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ texto, autorNome }),
  });
  return lerJson<ResultadoResposta>(res);
}

/**
 * O Oracle devolve o horário como "2026-10-13 00:44:12.123" (Timestamp.toString).
 * Converte para Date sem depender de parse ambíguo do navegador.
 */
export function parseDataBackend(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const iso = valor.includes('T') ? valor : valor.replace(' ', 'T');
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}