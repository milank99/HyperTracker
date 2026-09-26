import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CERTS_DIR = path.resolve(__dirname, '../../../certs');
const KEY_PATH = path.join(CERTS_DIR, 'key.pem');
const CERT_PATH = path.join(CERTS_DIR, 'cert.pem');

export function getTlsCredentials() {
  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
  }

  if (!fs.existsSync(KEY_PATH) || !fs.existsSync(CERT_PATH)) {
    console.log('[SECURITY] TLS certificates missing. Generating local self-signed certificates...');
    try {
      execSync(
        `openssl req -x509 -newkey rsa:2048 -keyout "${KEY_PATH}" -out "${CERT_PATH}" -days 365 -nodes -subj "/CN=localhost"`,
        { stdio: 'pipe' }
      );
      console.log('[SECURITY] Generated fresh TLS certificates in:', CERTS_DIR);
    } catch (err) {
      console.error('[SECURITY] Failed to generate TLS certificates with OpenSSL:', err.message);
      throw err;
    }
  }

  return {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH),
    keyPath: KEY_PATH,
    certPath: CERT_PATH
  };
}
