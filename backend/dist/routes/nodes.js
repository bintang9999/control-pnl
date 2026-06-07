"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const database_1 = require("../database");
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
router.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const nodes = await (0, database_1.dbQuery)('SELECT * FROM nodes');
        res.json(nodes);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to fetch nodes' });
    }
});
router.post('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const { name, ip_address, api_key } = req.body;
        await (0, database_1.dbRun)('INSERT INTO nodes (name, ip_address, api_key) VALUES (?, ?, ?)', [name, ip_address, api_key]);
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to add node' });
    }
});
router.delete('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await (0, database_1.dbRun)('DELETE FROM nodes WHERE id = ?', [id]);
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to remove node' });
    }
});
router.get('/health', auth_1.requireAdmin, async (req, res) => {
    try {
        const nodes = await (0, database_1.dbQuery)('SELECT * FROM nodes');
        const results = await Promise.all(nodes.map(async (node) => {
            try {
                const response = await axios_1.default.get(`http://${node.ip_address}:3001/api/health/full`, { timeout: 3000 });
                return { id: node.id, status: 'online', data: response.data };
            }
            catch (err) {
                return { id: node.id, status: 'offline', data: null };
            }
        }));
        res.json(results);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to fetch node health' });
    }
});
exports.default = router;
