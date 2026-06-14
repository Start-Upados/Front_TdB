import { solicitacaoService, type SolicitacaoBody } from '../../../Services/api';
import { criarTriagem, type NovaTriagemInput } from './triagens';

import {
  SOLICITACOES_MOCK, KPIS_CENTRAL_MOCK,
  type Solicitacao, type KpiData, type Prioridade,
  type Mensagem, type MotivoFechamento, type Programa,
  type TriagemOral, type InfoRecusa,
} from '../data/central';


const LS_KEY = 'tdb_central_solicitacoes';

function persistir(): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(solicitacoes));
  } catch (err) {
    console.warn('[central] erro ao persistir no localStorage:', err);
  }
}

function hidratar(): Solicitacao[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Solicitacao[];
  } catch {
    return null;
  }
}

let solicitacoes: Solicitacao[] = hidratar() ?? [...SOLICITACOES_MOCK];

// ─── Leitura ──────────────────────────────────────

export function listarSolicitacoes(): Solicitacao[] {
  return solicitacoes;
}

export function listarAtivas(): Solicitacao[] {
  return solicitacoes.filter((s) => s.status !== 'fechada');
}

export function listarArquivo(): Solicitacao[] {
  return solicitacoes.filter((s) => s.status === 'fechada');
}

export function obterKpis(): KpiData[] {
  const hoje  = new Date().toISOString().slice(0, 10);  // YYYY-MM-DD
  const ontem = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  // 1. Solicitações novas hoje (+ delta vs ontem)
  const novasHoje = solicitacoes.filter(
    (s) => s.ultimaAtualizacao?.slice(0, 10) === hoje,
  ).length;
  const novasOntem = solicitacoes.filter(
    (s) => s.ultimaAtualizacao?.slice(0, 10) === ontem,
  ).length;
  const delta = novasHoje - novasOntem;
  const sinal = delta >= 0 ? '+' : '';

  // 2. Alta sem resposta há mais de 24h (última msg não é do admin)
  const limite24h = Date.now() - 86_400_000;
  const PENDENTES_DE_ADMIN: Solicitacao['status'][] = [
    'aberta', 'pendente-aprovacao', 'pendente-triagem',
    'triagem-apta', 'triagem-nao-apta',
  ];
  const altaSemResposta = solicitacoes.filter((s) => {
    if (s.prioridade !== 'Alta') return false;
    if (!PENDENTES_DE_ADMIN.includes(s.status)) return false;
    const ultima = s.mensagens[s.mensagens.length - 1];
    const semRespostaAdmin = !ultima || ultima.autor !== 'admin';
    const velhaPra24h = new Date(s.ultimaAtualizacao).getTime() < limite24h;
    return semRespostaAdmin && velhaPra24h;
  }).length;

  return [
    {
      label: 'Solicitações novas hoje',
      value: String(novasHoje),
      sub: `${sinal}${delta} vs ontem`,
    },
    {
      label: 'Alta sem resposta +24h',
      value: String(altaSemResposta),
      sub: altaSemResposta > 0 ? 'Atenção urgente' : 'Tudo em dia',
      tone: altaSemResposta > 0 ? 'danger' : 'success',
    },
    // Os 2 abaixo ficam mock até backend emitir telemetria
    KPIS_CENTRAL_MOCK[2],  // Tempo médio resposta
    KPIS_CENTRAL_MOCK[3],  // Acurácia ML (30 dias)
  ];
}

export function obterSolicitacao(id: string): Solicitacao | undefined {
  return solicitacoes.find((s) => s.id === id);
}

// ─── Helper interno ───────────────────────────────

function atualizarTempoRelativo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const horas = Math.floor(mins / 60);
  if (horas < 24) return `${horas}h${mins % 60 > 0 ? (mins % 60) + 'min' : ''}`.slice(0, 8);
  return `${Math.floor(horas / 24)}d`;
}

function patch(id: string, mod: (s: Solicitacao) => Solicitacao): void {
  solicitacoes = solicitacoes.map((s) => (s.id === id ? mod(s) : s));
  persistir();
}

