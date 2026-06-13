import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowLeft, MessageSquare, Calendar, Pause, Play, Check, X,
  CalendarDays, ArrowRight, Phone, Mail, MessageCircle, Copy,
  AlertCircle, CheckCircle2,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';
import { Modal } from '../components/Modal';
import {
  obterDentista,
  contatoDoDentista,
  aprovarDentista,
  rejeitarDentista,
  suspenderDentista,
  reativarDentista,
} from '../services/voluntarios';
import { listarProximosPorDentista } from '../services/atendimentos';
import type { DentistaCompleto } from '../data/dentistas';
import type { Atendimento } from '../data/atendimentos';

type AcaoModal = 'contatar' | 'agenda' | 'suspender' | 'reativar' | 'aprovar' | 'rejeitar'
  | 'ver-paciente' | 'todos-pacientes' | 'configurar-disponibilidade' | null;

type PacienteAtivo = DentistaCompleto['pacientesAtivos'][number];

function formatarDataCurta(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatarTelefone(numero: string): string {
  const limpo = numero.replace(/\D/g, '');
  if (limpo.length >= 12) return `+${limpo.slice(0,2)} (${limpo.slice(2,4)}) ${limpo.slice(4,8)}-${limpo.slice(8,12)}`;
  return numero;
}

export default function DentistaPerfilPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [versao, setVersao] = useState(0);
  const [acao, setAcao] = useState<AcaoModal>(null);
  const [processando, setProcessando] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteAtivo | null>(null);

  const dentista = useMemo(
    () => (id ? obterDentista(id) : undefined),
    [id, versao],
  );

  function refresh() {
    setVersao((v) => v + 1);
  }

  function fechar() {
    if (processando) return;
    setAcao(null);
  }

  if (!dentista) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-4 text-center">
        <p className="text-sm text-muted">Dentista não encontrado.</p>
        <button
          onClick={() => navigate('/dashboard/voluntarios')}
          className="text-sm px-4 py-2 rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors"
        >
          Voltar a Voluntários
        </button>
      </div>
    );
  }

  const isPendente  = dentista.status === 'Pendente';
  const isAtiva     = dentista.status === 'Ativa';
  const isSuspensa  = dentista.status === 'Suspensa';
  const isInativo   = dentista.status === 'Inativo';

  // ─── Handlers ────────────────────────────────

  async function handleAprovar() {
    setProcessando(true);
    try {
      await aprovarDentista(dentista!.id);
      toast.success('Cadastro aprovado', { description: `${dentista!.nome} agora faz parte da rede.` });
      refresh();
      fechar();
    } catch {
      toast.error('Não foi possível aprovar');
    } finally {
      setProcessando(false);
    }
  }

  async function handleRejeitar(motivo: string) {
    setProcessando(true);
    try {
      await rejeitarDentista(dentista!.id, motivo);
      toast.success('Cadastro rejeitado');
      navigate('/dashboard/voluntarios');
    } catch {
      toast.error('Não foi possível rejeitar');
      setProcessando(false);
    }
  }

  async function handleSuspender(motivo: string, observacao?: string) {
    setProcessando(true);
    try {
      await suspenderDentista(dentista!.id, motivo, observacao);
      toast.success(`${dentista!.nome} suspensa`, { description: 'Não receberá novos vínculos enquanto suspensa.' });
      refresh();
      fechar();
    } catch {
      toast.error('Não foi possível suspender');
    } finally {
      setProcessando(false);
    }
  }

  async function handleReativar() {
    setProcessando(true);
    try {
      await reativarDentista(dentista!.id);
      toast.success(`${dentista!.nome} reativada`, { description: 'Já pode receber novos vínculos.' });
      refresh();
      fechar();
    } catch {
      toast.error('Não foi possível reativar');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-full">

      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/dashboard/voluntarios')}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        Voluntários · {dentista.regiao}
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-line bg-surface shadow-cardp-4 md:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">

          <div className="flex min-w-0 flex-1 items-start gap-4">
            <Avatar initials={dentista.iniciais} size="lg" tone="info" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg md:text-xl font-semibold text-ink">{dentista.nome}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  isAtiva    ? 'bg-success-soft text-success' :
                  isInativo  ? 'bg-warning-soft text-warning' :
                  isSuspensa ? 'bg-danger-soft text-danger'   :
                              'bg-info-soft text-info'
                }`}>
                  {isPendente ? 'Aguardando aprovação' : dentista.status}
                </span>
              </div>

              <p className="text-sm text-muted mt-2 leading-relaxed">
                {dentista.especialidade} · {dentista.cro} · {dentista.cidade}-{dentista.estado}
                {dentista.bairro && `, ${dentista.bairro}`}
              </p>

              {!isPendente && (
                <p className="text-xs text-subtle mt-1.5">
                  Voluntária desde {dentista.voluntariaDesde}
                  {dentista.anosNaRede > 0 && ` · ${dentista.anosNaRede} anos de rede`}
                </p>
              )}

              {(dentista.tags.length > 0 || dentista.programas.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {dentista.programas.map((p) => (
                    <span key={p} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-surface-soft text-muted">{p}</span>
                  ))}
                  {dentista.tags.map((t) => (
                    <span key={t} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-surface-soft text-muted">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ações por status */}
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[200px]">
            {isPendente && (
              <>
                <button onClick={() => setAcao('aprovar')} className="inline-flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl bg-success text-surface hover:opacity-90 transition-opacity">
                  <Check className="w-4 h-4" strokeWidth={2.5} /> Aprovar cadastro
                </button>
                <button onClick={() => setAcao('rejeitar')} className="inline-flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl border border-line text-danger hover:bg-danger-soft transition-colors">
                  <X className="w-4 h-4" strokeWidth={2} /> Rejeitar
                </button>
              </>
            )}

            {(isAtiva || isInativo || isSuspensa) && (
              <>
                <button onClick={() => setAcao('contatar')} className="inline-flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl bg-ink text-surface hover:opacity-90 transition-opacity">
                  <MessageSquare className="w-4 h-4" strokeWidth={2} /> Contatar
                </button>
                <button onClick={() => setAcao('agenda')} className="inline-flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors">
                  <Calendar className="w-4 h-4" strokeWidth={2} /> Ver agenda
                </button>
                {isSuspensa ? (
                  <button onClick={() => setAcao('reativar')} className="inline-flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl border border-success text-success hover:bg-success-soft transition-colors">
                    <Play className="w-4 h-4" strokeWidth={2} /> Reativar
                  </button>
                ) : isAtiva && (
                  <button onClick={() => setAcao('suspender')} className="inline-flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl border border-line text-danger hover:bg-danger-soft transition-colors">
                    <Pause className="w-4 h-4" strokeWidth={2} /> Suspender
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Banner de suspensão */}
      {isSuspensa && dentista.historicoSuspensoes && dentista.historicoSuspensoes.length > 0 && (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft p-4 md:p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">Voluntária suspensa</p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              {dentista.historicoSuspensoes[dentista.historicoSuspensoes.length - 1].motivo}
              {dentista.historicoSuspensoes[dentista.historicoSuspensoes.length - 1].observacao &&
                ` · ${dentista.historicoSuspensoes[dentista.historicoSuspensoes.length - 1].observacao}`}
            </p>
            <p className="text-2xs text-subtle mt-1">
              Suspensa em {formatarDataCurta(dentista.historicoSuspensoes[dentista.historicoSuspensoes.length - 1].data)}
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      {!isPendente && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Vínculos ativos"       value={dentista.vinculosAtivos}      sub={`de ${dentista.vinculosTotal} no total`} />
          <KpiCard label="Atendimentos em 2025"  value={dentista.atendimentosNoAno}   sub="+14 vs 2024" subTone="success" />
          <KpiCard label="Rating médio"          value={dentista.rating.toFixed(1)}   sub={`${dentista.ratingCount} avaliações`} />
          <KpiCard label="Comparecimento"        value={`${dentista.taxaComparecimento}%`} sub="acima da média" subTone="success" />
        </div>
      )}

      {/* Pacientes ativos */}
      {!isPendente && dentista.pacientesAtivos.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface shadow-cardp-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base md:text-sm font-semibold text-ink">
              Pacientes ativos · {dentista.vinculosAtivos} vínculos
            </h2>
            <span className="text-xs text-subtle whitespace-nowrap">Em tratamento agora</span>
          </div>

          <div className="divide-y divide-line">
            {dentista.pacientesAtivos.map((p) => (
              <div key={p.id} className="flex flex-col gap-4 py-4 first:pt-1 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar initials={p.iniciais} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink md:text-base">{p.nome}, {p.idade} anos</p>
                    <p className="mt-1 text-xs text-muted md:text-sm">{p.tratamento} · {p.programa}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-subtle">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
                        {p.atendimentos} atendimentos
                      </span>
                      <span>vinculado há {p.diasVinculado}d</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                    p.status === 'em-andamento' ? 'bg-info-soft text-info' :
                    p.status === 'aguardando'   ? 'bg-warning-soft text-warning' :
                                                  'bg-success-soft text-success'
                  }`}>
                    {p.status === 'em-andamento' ? 'Em andamento' : p.status === 'aguardando' ? 'Aguardando consulta' : 'Concluído'}
                  </span>
                  <button
                    onClick={() => { setPacienteSelecionado(p); setAcao('ver-paciente'); }}
                    className="w-full rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto"
                  >
                    Ver
                  </button>
                </div>
              </div>
            ))}
          </div>

          {dentista.vinculosAtivos > dentista.pacientesAtivos.length && (
            <button
              onClick={() => setAcao('todos-pacientes')}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm text-ink transition-colors hover:bg-surface-soft"
            >
              Ver todos os {dentista.vinculosAtivos} pacientes
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* Disponibilidade + últimos */}
      {!isPendente && dentista.disponibilidadeSemana.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface shadow-cardp-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base md:text-sm font-semibold text-ink">Disponibilidade da semana</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-subtle whitespace-nowrap">
                  {dentista.disponibilidadeSemana.reduce((acc, d) => acc + (d.total - d.ocupados), 0)} slots livres
                </span>
                <button
                  onClick={() => setAcao('configurar-disponibilidade')}
                  className="text-xs text-muted hover:text-ink transition-colors"
                >
                  Configurar
                </button>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-5 gap-1.5">
              {dentista.disponibilidadeSemana.map((d) => (
                <div key={d.dia} className={`rounded-lg px-1 py-3 text-center ${d.livre ? 'bg-surface-soft' : 'bg-info-soft'}`}>
                  <p className={`text-xs ${d.livre ? 'text-muted' : 'text-info'}`}>{d.dia}</p>
                  <p className={`mt-1 text-sm font-medium ${d.livre ? 'text-muted' : 'text-ink'}`}>
                    {d.livre ? 'livre' : `${d.ocupados}/${d.total}`}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted">
              Horários: <span className="font-medium text-ink">{dentista.horarioConfigurado}</span>
            </p>
            {dentista.proximoSlot && (
              <p className="mt-1 text-xs text-muted">
                Próximo slot livre: <span className="font-medium text-success">{dentista.proximoSlot}</span>
              </p>
            )}
          </div>

          {dentista.ultimosAtendimentos.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface shadow-cardp-4 md:p-5">
              <h2 className="mb-4 text-base md:text-sm font-semibold text-ink">Últimos atendimentos</h2>
              <div className="divide-y divide-line">
                {dentista.ultimosAtendimentos.map((a, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0">
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{a.paciente}</p>
                      <p className="mt-0.5 text-xs text-subtle">{a.descricao}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted">{a.data}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mensagem específica para pendentes */}
      {isPendente && (
        <div className="rounded-2xl border border-info bg-info-soft p-4 md:p-5 text-sm leading-relaxed text-info">
          Este dentista está aguardando aprovação para entrar na rede.
          Verifique os documentos (CRO, certificados) antes de aprovar.
          Após aprovação, ele recebe acesso ao painel em <code className="rounded-md bg-surface px-1.5 py-0.5 text-xs">/meu-painel</code> e pode configurar horários e receber convites de vinculação.
        </div>
      )}

      {/* MODAIS */}
      <ContatarVoluntarioModal
        open={acao === 'contatar'}
        dentista={dentista}
        onClose={fechar}
      />
      <VerAgendaModal
        open={acao === 'agenda'}
        dentista={dentista}
        onClose={fechar}
        onNavegar={() => navigate(`/dashboard/atendimentos?dentistaId=${dentista.id}`)}
      />
      <SuspenderModal
        open={acao === 'suspender'}
        dentista={dentista}
        onClose={fechar}
        onConfirmar={handleSuspender}
        processando={processando}
      />
      <ReativarModal
        open={acao === 'reativar'}
        dentista={dentista}
        onClose={fechar}
        onConfirmar={handleReativar}
        processando={processando}
      />
      <AprovarModal
        open={acao === 'aprovar'}
        dentista={dentista}
        onClose={fechar}
        onConfirmar={handleAprovar}
        processando={processando}
      />
      <RejeitarModal
        open={acao === 'rejeitar'}
        dentista={dentista}
        onClose={fechar}
        onConfirmar={handleRejeitar}
        processando={processando}
      />
      <PacienteDetalhesModal
        open={acao === 'ver-paciente'}
        dentista={dentista}
        paciente={pacienteSelecionado}
        onClose={fechar}
      />
      <TodosPacientesModal
        open={acao === 'todos-pacientes'}
        dentista={dentista}
        onClose={fechar}
        onSelecionar={(p) => { setPacienteSelecionado(p); setAcao('ver-paciente'); }}
      />
      <ConfigurarDisponibilidadeModal
        open={acao === 'configurar-disponibilidade'}
        dentista={dentista}
        onClose={fechar}
        onSalvo={refresh}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────
// MODAL — CONTATAR
// ──────────────────────────────────────────────────

const TEMPLATES_CONTATO = [
  {
    id: 'disponibilidade',
    label: 'Pedido de disponibilidade',
    gerar: (d: DentistaCompleto) =>
      `Olá ${primeiroNome(d.nome)}, aqui é da Turma do Bem. Temos um novo paciente próximo a você que precisa de ${d.especialidade.toLowerCase()}. Tem disponibilidade nas próximas 2 semanas?`,
  },
  {
    id: 'mutirao',
    label: 'Convite pra mutirão',
    gerar: (d: DentistaCompleto) =>
      `Olá ${primeiroNome(d.nome)}! Estamos organizando um mutirão em ${d.cidade}-${d.estado} no próximo mês. Sua participação faria muita diferença. Pode contar com você?`,
  },
  {
    id: 'agradecimento',
    label: 'Agradecimento',
    gerar: (d: DentistaCompleto) =>
      `Olá ${primeiroNome(d.nome)}, queria agradecer pelos atendimentos deste mês. Sua dedicação transforma a vida dos pacientes da Turma do Bem!`,
  },
  {
    id: 'reengajamento',
    label: 'Reengajamento',
    gerar: (d: DentistaCompleto) =>
      `Olá ${primeiroNome(d.nome)}, sentimos sua falta na rede! Faz ${d.ultimaAtividadeDias} dias desde sua última atividade. Tudo bem com você? Podemos ajustar sua disponibilidade?`,
  },
];

function primeiroNome(nome: string): string {
  return nome.replace(/^Dra?\.?\s+/, '').split(' ')[0];
}

function ContatarVoluntarioModal({
  open, dentista, onClose,
}: {
  open: boolean;
  dentista: DentistaCompleto;
  onClose: () => void;
}) {
  const isInativo = dentista.status === 'Inativo';
  const [templateId, setTemplateId] = useState(isInativo ? 'reengajamento' : 'disponibilidade');

  useEffect(() => {
    if (open) setTemplateId(isInativo ? 'reengajamento' : 'disponibilidade');
  }, [open, isInativo]);

  const contato = contatoDoDentista(dentista);
  const template = TEMPLATES_CONTATO.find((t) => t.id === templateId)!;
  const mensagem = template.gerar(dentista);

  function abrirWhatsApp() {
    const url = `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp aberto com a mensagem');
  }

  function abrirEmail() {
    const subject = `Turma do Bem · ${template.label}`;
    const url = `mailto:${contato.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mensagem)}`;
    window.location.href = url;
    toast.success('Cliente de email aberto');
  }

  function copiarTelefone() {
    navigator.clipboard.writeText(contato.telefone);
    toast.success(`Telefone copiado: ${formatarTelefone(contato.telefone)}`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Contatar voluntária"
      description="Envie uma mensagem pelo canal preferido."
      size="lg"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors"
        >
          Fechar
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-line">
          <Avatar initials={dentista.iniciais} size="sm" tone="info" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{dentista.nome}</p>
            <p className="text-xs text-muted">{dentista.especialidade} · {dentista.cidade}-{dentista.estado}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">Template de mensagem</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            {TEMPLATES_CONTATO.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <p className="text-xs text-ink bg-surface-soft rounded-lg px-3 py-2.5 mt-2 leading-relaxed">{mensagem}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Canais disponíveis</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={abrirWhatsApp}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
              WhatsApp
            </button>
            <button
              onClick={abrirEmail}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-info text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Mail className="w-4 h-4" strokeWidth={2.5} />
              Email
            </button>
            <button
              onClick={copiarTelefone}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-line text-ink text-sm font-medium hover:bg-surface-soft transition-colors"
            >
              <Phone className="w-4 h-4" strokeWidth={2} />
              {formatarTelefone(contato.telefone).split(' ').slice(-2).join(' ')}
              <Copy className="w-3 h-3 opacity-60" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────
// MODAL — VER AGENDA
// ──────────────────────────────────────────────────

function VerAgendaModal({
  open, dentista, onClose, onNavegar,
}: {
  open: boolean;
  dentista: DentistaCompleto;
  onClose: () => void;
  onNavegar: () => void;
}) {
  const proximos = useMemo<Atendimento[]>(
    () => listarProximosPorDentista(dentista.id, 6),
    [dentista.id, open],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agenda da voluntária"
      description={`Próximos atendimentos de ${dentista.nome}`}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={onNavegar}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center justify-center gap-2"
          >
            Ver agenda completa
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </>
      }
    >
      {/* Resumo de disponibilidade */}
      {dentista.disponibilidadeSemana.length > 0 && (
        <div className="mb-4 bg-surface-soft rounded-xl p-3 text-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Esta semana</p>
            <span className="text-xs text-muted">
              {dentista.disponibilidadeSemana.reduce((acc, d) => acc + (d.total - d.ocupados), 0)} slots livres
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {dentista.disponibilidadeSemana.map((d) => (
              <div key={d.dia} className={`rounded-lg px-1 py-2 text-center ${d.livre ? 'bg-surface' : 'bg-info-soft'}`}>
                <p className={`text-2xs ${d.livre ? 'text-muted' : 'text-info'}`}>{d.dia}</p>
                <p className={`text-xs font-medium ${d.livre ? 'text-muted' : 'text-ink'}`}>
                  {d.livre ? '—' : `${d.ocupados}/${d.total}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximos atendimentos */}
      <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Próximos atendimentos</p>
      {proximos.length === 0 ? (
        <p className="text-sm text-muted py-6 text-center">Sem atendimentos agendados.</p>
      ) : (
        <div className="divide-y divide-line border border-line rounded-xl overflow-hidden">
          {proximos.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3">
              <div className="min-w-[64px]">
                <p className="text-sm font-medium text-ink">{formatarDataCurta(a.data)}</p>
                <p className="text-xs text-muted">{a.hora}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink truncate">{a.paciente.nome}, {a.paciente.idade}</p>
                <p className="text-xs text-muted truncate">{a.especialidade} · {a.local}</p>
              </div>
              <span className="text-2xs text-muted shrink-0">{a.duracaoMinutos}min</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ──────────────────────────────────────────────────
// MODAL — SUSPENDER
// ──────────────────────────────────────────────────

interface SuspenderForm {
  motivo: string;
  observacao: string;
}

function SuspenderModal({
  open, dentista, onClose, onConfirmar, processando,
}: {
  open: boolean;
  dentista: DentistaCompleto;
  onClose: () => void;
  onConfirmar: (motivo: string, observacao?: string) => Promise<void>;
  processando: boolean;
}) {
  const { register, handleSubmit, reset } = useForm<SuspenderForm>({
    defaultValues: { motivo: 'Sem disponibilidade', observacao: '' },
  });

  useEffect(() => {
    if (open) reset({ motivo: 'Sem disponibilidade', observacao: '' });
  }, [open, reset]);

  async function submit(data: SuspenderForm) {
    await onConfirmar(data.motivo, data.observacao || undefined);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Suspender voluntária"
      description="Enquanto suspensa, ela não recebe novos vínculos nem aparece no matching."
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-suspender"
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-danger text-surface hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Pause className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Suspendendo...' : 'Confirmar suspensão'}
          </button>
        </>
      }
    >
      <form id="form-suspender" onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-line">
          <Avatar initials={dentista.iniciais} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{dentista.nome}</p>
            <p className="text-xs text-muted">{dentista.vinculosAtivos} pacientes ativos · {dentista.especialidade}</p>
          </div>
        </div>

        {dentista.vinculosAtivos > 0 && (
          <div className="bg-warning-soft border border-warning/30 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-xs text-ink leading-relaxed">
              Esta voluntária tem <span className="font-medium">{dentista.vinculosAtivos} pacientes em tratamento</span>. Eles voltarão para a fila de triagens automaticamente.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">Motivo *</label>
          <select
            {...register('motivo', { required: true })}
            className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            <option value="Sem disponibilidade">Sem disponibilidade</option>
            <option value="Quebra de conduta">Quebra de conduta</option>
            <option value="Inatividade prolongada">Inatividade prolongada</option>
            <option value="Solicitação da voluntária">Solicitação da voluntária</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
            Observação <span className="font-normal normal-case">(opcional)</span>
          </label>
          <textarea
            {...register('observacao')}
            rows={3}
            placeholder="Contexto adicional sobre a suspensão..."
            className="w-full bg-surface border border-line text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </form>
    </Modal>
  );
}

// ──────────────────────────────────────────────────
// MODAL — REATIVAR
// ──────────────────────────────────────────────────

function ReativarModal({
  open, dentista, onClose, onConfirmar, processando,
}: {
  open: boolean;
  dentista: DentistaCompleto;
  onClose: () => void;
  onConfirmar: () => Promise<void>;
  processando: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reativar voluntária"
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-success text-surface hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Reativando...' : 'Confirmar reativação'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-line">
          <Avatar initials={dentista.iniciais} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{dentista.nome}</p>
            <p className="text-xs text-muted">Suspensa</p>
          </div>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          Após reativar, ela voltará a aparecer no matching de triagens e poderá receber novos vínculos.
        </p>
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────
// MODAL — APROVAR
// ──────────────────────────────────────────────────

function AprovarModal({
  open, dentista, onClose, onConfirmar, processando,
}: {
  open: boolean;
  dentista: DentistaCompleto;
  onClose: () => void;
  onConfirmar: () => Promise<void>;
  processando: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Aprovar cadastro"
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-success text-surface hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Aprovando...' : 'Aprovar cadastro'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-line">
          <Avatar initials={dentista.iniciais} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{dentista.nome}</p>
            <p className="text-xs text-muted">{dentista.cro} · {dentista.especialidade}</p>
          </div>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          Ao aprovar, {primeiroNome(dentista.nome)} entra na rede e ganha acesso ao painel para configurar horários e receber convites de vinculação.
        </p>
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────
// MODAL — REJEITAR
// ──────────────────────────────────────────────────

interface RejeitarForm {
  motivo: string;
  observacao: string;
}

function RejeitarModal({
  open, dentista, onClose, onConfirmar, processando,
}: {
  open: boolean;
  dentista: DentistaCompleto;
  onClose: () => void;
  onConfirmar: (motivo: string) => Promise<void>;
  processando: boolean;
}) {
  const { register, handleSubmit, reset } = useForm<RejeitarForm>({
    defaultValues: { motivo: 'Documentação inválida', observacao: '' },
  });

  useEffect(() => {
    if (open) reset({ motivo: 'Documentação inválida', observacao: '' });
  }, [open, reset]);

  async function submit(data: RejeitarForm) {
    const motivoCompleto = data.observacao ? `${data.motivo} — ${data.observacao}` : data.motivo;
    await onConfirmar(motivoCompleto);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rejeitar cadastro"
      description="O cadastro será arquivado e não aparecerá mais na lista."
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-rejeitar"
            disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-danger text-surface hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <X className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Rejeitando...' : 'Confirmar rejeição'}
          </button>
        </>
      }
    >
      <form id="form-rejeitar" onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-line">
          <Avatar initials={dentista.iniciais} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{dentista.nome}</p>
            <p className="text-xs text-muted">{dentista.cro} · {dentista.especialidade}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">Motivo *</label>
          <select
            {...register('motivo', { required: true })}
            className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            <option value="Documentação inválida">Documentação inválida</option>
            <option value="CRO não confere">CRO não confere</option>
            <option value="Suspeita de fraude">Suspeita de fraude</option>
            <option value="Perfil fora do escopo do programa">Perfil fora do escopo do programa</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
            Observação <span className="font-normal normal-case">(opcional)</span>
          </label>
          <textarea
            {...register('observacao')}
            rows={3}
            placeholder="Detalhes adicionais para registro interno..."
            className="w-full bg-surface border border-line text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </form>
    </Modal>
  );
}

// ──────────────────────────────────────────────────
// MODAL — VER PACIENTE

function PacienteDetalhesModal({
  open, dentista, paciente, onClose,
}: {
  open: boolean;
  dentista: DentistaCompleto;
  paciente: PacienteAtivo | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  const proximos = useMemo<Atendimento[]>(
    () => paciente
      ? listarProximosPorDentista(dentista.id, 20).filter((a) => a.paciente.nome === paciente.nome).slice(0, 3)
      : [],
    [dentista.id, paciente, open],
  );

  if (!paciente) return null;

  const statusLabel =
    paciente.status === 'em-andamento' ? 'Em andamento' :
    paciente.status === 'aguardando'   ? 'Aguardando consulta' :
                                          'Concluído';
  const statusClasses =
    paciente.status === 'em-andamento' ? 'bg-info-soft text-info' :
    paciente.status === 'aguardando'   ? 'bg-warning-soft text-warning' :
                                          'bg-success-soft text-success';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalhes do paciente"
      description={`Vínculo com ${dentista.nome}`}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={() => { navigate(`/dashboard/atendimentos?dentistaId=${dentista.id}`); onClose(); }}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center justify-center gap-2"
          >
            Ver atendimentos
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl border border-line">
          <Avatar initials={paciente.iniciais} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-ink truncate">{paciente.nome}, {paciente.idade} anos</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusClasses}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-muted mt-1">{paciente.tratamento}</p>
            <p className="text-xs text-subtle mt-1">{paciente.programa} · Vinculado há {paciente.diasVinculado} dias</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-surface-soft p-3">
            <p className="text-2xs uppercase tracking-wide text-subtle">Atendimentos</p>
            <p className="text-lg font-semibold text-ink mt-1">{paciente.atendimentos}</p>
          </div>
          <div className="rounded-xl bg-surface-soft p-3">
            <p className="text-2xs uppercase tracking-wide text-subtle">Vínculo</p>
            <p className="text-lg font-semibold text-ink mt-1">{paciente.diasVinculado}d</p>
          </div>
          <div className="rounded-xl bg-surface-soft p-3">
            <p className="text-2xs uppercase tracking-wide text-subtle">Status</p>
            <p className="text-sm font-semibold text-ink mt-1 leading-tight">{statusLabel}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Próximos atendimentos</p>
          {proximos.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center rounded-xl border border-dashed border-line">
              Sem atendimentos agendados para esse paciente.
            </p>
          ) : (
            <div className="divide-y divide-line border border-line rounded-xl overflow-hidden">
              {proximos.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-[64px]">
                    <p className="text-sm font-medium text-ink">{formatarDataCurta(a.data)}</p>
                    <p className="text-xs text-muted">{a.hora}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink truncate">{a.especialidade}</p>
                    <p className="text-xs text-muted truncate">{a.local}</p>
                  </div>
                  <span className="text-2xs text-muted shrink-0">{a.duracaoMinutos}min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────
// MODAL — TODOS OS PACIENTES
// ──────────────────────────────────────────────────

function TodosPacientesModal({
  open, dentista, onClose, onSelecionar,
}: {
  open: boolean;
  dentista: DentistaCompleto;
  onClose: () => void;
  onSelecionar: (p: PacienteAtivo) => void;
}) {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'em-andamento' | 'aguardando' | 'concluido'>('todos');

  useEffect(() => {
    if (open) { setBusca(''); setStatusFiltro('todos'); }
  }, [open]);

  const filtrados = useMemo(() => {
    return dentista.pacientesAtivos.filter((p) => {
      if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (statusFiltro !== 'todos' && p.status !== statusFiltro) return false;
      return true;
    });
  }, [dentista.pacientesAtivos, busca, statusFiltro]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Pacientes ativos · ${dentista.vinculosAtivos} vínculos`}
      description={`Todos os pacientes em tratamento com ${dentista.nome}`}
      size="lg"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors"
        >
          Fechar
        </button>
      }
    >
      <div className="space-y-3">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar paciente por nome..."
          className="w-full bg-surface border border-line text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />

        <div className="flex flex-wrap gap-1.5">
          {([
            { id: 'todos',        label: 'Todos' },
            { id: 'em-andamento', label: 'Em andamento' },
            { id: 'aguardando',   label: 'Aguardando' },
            { id: 'concluido',    label: 'Concluído' },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStatusFiltro(opt.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFiltro === opt.id ? 'bg-ink text-surface' : 'bg-surface-soft text-muted hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-subtle">
          {filtrados.length} de {dentista.pacientesAtivos.length} pacientes
        </p>

        {filtrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
            Nenhum paciente corresponde aos filtros.
          </div>
        ) : (
          <div className="divide-y divide-line border border-line rounded-xl overflow-hidden max-h-[55vh] overflow-y-auto">
            {filtrados.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-surface-soft transition-colors">
                <Avatar initials={p.iniciais} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{p.nome}, {p.idade} anos</p>
                  <p className="text-xs text-muted truncate">{p.tratamento} · {p.programa}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-subtle">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" strokeWidth={2} />
                      {p.atendimentos}x
                    </span>
                    <span>{p.diasVinculado}d de vínculo</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                    p.status === 'em-andamento' ? 'bg-info-soft text-info' :
                    p.status === 'aguardando'   ? 'bg-warning-soft text-warning' :
                                                  'bg-success-soft text-success'
                  }`}>
                    {p.status === 'em-andamento' ? 'Em andamento' : p.status === 'aguardando' ? 'Aguardando' : 'Concluído'}
                  </span>
                  <button
                    onClick={() => onSelecionar(p)}
                    className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-xs text-ink hover:bg-surface transition-colors"
                  >
                    Ver
                    <ArrowRight className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────
// MODAL — CONFIGURAR DISPONIBILIDADE
// ──────────────────────────────────────────────────

interface ConfigDispForm {
  diasAtivos: string;
  horaInicio: string;
  horaFim: string;
  duracaoSlotMin: number;
}

const DIAS_DA_SEMANA = [
  { id: 'seg', label: 'Seg' }, { id: 'ter', label: 'Ter' }, { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' }, { id: 'sex', label: 'Sex' }, { id: 'sab', label: 'Sáb' },
  { id: 'dom', label: 'Dom' },
];

function ConfigurarDisponibilidadeModal({
  open, dentista, onClose, onSalvo,
}: {
  open: boolean;
  dentista: DentistaCompleto;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const STORAGE_KEY = `tdb_disponibilidade_${dentista.id}`;

  const { register, handleSubmit, watch, setValue, reset } = useForm<ConfigDispForm>({
    defaultValues: { diasAtivos: 'seg,ter,qui,sex', horaInicio: '14:00', horaFim: '18:00', duracaoSlotMin: 60 },
  });

  useEffect(() => {
    if (!open) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const cfg = JSON.parse(saved);
        reset({
          diasAtivos: (cfg.diasAtivos ?? ['seg','ter','qui','sex']).join(','),
          horaInicio: cfg.horaInicio ?? '14:00',
          horaFim: cfg.horaFim ?? '18:00',
          duracaoSlotMin: cfg.duracaoSlotMin ?? 60,
        });
      } else {
        reset({ diasAtivos: 'seg,ter,qui,sex', horaInicio: '14:00', horaFim: '18:00', duracaoSlotMin: 60 });
      }
    } catch {
      // ignore
    }
  }, [open, STORAGE_KEY, reset]);

  const diasAtivosArr = (watch('diasAtivos') ?? '').split(',').filter(Boolean);
  const horaInicio = watch('horaInicio');
  const horaFim = watch('horaFim');
  const duracao = Number(watch('duracaoSlotMin'));
  const slotsPorDia = (() => {
    if (!horaInicio || !horaFim || !duracao) return 0;
    const ini = Number(horaInicio.split(':')[0]) * 60 + Number(horaInicio.split(':')[1]);
    const fim = Number(horaFim.split(':')[0]) * 60 + Number(horaFim.split(':')[1]);
    return fim > ini ? Math.floor((fim - ini) / duracao) : 0;
  })();

  function toggleDia(d: string) {
    const next = diasAtivosArr.includes(d)
      ? diasAtivosArr.filter((x) => x !== d)
      : [...diasAtivosArr, d];
    setValue('diasAtivos', next.join(','));
  }

  function submit(data: ConfigDispForm) {
    if (diasAtivosArr.length === 0) {
      toast.error('Selecione ao menos um dia da semana');
      return;
    }
    if (data.horaInicio >= data.horaFim) {
      toast.error('A hora final precisa ser maior que a inicial');
      return;
    }
    try {
      const cfg = {
        diasAtivos: diasAtivosArr,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        duracaoSlotMin: Number(data.duracaoSlotMin),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      toast.success('Disponibilidade atualizada', {
        description: `${diasAtivosArr.length} dias ativos · ${slotsPorDia} slots por dia`,
      });
      onSalvo();
      onClose();
    } catch {
      toast.error('Não foi possível salvar');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurar disponibilidade"
      description={`Defina os horários de ${dentista.nome}`}
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-disp"
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" strokeWidth={2} />
            Salvar
          </button>
        </>
      }
    >
      <form id="form-disp" onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-line">
          <Avatar initials={dentista.iniciais} size="sm" tone="info" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{dentista.nome}</p>
            <p className="text-xs text-muted">{dentista.especialidade} · {dentista.cro}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-2">Dias de atendimento</label>
          <input type="hidden" {...register('diasAtivos')} />
          <div className="grid grid-cols-7 gap-1.5">
            {DIAS_DA_SEMANA.map((d) => {
              const ativo = diasAtivosArr.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDia(d.id)}
                  className={`rounded-lg py-2 text-xs font-medium transition-all ${
                    ativo ? 'bg-ink text-surface' : 'bg-surface-soft text-muted hover:text-ink'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">Hora inicial</label>
            <input
              type="time"
              {...register('horaInicio')}
              className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">Hora final</label>
            <input
              type="time"
              {...register('horaFim')}
              className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">Slot</label>
            <select
              {...register('duracaoSlotMin')}
              className="w-full bg-surface border border-line text-ink rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-brand"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl bg-info-soft p-3 text-xs text-info leading-relaxed">
          Com essa configuração: <span className="font-semibold">{slotsPorDia} slots por dia</span> · <span className="font-semibold">{slotsPorDia * diasAtivosArr.length} por semana</span>
        </div>
      </form>
    </Modal>
  );
}