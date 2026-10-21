import {
  INTEGRACOES_PADRAO, ORGANIZACAO_PADRAO,
  type MembroEquipe, type Integracao, type OrganizacaoInfo,
  type PapelUsuario, type StatusIntegracao,
} from '../data/configuracoes';

import { funcionarioService, type FuncionarioBody } from '../../../Services/api';
import { dadosDoToken, tokenAtual } from '../../../Services/sessao';

// ─── Chaves localStorage ──────────────────────────
// Equipe NÃO é mais guardada no navegador: vem sempre do backend (GET /funcionario).
// Só a região fica local, porque a tabela funcionario não tem essa coluna.
const LS_EQUIPE_ANTIGO = 'tdb_equipe';              // cache antigo (tinha os mocks) — apagado
const LS_REGIOES       = 'tdb_equipe_regioes';
const LS_INTEGRACOES_ANTIGO = 'tdb_integracoes';    // textos antigos — apagado
const LS_INTEGRACOES   = 'tdb_integracoes_v2';
const LS_ORG           = 'tdb_organizacao';
const LS_NOTIF         = 'tdb_notif';

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
function lsRemover(key: string): void {
  try { localStorage.removeItem(key); } catch { /* */ }
}

lsRemover(LS_EQUIPE_ANTIGO);
lsRemover(LS_INTEGRACOES_ANTIGO);

