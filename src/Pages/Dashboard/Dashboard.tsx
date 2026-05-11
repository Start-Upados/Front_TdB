import { useState } from 'react';
import OverviewPage from './pages/OverviewPage';
import OperationsPage from './pages/OperationsPage';
import VolunteersPage from './pages/VolunteersPage';
import SocialImpactPage from './pages/SocialImpactPage';
import GeographyPage from './pages/GeographyPage';
import FinancialPage from './pages/FinancialPage';

export type PageId = 'overview' | 'ops' | 'vol' | 'impact' | 'geo' | 'fin';

const NAV_ITEMS: { id: PageId; label: string }[] = [
  { id: 'overview', label: 'Visão Geral'    },
  { id: 'ops',      label: 'Operação'       },
  { id: 'vol',      label: 'Voluntários'    },
  { id: 'impact',   label: 'Impacto Social' },
  { id: 'geo',      label: 'Geografia'      },
  { id: 'fin',      label: 'Financeiro'     },
];

const PAGE_META: Record<PageId, { title: string; subtitle: string }> = {
  overview: { title: 'Visão Geral',    subtitle: 'Indicadores executivos consolidados'   },
  ops:      { title: 'Operação',       subtitle: 'Agenda, atendimentos e qualidade'      },
  vol:      { title: 'Voluntários',    subtitle: 'Rede de dentistas voluntários'         },
  impact:   { title: 'Impacto Social', subtitle: 'Beneficiários e transformação social'  },
  geo:      { title: 'Geografia',      subtitle: 'Distribuição nacional e cobertura'     },
  fin:      { title: 'Financeiro',     subtitle: 'Doações, custos e empresas parceiras'  },
};

/* Tiny scrollbar override — pode mover para App.css se preferir */
const SCROLLBAR = `
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,212,170,0.18); border-radius: 2px; }
`;

// ─── SIDEBAR ───────────────────────────────────
function Sidebar({ activePage, onNavigate }: { activePage: PageId; onNavigate: (id: PageId) => void }) {
  return (
    <aside className="w-[220px] bg-[#0F2035] border-r border-[rgba(0,212,170,0.1)] flex flex-col shrink-0 overflow-y-auto px-2.5">

      {/* Logo */}
      <div className="px-2 pt-5 pb-4 border-b border-[rgba(0,212,170,0.1)] mb-3">
        <p className="text-[15px] font-bold text-[#00D4AA]">Turma do Bem</p>
        <p className="text-[11px] text-[#3D6A85] mt-0.5">Dashboard Executivo</p>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#00E676]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
          Ao vivo · Abr 2025
        </div>
      </div>

      {/* Label */}
      <p className="text-[9.5px] font-bold text-[#3D6A85] uppercase tracking-[1.1px] px-2 mb-1.5">
        Páginas
      </p>

      {/* Nav */}
      {NAV_ITEMS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-[9px] text-[13px] transition-all outline-none border-none cursor-pointer font-[inherit] mb-0.5
            ${activePage === id
              ? 'bg-[rgba(0,212,170,0.15)] text-[#00D4AA] font-medium'
              : 'bg-transparent text-[#7EB3CE] hover:bg-[#152843] hover:text-[#E8F4FD]'
            }`}
        >
          <span className="w-[5px] h-[5px] rounded-full bg-current shrink-0" />
          {label}
        </button>
      ))}

      {/* Annual goal */}
      <div className="mt-auto pt-4 pb-4 px-2 border-t border-[rgba(0,212,170,0.1)]">
        <p className="text-[10.5px] text-[#3D6A85] mb-1.5">Meta anual 2025</p>
        <p className="text-[22px] font-bold text-[#E8F4FD] leading-none">82%</p>
        <p className="text-[11px] text-[#7EB3CE] mt-1 mb-1.5">254.000 de 310.000</p>
        <div className="h-1 bg-[#0C1B2E] rounded-sm">
          <div className="h-full w-[82%] bg-[#00D4AA] rounded-sm" />
        </div>
      </div>
    </aside>
  );
}

// ─── TOPBAR ────────────────────────────────────
function TopBar({ activePage }: { activePage: PageId }) {
  const { title, subtitle } = PAGE_META[activePage];
  return (
    <div className="px-5 py-3 border-b border-[rgba(0,212,170,0.1)] bg-[rgba(7,17,30,0.85)] backdrop-blur-md flex items-center justify-between shrink-0 sticky top-0 z-50">
      <div>
        <p className="text-[17px] font-bold text-[#E8F4FD]">{title}</p>
        <p className="text-[11px] text-[#3D6A85] mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="bg-[rgba(255,71,87,0.15)] text-[#FF4757] text-[11px] font-semibold px-2.5 py-1 rounded-full">
          3 alertas
        </span>
        <span className="bg-[rgba(0,230,118,0.12)] text-[#00E676] text-[11px] font-semibold px-2.5 py-1 rounded-full">
          Meta 82%
        </span>
        <span className="bg-[#0F2035] border border-[rgba(0,212,170,0.1)] text-[#7EB3CE] text-[12px] px-3 py-1.5 rounded-[9px]">
          Abr 2025
        </span>
      </div>
    </div>
  );
}

// ─── PAGE RENDERER ─────────────────────────────
function renderPage(page: PageId) {
  switch (page) {
    case 'overview': return <OverviewPage />;
    case 'ops':      return <OperationsPage />;
    case 'vol':      return <VolunteersPage />;
    case 'impact':   return <SocialImpactPage />;
    case 'geo':      return <GeographyPage />;
    case 'fin':      return <FinancialPage />;
  }
}

// ─── DASHBOARD ─────────────────────────────────
export default function Dashboard() {
  const [activePage, setActivePage] = useState<PageId>('overview');

  return (
    <div className="flex h-screen overflow-hidden bg-[#07111E] text-[#E8F4FD] text-[13px]">
      <style>{SCROLLBAR}</style>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar activePage={activePage} />
        <div className="flex-1 overflow-y-auto p-5">
          {renderPage(activePage)}
        </div>
      </div>
    </div>
  );
}