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
  { path: 'visao-geral', label: 'Visão geral', icon: LayoutDashboard },
  { path: 'triagens', label: 'Triagens', icon: UserCheck },
  { path: 'atendimentos', label: 'Atendimentos', icon: CalendarDays },
  { path: 'voluntarios', label: 'Voluntários', icon: Users },
  { path: 'mutiroes', label: 'Mutirões', icon: Megaphone },
  { path: 'financeiro', label: 'Financeiro', icon: Wallet },
  { path: 'comunicacoes', label: 'Central de canais', icon: MessageSquare },
  { path: 'relatorios', label: 'Relatórios e impacto', icon: FileBarChart },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
    isActive
      ? 'bg-brand-soft text-brand font-medium'
      : 'text-muted hover:bg-surface-soft hover:text-ink'
  }`;

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="
      w-[280px]
      md:w-[240px]
      h-screen
      bg-surface
      border-r
      border-line
      flex
      flex-col
      shrink-0
    ">
      {/* HEADER */}
      <div className="px-5 pt-6 pb-5 border-b border-line">
        <p className="text-2xl md:text-lg font-extrabold text-[#CED600] leading-tight">
          Turma do Bem
        </p>

        <p className="text-sm md:text-xs text-muted mt-1">
          Admin Dashboard
        </p>
      </div>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} className={linkClass}>
            <Icon className="w-5 h-5 md:w-4 md:h-4 shrink-0" strokeWidth={2} />
            <span className="text-base md:text-sm">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="border-t border-line">
        {/* META */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm md:text-xs text-muted">
              Meta anual
            </span>

            <span className="text-sm md:text-xs font-semibold text-ink">
              82%
            </span>
          </div>

          <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full"
              style={{ width: '82%' }}
            />
          </div>

          <p className="text-xs text-subtle mt-2 leading-relaxed">
            82.000 de 100.000 atendimentos
          </p>
        </div>

        {/* CONFIG */}
        <div className="px-3 pb-5 pt-3 space-y-1 border-t border-line">
          <NavLink to="configuracoes" className={linkClass}>
            <Settings className="w-5 h-5 md:w-4 md:h-4 shrink-0" strokeWidth={2} />
            <span className="text-base md:text-sm">
              Configurações
            </span>
          </NavLink>

          <button
            onClick={() => {
              localStorage.removeItem('tdb_auth');
              navigate('/login');
            }}
            className="
              w-full
              flex
              items-center
              gap-3
              px-3
              py-3
              rounded-xl
              text-base
              md:text-sm
              text-muted
              hover:bg-danger-soft
              hover:text-danger
              transition-all
            "
          >
            <LogOut className="w-5 h-5 md:w-4 md:h-4 shrink-0" strokeWidth={2} />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}