export type Canal = 'Site' | 'WhatsApp' | 'Email' | 'Instagram' | 'Telefone';
export type Prioridade = 'Alta' | 'Media' | 'Baixa';

export interface KpiData {
  label: string;
  value: string;
  valueTone?: 'default' | 'danger' | 'warning' | 'success';
  sub?: string;
  subTone?: 'default' | 'success' | 'warning' | 'danger';
}

export interface Solicitacao {
  id: string;
  nome: string;
  iniciais: string;
  idade?: number;
  cidade?: string;
  canal: Canal;
  tipo: string;
  preview: string;
  mensagem: string;
  data: string;
  prioridade: Prioridade;
  score: number;
  featuresUsadas?: {
    idade?: string;
    programa?: string;
    canal?: string;
  };
}

export const KPIS_CENTRAL_MOCK: KpiData[] = [
  { label: 'Solicitações novas hoje', value: '23', sub: '+8 vs ontem' },
  { label: 'Alta sem resposta +24h',  value: '5', valueTone: 'danger', sub: 'Atenção urgente', subTone: 'danger' },
  { label: 'Tempo médio resposta',    value: '2.4h', sub: '−12% vs semana', subTone: 'success' },
  { label: 'Acurácia ML (30 dias)',   value: '92%', sub: '+3pp com overrides', subTone: 'success' },
];

export const SOLICITACOES_MOCK: Solicitacao[] = [
  {
    id: '1',
    nome: 'João Silva',
    iniciais: 'JS',
    idade: 13,
    cidade: 'São Paulo, SP',
    canal: 'WhatsApp',
    tipo: 'Beneficiário',
    preview: 'Filho com dor forte há 3 dias…',
    mensagem:
      'Olá, meu filho de 13 anos está com dor muito forte no dente há 3 dias. Não consigo dormir vendo ele assim. Estamos em São Paulo, em situação difícil. Por favor, como posso conseguir atendimento?',
    data: '14min',
    prioridade: 'Alta',
    score: 0.87,
    featuresUsadas: {
      idade: '13 anos · faixa crítica',
      programa: 'Dentista do Bem · vulnerabilidade',
      canal: 'WhatsApp · urgência típica',
    },
  },
  {
    id: '2',
    nome: 'Maria Santos',
    iniciais: 'MS',
    idade: 34,
    cidade: 'Recife, PE',
    canal: 'Site',
    tipo: 'Beneficiária',
    preview: 'Vítima de violência precisa atendimento…',
    mensagem:
      'Boa tarde. Sou Maria, fui vítima de violência doméstica e perdi vários dentes. Estou em Recife e preciso muito de ajuda para voltar a sorrir.',
    data: '1h',
    prioridade: 'Alta',
    score: 0.79,
    featuresUsadas: {
      idade: '34 anos · faixa adulto',
      programa: 'Apolônias do Bem · vulnerabilidade alta',
      canal: 'Site · solicitação formal',
    },
  },
  {
    id: '3',
    nome: 'Dr. Carlos Melo',
    iniciais: 'CM',
    cidade: 'Belo Horizonte, MG',
    canal: 'Site',
    tipo: 'Voluntário',
    preview: 'Quero me cadastrar como voluntário…',
    mensagem:
      'Sou dentista clínico geral, atuo há 12 anos em BH, e gostaria de fazer parte da rede de voluntários da Turma do Bem. Como faço para iniciar?',
    data: '3h',
    prioridade: 'Media',
    score: 0.68,
    featuresUsadas: {
      programa: 'Voluntariado · cadastro pendente',
      canal: 'Site · solicitação formal',
    },
  },
  {
    id: '4',
    nome: 'Colgate Brasil',
    iniciais: 'CB',
    cidade: 'São Paulo, SP',
    canal: 'Email',
    tipo: 'Doador',
    preview: 'Proposta de ampliar parceria 2026…',
    mensagem:
      'Prezados, gostaríamos de agendar uma reunião para discutir a ampliação de nossa parceria em 2026. Temos interesse em apoiar a expansão do programa Apolônias.',
    data: '5h',
    prioridade: 'Media',
    score: 0.71,
    featuresUsadas: {
      programa: 'Parceria estratégica',
      canal: 'Email · comunicação formal',
    },
  },
  {
    id: '5',
    nome: 'Ana Beatriz',
    iniciais: 'AB',
    idade: 27,
    cidade: 'Salvador, BA',
    canal: 'Instagram',
    tipo: 'Beneficiária',
    preview: 'Dúvida sobre o dia da consulta…',
    mensagem:
      'Oi! Tenho uma consulta marcada, mas não tenho certeza se é amanhã ou semana que vem. Vocês podem me confirmar?',
    data: '7h',
    prioridade: 'Baixa',
    score: 0.82,
    featuresUsadas: {
      idade: '27 anos · paciente em tratamento',
      canal: 'Instagram · canal informal',
    },
  },
];