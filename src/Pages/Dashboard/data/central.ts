export type Canal = 'Site' | 'WhatsApp' | 'Email' | 'Instagram' | 'Telefone';
export type Prioridade = 'Alta' | 'Media' | 'Baixa';

export type Programa = 'Dentista do Bem' | 'Apolônias do Bem' | 'Voluntariado' | 'Doações' | 'Outros';

export type StatusConversa =
  | 'aberta'
  | 'aguardando-paciente'
  | 'pendente-aprovacao'      // ← NOVO: Dentista do Bem aguardando admin aprovar
  | 'pendente-triagem'        // ← NOVO: Apolônias aguardando triagem oral
  | 'triagem-apta'            // ← NOVO: Apolônias com triagem feita e elegível
  | 'triagem-nao-apta'        // ← NOVO: Apolônias com triagem feita e não elegível
  | 'fechada';

export type MotivoFechamento =
  | 'resolvida'
  | 'arquivada'
  | 'encaminhada'
  | 'promovida'
  | 'aprovada'                // ← NOVO
  | 'recusada';               // ← NOVO

export type MotivoRecusa =
  | 'fora-perfil-idade'
  | 'fora-perfil-renda'
  | 'dados-incompletos'
  | 'duplicada'
  | 'sem-indicacao-odontologica'
  | 'fora-area-atendimento'
  | 'outro';

export const MOTIVOS_RECUSA_LABEL: Record<MotivoRecusa, string> = {
  'fora-perfil-idade':           'Fora do perfil de idade',
  'fora-perfil-renda':           'Fora do perfil socioeconômico',
  'dados-incompletos':           'Dados incompletos',
  'duplicada':                   'Solicitação duplicada',
  'sem-indicacao-odontologica':  'Sem indicação odontológica',
  'fora-area-atendimento':       'Fora da área de atendimento',
  'outro':                       'Outro motivo',
};

export type AutorMensagem = 'paciente' | 'admin' | 'sistema';

export interface Mensagem {
  id: string;
  autor: AutorMensagem;
  autorNome?: string;
  autorIniciais?: string;
  texto: string;
  timestamp: string;
}

export interface KpiData {
  label: string;
  value: string;
  valueTone?: 'default' | 'danger' | 'warning' | 'success';
  sub?: string;
  subTone?: 'default' | 'success' | 'warning' | 'danger';
}

// ─── NOVOS TIPOS: Triagem Oral e Recusa ───────────

export interface TriagemOral {
  realizadaEm: string;                                    // YYYY-MM-DD
  realizadaPor: string;                                   // Nome do avaliador
  houveDano: boolean;                                     // Houve dano dentário pela violência?
  severidade: 'urgente' | 'moderado' | 'leve';
  tratamentoSugerido: string;
  observacoes: string;
  recomendacao: 'apta' | 'nao-apta';
  fotos: string[];                                        // Base64 data URLs (MVP — em prod vira IDs do storage)
}

export interface InfoRecusa {
  motivo: MotivoRecusa;
  detalhe?: string;                                       // Texto livre quando motivo = 'outro' ou complementar
  recusadaEm: string;                                     // YYYY-MM-DD
  recusadaPor: string;                                    // Nome do admin que recusou
}

// ─── Solicitacao com campos novos opcionais ───────

export interface Solicitacao {
  id: string;
  nome: string;
  iniciais: string;
  idade?: number;
  cidade?: string;
  canal: Canal;
  tipo: string;
  programa?: Programa;                                    // ← NOVO: direciona o fluxo de aprovação
  preview: string;
  mensagens: Mensagem[];
  data: string;
  ultimaAtualizacao: string;
  prioridade: Prioridade;
  score: number;
  status: StatusConversa;
  motivoFechamento?: MotivoFechamento;
  destinatarioEncaminhamento?: string;
  featuresUsadas?: {
    idade?: string;
    programa?: string;
    canal?: string;
  };
  triagemOral?: TriagemOral;                              // ← NOVO
  infoRecusa?: InfoRecusa;                                // ← NOVO
}

export const KPIS_CENTRAL_MOCK: KpiData[] = [
  { label: 'Solicitações novas hoje', value: '23', sub: '+8 vs ontem' },
  { label: 'Alta sem resposta +24h',  value: '5', valueTone: 'danger', sub: 'Atenção urgente', subTone: 'danger' },
  { label: 'Tempo médio resposta',    value: '2.4h', sub: '−12% vs semana', subTone: 'success' },
  { label: 'Acurácia ML (30 dias)',   value: '92%', sub: '+3pp com overrides', subTone: 'success' },
];

const agora = new Date();
const ago = (mins: number) => new Date(agora.getTime() - mins * 60_000).toISOString();

