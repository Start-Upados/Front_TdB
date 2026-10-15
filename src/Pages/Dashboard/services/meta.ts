import { contarRealizadosNoAno, EVENTO_ATENDIMENTOS } from './atendimentos';

const LS_META = 'tdb_meta_atendimentos';
export const META_PADRAO = 100;
export const EVENTO_META = 'tdb:meta-atualizada';
export { EVENTO_ATENDIMENTOS };

export function obterMeta(): number {
  try {
    const v = Number(localStorage.getItem(LS_META));
    return Number.isInteger(v) && v > 0 ? v : META_PADRAO;
  } catch {
    return META_PADRAO;
  }
}

export function salvarMeta(valor: number): void {
  const v = Math.max(1, Math.floor(valor));
  try { localStorage.setItem(LS_META, String(v)); } catch { /* */ }
  window.dispatchEvent(new Event(EVENTO_META));
}

export interface ProgressoMeta {
  meta: number;
  realizados: number;
  pct: number;      // 0–100 (trava em 100 para a barra)
  ano: number;
}

export function obterProgressoMeta(): ProgressoMeta {
  const meta = obterMeta();
  const realizados = contarRealizadosNoAno();
  const pct = Math.min(100, Math.round((realizados / meta) * 100));
  return { meta, realizados, pct, ano: new Date().getFullYear() };
}