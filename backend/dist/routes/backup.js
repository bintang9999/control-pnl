"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const auth_1 = require("../middleware/auth");
const database_1 = require("../database");
const execAsync = util_1.default.promisify(child_process_1.exec);
const router = express_1.default.Router();
const BACKUP_DIR = '/home/bintang/backups/midopanel';
const PROJECT_DIR = '/home/bintang/Documents/control-pnl';
// Ensure backup directory exists on startup
promises_1.default.mkdir(BACKUP_DIR, { recursive: true }).catch(console.error);
const logAction = async (req, action, details) => {
    await (0, database_1.dbRun)('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)', [req.user?.id, action, details, req.ip]);
};
router.post('/create', auth_1.requireAdmin, async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
        const filename = `midopanel-backup-${timestamp}.tar.gz`;
        const destPath = path_1.default.join(BACKUP_DIR, filename);
        // Create a tar.gz containing the project directory (which includes docker-compose and database)
        // Excluding node_modules to save space
        const command = `tar -czf ${destPath} --exclude='node_modules' -C ${path_1.default.dirname(PROJECT_DIR)} ${path_1.default.basename(PROJECT_DIR)}`;
        await execAsync(command);
        const stat = await promises_1.default.stat(destPath);
        // Log to DB
        await (0, database_1.dbRun)('INSERT INTO backups (filename, size, status) VALUES (?, ?, ?)', [filename, stat.size, 'completed']);
        await logAction(req, 'backup_create', `Created backup: ${filename}`);
        res.json({ success: true, filename, size: stat.size });
    }
    catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});
router.get('/history', auth_1.requireAdmin, async (req, res) => {
    try {
        const backups = await (0, database_1.dbQuery)('SELECT * FROM backups ORDER BY created_at DESC');
        res.json(backups);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch backup history' });
    }
});
exports.default = router;
