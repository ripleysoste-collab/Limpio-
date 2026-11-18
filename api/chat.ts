import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  checkDailyLimit,
  consumeDailyLimit,
  streamSearchLinkChat,
  type SearchLinkChatTurn,
} from '../lib/searchLinkChat.ts';
import type { SupportedLocale } from '../lib/localeDetection.ts';

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
  const userId = typeof body.userId === 'string' ? body.userId : undefined;
  const locale: SupportedLocale =
    body.locale === 'en' || body.locale === 'pt' || body.locale === 'es'
      ? body.locale
      : 'es';
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
    return sendJson(res, 429, {
      ok: false,
      dailyLimitReached: true,
      error:
        locale === 'en'
          ? 'Daily limit reached: you have 1 Search Link IA query per day to test your API. Try again tomorrow.'
          : locale === 'pt'
            ? 'Limite diário atingido: você tem 1 consulta por dia no Search Link IA para testar sua API. Tente amanhã.'
            : 'Límite diario alcanzado: tienes 1 consulta al día en Search Link IA para probar tu API. Vuelve mañana.',
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
    locale,
    fallbackProducts,
  })) {
    if (evt.type === 'error' && !headersSentAsStream) {
      return sendJson(res, evt.status, {
        ok: false,
        error: evt.error,
      });
    }

    if (!headersSentAsStream) {
      headersSentAsStream = true;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
    }

    if (evt.type === 'done') {
      consumeDailyLimit(req.headers, userId, req.socket?.remoteAddress);
    }

    res.write(`event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`);
  }

  if (headersSentAsStream) {
    res.end();
  }
}
