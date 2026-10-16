import { criarAtendimentoDeTriagem } from './atendimentos';
import type { Atendimento } from '../data/atendimentos';
import {
  triagemService,
  dentistaService,
  type TriagemBody,
  type DentistaBody,
  type ConviteBody,
} from '../../../Services/api';

import {
  KPIS_TRIAGENS_MOCK,
  type KpiData,
  type Paciente,
  type Dentista,
  type Programa,
  type Severidade,
  type RespostaConvite,
} from '../data/triagens';

import type { MatchResult } from '../Utils/Geo';

// ─── Helpers de mapeamento Backend ↔ Frontend ────
function gerarIniciaisDoNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter((s) => !['Dr.', 'Dra.'].includes(s));
  if (partes.length === 0) return 'XX';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** Aceita 'YYYY-MM-DD' (ou com hora) e o formato array do Jackson [ano, mes, dia]. */
function paraIsoData(v: unknown): string | undefined {
  if (Array.isArray(v) && v.length >= 3) {
    const [a, m, d] = v as number[];
    return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return undefined;
}

function idadeDe(iso?: string): number {
  if (!iso) return 0;
  const n = new Date(iso + 'T12:00:00');
  const h = new Date();
  let idade = h.getFullYear() - n.getFullYear();
  const m = h.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && h.getDate() < n.getDate())) idade--;
  return idade >= 0 && idade < 130 ? idade : 0;
}

function diasDesde(iso?: string): number {
  if (!iso) return 0;
  const inicio = new Date(iso + 'T12:00:00').getTime();
  const dias = Math.floor((Date.now() - inicio) / 86_400_000);
  return dias > 0 ? dias : 0;
}

/** Triagens com esses status já saíram da fila (ex.: convite aceito vira atendimento). */
const STATUS_FORA_DA_FILA = ['aceito', 'aceita', 'concluido', 'concluida', 'cancelado', 'cancelada', 'removido', 'removida'];

function gerarRgCpfTemporario(): string {
  // Backend exige pacienteRgCpf como string; ainda não capturamos CPF real no form
  return `t${Date.now()}${Math.floor(Math.random() * 999)}`;
}

function mapearTriagemBackend(t: TriagemBody): Paciente {
  // Backend pode mandar EnderecoDTO com cidade/estado; se não vier, usa defaults
  const dto = (t as TriagemBody & { dto?: { cidade?: string; estado?: string; uf?: string } }).dto;
  const cidade = dto?.cidade ?? 'São Paulo';
  const estado = (dto?.estado ?? dto?.uf ?? 'SP').toUpperCase();
  const coords = COORDS_POR_ESTADO[estado] ?? COORDS_POR_ESTADO.SP;

  // Mapeia prioridade (backend) → severidade (frontend) — mesmo conceito, nomes diferentes
  const severidade: Severidade =
    t.prioridade === 'Alta'  ? 'Alta'  :
    t.prioridade === 'Baixa' ? 'Baixa' : 'Media';

  const programa: Programa =
    t.programa === 'Apolônias do Bem' ? 'Apolônias do Bem' : 'Dentista do Bem';

  return {
    id: t.pacienteRgCpf || `t${t.idTriagem ?? Date.now()}`,
    idTriagem: t.idTriagem,
    nome: t.pacienteNome,
    iniciais: gerarIniciaisDoNome(t.pacienteNome),
    idade: idadeDe(paraIsoData(t.dataNasc)),
    cidade,
    estado,
    cep: t.cep ?? '',
    coords,
    programa,
    necessidade: t.observacaoAdmin ?? t.especialidadeNescessaria ?? 'A definir',
    especialidadeNecessaria: t.especialidadeNescessaria ?? 'Clínico geral',
    severidade,
    diasNaFila: diasDesde(paraIsoData(t.dataEntradaFila)),
    origem: { tipo: 'manual', detalhe: t.protocolo ? `Protocolo ${t.protocolo}` : 'Cadastrado no banco' },
    statusVinculacao: 'aguardando',
  };
}

  // O backend (DentistaBody) ainda não tem cidade/estado/slots. Esses campos ficam