export const SOLICITACOES_MOCK: Solicitacao[] = [
  // ─── NOVAS: pendentes de aprovação (jovem) e triagem (Apolônias) ───
  {
    id: '0a', nome: 'Pedro Henrique Souza', iniciais: 'PS', idade: 14, cidade: 'São Paulo, SP',
    canal: 'Site', tipo: 'Beneficiário', programa: 'Dentista do Bem',
    preview: 'Solicitação de cadastro no Dentista do Bem · 14 anos',
    mensagens: [{
      id: 'msg-0a-1', autor: 'paciente', texto:
        'Necessidade: Ortodontia (aparelho). Renda familiar: 1 a 2 salários mínimos. Adolescente de 14 anos morador de São Paulo precisa de atendimento.',
      timestamp: ago(8),
    }],
    data: '8min', ultimaAtualizacao: ago(8),
    prioridade: 'Media', score: 0.62,
    status: 'pendente-aprovacao',
  },
  {
    id: '0b', nome: 'Carla Mendes', iniciais: 'CM', idade: 31, cidade: 'Rio de Janeiro, RJ',
    canal: 'Site', tipo: 'Apolônia do Bem', programa: 'Apolônias do Bem',
    preview: 'Solicitação Apolônias · sofreu violência, dentes afetados',
    mensagens: [{
      id: 'msg-0b-1', autor: 'paciente', texto:
        'Boa tarde. Saí recentemente de uma situação de violência doméstica. Perdi alguns dentes da frente. Preciso muito recuperar minha autoestima. Vi vocês pelo Instagram.',
      timestamp: ago(25),
    }],
    data: '25min', ultimaAtualizacao: ago(25),
    prioridade: 'Alta', score: 0.85,
    status: 'pendente-triagem',
  },

  // ─── Mocks originais (mantidos como estavam) ───────
  {
    id: '1', nome: 'João Silva', iniciais: 'JS', idade: 13, cidade: 'São Paulo, SP',
    canal: 'WhatsApp', tipo: 'Beneficiário', programa: 'Dentista do Bem',
    preview: 'Filho com dor forte há 3 dias…',
    mensagens: [{
      id: 'msg-1-1', autor: 'paciente', texto:
        'Olá, meu filho de 13 anos está com dor muito forte no dente há 3 dias. Não consigo dormir vendo ele assim. Estamos em São Paulo, em situação difícil. Por favor, como posso conseguir atendimento?',
      timestamp: ago(14),
    }],
    data: '14min', ultimaAtualizacao: ago(14),
    prioridade: 'Alta', score: 0.87,
    status: 'aberta',
    featuresUsadas: {
      idade: '13 anos · faixa crítica',
      programa: 'Dentista do Bem · vulnerabilidade',
      canal: 'WhatsApp · urgência típica',
    },
  },
  {
    id: '2', nome: 'Maria Santos', iniciais: 'MS', idade: 34, cidade: 'Recife, PE',
    canal: 'Site', tipo: 'Beneficiária', programa: 'Apolônias do Bem',
    preview: 'Vítima de violência precisa atendimento…',
    mensagens: [{
      id: 'msg-2-1', autor: 'paciente', texto:
        'Boa tarde. Sou Maria, fui vítima de violência doméstica e perdi vários dentes. Estou em Recife e preciso muito de ajuda para voltar a sorrir.',
      timestamp: ago(60),
    }],
    data: '1h', ultimaAtualizacao: ago(60),
    prioridade: 'Alta', score: 0.79,
    status: 'aberta',
    featuresUsadas: {
      idade: '34 anos · faixa adulto',
      programa: 'Apolônias do Bem · vulnerabilidade alta',
      canal: 'Site · solicitação formal',
    },
  },
  {
    id: '3', nome: 'Dr. Carlos Melo', iniciais: 'CM', cidade: 'Belo Horizonte, MG',
    canal: 'Site', tipo: 'Voluntário', programa: 'Voluntariado',
    preview: 'Quero me cadastrar como voluntário…',
    mensagens: [
      { id: 'msg-3-1', autor: 'paciente', texto: 'Sou dentista clínico geral, atuo há 12 anos em BH, e gostaria de fazer parte da rede de voluntários da Turma do Bem. Como faço para iniciar?', timestamp: ago(180) },
      { id: 'msg-3-2', autor: 'admin', autorNome: 'Admin TdB', autorIniciais: 'TDB', texto: 'Olá Dr. Carlos! Que ótimo ter você na nossa rede. Pra começar, preciso que você cadastre seu CRO e disponibilidade pelo formulário em turmadobem.org/voluntario. Em até 48h um membro da equipe valida e você recebe acesso ao painel. Posso ajudar em algo mais?', timestamp: ago(120) },
    ],
    data: '2h', ultimaAtualizacao: ago(120),
    prioridade: 'Media', score: 0.68,
    status: 'aguardando-paciente',
  },
  {
    id: '4', nome: 'Colgate Brasil', iniciais: 'CB', cidade: 'São Paulo, SP',
    canal: 'Email', tipo: 'Doador', programa: 'Doações',
    preview: 'Proposta de ampliar parceria 2026…',
    mensagens: [{ id: 'msg-4-1', autor: 'paciente', texto: 'Prezados, gostaríamos de agendar uma reunião para discutir a ampliação de nossa parceria em 2026. Temos interesse em apoiar a expansão do programa Apolônias.', timestamp: ago(300) }],
    data: '5h', ultimaAtualizacao: ago(300),
    prioridade: 'Media', score: 0.71,
    status: 'aberta',
  },
  {
    id: '5', nome: 'Ana Beatriz', iniciais: 'AB', idade: 27, cidade: 'Salvador, BA',
    canal: 'Instagram', tipo: 'Beneficiária', programa: 'Apolônias do Bem',
    preview: 'Dúvida sobre o dia da consulta…',
    mensagens: [
      { id: 'msg-5-1', autor: 'paciente', texto: 'Oi! Tenho uma consulta marcada, mas não tenho certeza se é amanhã ou semana que vem. Vocês podem me confirmar?', timestamp: ago(420) },
      { id: 'msg-5-2', autor: 'admin', autorNome: 'Admin TdB', autorIniciais: 'TDB', texto: 'Oi Ana! Sua consulta é semana que vem, dia 24/10, às 14h, com a Dra. Beatriz Castro. Te enviei o lembrete por email também. Confirma pra mim?', timestamp: ago(380) },
      { id: 'msg-5-3', autor: 'paciente', texto: 'Ah, confirmado! Obrigada pela paciência. Vou marcar na agenda. Até lá!', timestamp: ago(350) },
    ],
    data: '5h50min', ultimaAtualizacao: ago(350),
    prioridade: 'Baixa', score: 0.82,
    status: 'aberta',
  },
  {
    id: '6', nome: 'Roberto Lima', iniciais: 'RL', idade: 45, cidade: 'Curitiba, PR',
    canal: 'WhatsApp', tipo: 'Beneficiário', programa: 'Dentista do Bem',
    preview: 'Quebrei o dente da frente…',
    mensagens: [
      { id: 'msg-6-1', autor: 'paciente', texto: 'Boa tarde, quebrei o dente da frente esta manhã num acidente de bike. Estou em Curitiba. Vocês atendem urgência?', timestamp: ago(60 * 24 * 2) },
      { id: 'msg-6-2', autor: 'admin', autorNome: 'Admin TdB', autorIniciais: 'TDB', texto: 'Roberto, fizemos o encaminhamento direto pra Dra. Patricia Oliveira em Curitiba. Ela vai te atender amanhã às 10h. Endereço já no seu email.', timestamp: ago(60 * 24 * 2 - 30) },
      { id: 'msg-6-3', autor: 'paciente', texto: 'Atendimento foi excelente, muito obrigado! Já estou bem.', timestamp: ago(60 * 24) },
    ],
    data: '1d', ultimaAtualizacao: ago(60 * 24),
    prioridade: 'Alta', score: 0.81,
    status: 'fechada', motivoFechamento: 'resolvida',
  },
  {
    id: '7', nome: 'Mariana Costa', iniciais: 'MC', idade: 38, cidade: 'Salvador, BA',
    canal: 'Site', tipo: 'Beneficiária', programa: 'Apolônias do Bem',
    preview: 'Atendimento para minha mãe…',
    mensagens: [
      { id: 'msg-7-1', autor: 'paciente', texto: 'Minha mãe tem 67 anos e está com vários dentes em mau estado. Ela é aposentada e mora em Salvador. Posso conseguir ajuda?', timestamp: ago(60 * 24 * 5) },
      { id: 'msg-7-2', autor: 'admin', autorNome: 'Admin TdB', autorIniciais: 'TDB', texto: 'Vamos encaminhar pra Triagem com prioridade. Dentro de 7 dias um voluntário fará contato.', timestamp: ago(60 * 24 * 5 - 60) },
    ],
    data: '5d', ultimaAtualizacao: ago(60 * 24 * 5 - 60),
    prioridade: 'Alta', score: 0.85,
    status: 'fechada', motivoFechamento: 'promovida',
  },
  {
    id: '8', nome: 'Rede Esperança', iniciais: 'RE', cidade: 'São Paulo, SP',
    canal: 'Email', tipo: 'Parceria', programa: 'Doações',
    preview: 'Parceria com ONG de acolhimento…',
    mensagens: [{ id: 'msg-8-1', autor: 'paciente', texto: 'Olá, somos a ONG Rede Esperança e atendemos mulheres em situação de vulnerabilidade. Gostaríamos de discutir uma parceria de encaminhamento pro programa Apolônias.', timestamp: ago(60 * 24 * 3) }],
    data: '3d', ultimaAtualizacao: ago(60 * 24 * 3),
    prioridade: 'Media', score: 0.74,
    status: 'fechada', motivoFechamento: 'encaminhada',
    destinatarioEncaminhamento: 'Equipe Apolônias',
  },
];