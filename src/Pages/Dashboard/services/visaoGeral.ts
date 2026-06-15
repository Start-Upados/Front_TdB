import {
  KPIS_VISAO_GERAL_MOCK, GRAFICO_MENSAL_MOCK, ALERTAS_MOCK,
  DISTRIBUICAO_MOCK, TOTAL_MES_MOCK,
  type KpiData, type PontoMensal, type AlertaVisaoGeral, type DistribuicaoPrograma,
} from '../data/visaoGeral';
import { obterKpisFinanceiro } from './financeiro';
import { contarPacientesEmTratamento, contarAtendimentosNoMes } from './atendimentos';

/* ════════════════════════════════════════════════════════════════════════
 *  VISÃO GERAL — Service de leitura dos cards do dashboard
 * ════════════════════════════════════════════════════════════════════════
 *
 *  ESTADO ATUAL (síncrono, sem backend dedicado):
 *    KPIs:
 *      ✅ "Pacientes em tratamento" ← contarPacientesEmTratamento()  (services/atendimentos.ts)
 *      ✅ "Doações no mês"          ← obterKpisFinanceiro()           (services/financeiro.ts)
 *      🟡 "Atendimentos no mês"     ← mock fixo
 *      🟡 "Dentistas ativos"        ← mock fixo
 *    Gráfico/Alertas/Distribuição:  todos em mock
 *
 *  QUANDO O BACKEND ESTIVER PRONTO (endpoints /api/dashboard/*):
 *    1. Em cada função abaixo, descomentar o bloco "// FUTURO: backend"
 *       e remover/comentar o bloco "// HOJE: ..."
 *    2. Trocar a assinatura de cada função pra `async ... : Promise<...>`
 *    3. Na VisaoGeralPage.tsx, trocar as chamadas síncronas (`const kpis = obterKpis()`)
 *       por useState + useEffect (mesmo padrão da Central que já fizemos):
 *
 *         const [kpis, setKpis] = useState<KpiData[]>([]);
 *         useEffect(() => { obterKpis().then(setKpis); }, []);
 *
 *  Quando descomentar os fetchs, importar a base URL no topo:
 *    const API_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://backend-mjgv.onrender.com';
 *  (Ou reusar `request` do Services/api.ts criando um `dashboardService` lá.)
 * ════════════════════════════════════════════════════════════════════════ */


// ────────────────────────────────────────────────────────────────────────
// 1. KPIs DO TOPO
// ────────────────────────────────────────────────────────────────────────

export function obterKpis(): KpiData[] {
  /* ── FUTURO: backend dedicado ──────────────────────────────────────────
   * Quando /api/dashboard/kpis estiver pronto, transformar em async:
   *
   *   export async function obterKpis(): Promise<KpiData[]> {
   *     const res = await fetch(`${API_URL}/api/dashboard/kpis`);
   *     if (!res.ok) throw new Error('Falha ao carregar KPIs');
   *     return await res.json() as KpiData[];
   *   }
   * ─────────────────────────────────────────────────────────────────────── */

  // ── HOJE: híbrido (parte real via outros services, parte mock) ─────────
  const kpisFinanceiro = obterKpisFinanceiro();
  const { emTratamento, naFilaDeEspera } = contarPacientesEmTratamento();

  // Nome do mês anterior em português (pro sub "vs setembro/agosto/...")
  const hoje = new Date();
  const dMesAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  const nomeMesAnterior = dMesAnt.toLocaleString('pt-BR', { month: 'long' });

  // Formatador R$ compacto (84.000 → R$ 84k; 847 → R$ 847)
  const formatarBR = (valor: number): string =>
    valor >= 1000 ? `R$ ${Math.round(valor / 1000)}k` : `R$ ${Math.round(valor)}`;

  const variacaoDoacoes = kpisFinanceiro.variacao.doacoes;
  const subVariacao =
    variacaoDoacoes === 0
      ? `Sem variação vs ${nomeMesAnterior}`
      : `${variacaoDoacoes > 0 ? '+' : '-'}${formatarBR(Math.abs(variacaoDoacoes))} vs ${nomeMesAnterior}`;

  return [
    // [0] Atendimentos no mês — DINÂMICO via services/atendimentos
    (() => {
      const m = contarAtendimentosNoMes();
      const subTexto =
        m.anterior === 0
          ? `Sem comparação vs ${m.nomeMesAnterior}`
          : `${m.variacaoPct > 0 ? '+' : ''}${m.variacaoPct}% vs ${m.nomeMesAnterior}`;
      return {
        ...KPIS_VISAO_GERAL_MOCK[0],
        value: String(m.atual),
        sub: subTexto,
        subTone:
          m.variacaoPct > 0 ? ('success' as const) :
          m.variacaoPct < 0 ? ('danger'  as const) :
          undefined,
      };
    })(),

    // 2. Pacientes em tratamento — DINÂMICO via services/atendimentos
    {
      label: 'Pacientes em tratamento',
      value: String(emTratamento),
      sub: `${naFilaDeEspera} na fila de espera`,
    },

    // 3. Dentistas ativos — mock (futuro: GET /dentista/count?status=Ativa)
    KPIS_VISAO_GERAL_MOCK[2],

    // 4. Doações no mês — DINÂMICO via services/financeiro
    {
      label: 'Doações no mês',
      value: formatarBR(kpisFinanceiro.doacoesNoMes),
      sub: subVariacao,
      subTone: variacaoDoacoes > 0 ? ('success' as const)
             : variacaoDoacoes < 0 ? ('danger'  as const)
             : undefined,
    },
  ];
}


