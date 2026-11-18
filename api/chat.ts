import type { IncomingMessage, ServerResponse } from 'node:http';
import { runSearchLinkChat, type SearchLinkChatTurn } from '../lib/searchLinkChat.ts';

interface VercelLikeRequest extends IncomingMessage {
  body?: unknown;
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: VercelLikeRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
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

export default async function handler(req: VercelLikeRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Método no permitido. Usa POST.' });
  }

  const body = await readJsonBody(req);
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

  const result = await runSearchLinkChat({
    message,
    history,
    serviceSlug,
    apiKey,
    serviceName,
    organizationName,
    fallbackProducts,
  });

  if (!result.ok) {
    return sendJson(res, result.status, {
      ok: false,
      error: result.error,
    });
  }

  return sendJson(res, 200, result);
}
