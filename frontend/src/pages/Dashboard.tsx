import { useEffect, useState } from 'react';
import { Activity, Server, Cpu, HardDrive, Network, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { socket } from '../lib/socket';

interface ServerStats {
  cpu: number;
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  os: {
    platform: string;
    distro: string;
    release: string;
    hostname: string;
    uptime: number;
  };
  network: {
    rx: number;
    tx: number;
  } | null;
  cpuTemp?: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [cpuHistory, setCpuHistory] = useState<{ time: string; value: number }[]>([]);

  useEffect(() => {
    socket.on('server_stats', (data: ServerStats) => {
      setStats(data);
      setCpuHistory((prev) => {
        const newHistory = [...prev, { time: new Date().toLocaleTimeString(), value: Math.round(data.cpu) }];
        return newHistory.slice(-20); // Keep last 20 data points
      });
    });

    return () => {
      socket.off('server_stats');
    };
  }, []);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-wide">Server Overview</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium">
          <Activity size={16} className="animate-pulse" />
          Online
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Info Card */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-start justify-between mb-4 relative">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Server className="text-blue-400" size={24} />
            </div>
          </div>
          <div className="relative">
            <p className="text-slate-400 text-sm font-medium">Hostname</p>
            <h3 className="text-xl font-bold text-white mt-1">{stats?.os?.hostname || 'Loading...'}</h3>
            <p className="text-slate-500 text-xs mt-2">{stats?.os?.distro} {stats?.os?.release}</p>
          </div>
        </div>

        {/* Uptime Card */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex items-start justify-between mb-4 relative">
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Clock className="text-purple-400" size={24} />
            </div>
          </div>
          <div className="relative">
            <p className="text-slate-400 text-sm font-medium">System Uptime</p>
            <h3 className="text-xl font-bold text-white mt-1">
              {stats ? formatUptime(stats.os.uptime) : '0d 0h 0m'}
            </h3>
          </div>
        </div>

        {/* Network Card */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-start justify-between mb-4 relative">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Network className="text-emerald-400" size={24} />
            </div>
          </div>
          <div className="relative">
            <p className="text-slate-400 text-sm font-medium">Network Traffic</p>
            <div className="flex items-center gap-4 mt-1">
              <div>
                <p className="text-xs text-slate-500">RX (Download)</p>
                <h3 className="text-lg font-bold text-white">{stats?.network ? formatBytes(stats.network.rx) : '0 B'}/s</h3>
              </div>
              <div>
                <p className="text-xs text-slate-500">TX (Upload)</p>
                <h3 className="text-lg font-bold text-white">{stats?.network ? formatBytes(stats.network.tx) : '0 B'}/s</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage Chart */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Cpu size={18} className="text-blue-400" /> CPU
              </h2>
              <p className="text-sm text-slate-400 mt-1">Load & Temperature</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">
                {stats ? Math.round(stats.cpu) : 0}%
              </div>
              {stats?.cpuTemp !== undefined && stats.cpuTemp > 0 && (
                <div className="text-sm font-medium text-orange-400 mt-1">
                  {stats.cpuTemp.toFixed(1)} °C
                </div>
              )}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuHistory}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#3B82F6' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RAM Usage */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HardDrive size={18} className="text-purple-400" /> Memory Usage
              </h2>
              <p className="text-sm text-slate-400 mt-1">Real-time RAM allocation</p>
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {stats ? Math.round(stats.memory.usagePercent) : 0}%
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            {/* Progress Bar */}
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden mb-6 relative">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 rounded-full"
                style={{ width: `${stats ? stats.memory.usagePercent : 0}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-400 text-sm">Used Memory</p>
                <p className="text-xl font-semibold text-white mt-1">
                  {stats ? formatBytes(stats.memory.used) : '0 GB'}
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-400 text-sm">Free Memory</p>
                <p className="text-xl font-semibold text-white mt-1">
                  {stats ? formatBytes(stats.memory.free) : '0 GB'}
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 col-span-2">
                <p className="text-slate-400 text-sm">Total Memory</p>
                <p className="text-xl font-semibold text-white mt-1">
                  {stats ? formatBytes(stats.memory.total) : '0 GB'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
