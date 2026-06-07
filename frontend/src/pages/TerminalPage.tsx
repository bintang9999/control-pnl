import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { AlertTriangle } from 'lucide-react';
import { socket } from '../lib/socket';
import '@xterm/xterm/css/xterm.css';

export function TerminalPage() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerminal({
      cursorBlink: true,
      theme: {
        background: '#0B1120',
        foreground: '#e2e8f0',
        cursor: '#3B82F6',
        selectionBackground: 'rgba(59, 130, 246, 0.3)',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    
    try {
      const webgl = new WebglAddon();
      term.loadAddon(webgl);
    } catch (e) {
      console.warn('WebGL addon could not be loaded', e);
    }

    fitAddon.fit();
    xtermRef.current = term;

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
      socket.emit('terminal_resize', { cols: term.cols, rows: term.rows });
    };
    window.addEventListener('resize', handleResize);

    term.writeln('\x1b[1;36mInitializing MidoPanel Secure Terminal...\x1b[0m');
    
    socket.emit('terminal_init', { cols: term.cols, rows: term.rows });

    socket.on('terminal_data', (data: string) => {
      setIsConnected(true);
      term.write(data);
    });

    socket.on('terminal_error', (msg: string) => {
      setError(msg);
      term.writeln(`\r\n\x1b[1;31mError: ${msg}\x1b[0m`);
    });

    socket.on('terminal_exit', () => {
      setIsConnected(false);
      term.writeln('\r\n\x1b[1;33mTerminal session closed by server.\x1b[0m');
    });

    term.onData(data => {
      socket.emit('terminal_input', data);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.off('terminal_data');
      socket.off('terminal_error');
      socket.off('terminal_exit');
      term.dispose();
    };
  }, []);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">SSH Terminal</h1>
          <p className="text-slate-400 mt-1 text-sm">Direct shell access to your server</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-sm font-medium text-slate-300">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`}></div>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-4 flex items-start gap-3 text-rose-400">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-rose-300">Security Warning</p>
          <p className="mt-1 opacity-90">You have direct shell access to the host server. Commands executed here run with the privileges of the MidoPanel process. All terminal sessions are audited.</p>
        </div>
      </div>

      <div className="flex-1 glass-panel p-2 overflow-hidden relative group">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"></div>
        <div ref={terminalRef} className="w-full h-full" style={{ padding: '8px' }}></div>
      </div>
    </div>
  );
}
