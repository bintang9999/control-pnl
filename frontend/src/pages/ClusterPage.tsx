import { useState, useEffect } from 'react';
import { Server, Activity, Plus } from 'lucide-react';
import { api } from '../lib/api';

export function ClusterPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      const res = await api.get('/nodes');
      setNodes(res.data);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Cluster Nodes</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage multi-server MidoPanel network.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          <Plus size={16} /> Add Node
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? <p className="text-slate-400">Loading nodes...</p> : nodes.length === 0 ? (
          <div className="glass-panel p-8 text-center col-span-2">
            <Server className="mx-auto text-slate-500 mb-4" size={48} />
            <p className="text-slate-400">No nodes connected. This is the master node.</p>
          </div>
        ) : (
          nodes.map(node => (
            <div key={node.id} className="glass-panel p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${node.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                  <div>
                    <h3 className="font-semibold text-white">{node.name}</h3>
                    <p className="text-xs text-slate-400">{node.ip_address}</p>
                  </div>
                </div>
                <button className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700">Manage</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
