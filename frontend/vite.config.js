import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Suppress benign tab close / page refresh socket abort warnings
            if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET') return;
            console.warn('Socket proxy warning:', err.message);
          });
        },
      },
    },
  },
});
