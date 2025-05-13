import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on mode and current working directory
  const env = loadEnv(mode, process.cwd(), ''); // The third argument prefix, '' means load all env vars

  return {
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 8000,
      proxy: {
        '/api/v1': {
          target: env.VITE_DEV_GO_BACKEND_TARGET || 'http://localhost:1234', // Use loaded env var
          changeOrigin: true,
          // We don't need a rewrite rule here because the frontend will call /api/v1/...
          // and the Go backend also expects /api/v1/...
        },
      },
    },
  };
});
