import { useState, useMemo , useEffect} from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Repeat, Users, AlertTriangle, ArrowRight,
  Plus, HandHeart, Wallet,
  Mail, Copy, Check,
  FileText, Download,
  Handshake, Clock,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

import { KpiCard } from '../components/KpiCard';
import { Modal } from '../components/Modal';

import {
  obterKpisFinanceiro,
  obterChartReceitaCustos,
  listarDoacoesRecentes,
  listarDespesasRecentes,
  listarParceiros,
  cadastrarDoacao,
  cadastrarDespesa,
  marcarComoAgradecida,
  marcarReciboGerado,
  obterHistoricoDoador,               
  iniciarNegociacaoParceiro,          
  type HistoricoDoador,               
} from '../services/financeiro';

import type { Doacao, Despesa, Parceiro } from '../data/financeiro';
import { CATEGORIAS_DESPESA } from '../data/financeiro';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const MESES_CURTOS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function formatarR$(valor: number): string {
  if (Math.abs(valor) >= 1000) {
    return `R$ ${(valor / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
  }
  return `R$ ${valor.toLocaleString('pt-BR')}`;
}

function formatarDataCurta(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function gerarPropostaPDF(parceiro: Parceiro, historico: HistoricoDoador) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  let y = 25;

  // ─── HEADER ───
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSTA DE RENOVAÇÃO', 105, y, { align: 'center' });
  y += 7;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text('Parceria estratégica', 105, y, { align: 'center' });
  y += 14;

  doc.setDrawColor(220);
  doc.line(20, y, 190, y);
  y += 12;

  // ─── DE / PARA ───
  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DE', 20, y);
  doc.text('PARA', 110, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Turma do Bem', 20, y);                       doc.text(parceiro.nome, 110, y);             y += 5;
  doc.text('Rua Maurício F. Klabin, 449', 20, y);        doc.text(parceiro.tipoLabel, 110, y);        y += 5;
  doc.text('CNPJ: [a preencher]', 20, y);                                                             y += 14;

  doc.line(20, y, 190, y);
  y += 12;

  // ─── RESUMO DA PARCERIA ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RESUMO DA PARCERIA', 20, y);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const valorAnualFmt = parceiro.valorAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const totalFmt      = historico.totalContribuido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const linhasResumo = [
    ['Valor anual contratado', valorAnualFmt],
    ['Duração da parceria', historico.duracaoLabel],
    ['Total contribuído até hoje', totalFmt],
    ['Doações registradas', `${historico.qtdDoacoes}`],
  ];
  if (historico.ultimaDoacao) {
    linhasResumo.push(['Última doação', new Date(historico.ultimaDoacao + 'T12:00:00').toLocaleDateString('pt-BR')]);
  }
  if (parceiro.proximaRenovacao) {
    linhasResumo.push(['Próxima renovação', parceiro.proximaRenovacao.label]);
  }

  for (const [label, valor] of linhasResumo) {
    doc.setTextColor(120);
    doc.text(`${label}:`, 20, y);
    doc.setTextColor(0);
    doc.text(valor, 90, y);
    y += 6;
  }
  y += 6;

  doc.line(20, y, 190, y);
  y += 12;

  // ─── PROPOSTA ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PROPOSTA', 20, y);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const proposta =
    `A Turma do Bem vem por meio deste documento manifestar o interesse em renovar a parceria ` +
    `estabelecida com ${parceiro.nome}, dando continuidade ao trabalho conjunto que tem viabilizado ` +
    `o atendimento odontológico gratuito a jovens em situação de vulnerabilidade e mulheres vítimas de ` +
    `violência, por meio dos programas Dentista do Bem e Apolônias do Bem.`;
  const linhasProposta = doc.splitTextToSize(proposta, 170);
  doc.text(linhasProposta, 20, y);
  y += linhasProposta.length * 5 + 8;

  // ─── PRÓXIMOS PASSOS ───
  doc.setFont('helvetica', 'bold');
  doc.text('PRÓXIMOS PASSOS', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  const passos = [
    '1. Agendar reunião de alinhamento com a equipe da Turma do Bem',
    '2. Apresentação do relatório de impacto do ciclo atual',
    '3. Discussão dos termos do próximo ciclo de cooperação',
    '4. Formalização da renovação',
  ];
  for (const p of passos) {
    doc.text(p, 25, y);
    y += 6;
  }
  y += 20;

  // ─── ASSINATURA ───
  doc.line(60, y, 150, y);
  y += 6;
  doc.setFontSize(10);
  doc.text('Presidente', 105, y, { align: 'center' });
  y += 5;
  doc.setTextColor(120);
  doc.text('Turma do Bem', 105, y, { align: 'center' });

  // ─── FOOTER ───
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Emitido em ${new Date().toLocaleDateString('pt-BR')} · Turma do Bem`, 105, 285, { align: 'center' });

  // Salvar
  const slug = parceiro.nome.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const ano = new Date().getFullYear();
  doc.save(`proposta-renovacao-${slug}-${ano}.pdf`);
}

