import { solicitacaoService, triagemService, type SolicitacaoBody } from '../../../Services/api';
import { criarTriagem, type NovaTriagemInput } from './triagens';
import { normalizarSexo, programaPorPerfil } from './programa';

import {
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

let solicitacoes: Solicitacao[] = hidratar() ?? [];

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

  // 3. Tempo médio até a 1ª resposta do admin (mensagens registradas na Central)
  const tempos: number[] = [];
  for (const s of solicitacoes) {
    const primeiraPaciente = s.mensagens.find((m) => m.autor !== 'admin');
    if (!primeiraPaciente) continue;
    const t0 = new Date(primeiraPaciente.timestamp).getTime();
    const resposta = s.mensagens.find((m) => m.autor === 'admin' && new Date(m.timestamp).getTime() >= t0);
    if (!resposta) continue;
    tempos.push(new Date(resposta.timestamp).getTime() - t0);
  }
  const mediaMs = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
  const formatarDuracao = (ms: number): string => {
    const min = ms / 60_000;
    if (min < 60) return `${Math.max(1, Math.round(min))}min`;
    const h = min / 60;
    if (h < 48) return `${h.toFixed(1).replace('.', ',')}h`;
    return `${Math.round(h / 24)}d`;
  };

  // 4. Confiança média do ML nas solicitações já classificadas
  const classificadas = solicitacoes.filter((s) => s.featuresUsadas || s.score !== 0.5);
  const confiancaMedia = classificadas.length > 0
    ? Math.round((classificadas.reduce((a, s) => a + s.score, 0) / classificadas.length) * 100)
    : 0;

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
    {
      label: 'Tempo médio de resposta',
      value: tempos.length > 0 ? formatarDuracao(mediaMs) : '—',
      sub: tempos.length > 0
        ? `até a 1ª resposta · ${tempos.length} ${tempos.length === 1 ? 'conversa' : 'conversas'}`
        : 'nenhuma resposta registrada',
    },
    {
      label: 'Confiança média do ML',
      value: classificadas.length > 0 ? `${confiancaMedia}%` : '—',
      sub: classificadas.length > 0
        ? `${classificadas.length} ${classificadas.length === 1 ? 'solicitação classificada' : 'solicitações classificadas'}`
        : 'nenhuma classificada ainda',
      tone: classificadas.length > 0 && confiancaMedia < 60 ? 'warning' : undefined,
    },
  ];
}

