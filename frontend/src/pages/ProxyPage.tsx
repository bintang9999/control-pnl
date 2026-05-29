import { useEffect, useState } from 'react';
import { Globe, Plus, Trash2, Shield, ShieldAlert, Link as LinkIcon } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface Proxy {
  id: number;
  domain: string;
  target_host: string;
  target_port: number;
  ssl_enabled: boolean;
  status: string;
  created_at: string;
}

export function ProxyPage() {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    domain: '',
    target_host: '127.0.0.1',
    target_port: 3000,
    ssl_enabled: false
  });

  const fetchProxies = async () => {
    try {
      const res = await api.get('/proxy');
      setProxies(res.data);
    } catch (error) {
      toast.error('Failed to fetch proxies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProxies();
  }, []);

  const handleAddProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/proxy', form);
      toast.success('Proxy created successfully');
      setShowAddForm(false);
      setForm({ domain: '', target_host: '127.0.0.1', target_port: 3000, ssl_enabled: false });
      fetchProxies();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create proxy');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this proxy?')) return;
    try {
      await api.delete(`/proxy/${id}`);
      toast.success('Proxy deleted successfully');
      fetchProxies();
    } catch (error) {
      toast.error('Failed to delete proxy');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            <Globe className="text-blue-500" /> Reverse Proxy
          </h1>
          <p className="text-sm text-slate-400 mt-1">Expose your local services to the internet securely</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          <Plus size={18} /> Add Proxy Host
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel p-6 border border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.1)] relative">
          <button 
            onClick={() => setShowAddForm(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            &times;
          </button>
          <h2 className="text-lg font-bold text-white mb-4">Add New Proxy Host</h2>
          <form onSubmit={handleAddProxy} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Domain Name</label>
                <input 
                  type="text" 
                  value={form.domain}
                  onChange={e => setForm({...form, domain: e.target.value})}
                  placeholder="app.example.com"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Target IP / Host</label>
                  <input 
                    type="text" 
                    value={form.target_host}
                    onChange={e => setForm({...form, target_host: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Target Port</label>
                  <input 
                    type="number" 
                    value={form.target_port}
                    onChange={e => setForm({...form, target_port: parseInt(e.target.value)})}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Shield size={16} className="text-emerald-400" /> Request SSL Certificate
                </h3>
                <p className="text-xs text-slate-400 mt-1">Automatically provision and renew Let's Encrypt certificate</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.ssl_enabled}
                  onChange={e => setForm({...form, ssl_enabled: e.target.checked})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Save & Deploy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Proxies List */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-glassBorder flex items-center justify-between bg-white/5">
          <h2 className="font-semibold text-white">Configured Hosts</h2>
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">{proxies.length} Total</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading configurations...</div>
        ) : proxies.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Globe size={48} className="mb-4 opacity-20" />
            <p>No proxy hosts configured yet.</p>
            <p className="text-sm mt-1">Click "Add Proxy Host" to expose your first app.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 bg-slate-900/50 uppercase border-b border-glassBorder">
                <tr>
                  <th className="px-6 py-3">Domain</th>
                  <th className="px-6 py-3">Destination</th>
                  <th className="px-6 py-3">SSL</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {proxies.map((proxy) => (
                  <tr key={proxy.id} className="border-b border-glassBorder/50 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <LinkIcon size={14} className="text-blue-400" />
                      <a href={`http${proxy.ssl_enabled ? 's' : ''}://${proxy.domain}`} target="_blank" rel="noreferrer" className="hover:underline">
                        {proxy.domain}
                      </a>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      http://{proxy.target_host}:{proxy.target_port}
                    </td>
                    <td className="px-6 py-4">
                      {proxy.ssl_enabled ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                          <Shield size={12} /> Auto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">
                          <ShieldAlert size={12} /> None
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(proxy.id)}
                        className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors"
                        title="Delete Proxy"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
        <Globe className="text-blue-400 shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-blue-200/80">
          <p className="font-semibold text-blue-300 mb-1">How it works</p>
          <p>MidoPanel automatically generates Nginx config files at <code className="bg-slate-900 px-1.5 py-0.5 rounded text-blue-300">~/midopanel-data/nginx/conf.d</code>. You must run an Nginx container mounted to this directory to serve traffic.</p>
        </div>
      </div>
    </div>
  );
}
