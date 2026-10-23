import type { Prioridade } from '../data/central';
import { normalizarSexo, programaPorPerfil } from './programa';

const ML_API_URL = import.meta.env.VITE_ML_API_URL ?? 'https://ml-tdb.onrender.com';
const ML_TIMEOUT_MS = 60_000; // Render free tier tem cold start ~30-50s

// ─── Contrato da API v2 ───────────────────────────────
// A API lê os textos do formulário como estão ("Ate 1 salario minimo",
// "Tratamento de canal", "Delegacia/CREAS"...) e a descrição livre do paciente.
// Regras e pontuação ficam todas no ML_TdB (regras.py) — aqui só enviamos dados.

interface MLPayloadV2 {
  programa: 'Dentista do Bem' | 'Apolônias do Bem';
  idade: number;
  sexo: 'feminino' | 'masculino';
  renda_familiar?: string;
  necessidade?: string;
  como_soube?: string;
  texto: string;
  tempo_espera: number;
}

interface MLResponseV2 {
  prediction: 'ALTA' | 'BAIXA' | 'MEDIA';
  probabilities?: { ALTA?: number; BAIXA?: number; MEDIA?: number };
  confianca?: number;
  pontuacao?: number;
  regra_critica?: string | null;
  fatores?: { fator: string; pontos: number }[];
  alertas?: string[];
  modelo_versao?: string;
  entrada_interpretada?: { renda?: string; sintoma?: string; vitima?: string; necessidade?: string };
}

// ─── Interface pública ────────────────────────────────

export interface MLInput {
  texto: string;
  idade?: number;
  sexo?: string;
  canal: string;
  programa?: string;
  tipo?: string;
  // Dados do formulário do site (quando a solicitação veio de lá)
  renda?: string;
  necessidade?: string;
  comoSoube?: string;
  /** Quando a solicitação chegou (ISO ou yyyy-mm-dd) — vira "dias na fila". */
  desde?: string;
}

export interface MLResult {
  prioridade: Prioridade;
  score: number;
  featuresUsadas?: {
    idade?: string;
    programa?: string;
    canal?: string;
    motivos?: string;
    alertas?: string;
  };
  modeloVersao?: string;
}

// ─── Montagem do payload ──────────────────────────────

function diasDesde(quando?: string): number {
  if (!quando) return 0;
  const t = new Date(/^\d{4}-\d{2}-\d{2}$/.test(quando) ? `${quando}T12:00:00` : quando).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

function montarPayload(input: MLInput): MLPayloadV2 {
  const programa =
    input.programa === 'Apolônias do Bem' || input.programa === 'Dentista do Bem'
      ? input.programa
      : programaPorPerfil(input.sexo, input.idade);
  const sexo = normalizarSexo(input.sexo) ?? (programa === 'Apolônias do Bem' ? 'feminino' : 'masculino');

  // Sem idade (ex.: contato por Instagram sem cadastro): usa a faixa típica do programa
  const idade = input.idade && input.idade > 0 ? input.idade : programa === 'Dentista do Bem' ? 14 : 35;

  return {
    programa,
    idade,
    sexo,
    renda_familiar: input.renda,
    necessidade: input.necessidade,
    como_soube: input.comoSoube,
    texto: input.texto,
    tempo_espera: diasDesde(input.desde),
  };
}

// ─── Mapping da resposta ──────────────────────────────

const MAPA_PRIORIDADE: Record<MLResponseV2['prediction'], Prioridade> = {
  ALTA: 'Alta',
  BAIXA: 'Baixa',
  MEDIA: 'Media',
};

const ROTULO_RENDA: Record<string, string> = {
  ate_1: 'renda até 1 SM',
  '1_a_2': 'renda 1 a 2 SM',
  '2_a_3': 'renda 2 a 3 SM',
  acima_3: 'renda acima de 3 SM',
};

function descrever(payload: MLPayloadV2, r: MLResponseV2): MLResult['featuresUsadas'] {
  const ent = r.entrada_interpretada ?? {};
  const faixaIdade = payload.programa === 'Dentista do Bem'
    ? payload.idade >= 11 && payload.idade <= 17
      ? `janela do programa${payload.idade >= 16 ? ' fechando' : ''}`
      : 'fora da faixa 11–17'
    : payload.idade < 18 ? 'menor de idade' : payload.idade >= 50 ? '50+' : 'adulta';
  const programaDetalhe = payload.programa === 'Dentista do Bem'
    ? (ent.renda && ROTULO_RENDA[ent.renda]) || 'renda não informada'
    : ent.vitima === 'sim' ? 'vítima de violência' : ent.vitima === 'nao' ? 'sem relato de violência' : 'violência não informada';

  const motivos = (r.fatores ?? []).slice(0, 4).map((f) => `${f.fator} (+${f.pontos})`).join('; ');

  return {
    idade: `${payload.idade} anos · ${faixaIdade}`,
    programa: `${payload.programa} · ${programaDetalhe}`,
    canal: r.regra_critica
      ? `Regra crítica · ${r.regra_critica}`
      : `Pontuação ${r.pontuacao ?? '—'}/100 · sintoma ${ent.sintoma ?? 'não informado'}`,
    ...(motivos ? { motivos } : {}),
    ...(r.alertas && r.alertas.length ? { alertas: r.alertas.join('; ') } : {}),
  };
}

// ─── Chamada à API ────────────────────────────────────

export async function classificarPrioridade(input: MLInput): Promise<MLResult> {
  const payload = montarPayload(input);

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

    const data = (await response.json()) as MLResponseV2;

    if (!data.prediction || !MAPA_PRIORIDADE[data.prediction]) {
      throw new Error(`Resposta inesperada da API: ${JSON.stringify(data).slice(0, 200)}`);
    }

    // Confiança = probabilidade da classe escolhida
    const score = data.confianca ?? data.probabilities?.[data.prediction] ?? 0.5;

    return {
      prioridade: MAPA_PRIORIDADE[data.prediction],
      score: Math.round(score * 100) / 100,
      featuresUsadas: descrever(payload, data),
      modeloVersao: data.modelo_versao ?? 'ml-tdb',
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Timeout — a API ML demorou demais. Render free tier pode estar em cold start, tente novamente.');
    }
    throw err;
  }
}
