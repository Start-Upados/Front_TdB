import {
  KPIS_TRIAGENS_MOCK,
  PACIENTES_FILA_MOCK,
  DENTISTAS_MOCK,
  type KpiData,
  type Paciente,
  type Dentista,
} from '../data/triagens';

import { calcularMatch, type MatchResult } from '../Utils/Geo';

/* HOJE: mock + matching local (haversine).
   AMANHÃ: cada função vira fetch ao backend.
   - sugerirDentistas() vira POST /api/triagens/{pacienteId}/matching
   - listarFila/listarDentistas viram GETs simples
   A página NÃO precisa ser refatorada quando isso acontecer. */

export interface SugestaoDentista {
  dentista: Dentista;
  match: MatchResult;
}

export function obterKpis(): KpiData[] {
  // PROD: GET /api/triagens/kpis
  return KPIS_TRIAGENS_MOCK;
}

export function listarFila(): Paciente[] {
  // PROD: GET /api/triagens/fila
  return PACIENTES_FILA_MOCK;
}

export function listarDentistas(): Dentista[] {
  // PROD: GET /api/dentistas
  return DENTISTAS_MOCK;
}

/** Retorna os N dentistas mais compatíveis com o paciente, ordenados por score. */
export function sugerirDentistas(paciente: Paciente, limite = 3): SugestaoDentista[] {
  // PROD: POST /api/triagens/matching { pacienteId: paciente.id, limite }
  return DENTISTAS_MOCK
    .map((d) => ({
      dentista: d,
      match: calcularMatch({
        paciente: {
          coords: paciente.coords,
          especialidadeNecessaria: paciente.especialidadeNecessaria,
        },
        dentista: {
          coords: d.coords,
          especialidade: d.especialidade,
          slotsDisponiveis: d.slotsDisponiveis,
        },
      }),
    }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limite);
}