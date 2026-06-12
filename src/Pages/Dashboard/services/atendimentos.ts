import {
  ATENDIMENTOS_MOCK,
  CONTAGENS_SEMANA_MOCK,
  DATA_REFERENCIA,
  PACIENTES_LISTA,
  DENTISTAS_LISTA,
  regiaoDoLocal,
  type Atendimento,
  type ProgramaAtendimento,
  type PacienteAtendimento,
} from '../data/atendimentos';

/*
  HOJE: mock + estado mutável em memória.
  AMANHÃ: cada função vira fetch ao backend.
  - listarPorData()           vira GET    /api/atendimentos?data=&filtros
  - obterPorId()              vira GET    /api/atendimentos/{id}
  - marcarConfirmado()        vira PATCH  /api/atendimentos/{id}/confirmar
  - iniciarAtendimento()      vira PATCH  /api/atendimentos/{id}/iniciar
  - finalizarAtendimento()    vira PATCH  /api/atendimentos/{id}/finalizar
  - reagendarAtendimento()    vira POST   /api/atendimentos/{id}/reagendar
  - criarAtendimento()        vira POST   /api/atendimentos
  A página NÃO precisa ser refatorada quando isso acontecer.
*/

// ─── Persistência localStorage ────────────────────
const LS_ATENDIMENTOS = 'tdb_atendimentos';
const LS_CONTAGENS    = 'tdb_atendimentos_contagens';

function persistir(): void {
  try {
    localStorage.setItem(LS_ATENDIMENTOS, JSON.stringify(atendimentos));
    localStorage.setItem(LS_CONTAGENS,    JSON.stringify(contagens));
  } catch (err) {
    console.warn('[atendimentos] erro ao persistir:', err);
  }
}

function hidratarAtendimentos(): Atendimento[] | null {
  try {
    const raw = localStorage.getItem(LS_ATENDIMENTOS);
    return raw ? (JSON.parse(raw) as Atendimento[]) : null;
  } catch {
    return null;
  }
}

function hidratarContagens(): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(LS_CONTAGENS);
    return raw ? (JSON.parse(raw) as Record<string, number>) : null;
  } catch {
    return null;
  }
}

let atendimentos: Atendimento[]              = hidratarAtendimentos() ?? [...ATENDIMENTOS_MOCK];
const contagens: Record<string, number>      = hidratarContagens()    ?? { ...CONTAGENS_SEMANA_MOCK };

function recalcularContagem(data: string) {
  contagens[data] = atendimentos.filter((a) => a.data === data).length;
}

export interface ContagemDia {
  data: string;
  count: number;
}

export interface FiltrosAtendimentos {
  programa?: string;   // 'Todos' ou ProgramaAtendimento
  regiao?: string;     // 'Todas' ou nome da região
  dentistaId?: string; // 'Todos' ou ID do dentista
}

/** Lista atendimentos de uma data específica, com filtros opcionais. */
export function listarPorData(data: string, filtros?: FiltrosAtendimentos): Atendimento[] {
  return atendimentos
    .filter((a) => a.data === data)
    .filter((a) => !filtros?.programa   || filtros.programa === 'Todos'   || a.programa === filtros.programa)
    .filter((a) => !filtros?.regiao     || filtros.regiao === 'Todas'     || regiaoDoLocal(a.local) === filtros.regiao)
    .filter((a) => !filtros?.dentistaId || filtros.dentistaId === 'Todos' || a.dentista.id === filtros.dentistaId)
    .sort((a, b) => a.hora.localeCompare(b.hora));
}

/** Conta atendimentos por dia em uma faixa de N dias a partir de dataInicial. */
export function contarPorFaixa(dataInicial: string, dias: number): ContagemDia[] {
  const inicio = new Date(dataInicial + 'T12:00:00');
  return Array.from({ length: dias }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return { data: iso, count: contagens[iso] ?? 0 };
  });
}

/** Data tida como "hoje" no contexto da aplicação. */
export function dataDeHoje(): string {
  return DATA_REFERENCIA;
}

export function obterPorId(id: string): Atendimento | undefined {
  return atendimentos.find((a) => a.id === id);
}

/** Lista de dentistas únicos para o filtro. */
export function listarDentistasFiltro(): Array<{ id: string; nome: string }> {
  const map = new Map<string, { id: string; nome: string }>();
  atendimentos.forEach((a) => map.set(a.dentista.id, a.dentista));
  return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
}

export function listarPacientes(): PacienteAtendimento[] {
  return PACIENTES_LISTA;
}

export function listarDentistasCadastrados() {
  return DENTISTAS_LISTA;
}

// ─── Transições de status ─────────────────────────

export async function marcarConfirmado(id: string): Promise<void> {
  atendimentos = atendimentos.map((a) =>
    a.id === id ? { ...a, status: 'confirmado' as const } : a,
  );
  persistir();
}

