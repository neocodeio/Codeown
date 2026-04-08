import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          'vendor-clerk': ['@clerk/clerk-react'],
          'vendor-ui': ['phosphor-react', 'framer-motion', 'react-toastify'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-utils': ['axios', 'date-fns', 'socket.io-client'],
        }
      }
    }
  },
})
