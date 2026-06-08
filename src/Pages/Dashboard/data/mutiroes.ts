export type TipoMutirao = 'Triagem em escola' | 'Atendimento em comunidade';
export type ProgramaMutirao = 'Dentista do Bem' | 'Apolônias do Bem';
export type StatusMutirao = 'pronto' | 'em-preparacao' | 'atencao' | 'realizado';

export type StatusConvite = 'pendente' | 'confirmado' | 'recusado';

export interface VoluntarioConvocado {
  dentistaId: string;
  nome: string;
  iniciais: string;
  especialidade: string;
  cidade: string;
  estado: string;
  convocadoEm: string;        // YYYY-MM-DD
  status: StatusConvite;
}

export interface PacienteConfirmado {
  pacienteCpf: string;       // CPF do paciente
  nome: string;
  iniciais: string;
  cidade: string;            // snapshot da cidade na hora da confirmação
  confirmadoEm: string;      // YYYY-MM-DD
}

export interface EstatisticasMutirao {
  pacientesAtendidos: number;
  vinculosCriados: number;
  taxaComparecimento: number;        // %
  duracaoEfetivaHoras: number;
  porEspecialidade: Array<{ especialidade: string; quantidade: number }>;
}

export interface Mutirao {
  id: string;
  nome?: string;                     // opcional, default = local
  data: string;                      // YYYY-MM-DD
  horaInicio: string;                // HH:MM
  horaFim: string;                   // HH:MM
  horario: string;                   // string formatada (ex: "09h às 17h")
  local: string;
  endereco?: string;
  cidade: string;
  estado: string;
  cep?: string;
  tipo: TipoMutirao;
  programa: ProgramaMutirao;
  publicoAlvo?: string;
  especialidades: string[];
  observacoes?: string;
  status: StatusMutirao;
  dentistasConfirmados: number;
  dentistasNecessarios: number;
  pacientesEsperados: number;
  voluntariosConvocados: VoluntarioConvocado[];
  pacientesConfirmados?: PacienteConfirmado[];
  // Para mutirões realizados:
  atendimentosRealizados?: number;
  encaminhamentos?: number;
  estatisticas?: EstatisticasMutirao;
}

export const ESPECIALIDADES_MUTIRAO = [
  'Clínico geral',
  'Endodontia',
  'Ortodontia',
  'Periodontia',
  'Implantodontia',
  'Odontopediatria',
  'Cirurgia bucal',
] as const;

