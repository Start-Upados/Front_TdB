import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Dashboard/components/Sidebar';
import { TopBar } from '../Dashboard/components/Topbar';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <div className="flex items-center justify-between p-4 border-b md:hidden bg-black">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={28} />
          </button>

          <h1 className="font-semibold text-white">
            Turma do Bem
          </h1>
        </div>

        <TopBar />

        <main className="flex-1 overflow-y-auto bg-canvas p-3 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}