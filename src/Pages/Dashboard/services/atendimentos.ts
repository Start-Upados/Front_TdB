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
  type StatusAtendimento,
} from '../data/atendimentos';
import { atendimentoService, type AtendimentoBody } from '../../../Services/api';
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

// ─── Helpers de mapeamento Backend ↔ Frontend ────

function gerarIniciaisDoNome(nome: string): string {
  const partes = (nome || '').trim().split(/\s+/).filter((s) => !['Dr.', 'Dra.'].includes(s));
  if (partes.length === 0) return 'P';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** Aceita 'YYYY-MM-DD HH:MM', 'YYYY-MM-DDTHH:MM:SS', ou só 'YYYY-MM-DD'. */
function parseDataAtendimento(raw: string | undefined): { data: string; hora: string } {
  if (!raw) return { data: DATA_REFERENCIA, hora: '00:00' };
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})[T\s]?(\d{2}:\d{2})?/);
  if (m) return { data: m[1], hora: m[2] ?? '00:00' };
  return { data: DATA_REFERENCIA, hora: '00:00' };
}

/** Backend usa 'concluido'/'cancelado'; frontend usa 'realizado'/'no-show'. */
function statusBackendParaFront(s: string | undefined): StatusAtendimento {
  switch (s) {
    case 'confirmado':   return 'confirmado';
    case 'em-andamento': return 'em-andamento';
    case 'concluido':    return 'realizado';
    case 'cancelado':    return 'no-show';
    default:             return 'aguardando';
  }
}

function mapearAtendimentoBackend(body: AtendimentoBody): Atendimento {
  const { data, hora } = parseDataAtendimento(body.dataAtendimento);
  return {
    id: body.idAtendimento ? `b${body.idAtendimento}` : `a${Date.now()}`,
    idAtendimento: body.idAtendimento,
    data,
    hora,
    duracaoMinutos: body.duracaoMin ?? 30,
    paciente: {
      id: body.pacienteRgCpf ?? '',
      nome: body.pacienteNome ?? 'Paciente',
      idade: 0,                                       // backend não armazena
      iniciais: gerarIniciaisDoNome(body.pacienteNome ?? ''),
    },
    dentista: {
      id: body.dentistaRgCpf ?? '',
      nome: body.dentistaNome ?? 'Dentista',
    },
    especialidade: body.especialidade ?? 'Clínico geral',
    local: '',                                        // backend não armazena
    programa: (body.programa as ProgramaAtendimento) ?? 'Dentista do Bem',
    status: statusBackendParaFront(body.status),
    observacoesPre: body.status !== 'concluido' ? body.observacoes : undefined,
    observacoesPos: body.status === 'concluido' ? body.observacoes : undefined,
  };
}

/**
 * Puxa atendimentos do Oracle e MESCLA com o estado local.
 * Dedup por idAtendimento; preserva mocks/locais (que não têm idAtendimento).
 */
