import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'https://posbackend-production-d5e4.up.railway.app', changeOrigin: true }
    },
    //allowedHosts: ["https://posbackend-production-d5e4.up.railway.app"]
  }

})
