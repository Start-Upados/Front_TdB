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

// Equipe: vem 100% do backend (GET /funcionario) — ver services/configuracoes.ts

export const INTEGRACOES_PADRAO: Integracao[] = [
  { id: 'i1', nome: 'Classificação por ML',  descricao: 'Modelo de priorização das solicitações da Central de Canais', status: 'conectado', detalhe: 'LightGBM · acurácia 94,7% · F1 macro 0,944 (teste 80/20)' },
  { id: 'i2', nome: 'WhatsApp Business API',  descricao: 'Envia lembretes de consultas por WhatsApp automaticamente',  status: 'conectado', detalhe: 'Número verificado · webhook ativo' },
  { id: 'i3', nome: 'E-mail (SMTP)',          descricao: 'Envio de convites, recibos e agradecimentos',                 status: 'conectado', detalhe: 'contato@turmadobem.org.br' },
  { id: 'i4', nome: 'Instagram',              descricao: 'Recebe e responde mensagens de DMs',                          status: 'conectado', detalhe: '@startupados_tdb' },
  { id: 'i5', nome: 'Google Distance Matrix', descricao: 'Rotas reais para o matching de dentistas',                    status: 'conectado', detalhe: 'Distância por rota no matching · Haversine como reserva' },
  { id: 'i6', nome: 'Banco de dados Oracle',  descricao: 'Todos os dados do sistema salvos no Oracle',                  status: 'conectado', detalhe: 'Backend Quarkus no Render' },
];

export const ORGANIZACAO_PADRAO: OrganizacaoInfo = {
  nome: 'Turma do Bem',
  cnpj: '00.000.000/0001-00',
  site: 'turmadobem.org.br',
  email: 'contato@turmadobem.org.br',
  telefone: '+55 11 5084-7276',
  endereco: 'Rua Maurício Francisco Klabin, 449 – São Paulo, SP',
};
