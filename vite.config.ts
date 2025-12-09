import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite Configuration
 *
 * Configures Vite for the Code Inventory Dashboard.
 *
 * Features:
 * - React plugin with Fast Refresh
 * - Path aliases matching tsconfig.json
 * - Development server configuration
 * - Build optimizations
 */
export default defineConfig({
  plugins: [
    // React plugin with Fast Refresh
    react(),
  ],

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~components': path.resolve(__dirname, './src/components'),
      '~features': path.resolve(__dirname, './src/features'),
      '~theme': path.resolve(__dirname, './src/theme'),
      '~styles': path.resolve(__dirname, './src/styles'),
    },
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true, // Auto-open browser
    cors: true,
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'tanstack-vendor': ['@tanstack/react-router', '@tanstack/react-query'],
        },
      },
    },
  },

  // Optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@tanstack/react-router',
      '@tanstack/react-query',
    ],
  },
});
