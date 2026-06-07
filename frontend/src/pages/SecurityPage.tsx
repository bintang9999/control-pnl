import { useState, useEffect } from 'react';
import { Shield, Activity, Key } from 'lucide-react';
import { api } from '../lib/api';

export function SecurityPage() {
  const [ports, setPorts] = useState<string>('');
  const [sessions, setSessions] = useState<string>('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [portsRes, sessionsRes, logsRes] = await Promise.all([
        api.get('/security/ports'),
        api.get('/security/sessions'),
        api.get('/security/audit-logs')
      ]);
      setPorts(portsRes.data.output);
      setSessions(sessionsRes.data.output);
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Security & Audit</h1>
          <p className="text-slate-400 mt-1 text-sm">Monitor system access and active ports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Activity className="text-blue-400" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white">Open Ports (Listen)</h2>
          </div>
          <div className="flex-1 bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre">
            {loading ? 'Scanning ports...' : (ports || 'No output')}
          </div>
        </div>

        <div className="glass-panel p-5 flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Key className="text-purple-400" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white">Active SSH Sessions</h2>
          </div>
          <div className="flex-1 bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre">
            {loading ? 'Fetching sessions...' : (sessions || 'No active sessions')}
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="p-5 border-b border-slate-700/50 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Shield className="text-emerald-400" size={20} />
          </div>
          <h2 className="text-lg font-semibold text-white">Audit Logs</h2>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Time</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">User</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Action</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Details</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Loading logs...</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-200">
                      {log.username || 'System'}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400 max-w-md truncate" title={log.details}>
                      {log.details || '-'}
                    </td>
                    <td className="p-4 text-sm font-mono text-slate-500">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
