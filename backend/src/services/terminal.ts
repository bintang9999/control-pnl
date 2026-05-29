import * as pty from 'node-pty';
import { Socket } from 'socket.io';
import os from 'os';
import { dbRun, dbGet } from '../database';
import { sendTelegramNotification } from './telegram';

// Helper to determine the default shell (prioritize Alpine's /bin/ash as per specs)
const shell = process.env.DEFAULT_SHELL || '/bin/ash';

export const setupTerminalSession = (socket: Socket) => {
  let ptyProcess: pty.IPty | null = null;
  const user = (socket as any).user;

  socket.on('terminal_init', async (config: { cols: number; rows: number }) => {
    try {
      const setting = await dbGet("SELECT value FROM settings WHERE key = 'terminal_enabled'");
      if (setting && setting.value !== 'true') {
        return socket.emit('terminal_error', 'Terminal feature is disabled by administrator');
      }

      if (ptyProcess) {
        ptyProcess.kill();
      }

      // Log the terminal access
      await dbRun('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)', 
        [user?.id, 'terminal_open', `Shell: ${shell}`, socket.handshake.address]);

      sendTelegramNotification(`🚨 <b>MidoPanel Alert</b>\nWeb SSH Terminal session opened by <code>${user?.username || 'unknown'}</code> from IP <code>${socket.handshake.address}</code>`);

      ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: config.cols || 80,
        rows: config.rows || 24,
        cwd: process.env.HOME || '/home/bintang',
        env: process.env as any
      });

      ptyProcess.onData((data) => {
        socket.emit('terminal_data', data);
      });

      ptyProcess.onExit(() => {
        socket.emit('terminal_exit');
        ptyProcess = null;
      });

    } catch (err) {
      console.error('Failed to spawn PTY', err);
      socket.emit('terminal_error', 'Failed to spawn terminal process');
    }
  });

  socket.on('terminal_input', (data: string) => {
    if (ptyProcess) {
      ptyProcess.write(data);
    }
  });

  socket.on('terminal_resize', (size: { cols: number; rows: number }) => {
    if (ptyProcess && size.cols && size.rows) {
      try {
        ptyProcess.resize(size.cols, size.rows);
      } catch (e) {
        console.error('PTY Resize error', e);
      }
    }
  });

  socket.on('disconnect', () => {
    if (ptyProcess) {
      ptyProcess.kill();
      ptyProcess = null;
    }
  });
};
