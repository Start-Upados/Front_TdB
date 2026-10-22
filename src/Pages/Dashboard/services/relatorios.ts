/**
 * Relatórios e impacto — 100% com dados do sistema.
 *
 * Busca no backend (uma vez, com cache curto) atendimentos, pacientes, dentistas, mutirões,
 * solicitações e triagens, e calcula os indicadores para o período escolhido.
 * A página, o PDF e o CSV usam o MESMO cálculo (calcularRelatorio), então os números batem.
 */
import {
  atendimentoService, beneficiarioService, dentistaService, campanhaService,
  solicitacaoService, triagemService,
  type AtendimentoBody, type BeneficiarioBody, type DentistaBody, type CampanhaBody,
  type SolicitacaoBody, type TriagemBody, type EnderecoBody,
} from '../../../Services/api';
import { regiaoDoLocal } from '../data/atendimentos';
import { obterMeta } from './meta';
import { programaPorPerfil } from './programa';
import type {
  DadosRelatorio, IntervaloRelatorio, LinhaContagem, LinhaPrograma, MesContagem, ODS,
  OpcoesRelatorio, PeriodoRelatorio, PublicoRelatorio, RelatorioGerado,
} from '../data/relatorios';

// ─────────────────────────────────────────────
// Dados brutos do backend
// ─────────────────────────────────────────────

export interface BaseRelatorio {
  atendimentos: AtendimentoBody[];
  pacientes: (BeneficiarioBody & { dto?: EnderecoBody })[];
  dentistas: DentistaBody[];
  campanhas: CampanhaBody[];
  solicitacoes: SolicitacaoBody[];
  triagens: TriagemBody[];
  avisos: string[];
  /** Motivo da falha de cada fonte (ex.: "Erro 500", "Failed to fetch") — para a mensagem de erro. */
  motivos?: Record<string, string>;
}

let cache: { base: BaseRelatorio; em: number } | null = null;
let emAndamento: Promise<BaseRelatorio> | null = null;
const CACHE_MS = 60_000;

/** Busca tudo em paralelo. Uma fonte que falhar não derruba o relatório (vira aviso). */
export async function carregarBaseRelatorio(forcar = false): Promise<BaseRelatorio> {
  if (!forcar && cache && Date.now() - cache.em < CACHE_MS) return cache.base;
  if (!forcar && emAndamento) return emAndamento;   // duas chamadas juntas = uma busca só
  emAndamento = buscarBase().finally(() => { emAndamento = null; });
  return emAndamento;
}

async function buscarBase(): Promise<BaseRelatorio> {
  const fontes = [
    ['atendimentos', atendimentoService.listar()],
    ['pacientes', beneficiarioService.listar()],
    ['dentistas', dentistaService.listar()],
    ['mutirões', campanhaService.listar()],
    ['solicitações', solicitacaoService.listar()],
    ['triagens', triagemService.listar()],
  ] as const;
  const r = await Promise.allSettled(fontes.map(([, p]) => p));
  const avisos: string[] = [];
  const motivos: Record<string, string> = {};
  const lista = <T,>(i: number): T[] => {
    const x = r[i];
    if (x.status === 'fulfilled' && Array.isArray(x.value)) return x.value as T[];
    avisos.push(fontes[i][0]);
    motivos[fontes[i][0]] = x.status === 'rejected'
      ? (x.reason instanceof Error ? x.reason.message : String(x.reason))
      : 'resposta inesperada do servidor';
    return [];
  };
  const base: BaseRelatorio = {
    atendimentos: lista<AtendimentoBody>(0),
    pacientes: lista<BeneficiarioBody & { dto?: EnderecoBody }>(1),
    dentistas: lista<DentistaBody>(2),
    campanhas: lista<CampanhaBody>(3),
    solicitacoes: lista<SolicitacaoBody>(4),
    triagens: lista<TriagemBody>(5),
    avisos,
    motivos,
  };
  // Sem atendimentos não há relatório: não guarda um resultado vazio no cache
  if (!avisos.includes('atendimentos')) cache = { base, em: Date.now() };
  return base;
}

// ─────────────────────────────────────────────
// Datas e períodos
// ─────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hojeIso = () => iso(new Date());
const br = (v: string) => (v ? v.split('-').reverse().join('/') : '');

/** "2026-10-21 09:00:00", "2026-10-21T09:00", [2026,10,21] → "2026-10-21" ("" se não der). */
export function dataIso(v: unknown): string {
  if (Array.isArray(v) && v.length >= 3) return `${v[0]}-${pad(Number(v[1]))}-${pad(Number(v[2]))}`;
  if (typeof v === 'string') {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  return '';
}

function somarDias(isoData: string, dias: number): string {
  const [a, m, d] = isoData.split('-').map(Number);
  return iso(new Date(a, m - 1, d + dias));
}

function diasEntre(inicio: string, fim: string): number {
  const [a1, m1, d1] = inicio.split('-').map(Number);
  const [a2, m2, d2] = fim.split('-').map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000);
}

export function anoAtual(): number {
  return new Date().getFullYear();
}

