import {
  EQUIPE_MOCK, INTEGRACOES_MOCK, ORGANIZACAO_MOCK,
  type MembroEquipe, type Integracao, type OrganizacaoInfo,
  type PapelUsuario, type StatusIntegracao,
} from '../data/configuracoes';

// ─── Chaves localStorage ──────────────────────────
const LS_EQUIPE       = 'tdb_equipe';
const LS_INTEGRACOES  = 'tdb_integracoes';
const LS_ORG          = 'tdb_organizacao';
const LS_NOTIF        = 'tdb_notif';

// ─── Tipos exportados ─────────────────────────────
export interface PreferenciasNotificacao {
  alertasAlta: boolean;
  resumoDiario: boolean;
  lembreteRenovacao: boolean;
}

const NOTIF_DEFAULT: PreferenciasNotificacao = {
  alertasAlta: true,
  resumoDiario: true,
  lembreteRenovacao: false,
};

// ─── Helpers de localStorage ──────────────────────
function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* */ }
}

// ─── Estado em memória (hidratado do LS) ──────────
let equipe: MembroEquipe[]      = lsGet(LS_EQUIPE,       [...EQUIPE_MOCK]);
let integracoes: Integracao[]   = lsGet(LS_INTEGRACOES,  [...INTEGRACOES_MOCK]);
let organizacao: OrganizacaoInfo = lsGet(LS_ORG,         ORGANIZACAO_MOCK);

// ─── EQUIPE ───────────────────────────────────────
export function listarEquipe(): MembroEquipe[] {
  return equipe;
}

export async function adicionarMembro(dados: {
  nome: string;
  email: string;
  papel: PapelUsuario;
  regiao: string;
}): Promise<MembroEquipe> {
  await new Promise((r) => setTimeout(r, 300));
  const partes = dados.nome.trim().split(/\s+/);
  const iniciais = partes.length === 1
    ? partes[0].slice(0, 2).toUpperCase()
    : (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  const novo: MembroEquipe = {
    id: `mem-${Date.now()}`,
    nome: dados.nome.trim(),
    email: dados.email.trim(),
    papel: dados.papel,
    regiao: dados.regiao,
    iniciais,
    ativo: true,
  };
  equipe = [...equipe, novo];
  lsSet(LS_EQUIPE, equipe);
  return novo;
}

export async function atualizarMembro(
  id: string,
  dados: Partial<MembroEquipe>,
): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  equipe = equipe.map((m) => (m.id === id ? { ...m, ...dados } : m));
  lsSet(LS_EQUIPE, equipe);
}

export async function removerMembro(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  equipe = equipe.filter((m) => m.id !== id);
  lsSet(LS_EQUIPE, equipe);
}

// ─── INTEGRAÇÕES ──────────────────────────────────
export function listarIntegracoes(): Integracao[] {
  return integracoes;
}

export async function atualizarStatusIntegracao(
  id: string,
  status: StatusIntegracao,
  detalhe?: string,
): Promise<void> {
  await new Promise((r) => setTimeout(r, 400));
  integracoes = integracoes.map((i) =>
    i.id === id ? { ...i, status, detalhe: detalhe ?? i.detalhe } : i,
  );
  lsSet(LS_INTEGRACOES, integracoes);
}

// ─── ORGANIZAÇÃO ──────────────────────────────────
export function obterOrganizacao(): OrganizacaoInfo {
  return organizacao;
}

export async function salvarOrganizacao(dados: OrganizacaoInfo): Promise<void> {
  await new Promise((r) => setTimeout(r, 400));
  organizacao = { ...dados };
  lsSet(LS_ORG, organizacao);
}

// ─── PREFERÊNCIAS DE NOTIFICAÇÃO ──────────────────
export function obterPreferenciasNotificacao(): PreferenciasNotificacao {
  return lsGet(LS_NOTIF, NOTIF_DEFAULT);
}

export function salvarPreferenciasNotificacao(prefs: PreferenciasNotificacao): void {
  lsSet(LS_NOTIF, prefs);
}