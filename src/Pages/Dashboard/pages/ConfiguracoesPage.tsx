import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Users, Plug, Building2, SlidersHorizontal,
  Plus, Sun, Moon, X, Edit2, Trash2, Save, AlertCircle, Power, Link2,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { Avatar } from '../components/Avatar';
import { Modal } from '../components/Modal';

import {
  listarEquipe, listarIntegracoes, obterOrganizacao,
  adicionarMembro, atualizarMembro, removerMembro,
  atualizarStatusIntegracao, salvarOrganizacao,
  obterPreferenciasNotificacao, salvarPreferenciasNotificacao,
  carregarEquipeReal,
  type PreferenciasNotificacao,
} from '../services/configuracoes';
import { obterProgressoMeta, salvarMeta, EVENTO_ATENDIMENTOS } from '../services/meta';

import type {
  PapelUsuario, StatusIntegracao,
  MembroEquipe, Integracao, OrganizacaoInfo,
} from '../data/configuracoes';

// ─────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────

type Aba = 'equipe' | 'integracoes' | 'organizacao' | 'preferencias';

const ABAS: { id: Aba; label: string; Icon: typeof Users }[] = [
  { id: 'equipe',       label: 'Equipe',       Icon: Users },
  { id: 'integracoes',  label: 'Integrações',  Icon: Plug },
  { id: 'organizacao',  label: 'Organização',  Icon: Building2 },
  { id: 'preferencias', label: 'Preferências', Icon: SlidersHorizontal },
];

const PAPEL_STYLE: Record<PapelUsuario, string> = {
  Administrador: 'bg-info-soft text-info',
  Coordenador:   'bg-success-soft text-success',
  Visualizador:  'bg-surface-soft text-muted',
};

const STATUS_STYLE: Record<StatusIntegracao, { dot: string; text: string; label: string }> = {
  conectado:    { dot: 'bg-success', text: 'text-success', label: 'Conectado' },
  parcial:      { dot: 'bg-warning', text: 'text-warning', label: 'Parcial' },
  desconectado: { dot: 'bg-subtle',  text: 'text-muted',   label: 'Desconectado' },
};

const REGIOES = ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte', 'Nacional'];
const PAPEIS: PapelUsuario[] = ['Administrador', 'Coordenador', 'Visualizador'];

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

function abaValida(v: string | null): v is Aba {
  return !!v && ABAS.some((a) => a.id === v);
}