export const MUTIROES_MOCK: Mutirao[] = [
  // ─── Próximos ─────────────────────────────────────
  {
    id: 'm1',
    nome: 'Triagem E.M. Maria Silva',
    data: '2025-10-26', horaInicio: '09:00', horaFim: '17:00', horario: '09h às 17h',
    local: 'E.M. Profa. Maria Silva',
    endereco: 'Rua das Acácias, 142 — Boa Viagem',
    cidade: 'Recife', estado: 'PE', cep: '51020-000',
    tipo: 'Triagem em escola', programa: 'Apolônias do Bem',
    publicoAlvo: 'Mulheres atendidas pela rede de proteção da prefeitura',
    especialidades: ['Clínico geral', 'Periodontia'],
    observacoes: 'Levar kit de higiene bucal para distribuição. Apoio da rede social Vila Nova.',
    status: 'pronto',
    dentistasConfirmados: 5, dentistasNecessarios: 5, pacientesEsperados: 40,
    voluntariosConvocados: [
      { dentistaId: 'd8', nome: 'Dra. Beatriz Castro', iniciais: 'BC', especialidade: 'Clínico geral', cidade: 'Recife', estado: 'PE', convocadoEm: '2025-10-10', status: 'confirmado' },
    ],
  },
  {
    id: 'm2',
    nome: 'Atendimento Vila Nova',
    data: '2025-11-02', horaInicio: '08:00', horaFim: '16:00', horario: '08h às 16h',
    local: 'Centro Social Vila Nova',
    endereco: 'Av. Brigadeiro Faria Lima, 1500',
    cidade: 'São Paulo', estado: 'SP', cep: '01451-001',
    tipo: 'Atendimento em comunidade', programa: 'Dentista do Bem',
    publicoAlvo: 'Crianças e adolescentes de 11 a 17 anos do bairro',
    especialidades: ['Clínico geral', 'Endodontia', 'Odontopediatria'],
    status: 'em-preparacao',
    dentistasConfirmados: 3, dentistasNecessarios: 5, pacientesEsperados: 60,
    voluntariosConvocados: [
      { dentistaId: 'd1', nome: 'Dra. Ana Paula Santos', iniciais: 'AP', especialidade: 'Endodontia', cidade: 'São Paulo', estado: 'SP', convocadoEm: '2025-10-15', status: 'confirmado' },
      { dentistaId: 'd2', nome: 'Dr. Carlos Mendes',     iniciais: 'CM', especialidade: 'Clínico geral', cidade: 'São Paulo', estado: 'SP', convocadoEm: '2025-10-15', status: 'confirmado' },
    ],
  },
  {
    id: 'm3',
    nome: 'Praça Central de Belém',
    data: '2025-11-09', horaInicio: '08:00', horaFim: '18:00', horario: '08h às 18h',
    local: 'Praça Central de Belém',
    endereco: 'Praça da República, s/n — Centro',
    cidade: 'Belém', estado: 'PA',
    tipo: 'Atendimento em comunidade', programa: 'Dentista do Bem',
    publicoAlvo: 'Atendimento aberto à comunidade local',
    especialidades: ['Clínico geral', 'Cirurgia bucal'],
    observacoes: 'Apoio logístico da Defensoria Pública.',
    status: 'atencao',
    dentistasConfirmados: 2, dentistasNecessarios: 8, pacientesEsperados: 100,
    voluntariosConvocados: [],
  },
  // ─── Realizados ───────────────────────────────────
  {
    id: 'm4',
    nome: 'Triagem E.M. José Souza',
    data: '2025-10-12', horaInicio: '08:00', horaFim: '16:00', horario: '08h às 16h',
    local: 'E.M. José Souza',
    cidade: 'Curitiba', estado: 'PR',
    tipo: 'Triagem em escola', programa: 'Dentista do Bem',
    especialidades: ['Clínico geral'],
    status: 'realizado',
    dentistasConfirmados: 4, dentistasNecessarios: 4, pacientesEsperados: 50,
    voluntariosConvocados: [],
    atendimentosRealizados: 47, encaminhamentos: 12,
    estatisticas: {
      pacientesAtendidos: 47, vinculosCriados: 12, taxaComparecimento: 94, duracaoEfetivaHoras: 7.5,
      porEspecialidade: [{ especialidade: 'Clínico geral', quantidade: 47 }],
    },
  },
  {
    id: 'm5',
    nome: 'Centro Comunitário Sudeste',
    data: '2025-09-28', horaInicio: '09:00', horaFim: '17:00', horario: '09h às 17h',
    local: 'Centro Comunitário Sudeste',
    cidade: 'Salvador', estado: 'BA',
    tipo: 'Atendimento em comunidade', programa: 'Apolônias do Bem',
    especialidades: ['Clínico geral', 'Periodontia'],
    status: 'realizado',
    dentistasConfirmados: 6, dentistasNecessarios: 6, pacientesEsperados: 45,
    voluntariosConvocados: [],
    atendimentosRealizados: 38, encaminhamentos: 8,
    estatisticas: {
      pacientesAtendidos: 38, vinculosCriados: 8, taxaComparecimento: 84, duracaoEfetivaHoras: 7.0,
      porEspecialidade: [
        { especialidade: 'Clínico geral', quantidade: 28 },
        { especialidade: 'Periodontia',   quantidade: 10 },
      ],
    },
  },
  {
    id: 'm6',
    nome: 'Praça da Estação',
    data: '2025-09-14', horaInicio: '08:00', horaFim: '18:00', horario: '08h às 18h',
    local: 'Praça da Estação',
    cidade: 'Belo Horizonte', estado: 'MG',
    tipo: 'Atendimento em comunidade', programa: 'Dentista do Bem',
    especialidades: ['Clínico geral', 'Cirurgia bucal'],
    status: 'realizado',
    dentistasConfirmados: 7, dentistasNecessarios: 7, pacientesEsperados: 60,
    voluntariosConvocados: [],
    atendimentosRealizados: 52, encaminhamentos: 15,
    estatisticas: {
      pacientesAtendidos: 52, vinculosCriados: 15, taxaComparecimento: 87, duracaoEfetivaHoras: 9.0,
      porEspecialidade: [
        { especialidade: 'Clínico geral',   quantidade: 32 },
        { especialidade: 'Cirurgia bucal',  quantidade: 20 },
      ],
    },
  },
];