import type { Prioridade } from '../data/central';

const ML_API_URL = import.meta.env.VITE_ML_API_URL ?? 'https://ml-tdb.onrender.com';
const ML_TIMEOUT_MS = 60_000; // Render free tier tem cold start ~30-50s

// ─── Tipos do contrato da API ─────────────────────────

type ProgramaML = 'apolonas_do_bem' | 'dentista_do_bem';
type SexoML = 'feminino' | 'masculino';
type ViolenciaML = 'nenhuma' | 'leve' | 'grave';
type VulnerabilidadeML = 'baixa' | 'media' | 'alta';
type DanoML = 'nenhum' | 'leve' | 'moderado' | 'grave';
type PedidoML = 'consulta' | 'emergencia';
type TratamentoML = 'canal' | 'extracao' | 'restauracao' | 'limpeza';

interface MLPayload {
  programa: ProgramaML;
  tempo_espera: number;
  sexo: SexoML;
  idade: number;
  tipo_violencia: ViolenciaML;
  vulnerabilidade: VulnerabilidadeML;
  dano_dentario: DanoML;
  tipo_pedido: PedidoML;
  tipo_tratamento: TratamentoML;
}

interface MLResponse {
  prediction: 'ALTA' | 'BAIXA' | 'MEDIA';
  probabilities?: { ALTA?: number; BAIXA?: number; MEDIA?: number };
}

// ─── Interface pública (mantida) ──────────────────────

export interface MLInput {
  texto: string;
  idade?: number;
  canal: string;
  programa?: string;
  tipo?: string;
}

export interface MLResult {
  prioridade: Prioridade;
  score: number;
  featuresUsadas?: {
    idade?: string;
    programa?: string;
    canal?: string;
  };
  modeloVersao?: string;
}

// ─── Heurística: extrai os 9 campos da API a partir do texto + contexto ──

function mapearPayload(input: MLInput): MLPayload {
  const t = input.texto.toLowerCase();
  const idade = input.idade ?? 30;

  // ── Programa ──
  let programa: ProgramaML;
  if (idade < 18) programa = 'dentista_do_bem';
  else if (input.tipo?.includes('Beneficiária')) programa = 'apolonas_do_bem';
  else programa = 'dentista_do_bem';

  // ── Sexo ── (heurística simples, default feminino pra Apolônias)
  const sexo: SexoML = programa === 'apolonas_do_bem' ? 'feminino' : 'feminino';

  // ── Tipo de violência (palavras-chave) ──
  let tipo_violencia: ViolenciaML = 'nenhuma';
  if (/(violência|violencia|vítima|vitima|agressão|agressao|abuso)/.test(t)) {
    tipo_violencia = 'grave';
  } else if (/(briga|conflito|machucad)/.test(t)) {
    tipo_violencia = 'leve';
  }

  // ── Vulnerabilidade ──
  let vulnerabilidade: VulnerabilidadeML = 'media';
  if (/(situação difícil|situacao dificil|pobreza|sem condições|sem condicoes|baixa renda|carente)/.test(t)) {
    vulnerabilidade = 'alta';
  } else if (input.canal === 'Email' && input.tipo?.includes('Doador')) {
    vulnerabilidade = 'baixa';
  }

  // ── Dano dentário ──
  let dano_dentario: DanoML = 'leve';
  if (/(dor forte|dor muito|dias.*dor|dor.*dias|não consigo|emergência|emergencia|urgente|sangue|sangrando|quebrou|quebrado)/.test(t)) {
    dano_dentario = 'grave';
  } else if (/(dor|inflamad|infeccion)/.test(t)) {
    dano_dentario = 'moderado';
  } else if (/(dúvida|duvida|confirmação|confirmacao|agendamento|consulta marcada)/.test(t)) {
    dano_dentario = 'nenhum';
  }

  // ── Tipo de pedido ──
  const tipo_pedido: PedidoML =
    dano_dentario === 'grave' || /(urgente|emergência|emergencia|socorro)/.test(t)
      ? 'emergencia'
      : 'consulta';

  // ── Tipo de tratamento (default contextual) ──
  let tipo_tratamento: TratamentoML = 'restauracao';
  if (/(canal|endodontia)/.test(t)) tipo_tratamento = 'canal';
  else if (/(extra[íi]r|arrancar|tirar dente)/.test(t)) tipo_tratamento = 'extracao';
  else if (/(limpeza|profilaxia|tártaro|tartaro)/.test(t)) tipo_tratamento = 'limpeza';

  // ── Tempo de espera (em dias) ──
  // Heurística: solicitação recém-chegada = 1 dia. Pode ser refinado.
  const tempo_espera = 1;

  return { programa, sexo, idade, tempo_espera, tipo_violencia, vulnerabilidade, dano_dentario, tipo_pedido, tipo_tratamento };
}

// ─── Mapping da resposta ──────────────────────────────

const MAPA_PRIORIDADE: Record<MLResponse['prediction'], Prioridade> = {
  ALTA: 'Alta',
  BAIXA: 'Baixa',
  MEDIA: 'Media',
};

function descreverFeatures(payload: MLPayload): MLResult['featuresUsadas'] {
  return {
    idade: `${payload.idade} anos · ${payload.idade < 18 ? 'menor de idade · faixa crítica' : payload.idade >= 50 ? 'idade vulnerável (50+)' : 'adulto'}`,
    programa: `${payload.programa === 'apolonas_do_bem' ? 'Apolônias do Bem' : 'Dentista do Bem'} · vulnerabilidade ${payload.vulnerabilidade}`,
    canal: `${payload.tipo_pedido === 'emergencia' ? 'Emergência' : 'Consulta'} · dano ${payload.dano_dentario} · violência ${payload.tipo_violencia}`,
  };
}

// ─── Chamada à API ────────────────────────────────────

export async function classificarPrioridade(input: MLInput): Promise<MLResult> {
  const payload = mapearPayload(input);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const response = await fetch(`${ML_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const erroDetalhe = await response.text().catch(() => '');
      throw new Error(`API retornou ${response.status}: ${erroDetalhe.slice(0, 200)}`);
    }

    const data = (await response.json()) as MLResponse;

    if (!data.prediction || !MAPA_PRIORIDADE[data.prediction]) {
      throw new Error(`Resposta inesperada da API: ${JSON.stringify(data).slice(0, 200)}`);
    }

    const prioridade = MAPA_PRIORIDADE[data.prediction];

    // Score = probabilidade da classe predita (não a max)
    const score = data.probabilities?.[data.prediction] ?? 0.85;

    return {
      prioridade,
      score: Math.round(score * 100) / 100,
      featuresUsadas: descreverFeatures(payload),
      modeloVersao: 'ml-tdb-v1',
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Timeout — a API ML demorou demais. Render free tier pode estar em cold start, tente novamente.');
    }
    throw err;
  }
}