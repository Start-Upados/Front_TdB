export interface KpiData {
  label: string;
  value: string;
  valueTone?: 'default' | 'danger' | 'warning' | 'success';
  sub?: string;
  subTone?: 'default' | 'success' | 'warning' | 'danger';
}

export interface PontoMensal {
  mes: string;
  atendimentos: number;
}

export type ToneAlerta = 'danger' | 'warning' | 'info';
export type IconeAlerta = 'alerta' | 'relogio' | 'usuario';

export interface AlertaVisaoGeral {
  id: string;
  tone: ToneAlerta;
  icone: IconeAlerta;
  titulo: string;
  subtitulo: string;
  link: string;
  linkLabel: string;
}

export interface DistribuicaoPrograma {
  programa: string;
  valor: number;
  percent: number;
  cor: 'brand' | 'accent';
}

export const KPIS_VISAO_GERAL_MOCK: KpiData[] = [
  { label: 'Atendimentos no mês',     value: '847',    sub: '+11% vs setembro',    subTone: 'success' },
  { label: 'Pacientes em tratamento', value: '312',    sub: '47 na fila de espera' },
  { label: 'Dentistas ativos',        value: '1.284',  sub: 'de 1.452 cadastrados' },
  { label: 'Doações no mês',          value: 'R$ 84k', sub: '+R$ 12k vs setembro', subTone: 'success' },
];

export const GRAFICO_MENSAL_MOCK: PontoMensal[] = [
  { mes: 'Mai', atendimentos: 612 },
  { mes: 'Jun', atendimentos: 678 },
  { mes: 'Jul', atendimentos: 721 },
  { mes: 'Ago', atendimentos: 765 },
  { mes: 'Set', atendimentos: 792 },
  { mes: 'Out', atendimentos: 847 },
];

export const ALERTAS_MOCK: AlertaVisaoGeral[] = [
  {
    id: 'al1', tone: 'danger', icone: 'alerta',
    titulo: '5 solicitações Alta sem resposta há +24h',
    subtitulo: '3 do WhatsApp, 2 do site · risco de perder contato',
    link: '/dashboard/comunicacoes', linkLabel: 'Abrir Central',
  },
  {
    id: 'al2', tone: 'warning', icone: 'relogio',
    titulo: '3 pacientes na fila há +60 dias',
    subtitulo: 'Risco de evasão · sem dentista compatível na região',
    link: '/dashboard/triagens', linkLabel: 'Abrir Triagens',
  },
  {
    id: 'al3', tone: 'info', icone: 'usuario',
    titulo: '8 dentistas sem atividade há +90 dias',
    subtitulo: 'Vale enviar reengajamento ou consultar disponibilidade',
    link: '/dashboard/voluntarios', linkLabel: 'Abrir Voluntários',
  },
];

export const DISTRIBUICAO_MOCK: DistribuicaoPrograma[] = [
  { programa: 'Dentista do Bem',  valor: 576, percent: 68, cor: 'brand'  },
  { programa: 'Apolônias do Bem', valor: 271, percent: 32, cor: 'accent' },
];

export const TOTAL_MES_MOCK = 847;