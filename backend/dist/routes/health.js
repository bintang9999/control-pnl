"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const promises_1 = __importDefault(require("fs/promises"));
const database_1 = require("../database");
const execAsync = util_1.default.promisify(child_process_1.exec);
const router = express_1.default.Router();
router.get('/full', async (req, res) => {
    const status = {
        backend: 'ok',
        database: 'error',
        docker: 'error',
        tailscale: 'error',
        openrc: 'error'
    };
    try {
        // Database check
        await (0, database_1.dbQuery)('SELECT 1');
        status.database = 'ok';
    }
    catch (e) { }
    try {
        // Docker check
        await promises_1.default.access('/var/run/docker.sock');
        status.docker = 'ok';
    }
    catch (e) { }
    try {
        // Tailscale check
        await execAsync('tailscale status --json');
        status.tailscale = 'ok';
    }
    catch (e) {
        if (String(e).includes('not found')) {
            status.tailscale = 'not_installed';
        }
    }
    try {
        // OpenRC check
        await execAsync('rc-status');
        status.openrc = 'ok';
    }
    catch (e) {
        if (String(e).includes('not found') || String(e).includes('command not found')) {
            status.openrc = 'not_installed';
        }
    }
    res.json(status);
});
exports.default = router;
