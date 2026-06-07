import { useState, useEffect } from 'react';
import { Play, Square, RotateCw, Settings2 } from 'lucide-react';
import { api } from '../lib/api';

interface Service {
  service: string;
  isRunning: boolean;
}

export function ServiceManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/services/list');
      setServices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAction = async (service: string, action: string) => {
    setActionLoading(`${service}-${action}`);
    try {
      await api.post('/services/action', { service, action });
      await fetchServices();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">System Services</h1>
          <p className="text-slate-400 mt-1 text-sm">OpenRC Daemon Management (Whitelisted)</p>
        </div>
        <button onClick={fetchServices} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-colors">
          <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((svc) => (
          <div key={svc.service} className="glass-panel p-5 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-all ${
              svc.isRunning ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-slate-500/10'
            }`}></div>
            
            <div className="flex items-start justify-between relative">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${
                  svc.isRunning ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  <Settings2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{svc.service}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${svc.isRunning ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    <span className="text-xs text-slate-400">{svc.isRunning ? 'Running' : 'Stopped'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6 relative z-10">
              <button 
                disabled={svc.isRunning || actionLoading !== null}
                onClick={() => handleAction(svc.service, 'start')}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium border border-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === `${svc.service}-start` ? <RotateCw size={14} className="animate-spin" /> : <Play size={14} />} Start
              </button>
              
              <button 
                disabled={!svc.isRunning || actionLoading !== null}
                onClick={() => handleAction(svc.service, 'stop')}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium border border-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === `${svc.service}-stop` ? <RotateCw size={14} className="animate-spin" /> : <Square size={14} />} Stop
              </button>

              <button 
                disabled={!svc.isRunning || actionLoading !== null}
                onClick={() => handleAction(svc.service, 'restart')}
                className="flex-none p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Restart"
              >
                <RotateCw size={16} className={actionLoading === `${svc.service}-restart` ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
