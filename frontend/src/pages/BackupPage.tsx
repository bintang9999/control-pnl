import { useState, useEffect } from 'react';
import { DatabaseBackup, Download, CheckCircle2, RotateCw } from 'lucide-react';
import { api } from '../lib/api';

interface Backup {
  id: number;
  filename: string;
  size: number;
  status: string;
  created_at: string;
}

export function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/backup/history');
      setBackups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      await api.post('/backup/create');
      await fetchBackups();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Backup System</h1>
          <p className="text-slate-400 mt-1 text-sm">Secure local snapshots of your project</p>
        </div>
        <button 
          onClick={handleCreateBackup}
          disabled={creating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? <RotateCw size={16} className="animate-spin" /> : <DatabaseBackup size={16} />}
          {creating ? 'Creating...' : 'Create Backup'}
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Filename</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Size</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                    No backups found.
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.id} className="border-b border-slate-700/50 hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-slate-200 text-sm font-mono">{backup.filename}</span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {formatBytes(backup.size)}
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(backup.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={12} />
                        Completed
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="Download">
                        <Download size={16} />
                      </button>
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
