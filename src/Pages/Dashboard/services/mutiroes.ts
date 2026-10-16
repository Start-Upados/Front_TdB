import {
  ESPECIALIDADES_MUTIRAO,
  type Mutirao,
  type StatusMutirao,
  type VoluntarioConvocado,
  type TipoMutirao,
  type ProgramaMutirao,
} from '../data/mutiroes';
//import { dataDeHoje } from './atendimentos';
import { listarDentistas } from './voluntarios';
import type { DentistaCompleto } from '../data/dentistas';
import type { /* ... existentes ..., */ PacienteConfirmado } from '../data/mutiroes';
import { campanhaService, type CampanhaBody, type ParticipanteCampanhaBody } from '../../../Services/api';

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

function pad2(n: unknown): string {
  return String(n).padStart(2, '0');
}

/** dataEvento chega como "YYYY-MM-DD" (ou [ano, mês, dia] dependendo do Jackson). */
function dataDoBackend(v: unknown): string {
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  if (Array.isArray(v) && v.length >= 3) return `${v[0]}-${pad2(v[1])}-${pad2(v[2])}`;
  return '';
}

function horaDoBackend(v?: string): string {
  const m = (v ?? '').match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
}

function semAcento(v?: string): string {
  return (v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function programaDoBackend(v?: string): ProgramaMutirao | undefined {
  const p = semAcento(v);
  if (!p) return undefined;
  return p.includes('apolon') || p.includes('saude bucal') ? 'Apolônias do Bem' : 'Dentista do Bem';
}

function tipoDoBackend(v?: string): TipoMutirao | undefined {
  const t = semAcento(v);
  if (!t) return undefined;
  return t.includes('escola') ? 'Triagem em escola' : 'Atendimento em comunidade';
}

function iniciaisDe(nome: string, padrao: string): string {
  return nome
    .trim().split(/\s+/).filter((s) => !['Dr.', 'Dra.'].includes(s))
    .map((s) => s[0]).slice(0, 2).join('').toUpperCase() || padrao;
}

/** CPF pode vir "000.000.000-11" ou "00000000011": compara só os dígitos. */
function mesmoCpf(a?: string, b?: string): boolean {
  const da = (a ?? '').replace(/\D/g, '');
  return da.length > 0 ? da === (b ?? '').replace(/\D/g, '') : (a ?? '') === (b ?? '');
}

function chaveNome(nome?: string): string {
  return (nome ?? '').toLowerCase().trim();
}

function voluntarioDoBackend(p: ParticipanteCampanhaBody): VoluntarioConvocado {
  const st = semAcento(p.status);
  return {
    dentistaId: p.rgCpf,
    nome: p.nome,
    iniciais: iniciaisDe(p.nome ?? '', 'D'),
    especialidade: p.especialidade ?? '',
    cidade: p.cidade ?? '',
    estado: p.estado ?? '',
    convocadoEm: p.criadoEm ?? '',
    status: st === 'pendente' ? 'pendente' : st === 'recusado' ? 'recusado' : 'confirmado',
  };
}

function pacienteDoBackend(p: ParticipanteCampanhaBody): PacienteConfirmado {
  return {
    pacienteCpf: p.rgCpf,
    nome: p.nome,
    iniciais: iniciaisDe(p.nome ?? '', 'P'),
    cidade: p.cidade ?? '',
    confirmadoEm: p.criadoEm ?? '',
  };
}

/**
 * Campanha do banco → Mutirao da tela. Data, horário, programa, tipo, especialidades,
 * público e CEP já vêm do banco. `participantes` = linhas de campanha_participante
 * (null = backend ainda sem esse endpoint → listas ficam vazias aqui e o merge usa o cache).
 */
function mapearCampanhaBackend(c: CampanhaBody, participantes: ParticipanteCampanhaBody[] | null): Mutirao {
  const data = dataDoBackend(c.dataEvento);
  const horaInicio = horaDoBackend(c.horaInicio);
  const horaFim = horaDoBackend(c.horaFim);
  const especialidades = (c.especialidades ?? '').split(',').map((e) => e.trim()).filter(Boolean);
  const daCampanha = (participantes ?? []).filter((p) => chaveNome(p.campanhaNome) === chaveNome(c.nome));
  const voluntarios = daCampanha.filter((p) => p.tipo === 'dentista').map(voluntarioDoBackend);
  const pacientes = daCampanha.filter((p) => p.tipo === 'paciente').map(pacienteDoBackend);

  return {
    id: gerarIdDeNome(c.nome),
    nome: c.nome,
    data,
    horaInicio,
    horaFim,
    horario: horaInicio && horaFim ? formatarHorario(horaInicio, horaFim) : 'Horário a definir',
    local: c.logradouro || c.nome,
    endereco: c.logradouro,
    cidade: c.cidade,
    estado: c.estado,
    cep: c.cep || undefined,
    tipo: tipoDoBackend(c.tipo) ?? 'Atendimento em comunidade',
    programa: programaDoBackend(c.programa) ?? 'Dentista do Bem',
    publicoAlvo: c.publicoAlvo || undefined,
    especialidades: especialidades.length ? especialidades : ['Clínico geral'],
    observacoes: c.descricao,
    dentistasNecessarios: c.nDentistas,
    // Admin recebe todos os participantes; dentista/paciente só a si mesmo → o total vem do banco
    dentistasConfirmados: c.nDentistasConfirmados ?? voluntarios.filter((v) => v.status === 'confirmado').length,
    pacientesEsperados: c.metaAtendidos,
    voluntariosConvocados: voluntarios,
    pacientesConfirmados: pacientes,
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

    // Participantes (convocados / presenças). Backend antigo responde outra coisa → null = usa o cache.
    let participantes: ParticipanteCampanhaBody[] | null = null;
    try {
      const resp = await campanhaService.listarParticipantes();
      participantes = Array.isArray(resp) ? resp : null;
    } catch (err) {
      console.warn('[mutiroes] participantes indisponíveis no backend, usando cache:', err);
    }

    if (Array.isArray(lista) && lista.length > 0) {
      const locaisPorNome = new Map(mutiroes.map((m) => [chaveNome(m.nome), m]));
      const nomesBackend = new Set(lista.map((c) => chaveNome(c.nome)));

      // 1) Banco é a fonte. O cache só completa campos que mutirões ANTIGOS não têm no banco.
      const doBanco = lista.map((c) => {
        const bm = mapearCampanhaBackend(c, participantes);
        const local = locaisPorNome.get(chaveNome(c.nome));
        if (!local) return bm;
        const temHorario = !!(bm.horaInicio && bm.horaFim);
        return {
          ...bm,
          data:           bm.data || local.data,
          horaInicio:     temHorario ? bm.horaInicio : local.horaInicio ?? bm.horaInicio,
          horaFim:        temHorario ? bm.horaFim : local.horaFim ?? bm.horaFim,
          horario:        temHorario ? bm.horario : local.horario ?? bm.horario,
          programa:       c.programa ? bm.programa : local.programa ?? bm.programa,
          tipo:           c.tipo ? bm.tipo : local.tipo ?? bm.tipo,
          especialidades: c.especialidades ? bm.especialidades
                          : (local.especialidades?.length ? local.especialidades : bm.especialidades),
          publicoAlvo:    bm.publicoAlvo ?? local.publicoAlvo,
          cep:            bm.cep ?? local.cep,
          local:          local.local || bm.local,
          status:         local.status === 'realizado' ? local.status : bm.status,
          ...(participantes === null
            ? {
                voluntariosConvocados: local.voluntariosConvocados ?? [],
                pacientesConfirmados:  local.pacientesConfirmados ?? [],
                dentistasConfirmados:  local.dentistasConfirmados ?? 0,
              }
            : {}),
        };
      });

      // 2) Cadastros que ainda não chegaram no banco (POST falhou) continuam visíveis
      const apenasLocais = mutiroes.filter((m) => !nomesBackend.has(chaveNome(m.nome)));

      mutiroes = [...doBanco, ...apenasLocais];
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

/** Nome da campanha no banco (chave usada nos endpoints de participantes). */
function nomeNoBanco(m: Mutirao): string {
  return m.nome || m.local;
}

function aplicar(mutiraoId: string, f: (m: Mutirao) => Mutirao): void {
  mutiroes = mutiroes.map((m) => {
    if (m.id !== mutiraoId) return m;
    const atualizado = f(m);
    atualizado.status = calcularStatus(atualizado);
    return atualizado;
  });
  persistir();
}

export async function convocarVoluntarios(
  mutiraoId: string,
  dentistaIds: string[],
): Promise<void> {
  const m = mutiroes.find((x) => x.id === mutiraoId);
  if (!m) throw new Error('Mutirão não encontrado');
  const dentistas = listarDentistas();
  const alvos = dentistaIds
    .filter((id) => !m.voluntariosConvocados.some((v) => v.dentistaId === id))
    .map((id) => dentistas.find((x) => x.id === id))
    .filter((d): d is DentistaCompleto => !!d);

  // Grava no banco primeiro; só entra na tela quem foi salvo
  const resultados = await Promise.allSettled(
    alvos.map((d) =>
      campanhaService.adicionarParticipante(nomeNoBanco(m), {
        tipo: 'dentista',
        rgCpf: d.id,                   // id do dentista = rgCpf do banco
        nome: d.nome,
        especialidade: d.especialidade,
        cidade: d.cidade,
        estado: d.estado,
        status: 'confirmado',
      }),
    ),
  );
  const salvos = alvos.filter((_, i) => resultados[i].status === 'fulfilled');
  const hoje = hojeLocal();

  aplicar(mutiraoId, (atual) => {
    const novos: VoluntarioConvocado[] = salvos.map((d) => ({
      dentistaId: d.id,
      nome: d.nome,
      iniciais: d.iniciais,
      especialidade: d.especialidade,
      cidade: d.cidade,
      estado: d.estado,
      convocadoEm: hoje,
      status: 'confirmado',
    }));
    const lista = [...atual.voluntariosConvocados, ...novos];
    return { ...atual, voluntariosConvocados: lista, dentistasConfirmados: atual.dentistasConfirmados + novos.length };
  });

  const falhas = alvos.length - salvos.length;
  if (falhas > 0) {
    throw new Error(`${falhas} ${falhas === 1 ? 'convocação não foi salva' : 'convocações não foram salvas'} no banco`);
  }
}

export async function cancelarConvocacao(mutiraoId: string, dentistaId: string): Promise<void> {
  const m = mutiroes.find((x) => x.id === mutiraoId);
  if (!m) throw new Error('Mutirão não encontrado');
  await campanhaService.removerParticipante(nomeNoBanco(m), 'dentista', dentistaId);
  aplicar(mutiraoId, (atual) => {
    const filtrados = atual.voluntariosConvocados.filter((v) => !mesmoCpf(v.dentistaId, dentistaId));
    const removidos = atual.voluntariosConvocados.length - filtrados.length;
    return {
      ...atual,
      voluntariosConvocados: filtrados,
      dentistasConfirmados: Math.max(0, atual.dentistasConfirmados - removidos),
    };
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
  return !!m?.pacientesConfirmados?.some((p) => mesmoCpf(p.pacienteCpf, pacienteCpf));
}

export async function confirmarPresencaPaciente(
  mutiraoId: string,
  paciente: { cpf: string; nome: string; cidade: string },
): Promise<void> {
  const m = mutiroes.find((x) => x.id === mutiraoId);
  if (!m) throw new Error('Mutirão não encontrado');
  if ((m.pacientesConfirmados ?? []).some((p) => mesmoCpf(p.pacienteCpf, paciente.cpf))) return;
  await campanhaService.adicionarParticipante(nomeNoBanco(m), {
    tipo: 'paciente',
    rgCpf: paciente.cpf,
    nome: paciente.nome,
    cidade: extrairCidade(paciente.cidade),
    status: 'confirmado',
  });
  aplicar(mutiraoId, (atual) => ({
    ...atual,
    pacientesConfirmados: [
      ...(atual.pacientesConfirmados ?? []),
      {
        pacienteCpf: paciente.cpf,
        nome: paciente.nome,
        iniciais: iniciaisDe(paciente.nome, 'P'),
        cidade: extrairCidade(paciente.cidade),
        confirmadoEm: hojeLocal(),
      },
    ],
  }));
}

export async function cancelarPresencaPaciente(mutiraoId: string, pacienteCpf: string): Promise<void> {
  const m = mutiroes.find((x) => x.id === mutiraoId);
  if (!m) throw new Error('Mutirão não encontrado');
  await campanhaService.removerParticipante(nomeNoBanco(m), 'paciente', pacienteCpf);
  aplicar(mutiraoId, (atual) => ({
    ...atual,
    pacientesConfirmados: (atual.pacientesConfirmados ?? []).filter((p) => !mesmoCpf(p.pacienteCpf, pacienteCpf)),
  }));
}

// ─── Dentistas ───
export function dentistaEstaConfirmado(mutiraoId: string, dentistaId: string): boolean {
  const m = obterMutirao(mutiraoId);
  return !!m?.voluntariosConvocados.some((v) => mesmoCpf(v.dentistaId, dentistaId));
}

export async function autoInscreverDentista(
  mutiraoId: string,
  dentista: { id: string; nome: string; especialidade: string; cidade: string; estado: string },
): Promise<void> {
  const m = mutiroes.find((x) => x.id === mutiraoId);
  if (!m) throw new Error('Mutirão não encontrado');
  if (m.voluntariosConvocados.some((v) => mesmoCpf(v.dentistaId, dentista.id))) return;
  await campanhaService.adicionarParticipante(nomeNoBanco(m), {
    tipo: 'dentista',
    rgCpf: dentista.id,
    nome: dentista.nome,
    especialidade: dentista.especialidade,
    cidade: extrairCidade(dentista.cidade),
    estado: dentista.estado,
    status: 'confirmado',
  });
  aplicar(mutiraoId, (atual) => ({
    ...atual,
    voluntariosConvocados: [
      ...atual.voluntariosConvocados,
      {
        dentistaId: dentista.id,
        nome: dentista.nome,
        iniciais: iniciaisDe(dentista.nome, 'D'),
        especialidade: dentista.especialidade,
        cidade: extrairCidade(dentista.cidade),
        estado: dentista.estado,
        convocadoEm: hojeLocal(),
        status: 'confirmado',
      },
    ],
    dentistasConfirmados: atual.dentistasConfirmados + 1,
  }));
}

export async function cancelarPresencaDentista(mutiraoId: string, dentistaId: string): Promise<void> {
  // Mesma mecânica do cancelamento pelo admin
  return cancelarConvocacao(mutiraoId, dentistaId);
}