export function contarAltaSemResposta24h(): { total: number; whatsapp: number; site: number } {
  const limite24h = Date.now() - 86_400_000;
  const PENDENTES: Solicitacao['status'][] = [
    'aberta', 'pendente-aprovacao', 'pendente-triagem', 'triagem-apta', 'triagem-nao-apta',
  ];
  const alta = solicitacoes.filter((s) => {
    if (s.prioridade !== 'Alta') return false;
    if (!PENDENTES.includes(s.status)) return false;
    const ultima = s.mensagens[s.mensagens.length - 1];
    const semRespostaAdmin = !ultima || ultima.autor !== 'admin';
    const velha = new Date(s.ultimaAtualizacao).getTime() < limite24h;
    return semRespostaAdmin && velha;
  });
  return {
    total: alta.length,
    whatsapp: alta.filter((s) => s.canal === 'WhatsApp').length,
    site: alta.filter((s) => s.canal === 'Site').length,
  };
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

/** Promover = mandar para a fila de Triagens (cria a triagem no banco, igual à aprovação). */
export async function promoverParaTriagem(id: string, promovidaPor = 'Admin TdB'): Promise<void> {
  await enviarParaTriagem(id, promovidaPor, 'promovida');
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

      // MERGE: o STATUS vem do banco (aprovar/recusar/resolver/arquivar/reabrir já são gravados lá).
      // Do local só fica o que o banco ainda não guarda: mensagens trocadas na tela,
      // triagem oral, e "encaminhada"/"promovida" (sem coluna própria no backend).
      const locaisPorId = new Map(solicitacoes.map((s) => [s.id, s]));
      const idsBackend  = new Set(doBackend.map((s) => s.id));

      const mescladas = doBackend.map((b) => {
        const local = locaisPorId.get(b.id);
        if (!local) return b;

        const estadoSoLocal =
          local.status === 'triagem-apta' ||
          local.status === 'triagem-nao-apta' ||
          (local.status === 'fechada' &&
            (local.motivoFechamento === 'encaminhada' || local.motivoFechamento === 'promovida'));
        const bancoAindaPendente = ['pendente-aprovacao', 'pendente-triagem', 'aberta'].includes(b.status);
        if (estadoSoLocal && bancoAindaPendente) return local;

        return {
          ...local,
          protocolo:         b.protocolo,
          // perfil vem sempre do banco (o cache antigo podia ter o programa errado)
          idade:             b.idade,
          sexo:              b.sexo,
          tipo:              b.tipo,
          programa:          b.programa,
          dadosCadastro:     b.dadosCadastro ?? local.dadosCadastro,
          status:            b.status,
          motivoFechamento:  b.motivoFechamento,
          infoRecusa:        local.infoRecusa ?? b.infoRecusa,
          prioridade:        b.prioridadeDoBanco ? b.prioridade : local.prioridade,
          score:             b.prioridadeDoBanco ? b.score : local.score,
        };
      });

      // Mantém o que só existe localmente (sem par no banco)
      const soLocais = solicitacoes.filter((s) => !idsBackend.has(s.id));

      solicitacoes = [...mescladas, ...soLocais];
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

type SolicitacaoMapeada = Solicitacao & { prioridadeDoBanco?: boolean };

/** Traduz o status gravado no Oracle para o status/motivo da Central. */
function estadoDoBackend(
  body: SolicitacaoBody,
  padrao: Solicitacao['status'],
): Pick<Solicitacao, 'status' | 'motivoFechamento'> {
  const st = (body.status ?? '').toLowerCase().trim();
  // aprovar() grava status 'pendente-triagem' + aprovado_por — o aprovado_por é o que diferencia
  if (body.aprovadoPor) return { status: 'fechada', motivoFechamento: 'aprovada' };
  if (st === 'recusado' || st === 'recusada') return { status: 'fechada', motivoFechamento: 'recusada' };
  if (st === 'fechada') {
    const m = (body.motivo ?? '').toLowerCase();
    const motivo: MotivoFechamento =
      m === 'arquivada' ? 'arquivada' :
      m === 'encaminhada' ? 'encaminhada' :
      m === 'promovida' ? 'promovida' : 'resolvida';
    return { status: 'fechada', motivoFechamento: motivo };
  }
  if (st === 'aberta' || st === 'aguardando-paciente' || st === 'pendente-aprovacao' || st === 'pendente-triagem') {
    return { status: st, motivoFechamento: undefined };
  }
  return { status: padrao, motivoFechamento: undefined };
}

function mapearSolicitacaoBackend(body: SolicitacaoBody): SolicitacaoMapeada {
  // Data real de criação (o backend guarda só o dia); sem ela, usa agora
  const ts = body.criadaEm && /^\d{4}-\d{2}-\d{2}/.test(body.criadaEm)
    ? new Date(body.criadaEm.slice(0, 10) + 'T12:00:00').toISOString()
    : new Date().toISOString();
  // Programa pelo perfil (sexo/idade), não só pelo prefixo do protocolo:
  // mulher = Apolônias do Bem; jovem homem 11–17 = Dentista do Bem
  const idade = calcularIdade(body.dataNasc);
  const sexo = normalizarSexo(body.sexo);
  const programa: Programa = programaPorPerfil(body.sexo, idade, body.protocolo);
  const ehApolonia = programa === 'Apolônias do Bem';
  const tipo = ehApolonia ? 'Apolônia do Bem' : 'Beneficiário';

  // Primeira mensagem do thread = necessidade + descrição (se houver)
  const textoInicial = body.descricao && body.descricao.trim()
    ? `${body.necessidade}\n\n${body.descricao}`
    : body.necessidade;

  const p = (body.prioridade ?? '').toLowerCase();
  const prioridadeDoBanco: Prioridade | undefined =
    p === 'alta' ? 'Alta' : p === 'baixa' ? 'Baixa' : p === 'media' || p === 'média' ? 'Media' : undefined;

  const preview = body.necessidade.length > 80
    ? body.necessidade.slice(0, 80) + '…'
    : body.necessidade;

  return {
    id: body.rgCpf, // PK backend
    protocolo: body.protocolo,                         
    nome: body.nome,
    iniciais: gerarIniciais(body.nome),
    idade,
    sexo,
    cidade: undefined,
    telefone: body.telefone,                       // backend ainda não tem campo cidade
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
    data: atualizarTempoRelativo(ts),
    ultimaAtualizacao: ts,
    prioridade: prioridadeDoBanco ?? 'Media',   // default até admin clicar "Reclassificar"
    score: prioridadeDoBanco && body.scoreMl ? body.scoreMl : 0.5,
    prioridadeDoBanco: !!prioridadeDoBanco,
    dadosCadastro: {
      renda:       body.renda,
      necessidade: body.necessidade,
      descricao:   body.descricao,
      comoSoube:   body.comoSoube,
      criadaEm:    body.criadaEm,
    },
    ...estadoDoBackend(body, ehApolonia ? 'pendente-triagem' : 'pendente-aprovacao'),
    ...(body.recusadoEm || body.recusadoPor
      ? { infoRecusa: { motivo: 'outro' as const, detalhe: body.detalhe, recusadaEm: (body.recusadoEm ?? '').slice(0, 10), recusadaPor: body.recusadoPor ?? 'Admin' } }
      : {}),
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
  await enviarParaTriagem(id, aprovadaPor, 'aprovada');
}

/**
 * Fluxo único de "Aprovar" e "Promover": grava a triagem no banco (sem duplicar)
 * e só depois marca a solicitação como aprovada no banco.
 */
async function enviarParaTriagem(
  id: string,
  aprovadaPor: string,
  motivo: 'aprovada' | 'promovida',
): Promise<void> {
  const sol = solicitacoes.find((s) => s.id === id);
  if (!sol) throw new Error('Solicitação não encontrada');

  // Dados completos no Oracle (CPF, nascimento, CEP) — o cache local da Central não guarda.
  let detalhe: SolicitacaoBody | undefined;
  let triagemJaExiste = false;
  if (sol.protocolo) {
    try {
      detalhe = await solicitacaoService.buscarPorProtocolo(sol.protocolo);
    } catch (err) {
      console.warn('[central] não consegui ler a solicitação completa no backend:', err);
    }
    // Evita triagem duplicada se uma tentativa anterior já gravou e só a aprovação falhou
    try {
      const existente = await triagemService.buscarPorProtocolo(sol.protocolo);
      triagemJaExiste = !!existente?.idTriagem;
    } catch { /* sem triagem para este protocolo */ }
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

  // 1) Triagem no banco. Se falhar, PARA aqui: nada é aprovado e o erro aparece na tela.
  if (!triagemJaExiste) {
    await criarTriagem({
      nome: sol.nome,
      idade: sol.idade ?? 0,
      cidade: cidadeNome || 'São Paulo',
      estado: estadoSigla || 'SP',
      cep: detalhe?.cep ?? '',
      programa,
      necessidade,
      especialidadeNecessaria: 'Clínico geral',
      severidade,
      origemTipo: 'central',
      origemDetalhe: `${motivo === 'aprovada' ? 'Aprovada' : 'Promovida'} por ${aprovadaPor} via Central de Mensagens`,
      pacienteRgCpf: detalhe?.rgCpf || (sol.protocolo ? sol.id : undefined),
      dataNasc: detalhe?.dataNasc,
      protocolo: sol.protocolo,
    });
  }

  // 2) Aprovação da solicitação no banco
  if (sol.protocolo) {
    try {
      await solicitacaoService.aprovar(sol.protocolo, aprovadaPor);
    } catch (err) {
      console.error('[central] erro ao aprovar no backend:', err);
      throw new Error('A triagem foi criada, mas a solicitação não foi marcada no servidor. Tente de novo (não duplica).');
    }
  }

  fechar(id, motivo);
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