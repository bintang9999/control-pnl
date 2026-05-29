import express from 'express';
import { exec } from 'child_process';
import util from 'util';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { dbQuery } from '../database';

const execAsync = util.promisify(exec);
const router = express.Router();

router.get('/ports', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { stdout } = await execAsync('ss -tulpn || netstat -tulpn');
    res.json({ output: stdout });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch open ports' });
  }
});

router.get('/sessions', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { stdout } = await execAsync('who');
    res.json({ output: stdout });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch active sessions' });
  }
});

router.get('/audit-logs', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const logs = await dbQuery(`
      SELECT audit_logs.*, users.username 
      FROM audit_logs 
      LEFT JOIN users ON audit_logs.user_id = users.id 
      ORDER BY created_at DESC LIMIT 100
    `);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