// "a confirmar" na UI até entrarem no banco (já listados no handoff do Matheus).
let dentistasTriagem: Dentista[] = [];

function mapearDentistaParaTriagem(b: DentistaBody): Dentista {
  return {
    id: b.rgCpf,
    nome: b.nome,
    iniciais: gerarIniciaisDoNome(b.nome),
    especialidade: b.especializacao ?? 'Clínico geral',
    cidade: '',                            // backend ainda não fornece
    estado: '',
    coords: { lat: -23.55, lng: -46.64 },  // neutro — Opção A não usa distância
    vinculos: b.nAtendimentos ?? 0,        // proxy real (nº de atendimentos); troque por 0 se preferir
    rating: b.avaliacao ?? 0,
    slotsDisponiveis: -1,                  // -1 = sem dado de agenda (UI mostra "a confirmar")
  };
}

export async function carregarDentistasTriagemReais(): Promise<{ count: number; fonte: 'backend' | 'vazio' }> {
  try {
    const lista = await dentistaService.listar();
    if (Array.isArray(lista) && lista.length > 0) {
      dentistasTriagem = lista
        .filter((d) => {
          const s = (d.status ?? '').toLowerCase();
          return s !== 'rejeitado' && s !== 'inativo' && s !== 'inativa' && s !== 'suspensa' && s !== 'suspenso';
        })
        .map(mapearDentistaParaTriagem);
      return { count: dentistasTriagem.length, fonte: 'backend' };
    }
    dentistasTriagem = [];
    return { count: 0, fonte: 'vazio' };
  } catch (err) {
    console.warn('[triagens] backend de dentistas indisponível:', err);
    return { count: dentistasTriagem.length, fonte: 'vazio' };
  }
}

/* HOJE: mock + matching local (haversine) com estado mutável em memória.
   AMANHÃ: cada função vira fetch ao backend.
   - obterKpis()         vira GET    /api/triagens/kpis
   - listarFila()        vira GET    /api/triagens/fila
   - sugerirDentistas()  vira POST   /api/triagens/{pacienteId}/matching
   - convidarDentista()  vira POST   /api/triagens/{pacienteId}/convites
   - cancelarConvite()   vira DELETE /api/triagens/{pacienteId}/convites
   - criarTriagem()      vira POST   /api/triagens
   A página NÃO precisa ser refatorada quando isso acontecer. */

export interface SugestaoDentista {
  dentista: Dentista;
  match: MatchResult;
}

// ─── Persistência localStorage ────────────────────
const LS_TRIAGENS = 'tdb_triagens';

function persistir(): void {
  try {
    localStorage.setItem(LS_TRIAGENS, JSON.stringify(pacientes));
  } catch (err) {
    console.warn('[triagens] erro ao persistir:', err);
  }
}

function hidratar(): Paciente[] | null {
  try {
    const raw = localStorage.getItem(LS_TRIAGENS);
    return raw ? (JSON.parse(raw) as Paciente[]) : null;
  } catch {
    return null;
  }
}

// Estado mutável em memória — simula o estado do backend.
let pacientes: Paciente[] = hidratar() ?? [];

// Triagens que já viraram atendimento (status 'aceito' no banco) — KPI "Vinculações"
let totalVinculadas: number | null = null;

// Coordenadas aproximadas das capitais por UF — usadas no matching de pacientes novos.
const COORDS_POR_ESTADO: Record<string, { lat: number; lng: number }> = {
  AC: { lat:  -9.97, lng: -67.81 }, AL: { lat:  -9.65, lng: -35.71 },
  AM: { lat:  -3.12, lng: -60.02 }, AP: { lat:   0.03, lng: -51.07 },
  BA: { lat: -12.97, lng: -38.51 }, CE: { lat:  -3.71, lng: -38.54 },
  DF: { lat: -15.83, lng: -47.86 }, ES: { lat: -20.31, lng: -40.31 },
  GO: { lat: -16.69, lng: -49.26 }, MA: { lat:  -2.53, lng: -44.30 },
  MG: { lat: -19.92, lng: -43.94 }, MS: { lat: -20.46, lng: -54.62 },
  MT: { lat: -15.60, lng: -56.10 }, PA: { lat:  -1.45, lng: -48.49 },
  PB: { lat:  -7.12, lng: -34.86 }, PE: { lat:  -8.05, lng: -34.88 },
  PI: { lat:  -5.09, lng: -42.80 }, PR: { lat: -25.43, lng: -49.27 },
  RJ: { lat: -22.91, lng: -43.17 }, RN: { lat:  -5.79, lng: -35.21 },
  RO: { lat:  -8.76, lng: -63.90 }, RR: { lat:   2.82, lng: -60.67 },
  RS: { lat: -30.03, lng: -51.23 }, SC: { lat: -27.59, lng: -48.55 },
  SE: { lat: -10.91, lng: -37.07 }, SP: { lat: -23.55, lng: -46.64 },
  TO: { lat: -10.18, lng: -48.33 },
};

