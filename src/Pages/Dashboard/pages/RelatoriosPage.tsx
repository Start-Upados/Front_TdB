import { useState } from 'react';

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
} from 'lucide-react';

import { KpiCard } from '../components/KpiCard';

import {
  obterKpisImpacto,
  listarOds,
  listarRelatoriosGerados,
  gerarRelatorioPDF,
  exportarCSV,
} from '../services/relatorios';

import type {
  PeriodoRelatorio,
  PublicoRelatorio,
} from '../data/relatorios';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const PERIODOS: {
  value: PeriodoRelatorio;
  label: string;
}[] = [
  {
    value: 'mes',
    label: 'Último mês',
  },

  {
    value: 'trimestre',
    label: 'Trimestre',
  },

  {
    value: 'ano',
    label: 'Ano (2025)',
  },

  {
    value: 'personalizado',
    label: 'Personalizado',
  },
];

const PUBLICOS: {
  value: PublicoRelatorio;
  label: string;
  desc: string;
  Icon: typeof HeartHandshake;
}[] = [
  {
    value: 'doador',
    label: 'Para doador',
    desc: 'Impacto + retorno do investimento social',
    Icon: HeartHandshake,
  },

  {
    value: 'parceiro',
    label: 'Para parceiro',
    desc: 'Parceria + projeções de continuidade',
    Icon: Building2,
  },

  {
    value: 'ods',
    label: 'ODS / ESG',
    desc: 'Alinhamento aos Objetivos da ONU',
    Icon: Globe,
  },

  {
    value: 'interno',
    label: 'Interno',
    desc: 'Operacional completo · time da TdB',
    Icon: Users,
  },
];

