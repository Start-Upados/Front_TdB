export type TipoMutirao = 'Triagem em escola' | 'Atendimento em comunidade';
export type ProgramaMutirao = 'Dentista do Bem' | 'Apolônias do Bem';
export type StatusMutirao = 'pronto' | 'em-preparacao' | 'atencao' | 'realizado';

export interface Mutirao {
  id: string;
  data: string;       // YYYY-MM-DD
  local: string;
  cidade: string;
  estado: string;
  tipo: TipoMutirao;
  programa: ProgramaMutirao;
  horario: string;
  status: StatusMutirao;
  dentistasConfirmados: number;
  dentistasNecessarios: number;
  pacientesEsperados: number;
  atendimentosRealizados?: number;
  encaminhamentos?: number;
}

export const MUTIROES_MOCK: Mutirao[] = [
  // ─── Próximos ─────────────────────────────────────
  {
    id: 'm1', data: '2025-10-26',
    local: 'E.M. Profa. Maria Silva', cidade: 'Recife', estado: 'PE',
    tipo: 'Triagem em escola', programa: 'Apolônias do Bem',
    horario: '09h às 17h', status: 'pronto',
    dentistasConfirmados: 5, dentistasNecessarios: 5, pacientesEsperados: 40,
  },
  {
    id: 'm2', data: '2025-11-02',
    local: 'Centro Social Vila Nova', cidade: 'São Paulo', estado: 'SP',
    tipo: 'Atendimento em comunidade', programa: 'Dentista do Bem',
    horario: '08h às 16h', status: 'em-preparacao',
    dentistasConfirmados: 3, dentistasNecessarios: 5, pacientesEsperados: 60,
  },
  {
    id: 'm3', data: '2025-11-09',
    local: 'Praça Central de Belém', cidade: 'Belém', estado: 'PA',
    tipo: 'Atendimento em comunidade', programa: 'Dentista do Bem',
    horario: '08h às 18h', status: 'atencao',
    dentistasConfirmados: 2, dentistasNecessarios: 8, pacientesEsperados: 100,
  },
  // ─── Realizados ───────────────────────────────────
  {
    id: 'm4', data: '2025-10-12',
    local: 'E.M. José Souza', cidade: 'Curitiba', estado: 'PR',
    tipo: 'Triagem em escola', programa: 'Dentista do Bem',
    horario: '08h às 16h', status: 'realizado',
    dentistasConfirmados: 4, dentistasNecessarios: 4, pacientesEsperados: 50,
    atendimentosRealizados: 47, encaminhamentos: 12,
  },
  {
    id: 'm5', data: '2025-09-28',
    local: 'Centro Comunitário Sudeste', cidade: 'Salvador', estado: 'BA',
    tipo: 'Atendimento em comunidade', programa: 'Apolônias do Bem',
    horario: '09h às 17h', status: 'realizado',
    dentistasConfirmados: 6, dentistasNecessarios: 6, pacientesEsperados: 45,
    atendimentosRealizados: 38, encaminhamentos: 8,
  },
  {
    id: 'm6', data: '2025-09-14',
    local: 'Praça da Estação', cidade: 'Belo Horizonte', estado: 'MG',
    tipo: 'Atendimento em comunidade', programa: 'Dentista do Bem',
    horario: '08h às 18h', status: 'realizado',
    dentistasConfirmados: 7, dentistasNecessarios: 7, pacientesEsperados: 60,
    atendimentosRealizados: 52, encaminhamentos: 15,
  },
];