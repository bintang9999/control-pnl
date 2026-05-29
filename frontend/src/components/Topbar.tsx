import { Bell, Search, User, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-[#0B1120]/80 backdrop-blur-xl border-b border-glassBorder flex items-center justify-between px-4 lg:px-8 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-400 hover:text-white md:hidden">
          <Menu size={24} />
        </button>
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search resources, containers, or settings..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-full pl-10 pr-4 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="hidden sm:flex flex-col items-end mr-4">
          <div className="text-sm font-medium text-slate-200">
            {time.toLocaleTimeString()}
          </div>
          <div className="text-xs text-slate-500">
            {time.toLocaleDateString()}
          </div>
        </div>

        <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center border border-slate-600 cursor-pointer">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-slate-200">Admin</div>
            <div className="text-xs text-slate-500">Root User</div>
          </div>
        </div>
      </div>
    </header>
  );
}
