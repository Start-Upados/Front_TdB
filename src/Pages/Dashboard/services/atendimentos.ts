import {
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
import { lerDataHora, temHora } from '../Utils/tempo';


// ─── Persistência localStorage ────────────────────
const LS_ATENDIMENTOS = 'tdb_atendimentos';
const LS_CONTAGENS    = 'tdb_atendimentos_contagens';

function hojeISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const EVENTO_ATENDIMENTOS = 'tdb:atendimentos-atualizados';

function persistir(): void {
  try {
    localStorage.setItem(LS_ATENDIMENTOS, JSON.stringify(atendimentos));
    localStorage.setItem(LS_CONTAGENS,    JSON.stringify(contagens));
  } catch (err) {
    console.warn('[atendimentos] erro ao persistir:', err);
  }
  window.dispatchEvent(new Event(EVENTO_ATENDIMENTOS));
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

// ─── Início real dos atendimentos (cronômetro) ──────
// O backend grava a hora em que o status mudou (ultima_atualizacao); em "em-andamento" é o início.
// Enquanto o backend novo não estiver no ar, guarda aqui a hora do clique em "Iniciar".
const LS_INICIOS = 'tdb_atendimentos_inicio';

function lerInicios(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LS_INICIOS) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function gravarInicio(id: string, iso: string | null): void {
  try {
    const mapa = lerInicios();
    if (iso) mapa[id] = iso; else delete mapa[id];
    localStorage.setItem(LS_INICIOS, JSON.stringify(mapa));
  } catch { /* sem storage: o cronômetro parte de quando a tela abriu */ }
}

/** Início vindo do backend só vale se tiver hora e for plausível (até 24h atrás). */
function inicioDoBackend(raw?: string): string | undefined {
  if (!temHora(raw)) return undefined;
  const d = lerDataHora(raw);
  if (!d) return undefined;
  const diff = Date.now() - d.getTime();
  return diff >= -5 * 60_000 && diff <= 24 * 3_600_000 ? d.toISOString() : undefined;
}

/**
 * Hora em que o atendimento começou de fato. Sem registro (atendimento iniciado em outro
 * aparelho antes da atualização), passa a contar a partir de agora e guarda.
 */
export function inicioRealDe(a: Atendimento): Date {
  const iso = a.inicioReal ?? lerInicios()[a.id];
  const d = iso ? new Date(iso) : null;
  if (d && !isNaN(d.getTime())) return d;
  const agora = new Date();
  gravarInicio(a.id, agora.toISOString());
  return agora;
}

let atendimentos: Atendimento[] = hidratarAtendimentos() ?? [];
const contagens: Record<string, number> = hidratarContagens() ?? {};

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

/** Backend usa 'concluido'/'cancelado'/'agendado' (às vezes em maiúsculas); frontend usa 'realizado'/'no-show'/'aguardando'. */
function statusBackendParaFront(s: string | undefined): StatusAtendimento {
  switch ((s ?? '').toLowerCase().trim()) {
    case 'confirmado':   return 'confirmado';
    case 'em-andamento':
    case 'em_andamento': return 'em-andamento';
    case 'concluido':
    case 'realizado':    return 'realizado';
    case 'cancelado':
    case 'no-show':      return 'no-show';
    case 'agendado':
    default:             return 'aguardando';
  }
}

/**
 * O banco aceita texto livre em `programa` (ex.: "Saúde Bucal" nos registros antigos).
 * Normaliza para os nomes oficiais; "Saúde Bucal" é o nome antigo do Apolônias do Bem.
 */
function normalizarPrograma(bruto?: string): ProgramaAtendimento {
  const p = (bruto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (p.includes('apolon') || p.includes('saude bucal')) return 'Apolônias do Bem';
  if (p.includes('mutir')) return 'Mutirão';
  return 'Dentista do Bem';
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
    programa: normalizarPrograma(body.programa),
    status: statusBackendParaFront(body.status),
    inicioReal: statusBackendParaFront(body.status) === 'em-andamento'
      ? inicioDoBackend(body.ultimaAtualizacao) ?? lerInicios()[body.idAtendimento ? `b${body.idAtendimento}` : '']
      : undefined,
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
      atendimentos = doBackend;
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
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { data: iso, count: contagens[iso] ?? 0 };
  });
}

/** Data tida como "hoje" no contexto da aplicação. */
export function dataDeHoje(): string {
  return hojeISO();
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
  const inicio = new Date().toISOString();
  gravarInicio(id, inicio);
  atendimentos = atendimentos.map((a) =>
    a.id === id ? { ...a, status: 'em-andamento' as const, inicioReal: inicio } : a,
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
  gravarInicio(id, null);
  atendimentos = atendimentos.map((a) =>
    a.id === id ? { ...a, status: 'realizado' as const, observacoesPos, inicioReal: undefined } : a,
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
  const hoje = hojeISO();
  return atendimentos
    .filter((a) => a.dentista.id === dentistaId && a.data >= hoje)
    .sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.hora.localeCompare(b.hora);
    })
    .slice(0, limite);
}

export function contarAtendimentosDentistaNoAno(dentistaId: string): number {
  const ano = new Date().getFullYear();
  return atendimentos.filter(
    (a) => a.dentista.id === dentistaId && a.data.startsWith(String(ano)),
  ).length;
}

/** Atendimentos com status 'realizado' no ano (padrão: ano atual). Usado na Meta TdB. */
export function contarRealizadosNoAno(ano = new Date().getFullYear()): number {
  return atendimentos.filter(
    (a) => a.status === 'realizado' && a.data.startsWith(String(ano)),
  ).length;
}

export function contarAtendimentosPorMes(meses = 6): { ano: number; mes: number; total: number }[] {
  const hoje = new Date();
  const out: { ano: number; mes: number; total: number }[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ ano: d.getFullYear(), mes: d.getMonth() + 1, total: atendimentos.filter((a) => a.data.startsWith(ym)).length });
  }
  return out;
}

export function contarAtendimentosPorPrograma(): { programa: string; total: number }[] {
  const map = new Map<string, number>();
  atendimentos.forEach((a) => map.set(a.programa, (map.get(a.programa) ?? 0) + 1));
  return Array.from(map.entries()).map(([programa, total]) => ({ programa, total }));
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
  const refDate = new Date(hojeISO() + 'T12:00:00');
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

export function obterKpisAtendimentos() {
  const hoje = hojeISO();
  const d = new Date();
  const mesAtual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const deHoje = atendimentos.filter((a) => a.data === hoje);
  const confirmadosHoje = deHoje.filter(
    (a) => a.status === 'confirmado' || a.status === 'realizado',
  ).length;

  const fim = new Date(d);
  fim.setDate(fim.getDate() + 6);
  const fimISO = `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, '0')}-${String(fim.getDate()).padStart(2, '0')}`;
  const proximos7 = atendimentos.filter((a) => a.data >= hoje && a.data <= fimISO).length;

  const doMes = atendimentos.filter((a) => a.data.startsWith(mesAtual));
  const realizadosMes = doMes.filter((a) => a.status === 'realizado').length;
  const noShowsMes = doMes.filter((a) => a.status === 'no-show').length;
  const baseComparec = realizadosMes + noShowsMes;
  const taxaComparec = baseComparec > 0 ? Math.round((realizadosMes / baseComparec) * 100) : 0;
  const pctNoShow = doMes.length > 0 ? ((noShowsMes / doMes.length) * 100).toFixed(1) : '0';

  return { hoje: deHoje.length, confirmadosHoje, proximos7, taxaComparec, noShowsMes, pctNoShow };
}

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