// ─────────────────────────────────────────────
// GERAR RECIBO PDF
// ─────────────────────────────────────────────

async function gerarReciboPDF(doacao: Doacao, onSucesso: () => void) {
  const { jsPDF } = await import('jspdf');

  // Marca como gerado e pega o número
  const numero = await marcarReciboGerado(doacao.id);

  const doc = new jsPDF();
  let y = 25;

  // ─── HEADER ───
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO DE DOAÇÃO', 105, y, { align: 'center' });
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(`Nº ${numero}`, 105, y, { align: 'center' });
  y += 14;

  // Divisória
  doc.setDrawColor(220);
  doc.line(20, y, 190, y);
  y += 12;

  // ─── EMITIDO POR ───
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('EMITIDO POR', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Turma do Bem', 20, y);                      y += 5;
  doc.text('Rua Maurício Francisco Klabin, 449', 20, y); y += 5;
  doc.text('CNPJ: [a preencher]', 20, y);                y += 5;
  doc.text('Razão Social: [a preencher]', 20, y);        y += 12;

  doc.line(20, y, 190, y);
  y += 12;

  // ─── DECLARAÇÃO ───
  doc.setFont('helvetica', 'bold');
  doc.text('DECLARAÇÃO', 20, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const valorFormatado = doacao.valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const dataFormatada = new Date(doacao.data + 'T12:00:00').toLocaleDateString('pt-BR');

  const textoDecl =
    `Recebemos de ${doacao.doador} a quantia de ${valorFormatado}, ` +
    `em ${dataFormatada}, referente a doação voluntária a esta organização.`;
  const linhas = doc.splitTextToSize(textoDecl, 170);
  doc.text(linhas, 20, y);
  y += linhas.length * 6 + 4;

  if (doacao.descricao) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Descrição: ${doacao.descricao}`, 20, y);
    y += 8;
  }

  doc.setTextColor(0);
  doc.setFontSize(10);
  const textoLegal =
    'Esta doação será aplicada nos projetos sociais da Turma do Bem, ' +
    'voltados ao atendimento odontológico gratuito de jovens em situação de vulnerabilidade ' +
    'e mulheres vítimas de violência (programas Dentista do Bem e Apolônias do Bem).';
  const linhasLegal = doc.splitTextToSize(textoLegal, 170);
  doc.text(linhasLegal, 20, y);
  y += linhasLegal.length * 6 + 20;

  // ─── ASSINATURA ───
  doc.line(60, y, 150, y);
  y += 6;
  doc.setFontSize(10);
  doc.text('Presidente', 105, y, { align: 'center' });
  y += 5;
  doc.setTextColor(120);
  doc.text('Turma do Bem', 105, y, { align: 'center' });

  // ─── FOOTER ───
  doc.setFontSize(8);
  doc.setTextColor(150);
  const hoje = new Date().toLocaleDateString('pt-BR');
  doc.text(`Emitido em ${hoje} · Documento gerado automaticamente`, 105, 280, { align: 'center' });

  // Salvar
  const slug = doacao.doador.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  doc.save(`recibo-${numero}-${slug}.pdf`);

  toast.success('Recibo gerado', { description: `${numero} · ${valorFormatado}` });
  onSucesso();
}



// ─────────────────────────────────────────────
// DOAÇÃO / DESPESA / PARCEIRO ROWS
// ─────────────────────────────────────────────
function DoacaoRow({
  d, onAgradecer, onRecibo,
}: {
  d: Doacao;
  onAgradecer: (d: Doacao) => void;
  onRecibo: (d: Doacao) => void;
}) {
  const isAgradecida = !!d.agradecidoEm;

  function formatarDataDDMM(iso: string): string {
    const dt = new Date(iso + 'T12:00:00');
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
  }

  function renderBotao() {
    // Já agradecida → estado final
    if (d.acaoSugerida === 'agradecer' && isAgradecida) {
      return (
        <button
          disabled
          title={`Agradecido em ${formatarDataDDMM(d.agradecidoEm!)}`}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-success/30 bg-success-soft px-4 py-2 text-sm text-success font-medium sm:w-auto cursor-default"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          Agradecido
        </button>
      );
    }

    // Agradecer — funcional
    if (d.acaoSugerida === 'agradecer') {
      return (
        <button
          onClick={() => onAgradecer(d)}
          className="w-full rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto"
        >
          Agradecer
        </button>
      );
    }

    // Recibo já gerado → estado final
    if (d.acaoSugerida === 'recibo' && d.reciboGeradoEm) {
      return (
        <button
          disabled
          title={`${d.numeroRecibo} · emitido em ${formatarDataDDMM(d.reciboGeradoEm)}`}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-success/30 bg-success-soft px-4 py-2 text-sm text-success font-medium sm:w-auto cursor-default"
        >
          <FileText className="h-3.5 w-3.5" strokeWidth={2.5} />
          Recibo emitido
        </button>
      );
    }

    // Recibo — funcional (chama o callback recebido por prop, não stub)
    if (d.acaoSugerida === 'recibo') {
      return (
        <button
          onClick={() => onRecibo(d)}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} />
          Recibo
        </button>
      );
    }

    // Sem contato — disabled
    return (
      <button
        disabled
        className="w-full rounded-xl border border-line px-4 py-2 text-sm text-subtle opacity-50 cursor-not-allowed sm:w-auto"
      >
        Sem contato
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 border-t border-line py-4 first:border-t-0 first:pt-1 sm:flex-row sm:items-center">
      <div className="sm:min-w-[72px]">
        <p className="text-sm font-medium text-ink">{formatarDataCurta(d.data)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="inline-flex flex-wrap items-center gap-1.5 text-sm font-medium text-ink md:text-base">
          {d.doador}
          {d.isRecorrente && <Repeat className="h-3.5 w-3.5 text-info" strokeWidth={2} />}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-subtle md:text-sm">{d.descricao}</p>
      </div>
      <span className="text-base font-semibold text-success md:text-sm">
        {formatarR$(d.valor)}
      </span>
      {renderBotao()}
    </div>
  );
}

function DespesaRow({ d }: { d: Despesa }) {
  return (
    <div className="flex flex-col gap-4 border-t border-line py-4 first:border-t-0 first:pt-1 sm:flex-row sm:items-center">
      <div className="sm:min-w-[72px]">
        <p className="text-sm font-medium text-ink">{formatarDataCurta(d.data)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink md:text-base truncate">{d.descricao}</p>
        <p className="mt-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-warning-soft text-warning">
            {d.categoria}
          </span>
        </p>
      </div>
      <span className="text-base font-semibold text-warning md:text-sm">
        −{formatarR$(d.valor)}
      </span>
    </div>
  );
}

function ParceiroRow({
  p, onRenovar,
}: {
  p: Parceiro;
  onRenovar: (p: Parceiro) => void;
}) {
  const urg = p.proximaRenovacao?.urgencia;
  const isAlerta = urg === 'iminente';
  const isEmNegociacao = urg === 'em-negociacao';

  function renderBotao() {
    // Em negociação → estado final
    if (isEmNegociacao) {
      return (
        <button
          disabled
          title={p.negociacaoIniciadaEm ? `Iniciada em ${new Date(p.negociacaoIniciadaEm + 'T12:00:00').toLocaleDateString('pt-BR')}` : undefined}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-info/30 bg-info-soft px-4 py-2 text-sm text-info font-medium sm:w-auto cursor-default"
        >
          <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
          Em negociação
        </button>
      );
    }

    // Iminente → Renovar (funcional)
    if (isAlerta) {
      return (
        <button
          onClick={() => onRenovar(p)}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm text-surface transition-opacity hover:opacity-90 sm:w-auto"
        >
          <Handshake className="h-3.5 w-3.5" strokeWidth={2} />
          Renovar
        </button>
      );
    }

    // Futura → Ver (placeholder, próxima rodada)
    return (
      <button className="w-full rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto">
        Ver
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 border-t border-line py-4 first:border-t-0 first:pt-1 sm:flex-row sm:items-center">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-medium ${
        p.isConsolidado ? 'bg-info-soft text-info' : 'bg-surface-soft text-ink'
      }`}>
        {p.isConsolidado ? <Users className="h-4 w-4" strokeWidth={2} /> : p.iniciais}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink md:text-base">{p.nome}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">
          {p.isConsolidado
            ? `${p.contagemPessoas} ativos · ${formatarR$(p.valorAnual)}/ano consolidado`
            : `${p.tipoLabel} · ${formatarR$(p.valorAnual)}/ano`}
        </p>
        {p.proximaRenovacao && (
          <p className={`mt-1 inline-flex items-center gap-1 text-xs ${
            isAlerta ? 'text-warning' :
            isEmNegociacao ? 'text-info' :
            'text-subtle'
          }`}>
            {isAlerta && <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />}
            {isEmNegociacao && <Clock className="h-3.5 w-3.5" strokeWidth={2} />}
            {p.proximaRenovacao.label}
          </p>
        )}
        {p.detalhe && <p className="mt-1 text-xs text-success">{p.detalhe}</p>}
      </div>
      {renderBotao()}
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

type ModalAtivo = 'doacao' | 'despesa' | null;

export default function FinanceiroPage() {
  const [versao, setVersao] = useState(0);
  const [modal, setModal] = useState<ModalAtivo>(null);
  const [processando, setProcessando] = useState(false);
  const [doacaoAgradecer, setDoacaoAgradecer] = useState<Doacao | null>(null);

  const kpis      = useMemo(() => obterKpisFinanceiro(),     [versao]);
  const chart     = useMemo(() => obterChartReceitaCustos(), [versao]);
  const doacoes   = useMemo(() => listarDoacoesRecentes(),   [versao]);
  const despesas  = useMemo(() => listarDespesasRecentes(),  [versao]);
  const parceiros = useMemo(() => listarParceiros(),         [versao]);
  const [parceiroRenovar, setParceiroRenovar] = useState<Parceiro | null>(null);

  function refresh() { setVersao((v) => v + 1); }

  const variacaoCusto = kpis.variacao.custoPorAtendimento;
  const subCusto = `${variacaoCusto > 0 ? '+' : ''}R$ ${variacaoCusto} vs mês anterior`;

  const variacaoDoacoes = kpis.variacao.doacoes;
  const subDoacoes = variacaoDoacoes >= 0
    ? `+${formatarR$(variacaoDoacoes)} vs mês anterior`
    : `${formatarR$(variacaoDoacoes)} vs mês anterior`;

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Doações no mês"
          value={formatarR$(kpis.doacoesNoMes)}
          valueTone="success"
          sub={subDoacoes}
          subTone={variacaoDoacoes >= 0 ? 'success' : 'danger'}
        />
        <KpiCard
          label="Custos no mês"
          value={formatarR$(kpis.custosNoMes)}
          valueTone="warning"
          sub="material, transporte, admin"
        />
        <KpiCard
          label="Saldo do mês"
          value={`${kpis.saldoMes >= 0 ? '+' : ''}${formatarR$(kpis.saldoMes)}`}
          sub={`${kpis.margem}% de margem`}
          subTone={kpis.saldoMes >= 0 ? 'success' : 'danger'}
        />
        <KpiCard
          label="Custo por atendimento"
          value={`R$ ${kpis.custoPorAtendimento}`}
          sub={subCusto}
          subTone={variacaoCusto < 0 ? 'success' : 'warning'}
        />
      </div>

      {/* CHART */}
      <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-ink md:text-sm">
            Receita vs custos · últimos 6 meses
          </h2>
          <span className="text-xs text-subtle">Valores em milhares de R$</span>
        </div>
        <div className="h-[320px] md:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" vertical={false} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} tickFormatter={(v: number) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: '12px', fontSize: '12px' }}
                labelStyle={{ color: 'rgb(var(--muted))' }}
                formatter={(value) => formatarR$(Number(value))}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="line" />
              <Line type="monotone" dataKey="receita" name="Receita" stroke="rgb(var(--success))" strokeWidth={2.5} dot={{ r: 3, fill: 'rgb(var(--success))' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="custos"  name="Custos"  stroke="rgb(var(--warning))" strokeWidth={2.5} strokeDasharray="4 3" dot={{ r: 3, fill: 'rgb(var(--warning))' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRID: Doações + Despesas */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

        {/* DOAÇÕES */}
        <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink md:text-sm inline-flex items-center gap-2">
              <HandHeart className="h-4 w-4 text-success" strokeWidth={2} />
              Doações recentes
            </h2>
            <button
              onClick={() => setModal('doacao')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-xs text-surface transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Adicionar
            </button>
          </div>
          <div>
            {doacoes.map((d) => (
              <DoacaoRow
                key={d.id}
                d={d}
                onAgradecer={setDoacaoAgradecer}
                onRecibo={(doacao) => gerarReciboPDF(doacao, refresh)}
              />
            ))}
          </div>
        </div>

        {/* DESPESAS */}
        <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink md:text-sm inline-flex items-center gap-2">
              <Wallet className="h-4 w-4 text-warning" strokeWidth={2} />
              Despesas recentes
            </h2>
            <button
              onClick={() => setModal('despesa')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-xs text-surface transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Adicionar
            </button>
          </div>
          <div>
            {despesas.map((d) => <DespesaRow key={d.id} d={d} />)}
          </div>
        </div>
      </div>

      {/* PARCEIROS (full width) */}
      <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink md:text-sm">Parceiros e mantenedores</h2>
          <button className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink">
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
        <div>
          {parceiros.map((p) => (
            <ParceiroRow key={p.id} p={p} onRenovar={setParceiroRenovar} />
          ))}
        </div>
      </div>

      {/* MODAIS */}
      <CadastrarDoacaoModal
        open={modal === 'doacao'}
        onClose={() => !processando && setModal(null)}
        onCriada={() => { refresh(); setModal(null); }}
        processando={processando}
        setProcessando={setProcessando}
      />
      <CadastrarDespesaModal
        open={modal === 'despesa'}
        onClose={() => !processando && setModal(null)}
        onCriada={() => { refresh(); setModal(null); }}
        processando={processando}
        setProcessando={setProcessando}
      />
      <AgradecerDoacaoModal
        open={doacaoAgradecer !== null}
        doacao={doacaoAgradecer}
        onClose={() => setDoacaoAgradecer(null)}
        onAgradecido={() => { refresh(); setDoacaoAgradecer(null); }}
      />
      <RenovarParceiroModal
        open={parceiroRenovar !== null}
        parceiro={parceiroRenovar}
        onClose={() => setParceiroRenovar(null)}
        onFinalizado={() => { refresh(); setParceiroRenovar(null); }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL — CADASTRAR DOAÇÃO
// ─────────────────────────────────────────────

interface FormDoacao {
  data: string;
  doador: string;
  descricao: string;
  valor: string;        // mantém string pra controle do input
  isRecorrente: boolean;
}

function CadastrarDoacaoModal({
  open, onClose, onCriada, processando, setProcessando,
}: {
  open: boolean;
  onClose: () => void;
  onCriada: () => void;
  processando: boolean;
  setProcessando: (b: boolean) => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormDoacao>({
    defaultValues: { data: hojeISO(), doador: '', descricao: '', valor: '', isRecorrente: false },
  });

  async function submit(form: FormDoacao) {
    const valorNum = Number(form.valor);
    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      toast.error('Valor inválido');
      return;
    }
    setProcessando(true);
    try {
      await cadastrarDoacao({
        data: form.data,
        doador: form.doador,
        descricao: form.descricao,
        valor: valorNum,
        isRecorrente: form.isRecorrente,
      });
      toast.success('Doação cadastrada', {
        description: `${form.doador} · ${formatarR$(valorNum)}`,
      });
      reset({ data: hojeISO(), doador: '', descricao: '', valor: '', isRecorrente: false });
      onCriada();
    } catch {
      toast.error('Não foi possível cadastrar');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title="Cadastrar doação"
      description="Os totais do mês são recalculados automaticamente."
      size="md"
      footer={
        <>
          <button onClick={onClose} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" form="form-doacao" disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50">
            <Plus className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Cadastrando...' : 'Cadastrar doação'}
          </button>
        </>
      }
    >
      <form id="form-doacao" onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label className="block text-xs text-muted mb-1.5">Doador *</label>
          <input
            {...register('doador', { required: true })}
            placeholder="Ex: Colgate Brasil, Maria Silva, Anônimo"
            className={`w-full bg-surface border ${errors.doador ? 'border-danger' : 'border-line'} text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1.5">Data *</label>
            <input type="date" {...register('data', { required: true })}
              className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Valor (R$) *</label>
            <input type="number" step="0.01" min="0.01"
              {...register('valor', { required: true })}
              placeholder="100,00"
              className={`w-full bg-surface border ${errors.valor ? 'border-danger' : 'border-line'} text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand`}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5">Descrição</label>
          <input {...register('descricao')}
            placeholder="Ex: PIX único, Transferência mensal, Boleto pessoa jurídica"
            className="w-full bg-surface border border-line text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" {...register('isRecorrente')}
            className="w-4 h-4 rounded border-line text-brand focus:ring-brand focus:ring-1"
          />
          <span className="text-sm text-ink">Doação recorrente</span>
        </label>

        <div className="rounded-xl bg-surface-soft p-3 text-xs text-muted">
          <strong>Dica:</strong> doações ≥ R$ 500 ou recorrentes ganham ação "Recibo".
          "Anônimo" recebe "Sem contato". As demais, "Agradecer".
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// MODAL — CADASTRAR DESPESA
// ─────────────────────────────────────────────

interface FormDespesa {
  data: string;
  descricao: string;
  categoria: Despesa['categoria'];
  valor: string;
}

function CadastrarDespesaModal({
  open, onClose, onCriada, processando, setProcessando,
}: {
  open: boolean;
  onClose: () => void;
  onCriada: () => void;
  processando: boolean;
  setProcessando: (b: boolean) => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormDespesa>({
    defaultValues: { data: hojeISO(), descricao: '', categoria: 'Material', valor: '' },
  });

  async function submit(form: FormDespesa) {
    const valorNum = Number(form.valor);
    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      toast.error('Valor inválido');
      return;
    }
    setProcessando(true);
    try {
      await cadastrarDespesa({
        data: form.data,
        descricao: form.descricao,
        categoria: form.categoria,
        valor: valorNum,
      });
      toast.success('Despesa cadastrada', {
        description: `${form.descricao} · ${formatarR$(valorNum)}`,
      });
      reset({ data: hojeISO(), descricao: '', categoria: 'Material', valor: '' });
      onCriada();
    } catch {
      toast.error('Não foi possível cadastrar');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title="Cadastrar despesa"
      description="Os custos do mês e o saldo são recalculados automaticamente."
      size="md"
      footer={
        <>
          <button onClick={onClose} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" form="form-despesa" disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50">
            <Plus className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Cadastrando...' : 'Cadastrar despesa'}
          </button>
        </>
      }
    >
      <form id="form-despesa" onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label className="block text-xs text-muted mb-1.5">Descrição *</label>
          <input
            {...register('descricao', { required: true })}
            placeholder="Ex: Material odontológico — kit triagem"
            className={`w-full bg-surface border ${errors.descricao ? 'border-danger' : 'border-line'} text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1.5">Data *</label>
            <input type="date" {...register('data', { required: true })}
              className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Valor (R$) *</label>
            <input type="number" step="0.01" min="0.01"
              {...register('valor', { required: true })}
              placeholder="500,00"
              className={`w-full bg-surface border ${errors.valor ? 'border-danger' : 'border-line'} text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand`}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5">Categoria *</label>
          <select {...register('categoria', { required: true })}
            className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            {CATEGORIAS_DESPESA.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// MODAL — AGRADECER DOAÇÃO
// ─────────────────────────────────────────────

function AgradecerDoacaoModal({
  open, doacao, onClose, onAgradecido,
}: {
  open: boolean;
  doacao: Doacao | null;
  onClose: () => void;
  onAgradecido: () => void;
}) {
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [processando, setProcessando] = useState(false);

  // Quando abre, monta o template com os dados da doação
  useEffect(() => {
    if (!open || !doacao) return;
    const dataFormatada = new Date(doacao.data + 'T12:00:00').toLocaleDateString('pt-BR');
    const valorFormatado = doacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    setAssunto('Obrigado pela sua doação à Turma do Bem');
    setCorpo(
      `Olá, ${doacao.doador}!

      Recebemos sua doação de R$ ${valorFormatado} no dia ${dataFormatada} e queremos agradecer pessoalmente. Cada contribuição ajuda a Turma do Bem a oferecer atendimento odontológico gratuito a jovens em situação de vulnerabilidade.

      Você está fazendo a diferença na vida de muitas pessoas.

      Com gratidão,
      Equipe Turma do Bem`
    ); }, [open, doacao]);

  async function copiar() {
    if (!doacao) return;
    setProcessando(true);
    try {
      const textoCompleto = `Assunto: ${assunto}\n\n${corpo}`;
      await navigator.clipboard.writeText(textoCompleto);
      await marcarComoAgradecida(doacao.id);
      toast.success('Texto copiado', { description: 'Doação marcada como agradecida.' });
      onAgradecido();
    } catch {
      toast.error('Não foi possível copiar');
    } finally {
      setProcessando(false);
    }
  }

  async function abrirEmail() {
    if (!doacao) return;
    setProcessando(true);
    try {
      const mailto = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
      window.location.href = mailto;
      await marcarComoAgradecida(doacao.id);
      toast.success('E-mail aberto', { description: 'Doação marcada como agradecida.' });
      onAgradecido();
    } catch {
      toast.error('Não foi possível abrir o e-mail');
    } finally {
      setProcessando(false);
    }
  }

  if (!doacao) return null;

  return (
    <Modal
      open={open} onClose={onClose}
      title="Agradecer doação"
      description="Edite a mensagem se quiser personalizar antes de enviar."
      size="lg"
      footer={
        <>
          <button onClick={onClose} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={copiar} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors inline-flex items-center gap-2 disabled:opacity-50">
            <Copy className="w-4 h-4" strokeWidth={2} />
            Copiar texto
          </button>
          <button onClick={abrirEmail} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50">
            <Mail className="w-4 h-4" strokeWidth={2} />
            Abrir no e-mail
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Resumo da doação */}
        <div className="rounded-xl bg-surface-soft p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">{doacao.doador}</p>
            <p className="text-xs text-muted mt-0.5">
              {new Date(doacao.data + 'T12:00:00').toLocaleDateString('pt-BR')}
              {doacao.isRecorrente && ' · doador recorrente'}
            </p>
          </div>
          <span className="text-base font-semibold text-success">
            R$ {doacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Assunto */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
            Assunto
          </label>
          <input
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        {/* Corpo */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
            Mensagem
          </label>
          <textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            rows={10}
            className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="rounded-xl bg-info-soft p-3 text-xs text-info">
          <strong>Dica:</strong> "Abrir no e-mail" usa o cliente padrão do sistema (Gmail web, Outlook, Mail do Mac, etc.).
          O destinatário fica em branco — você cola o e-mail do doador antes de enviar.
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// MODAL — RENOVAR PARCERIA
// ─────────────────────────────────────────────

function RenovarParceiroModal({
  open, parceiro, onClose, onFinalizado,
}: {
  open: boolean;
  parceiro: Parceiro | null;
  onClose: () => void;
  onFinalizado: () => void;
}) {
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [processando, setProcessando] = useState(false);

  const historico = useMemo(
    () => (parceiro ? obterHistoricoDoador(parceiro.nome) : null),
    [parceiro, open],
  );

  // Monta o template quando o modal abre
  useEffect(() => {
    if (!open || !parceiro || !historico) return;
    const valorAnualFmt = parceiro.valorAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const totalFmt = historico.totalContribuido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    setAssunto(`Renovação de parceria · Turma do Bem & ${parceiro.nome}`);
    setCorpo(
`Prezados,

A Turma do Bem agradece imensamente a parceria que mantemos com ${parceiro.nome} há ${historico.duracaoLabel}. Ao longo desse período, ${parceiro.nome} contribuiu com ${totalFmt}, contemplando ${historico.qtdDoacoes} ${historico.qtdDoacoes === 1 ? 'doação' : 'doações'} que viabilizaram nosso trabalho de atendimento odontológico gratuito a jovens em situação de vulnerabilidade e mulheres vítimas de violência (programas Dentista do Bem e Apolônias do Bem).

Com a aproximação do encerramento do ciclo atual (valor anual de ${valorAnualFmt}), gostaríamos de agendar uma conversa para discutirmos a renovação e os termos do próximo ciclo de cooperação. Estamos preparando um relatório de impacto detalhado dos resultados alcançados com o apoio da ${parceiro.nome}, que ficaremos honrados em apresentar.

Solicitamos a gentileza de um momento na agenda do(a) responsável para alinharmos os próximos passos.

Aguardamos retorno e renovamos votos de gratidão.

Atenciosamente,
Presidente
Turma do Bem`
    );
  }, [open, parceiro, historico]);

  async function marcarEmNegociacao() {
    if (!parceiro) return;
    await iniciarNegociacaoParceiro(parceiro.id);
  }

  async function copiar() {
    if (!parceiro) return;
    setProcessando(true);
    try {
      await navigator.clipboard.writeText(`Assunto: ${assunto}\n\n${corpo}`);
      await marcarEmNegociacao();
      toast.success('Texto copiado', { description: 'Parceria marcada como em negociação.' });
      onFinalizado();
    } catch {
      toast.error('Não foi possível copiar');
    } finally {
      setProcessando(false);
    }
  }

  async function abrirEmail() {
    if (!parceiro) return;
    setProcessando(true);
    try {
      const mailto = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
      window.location.href = mailto;
      await marcarEmNegociacao();
      toast.success('E-mail aberto', { description: 'Parceria marcada como em negociação.' });
      onFinalizado();
    } catch {
      toast.error('Não foi possível abrir o e-mail');
    } finally {
      setProcessando(false);
    }
  }

  async function gerarPDF() {
    if (!parceiro || !historico) return;
    setProcessando(true);
    try {
      await gerarPropostaPDF(parceiro, historico);
      await marcarEmNegociacao();
      toast.success('Proposta gerada', { description: 'Parceria marcada como em negociação.' });
      onFinalizado();
    } catch {
      toast.error('Não foi possível gerar a proposta');
    } finally {
      setProcessando(false);
    }
  }

  if (!parceiro || !historico) return null;

  const valorAnualFmt = parceiro.valorAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const totalFmt = historico.totalContribuido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Modal
      open={open} onClose={onClose}
      title="Renovar parceria"
      description="Envie a proposta de renovação. A parceria será marcada como 'em negociação'."
      size="xl"
      footer={
        <>
          <button onClick={onClose} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={copiar} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors inline-flex items-center gap-2 disabled:opacity-50">
            <Copy className="w-4 h-4" strokeWidth={2} />
            Copiar
          </button>
          <button onClick={abrirEmail} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors inline-flex items-center gap-2 disabled:opacity-50">
            <Mail className="w-4 h-4" strokeWidth={2} />
            E-mail
          </button>
          <button onClick={gerarPDF} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50">
            <FileText className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Gerando...' : 'Gerar proposta PDF'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* RESUMO DA PARCERIA */}
        <div className="rounded-xl border border-line bg-surface-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Resumo da parceria</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted">Parceiro</p>
              <p className="text-ink font-medium mt-0.5">{parceiro.nome}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Tipo</p>
              <p className="text-ink font-medium mt-0.5">{parceiro.tipoLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Valor anual</p>
              <p className="text-ink font-medium mt-0.5">{valorAnualFmt}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Duração</p>
              <p className="text-ink font-medium mt-0.5">{historico.duracaoLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Total contribuído</p>
              <p className="text-success font-semibold mt-0.5">{totalFmt}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Doações registradas</p>
              <p className="text-ink font-medium mt-0.5">
                {historico.qtdDoacoes}
                {historico.ultimaDoacao && (
                  <span className="text-xs text-subtle ml-1">
                    · última em {new Date(historico.ultimaDoacao + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CARTA DE RENOVAÇÃO */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Carta de renovação</p>

          <div>
            <label className="block text-xs text-muted mb-1.5">Assunto</label>
            <input
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">Mensagem</label>
            <textarea
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              rows={12}
              className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div className="rounded-xl bg-info-soft p-3 text-xs text-info">
          <strong>Como funciona:</strong> qualquer um dos 3 botões (Copiar, E-mail ou PDF) marca a parceria como
          <em> em negociação</em>. A "Carta" é texto editável; o "PDF de proposta" é um documento formal com resumo e próximos passos.
        </div>
      </div>
    </Modal>
  );
}