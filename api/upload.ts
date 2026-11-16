import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  decodeBase64ImagePayload,
  getRequestOrigin,
  MAX_UPLOAD_BYTES,
  processAndStoreUploadedImage,
} from '../lib/uploadHandler.ts';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface VercelLikeRequest extends IncomingMessage {
  body?: unknown;
}

const MAX_JSON_UPLOAD_BYTES = 6 * 1024 * 1024;

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readStreamBytes(
  req: IncomingMessage,
  maxBytes: number,
): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    totalBytes += buf.byteLength;
    if (totalBytes > maxBytes) {
      throw new Error('La imagen supera el límite máximo permitido de 4 MB.');
    }
    chunks.push(buf);
  }

  return Buffer.concat(chunks);
}

async function readUploadBuffer(req: VercelLikeRequest): Promise<Buffer> {
  const contentType = (req.headers['content-type'] || '').toLowerCase();

  if (contentType.includes('application/json')) {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return decodeBase64ImagePayload(req.body);
    }

    const rawText =
      typeof req.body === 'string'
        ? req.body
        : Buffer.isBuffer(req.body)
          ? req.body.toString('utf8')
          : (await readStreamBytes(req, MAX_JSON_UPLOAD_BYTES)).toString('utf8');

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error('Payload JSON inválido al subir la imagen.');
    }
    return decodeBase64ImagePayload(parsed);
  }

  if (contentType.startsWith('image/')) {
    if (Buffer.isBuffer(req.body)) {
      return req.body;
    }
    if (req.body instanceof Uint8Array) {
      return Buffer.from(req.body);
    }
    if (typeof req.body === 'string' && req.body.length > 0) {
      return Buffer.from(req.body, 'binary');
    }
    return readStreamBytes(req, MAX_UPLOAD_BYTES);
  }

  throw new Error('Tipo de contenido no válido. Envía una imagen.');
}

export default async function handler(req: VercelLikeRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Método no permitido. Usa POST.' });
  }

  try {
    const buffer = await readUploadBuffer(req);
    const result = await processAndStoreUploadedImage(
      buffer,
      getRequestOrigin(req.headers),
    );
    return sendJson(res, 200, result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'No se pudo guardar la imagen.';
    return sendJson(res, 400, { error: message });
  }
}
