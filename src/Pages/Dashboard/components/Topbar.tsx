import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  'visao-geral':   { title: 'Visão geral',          subtitle: 'O que precisa da sua atenção hoje' },
  'triagens':      { title: 'Triagens e vinculações', subtitle: 'Fila de pacientes e matching com voluntários' },
  'atendimentos':  { title: 'Atendimentos',          subtitle: 'Agenda da semana e histórico' },
  'voluntarios':   { title: 'Voluntários',           subtitle: 'Rede de dentistas e aprovações pendentes' },
  'mutiroes':      { title: 'Mutirões',              subtitle: 'Eventos planejados e resultados' },
  'financeiro':    { title: 'Financeiro',            subtitle: 'Doações, parcerias e custos operacionais' },
  'comunicacoes':  { title: 'Central de canais',     subtitle: 'Inbox multicanal com classificação automática' },
  'relatorios':    { title: 'Relatórios e impacto',  subtitle: 'Gerador de PDF e indicadores ODS' },
  'configuracoes': { title: 'Configurações',         subtitle: 'Equipe, permissões e integrações' },
};

export function TopBar() {
  const { pathname } = useLocation();
  const segment = pathname.split('/').pop() || 'visao-geral';
  const meta = PAGE_META[segment] || PAGE_META['visao-geral'];

  return (
    <header className="border-b border-line bg-surface px-6 py-3.5 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-base font-semibold text-ink leading-tight">{meta.title}</h1>
        <p className="text-xs text-muted mt-0.5">{meta.subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle" strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar..."
            className="text-sm pl-8 pr-3 py-1.5 rounded-md border border-line bg-surface-soft text-ink placeholder:text-subtle focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand w-48"
          />
        </div>
        <button className="p-2 rounded-md text-muted hover:bg-surface-soft hover:text-ink transition-colors relative" aria-label="Notificações">
          <Bell className="w-4 h-4" strokeWidth={2} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-danger" />
        </button>
      </div>
    </header>
  );
}