import type { IncomingMessage, ServerResponse } from 'node:http';
import { fetchCatalogByApiKey } from '../../lib/supabaseServer.ts';

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, x-api-key, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.end(JSON.stringify(payload, null, 2));
}

function extractApiKeyFromRequest(req: IncomingMessage): string {
  const rawAuth = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  if (rawAuth.toLowerCase().startsWith('bearer ')) {
    return rawAuth.slice(7).trim();
  }

  const headerKey = typeof req.headers['x-api-key'] === 'string' ? req.headers['x-api-key'] : '';
  if (headerKey.trim()) return headerKey.trim();

  try {
    const parsed = new URL(req.url || '/', 'http://localhost');
    return (
      parsed.searchParams.get('key') ||
      parsed.searchParams.get('apiKey') ||
      parsed.searchParams.get('api_key') ||
      ''
    ).trim();
  } catch {
    return '';
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, x-api-key, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return sendJson(res, 405, { error: 'Método no permitido. Usa GET.' });
  }

  const apiKey = extractApiKeyFromRequest(req);
  const result = await fetchCatalogByApiKey(apiKey);

  if (!result.ok) {
    return sendJson(res, result.status, { ok: false, error: result.error });
  }

  return sendJson(res, 200, {
    ok: true,
    ...result.data,
  });
}
