const { Database: SQLiteDB } = require('node-sqlite3-wasm');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'taskmanager.db');

const _db = new SQLiteDB(DB_PATH);

// Enable WAL mode for better performance
_db.exec('PRAGMA journal_mode = WAL');
_db.exec('PRAGMA foreign_keys = ON');

// node-sqlite3-wasm expects params as an array, but our routes use
// better-sqlite3 spread style: .run(a, b, c) and .all(...ids, val)
// This shim converts spread args → array so all routes work unchanged.
const db = {
  exec: (sql) => _db.exec(sql),
  prepare: (sql) => {
    const stmt = _db.prepare(sql);
    return {
      run:  (...args) => stmt.run(args),
      get:  (...args) => stmt.get(args),
      all:  (...args) => stmt.all(args),
    };
  }
};

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    admin_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'todo',
    project_id INTEGER NOT NULL,
    assigned_to INTEGER,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log('✅ Database initialized');

module.exports = db;
