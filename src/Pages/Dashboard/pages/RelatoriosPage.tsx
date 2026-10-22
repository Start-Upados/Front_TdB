import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  FileText,
  FileDown,
  Table2,
  Check,
  Download,
  HeartHandshake,
  Building2,
  Globe,
  Users,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import { KpiCard } from '../components/KpiCard';

import {
  carregarRelatorio,
  conteudoDoPdf,
  gerarRelatorioPDF,
  exportarCSV,
  listarRelatoriosGerados,
  baixarRelatorioDoHistorico,
  anoAtual,
  hojeIso,
} from '../services/relatorios';

import type {
  DadosRelatorio,
  OpcoesRelatorio,
  PeriodoRelatorio,
  PublicoRelatorio,
  RelatorioGerado,
} from '../data/relatorios';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const PERIODOS: { value: PeriodoRelatorio; label: string }[] = [
  { value: 'mes',           label: 'Últimos 30 dias' },
  { value: 'trimestre',     label: 'Últimos 3 meses' },
  { value: 'ano',           label: `Ano (${anoAtual()})` },
  { value: 'personalizado', label: 'Personalizado' },
];

const PUBLICOS: {
  value: PublicoRelatorio;
  label: string;
  desc: string;
  Icon: typeof HeartHandshake;
}[] = [
  { value: 'doador',   label: 'Para doador',   desc: 'Impacto, evolução e rede de voluntários',     Icon: HeartHandshake },
  { value: 'parceiro', label: 'Para parceiro', desc: 'Resultado da parceria + continuidade',        Icon: Building2 },
  { value: 'ods',      label: 'ODS / ESG',     desc: 'Alinhamento aos Objetivos da ONU',            Icon: Globe },
  { value: 'interno',  label: 'Interno',       desc: 'Operacional completo · time da TdB',          Icon: Users },
];

const fmt = (n: number) => n.toLocaleString('pt-BR');

function primeiroDiaDoMes(): string {
  return `${hojeIso().slice(0, 8)}01`;
}

