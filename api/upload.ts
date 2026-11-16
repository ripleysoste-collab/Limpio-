import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  getRequestOrigin,
  MAX_UPLOAD_BYTES,
  processAndStoreUploadedImage,
} from '../lib/uploadHandler.ts';

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readBinaryBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    totalBytes += buf.byteLength;
    if (totalBytes > MAX_UPLOAD_BYTES) {
      throw new Error('La imagen supera el límite máximo de 4 MB.');
    }
    chunks.push(buf);
  }

  return Buffer.concat(chunks);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Método no permitido. Usa POST.' });
  }

  try {
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      return sendJson(res, 415, {
        error: 'Tipo de contenido no válido. Envía una imagen.',
      });
    }

    const buffer = await readBinaryBody(req);
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
