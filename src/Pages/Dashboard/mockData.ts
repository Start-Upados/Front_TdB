// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

export interface MonthlyPoint {
  month: string;
  atendimentos: number;
  novos: number;
  voluntarios: number;
}

export interface VolunteerGrowthPoint {
  year: string;
  total: number;
}

export interface NewVolunteersPoint {
  month: string;
  novos: number;
}

export interface Volunteer {
  rank: number;
  name: string;
  city: string;
  patients: number;
  rating: number;
  status: 'active' | 'inactive';
}

export interface Appointment {
  id: string;
  day: string;
  month: string;
  time: string;
  patient: string;
  type: string;
  dentist: string;
  priority: 'high' | 'normal';
}

export interface RecentAttendance {
  id: string;
  patient: string;
  type: string;
  dentist: string;
  status: 'concluded' | 'active' | 'pending' | 'alert';
  date: string;
}

export interface AlertItem {
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
}

export interface RegionData {
  name: string;
  dentistas: number;
  pacientes: number;
  color: string;
}

export interface StateData {
  state: string;
  fullName: string;
  dentists: number;
  coverage: number;
}

export interface LowCoverageState {
  state: string;
  dentists: number;
  need: number;
  gap: number;
  type: 'danger' | 'warning';
}

export interface Partner {
  name: string;
  contribution: string;
  tier: string;
}

export interface CostItem {
  name: string;
  value: number;
  color: string;
}

export interface AgeGroup {
  grupo: string;
  pct: number;
  count: number;
}

export interface SeverityItem {
  name: string;
  value: number;
  color: string;
}

export interface BeforeAfterItem {
  metrica: string;
  antes: number;
  depois: number;
}

export interface DonationPoint {
  month: string;
  valor: number;
}

// ──────────────────────────────────────────────
// DATA
// ──────────────────────────────────────────────

export const MONTHLY_DATA: MonthlyPoint[] = [
  { month: 'Jan', atendimentos: 1820, novos: 980,  voluntarios: 3980 },
  { month: 'Fev', atendimentos: 1945, novos: 1050, voluntarios: 4010 },
  { month: 'Mar', atendimentos: 2100, novos: 1120, voluntarios: 4050 },
  { month: 'Abr', atendimentos: 1987, novos: 1043, voluntarios: 4080 },
  { month: 'Mai', atendimentos: 2234, novos: 1180, voluntarios: 4120 },
  { month: 'Jun', atendimentos: 2189, novos: 1140, voluntarios: 4155 },
  { month: 'Jul', atendimentos: 2456, novos: 1280, voluntarios: 4180 },
  { month: 'Ago', atendimentos: 2389, novos: 1210, voluntarios: 4198 },
  { month: 'Set', atendimentos: 2567, novos: 1320, voluntarios: 4218 },
  { month: 'Out', atendimentos: 2712, novos: 1390, voluntarios: 4218 },
  { month: 'Nov', atendimentos: 2634, novos: 1348, voluntarios: 4218 },
  { month: 'Dez', atendimentos: 1243, novos: 620,  voluntarios: 4218 },
];

export const VOLUNTEER_GROWTH: VolunteerGrowthPoint[] = [
  { year: '2021', total: 2100 },
  { year: '2022', total: 2780 },
  { year: '2023', total: 3290 },
  { year: '2024', total: 3870 },
  { year: '2025', total: 4218 },
];

export const NEW_VOLUNTEERS_MONTHLY: NewVolunteersPoint[] = [
  { month: 'Jan', novos: 62 }, { month: 'Fev', novos: 58 },
  { month: 'Mar', novos: 71 }, { month: 'Abr', novos: 87 },
  { month: 'Mai', novos: 0  }, { month: 'Jun', novos: 0  },
  { month: 'Jul', novos: 0  }, { month: 'Ago', novos: 0  },
  { month: 'Set', novos: 0  }, { month: 'Out', novos: 0  },
  { month: 'Nov', novos: 0  }, { month: 'Dez', novos: 0  },
];

