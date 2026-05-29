import express from 'express';
import bcrypt from 'bcrypt';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { dbQuery, dbRun, dbGet } from '../database';

const router = express.Router();

const logAction = async (req: AuthRequest, action: string, details: string) => {
  await dbRun('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
    [req.user?.id, action, details, req.ip]);
};

// Get all settings
router.get('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const rows = await dbQuery('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update a setting
router.put('/:key', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    await dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
    await logAction(req, 'setting_update', `Updated setting ${key}`);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Change admin password
router.post('/change-password', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Invalid password format (min 6 chars)' });
    }

    const user = await dbGet('SELECT password FROM users WHERE id = ?', [userId]);
    const match = await bcrypt.compare(oldPassword, user.password);
    
    if (!match) {
      return res.status(401).json({ error: 'Incorrect old password' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await dbRun('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
    await logAction(req, 'password_change', 'Admin changed password');

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
