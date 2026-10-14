import {
  ESPECIALIDADES_MUTIRAO,
  type Mutirao,
  type StatusMutirao,
  type VoluntarioConvocado,
} from '../data/mutiroes';
//import { dataDeHoje } from './atendimentos';
import { listarDentistas } from './voluntarios';
import type { DentistaCompleto } from '../data/dentistas';
import type { /* ... existentes ..., */ PacienteConfirmado } from '../data/mutiroes';
import { campanhaService, type CampanhaBody } from '../../../Services/api';

/*
  HOJE: estado mutável em memória + cache em localStorage (tdb_mutiroes).
  Backend Oracle via campanhaService. Cross-browser via carregarMutiroesReais().
*/

// ─── Persistência localStorage ────────────────────
const LS_MUTIROES = 'tdb_mutiroes';

function persistir(): void {
  try {
    localStorage.setItem(LS_MUTIROES, JSON.stringify(mutiroes));
  } catch (err) {
    console.warn('[mutiroes] erro ao persistir:', err);
  }
}

function hidratar(): Mutirao[] | null {
  try {
    const raw = localStorage.getItem(LS_MUTIROES);
    return raw ? (JSON.parse(raw) as Mutirao[]) : null;
  } catch {
    return null;
  }
}

let mutiroes: Mutirao[] = hidratar() ?? [];

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

// Data local (YYYY-MM-DD) — toISOString() é UTC e vira o dia após 21h em SP
function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Recalcula o status na leitura — mutirão cuja data passou vira 'realizado' sozinho
function comStatusAtual(): Mutirao[] {
  return mutiroes.map((m) => ({ ...m, status: calcularStatus(m) }));
}

function horaParaLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${h}h` : `${h}h${m}`;
}

export function formatarHorario(inicio: string, fim: string): string {
  return `${horaParaLabel(inicio)} às ${horaParaLabel(fim)}`;
}

function calcularStatus(m: Pick<Mutirao, 'data' | 'dentistasConfirmados' | 'dentistasNecessarios' | 'status'>): StatusMutirao {
  if (m.status === 'realizado') return 'realizado';
  if (m.data && m.data < hojeLocal()) return 'realizado';

  if (m.dentistasConfirmados >= m.dentistasNecessarios) return 'pronto';
  if (!m.data) return 'em-preparacao';           // sem data definida

  const diasFalta = diasAte(m.data);
  if (diasFalta < 7) return 'atencao';
  return 'em-preparacao';
}

// ──────────────────────────────────────────────
// LEITURA
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// MAPEAMENTO BACKEND ↔ FRONTEND
// ──────────────────────────────────────────────

function gerarIdDeNome(nome: string): string {
  return 'mb-' + (nome ?? 'sem-nome').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * Backend CampanhaBody é minimalista (só tem nome/endereço/meta/contagens).
 * Esse mapper aplica defaults pros campos que o backend ainda não armazena
 * (data, horários, especialidades, programa, tipo). Quando o backend expandir,
 * atualiza só este mapper.
 */
function mapearCampanhaBackend(c: CampanhaBody): Mutirao {
  return {
    id: gerarIdDeNome(c.nome),
    nome: c.nome,
    data: '',                                            // backend ainda não guarda data do evento
    horaInicio: '',
    horaFim: '',
    horario: 'Horário a definir',
    local: c.logradouro || c.nome,
    endereco: c.logradouro,
    cidade: c.cidade,
    estado: c.estado,
    tipo: 'Atendimento em comunidade',                   // default
    programa: 'Dentista do Bem',                         // default
    especialidades: ['Clínico geral'],                   // default
    observacoes: c.descricao,
    dentistasNecessarios: c.nDentistas,
    dentistasConfirmados: 0,
    pacientesEsperados: c.metaAtendidos,
    voluntariosConvocados: [],
    status: 'em-preparacao',
    atendimentosRealizados: c.nAtendidos,
  } as Mutirao;
}

// ──────────────────────────────────────────────
// LEITURA
// ──────────────────────────────────────────────

export function listarTodos(): Mutirao[] {
  return mutiroes;
}

export function obterKpisMutiroes(): {
  atendimentosMes: number;
  atendimentosAno: number;
  realizadosAno: number;
} {
  const d = new Date();
  const mesAtual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const anoAtual = String(d.getFullYear());

  const realizados = comStatusAtual().filter((m) => m.status === 'realizado');

  const atendimentosMes = realizados
    .filter((m) => m.data.startsWith(mesAtual))
    .reduce((sum, m) => sum + (m.atendimentosRealizados ?? 0), 0);

  const doAno = realizados.filter((m) => m.data.startsWith(anoAtual));
  const atendimentosAno = doAno.reduce((sum, m) => sum + (m.atendimentosRealizados ?? 0), 0);

  return { atendimentosMes, atendimentosAno, realizadosAno: doAno.length };
}

/**
 * Puxa mutirões do Oracle e MESCLA com o estado local (mocks + cadastros offline).
 * Dedup por NOME (backend usa nome como PK; frontend pode ter gerado um id local
 * antes do backend responder). Mesma estratégia da Central e de Triagens.
 */
export async function carregarMutiroesReais(): Promise<{
  count: number;
  fonte: 'backend' | 'mock';
}> {
  try {
    const lista = await campanhaService.listar();
    if (Array.isArray(lista) && lista.length > 0) {
      const doBackend = lista.map(mapearCampanhaBackend);

      // O backend (CampanhaBody) não guarda data, horário, programa, tipo,
      // especialidades, público nem CEP. Esses campos vêm do cadastro local
      // (dado real do formulário) — preservamos por nome.
      const nomesBackend  = new Set(doBackend.map((m) => (m.nome ?? '').toLowerCase().trim()));
      const locaisPorNome = new Map(mutiroes.map((m) => [(m.nome ?? '').toLowerCase().trim(), m]));

      // 1) Backend como fonte de verdade, enriquecido com os campos que ele não guarda
      const enriquecidos = doBackend.map((bm) => {
        const local = locaisPorNome.get((bm.nome ?? '').toLowerCase().trim());
        if (!local) return bm;
        return {
          ...bm,
          data:           local.data || bm.data,
          horaInicio:     local.horaInicio ?? bm.horaInicio,
          horaFim:        local.horaFim ?? bm.horaFim,
          horario:        local.horario ?? bm.horario,
          programa:       local.programa ?? bm.programa,
          tipo:           local.tipo ?? bm.tipo,
          especialidades: (local.especialidades?.length ? local.especialidades : bm.especialidades),
          publicoAlvo:    local.publicoAlvo ?? bm.publicoAlvo,
          cep:            local.cep ?? bm.cep,
          endereco:       local.endereco ?? bm.endereco,
          status:         local.status ?? bm.status,
        };
      });

      // 2) Mantém cadastros locais que ainda não chegaram no backend (ex.: POST falhou)
      const apenasLocais = mutiroes.filter((m) => !nomesBackend.has((m.nome ?? '').toLowerCase().trim()));

      mutiroes = [...enriquecidos, ...apenasLocais];
      persistir();
      return { count: mutiroes.length, fonte: 'backend' };
    }
    return { count: mutiroes.length, fonte: 'mock' };
  } catch (err) {
    console.warn('[mutiroes] backend indisponível, mantendo dados locais:', err);
    return { count: mutiroes.length, fonte: 'mock' };
  }
}

export function listarProximos(): Mutirao[] {
  const hoje = hojeLocal();
  return comStatusAtual()
    .filter((m) => m.status !== 'realizado' && (!m.data || m.data >= hoje))
    .sort((a, b) => {
      if (!a.data) return 1;                       // "a definir" vai pro fim
      if (!b.data) return -1;
      return a.data.localeCompare(b.data);
    });
}

export function listarRecentes(limite?: number): Mutirao[] {
  return comStatusAtual()
    .filter((m) => m.status === 'realizado')
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, limite);                              // sem limite = todos
}

export function obterMutirao(id: string): Mutirao | undefined {
  return comStatusAtual().find((m) => m.id === id);
}

export function diasAte(dataAlvo: string): number {
  // Usa a data REAL do navegador (não a DATA_REFERENCIA mock de atendimentos.ts)
  const hojeStr = hojeLocal();
  const hoje = new Date(hojeStr + 'T12:00:00');
  const alvo = new Date(dataAlvo + 'T12:00:00');
  return Math.round((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

// ──────────────────────────────────────────────
// MUTAÇÕES
// ──────────────────────────────────────────────

export interface NovoMutiraoInput {
  nome: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  local: string;
  endereco?: string;
  cidade: string;
  estado: string;
  cep?: string;
  tipo: Mutirao['tipo'];
  programa: Mutirao['programa'];
  publicoAlvo?: string;
  especialidades: string[];
  observacoes?: string;
  dentistasNecessarios: number;
  pacientesEsperados: number;
}

export async function criarMutirao(input: NovoMutiraoInput): Promise<Mutirao> {
  const novo: Mutirao = {
    id: 'm' + (Date.now() % 100000),
    nome: input.nome,
    data: input.data,
    horaInicio: input.horaInicio,
    horaFim: input.horaFim,
    horario: formatarHorario(input.horaInicio, input.horaFim),
    local: input.local,
    endereco: input.endereco,
    cidade: input.cidade,
    estado: input.estado,
    cep: input.cep,
    tipo: input.tipo,
    programa: input.programa,
    publicoAlvo: input.publicoAlvo,
    especialidades: input.especialidades,
    observacoes: input.observacoes,
    dentistasNecessarios: input.dentistasNecessarios,
    dentistasConfirmados: 0,
    pacientesEsperados: input.pacientesEsperados,
    voluntariosConvocados: [],
    status: 'em-preparacao',
  };
  novo.status = calcularStatus(novo);
  mutiroes = [novo, ...mutiroes];
  persistir();
  return novo;
}

export async function convocarVoluntarios(
  mutiraoId: string,
  dentistaIds: string[],
): Promise<void> {
  const dentistas = listarDentistas();
  mutiroes = mutiroes.map((m) => {
    if (m.id !== mutiraoId) return m;

    const novos: VoluntarioConvocado[] = [];
    for (const id of dentistaIds) {
      if (m.voluntariosConvocados.some((v) => v.dentistaId === id)) continue;
      const d = dentistas.find((x) => x.id === id);
      if (!d) continue;
      novos.push({
        dentistaId: d.id,
        nome: d.nome,
        iniciais: d.iniciais,
        especialidade: d.especialidade,
        cidade: d.cidade,
        estado: d.estado,
        convocadoEm: new Date().toISOString().slice(0, 10),
        status: 'confirmado',
      });
    }

    const atualizado = {
      ...m,
      voluntariosConvocados: [...m.voluntariosConvocados, ...novos],
      dentistasConfirmados: m.voluntariosConvocados.length + novos.length,
    };
    atualizado.status = calcularStatus(atualizado);
    return atualizado;
  });
  persistir();
}

export async function cancelarConvocacao(mutiraoId: string, dentistaId: string): Promise<void> {
  mutiroes = mutiroes.map((m) => {
    if (m.id !== mutiraoId) return m;
    const filtrados = m.voluntariosConvocados.filter((v) => v.dentistaId !== dentistaId);
    const atualizado = {
      ...m,
      voluntariosConvocados: filtrados,
      dentistasConfirmados: filtrados.length,
    };
    atualizado.status = calcularStatus(atualizado);
    return atualizado;
  });
  persistir();
}

// ──────────────────────────────────────────────
// LISTAGENS PARA MODAIS
// ──────────────────────────────────────────────

export interface VoluntarioDisponivel {
  dentista: DentistaCompleto;
  slotsLivres: number;
  ehLocal: boolean;
}

export function listarVoluntariosDisponiveis(
  mutirao: Mutirao,
  filtroEspecialidade: string = 'Todas',
): VoluntarioDisponivel[] {
  const jaConvocados = new Set(mutirao.voluntariosConvocados.map((v) => v.dentistaId));

  return listarDentistas()
    .filter((d) => d.status === 'Ativa')
    .filter((d) => !jaConvocados.has(d.id))
    .filter((d) => filtroEspecialidade === 'Todas' || d.especialidade === filtroEspecialidade)
    .map((d) => ({
      dentista: d,
      slotsLivres: d.disponibilidadeSemana.reduce((acc, dia) => acc + (dia.total - dia.ocupados), 0),
      ehLocal: d.cidade === mutirao.cidade,
    }))
    .sort((a, b) => {
      if (a.ehLocal !== b.ehLocal) return a.ehLocal ? -1 : 1;
      return b.slotsLivres - a.slotsLivres;
    });
}

export function listarEspecialidadesParaFiltro(): string[] {
  return [...ESPECIALIDADES_MUTIRAO];
}

/**
 * Extrai a cidade base de uma string que pode vir como "São Paulo, SP" ou "São Paulo".
 * Necessário porque o Portal do Paciente usa o formato "Cidade, UF" e o Mutirão usa só "Cidade".
 */
export function extrairCidade(cidadeFull: string): string {
  return (cidadeFull ?? '').split(',')[0].trim();
}

/** Mutirões futuros filtrados pela cidade do usuário (match case-insensitive). */
export function listarProximosPorCidade(cidade: string): Mutirao[] {
  const alvo = extrairCidade(cidade).toLowerCase();
  return listarProximos().filter((m) => m.cidade.toLowerCase() === alvo);
}

// ─── Pacientes ───
export function pacienteEstaConfirmado(mutiraoId: string, pacienteCpf: string): boolean {
  const m = obterMutirao(mutiraoId);
  return !!m?.pacientesConfirmados?.some((p) => p.pacienteCpf === pacienteCpf);
}

export async function confirmarPresencaPaciente(
  mutiraoId: string,
  paciente: { cpf: string; nome: string; cidade: string },
): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
  mutiroes = mutiroes.map((m) => {
    if (m.id !== mutiraoId) return m;
    const atuais = m.pacientesConfirmados ?? [];
    if (atuais.some((p) => p.pacienteCpf === paciente.cpf)) return m;
    const iniciais = paciente.nome
      .trim().split(/\s+/).filter((s) => !['Dr.', 'Dra.'].includes(s))
      .map((s) => s[0]).slice(0, 2).join('').toUpperCase() || 'P';
    const novo: PacienteConfirmado = {
      pacienteCpf: paciente.cpf,
      nome: paciente.nome,
      iniciais,
      cidade: extrairCidade(paciente.cidade),
      confirmadoEm: new Date().toISOString().slice(0, 10),
    };
    return { ...m, pacientesConfirmados: [...atuais, novo] };
  });
  persistir();
}

export async function cancelarPresencaPaciente(mutiraoId: string, pacienteCpf: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
  mutiroes = mutiroes.map((m) => {
    if (m.id !== mutiraoId) return m;
    return {
      ...m,
      pacientesConfirmados: (m.pacientesConfirmados ?? []).filter((p) => p.pacienteCpf !== pacienteCpf),
    };
  });
  persistir();
}

// ─── Dentistas ───
export function dentistaEstaConfirmado(mutiraoId: string, dentistaId: string): boolean {
  const m = obterMutirao(mutiraoId);
  return !!m?.voluntariosConvocados.some((v) => v.dentistaId === dentistaId);
}

export async function autoInscreverDentista(
  mutiraoId: string,
  dentista: { id: string; nome: string; especialidade: string; cidade: string; estado: string },
): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
  mutiroes = mutiroes.map((m) => {
    if (m.id !== mutiraoId) return m;
    if (m.voluntariosConvocados.some((v) => v.dentistaId === dentista.id)) return m;
    const iniciais = dentista.nome
      .trim().split(/\s+/).filter((s) => !['Dr.', 'Dra.'].includes(s))
      .map((s) => s[0]).slice(0, 2).join('').toUpperCase() || 'D';
    const novo: VoluntarioConvocado = {
      dentistaId: dentista.id,
      nome: dentista.nome,
      iniciais,
      especialidade: dentista.especialidade,
      cidade: extrairCidade(dentista.cidade),
      estado: dentista.estado,
      convocadoEm: new Date().toISOString().slice(0, 10),
      status: 'confirmado',
    };
    const atualizado = {
      ...m,
      voluntariosConvocados: [...m.voluntariosConvocados, novo],
      dentistasConfirmados: m.voluntariosConvocados.length + 1,
    };
    return atualizado;
  });
  persistir();
}

export async function cancelarPresencaDentista(mutiraoId: string, dentistaId: string): Promise<void> {
  // Reusa cancelarConvocacao já existente — mesma mecânica
  return cancelarConvocacao(mutiraoId, dentistaId);
}