// ─── Mutações ────────────────────────────────────

export async function atualizarClassificacao(
  id: string,
  novaClassificacao: {
    prioridade: Prioridade;
    score: number;
    featuresUsadas?: Solicitacao['featuresUsadas'];
  },
): Promise<void> {
  const sol = solicitacoes.find((s) => s.id === id);
  if (sol?.protocolo) {
    try {
      await solicitacaoService.classificar(
        sol.protocolo,
        novaClassificacao.prioridade,
        novaClassificacao.score,
      );
    } catch (err) {
      console.error('[central] erro ao classificar no backend:', err);
      // Não bloqueia: classificação é refinamento, não crítico
    }
  }
  patch(id, (s) => ({ ...s, ...novaClassificacao }));
}

export async function responderSolicitacao(id: string, texto: string): Promise<void> {
  const sol = solicitacoes.find((s) => s.id === id);
  const ts = new Date().toISOString();

  if (sol?.protocolo) {
    try {
      await solicitacaoService.inserirMensagem(sol.protocolo, {
        autor: 'admin',
        nomeAutor: 'Admin TdB',
        conteudo: texto,
        dataEnvio: ts,
      });
    } catch (err) {
      console.error('[central] erro ao gravar mensagem no backend:', err);
      // Não bloqueia: deixa salvar local mesmo se backend falhar
    }
  }

  const novaMsg: Mensagem = {
    id: `msg-${id}-${Date.now()}`,
    autor: 'admin',
    autorNome: 'Admin TdB',
    autorIniciais: 'TDB',
    texto,
    timestamp: ts,
  };
  patch(id, (s) => {
    // Estados pendentes mantêm o status: admin pode estar pedindo info sem fechar a decisão
    const PENDENTES: Solicitacao['status'][] = [
      'pendente-aprovacao', 'pendente-triagem', 'triagem-apta', 'triagem-nao-apta',
    ];
    const novoStatus = PENDENTES.includes(s.status) ? s.status : 'aguardando-paciente';
    return {
      ...s,
      mensagens: [...s.mensagens, novaMsg],
      status: novoStatus,
      ultimaAtualizacao: ts,
      data: atualizarTempoRelativo(ts),
    };
  });
}

/** Resposta do PACIENTE — devolve a conversa pra status 'aberta' (admin precisa atender). */
export async function responderComoPaciente(id: string, texto: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 400));
  const ts = new Date().toISOString();
  patch(id, (s) => {
    const PENDENTES: Solicitacao['status'][] = [
      'pendente-aprovacao', 'pendente-triagem', 'triagem-apta', 'triagem-nao-apta',
    ];
    const novoStatus = PENDENTES.includes(s.status) ? s.status : 'aberta';
    return {
      ...s,
      mensagens: [...s.mensagens, {
        id: `msg-${id}-${Date.now()}`,
        autor: 'paciente',
        texto,
        timestamp: ts,
      }],
      status: novoStatus,
      ultimaAtualizacao: ts,
      data: atualizarTempoRelativo(ts),
    };
  });
}

async function chamarBackendComProtocolo(
  id: string,
  acao: (protocolo: string) => Promise<unknown>,
  rotuloErro: string,
): Promise<void> {
  const sol = solicitacoes.find((s) => s.id === id);
  if (!sol?.protocolo) return;       // mock local — só atualiza estado
  try {
    await acao(sol.protocolo);
  } catch (err) {
    console.error(`[central] erro ao ${rotuloErro} no backend:`, err);
    throw new Error(`Não foi possível ${rotuloErro} no servidor. Tente novamente.`);
  }
}

export async function resolverSolicitacao(id: string): Promise<void> {
  await chamarBackendComProtocolo(id, solicitacaoService.resolver, 'resolver');
  fechar(id, 'resolvida');
}

export async function arquivarSolicitacao(id: string): Promise<void> {
  await chamarBackendComProtocolo(id, solicitacaoService.arquivar, 'arquivar');
  fechar(id, 'arquivada');
}

