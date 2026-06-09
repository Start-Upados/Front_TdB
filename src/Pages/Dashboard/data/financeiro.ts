export type AcaoSugerida = 'agradecer' | 'recibo' | 'sem-contato';
export type TipoParceiro = 'parceria-estrategica' | 'parceria' | 'pontual' | 'consolidado-pf';
export type UrgenciaRenovacao = 'iminente' | 'futura' | 'em-negociacao';
export type CategoriaDespesa = 'Material' | 'Transporte' | 'Administrativo' | 'Equipamentos' | 'Marketing' | 'Outro';

export interface Doacao {
  id: string;
  data: string;                          // YYYY-MM-DD
  doador: string;
  isRecorrente: boolean;
  valor: number;
  descricao: string;
  acaoSugerida: AcaoSugerida;
  agradecidoEm?: string;
  reciboGeradoEm?: string;           // YYYY-MM-DD
  numeroRecibo?: string;  
}

export interface Despesa {
  id: string;
  data: string;                          // YYYY-MM-DD
  descricao: string;
  categoria: CategoriaDespesa;
  valor: number;
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
  negociacaoIniciadaEm?: string;
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

export const CATEGORIAS_DESPESA: CategoriaDespesa[] = [
  'Material', 'Transporte', 'Administrativo', 'Equipamentos', 'Marketing', 'Outro',
];

// ─── DOAÇÕES MOCK (datas espalhadas em 6 meses) ────
export const DOACOES_MOCK: Doacao[] = [
  // Junho/2026 (mês atual)
  { id: 'doa1',  data: '2026-06-07', doador: 'Colgate Brasil',         isRecorrente: true,  valor: 20000, descricao: 'Parceria mensal · transferência', acaoSugerida: 'recibo' },
  { id: 'doa2',  data: '2026-06-06', doador: 'Maria Fernandes',        isRecorrente: true,  valor: 100,   descricao: 'PIX recorrente · mensal',          acaoSugerida: 'agradecer' },
  { id: 'doa3',  data: '2026-06-05', doador: 'João Silveira',          isRecorrente: false, valor: 50,    descricao: 'PIX único',                        acaoSugerida: 'agradecer' },
  { id: 'doa4',  data: '2026-06-04', doador: 'Anônimo',                isRecorrente: false, valor: 500,   descricao: 'PIX único · sem contato',          acaoSugerida: 'sem-contato' },
  { id: 'doa5',  data: '2026-06-02', doador: 'Surya Cosméticos',       isRecorrente: false, valor: 10000, descricao: 'Doação pontual · projeto Apolônias', acaoSugerida: 'recibo' },
  { id: 'doa6',  data: '2026-06-01', doador: 'Empresa Saúde+',         isRecorrente: false, valor: 5000,  descricao: 'Boleto · pessoa jurídica',         acaoSugerida: 'recibo' },
  // Maio/2026
  { id: 'doa7',  data: '2026-05-20', doador: 'Colgate Brasil',         isRecorrente: true,  valor: 20000, descricao: 'Parceria mensal · transferência', acaoSugerida: 'recibo' },
  { id: 'doa8',  data: '2026-05-15', doador: 'Mont Blanc Comunicação', isRecorrente: false, valor: 2500,  descricao: 'Boleto · pessoa jurídica',         acaoSugerida: 'recibo' },
  { id: 'doa9',  data: '2026-05-10', doador: 'RaiaDrogasil S.A.',      isRecorrente: false, valor: 8000,  descricao: 'Patrocínio mutirão Recife',        acaoSugerida: 'recibo' },
  // Abril/2026
  { id: 'doa10', data: '2026-04-15', doador: 'Colgate Brasil',         isRecorrente: true,  valor: 20000, descricao: 'Parceria mensal · transferência', acaoSugerida: 'recibo' },
  { id: 'doa11', data: '2026-04-10', doador: 'Mol Impacto',            isRecorrente: false, valor: 8000,  descricao: 'Doação pontual',                   acaoSugerida: 'recibo' },
  { id: 'doa12', data: '2026-04-05', doador: 'Doadores PF (consolidado)', isRecorrente: true, valor: 5000, descricao: 'PIX recorrentes do mês',         acaoSugerida: 'agradecer' },
  // Março/2026
  { id: 'doa13', data: '2026-03-15', doador: 'Colgate Brasil',         isRecorrente: true,  valor: 20000, descricao: 'Parceria mensal · transferência', acaoSugerida: 'recibo' },
  { id: 'doa14', data: '2026-03-10', doador: 'Kess',                   isRecorrente: false, valor: 5000,  descricao: 'Doação institucional',             acaoSugerida: 'recibo' },
  { id: 'doa15', data: '2026-03-05', doador: 'Doadores PF (consolidado)', isRecorrente: true, valor: 4000, descricao: 'PIX recorrentes do mês',         acaoSugerida: 'agradecer' },
  // Fevereiro/2026
  { id: 'doa16', data: '2026-02-15', doador: 'Colgate Brasil',         isRecorrente: true,  valor: 20000, descricao: 'Parceria mensal · transferência', acaoSugerida: 'recibo' },
  { id: 'doa17', data: '2026-02-10', doador: 'RaiaDrogasil S.A.',      isRecorrente: false, valor: 6000,  descricao: 'Doação pontual',                   acaoSugerida: 'recibo' },
  { id: 'doa18', data: '2026-02-05', doador: 'Doadores PF (consolidado)', isRecorrente: true, valor: 5000, descricao: 'PIX recorrentes do mês',         acaoSugerida: 'agradecer' },
  // Janeiro/2026
  { id: 'doa19', data: '2026-01-15', doador: 'Colgate Brasil',         isRecorrente: true,  valor: 20000, descricao: 'Parceria mensal · transferência', acaoSugerida: 'recibo' },
  { id: 'doa20', data: '2026-01-10', doador: 'Doadores PF (consolidado)', isRecorrente: true, valor: 5000, descricao: 'PIX recorrentes do mês',         acaoSugerida: 'agradecer' },
  { id: 'doa21', data: '2026-01-05', doador: 'Empresa XYZ',            isRecorrente: false, valor: 3000,  descricao: 'Boleto pontual',                   acaoSugerida: 'recibo' },
];

// ─── DESPESAS MOCK (datas espalhadas em 6 meses) ────
export const DESPESAS_MOCK: Despesa[] = [
  // Junho/2026 (mês atual)
  { id: 'desp1', data: '2026-06-08', descricao: 'Material odontológico — kit triagem', categoria: 'Material',       valor: 8000 },
  { id: 'desp2', data: '2026-06-06', descricao: 'Combustível mutirão Recife',          categoria: 'Transporte',     valor: 2500 },
  { id: 'desp3', data: '2026-06-05', descricao: 'Aluguel sede administrativa',         categoria: 'Administrativo', valor: 5500 },
  { id: 'desp4', data: '2026-06-03', descricao: 'Manutenção equipamentos imagem',      categoria: 'Equipamentos',   valor: 3500 },
  { id: 'desp5', data: '2026-06-01', descricao: 'Campanhas digitais (Instagram Ads)',  categoria: 'Marketing',      valor: 4500 },
  // Maio/2026
  { id: 'desp6',  data: '2026-05-20', descricao: 'Material odontológico',              categoria: 'Material',       valor: 10000 },
  { id: 'desp7',  data: '2026-05-15', descricao: 'Aluguel sede administrativa',        categoria: 'Administrativo', valor: 5500 },
  { id: 'desp8',  data: '2026-05-10', descricao: 'Transporte e logística mutirões',    categoria: 'Transporte',     valor: 4000 },
  { id: 'desp9',  data: '2026-05-05', descricao: 'Equipamentos novos consultório',     categoria: 'Equipamentos',   valor: 4000 },
  { id: 'desp10', data: '2026-05-02', descricao: 'Material gráfico campanha',          categoria: 'Marketing',      valor: 1500 },
  // Abril/2026
  { id: 'desp11', data: '2026-04-15', descricao: 'Material odontológico',              categoria: 'Material',       valor: 12000 },
  { id: 'desp12', data: '2026-04-10', descricao: 'Aluguel sede administrativa',        categoria: 'Administrativo', valor: 5500 },
  { id: 'desp13', data: '2026-04-05', descricao: 'Logística mutirões',                 categoria: 'Transporte',     valor: 3000 },
  { id: 'desp14', data: '2026-04-02', descricao: 'Marketing digital',                  categoria: 'Marketing',      valor: 5500 },
  // Março/2026
  { id: 'desp15', data: '2026-03-15', descricao: 'Material e insumos',                 categoria: 'Material',       valor: 9000 },
  { id: 'desp16', data: '2026-03-10', descricao: 'Aluguel sede',                       categoria: 'Administrativo', valor: 5500 },
  { id: 'desp17', data: '2026-03-05', descricao: 'Combustível e transporte',           categoria: 'Transporte',     valor: 2500 },
  { id: 'desp18', data: '2026-03-01', descricao: 'Manutenção predial',                 categoria: 'Outro',          valor: 6000 },
  // Fevereiro/2026
  { id: 'desp19', data: '2026-02-15', descricao: 'Material e insumos',                 categoria: 'Material',       valor: 10000 },
  { id: 'desp20', data: '2026-02-10', descricao: 'Aluguel sede',                       categoria: 'Administrativo', valor: 5500 },
  { id: 'desp21', data: '2026-02-05', descricao: 'Logística e transporte',             categoria: 'Transporte',     valor: 3500 },
  { id: 'desp22', data: '2026-02-01', descricao: 'Equipamentos manutenção',            categoria: 'Equipamentos',   valor: 5000 },
  // Janeiro/2026
  { id: 'desp23', data: '2026-01-15', descricao: 'Material odontológico',              categoria: 'Material',       valor: 8500 },
  { id: 'desp24', data: '2026-01-10', descricao: 'Aluguel sede',                       categoria: 'Administrativo', valor: 5500 },
  { id: 'desp25', data: '2026-01-05', descricao: 'Logística mutirões',                 categoria: 'Transporte',     valor: 3000 },
  { id: 'desp26', data: '2026-01-02', descricao: 'Marketing digital',                  categoria: 'Marketing',      valor: 5000 },
];

// ─── PARCEIROS / MANTENEDORES (5 marcas reais) ────
export const PARCEIROS_MOCK: Parceiro[] = [
  {
    id: 'par1', nome: 'Colgate Brasil', iniciais: 'CB',
    tipo: 'parceria-estrategica', tipoLabel: 'Parceria estratégica',
    valorAnual: 240000,
    proximaRenovacao: { dias: 65, label: 'Renovação em 65 dias', urgencia: 'iminente' },
  },
  {
    id: 'par2', nome: 'RaiaDrogasil S.A.', iniciais: 'RD',
    tipo: 'parceria', tipoLabel: 'Parceria',
    valorAnual: 120000,
    proximaRenovacao: { dias: 150, label: 'Renovação em nov/2026', urgencia: 'futura' },
  },
  {
    id: 'par3', nome: 'Mol Impacto', iniciais: 'MI',
    tipo: 'parceria', tipoLabel: 'Parceria',
    valorAnual: 96000,
    proximaRenovacao: { dias: 200, label: 'Renovação em jan/2027', urgencia: 'futura' },
  },
  {
    id: 'par4', nome: 'Surya Cosméticos', iniciais: 'SU',
    tipo: 'pontual', tipoLabel: 'Pontual',
    valorAnual: 60000,
    proximaRenovacao: { dias: 90, label: 'Próxima: set/2026', urgencia: 'futura' },
  },
  {
    id: 'par5', nome: 'Kess', iniciais: 'KE',
    tipo: 'pontual', tipoLabel: 'Pontual',
    valorAnual: 48000,
    proximaRenovacao: { dias: 120, label: 'Próxima: out/2026', urgencia: 'futura' },
  },
];