export async function iniciarAtendimento(id: string): Promise<void> {
  atendimentos = atendimentos.map((a) =>
    a.id === id ? { ...a, status: 'em-andamento' as const } : a,
  );
  persistir();
}

export async function finalizarAtendimento(
  id: string,
  observacoesPos?: string,
): Promise<void> {
  atendimentos = atendimentos.map((a) =>
    a.id === id ? { ...a, status: 'realizado' as const, observacoesPos } : a,
  );
  persistir();
}

// ─── Reagendamento ────────────────────────────────

export interface ReagendarInput {
  idOriginal: string;
  novaData: string;
  novaHora: string;
  duracaoMinutos?: number;
  motivoNoShow?: string;
  observacoes?: string;
}

export async function reagendarAtendimento(input: ReagendarInput): Promise<Atendimento> {
  const original = atendimentos.find((a) => a.id === input.idOriginal);
  if (!original) throw new Error('Atendimento não encontrado');

  // Marca o original como reagendado e atualiza o motivo
  atendimentos = atendimentos.map((a) =>
    a.id === input.idOriginal
      ? { ...a, motivoNoShow: input.motivoNoShow ?? a.motivoNoShow, reagendado: true }
      : a,
  );
  

  const novo: Atendimento = {
    ...original,
    id: `a${Date.now()}`,
    data: input.novaData,
    hora: input.novaHora,
    duracaoMinutos: input.duracaoMinutos ?? original.duracaoMinutos,
    status: 'aguardando',
    observacoesPre: input.observacoes,
    motivoNoShow: undefined,
    reagendado: false,
  };

  atendimentos = [...atendimentos, novo];
  recalcularContagem(input.novaData);
  persistir();
  return novo;
}

// ─── Criação ─────────────────────────────────────

export interface NovoAtendimentoInput {
  pacienteId: string;
  dentistaId: string;
  data: string;
  hora: string;
  duracaoMinutos: number;
  programa: ProgramaAtendimento;
  especialidade: string;
  local: string;
  observacoes?: string;
}

export async function criarAtendimento(input: NovoAtendimentoInput): Promise<Atendimento> {
  const paciente = PACIENTES_LISTA.find((p) => p.id === input.pacienteId);
  const dentista = DENTISTAS_LISTA.find((d) => d.id === input.dentistaId);
  if (!paciente) throw new Error('Paciente não encontrado');
  if (!dentista) throw new Error('Dentista não encontrado');

  const novo: Atendimento = {
    id: `a${Date.now()}`,
    data: input.data,
    hora: input.hora,
    duracaoMinutos: input.duracaoMinutos,
    paciente: { ...paciente },
    dentista: { id: dentista.id, nome: dentista.nome },
    especialidade: input.especialidade,
    local: input.local,
    programa: input.programa,
    status: 'aguardando',
    observacoesPre: input.observacoes,
  };

  atendimentos = [...atendimentos, novo];
  recalcularContagem(input.data);
  persistir();
  return novo;
}

/** Lista próximos atendimentos de um dentista a partir de hoje (incluso). */
export function listarProximosPorDentista(dentistaId: string, limite = 10): Atendimento[] {
  const hoje = DATA_REFERENCIA;
  return atendimentos
    .filter((a) => a.dentista.id === dentistaId && a.data >= hoje)
    .sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.hora.localeCompare(b.hora);
    })
    .slice(0, limite);
}

// ─── Criar atendimento a partir de uma triagem aceita ────────────
// Diferente de criarAtendimento(): aceita dados completos do paciente/dentista
// (não busca em PACIENTES_LISTA/DENTISTAS_LISTA), porque o paciente vem da fila
// de Triagens e tem ID dinâmico (ex: 't1733...').

export interface NovoAtendimentoDeTriagemInput {
  pacienteId: string;
  pacienteNome: string;
  pacienteIdade: number;
  pacienteIniciais: string;
  dentistaId: string;
  dentistaNome: string;
  data: string;
  hora: string;
  duracaoMinutos: number;
  programa: ProgramaAtendimento;
  especialidade: string;
  local: string;
  observacoes?: string;
}

export async function criarAtendimentoDeTriagem(
  input: NovoAtendimentoDeTriagemInput,
): Promise<Atendimento> {
  const novo: Atendimento = {
    id: `a${Date.now()}`,
    data: input.data,
    hora: input.hora,
    duracaoMinutos: input.duracaoMinutos,
    paciente: {
      id: input.pacienteId,
      nome: input.pacienteNome,
      idade: input.pacienteIdade,
      iniciais: input.pacienteIniciais,
    },
    dentista: { id: input.dentistaId, nome: input.dentistaNome },
    especialidade: input.especialidade,
    local: input.local,
    programa: input.programa,
    status: 'aguardando',
    observacoesPre: input.observacoes,
  };

  atendimentos = [...atendimentos, novo];
  recalcularContagem(input.data);
  persistir();
  return novo;
}