import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5175,
    host: true, // Listen on all network interfaces
    strictPort: true,
    proxy: {
      '^/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxy
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url);
            proxyReq.setHeader('x-forwarded-proto', 'http');
          });
        }
      },
      '/binance-api': {
        target: 'https://api.binance.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/binance-api/, '/api/v3'),
      },
    },
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5175',
        'https://main.djqiswxonnw5x.amplifyapp.com',
        'https://traderedgepro.com'
      ],
      credentials: true
    }
  },
});
