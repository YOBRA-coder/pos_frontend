import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'https://pos-backend-1-8vot.onrender.com/', changeOrigin: true }
    },
    //allowedHosts: ["https://pos-backend-1-7h9e.onrender.com/]
  }

})
