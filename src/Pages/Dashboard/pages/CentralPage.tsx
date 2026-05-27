import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Sparkles, ChevronDown, Send, ArrowRight, Share2, Archive,
  MessageSquare, Globe, Mail, MessageCircle, Phone,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';
import { PriorityPill, type Prioridade } from '../components/PriorityPill';

type Canal = 'Site' | 'WhatsApp' | 'Email' | 'Instagram' | 'Telefone';

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
      idade:    '13 anos · faixa crítica',
      programa: 'Dentista do Bem · vulnerabilidade',
      canal:    'WhatsApp · urgência típica',
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
    preview: 'Vítima de violência precisa atendimento…',
    mensagem:
      'Boa tarde. Sou Maria, fui vítima de violência doméstica e perdi vários dentes. Estou em Recife e preciso muito de ajuda para voltar a sorrir.',
    data: '1h',
    prioridade: 'Alta',
    score: 0.79,
    featuresUsadas: {
      idade:    '34 anos · faixa adulto',
      programa: 'Apolônias do Bem · vulnerabilidade alta',
      canal:    'Site · solicitação formal',
    },
  },
  {
    id: '3',
    nome: 'Dr. Carlos Melo',
    iniciais: 'CM',
    cidade: 'Belo Horizonte, MG',
    canal: 'Site',
    tipo: 'Voluntário',
    preview: 'Quero me cadastrar como voluntário…',
    mensagem:
      'Sou dentista clínico geral, atuo há 12 anos em BH, e gostaria de fazer parte da rede de voluntários da Turma do Bem. Como faço para iniciar?',
    data: '3h',
    prioridade: 'Media',
    score: 0.68,
    featuresUsadas: {
      programa: 'Voluntariado · cadastro pendente',
      canal:    'Site · solicitação formal',
    },
  },
  {
    id: '4',
    nome: 'Colgate Brasil',
    iniciais: 'CB',
    cidade: 'São Paulo, SP',
    canal: 'Email',
    tipo: 'Doador',
    preview: 'Proposta de ampliar parceria 2026…',
    mensagem:
      'Prezados, gostaríamos de agendar uma reunião para discutir a ampliação de nossa parceria em 2026. Temos interesse em apoiar a expansão do programa Apolônias.',
    data: '5h',
    prioridade: 'Media',
    score: 0.71,
    featuresUsadas: {
      programa: 'Parceria estratégica',
      canal:    'Email · comunicação formal',
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
    preview: 'Dúvida sobre o dia da consulta…',
    mensagem:
      'Oi! Tenho uma consulta marcada, mas não tenho certeza se é amanhã ou semana que vem. Vocês podem me confirmar?',
    data: '7h',
    prioridade: 'Baixa',
    score: 0.82,
    featuresUsadas: {
      idade:    '27 anos · paciente em tratamento',
      canal:    'Instagram · canal informal',
    },
  },
];

const CHANNEL_ICONS: Record<Canal, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Site:      Globe,
  WhatsApp:  MessageSquare,
  Email:     Mail,
  Instagram: MessageCircle,
  Telefone:  Phone,
};

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
    <div className="flex justify-between items-center py-2 text-xs">
      <span className="text-muted">{label}</span>
      <span>
        <span className="font-medium text-ink">{main}</span>
        {detail && (
          <>
            {' · '}
            <span className={tone}>{detail}</span>
          </>
        )}
      </span>
    </div>
  );
}

