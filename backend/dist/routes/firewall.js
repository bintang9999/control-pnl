"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const execAsync = util_1.default.promisify(child_process_1.exec);
const router = express_1.default.Router();
router.get('/rules', auth_1.requireAdmin, async (req, res) => {
    try {
        const { stdout } = await execAsync('iptables -L -n');
        res.json({ rules: stdout });
    }
    catch (e) {
        if (String(e.message).includes('Permission denied')) {
            // Development fallback
            res.json({ rules: "Chain INPUT (policy ACCEPT)\ntarget     prot opt source               destination\nACCEPT     all  --  0.0.0.0/0            0.0.0.0/0\n\n[WARNING: MOCKED DATA - Permission Denied to read real iptables]" });
        }
        else {
            res.status(500).json({ error: e.message || 'Failed to fetch rules. Ensure iptables is installed.' });
        }
    }
});
router.post('/allow', auth_1.requireAdmin, async (req, res) => {
    try {
        const { port, protocol } = req.body;
        await execAsync(`iptables -A INPUT -p ${protocol || 'tcp'} --dport ${port} -j ACCEPT`);
        res.json({ success: true, message: `Port ${port} allowed.` });
    }
    catch (e) {
        res.status(500).json({ error: e.message || 'Failed to allow port' });
    }
});
router.post('/block', auth_1.requireAdmin, async (req, res) => {
    try {
        const { port, protocol } = req.body;
        if ([22, 80, 443, 3001, 5173].includes(parseInt(port))) {
            return res.status(400).json({ error: 'Cannot block critical panel or SSH ports!' });
        }
        await execAsync(`iptables -A INPUT -p ${protocol || 'tcp'} --dport ${port} -j DROP`);
        res.json({ success: true, message: `Port ${port} blocked.` });
    }
    catch (e) {
        res.status(500).json({ error: e.message || 'Failed to block port' });
    }
});
exports.default = router;