/** Resolve o período escolhido em datas. Personalizado inválido cai no ano corrente. */
export function intervaloDoPeriodo(
  periodo: PeriodoRelatorio, inicio?: string, fim?: string, hoje = hojeIso(),
): IntervaloRelatorio {
  const ano = hoje.slice(0, 4);
  let i = `${ano}-01-01`, f = hoje, rotulo = `em ${ano}`;
  if (periodo === 'mes') {
    i = somarDias(hoje, -29); rotulo = 'nos últimos 30 dias';
  } else if (periodo === 'trimestre') {
    i = somarDias(hoje, -89); rotulo = 'nos últimos 3 meses';
  } else if (periodo === 'personalizado') {
    const valido = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
    // Personalizado incompleto ou invertido: fica no ano corrente
    if (valido(inicio) && valido(fim) && inicio! <= fim!) {
      i = inicio!; f = fim!; rotulo = `de ${br(i)} a ${br(f)}`;
    }
  }
  return { inicio: i, fim: f, texto: `${br(i)} a ${br(f)}`, rotulo };
}

// ─────────────────────────────────────────────
// Normalizações
// ─────────────────────────────────────────────

const digitos = (v?: string) => (v ?? '').replace(/\D/g, '');
const semAcento = (v?: string) => (v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

type StatusAt = 'concluido' | 'falta' | 'aberto';
function statusAtendimento(s?: string): StatusAt {
  const v = semAcento(s);
  if (['concluido', 'concluida', 'realizado', 'realizada', 'finalizado'].includes(v)) return 'concluido';
  if (['cancelado', 'cancelada', 'no-show', 'falta'].includes(v)) return 'falta';
  return 'aberto';
}

function idadeEm(dataNasc: string, referencia: string): number | undefined {
  if (!dataNasc) return undefined;
  const [a, m, d] = dataNasc.split('-').map(Number);
  const [ra, rm, rd] = referencia.split('-').map(Number);
  let idade = ra - a;
  if (rm < m || (rm === m && rd < d)) idade--;
  return idade >= 0 && idade < 130 ? idade : undefined;
}

function nomePrograma(bruto?: string): string {
  const p = semAcento(bruto);
  if (p.includes('apolon') || p.includes('saude bucal')) return 'Apolônias do Bem';
  if (p.includes('mutir')) return 'Mutirão';
  return 'Dentista do Bem';
}

function cidadeUf(cidade?: string, uf?: string): string {
  const c = (cidade ?? '').trim();
  const u = (uf ?? '').trim().toUpperCase();
  if (!c) return '';
  return u ? `${c}-${u}` : c;
}

function especialidadeLegivel(e?: string): string {
  const v = (e ?? '').trim();
  return !v || semAcento(v) === 'clinico geral' ? 'Clínico geral' : v;
}

/** Conta ocorrências; com [nome, peso] soma o peso (mutirão vale pelos atendimentos que teve). */
function contar(valores: (string | [string, number])[]): LinhaContagem[] {
  const m = new Map<string, number>();
  valores.forEach((v) => {
    const [nome, peso] = typeof v === 'string' ? [v, 1] : v;
    if (nome && peso > 0) m.set(nome, (m.get(nome) ?? 0) + peso);
  });
  return [...m.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function mesesDoIntervalo(inicio: string, fim: string): MesContagem[] {
  const out: MesContagem[] = [];
  let [a, m] = inicio.split('-').map(Number);
  const [af, mf] = fim.split('-').map(Number);
  while (a < af || (a === af && m <= mf)) {
    out.push({ mes: `${a}-${pad(m)}`, rotulo: `${MESES[m - 1]}/${String(a).slice(2)}`, total: 0 });
    m++; if (m > 12) { m = 1; a++; }
    if (out.length > 36) break;
  }
  return out;
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

// ─────────────────────────────────────────────
// Cálculo (puro — a página, o PDF e o CSV usam este)
// ─────────────────────────────────────────────

export function calcularRelatorio(base: BaseRelatorio, intervalo: IntervaloRelatorio, hoje = hojeIso()): DadosRelatorio {
  const { inicio, fim } = intervalo;
  const noPeriodo = (d: string) => !!d && d >= inicio && d <= fim;

  const pacientePorCpf = new Map(base.pacientes.map((p) => [digitos(p.rgCpf), p]));
  const dentistaPorCpf = new Map(base.dentistas.map((d) => [digitos(d.rgCpf), d]));

  const ats = base.atendimentos.map((a) => {
    const pac = pacientePorCpf.get(digitos(a.pacienteRgCpf));
    const data = dataIso(a.dataAtendimento);
    const idade = idadeEm(dataIso(pac?.dataNasc), data || hoje);
    // Mesma regra da Central: mulher = Apolônias; jovem homem 11–17 = Dentista do Bem
    const programa = pac?.sexo ? programaPorPerfil(pac.sexo, idade, a.protocolo) : nomePrograma(a.programa);
    return {
      a, data, programa,
      status: statusAtendimento(a.status),
      paciente: digitos(a.pacienteRgCpf) || `#${a.idAtendimento}`,
      municipio: cidadeUf(pac?.dto?.localidade, pac?.dto?.uf),
    };
  });

  const concluidos = ats.filter((x) => x.status === 'concluido' && noPeriodo(x.data));
  const faltas = ats.filter((x) => x.status === 'falta' && noPeriodo(x.data));
  // Consultas já marcadas de hoje em diante (continuidade — não depende do período)
  const agendados = ats.filter((x) => x.status === 'aberto' && !!x.data && x.data >= hoje);

  // ─── Programas ───
  const programas = ['Dentista do Bem', 'Apolônias do Bem'];
  concluidos.forEach((x) => { if (!programas.includes(x.programa)) programas.push(x.programa); });
  const porPrograma: LinhaPrograma[] = programas.map((programa) => {
    const doPrograma = concluidos.filter((x) => x.programa === programa);
    return { programa, atendimentos: doPrograma.length, pacientes: new Set(doPrograma.map((x) => x.paciente)).size };
  }).filter((l) => l.atendimentos > 0 || l.programa === 'Dentista do Bem' || l.programa === 'Apolônias do Bem');
  const pacientesDe = (p: string) => porPrograma.find((l) => l.programa === p)?.pacientes ?? 0;

  // ─── Mutirões ───
  const camps = base.campanhas.map((c) => ({ c, data: dataIso(c.dataEvento) }));
  const mutiroesNoPeriodo = camps.filter((x) => noPeriodo(x.data) && x.data <= hoje);
  const atendimentosMutirao = mutiroesNoPeriodo.reduce((s, x) => s + Math.max(0, Number(x.c.nAtendidos) || 0), 0);
  const proximosMutiroes = camps
    .filter((x) => x.data && x.data > hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 5)
    .map((x) => ({
      nome: x.c.nome,
      data: br(x.data),
      cidade: cidadeUf(x.c.cidade, x.c.estado),
      dentistas: `${x.c.nDentistasConfirmados ?? 0}/${x.c.nDentistas ?? 0}`,
    }));

  // ─── Territórios ───
  const municipiosPeriodo: [string, number][] = [
    ...concluidos.map((x): [string, number] => [x.municipio, 1]),
    ...mutiroesNoPeriodo.map((x): [string, number] => [cidadeUf(x.c.cidade, x.c.estado), Math.max(0, Number(x.c.nAtendidos) || 0)]),
  ].filter(([nome, peso]) => !!nome && peso > 0);
  const municipios = contar(municipiosPeriodo);
  const antes = new Set([
    ...ats.filter((x) => x.status === 'concluido' && x.data && x.data < inicio).map((x) => x.municipio),
    ...camps.filter((x) => x.data && x.data < inicio && (Number(x.c.nAtendidos) || 0) > 0).map((x) => cidadeUf(x.c.cidade, x.c.estado)),
  ].filter(Boolean));
  const municipiosNovos = municipios.filter((m) => !antes.has(m.nome)).length;
  const porRegiao = contar(municipiosPeriodo.map(([m, peso]): [string, number] => [regiaoDoLocal(m) || 'Não informada', peso]));

  // ─── Evolução mensal ───
  const porMes = mesesDoIntervalo(inicio, fim);
  concluidos.forEach((x) => {
    const linha = porMes.find((m) => m.mes === x.data.slice(0, 7));
    if (linha) linha.total++;
  });

  // ─── Comparação com o período anterior (mesmo tamanho) ───
  const dias = diasEntre(inicio, fim) + 1;
  const antInicio = somarDias(inicio, -dias), antFim = somarDias(inicio, -1);
  const sorrisosPeriodoAnterior =
    ats.filter((x) => x.status === 'concluido' && x.data >= antInicio && x.data <= antFim).length +
    camps.filter((x) => x.data >= antInicio && x.data <= antFim).reduce((s, x) => s + Math.max(0, Number(x.c.nAtendidos) || 0), 0);

  // ─── Solicitações recebidas no período ───
  const solicNoPeriodo = base.solicitacoes.filter((s) => noPeriodo(dataIso(s.criadaEm)));
  const ROTULO_STATUS: Record<string, string> = {
    'pendente-aprovacao': 'Aguardando aprovação', 'pendente-triagem': 'Na triagem', aberta: 'Em conversa',
    'aguardando-paciente': 'Aguardando paciente', recusado: 'Recusada', recusada: 'Recusada', fechada: 'Encerrada',
  };
  const solicitacoesPorStatus = contar(solicNoPeriodo.map((s) => ROTULO_STATUS[semAcento(s.status)] ?? 'Outras'));

  // ─── Voluntários e fila (situação de hoje) ───
  const statusDentista = (d: DentistaBody) => semAcento(d.status);
  const voluntariosAtivos = base.dentistas.filter((d) => ['ativo', 'ativa', 'aprovado', 'aprovada'].includes(statusDentista(d))).length;
  const voluntariosPendentes = base.dentistas.filter((d) => statusDentista(d) === 'pendente').length;
  const FORA_DA_FILA = ['aceito', 'aceita', 'concluido', 'concluida', 'cancelado', 'cancelada', 'removido', 'removida'];
  const fila = base.triagens.filter((t) => !FORA_DA_FILA.includes(semAcento(t.status)));
  const esperas = fila.map((t) => dataIso(t.dataEntradaFila)).filter(Boolean).map((d) => Math.max(0, diasEntre(d, hoje)));
  const esperaMediaFilaDias = esperas.length ? Math.round(esperas.reduce((s, n) => s + n, 0) / esperas.length) : null;

  const dentistasNoPeriodo = contar(concluidos.map((x) => {
    const d = dentistaPorCpf.get(digitos(x.a.dentistaRgCpf));
    return d?.nome || x.a.dentistaNome || '';
  }));

  // ─── Meta anual (a mesma do menu: consultas concluídas no ano) ───
  const ano = Number(hoje.slice(0, 4));
  const realizadosAno = ats.filter((x) => x.status === 'concluido' && x.data.startsWith(String(ano))).length;
  const metaValor = obterMeta();

  const consultasConcluidas = concluidos.length;
  const sorrisos = consultasConcluidas + atendimentosMutirao;
  const jovens = pacientesDe('Dentista do Bem');
  const mulheres = pacientesDe('Apolônias do Bem');
  const base_comparecimento = consultasConcluidas + faltas.length;

  const ods: ODS[] = [
    { numero: 3,  cor: '#4C9F38', nome: 'Saúde e bem-estar',     metrica: fmt(sorrisos),         contribuicao: 'atendimentos odontológicos gratuitos' },
    { numero: 4,  cor: '#C5192D', nome: 'Educação de qualidade', metrica: fmt(jovens),           contribuicao: 'jovens de 11 a 17 anos atendidos' },
    { numero: 5,  cor: '#FF3A21', nome: 'Igualdade de gênero',   metrica: fmt(mulheres),         contribuicao: 'mulheres acolhidas (Apolônias do Bem)' },
    { numero: 10, cor: '#DD1367', nome: 'Redução das desigualdades', metrica: fmt(municipios.length), contribuicao: 'municípios com atendimento gratuito' },
  ];

  return {
    intervalo,
    geradoEm: new Date().toISOString(),
    sorrisos,
    consultasConcluidas,
    atendimentosMutirao,
    pacientesAtendidos: new Set(concluidos.map((x) => x.paciente)).size,
    jovens,
    mulheres,
    porPrograma,
    porEspecialidade: contar(concluidos.map((x) => especialidadeLegivel(x.a.especialidade))),
    porMes,
    municipios,
    municipiosNovos,
    porRegiao,
    agendados: agendados.length,
    faltasCancelamentos: faltas.length,
    taxaComparecimento: base_comparecimento > 0 ? Math.round((consultasConcluidas / base_comparecimento) * 100) : null,
    solicitacoesRecebidas: solicNoPeriodo.length,
    solicitacoesPorStatus,
    dentistasAtuantes: dentistasNoPeriodo.length,
    topDentistas: dentistasNoPeriodo.slice(0, 5),
    mutiroesRealizados: mutiroesNoPeriodo.length,
    proximosMutiroes,
    voluntariosAtivos,
    voluntariosPendentes,
    filaAguardando: fila.length,
    esperaMediaFilaDias,
    sorrisosPeriodoAnterior,
    meta: { ano, meta: metaValor, realizados: realizadosAno, pct: Math.round((realizadosAno / metaValor) * 100) },
    ods,
    avisos: [...base.avisos],
  };
}

/** Atalho da página: busca (com cache) e calcula para o período. */
export async function carregarRelatorio(opcoes: Pick<OpcoesRelatorio, 'periodo' | 'inicio' | 'fim'>, forcar = false): Promise<DadosRelatorio> {
  const base = await carregarBaseRelatorio(forcar);
  if (base.avisos.includes('atendimentos')) {
    const motivo = base.motivos?.atendimentos ?? '';
    const semConexao = /failed to fetch|networkerror|load failed/i.test(motivo);
    throw new Error(semConexao
      ? 'Não foi possível conectar ao servidor (sem resposta ou bloqueado por CORS). Confira se o backend está no ar.'
      : `Não foi possível carregar os atendimentos do servidor${motivo ? ` (${motivo})` : ''}.`);
  }
  return calcularRelatorio(base, intervaloDoPeriodo(opcoes.periodo, opcoes.inicio, opcoes.fim));
}

// ─────────────────────────────────────────────
// Textos por público
// ─────────────────────────────────────────────

export const LABEL_PUBLICO: Record<PublicoRelatorio, string> = {
  doador:   'Versão para doador',
  parceiro: 'Versão para parceiro',
  ods:      'ODS / ESG',
  interno:  'Operacional interno',
};

/** O que o PDF de cada público traz — mostrado na página antes de gerar. */
export function conteudoDoPdf(publico: PublicoRelatorio, d: DadosRelatorio): string[] {
  const comum = [
    `Capa com público e período (${d.intervalo.texto})`,
    `Resumo executivo: ${fmt(d.sorrisos)} sorrisos ${d.intervalo.rotulo}`,
    `Impacto por programa (Dentista do Bem + Apolônias do Bem)`,
    `Distribuição geográfica · ${fmt(d.municipios.length)} ${d.municipios.length === 1 ? 'município' : 'municípios'}`,
  ];
  switch (publico) {
    case 'doador':
      return [...comum, 'Evolução mês a mês dos atendimentos', 'Rede de voluntários e mutirões do período', 'Alinhamento aos ODS 3, 4, 5 e 10'];
    case 'parceiro':
      return [...comum, 'Comparação com o período anterior', 'Continuidade: fila de espera e próximos mutirões', 'Alinhamento aos ODS 3, 4, 5 e 10'];
    case 'ods':
      return [...comum, 'ODS 3, 4, 5 e 10 com a métrica de cada um', 'Abrangência regional'];
    case 'interno':
    default:
      return [...comum, 'Solicitações, fila de triagem e tempo de espera', 'Comparecimento, faltas e consultas agendadas', 'Voluntários e dentistas que mais atenderam', 'Mutirões realizados e próximos'];
  }
}

// ─────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────

type Doc = InstanceType<typeof import('jspdf').jsPDF>;

const AZUL: [number, number, number] = [30, 91, 184];
const LARANJA: [number, number, number] = [232, 132, 7];

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [parseInt(c.substring(0, 2), 16), parseInt(c.substring(2, 4), 16), parseInt(c.substring(4, 6), 16)];
}

/** Escreve o PDF com quebra de página automática. */
class Escritor {
  y = 20;
  doc: Doc;
  constructor(doc: Doc) { this.doc = doc; }

  garantir(altura: number) {
    if (this.y + altura > 275) { this.doc.addPage(); this.y = 20; }
  }
  /** reserva = espaço do conteúdo que vem logo abaixo (o título não fica sozinho no fim da página). */
  titulo(t: string, reserva = 24) {
    this.garantir(16 + reserva);
    this.y += 4;
    this.doc.setTextColor(0); this.doc.setFont('helvetica', 'bold'); this.doc.setFontSize(13);
    this.doc.text(t, 20, this.y);
    this.doc.setDrawColor(...AZUL); this.doc.setLineWidth(0.5);
    this.doc.line(20, this.y + 2, 60, this.y + 2);
    this.y += 10;
  }
  paragrafo(t: string, cor = 60) {
    this.doc.setFont('helvetica', 'normal'); this.doc.setFontSize(10); this.doc.setTextColor(cor);
    const linhas = this.doc.splitTextToSize(t, 170) as string[];
    linhas.forEach((l) => { this.garantir(6); this.doc.text(l, 20, this.y); this.y += 5.5; });
    this.y += 1.5;
  }
  item(t: string) {
    this.doc.setFont('helvetica', 'normal'); this.doc.setFontSize(10); this.doc.setTextColor(30);
    const linhas = this.doc.splitTextToSize(t, 163) as string[];
    linhas.forEach((l, i) => { this.garantir(6); this.doc.text(i === 0 ? `•  ${l}` : `   ${l}`, 22, this.y); this.y += 5.5; });
  }
  /** Tabela simples: primeira coluna à esquerda, as outras à direita. */
  tabela(cabecalho: string[], linhas: (string | number)[][], larguras: number[]) {
    const xs: number[] = []; let x = 20;
    larguras.forEach((w) => { xs.push(x); x += w; });
    const desenharLinha = (cols: (string | number)[], negrito: boolean, fundo?: boolean) => {
      this.garantir(8);
      if (fundo) { this.doc.setFillColor(243, 244, 246); this.doc.rect(20, this.y - 4.5, x - 20, 7, 'F'); }
      this.doc.setFont('helvetica', negrito ? 'bold' : 'normal'); this.doc.setFontSize(9.5); this.doc.setTextColor(negrito ? 0 : 40);
      cols.forEach((c, i) => {
        const texto = String(c);
        if (i === 0) this.doc.text((this.doc.splitTextToSize(texto, larguras[0] - 2) as string[])[0], xs[0] + 1, this.y);
        else this.doc.text(texto, xs[i] + larguras[i] - 1, this.y, { align: 'right' });
      });
      this.y += 7;
    };
    desenharLinha(cabecalho, true, true);
    if (linhas.length === 0) desenharLinha(['Sem registros no período', ...cabecalho.slice(1).map(() => '')], false);
    linhas.forEach((l) => desenharLinha(l, false));
    this.y += 3;
  }
  destaques(itens: { valor: string; rotulo: string }[]) {
    this.garantir(26);
    const w = 170 / itens.length;
    itens.forEach((it, i) => {
      const x = 20 + i * w;
      this.doc.setFillColor(248, 250, 252); this.doc.setDrawColor(226, 232, 240);
      this.doc.roundedRect(x + 1, this.y - 2, w - 2, 22, 2, 2, 'FD');
      this.doc.setFont('helvetica', 'bold'); this.doc.setFontSize(15); this.doc.setTextColor(...AZUL);
      this.doc.text(it.valor, x + w / 2, this.y + 8, { align: 'center' });
      this.doc.setFont('helvetica', 'normal'); this.doc.setFontSize(8); this.doc.setTextColor(90);
      this.doc.text(this.doc.splitTextToSize(it.rotulo, w - 6) as string[], x + w / 2, this.y + 14, { align: 'center' });
    });
    this.y += 28;
  }
  barras(dados: MesContagem[]) {
    if (dados.length === 0) return;
    this.garantir(58);
    this.doc.setFont('helvetica', 'bold'); this.doc.setFontSize(9); this.doc.setTextColor(60);
    this.doc.text('Consultas concluídas por mês', 20, this.y);
    this.y += 4;
    const max = Math.max(1, ...dados.map((d) => d.total));
    const largura = Math.min(14, 170 / dados.length);
    const base = this.y + 38;
    dados.forEach((d, i) => {
      const x = 20 + i * largura;
      const h = (d.total / max) * 30;
      this.doc.setFillColor(...AZUL);
      if (h > 0) this.doc.rect(x + 1.5, base - h, largura - 3, h, 'F');
      this.doc.setFont('helvetica', 'normal'); this.doc.setFontSize(7); this.doc.setTextColor(60);
      this.doc.text(String(d.total), x + largura / 2, base - h - 1.5, { align: 'center' });
      this.doc.text(d.rotulo, x + largura / 2, base + 4.5, { align: 'center' });
    });
    this.doc.setDrawColor(200); this.doc.line(20, base, 20 + dados.length * largura, base);
    this.y = base + 12;
  }
}

function variacao(atual: number, anterior: number): string {
  if (anterior === 0) return atual > 0 ? 'primeiros atendimentos registrados' : 'sem atendimentos nos dois períodos';
  const pct = Math.round(((atual - anterior) / anterior) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}% (${fmt(anterior)} no período anterior)`;
}

/** Monta o PDF (sem salvar) — separado para dar para testar e contar páginas. */
export async function montarPDF(opcoes: OpcoesRelatorio, d: DadosRelatorio): Promise<Doc> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const e = new Escritor(doc);

  // ─── Capa ───
  doc.setFillColor(...LARANJA); doc.rect(0, 0, 210, 6, 'F');
  doc.setTextColor(0); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
  doc.text('Turma do Bem', 20, 30);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(15);
  doc.text('Relatório de impacto', 20, 40);
  doc.setFontSize(10); doc.setTextColor(110);
  doc.text(`${LABEL_PUBLICO[opcoes.publico]} · Período: ${d.intervalo.texto}`, 20, 48);
  doc.setDrawColor(...AZUL); doc.setLineWidth(1.2); doc.line(20, 54, 190, 54);
  e.y = 66;

  // ─── Resumo executivo (todos) ───
  e.titulo('Resumo executivo');
  e.destaques([
    { valor: fmt(d.sorrisos), rotulo: 'sorrisos transformados' },
    { valor: fmt(d.pacientesAtendidos), rotulo: 'pacientes atendidos' },
    { valor: fmt(d.municipios.length), rotulo: d.municipios.length === 1 ? 'município alcançado' : 'municípios alcançados' },
    { valor: fmt(d.voluntariosAtivos), rotulo: 'dentistas voluntários ativos' },
  ]);
  e.item(`${fmt(d.consultasConcluidas)} consultas concluídas${d.atendimentosMutirao ? ` e ${fmt(d.atendimentosMutirao)} atendimentos em mutirões` : ''} ${d.intervalo.rotulo}.`);
  e.item(`${fmt(d.jovens)} ${d.jovens === 1 ? 'jovem atendido' : 'jovens atendidos'} pelo Dentista do Bem e ${fmt(d.mulheres)} ${d.mulheres === 1 ? 'mulher acolhida' : 'mulheres acolhidas'} pelo Apolônias do Bem.`);
  if (d.municipiosNovos > 0) e.item(`${fmt(d.municipiosNovos)} ${d.municipiosNovos === 1 ? 'município novo' : 'municípios novos'}: atendidos pela primeira vez neste período.`);
  e.item(`Meta ${d.meta.ano}: ${fmt(d.meta.realizados)} de ${fmt(d.meta.meta)} atendimentos (${d.meta.pct}%).`);
  e.y += 2;

  // ─── Impacto por programa (todos) ───
  e.titulo('Impacto por programa');
  e.tabela(['Programa', 'Atendimentos', 'Pacientes'],
    d.porPrograma.map((p) => [p.programa, fmt(p.atendimentos), fmt(p.pacientes)]), [100, 35, 35]);
  e.paragrafo('Dentista do Bem: jovens de 11 a 17 anos em situação de vulnerabilidade. Apolônias do Bem: mulheres que sofreram violência e tiveram a dentição afetada.', 100);

  // ─── Território (todos) ───
  e.titulo('Distribuição geográfica');
  e.tabela(['Município', 'Atendimentos'], d.municipios.slice(0, 15).map((m) => [m.nome, fmt(m.total)]), [135, 35]);
  if (d.municipios.length > 15) e.paragrafo(`E mais ${d.municipios.length - 15} municípios.`, 100);
  if (d.porRegiao.length) e.paragrafo(`Por região: ${d.porRegiao.map((r) => `${r.nome} ${fmt(r.total)}`).join(' · ')}.`, 80);

  // ─── Específico por público ───
  if (opcoes.publico === 'doador') {
    e.titulo('Evolução dos atendimentos', 58);
    e.barras(d.porMes);
    e.titulo('Rede que faz acontecer');
    e.item(`${fmt(d.dentistasAtuantes)} ${d.dentistasAtuantes === 1 ? 'dentista atendeu' : 'dentistas atenderam'} no período, de ${fmt(d.voluntariosAtivos)} voluntários ativos na rede.`);
    e.item(`${fmt(d.mutiroesRealizados)} ${d.mutiroesRealizados === 1 ? 'mutirão realizado' : 'mutirões realizados'} no período.`);
    if (d.taxaComparecimento !== null) e.item(`Taxa de comparecimento: ${d.taxaComparecimento}% das consultas marcadas.`);
    e.item('Todos os atendimentos são gratuitos para os pacientes.');
  }

  if (opcoes.publico === 'parceiro') {
    e.titulo('Resultado da parceria');
    e.item(`Atendimentos no período: ${fmt(d.sorrisos)} · ${variacao(d.sorrisos, d.sorrisosPeriodoAnterior)}.`);
    e.item(`${fmt(d.dentistasAtuantes)} dentistas atenderam no período · ${fmt(d.voluntariosAtivos)} voluntários ativos.`);
    e.barras(d.porMes);
    e.titulo('Continuidade');
    e.item(`${fmt(d.filaAguardando)} ${d.filaAguardando === 1 ? 'paciente aguarda' : 'pacientes aguardam'} atendimento na fila de triagem${d.esperaMediaFilaDias !== null ? ` (espera média de ${d.esperaMediaFilaDias} dias)` : ''}.`);
    e.item(`${fmt(d.agendados)} ${d.agendados === 1 ? 'consulta já agendada' : 'consultas já agendadas'} a partir de hoje.`);
    if (d.proximosMutiroes.length) {
      e.paragrafo('Próximos mutirões:', 40);
      e.tabela(['Mutirão', 'Data', 'Dentistas'],
        d.proximosMutiroes.map((m) => [`${m.nome}${m.cidade ? ` · ${m.cidade}` : ''}`, m.data, m.dentistas]), [120, 25, 25]);
    } else {
      e.item('Nenhum mutirão programado no momento.');
    }
  }

  if (opcoes.publico === 'interno') {
    e.titulo('Entrada de pacientes');
    e.item(`${fmt(d.solicitacoesRecebidas)} ${d.solicitacoesRecebidas === 1 ? 'solicitação recebida' : 'solicitações recebidas'} no período.`);
    e.tabela(['Situação das solicitações', 'Quantidade'], d.solicitacoesPorStatus.map((s) => [s.nome, fmt(s.total)]), [135, 35]);
    e.item(`Fila de triagem hoje: ${fmt(d.filaAguardando)} ${d.filaAguardando === 1 ? 'paciente' : 'pacientes'}${d.esperaMediaFilaDias !== null ? ` · espera média de ${d.esperaMediaFilaDias} dias` : ''}.`);
    e.titulo('Consultas');
    e.tabela(['Situação', 'Quantidade'], [
      ['Concluídas', fmt(d.consultasConcluidas)],
      ['Faltas e cancelamentos', fmt(d.faltasCancelamentos)],
      ['Agendadas a partir de hoje', fmt(d.agendados)],
    ], [135, 35]);
    if (d.taxaComparecimento !== null) e.item(`Taxa de comparecimento: ${d.taxaComparecimento}%.`);
    e.tabela(['Especialidade', 'Atendimentos'], d.porEspecialidade.map((s) => [s.nome, fmt(s.total)]), [135, 35]);
    e.barras(d.porMes);
    e.titulo('Voluntários');
    e.item(`${fmt(d.voluntariosAtivos)} ativos · ${fmt(d.voluntariosPendentes)} aguardando aprovação · ${fmt(d.dentistasAtuantes)} atenderam no período.`);
    e.tabela(['Dentistas que mais atenderam', 'Consultas'], d.topDentistas.map((t) => [t.nome, fmt(t.total)]), [135, 35]);
    e.titulo('Mutirões');
    e.item(`${fmt(d.mutiroesRealizados)} realizados no período · ${fmt(d.atendimentosMutirao)} atendimentos em mutirões.`);
    if (d.proximosMutiroes.length) {
      e.tabela(['Próximos mutirões', 'Data', 'Dentistas'],
        d.proximosMutiroes.map((m) => [`${m.nome}${m.cidade ? ` · ${m.cidade}` : ''}`, m.data, m.dentistas]), [120, 25, 25]);
    }
  }

  // ─── ODS (doador, parceiro e ODS) ───
  if (opcoes.publico !== 'interno') {
    e.titulo('Alinhamento aos Objetivos de Desenvolvimento Sustentável');
    d.ods.forEach((o) => {
      e.garantir(12);
      doc.setFillColor(...hexToRgb(o.cor)); doc.rect(20, e.y - 5, 9, 9, 'F');
      doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(String(o.numero), 24.5, e.y + 0.8, { align: 'center' });
      doc.setTextColor(0); doc.setFontSize(10.5);
      doc.text(`ODS ${o.numero} — ${o.nome}`, 33, e.y - 0.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(70);
      doc.text(`${o.metrica} · ${o.contribuicao}`, 33, e.y + 4.5);
      e.y += 13;
    });
    if (opcoes.publico === 'ods' && d.porRegiao.length) {
      e.paragrafo(`Abrangência regional: ${d.porRegiao.map((r) => `${r.nome} (${fmt(r.total)})`).join(', ')}.`, 70);
    }
  }

  // ─── Nota e rodapé em todas as páginas ───
  e.garantir(12);
  e.y += 4;
  e.paragrafo(`Dados extraídos do sistema da Turma do Bem em ${new Date(d.geradoEm).toLocaleString('pt-BR')}. ` +
    'Atendimentos contam consultas concluídas pelos dentistas voluntários e atendimentos registrados em mutirões. ' +
    'Nenhum dado pessoal de paciente é exibido neste relatório.', 130);
  if (d.avisos.length) e.paragrafo(`Atenção: sem resposta do servidor para ${d.avisos.join(', ')} — esses números podem estar incompletos.`, 150);

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(140);
    doc.text(`Turma do Bem · Relatório de impacto · ${d.intervalo.texto}`, 20, 287);
    doc.text(`Página ${p} de ${total}`, 190, 287, { align: 'right' });
  }
  return doc;
}

function nomeArquivo(opcoes: OpcoesRelatorio, d: DadosRelatorio, ext: string): string {
  return `relatorio-impacto-${opcoes.publico}-${d.intervalo.inicio}_a_${d.intervalo.fim}.${ext}`;
}

/** Gera o PDF, baixa e registra no histórico. Devolve o número de páginas. */
export async function gerarRelatorioPDF(opcoes: OpcoesRelatorio, d: DadosRelatorio): Promise<number> {
  const doc = await montarPDF(opcoes, d);
  doc.save(nomeArquivo(opcoes, d, 'pdf'));
  const paginas = doc.getNumberOfPages();
  registrarNoHistorico(opcoes, d, paginas);
  return paginas;
}

/** Baixa de novo um relatório do histórico, com os números da época. */
export async function baixarRelatorioDoHistorico(r: RelatorioGerado): Promise<void> {
  const doc = await montarPDF(r.opcoes, r.dados);
  doc.save(nomeArquivo(r.opcoes, r.dados, 'pdf'));
}

// ─────────────────────────────────────────────
// CSV (Excel em português: separador ";" e UTF-8 com BOM)
// ─────────────────────────────────────────────

export function montarCSV(opcoes: OpcoesRelatorio, d: DadosRelatorio): string {
  const rows: (string | number)[][] = [
    ['Turma do Bem — Relatório de impacto'],
    ['Público', LABEL_PUBLICO[opcoes.publico]],
    ['Período', d.intervalo.texto],
    ['Gerado em', new Date(d.geradoEm).toLocaleString('pt-BR')],
    [],
    ['Indicador', 'Valor'],
    ['Sorrisos transformados', d.sorrisos],
    ['Consultas concluídas', d.consultasConcluidas],
    ['Atendimentos em mutirões', d.atendimentosMutirao],
    ['Pacientes atendidos', d.pacientesAtendidos],
    ['Jovens beneficiados (Dentista do Bem)', d.jovens],
    ['Mulheres acolhidas (Apolônias do Bem)', d.mulheres],
    ['Municípios alcançados', d.municipios.length],
    ['Municípios novos no período', d.municipiosNovos],
    ['Consultas agendadas a partir de hoje', d.agendados],
    ['Faltas e cancelamentos', d.faltasCancelamentos],
    ['Taxa de comparecimento (%)', d.taxaComparecimento ?? ''],
    ['Solicitações recebidas', d.solicitacoesRecebidas],
    ['Fila de triagem (hoje)', d.filaAguardando],
    ['Espera média na fila (dias)', d.esperaMediaFilaDias ?? ''],
    ['Voluntários ativos', d.voluntariosAtivos],
    ['Voluntários aguardando aprovação', d.voluntariosPendentes],
    ['Dentistas que atenderam no período', d.dentistasAtuantes],
    ['Mutirões realizados', d.mutiroesRealizados],
    ['Atendimentos no período anterior', d.sorrisosPeriodoAnterior],
    [`Meta ${d.meta.ano}`, d.meta.meta],
    [`Realizados em ${d.meta.ano}`, d.meta.realizados],
    [],
    ['Programa', 'Atendimentos', 'Pacientes'],
    ...d.porPrograma.map((p) => [p.programa, p.atendimentos, p.pacientes]),
    [],
    ['Mês', 'Atendimentos'],
    ...d.porMes.map((m) => [m.rotulo, m.total]),
    [],
    ['Município', 'Atendimentos'],
    ...d.municipios.map((m) => [m.nome, m.total]),
    [],
    ['Região', 'Atendimentos'],
    ...d.porRegiao.map((r) => [r.nome, r.total]),
    [],
    ['Especialidade', 'Atendimentos'],
    ...d.porEspecialidade.map((s) => [s.nome, s.total]),
    [],
    ['ODS', 'Métrica', 'Contribuição'],
    ...d.ods.map((o) => [`ODS ${o.numero} — ${o.nome}`, o.metrica, o.contribuicao]),
  ];
  if (opcoes.publico === 'interno') {
    rows.push([], ['Situação das solicitações', 'Quantidade'], ...d.solicitacoesPorStatus.map((s) => [s.nome, s.total]));
    rows.push([], ['Dentista', 'Consultas no período'], ...d.topDentistas.map((t) => [t.nome, t.total]));
  }
  const celula = (c: string | number) => {
    const t = typeof c === 'number' ? c.toLocaleString('pt-BR', { useGrouping: false }) : c;
    return `"${String(t).replace(/"/g, '""')}"`;
  };
  return '﻿' + rows.map((r) => r.map(celula).join(';')).join('\r\n');
}