export function obterKpis(): KpiData[] {
  // ─── HOJE: cálculo dinâmico sobre o estado real da fila ───
  // Mesma estratégia da Central: KPIs calculados sobre o array `pacientes`
  // (que já reflete os dados do Oracle via carregarTriagensReais).
  //
  // FUTURO: GET /api/triagens/kpis (endpoint dedicado consolidando tudo,
  // inclusive vinculações da semana e tendências mês a mês).

  const totalNaFila = pacientes.length;

  const tempoMedio = totalNaFila > 0
    ? Math.round(pacientes.reduce((sum, p) => sum + p.diasNaFila, 0) / totalNaFila)
    : 0;

  const fila60Dias = pacientes.filter((p) => p.diasNaFila > 60).length;
  const novosNaSemana = pacientes.filter((p) => p.diasNaFila <= 6).length;
  const maisAntigo = totalNaFila > 0 ? Math.max(...pacientes.map((p) => p.diasNaFila)) : 0;

  return [
    // [0] Pacientes na fila — total real + entradas dos últimos 7 dias
    {
      ...KPIS_TRIAGENS_MOCK[0],
      value: String(totalNaFila),
      sub: novosNaSemana > 0 ? `+${novosNaSemana} nos últimos 7 dias` : 'nenhuma entrada nos últimos 7 dias',
    },

    // [1] Tempo médio na fila — real; o sub mostra quem espera há mais tempo
    {
      label: KPIS_TRIAGENS_MOCK[1].label,
      value: `${tempoMedio} ${tempoMedio === 1 ? 'dia' : 'dias'}`,
      sub: totalNaFila > 0 ? `mais antigo: ${maisAntigo} ${maisAntigo === 1 ? 'dia' : 'dias'}` : 'fila vazia',
      subTone: maisAntigo > 60 ? 'danger' : maisAntigo > 30 ? 'warning' : undefined,
    },

    // [2] Vinculações — triagens que já viraram atendimento (status 'aceito' no banco)
    {
      label: 'Vinculações realizadas',
      value: totalVinculadas === null ? '—' : String(totalVinculadas),
      sub: totalVinculadas === null ? 'carregando…' : 'pacientes já vinculados a um dentista',
    },

    // [3] Fila +60 dias — real
    { ...KPIS_TRIAGENS_MOCK[3], value: String(fila60Dias) },
  ];
}

export function contarFila60Dias(): number {
  return pacientes.filter((p) => p.diasNaFila > 60).length;
}

/**
 * Puxa triagens do backend Java/Oracle e MESCLA com o estado local.
 *
 * Mesma estratégia do central.ts: preserva pacientes locais (mocks ou cadastros offline)
 * e adiciona/atualiza com os que vieram do Oracle. A UI deve chamar isso no mount
 * da TriagensPage pra garantir consistência entre navegadores (você ↔ Matheus).
 */
/**
 * Status do convite de cada triagem vem de GET /triagem/convite/{idTriagem}.
 * Assim o que o dentista aceita/recusa no portal aparece aqui, em qualquer computador.
 * Se a consulta de uma triagem falhar, mantém o que já estava (não apaga nada em silêncio).
 */
