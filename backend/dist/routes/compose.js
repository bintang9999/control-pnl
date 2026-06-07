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
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const database_1 = require("../database");
const execAsync = util_1.default.promisify(child_process_1.exec);
const router = express_1.default.Router();
const COMPOSE_DIR = '/home/bintang/midopanel-compose';
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Ensure compose dir exists
promises_1.default.mkdir(COMPOSE_DIR, { recursive: true }).catch(console.error);
const logAction = async (req, action, details) => {
    await (0, database_1.dbRun)('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)', [req.user?.id, action, details, req.ip]);
};
// Get compose status and history
router.get('/status', auth_1.requireAdmin, async (req, res) => {
    try {
        const hasFile = await promises_1.default.access(path_1.default.join(COMPOSE_DIR, 'docker-compose.yml')).then(() => true).catch(() => false);
        let isRunning = false;
        if (hasFile) {
            try {
                const { stdout } = await execAsync(`docker compose ls --format json`, { cwd: COMPOSE_DIR });
                // Very basic check, docker compose ls outputs json array
                isRunning = stdout.includes('running') || stdout.includes(path_1.default.basename(COMPOSE_DIR));
            }
            catch (e) {
                isRunning = false;
            }
        }
        res.json({ hasFile, isRunning });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch compose status' });
    }
});
// Upload and Deploy
router.post('/deploy', auth_1.requireAdmin, upload.single('file'), async (req, res) => {
    try {
        if (req.file) {
            // User uploaded a new compose file
            await promises_1.default.writeFile(path_1.default.join(COMPOSE_DIR, 'docker-compose.yml'), req.file.buffer);
            await logAction(req, 'compose_upload', 'Uploaded new docker-compose.yml');
        }
        // Deploy
        const { stdout, stderr } = await execAsync(`docker compose up -d`, { cwd: COMPOSE_DIR });
        await logAction(req, 'compose_deploy', 'Deployed docker compose stack');
        res.json({ success: true, output: stdout || stderr });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to deploy compose' });
    }
});
// Stop
router.post('/stop', auth_1.requireAdmin, async (req, res) => {
    try {
        const { stdout, stderr } = await execAsync(`docker compose down`, { cwd: COMPOSE_DIR });
        await logAction(req, 'compose_stop', 'Stopped docker compose stack');
        res.json({ success: true, output: stdout || stderr });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to stop compose' });
    }
});
// Logs
router.get('/logs', auth_1.requireAdmin, async (req, res) => {
    try {
        const { stdout, stderr } = await execAsync(`docker compose logs --tail=100`, { cwd: COMPOSE_DIR });
        res.json({ output: stdout || stderr });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch compose logs' });
    }
});
exports.default = router;
