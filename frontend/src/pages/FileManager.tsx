import { useState, useEffect } from 'react';
import { Folder, FileText, Upload, Download, Edit3, Trash2, FolderPlus, ArrowLeft, X, Save } from 'lucide-react';
import { api } from '../lib/api';

interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number;
  mtime: string;
}

export function FileManager() {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchFiles = async (path: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/files/list?path=${encodeURIComponent(path)}`);
      setFiles(res.data);
      setCurrentPath(path);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(currentPath);
  }, []);

  const handleNavigate = (folderName: string) => {
    const newPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
    fetchFiles(newPath);
  };

  const handleNavigateUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/');
    parts.pop();
    const newPath = parts.join('/') || '/';
    fetchFiles(newPath);
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;
    const targetPath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
    try {
      await api.delete(`/files/delete?path=${encodeURIComponent(targetPath)}`);
      fetchFiles(currentPath);
    } catch (err: any) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = async (fileName: string) => {
    const targetPath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
    try {
      const res = await api.get(`/files/read?path=${encodeURIComponent(targetPath)}`);
      setEditingFile({ path: targetPath, content: res.data.content });
    } catch (err: any) {
      alert('Read failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return;
    setSaving(true);
    try {
      await api.put('/files/edit', { filePath: editingFile.path, content: editingFile.content });
      setEditingFile(null);
      fetchFiles(currentPath);
    } catch (err: any) {
      alert('Save failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = (fileName: string) => {
    const targetPath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/files/download?path=${encodeURIComponent(targetPath)}`, '_blank');
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
          <h1 className="text-2xl font-bold text-white tracking-wide">File Manager</h1>
          <p className="text-slate-400 mt-1 text-sm">Safe mode: /home/bintang</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <FolderPlus size={16} /> New Folder
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <Upload size={16} /> Upload
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden flex flex-col">
        <div className="p-3 border-b border-slate-700/50 bg-slate-800/30 flex items-center gap-3">
          <button 
            onClick={handleNavigateUp}
            disabled={currentPath === '/'}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-sm font-mono text-slate-300 flex-1 truncate">
            /home/bintang{currentPath === '/' ? '' : currentPath}
          </div>
        </div>

        {error && (
          <div className="p-4 m-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">Size</th>
                  <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-48">Modified</th>
                  <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, idx) => (
                  <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/20 transition-colors group">
                    <td className="p-3">
                      <div 
                        className={`flex items-center gap-3 ${file.isDirectory ? 'cursor-pointer hover:text-blue-400' : ''}`}
                        onClick={() => file.isDirectory && handleNavigate(file.name)}
                      >
                        {file.isDirectory ? (
                          <Folder size={18} className="text-blue-400" />
                        ) : (
                          <FileText size={18} className="text-slate-400" />
                        )}
                        <span className="font-medium text-slate-200 text-sm truncate">{file.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-slate-400">
                      {file.isDirectory ? '--' : formatBytes(file.size)}
                    </td>
                    <td className="p-3 text-sm text-slate-400">
                      {new Date(file.mtime).toLocaleDateString()} {new Date(file.mtime).toLocaleTimeString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!file.isDirectory && (
                          <>
                            <button onClick={() => handleDownload(file.name)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="Download">
                              <Download size={14} />
                            </button>
                            <button onClick={() => handleEdit(file.name)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors" title="Edit">
                              <Edit3 size={14} />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(file.name)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {files.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 text-sm">
                      This folder is empty
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700/50 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Edit3 size={18} className="text-blue-400" />
                Editing: {editingFile.path}
              </h3>
              <button onClick={() => setEditingFile(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-0 relative">
              <textarea
                value={editingFile.content}
                onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                className="w-full h-full p-4 bg-[#0f172a] text-slate-300 font-mono text-sm resize-none focus:outline-none focus:ring-inset focus:ring-1 focus:ring-blue-500/50"
                spellCheck={false}
              />
            </div>
            <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex justify-end gap-3">
              <button 
                onClick={() => setEditingFile(null)}
                className="px-4 py-2 text-slate-300 hover:text-white font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50"
              >
                {saving ? <span className="animate-spin">⭮</span> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
