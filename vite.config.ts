import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Custom plugin to remove StatCounter from single-file build
const removeStatCounterPlugin = (mode: string | undefined) => {
  return {
    name: 'remove-statcounter',
    transformIndexHtml(html: string) {
      if (mode === 'singlefile') {
        // Remove StatCounter blocks for single-file build
        html = html.replace(/<!-- STATCOUNTER_START -->[\s\S]*?<!-- STATCOUNTER_END -->/g, '');
        html = html.replace(/<!-- STATCOUNTER_NOSCRIPT_START -->[\s\S]*?<!-- STATCOUNTER_NOSCRIPT_END -->/g, '');
      }
      return html;
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    removeStatCounterPlugin(mode),
    // Only use single-file plugin in singlefile mode
    ...(mode === 'singlefile' ? [viteSingleFile()] : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy /api calls to deployed site for local development
      // During local dev, this proxies to your deployed Vercel app where the serverless function runs
      // Alternative: Run `vercel dev` locally and point to http://localhost:3000
      '/api': {
        target: process.env.VITE_DEPLOYED_SITE_URL || 'https://sql-rooms-demo.vercel.app',
        changeOrigin: true,
        secure: true,
        // Rewrite not needed - /api/openai-proxy will be forwarded as-is
      },
    },
  },
  build: {
    // Use different output directory for single-file build
    outDir: mode === 'singlefile' ? 'dist-single' : 'dist',
    minify: 'terser' as const,
    terserOptions: {
      compress: {
        drop_console: true, // Automatically removes all console.logs in production build
      },
    },
  },
}))