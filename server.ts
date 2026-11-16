import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractImagesFromUrl } from './lib/extractor.ts';
import { mapStoredImageWithGemini } from './lib/geminiMapper.ts';
import { fetchProxiedImage } from './lib/imageProxy.ts';
import { isValidMediaKey, readImageFromR2 } from './lib/r2Storage.ts';
import { fetchCatalogByApiKey } from './lib/supabaseServer.ts';
import {
  decodeBase64ImagePayload,
  getRequestOrigin,
  MAX_UPLOAD_BYTES,
  processAndStoreUploadedImage,
} from './lib/uploadHandler.ts';

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
            'No se encontraron imágenes válidas de al menos 200×200 píxeles en esa página.',
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

  app.get('/api/media', async (req, res) => {
    const key = typeof req.query.k === 'string' ? req.query.k : '';
    if (!key || !isValidMediaKey(key)) {
      return res.status(400).send('Invalid media key');
    }

    try {
      const { buffer, contentType, etag } = await readImageFromR2(key);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (etag) {
        res.setHeader('ETag', etag);
      }
      return res.send(buffer);
    } catch {
      return res.status(404).send('Media not found');
    }
  });

  app.post(
    '/api/upload',
    express.json({ type: 'application/json', limit: '6mb' }),
    express.raw({ type: 'image/*', limit: MAX_UPLOAD_BYTES }),
    async (req, res) => {
      try {
        const buffer = Buffer.isBuffer(req.body)
          ? req.body
          : decodeBase64ImagePayload(req.body);

        if (!buffer || buffer.byteLength === 0) {
          return res.status(400).json({
            error: 'No se recibió un archivo de imagen válido.',
          });
        }

        const result = await processAndStoreUploadedImage(
          buffer,
          getRequestOrigin(req.headers),
        );
        return res.json(result);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al subir la imagen.';
        return res.status(400).json({ error: message });
      }
    },
  );

  app.post(
    '/api/map-image',
    express.json({ type: 'application/json', limit: '5mb' }),
    async (req, res) => {
      try {
        const body = (req.body ?? {}) as Record<string, unknown>;
        const key = typeof body.key === 'string' ? body.key : undefined;
        const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : '';
        const dataBase64 =
          typeof body.dataBase64 === 'string' ? body.dataBase64 : undefined;
        const mimeType =
          typeof body.mimeType === 'string' ? body.mimeType : undefined;

        if (!imageUrl) {
          return res.status(400).json({
            error: 'Falta la URL de la imagen para mapear.',
          });
        }

        const mapped = await mapStoredImageWithGemini({
          key,
          imageUrl,
          dataBase64,
          mimeType,
        });
        return res.json(mapped);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo mapear la imagen con IA.';
        return res.status(400).json({ error: message });
      }
    },
  );

  app.options('/api/v1/catalog', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, x-api-key, Content-Type',
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(204).end();
  });

  app.get('/api/v1/catalog', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, x-api-key, Content-Type',
    );

    const rawAuth =
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization
        : '';
    const bearerKey = rawAuth.toLowerCase().startsWith('bearer ')
      ? rawAuth.slice(7).trim()
      : '';
    const headerKey =
      typeof req.headers['x-api-key'] === 'string'
        ? req.headers['x-api-key'].trim()
        : '';
    const queryKey =
      typeof req.query.key === 'string'
        ? req.query.key.trim()
        : typeof req.query.apiKey === 'string'
          ? req.query.apiKey.trim()
          : typeof req.query.api_key === 'string'
            ? req.query.api_key.trim()
            : '';

    const apiKey = bearerKey || headerKey || queryKey;
    const result = await fetchCatalogByApiKey(apiKey);

    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.error });
    }

    return res.json({
      ok: true,
      ...result.data,
    });
  });

  app.get(['/auth/callback', '/auth/callback/'], (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Conectando con Search Link…</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: system-ui, -apple-system, sans-serif;
        background: #f8fafc;
        color: #0f172a;
        padding: 24px;
        text-align: center;
      }
      .card {
        max-width: 360px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 12px 32px -12px rgba(15, 23, 42, 0.14);
      }
      p { margin: 8px 0 0; font-size: 13px; color: #64748b; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="card">
      <strong>Autenticación completada</strong>
      <p id="status">Volviendo a Search Link…</p>
    </div>
    <script>
      (function () {
        var payload = {
          type: 'SEARCHLINK_OAUTH_RESULT',
          hash: window.location.hash || '',
          search: window.location.search || '',
        };
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            var ch = new BroadcastChannel('searchlink-oauth');
            ch.postMessage(payload);
            ch.close();
          }
        } catch (e) {}
        if (window.opener && window.opener !== window) {
          try {
            window.opener.postMessage(payload, window.location.origin);
          } catch (e) {}
          try {
            window.opener.postMessage(payload, '*');
          } catch (e) {}
          window.close();
          setTimeout(function () {
            document.getElementById('status').textContent =
              'Ya puedes cerrar esta ventana y volver a Search Link.';
          }, 400);
        } else {
          window.location.replace('/' + (window.location.search || '') + (window.location.hash || ''));
        }
      })();
    </script>
  </body>
</html>`);
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
