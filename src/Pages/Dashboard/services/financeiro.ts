import {
  DOACOES_MOCK,
  DESPESAS_MOCK,
  PARCEIROS_MOCK,
  type KpisFinanceiro,
  type PontoChartFinanceiro,
  type Doacao,
  type Despesa,
  type Parceiro,
  type AcaoSugerida,
} from '../data/financeiro';

/* HOJE: estado mutável em memória. AMANHÃ: fetch ao backend. */

let doacoes: Doacao[] = [...DOACOES_MOCK];
let despesas: Despesa[] = [...DESPESAS_MOCK];

// Referência pra calcular custo por atendimento.
// Quando o backend tiver endpoint /api/atendimentos/count?mes=X, troca aqui.
const ATENDIMENTOS_REF_MES = 300;

const MESES_CURTOS_CAP = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function ymAtual(): string {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

function ymAnterior(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

function somarPorMes<T extends { data: string; valor: number }>(itens: T[], ym: string): number {
  return itens.filter((x) => x.data.startsWith(ym)).reduce((s, x) => s + x.valor, 0);
}

// ──────────────────────────────────────────────
// LEITURA
// ──────────────────────────────────────────────

export function obterKpisFinanceiro(): KpisFinanceiro {
  const mes = ymAtual();
  const mesAnt = ymAnterior();

  const doacoesNoMes = somarPorMes(doacoes, mes);
  const custosNoMes  = somarPorMes(despesas, mes);
  const doacoesMesAnt = somarPorMes(doacoes, mesAnt);
  const custosMesAnt  = somarPorMes(despesas, mesAnt);

  const saldoMes = doacoesNoMes - custosNoMes;
  const margem = doacoesNoMes > 0 ? Math.round((saldoMes / doacoesNoMes) * 100) : 0;

  const custoPorAtendimento    = Math.round(custosNoMes  / ATENDIMENTOS_REF_MES);
  const custoPorAtendimentoAnt = Math.round(custosMesAnt / ATENDIMENTOS_REF_MES);

  return {
    doacoesNoMes,
    custosNoMes,
    saldoMes,
    custoPorAtendimento,
    margem,
    variacao: {
      doacoes:             doacoesNoMes - doacoesMesAnt,
      custoPorAtendimento: custoPorAtendimento - custoPorAtendimentoAnt,
    },
  };
}

export function obterChartReceitaCustos(): PontoChartFinanceiro[] {
  const pontos: PontoChartFinanceiro[] = [];
  const hoje = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const ym = d.toISOString().slice(0, 7);
    pontos.push({
      mes: MESES_CURTOS_CAP[d.getMonth()],
      receita: somarPorMes(doacoes, ym),
      custos:  somarPorMes(despesas, ym),
    });
  }
  return pontos;
}

export function listarDoacoesRecentes(limite = 5): Doacao[] {
  return [...doacoes]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, limite);
}

export function listarDespesasRecentes(limite = 5): Despesa[] {
  return [...despesas]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, limite);
}

export function listarParceiros(): Parceiro[] {
  return PARCEIROS_MOCK;
}

// ──────────────────────────────────────────────
// MUTAÇÕES
// ──────────────────────────────────────────────

export interface NovaDoacaoInput {
  data: string;
  doador: string;
  descricao: string;
  valor: number;
  isRecorrente: boolean;
}

function calcularAcaoSugerida(input: NovaDoacaoInput): AcaoSugerida {
  const nome = input.doador.trim().toLowerCase();
  if (nome === 'anônimo' || nome === 'anonimo') return 'sem-contato';
  if (input.isRecorrente || input.valor >= 500) return 'recibo';
  return 'agradecer';
}

export async function cadastrarDoacao(input: NovaDoacaoInput): Promise<Doacao> {
  await new Promise((r) => setTimeout(r, 250));
  const nova: Doacao = {
    id: 'doa' + (Date.now() % 100000),
    data: input.data,
    doador: input.doador.trim(),
    descricao: input.descricao.trim() || 'Doação registrada manualmente',
    valor: input.valor,
    isRecorrente: input.isRecorrente,
    acaoSugerida: calcularAcaoSugerida(input),
  };
  doacoes = [nova, ...doacoes];
  return nova;
}

