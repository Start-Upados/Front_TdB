import {
  KPIS_VISAO_GERAL_MOCK,
  type KpiData, type PontoMensal, type AlertaVisaoGeral, type DistribuicaoPrograma,
} from '../data/visaoGeral';
import { obterKpisFinanceiro } from './financeiro';
import { contarPacientesEmTratamento, contarAtendimentosNoMes, contarAtendimentosPorMes, contarAtendimentosPorPrograma } from './atendimentos';
import { listarDentistas } from './voluntarios';
import { contarAltaSemResposta24h } from './central';
import { contarFila60Dias } from './triagens';
import { contarDentistasSemAtividade90 } from './voluntarios';


// ────────────────────────────────────────────────────────────────────────
// 1. KPIs DO TOPO
// ────────────────────────────────────────────────────────────────────────

export function obterKpis(): KpiData[] {
  /* ── FUTURO: backend dedicado ──────────────────────────────────────────

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
    (() => {
      const ativos = listarDentistas().filter((d) => d.status === 'Ativa').length;
      const total = listarDentistas().length;
      return {
        label: 'Dentistas ativos',
        value: String(ativos),
        sub: `de ${total} cadastrados`,
      };
      })
    (),

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
  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return contarAtendimentosPorMes(6).map((m) => ({ mes: MESES[m.mes - 1], atendimentos: m.total }));
}


// ────────────────────────────────────────────────────────────────────────
// 3. ALERTAS "Precisa de atenção agora"
// ────────────────────────────────────────────────────────────────────────

export function listarAlertas(): AlertaVisaoGeral[] {
  const alertas: AlertaVisaoGeral[] = [];

  // 1) Solicitações Alta sem resposta +24h — real (services/central.ts)
  const alta = contarAltaSemResposta24h();
  if (alta.total > 0) {
    alertas.push({
      id: 'al1', tone: 'danger', icone: 'alerta',
      titulo: `${alta.total} ${alta.total === 1 ? 'solicitação Alta sem resposta' : 'solicitações Alta sem resposta'} há +24h`,
      subtitulo: `${alta.whatsapp} do WhatsApp, ${alta.site} do site · risco de perder contato`,
      link: '/dashboard/comunicacoes', linkLabel: 'Abrir Central',
    });
  }

  // 2) Pacientes na fila +60 dias — real (services/triagens.ts)
  const fila60 = contarFila60Dias();
  if (fila60 > 0) {
    alertas.push({
      id: 'al2', tone: 'warning', icone: 'relogio',
      titulo: `${fila60} ${fila60 === 1 ? 'paciente' : 'pacientes'} na fila há +60 dias`,
      subtitulo: 'Risco de evasão',
      link: '/dashboard/triagens', linkLabel: 'Abrir Triagens',
    });
  }

  // 3) Dentistas sem atividade +90 dias — precisa de ultimaAtividade do backend
  const inativos90 = contarDentistasSemAtividade90();
  if (inativos90 > 0) {
    alertas.push({
      id: 'al3', tone: 'info', icone: 'usuario',
      titulo: `${inativos90} ${inativos90 === 1 ? 'dentista' : 'dentistas'} sem atividade há +90 dias`,
      subtitulo: 'Vale enviar reengajamento ou consultar disponibilidade',
      link: '/dashboard/voluntarios', linkLabel: 'Abrir Voluntários',
    });
  }

  return alertas;
}


// ────────────────────────────────────────────────────────────────────────
// 4. DISTRIBUIÇÃO POR PROGRAMA (Dentista do Bem vs Apolônias do Bem)
// ────────────────────────────────────────────────────────────────────────

export function obterDistribuicao(): { itens: DistribuicaoPrograma[]; total: number } {
  const bruto = contarAtendimentosPorPrograma();
  const total = bruto.reduce((s, p) => s + p.total, 0);
  const cores: Array<'brand' | 'accent'> = ['brand', 'accent'];
  const itens: DistribuicaoPrograma[] = bruto
    .sort((a, b) => b.total - a.total)
    .map((p, i) => ({
      programa: p.programa,
      valor: p.total,
      percent: total > 0 ? Math.round((p.total / total) * 100) : 0,
      cor: cores[i % 2],
    }));
  return { itens, total };
}