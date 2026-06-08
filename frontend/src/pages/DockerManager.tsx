import { useEffect, useState, useRef } from 'react';
import { Play, Square, RotateCw, Terminal, ScrollText, X, AlertTriangle } from 'lucide-react';
import { socket } from '../lib/socket';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface Container {
  Id: string;
  Names: string[];
  State: string;
  Status: string;
  Image: string;
}

export function DockerManager() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedLogsContainer, setSelectedLogsContainer] = useState<Container | null>(null);
  const [logs, setLogs] = useState<string>('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [selectedTerminalContainer, setSelectedTerminalContainer] = useState<Container | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);

  useEffect(() => {
    socket.emit('get_containers');

    socket.on('containers_list', (data: Container[]) => {
      setContainers(data);
    });

    const interval = setInterval(() => {
      socket.emit('get_containers');
    }, 5000);

    return () => {
      socket.off('containers_list');
      clearInterval(interval);
    };
  }, []);

  // Scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Logs Modal Handlers
  const openLogs = (container: Container) => {
    setLogs('');
    setSelectedLogsContainer(container);
    socket.emit('docker_logs_init', container.Id);
  };

  const closeLogs = () => {
    socket.emit('docker_logs_stop');
    setSelectedLogsContainer(null);
  };

  useEffect(() => {
    socket.on('docker_logs_data', (payload: { id: string, data: string }) => {
      setLogs((prev) => prev + payload.data);
    });
    return () => { socket.off('docker_logs_data'); };
  }, []);

  // Terminal Modal Handlers
  const openTerminal = (container: Container) => {
    setSelectedTerminalContainer(container);
  };

  const closeTerminal = () => {
    socket.emit('docker_terminal_stop');
    setSelectedTerminalContainer(null);
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }
  };

  useEffect(() => {
    if (selectedTerminalContainer && terminalRef.current && !xtermRef.current) {
      const term = new XTerminal({
        cursorBlink: true,
        theme: { background: '#0B1120', foreground: '#e2e8f0' },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();
      xtermRef.current = term;

      const handleResize = () => {
        fitAddon.fit();
        socket.emit('docker_terminal_resize', { cols: term.cols, rows: term.rows });
      };
      window.addEventListener('resize', handleResize);

      socket.emit('docker_terminal_init', { id: selectedTerminalContainer.Id, cols: term.cols, rows: term.rows });

      socket.on('docker_terminal_data', (data: string) => term.write(data));
      socket.on('docker_terminal_error', (msg: string) => term.writeln(`\r\n\x1b[1;31mError: ${msg}\x1b[0m`));

      term.onData(data => socket.emit('docker_terminal_input', data));

      return () => {
        window.removeEventListener('resize', handleResize);
        socket.off('docker_terminal_data');
        socket.off('docker_terminal_error');
      };
    }
  }, [selectedTerminalContainer]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Docker Containers</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage your isolated environments</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          Deploy Compose
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="p-4 text-sm font-semibold text-slate-300">Name</th>
                <th className="p-4 text-sm font-semibold text-slate-300">Image</th>
                <th className="p-4 text-sm font-semibold text-slate-300">Status</th>
                <th className="p-4 text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {containers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No containers found or loading...
                  </td>
                </tr>
              ) : (
                containers.map((container) => {
                  const isRunning = container.State === 'running';
                  return (
                    <tr key={container.Id} className="border-b border-slate-700/50 hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`}></div>
                          <span className="font-medium text-slate-200">{container.Names[0].replace('/', '')}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {container.Image}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          isRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {container.Status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {!isRunning ? (
                            <button className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors" title="Start">
                              <Play size={16} />
                            </button>
                          ) : (
                            <button className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors" title="Stop">
                              <Square size={16} />
                            </button>
                          )}
                          <button className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="Restart">
                            <RotateCw size={16} />
                          </button>
                          <div className="w-px h-4 bg-slate-700 mx-1"></div>
                          <button onClick={() => openLogs(container)} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors" title="Logs">
                            <ScrollText size={16} />
                          </button>
                          <button onClick={() => openTerminal(container)} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors" title="Terminal">
                            <Terminal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs Modal */}
      {selectedLogsContainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[80vh] flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <ScrollText size={18} className="text-blue-400" />
                Logs: {selectedLogsContainer.Names[0].replace('/', '')}
              </h3>
              <button onClick={closeLogs} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-black/50 font-mono text-sm text-slate-300 whitespace-pre-wrap break-all">
              {logs || 'Loading logs...'}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Terminal Modal */}
      {selectedTerminalContainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[85vh] flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <Terminal size={18} className="text-emerald-400" />
                  Terminal: {selectedTerminalContainer.Names[0].replace('/', '')}
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                  <AlertTriangle size={14} /> Root Shell
                </div>
              </div>
              <button onClick={closeTerminal} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 bg-black p-2 overflow-hidden relative">
              <div ref={terminalRef} className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
