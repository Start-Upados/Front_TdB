import {
  KPIS_TRIAGENS_MOCK,
  PACIENTES_FILA_MOCK,
  DENTISTAS_MOCK,
  type KpiData,
  type Paciente,
  type Dentista,
  type Programa,
  type Severidade,
} from '../data/triagens';

import { calcularMatch, type MatchResult } from '../Utils/Geo';

/* HOJE: mock + matching local (haversine) com estado mutável em memória.
   AMANHÃ: cada função vira fetch ao backend.
   - obterKpis()         vira GET    /api/triagens/kpis
   - listarFila()        vira GET    /api/triagens/fila
   - sugerirDentistas()  vira POST   /api/triagens/{pacienteId}/matching
   - convidarDentista()  vira POST   /api/triagens/{pacienteId}/convites
   - cancelarConvite()   vira DELETE /api/triagens/{pacienteId}/convites
   - criarTriagem()      vira POST   /api/triagens
   A página NÃO precisa ser refatorada quando isso acontecer. */

export interface SugestaoDentista {
  dentista: Dentista;
  match: MatchResult;
}

// Estado mutável em memória — simula o estado do backend.
let pacientes: Paciente[] = [...PACIENTES_FILA_MOCK];

// Coordenadas aproximadas das capitais por UF — usadas no matching de pacientes novos.
const COORDS_POR_ESTADO: Record<string, { lat: number; lng: number }> = {
  AC: { lat:  -9.97, lng: -67.81 }, AL: { lat:  -9.65, lng: -35.71 },
  AM: { lat:  -3.12, lng: -60.02 }, AP: { lat:   0.03, lng: -51.07 },
  BA: { lat: -12.97, lng: -38.51 }, CE: { lat:  -3.71, lng: -38.54 },
  DF: { lat: -15.83, lng: -47.86 }, ES: { lat: -20.31, lng: -40.31 },
  GO: { lat: -16.69, lng: -49.26 }, MA: { lat:  -2.53, lng: -44.30 },
  MG: { lat: -19.92, lng: -43.94 }, MS: { lat: -20.46, lng: -54.62 },
  MT: { lat: -15.60, lng: -56.10 }, PA: { lat:  -1.45, lng: -48.49 },
  PB: { lat:  -7.12, lng: -34.86 }, PE: { lat:  -8.05, lng: -34.88 },
  PI: { lat:  -5.09, lng: -42.80 }, PR: { lat: -25.43, lng: -49.27 },
  RJ: { lat: -22.91, lng: -43.17 }, RN: { lat:  -5.79, lng: -35.21 },
  RO: { lat:  -8.76, lng: -63.90 }, RR: { lat:   2.82, lng: -60.67 },
  RS: { lat: -30.03, lng: -51.23 }, SC: { lat: -27.59, lng: -48.55 },
  SE: { lat: -10.91, lng: -37.07 }, SP: { lat: -23.55, lng: -46.64 },
  TO: { lat: -10.18, lng: -48.33 },
};

export function obterKpis(): KpiData[] {
  // PROD: GET /api/triagens/kpis
  return KPIS_TRIAGENS_MOCK;
}

export function listarFila(): Paciente[] {
  // PROD: GET /api/triagens/fila
  return pacientes;
}

export function listarDentistas(): Dentista[] {
  // PROD: GET /api/dentistas
  return DENTISTAS_MOCK;
}

/** Retorna os N dentistas mais compatíveis com o paciente, ordenados por score. */
export function sugerirDentistas(paciente: Paciente, limite = 3): SugestaoDentista[] {
  // PROD: POST /api/triagens/{pacienteId}/matching { limite }
  return DENTISTAS_MOCK
    .map((d) => ({
      dentista: d,
      match: calcularMatch({
        paciente: {
          coords: paciente.coords,
          especialidadeNecessaria: paciente.especialidadeNecessaria,
        },
        dentista: {
          coords: d.coords,
          especialidade: d.especialidade,
          slotsDisponiveis: d.slotsDisponiveis,
        },
      }),
    }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limite);
}

/** Envia convite de um dentista para um paciente. Paciente passa pra status 'convite-enviado'. */
export async function convidarDentista(pacienteId: string, dentistaId: string): Promise<void> {
  // PROD: POST /api/triagens/{pacienteId}/convites { dentistaId }
  pacientes = pacientes.map((p) =>
    p.id === pacienteId
      ? { ...p, statusVinculacao: 'convite-enviado', dentistaConvidadoId: dentistaId }
      : p,
  );
}

/** Cancela o convite ativo de um paciente. Volta pra status 'aguardando'. */
export async function cancelarConvite(pacienteId: string): Promise<void> {
  // PROD: DELETE /api/triagens/{pacienteId}/convites
  pacientes = pacientes.map((p) =>
    p.id === pacienteId
      ? { ...p, statusVinculacao: 'aguardando', dentistaConvidadoId: undefined }
      : p,
  );
}

export interface NovaTriagemInput {
  nome: string;
  idade: number;
  cidade: string;
  estado: string;
  cep: string;
  programa: Programa;
  necessidade: string;
  especialidadeNecessaria: string;
  severidade: Severidade;
  origemTipo: 'central' | 'escola' | 'manual';
  origemDetalhe: string;
}

/** Cria uma nova entrada de triagem na fila. Retorna o paciente criado. */
export async function criarTriagem(data: NovaTriagemInput): Promise<Paciente> {
  // PROD: POST /api/triagens { ...data }
  const iniciais = data.nome
    .split(' ')
    .filter((n) => n.length > 0)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  const coords = COORDS_POR_ESTADO[data.estado.toUpperCase()] ?? { lat: -23.55, lng: -46.64 };

  const novo: Paciente = {
    id: `t${Date.now()}`,
    nome: data.nome,
    iniciais,
    idade: data.idade,
    cidade: data.cidade,
    estado: data.estado.toUpperCase(),
    cep: data.cep,
    coords,
    programa: data.programa,
    necessidade: data.necessidade,
    especialidadeNecessaria: data.especialidadeNecessaria,
    severidade: data.severidade,
    diasNaFila: 0,
    origem: { tipo: data.origemTipo, detalhe: data.origemDetalhe },
    statusVinculacao: 'aguardando',
  };

  pacientes = [novo, ...pacientes];
  return novo;
}