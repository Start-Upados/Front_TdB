import {
  EQUIPE_MOCK, INTEGRACOES_MOCK, ORGANIZACAO_MOCK,
  type MembroEquipe, type Integracao, type OrganizacaoInfo,
} from '../data/configuracoes';

/* HOJE: mock. AMANHÃ: fetch ao backend. */

export function listarEquipe(): MembroEquipe[] {
  // PROD: GET /api/equipe
  return EQUIPE_MOCK;
}

export function listarIntegracoes(): Integracao[] {
  // PROD: GET /api/integracoes/status
  return INTEGRACOES_MOCK;
}

export function obterOrganizacao(): OrganizacaoInfo {
  // PROD: GET /api/organizacao
  return ORGANIZACAO_MOCK;
}