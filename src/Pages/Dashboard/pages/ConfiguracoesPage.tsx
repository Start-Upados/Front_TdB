import { useState } from 'react';

import {
  Users,
  Plug,
  Building2,
  SlidersHorizontal,
  Plus,
  Sun,
  Moon,
  X,
} from 'lucide-react';

import { Avatar } from '../components/Avatar';

import {
  listarEquipe,
  listarIntegracoes,
  obterOrganizacao,
} from '../services/configuracoes';

import type {
  PapelUsuario,
  StatusIntegracao,
} from '../data/configuracoes';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type Aba =
  | 'equipe'
  | 'integracoes'
  | 'organizacao'
  | 'preferencias';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const ABAS: {
  id: Aba;
  label: string;
  Icon: typeof Users;
}[] = [
  {
    id: 'equipe',
    label: 'Equipe',
    Icon: Users,
  },

  {
    id: 'integracoes',
    label: 'Integrações',
    Icon: Plug,
  },

  {
    id: 'organizacao',
    label: 'Organização',
    Icon: Building2,
  },

  {
    id: 'preferencias',
    label: 'Preferências',
    Icon: SlidersHorizontal,
  },
];

const PAPEL_STYLE: Record<
  PapelUsuario,
  string
> = {
  Administrador:
    'bg-info-soft text-info',

  Coordenador:
    'bg-success-soft text-success',

  Visualizador:
    'bg-surface-soft text-muted',
};

const STATUS_STYLE: Record<
  StatusIntegracao,
  {
    dot: string;
    text: string;
    label: string;
  }
