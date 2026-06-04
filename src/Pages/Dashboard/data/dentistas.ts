export type Regiao = 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte';
export type StatusDentista = 'Ativa' | 'Inativo' | 'Pendente' | 'Suspensa' | 'Rejeitado';
export type ProgramaTdB = 'Dentista do Bem' | 'Apolônias do Bem';

export interface PacienteResumo {
  id: string;
  nome: string;
  idade: number;
  iniciais: string;
  programa: ProgramaTdB;
  tratamento: string;
  atendimentos: number;
  diasVinculado: number;
  status: 'em-andamento' | 'aguardando' | 'concluido';
}

export interface UltimoAtendimento {
  paciente: string;
  descricao: string;
  data: string;
}

export interface DisponibilidadeDia {
  dia: 'seg' | 'ter' | 'qua' | 'qui' | 'sex';
  ocupados: number;
  total: number;
  livre: boolean;
}

export interface RegistroSuspensao {
  data: string;      // YYYY-MM-DD
  motivo: string;
  observacao?: string;
}

export interface DentistaCompleto {
  id: string;
  nome: string;
  iniciais: string;
  cro: string;
  especialidade: string;
  tags: string[];
  cidade: string;
  estado: string;
  bairro?: string;
  regiao: Regiao;
  status: StatusDentista;
  vinculosTotal: number;
  vinculosAtivos: number;
  atendimentosNoAno: number;
  rating: number;
  ratingCount: number;
  taxaComparecimento: number;
  ultimaAtividadeDias: number;
  voluntariaDesde: string;
  anosNaRede: number;
  programas: ProgramaTdB[];
  pacientesAtivos: PacienteResumo[];
  disponibilidadeSemana: DisponibilidadeDia[];
  ultimosAtendimentos: UltimoAtendimento[];
  horarioConfigurado: string;
  proximoSlot?: string;
  historicoSuspensoes?: RegistroSuspensao[];
}

