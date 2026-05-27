import { MUTIROES_MOCK, type Mutirao } from '../data/mutiroes';
import { dataDeHoje } from './atendimentos';

/*
  HOJE: filtra mock estático.
  AMANHÃ: troca corpo por fetch ao endpoint correspondente.
*/

export function listarProximos(): Mutirao[] {
  // PROD: GET /api/mutiroes?status=futuros
  const hoje = dataDeHoje();
  return MUTIROES_MOCK
    .filter((m) => m.status !== 'realizado' && m.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data));
}

export function listarRecentes(limite = 5): Mutirao[] {
  // PROD: GET /api/mutiroes?status=realizado&limite=N
  return MUTIROES_MOCK
    .filter((m) => m.status === 'realizado')
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, limite);
}

export function diasAte(dataAlvo: string): number {
  const hoje = new Date(dataDeHoje() + 'T12:00:00');
  const alvo = new Date(dataAlvo + 'T12:00:00');
  return Math.round((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}