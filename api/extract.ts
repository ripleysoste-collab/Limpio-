import type { IncomingMessage, ServerResponse } from 'node:http';
import { extractImagesFromUrl } from '../lib/extractor.ts';

interface VercelLikeRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}

interface VercelLikeResponse extends ServerResponse {
  status?: (code: number) => VercelLikeResponse;
  json?: (payload: unknown) => void;
}

function sendJson(res: VercelLikeResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readRequestBody(req: VercelLikeRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Método no permitido. Usa POST.' });
  }

  try {
    const body = await readRequestBody(req);
    const rawUrl = typeof body.url === 'string' ? body.url : '';
    const maxResults =
      typeof body.maxResults === 'number' && Number.isFinite(body.maxResults)
        ? body.maxResults
        : undefined;
    const result = await extractImagesFromUrl(rawUrl, { maxResults });

    if (result.images.length === 0) {
      return sendJson(res, 422, {
        error:
          'No se encontraron imágenes válidas de al menos 200×200 píxeles en esa página.',
        sourceUrl: result.sourceUrl,
      });
    }

    return sendJson(res, 200, result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Ocurrió un error al analizar la página.';
    return sendJson(res, 400, { error: message });
  }
}
