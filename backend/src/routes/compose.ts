import express from 'express';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { dbRun, dbQuery } from '../database';

const execAsync = util.promisify(exec);
const router = express.Router();

const COMPOSE_DIR = '/home/bintang/midopanel-compose';
const upload = multer({ storage: multer.memoryStorage() });

// Ensure compose dir exists
fs.mkdir(COMPOSE_DIR, { recursive: true }).catch(console.error);

const logAction = async (req: AuthRequest, action: string, details: string) => {
  await dbRun('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
    [req.user?.id, action, details, req.ip]);
};

// Get compose status and history
router.get('/status', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const hasFile = await fs.access(path.join(COMPOSE_DIR, 'docker-compose.yml')).then(() => true).catch(() => false);
    
    let isRunning = false;
    if (hasFile) {
      try {
        const { stdout } = await execAsync(`docker compose ls --format json`, { cwd: COMPOSE_DIR });
        // Very basic check, docker compose ls outputs json array
        isRunning = stdout.includes('running') || stdout.includes(path.basename(COMPOSE_DIR));
      } catch (e) {
        isRunning = false;
      }
    }

    res.json({ hasFile, isRunning });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch compose status' });
  }
});

// Upload and Deploy
router.post('/deploy', requireAdmin, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (req.file) {
      // User uploaded a new compose file
      await fs.writeFile(path.join(COMPOSE_DIR, 'docker-compose.yml'), req.file.buffer);
      await logAction(req, 'compose_upload', 'Uploaded new docker-compose.yml');
    }

    // Deploy
    const { stdout, stderr } = await execAsync(`docker compose up -d`, { cwd: COMPOSE_DIR });
    await logAction(req, 'compose_deploy', 'Deployed docker compose stack');
    
    res.json({ success: true, output: stdout || stderr });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to deploy compose' });
  }
});

// Stop
router.post('/stop', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { stdout, stderr } = await execAsync(`docker compose down`, { cwd: COMPOSE_DIR });
    await logAction(req, 'compose_stop', 'Stopped docker compose stack');
    
    res.json({ success: true, output: stdout || stderr });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to stop compose' });
  }
});

// Logs
router.get('/logs', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { stdout, stderr } = await execAsync(`docker compose logs --tail=100`, { cwd: COMPOSE_DIR });
    res.json({ output: stdout || stderr });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch compose logs' });
  }
});

export default router;
