"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbGet = exports.dbRun = exports.dbQuery = exports.db = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dbPath = process.env.DB_PATH || path_1.default.join(__dirname, '../../database/midopanel.sqlite');
exports.db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to database', err);
    }
    else {
        console.log('Connected to SQLite database at', dbPath);
        initDb();
    }
});
function initDb() {
    exports.db.serialize(() => {
        // Users table
        exports.db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
        // Audit logs table
        exports.db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
        // Backups table
        exports.db.run(`CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      size INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
        // Nodes table
        exports.db.run(`CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      api_key TEXT NOT NULL,
      status TEXT DEFAULT 'offline',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
        // Settings table
        exports.db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`);
        // Proxies table
        exports.db.run(`CREATE TABLE IF NOT EXISTS proxies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      target_host TEXT NOT NULL,
      target_port INTEGER NOT NULL,
      ssl_enabled BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
        // Insert default settings if empty
        exports.db.get('SELECT COUNT(*) as count FROM settings', [], (err, row) => {
            if (row && row.count === 0) {
                const defaultSettings = [
                    ['terminal_enabled', 'true'],
                    ['docker_enabled', 'true'],
                    ['safe_folder_path', '/home/bintang'],
                    ['backup_path', '/home/bintang/backups/midopanel'],
                    ['telegram_bot_token', ''],
                    ['telegram_chat_id', ''],
                    ['ai_api_key', '']
                ];
                const stmt = exports.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
                defaultSettings.forEach(setting => stmt.run(setting));
                stmt.finalize();
            }
        });
        // Create default admin if not exists
        exports.db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, row) => {
            if (!row) {
                const hashedPassword = await bcrypt_1.default.hash('admin', 10); // default password 'admin'
                exports.db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin']);
                console.log('Default admin user created');
            }
        });
    });
}
// Utility to run queries with promises
const dbQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        exports.db.all(sql, params, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
};
exports.dbQuery = dbQuery;
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        exports.db.run(sql, params, function (err) {
            if (err)
                reject(err);
            else
                resolve(this);
        });
    });
};
exports.dbRun = dbRun;
const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        exports.db.get(sql, params, (err, row) => {
            if (err)
                reject(err);
            else
                resolve(row);
        });
    });
};
exports.dbGet = dbGet;
