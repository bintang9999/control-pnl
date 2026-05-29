# MidoPanel

MidoPanel is a modern, responsive, and secure web-based control panel designed specifically for Alpine Linux / postmarketOS servers. It provides real-time system monitoring, Docker & Docker Compose management, a secure SSH web terminal, file management, and OpenRC service control out of the box.

## Features

- **Dark Blue Glassmorphism UI**: Professional and beautiful user interface.
- **Real-time Monitoring**: Live CPU, RAM, OS, and Network metrics via WebSocket.
- **Docker Management**: List, start, stop containers, and view live logs.
- **Docker Compose Manager**: Deploy and manage multi-container stacks.
- **Secure Web Terminal**: Full-featured SSH terminal using `node-pty` directly to the host shell.
- **Safe Mode File Manager**: Browse and manage files strictly within a safe root directory.
- **OpenRC Services**: Safely manage whitelisted host services (Docker, SSH, Nginx, Tailscale).
- **Tailscale Integration**: Read-only monitoring of your mesh VPN network peers.
- **Role-Based Authentication**: Secure JWT-based login with bcrypt password hashing.
- **Audit Logs**: All sensitive actions (login, terminal access, file modifications, docker actions) are logged to SQLite.
- **Automated Backups**: Easily create tarball snapshots of your panel environment.

## Prerequisites

- Target OS: Alpine Linux / postmarketOS (for OpenRC functionality)
- Node.js 18+ (for development)
- Docker & Docker Compose (for production)
- Build tools (`apk add build-base python3 make g++ linux-headers`) for `node-pty` installation.

## Development

To run MidoPanel locally for development:

1. Clone the repository.
2. Install dependencies for both frontend and backend:
   ```bash
   npm run install:all
   ```
3. Start the development servers concurrently:
   ```bash
   npm run dev
   ```
4. Access the panel at `http://localhost:5173`.
5. Default login: `admin` / `admin`.

## Production Deployment (Target: Alpine / postmarketOS)

MidoPanel is strictly designed and optimized for **Alpine Linux** or **postmarketOS** as its production target. The backend heavily relies on host OS primitives like `rc-service`, `apk`, and `/bin/ash`. **Local development on Ubuntu/Debian/macOS/Windows is purely for UI/Backend testing only**. Features like OpenRC service management, Tailscale integration, and Docker socket binding will only function fully on the Alpine server.

1. Set your secure environment variables (see table below).
2. Build and start the production stack:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
3. The panel will be available on port 80 of your server via the built-in Nginx reverse proxy.

### Security Warning ⚠️
MidoPanel operates with `privileged: true` and `network_mode: host` in production to interact with host Docker sockets and OpenRC commands. **Never expose MidoPanel directly to the public internet** without a secure reverse proxy, HTTPS (SSL/TLS), and strong passwords. It is highly recommended to access MidoPanel strictly via a VPN like Tailscale.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for signing JWT tokens | `fallback_secret_for_dev_only` |
| `PORT` | Backend API port | `3001` |
| `DB_PATH` | Path to SQLite database file | `/app/database/midopanel.sqlite` |
| `TARGET_OS` | Target OS verification | `alpine` |
| `INIT_SYSTEM` | Init system used | `openrc` |
| `DEFAULT_SHELL` | Default shell spawned by terminal | `/bin/ash` |
| `SERVICE_MANAGER` | System service manager | `openrc` |
