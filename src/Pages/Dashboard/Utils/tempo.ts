/**
 * Tempo real no painel: datas do backend (horário de São Paulo, sem fuso) e
 * contadores que se atualizam sozinhos.
 */
import { useEffect, useState } from 'react';

/**
 * Lê "2026-10-20", "2026-10-20 14:05:33(.0)" ou "2026-10-20T14:05" como horário LOCAL.
 * ISO com fuso ("…Z" / "-03:00") é lido como tal. null = vazio ou inválido.
 */
export function lerDataHora(raw?: string | null): Date | null {
  if (!raw) return null;
  const v = raw.trim();
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(v)) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  const [, a, mes, dia, h = '0', min = '0', seg = '0'] = m;
  const d = new Date(Number(a), Number(mes) - 1, Number(dia), Number(h), Number(min), Number(seg));
  return isNaN(d.getTime()) ? null : d;
}

/** true quando o valor traz hora de verdade (não só a data / meia-noite). */
export function temHora(raw?: string | null): boolean {
  if (!raw) return false;
  const m = raw.match(/[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  return !!m && !(m[1] === '00' && m[2] === '00' && (m[3] ?? '00') === '00');
}

/** 45s → "agora" · 12min · 3h05 · 2d */
export function duracaoCurta(ms: number): string {
  const min = Math.floor(Math.max(0, ms) / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h${String(min % 60).padStart(2, '0')}`;
  return `${Math.floor(h / 24)}d`;
}

/** Dias de calendário entre a data e hoje (0 = hoje). null se não houver data. */
export function diasDesde(raw?: string | null, agora = new Date()): number | null {
  const d = lerDataHora(raw);
  if (!d) return null;
  const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const dia = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.max(0, Math.round((hoje - dia) / 86_400_000));
}

/** Data/hora de agora que se atualiza a cada `intervaloMs` — para contadores na tela. */
export function useAgora(intervaloMs = 30_000): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return agora;
}
