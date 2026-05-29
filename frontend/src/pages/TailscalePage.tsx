import { useState, useEffect } from 'react';
import { Network, Server, Share2, Globe2 } from 'lucide-react';
import { api } from '../lib/api';

export function TailscalePage() {
  const [status, setStatus] = useState<any>(null);
  
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/tailscale/status');
        setStatus(res.data);
      } catch (err) {
        console.error('Failed to fetch tailscale status', err);
      }
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Tailscale Network</h1>
          <p className="text-slate-400 mt-1 text-sm">Secure mesh VPN status and routing</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium">
          <Network size={16} />
          {status?.BackendState || 'Checking...'}
        </div>
      </div>

      {status && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-5 relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                   <Server className="text-blue-400" size={24} />
                 </div>
                 <div>
                   <p className="text-slate-400 text-sm">Tailscale IPv4</p>
                   <p className="text-xl font-bold text-white mt-1 font-mono">{status.TailscaleIPs[0]}</p>
                 </div>
               </div>
            </div>
            
            <div className="glass-panel p-5 relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                   <Globe2 className="text-purple-400" size={24} />
                 </div>
                 <div>
                   <p className="text-slate-400 text-sm">Machine Name</p>
                   <p className="text-xl font-bold text-white mt-1">{status.Self.HostName}</p>
                 </div>
               </div>
            </div>
          </div>

          <div className="glass-panel mt-6">
            <div className="p-4 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white">Network Peers</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {Object.values(status.Peers || {}).map((peer: any, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${peer.Online ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                      <div>
                        <p className="text-white font-medium">{peer.HostName}</p>
                        <p className="text-slate-400 text-xs">{peer.OS}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-300 font-mono text-sm">{peer.TailscaleIPs[0]}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{peer.Online ? 'Connected' : 'Offline'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
