import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import si from 'systeminformation';
import Docker from 'dockerode';
import os from 'os';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import serviceRoutes from './routes/services';
import backupRoutes from './routes/backup';
import securityRoutes from './routes/security';
import tailscaleRoutes from './routes/tailscale';
import settingsRoutes from './routes/settings';
import composeRoutes from './routes/compose';
import healthRoutes from './routes/health';
import aiRoutes from './routes/ai';
import marketplaceRoutes from './routes/marketplace';
import firewallRoutes from './routes/firewall';
import nodesRoutes from './routes/nodes';
import proxyRoutes from './routes/proxy';
import { setupTerminalSession } from './services/terminal';

// Ensure DB is initialized
import './database'; 

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rate limiters
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

app.use('/api/auth/login', loginLimiter);
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/tailscale', tailscaleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/compose', composeRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/firewall', firewallRoutes);
app.use('/api/nodes', nodesRoutes);
app.use('/api/proxy', proxyRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Export IO so services can use it
export { io };

// We will add files, services, security routes in subsequent steps
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', os: os.type(), hostname: os.hostname() });
});

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Socket Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return next(new Error('Authentication error'));
    (socket as any).user = decoded;
    next();
  });
});

// Socket Connections
io.on('connection', (socket) => {
  console.log('Authorized client connected:', socket.id);

  let monitorInterval: NodeJS.Timeout;

  const sendStats = async () => {
    try {
      const [cpu, mem, osInfo, net, temp] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.osInfo(),
        si.networkStats(),
        si.cpuTemperature()
      ]);
      socket.emit('server_stats', {
        cpu: cpu.currentLoad,
        memory: {
          total: mem.total,
          used: mem.active,
          free: mem.free,
          usagePercent: (mem.active / mem.total) * 100
        },
        os: {
          platform: osInfo.platform,
          distro: osInfo.distro,
          release: osInfo.release,
          hostname: osInfo.hostname,
          uptime: si.time().uptime
        },
        network: net.length > 0 ? { rx: net[0].rx_sec, tx: net[0].tx_sec } : null,
        cpuTemp: temp.main
      });

      // Threshold Alerts
      if (cpu.currentLoad > 90) {
        socket.emit('system_alert', { title: 'High CPU Usage', message: `CPU load is at ${cpu.currentLoad.toFixed(1)}%`, type: 'warning' });
      }
      const memUsage = (mem.active / mem.total) * 100;
      if (memUsage > 90) {
        socket.emit('system_alert', { title: 'High RAM Usage', message: `Memory usage is at ${memUsage.toFixed(1)}%`, type: 'warning' });
      }
    } catch (err) { }
  };

  monitorInterval = setInterval(sendStats, 2000);

  // Docker events
  socket.on('get_containers', async () => {
    try {
      const containers = await docker.listContainers({ all: true });
      socket.emit('containers_list', containers);
    } catch (err) {
      socket.emit('error', 'Failed to fetch containers');
    }
  });

  // Docker Logs
  socket.on('docker_logs_init', async (containerId: string) => {
    try {
      const container = docker.getContainer(containerId);
      const logStream = await container.logs({ follow: true, stdout: true, stderr: true, tail: 100 });
      
      const onData = (chunk: Buffer) => {
        // Dockerode returns multiplexed streams if tty is false, but stringifying mostly works.
        socket.emit('docker_logs_data', { id: containerId, data: chunk.toString('utf8') });
      };
      logStream.on('data', onData);

      const cleanupLogs = () => {
        if (logStream) {
          logStream.off('data', onData);
          logStream.destroy();
        }
      };

      socket.once('docker_logs_stop', cleanupLogs);
      socket.once('disconnect', cleanupLogs);
    } catch (err: any) {
      socket.emit('docker_logs_error', err.message);
    }
  });

  // Docker Terminal
  socket.on('docker_terminal_init', async (config: { id: string, cols: number, rows: number }) => {
    try {
      const container = docker.getContainer(config.id);
      const exec = await container.exec({
        Cmd: ['/bin/sh', '-c', 'bash || sh'],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true
      });

      const stream = await exec.start({ hijack: true, stdin: true });

      if (config.cols && config.rows) {
        await exec.resize({ w: config.cols, h: config.rows });
      }

      const onData = (chunk: Buffer) => {
        socket.emit('docker_terminal_data', chunk.toString('utf8'));
      };
      stream.on('data', onData);

      const inputHandler = (data: string) => {
        stream.write(data);
      };
      
      const resizeHandler = (size: { cols: number; rows: number }) => {
        exec.resize({ w: size.cols, h: size.rows }).catch(() => {});
      };

      socket.on('docker_terminal_input', inputHandler);
      socket.on('docker_terminal_resize', resizeHandler);

      const cleanupTerminal = () => {
        socket.off('docker_terminal_input', inputHandler);
        socket.off('docker_terminal_resize', resizeHandler);
        stream.end();
      };

      socket.once('docker_terminal_stop', cleanupTerminal);
      socket.once('disconnect', cleanupTerminal);
    } catch (err: any) {
      socket.emit('docker_terminal_error', err.message);
    }
  });

  // Terminal setup
  setupTerminalSession(socket);

  socket.on('disconnect', () => {
    clearInterval(monitorInterval);
  });
});

server.listen(PORT, () => {
  console.log(`MidoPanel Backend running on port ${PORT}`);
});
