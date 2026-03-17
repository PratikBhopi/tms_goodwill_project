import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell() {
  return (
    <div className="flex h-screen bg-neutral-50 font-sans text-neutral-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50/50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
