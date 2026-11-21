import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes.ts';
import path from 'path';

const app = express();
const httpServer = createHttpServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

// Mount the standalone API router (100% disconnected from greenovapk.com)
app.use('/api', apiRouter);

// Vite middleware for frontend development
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production static assets
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  } else {
    // Unregister any previously installed dev service worker so the preview iframe never serves stale cached HTML
    app.get('/dev-sw.js', (_req, res) => {
      res.type('application/javascript');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.send(`
        self.addEventListener('install', () => self.skipWaiting());
        self.addEventListener('activate', (event) => {
          event.waitUntil(
            caches.keys()
              .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
              .then(() => self.registration.unregister())
              .then(() => self.clients.matchAll({ type: 'window' }))
              .then((clients) => clients.forEach((c) => c.navigate(c.url)))
          );
        });
      `);
    });

    app.get('/manifest.webmanifest', (_req, res) => {
      res.type('application/manifest+json');
      res.sendFile(path.resolve(process.cwd(), 'dist/manifest.webmanifest'), (err) => {
        if (err) {
          res.json({
            id: '/',
            name: 'GreenOva Poultry Management',
            short_name: 'GreenOva',
            start_url: '/',
            display: 'standalone',
            background_color: '#022c22',
            theme_color: '#022c22',
            icons: [
              { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
              { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            ],
          });
        }
      });
    });

    // Development mode with Vite middleware bound to the same HTTP server
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`GreenOva Standalone Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
