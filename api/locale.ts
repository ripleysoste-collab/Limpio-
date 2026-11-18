import type { IncomingMessage, ServerResponse } from 'node:http';
import { detectLocaleFromRequest } from '../lib/localeDetection.ts';

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed. Use GET.' });
  }

  const result = await detectLocaleFromRequest(
    req.headers,
    req.socket?.remoteAddress,
  );
  return sendJson(res, 200, {
    ok: true,
    ...result,
  });
}