async function sincronizarConvites(lista: Paciente[]): Promise<Paciente[]> {
  const st = (c: ConviteBody) => (c.status ?? '').toLowerCase().trim();
  return Promise.all(
    lista.map(async (p) => {
      if (!p.idTriagem) return p;
      let convites: ConviteBody[];
      try {
        convites = await triagemService.listarConvitesDaTriagem(p.idTriagem);
      } catch (err) {
        console.warn(`[triagens] convites da triagem ${p.idTriagem} indisponíveis:`, err);
        return p;
      }
      if (!Array.isArray(convites)) return p;

      const aberto = convites
        .filter((c) => st(c) === 'pendente')
        .sort((a, b) => (b.idConvite ?? 0) - (a.idConvite ?? 0))[0];

      const historicoLocal = p.historicoConvites ?? [];
      const recusasBanco: RespostaConvite[] = convites
        .filter((c) => st(c) === 'recusado')
        .map((c) => {
          const local = historicoLocal.find((h) => h.dentistaId === c.dentistaRgCpf && h.resposta === 'recusado');
          return {
            dentistaId:   c.dentistaRgCpf,
            dentistaNome: c.dentistaNome ?? local?.dentistaNome ?? 'Dentista',
            resposta:     'recusado',
            dataResposta: local?.dataResposta ?? '',          // o banco não guarda a data da recusa
            motivoRecusa: c.motivoRecusado ?? local?.motivoRecusa,
          };
        });
      const idsNoBanco = new Set(convites.map((c) => c.dentistaRgCpf));
      const soLocais = historicoLocal.filter((h) => !idsNoBanco.has(h.dentistaId));

      return {
        ...p,
        statusVinculacao:    aberto ? 'convite-enviado' : 'aguardando',
        dentistaConvidadoId: aberto?.dentistaRgCpf,
        idConviteAtivo:      aberto?.idConvite,
        historicoConvites:   [...soLocais, ...recusasBanco],
      };
    }),
  );
}

export async function carregarTriagensReais(): Promise<{
  count: number;
  fonte: 'backend' | 'mock';
}> {
  try {
    await carregarDentistasTriagemReais();
    const lista = await triagemService.listar();
    if (!Array.isArray(lista)) return { count: pacientes.length, fonte: 'mock' };

    totalVinculadas = lista.filter((t) => ['aceito', 'aceita'].includes((t.status ?? '').toLowerCase().trim())).length;

    // O banco é a fonte da verdade da fila. Do estado local só aproveitamos o que o
    // banco ainda não guarda (convite em andamento, histórico, origem detalhada).
    const locaisPorIdTriagem = new Map(
      pacientes.filter((p) => p.idTriagem).map((p) => [p.idTriagem as number, p]),
    );

    const doBackend = lista
      .filter((t) => !STATUS_FORA_DA_FILA.includes((t.status ?? '').toLowerCase().trim()))
      .map(mapearTriagemBackend)
      .map((bp) => {
        const local = bp.idTriagem ? locaisPorIdTriagem.get(bp.idTriagem) : undefined;
        if (!local) return bp;
        return {
          ...bp,
          statusVinculacao:    local.statusVinculacao,
          dentistaConvidadoId: local.dentistaConvidadoId,
          idConviteAtivo:      local.idConviteAtivo,
          historicoConvites:   local.historicoConvites,
          origem:              local.origem,
          idade:               bp.idade || local.idade,
        };
      });

    // Convites: o banco é a fonte (o dentista responde pelo portal, em outro computador)
    const doBackendComConvites = await sincronizarConvites(doBackend);

    // Itens criados aqui que NÃO chegaram ao banco: continuam visíveis, marcados
    // como pendentes (nunca somem em silêncio). Se o banco já tem o mesmo paciente,
    // o local é descartado para não duplicar.
    const idsBackend   = new Set(doBackend.map((p) => p.id));
    const nomesBackend = new Set(doBackend.map((p) => p.nome.trim().toLowerCase()));
    const pendentes = pacientes
      .filter((p) => !p.idTriagem)
      .filter((p) => !idsBackend.has(p.id) && !nomesBackend.has(p.nome.trim().toLowerCase()))
      .map((p) => ({ ...p, pendenteSync: true }));

    pacientes = [...pendentes, ...doBackendComConvites];
    persistir();
    return { count: pacientes.length, fonte: 'backend' };
  } catch (err) {
    console.warn('[triagens] backend indisponível, mantendo dados locais:', err);
    return { count: pacientes.length, fonte: 'mock' };
  }
}

