import {
  DENTISTAS,
  DISTRIBUICAO_REGIONAL,
  type DentistaCompleto,
  type KpiData,
  type Regiao,
  type RegistroSuspensao,
} from '../data/dentistas';

/* HOJE: mock + estado mutável em memória.
   AMANHÃ: cada função vira fetch ao backend.
   - aprovarDentista()    vira PATCH  /api/voluntarios/{id}/aprovar
   - rejeitarDentista()   vira PATCH  /api/voluntarios/{id}/rejeitar
   - suspenderDentista()  vira PATCH  /api/voluntarios/{id}/suspender
   - reativarDentista()   vira PATCH  /api/voluntarios/{id}/reativar
*/

let dentistas: DentistaCompleto[] = [...DENTISTAS];

export interface ContatoDentista {
  whatsapp: string;
  email: string;
  telefone: string;
}

/** Gera contato mock determinístico baseado no nome + id. Em PROD, vem do banco. */
export function contatoDoDentista(d: DentistaCompleto): ContatoDentista {
  const slug = d.nome
    .toLowerCase()
    .replace(/^dra?\.?\s+/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.');
  const num = '55119' + d.id.replace(/\W/g, '').padEnd(8, '0').slice(0, 8);
  return {
    whatsapp: num,
    email: `${slug}@dentistadobem.org`,
    telefone: `+${num}`,
  };
}

function mesAtual(): string {
  const meses = ['janeiro','fevereiro','março','abril','maio','junho',
                 'julho','agosto','setembro','outubro','novembro','dezembro'];
  const d = new Date();
  return `${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

export function listarDentistas(): DentistaCompleto[] {
  // PROD: GET /api/voluntarios
  return dentistas.filter((d) => d.status !== 'Rejeitado');
}

export function listarPendentes(): DentistaCompleto[] {
  // PROD: GET /api/voluntarios?status=Pendente
  return dentistas.filter((d) => d.status === 'Pendente');
}

export function listarEspecialidades(): string[] {
  return Array.from(
    new Set(
      dentistas
        .filter((d) => d.status !== 'Pendente' && d.status !== 'Rejeitado')
        .map((d) => d.especialidade),
    ),
  );
}

export function obterDistribuicaoRegional(): Record<Regiao, { count: number; percent: number }> {
  return DISTRIBUICAO_REGIONAL;
}

export function obterDentista(id: string): DentistaCompleto | undefined {
  return dentistas.find((d) => d.id === id);
}

export function obterKpis(): KpiData[] {
  const pendentes = listarPendentes();
  return [
    { label: 'Dentistas ativos',    value: '1.284',          sub: 'de 1.452 cadastrados' },
    { label: 'Inativos +90 dias',   value: '23',             valueTone: 'warning', sub: 'Vale reengajar' },
    { label: 'Pendentes aprovação', value: pendentes.length, valueTone: 'danger',  sub: 'Aguardando ação', subTone: 'danger' },
    { label: 'Novos este mês',      value: '18',             sub: '+5 vs setembro', subTone: 'success' },
  ];
}

// ─── Transições de status ─────────────────────────

export async function aprovarDentista(id: string): Promise<void> {
  dentistas = dentistas.map((d) =>
    d.id === id
      ? { ...d, status: 'Ativa' as const, voluntariaDesde: mesAtual(), anosNaRede: 0 }
      : d,
  );
}

export async function rejeitarDentista(id: string, _motivo: string): Promise<void> {
  // Mantém no banco como 'Rejeitado' (histórico). listarDentistas filtra.
  dentistas = dentistas.map((d) =>
    d.id === id ? { ...d, status: 'Rejeitado' as const } : d,
  );
}

export async function suspenderDentista(
  id: string,
  motivo: string,
  observacao?: string,
): Promise<void> {
  const registro: RegistroSuspensao = {
    data: new Date().toISOString().slice(0, 10),
    motivo,
    observacao,
  };
  dentistas = dentistas.map((d) =>
    d.id === id
      ? {
          ...d,
          status: 'Suspensa' as const,
          historicoSuspensoes: [...(d.historicoSuspensoes ?? []), registro],
        }
      : d,
  );
}

export async function reativarDentista(id: string): Promise<void> {
  dentistas = dentistas.map((d) =>
    d.id === id ? { ...d, status: 'Ativa' as const } : d,
  );
}