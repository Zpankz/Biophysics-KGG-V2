import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },

  // Build optimizations
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: true,

    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React
          'vendor-react': ['react', 'react-dom'],

          // Separate chunk for force-graph libraries
          'vendor-graph-2d': ['react-force-graph-2d'],
          'vendor-graph-3d': ['react-force-graph-3d', 'three', 'three-spritetext'],
          'vendor-graph-ar': ['react-force-graph-ar'],
          'vendor-graph-vr': ['react-force-graph-vr'],

          // AI SDKs chunk
          'vendor-ai': ['@anthropic-ai/sdk', 'openai'],

          // Supabase chunk
          'vendor-supabase': ['@supabase/supabase-js'],

          // Layout algorithms
          'vendor-layout': ['dagre'],
        },
      },
    },

    chunkSizeWarningLimit: 1000,
  },

  // Development server
  server: {
    port: 5173,
    strictPort: true,
    open: true,
    hmr: { overlay: true },
  },

  // Preview server
  preview: {
    port: 4173,
    strictPort: true,
    open: true,
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-force-graph-2d',
      'react-force-graph-3d',
      'three',
      'dagre',
    ],
  },
})