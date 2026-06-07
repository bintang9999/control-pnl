"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../middleware/auth");
const database_1 = require("../database");
const router = express_1.default.Router();
const logAction = async (req, action, details) => {
    await (0, database_1.dbRun)('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)', [req.user?.id, action, details, req.ip]);
};
// Get all settings
router.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const rows = await (0, database_1.dbQuery)('SELECT key, value FROM settings');
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});
// Update a setting
router.put('/:key', auth_1.requireAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        await (0, database_1.dbRun)('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
        await logAction(req, 'setting_update', `Updated setting ${key}`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update setting' });
    }
});
// Change admin password
router.post('/change-password', auth_1.requireAdmin, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user?.id;
        if (!oldPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Invalid password format (min 6 chars)' });
        }
        const user = await (0, database_1.dbGet)('SELECT password FROM users WHERE id = ?', [userId]);
        const match = await bcrypt_1.default.compare(oldPassword, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Incorrect old password' });
        }
        const hashed = await bcrypt_1.default.hash(newPassword, 10);
        await (0, database_1.dbRun)('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
        await logAction(req, 'password_change', 'Admin changed password');
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to change password' });
    }
});
exports.default = router;
