import {
  KPIS_IMPACTO_MOCK, ODS_MOCK, RELATORIOS_GERADOS_MOCK,
  type KpisImpacto, type ODS, type RelatorioGerado, type OpcoesRelatorio,
} from '../data/relatorios';

/* HOJE: mock + geração local. AMANHÃ: backend gera PDF e devolve URL. */

export function obterKpisImpacto(): KpisImpacto {
  return KPIS_IMPACTO_MOCK;
}

export function listarOds(): ODS[] {
  return ODS_MOCK;
}

export function listarRelatoriosGerados(): RelatorioGerado[] {
  return [...RELATORIOS_GERADOS_MOCK];
}

const LABEL_PUBLICO: Record<string, string> = {
  doador:   'Versão para doador',
  parceiro: 'Versão para parceiro',
  ods:      'ODS / ESG',
  interno:  'Operacional interno',
};

const LABEL_PERIODO: Record<string, string> = {
  mes:           'do mês corrente',
  trimestre:     'do trimestre',
  ano:           'do ano de 2025',
  personalizado: 'do período personalizado',
};

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [
    parseInt(c.substring(0, 2), 16),
    parseInt(c.substring(2, 4), 16),
    parseInt(c.substring(4, 6), 16),
  ];
}

export async function gerarRelatorioPDF(opcoes: OpcoesRelatorio): Promise<void> {
  // import dinâmico — jsPDF só carrega quando o botão é clicado
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const kpis = obterKpisImpacto();
  const ods = listarOds();

  // ─── Capa ───────────────────────────────────────
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Turma do Bem', 20, 30);

  doc.setFontSize(15);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Impacto', 20, 40);

  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`${LABEL_PUBLICO[opcoes.publico]} · Dados ${LABEL_PERIODO[opcoes.periodo]}`, 20, 48);

  // Linha decorativa
  doc.setDrawColor(30, 91, 184);
  doc.setLineWidth(1.2);
  doc.line(20, 54, 190, 54);

  // ─── Resumo executivo ──────────────────────────
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo executivo', 20, 70);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  let y = 82;
  const linhas = [
    `${kpis.sorrisosTransformados.toLocaleString('pt-BR')} sorrisos transformados em 2025`,
    `${kpis.jovensBeneficiados.toLocaleString('pt-BR')} jovens beneficiados pelo programa Dentista do Bem`,
    `${kpis.mulheresAcolhidas} mulheres acolhidas pelo Apolônias do Bem`,
    `${kpis.municipiosAlcancados} municípios alcançados (+${kpis.novosMunicipiosVsAnoPassado} novos vs 2024)`,
    `Meta anual: ${kpis.metaAnual.toLocaleString('pt-BR')} atendimentos · ${Math.round((kpis.sorrisosTransformados / kpis.metaAnual) * 100)}% atingido`,
  ];
  linhas.forEach((l) => {
    doc.text('• ' + l, 22, y);
    y += 8;
  });

  // ─── Programas ─────────────────────────────────
  y += 6;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Impacto por programa', 20, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dentista do Bem: ${kpis.jovensBeneficiados.toLocaleString('pt-BR')} jovens (11–17 anos) atendidos.`, 22, y);
  y += 7;
  doc.text(`Apolônias do Bem: ${kpis.mulheresAcolhidas} mulheres em situação de violência reabilitadas.`, 22, y);
  y += 7;
  doc.text(`Cobertura territorial: ${kpis.municipiosAlcancados} municípios em todas as 5 regiões.`, 22, y);

  // ─── ODS ───────────────────────────────────────
  y += 16;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Alinhamento aos Objetivos de Desenvolvimento Sustentável', 20, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  ods.forEach((o) => {
    const [r, g, b] = hexToRgb(o.cor);
    doc.setFillColor(r, g, b);
    doc.rect(20, y - 5, 8, 8, 'F');
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${o.numero}`, 24, y, { align: 'center' });

    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`ODS ${o.numero} — ${o.nome}: ${o.metrica} ${o.contribuicao}`, 33, y);
    y += 12;
  });

  // ─── Rodapé ────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString('pt-BR')} · Turma do Bem · turmadobem.org.br`,
    20, 285,
  );

  doc.save(`relatorio-impacto-${opcoes.publico}-${opcoes.periodo}.pdf`);
}

export function exportarCSV(opcoes: OpcoesRelatorio): void {
  const kpis = obterKpisImpacto();
  const ods = listarOds();

  const rows: string[][] = [
    ['Métrica', 'Valor'],
    ['Sorrisos transformados',  String(kpis.sorrisosTransformados)],
    ['Jovens beneficiados',     String(kpis.jovensBeneficiados)],
    ['Mulheres acolhidas',      String(kpis.mulheresAcolhidas)],
    ['Municípios alcançados',   String(kpis.municipiosAlcancados)],
    ['Meta anual',              String(kpis.metaAnual)],
    [''],
    ['ODS', 'Métrica', 'Contribuição'],
    ...ods.map((o) => [`ODS ${o.numero} — ${o.nome}`, o.metrica, o.contribuicao]),
  ];

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-impacto-${opcoes.publico}-${opcoes.periodo}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}