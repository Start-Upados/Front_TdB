import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Dashboard/components/Sidebar';
import { TopBar } from '../Dashboard/components/Topbar';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Toaster } from 'sonner';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dark mode só vale dentro do dashboard.
  // Aplica ao montar, remove ao desmontar (quando o usuário sai pra home, login, etc).
  useEffect(() => {
    const tema = localStorage.getItem('tdb_tema');
    if (tema === 'escuro') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <div className="flex h-screen bg-canvas text-white text-sm overflow-hidden">
      
      {/* SIDEBAR DESKTOP */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* SIDEBAR MOBILE */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Menu */}
          <div className="fixed left-0 top-0 h-full z-50 md:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* CONTEÚDO */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* TOPO MOBILE */}
        <div className="flex items-center justify-between p-4 border-b md:hidden bg-white">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={28} className='text-[#E88407]' />
          </button>

          <h1 className="font-extrabold text-[#CED600]">
            Turma do Bem
          </h1>
        </div>

        <TopBar />

        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'rgb(var(--surface))',
              color: 'rgb(var(--ink))',
              border: '1px solid rgb(var(--line))',
            },
          }}
        />

        <main className="flex-1 overflow-y-auto bg-canvas p-3 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}