"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const auth_1 = require("../middleware/auth");
const execAsync = util_1.default.promisify(child_process_1.exec);
const router = express_1.default.Router();
router.get('/status', auth_1.requireAuth, async (req, res) => {
    try {
        const { stdout } = await execAsync('tailscale status --json');
        const data = JSON.parse(stdout);
        res.json(data);
    }
    catch (error) {
        console.error('Tailscale error (fallback to mock):', error.message);
        // Safe fallback for local development where tailscale is not installed
        res.json({
            TailscaleIPs: ['100.x.x.x'],
            BackendState: 'Not Installed (Fallback)',
            Self: {
                HostName: 'mido-server-mock',
                OS: 'linux',
                Online: true,
            },
            Peers: {}
        });
    }
});
exports.default = router;
