import { useState, useEffect } from 'react';
import { Box, Play, Square, FileText, Upload, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

export function DockerComposePage() {
  const [status, setStatus] = useState({ hasFile: false, isRunning: false });
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/compose/status');
      setStatus(res.data);
      if (res.data.hasFile) {
        fetchLogs();
      }
    } catch (err) {
      toast.error('Failed to fetch compose status');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/compose/logs');
      setLogs(res.data.output);
    } catch (err) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    
    setActionLoading(true);
    try {
      await api.post('/compose/deploy', formData);
      toast.success('Compose stack deployed successfully');
      fetchStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to deploy compose stack');
    } finally {
      setActionLoading(false);
      e.target.value = '';
    }
  };

  const handleAction = async (action: 'deploy' | 'stop') => {
    setActionLoading(true);
    try {
      await api.post(`/compose/${action}`);
      toast.success(`Compose stack ${action === 'deploy' ? 'started' : 'stopped'} successfully`);
      fetchStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${action} compose stack`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Docker Compose</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage multi-container applications</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchStatus} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Box className="text-blue-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Stack Status</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${status.isRunning ? 'bg-emerald-500' : (status.hasFile ? 'bg-amber-500' : 'bg-slate-500')}`}></div>
                  <span className="text-xs text-slate-400">
                    {status.isRunning ? 'Running' : (status.hasFile ? 'Stopped' : 'No stack found')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {status.hasFile ? (
                <>
                  <button 
                    onClick={() => handleAction('deploy')}
                    disabled={status.isRunning || actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    <Play size={16} /> Start Stack
                  </button>
                  <button 
                    onClick={() => handleAction('stop')}
                    disabled={!status.isRunning || actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium border border-rose-500/20 transition-colors disabled:opacity-50"
                  >
                    <Square size={16} /> Stop Stack
                  </button>
                </>
              ) : null}

              <div className="pt-3 border-t border-slate-700/50 mt-4">
                <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                  <Upload size={16} /> 
                  <span>{status.hasFile ? 'Update docker-compose.yml' : 'Upload docker-compose.yml'}</span>
                  <input type="file" accept=".yml,.yaml" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-panel h-full flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
              <FileText className="text-slate-400" size={18} />
              <h2 className="text-lg font-semibold text-white">Stack Logs</h2>
            </div>
            <div className="flex-1 bg-slate-900/80 p-4 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre">
              {!status.hasFile ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Box size={32} className="opacity-20" />
                  <p>Upload a docker-compose.yml to see logs</p>
                </div>
              ) : (
                logs || 'No logs available'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
