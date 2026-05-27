import {
  ATENDIMENTOS_MOCK,
  CONTAGENS_SEMANA_MOCK,
  DATA_REFERENCIA,
  type Atendimento,
} from '../data/atendimentos';

/*
  Camada de serviço — única interface entre páginas e backend.
  HOJE: retorna mock estático.
  AMANHÃ: troca cada corpo de função pelo fetch correspondente.
  As assinaturas NÃO mudam, então as páginas não precisam ser refatoradas.
*/

export interface ContagemDia {
  data: string; // YYYY-MM-DD
  count: number;
}

/** Lista atendimentos de uma data específica, ordenados por hora. */
export function listarPorData(data: string): Atendimento[] {
  // PROD: await fetch(`/api/atendimentos?data=${data}`).then(r => r.json())
  return ATENDIMENTOS_MOCK
    .filter((a) => a.data === data)
    .sort((a, b) => a.hora.localeCompare(b.hora));
}

/** Conta atendimentos por dia em uma faixa de N dias a partir de dataInicial. */
export function contarPorFaixa(dataInicial: string, dias: number): ContagemDia[] {
  // PROD: await fetch(`/api/atendimentos/contagem?inicio=${dataInicial}&dias=${dias}`)
  const inicio = new Date(dataInicial + 'T12:00:00');
  return Array.from({ length: dias }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return { data: iso, count: CONTAGENS_SEMANA_MOCK[iso] ?? 0 };
  });
}

/** Data tida como "hoje" no contexto da aplicação. */
export function dataDeHoje(): string {
  // PROD: return new Date().toISOString().slice(0, 10);
  return DATA_REFERENCIA;
}