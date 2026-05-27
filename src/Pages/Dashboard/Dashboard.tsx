import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Dashboard/components/Sidebar';
import { TopBar } from '../Dashboard/components/Topbar';

export default function Dashboard() {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink text-sm">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-canvas p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}