export function listarFila(): Paciente[] {
  // PROD: GET /api/triagens/fila
  return pacientes;
}

export function listarDentistas(): Dentista[] {
  // PROD: GET /api/dentistas
  return dentistasTriagem;
}

/** Retorna os N dentistas mais compatíveis com o paciente, ordenados por score. */
export function sugerirDentistas(paciente: Paciente, limite = 3): SugestaoDentista[] {
  // Opção A: sem coords/agenda reais, o score usa especialidade + rating.
  //          distanciaKm = -1 sinaliza "sem localização" (a UI mostra "a confirmar").
  return dentistasTriagem
    .map((d) => {
      let especialidadeScore: number;
      if (d.especialidade === paciente.especialidadeNecessaria) especialidadeScore = 1;
      else if (d.especialidade === 'Clínico geral') especialidadeScore = 0.85;
      else especialidadeScore = 0.5;

      const ratingScore = (d.rating ?? 0) / 5;              // 0..1
      const score = 0.7 * especialidadeScore + 0.3 * ratingScore;

      return {
        dentista: d,
        match: { score, scorePercent: Math.round(score * 100), distanciaKm: -1 },
      };
    })
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limite);
}

/** Envia convite de um dentista para um paciente. Paciente passa pra status 'convite-enviado'. */
export async function convidarDentista(pacienteId: string, dentistaId: string): Promise<void> {
  const paciente = pacientes.find((p) => p.id === pacienteId);
  if (!paciente) throw new Error('Paciente não encontrado');
  const dentista = dentistasTriagem.find((d) => d.id === dentistaId);

  // O convite precisa estar no banco: é de lá que o dentista o lê no portal.
  if (!paciente.idTriagem) throw new Error('Essa triagem ainda não foi salva no banco');
  if (!dentista) throw new Error('Dentista não encontrado');
  const res = await triagemService.convidar(paciente.idTriagem, {
    dentistaRgCpf: dentistaId,                // id do dentista = rgCpf do banco
    dentistaNome: dentista.nome,
    mensagem: 'Convite gerado via Central de Triagens',
  });
  const idConviteAtivo: number | undefined = res?.conviteId;

  pacientes = pacientes.map((p) =>
    p.id === pacienteId
      ? {
          ...p,
          statusVinculacao: 'convite-enviado',
          dentistaConvidadoId: dentistaId,
          idConviteAtivo,
        }
      : p,
  );
  persistir();
}

/** Cancela o convite ativo de um paciente. Volta pra status 'aguardando'. */
export async function cancelarConvite(pacienteId: string): Promise<void> {
  const paciente = pacientes.find((p) => p.id === pacienteId);

  // Exclui no banco; se falhar, o erro sobe (senão o dentista continuaria vendo o convite)
  if (paciente?.idConviteAtivo) {
    await triagemService.excluirConvite(paciente.idConviteAtivo);
  }

  pacientes = pacientes.map((p) =>
    p.id === pacienteId
      ? {
          ...p,
          statusVinculacao: 'aguardando',
          dentistaConvidadoId: undefined,
          idConviteAtivo: undefined,
        }
      : p,
  );
  persistir();
}

export interface NovaTriagemInput {
  nome: string;
  idade: number;
  cidade: string;
  estado: string;
  cep: string;
  programa: Programa;
  necessidade: string;
  especialidadeNecessaria: string;
  severidade: Severidade;
  origemTipo: 'central' | 'escola' | 'manual';
  origemDetalhe: string;
  pacienteRgCpf?: string;   // CPF real (solicitação do site); sem ele usa um id temporário
  dataNasc?: string;        // YYYY-MM-DD
  protocolo?: string;       // protocolo da solicitação de origem (TDB-/APO-)
}

