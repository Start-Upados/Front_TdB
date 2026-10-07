import {
  DENTISTAS,
  type DentistaCompleto,
  type KpiData,
  type Regiao,
  type RegistroSuspensao,
} from '../data/dentistas';

import { dentistaService, type DentistaBody } from '../../../Services/api';

let dentistas: DentistaCompleto[] = [...DENTISTAS];
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
    cidade: '',                       // backend não fornece — derivar do CEP é trabalho futuro
    estado: '',
    regiao: regiaoDoCep(b.cep),                
    status: statusDe(b.status),
    vinculosTotal: 0,
    vinculosAtivos: 0,
    atendimentosNoAno: b.nAtendimentos ?? 0,
    rating: b.avaliacao ?? 0,
    ratingCount: 0,
    taxaComparecimento: 0,
    ultimaAtividadeDias: 0,
    voluntariaDesde: '',
    anosNaRede: 0,
    programas: [],
    pacientesAtivos: [],
    disponibilidadeSemana: [],
    ultimosAtendimentos: [],
    horarioConfigurado: '',
  };
}

export async function carregarDentistasReais(): Promise<{ count: number; fonte: 'backend' | 'mock' }> {
  try {
    const lista = await dentistaService.listar();
    if (Array.isArray(lista) && lista.length > 0) {
      dentistas = lista.map(mapearDentistaBackend);
      return { count: dentistas.length, fonte: 'backend' };
    }
    return { count: dentistas.length, fonte: 'mock' };
  } catch (err) {
    console.warn('[voluntarios] backend indisponível, mantendo dados atuais:', err);
    return { count: dentistas.length, fonte: 'mock' };
  }
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

function mesAtual(): string {
  const meses = ['janeiro','fevereiro','março','abril','maio','junho',
                 'julho','agosto','setembro','outubro','novembro','dezembro'];
  const d = new Date();
  return `${meses[d.getMonth()]} de ${d.getFullYear()}`;
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
  const ativos    = dentistas.filter((d) => d.status === 'Ativa');
  const inativos  = dentistas.filter((d) => d.status === 'Inativo');
  const pendentes = listarPendentes();
  const naRede    = dentistas.filter((d) => d.status !== 'Pendente' && d.status !== 'Rejeitado');

  return [
    { label: 'Dentistas ativos',    value: ativos.length,    sub: `de ${naRede.length} na rede` },
    { label: 'Inativos',            value: inativos.length,  valueTone: 'warning', sub: 'Vale reengajar' },
    { label: 'Pendentes aprovação', value: pendentes.length, valueTone: 'danger',  sub: 'Aguardando ação', subTone: 'danger' },
    { label: 'Total cadastrados',   value: dentistas.length, sub: 'Na plataforma' },
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