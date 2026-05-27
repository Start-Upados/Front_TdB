import { useState, useMemo } from 'react';
import {
  Search, Plus, MessageSquare, School, Clock,
  MapPin, CalendarDays, Star, ChevronDown,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';
import { SeverityPill, type Severidade } from '../components/SeverityPill';
import { calcularMatch } from '../Utils/Geo';

type Programa = 'Dentista do Bem' | 'Apolônias do Bem';
type StatusVinculacao = 'aguardando' | 'convite-enviado';

interface Paciente {
  id: string;
  nome: string;
  iniciais: string;
  idade: number;
  cidade: string;
  estado: string;
  cep: string;
  coords: { lat: number; lng: number };
  programa: Programa;
  necessidade: string;
  especialidadeNecessaria: string;
  severidade: Severidade;
  diasNaFila: number;
  origem: {
    tipo: 'central' | 'escola' | 'manual';
    detalhe: string;
  };
  statusVinculacao: StatusVinculacao;
}

interface Dentista {
  id: string;
  nome: string;
  iniciais: string;
  especialidade: string;
  cidade: string;
  estado: string;
  coords: { lat: number; lng: number };
  vinculos: number;
  rating: number;
  slotsDisponiveis: number;
}

const PACIENTES_FILA: Paciente[] = [
  {
    id: '1',
    nome: 'João Silva',
    iniciais: 'JS',
    idade: 13,
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04567-000',
    coords: { lat: -23.5505, lng: -46.6333 },
    programa: 'Dentista do Bem',
    necessidade: 'Tratamento de canal · dor aguda',
    especialidadeNecessaria: 'Endodontia',
    severidade: 'Alta',
    diasNaFila: 12,
    origem: { tipo: 'central', detalhe: 'WhatsApp · prioridade Alta 87%' },
    statusVinculacao: 'aguardando',
  },
  {
    id: '2',
    nome: 'Maria Santos',
    iniciais: 'MS',
    idade: 34,
    cidade: 'Recife',
    estado: 'PE',
    cep: '50050-000',
    coords: { lat: -8.0578, lng: -34.8829 },
    programa: 'Apolônias do Bem',
    necessidade: 'Reabilitação completa',
    especialidadeNecessaria: 'Clínico geral',
    severidade: 'Alta',
    diasNaFila: 68,
    origem: { tipo: 'central', detalhe: 'Site · prioridade Alta 79%' },
    statusVinculacao: 'convite-enviado',
  },
  {
    id: '3',
    nome: 'Pedro Souza',
    iniciais: 'PS',
    idade: 16,
    cidade: 'Curitiba',
    estado: 'PR',
    cep: '80060-000',
    coords: { lat: -25.4290, lng: -49.2671 },
    programa: 'Dentista do Bem',
    necessidade: 'Avaliação ortodôntica',
    especialidadeNecessaria: 'Ortodontia',
    severidade: 'Media',
    diasNaFila: 5,
    origem: { tipo: 'escola', detalhe: 'Triagem em E.M. Curitiba' },
    statusVinculacao: 'aguardando',
  },
  {
    id: '4',
    nome: 'Ana Beatriz',
    iniciais: 'AB',
    idade: 27,
    cidade: 'Salvador',
    estado: 'BA',
    cep: '40050-000',
    coords: { lat: -12.9714, lng: -38.5014 },
    programa: 'Apolônias do Bem',
    necessidade: 'Consulta inicial',
    especialidadeNecessaria: 'Clínico geral',
    severidade: 'Media',
    diasNaFila: 22,
    origem: { tipo: 'central', detalhe: 'Instagram · prioridade Média 71%' },
    statusVinculacao: 'aguardando',
  },
  {
    id: '5',
    nome: 'Lucas Pereira',
    iniciais: 'LP',
    idade: 12,
    cidade: 'Belém',
    estado: 'PA',
    cep: '66050-000',
    coords: { lat: -1.4554, lng: -48.4898 },
    programa: 'Dentista do Bem',
    necessidade: 'Avaliação inicial',
    especialidadeNecessaria: 'Clínico geral',
    severidade: 'Baixa',
    diasNaFila: 3,
    origem: { tipo: 'escola', detalhe: 'Triagem em E.M. Belém' },
    statusVinculacao: 'aguardando',
  },
];

const DENTISTAS: Dentista[] = [
  { id: 'd1', nome: 'Dra. Ana Paula Santos',  iniciais: 'AP', especialidade: 'Endodontia',   cidade: 'São Paulo',      estado: 'SP', coords: { lat: -23.5868, lng: -46.6346 }, vinculos: 247, rating: 4.9, slotsDisponiveis: 3 },
  { id: 'd2', nome: 'Dr. Carlos Mendes',      iniciais: 'CM', especialidade: 'Clínico geral', cidade: 'São Paulo',      estado: 'SP', coords: { lat: -23.5670, lng: -46.6918 }, vinculos: 198, rating: 4.8, slotsDisponiveis: 5 },
  { id: 'd3', nome: 'Dra. Fernanda Lima',     iniciais: 'FL', especialidade: 'Endodontia',   cidade: 'São Paulo',      estado: 'SP', coords: { lat: -23.5526, lng: -46.5979 }, vinculos: 221, rating: 4.9, slotsDisponiveis: 1 },
  { id: 'd4', nome: 'Dr. Roberto Alves',      iniciais: 'RA', especialidade: 'Periodontia',  cidade: 'Recife',         estado: 'PE', coords: { lat: -8.1109,  lng: -34.8965 }, vinculos: 156, rating: 4.7, slotsDisponiveis: 4 },
  { id: 'd5', nome: 'Dra. Patricia Oliveira', iniciais: 'PO', especialidade: 'Clínico geral', cidade: 'Recife',         estado: 'PE', coords: { lat: -8.0335,  lng: -34.9056 }, vinculos: 89,  rating: 4.6, slotsDisponiveis: 6 },
  { id: 'd6', nome: 'Dr. Marcos Tavares',     iniciais: 'MT', especialidade: 'Ortodontia',   cidade: 'Curitiba',       estado: 'PR', coords: { lat: -25.4290, lng: -49.2671 }, vinculos: 134, rating: 4.8, slotsDisponiveis: 2 },
];

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
  const [selectedId, setSelectedId]   = useState(PACIENTES_FILA[0].id);
  const [search, setSearch]           = useState('');
  const [filtroPrograma, setPrograma] = useState('Todos');
  const [filtroTempo, setFiltroTempo] = useState('Todos');

  const filtered = PACIENTES_FILA.filter((p) => {
    if (filtroPrograma !== 'Todos' && p.programa !== filtroPrograma) return false;
    if (filtroTempo === 'ate7' && p.diasNaFila > 7) return false;
    if (filtroTempo === '8a30' && (p.diasNaFila < 8 || p.diasNaFila > 30)) return false;
    if (filtroTempo === '30a60' && (p.diasNaFila < 30 || p.diasNaFila > 60)) return false;
    if (filtroTempo === 'mais60' && p.diasNaFila <= 60) return false;
    if (search && !p.nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = PACIENTES_FILA.find((p) => p.id === selectedId) || PACIENTES_FILA[0];

  const dentistasSugeridos = useMemo(() => {
    return DENTISTAS
      .map((d) => ({
        dentista: d,
        match: calcularMatch({
          paciente: { coords: selected.coords, especialidadeNecessaria: selected.especialidadeNecessaria },
          dentista: { coords: d.coords, especialidade: d.especialidade, slotsDisponiveis: d.slotsDisponiveis },
        }),
      }))
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 3);
  }, [selected]);

  return (
    <div className="flex flex-col gap-5 max-w-[1280px]">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Pacientes na fila" value="47" sub="+6 essa semana" />
        <KpiCard label="Tempo médio na fila" value="12 dias" sub="−2d vs mês" subTone="success" />
        <KpiCard label="Vinculações esta semana" value="8" sub="+2 vs semana" subTone="success" />
        <KpiCard label="Fila +60 dias" value="3" valueTone="danger" sub="Risco de evasão" subTone="danger" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-line bg-surface text-ink placeholder:text-subtle focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <select value={filtroPrograma} onChange={(e) => setPrograma(e.target.value)} className="text-sm py-2 px-3 rounded-md border border-line bg-surface text-ink cursor-pointer">
          <option value="Todos">Todos programas</option>
          <option value="Dentista do Bem">Dentista do Bem</option>
          <option value="Apolônias do Bem">Apolônias do Bem</option>
        </select>
        <select value={filtroTempo} onChange={(e) => setFiltroTempo(e.target.value)} className="text-sm py-2 px-3 rounded-md border border-line bg-surface text-ink cursor-pointer">
          <option value="Todos">Tempo na fila</option>
          <option value="ate7">Até 7 dias</option>
          <option value="8a30">8 a 30 dias</option>
          <option value="30a60">30 a 60 dias</option>
          <option value="mais60">+60 dias</option>
        </select>
        <button className="inline-flex items-center gap-1.5 text-sm py-2 px-3 rounded-md bg-ink text-surface hover:opacity-90 transition-opacity ml-auto">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Nova triagem
        </button>
      </div>

      {/* Fila + Matching */}
      <div className="grid grid-cols-12 border border-line rounded-xl overflow-hidden bg-surface min-h-[620px]">

        {/* Lista de pacientes */}
        <div className="col-span-12 lg:col-span-5 border-b lg:border-b-0 lg:border-r border-line overflow-y-auto max-h-[620px]">
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
                  className={`w-full text-left flex gap-3 p-3 border-b border-line transition-colors ${
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
        <div className="col-span-12 lg:col-span-7 p-5 overflow-y-auto max-h-[620px]">

          {/* Header do paciente */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar initials={selected.iniciais} size="md" tone="info" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">{selected.nome}, {selected.idade} anos</p>
              <p className="text-xs text-muted mt-0.5">{selected.programa} · {selected.cidade}-{selected.estado} · CEP {selected.cep}</p>
            </div>
            <SeverityPill severidade={selected.severidade} />
          </div>

          {/* Info card */}
          <div className="bg-surface-soft rounded-lg p-3 mb-4 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-muted">Necessidade</span>
              <span className="font-medium text-ink">{selected.necessidade}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">Origem</span>
              <span className="text-ink text-right">{selected.origem.detalhe}</span>
            </div>
            <div className="flex justify-between py-1">
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
                className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${
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
                  className={`text-xs px-3 py-1.5 rounded-md transition-opacity ${
                    isTop ? 'bg-ink text-surface hover:opacity-90' : 'border border-line text-ink hover:bg-surface-soft'
                  }`}
                >
                  Convidar
                </button>
              </div>
            );
          })}

          <button className="w-full inline-flex items-center justify-center gap-1.5 text-sm py-2 mt-2 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors">
            Ver mais opções
            <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}