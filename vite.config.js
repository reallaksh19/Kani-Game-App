import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const saveMasterTilesPlugin = () => ({
  name: 'save-master-tiles-middleware',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url && req.url.includes('/api/save-master-tiles') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const filePath = path.resolve(__dirname, 'public/data/master_tiles.json');
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, body, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, file: filePath }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      } else if (req.url && req.url.includes('/api/log-session') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const filePath = path.resolve(__dirname, 'public/data/sessions.json');
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            let existing = [];
            if (fs.existsSync(filePath)) {
              try {
                existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              } catch {
                existing = [];
              }
            }
            const sessionData = JSON.parse(body);
            const idx = existing.findIndex(s => s.sessionId === sessionData.sessionId);
            if (idx >= 0) {
              existing[idx] = { ...existing[idx], ...sessionData };
            } else {
              existing.unshift(sessionData);
            }
            if (existing.length > 100) existing = existing.slice(0, 100);
            fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: existing.length }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      } else {
        next();
      }
    });
  }
});

export default defineConfig({
  plugins: [react(), saveMasterTilesPlugin()],
  base: '/Kani-Game-App/',
  server: {
    port: 3000
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
});

