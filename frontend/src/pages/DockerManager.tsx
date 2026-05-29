import { useEffect, useState } from 'react';
import { Box, Play, Square, RotateCw, Terminal, ScrollText } from 'lucide-react';
import { socket } from '../lib/socket';

interface Container {
  Id: string;
  Names: string[];
  State: string;
  Status: string;
  Image: string;
}

export function DockerManager() {
  const [containers, setContainers] = useState<Container[]>([]);

  useEffect(() => {
    socket.emit('get_containers');

    socket.on('containers_list', (data: Container[]) => {
      setContainers(data);
    });

    const interval = setInterval(() => {
      socket.emit('get_containers');
    }, 5000);

    return () => {
      socket.off('containers_list');
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Docker Containers</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage your isolated environments</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          Deploy Compose
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="p-4 text-sm font-semibold text-slate-300">Name</th>
                <th className="p-4 text-sm font-semibold text-slate-300">Image</th>
                <th className="p-4 text-sm font-semibold text-slate-300">Status</th>
                <th className="p-4 text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {containers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No containers found or loading...
                  </td>
                </tr>
              ) : (
                containers.map((container) => {
                  const isRunning = container.State === 'running';
                  return (
                    <tr key={container.Id} className="border-b border-slate-700/50 hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`}></div>
                          <span className="font-medium text-slate-200">{container.Names[0].replace('/', '')}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {container.Image}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          isRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {container.Status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {!isRunning ? (
                            <button className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors" title="Start">
                              <Play size={16} />
                            </button>
                          ) : (
                            <button className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors" title="Stop">
                              <Square size={16} />
                            </button>
                          )}
                          <button className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="Restart">
                            <RotateCw size={16} />
                          </button>
                          <div className="w-px h-4 bg-slate-700 mx-1"></div>
                          <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors" title="Logs">
                            <ScrollText size={16} />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors" title="Terminal">
                            <Terminal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
