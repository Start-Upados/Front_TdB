import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  'visao-geral': {
    title: 'Visão geral',
    subtitle: 'O que precisa da sua atenção hoje',
  },
  'triagens': {
    title: 'Triagens e vinculações',
    subtitle: 'Fila de pacientes e matching com voluntários',
  },
  'atendimentos': {
    title: 'Atendimentos',
    subtitle: 'Agenda da semana e histórico',
  },
  'voluntarios': {
    title: 'Voluntários',
    subtitle: 'Rede de dentistas e aprovações pendentes',
  },
  'mutiroes': {
    title: 'Mutirões',
    subtitle: 'Eventos planejados e resultados',
  },
  'financeiro': {
    title: 'Financeiro',
    subtitle: 'Doações, parcerias e custos operacionais',
  },
  'comunicacoes': {
    title: 'Central de canais',
    subtitle: 'Inbox multicanal com classificação automática',
  },
  'relatorios': {
    title: 'Relatórios e impacto',
    subtitle: 'Gerador de PDF e indicadores ODS',
  },
  'configuracoes': {
    title: 'Configurações',
    subtitle: 'Equipe, permissões e integrações',
  },
};

export function TopBar() {
  const { pathname } = useLocation();

  const segment = pathname.split('/').pop() || 'visao-geral';

  const meta = PAGE_META[segment] || PAGE_META['visao-geral'];

  return (
    <header
      className="
        border-b
        border-line
        bg-surface
        px-4
        md:px-6
        py-4
        shrink-0
      "
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        {/* TÍTULOS */}
        <div className="min-w-0">
          <h1 className="text-xl md:text-base font-semibold text-ink leading-tight">
            {meta.title}
          </h1>

          <p className="text-sm md:text-xs text-muted mt-1 max-w-full md:max-w-none">
            {meta.subtitle}
          </p>
        </div>

        {/* AÇÕES */}
        <div className="flex items-center gap-3 w-full md:w-auto">

          {/* SEARCH */}
          <div className="relative flex-1 md:flex-none">
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
              placeholder="Buscar..."
              className="
                w-full
                md:w-48
                text-sm
                pl-10
                pr-3
                py-2
                rounded-xl
                border
                border-line
                bg-surface-soft
                text-ink
                placeholder:text-subtle
                focus:outline-none
                focus:border-brand
                focus:ring-1
                focus:ring-brand
              "
            />
          </div>

          {/* NOTIFICAÇÃO */}
          <button
            className="
              p-2.5
              rounded-xl
              text-muted
              hover:bg-surface-soft
              hover:text-ink
              transition-colors
              relative
              shrink-0
            "
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5 md:w-4 md:h-4" strokeWidth={2} />

            <span
              className="
                absolute
                top-2
                right-2
                w-2
                h-2
                rounded-full
                bg-danger
              "
            />
          </button>
        </div>
      </div>
    </header>
  );
}