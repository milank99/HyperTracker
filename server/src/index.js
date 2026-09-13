import express from 'express';
import cors from 'cors';
import https from 'node:https';
import http from 'node:http';
import { resolveUser } from './middleware/rbac.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import projectsRouter from './routes/projects.js';
import issuesRouter from './routes/issues.js';
import commentsRouter from './routes/comments.js';
import teamRouter from './routes/team.js';
import backupRouter from './routes/backup.js';
import { runSeed } from './db/seed.js';
import { getTlsCredentials } from './utils/certs.js';

const app = express();
const HTTPS_PORT = process.env.HTTPS_PORT || 3001;

// HTTPS Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS & Body parser
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-auth-token']
}));
app.use(express.json({ limit: '10mb' }));

// Attach active user context from header for RBAC
app.use(resolveUser);

// Ensure initial seed is populated
runSeed();

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/issues', issuesRouter);
app.use('/api', commentsRouter);
app.use('/api/team', teamRouter);
app.use('/api/backup', backupRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    protocol: req.protocol,
    secure: req.secure,
    timestamp: new Date().toISOString(),
    currentUser: req.currentUser
  });
});

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const HOST = process.env.HOST || '0.0.0.0';

// Start HTTPS Server
try {
  const credentials = getTlsCredentials();
  const httpsServer = https.createServer({
    key: credentials.key,
    cert: credentials.cert
  }, app);

  httpsServer.listen(HTTPS_PORT, HOST, () => {
    console.log(`[SECURITY] HyperTrack HTTPS Server listening on https://${HOST}:${HTTPS_PORT}`);
  });
} catch (err) {
  console.error('[SECURITY] Failed to start HTTPS server, falling back to HTTP:', err.message);
  app.listen(HTTPS_PORT, HOST, () => {
    console.log(`[SERVER] Fallback HTTP Server listening on http://${HOST}:${HTTPS_PORT}`);
  });
}
