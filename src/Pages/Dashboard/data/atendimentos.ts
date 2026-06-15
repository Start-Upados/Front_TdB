export type StatusAtendimento =
  | 'confirmado'
  | 'aguardando'
  | 'em-andamento'
  | 'realizado'
  | 'no-show';

export type ProgramaAtendimento = 'Dentista do Bem' | 'Apolônias do Bem' | 'Mutirão';

export interface ContatoPaciente {
  whatsapp?: string;  // formato E.164 sem +, ex: '5511999999999'
  email?: string;
  telefone?: string;
}

export interface PacienteAtendimento {
  id: string;
  nome: string;
  idade: number;
  iniciais: string;
  contato?: ContatoPaciente;
}

export interface DentistaAtendimento {
  id: string;
  nome: string;
}

export interface Atendimento {
  id: string;
  idAtendimento?: number;   // PK do backend Oracle (mocks não têm)
  data: string;        // YYYY-MM-DD
  hora: string;        // HH:MM
  duracaoMinutos: number;
  paciente: PacienteAtendimento;
  dentista: DentistaAtendimento;
  especialidade: string;
  local: string;
  programa: ProgramaAtendimento;
  status: StatusAtendimento;
  observacoesPre?: string;
  observacoesPos?: string;
  proximaConsulta?: string;  // YYYY-MM-DD
  motivoNoShow?: string;
  reagendado?: boolean;
  confirmacoesEnviadas?: Array<{ canal: string; quando: string }>;
}

/** Data de referência usada na apresentação. Em produção: new Date().toISOString().slice(0,10). */
export const DATA_REFERENCIA = '2025-10-21';

/** Lista de pacientes cadastrados (usada no select de novo atendimento). */
export const PACIENTES_LISTA: PacienteAtendimento[] = [
  { id: 'p1', nome: 'João Silva',      idade: 13, iniciais: 'JS', contato: { whatsapp: '5511999990001', email: 'joao.silva@email.com',      telefone: '+551133330001' } },
  { id: 'p2', nome: 'Maria Santos',    idade: 34, iniciais: 'MS', contato: { whatsapp: '5581999990002', email: 'maria.santos@email.com',    telefone: '+558133330002' } },
  { id: 'p3', nome: 'Pedro Souza',     idade: 16, iniciais: 'PS', contato: { whatsapp: '5541999990003', email: 'pedro.souza@email.com',     telefone: '+554133330003' } },
  { id: 'p4', nome: 'Ana Beatriz',     idade: 27, iniciais: 'AB', contato: { whatsapp: '5571999990004', email: 'ana.beatriz@email.com',     telefone: '+557133330004' } },
  { id: 'p5', nome: 'Lucas Pereira',   idade: 12, iniciais: 'LP', contato: { whatsapp: '5591999990005', email: 'lucas.pereira@email.com',   telefone: '+559133330005' } },
  { id: 'p6', nome: 'Camila Oliveira', idade: 29, iniciais: 'CO', contato: { whatsapp: '5511999990006', email: 'camila.oliveira@email.com', telefone: '+551133330006' } },
  { id: 'p7', nome: 'Rafael Costa',    idade: 14, iniciais: 'RC', contato: { whatsapp: '5511999990007', email: 'rafael.costa@email.com',    telefone: '+551133330007' } },
  { id: 'p8', nome: 'Júlia Mendes',    idade: 31, iniciais: 'JM', contato: { whatsapp: '5521999990008', email: 'julia.mendes@email.com',    telefone: '+552133330008' } },
];

/** Lista de dentistas cadastrados (usada no select de novo atendimento e filtro). */
export const DENTISTAS_LISTA: Array<DentistaAtendimento & { especialidade: string; local: string }> = [
  { id: 'd1', nome: 'Dra. Ana Paula',     especialidade: 'Endodontia',    local: 'São Paulo-SP' },
  { id: 'd2', nome: 'Dr. Carlos Mendes',  especialidade: 'Clínico geral', local: 'Recife-PE' },
  { id: 'd3', nome: 'Dra. Fernanda Lima', especialidade: 'Ortodontia',    local: 'Curitiba-PR' },
  { id: 'd4', nome: 'Dr. Roberto Alves',  especialidade: 'Periodontia',   local: 'Salvador-BA' },
  { id: 'd5', nome: 'Dr. Marcos Tavares', especialidade: 'Avaliação',     local: 'Recife-PE' },
  { id: 'd6', nome: 'Dra. Patrícia Lima', especialidade: 'Clínico geral', local: 'Belo Horizonte-MG' },
];