export const TOP_VOLUNTEERS: Volunteer[] = [
  { rank: 1, name: 'Dra. Ana Paula Santos', city: 'São Paulo, SP',        patients: 247, rating: 4.9, status: 'active'   },
  { rank: 2, name: 'Dr. Carlos Mendes',     city: 'Belo Horizonte, MG',  patients: 234, rating: 4.8, status: 'active'   },
  { rank: 3, name: 'Dra. Fernanda Lima',    city: 'Rio de Janeiro, RJ',  patients: 221, rating: 4.9, status: 'active'   },
  { rank: 4, name: 'Dr. Rafael Oliveira',   city: 'Curitiba, PR',        patients: 198, rating: 4.7, status: 'active'   },
  { rank: 5, name: 'Dra. Juliana Costa',    city: 'Porto Alegre, RS',    patients: 187, rating: 4.8, status: 'active'   },
  { rank: 6, name: 'Dr. Marcelo Pereira',   city: 'Salvador, BA',        patients: 176, rating: 4.6, status: 'inactive' },
  { rank: 7, name: 'Dra. Camila Souza',     city: 'Fortaleza, CE',       patients: 165, rating: 4.7, status: 'active'   },
];

export const UPCOMING_APPOINTMENTS: Appointment[] = [
  { id: '1', day: '17', month: 'Abr', time: '09:00', patient: 'Adolescente (14)', type: 'Avaliação inicial',       dentist: 'Dra. Ana Paula Santos', priority: 'normal' },
  { id: '2', day: '17', month: 'Abr', time: '10:30', patient: 'Adolescente (16)', type: 'Ortodontia — retorno',   dentist: 'Dr. Carlos Mendes',     priority: 'normal' },
  { id: '3', day: '18', month: 'Abr', time: '08:00', patient: 'Adolescente (13)', type: 'Extração complexa',      dentist: 'Dra. Fernanda Lima',    priority: 'high'   },
  { id: '4', day: '18', month: 'Abr', time: '14:00', patient: 'Adolescente (15)', type: 'Canal — sessão 2',       dentist: 'Dr. Rafael Oliveira',   priority: 'high'   },
  { id: '5', day: '19', month: 'Abr', time: '09:00', patient: 'Adolescente (12)', type: 'Restauração múltipla',   dentist: 'Dra. Juliana Costa',    priority: 'normal' },
];

export const RECENT_ATTENDANCES: RecentAttendance[] = [
  { id: '#AT-4821', patient: 'Adolescente (14)', type: 'Clareamento',       dentist: 'Dra. Ana Paula',  status: 'concluded', date: '15/04/2025' },
  { id: '#AT-4820', patient: 'Adolescente (16)', type: 'Ortodontia',        dentist: 'Dr. Carlos M.',   status: 'active',    date: '15/04/2025' },
  { id: '#AT-4819', patient: 'Adolescente (12)', type: 'Extração complexa', dentist: 'Dra. Fernanda',   status: 'active',    date: '14/04/2025' },
  { id: '#AT-4818', patient: 'Adolescente (17)', type: 'Tratamento canal',  dentist: 'Dr. Rafael O.',   status: 'concluded', date: '14/04/2025' },
  { id: '#AT-4817', patient: 'Adolescente (13)', type: 'Restauração',       dentist: 'Dra. Juliana C.', status: 'pending',   date: '13/04/2025' },
  { id: '#AT-4816', patient: 'Adolescente (15)', type: 'Periodontia',       dentist: 'Dr. Marcelo P.',  status: 'alert',     date: '13/04/2025' },
];

export const ALERTS: AlertItem[] = [
  { type: 'danger',  title: 'Norte: Crítica falta de voluntários',   description: '4 estados com menos de 30% da capacidade necessária'     },
  { type: 'warning', title: '342 pacientes aguardando +60 dias',      description: 'Fila prolongada concentrada no Nordeste'                  },
  { type: 'warning', title: 'Queda de engajamento no Amapá',          description: 'Redução de 18% nos atendimentos em março/25'             },
  { type: 'info',    title: 'Meta anual 82% atingida',                description: 'Projeção de superação em 7% até dezembro'                },
  { type: 'success', title: 'SP atingiu 100.000 atendimentos',        description: 'Marco histórico alcançado em 15/04/2025'                 },
  { type: 'info',    title: '87 novos voluntários em abril',          description: 'Crescimento contínuo da rede nacional'                   },
];

export const REGIONS: RegionData[] = [
  { name: 'Sudeste',      dentistas: 1847, pacientes: 98234, color: '#00D4AA' },
  { name: 'Nordeste',     dentistas: 892,  pacientes: 67890, color: '#40C4FF' },
  { name: 'Sul',          dentistas: 734,  pacientes: 45123, color: '#B39DDB' },
  { name: 'Centro-Oeste', dentistas: 423,  pacientes: 23456, color: '#FFD740' },
  { name: 'Norte',        dentistas: 322,  pacientes: 13190, color: '#FF4757' },
];