// ────────────────────────────────────────────────────────────────────────
// 2. GRÁFICO MENSAL DE ATENDIMENTOS (últimos 6 meses)
// ────────────────────────────────────────────────────────────────────────

export function obterGraficoMensal(): PontoMensal[] {
  /* ── FUTURO: backend ───────────────────────────────────────────────────
   *   export async function obterGraficoMensal(): Promise<PontoMensal[]> {
   *     const res = await fetch(`${API_URL}/api/dashboard/atendimentos-mensais?meses=6`);
   *     if (!res.ok) throw new Error('Falha ao carregar gráfico mensal');
   *     return await res.json() as PontoMensal[];
   *   }
   * ─────────────────────────────────────────────────────────────────────── */

  // ── HOJE: mock ─────────────────────────────────────────────────────────
  return GRAFICO_MENSAL_MOCK;
}


// ────────────────────────────────────────────────────────────────────────
// 3. ALERTAS "Precisa de atenção agora"
// ────────────────────────────────────────────────────────────────────────

export function listarAlertas(): AlertaVisaoGeral[] {
  /* ── FUTURO: backend ───────────────────────────────────────────────────
   *   export async function listarAlertas(): Promise<AlertaVisaoGeral[]> {
   *     const res = await fetch(`${API_URL}/api/dashboard/alertas`);
   *     if (!res.ok) throw new Error('Falha ao carregar alertas');
   *     return await res.json() as AlertaVisaoGeral[];
   *   }
   *
   * Alternativa SEM endpoint dedicado: derivar dos services existentes:
   *   - Alertas de "Alta sem resposta +24h" ← already feito em services/central.ts (obterKpis)
   *   - Alertas de "Mutirão em <X dias>"    ← derive de services/mutiroes.ts (listarProximos)
   *   - Alertas de "Voluntário inativo +90d" ← derive de services/voluntarios.ts
   * ─────────────────────────────────────────────────────────────────────── */

  // ── HOJE: mock ─────────────────────────────────────────────────────────
  return ALERTAS_MOCK;
}


// ────────────────────────────────────────────────────────────────────────
// 4. DISTRIBUIÇÃO POR PROGRAMA (Dentista do Bem vs Apolônias do Bem)
// ────────────────────────────────────────────────────────────────────────

export function obterDistribuicao(): { itens: DistribuicaoPrograma[]; total: number } {
  /* ── FUTURO: backend ───────────────────────────────────────────────────
   *   export async function obterDistribuicao(): Promise<{ itens: DistribuicaoPrograma[]; total: number }> {
   *     const res = await fetch(`${API_URL}/api/dashboard/distribuicao-programa`);
   *     if (!res.ok) throw new Error('Falha ao carregar distribuição por programa');
   *     return await res.json();
   *   }
   *
   * Alternativa SEM endpoint dedicado: derivar de services/atendimentos.ts
   *   contando atendimentos do mês agrupados por programa.
   * ─────────────────────────────────────────────────────────────────────── */

  // ── HOJE: mock ─────────────────────────────────────────────────────────
  return { itens: DISTRIBUICAO_MOCK, total: TOTAL_MES_MOCK };
}