import db from './database.js';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../utils/auth.js';

export function runSeed(force = false) {
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count > 0 && !force) {
    console.log('[DB] Database contains existing data. Skipping seed.');
    return;
  }

  console.log('[DB] Initializing fresh HyperTrack workspace with default Admin user...');

  // Wipe previous data
  db.exec(`
    DELETE FROM comments;
    DELETE FROM activity_logs;
    DELETE FROM issues;
    DELETE FROM projects;
    DELETE FROM users;
  `);

  // 1. Seed Default Admin User
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, salt, is_active, avatar_color, title, role, bio)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `);

  const defaultAdmin = {
    id: 'usr_admin',
    name: 'Admin',
    email: 'admin@hypertrack.local',
    password: 'Admin@123',
    avatar_color: '#D97757', // Anthropic Terracotta
    title: 'System Administrator',
    role: 'admin',
    bio: 'System Administrator account. Manage settings, projects, and users from the Admin Console.'
  };

  const { salt, hash } = hashPassword(defaultAdmin.password);
  insertUser.run(
    defaultAdmin.id,
    defaultAdmin.name,
    defaultAdmin.email,
    hash,
    salt,
    defaultAdmin.avatar_color,
    defaultAdmin.title,
    defaultAdmin.role,
    defaultAdmin.bio
  );

  // 2. Initial Audit Log
  const insertLog = db.prepare(`
    INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertLog.run(
    'act_init',
    'system',
    'usr_admin',
    'usr_admin',
    'initialized',
    'HyperTrack initialized with default Administrator account.'
  );

  console.log('[DB] Database initialized successfully.');
  console.log('[DB] Default credentials: Username: admin (or admin@hypertrack.local) | Password: Admin@123');
}

// Allow direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed(true);
}

