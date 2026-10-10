import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: [".manus.computer", ".sg2.manus.computer", "localhost", "127.0.0.1"],
    proxy: {
      "/api": { target: "http://127.0.0.1:8001", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8001", changeOrigin: true },
      "/_app": { target: "http://127.0.0.1:8001", changeOrigin: true },
      "/ws": { target: "http://127.0.0.1:8001", changeOrigin: true, ws: true },
    },
  },
})
