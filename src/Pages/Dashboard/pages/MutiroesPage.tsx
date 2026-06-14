import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
//import { jsPDF } from 'jspdf';
import {
  Plus, Check, Clock, AlertTriangle, UserPlus, ArrowRight,
  MapPin, Users, Calendar as CalIcon, FileText, Download,
  Trash2
} from 'lucide-react';

import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';
import { Modal } from '../components/Modal';

import {
  listarProximos, listarRecentes, obterMutirao, diasAte,
  criarMutirao, convocarVoluntarios, cancelarConvocacao,
  cancelarPresencaPaciente, listarVoluntariosDisponiveis, listarEspecialidadesParaFiltro,
  type NovoMutiraoInput,
} from '../services/mutiroes';
import { appendSheet } from '../../../Services/googleSheets';

import type { Mutirao, StatusMutirao } from '../data/mutiroes';
import { ESPECIALIDADES_MUTIRAO } from '../data/mutiroes';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const DIAS_SEMANA = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function diaSemanaUpper(iso: string) { return DIAS_SEMANA[new Date(iso + 'T12:00:00').getDay()]; }
function diaMes(iso: string) { return parseInt(iso.slice(8, 10), 10); }
function mesAbrev(iso: string) { return MESES[parseInt(iso.slice(5, 7), 10) - 1]; }
function dataDiaMes(iso: string) { return `${diaMes(iso)} ${mesAbrev(iso)}`; }
function diaSemanaCompleto(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  const s = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatarDataLonga(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────

type ConfigStatus = {
  bg: string; text: string; label: string; Icon: typeof Check;
  cardBorderClass: string; dateBg: string; dateText: string;
};

const STATUS_CONFIG: Record<Exclude<StatusMutirao, 'realizado'>, ConfigStatus> = {
  pronto:         { bg: 'bg-success-soft', text: 'text-success', label: 'Pronto',         Icon: Check,         cardBorderClass: 'border border-line',    dateBg: 'bg-surface-soft', dateText: 'text-ink' },
  'em-preparacao':{ bg: 'bg-warning-soft', text: 'text-warning', label: 'Em preparação', Icon: Clock,         cardBorderClass: 'border border-line',    dateBg: 'bg-surface-soft', dateText: 'text-ink' },
  atencao:        { bg: 'bg-danger-soft',  text: 'text-danger',  label: 'Atenção',       Icon: AlertTriangle, cardBorderClass: 'border-2 border-danger',dateBg: 'bg-danger-soft',  dateText: 'text-danger' },
};

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

type Acao =
  | { tipo: 'cadastrar' }
  | { tipo: 'detalhes';  id: string }
  | { tipo: 'convocar';  id: string }
  | { tipo: 'relatorio'; id: string }
  | null;

export default function MutiroesPage() {
  const [versao, setVersao] = useState(0);
  const [acao, setAcao]     = useState<Acao>(null);
  const [processando, setProcessando] = useState(false);

  const proximos = useMemo(() => listarProximos(), [versao]);
  const recentes = useMemo(() => listarRecentes(3), [versao]);

  const proximo = proximos[0];
  const diasAteProximo = proximo ? diasAte(proximo.data) : null;

  function refresh() { setVersao((v) => v + 1); }
  function fechar()  { if (!processando) setAcao(null); }

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Próximos mutirões" value={proximos.length} sub="nas próximas 3 semanas" />
        <KpiCard
          label="Próximo"
          value={proximo ? `${diaSemanaCompleto(proximo.data).slice(0,3)} ${diaMes(proximo.data)}/${proximo.data.slice(5,7)}` : '—'}
          sub={proximo && diasAteProximo !== null ? `em ${diasAteProximo} dias · ${proximo.cidade}-${proximo.estado}` : 'sem agendamentos'}
        />
        <KpiCard label="Atendimentos no mês" value="89"    sub="via mutirões" subTone="success" />
        <KpiCard label="Total no ano"        value="1.247" sub="23 mutirões realizados" />
      </div>

      {/* PRÓXIMOS */}
      <div>
        <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-medium text-ink md:text-sm">Próximos mutirões</p>
          <button
            onClick={() => setAcao({ tipo: 'cadastrar' })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-surface transition-opacity hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Cadastrar mutirão
          </button>
        </div>

        {proximos.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface shadow-cardpy-10 text-center text-sm text-muted">
            Nenhum mutirão agendado.
          </p>
        ) : (
          proximos.map((m) => (
            <MutiraoCard
              key={m.id}
              m={m}
              onConvocar={() => setAcao({ tipo: 'convocar', id: m.id })}
              onDetalhes={() => setAcao({ tipo: 'detalhes', id: m.id })}
            />
          ))
        )}
      </div>

      {/* RECENTES */}
      <div className="rounded-2xl border border-line bg-surface shadow-cardp-4 md:p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-base font-medium text-ink md:text-sm">Mutirões recentes</p>
          <button className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink">
            Ver histórico
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        <div className="divide-y divide-line">
          {recentes.map((m) => (
            <div key={m.id} className="flex flex-col gap-4 py-4 first:pt-1 lg:flex-row lg:items-center">
              <div className="lg:min-w-[88px]">
                <p className="text-sm font-medium text-ink">{dataDiaMes(m.data)}</p>
                <p className="mt-1 text-xs text-subtle">{diaSemanaCompleto(m.data).toLowerCase()}</p>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink md:text-base">{m.local} · {m.cidade}-{m.estado}</p>
                <p className="mt-1 text-xs text-subtle md:text-sm">{m.tipo} · {m.programa}</p>
              </div>

              <div className="lg:text-right">
                <p className="text-sm text-ink">
                  <span className="font-semibold">{m.atendimentosRealizados}</span> atendimentos
                </p>
                <p className="mt-1 text-xs text-subtle">{m.encaminhamentos} encaminhados pra tratamento</p>
              </div>

              <button
                onClick={() => setAcao({ tipo: 'relatorio', id: m.id })}
                className="w-full rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft lg:w-auto"
              >
                Relatório
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAIS */}
      <CadastrarMutiraoModal
        open={acao?.tipo === 'cadastrar'}
        onClose={fechar}
        onCriado={() => { refresh(); fechar(); }}
        processando={processando}
        setProcessando={setProcessando}
      />
      <DetalhesMutiraoModal
        open={acao?.tipo === 'detalhes'}
        mutiraoId={acao?.tipo === 'detalhes' ? acao.id : null}
        onClose={fechar}
        onConvocar={(id) => setAcao({ tipo: 'convocar', id })}
        onCancelarConvite={() => refresh()}
      />
      <ConvocarVoluntariosModal
        open={acao?.tipo === 'convocar'}
        mutiraoId={acao?.tipo === 'convocar' ? acao.id : null}
        onClose={fechar}
        onConvocado={() => { refresh(); fechar(); }}
        processando={processando}
        setProcessando={setProcessando}
      />
      <RelatorioMutiraoModal
        open={acao?.tipo === 'relatorio'}
        mutiraoId={acao?.tipo === 'relatorio' ? acao.id : null}
        onClose={fechar}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────

function MutiraoCard({
  m, onConvocar, onDetalhes,
}: {
  m: Mutirao;
  onConvocar: () => void;
  onDetalhes: () => void;
}) {
  const cfg = STATUS_CONFIG[m.status as Exclude<StatusMutirao, 'realizado'>];

  const dentistasFaltam = m.dentistasNecessarios - m.dentistasConfirmados;
  const dentistasTone =
    dentistasFaltam === 0 ? 'text-ink' :
    dentistasFaltam / m.dentistasNecessarios > 0.5 ? 'text-danger' : 'text-ink';

  return (
    <div className={`mb-3 rounded-2xl bg-surface p-4 md:p-5 ${cfg.cardBorderClass}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">

        <div className={`flex min-w-[88px] flex-row items-center justify-center gap-3 rounded-2xl px-4 py-3 lg:flex-col lg:gap-1 ${cfg.dateBg}`}>
          <span className={`text-xs ${cfg.dateText === 'text-ink' ? 'text-muted' : cfg.dateText}`}>{diaSemanaUpper(m.data)}</span>
          <span className={`text-3xl font-semibold leading-none ${cfg.dateText}`}>{diaMes(m.data)}</span>
          <span className={`text-xs ${cfg.dateText === 'text-ink' ? 'text-muted' : cfg.dateText}`}>{mesAbrev(m.data)}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-ink md:text-sm">{m.local}</p>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
              <cfg.Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              {cfg.label}
            </span>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-muted">{m.tipo} · {m.cidade}-{m.estado} · {m.horario}</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-subtle">Programa</p>
              <p className="mt-1 text-sm font-medium text-ink">{m.programa}</p>
            </div>
            <div>
              <p className="text-xs text-subtle">Dentistas</p>
              <p className={`mt-1 text-sm font-medium ${dentistasTone}`}>
                {m.dentistasConfirmados} / {m.dentistasNecessarios} confirmados
              </p>
            </div>
            <div>
              <p className="text-xs text-subtle">Pacientes esperados</p>
              <p className="mt-1 text-sm font-medium text-ink">~{m.pacientesEsperados}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:min-w-[140px]">
          {m.status === 'atencao' || m.dentistasConfirmados < m.dentistasNecessarios ? (
            <button
              onClick={onConvocar}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-surface transition-opacity hover:opacity-90"
            >
              <UserPlus className="h-4 w-4" strokeWidth={2} />
              Convocar
            </button>
          ) : null}
          <button
            onClick={onDetalhes}
            className="w-full rounded-xl border border-line px-4 py-3 text-sm text-ink transition-colors hover:bg-surface-soft"
          >
            Ver detalhes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL — CADASTRAR
// ─────────────────────────────────────────────

interface FormCadastrar {
  nome: string;
  programa: 'Dentista do Bem' | 'Apolônias do Bem';
  tipo: 'Triagem em escola' | 'Atendimento em comunidade';
  data: string;
  horaInicio: string;
  horaFim: string;
  local: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  publicoAlvo: string;
  dentistasNecessarios: number;
  pacientesEsperados: number;
  observacoes: string;
}

function CadastrarMutiraoModal({
  open, onClose, onCriado, processando, setProcessando,
}: {
  open: boolean;
  onClose: () => void;
  onCriado: () => void;
  processando: boolean;
  setProcessando: (b: boolean) => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormCadastrar>({
    defaultValues: {
      programa: 'Dentista do Bem', tipo: 'Atendimento em comunidade',
      horaInicio: '08:00', horaFim: '17:00',
      dentistasNecessarios: 5, pacientesEsperados: 50,
      estado: 'SP',
    },
  });
  const [especialidades, setEspecialidades] = useState<string[]>(['Clínico geral']);

  useEffect(() => {
    if (open) {
      reset();
      setEspecialidades(['Clínico geral']);
    }
  }, [open, reset]);

  function toggleEsp(e: string) {
    setEspecialidades((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);
  }

  async function submit(data: FormCadastrar) {
    if (especialidades.length === 0) {
      toast.error('Selecione ao menos uma especialidade');
      return;
    }
    setProcessando(true);
    try {
      const input: NovoMutiraoInput = {
        nome: data.nome,
        data: data.data,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        local: data.local,
        endereco: data.endereco || undefined,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep || undefined,
        tipo: data.tipo,
        programa: data.programa,
        publicoAlvo: data.publicoAlvo || undefined,
        especialidades,
        observacoes: data.observacoes || undefined,
        dentistasNecessarios: Number(data.dentistasNecessarios),
        pacientesEsperados: Number(data.pacientesEsperados),
      };
      
      await criarMutirao(input);

      // Backup no Google Sheets — 11 colunas alinhadas com o cabeçalho da aba Mutiroes
      try {
        const dataStr = new Date().toLocaleDateString('pt-BR');
        await appendSheet('Mutiroes!A:K', [[
          data.nome,                              // A — Nome
          data.observacoes || '',                 // B — Descricao
          String(data.pacientesEsperados),        // C — Meta Atendidos
          '0',                                    // D — Num Atendimentos (inicia em 0)
          String(data.dentistasNecessarios),      // E — Num Dentistas
          data.endereco || '',                    // F — Rua
          '',                                     // G — Bairro
          data.cidade,                            // H — Cidade
          data.estado,                            // I — Estado
          data.estado,                            // J — UF (mesmo valor)
          dataStr,                                // K — Data Cadastro
        ]]);
      } catch (err) {
        console.warn('Não foi possível salvar no Sheets:', err);
      }

      toast.success('Mutirão cadastrado', { description: `${data.nome} agendado para ${formatarDataLonga(data.data)}.` });
      onCriado();
    } catch {
      toast.error('Não foi possível cadastrar o mutirão');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title="Cadastrar mutirão"
      description="Preencha os dados do evento. Voluntários poderão ser convocados depois."
      size="xl"
      footer={
        <>
          <button onClick={onClose} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" form="form-cadastrar-mutirao" disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50">
            <Plus className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </>
      }
    >
      <form id="form-cadastrar-mutirao" onSubmit={handleSubmit(submit)} className="space-y-5">

        {/* IDENTIFICAÇÃO */}
        <Section title="Identificação">
          <Field label="Nome do mutirão *">
            <input
              {...register('nome', { required: true })}
              placeholder="Ex: Triagem E.M. Maria Silva"
              className={inputCls(errors.nome)}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Programa *">
              <select {...register('programa', { required: true })} className={inputCls()}>
                <option value="Dentista do Bem">Dentista do Bem</option>
                <option value="Apolônias do Bem">Apolônias do Bem</option>
              </select>
            </Field>
            <Field label="Tipo *">
              <select {...register('tipo', { required: true })} className={inputCls()}>
                <option value="Atendimento em comunidade">Atendimento em comunidade</option>
                <option value="Triagem em escola">Triagem em escola</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* DATA E HORÁRIO */}
        <Section title="Data e horário">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Data *">
              <input type="date" {...register('data', { required: true })} className={inputCls(errors.data)} />
            </Field>
            <Field label="Início *">
              <input type="time" {...register('horaInicio', { required: true })} className={inputCls()} />
            </Field>
            <Field label="Fim *">
              <input type="time" {...register('horaFim', { required: true })} className={inputCls()} />
            </Field>
          </div>
        </Section>

        {/* LOCAL */}
        <Section title="Local">
          <Field label="Nome do local *">
            <input {...register('local', { required: true })} placeholder="Ex: Centro Social Vila Nova" className={inputCls(errors.local)} />
          </Field>
          <Field label="Endereço">
            <input {...register('endereco')} placeholder="Rua, número, bairro" className={inputCls()} />
          </Field>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-6 sm:col-span-7">
              <Field label="Cidade *">
                <input {...register('cidade', { required: true })} placeholder="São Paulo" className={inputCls(errors.cidade)} />
              </Field>
            </div>
            <div className="col-span-3 sm:col-span-2">
              <Field label="UF *">
                <select {...register('estado', { required: true })} className={inputCls()}>
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>
            <div className="col-span-3">
              <Field label="CEP">
                <input {...register('cep')} placeholder="00000-000" className={inputCls()} />
              </Field>
            </div>
          </div>
        </Section>

        {/* CAPACIDADE */}
        <Section title="Capacidade e público">
          <Field label="Público-alvo">
            <input {...register('publicoAlvo')} placeholder="Ex: Adolescentes 11-17 anos do bairro" className={inputCls()} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Dentistas necessários *">
              <input type="number" min={1} {...register('dentistasNecessarios', { required: true, min: 1 })} className={inputCls()} />
            </Field>
            <Field label="Pacientes esperados *">
              <input type="number" min={1} {...register('pacientesEsperados', { required: true, min: 1 })} className={inputCls()} />
            </Field>
          </div>
          <Field label="Especialidades necessárias *">
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADES_MUTIRAO.map((e) => {
                const ativo = especialidades.includes(e);
                return (
                  <button
                    key={e} type="button"
                    onClick={() => toggleEsp(e)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      ativo
                        ? 'border-brand bg-brand-soft text-brand'
                        : 'border-line text-ink hover:bg-surface-soft'
                    }`}
                  >
                    {ativo && <Check className="w-3 h-3 inline mr-1" strokeWidth={2.5} />}
                    {e}
                  </button>
                );
              })}
            </div>
          </Field>
        </Section>

        {/* OBS */}
        <Section title="Observações">
          <Field label="Observações internas">
            <textarea {...register('observacoes')} rows={3}
              placeholder="Informações adicionais sobre o evento..."
              className={inputCls() + ' resize-none'}
            />
          </Field>
        </Section>
      </form>
    </Modal>
  );
}

// ─── helpers de form ────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function inputCls(err?: unknown) {
  return `w-full bg-surface border ${err ? 'border-danger' : 'border-line'} text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand`;
}