// ─── Mapeamentos MembroEquipe ↔ FuncionarioBody ────
function semAcento(v?: string | null): string {
  return (v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Todo funcionário entra no painel como ADMIN (POST /auth/login); por isso o padrão é Administrador. */
function papelDoCargo(cargo?: string | null): PapelUsuario {
  const c = semAcento(cargo);
  if (c.startsWith('coorden')) return 'Coordenador';
  if (c.startsWith('visualiz')) return 'Visualizador';
  return 'Administrador';
}

function iniciaisDe(nome: string): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  return partes.length === 1
    ? partes[0].slice(0, 2).toUpperCase()
    : (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function funcionarioParaMembro(f: FuncionarioBody): MembroEquipe {
  const nome = f.nome?.trim() || f.email || 'Sem nome';
  return {
    id:       f.rgCpf,
    nome,
    email:    f.email ?? '',
    papel:    papelDoCargo(f.cargo),
    regiao:   regioes[f.rgCpf] ?? 'Nacional',
    iniciais: iniciaisDe(nome),
    // status vazio/nulo = ativo (registros antigos)
    ativo:    !semAcento(f.status).startsWith('inativ'),
  };
}

// ─── Estado em memória ────────────────────────────
let equipe: MembroEquipe[] = [];
/** Registro completo vindo do backend, para o PUT não apagar telefone/data de início. */
let brutos: Record<string, FuncionarioBody> = {};
let regioes: Record<string, string> = lsGet(LS_REGIOES, {});
let integracoes: Integracao[] = mesclarIntegracoes(lsGet<Integracao[]>(LS_INTEGRACOES, []));
let organizacao: OrganizacaoInfo = migrarOrganizacao(lsGet<OrganizacaoInfo | null>(LS_ORG, null));

// ─── EQUIPE ───────────────────────────────────────
export function listarEquipe(): MembroEquipe[] {
  return equipe;
}

/** E-mail de quem está logado no painel (vem do token). */
function emailLogado(): string {
  return semAcento(dadosDoToken(tokenAtual())?.sub);
}

/** Puxa a equipe do backend. Só aparece quem existe na tabela funcionario. */
export async function carregarEquipeReal(): Promise<{ count: number; fonte: 'backend' | 'erro'; erro?: string }> {
  try {
    const lista = await funcionarioService.listar();
    const validos = (Array.isArray(lista) ? lista : []).filter((f) => f && f.rgCpf);
    brutos = Object.fromEntries(validos.map((f) => [f.rgCpf, f]));
    equipe = validos.map(funcionarioParaMembro);
    return { count: equipe.length, fonte: 'backend' };
  } catch (err) {
    console.warn('[configuracoes] backend indisponível:', err);
    return { count: equipe.length, fonte: 'erro', erro: err instanceof Error ? err.message : String(err) };
  }
}

export async function adicionarMembro(dados: {
  nome: string;
  email: string;
  rgCpf: string;
  senha: string;
  papel: PapelUsuario;
  regiao: string;
}): Promise<void> {
  // Senha e CPF são obrigatórios: funcionário sem senha no banco derruba o login de TODOS os admins
  // (FuncionarioBO.login faz senha.trim() em cada registro).
  const senha = dados.senha.trim();
  const rgCpf = dados.rgCpf.trim();
  if (senha.length < 6) throw new Error('A senha inicial precisa ter pelo menos 6 caracteres.');
  if (rgCpf.replace(/\D/g, '').length !== 11) throw new Error('Informe um CPF válido.');
  const email = dados.email.trim().toLowerCase();
  if (equipe.some((m) => semAcento(m.email) === email)) throw new Error('Já existe um membro com esse e-mail.');

  await funcionarioService.cadastrar({
    nome:       dados.nome.trim(),
    rgCpf,
    email,
    senha,
    telefone:   '',
    cep:        '',
    cargo:      dados.papel,
    dataInicio: hojeIso(),
    status:     'Ativo',
  });
  regioes = { ...regioes, [rgCpf]: dados.regiao };
  lsSet(LS_REGIOES, regioes);
  await carregarEquipeReal();
  if (!equipe.some((m) => m.id === rgCpf)) {
    throw new Error('O servidor não confirmou o cadastro (CPF já cadastrado?).');
  }
}

export async function atualizarMembro(id: string, dados: Partial<MembroEquipe>): Promise<void> {
  const atual = equipe.find((m) => m.id === id);
  if (!atual) throw new Error('Membro não encontrado.');
  const novo = { ...atual, ...dados };
  if (!novo.ativo && semAcento(atual.email) === emailLogado()) {
    throw new Error('Você não pode desativar o seu próprio acesso.');
  }
  const bruto = brutos[id];
  await funcionarioService.atualizar(id, {
    ...bruto,
    nome:       novo.nome.trim(),
    email:      novo.email.trim(),
    cargo:      novo.papel,
    status:     novo.ativo ? 'Ativo' : 'Inativo',
    telefone:   bruto?.telefone ?? '',
    dataInicio: bruto?.dataInicio || hojeIso(),
    senha:      '',   // vazio = mantém a senha atual (NVL no UPDATE do backend)
  });
  if (dados.regiao) {
    regioes = { ...regioes, [id]: dados.regiao };
    lsSet(LS_REGIOES, regioes);
  }
  await carregarEquipeReal();
}

export async function removerMembro(id: string): Promise<void> {
  const alvo = equipe.find((m) => m.id === id);
  if (!alvo) throw new Error('Membro não encontrado.');
  if (semAcento(alvo.email) === emailLogado()) {
    throw new Error('Você não pode remover o seu próprio acesso.');
  }
  const admins = equipe.filter((m) => m.papel === 'Administrador' && m.ativo);
  if (alvo.papel === 'Administrador' && admins.length <= 1) {
    throw new Error('Esse é o único administrador ativo. Cadastre outro antes de remover.');
  }
  await funcionarioService.deletar(id);
  const { [id]: _removida, ...resto } = regioes;
  void _removida;
  regioes = resto;
  lsSet(LS_REGIOES, regioes);
  await carregarEquipeReal();
}

function hojeIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Textos e status vêm sempre do padrão; do navegador só fica o detalhe que o admin editou. */
function mesclarIntegracoes(salvas: Integracao[]): Integracao[] {
  const porId = new Map((Array.isArray(salvas) ? salvas : []).map((i) => [i.id, i]));
  return INTEGRACOES_PADRAO.map((p) => {
    const s = porId.get(p.id);
    return s ? { ...p, status: s.status ?? p.status, detalhe: s.detalhe || p.detalhe } : { ...p };
  });
}

/** Troca só os placeholders antigos (telefone/endereço); mantém o que o admin já salvou. */
function migrarOrganizacao(salva: OrganizacaoInfo | null): OrganizacaoInfo {
  if (!salva) return { ...ORGANIZACAO_PADRAO };
  const org = { ...ORGANIZACAO_PADRAO, ...salva };
  if (!org.telefone || org.telefone === '(11) 0000-0000') org.telefone = ORGANIZACAO_PADRAO.telefone;
  if (!org.endereco || org.endereco === 'São Paulo, SP') org.endereco = ORGANIZACAO_PADRAO.endereco;
  return org;
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