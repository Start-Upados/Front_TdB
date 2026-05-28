export type PapelUsuario = 'Administrador' | 'Coordenador' | 'Visualizador';
export type StatusIntegracao = 'conectado' | 'parcial' | 'desconectado';

export interface MembroEquipe {
  id: string;
  nome: string;
  iniciais: string;
  email: string;
  papel: PapelUsuario;
  regiao: string;
  ativo: boolean;
}

export interface Integracao {
  id: string;
  nome: string;
  descricao: string;
  status: StatusIntegracao;
  detalhe: string;
}

export interface OrganizacaoInfo {
  nome: string;
  cnpj: string;
  site: string;
  email: string;
  telefone: string;
  endereco: string;
}

export const EQUIPE_MOCK: MembroEquipe[] = [
  { id: 'u1', nome: 'Renata Oliveira', iniciais: 'RO', email: 'renata@turmadobem.org.br',  papel: 'Administrador', regiao: 'Nacional',     ativo: true  },
  { id: 'u2', nome: 'Marcos Pereira',  iniciais: 'MP', email: 'marcos@turmadobem.org.br',  papel: 'Coordenador',   regiao: 'Sudeste',      ativo: true  },
  { id: 'u3', nome: 'Juliana Costa',   iniciais: 'JC', email: 'juliana@turmadobem.org.br', papel: 'Coordenador',   regiao: 'Nordeste',     ativo: true  },
  { id: 'u4', nome: 'Felipe Santos',   iniciais: 'FS', email: 'felipe@turmadobem.org.br',  papel: 'Coordenador',   regiao: 'Sul',          ativo: true  },
  { id: 'u5', nome: 'Ana Lima',        iniciais: 'AL', email: 'ana@turmadobem.org.br',     papel: 'Visualizador',  regiao: 'Centro-Oeste', ativo: false },
];

export const INTEGRACOES_MOCK: Integracao[] = [
  { id: 'i1', nome: 'Classificação por ML',  descricao: 'Modelo de priorização das solicitações da Central de Canais', status: 'conectado',    detalhe: 'Acurácia 92% · atualizado há 3 dias' },
  { id: 'i2', nome: 'WhatsApp Business API',  descricao: 'Recebe e responde mensagens via WhatsApp',                    status: 'conectado',    detalhe: 'Número verificado · webhook ativo' },
  { id: 'i3', nome: 'E-mail (SMTP)',          descricao: 'Envio de convites, recibos e agradecimentos',                 status: 'conectado',    detalhe: 'contato@turmadobem.org.br' },
  { id: 'i4', nome: 'Instagram',              descricao: 'Captura de mensagens diretas',                                status: 'conectado',    detalhe: '@turmadobem' },
  { id: 'i5', nome: 'Google Distance Matrix', descricao: 'Rotas reais para o matching de dentistas',                    status: 'parcial',      detalhe: 'Usando Haversine · API key não configurada' },
  { id: 'i6', nome: 'Banco de dados Oracle',  descricao: 'Persistência de pacientes, dentistas e atendimentos',         status: 'desconectado', detalhe: 'Aguardando deploy do backend Quarkus' },
];

export const ORGANIZACAO_MOCK: OrganizacaoInfo = {
  nome: 'Turma do Bem',
  cnpj: '00.000.000/0001-00',
  site: 'turmadobem.org.br',
  email: 'contato@turmadobem.org.br',
  telefone: '(11) 0000-0000',
  endereco: 'São Paulo, SP',
};