import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  Search,
  Plus,
  Sparkles,
  ChevronDown,
  Send,
  ArrowRight,
  Share2,
  Archive,
  MessageSquare,
  Globe,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';

import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';

import {
  PriorityPill,
  type Prioridade,
} from '../components/PriorityPill';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type Canal =
  | 'Site'
  | 'WhatsApp'
  | 'Email'
  | 'Instagram'
  | 'Telefone';

interface Solicitacao {
  id: string;
  nome: string;
  iniciais: string;
  idade?: number;
  cidade?: string;
  canal: Canal;
  tipo: string;
  preview: string;
  mensagem: string;
  data: string;
  prioridade: Prioridade;
  score: number;

  featuresUsadas?: {
    idade?: string;
    programa?: string;
    canal?: string;
  };
}

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const SOLICITACOES: Solicitacao[] = [
  {
    id: '1',
    nome: 'João Silva',
    iniciais: 'JS',
    idade: 13,
    cidade: 'São Paulo, SP',
    canal: 'WhatsApp',
    tipo: 'Beneficiário',
    preview: 'Filho com dor forte há 3 dias…',
    mensagem:
      'Olá, meu filho de 13 anos está com dor muito forte no dente há 3 dias. Não consigo dormir vendo ele assim. Estamos em São Paulo, em situação difícil. Por favor, como posso conseguir atendimento?',
    data: '14min',
    prioridade: 'Alta',
    score: 0.87,

    featuresUsadas: {
      idade: '13 anos · faixa crítica',
      programa:
        'Dentista do Bem · vulnerabilidade',
      canal: 'WhatsApp · urgência típica',
    },
  },

  {
    id: '2',
    nome: 'Maria Santos',
    iniciais: 'MS',
    idade: 34,
    cidade: 'Recife, PE',
    canal: 'Site',
    tipo: 'Beneficiária',
    preview:
      'Vítima de violência precisa atendimento…',
    mensagem:
      'Boa tarde. Sou Maria, fui vítima de violência doméstica e perdi vários dentes. Estou em Recife e preciso muito de ajuda para voltar a sorrir.',
    data: '1h',
    prioridade: 'Alta',
    score: 0.79,

    featuresUsadas: {
      idade: '34 anos · faixa adulto',
      programa:
        'Apolônias do Bem · vulnerabilidade alta',
      canal: 'Site · solicitação formal',
    },
  },

  {
    id: '3',
    nome: 'Dr. Carlos Melo',
    iniciais: 'CM',
    cidade: 'Belo Horizonte, MG',
    canal: 'Site',
    tipo: 'Voluntário',
    preview:
      'Quero me cadastrar como voluntário…',
    mensagem:
      'Sou dentista clínico geral, atuo há 12 anos em BH, e gostaria de fazer parte da rede de voluntários da Turma do Bem. Como faço para iniciar?',
    data: '3h',
    prioridade: 'Media',
    score: 0.68,

    featuresUsadas: {
      programa:
        'Voluntariado · cadastro pendente',
      canal: 'Site · solicitação formal',
    },
  },

  {
    id: '4',
    nome: 'Colgate Brasil',
    iniciais: 'CB',
    cidade: 'São Paulo, SP',
    canal: 'Email',
    tipo: 'Doador',
    preview:
      'Proposta de ampliar parceria 2026…',
    mensagem:
      'Prezados, gostaríamos de agendar uma reunião para discutir a ampliação de nossa parceria em 2026. Temos interesse em apoiar a expansão do programa Apolônias.',
    data: '5h',
    prioridade: 'Media',
    score: 0.71,

    featuresUsadas: {
      programa: 'Parceria estratégica',
      canal: 'Email · comunicação formal',
    },
  },

  {
    id: '5',
    nome: 'Ana Beatriz',
    iniciais: 'AB',
    idade: 27,
    cidade: 'Salvador, BA',
    canal: 'Instagram',
    tipo: 'Beneficiária',
    preview:
      'Dúvida sobre o dia da consulta…',
    mensagem:
      'Oi! Tenho uma consulta marcada, mas não tenho certeza se é amanhã ou semana que vem. Vocês podem me confirmar?',
    data: '7h',
    prioridade: 'Baixa',
    score: 0.82,

    featuresUsadas: {
      idade:
        '27 anos · paciente em tratamento',
      canal:
        'Instagram · canal informal',
    },
  },
];

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────

const CHANNEL_ICONS: Record<
  Canal,
  React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>
> = {
  Site: Globe,
  WhatsApp: MessageSquare,
  Email: Mail,
  Instagram: MessageCircle,
  Telefone: Phone,
};