/** Cria uma nova entrada de triagem na fila. Retorna o paciente criado. */
export async function criarTriagem(data: NovaTriagemInput): Promise<Paciente> {
  const iniciais = gerarIniciaisDoNome(data.nome);
  const coords = COORDS_POR_ESTADO[data.estado.toUpperCase()] ?? { lat: -23.55, lng: -46.64 };
  const pacienteRgCpf = data.pacienteRgCpf || gerarRgCpfTemporario();
  const dataNasc = paraIsoData(data.dataNasc);

  // Banco primeiro e OBRIGATÓRIO: se o Oracle recusar, nada é criado e o erro sobe pra tela.
  let idTriagem: number | undefined;
  try {
    const res = await triagemService.cadastrar({
      pacienteNome: data.nome,
      pacienteRgCpf,
      programa: data.programa,
      prioridade: data.severidade,
      cep: (data.cep ?? '').replace(/\D/g, ''),
      especialidadeNescessaria: data.especialidadeNecessaria,  // sic typo backend
      observacaoAdmin: data.necessidade + (data.origemDetalhe ? ` · ${data.origemDetalhe}` : ''),
      ...(dataNasc ? { dataNasc } : {}),
      ...(data.protocolo ? { protocolo: data.protocolo } : {}),
    });
    // "idTriagem " (com espaço) cobre a versão antiga do backend
    const parsed = parseInt(String(res.idTriagem ?? res['idTriagem '] ?? ''), 10);
    if (!isNaN(parsed)) idTriagem = parsed;
  } catch (err) {
    console.error('[triagens] o banco recusou a triagem:', err);
    throw new Error('O servidor não gravou a triagem. Nada foi salvo — tente novamente.');
  }

  const novo: Paciente = {
    id: pacienteRgCpf,
    idTriagem,
    nome: data.nome,
    iniciais,
    idade: data.idade || idadeDe(dataNasc),
    cidade: data.cidade,
    estado: data.estado.toUpperCase(),
    cep: data.cep,
    coords,
    programa: data.programa,
    necessidade: data.necessidade,
    especialidadeNecessaria: data.especialidadeNecessaria,
    severidade: data.severidade,
    diasNaFila: 0,
    origem: { tipo: data.origemTipo, detalhe: data.origemDetalhe },
    statusVinculacao: 'aguardando',
  };

  pacientes = [novo, ...pacientes];
  persistir();
  return novo;
}

// ─── Aceitar/Recusar convite (vindo da página do dentista) ────────────

export interface AceitarConviteInput {
  pacienteId: string;
  dataAtendimento: string;       // YYYY-MM-DD
  horaAtendimento: string;       // HH:MM
  duracaoMinutos?: number;       // default: 60
  observacoes?: string;
  local?: string;                // default: "{cidade do dentista}-{UF}"
  especialidade?: string;        // default: especialidade do dentista
}

/** Dentista aceita o convite → cria primeiro atendimento + remove paciente da fila. */
export async function aceitarConvite(input: AceitarConviteInput): Promise<Atendimento> {
  const paciente = pacientes.find((p) => p.id === input.pacienteId);
  if (!paciente) throw new Error('Paciente não encontrado');
  if (paciente.statusVinculacao !== 'convite-enviado' || !paciente.dentistaConvidadoId) {
    throw new Error('Paciente não tem convite ativo');
  }

  const dentistaId = paciente.dentistaConvidadoId;
  const dentistaTriagem = dentistasTriagem.find((d) => d.id === dentistaId);
  const dentistaNome = dentistaTriagem?.nome ?? 'Dentista';
  const dentistaCidade = dentistaTriagem?.cidade ?? paciente.cidade;
  const dentistaEstado = dentistaTriagem?.estado ?? paciente.estado;

  // Backend-first: se tem idConviteAtivo, cria o atendimento no Oracle
  // Backend-first: se tem idConviteAtivo, cria o atendimento no Oracle
  if (paciente.idConviteAtivo) {
    try {
      await triagemService.aceitarConvite(paciente.idConviteAtivo, {
        dataAtendimento: `${input.dataAtendimento} ${input.horaAtendimento}`,
        duracaoMin: input.duracaoMinutos ?? 60,
        pacienteNome: paciente.nome,
        pacienteRgCpf: paciente.id,
        dentistaRgCpf: dentistaId,
        dentistaNome,
        programa: paciente.programa,
        especialidade: input.especialidade ?? paciente.especialidadeNecessaria,
        observacoes: input.observacoes,
      });
    } catch (err) {
      console.warn('[triagens] erro ao aceitar convite no backend:', err);
    }
  }

  // Cria o primeiro atendimento (chama service de atendimentos)
  const atendimento = await criarAtendimentoDeTriagem({
    pacienteId: paciente.id,
    pacienteNome: paciente.nome,
    pacienteIdade: paciente.idade,
    pacienteIniciais: paciente.iniciais,
    dentistaId,
    dentistaNome,
    data: input.dataAtendimento,
    hora: input.horaAtendimento,
    duracaoMinutos: input.duracaoMinutos ?? 60,
    programa: paciente.programa,
    especialidade: input.especialidade ?? dentistaTriagem?.especialidade ?? paciente.especialidadeNecessaria,
    local: input.local ?? `${dentistaCidade}-${dentistaEstado}`,
    observacoes: input.observacoes,
  });

  // Remove paciente da fila de triagens (já está em Atendimentos)
  pacientes = pacientes.filter((p) => p.id !== input.pacienteId);
  persistir();

  return atendimento;
}

