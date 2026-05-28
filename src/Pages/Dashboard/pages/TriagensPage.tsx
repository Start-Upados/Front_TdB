import { useState, useMemo } from 'react';
import {
  Search, Plus, MessageSquare, School, Clock,
  MapPin, CalendarDays, Star, ChevronDown,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';
import { SeverityPill } from '../components/SeverityPill';
import {
  listarFila,
  obterKpis,
  sugerirDentistas,
} from '../services/triagens';
import type { Paciente, StatusVinculacao } from '../data/triagens';

function OrigemBadge({ origem, statusVinculacao }: { origem: Paciente['origem']; statusVinculacao: StatusVinculacao }) {
  if (statusVinculacao === 'convite-enviado') {
    return (
      <div className="flex items-center gap-1.5 text-2xs text-warning">
        <Clock className="w-3 h-3" strokeWidth={2} />
        <span>Convite enviado · aguardando</span>
      </div>
    );
  }
  if (origem.tipo === 'central') {
    return (
      <div className="flex items-center gap-1.5 text-2xs text-subtle">
        <MessageSquare className="w-3 h-3" strokeWidth={2} />
        <span>via Central de Canais</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-2xs text-subtle">
      <School className="w-3 h-3" strokeWidth={2} />
      <span>via Triagem escolar</span>
    </div>
  );
}

export default function TriagensPage() {
  const kpis = obterKpis();
  const pacientes = listarFila();

  const [selectedId, setSelectedId]   = useState(pacientes[0].id);
  const [search, setSearch]           = useState('');
  const [filtroPrograma, setPrograma] = useState('Todos');
  const [filtroTempo, setFiltroTempo] = useState('Todos');

  const filtered = pacientes.filter((p) => {
    if (filtroPrograma !== 'Todos' && p.programa !== filtroPrograma) return false;
    if (filtroTempo === 'ate7' && p.diasNaFila > 7) return false;
    if (filtroTempo === '8a30' && (p.diasNaFila < 8 || p.diasNaFila > 30)) return false;
    if (filtroTempo === '30a60' && (p.diasNaFila < 30 || p.diasNaFila > 60)) return false;
    if (filtroTempo === 'mais60' && p.diasNaFila <= 60) return false;
    if (search && !p.nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = pacientes.find((p) => p.id === selectedId) || pacientes[0];

  const dentistasSugeridos = useMemo(
    () => sugerirDentistas(selected),
    [selected],
  );

  return (
    <div className="flex flex-col gap-5 w-full max-w-full">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              w-4
              h-4
              text-subtle
            "
            strokeWidth={2}
          />

          <input
            type="text"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full
              pl-10
              pr-3
              py-3
              text-sm
              rounded-xl
              border
              border-line
              bg-surface
              text-ink
              placeholder:text-subtle
              focus:outline-none
              focus:border-brand
              focus:ring-1
              focus:ring-brand
            "
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3">

          <select
            value={filtroPrograma}
            onChange={(e) => setPrograma(e.target.value)}
            className="
              text-sm
              py-3
              px-3
              rounded-xl
              border
              border-line
              bg-surface
              text-ink
              cursor-pointer
            "
          >
            <option value="Todos">Todos programas</option>
            <option value="Dentista do Bem">Dentista do Bem</option>
            <option value="Apolônias do Bem">Apolônias do Bem</option>
          </select>

          <select
            value={filtroTempo}
            onChange={(e) => setFiltroTempo(e.target.value)}
            className="
              text-sm
              py-3
              px-3
              rounded-xl
              border
              border-line
              bg-surface
              text-ink
              cursor-pointer
            "
          >
            <option value="Todos">Tempo na fila</option>
            <option value="ate7">Até 7 dias</option>
            <option value="8a30">8 a 30 dias</option>
            <option value="30a60">30 a 60 dias</option>
            <option value="mais60">+60 dias</option>
          </select>
        </div>

        <button
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            text-sm
            py-3
            px-4
            rounded-xl
            bg-ink
            text-surface
            hover:opacity-90
            transition-opacity
            w-full
            lg:w-auto
          "
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Nova triagem
        </button>
      </div>

      {/* Fila + Matching */}
      <div className="grid grid-cols-1 xl:grid-cols-12 border border-line rounded-2xl overflow-hidden bg-surface">

        {/* Lista de pacientes */}
        <div className="xl:col-span-5 border-b xl:border-b-0 xl:border-r border-line overflow-y-auto max-h-[420px] xl:max-h-[720px]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">Nenhum paciente encontrado</div>
          ) : (
            filtered.map((p) => {
              const isSelected = selectedId === p.id;
              const diasDestaque = p.diasNaFila > 60 ? 'text-danger' : 'text-ink';
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left flex gap-3 p-4 border-b border-line transition-colors ${
                    isSelected ? 'bg-brand-soft' : 'hover:bg-surface-soft'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1 min-w-[56px]">
                    <span className={`text-lg font-semibold leading-none ${diasDestaque}`}>{p.diasNaFila}</span>
                    <span className={`text-2xs ${p.diasNaFila > 60 ? 'text-danger' : 'text-subtle'}`}>dias</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-ink truncate">{p.nome}, {p.idade}</p>
                      <SeverityPill severidade={p.severidade} />
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">{p.programa} · {p.cidade}-{p.estado}</p>
                    <div className="mt-1.5">
                      <OrigemBadge origem={p.origem} statusVinculacao={p.statusVinculacao} />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Painel de matching */}
        <div className="xl:col-span-7 p-4 md:p-5 overflow-y-auto max-h-none xl:max-h-[720px]">

          {/* Header do paciente */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <Avatar initials={selected.iniciais} size="md" tone="info" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">{selected.nome}, {selected.idade} anos</p>
              <p className="text-xs text-muted mt-0.5">{selected.programa} · {selected.cidade}-{selected.estado} · CEP {selected.cep}</p>
            </div>
            <SeverityPill severidade={selected.severidade} />
          </div>

          {/* Info card */}
          <div className="bg-surface-soft rounded-xl p-4 mb-5 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2">
              <span className="text-muted">Necessidade</span>
              <span className="font-medium text-ink">{selected.necessidade}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2">
              <span className="text-muted">Origem</span>
              <span className="text-ink text-right">{selected.origem.detalhe}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2">
              <span className="text-muted">Na fila há</span>
              <span className={`font-medium ${selected.diasNaFila > 60 ? 'text-danger' : 'text-ink'}`}>{selected.diasNaFila} dias</span>
            </div>
          </div>

          {/* Sugeridos */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-ink">Dentistas sugeridos</p>
            <span className="text-2xs text-subtle">Ordenado por compatibilidade</span>
          </div>

          {dentistasSugeridos.map(({ dentista, match }, idx) => {
            const isTop = idx === 0;
            return (
              <div
                key={dentista.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl mb-3 ${
                  isTop ? 'border-2 border-info' : 'border border-line'
                }`}
              >
                <Avatar initials={dentista.iniciais} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-ink truncate">{dentista.nome}</p>
                    <span className="text-xs font-medium text-ink shrink-0">Match {match.scorePercent}%</span>
                  </div>
                  <p className="text-2xs text-muted mt-0.5">{dentista.especialidade} · {dentista.vinculos} vínculos</p>
                  <div className="flex items-center gap-3 mt-1.5 text-2xs text-subtle">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" strokeWidth={2} />
                      {match.distanciaKm < 10 ? match.distanciaKm.toFixed(1) : Math.round(match.distanciaKm)} km
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" strokeWidth={2} />
                      {dentista.slotsDisponiveis} slots / 14d
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3 h-3" strokeWidth={2} />
                      {dentista.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <button
                  className={`w-full sm:w-auto text-sm px-4 py-2 rounded-xl transition-opacity ${
                    isTop ? 'bg-ink text-surface hover:opacity-90' : 'border border-line text-ink hover:bg-surface-soft'
                  }`}
                >
                  Convidar
                </button>
              </div>
            );
          })}

          <button className="w-full inline-flex items-center justify-center gap-2 text-sm py-3 mt-3 rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors">
            Ver mais opções
            <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}