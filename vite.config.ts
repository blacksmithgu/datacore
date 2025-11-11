import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/vite-entry.ts'),
      name: 'DatacoreVite',
      fileName: (format) => `datacore-vite.${format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        'obsidian',
        'preact',
        'preact/compat',
        'preact/hooks',
        'luxon',
        '@fortawesome/fontawesome-svg-core',
        '@fortawesome/free-solid-svg-icons',
        '@fortawesome/react-fontawesome'
      ],
      output: {
        globals: {
          obsidian: 'obsidian',
          preact: 'preact',
          'preact/compat': 'preactCompat',
          'preact/hooks': 'preactHooks',
          luxon: 'luxon'
        }
      }
    },
    outDir: 'build/vite',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat'
    }
  },
  define: {
    // Ensure proper environment variables for Preact
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
});