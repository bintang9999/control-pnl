"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database");
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    try {
        const user = await (0, database_1.dbGet)('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            // Dummy compare to mitigate timing attacks
            await bcrypt_1.default.compare(password, '$2b$10$abcdefghijklmnopqrstuv');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const match = await bcrypt_1.default.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Log the successful login
        await (0, database_1.dbRun)('INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)', [user.id, 'login', req.ip]);
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    }
    catch (error) {
        console.error('Login error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Verify token
router.get('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        res.json({ valid: true, user: decoded });
    }
    catch (error) {
        res.status(401).json({ valid: false, error: 'Invalid token' });
    }
});
exports.default = router;
