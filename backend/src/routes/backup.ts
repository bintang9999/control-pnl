import express from 'express';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs/promises';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { dbRun, dbQuery } from '../database';

const execAsync = util.promisify(exec);
const router = express.Router();

const BACKUP_DIR = '/home/bintang/backups/midopanel';
const PROJECT_DIR = '/home/bintang/Documents/control-pnl';

// Ensure backup directory exists on startup
fs.mkdir(BACKUP_DIR, { recursive: true }).catch(console.error);

const logAction = async (req: AuthRequest, action: string, details: string) => {
  await dbRun('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
    [req.user?.id, action, details, req.ip]);
};

router.post('/create', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    const filename = `midopanel-backup-${timestamp}.tar.gz`;
    const destPath = path.join(BACKUP_DIR, filename);

    // Create a tar.gz containing the project directory (which includes docker-compose and database)
    // Excluding node_modules to save space
    const command = `tar -czf ${destPath} --exclude='node_modules' -C ${path.dirname(PROJECT_DIR)} ${path.basename(PROJECT_DIR)}`;
    
    await execAsync(command);

    const stat = await fs.stat(destPath);
    
    // Log to DB
    await dbRun('INSERT INTO backups (filename, size, status) VALUES (?, ?, ?)',
      [filename, stat.size, 'completed']);

    await logAction(req, 'backup_create', `Created backup: ${filename}`);

    res.json({ success: true, filename, size: stat.size });
  } catch (error: any) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

router.get('/history', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const backups = await dbQuery('SELECT * FROM backups ORDER BY created_at DESC');
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch backup history' });
  }
});

export default router;
