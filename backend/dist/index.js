"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const systeminformation_1 = __importDefault(require("systeminformation"));
const dockerode_1 = __importDefault(require("dockerode"));
const os_1 = __importDefault(require("os"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const files_1 = __importDefault(require("./routes/files"));
const services_1 = __importDefault(require("./routes/services"));
const backup_1 = __importDefault(require("./routes/backup"));
const security_1 = __importDefault(require("./routes/security"));
const tailscale_1 = __importDefault(require("./routes/tailscale"));
const settings_1 = __importDefault(require("./routes/settings"));
const compose_1 = __importDefault(require("./routes/compose"));
const health_1 = __importDefault(require("./routes/health"));
const ai_1 = __importDefault(require("./routes/ai"));
const marketplace_1 = __importDefault(require("./routes/marketplace"));
const firewall_1 = __importDefault(require("./routes/firewall"));
const nodes_1 = __importDefault(require("./routes/nodes"));
const proxy_1 = __importDefault(require("./routes/proxy"));
const terminal_1 = require("./services/terminal");
// Ensure DB is initialized
require("./database");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: '*' }
});
exports.io = io;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rate limiters
const loginLimiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 20 });
const apiLimiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/auth/login', loginLimiter);
app.use('/api/', apiLimiter);
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/files', files_1.default);
app.use('/api/services', services_1.default);
app.use('/api/backup', backup_1.default);
app.use('/api/security', security_1.default);
app.use('/api/tailscale', tailscale_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/compose', compose_1.default);
app.use('/api/health', health_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/marketplace', marketplace_1.default);
app.use('/api/firewall', firewall_1.default);
app.use('/api/nodes', nodes_1.default);
app.use('/api/proxy', proxy_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});
// We will add files, services, security routes in subsequent steps
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', os: os_1.default.type(), hostname: os_1.default.hostname() });
});
const docker = new dockerode_1.default({ socketPath: '/var/run/docker.sock' });
// Socket Authentication Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err)
            return next(new Error('Authentication error'));
        socket.user = decoded;
        next();
    });
});
// Socket Connections
io.on('connection', (socket) => {
    console.log('Authorized client connected:', socket.id);
    let monitorInterval;
    const sendStats = async () => {
        try {
            const [cpu, mem, osInfo, net, temp] = await Promise.all([
                systeminformation_1.default.currentLoad(),
                systeminformation_1.default.mem(),
                systeminformation_1.default.osInfo(),
                systeminformation_1.default.networkStats(),
                systeminformation_1.default.cpuTemperature()
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
                    uptime: systeminformation_1.default.time().uptime
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
        }
        catch (err) { }
    };
    monitorInterval = setInterval(sendStats, 2000);
    // Docker events
    socket.on('get_containers', async () => {
        try {
            const containers = await docker.listContainers({ all: true });
            socket.emit('containers_list', containers);
        }
        catch (err) {
            socket.emit('error', 'Failed to fetch containers');
        }
    });
    // Terminal setup
    (0, terminal_1.setupTerminalSession)(socket);
    socket.on('disconnect', () => {
        clearInterval(monitorInterval);
    });
});
server.listen(PORT, () => {
    console.log(`MidoPanel Backend running on port ${PORT}`);
});
