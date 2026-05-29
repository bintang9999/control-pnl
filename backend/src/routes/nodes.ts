import express from 'express';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { dbQuery, dbRun } from '../database';
import axios from 'axios';

const router = express.Router();

router.get('/', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const nodes = await dbQuery('SELECT * FROM nodes');
        res.json(nodes);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to fetch nodes' });
    }
});

router.post('/', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { name, ip_address, api_key } = req.body;
        await dbRun('INSERT INTO nodes (name, ip_address, api_key) VALUES (?, ?, ?)', [name, ip_address, api_key]);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to add node' });
    }
});

router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        await dbRun('DELETE FROM nodes WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to remove node' });
    }
});

router.get('/health', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const nodes = await dbQuery('SELECT * FROM nodes');
        const results = await Promise.all(nodes.map(async (node) => {
            try {
                const response = await axios.get(`http://${node.ip_address}:3001/api/health/full`, { timeout: 3000 });
                return { id: node.id, status: 'online', data: response.data };
            } catch (err) {
                return { id: node.id, status: 'offline', data: null };
            }
        }));
        res.json(results);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to fetch node health' });
    }
});

export default router;
