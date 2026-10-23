import {
  type DentistaCompleto,
  type KpiData,
  type Regiao,
  type RegistroSuspensao,
} from '../data/dentistas';

import { dentistaService, type DentistaBody } from '../../../Services/api';
import { diasDesde } from '../Utils/tempo';

/** LocalDate do backend ("2026-10-17" ou [2026, 10, 17]) → "2026-10-17"; '' se não vier. */
function dataIso(v?: string | number[]): string {
  if (Array.isArray(v) && v.length >= 3) {
    return `${v[0]}-${String(v[1]).padStart(2, '0')}-${String(v[2]).padStart(2, '0')}`;
  }
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : '';
}

// Só voluntários cadastrados no banco — nada de dados de exemplo.
let dentistas: DentistaCompleto[] = [];
let jaCarregou = false;
let contatosBackend: Record<string, { whatsapp: string; email: string; telefone: string }> = {};

// ─── Backend real ────────────────────────────────
// Converte o DentistaBody (enxuto, do Oracle) no DentistaCompleto (rico) que a
// tela usa. O backend não tem todos os campos — os que faltam recebem defaults
// seguros até existirem no banco (Opção A).

function iniciaisDe(nome: string): string {
  const p = nome.trim().split(/\s+/).filter((x) => !['Dr.', 'Dra.'].includes(x));
  if (p.length === 0) return 'XX';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function statusDe(s?: string): DentistaCompleto['status'] {
  switch ((s ?? '').toLowerCase()) {
    case 'ativa':
    case 'ativo':     return 'Ativa';
    case 'inativo':   return 'Inativo';
    case 'suspensa':
    case 'suspenso':  return 'Suspensa';
    case 'rejeitado': return 'Rejeitado';
    case 'pendente':
    default:          return 'Pendente';
  }
}

function regiaoDoCep(cep?: string): Regiao {
  const d = (cep ?? '').replace(/\D/g, '');
  if (d.length < 1) return 'Sudeste';           // sem CEP → default
  switch (d[0]) {
    case '0':                                    // 0xxxx = SP
    case '1':                                    // 1xxxx = SP interior
    case '2':                                    // 2xxxx = RJ, ES
    case '3':                                    // 3xxxx = MG
      return 'Sudeste';
    case '4':                                    // 4xxxx = BA, SE
    case '5':                                    // 5xxxx = PE, AL, PB, RN
    case '6':                                    // 6xxxx = CE, PI, MA, (+ PA/AM/AC/AP/RR no 68-69)
      // 66-68 pegam parte do Norte; tratamos o grosso como Nordeste,
      // e o recorte Norte abaixo corrige os prefixos 68/69.
      if (d.startsWith('68') || d.startsWith('69')) return 'Norte';
      return 'Nordeste';
    case '7':                                    // 7xxxx = DF, GO, TO, MT, MS, RO (Centro-Oeste + parte Norte)
      if (d.startsWith('76')) return 'Norte';    // 76xxx = RO/parte de TO
      return 'Centro-Oeste';
    case '8':                                    // 8xxxx = PR, SC
    case '9':                                    // 9xxxx = RS
      return 'Sul';
    default:
      return 'Sudeste';
  }
}

function mapearDentistaBackend(b: DentistaBody): DentistaCompleto {
  contatosBackend[b.rgCpf] = {
  whatsapp: (b.telefone ?? '').replace(/\D/g, ''),
  email: b.email ?? '',
  telefone: b.telefone ?? '',};
  return {
    id: b.rgCpf,
    nome: b.nome,
    iniciais: iniciaisDe(b.nome),
    cro: b.cro ?? '',
    especialidade: b.especializacao ?? 'Clínico geral',
    tags: [],
    cidade: b.dto?.localidade ?? '',  // cidade do CEP (ViaCEP) — usada no filtro de convocação por cidade
    estado: b.dto?.uf ?? b.dto?.estado ?? '',
    regiao: regiaoDoCep(b.cep),                
    status: statusDe(b.status),
    vinculosTotal: 0,
    vinculosAtivos: 0,
    atendimentosNoAno: b.nAtendimentos ?? 0,
    rating: b.avaliacao ?? 0,
    ratingCount: b.qtdAvaliacoes ?? 0,
    taxaComparecimento: 0,
    // Datas reais do banco: cadastro (voluntarioDesde) e última atividade
    ultimaAtividadeDias: diasDesde(dataIso(b.ultimaAtividade)) ?? 0,
    voluntariaDesde: dataIso(b.voluntarioDesde),
    anosNaRede: Math.floor((diasDesde(dataIso(b.voluntarioDesde)) ?? 0) / 365),
    programas: [],
    pacientesAtivos: [],
    disponibilidadeSemana: [],
    ultimosAtendimentos: [],
    horarioConfigurado: '',
  };
}

export async function carregarDentistasReais(): Promise<{
  count: number;
  fonte: 'backend' | 'erro';
  erro?: string;
}> {
  try {
    const lista = await dentistaService.listar();
    // O banco é a única fonte: lista vazia = nenhum voluntário cadastrado
    dentistas = Array.isArray(lista) ? lista.map(mapearDentistaBackend) : [];
    jaCarregou = true;
    return { count: dentistas.length, fonte: 'backend' };
  } catch (err) {
    console.error('[voluntarios] não foi possível carregar os dentistas do backend:', err);
    // Mantém o que já veio do banco nesta sessão (se veio); nunca cai em dados de exemplo
    return {
      count: dentistas.length,
      fonte: 'erro',
      erro: err instanceof Error ? err.message : 'Erro desconhecido',
    };
  }
}

/** true depois que a lista veio do banco ao menos uma vez nesta sessão. */
export function dentistasCarregados(): boolean {
  return jaCarregou;
}

export interface ContatoDentista {
  whatsapp: string;
  email: string;
  telefone: string;
}

export function contatoDoDentista(d: DentistaCompleto): ContatoDentista {
  const real = contatosBackend[d.id];
  if (real && real.whatsapp) return real;
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

function hojeIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Dias desde o cadastro (tempo real de espera de quem está pendente). null = sem data. */
export function diasDesdeCadastro(d: DentistaCompleto): number | null {
  return diasDesde(d.voluntariaDesde);
}

export function listarDentistas(): DentistaCompleto[] {
  return dentistas.filter((d) => d.status !== 'Rejeitado');
}

export function listarPendentes(): DentistaCompleto[] {
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
  const regioes: Regiao[] = ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'];
  // conta só dentistas ativos na rede (exclui pendentes/rejeitados)
  const ativos = dentistas.filter((d) => d.status !== 'Pendente' && d.status !== 'Rejeitado');
  const total = ativos.length;

  const resultado = {} as Record<Regiao, { count: number; percent: number }>;
  for (const r of regioes) {
    const count = ativos.filter((d) => d.regiao === r).length;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    resultado[r] = { count, percent };
  }
  return resultado;
}

export function obterDentista(id: string): DentistaCompleto | undefined {
  return dentistas.find((d) => d.id === id);
}

export function obterKpis(): KpiData[] {
  const todos     = listarDentistas();      // exclui rejeitados
  const pendentes = listarPendentes();
  const ativos    = todos.filter((d) => d.status === 'Ativa').length;
  const inativos  = todos.filter((d) => d.status === 'Inativo').length;

  // "Novos este mês": pela data de cadastro (voluntarioDesde) que o backend manda.
  const d = new Date();
  const mesAtual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const temDataCadastro = todos.some((x) => !!x.voluntariaDesde);
  const novosMes = todos.filter((x) => (x.voluntariaDesde ?? '').startsWith(mesAtual)).length;

  return [
    { label: 'Dentistas ativos',    value: String(ativos),           sub: `de ${todos.length} cadastrados` },
    { label: 'Inativos',            value: String(inativos),         valueTone: inativos > 0 ? 'warning' : 'default', sub: inativos > 0 ? 'status inativo' : 'nenhum' },
    { label: 'Pendentes aprovação', value: String(pendentes.length), valueTone: 'danger', sub: 'Aguardando ação', subTone: 'danger' },
    { label: 'Novos este mês',      value: temDataCadastro ? String(novosMes) : '—', sub: temDataCadastro ? 'novos cadastros' : 'sem data no backend' },
  ];
}

export function contarDentistasSemAtividade90(): number {
  return dentistas.filter((d) => d.status === 'Ativa' && d.ultimaAtividadeDias > 90).length;
}

// ─── Transições de status ─────────────────────────

export async function aprovarDentista(id: string): Promise<void> {
  try {
    await dentistaService.mudarStatus(id, 'ativo');
  } catch (err) {
    console.warn('[voluntarios] erro ao aprovar no backend:', err);
  }
  dentistas = dentistas.map((d) =>
    d.id === id
      ? { ...d, status: 'Ativa' as const, voluntariaDesde: d.voluntariaDesde || hojeIso(), anosNaRede: 0 }
      : d,
  );
}

export async function rejeitarDentista(id: string, _motivo: string): Promise<void> {
  try {
    await dentistaService.mudarStatus(id, 'rejeitado');
  } catch (err) {
    console.warn('[voluntarios] erro ao rejeitar no backend:', err);
  }
  dentistas = dentistas.map((d) =>
    d.id === id ? { ...d, status: 'Rejeitado' as const } : d,
  );
}

export async function suspenderDentista(
  id: string,
  motivo: string,
  observacao?: string,
): Promise<void> {
  try {
    await dentistaService.mudarStatus(id, 'suspenso');
  } catch (err) {
    console.warn('[voluntarios] erro ao suspender no backend:', err);
  }
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
  try {
    await dentistaService.mudarStatus(id, 'ativo');
  } catch (err) {
    console.warn('[voluntarios] erro ao reativar no backend:', err);
  }
  dentistas = dentistas.map((d) =>
    d.id === id ? { ...d, status: 'Ativa' as const } : d,
  );
}