export default function CentralPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId]         = useState('1');
  const [filterCanal, setFilterCanal]       = useState('Todos');
  const [filterPrioridade, setFilterPrior]  = useState('Todas');
  const [search, setSearch]                 = useState('');

  const filtered = SOLICITACOES.filter((s) => {
    if (filterCanal !== 'Todos' && s.canal !== filterCanal) return false;
    if (filterPrioridade !== 'Todas' && s.prioridade !== filterPrioridade) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.nome.toLowerCase().includes(q) && !s.preview.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selected = SOLICITACOES.find((s) => s.id === selectedId) || SOLICITACOES[0];
  const ChannelIcon = CHANNEL_ICONS[selected.canal];

  return (
    <div className="flex flex-col gap-5 max-w-[1280px]">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Solicitações novas hoje" value="23" sub="+8 vs ontem" />
        <KpiCard
          label="Alta sem resposta +24h"
          value="5"
          valueTone="danger"
          sub="Atenção urgente"
          subTone="danger"
        />
        <KpiCard label="Tempo médio resposta" value="2.4h" sub="−12% vs semana" subTone="success" />
        <KpiCard label="Acurácia ML (30 dias)" value="92%" sub="+3pp com overrides" subTone="success" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar solicitação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-line bg-surface text-ink placeholder:text-subtle focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <select
          value={filterCanal}
          onChange={(e) => setFilterCanal(e.target.value)}
          className="text-sm py-2 px-3 rounded-md border border-line bg-surface text-ink min-w-[140px] cursor-pointer"
        >
          <option value="Todos">Todos canais</option>
          <option value="Site">Site</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Email">Email</option>
          <option value="Instagram">Instagram</option>
          <option value="Telefone">Telefone</option>
        </select>
        <select
          value={filterPrioridade}
          onChange={(e) => setFilterPrior(e.target.value)}
          className="text-sm py-2 px-3 rounded-md border border-line bg-surface text-ink min-w-[140px] cursor-pointer"
        >
          <option value="Todas">Todas prioridades</option>
          <option value="Alta">Alta</option>
          <option value="Media">Média</option>
          <option value="Baixa">Baixa</option>
        </select>
        <button className="inline-flex items-center gap-1.5 text-sm py-2 px-3 rounded-md border border-line bg-surface text-ink hover:bg-surface-soft transition-colors">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Manual
        </button>
      </div>

      {/* Inbox + Detail */}
      <div className="grid grid-cols-12 border border-line rounded-xl overflow-hidden bg-surface min-h-[620px]">

        {/* List */}
        <div className="col-span-12 lg:col-span-5 border-b lg:border-b-0 lg:border-r border-line overflow-y-auto max-h-[620px]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            filtered.map((item) => {
              const ItemChannelIcon = CHANNEL_ICONS[item.canal];
              const isSelected = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left flex gap-3 p-3 border-b border-line transition-colors ${
                    isSelected ? 'bg-brand-soft' : 'hover:bg-surface-soft'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1 min-w-[56px]">
                    <PriorityPill prioridade={item.prioridade} />
                    <span className="text-2xs text-subtle">{Math.round(item.score * 100)}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-ink truncate">{item.nome}</p>
                      <span className="text-2xs text-subtle shrink-0">{item.data}</span>
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">{item.preview}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-2xs text-subtle">
                      <ItemChannelIcon className="w-3 h-3" strokeWidth={2} />
                      <span>{item.canal} · {item.tipo}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail */}
        <div className="col-span-12 lg:col-span-7 p-5 overflow-y-auto max-h-[620px]">

          {/* Contact header */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar initials={selected.iniciais} size="md" tone="info" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">{selected.nome}</p>
              <p className="text-xs text-muted mt-0.5">
                {selected.tipo}
                {selected.idade && ` · ${selected.idade} anos`}
                {selected.cidade && ` · ${selected.cidade}`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xs text-subtle">{selected.data} atrás</p>
              <p className="text-2xs text-subtle flex items-center justify-end gap-1 mt-0.5">
                via {selected.canal} <ChannelIcon className="w-3 h-3" strokeWidth={2} />
              </p>
            </div>
          </div>

          {/* Priority block */}
          <div className="border border-line rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-info" strokeWidth={2} />
                <span className="text-xs text-muted">Classificação por ML</span>
              </div>
              <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-line text-ink hover:bg-surface-soft transition-colors">
                Reclassificar
                <ChevronDown className="w-3 h-3" strokeWidth={2} />
              </button>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <PriorityPill prioridade={selected.prioridade} size="md" />
              <span className="text-sm text-ink">
                {Math.round(selected.score * 100)}% de confiança
              </span>
            </div>
            {selected.featuresUsadas && (
              <>
                <p className="text-2xs text-muted mb-1 tracking-wider">
                  POR QUE ESSA PRIORIDADE
                </p>
                <div className="divide-y divide-line">
                  {selected.featuresUsadas.idade && (
                    <FeatureRow
                      label="Idade"
                      value={selected.featuresUsadas.idade}
                      prioridade={selected.prioridade}
                    />
                  )}
                  {selected.featuresUsadas.programa && (
                    <FeatureRow
                      label="Programa"
                      value={selected.featuresUsadas.programa}
                      prioridade={selected.prioridade}
                    />
                  )}
                  {selected.featuresUsadas.canal && (
                    <FeatureRow
                      label="Canal"
                      value={selected.featuresUsadas.canal}
                      prioridade={selected.prioridade}
                    />
                  )}
                </div>
                </>
            )}
          </div>

          {/* Original message */}
          <div className="mb-3">
            <p className="text-2xs text-muted mb-1.5 tracking-wider">MENSAGEM</p>
            <div className="text-sm leading-relaxed bg-surface-soft rounded-lg p-3 text-ink">
              {selected.mensagem}
            </div>
          </div>

          {/* Reply */}
          <textarea
            placeholder="Digite uma resposta..."
            className="w-full min-h-[70px] text-sm p-2.5 rounded-md border border-line bg-surface text-ink placeholder:text-subtle focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none mb-2.5"
          />

          {/* Actions */}
          <div className="flex gap-1.5 flex-wrap">
            <button className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-ink text-surface hover:opacity-90 transition-opacity">
              <Send className="w-3.5 h-3.5" strokeWidth={2} />
              Responder
            </button>
            <button
              onClick={() => navigate('/dashboard/triagens')}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              Promover a triagem
            </button>
            <button className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors">
              <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
              Encaminhar
            </button>
            <button className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors">
              <Archive className="w-3.5 h-3.5" strokeWidth={2} />
              Arquivar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}