import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['glistening-communication-production-e375.up.railway.app'],
    watch: {
      usePolling: true,
    },
  },
})