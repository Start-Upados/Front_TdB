export type PeriodoRelatorio = 'mes' | 'trimestre' | 'ano' | 'personalizado';
export type PublicoRelatorio = 'doador' | 'parceiro' | 'ods' | 'interno';

export interface OpcoesRelatorio {
  periodo: PeriodoRelatorio;
  publico: PublicoRelatorio;
}

export interface KpisImpacto {
  sorrisosTransformados: number;
  jovensBeneficiados: number;
  mulheresAcolhidas: number;
  municipiosAlcancados: number;
  metaAnual: number;
  novosMunicipiosVsAnoPassado: number;
}

export interface ODS {
  numero: 3 | 4 | 5 | 10;
  cor: string;
  nome: string;
  metrica: string;
  contribuicao: string;
}

export interface RelatorioGerado {
  id: string;
  titulo: string;
  publico: string;
  geradoEm: string;
  paginas: number;
}

export const KPIS_IMPACTO_MOCK: KpisImpacto = {
  sorrisosTransformados: 8247,
  jovensBeneficiados: 5694,
  mulheresAcolhidas: 847,
  municipiosAlcancados: 142,
  metaAnual: 9000,
  novosMunicipiosVsAnoPassado: 18,
};

export const ODS_MOCK: ODS[] = [
  { numero: 3,  cor: '#4C9F38', nome: 'Saúde',        metrica: '8.247', contribuicao: 'atendimentos gratuitos'  },
  { numero: 4,  cor: '#C5192D', nome: 'Educação',     metrica: '5.694', contribuicao: 'jovens em idade escolar' },
  { numero: 5,  cor: '#FF3A21', nome: 'Igualdade',    metrica: '847',   contribuicao: 'mulheres acolhidas'      },
  { numero: 10, cor: '#DD1367', nome: 'Desigualdade', metrica: '100%',  contribuicao: 'vulnerabilidade social'  },
];

export const RELATORIOS_GERADOS_MOCK: RelatorioGerado[] = [
  { id: 'r1', titulo: 'Relatório anual 2024',              publico: 'Versão para doador',   geradoEm: '18 jan 2025', paginas: 32 },
  { id: 'r2', titulo: 'Relatório Q3/2025',                 publico: 'Versão para parceiro', geradoEm: '5 out 2025',  paginas: 18 },
  { id: 'r3', titulo: 'Relatório personalizado · Colgate', publico: 'Versão para parceiro', geradoEm: '22 set 2025', paginas: 14 },
  { id: 'r4', titulo: 'Relatório ODS · Instituto Avon',    publico: 'ODS / ESG',            geradoEm: '12 ago 2025', paginas: 22 },
];