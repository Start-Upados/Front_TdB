/**
 * Tipos da página Relatórios e impacto.
 * Todos os números vêm do backend (services/relatorios.ts) — aqui não há dados de exemplo.
 */

export type PeriodoRelatorio = 'mes' | 'trimestre' | 'ano' | 'personalizado';
export type PublicoRelatorio = 'doador' | 'parceiro' | 'ods' | 'interno';

export interface OpcoesRelatorio {
  periodo: PeriodoRelatorio;
  publico: PublicoRelatorio;
  /** Só no período personalizado: datas YYYY-MM-DD (inclusive). */
  inicio?: string;
  fim?: string;
}

/** Intervalo de datas já resolvido (YYYY-MM-DD, inclusive). */
export interface IntervaloRelatorio {
  inicio: string;
  fim: string;
  /** "01/01/2026 a 21/10/2026" */
  texto: string;
  /** "em 2026", "nos últimos 30 dias", "no trimestre"... */
  rotulo: string;
}

export interface LinhaPrograma {
  programa: string;
  atendimentos: number;
  pacientes: number;
}

export interface LinhaContagem {
  nome: string;
  total: number;
}

export interface MesContagem {
  /** "2026-10" */
  mes: string;
  /** "out/26" */
  rotulo: string;
  total: number;
}

export interface ODS {
  numero: 3 | 4 | 5 | 10;
  cor: string;
  nome: string;
  metrica: string;
  contribuicao: string;
}

/** Tudo o que a página, o PDF e o CSV mostram — calculado de uma vez para o período escolhido. */
export interface DadosRelatorio {
  intervalo: IntervaloRelatorio;
  geradoEm: string;                    // ISO

  // Impacto (atendimentos concluídos no período)
  sorrisos: number;                    // consultas concluídas + atendimentos em mutirões
  consultasConcluidas: number;
  atendimentosMutirao: number;
  pacientesAtendidos: number;          // pacientes distintos com consulta concluída
  jovens: number;                      // pacientes do Dentista do Bem
  mulheres: number;                    // pacientes do Apolônias do Bem
  porPrograma: LinhaPrograma[];
  porEspecialidade: LinhaContagem[];
  porMes: MesContagem[];

  // Território
  municipios: LinhaContagem[];         // "São Paulo-SP" → atendimentos
  municipiosNovos: number;             // alcançados no período e nunca antes
  porRegiao: LinhaContagem[];

  // Operação no período
  agendados: number;                   // consultas marcadas de hoje em diante
  faltasCancelamentos: number;
  taxaComparecimento: number | null;   // % (concluídas / (concluídas + faltas)); null sem base
  solicitacoesRecebidas: number;
  solicitacoesPorStatus: LinhaContagem[];
  dentistasAtuantes: number;           // dentistas com consulta concluída no período
  topDentistas: LinhaContagem[];       // só no relatório interno
  mutiroesRealizados: number;
  proximosMutiroes: { nome: string; data: string; cidade: string; dentistas: string }[];

  // Situação atual (não depende do período)
  voluntariosAtivos: number;
  voluntariosPendentes: number;
  filaAguardando: number;
  esperaMediaFilaDias: number | null;

  // Comparação com o período anterior de mesmo tamanho
  sorrisosPeriodoAnterior: number;

  // Meta anual (a mesma da barra "Meta TdB" do menu)
  meta: { ano: number; meta: number; realizados: number; pct: number };

  ods: ODS[];

  /** Fontes que não responderam (o relatório sai com o que veio). */
  avisos: string[];
}

export interface RelatorioGerado {
  id: string;
  titulo: string;
  publico: PublicoRelatorio;
  publicoLabel: string;
  intervaloTexto: string;
  geradoEm: string;                    // ISO
  paginas: number;
  opcoes: OpcoesRelatorio;
  /** Números do momento em que foi gerado: o "Baixar" refaz o mesmo PDF. */
  dados: DadosRelatorio;
}