export const ESPECIALIDADES_DISPONIVEIS = [
  'Avaliação', 'Clínico geral', 'Endodontia', 'Ortodontia',
  'Periodontia', 'Cirurgia', 'Pediatria', 'Limpeza',
];

export const REGIOES = ['Todas', 'Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'];

export const PROGRAMAS_FILTRO = ['Todos', 'Dentista do Bem', 'Apolônias do Bem', 'Mutirão'];

/** Atendimentos espalhados pela semana — semana 17/10 a 23/10. */
export const ATENDIMENTOS_MOCK: Atendimento[] = [
  // ─── DIA 17/10 (sex) — passados, realizados
  {
    id: 'a17a', data: '2025-10-17', hora: '09:00', duracaoMinutos: 45,
    paciente: { ...PACIENTES_LISTA[5] },
    dentista: { id: 'd1', nome: 'Dra. Ana Paula' },
    especialidade: 'Endodontia', local: 'São Paulo-SP',
    programa: 'Dentista do Bem', status: 'realizado',
    observacoesPos: 'Limpeza e remoção de tártaro. Sem intercorrências.',
  },
  {
    id: 'a17b', data: '2025-10-17', hora: '14:30', duracaoMinutos: 30,
    paciente: { ...PACIENTES_LISTA[6] },
    dentista: { id: 'd3', nome: 'Dra. Fernanda Lima' },
    especialidade: 'Ortodontia', local: 'Curitiba-PR',
    programa: 'Dentista do Bem', status: 'realizado',
    observacoesPos: 'Ajuste de aparelho. Próxima visita em 30 dias.',
    proximaConsulta: '2025-11-17',
  },

  // ─── DIA 18/10 (sáb)
  {
    id: 'a18a', data: '2025-10-18', hora: '10:00', duracaoMinutos: 60,
    paciente: { ...PACIENTES_LISTA[7] },
    dentista: { id: 'd4', nome: 'Dr. Roberto Alves' },
    especialidade: 'Periodontia', local: 'Salvador-BA',
    programa: 'Apolônias do Bem', status: 'realizado',
  },

  // ─── DIA 20/10 (seg)
  {
    id: 'a20a', data: '2025-10-20', hora: '08:30', duracaoMinutos: 30,
    paciente: { ...PACIENTES_LISTA[0] },
    dentista: { id: 'd1', nome: 'Dra. Ana Paula' },
    especialidade: 'Endodontia', local: 'São Paulo-SP',
    programa: 'Dentista do Bem', status: 'realizado',
  },
  {
    id: 'a20b', data: '2025-10-20', hora: '11:00', duracaoMinutos: 30,
    paciente: { ...PACIENTES_LISTA[1] },
    dentista: { id: 'd2', nome: 'Dr. Carlos Mendes' },
    especialidade: 'Clínico geral', local: 'Recife-PE',
    programa: 'Apolônias do Bem', status: 'no-show',
    motivoNoShow: 'Não respondeu confirmação',
  },

  // ─── DIA 21/10 (HOJE)
  {
    id: 'a1', data: '2025-10-21', hora: '08:30', duracaoMinutos: 30,
    paciente: { ...PACIENTES_LISTA[0] },
    dentista: { id: 'd1', nome: 'Dra. Ana Paula' },
    especialidade: 'Endodontia', local: 'São Paulo-SP',
    programa: 'Dentista do Bem', status: 'realizado',
    observacoesPos: 'Tratamento de canal finalizado com sucesso. Retorno agendado para 30 dias.',
    proximaConsulta: '2025-11-20',
  },
  {
    id: 'a2', data: '2025-10-21', hora: '09:00', duracaoMinutos: 45,
    paciente: { ...PACIENTES_LISTA[1] },
    dentista: { id: 'd2', nome: 'Dr. Carlos Mendes' },
    especialidade: 'Clínico geral', local: 'Recife-PE',
    programa: 'Apolônias do Bem', status: 'aguardando',
  },
  {
    id: 'a3', data: '2025-10-21', hora: '10:30', duracaoMinutos: 60,
    paciente: { ...PACIENTES_LISTA[2] },
    dentista: { id: 'd3', nome: 'Dra. Fernanda Lima' },
    especialidade: 'Ortodontia', local: 'Curitiba-PR',
    programa: 'Dentista do Bem', status: 'em-andamento',
  },
  {
    id: 'a4', data: '2025-10-21', hora: '14:00', duracaoMinutos: 60,
    paciente: { ...PACIENTES_LISTA[3] },
    dentista: { id: 'd4', nome: 'Dr. Roberto Alves' },
    especialidade: 'Periodontia', local: 'Salvador-BA',
    programa: 'Apolônias do Bem', status: 'confirmado',
    confirmacoesEnviadas: [
      { canal: 'WhatsApp', quando: '20/10 às 18:30' },
      { canal: 'Email',    quando: '21/10 às 08:00' },
    ],
  },
  {
    id: 'a5', data: '2025-10-21', hora: '16:00', duracaoMinutos: 30,
    paciente: { ...PACIENTES_LISTA[4] },
    dentista: { id: 'd5', nome: 'Dr. Marcos Tavares' },
    especialidade: 'Avaliação', local: 'Mutirão escola Recife-PE',
    programa: 'Mutirão', status: 'no-show',
    motivoNoShow: 'Não compareceu sem aviso',
  },

  // ─── DIA 22/10 (qua) — futuros
  {
    id: 'a22a', data: '2025-10-22', hora: '09:00', duracaoMinutos: 45,
    paciente: { ...PACIENTES_LISTA[3] },
    dentista: { id: 'd4', nome: 'Dr. Roberto Alves' },
    especialidade: 'Periodontia', local: 'Salvador-BA',
    programa: 'Apolônias do Bem', status: 'confirmado',
  },
  {
    id: 'a22b', data: '2025-10-22', hora: '15:00', duracaoMinutos: 60,
    paciente: { ...PACIENTES_LISTA[2] },
    dentista: { id: 'd3', nome: 'Dra. Fernanda Lima' },
    especialidade: 'Ortodontia', local: 'Curitiba-PR',
    programa: 'Dentista do Bem', status: 'aguardando',
  },

  // ─── DIA 23/10 (qui) — futuros
  {
    id: 'a23a', data: '2025-10-23', hora: '10:00', duracaoMinutos: 30,
    paciente: { ...PACIENTES_LISTA[6] },
    dentista: { id: 'd5', nome: 'Dr. Marcos Tavares' },
    especialidade: 'Avaliação', local: 'Recife-PE',
    programa: 'Mutirão', status: 'confirmado',
  },
  {
    id: 'a23b', data: '2025-10-23', hora: '14:00', duracaoMinutos: 30,
    paciente: { ...PACIENTES_LISTA[5] },
    dentista: { id: 'd1', nome: 'Dra. Ana Paula' },
    especialidade: 'Endodontia', local: 'São Paulo-SP',
    programa: 'Dentista do Bem', status: 'aguardando',
  },
];

/** Contagens por dia da semana — sincronizadas com ATENDIMENTOS_MOCK. */
export const CONTAGENS_SEMANA_MOCK: Record<string, number> = {
  '2025-10-17': 2,
  '2025-10-18': 1,
  '2025-10-19': 0,
  '2025-10-20': 2,
  '2025-10-21': 5,
  '2025-10-22': 2,
  '2025-10-23': 2,
};

/** Mapa de UF brasileira → região. */
const REGIAO_POR_UF: Record<string, string> = {
  AC: 'Norte', AM: 'Norte', AP: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste',
  PB: 'Nordeste', PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul',
};

/** Extrai a região a partir de uma string de localização "Cidade-UF". */
export function regiaoDoLocal(local: string): string {
  const m = local.match(/-([A-Z]{2})(?:$|\s|\b)/);
  return m ? REGIAO_POR_UF[m[1]] ?? '' : '';
}