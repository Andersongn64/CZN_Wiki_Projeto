import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        timeout: 120000,      // 👈 timeout do proxy (2 minutos)
        proxyTimeout: 120000, // 👈 timeout da conexão com o backend (2 minutos)
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
          });
        }
      }
    }
  }
})