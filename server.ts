import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractImagesFromUrl } from './lib/extractor.ts';
import { mapStoredImageWithGemini } from './lib/geminiMapper.ts';
import {
  checkDailyLimit,
  consumeDailyLimit,
  streamSearchLinkChat,
  type SearchLinkChatTurn,
} from './lib/searchLinkChat.ts';
import { fetchProxiedImage } from './lib/imageProxy.ts';
import { isValidMediaKey, readImageFromR2 } from './lib/r2Storage.ts';
import {
  extractCoreRequestParams,
  getSearchLinkCoreManifest,
  resolveSearchLinkCoreEndpoint,
  SEARCH_LINK_CORE_NAME,
  SEARCH_LINK_CORE_VERSION,
} from './lib/supabaseServer.ts';
import {
  decodeBase64ImagePayload,
  getRequestOrigin,
  MAX_UPLOAD_BYTES,
  processAndStoreUploadedImage,
  sanitizeUploadFolderPrefix,
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

        const rawFolder =
          typeof req.headers['x-upload-folder'] === 'string'
            ? req.headers['x-upload-folder']
            : typeof req.query.folder === 'string'
              ? req.query.folder
              : req.body &&
                  typeof req.body === 'object' &&
                  !Buffer.isBuffer(req.body)
                ? (req.body as Record<string, unknown>).folder
                : undefined;

        const result = await processAndStoreUploadedImage(
          buffer,
          getRequestOrigin(req.headers),
          sanitizeUploadFolderPrefix(rawFolder),
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

  app.post(
    '/api/chat',
    express.json({ type: 'application/json', limit: '512kb' }),
    async (req, res) => {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const message = typeof body.message === 'string' ? body.message : '';
      const serviceSlug =
        typeof body.serviceSlug === 'string' ? body.serviceSlug : undefined;
      const apiKey = typeof body.apiKey === 'string' ? body.apiKey : undefined;
      const serviceName =
        typeof body.serviceName === 'string' ? body.serviceName : undefined;
      const organizationName =
        typeof body.organizationName === 'string'
          ? body.organizationName
          : undefined;
      const userId = typeof body.userId === 'string' ? body.userId : undefined;
      const history = Array.isArray(body.history)
        ? (body.history as SearchLinkChatTurn[])
        : undefined;
      const fallbackProducts = Array.isArray(body.fallbackProducts)
        ? (body.fallbackProducts as Array<{
            id?: string;
            nombre: string;
            categoria: string;
            descripcion: string;
            imagen_url?: string;
            url?: string;
          }>)
        : undefined;

      const limitStatus = checkDailyLimit(
        req.headers,
        userId,
        req.socket?.remoteAddress,
      );
      if (!limitStatus.allowed) {
        return res.status(429).json({
          ok: false,
          dailyLimitReached: true,
          error:
            'Límite diario alcanzado: tienes 1 consulta al día en Search Link IA para probar tu API. Vuelve mañana.',
        });
      }

      let headersSentAsStream = false;

      for await (const evt of streamSearchLinkChat({
        message,
        history,
        serviceSlug,
        apiKey,
        serviceName,
        organizationName,
        userId,
        fallbackProducts,
      })) {
        if (evt.type === 'error' && !headersSentAsStream) {
          return res.status(evt.status).json({
            ok: false,
            error: evt.error,
          });
        }

        if (!headersSentAsStream) {
          headersSentAsStream = true;
          res.status(200);
          res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-transform');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders?.();
        }

        if (evt.type === 'done') {
          consumeDailyLimit(req.headers, userId, req.socket?.remoteAddress);
        }

        res.write(`event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`);
      }

      if (headersSentAsStream) {
        return res.end();
      }
      return res.status(500).json({ ok: false, error: 'Sin respuesta del servidor.' });
    },
  );

  app.options(['/api/v1/core', '/api/v1/catalog', '/api/v1/services/:slug'], (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, x-api-key, Content-Type',
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('X-Search-Link-Core', SEARCH_LINK_CORE_VERSION);
    return res.status(204).end();
  });

  app.get('/api/v1/core', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Search-Link-Core', SEARCH_LINK_CORE_VERSION);
    return res.json(getSearchLinkCoreManifest(getRequestOrigin(req.headers)));
  });

  app.get(['/api/v1/catalog', '/api/v1/services/:slug'], async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, x-api-key, Content-Type',
    );
    res.setHeader('X-Search-Link-Core', SEARCH_LINK_CORE_VERSION);
    res.setHeader('Cache-Control', 'no-store');

    const slugParam =
      typeof req.params.slug === 'string' ? req.params.slug.trim() : undefined;
    const params = extractCoreRequestParams(req.originalUrl, req.headers, slugParam);
    const result = await resolveSearchLinkCoreEndpoint(params);

    if (!result.ok) {
      return res.status(result.status).json({
        ok: false,
        system: SEARCH_LINK_CORE_NAME,
        version: SEARCH_LINK_CORE_VERSION,
        error: result.error,
      });
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