/** Dentista recusa o convite → registra no histórico + volta paciente pra 'aguardando'. */
/** Dentista recusa o convite → registra no histórico + volta paciente pra 'aguardando'. */
export async function recusarConvite(input: {
  pacienteId: string;
  motivo: string;
}): Promise<void> {
  const paciente = pacientes.find((p) => p.id === input.pacienteId);
  if (!paciente) throw new Error('Paciente não encontrado');
  if (paciente.statusVinculacao !== 'convite-enviado' || !paciente.dentistaConvidadoId) {
    throw new Error('Paciente não tem convite ativo');
  }

  const dentistaId = paciente.dentistaConvidadoId;
  const dentistaTriagem = dentistasTriagem.find((d) => d.id === dentistaId);
  const dentistaNome = dentistaTriagem?.nome ?? 'Dentista';

  // Backend-first: se tem idConviteAtivo, recusa no Oracle
  if (paciente.idConviteAtivo) {
    try {
      await triagemService.recusarConvite(paciente.idConviteAtivo, input.motivo);
    } catch (err) {
      console.warn('[triagens] erro ao recusar convite no backend:', err);
    }
  }

  const novoRegistro: RespostaConvite = {
    dentistaId,
    dentistaNome,
    resposta: 'recusado',
    dataResposta: new Date().toISOString(),
    motivoRecusa: input.motivo,
  };

  pacientes = pacientes.map((p) =>
    p.id === input.pacienteId
      ? {
          ...p,
          statusVinculacao: 'aguardando',
          dentistaConvidadoId: undefined,
          idConviteAtivo: undefined,
          historicoConvites: [...(p.historicoConvites ?? []), novoRegistro],
        }
      : p,
  );
  persistir();
}

/** Lista convites pendentes que um dentista específico precisa responder. */
export function listarConvitesParaDentista(dentistaId: string): Paciente[] {
  // PROD: GET /api/dentistas/{dentistaId}/convites
  return pacientes.filter(
    (p) => p.statusVinculacao === 'convite-enviado' && p.dentistaConvidadoId === dentistaId,
  );
}

/**
 * Variante que aceita o NOME do dentista (usado pela página /meu-painel,
 * onde o dentista logado é identificado por rgCpf/nome, não pelo id interno).
 *
 * Faz matching tolerante: normaliza "Dr./Dra." e busca interseção de nomes.
 * Em produção, esse mapeamento sai porque backend e frontend compartilharão IDs.
 */
export function listarConvitesParaDentistaPorNome(nomeDentista: string): Paciente[] {
  const nomeNorm = nomeDentista.toLowerCase().replace(/^dra?\.?\s+/, '').trim();
  if (!nomeNorm) return [];
  const dent = dentistasTriagem.find((d) => {
    const dNorm = d.nome.toLowerCase().replace(/^dra?\.?\s+/, '').trim();
    return dNorm.includes(nomeNorm) || nomeNorm.includes(dNorm);
  });
  if (!dent) return [];
  return listarConvitesParaDentista(dent.id);
}