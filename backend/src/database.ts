import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/midopanel.sqlite');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Audit logs table
    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Backups table
    db.run(`CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      size INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Nodes table
    db.run(`CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      api_key TEXT NOT NULL,
      status TEXT DEFAULT 'offline',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Settings table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`);

    // Proxies table
    db.run(`CREATE TABLE IF NOT EXISTS proxies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      target_host TEXT NOT NULL,
      target_port INTEGER NOT NULL,
      ssl_enabled BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert default settings if empty
    db.get('SELECT COUNT(*) as count FROM settings', [], (err, row: any) => {
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
        
        const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        defaultSettings.forEach(setting => stmt.run(setting));
        stmt.finalize();
      }
    });

    // Create default admin if not exists
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, row) => {
      if (!row) {
        const hashedPassword = await bcrypt.hash('admin', 10); // default password 'admin'
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin']);
        console.log('Default admin user created');
      }
    });
  });
}

// Utility to run queries with promises
export const dbQuery = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const dbRun = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

export const dbGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};
