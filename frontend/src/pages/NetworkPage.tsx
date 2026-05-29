import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';

export function NetworkPage() {
  const [rules, setRules] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await api.get('/firewall/rules');
      setRules(res.data.rules);
    } catch (e: any) {
      setRules(e.response?.data?.error || 'Failed to load rules.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Network & Firewall</h1>
        <p className="text-slate-400 mt-1 text-sm">Manage iptables rules (Advanced)</p>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-blue-400" size={24} />
          <h2 className="text-lg font-medium text-slate-200">Current iptables Rules</h2>
        </div>
        
        {loading ? (
           <div className="animate-pulse h-40 bg-slate-800/50 rounded-lg"></div>
        ) : (
          <pre className="bg-slate-900/80 p-4 rounded-xl text-sm font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap border border-slate-700/50">
            {rules}
          </pre>
        )}
      </div>
    </div>
  );
}