// ─────────────────────────────────────────────
// FEATURE ROW
// ─────────────────────────────────────────────

function FeatureRow({
  label,
  value,
  prioridade,
}: {
  label: string;
  value: string;
  prioridade: Prioridade;
}) {
  const tone =
    prioridade === 'Alta'
      ? 'text-danger'
      : prioridade === 'Media'
      ? 'text-warning'
      : 'text-muted';

  const [main, detail] = value.split(' · ');

  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">

      <span className="text-xs text-muted">
        {label}
      </span>

      <span className="text-sm">
        <span className="font-medium text-ink">
          {main}
        </span>

        {detail && (
          <>
            {' · '}

            <span className={tone}>
              {detail}
            </span>
          </>
        )}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function CentralPage() {
  const navigate = useNavigate();

  const [selectedId, setSelectedId] =
    useState('1');

  const [filterCanal, setFilterCanal] =
    useState('Todos');

  const [filterPrioridade, setFilterPrior] =
    useState('Todas');

  const [search, setSearch] =
    useState('');

  const filtered = SOLICITACOES.filter(
    (s) => {
      if (
        filterCanal !== 'Todos' &&
        s.canal !== filterCanal
      ) return false;

      if (
        filterPrioridade !== 'Todas' &&
        s.prioridade !== filterPrioridade
      ) return false;

      if (search) {
        const q = search.toLowerCase();

        if (
          !s.nome
            .toLowerCase()
            .includes(q) &&
          !s.preview
            .toLowerCase()
            .includes(q)
        ) return false;
      }

      return true;
    }
  );

  const selected =
    SOLICITACOES.find(
      (s) => s.id === selectedId
    ) || SOLICITACOES[0];

  const ChannelIcon =
    CHANNEL_ICONS[selected.canal];

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <KpiCard
          label="Solicitações novas hoje"
          value="23"
          sub="+8 vs ontem"
        />

        <KpiCard
          label="Alta sem resposta +24h"
          value="5"
          valueTone="danger"
          sub="Atenção urgente"
          subTone="danger"
        />

        <KpiCard
          label="Tempo médio resposta"
          value="2.4h"
          sub="−12% vs semana"
          subTone="success"
        />

        <KpiCard
          label="Acurácia ML (30 dias)"
          value="92%"
          sub="+3pp com overrides"
          subTone="success"
        />
      </div>

      {/* FILTERS */}
      <div className="flex flex-col gap-3 xl:flex-row">

        <div className="relative flex-1">

          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
            strokeWidth={2}
          />

          <input
            type="text"
            placeholder="Buscar solicitação..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">

          <select
            value={filterCanal}
            onChange={(e) =>
              setFilterCanal(
                e.target.value
              )
            }
            className="min-w-[160px] cursor-pointer rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink"
          >
            <option value="Todos">
              Todos canais
            </option>

            <option value="Site">
              Site
            </option>

            <option value="WhatsApp">
              WhatsApp
            </option>

            <option value="Email">
              Email
            </option>

            <option value="Instagram">
              Instagram
            </option>

            <option value="Telefone">
              Telefone
            </option>
          </select>

          <select
            value={filterPrioridade}
            onChange={(e) =>
              setFilterPrior(
                e.target.value
              )
            }
            className="min-w-[160px] cursor-pointer rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink"
          >
            <option value="Todas">
              Todas prioridades
            </option>

            <option value="Alta">
              Alta
            </option>

            <option value="Media">
              Média
            </option>

            <option value="Baixa">
              Baixa
            </option>
          </select>
        </div>

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink transition-colors hover:bg-surface-soft xl:w-auto">

          <Plus
            className="h-4 w-4"
            strokeWidth={2}
          />

          Manual
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-surface xl:grid-cols-12">

        {/* LIST */}
        <div className="max-h-[420px] overflow-y-auto border-b border-line xl:col-span-5 xl:max-h-[760px] xl:border-b-0 xl:border-r">

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            filtered.map((item) => {
              const ItemChannelIcon =
                CHANNEL_ICONS[item.canal];

              const isSelected =
                selectedId === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    setSelectedId(item.id)
                  }
                  className={`flex w-full gap-4 border-b border-line p-4 text-left transition-colors ${
                    isSelected
                      ? 'bg-brand-soft'
                      : 'hover:bg-surface-soft'
                  }`}
                >

                  {/* LEFT */}
                  <div className="flex min-w-[60px] flex-col items-center gap-2">

                    <PriorityPill
                      prioridade={
                        item.prioridade
                      }
                    />

                    <span className="text-xs text-subtle">
                      {Math.round(
                        item.score * 100
                      )}%
                    </span>
                  </div>

                  {/* CONTENT */}
                  <div className="min-w-0 flex-1">

                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">

                      <p className="truncate text-sm font-medium text-ink md:text-base">
                        {item.nome}
                      </p>

                      <span className="shrink-0 text-xs text-subtle">
                        {item.data}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted md:text-sm">
                      {item.preview}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-xs text-subtle">

                      <ItemChannelIcon
                        className="h-3.5 w-3.5"
                        strokeWidth={2}
                      />

                      <span>
                        {item.canal} ·{' '}
                        {item.tipo}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* DETAIL */}
        <div className="overflow-y-auto p-4 md:p-5 xl:col-span-7 xl:max-h-[760px]">

          {/* HEADER */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">

            <Avatar
              initials={selected.iniciais}
              size="md"
              tone="info"
            />

            <div className="min-w-0 flex-1">

              <p className="text-sm font-medium text-ink md:text-base">
                {selected.nome}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">
                {selected.tipo}

                {selected.idade &&
                  ` · ${selected.idade} anos`}

                {selected.cidade &&
                  ` · ${selected.cidade}`}
              </p>
            </div>

            <div className="sm:text-right">

              <p className="text-xs text-subtle">
                {selected.data} atrás
              </p>

              <p className="mt-1 flex items-center gap-1 text-xs text-subtle sm:justify-end">

                via {selected.canal}

                <ChannelIcon
                  className="h-3.5 w-3.5"
                  strokeWidth={2}
                />
              </p>
            </div>
          </div>

          {/* ML */}
          <div className="mb-4 rounded-2xl border border-line p-4">

            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-2">

                <Sparkles
                  className="h-4 w-4 text-info"
                  strokeWidth={2}
                />

                <span className="text-sm text-muted">
                  Classificação por ML
                </span>
              </div>

              <button className="inline-flex items-center justify-center gap-1 rounded-xl border border-line px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-soft">

                Reclassificar

                <ChevronDown
                  className="h-3.5 w-3.5"
                  strokeWidth={2}
                />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">

              <PriorityPill
                prioridade={
                  selected.prioridade
                }
                size="md"
              />

              <span className="text-sm text-ink">
                {Math.round(
                  selected.score * 100
                )}% de confiança
              </span>
            </div>

            {selected.featuresUsadas && (
              <>
                <p className="mb-2 text-xs tracking-wider text-muted">
                  POR QUE ESSA PRIORIDADE
                </p>

                <div className="divide-y divide-line">

                  {selected
                    .featuresUsadas
                    .idade && (
                    <FeatureRow
                      label="Idade"
                      value={
                        selected
                          .featuresUsadas
                          .idade
                      }
                      prioridade={
                        selected.prioridade
                      }
                    />
                  )}

                  {selected
                    .featuresUsadas
                    .programa && (
                    <FeatureRow
                      label="Programa"
                      value={
                        selected
                          .featuresUsadas
                          .programa
                      }
                      prioridade={
                        selected.prioridade
                      }
                    />
                  )}

                  {selected
                    .featuresUsadas
                    .canal && (
                    <FeatureRow
                      label="Canal"
                      value={
                        selected
                          .featuresUsadas
                          .canal
                      }
                      prioridade={
                        selected.prioridade
                      }
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {/* MESSAGE */}
          <div className="mb-4">

            <p className="mb-2 text-xs tracking-wider text-muted">
              MENSAGEM
            </p>

            <div className="rounded-2xl bg-surface-soft p-4 text-sm leading-relaxed text-ink md:text-base">
              {selected.mensagem}
            </div>
          </div>

          {/* REPLY */}
          <textarea
            placeholder="Digite uma resposta..."
            className="mb-4 min-h-[110px] w-full resize-none rounded-2xl border border-line bg-surface p-4 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />

          {/* ACTIONS */}
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 xl:flex xl:flex-row xl:flex-wrap">

            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-surface transition-opacity hover:opacity-90">

              <Send
                className="h-4 w-4"
                strokeWidth={2}
              />

              Responder
            </button>

            <button
              onClick={() =>
                navigate(
                  '/dashboard/triagens'
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-ink transition-colors hover:bg-surface-soft"
            >

              <ArrowRight
                className="h-4 w-4"
                strokeWidth={2}
              />

              Promover a triagem
            </button>

            <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-ink transition-colors hover:bg-surface-soft">

              <Share2
                className="h-4 w-4"
                strokeWidth={2}
              />

              Encaminhar
            </button>

            <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-ink transition-colors hover:bg-surface-soft">

              <Archive
                className="h-4 w-4"
                strokeWidth={2}
              />

              Arquivar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}