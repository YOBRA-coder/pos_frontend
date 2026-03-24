import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'https://eryn-semihumanized-willard.ngrok-free.dev', changeOrigin: true }
    },
    allowedHosts: ["eryn-semihumanized-willard.ngrok-free.dev"]
  }

})