function dataHora(isoStr: string): string {
  const d = new Date(isoStr);
  return isNaN(d.getTime())
    ? '—'
    : `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>('ano');
  const [inicio, setInicio] = useState(primeiroDiaDoMes);
  const [fim, setFim] = useState(hojeIso);
  const [publico, setPublico] = useState<PublicoRelatorio>('doador');

  const [recarregar, setRecarregar] = useState(0);
  const ultimoRecarregar = useRef(0);

  // Último resultado que chegou do servidor. "carregando" = o resultado ainda não é do período atual.
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [resultado, setResultado] = useState<{ chave: string; erro: string | null } | null>(null);

  const [gerando, setGerando] = useState(false);
  const [historico, setHistorico] = useState<RelatorioGerado[]>(() => listarRelatoriosGerados());

  const personalizadoInvalido = periodo === 'personalizado' && (!inicio || !fim || inicio > fim);
  const chave = `${periodo}|${inicio}|${fim}|${recarregar}`;
  const carregando = !personalizadoInvalido && resultado?.chave !== chave;
  const erro = resultado?.chave === chave ? resultado.erro : null;

  // Recalcula a cada troca de período (os dados do servidor ficam em cache por 1 min)
  useEffect(() => {
    if (personalizadoInvalido) return;
    let vivo = true;
    // "Atualizar" busca de novo no servidor; trocar de período usa o cache
    const forcar = recarregar !== ultimoRecarregar.current;
    ultimoRecarregar.current = recarregar;
    carregarRelatorio({ periodo, inicio, fim }, forcar)
      .then((d) => {
        if (!vivo) return;
        setDados(d);
        setResultado({ chave, erro: null });
      })
      .catch((e) => {
        if (!vivo) return;
        setResultado({ chave, erro: e instanceof Error ? e.message : 'Não foi possível carregar os dados.' });
      });
    return () => { vivo = false; };
  }, [chave, periodo, inicio, fim, recarregar, personalizadoInvalido]);

  const opcoes: OpcoesRelatorio = { periodo, publico, inicio, fim };
  const pronto = !!dados && !carregando && !erro && !personalizadoInvalido;

  async function handleGerarPDF() {
    if (!dados) return;
    setGerando(true);
    try {
      const paginas = await gerarRelatorioPDF(opcoes, dados);
      setHistorico(listarRelatoriosGerados());
      toast.success('Relatório gerado', { description: `${paginas} ${paginas === 1 ? 'página' : 'páginas'} · ${dados.intervalo.texto}` });
    } catch (e) {
      console.error('Falha ao gerar PDF:', e);
      toast.error('Não foi possível gerar o PDF');
    } finally {
      setGerando(false);
    }
  }

  function handleExportarCSV() {
    if (!dados) return;
    try {
      exportarCSV(opcoes, dados);
    } catch (e) {
      console.error('Falha ao exportar CSV:', e);
      toast.error('Não foi possível exportar o CSV');
    }
  }

  async function handleBaixarRelatorio(r: RelatorioGerado) {
    try {
      await baixarRelatorioDoHistorico(r);
      toast.success(`${r.titulo} baixado`);
    } catch (err) {
      console.error('[handleBaixarRelatorio] erro:', err);
      toast.error('Não foi possível baixar o relatório');
    }
  }

  const v = (n: number | undefined) => (dados && !carregando && !personalizadoInvalido ? fmt(n ?? 0) : '—');
  const conteudo = dados ? conteudoDoPdf(publico, dados) : [];

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* KPI — acompanham o período escolhido */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Sorrisos transformados"
          value={v(dados?.sorrisos)}
          sub={!dados
            ? 'carregando...'
            : dados.atendimentosMutirao > 0
              ? `${dados.intervalo.rotulo} · ${fmt(dados.consultasConcluidas)} consultas + ${fmt(dados.atendimentosMutirao)} em mutirões`
              : periodo === 'ano'
                ? `${dados.intervalo.rotulo} · meta: ${fmt(dados.meta.realizados)} de ${fmt(dados.meta.meta)}`
                : dados.intervalo.rotulo}
        />
        <KpiCard
          label="Jovens beneficiados"
          value={v(dados?.jovens)}
          sub="Dentista do Bem"
        />
        <KpiCard
          label="Mulheres acolhidas"
          value={v(dados?.mulheres)}
          sub="Apolônias do Bem"
        />
        <KpiCard
          label="Municípios alcançados"
          value={v(dados?.municipios.length)}
          sub={dados
            ? dados.municipiosNovos > 0
              ? `+${fmt(dados.municipiosNovos)} ${dados.municipiosNovos === 1 ? 'novo' : 'novos'} ${dados.intervalo.rotulo}`
              : `nenhum novo ${dados.intervalo.rotulo}`
            : undefined}
          subTone={dados && dados.municipiosNovos > 0 ? 'success' : 'default'}
        />
      </div>

      {erro && (
        <div className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
            {erro}
          </p>
          <button
            onClick={() => setRecarregar((n) => n + 1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm text-ink hover:bg-surface-soft"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
            Tentar de novo
          </button>
        </div>
      )}

      {/* HERO */}
      <div className="rounded-2xl border border-line bg-surface shadow-card p-4 md:p-5">

        <div className="mb-6 flex items-start gap-3">
          <FileDown className="mt-0.5 h-5 w-5 shrink-0 text-info" strokeWidth={2} />
          <div>
            <h2 className="text-base font-semibold text-ink md:text-sm">Gerar relatório de impacto</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">
              PDF com os dados reais do sistema, pronto para doadores, parceiros ou prestação de contas ODS
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">

          {/* LEFT */}
          <div className="xl:col-span-7">

            <p className="mb-3 text-xs tracking-wider text-muted">PERÍODO</p>

            <div className="mb-3 grid grid-cols-1 overflow-hidden rounded-2xl border border-line sm:grid-cols-2 xl:inline-flex">
              {PERIODOS.map((p, idx) => (
                <button
                  key={p.value}
                  onClick={() => setPeriodo(p.value)}
                  className={`border-line px-4 py-3 text-sm transition-colors ${
                    idx > 0 ? 'border-t sm:border-l sm:border-t-0' : ''
                  } ${periodo === p.value ? 'bg-ink text-surface' : 'bg-surface text-muted hover:text-ink'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {periodo === 'personalizado' && (
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex flex-col gap-1 text-xs text-muted">
                  De
                  <input
                    type="date"
                    value={inicio}
                    max={fim || undefined}
                    onChange={(e) => setInicio(e.target.value)}
                    className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-muted">
                  Até
                  <input
                    type="date"
                    value={fim}
                    min={inicio || undefined}
                    onChange={(e) => setFim(e.target.value)}
                    className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
                  />
                </label>
                {personalizadoInvalido && (
                  <p className="pb-2 text-xs text-danger">Escolha a data inicial e a final (a inicial antes da final).</p>
                )}
              </div>
            )}

            <p className="mb-6 text-xs text-subtle">
              {dados && !personalizadoInvalido ? `Dados de ${dados.intervalo.texto}` : ' '}
            </p>

            <p className="mb-3 text-xs tracking-wider text-muted">PÚBLICO</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PUBLICOS.map(({ value, label, desc, Icon }) => {
                const isSelected = publico === value;
                return (
                  <button
                    key={value}
                    onClick={() => setPublico(value)}
                    className={`rounded-2xl p-4 text-left transition-all ${
                      isSelected
                        ? 'border-2 border-info bg-info-soft'
                        : 'border border-line bg-surface shadow-card hover:bg-surface-soft'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-info' : 'text-muted'}`} strokeWidth={2} />
                      <p className="text-sm font-medium text-ink">{label}</p>
                    </div>
                    <p className="text-xs leading-relaxed text-muted">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT */}
          <div className="xl:col-span-5">
            <p className="mb-3 text-xs tracking-wider text-muted">CONTEÚDO DO PDF</p>

            <div className="rounded-2xl bg-surface-soft p-4">
              {carregando && !dados ? (
                <p className="text-sm text-muted">Carregando os dados do sistema...</p>
              ) : !dados ? (
                <p className="text-sm text-muted">Sem dados para montar o relatório.</p>
              ) : (
                <div className="space-y-3">
                  {conteudo.map((c) => (
                    <p key={c} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2.5} />
                      <span className="leading-relaxed text-muted">{c}</span>
                    </p>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4 text-xs text-subtle">
                <span>
                  {dados ? `Atualizado em ${dataHora(dados.geradoEm)}` : ' '}
                </span>
                <button
                  onClick={() => setRecarregar((n) => n + 1)}
                  disabled={carregando}
                  className="inline-flex items-center gap-1.5 text-info hover:underline disabled:opacity-50"
                  title="Buscar os dados de novo no servidor"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} strokeWidth={2} />
                  Atualizar
                </button>
              </div>

              {dados && dados.avisos.length > 0 && (
                <p className="mt-3 text-xs text-warning">
                  Sem resposta do servidor para {dados.avisos.join(', ')}: esses números podem estar incompletos.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
          <button
            onClick={handleExportarCSV}
            disabled={!pronto}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-ink transition-colors hover:bg-surface-soft disabled:opacity-50 sm:w-auto"
          >
            <Table2 className="h-4 w-4" strokeWidth={2} />
            Exportar CSV
          </button>

          <button
            onClick={handleGerarPDF}
            disabled={!pronto || gerando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm text-surface transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            <FileText className="h-4 w-4" strokeWidth={2} />
            {gerando ? 'Gerando...' : 'Gerar PDF do relatório'}
          </button>
        </div>
      </div>

      {/* ODS */}
      <div className="rounded-2xl border border-line bg-surface shadow-card p-4 md:p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-ink md:text-sm">Alinhamento aos ODS</h2>
          <span className="text-xs leading-relaxed text-subtle">
            Objetivos de Desenvolvimento Sustentável · ONU{dados ? ` · ${dados.intervalo.rotulo}` : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(dados?.ods ?? []).map((o) => (
            <div key={o.numero} className="rounded-2xl border border-line bg-surface shadow-card p-4">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{ background: o.cor }}
                >
                  {o.numero}
                </div>
                <p className="text-sm font-medium leading-relaxed text-ink">{o.nome}</p>
              </div>
              <p className="text-2xl font-semibold leading-none text-ink md:text-xl">
                {carregando ? '—' : o.metrica}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted md:text-sm">{o.contribuicao}</p>
            </div>
          ))}
          {!dados && (
            <p className="text-sm text-muted">{carregando ? 'Carregando...' : 'Sem dados.'}</p>
          )}
        </div>
      </div>

      {/* HISTÓRICO */}
      <div className="rounded-2xl border border-line bg-surface shadow-card p-4 md:p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-ink md:text-sm">Relatórios gerados anteriormente</h2>
          <span className="text-xs text-subtle">
            {historico.length ? `Últimos ${historico.length} · neste navegador` : 'neste navegador'}
          </span>
        </div>

        {historico.length === 0 ? (
          <p className="py-2 text-sm text-muted">
            Nenhum relatório gerado ainda. Os PDFs que você gerar aparecem aqui para baixar de novo, com os números da época.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {historico.map((r) => (
              <div key={r.id} className="flex flex-col gap-4 py-4 first:pt-1 sm:flex-row sm:items-center">
                <FileText className="h-5 w-5 shrink-0 text-muted" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink md:text-base">{r.titulo} · {r.publicoLabel}</p>
                  <p className="mt-1 text-xs leading-relaxed text-subtle md:text-sm">
                    Gerado em {dataHora(r.geradoEm)} · dados de {r.intervaloTexto} · {r.paginas} {r.paginas === 1 ? 'página' : 'páginas'}
                  </p>
                </div>
                <button
                  onClick={() => handleBaixarRelatorio(r)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto"
                >
                  <Download className="h-4 w-4" strokeWidth={2} />
                  Baixar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
