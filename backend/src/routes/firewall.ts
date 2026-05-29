import express from 'express';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const router = express.Router();

router.get('/rules', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { stdout } = await execAsync('iptables -L -n');
        res.json({ rules: stdout });
    } catch (e: any) {
        if (String(e.message).includes('Permission denied')) {
            // Development fallback
            res.json({ rules: "Chain INPUT (policy ACCEPT)\ntarget     prot opt source               destination\nACCEPT     all  --  0.0.0.0/0            0.0.0.0/0\n\n[WARNING: MOCKED DATA - Permission Denied to read real iptables]" });
        } else {
            res.status(500).json({ error: e.message || 'Failed to fetch rules. Ensure iptables is installed.' });
        }
    }
});

router.post('/allow', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { port, protocol } = req.body;
        await execAsync(`iptables -A INPUT -p ${protocol || 'tcp'} --dport ${port} -j ACCEPT`);
        res.json({ success: true, message: `Port ${port} allowed.` });
    } catch (e: any) {
        res.status(500).json({ error: e.message || 'Failed to allow port' });
    }
});

router.post('/block', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { port, protocol } = req.body;
        if ([22, 80, 443, 3001, 5173].includes(parseInt(port))) {
            return res.status(400).json({ error: 'Cannot block critical panel or SSH ports!' });
        }
        await execAsync(`iptables -A INPUT -p ${protocol || 'tcp'} --dport ${port} -j DROP`);
        res.json({ success: true, message: `Port ${port} blocked.` });
    } catch (e: any) {
        res.status(500).json({ error: e.message || 'Failed to block port' });
    }
});

export default router;
