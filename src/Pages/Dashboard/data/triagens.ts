export type Severidade = 'Alta' | 'Media' | 'Baixa';
export type Programa = 'Dentista do Bem' | 'Apolônias do Bem';
export type StatusVinculacao = 'aguardando' | 'convite-enviado';

export interface KpiData {
  label: string;
  value: string;
  valueTone?: 'default' | 'danger' | 'warning' | 'success';
  sub?: string;
  subTone?: 'default' | 'success' | 'warning' | 'danger';
}

export interface Paciente {
  id: string;
  idTriagem?: number;       // ← ADICIONAR — PK do backend Oracle
  idConviteAtivo?: number;  // ← ADICIONAR — id do convite ativo (pra cancelar/aceitar/recusar)
  nome: string;
  iniciais: string;
  idade: number;
  cidade: string;
  estado: string;
  cep: string;
  coords: { lat: number; lng: number };
  programa: Programa;
  necessidade: string;
  especialidadeNecessaria: string;
  severidade: Severidade;
  diasNaFila: number;
  origem: {
    tipo: 'central' | 'escola' | 'manual';
    detalhe: string;
  };
  statusVinculacao: StatusVinculacao;
  dentistaConvidadoId?: string;
  historicoConvites?: RespostaConvite[];
}

export interface RespostaConvite {
  dentistaId: string;
  dentistaNome: string;
  resposta: 'aceito' | 'recusado';
  dataResposta: string;        // ISO timestamp
  dataAtendimento?: string;    // YYYY-MM-DD (apenas se aceito)
  horaAtendimento?: string;    // HH:MM (apenas se aceito)
  motivoRecusa?: string;       // apenas se recusado
}

export interface Dentista { 
  id: string;
  nome: string;
  iniciais: string;
  especialidade: string;
  cidade: string;
  estado: string;
  coords: { lat: number; lng: number };
  vinculos: number;
  rating: number;
  slotsDisponiveis: number;
}

export const KPIS_TRIAGENS_MOCK: KpiData[] = [
  { label: 'Pacientes na fila',         value: '47',      sub: '+6 essa semana' },
  { label: 'Tempo médio na fila',       value: '12 dias', sub: '−2d vs mês',         subTone: 'success' },
  { label: 'Vinculações esta semana',   value: '8',       sub: '+2 vs semana',       subTone: 'success' },
  { label: 'Fila +60 dias',             value: '3',       valueTone: 'danger', sub: 'Risco de evasão', subTone: 'danger' },
];

export const PACIENTES_FILA_MOCK: Paciente[] = [
  {
    id: '1',
    nome: 'João Silva',
    iniciais: 'JS',
    idade: 13,
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04567-000',
    coords: { lat: -23.5505, lng: -46.6333 },
    programa: 'Dentista do Bem',
    necessidade: 'Tratamento de canal · dor aguda',
    especialidadeNecessaria: 'Endodontia',
    severidade: 'Alta',
    diasNaFila: 12,
    origem: { tipo: 'central', detalhe: 'WhatsApp · prioridade Alta 87%' },
    statusVinculacao: 'aguardando',
  },
  {
    id: '2',
    nome: 'Maria Santos',
    iniciais: 'MS',
    idade: 34,
    cidade: 'Recife',
    estado: 'PE',
    cep: '50050-000',
    coords: { lat: -8.0578, lng: -34.8829 },
    programa: 'Apolônias do Bem',
    necessidade: 'Reabilitação completa',
    especialidadeNecessaria: 'Clínico geral',
    severidade: 'Alta',
    diasNaFila: 68,
    origem: { tipo: 'central', detalhe: 'Site · prioridade Alta 79%' },
    statusVinculacao: 'convite-enviado',
  },
  {
    id: '3',
    nome: 'Pedro Souza',
    iniciais: 'PS',
    idade: 16,
    cidade: 'Curitiba',
    estado: 'PR',
    cep: '80060-000',
    coords: { lat: -25.4290, lng: -49.2671 },
    programa: 'Dentista do Bem',
    necessidade: 'Avaliação ortodôntica',
    especialidadeNecessaria: 'Ortodontia',
    severidade: 'Media',
    diasNaFila: 5,
    origem: { tipo: 'escola', detalhe: 'Triagem em E.M. Curitiba' },
    statusVinculacao: 'aguardando',
  },
  {
    id: '4',
    nome: 'Ana Beatriz',
    iniciais: 'AB',
    idade: 27,
    cidade: 'Salvador',
    estado: 'BA',
    cep: '40050-000',
    coords: { lat: -12.9714, lng: -38.5014 },
    programa: 'Apolônias do Bem',
    necessidade: 'Consulta inicial',
    especialidadeNecessaria: 'Clínico geral',
    severidade: 'Media',
    diasNaFila: 22,
    origem: { tipo: 'central', detalhe: 'Instagram · prioridade Média 71%' },
    statusVinculacao: 'aguardando',
  },
  {
    id: '5',
    nome: 'Lucas Pereira',
    iniciais: 'LP',
    idade: 12,
    cidade: 'Belém',
    estado: 'PA',
    cep: '66050-000',
    coords: { lat: -1.4554, lng: -48.4898 },
    programa: 'Dentista do Bem',
    necessidade: 'Avaliação inicial',
    especialidadeNecessaria: 'Clínico geral',
    severidade: 'Baixa',
    diasNaFila: 3,
    origem: { tipo: 'escola', detalhe: 'Triagem em E.M. Belém' },
    statusVinculacao: 'aguardando',
  },
];

export const DENTISTAS_MOCK: Dentista[] = [
  { id: 'd1', nome: 'Dra. Ana Paula Santos',  iniciais: 'AP', especialidade: 'Endodontia',    cidade: 'São Paulo', estado: 'SP', coords: { lat: -23.5868, lng: -46.6346 }, vinculos: 247, rating: 4.9, slotsDisponiveis: 3 },
  { id: 'd2', nome: 'Dr. Carlos Mendes',      iniciais: 'CM', especialidade: 'Clínico geral', cidade: 'São Paulo', estado: 'SP', coords: { lat: -23.5670, lng: -46.6918 }, vinculos: 198, rating: 4.8, slotsDisponiveis: 5 },
  { id: 'd3', nome: 'Dra. Fernanda Lima',     iniciais: 'FL', especialidade: 'Endodontia',    cidade: 'São Paulo', estado: 'SP', coords: { lat: -23.5526, lng: -46.5979 }, vinculos: 221, rating: 4.9, slotsDisponiveis: 1 },
  { id: 'd4', nome: 'Dr. Roberto Alves',      iniciais: 'RA', especialidade: 'Periodontia',   cidade: 'Recife',    estado: 'PE', coords: { lat: -8.1109,  lng: -34.8965 }, vinculos: 156, rating: 4.7, slotsDisponiveis: 4 },
  { id: 'd5', nome: 'Dra. Patricia Oliveira', iniciais: 'PO', especialidade: 'Clínico geral', cidade: 'Recife',    estado: 'PE', coords: { lat: -8.0335,  lng: -34.9056 }, vinculos: 89,  rating: 4.6, slotsDisponiveis: 6 },
  { id: 'd6', nome: 'Dr. Marcos Tavares',     iniciais: 'MT', especialidade: 'Ortodontia',    cidade: 'Curitiba',  estado: 'PR', coords: { lat: -25.4290, lng: -49.2671 }, vinculos: 134, rating: 4.8, slotsDisponiveis: 2 },
];