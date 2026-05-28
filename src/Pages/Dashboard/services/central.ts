import {
  SOLICITACOES_MOCK, KPIS_CENTRAL_MOCK,
  type Solicitacao, type KpiData,
} from '../data/central';

/* HOJE: mock. AMANHÃ: fetch ao backend. */

export function listarSolicitacoes(): Solicitacao[] {
  // PROD: GET /api/solicitacoes
  return SOLICITACOES_MOCK;
}

export function obterKpis(): KpiData[] {
  // PROD: GET /api/central/kpis
  return KPIS_CENTRAL_MOCK;
}