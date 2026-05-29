import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { dbRun, dbGet } from '../database';

const router = express.Router();

// Setup multer for memory storage initially, then we write to safe path
const upload = multer({ storage: multer.memoryStorage() });

// Helper to safely resolve and validate paths
const getSafePath = async (userPath: string) => {
  const setting = await dbGet("SELECT value FROM settings WHERE key = 'safe_folder_path'");
  const baseDir = setting ? setting.value : '/home/bintang';

  // Prevent directory traversal
  const normalizedPath = path.normalize(userPath || '/').replace(/^(\.\.[\/\\])+/, '');
  const resolvedPath = path.resolve(baseDir, `.${normalizedPath}`);
  
  if (!resolvedPath.startsWith(baseDir)) {
    throw new Error('Path traversal detected');
  }
  return resolvedPath;
};

// Log action helper
const logAction = async (req: AuthRequest, action: string, details: string) => {
  await dbRun('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
    [req.user?.id, action, details, req.ip]);
};

// List directory
router.get('/list', requireAuth, async (req: AuthRequest, res) => {
  try {
    const targetPath = await getSafePath(req.query.path as string || '/');
    const items = await fs.readdir(targetPath, { withFileTypes: true });
    
    const result = await Promise.all(items.map(async (item) => {
      const itemPath = path.join(targetPath, item.name);
      const stat = await fs.stat(itemPath).catch(() => null);
      return {
        name: item.name,
        isDirectory: item.isDirectory(),
        size: stat?.size || 0,
        mtime: stat?.mtime || new Date()
      };
    }));

    // Sort: directories first
    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json(result);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Failed to read directory' });
  }
});

// Read text file
router.get('/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const targetPath = await getSafePath(req.query.path as string);
    const stat = await fs.stat(targetPath);
    
    if (stat.isDirectory() || stat.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Cannot read directory or file > 5MB' });
    }

    const content = await fs.readFile(targetPath, 'utf-8');
    res.json({ content });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Failed to read file' });
  }
});

// Create directory
router.post('/mkdir', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { dirPath, name } = req.body;
    const targetPath = await getSafePath(path.join(dirPath || '/', name));
    
    await fs.mkdir(targetPath, { recursive: true });
    await logAction(req, 'mkdir', `Created directory: ${targetPath}`);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Failed to create directory' });
  }
});

// Edit text file
router.put('/edit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { filePath, content } = req.body;
    const targetPath = await getSafePath(filePath);
    
    await fs.writeFile(targetPath, content, 'utf-8');
    await logAction(req, 'edit_file', `Edited file: ${targetPath}`);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Failed to edit file' });
  }
});

// Rename file/dir
router.post('/rename', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { oldPath, newName } = req.body;
    const sourcePath = await getSafePath(oldPath);
    const parentDir = path.dirname(sourcePath);
    
    // We need baseDir for rename safety
    const setting = await dbGet("SELECT value FROM settings WHERE key = 'safe_folder_path'");
    const baseDir = setting ? setting.value : '/home/bintang';

    const destPath = await getSafePath(path.join(parentDir.replace(baseDir, '') || '/', newName));
    
    await fs.rename(sourcePath, destPath);
    await logAction(req, 'rename', `Renamed ${sourcePath} to ${destPath}`);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Failed to rename' });
  }
});

// Upload file
router.post('/upload', requireAuth, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    
    const dirPath = req.body.path || '/';
    const targetPath = await getSafePath(path.join(dirPath, req.file.originalname));
    
    await fs.writeFile(targetPath, req.file.buffer);
    await logAction(req, 'upload', `Uploaded file to: ${targetPath}`);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Failed to upload file' });
  }
});

// Download file
router.get('/download', requireAuth, async (req: AuthRequest, res) => {
  try {
    const targetPath = await getSafePath(req.query.path as string);
    const stat = await fs.stat(targetPath);
    
    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'Cannot download directory directly' });
    }

    res.download(targetPath);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Failed to download file' });
  }
});

// Delete file or empty directory
router.delete('/delete', requireAuth, async (req: AuthRequest, res) => {
  try {
    const targetPath = await getSafePath(req.query.path as string);
    const stat = await fs.stat(targetPath);
    
    // Safety check: Don't allow deleting the root safe folder itself
    const setting = await dbGet("SELECT value FROM settings WHERE key = 'safe_folder_path'");
    const baseDir = setting ? setting.value : '/home/bintang';
    if (targetPath === baseDir) {
      return res.status(403).json({ error: 'Cannot delete the root safe directory' });
    }

    if (stat.isDirectory()) {
      await fs.rmdir(targetPath);
    } else {
      await fs.unlink(targetPath);
    }
    
    await logAction(req, 'delete', `Deleted: ${targetPath}`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Failed to delete path' });
  }
});

export default router;
