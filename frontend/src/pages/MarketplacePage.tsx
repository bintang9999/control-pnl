import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { api } from '../lib/api';

export function MarketplacePage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState('');

  useEffect(() => {
    api.get('/marketplace').then(res => {
      setApps(res.data);
      setLoading(false);
    });
  }, []);

  const handleInstall = async (appId: string) => {
    setInstalling(appId);
    try {
      await api.post('/marketplace/install', { appId });
      alert('Blueprint saved! Check Docker Compose Manager to deploy.');
    } catch (err: any) {
      alert('Failed: ' + err.response?.data?.error);
    } finally {
      setInstalling('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">App Marketplace</h1>
        <p className="text-slate-400 mt-1 text-sm">1-Click install blueprints for your Alpine server.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p className="text-slate-400">Loading...</p> : apps.map(app => (
          <div key={app.id} className="glass-panel p-6 flex flex-col gap-4 group hover:border-blue-500/50 transition-colors">
            <div className="flex items-center gap-4">
              <img src={app.icon} alt={app.name} className="w-12 h-12 rounded-lg bg-white p-1" />
              <div>
                <h3 className="font-semibold text-white">{app.name}</h3>
              </div>
            </div>
            <p className="text-sm text-slate-400 flex-1">{app.description}</p>
            <button 
              onClick={() => handleInstall(app.id)}
              disabled={installing === app.id}
              className="mt-2 w-full bg-slate-800 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {installing === app.id ? <span className="animate-spin text-white">⭮</span> : <Download size={16} />}
              {installing === app.id ? 'Installing...' : 'Get Blueprint'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
