"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const auth_1 = require("../middleware/auth");
const database_1 = require("../database");
const execAsync = util_1.default.promisify(child_process_1.exec);
const router = express_1.default.Router();
const NGINX_DIR = '/home/bintang/midopanel-data/nginx/conf.d';
// Ensure nginx dir exists
promises_1.default.mkdir(NGINX_DIR, { recursive: true }).catch(console.error);
const generateNginxConfig = (domain, targetHost, targetPort, sslEnabled) => {
    // Simple Nginx proxy block
    let config = `server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://${targetHost}:${targetPort};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
    return config;
};
const reloadNginx = async () => {
    try {
        // We assume Nginx is running as a Docker container named 'nginx'
        await execAsync('docker exec nginx nginx -s reload');
    }
    catch (error) {
        console.warn('Failed to reload Nginx. It might not be running or installed.', error);
    }
};
const logAction = async (req, action, details) => {
    await (0, database_1.dbRun)('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)', [req.user?.id, action, details, req.ip]);
};
// Get all proxies
router.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const proxies = await (0, database_1.dbQuery)('SELECT * FROM proxies ORDER BY created_at DESC');
        res.json(proxies);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch proxies' });
    }
});
// Create proxy
router.post('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const { domain, target_host, target_port, ssl_enabled } = req.body;
        if (!domain || !target_host || !target_port) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Check if domain exists
        const existing = await (0, database_1.dbGet)('SELECT id FROM proxies WHERE domain = ?', [domain]);
        if (existing) {
            return res.status(400).json({ error: 'Domain already exists in proxy manager' });
        }
        // Write Nginx config
        const configStr = generateNginxConfig(domain, target_host, target_port, ssl_enabled);
        const confPath = path_1.default.join(NGINX_DIR, `${domain}.conf`);
        await promises_1.default.writeFile(confPath, configStr);
        // Save to DB
        const result = await (0, database_1.dbRun)('INSERT INTO proxies (domain, target_host, target_port, ssl_enabled) VALUES (?, ?, ?, ?)', [domain, target_host, target_port, ssl_enabled ? 1 : 0]);
        await reloadNginx();
        await logAction(req, 'proxy_create', `Created proxy for ${domain} -> ${target_host}:${target_port}`);
        res.json({ id: result.lastID, message: 'Proxy created successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create proxy' });
    }
});
// Delete proxy
router.delete('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const proxy = await (0, database_1.dbGet)('SELECT * FROM proxies WHERE id = ?', [req.params.id]);
        if (!proxy) {
            return res.status(404).json({ error: 'Proxy not found' });
        }
        // Delete Nginx config
        const confPath = path_1.default.join(NGINX_DIR, `${proxy.domain}.conf`);
        await promises_1.default.unlink(confPath).catch(() => { }); // Ignore error if file doesn't exist
        // Delete from DB
        await (0, database_1.dbRun)('DELETE FROM proxies WHERE id = ?', [req.params.id]);
        await reloadNginx();
        await logAction(req, 'proxy_delete', `Deleted proxy for ${proxy.domain}`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete proxy' });
    }
});
exports.default = router;
