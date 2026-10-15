import { useEffect, useState } from 'react';
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
  Pencil,
} from 'lucide-react';

import { carregarAtendimentosReais } from '../services/atendimentos';
import { obterProgressoMeta, EVENTO_META, EVENTO_ATENDIMENTOS } from '../services/meta';

const NAV_ITEMS = [
  { path: 'visao-geral', label: 'Visão geral', icon: LayoutDashboard },
  { path: 'comunicacoes', label: 'Central de canais', icon: MessageSquare },
  { path: 'triagens', label: 'Triagens', icon: UserCheck },
  { path: 'atendimentos', label: 'Atendimentos', icon: CalendarDays },
  { path: 'mutiroes', label: 'Mutirões', icon: Megaphone },
  { path: 'voluntarios', label: 'Voluntários', icon: Users },
  { path: 'financeiro', label: 'Financeiro', icon: Wallet },
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
  const [progresso, setProgresso] = useState(obterProgressoMeta);

  useEffect(() => {
    const atualizar = () => setProgresso(obterProgressoMeta());

    window.addEventListener(EVENTO_META, atualizar);
    window.addEventListener(EVENTO_ATENDIMENTOS, atualizar);
    window.addEventListener('storage', atualizar);   // meta alterada em outra aba

    // Garante dados reais mesmo sem passar pela página Atendimentos
    carregarAtendimentosReais().finally(atualizar);

    return () => {
      window.removeEventListener(EVENTO_META, atualizar);
      window.removeEventListener(EVENTO_ATENDIMENTOS, atualizar);
      window.removeEventListener('storage', atualizar);
    };
  }, []);

  const { meta, realizados, pct, ano } = progresso;

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
            <span className="inline-flex items-center gap-1.5 text-sm md:text-xs text-ink">
              Meta TdB {ano}
              <button
                onClick={() => navigate('/dashboard/configuracoes?aba=preferencias')}
                title="Ajustar meta"
                aria-label="Ajustar meta de atendimentos"
                className="rounded p-0.5 text-subtle transition-colors hover:bg-surface-soft hover:text-ink"
              >
                <Pencil className="h-3 w-3" strokeWidth={2} />
              </button>
            </span>

            <span className="text-sm md:text-xs font-semibold text-ink">
              {pct}%
            </span>
          </div>

          <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-xs text-muted mt-2 leading-relaxed">
            {realizados.toLocaleString('pt-BR')} de {meta.toLocaleString('pt-BR')} atendimentos realizados
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