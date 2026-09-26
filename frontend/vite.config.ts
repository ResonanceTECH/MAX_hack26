import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const backend = process.env.VITE_PROXY_TARGET || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/auth': backend,
      '/me': backend,
      '/companies': backend,
      '/opportunities': backend,
      '/proposals': backend,
      '/deals': backend,
      '/matches': backend,
      '/notifications': backend,
      '/favorites': backend,
      '/invites': backend,
      '/moderation': backend,
      '/reports': backend,
      '/escalations': backend,
      '/admin': backend,
      '/files': backend,
      '/dictionaries': backend,
      '/ai': backend,
      '/feed': backend,
      '/share': backend,
      '/health': backend,
      '/api': backend,
      '/docs': backend,
      '/openapi.json': backend,
      '/redoc': backend,
    },
  },
})