export default function ConfiguracoesPage() {
  const [searchParams] = useSearchParams();
  const abaUrl = searchParams.get('aba');

  const [aba, setAba] = useState<Aba>(abaValida(abaUrl) ? abaUrl : 'equipe');
  const [versao, setVersao] = useState(0);
  const refresh = () => setVersao((v) => v + 1);

  const equipe = useMemo(() => listarEquipe(), [versao]);
  const integracoes = useMemo(() => listarIntegracoes(), [versao]);
  const org = useMemo(() => obterOrganizacao(), [versao]);

  // Abre a aba vinda da URL (ex.: lápis da Meta → ?aba=preferencias)
  useEffect(() => {
    if (abaValida(abaUrl)) setAba(abaUrl);
  }, [abaUrl]);

  // Equipe vem só do backend: carrega ao abrir a aba Equipe
  const [cargaEquipe, setCargaEquipe] = useState<'carregando' | 'ok' | 'erro'>('carregando');
  useEffect(() => {
    if (aba !== 'equipe') return;
    let vivo = true;
    carregarEquipeReal().then((r) => {
      if (!vivo) return;
      setCargaEquipe(r.fonte === 'erro' ? 'erro' : 'ok');
      refresh();
    });
    return () => { vivo = false; };
  }, [aba]);

  return (
    <div className="flex w-full max-w-full flex-col gap-5">
      {/* TABS */}
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-1 border-b border-line">
          {ABAS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${
                aba === id
                  ? 'border-brand font-medium text-brand'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {aba === 'equipe' && <AbaEquipe equipe={equipe} carga={cargaEquipe} onChange={refresh} />}
      {aba === 'integracoes' && <AbaIntegracoes integracoes={integracoes} onChange={refresh} />}
      {aba === 'organizacao' && <AbaOrganizacao org={org} onChange={refresh} />}
      {aba === 'preferencias' && <AbaPreferencias />}
    </div>
  );
}

// ─────────────────────────────────────────────
// ABA EQUIPE
// ─────────────────────────────────────────────

interface FormMembro {
  nome: string;
  email: string;
  rgCpf: string;
  senha: string;
  papel: PapelUsuario;
  regiao: string;
}

function mascaraCpf(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

function mensagem(err: unknown, padrao: string): string {
  return err instanceof Error && err.message ? err.message : padrao;
}

function AbaEquipe({
  equipe, carga, onChange,
}: { equipe: MembroEquipe[]; carga: 'carregando' | 'ok' | 'erro'; onChange: () => void }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState<MembroEquipe | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormMembro>({
    defaultValues: { papel: 'Coordenador', regiao: 'Sudeste' },
  });

  async function onSubmit(data: FormMembro) {
    setEnviando(true);
    try {
      await adicionarMembro(data);
      toast.success('Membro adicionado', { description: `${data.nome} já pode entrar no painel com o e-mail e a senha inicial.` });
      reset({ nome: '', email: '', rgCpf: '', senha: '', papel: 'Coordenador', regiao: 'Sudeste' });
      setMostrarForm(false);
      onChange();
    } catch (err) {
      toast.error('Não foi possível adicionar o membro', { description: mensagem(err, 'Tente novamente.') });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-card p-4 md:p-5">
      {/* HEADER */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-ink md:text-sm">Equipe e permissões</h2>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-surface transition-opacity hover:opacity-90 sm:w-auto"
        >
          {mostrarForm ? <X className="h-4 w-4" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={2} />}
          {mostrarForm ? 'Cancelar' : 'Adicionar membro'}
        </button>
      </div>

      {/* FORM */}
      {mostrarForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-5 rounded-2xl bg-surface-soft p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs text-muted">Nome completo *</label>
              <input
                {...register('nome', { required: true, minLength: 3 })}
                placeholder="Ex.: João Mendes"
                className="w-full rounded-xl border border-line bg-surface shadow-card px-3 py-3 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {errors.nome && <p className="mt-1 text-xs text-danger">Nome obrigatório (mín. 3 caracteres)</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">E-mail *</label>
              <input
                {...register('email', { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })}
                placeholder="joao@turmadobem.org.br"
                className="w-full rounded-xl border border-line bg-surface shadow-card px-3 py-3 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {errors.email && <p className="mt-1 text-xs text-danger">E-mail inválido</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">CPF *</label>
              <input
                {...register('rgCpf', {
                  required: true,
                  validate: (v) => v.replace(/\D/g, '').length === 11,
                  onChange: (e) => { e.target.value = mascaraCpf(e.target.value); },
                })}
                inputMode="numeric"
                placeholder="000.000.000-00"
                className="w-full rounded-xl border border-line bg-surface shadow-card px-3 py-3 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {errors.rgCpf && <p className="mt-1 text-xs text-danger">CPF inválido</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">Senha inicial *</label>
              <input
                type="password"
                autoComplete="new-password"
                {...register('senha', { required: true, minLength: 6 })}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-line bg-surface shadow-card px-3 py-3 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {errors.senha && <p className="mt-1 text-xs text-danger">Mínimo 6 caracteres</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">Papel</label>
              <select
                {...register('papel')}
                className="w-full cursor-pointer rounded-xl border border-line bg-surface shadow-card px-3 py-3 text-sm text-ink"
              >
                {PAPEIS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">Região</label>
              <select
                {...register('regiao')}
                className="w-full cursor-pointer rounded-xl border border-line bg-surface shadow-card px-3 py-3 text-sm text-ink"
              >
                {REGIOES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-xl bg-ink px-5 py-3 text-sm text-surface transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
            >
              {enviando ? 'Salvando...' : 'Adicionar à equipe'}
            </button>
          </div>
        </form>
      )}

      {/* LISTA — só quem está na tabela funcionario do backend */}
      {equipe.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">
          {carga === 'carregando' && 'Carregando a equipe do servidor...'}
          {carga === 'erro' && 'Não foi possível carregar a equipe do servidor. Tente recarregar a página.'}
          {carga === 'ok' && 'Nenhum membro cadastrado.'}
        </p>
      )}
      <div className="divide-y divide-line">
        {equipe.map((m) => (
          <div key={m.id} className="flex flex-col gap-4 py-4 first:pt-1 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Avatar initials={m.iniciais} size="sm" tone={m.ativo ? 'info' : 'default'} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink md:text-base">
                  {m.nome}
                  {!m.ativo && <span className="ml-2 text-xs text-subtle">(inativo)</span>}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">
                  {m.email} · {m.regiao}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${PAPEL_STYLE[m.papel]}`}>
                {m.papel}
              </span>
              <button
                onClick={() => setEditando(m)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto"
              >
                <Edit2 className="h-3.5 w-3.5" strokeWidth={2} />
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL EDITAR */}
      <EditarMembroModal
        open={editando !== null}
        membro={editando}
        onClose={() => setEditando(null)}
        onChange={onChange}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL — EDITAR MEMBRO
// ─────────────────────────────────────────────

function EditarMembroModal({
  open, membro, onClose, onChange,
}: {
  open: boolean;
  membro: MembroEquipe | null;
  onClose: () => void;
  onChange: () => void;
}) {
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const [processando, setProcessando] = useState(false);

  const { register, handleSubmit, reset, watch, setValue } = useForm<{
    nome: string; email: string; papel: PapelUsuario; regiao: string; ativo: boolean;
  }>();

  useMemo(() => {
    if (membro) {
      reset({
        nome: membro.nome,
        email: membro.email,
        papel: membro.papel,
        regiao: membro.regiao,
        ativo: membro.ativo,
      });
      setConfirmarRemocao(false);
    }
  }, [membro, reset]);

  const ativo = watch('ativo');

  async function onSalvar(data: { nome: string; email: string; papel: PapelUsuario; regiao: string; ativo: boolean }) {
    if (!membro) return;
    setProcessando(true);
    try {
      await atualizarMembro(membro.id, data);
      toast.success('Membro atualizado');
      onChange();
      onClose();
    } catch (err) {
      toast.error('Não foi possível atualizar', { description: mensagem(err, 'Tente novamente.') });
    } finally {
      setProcessando(false);
    }
  }

  async function handleRemover() {
    if (!membro) return;
    setProcessando(true);
    try {
      await removerMembro(membro.id);
      toast.success('Membro removido da equipe');
      onChange();
      onClose();
    } catch (err) {
      toast.error('Não foi possível remover', { description: mensagem(err, 'Tente novamente.') });
    } finally {
      setProcessando(false);
    }
  }

  if (!membro) return null;

  return (
    <Modal
      open={open}
      onClose={() => !processando && onClose()}
      title="Editar membro"
      description={membro.nome}
      size="md"
      footer={
        confirmarRemocao ? (
          <>
            <button
              onClick={() => setConfirmarRemocao(false)}
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleRemover}
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl bg-danger text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2} />
              {processando ? 'Removendo...' : 'Confirmar remoção'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setConfirmarRemocao(true)}
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl border border-danger/30 text-danger hover:bg-danger-soft transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2} />
              Remover
            </button>
            <button
              onClick={onClose}
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-editar-membro"
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" strokeWidth={2} />
              {processando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </>
        )
      }
    >
      {confirmarRemocao ? (
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-sm text-ink leading-relaxed">
            Tem certeza que deseja remover <span className="font-medium">{membro.nome}</span> da equipe?
            Essa ação não pode ser desfeita por aqui.
          </p>
        </div>
      ) : (
        <form id="form-editar-membro" onSubmit={handleSubmit(onSalvar)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs text-muted">Nome completo</label>
              <input
                {...register('nome', { required: true })}
                className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">E-mail</label>
              <input
                {...register('email', { required: true })}
                className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">Papel</label>
              <select
                {...register('papel')}
                className="w-full cursor-pointer rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink"
              >
                {PAPEIS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">Região</label>
              <select
                {...register('regiao')}
                className="w-full cursor-pointer rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink"
              >
                {REGIOES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Toggle ativo/inativo */}
          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <div>
              <p className="text-sm text-ink">Status do membro</p>
              <p className="text-xs text-muted mt-0.5">
                {ativo ? 'Tem acesso ao painel' : 'Sem acesso (inativo)'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setValue('ativo', !ativo)}
              className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
                ativo ? 'bg-brand' : 'bg-line-strong'
              }`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface transition-all ${
                ativo ? 'left-[18px]' : 'left-0.5'
              }`} />
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────
// ABA INTEGRAÇÕES
// ─────────────────────────────────────────────

function AbaIntegracoes({
  integracoes, onChange,
}: { integracoes: Integracao[]; onChange: () => void }) {
  const [aberta, setAberta] = useState<Integracao | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {integracoes.map((i) => {
          const st = STATUS_STYLE[i.status];
          return (
            <div key={i.id} className="rounded-2xl border border-line bg-surface shadow-card p-4 md:p-5">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-sm font-medium text-ink md:text-base">{i.nome}</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${st.text}`}>
                  <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted md:text-sm">{i.descricao}</p>
              <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-subtle">{i.detalhe}</p>
              <button
                onClick={() => setAberta(i)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto"
              >
                {i.status === 'desconectado' ? (
                  <><Link2 className="h-3.5 w-3.5" strokeWidth={2} />Conectar</>
                ) : (
                  <><Edit2 className="h-3.5 w-3.5" strokeWidth={2} />Configurar</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <ConfigurarIntegracaoModal
        open={aberta !== null}
        integracao={aberta}
        onClose={() => setAberta(null)}
        onChange={onChange}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// MODAL — CONFIGURAR INTEGRAÇÃO
// ─────────────────────────────────────────────

function ConfigurarIntegracaoModal({
  open, integracao, onClose, onChange,
}: {
  open: boolean;
  integracao: Integracao | null;
  onClose: () => void;
  onChange: () => void;
}) {
  const [detalhe, setDetalhe] = useState('');
  const [processando, setProcessando] = useState(false);

  useMemo(() => {
    if (integracao) setDetalhe(integracao.detalhe || '');
  }, [integracao]);

  if (!integracao) return null;

  const st = STATUS_STYLE[integracao.status];
  const conectado = integracao.status !== 'desconectado';

  async function conectar() {
    if (!integracao) return;
    setProcessando(true);
    try {
      await atualizarStatusIntegracao(integracao.id, 'conectado', detalhe || 'Conectado agora');
      toast.success(`${integracao.nome} conectada`);
      onChange();
      onClose();
    } catch {
      toast.error('Não foi possível conectar');
    } finally {
      setProcessando(false);
    }
  }

  async function salvar() {
    if (!integracao) return;
    setProcessando(true);
    try {
      await atualizarStatusIntegracao(integracao.id, integracao.status, detalhe);
      toast.success('Configuração salva');
      onChange();
      onClose();
    } catch {
      toast.error('Não foi possível salvar');
    } finally {
      setProcessando(false);
    }
  }

  async function desconectar() {
    if (!integracao) return;
    setProcessando(true);
    try {
      await atualizarStatusIntegracao(integracao.id, 'desconectado', 'Desconectado pelo administrador');
      toast.success(`${integracao.nome} desconectada`);
      onChange();
      onClose();
    } catch {
      toast.error('Não foi possível desconectar');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !processando && onClose()}
      title={conectado ? 'Configurar integração' : 'Conectar integração'}
      description={integracao.nome}
      size="md"
      footer={
        conectado ? (
          <>
            <button
              onClick={desconectar}
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl border border-danger/30 text-danger hover:bg-danger-soft transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Power className="w-4 h-4" strokeWidth={2} />
              Desconectar
            </button>
            <button
              onClick={onClose}
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
            >
              Fechar
            </button>
            <button
              onClick={salvar}
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" strokeWidth={2} />
              {processando ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onClose}
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={conectar}
              disabled={processando}
              className="px-4 py-2.5 text-sm rounded-xl bg-ink text-surface hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Link2 className="w-4 h-4" strokeWidth={2} />
              {processando ? 'Conectando...' : 'Conectar agora'}
            </button>
          </>
        )
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-line p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Status atual</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${st.text}`}>
              <span className={`h-2 w-2 rounded-full ${st.dot}`} />
              {st.label}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted leading-relaxed">{integracao.descricao}</p>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
            Configuração / observação
          </label>
          <textarea
            value={detalhe}
            onChange={(e) => setDetalhe(e.target.value)}
            rows={3}
            placeholder={conectado ? 'Ex.: chave de API, webhook, endpoint...' : 'Detalhes opcionais da conexão...'}
            className="w-full bg-surface border border-line text-ink placeholder:text-subtle rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        {!conectado && (
          <div className="rounded-xl bg-info-soft p-3 text-xs text-info">
            <AlertCircle className="inline h-3.5 w-3.5 mr-1" strokeWidth={2} />
            Demo: a conexão é simulada localmente. Em produção, isso dispararia o OAuth ou cadastro de credencial real.
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// ABA ORGANIZAÇÃO
// ─────────────────────────────────────────────

function AbaOrganizacao({
  org, onChange,
}: { org: OrganizacaoInfo; onChange: () => void }) {
  const [salvando, setSalvando] = useState(false);
  const { register, handleSubmit, formState: { isDirty } } = useForm<OrganizacaoInfo>({
    defaultValues: org,
  });

  async function onSubmit(data: OrganizacaoInfo) {
    setSalvando(true);
    try {
      await salvarOrganizacao(data);
      toast.success('Dados da organização atualizados');
      onChange();
    } catch {
      toast.error('Não foi possível salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-line bg-surface shadow-card p-4 md:max-w-[700px] md:p-5"
    >
      <h2 className="mb-5 text-base font-semibold text-ink md:text-sm">Dados da organização</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CampoInput label="Nome" {...register('nome')} />
        <CampoInput label="CNPJ" {...register('cnpj')} />
        <CampoInput label="Site" {...register('site')} />
        <CampoInput label="E-mail" type="email" {...register('email')} />
        <CampoInput label="Telefone" {...register('telefone')} />
        <div className="sm:col-span-2">
          <CampoInput label="Endereço" {...register('endereco')} />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
        <p className="text-xs text-muted">
          {isDirty ? 'Há alterações não salvas.' : 'Sem alterações pendentes.'}
        </p>
        <button
          type="submit"
          disabled={salvando || !isDirty}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm text-surface transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" strokeWidth={2} />
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// ABA PREFERÊNCIAS
// ─────────────────────────────────────────────

function AbaPreferencias() {
  const [tema, setTema] = useState<'claro' | 'escuro'>(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark')
        ? 'escuro'
        : 'claro',
  );

  const [prefs, setPrefs] = useState<PreferenciasNotificacao>(() => obterPreferenciasNotificacao());

  function aplicarTema(novo: 'claro' | 'escuro') {
    setTema(novo);
    document.documentElement.classList.toggle('dark', novo === 'escuro');
    try { localStorage.setItem('tdb_tema', novo); } catch { /* */ }
  }

  function alterarPref(key: keyof PreferenciasNotificacao, value: boolean) {
    const novo = { ...prefs, [key]: value };
    setPrefs(novo);
    salvarPreferenciasNotificacao(novo);
    toast.success('Preferência atualizada', { duration: 1500 });
  }

  return (
    <div className="flex max-w-[700px] flex-col gap-5">
      <CardMeta />
      {/* APARÊNCIA */}
      <div className="rounded-2xl border border-line bg-surface shadow-card p-4 md:p-5">
        <h2 className="mb-1 text-base font-semibold text-ink md:text-sm">Aparência</h2>
        <p className="mb-5 text-xs leading-relaxed text-muted md:text-sm">Escolha o tema do painel</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => aplicarTema('claro')}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
              tema === 'claro'
                ? 'border-2 border-info bg-info-soft font-medium text-info'
                : 'border-line text-muted hover:text-ink'
            }`}
          >
            <Sun className="h-4 w-4" strokeWidth={2} />
            Claro
          </button>
          <button
            onClick={() => aplicarTema('escuro')}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
              tema === 'escuro'
                ? 'border-2 border-info bg-info-soft font-medium text-info'
                : 'border-line text-muted hover:text-ink'
            }`}
          >
            <Moon className="h-4 w-4" strokeWidth={2} />
            Escuro
          </button>
        </div>
      </div>

      {/* NOTIFICAÇÕES */}
      <div className="rounded-2xl border border-line bg-surface shadow-card p-4 md:p-5">
        <h2 className="mb-5 text-base font-semibold text-ink md:text-sm">Notificações</h2>
        <div className="space-y-4">
          <LinhaToggle
            label="Alertas de solicitações Alta sem resposta"
            checked={prefs.alertasAlta}
            onChange={(v) => alterarPref('alertasAlta', v)}
          />
          <LinhaToggle
            label="Resumo diário por e-mail"
            checked={prefs.resumoDiario}
            onChange={(v) => alterarPref('resumoDiario', v)}
          />
          <LinhaToggle
            label="Lembrete de renovação de parcerias"
            checked={prefs.lembreteRenovacao}
            onChange={(v) => alterarPref('lembreteRenovacao', v)}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CARD — META DE ATENDIMENTOS
// ─────────────────────────────────────────────

function CardMeta() {
  const [progresso, setProgresso] = useState(obterProgressoMeta);
  const [valor, setValor] = useState(() => String(obterProgressoMeta().meta));

  useEffect(() => {
    const atualizar = () => setProgresso(obterProgressoMeta());
    window.addEventListener(EVENTO_ATENDIMENTOS, atualizar);
    return () => window.removeEventListener(EVENTO_ATENDIMENTOS, atualizar);
  }, []);

  const numero = Number(valor);
  const valido = Number.isInteger(numero) && numero >= 1;
  const mudou = valido && numero !== progresso.meta;
  const previa = valido
    ? Math.min(100, Math.round((progresso.realizados / numero) * 100))
    : progresso.pct;

  function salvar() {
    if (!mudou) return;
    salvarMeta(numero);
    setProgresso(obterProgressoMeta());
    toast.success('Meta atualizada', {
      description: `${numero.toLocaleString('pt-BR')} atendimentos em ${progresso.ano}.`,
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-card p-4 md:p-5">
      <h2 className="mb-1 text-base font-semibold text-ink md:text-sm">Meta de atendimentos</h2>
      <p className="mb-5 text-xs leading-relaxed text-muted md:text-sm">
        Total de atendimentos realizados que a ONG quer atingir em {progresso.ano}. A barra do menu lateral usa este valor.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-2 block text-xs text-muted">Meta anual</label>
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') salvar(); }}
            className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <button
          onClick={salvar}
          disabled={!mudou}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" strokeWidth={2} />
          Salvar meta
        </button>
      </div>
      {!valido && (
        <p className="mt-2 text-xs text-danger">Informe um número inteiro maior que zero.</p>
      )}

      {/* Prévia */}
      <div className="mt-5 rounded-xl bg-surface-soft p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted">
            {progresso.realizados.toLocaleString('pt-BR')} realizados em {progresso.ano}
          </span>
          <span className="font-semibold text-ink">{previa}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-blue-400 transition-all duration-500"
            style={{ width: `${previa}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPERS (campos compartilhados)
// ─────────────────────────────────────────────

const CampoInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(
  ({ label, ...props }, ref) => (
    <div>
      <label className="mb-2 block text-xs text-muted">{label}</label>
      <input
        ref={ref}
        type={props.type ?? 'text'}
        {...props}
        className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </div>
  ),
);
CampoInput.displayName = 'CampoInput';

function LinhaToggle({
  label, checked, onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm leading-relaxed text-ink">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-brand' : 'bg-line-strong'
        }`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface transition-all ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`} />
      </button>
    </div>
  );
}