// ─────────────────────────────────────────────
// MODAL — DETALHES
// ─────────────────────────────────────────────

function DetalhesMutiraoModal({
  open, mutiraoId, onClose, onConvocar, onCancelarConvite,
}: {
  open: boolean;
  mutiraoId: string | null;
  onClose: () => void;
  onConvocar: (id: string) => void;
  onCancelarConvite: () => void;
}) {
  const [versaoLocal, setVersaoLocal] = useState(0);
  const m = useMemo(() => (mutiraoId ? obterMutirao(mutiraoId) : undefined), [mutiraoId, versaoLocal, open]);
  if (!m) return null;

  const dias = diasAte(m.data);
  const cfg = m.status !== 'realizado' ? STATUS_CONFIG[m.status] : null;

  async function cancelar(dentistaId: string) {
    await cancelarConvocacao(m!.id, dentistaId);
    toast.success('Convite cancelado');
    setVersaoLocal((v) => v + 1);
    onCancelarConvite();
  }

  async function cancelarPaciente(pacienteCpf: string) {
  await cancelarPresencaPaciente(m!.id, pacienteCpf);
  toast.success('Inscrição do paciente removida');
  setVersaoLocal((v) => v + 1);
  onCancelarConvite();
}

  return (
    <Modal
      open={open} onClose={onClose}
      title={m.nome || m.local}
      description={`${m.tipo} · ${m.programa}`}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors">
            Fechar
          </button>
          {m.status !== 'realizado' && m.dentistasConfirmados < m.dentistasNecessarios && (
            <button
              onClick={() => onConvocar(m.id)}
              className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" strokeWidth={2} />
              Convocar voluntários
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Status + countdown */}
        {cfg && (
          <div className={`flex items-center gap-3 p-3 rounded-xl ${cfg.bg}`}>
            <cfg.Icon className={`w-5 h-5 ${cfg.text}`} strokeWidth={2.5} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</p>
              <p className="text-xs text-muted mt-0.5">
                {dias > 0 ? `Daqui a ${dias} ${dias === 1 ? 'dia' : 'dias'}` : dias === 0 ? 'Hoje' : 'Já passou'}
              </p>
            </div>
          </div>
        )}

        {/* Grid de dados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataBlock icon={CalIcon} label="Data">
            {formatarDataLonga(m.data)}<br />
            <span className="text-xs text-muted">{m.horario}</span>
          </DataBlock>
          <DataBlock icon={MapPin} label="Local">
            {m.local}<br />
            <span className="text-xs text-muted">
              {m.endereco ? `${m.endereco} · ` : ''}{m.cidade}-{m.estado}
              {m.cep && ` · ${m.cep}`}
            </span>
          </DataBlock>
          <DataBlock icon={Users} label="Capacidade">
            {m.dentistasConfirmados}/{m.dentistasNecessarios} dentistas<br />
            <span className="text-xs text-muted">~{m.pacientesEsperados} pacientes esperados</span>
          </DataBlock>
          <DataBlock icon={FileText} label="Especialidades">
            <div className="flex flex-wrap gap-1 mt-1">
              {m.especialidades.map((e) => (
                <span key={e} className="text-2xs bg-surface-soft text-muted px-2 py-0.5 rounded-md">{e}</span>
              ))}
            </div>
          </DataBlock>
        </div>

        {m.publicoAlvo && (
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Público-alvo</p>
            <p className="text-sm text-ink">{m.publicoAlvo}</p>
          </div>
        )}

        {m.observacoes && (
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Observações</p>
            <p className="text-sm text-ink leading-relaxed">{m.observacoes}</p>
          </div>
        )}

        {/* Voluntários convocados */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
            Voluntários convocados ({m.voluntariosConvocados.length})
          </p>
          {m.voluntariosConvocados.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center border border-dashed border-line rounded-xl">
              Nenhum voluntário convocado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {m.voluntariosConvocados.map((v) => (
                <div key={v.dentistaId} className="flex items-center gap-3 p-3 rounded-xl border border-line">
                  <Avatar initials={v.iniciais} size="sm" tone="info" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{v.nome}</p>
                    <p className="text-xs text-muted">{v.especialidade} · {v.cidade}-{v.estado}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-medium ${
                    v.status === 'confirmado' ? 'bg-success-soft text-success' :
                    v.status === 'pendente'   ? 'bg-warning-soft text-warning' :
                                                'bg-danger-soft text-danger'
                  }`}>
                    {v.status}
                  </span>
                  {m.status !== 'realizado' && (
                    <button
                      onClick={() => cancelar(v.dentistaId)}
                      className="p-1.5 rounded-lg text-muted hover:bg-danger-soft hover:text-danger transition-colors"
                      title="Cancelar convite"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Pacientes confirmados */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
              Pacientes inscritos ({(m.pacientesConfirmados ?? []).length}
              {m.pacientesEsperados > 0 && ` de ~${m.pacientesEsperados} esperados`})
            </p>
            {(m.pacientesConfirmados ?? []).length === 0 ? (
              <p className="text-sm text-muted py-4 text-center border border-dashed border-line rounded-xl">
                Nenhum paciente confirmou presença ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {(m.pacientesConfirmados ?? []).map((p) => (
                  <div key={p.pacienteCpf} className="flex items-center gap-3 p-3 rounded-xl border border-line">
                    <Avatar initials={p.iniciais} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{p.nome}</p>
                      <p className="text-xs text-muted">
                        {p.cidade} · confirmado em {new Date(p.confirmadoEm + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-medium bg-success-soft text-success">
                      confirmado
                    </span>
                    {m.status !== 'realizado' && (
                      <button
                        onClick={() => cancelarPaciente(p.pacienteCpf)}
                        className="p-1.5 rounded-lg text-muted hover:bg-danger-soft hover:text-danger transition-colors"
                        title="Remover inscrição"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DataBlock({
  icon: Icon, label, children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-muted" strokeWidth={2} />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      </div>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL — CONVOCAR
// ─────────────────────────────────────────────

function ConvocarVoluntariosModal({
  open, mutiraoId, onClose, onConvocado, processando, setProcessando,
}: {
  open: boolean;
  mutiraoId: string | null;
  onClose: () => void;
  onConvocado: () => void;
  processando: boolean;
  setProcessando: (b: boolean) => void;
}) {
  const m = useMemo(() => (mutiraoId ? obterMutirao(mutiraoId) : undefined), [mutiraoId, open]);
  const [filtroEsp, setFiltroEsp] = useState('Todas');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSelecionados(new Set());
      setFiltroEsp('Todas');
    }
  }, [open]);

  const disponiveis = useMemo(
    () => (m ? listarVoluntariosDisponiveis(m, filtroEsp) : []),
    [m, filtroEsp, open],
  );

  if (!m) return null;

  const restam = m.dentistasNecessarios - m.dentistasConfirmados;

  function toggle(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function enviarConvites() {
    if (selecionados.size === 0) {
      toast.error('Selecione ao menos um voluntário');
      return;
    }
    setProcessando(true);
    try {
      await convocarVoluntarios(m!.id, Array.from(selecionados));
      toast.success(`${selecionados.size} ${selecionados.size === 1 ? 'voluntário convocado' : 'voluntários convocados'}`, {
        description: 'Eles receberão notificação e poderão confirmar presença.',
      });
      onConvocado();
    } catch {
      toast.error('Não foi possível enviar convites');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title="Convocar voluntários"
      description={`${m.nome || m.local} · ${formatarDataLonga(m.data)}`}
      size="xl"
      footer={
        <>
          <button onClick={onClose} disabled={processando}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={enviarConvites} disabled={processando || selecionados.size === 0}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50">
            <UserPlus className="w-4 h-4" strokeWidth={2} />
            {processando ? 'Enviando...' :
             `Enviar ${selecionados.size > 0 ? `(${selecionados.size})` : 'convites'}`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Status atual */}
        <div className="bg-surface-soft rounded-xl p-3 flex items-center gap-3">
          <Users className="w-5 h-5 text-muted" strokeWidth={2} />
          <div className="flex-1 min-w-0 text-sm">
            <p className="text-ink">
              <span className="font-semibold">{m.dentistasConfirmados}</span> de{' '}
              <span className="font-semibold">{m.dentistasNecessarios}</span> dentistas confirmados
            </p>
            {restam > 0 && (
              <p className="text-xs text-muted mt-0.5">Faltam {restam} para fechar o quadro</p>
            )}
          </div>
        </div>

        {/* Filtro de especialidade */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
            Filtrar por especialidade
          </label>
          <select value={filtroEsp} onChange={(e) => setFiltroEsp(e.target.value)} className={inputCls()}>
            <option value="Todas">Todas as especialidades</option>
            {listarEspecialidadesParaFiltro().map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Lista */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
            Voluntários disponíveis ({disponiveis.length})
          </p>
          {disponiveis.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center border border-dashed border-line rounded-xl">
              Nenhum voluntário disponível com esses filtros.
            </p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {disponiveis.map(({ dentista: d, slotsLivres, ehLocal }) => {
                const sel = selecionados.has(d.id);
                return (
                  <label key={d.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      sel ? 'border-brand bg-brand-soft' : 'border-line hover:bg-surface-soft'
                    }`}
                  >
                    <input
                      type="checkbox" checked={sel} onChange={() => toggle(d.id)}
                      className="w-4 h-4 rounded border-line text-brand focus:ring-brand focus:ring-1"
                    />
                    <Avatar initials={d.iniciais} size="sm" tone="info" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-ink truncate">{d.nome}</p>
                        {ehLocal && (
                          <span className="text-2xs px-1.5 py-0.5 rounded bg-success-soft text-success font-medium">
                            local
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted">{d.especialidade} · {d.cidade}-{d.estado}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-ink font-medium">{slotsLivres} slots</p>
                      <p className="text-2xs text-muted">livres</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// MODAL — RELATÓRIO
// ─────────────────────────────────────────────

function RelatorioMutiraoModal({
  open, mutiraoId, onClose,
}: {
  open: boolean;
  mutiraoId: string | null;
  onClose: () => void;
}) {
  const m = useMemo(() => (mutiraoId ? obterMutirao(mutiraoId) : undefined), [mutiraoId, open]);
  if (!m) return null;

  // Estatísticas (do mock ou calculadas)
  const stats = m.estatisticas ?? {
    pacientesAtendidos: m.atendimentosRealizados ?? 0,
    vinculosCriados: m.encaminhamentos ?? 0,
    taxaComparecimento: m.pacientesEsperados > 0
      ? Math.round(((m.atendimentosRealizados ?? 0) / m.pacientesEsperados) * 100)
      : 0,
    duracaoEfetivaHoras: 8,
    porEspecialidade: m.especialidades.map((e) => ({
      especialidade: e,
      quantidade: Math.round((m.atendimentosRealizados ?? 0) / m.especialidades.length),
    })),
  };

  async function exportarPDF() {
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Mutirão', 20, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text('Turma do Bem', 20, y);
    y += 12;

    // Linha divisória
    doc.setDrawColor(220);
    doc.line(20, y, 190, y);
    y += 10;

    // Dados do evento
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(m!.nome || m!.local, 20, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${m!.tipo} · ${m!.programa}`, 20, y); y += 6;
    doc.text(`Data: ${formatarDataLonga(m!.data)} · ${m!.horario}`, 20, y); y += 6;
    doc.text(`Local: ${m!.local}, ${m!.cidade}-${m!.estado}`, 20, y); y += 10;

    // Estatísticas
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resultados', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pacientes atendidos: ${stats.pacientesAtendidos}`, 20, y); y += 6;
    doc.text(`Pacientes inscritos pelo portal: ${(m!.pacientesConfirmados ?? []).length}`, 20, y); y += 6;
    doc.text(`Encaminhados para tratamento: ${stats.vinculosCriados}`, 20, y); y += 6;
    doc.text(`Taxa de comparecimento: ${stats.taxaComparecimento}%`, 20, y); y += 6;
    doc.text(`Voluntários presentes: ${m!.dentistasConfirmados}`, 20, y); y += 6;
    doc.text(`Duração efetiva: ${stats.duracaoEfetivaHoras}h`, 20, y); y += 10;

    // Breakdown
    if (stats.porEspecialidade.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Atendimentos por especialidade', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      stats.porEspecialidade.forEach((s) => {
        doc.text(`• ${s.especialidade}: ${s.quantidade}`, 25, y);
        y += 6;
      });
    }

    // Footer
    y = 280;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} · Turma do Bem`, 20, y);

    const slug = (m!.nome || m!.local).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    doc.save(`relatorio-${slug}-${m!.data}.pdf`);
    toast.success('PDF gerado');
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title="Relatório do mutirão"
      description={`${m.nome || m.local} · ${formatarDataLonga(m.data)}`}
      size="lg"
      footer={
        <>
          <button onClick={onClose}
            className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors">
            Fechar
          </button>
          <button onClick={exportarPDF}
            className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center gap-2">
            <Download className="w-4 h-4" strokeWidth={2} />
            Exportar PDF
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Cards de stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Inscritos" value={(m.pacientesConfirmados ?? []).length} sub="pelo portal" />
          <StatCard label="Pacientes" value={stats.pacientesAtendidos} sub="atendidos" />
          <StatCard label="Encaminhados" value={stats.vinculosCriados} sub="para tratamento" tone="success" />
          <StatCard label="Comparecimento" value={`${stats.taxaComparecimento}%`} sub={`de ~${m.pacientesEsperados} esperados`} />
          <StatCard label="Voluntários" value={m.dentistasConfirmados} sub="presentes" />
        </div>

        {/* Dados do evento */}
        <div className="rounded-xl border border-line p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Sobre o evento</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted">Programa:</span>{' '}
              <span className="text-ink">{m.programa}</span>
            </div>
            <div>
              <span className="text-muted">Tipo:</span>{' '}
              <span className="text-ink">{m.tipo}</span>
            </div>
            <div>
              <span className="text-muted">Local:</span>{' '}
              <span className="text-ink">{m.local}, {m.cidade}-{m.estado}</span>
            </div>
            <div>
              <span className="text-muted">Duração:</span>{' '}
              <span className="text-ink">{stats.duracaoEfetivaHoras}h ({m.horario})</span>
            </div>
          </div>
        </div>

        {/* Breakdown por especialidade */}
        {stats.porEspecialidade.length > 0 && (
          <div className="rounded-xl border border-line p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Atendimentos por especialidade</p>
            <div className="space-y-2">
              {stats.porEspecialidade.map((s) => {
                const pct = (s.quantidade / stats.pacientesAtendidos) * 100;
                return (
                  <div key={s.especialidade}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ink">{s.especialidade}</span>
                      <span className="text-muted">{s.quantidade}</span>
                    </div>
                    <div className="h-1.5 bg-surface-soft rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function StatCard({ label, value, sub, tone = 'default' }: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'default' | 'success';
}) {
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold leading-none ${tone === 'success' ? 'text-success' : 'text-ink'}`}>
        {value}
      </p>
      {sub && <p className="text-2xs text-subtle mt-1.5">{sub}</p>}
    </div>
  );
}