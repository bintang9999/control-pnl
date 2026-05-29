import express from 'express';
import { exec } from 'child_process';
import util from 'util';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { dbRun } from '../database';

const execAsync = util.promisify(exec);
const router = express.Router();

const WHITELIST_SERVICES = ['sshd', 'docker', 'tailscaled', 'nginx'];
const WHITELIST_ACTIONS = ['status', 'start', 'stop', 'restart'];

const logAction = async (req: AuthRequest, action: string, details: string) => {
  await dbRun('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
    [req.user?.id, action, details, req.ip]);
};

router.post('/action', requireAdmin, async (req: AuthRequest, res) => {
  const { service, action } = req.body;

  if (!WHITELIST_SERVICES.includes(service)) {
    return res.status(403).json({ error: 'Service not in whitelist' });
  }

  if (!WHITELIST_ACTIONS.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    // Determine command based on platform for testing locally vs alpine
    // Alpine uses OpenRC (rc-service). Fallback to systemctl on ubuntu for local testing if needed,
    // but the spec specifically asked for rc-service. We will strictly use rc-service.
    const command = `rc-service ${service} ${action}`;
    
    // We wrap it in a try-catch for the exec since it might fail if rc-service is missing (local mac/windows)
    let output = '';
    try {
      const { stdout, stderr } = await execAsync(command);
      output = stdout || stderr;
    } catch (e: any) {
      output = e.stdout || e.stderr || e.message;
      if (!output.includes('status')) { // Don't throw for status check failures
         // Maybe the service is just stopped, which is fine, but for start/stop it might be a real error
         if (action !== 'status') throw e;
      }
    }

    if (action !== 'status') {
      await logAction(req, 'service_action', `Executed ${action} on ${service}`);
    }

    res.json({ success: true, output });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Service command failed' });
  }
});

router.get('/list', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const statuses = await Promise.all(WHITELIST_SERVICES.map(async (service) => {
      let isRunning = false;
      try {
        await execAsync(`rc-service ${service} status`);
        isRunning = true;
      } catch (e) {
        isRunning = false;
      }
      return { service, isRunning };
    }));
    
    res.json(statuses);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch services status' });
  }
});

export default router;
