import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data folder exists at project root
const DATA_DIR = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'tracker.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better concurrency and performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

// Ensure columns exist on existing SQLite databases
try {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const columnNames = tableInfo.map(c => c.name);
  if (!columnNames.includes('password_hash')) {
    db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT;");
  }
  if (!columnNames.includes('salt')) {
    db.exec("ALTER TABLE users ADD COLUMN salt TEXT;");
  }
  if (!columnNames.includes('is_active')) {
    db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;");
  }
} catch (e) {
  console.warn('[DB] Migration warning:', e.message);
}

console.log(`[DB] Connected to SQLite database at: ${DB_PATH}`);

export default db;
export { DB_PATH, DATA_DIR };
