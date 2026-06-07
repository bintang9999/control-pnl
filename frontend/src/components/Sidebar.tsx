import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Box, 
  TerminalSquare, 
  Network,
  FolderOpen,
  Settings,
  Shield,
  Database,
  Package,
  Server,
  Globe
} from 'lucide-react';

const navItems: Array<{ icon: any, label: string, path: string, disabled?: boolean }> = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Box, label: 'Docker Containers', path: '/docker' },
  { icon: Box, label: 'Docker Compose', path: '/compose' },
  { icon: TerminalSquare, label: 'SSH Terminal', path: '/terminal' },
  { icon: FolderOpen, label: 'File Manager', path: '/files' },
  { icon: Package, label: 'App Marketplace', path: '/marketplace' },
  { icon: Shield, label: 'Services', path: '/services' },
  { icon: Globe, label: 'Reverse Proxy', path: '/proxy' },
  { icon: Shield, label: 'Network Firewall', path: '/network' },
  { icon: Server, label: 'Cluster Nodes', path: '/cluster' },
  { icon: Network, label: 'Tailscale', path: '/tailscale' },
  { icon: Database, label: 'Backup System', path: '/backup' },
  { icon: Shield, label: 'Security', path: '/security' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar({ isMobileOpen, setIsMobileOpen }: { isMobileOpen?: boolean, setIsMobileOpen?: (val: boolean) => void }) {
  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileOpen?.(false)}
        />
      )}
      <div className={`w-64 bg-[#0B1120]/95 backdrop-blur-xl border-r border-glassBorder flex flex-col shrink-0 fixed md:relative h-full z-50 transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="h-16 flex items-center px-6 border-b border-glassBorder">
        <div className="flex items-center gap-2 text-xl font-bold text-white tracking-wide">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <span className="text-white">M</span>
          </div>
          MidoPanel
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return item.disabled ? (
            <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 cursor-not-allowed opacity-50">
              <Icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
              <span className="ml-auto text-[10px] uppercase bg-slate-800 px-1.5 py-0.5 rounded">Soon</span>
            </div>
          ) : (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={() => setIsMobileOpen?.(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_20px_rgba(37,99,235,0.1)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      </div>
    </>
  );
}
