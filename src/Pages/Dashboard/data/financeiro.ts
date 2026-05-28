export type AcaoSugerida = 'agradecer' | 'recibo' | 'sem-contato';
export type TipoParceiro = 'parceria-estrategica' | 'parceria' | 'pontual' | 'consolidado-pf';
export type UrgenciaRenovacao = 'iminente' | 'futura';

export interface Doacao {
  id: string;
  data: string;
  doador: string;
  isRecorrente: boolean;
  valor: number;
  descricao: string;
  acaoSugerida: AcaoSugerida;
}

export interface Parceiro {
  id: string;
  nome: string;
  iniciais: string;
  tipo: TipoParceiro;
  tipoLabel: string;
  valorAnual: number;
  proximaRenovacao?: { dias: number; label: string; urgencia: UrgenciaRenovacao };
  detalhe?: string;
  isConsolidado?: boolean;
  contagemPessoas?: number;
}

export interface PontoChartFinanceiro {
  mes: string;
  receita: number;
  custos: number;
}

export interface KpisFinanceiro {
  doacoesNoMes: number;
  custosNoMes: number;
  saldoMes: number;
  custoPorAtendimento: number;
  margem: number;
  variacao: { doacoes: number; custoPorAtendimento: number };
}

export const KPIS_FINANCEIRO_MOCK: KpisFinanceiro = {
  doacoesNoMes: 84000,
  custosNoMes: 67000,
  saldoMes: 17000,
  custoPorAtendimento: 79,
  margem: 20,
  variacao: { doacoes: 12000, custoPorAtendimento: -4 },
};

export const CHART_RECEITA_VS_CUSTOS_MOCK: PontoChartFinanceiro[] = [
  { mes: 'Mai', receita: 62000, custos: 54000 },
  { mes: 'Jun', receita: 71000, custos: 58000 },
  { mes: 'Jul', receita: 68000, custos: 61000 },
  { mes: 'Ago', receita: 76000, custos: 64000 },
  { mes: 'Set', receita: 72000, custos: 61000 },
  { mes: 'Out', receita: 84000, custos: 67000 },
];

export const DOACOES_MOCK: Doacao[] = [
  { id: 'doa1', data: '2025-10-18', doador: 'Colgate Brasil',         isRecorrente: true,  valor: 20000, descricao: 'Parceria mensal · transferência', acaoSugerida: 'recibo' },
  { id: 'doa2', data: '2025-10-17', doador: 'Maria Fernandes',        isRecorrente: true,  valor: 100,   descricao: 'PIX recorrente · mensal',          acaoSugerida: 'agradecer' },
  { id: 'doa3', data: '2025-10-17', doador: 'João Silveira',          isRecorrente: false, valor: 50,    descricao: 'PIX único',                        acaoSugerida: 'agradecer' },
  { id: 'doa4', data: '2025-10-16', doador: 'Anônimo',                isRecorrente: false, valor: 500,   descricao: 'PIX único · sem contato',          acaoSugerida: 'sem-contato' },
  { id: 'doa5', data: '2025-10-15', doador: 'Mont Blanc Comunicação', isRecorrente: false, valor: 2500,  descricao: 'Boleto · pessoa jurídica',         acaoSugerida: 'recibo' },
];

export const PARCEIROS_MOCK: Parceiro[] = [
  {
    id: 'par1', nome: 'Colgate Brasil', iniciais: 'CB',
    tipo: 'parceria-estrategica', tipoLabel: 'Parceria estratégica',
    valorAnual: 240000,
    proximaRenovacao: { dias: 65, label: 'Renovação em 65 dias', urgencia: 'iminente' },
  },
  {
    id: 'par2', nome: 'Instituto Avon', iniciais: 'IA',
    tipo: 'parceria', tipoLabel: 'Parceria',
    valorAnual: 120000,
    proximaRenovacao: { dias: 150, label: 'Renovação em mar/2026', urgencia: 'futura' },
  },
  {
    id: 'par3', nome: 'Banco Itaú', iniciais: 'BI',
    tipo: 'pontual', tipoLabel: 'Pontual semestral',
    valorAnual: 80000,
    proximaRenovacao: { dias: 90, label: 'Próxima: jan/2026', urgencia: 'futura' },
  },
  {
    id: 'par4', nome: 'Doadores pessoa física', iniciais: '',
    tipo: 'consolidado-pf', tipoLabel: 'Doadores recorrentes',
    valorAnual: 96000,
    isConsolidado: true, contagemPessoas: 347,
    detalhe: '+12 novos este mês',
  },
];