> = {
  conectado: {
    dot: 'bg-success',
    text: 'text-success',
    label: 'Conectado',
  },

  parcial: {
    dot: 'bg-warning',
    text: 'text-warning',
    label: 'Parcial',
  },

  desconectado: {
    dot: 'bg-subtle',
    text: 'text-muted',
    label: 'Desconectado',
  },
};

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [aba, setAba] =
    useState<Aba>('equipe');

  const equipe = listarEquipe();

  const integracoes =
    listarIntegracoes();

  const org =
    obterOrganizacao();

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* TABS */}
      <div className="overflow-x-auto pb-1">

        <div className="flex min-w-max gap-1 border-b border-line">

          {ABAS.map(
            ({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() =>
                  setAba(id)
                }
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${
                  aba === id
                    ? 'border-brand font-medium text-brand'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >

                <Icon
                  className="h-4 w-4"
                  strokeWidth={2}
                />

                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* EQUIPE */}
      {aba === 'equipe' && (
        <AbaEquipe equipe={equipe} />
      )}

      {/* INTEGRAÇÕES */}
      {aba === 'integracoes' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {integracoes.map((i) => {
            const st =
              STATUS_STYLE[i.status];

            return (
              <div
                key={i.id}
                className="rounded-2xl border border-line bg-surface p-4 md:p-5"
              >

                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                  <p className="text-sm font-medium text-ink md:text-base">
                    {i.nome}
                  </p>

                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${st.text}`}>

                    <span className={`h-2 w-2 rounded-full ${st.dot}`} />

                    {st.label}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-muted md:text-sm">
                  {i.descricao}
                </p>

                <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-subtle">
                  {i.detalhe}
                </p>

                <button className="mt-4 w-full rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto">

                  {i.status ===
                  'desconectado'
                    ? 'Conectar'
                    : 'Configurar'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ORGANIZAÇÃO */}
      {aba === 'organizacao' && (
        <div className="rounded-2xl border border-line bg-surface p-4 md:max-w-[700px] md:p-5">

          <h2 className="mb-5 text-base font-semibold text-ink md:text-sm">
            Dados da organização
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <CampoForm
              label="Nome"
              defaultValue={org.nome}
            />

            <CampoForm
              label="CNPJ"
              defaultValue={org.cnpj}
            />

            <CampoForm
              label="Site"
              defaultValue={org.site}
            />

            <CampoForm
              label="E-mail"
              defaultValue={org.email}
            />

            <CampoForm
              label="Telefone"
              defaultValue={org.telefone}
            />

            <div className="sm:col-span-2">

              <CampoForm
                label="Endereço"
                defaultValue={
                  org.endereco
                }
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-line pt-5">

            <button className="w-full rounded-xl bg-ink px-5 py-3 text-sm text-surface transition-opacity hover:opacity-90 sm:w-auto">
              Salvar alterações
            </button>
          </div>
        </div>
      )}

      {/* PREFERÊNCIAS */}
      {aba === 'preferencias' && (
        <AbaPreferencias />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ABA EQUIPE
// ─────────────────────────────────────────────

function AbaEquipe({
  equipe,
}: {
  equipe: ReturnType<
    typeof listarEquipe
  >;
}) {
  const [mostrarForm, setMostrarForm] =
    useState(false);

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">

      {/* HEADER */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <h2 className="text-base font-semibold text-ink md:text-sm">
          Equipe e permissões
        </h2>

        <button
          onClick={() =>
            setMostrarForm((v) => !v)
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-surface transition-opacity hover:opacity-90 sm:w-auto"
        >

          {mostrarForm ? (
            <X
              className="h-4 w-4"
              strokeWidth={2}
            />
          ) : (
            <Plus
              className="h-4 w-4"
              strokeWidth={2}
            />
          )}

          {mostrarForm
            ? 'Cancelar'
            : 'Adicionar membro'}
        </button>
      </div>

      {/* FORM */}
      {mostrarForm && (
        <div className="mb-5 rounded-2xl bg-surface-soft p-4">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <CampoForm
              label="Nome completo"
              placeholder="Ex.: João Mendes"
            />

            <CampoForm
              label="E-mail"
              placeholder="joao@turmadobem.org.br"
            />

            <div>
              <label className="mb-2 block text-xs text-muted">
                Papel
              </label>

              <select className="w-full cursor-pointer rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink">

                <option>
                  Coordenador
                </option>

                <option>
                  Administrador
                </option>

                <option>
                  Visualizador
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs text-muted">
                Região
              </label>

              <select className="w-full cursor-pointer rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink">

                <option>
                  Sudeste
                </option>

                <option>
                  Sul
                </option>

                <option>
                  Nordeste
                </option>

                <option>
                  Centro-Oeste
                </option>

                <option>
                  Norte
                </option>

                <option>
                  Nacional
                </option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end">

            <button
              onClick={() =>
                setMostrarForm(false)
              }
              className="w-full rounded-xl bg-ink px-5 py-3 text-sm text-surface transition-opacity hover:opacity-90 sm:w-auto"
            >
              Enviar convite
            </button>
          </div>
        </div>
      )}

      {/* LISTA */}
      <div className="divide-y divide-line">

        {equipe.map((m) => (
          <div
            key={m.id}
            className="flex flex-col gap-4 py-4 first:pt-1 sm:flex-row sm:items-center"
          >

            <div className="flex min-w-0 flex-1 items-start gap-3">

              <Avatar
                initials={m.iniciais}
                size="sm"
                tone={
                  m.ativo
                    ? 'info'
                    : 'default'
                }
              />

              <div className="min-w-0 flex-1">

                <p className="text-sm font-medium text-ink md:text-base">
                  {m.nome}

                  {!m.ativo && (
                    <span className="ml-2 text-xs text-subtle">
                      (inativo)
                    </span>
                  )}
                </p>

                <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">
                  {m.email} ·{' '}
                  {m.regiao}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

              <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${PAPEL_STYLE[m.papel]}`}>

                {m.papel}
              </span>

              <button className="w-full rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto">
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ABA PREFERÊNCIAS
// ─────────────────────────────────────────────

function AbaPreferencias() {
  const [tema, setTema] =
    useState<'claro' | 'escuro'>(
      () =>
        typeof document !==
          'undefined' &&
        document.documentElement.classList.contains(
          'dark'
        )
          ? 'escuro'
          : 'claro'
    );

  function aplicarTema(
    novo: 'claro' | 'escuro'
  ) {
    setTema(novo);

    document.documentElement.classList.toggle(
      'dark',
      novo === 'escuro'
    );

    try {
      localStorage.setItem(
        'tdb_tema',
        novo
      );
    } catch {
      //
    }
  }

  return (
    <div className="flex max-w-[700px] flex-col gap-5">

      {/* APARÊNCIA */}
      <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">

        <h2 className="mb-1 text-base font-semibold text-ink md:text-sm">
          Aparência
        </h2>

        <p className="mb-5 text-xs leading-relaxed text-muted md:text-sm">
          Escolha o tema do painel
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          <button
            onClick={() =>
              aplicarTema('claro')
            }
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
              tema === 'claro'
                ? 'border-2 border-info bg-info-soft font-medium text-info'
                : 'border-line text-muted hover:text-ink'
            }`}
          >

            <Sun
              className="h-4 w-4"
              strokeWidth={2}
            />

            Claro
          </button>

          <button
            onClick={() =>
              aplicarTema('escuro')
            }
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
              tema === 'escuro'
                ? 'border-2 border-info bg-info-soft font-medium text-info'
                : 'border-line text-muted hover:text-ink'
            }`}
          >

            <Moon
              className="h-4 w-4"
              strokeWidth={2}
            />

            Escuro
          </button>
        </div>
      </div>

      {/* NOTIFICAÇÕES */}
      <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">

        <h2 className="mb-5 text-base font-semibold text-ink md:text-sm">
          Notificações
        </h2>

        <div className="space-y-4">

          <LinhaToggle
            label="Alertas de solicitações Alta sem resposta"
            defaultChecked
          />

          <LinhaToggle
            label="Resumo diário por e-mail"
            defaultChecked
          />

          <LinhaToggle
            label="Lembrete de renovação de parcerias"
            defaultChecked={
              false
            }
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function CampoForm({
  label,
  defaultValue,
  placeholder,
}: {
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-xs text-muted">
        {label}
      </label>

      <input
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </div>
  );
}

function LinhaToggle({
  label,
  defaultChecked,
}: {
  label: string;
  defaultChecked: boolean;
}) {
  const [on, setOn] =
    useState(defaultChecked);

  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-sm leading-relaxed text-ink">
        {label}
      </span>

      <button
        onClick={() =>
          setOn((v) => !v)
        }
        className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
          on
            ? 'bg-brand'
            : 'bg-line-strong'
        }`}
      >

        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface transition-all ${
          on
            ? 'left-[18px]'
            : 'left-0.5'
        }`} />
      </button>
    </div>
  );
}