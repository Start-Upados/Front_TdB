/**
 * Sessão de login (token JWT emitido pelo backend em POST /auth/login).
 *
 * - Painel admin: token em localStorage ('tdb_token'), vale 8h.
 * - Portais (dentista/paciente): token em sessionStorage ('tdb_token_portal'),
 *   junto com o 'tdb_rgCpf' que os portais já usam.
 *
 * Transição: enquanto o backend antigo estiver no ar ele não emite token, e o
 * painel continua aceitando o 'tdb_auth' antigo. Depois do deploy do backend novo,
 * defina VITE_AUTH_OBRIGATORIA=true na Vercel para desligar esse modo legado.
 */

const K_ADMIN  = 'tdb_token';
const K_PORTAL = 'tdb_token_portal';
const K_LEGADO = 'tdb_auth';

export const AUTH_OBRIGATORIA = import.meta.env.VITE_AUTH_OBRIGATORIA === 'true';

export type Papel = 'ADMIN' | 'DENTISTA' | 'PACIENTE';

interface DadosToken { sub?: string; papel?: Papel; exp?: number }

function ler(storage: Storage, chave: string): string | null {
  try { return storage.getItem(chave); } catch { return null; }
}
function gravar(storage: Storage, chave: string, valor: string | null): void {
  try {
    if (valor === null) storage.removeItem(chave);
    else storage.setItem(chave, valor);
  } catch { /* navegador bloqueou o storage — segue sem sessão */ }
}

/** Lê o conteúdo do token (sem validar assinatura — isso é papel do backend). */
export function dadosDoToken(token: string | null | undefined): DadosToken | null {
  if (!token) return null;
  try {
    const parte = token.split('.')[1];
    if (!parte) return null;
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parte.length / 4) * 4, '=');
    return JSON.parse(atob(base64)) as DadosToken;
  } catch {
    return null;
  }
}

/** Token existe e ainda não expirou (com 30s de folga). */
export function tokenValido(token: string | null | undefined): boolean {
  const d = dadosDoToken(token);
  return !!d?.exp && d.exp * 1000 > Date.now() + 30_000;
}

// ─── Admin ────────────────────────────────────────
export function salvarSessaoAdmin(token: string | null): void {
  if (token) {
    gravar(localStorage, K_ADMIN, token);
    gravar(localStorage, K_LEGADO, null);
  } else {
    // backend antigo: sem token, mantém o comportamento de antes
    gravar(localStorage, K_LEGADO, 'true');
  }
}

export function adminAutenticado(): boolean {
  if (tokenValido(ler(localStorage, K_ADMIN))) return true;
  if (AUTH_OBRIGATORIA) return false;
  return ler(localStorage, K_LEGADO) === 'true';
}

// ─── Portais ──────────────────────────────────────
export function salvarSessaoPortal(token: string | null): void {
  gravar(sessionStorage, K_PORTAL, token);
}

export function portalAutenticado(): boolean {
  if (!ler(sessionStorage, 'tdb_rgCpf')) return false;
  if (tokenValido(ler(sessionStorage, K_PORTAL))) return true;
  return !AUTH_OBRIGATORIA;
}

// ─── Usado pelo api.ts em toda chamada ────────────
/** Token a enviar no header Authorization, conforme a área do site em que a pessoa está. */
export function tokenAtual(): string | null {
  const noPainel = typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');
  const admin  = ler(localStorage, K_ADMIN);
  const portal = ler(sessionStorage, 'tdb_rgCpf') ? ler(sessionStorage, K_PORTAL) : null;
  const preferido = noPainel ? admin : (portal ?? admin);
  return tokenValido(preferido) ? preferido : null;
}

export function encerrarSessao(): void {
  gravar(localStorage, K_ADMIN, null);
  gravar(localStorage, K_LEGADO, null);
  gravar(sessionStorage, K_PORTAL, null);
  gravar(sessionStorage, 'tdb_rgCpf', null);
}

/** Backend respondeu 401: sessão acabou. Limpa e manda para o login (uma vez só). */
export function sessaoExpirada(): void {
  encerrarSessao();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login?expirou=1');
  }
}
