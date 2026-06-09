import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Search,
  Link2,
  Star,
  Clock,
  ArrowRight,
} from 'lucide-react';

import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';

import {
  obterKpis,
  listarDentistas,
  listarPendentes,
  listarEspecialidades,
  obterDistribuicaoRegional,
} from '../services/voluntarios';
import type { Regiao } from '../data/dentistas';

const REGIOES: Regiao[] = [
  'Sudeste',
  'Sul',
  'Nordeste',
  'Centro-Oeste',
  'Norte',
];

export default function VoluntariosPage() {
  const navigate = useNavigate();

  const kpis = obterKpis();
  const dentistas = listarDentistas();
  const pendentes = listarPendentes();
  const especialidades = listarEspecialidades();
  const distribuicao = obterDistribuicaoRegional();

  const [regiao, setRegiao] = useState<Regiao>('Sudeste');

  const [search, setSearch] = useState('');

  const [filtroEspecialidade, setFiltEsp] = useState('Todas');

  const [filtroStatus, setFiltStatus] = useState('Todos');

  const filtered = dentistas.filter((d) => {
    if (d.status === 'Pendente' || d.status === 'Rejeitado') return false;

    if (d.regiao !== regiao) return false;

    if (
      filtroEspecialidade !== 'Todas' &&
      d.especialidade !== filtroEspecialidade
    ) return false;

    if (
      filtroStatus !== 'Todos' &&
      d.status !== filtroStatus
    ) return false;

    if (
      search &&
      !d.nome.toLowerCase().includes(search.toLowerCase())
    ) return false;

    return true;
  });

  return (
    <div className="flex w-full max-w-full flex-col gap-5">

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* APROVAÇÕES */}
      <div className="rounded-2xl border border-line bg-surface shadow-cardp-4 md:p-5">

        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink md:text-sm">
            Aprovações pendentes
          </h2>

          <span className="whitespace-nowrap text-xs text-subtle">
            {pendentes.length} dentistas
          </span>
        </div>

        <div className="divide-y divide-line">

          {pendentes.map((d) => (
            <div
              key={d.id}
              className="flex flex-col gap-4 py-4 first:pt-1 sm:flex-row sm:items-center"
            >

              <div className="flex min-w-0 flex-1 items-start gap-3">

                <Avatar initials={d.iniciais} />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink md:text-base">
                    {d.nome}
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">
                    {d.especialidade} · {d.cidade}-{d.estado} · {d.cro}
                  </p>
                </div>
              </div>

              <span className={`text-xs whitespace-nowrap ${
                d.ultimaAtividadeDias >= 5
                  ? 'text-warning'
                  : 'text-subtle'
              }`}>
                há {d.ultimaAtividadeDias}{' '}
                {d.ultimaAtividadeDias === 1
                  ? 'dia'
                  : 'dias'}
              </span>

              <button
                onClick={() => navigate(`/dashboard/voluntarios/${d.id}`)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto"
              >
                Ver perfil

                <ArrowRight
                  className="h-4 w-4"
                  strokeWidth={2}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* REGIÕES */}
      <div className="rounded-2xl border border-line bg-surface shadow-cardp-4 md:p-5">

        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink md:text-sm">
            Distribuição regional
          </h2>

          <span className="text-xs text-subtle">
            Clique para filtrar
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">

          {REGIOES.map((r) => {
            const data = distribuicao[r];

            const isActive = regiao === r;

            return (
              <button
                key={r}
                onClick={() => setRegiao(r)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  isActive
                    ? 'border-info bg-info-soft'
                    : 'border-line bg-surface hover:bg-surface-soft'
                }`}
              >
                <p className={`text-sm ${
                  isActive
                    ? 'text-info'
                    : 'text-muted'
                }`}>
                  {r}
                </p>

                <p className="mt-1 text-2xl font-semibold leading-none text-ink">
                  {data.count}
                </p>

                <p className={`mt-2 text-xs ${
                  isActive
                    ? 'text-info'
                    : 'text-subtle'
                }`}>
                  {data.percent}%
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-soft">
                  <div
                    className="h-full rounded-full bg-info"
                    style={{
                      width: `${data.percent * 2}%`,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DIRETÓRIO */}
      <div className="rounded-2xl border border-line bg-surface shadow-cardp-4 md:p-5">

        {/* TOP */}
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">

          <p className="mr-auto text-base font-medium text-ink md:text-sm">
            Diretório · {regiao}
          </p>

          <div className="relative w-full xl:w-[260px]">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
              strokeWidth={2}
            />

            <input
              type="text"
              placeholder="Buscar dentista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface shadow-cardpy-3 pl-10 pr-3 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">

            <select
              value={filtroEspecialidade}
              onChange={(e) => setFiltEsp(e.target.value)}
              className="cursor-pointer rounded-xl border border-line bg-surface shadow-cardpx-3 py-3 text-sm text-ink"
            >
              <option value="Todas">
                Todas especialidades
              </option>

              {especialidades.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltStatus(e.target.value)}
              className="cursor-pointer rounded-xl border border-line bg-surface shadow-cardpx-3 py-3 text-sm text-ink"
            >
              <option value="Todos">Status</option>
              <option value="Ativa">Ativa</option>
              <option value="Suspensa">Suspensa</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>

        {/* LISTA */}
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            Nenhum dentista nesta região com os filtros aplicados.
          </p>
        ) : (
          <div className="divide-y divide-line">

            {filtered.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-4 py-4 first:pt-1 lg:flex-row lg:items-center"
              >

                <div className="flex min-w-0 flex-1 items-start gap-3">

                  <Avatar initials={d.iniciais} size="sm" />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink md:text-base">
                      {d.nome}
                    </p>

                    <p className="mt-1 text-xs text-muted md:text-sm">
                      {d.especialidade} · {d.cidade}-{d.estado}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-subtle">

                      <span className="inline-flex items-center gap-1">
                        <Link2
                          className="h-3.5 w-3.5"
                          strokeWidth={2}
                        />
                        {d.vinculosTotal} vínculos
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Star
                          className="h-3.5 w-3.5"
                          strokeWidth={2}
                        />
                        {d.rating.toFixed(1)}
                      </span>

                      <span className={`inline-flex items-center gap-1 ${
                        d.ultimaAtividadeDias >= 90
                          ? 'text-warning'
                          : ''
                      }`}>
                        <Clock
                          className="h-3.5 w-3.5"
                          strokeWidth={2}
                        />

                        última atividade:{' '}
                        {d.ultimaAtividadeDias}d
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:items-center">

                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${
                    d.status === 'Ativa'    ? 'bg-success-soft text-success' :
                    d.status === 'Suspensa' ? 'bg-danger-soft text-danger' :
                                              'bg-warning-soft text-warning'  }`}>
                    {d.status}
                  </span>

                  <button
                    onClick={() => navigate(`/dashboard/voluntarios/${d.id}`)}
                    className="w-full rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto"
                  >
                    {d.status === 'Inativo'
                      ? 'Reengajar'
                      : 'Ver perfil'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FOOTER */}
        <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm text-ink transition-colors hover:bg-surface-soft">
          Ver todos os {distribuicao[regiao].count} da região {regiao}

          <ArrowRight
            className="h-4 w-4"
            strokeWidth={2}
          />
        </button>
      </div>
    </div>
  );
}