export async function carregarAtendimentosReais(): Promise<{
  count: number;
  fonte: 'backend' | 'mock';
}> {
  try {
    const lista = await atendimentoService.listar();
    if (Array.isArray(lista) && lista.length > 0) {
      const doBackend = lista.map(mapearAtendimentoBackend);
      const idsBackend = new Set(
        doBackend.map((a) => a.idAtendimento).filter((id): id is number => id !== undefined),
      );
      const apenasLocais = atendimentos.filter(
        (a) => !a.idAtendimento || !idsBackend.has(a.idAtendimento),
      );
      atendimentos = [...doBackend, ...apenasLocais];
      // Recalcula contagens das datas afetadas
      const datasAfetadas = new Set(doBackend.map((a) => a.data));
      datasAfetadas.forEach(recalcularContagem);
      persistir();
      return { count: atendimentos.length, fonte: 'backend' };
    }
    return { count: atendimentos.length, fonte: 'mock' };
  } catch (err) {
    console.warn('[atendimentos] backend indisponível, mantendo dados locais:', err);
    return { count: atendimentos.length, fonte: 'mock' };
  }
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

// ─── Transições de status ─────────────────────────

export async function marcarConfirmado(id: string): Promise<void> {
  const atendimento = atendimentos.find((a) => a.id === id);
  // Backend-first: se veio do Oracle, chama endpoint
  if (atendimento?.idAtendimento) {
    try {
      await atendimentoService.confirmar(atendimento.idAtendimento);
    } catch (err) {
      console.warn('[atendimentos] erro ao confirmar no backend:', err);
    }
  }
  atendimentos = atendimentos.map((a) =>
    a.id === id ? { ...a, status: 'confirmado' as const } : a,
  );
  persistir();
}

export async function iniciarAtendimento(id: string): Promise<void> {
  const atendimento = atendimentos.find((a) => a.id === id);
  if (atendimento?.idAtendimento) {
    try {
      await atendimentoService.iniciar(atendimento.idAtendimento);
    } catch (err) {
      console.warn('[atendimentos] erro ao iniciar no backend:', err);
    }
  }
  atendimentos = atendimentos.map((a) =>
    a.id === id ? { ...a, status: 'em-andamento' as const } : a,
  );
  persistir();
}

export async function finalizarAtendimento(
  id: string,
  observacoesPos?: string,
): Promise<void> {
  const atendimento = atendimentos.find((a) => a.id === id);
  if (atendimento?.idAtendimento) {
    try {
      await atendimentoService.finalizar(atendimento.idAtendimento);
      // Salva observações em chamada separada (endpoint /finalizar só muda status)
      if (observacoesPos) {
        await atendimentoService.alterar(atendimento.idAtendimento, {
          observacoes: observacoesPos,
        });
      }
    } catch (err) {
      console.warn('[atendimentos] erro ao finalizar no backend:', err);
    }
  }
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

  // Backend-first: se veio do Oracle, chama /reagendar
  if (original.idAtendimento) {
    try {
      await atendimentoService.reagendar(original.idAtendimento, {
        dataAtendimento: `${input.novaData} ${input.novaHora}`,
        duracaoMin: input.duracaoMinutos ?? original.duracaoMinutos,
        observacoes: input.observacoes,
      });
    } catch (err) {
      console.warn('[atendimentos] erro ao reagendar no backend:', err);
    }
  }

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

/**
 * Conta atendimentos do mês corrente (referência: DATA_REFERENCIA) + variação
 * em relação ao mês anterior. Usado no KPI "Atendimentos no mês" da Visão Geral.
 *
 * O array `atendimentos` já é alimentado pelo backend via carregarAtendimentosReais()
 * — quem chama esse contador vê os dados reais do Oracle + os mocks que ainda estão
 * em memória.
 */
export function contarAtendimentosNoMes(): {
  atual: number;
  anterior: number;
  variacaoPct: number;
  nomeMesAnterior: string;
} {
  const refDate = new Date(DATA_REFERENCIA + 'T12:00:00');
  const anoMesAtual = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`;

  const refAnterior = new Date(refDate);
  refAnterior.setMonth(refAnterior.getMonth() - 1);
  const anoMesAnterior = `${refAnterior.getFullYear()}-${String(refAnterior.getMonth() + 1).padStart(2, '0')}`;

  const atual = atendimentos.filter((a) => a.data.startsWith(anoMesAtual)).length;
  const anterior = atendimentos.filter((a) => a.data.startsWith(anoMesAnterior)).length;

  const variacaoPct = anterior === 0
    ? (atual > 0 ? 100 : 0)
    : Math.round(((atual - anterior) / anterior) * 100);

  const nomeMesAnterior = refAnterior.toLocaleDateString('pt-BR', { month: 'long' });

  return { atual, anterior, variacaoPct, nomeMesAnterior };
}

/**
 * Conta pacientes únicos em tratamento e na fila de espera, usado no KPI
 * "Pacientes em tratamento" da Visão Geral.
 *
 * - emTratamento:    paciente tem ao menos 1 atendimento 'confirmado' ou 'em-andamento'
 * - naFilaDeEspera:  paciente tem só atendimento 'aguardando' (não está em tratamento ativo)
 */
export function contarPacientesEmTratamento(): {
  emTratamento: number;
  naFilaDeEspera: number;
} {
  const emTratamentoSet = new Set<string>();
  const filaSet         = new Set<string>();

  atendimentos.forEach((a) => {
    if (a.status === 'confirmado' || a.status === 'em-andamento') {
      emTratamentoSet.add(a.paciente.id);
    } else if (a.status === 'aguardando') {
      filaSet.add(a.paciente.id);
    }
  });

  // Quem já está em tratamento ativo não conta como "fila de espera"
  emTratamentoSet.forEach((id) => filaSet.delete(id));

  return {
    emTratamento:   emTratamentoSet.size,
    naFilaDeEspera: filaSet.size,
  };
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