export async function encaminharSolicitacao(
  id: string,
  destinatario: string,
  _nota?: string,
): Promise<void> {
  // Backend ainda não tem endpoint /encaminhar — fica só local
  await new Promise((r) => setTimeout(r, 200));
  fechar(id, 'encaminhada', destinatario);
}

export async function promoverParaTriagem(id: string): Promise<void> {
  await chamarBackendComProtocolo(id, solicitacaoService.promover, 'promover');
  fechar(id, 'promovida');
}

export async function reabrirSolicitacao(id: string): Promise<void> {
  await chamarBackendComProtocolo(id, solicitacaoService.reabrir, 'reabrir');
  patch(id, (s) => ({
    ...s,
    status: 'aberta',
    motivoFechamento: undefined,
    destinatarioEncaminhamento: undefined,
  }));
}

function fechar(id: string, motivo: MotivoFechamento, destinatario?: string): void {
  const ts = new Date().toISOString();
  patch(id, (s) => ({
    ...s,
    status: 'fechada',
    motivoFechamento: motivo,
    destinatarioEncaminhamento: destinatario,
    ultimaAtualizacao: ts,
    data: atualizarTempoRelativo(ts),
  }));
}

/**
 * Puxa solicitações do backend Java e MESCLA com o estado local.
 *
 * Estratégia: preserva mudanças locais (aprovações, recusas, mensagens, triagens),
 * adicionando apenas solicitações novas vindas do backend. Isso evita perder
 * o estado de aprovação/recusa no F5, já que o backend ainda não conhece
 * essas transições (que vivem só no localStorage do navegador).
 *
 * Quando o backend ganhar endpoints de status, podemos voltar a sobrescrever
 * sem perda de dados.
 */
export async function carregarSolicitacoesReais(): Promise<{
  count: number;
  fonte: 'backend' | 'mock';
}> {
  try {
    const lista = await solicitacaoService.listar();
    if (Array.isArray(lista) && lista.length > 0) {
      const doBackend = lista.map(mapearSolicitacaoBackend);

      // MERGE: pra cada solicitação que vem do backend:
      //   - Se já existe localmente → mantém o LOCAL (com todas as mudanças)
      //   - Se NÃO existe localmente → adiciona como nova
      const idsLocais = new Set(solicitacoes.map((s) => s.id));
      const novasDoBackend = doBackend.filter((s) => !idsLocais.has(s.id));

      solicitacoes = [...solicitacoes, ...novasDoBackend];
      persistir();
      return { count: solicitacoes.length, fonte: 'backend' };
    }
    return { count: solicitacoes.length, fonte: 'mock' };
  } catch (err) {
    console.warn('[central] backend indisponível, mantendo dados atuais:', err);
    return { count: solicitacoes.length, fonte: 'mock' };
  }
}

// ─── Backend Java (real) ─────────────────────────
// Conecta com solicitacaoService.listar() do backend Java + Oracle.
// Faz MERGE com estado local (preserva aprovações/recusas/mensagens locais).



function gerarIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter((p) => !['Dr.', 'Dra.'].includes(p));
  if (partes.length === 0) return 'XX';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function calcularIdade(dataNasc: string): number | undefined {
  if (!dataNasc) return undefined;
  const nasc = new Date(dataNasc);
  if (isNaN(nasc.getTime())) return undefined;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade >= 0 ? idade : undefined;
}

