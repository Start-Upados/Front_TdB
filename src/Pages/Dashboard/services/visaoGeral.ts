import {
  KPIS_VISAO_GERAL_MOCK, GRAFICO_MENSAL_MOCK, ALERTAS_MOCK,
  DISTRIBUICAO_MOCK, TOTAL_MES_MOCK,
  type KpiData, type PontoMensal, type AlertaVisaoGeral, type DistribuicaoPrograma,
} from '../data/visaoGeral';

/* HOJE: mock. AMANHÃ: fetch ao backend. Assinaturas estáveis. */

export function obterKpis(): KpiData[] {
  // PROD: GET /api/dashboard/kpis
  return KPIS_VISAO_GERAL_MOCK;
}

export function obterGraficoMensal(): PontoMensal[] {
  // PROD: GET /api/dashboard/atendimentos-mensais?meses=6
  return GRAFICO_MENSAL_MOCK;
}

export function listarAlertas(): AlertaVisaoGeral[] {
  // PROD: GET /api/dashboard/alertas
  return ALERTAS_MOCK;
}

export function obterDistribuicao(): { itens: DistribuicaoPrograma[]; total: number } {
  // PROD: GET /api/dashboard/distribuicao-programa
  return { itens: DISTRIBUICAO_MOCK, total: TOTAL_MES_MOCK };
}