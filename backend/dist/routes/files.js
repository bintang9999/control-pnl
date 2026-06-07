"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const database_1 = require("../database");
const router = express_1.default.Router();
// Setup multer for memory storage initially, then we write to safe path
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Helper to safely resolve and validate paths
const getSafePath = async (userPath) => {
    const setting = await (0, database_1.dbGet)("SELECT value FROM settings WHERE key = 'safe_folder_path'");
    const baseDir = setting ? setting.value : '/home/bintang';
    // Prevent directory traversal
    const normalizedPath = path_1.default.normalize(userPath || '/').replace(/^(\.\.[\/\\])+/, '');
    const resolvedPath = path_1.default.resolve(baseDir, `.${normalizedPath}`);
    if (!resolvedPath.startsWith(baseDir)) {
        throw new Error('Path traversal detected');
    }
    return resolvedPath;
};
// Log action helper
const logAction = async (req, action, details) => {
    await (0, database_1.dbRun)('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)', [req.user?.id, action, details, req.ip]);
};
// List directory
router.get('/list', auth_1.requireAuth, async (req, res) => {
    try {
        const targetPath = await getSafePath(req.query.path || '/');
        const items = await promises_1.default.readdir(targetPath, { withFileTypes: true });
        const result = await Promise.all(items.map(async (item) => {
            const itemPath = path_1.default.join(targetPath, item.name);
            const stat = await promises_1.default.stat(itemPath).catch(() => null);
            return {
                name: item.name,
                isDirectory: item.isDirectory(),
                size: stat?.size || 0,
                mtime: stat?.mtime || new Date()
            };
        }));
        // Sort: directories first
        result.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory)
                return -1;
            if (!a.isDirectory && b.isDirectory)
                return 1;
            return a.name.localeCompare(b.name);
        });
        res.json(result);
    }
    catch (error) {
        res.status(403).json({ error: error.message || 'Failed to read directory' });
    }
});
// Read text file
router.get('/read', auth_1.requireAuth, async (req, res) => {
    try {
        const targetPath = await getSafePath(req.query.path);
        const stat = await promises_1.default.stat(targetPath);
        if (stat.isDirectory() || stat.size > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Cannot read directory or file > 5MB' });
        }
        const content = await promises_1.default.readFile(targetPath, 'utf-8');
        res.json({ content });
    }
    catch (error) {
        res.status(403).json({ error: error.message || 'Failed to read file' });
    }
});
// Create directory
router.post('/mkdir', auth_1.requireAuth, async (req, res) => {
    try {
        const { dirPath, name } = req.body;
        const targetPath = await getSafePath(path_1.default.join(dirPath || '/', name));
        await promises_1.default.mkdir(targetPath, { recursive: true });
        await logAction(req, 'mkdir', `Created directory: ${targetPath}`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(403).json({ error: error.message || 'Failed to create directory' });
    }
});
// Edit text file
router.put('/edit', auth_1.requireAuth, async (req, res) => {
    try {
        const { filePath, content } = req.body;
        const targetPath = await getSafePath(filePath);
        await promises_1.default.writeFile(targetPath, content, 'utf-8');
        await logAction(req, 'edit_file', `Edited file: ${targetPath}`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(403).json({ error: error.message || 'Failed to edit file' });
    }
});
// Rename file/dir
router.post('/rename', auth_1.requireAuth, async (req, res) => {
    try {
        const { oldPath, newName } = req.body;
        const sourcePath = await getSafePath(oldPath);
        const parentDir = path_1.default.dirname(sourcePath);
        // We need baseDir for rename safety
        const setting = await (0, database_1.dbGet)("SELECT value FROM settings WHERE key = 'safe_folder_path'");
        const baseDir = setting ? setting.value : '/home/bintang';
        const destPath = await getSafePath(path_1.default.join(parentDir.replace(baseDir, '') || '/', newName));
        await promises_1.default.rename(sourcePath, destPath);
        await logAction(req, 'rename', `Renamed ${sourcePath} to ${destPath}`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(403).json({ error: error.message || 'Failed to rename' });
    }
});
// Upload file
router.post('/upload', auth_1.requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'No file provided' });
        const dirPath = req.body.path || '/';
        const targetPath = await getSafePath(path_1.default.join(dirPath, req.file.originalname));
        await promises_1.default.writeFile(targetPath, req.file.buffer);
        await logAction(req, 'upload', `Uploaded file to: ${targetPath}`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(403).json({ error: error.message || 'Failed to upload file' });
    }
});
// Download file
router.get('/download', auth_1.requireAuth, async (req, res) => {
    try {
        const targetPath = await getSafePath(req.query.path);
        const stat = await promises_1.default.stat(targetPath);
        if (stat.isDirectory()) {
            return res.status(400).json({ error: 'Cannot download directory directly' });
        }
        res.download(targetPath);
    }
    catch (error) {
        res.status(403).json({ error: error.message || 'Failed to download file' });
    }
});
// Delete file or empty directory
router.delete('/delete', auth_1.requireAuth, async (req, res) => {
    try {
        const targetPath = await getSafePath(req.query.path);
        const stat = await promises_1.default.stat(targetPath);
        // Safety check: Don't allow deleting the root safe folder itself
        const setting = await (0, database_1.dbGet)("SELECT value FROM settings WHERE key = 'safe_folder_path'");
        const baseDir = setting ? setting.value : '/home/bintang';
        if (targetPath === baseDir) {
            return res.status(403).json({ error: 'Cannot delete the root safe directory' });
        }
        if (stat.isDirectory()) {
            await promises_1.default.rmdir(targetPath);
        }
        else {
            await promises_1.default.unlink(targetPath);
        }
        await logAction(req, 'delete', `Deleted: ${targetPath}`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(403).json({ error: error.message || 'Failed to delete path' });
    }
});
exports.default = router;
