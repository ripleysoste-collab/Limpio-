import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractImagesFromUrl } from './lib/extractor.ts';
import { fetchProxiedImage } from './lib/imageProxy.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.post('/api/extract', async (req, res) => {
    try {
      const rawUrl = typeof req.body?.url === 'string' ? req.body.url : '';
      const result = await extractImagesFromUrl(rawUrl);

      if (result.images.length === 0) {
        return res.status(422).json({
          error:
            'No se encontraron imágenes válidas de al menos 250×250 píxeles en esa página.',
          sourceUrl: result.sourceUrl,
        });
      }

      return res.json(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ocurrió un error al analizar la página.';
      return res.status(400).json({ error: message });
    }
  });

  app.get('/api/image-proxy', async (req, res) => {
    const rawImageUrl = typeof req.query.url === 'string' ? req.query.url : '';
    const rawReferer = typeof req.query.ref === 'string' ? req.query.ref : undefined;

    if (!rawImageUrl) {
      return res.status(400).send('Missing url parameter');
    }

    try {
      const { contentType, buffer } = await fetchProxiedImage(rawImageUrl, rawReferer);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.send(buffer);
    } catch {
      return res.status(502).send('Image fetch failed');
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(rootDir, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Search Link server running on http://localhost:${PORT}`);
  });
}

startServer();
