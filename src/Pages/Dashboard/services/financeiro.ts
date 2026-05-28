import {
  KPIS_FINANCEIRO_MOCK,
  CHART_RECEITA_VS_CUSTOS_MOCK,
  DOACOES_MOCK,
  PARCEIROS_MOCK,
  type KpisFinanceiro,
  type PontoChartFinanceiro,
  type Doacao,
  type Parceiro,
} from '../data/financeiro';

/* HOJE: mock. AMANHÃ: fetch ao backend. Assinaturas estáveis. */

export function obterKpisFinanceiro(): KpisFinanceiro {
  // PROD: GET /api/financeiro/kpis
  return KPIS_FINANCEIRO_MOCK;
}

export function obterChartReceitaCustos(): PontoChartFinanceiro[] {
  // PROD: GET /api/financeiro/serie-temporal?meses=6
  return CHART_RECEITA_VS_CUSTOS_MOCK;
}

export function listarDoacoesRecentes(limite = 5): Doacao[] {
  // PROD: GET /api/doacoes?limite=N&ordem=desc
  return [...DOACOES_MOCK]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, limite);
}

export function listarParceiros(): Parceiro[] {
  // PROD: GET /api/parceiros
  return PARCEIROS_MOCK;
}