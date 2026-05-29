import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { dbQuery, dbRun, dbGet } from '../database';

const execAsync = util.promisify(exec);
const router = express.Router();

const NGINX_DIR = '/home/bintang/midopanel-data/nginx/conf.d';

// Ensure nginx dir exists
fs.mkdir(NGINX_DIR, { recursive: true }).catch(console.error);

const generateNginxConfig = (domain: string, targetHost: string, targetPort: number, sslEnabled: boolean) => {
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
  } catch (error) {
    console.warn('Failed to reload Nginx. It might not be running or installed.', error);
  }
};

const logAction = async (req: AuthRequest, action: string, details: string) => {
  await dbRun('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
    [req.user?.id, action, details, req.ip]);
};

// Get all proxies
router.get('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const proxies = await dbQuery('SELECT * FROM proxies ORDER BY created_at DESC');
    res.json(proxies);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch proxies' });
  }
});

// Create proxy
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { domain, target_host, target_port, ssl_enabled } = req.body;

    if (!domain || !target_host || !target_port) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if domain exists
    const existing = await dbGet('SELECT id FROM proxies WHERE domain = ?', [domain]);
    if (existing) {
      return res.status(400).json({ error: 'Domain already exists in proxy manager' });
    }

    // Write Nginx config
    const configStr = generateNginxConfig(domain, target_host, target_port, ssl_enabled);
    const confPath = path.join(NGINX_DIR, `${domain}.conf`);
    await fs.writeFile(confPath, configStr);

    // Save to DB
    const result = await dbRun(
      'INSERT INTO proxies (domain, target_host, target_port, ssl_enabled) VALUES (?, ?, ?, ?)',
      [domain, target_host, target_port, ssl_enabled ? 1 : 0]
    );

    await reloadNginx();
    await logAction(req, 'proxy_create', `Created proxy for ${domain} -> ${target_host}:${target_port}`);

    res.json({ id: result.lastID, message: 'Proxy created successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create proxy' });
  }
});

// Delete proxy
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const proxy = await dbGet('SELECT * FROM proxies WHERE id = ?', [req.params.id]);
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found' });
    }

    // Delete Nginx config
    const confPath = path.join(NGINX_DIR, `${proxy.domain}.conf`);
    await fs.unlink(confPath).catch(() => {}); // Ignore error if file doesn't exist

    // Delete from DB
    await dbRun('DELETE FROM proxies WHERE id = ?', [req.params.id]);

    await reloadNginx();
    await logAction(req, 'proxy_delete', `Deleted proxy for ${proxy.domain}`);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete proxy' });
  }
});

export default router;
