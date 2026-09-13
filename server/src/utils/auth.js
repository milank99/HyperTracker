import crypto from 'node:crypto';

// In-memory token store for lightweight local session management
const sessions = new Map();

/**
 * Hash a password using crypto.scrypt
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    salt,
    hash: derivedKey.toString('hex')
  };
}

/**
 * Verify a password against salt and hash
 */
export function verifyPassword(password, salt, hash) {
  if (!password || !salt || !hash) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  if (keyBuffer.length !== hashBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, hashBuffer);
}

/**
 * Create a session token for a user
 */
export function createSession(user) {
  const token = `sess_${crypto.randomBytes(24).toString('hex')}`;
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  sessions.set(token, {
    userId: user.id,
    role: user.role,
    expiresAt
  });
  return token;
}

/**
 * Validate a session token
 */
export function getSession(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

/**
 * Invalidate a session
 */
export function destroySession(token) {
  if (token) {
    sessions.delete(token);
  }
}
