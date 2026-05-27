import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  CalendarDays,
  Users,
  Megaphone,
  Wallet,
  MessageSquare,
  FileBarChart,
  Settings,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: 'visao-geral',  label: 'Visão geral',         icon: LayoutDashboard },
  { path: 'triagens',     label: 'Triagens',             icon: UserCheck },
  { path: 'atendimentos', label: 'Atendimentos',         icon: CalendarDays },
  { path: 'voluntarios',  label: 'Voluntários',          icon: Users },
  { path: 'mutiroes',     label: 'Mutirões',             icon: Megaphone },
  { path: 'financeiro',   label: 'Financeiro',           icon: Wallet },
  { path: 'comunicacoes', label: 'Central de canais',    icon: MessageSquare },
  { path: 'relatorios',   label: 'Relatórios e impacto', icon: FileBarChart },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
    isActive
      ? 'bg-brand-soft text-brand font-medium'
      : 'text-muted hover:bg-surface-soft hover:text-ink'
  }`;

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-[240px] bg-surface border-r border-line flex flex-col shrink-0 overflow-y-auto">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-line">
        <p className="text-lg font-semibold text-ink leading-tight">Turma do Bem</p>
        <p className="text-xs text-muted mt-1">Painel do coordenador</p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} className={linkClass}>
            <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: meta + settings + logout */}
      <div className="border-t border-line">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted">Meta anual</span>
            <span className="text-xs font-semibold text-ink">82%</span>
          </div>
          <div className="h-1.5 bg-surface-soft rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full" style={{ width: '82%' }} />
          </div>
          <p className="text-2xs text-subtle mt-2">254.000 de 310.000 atendimentos</p>
        </div>

        <div className="px-3 pb-4 pt-3 space-y-0.5 border-t border-line">
          <NavLink to="configuracoes" className={linkClass}>
            <Settings className="w-4 h-4 shrink-0" strokeWidth={2} />
            Configurações
          </NavLink>
          <button
            onClick={() => {
              localStorage.removeItem('tdb_auth');
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted hover:bg-danger-soft hover:text-danger transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={2} />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}