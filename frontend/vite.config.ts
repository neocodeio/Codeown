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
    rollupOptions: {
      output: {
        manualChunks: {
          'clerk-vendor': ['@clerk/clerk-react'],
          'ui-vendor': ['@hugeicons/react', '@hugeicons/core-free-icons'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'prism-vendor': ['prismjs'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
