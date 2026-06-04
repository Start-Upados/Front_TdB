import {
  MUTIROES_MOCK,
  ESPECIALIDADES_MUTIRAO,
  type Mutirao,
  type StatusMutirao,
  type VoluntarioConvocado,
} from '../data/mutiroes';
import { dataDeHoje } from './atendimentos';
import { listarDentistas } from './voluntarios';
import type { DentistaCompleto } from '../data/dentistas';

/*
  HOJE: estado mutável em memória.
  AMANHÃ — endpoints sugeridos:
    listarTodos()          → GET    /api/mutiroes
    obterMutirao(id)       → GET    /api/mutiroes/{id}
    criarMutirao(input)    → POST   /api/mutiroes
    convocarVoluntarios()  → POST   /api/mutiroes/{id}/convocacoes
    cancelarConvocacao()   → DELETE /api/mutiroes/{id}/convocacoes/{dentistaId}
*/

let mutiroes: Mutirao[] = [...MUTIROES_MOCK];

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function horaParaLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${h}h` : `${h}h${m}`;
}

export function formatarHorario(inicio: string, fim: string): string {
  return `${horaParaLabel(inicio)} às ${horaParaLabel(fim)}`;
}

function calcularStatus(m: Pick<Mutirao, 'data' | 'dentistasConfirmados' | 'dentistasNecessarios' | 'status'>): StatusMutirao {
  if (m.status === 'realizado') return 'realizado';
  if (m.data < dataDeHoje()) return 'realizado';

  if (m.dentistasConfirmados >= m.dentistasNecessarios) return 'pronto';

  const diasFalta = diasAte(m.data);
  if (diasFalta < 7) return 'atencao';
  return 'em-preparacao';
}

// ──────────────────────────────────────────────
// LEITURA
// ──────────────────────────────────────────────

export function listarTodos(): Mutirao[] {
  return mutiroes;
}

export function listarProximos(): Mutirao[] {
  const hoje = dataDeHoje();
  return mutiroes
    .filter((m) => m.status !== 'realizado' && m.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data));
}

export function listarRecentes(limite = 5): Mutirao[] {
  return mutiroes
    .filter((m) => m.status === 'realizado')
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, limite);
}

export function obterMutirao(id: string): Mutirao | undefined {
  return mutiroes.find((m) => m.id === id);
}

export function diasAte(dataAlvo: string): number {
  const hoje = new Date(dataDeHoje() + 'T12:00:00');
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