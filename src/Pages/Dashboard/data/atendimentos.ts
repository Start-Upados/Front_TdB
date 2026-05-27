export type StatusAtendimento =
  | 'confirmado'
  | 'aguardando'
  | 'em-andamento'
  | 'realizado'
  | 'no-show';

export type ProgramaAtendimento = 'Dentista do Bem' | 'Apolônias do Bem' | 'Mutirão';

export interface Atendimento {
  id: string;
  data: string;        // YYYY-MM-DD
  hora: string;        // HH:MM
  duracaoMinutos: number;
  paciente: { id: string; nome: string; idade: number; iniciais: string };
  dentista: { id: string; nome: string };
  especialidade: string;
  local: string;
  programa: ProgramaAtendimento;
  status: StatusAtendimento;
}

/** Data de referência usada na apresentação. Em produção: new Date().toISOString().slice(0,10). */
export const DATA_REFERENCIA = '2025-10-21';

/** Atendimentos detalhados do dia de referência. */
export const ATENDIMENTOS_MOCK: Atendimento[] = [
  {
    id: 'a1', data: '2025-10-21', hora: '08:30', duracaoMinutos: 30,
    paciente: { id: 'p1', nome: 'João Silva',     idade: 13, iniciais: 'JS' },
    dentista: { id: 'd1', nome: 'Dra. Ana Paula' },
    especialidade: 'Endodontia', local: 'São Paulo-SP',
    programa: 'Dentista do Bem', status: 'realizado',
  },
  {
    id: 'a2', data: '2025-10-21', hora: '09:00', duracaoMinutos: 45,
    paciente: { id: 'p2', nome: 'Maria Santos',   idade: 34, iniciais: 'MS' },
    dentista: { id: 'd2', nome: 'Dr. Carlos Mendes' },
    especialidade: 'Clínico geral', local: 'Recife-PE',
    programa: 'Apolônias do Bem', status: 'aguardando',
  },
  {
    id: 'a3', data: '2025-10-21', hora: '10:30', duracaoMinutos: 60,
    paciente: { id: 'p3', nome: 'Pedro Souza',    idade: 16, iniciais: 'PS' },
    dentista: { id: 'd3', nome: 'Dra. Fernanda Lima' },
    especialidade: 'Ortodontia', local: 'Curitiba-PR',
    programa: 'Dentista do Bem', status: 'em-andamento',
  },
  {
    id: 'a4', data: '2025-10-21', hora: '14:00', duracaoMinutos: 60,
    paciente: { id: 'p4', nome: 'Ana Beatriz',    idade: 27, iniciais: 'AB' },
    dentista: { id: 'd4', nome: 'Dr. Roberto Alves' },
    especialidade: 'Periodontia', local: 'Salvador-BA',
    programa: 'Apolônias do Bem', status: 'confirmado',
  },
  {
    id: 'a5', data: '2025-10-21', hora: '16:00', duracaoMinutos: 30,
    paciente: { id: 'p5', nome: 'Lucas Pereira',  idade: 12, iniciais: 'LP' },
    dentista: { id: 'd5', nome: 'Dr. Marcos Tavares' },
    especialidade: 'Avaliação', local: 'Mutirão escola Recife-PE',
    programa: 'Mutirão', status: 'no-show',
  },
];

/** Contagens por dia da semana (em produção, vem de endpoint de agregação). */
export const CONTAGENS_SEMANA_MOCK: Record<string, number> = {
  '2025-10-17': 6,
  '2025-10-18': 4,
  '2025-10-19': 0,
  '2025-10-20': 8,
  '2025-10-21': 5,
  '2025-10-22': 7,
  '2025-10-23': 6,
};