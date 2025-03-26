// Vite configuration for the frontend
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    target: 'es2018'
  }
}) 