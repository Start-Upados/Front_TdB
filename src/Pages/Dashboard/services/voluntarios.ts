import {
  DENTISTAS,
  DISTRIBUICAO_REGIONAL,
  type DentistaCompleto,
  type KpiData,
  type Regiao,
} from '../data/dentistas';

/* HOJE: mock estático. AMANHÃ: fetch ao backend.
   - listarPendentes vira GET /api/voluntarios?status=pendente
   - obterDentista vira GET /api/voluntarios/{id}
   - obterKpis vira GET /api/voluntarios/kpis (count dinâmico no servidor)
   A página não muda. */

export function listarDentistas(): DentistaCompleto[] {
  // PROD: GET /api/voluntarios
  return DENTISTAS;
}

export function listarPendentes(): DentistaCompleto[] {
  // PROD: GET /api/voluntarios?status=Pendente
  return DENTISTAS.filter((d) => d.status === 'Pendente');
}

export function listarEspecialidades(): string[] {
  // PROD: GET /api/voluntarios/especialidades
  return Array.from(
    new Set(
      DENTISTAS
        .filter((d) => d.status !== 'Pendente')
        .map((d) => d.especialidade),
    ),
  );
}

export function obterDistribuicaoRegional(): Record<Regiao, { count: number; percent: number }> {
  // PROD: GET /api/voluntarios/distribuicao-regional
  return DISTRIBUICAO_REGIONAL;
}

export function obterDentista(id: string): DentistaCompleto | undefined {
  // PROD: GET /api/voluntarios/{id}
  return DENTISTAS.find((d) => d.id === id);
}

export function obterKpis(): KpiData[] {
  // PROD: GET /api/voluntarios/kpis
  const pendentes = listarPendentes();
  return [
    { label: 'Dentistas ativos',    value: '1.284',           sub: 'de 1.452 cadastrados' },
    { label: 'Inativos +90 dias',   value: '23',              valueTone: 'warning', sub: 'Vale reengajar' },
    { label: 'Pendentes aprovação', value: pendentes.length,  valueTone: 'danger',  sub: 'Aguardando ação', subTone: 'danger' },
    { label: 'Novos este mês',      value: '18',              sub: '+5 vs setembro', subTone: 'success' },
  ];
}