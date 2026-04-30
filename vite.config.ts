import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    cacheDir: '.vite-cache',
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // Keep the app shell small by separating the heavy visualization stack from core runtime code.
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id) || id.includes('react/jsx-runtime')) return 'react-vendor';
            if (id.includes('motion')) return 'motion-vendor';
            if (id.includes('recharts') || id.includes('d3')) return 'visualization-vendor';
            if (id.includes('lucide-react')) return 'icons';

            return 'vendor';
          }
        }
      }
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
