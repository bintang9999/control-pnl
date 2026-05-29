import express from 'express';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import { dbQuery } from '../database';

const execAsync = util.promisify(exec);
const router = express.Router();

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
    await dbQuery('SELECT 1');
    status.database = 'ok';
  } catch (e) {}

  try {
    // Docker check
    await fs.access('/var/run/docker.sock');
    status.docker = 'ok';
  } catch (e) {}

  try {
    // Tailscale check
    await execAsync('tailscale status --json');
    status.tailscale = 'ok';
  } catch (e) {
    if (String(e).includes('not found')) {
      status.tailscale = 'not_installed';
    }
  }

  try {
    // OpenRC check
    await execAsync('rc-status');
    status.openrc = 'ok';
  } catch (e) {
    if (String(e).includes('not found') || String(e).includes('command not found')) {
      status.openrc = 'not_installed';
    }
  }

  res.json(status);
});

export default router;
