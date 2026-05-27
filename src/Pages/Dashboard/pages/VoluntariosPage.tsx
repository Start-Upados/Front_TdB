import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Link2, Star, Clock, ArrowRight } from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';
import { DENTISTAS, DISTRIBUICAO_REGIONAL, type Regiao } from '../data/dentistas';

const REGIOES: Regiao[] = ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'];

export default function VoluntariosPage() {
  const navigate = useNavigate();
  const [regiao, setRegiao]               = useState<Regiao>('Sudeste');
  const [search, setSearch]               = useState('');
  const [filtroEspecialidade, setFiltEsp] = useState('Todas');
  const [filtroStatus, setFiltStatus]     = useState('Todos');

  const pendentes = DENTISTAS.filter((d) => d.status === 'Pendente');

  const especialidades = useMemo(() => {
    return Array.from(new Set(DENTISTAS.filter(d => d.status !== 'Pendente').map(d => d.especialidade)));
  }, []);

  const filtered = DENTISTAS.filter((d) => {
    if (d.status === 'Pendente') return false;
    if (d.regiao !== regiao) return false;
    if (filtroEspecialidade !== 'Todas' && d.especialidade !== filtroEspecialidade) return false;
    if (filtroStatus !== 'Todos' && d.status !== filtroStatus) return false;
    if (search && !d.nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-5 max-w-[1280px]">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Dentistas ativos" value="1.284" sub="de 1.452 cadastrados" />
        <KpiCard label="Inativos +90 dias" value="23" valueTone="warning" sub="Vale reengajar" />
        <KpiCard label="Pendentes aprovação" value={pendentes.length} valueTone="danger" sub="Aguardando ação" subTone="danger" />
        <KpiCard label="Novos este mês" value="18" sub="+5 vs setembro" subTone="success" />
      </div>

      {/* Aprovações pendentes */}
      <div className="bg-surface border border-line rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Aprovações pendentes</h2>
          <span className="text-2xs text-subtle">{pendentes.length} dentistas</span>
        </div>
        <div className="divide-y divide-line">
          {pendentes.map((d) => (
            <div key={d.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
              <Avatar initials={d.iniciais} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">{d.nome}</p>
                <p className="text-xs text-muted mt-0.5">{d.especialidade} · {d.cidade}-{d.estado} · {d.cro}</p>
              </div>
              <span className={`text-2xs ${d.ultimaAtividadeDias >= 5 ? 'text-warning' : 'text-subtle'}`}>
                há {d.ultimaAtividadeDias} {d.ultimaAtividadeDias === 1 ? 'dia' : 'dias'}
              </span>
              <button
                onClick={() => navigate(`/dashboard/voluntarios/${d.id}`)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors"
              >
                Ver perfil
                <ArrowRight className="w-3 h-3" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Distribuição regional */}
      <div className="bg-surface border border-line rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Distribuição regional</h2>
          <span className="text-2xs text-subtle">Clique para filtrar</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {REGIOES.map((r) => {
            const data = DISTRIBUICAO_REGIONAL[r];
            const isActive = regiao === r;
            return (
              <button
                key={r}
                onClick={() => setRegiao(r)}
                className={`text-left rounded-md p-2.5 transition-colors ${
                  isActive
                    ? 'border-2 border-info bg-info-soft'
                    : 'border border-line bg-surface hover:bg-surface-soft'
                }`}
                style={isActive ? { padding: '9px' } : undefined}
              >
                <p className={`text-xs ${isActive ? 'text-info' : 'text-muted'}`}>{r}</p>
                <p className="text-lg font-semibold text-ink mt-0.5 leading-none">{data.count}</p>
                <p className={`text-2xs mt-0.5 ${isActive ? 'text-info' : 'text-subtle'}`}>{data.percent}%</p>
                <div className="h-1 bg-surface-soft rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-info rounded-full" style={{ width: `${data.percent * 2}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Diretório */}
      <div className="bg-surface border border-line rounded-xl p-5">
        <div className="flex gap-2 items-center flex-wrap mb-3">
          <p className="text-sm font-medium text-ink mr-auto">Diretório · {regiao}</p>
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" strokeWidth={2} />
            <input
              type="text"
              placeholder="Buscar dentista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm rounded-md border border-line bg-surface text-ink placeholder:text-subtle focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <select value={filtroEspecialidade} onChange={(e) => setFiltEsp(e.target.value)} className="text-sm py-1.5 px-3 rounded-md border border-line bg-surface text-ink cursor-pointer">
            <option value="Todas">Todas especialidades</option>
            {especialidades.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={filtroStatus} onChange={(e) => setFiltStatus(e.target.value)} className="text-sm py-1.5 px-3 rounded-md border border-line bg-surface text-ink cursor-pointer">
            <option value="Todos">Status</option>
            <option value="Ativa">Ativa</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">Nenhum dentista nesta região com os filtros aplicados.</p>
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-3 first:pt-1">
                <Avatar initials={d.iniciais} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{d.nome}</p>
                  <p className="text-2xs text-muted mt-0.5">{d.especialidade} · {d.cidade}-{d.estado}</p>
                  <div className="flex items-center gap-3 mt-1 text-2xs text-subtle">
                    <span className="inline-flex items-center gap-1"><Link2 className="w-3 h-3" strokeWidth={2} />{d.vinculosTotal} vínculos</span>
                    <span className="inline-flex items-center gap-1"><Star className="w-3 h-3" strokeWidth={2} />{d.rating.toFixed(1)}</span>
                    <span className={`inline-flex items-center gap-1 ${d.ultimaAtividadeDias >= 90 ? 'text-warning' : ''}`}>
                      <Clock className="w-3 h-3" strokeWidth={2} />
                      última atividade: {d.ultimaAtividadeDias}d
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium ${
                  d.status === 'Ativa' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'
                }`}>
                  {d.status}
                </span>
                <button
                  onClick={() => navigate(`/dashboard/voluntarios/${d.id}`)}
                  className="text-xs px-3 py-1.5 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors"
                >
                  {d.status === 'Inativo' ? 'Reengajar' : 'Ver perfil'}
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="w-full inline-flex items-center justify-center gap-1.5 text-sm py-2 mt-4 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors">
          Ver todos os {DISTRIBUICAO_REGIONAL[regiao].count} da região {regiao}
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>

    </div>
  );
}