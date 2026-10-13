import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || process.cwd(), '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      allowedHosts: true as const,
      proxy: {
        '/api': {
          target: 'https://greenovapk.com',
          changeOrigin: true,
          secure: false,
          headers: {
            'Origin': 'https://greenovapk.com',
            'Referer': 'https://greenovapk.com/',
          },
        },
      },
    },
  };
});
