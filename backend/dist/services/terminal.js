"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTerminalSession = void 0;
const pty = __importStar(require("node-pty"));
const database_1 = require("../database");
const telegram_1 = require("./telegram");
// Helper to determine the default shell (prioritize Alpine's /bin/ash as per specs)
const shell = process.env.DEFAULT_SHELL || '/bin/ash';
const setupTerminalSession = (socket) => {
    let ptyProcess = null;
    const user = socket.user;
    socket.on('terminal_init', async (config) => {
        try {
            const setting = await (0, database_1.dbGet)("SELECT value FROM settings WHERE key = 'terminal_enabled'");
            if (setting && setting.value !== 'true') {
                return socket.emit('terminal_error', 'Terminal feature is disabled by administrator');
            }
            if (ptyProcess) {
                ptyProcess.kill();
            }
            // Log the terminal access
            await (0, database_1.dbRun)('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)', [user?.id, 'terminal_open', `Shell: ${shell}`, socket.handshake.address]);
            (0, telegram_1.sendTelegramNotification)(`🚨 <b>MidoPanel Alert</b>\nWeb SSH Terminal session opened by <code>${user?.username || 'unknown'}</code> from IP <code>${socket.handshake.address}</code>`);
            ptyProcess = pty.spawn(shell, [], {
                name: 'xterm-color',
                cols: config.cols || 80,
                rows: config.rows || 24,
                cwd: process.env.HOME || '/home/bintang',
                env: process.env
            });
            ptyProcess.onData((data) => {
                socket.emit('terminal_data', data);
            });
            ptyProcess.onExit(() => {
                socket.emit('terminal_exit');
                ptyProcess = null;
            });
        }
        catch (err) {
            console.error('Failed to spawn PTY', err);
            socket.emit('terminal_error', 'Failed to spawn terminal process');
        }
    });
    socket.on('terminal_input', (data) => {
        if (ptyProcess) {
            ptyProcess.write(data);
        }
    });
    socket.on('terminal_resize', (size) => {
        if (ptyProcess && size.cols && size.rows) {
            try {
                ptyProcess.resize(size.cols, size.rows);
            }
            catch (e) {
                console.error('PTY Resize error', e);
            }
        }
    });
    socket.on('disconnect', () => {
        if (ptyProcess) {
            ptyProcess.kill();
            ptyProcess = null;
        }
    });
};
exports.setupTerminalSession = setupTerminalSession;
