import express from 'express';
import { exec } from 'child_process';
import util from 'util';
import { requireAuth } from '../middleware/auth';

const execAsync = util.promisify(exec);
const router = express.Router();

router.get('/status', requireAuth, async (req, res) => {
  try {
    const { stdout } = await execAsync('tailscale status --json');
    const data = JSON.parse(stdout);
    res.json(data);
  } catch (error: any) {
    console.error('Tailscale error (fallback to mock):', error.message);
    // Safe fallback for local development where tailscale is not installed
    res.json({
      TailscaleIPs: ['100.x.x.x'],
      BackendState: 'Not Installed (Fallback)',
      Self: {
        HostName: 'mido-server-mock',
        OS: 'linux',
        Online: true,
      },
      Peers: {}
    });
  }
});

export default router;