export const TOP_STATES: StateData[] = [
  { state: 'SP', fullName: 'São Paulo',            dentists: 1243, coverage: 98 },
  { state: 'RJ', fullName: 'Rio de Janeiro',       dentists: 432,  coverage: 87 },
  { state: 'MG', fullName: 'Minas Gerais',         dentists: 387,  coverage: 82 },
  { state: 'PR', fullName: 'Paraná',               dentists: 289,  coverage: 76 },
  { state: 'RS', fullName: 'Rio Grande do Sul',    dentists: 267,  coverage: 74 },
  { state: 'BA', fullName: 'Bahia',                dentists: 198,  coverage: 61 },
  { state: 'SC', fullName: 'Santa Catarina',       dentists: 178,  coverage: 68 },
  { state: 'GO', fullName: 'Goiás',                dentists: 145,  coverage: 54 },
  { state: 'PE', fullName: 'Pernambuco',           dentists: 134,  coverage: 48 },
  { state: 'CE', fullName: 'Ceará',                dentists: 112,  coverage: 43 },
];

export const LOW_COVERAGE: LowCoverageState[] = [
  { state: 'Acre (AC)',      dentists: 12, need: 45, gap: 33, type: 'danger'  },
  { state: 'Roraima (RR)',   dentists: 8,  need: 28, gap: 20, type: 'danger'  },
  { state: 'Amapá (AP)',     dentists: 14, need: 32, gap: 18, type: 'warning' },
  { state: 'Tocantins (TO)', dentists: 23, need: 38, gap: 15, type: 'warning' },
];

export const PARTNERS: Partner[] = [
  { name: 'Colgate-Palmolive', contribution: 'R$ 1,2M',  tier: 'Patrocinador Master'   },
  { name: 'Oral-B',            contribution: 'R$ 780K',  tier: 'Patrocinador Diamante' },
  { name: 'Curaprox',          contribution: 'R$ 450K',  tier: 'Patrocinador Ouro'     },
  { name: 'Johnson & Johnson', contribution: 'R$ 320K',  tier: 'Patrocinador Prata'    },
  { name: 'Unilever',          contribution: 'R$ 240K',  tier: 'Apoiador'              },
];

export const MONTHLY_DONATIONS: DonationPoint[] = [
  { month: 'Jan', valor: 320 }, { month: 'Fev', valor: 298 }, { month: 'Mar', valor: 412 },
  { month: 'Abr', valor: 389 }, { month: 'Mai', valor: 445 }, { month: 'Jun', valor: 423 },
  { month: 'Jul', valor: 478 }, { month: 'Ago', valor: 467 }, { month: 'Set', valor: 512 },
  { month: 'Out', valor: 489 }, { month: 'Nov', valor: 456 }, { month: 'Dez', valor: 231 },
];

export const COST_BREAKDOWN: CostItem[] = [
  { name: 'Materiais odontológicos', value: 42, color: '#00D4AA' },
  { name: 'Logística e transporte',  value: 18, color: '#40C4FF' },
  { name: 'Treinamento voluntários', value: 15, color: '#B39DDB' },
  { name: 'Administração',           value: 12, color: '#FFD740' },
  { name: 'Tecnologia',              value: 8,  color: '#D4537E' },
  { name: 'Comunicação',             value: 5,  color: '#639922' },
];

export const AGE_DATA: AgeGroup[] = [
  { grupo: '11–12 anos', pct: 22, count: 54534  },
  { grupo: '13–14 anos', pct: 31, count: 76947  },
  { grupo: '15–16 anos', pct: 28, count: 69410  },
  { grupo: '17 anos',    pct: 19, count: 47099  },
];

export const SEVERITY_DATA: SeverityItem[] = [
  { name: 'Crítico',  value: 12, color: '#FF4757' },
  { name: 'Alto',     value: 23, color: '#BA7517' },
  { name: 'Moderado', value: 38, color: '#639922' },
  { name: 'Leve',     value: 27, color: '#00D4AA' },
];

export const BEFORE_AFTER_DATA: BeforeAfterItem[] = [
  { metrica: 'Autoestima',           antes: 34, depois: 94 },
  { metrica: 'Qualidade de vida',    antes: 28, depois: 91 },
  { metrica: 'Saúde bucal percebida', antes: 22, depois: 88 },
];
