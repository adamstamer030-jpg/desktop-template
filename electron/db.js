import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';

let db = null;

export function initDatabase(userDataPath) {
  const dir = path.join(userDataPath, 'data');
  fs.mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, 'app.sqlite3');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  migrate();
  seedIfEmpty();

  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized yet');
  return db;
}

function migrate() {
  // جدول إعدادات/بيانات عامة للتطبيق (الترخيص، إصدار السكيما..)
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // جدول المستخدمين — أساس موديول Auth، أي موديول مستقبلي (HR..) بيتمدّ منه
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      active INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function getMeta(key) {
  const row = db.prepare('SELECT value FROM app_meta WHERE key = ?').get(key);
  return row?.value ?? null;
}

function setMeta(key, value) {
  db.prepare(
    `INSERT INTO app_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count === 0) {
    const now = new Date().toISOString();
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      `INSERT INTO users (name, username, password_hash, role, active, must_change_password, created_at, updated_at)
       VALUES (?, ?, ?, 'admin', 1, 1, ?, ?)`
    ).run('مدير النظام', 'admin', hash, now, now);
  }
  if (getMeta('schema_version') === null) {
    setMeta('schema_version', '1');
  }
}

export const meta = { get: getMeta, set: setMeta };
