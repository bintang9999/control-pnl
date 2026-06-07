"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
const apps = [
    {
        id: 'portainer',
        name: 'Portainer',
        description: 'Docker visual management tool.',
        icon: 'https://cdn.iconscout.com/icon/free/png-256/portainer-3521639-2945083.png',
        compose: `version: "3"\nservices:\n  portainer:\n    image: portainer/portainer-ce:latest\n    container_name: portainer\n    restart: always\n    volumes:\n      - /var/run/docker.sock:/var/run/docker.sock:ro\n      - ./data:/data\n    ports:\n      - 9000:9000`
    },
    {
        id: 'uptime-kuma',
        name: 'Uptime Kuma',
        description: 'A self-hosted monitoring tool.',
        icon: 'https://uptime.kuma.pet/img/icon.svg',
        compose: `version: '3.3'\nservices:\n  uptime-kuma:\n    image: louislam/uptime-kuma:1\n    container_name: uptime-kuma\n    volumes:\n      - ./data:/app/data\n      - /var/run/docker.sock:/var/run/docker.sock\n    ports:\n      - 3001:3001\n    restart: always`
    }
];
router.get('/', auth_1.requireAdmin, (req, res) => {
    res.json(apps);
});
router.post('/install', auth_1.requireAdmin, async (req, res) => {
    try {
        const { appId } = req.body;
        const app = apps.find(a => a.id === appId);
        if (!app)
            return res.status(404).json({ error: 'App not found' });
        const targetDir = path_1.default.join(process.env.HOME || '/home/bintang', 'apps', appId);
        await promises_1.default.mkdir(targetDir, { recursive: true });
        const composePath = path_1.default.join(targetDir, 'docker-compose.yml');
        await promises_1.default.writeFile(composePath, app.compose);
        res.json({ success: true, message: `App blueprint saved to ${targetDir}. Deploy it via Compose Manager.` });
    }
    catch (e) {
        res.status(500).json({ error: e.message || 'Installation failed' });
    }
});
exports.default = router;