export async function marcarComoAgradecida(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 150));
  doacoes = doacoes.map((d) =>
    d.id === id ? { ...d, agradecidoEm: new Date().toISOString().slice(0, 10) } : d,
  );
}

export async function marcarReciboGerado(id: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 150));
  const ano = new Date().getFullYear();
  // Numeração sequencial por ano
  const totalAnoAtual = doacoes.filter(
    (d) => d.reciboGeradoEm && d.reciboGeradoEm.startsWith(String(ano))
  ).length;
  const numero = `RC-${ano}-${String(totalAnoAtual + 1).padStart(4, '0')}`;

  doacoes = doacoes.map((d) =>
    d.id === id
      ? {
          ...d,
          reciboGeradoEm: new Date().toISOString().slice(0, 10),
          numeroRecibo: numero,
        }
      : d,
  );
  return numero;
}

export interface NovaDespesaInput {
  data: string;
  descricao: string;
  categoria: Despesa['categoria'];
  valor: number;
}

export async function cadastrarDespesa(input: NovaDespesaInput): Promise<Despesa> {
  await new Promise((r) => setTimeout(r, 250));
  const nova: Despesa = {
    id: 'desp' + (Date.now() % 100000),
    data: input.data,
    descricao: input.descricao.trim(),
    categoria: input.categoria,
    valor: input.valor,
  };
  despesas = [nova, ...despesas];
  return nova;
}

// ──────────────────────────────────────────────
// PARCEIROS
// ──────────────────────────────────────────────

// Estado mutável dos parceiros (era constante antes)
let parceirosMutavel: Parceiro[] = [...PARCEIROS_MOCK];

export function listarParceiro(): Parceiro[] {
  return parceirosMutavel;
}

export interface HistoricoDoador {
  totalContribuido: number;
  qtdDoacoes: number;
  primeiraDoacao: string | null;       // YYYY-MM-DD
  ultimaDoacao:   string | null;
  duracaoLabel: string;                // ex: "5 meses", "2 anos"
}

export function obterHistoricoDoador(nome: string): HistoricoDoador {
  const alvo = nome.trim().toLowerCase();
  const filtradas = doacoes.filter((d) => d.doador.trim().toLowerCase() === alvo);

  if (filtradas.length === 0) {
    return {
      totalContribuido: 0, qtdDoacoes: 0,
      primeiraDoacao: null, ultimaDoacao: null,
      duracaoLabel: 'Nenhuma doação registrada',
    };
  }

  const ordenadas = [...filtradas].sort((a, b) => a.data.localeCompare(b.data));
  const primeira = ordenadas[0].data;
  const ultima   = ordenadas[ordenadas.length - 1].data;
  const total    = filtradas.reduce((s, d) => s + d.valor, 0);

  // Duração entre primeira doação e hoje
  const dataPrimeira = new Date(primeira + 'T12:00:00');
  const hoje = new Date();
  const meses = (hoje.getFullYear() - dataPrimeira.getFullYear()) * 12
              + (hoje.getMonth() - dataPrimeira.getMonth());

  const duracaoLabel = meses < 12
    ? `${meses === 0 ? 'menos de 1 mês' : `${meses} ${meses === 1 ? 'mês' : 'meses'}`}`
    : `${Math.floor(meses / 12)} ${Math.floor(meses / 12) === 1 ? 'ano' : 'anos'}`;

  return {
    totalContribuido: total,
    qtdDoacoes: filtradas.length,
    primeiraDoacao: primeira,
    ultimaDoacao: ultima,
    duracaoLabel,
  };
}

export function listarDoacoesPorDoador(nome: string): Doacao[] {
  const alvo = nome.trim().toLowerCase();
  return [...doacoes]
    .filter((d) => d.doador.trim().toLowerCase() === alvo)
    .sort((a, b) => b.data.localeCompare(a.data));    // mais recentes primeiro
}

export async function iniciarNegociacaoParceiro(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 150));
  parceirosMutavel = parceirosMutavel.map((p) =>
    p.id === id
      ? {
          ...p,
          negociacaoIniciadaEm: new Date().toISOString().slice(0, 10),
          proximaRenovacao: p.proximaRenovacao
            ? {
                ...p.proximaRenovacao,
                urgencia: 'em-negociacao',
                label: `Em negociação desde ${new Date().toLocaleDateString('pt-BR')}`,
              }
            : undefined,
        }
      : p,
  );
}