export function exportarCSV(opcoes: OpcoesRelatorio, d: DadosRelatorio): void {
  const blob = new Blob([montarCSV(opcoes, d)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo(opcoes, d, 'csv');
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─────────────────────────────────────────────
// Histórico (neste navegador)
// ─────────────────────────────────────────────

const LS_HISTORICO = 'tdb_relatorios_gerados';
const MAX_HISTORICO = 10;

export function listarRelatoriosGerados(): RelatorioGerado[] {
  try {
    const lista = JSON.parse(localStorage.getItem(LS_HISTORICO) ?? '[]');
    return Array.isArray(lista) ? lista.filter((r) => r && r.dados && r.opcoes) : [];
  } catch {
    return [];
  }
}

function tituloDoRelatorio(opcoes: OpcoesRelatorio, d: DadosRelatorio): string {
  if (opcoes.periodo === 'ano') return `Relatório anual ${d.intervalo.inicio.slice(0, 4)}`;
  if (opcoes.periodo === 'trimestre') return 'Relatório dos últimos 3 meses';
  if (opcoes.periodo === 'mes') return 'Relatório dos últimos 30 dias';
  return 'Relatório personalizado';
}

function registrarNoHistorico(opcoes: OpcoesRelatorio, d: DadosRelatorio, paginas: number): void {
  const novo: RelatorioGerado = {
    id: `r${Date.now()}`,
    titulo: tituloDoRelatorio(opcoes, d),
    publico: opcoes.publico,
    publicoLabel: LABEL_PUBLICO[opcoes.publico],
    intervaloTexto: d.intervalo.texto,
    geradoEm: new Date().toISOString(),
    paginas,
    opcoes,
    dados: d,
  };
  try {
    const lista = [novo, ...listarRelatoriosGerados()].slice(0, MAX_HISTORICO);
    localStorage.setItem(LS_HISTORICO, JSON.stringify(lista));
  } catch { /* navegador sem espaço/permissão: só não guarda o histórico */ }
}
