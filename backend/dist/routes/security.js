"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const auth_1 = require("../middleware/auth");
const database_1 = require("../database");
const execAsync = util_1.default.promisify(child_process_1.exec);
const router = express_1.default.Router();
router.get('/ports', auth_1.requireAdmin, async (req, res) => {
    try {
        const { stdout } = await execAsync('ss -tulpn || netstat -tulpn');
        res.json({ output: stdout });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch open ports' });
    }
});
router.get('/sessions', auth_1.requireAdmin, async (req, res) => {
    try {
        const { stdout } = await execAsync('who');
        res.json({ output: stdout });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch active sessions' });
    }
});
router.get('/audit-logs', auth_1.requireAdmin, async (req, res) => {
    try {
        const logs = await (0, database_1.dbQuery)(`
      SELECT audit_logs.*, users.username 
      FROM audit_logs 
      LEFT JOIN users ON audit_logs.user_id = users.id 
      ORDER BY created_at DESC LIMIT 100
    `);
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});
exports.default = router;
