interface Coord {
  lat: number;
  lng: number;
}

/**
 * Distância em km entre duas coordenadas (fórmula de Haversine).
 *
 * Para a apresentação, isto é suficiente e funciona offline.
 * Em produção, substituir pela Google Distance Matrix API
 * para considerar rotas reais (ruas, trânsito). A assinatura
 * da função pode ser mantida — só o cálculo interno muda.
 */
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

/** Pesos do score de compatibilidade. Ajustáveis sem mexer no componente. */
export const PESOS_MATCH = {
  proximidade:   0.4,
  slots:         0.3,
  especialidade: 0.3,
} as const;

export interface MatchInput {
  paciente: { coords: Coord; especialidadeNecessaria: string };
  dentista: { coords: Coord; especialidade: string; slotsDisponiveis: number };
}

export interface MatchResult {
  score: number;
  scorePercent: number;
  distanciaKm: number;
}

export function calcularMatch({ paciente, dentista }: MatchInput): MatchResult {
  const distanciaKm = calcularDistanciaKm(paciente.coords, dentista.coords);

  // Proximidade: 0–15km score=1, decai linearmente até 50km, >50km = 0
  const proximidadeScore =
    distanciaKm <= 15 ? 1 : Math.max(0, 1 - (distanciaKm - 15) / 35);

  // Slots: 0 slots = 0, 3+ slots = 1
  const slotsScore = Math.min(dentista.slotsDisponiveis / 3, 1);

  // Especialidade: match exato = 1, clínico geral = 0.85 (atende mas não é especialista),
  // outras especialidades = 0.5
  let especialidadeScore: number;
  if (dentista.especialidade === paciente.especialidadeNecessaria) {
    especialidadeScore = 1;
  } else if (dentista.especialidade === 'Clínico geral') {
    especialidadeScore = 0.85;
  } else {
    especialidadeScore = 0.5;
  }

  const score =
    PESOS_MATCH.proximidade * proximidadeScore +
    PESOS_MATCH.slots * slotsScore +
    PESOS_MATCH.especialidade * especialidadeScore;

  return {
    score,
    scorePercent: Math.round(score * 100),
    distanciaKm,
  };
}