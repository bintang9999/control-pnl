import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../database';
import { sendTelegramNotification } from '../services/telegram';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      // Dummy compare to mitigate timing attacks
      await bcrypt.compare(password, '$2b$10$abcdefghijklmnopqrstuv');
      await sendTelegramNotification(`⚠️ <b>MidoPanel Alert</b>\nFailed login attempt for unknown user: <code>${username}</code> from IP <code>${req.ip}</code>`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await sendTelegramNotification(`⚠️ <b>MidoPanel Alert</b>\nFailed login attempt for user: <code>${username}</code> from IP <code>${req.ip}</code>`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Log the successful login
    await dbRun('INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)', 
      [user.id, 'login', req.ip]);
      
    await sendTelegramNotification(`✅ <b>MidoPanel Alert</b>\nSuccessful login for user: <code>${username}</code> from IP <code>${req.ip}</code>`);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

export default router;
