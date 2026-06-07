module.exports = {
  apps: [{
    name: "midopanel-backend",
    script: "./dist/index.js",
    cwd: "/home/bintang/Documents/control-pnl/backend",
    env: {
      NODE_ENV: "production",
      PORT: 3001,
      // Change this to a secure random string in production!
      JWT_SECRET: "change_this_secret_in_production", 
      DB_PATH: "/home/bintang/Documents/control-pnl/database/midopanel.sqlite",
      TARGET_OS: "alpine",
      INIT_SYSTEM: "openrc",
      DEFAULT_SHELL: "/bin/ash",
      SERVICE_MANAGER: "openrc"
    },
    // Only used for Node.js clustering if needed
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "500M",
    // PM2 log files
    error_file: "/home/bintang/Documents/control-pnl/logs/backend-error.log",
    out_file: "/home/bintang/Documents/control-pnl/logs/backend-out.log",
    time: true
  }]
}
