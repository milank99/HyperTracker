import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const keyPath = path.resolve(__dirname, '../certs/key.pem')
const certPath = path.resolve(__dirname, '../certs/cert.pem')

const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath)

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: hasCerts ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    } : false,
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