export const DENTISTAS: DentistaCompleto[] = [
  // ─── Pendentes de aprovação ──────────────────────
  {
    id: 'pend-1', nome: 'Dr. Eduardo Nunes', iniciais: 'EN', cro: 'CRO-CE 28471',
    especialidade: 'Implantodontia', tags: [],
    cidade: 'Fortaleza', estado: 'CE', regiao: 'Nordeste',
    status: 'Pendente',
    vinculosTotal: 0, vinculosAtivos: 0, atendimentosNoAno: 0, rating: 0, ratingCount: 0,
    taxaComparecimento: 0, ultimaAtividadeDias: 1,
    voluntariaDesde: 'pendente', anosNaRede: 0,
    programas: ['Dentista do Bem'],
    pacientesAtivos: [], disponibilidadeSemana: [], ultimosAtendimentos: [],
    horarioConfigurado: 'não configurado',
  },
  {
    id: 'pend-2', nome: 'Dr. Luis Felipe Souza', iniciais: 'LF', cro: 'CRO-MG 41203',
    especialidade: 'Endodontia', tags: [],
    cidade: 'Belo Horizonte', estado: 'MG', regiao: 'Sudeste',
    status: 'Pendente',
    vinculosTotal: 0, vinculosAtivos: 0, atendimentosNoAno: 0, rating: 0, ratingCount: 0,
    taxaComparecimento: 0, ultimaAtividadeDias: 2,
    voluntariaDesde: 'pendente', anosNaRede: 0,
    programas: ['Dentista do Bem'],
    pacientesAtivos: [], disponibilidadeSemana: [], ultimosAtendimentos: [],
    horarioConfigurado: 'não configurado',
  },
  {
    id: 'pend-3', nome: 'Dra. Camila Rocha', iniciais: 'CR', cro: 'CRO-PR 19548',
    especialidade: 'Ortodontia', tags: [],
    cidade: 'Curitiba', estado: 'PR', regiao: 'Sul',
    status: 'Pendente',
    vinculosTotal: 0, vinculosAtivos: 0, atendimentosNoAno: 0, rating: 0, ratingCount: 0,
    taxaComparecimento: 0, ultimaAtividadeDias: 5,
    voluntariaDesde: 'pendente', anosNaRede: 0,
    programas: ['Dentista do Bem', 'Apolônias do Bem'],
    pacientesAtivos: [], disponibilidadeSemana: [], ultimosAtendimentos: [],
    horarioConfigurado: 'não configurado',
  },

  // ─── Ativos (Sudeste) ────────────────────────────
  {
    id: 'd1', nome: 'Dra. Ana Paula Santos', iniciais: 'AP', cro: 'CRO-SP 56342',
    especialidade: 'Endodontia', tags: ['Trauma dental', 'Endodontia'],
    cidade: 'São Paulo', estado: 'SP', bairro: 'Vila Mariana', regiao: 'Sudeste',
    status: 'Ativa',
    vinculosTotal: 247, vinculosAtivos: 12, atendimentosNoAno: 89,
    rating: 4.9, ratingCount: 47, taxaComparecimento: 91, ultimaAtividadeDias: 2,
    voluntariaDesde: 'março de 2018', anosNaRede: 7,
    programas: ['Dentista do Bem', 'Apolônias do Bem'],
    pacientesAtivos: [
      { id: 'p1', nome: 'João Silva',       idade: 13, iniciais: 'JS', programa: 'Dentista do Bem',  tratamento: 'Tratamento de canal',     atendimentos: 3, diasVinculado: 14,  status: 'em-andamento' },
      { id: 'p2', nome: 'Carla Souza',      idade: 28, iniciais: 'CS', programa: 'Apolônias do Bem', tratamento: 'Reabilitação completa',   atendimentos: 8, diasVinculado: 120, status: 'em-andamento' },
      { id: 'p3', nome: 'Pedro Alves',      idade: 16, iniciais: 'PA', programa: 'Dentista do Bem',  tratamento: 'Trauma dental',           atendimentos: 2, diasVinculado: 30,  status: 'aguardando'   },
      { id: 'p4', nome: 'Marina Ferreira',  idade: 12, iniciais: 'MF', programa: 'Dentista do Bem',  tratamento: 'Endodontia',              atendimentos: 1, diasVinculado: 8,   status: 'em-andamento' },
    ],
    disponibilidadeSemana: [
      { dia: 'seg', ocupados: 3, total: 3, livre: false },
      { dia: 'ter', ocupados: 2, total: 3, livre: false },
      { dia: 'qua', ocupados: 0, total: 0, livre: true  },
      { dia: 'qui', ocupados: 2, total: 3, livre: false },
      { dia: 'sex', ocupados: 1, total: 3, livre: false },
    ],
    ultimosAtendimentos: [
      { paciente: 'João Silva',      descricao: 'Canal · sessão 3 de 4', data: 'hoje, 08:30' },
      { paciente: 'Marina Ferreira', descricao: 'Avaliação inicial',     data: '18/10'       },
      { paciente: 'Carla Souza',     descricao: 'Retorno · prótese',     data: '15/10'       },
    ],
    horarioConfigurado: '14h–18h · Seg, Ter, Qui, Sex',
    proximoSlot: 'qui 23/10, 16h00',
  },
  {
    id: 'd2', nome: 'Dr. Carlos Mendes', iniciais: 'CM', cro: 'CRO-SP 42198',
    especialidade: 'Clínico geral', tags: ['Clínico geral'],
    cidade: 'São Paulo', estado: 'SP', bairro: 'Pinheiros', regiao: 'Sudeste',
    status: 'Ativa',
    vinculosTotal: 198, vinculosAtivos: 8, atendimentosNoAno: 76,
    rating: 4.8, ratingCount: 38, taxaComparecimento: 88, ultimaAtividadeDias: 5,
    voluntariaDesde: 'maio de 2019', anosNaRede: 6,
    programas: ['Dentista do Bem'],
    pacientesAtivos: [], disponibilidadeSemana: [], ultimosAtendimentos: [],
    horarioConfigurado: '08h–12h · Ter, Qua, Sex',
  },
  {
    id: 'd3', nome: 'Dra. Fernanda Lima', iniciais: 'FL', cro: 'CRO-RJ 31582',
    especialidade: 'Endodontia', tags: ['Endodontia'],
    cidade: 'Rio de Janeiro', estado: 'RJ', regiao: 'Sudeste',
    status: 'Ativa',
    vinculosTotal: 221, vinculosAtivos: 10, atendimentosNoAno: 84,
    rating: 4.9, ratingCount: 42, taxaComparecimento: 93, ultimaAtividadeDias: 1,
    voluntariaDesde: 'agosto de 2017', anosNaRede: 8,
    programas: ['Dentista do Bem', 'Apolônias do Bem'],
    pacientesAtivos: [], disponibilidadeSemana: [], ultimosAtendimentos: [],
    horarioConfigurado: '15h–19h · Seg, Qua, Sex',
  },
  {
    id: 'd4', nome: 'Dra. Patricia Oliveira', iniciais: 'PO', cro: 'CRO-MG 38217',
    especialidade: 'Ortodontia', tags: ['Ortodontia'],
    cidade: 'Belo Horizonte', estado: 'MG', regiao: 'Sudeste',
    status: 'Ativa',
    vinculosTotal: 89, vinculosAtivos: 6, atendimentosNoAno: 42,
    rating: 4.6, ratingCount: 24, taxaComparecimento: 86, ultimaAtividadeDias: 7,
    voluntariaDesde: 'janeiro de 2022', anosNaRede: 3,
    programas: ['Dentista do Bem'],
    pacientesAtivos: [], disponibilidadeSemana: [], ultimosAtendimentos: [],
    horarioConfigurado: '14h–17h · Ter, Qui',
  },
  {
    id: 'd5', nome: 'Dr. Roberto Alves', iniciais: 'RA', cro: 'CRO-SP 28934',
    especialidade: 'Periodontia', tags: ['Periodontia'],
    cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste',
    status: 'Inativo',
    vinculosTotal: 156, vinculosAtivos: 0, atendimentosNoAno: 23,
    rating: 4.7, ratingCount: 31, taxaComparecimento: 84, ultimaAtividadeDias: 95,
    voluntariaDesde: 'fevereiro de 2016', anosNaRede: 9,
    programas: ['Dentista do Bem'],
    pacientesAtivos: [], disponibilidadeSemana: [], ultimosAtendimentos: [],
    horarioConfigurado: 'sem agenda configurada',
  },

  // ─── Outras regiões ──────────────────────────────
  {
    id: 'd6', nome: 'Dr. Marcos Tavares', iniciais: 'MT', cro: 'CRO-PR 19284',
    especialidade: 'Clínico geral', tags: [],
    cidade: 'Curitiba', estado: 'PR', regiao: 'Sul',
    status: 'Inativo',
    vinculosTotal: 134, vinculosAtivos: 0, atendimentosNoAno: 12,
    rating: 4.8, ratingCount: 28, taxaComparecimento: 89, ultimaAtividadeDias: 110,
    voluntariaDesde: 'junho de 2019', anosNaRede: 6,
    programas: ['Dentista do Bem'],
    pacientesAtivos: [], disponibilidadeSemana: [], ultimosAtendimentos: [],
    horarioConfigurado: 'sem agenda configurada',
  },
  {
    id: 'd7', nome: 'Dr. Paulo Vieira', iniciais: 'PV', cro: 'CRO-RS 24871',
    especialidade: 'Implantodontia', tags: [],
    cidade: 'Porto Alegre', estado: 'RS', regiao: 'Sul',
    status: 'Ativa',
    vinculosTotal: 112, vinculosAtivos: 7, atendimentosNoAno: 56,
    rating: 4.7, ratingCount: 22, taxaComparecimento: 90, ultimaAtividadeDias: 3,
    voluntariaDesde: 'novembro de 2020', anosNaRede: 5,
    programas: ['Dentista do Bem', 'Apolônias do Bem'],
    pacientesAtivos: [], disponibilidadeSemana: [], ultimosAtendimentos: [],
    horarioConfigurado: '09h–13h · Seg, Qua, Sex',
  },
  {
    id: 'd8', nome: 'Dra. Beatriz Castro', iniciais: 'BC', cro: 'CRO-PE 17456',
    especialidade: 'Clínico geral', tags: [],
    cidade: 'Recife', estado: 'PE', regiao: 'Nordeste',
    status: 'Ativa',
    vinculosTotal: 73, vinculosAtivos: 5, atendimentosNoAno: 38,
    rating: 4.8, ratingCount: 19, taxaComparecimento: 92, ultimaAtividadeDias: 4,
    voluntariaDesde: 'julho de 2021', anosNaRede: 4,
    programas: ['Apolônias do Bem'],
    pacientesAtivos: [], disponibilidadeSemana: [], ultimosAtendimentos: [],
    horarioConfigurado: '14h–18h · Seg, Ter, Qui',
  },
  {
    id: 'd9', nome: 'Dr. Henrique Lopes', iniciais: 'HL', cro: 'CRO-BA 22618',
    especialidade: 'Ortodontia', tags: [],
    cidade: 'Salvador', estado: 'BA', regiao: 'Nordeste',
    status: 'Ativa',
    vinculosTotal: 96, vinculosAtivos: 4, atendimentosNoAno: 41,
    rating: 4.7, ratingCount: 25, taxaComparecimento: 87, ultimaAtividadeDias: 8,
    voluntariaDesde: 'março de 2020', anosNaRede: 5,
    programas: ['Dentista do Bem'],
    pacientesAtivos: [], disponibilidadeSemana: [], ultimosAtendimentos: [],
    horarioConfigurado: '15h–19h · Ter, Qui, Sex',
  },
];

// Agregados "do back-end" para os mini-cards regionais e KPIs (representam toda a rede)
export const DISTRIBUICAO_REGIONAL: Record<Regiao, { count: number; percent: number }> = {
  'Sudeste':       { count: 612, percent: 48 },
  'Sul':           { count: 287, percent: 22 },
  'Nordeste':      { count: 198, percent: 15 },
  'Centro-Oeste':  { count: 124, percent: 10 },
  'Norte':         { count: 63,  percent: 5  },
};

export interface KpiData {
  label: string;
  value: string | number;
  valueTone?: 'default' | 'danger' | 'warning' | 'success';
  sub?: string;
  subTone?: 'default' | 'success' | 'warning' | 'danger';
}