interface Coord {
  lat: number;
  lng: number;
}

/**
 * O MATCH OFICIAL é calculado no backend (GET /triagem/{id}/sugestoes — MatchBO.java),
 * com a distância real de carro paciente → consultório pelo Google Maps (Routes API).
 * A chave do Google fica só no servidor (env GOOGLE_MAPS_API_KEY no Render).
 *
 * Este arquivo guarda os MESMOS pesos/regras para o fallback local, usado só quando
 * o backend não responde (ou a triagem ainda não foi salva no banco). Sem distância.
 * Se mudar um peso aqui, mude também em MatchBO.java.
 */

/** Distância em km entre duas coordenadas (Haversine, linha reta). */
export function calcularDistanciaKm(a: Coord, b: Coord): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Pesos do score de compatibilidade (iguais aos do MatchBO.java). */
export const PESOS_MATCH = {
  proximidade:   0.6,
  especialidade: 0.3,
  avaliacao:     0.1,
} as const;

const PROXIMIDADE_NEUTRA = 0.5;
const AVALIACAO_NEUTRA = 0.6;

export type TipoDistancia = 'rota' | 'linha_reta' | 'indisponivel';

export interface MatchResult {
  score: number;
  scorePercent: number;
  /** km até o consultório; -1 = "local a confirmar" */
  distanciaKm: number;
  /** minutos de carro; -1 = sem rota */
  duracaoMin?: number;
  tipoDistancia?: TipoDistancia;
}

// ─── Especialidades ─────────────────────────────
// O sistema grava a mesma especialidade de vários jeitos ("Clinico Geral" no cadastro
// do voluntário, "Clínico geral" na triagem, "Pediatria" x "Odontopediatria"...).
export const ESP = {
  CLINICO_GERAL:   'Clínico geral',
  ENDODONTIA:      'Endodontia',
  ORTODONTIA:      'Ortodontia',
  PERIODONTIA:     'Periodontia',
  CIRURGIA:        'Cirurgia buco-maxilo-facial',
  ODONTOPEDIATRIA: 'Odontopediatria',
  DENTISTICA:      'Dentística e estética',
  IMPLANTODONTIA:  'Implantodontia',
  PROTESE:         'Prótese',
  OUTRA:           'Outra',
} as const;

function normalizar(s?: string | null): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function especialidadeCanonica(valor?: string | null): string | null {
  const n = normalizar(valor);
  if (!n) return null;
  if (n.includes('pediatr')) return ESP.ODONTOPEDIATRIA;
  if (n.includes('endodon')) return ESP.ENDODONTIA;
  if (n.includes('ortodon')) return ESP.ORTODONTIA;
  if (n.includes('periodon')) return ESP.PERIODONTIA;
  if (n.includes('cirurg') || n.includes('bucomaxil') || n.includes('buco maxil')) return ESP.CIRURGIA;
  if (n.includes('implant')) return ESP.IMPLANTODONTIA;
  if (n.includes('dentistic') || n.includes('estetic')) return ESP.DENTISTICA;
  if (n.includes('protes')) return ESP.PROTESE;
  if (n.includes('clinic') || n.includes('geral')) return ESP.CLINICO_GERAL;
  return ESP.OUTRA;
}

const PISTAS: [RegExp, string][] = [
  [/\bcanal\b|endodon|pulpite/, ESP.ENDODONTIA],
  [/ortodon|\baparelho/, ESP.ORTODONTIA],
  [/periodon|gengiv/, ESP.PERIODONTIA],
  [/cirurg|\bsiso\b|extrac|extrair|bucomaxil/, ESP.CIRURGIA],
  [/implant/, ESP.IMPLANTODONTIA],
  [/protes|dentadura/, ESP.PROTESE],
  [/odontopediatr/, ESP.ODONTOPEDIATRIA],
  [/clareamento|faceta|estetic/, ESP.DENTISTICA],
];

/** Especialidade da triagem; se for genérica, tenta deduzir pela necessidade ("canal" → Endodontia). */
export function especialidadeNecessaria(especialidade?: string, necessidade?: string): string {
  const doCampo = especialidadeCanonica(especialidade);
  if (doCampo && doCampo !== ESP.CLINICO_GERAL && doCampo !== ESP.OUTRA) return doCampo;
  const n = normalizar(necessidade);
  for (const [re, esp] of PISTAS) if (re.test(n)) return esp;
  return ESP.CLINICO_GERAL;
}

export function scoreEspecialidade(necessaria: string, especializacaoDentista?: string): number {
  const dentista = especialidadeCanonica(especializacaoDentista) ?? ESP.CLINICO_GERAL;
  if (necessaria === dentista) return 1;
  if (necessaria === ESP.CLINICO_GERAL) return 0.8;
  if (dentista === ESP.CLINICO_GERAL) return 0.6;
  return 0.3;
}

export function scoreProximidade(km: number): number {
  if (km < 0 || Number.isNaN(km)) return PROXIMIDADE_NEUTRA;
  if (km <= 5) return 1;
  if (km >= 50) return 0;
  return 1 - (km - 5) / 45;
}

export function scoreAvaliacao(nota?: number): number {
  if (!nota || nota <= 0) return AVALIACAO_NEUTRA;
  return Math.min(nota, 5) / 5;
}

/** Match local (fallback): sem distância → proximidade neutra. */
export function calcularMatchLocal(
  necessaria: string,
  dentista: { especialidade: string; rating: number },
): MatchResult {
  const score =
    PESOS_MATCH.proximidade * scoreProximidade(-1) +
    PESOS_MATCH.especialidade * scoreEspecialidade(necessaria, dentista.especialidade) +
    PESOS_MATCH.avaliacao * scoreAvaliacao(dentista.rating);
  return { score, scorePercent: Math.round(score * 100), distanciaKm: -1, duracaoMin: -1, tipoDistancia: 'indisponivel' };
}

/** "3,4 km" · "12 km" · "≈ 3,4 km" (linha reta) · "local a confirmar" */
export function formatarDistancia(match: MatchResult, semDado = 'local a confirmar'): string {
  if (match.distanciaKm < 0) return semDado;
  const km = match.distanciaKm;
  const txt = km < 10
    ? km.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : Math.round(km).toLocaleString('pt-BR');
  const prefixo = match.tipoDistancia === 'linha_reta' ? '≈ ' : '';
  const tempo = match.duracaoMin && match.duracaoMin > 0 ? ` · ${formatarDuracao(match.duracaoMin)}` : '';
  return `${prefixo}${txt} km${tempo}`;
}

function formatarDuracao(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}
