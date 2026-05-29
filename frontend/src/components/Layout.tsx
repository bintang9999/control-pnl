import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AIAssistant } from './AIAssistant';
import { socket } from '../lib/socket';
import { useAuthStore } from '../store/auth';

export function Layout() {
  const token = useAuthStore(state => state.token);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (token) {
      socket.connect();
    }
    return () => {
      socket.disconnect();
    };
  }, [token]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8" onClick={() => setIsMobileOpen(false)}>
          <Outlet />
        </main>
      </div>
      <AIAssistant />
    </div>
  );
}
