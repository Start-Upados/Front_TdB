import {
  EQUIPE_MOCK, INTEGRACOES_MOCK, ORGANIZACAO_MOCK,
  type MembroEquipe, type Integracao, type OrganizacaoInfo,
  type PapelUsuario, type StatusIntegracao,
} from '../data/configuracoes';

import { funcionarioService, type FuncionarioBody } from '../../../Services/api';

// ─── Mapeamentos MembroEquipe ↔ FuncionarioBody ────
// Backend Funcionario usa rgCpf como PK; o front usa id local.
// Convencionamos: o id local também serve como rgCpf no backend.
// Campos sem correspondência (regiao, papel exato) ficam só no cache local.

function membroParaFuncionario(m: MembroEquipe): FuncionarioBody {
  return {
    nome:       m.nome,
    rgCpf:      m.id,
    email:      m.email,
    senha:      '',                                      // backend ignora se já existe
    telefone:   '',
    cep:        '',
    cargo:      m.papel,                                 // papel vira cargo no backend
    dataInicio: new Date().toISOString().slice(0, 10),
    status:     m.ativo ? 'Ativo' : 'Inativo',
  };
}

function funcionarioParaMembro(f: FuncionarioBody): MembroEquipe {
  const partes = f.nome.trim().split(/\s+/);
  const iniciais = partes.length === 1
    ? partes[0].slice(0, 2).toUpperCase()
    : (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  const papelInferido: PapelUsuario =
    f.cargo === 'Administrador' ? 'Administrador' :
    f.cargo === 'Coordenador'   ? 'Coordenador'   : 'Visualizador';
  return {
    id:       f.rgCpf,
    nome:     f.nome,
    email:    f.email,
    papel:    papelInferido,
    regiao:   'Nacional',                                // backend não armazena, default
    iniciais,
    ativo:    f.status?.toLowerCase() === 'ativo',
  };
}

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
// ─── EQUIPE ───────────────────────────────────────
export function listarEquipe(): MembroEquipe[] {
  return equipe;
}

/**
 * Puxa equipe do backend Java e MESCLA com o cache local.
 * Mesma estratégia do central.ts: preserva membros locais que ainda não foram
 * pro backend (mocks ou cadastros offline) e adiciona/atualiza com os do Oracle.
 *
 * A UI deve chamar isso no mount da ConfiguracoesPage pra garantir consistência
 * entre navegadores diferentes (você ↔ Matheus).
 */
export async function carregarEquipeReal(): Promise<{
  count: number;
  fonte: 'backend' | 'mock';
}> {
  try {
    const lista = await funcionarioService.listar();
    if (Array.isArray(lista) && lista.length > 0) {
      const doBackend = lista.map(funcionarioParaMembro);
      const idsBackend = new Set(doBackend.map((m) => m.id));
      // Mantém locais que ainda não existem no backend (mocks ou cadastros offline)
      const apenasLocais = equipe.filter((m) => !idsBackend.has(m.id));
      equipe = [...doBackend, ...apenasLocais];
      lsSet(LS_EQUIPE, equipe);
      return { count: equipe.length, fonte: 'backend' };
    }
    return { count: equipe.length, fonte: 'mock' };
  } catch (err) {
    console.warn('[configuracoes] backend indisponível, mantendo dados locais:', err);
    return { count: equipe.length, fonte: 'mock' };
  }
}

export async function adicionarMembro(dados: {
  nome: string;
  email: string;
  papel: PapelUsuario;
  regiao: string;
}): Promise<MembroEquipe> {
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

  // Backend-first
  try {
    await funcionarioService.cadastrar(membroParaFuncionario(novo));
  } catch (err) {
    console.warn('[configuracoes] erro ao cadastrar no backend, salvando só local:', err);
  }

  equipe = [...equipe, novo];
  lsSet(LS_EQUIPE, equipe);
  return novo;
}

export async function atualizarMembro(
  id: string,
  dados: Partial<MembroEquipe>,
): Promise<void> {
  const atual = equipe.find((m) => m.id === id);

  // Backend-first (se o membro existe no backend; mocks locais só atualizam cache)
  if (atual) {
    try {
      const atualizado = { ...atual, ...dados };
      await funcionarioService.atualizar(id, membroParaFuncionario(atualizado));
    } catch (err) {
      console.warn('[configuracoes] erro ao atualizar no backend:', err);
    }
  }

  equipe = equipe.map((m) => (m.id === id ? { ...m, ...dados } : m));
  lsSet(LS_EQUIPE, equipe);
}

export async function removerMembro(id: string): Promise<void> {
  // Backend-first
  try {
    await funcionarioService.deletar(id);
  } catch (err) {
    console.warn('[configuracoes] erro ao remover no backend:', err);
  }

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