function mapearSolicitacaoBackend(body: SolicitacaoBody): Solicitacao {
  const ts = new Date().toISOString();
  const ehApolonia = body.protocolo?.startsWith('APO-') ?? false;
  const tipo = ehApolonia ? 'Apolônia do Bem' : 'Beneficiário';
  const programa: Programa = ehApolonia ? 'Apolônias do Bem' : 'Dentista do Bem';

  // Primeira mensagem do thread = necessidade + descrição (se houver)
  const textoInicial = body.descricao && body.descricao.trim()
    ? `${body.necessidade}\n\n${body.descricao}`
    : body.necessidade;

  const preview = body.necessidade.length > 80
    ? body.necessidade.slice(0, 80) + '…'
    : body.necessidade;

  return {
    id: body.rgCpf, // PK backend
    protocolo: body.protocolo,                         
    nome: body.nome,
    iniciais: gerarIniciais(body.nome),
    idade: calcularIdade(body.dataNasc),
    cidade: undefined,                       // backend ainda não tem campo cidade
    canal: 'Site',                           // formulários públicos vêm do site
    tipo,
    programa,
    preview,
    mensagens: [
      {
        id: `msg-${body.rgCpf}-init`,
        autor: 'paciente',
        texto: textoInicial,
        timestamp: ts,
      },
    ],
    data: 'agora',
    ultimaAtualizacao: ts,
    prioridade: 'Media',                     // default até admin clicar "Reclassificar"
    score: 0.5,
    status: ehApolonia ? 'pendente-triagem' : 'pendente-aprovacao',
  };
}

// ─── Aprovação / Recusa / Triagem Oral ───────────

export async function registrarTriagemOral(
  id: string,
  triagem: TriagemOral,
): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  patch(id, (s) => ({
    ...s,
    triagemOral: triagem,
    status: triagem.recomendacao === 'apta' ? 'triagem-apta' : 'triagem-nao-apta',
  }));
}

export async function aprovarSolicitacao(
  id: string,
  aprovadaPor: string,
): Promise<void> {
  const sol = solicitacoes.find((s) => s.id === id);
  if (!sol) throw new Error('Solicitação não encontrada');

  // Backend first: se tem protocolo (veio do Oracle), persiste a aprovação
  if (sol.protocolo) {
    try {
      await solicitacaoService.aprovar(sol.protocolo, aprovadaPor);
    } catch (err) {
      console.error('[central] erro ao aprovar no backend:', err);
      throw new Error('Não foi possível aprovar no servidor. Tente novamente.');
    }
  }

  // Monta input pra criar entrada em Triagens
  const [cidadeNome, estadoSigla] = (sol.cidade ?? 'São Paulo, SP').split(',').map((p) => p.trim());

  const programa: 'Dentista do Bem' | 'Apolônias do Bem' =
    sol.programa === 'Apolônias do Bem' ? 'Apolônias do Bem' : 'Dentista do Bem';

  const severidade: NovaTriagemInput['severidade'] =
  sol.triagemOral?.severidade === 'urgente' ? 'Alta' :
  sol.triagemOral?.severidade === 'leve'    ? 'Baixa' :
  sol.prioridade === 'Alta'                  ? 'Alta' :
  sol.prioridade === 'Baixa'                 ? 'Baixa' : 'Media';

  const necessidade = sol.triagemOral?.tratamentoSugerido || sol.preview;

  try {
    await criarTriagem({
      nome: sol.nome,
      idade: sol.idade ?? 0,
      cidade: cidadeNome || 'São Paulo',
      estado: estadoSigla || 'SP',
      cep: '',
      programa,
      necessidade,
      especialidadeNecessaria: 'Clínico geral',
      severidade,
      origemTipo: 'central',
      origemDetalhe: `Aprovada por ${aprovadaPor} via Central de Mensagens`,
    });
  } catch (err) {
    console.warn('[central] erro ao criar triagem:', err);
  }

  fechar(id, 'aprovada');
}

export async function recusarSolicitacao(
  id: string,
  infoRecusa: InfoRecusa,
): Promise<void> {
  const sol = solicitacoes.find((s) => s.id === id);
  if (sol?.protocolo) {
    try {
      await solicitacaoService.recusar(
        sol.protocolo,
        'Admin TdB',
        infoRecusa.motivo,
        infoRecusa.detalhe,
      );
    } catch (err) {
      console.error('[central] erro ao recusar no backend:', err);
      throw new Error('Não foi possível recusar no servidor. Tente novamente.');
    }
  }

  patch(id, (s) => ({
    ...s,
    infoRecusa,
    status: 'fechada',
    motivoFechamento: 'recusada',
    ultimaAtualizacao: new Date().toISOString(),
  }));
}