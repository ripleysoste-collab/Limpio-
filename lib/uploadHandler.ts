import { buildSafeObjectKey, isR2Configured, uploadImageToR2 } from './r2Storage.ts';

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

interface DetectedImageFormat {
  extension: string;
  contentType: string;
}

export function detectImageFormat(buffer: Buffer): DetectedImageFormat | null {
  if (buffer.byteLength < 12) return null;

  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { extension: 'webp', contentType: 'image/webp' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: 'jpg', contentType: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { extension: 'png', contentType: 'image/png' };
  }

  // GIF: GIF87a or GIF89a
  const gifSig = buffer.subarray(0, 6).toString('ascii');
  if (gifSig === 'GIF87a' || gifSig === 'GIF89a') {
    return { extension: 'gif', contentType: 'image/gif' };
  }

  // AVIF / HEIF ISOBMFF box
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('ascii').toLowerCase();
    if (brand === 'avif' || brand === 'avis') {
      return { extension: 'avif', contentType: 'image/avif' };
    }
  }

  return null;
}

export interface ImageUploadResponse {
  key: string;
  url: string;
  sizeBytes: number;
  contentType: string;
}

export async function processAndStoreUploadedImage(
  buffer: Buffer,
): Promise<ImageUploadResponse> {
  if (!isR2Configured()) {
    throw new Error('El almacenamiento en la nube aún no está configurado.');
  }

  if (!buffer || buffer.byteLength === 0) {
    throw new Error('El archivo de imagen está vacío.');
  }

  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error('La imagen supera el límite máximo permitido de 4 MB.');
  }

  const detected = detectImageFormat(buffer);
  if (!detected) {
    throw new Error('El archivo no corresponde a un formato de imagen válido.');
  }

  const key = buildSafeObjectKey({
    prefix: 'catalog',
    extension: detected.extension,
  });

  const stored = await uploadImageToR2({
    key,
    body: buffer,
    contentType: detected.contentType,
  });

  return {
    key: stored.key,
    url: stored.url,
    sizeBytes: stored.sizeBytes,
    contentType: detected.contentType,
  };
}