const CONTEUDO_PDF = [
  'Capa personalizada com logo do destinatário',
  'Resumo executivo: 8.247 sorrisos em 2025',
  'Impacto por programa (DdB + Apolônias)',
  'Distribuição geográfica · 142 municípios',
  'Casos reais (antes/depois com autorização)',
  'Custo por atendimento + retorno social',
  'Alinhamento aos ODS 3, 4, 5 e 10',
];

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function RelatoriosPage() {
  const kpis = obterKpisImpacto();

  const ods = listarOds();

  const relatorios =
    listarRelatoriosGerados();

  const [periodo, setPeriodo] =
    useState<PeriodoRelatorio>('ano');

  const [publico, setPublico] =
    useState<PublicoRelatorio>('doador');

  const [gerando, setGerando] =
    useState(false);

  async function handleGerarPDF() {
    setGerando(true);

    try {
      await gerarRelatorioPDF({
        periodo,
        publico,
      });
    } catch (e) {
      console.error(
        'Falha ao gerar PDF:',
        e
      );
    } finally {
      setGerando(false);
    }
  }

  function handleExportarCSV() {
    exportarCSV({
      periodo,
      publico,
    });
  }

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <KpiCard
          label="Sorrisos transformados"
          value={kpis.sorrisosTransformados.toLocaleString('pt-BR')}
          sub={`em 2025 · meta ${kpis.metaAnual.toLocaleString('pt-BR')}`}
        />

        <KpiCard
          label="Jovens beneficiados"
          value={kpis.jovensBeneficiados.toLocaleString('pt-BR')}
          sub="Dentista do Bem"
        />

        <KpiCard
          label="Mulheres acolhidas"
          value={kpis.mulheresAcolhidas.toString()}
          sub="Apolônias do Bem"
        />

        <KpiCard
          label="Municípios alcançados"
          value={kpis.municipiosAlcancados.toString()}
          sub={`+${kpis.novosMunicipiosVsAnoPassado} vs 2024`}
          subTone="success"
        />
      </div>

      {/* HERO */}
      <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">

        {/* HEADER */}
        <div className="mb-6 flex items-start gap-3">

          <FileDown
            className="mt-0.5 h-5 w-5 shrink-0 text-info"
            strokeWidth={2}
          />

          <div>
            <h2 className="text-base font-semibold text-ink md:text-sm">
              Gerar relatório de impacto
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">
              PDF formatado pronto para envio a doadores, parceiros ou prestação de contas ODS
            </p>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">

          {/* LEFT */}
          <div className="xl:col-span-7">

            {/* PERÍODO */}
            <p className="mb-3 text-xs tracking-wider text-muted">
              PERÍODO
            </p>

            <div className="mb-6 grid grid-cols-1 overflow-hidden rounded-2xl border border-line sm:grid-cols-2 xl:inline-flex">

              {PERIODOS.map((p, idx) => (
                <button
                  key={p.value}
                  onClick={() =>
                    setPeriodo(p.value)
                  }
                  className={`border-line px-4 py-3 text-sm transition-colors ${
                    idx > 0
                      ? 'border-t sm:border-l sm:border-t-0'
                      : ''
                  } ${
                    periodo === p.value
                      ? 'bg-ink text-surface'
                      : 'bg-surface text-muted hover:text-ink'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* PÚBLICO */}
            <p className="mb-3 text-xs tracking-wider text-muted">
              PÚBLICO
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              {PUBLICOS.map(
                ({
                  value,
                  label,
                  desc,
                  Icon,
                }) => {
                  const isSelected =
                    publico === value;

                  return (
                    <button
                      key={value}
                      onClick={() =>
                        setPublico(value)
                      }
                      className={`rounded-2xl p-4 text-left transition-all ${
                        isSelected
                          ? 'border-2 border-info bg-info-soft'
                          : 'border border-line bg-surface hover:bg-surface-soft'
                      }`}
                    >

                      <div className="mb-2 flex items-center gap-2">

                        <Icon
                          className={`h-4 w-4 ${
                            isSelected
                              ? 'text-info'
                              : 'text-muted'
                          }`}
                          strokeWidth={2}
                        />

                        <p className="text-sm font-medium text-ink">
                          {label}
                        </p>
                      </div>

                      <p className="text-xs leading-relaxed text-muted">
                        {desc}
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="xl:col-span-5">

            <p className="mb-3 text-xs tracking-wider text-muted">
              CONTEÚDO DO PDF
            </p>

            <div className="rounded-2xl bg-surface-soft p-4">

              <div className="space-y-3">

                {CONTEUDO_PDF.map((c) => (
                  <p
                    key={c}
                    className="flex items-start gap-2 text-sm"
                  >

                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-success"
                      strokeWidth={2.5}
                    />

                    <span className="leading-relaxed text-muted">
                      {c}
                    </span>
                  </p>
                ))}
              </div>

              <p className="mt-4 border-t border-line pt-4 text-xs text-subtle">
                Estimativa: 4 páginas · ~50 KB
              </p>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">

          <button
            onClick={handleExportarCSV}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto"
          >

            <Table2
              className="h-4 w-4"
              strokeWidth={2}
            />

            Exportar CSV
          </button>

          <button
            onClick={handleGerarPDF}
            disabled={gerando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm text-surface transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >

            <FileText
              className="h-4 w-4"
              strokeWidth={2}
            />

            {gerando
              ? 'Gerando...'
              : 'Gerar PDF do relatório'}
          </button>
        </div>
      </div>

      {/* ODS */}
      <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <h2 className="text-base font-semibold text-ink md:text-sm">
            Alinhamento aos ODS
          </h2>

          <span className="text-xs leading-relaxed text-subtle">
            Objetivos de Desenvolvimento Sustentável · ONU
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

          {ods.map((o) => (
            <div
              key={o.numero}
              className="rounded-2xl border border-line bg-surface p-4"
            >

              <div className="mb-3 flex items-center gap-3">

                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{
                    background: o.cor,
                  }}
                >
                  {o.numero}
                </div>

                <p className="text-sm font-medium leading-relaxed text-ink">
                  {o.nome}
                </p>
              </div>

              <p className="text-2xl font-semibold leading-none text-ink md:text-xl">
                {o.metrica}
              </p>

              <p className="mt-2 text-xs leading-relaxed text-muted md:text-sm">
                {o.contribuicao}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* HISTÓRICO */}
      <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <h2 className="text-base font-semibold text-ink md:text-sm">
            Relatórios gerados anteriormente
          </h2>

          <span className="text-xs text-subtle">
            Últimos {relatorios.length}
          </span>
        </div>

        <div className="divide-y divide-line">

          {relatorios.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-4 py-4 first:pt-1 sm:flex-row sm:items-center"
            >

              <FileText
                className="h-5 w-5 shrink-0 text-muted"
                strokeWidth={2}
              />

              <div className="min-w-0 flex-1">

                <p className="text-sm font-medium text-ink md:text-base">
                  {r.titulo} · {r.publico}
                </p>

                <p className="mt-1 text-xs leading-relaxed text-subtle md:text-sm">
                  Gerado em {r.geradoEm} · {r.paginas} páginas
                </p>
              </div>

              <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto">

                <Download
                  className="h-4 w-4"
                  strokeWidth={2}
                />

                Baixar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}