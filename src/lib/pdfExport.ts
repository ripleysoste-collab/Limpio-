import { jsPDF } from 'jspdf';
import type { CatalogImageItem } from '../data/catalogSamples';
import type { MappedImageMetadata } from './imageCompression';
import type { CompressedImageMeta } from '../components/MobileCatalogCarousel';

export type CatalogPdfExportKind =
  | 'json'
  | 'images'
  | 'urls'
  | 'metadata'
  | 'all';

export interface CatalogPdfExportInput {
  kind: CatalogPdfExportKind;
  images: CatalogImageItem[];
  mappedResults: Record<string, MappedImageMetadata>;
  compressionResults: Record<string, CompressedImageMeta>;
}

interface LoadedCanvasImage {
  dataUrl: string;
  width: number;
  height: number;
}

function resolveBestItemUrl(
  item: CatalogImageItem,
  mapped?: MappedImageMetadata,
  compressed?: CompressedImageMeta,
): string {
  return (
    compressed?.url ||
    mapped?.url ||
    item.sourcePageUrl ||
    (!item.url.startsWith('blob:') ? item.url : '') ||
    item.cleanUrl ||
    item.url
  );
}

function loadImageElement(src: string, withAnonymousCors: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (withAnonymousCors) {
      img.crossOrigin = 'anonymous';
    }
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

async function fetchImageForPdf(url: string): Promise<LoadedCanvasImage | null> {
  if (!url) return null;

  const candidates: Array<{ src: string; cors: boolean }> = [];
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    candidates.push({ src: url, cors: false });
  } else {
    candidates.push({ src: url, cors: true });
    candidates.push({
      src: `/api/image-proxy?url=${encodeURIComponent(url)}`,
      cors: false,
    });
  }

  for (const candidate of candidates) {
    try {
      const img = await loadImageElement(candidate.src, candidate.cors);
      const naturalW = img.naturalWidth || img.width || 800;
      const naturalH = img.naturalHeight || img.height || 800;

      const maxDim = 1000;
      const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
      const targetW = Math.max(1, Math.round(naturalW * scale));
      const targetH = Math.max(1, Math.round(naturalH * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      return { dataUrl, width: targetW, height: targetH };
    } catch {
      // Try next candidate
    }
  }

  return null;
}

function addDocumentHeader(doc: jsPDF, title: string, subtitle: string): number {
  const marginX = 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(title, marginX, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, marginX, 26.5);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, 30, 194, 30);

  return 38;
}

export async function generateAndDownloadCatalogPdf({
  kind,
  images,
  mappedResults,
  compressionResults,
}: CatalogPdfExportInput): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentW = pageW - marginX * 2;
  const bottomLimit = pageH - 16;
  const dateLabel = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  const ensureSpace = (currentY: number, neededHeight: number): number => {
    if (currentY + neededHeight > bottomLimit) {
      doc.addPage();
      return 18;
    }
    return currentY;
  };

  if (kind === 'json') {
    let cursorY = addDocumentHeader(
      doc,
      'Mapeo JSON — Search Link',
      `${images.length} elementos • Generado el ${dateLabel}`,
    );

    const payload = images.map((item) => {
      const mapped = mappedResults[item.id];
      const compressed = compressionResults[item.id];
      const url = resolveBestItemUrl(item, mapped, compressed);
      return {
        nombre: mapped?.nombre || item.alt || 'Producto',
        categoria: mapped?.categoria || 'General',
        descripcion: mapped?.descripcion || '',
        url,
      };
    });

    const jsonString = JSON.stringify(payload, null, 2);
    const lines = doc.splitTextToSize(jsonString, contentW) as string[];
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(30, 41, 59);

    const lineHeight = 4.3;
    for (const line of lines) {
      cursorY = ensureSpace(cursorY, lineHeight);
      doc.text(line, marginX, cursorY);
      cursorY += lineHeight;
    }

    doc.save('search-link-mapeo-json.pdf');
    return;
  }

  if (kind === 'urls') {
    let cursorY = addDocumentHeader(
      doc,
      'URLs — Search Link',
      `${images.length} enlaces • Generado el ${dateLabel}`,
    );

    images.forEach((item, index) => {
      const mapped = mappedResults[item.id];
      const compressed = compressionResults[item.id];
      const finalUrl = resolveBestItemUrl(item, mapped, compressed);
      const label = mapped?.nombre || item.alt || `Imagen ${index + 1}`;
      const wrappedUrl = doc.splitTextToSize(finalUrl, contentW) as string[];
      const blockHeight = 6 + wrappedUrl.length * 4.4 + 4;

      cursorY = ensureSpace(cursorY, blockHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${index + 1}. ${label}`, marginX, cursorY);
      cursorY += 5;

      doc.setFont('courier', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(37, 99, 235);
      for (const urlLine of wrappedUrl) {
        doc.text(urlLine, marginX, cursorY);
        cursorY += 4.3;
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(marginX, cursorY + 1, pageW - marginX, cursorY + 1);
      cursorY += 6;
    });

    doc.save('search-link-urls.pdf');
    return;
  }

  if (kind === 'metadata') {
    let cursorY = addDocumentHeader(
      doc,
      'Metadatos — Search Link',
      `${images.length} productos • Generado el ${dateLabel}`,
    );

    images.forEach((item, index) => {
      const mapped = mappedResults[item.id];
      const compressed = compressionResults[item.id];
      const nombre = mapped?.nombre || item.alt || `Producto ${index + 1}`;
      const categoria = mapped?.categoria || 'General';
      const descripcion = mapped?.descripcion || 'Sin descripción disponible.';
      const url = resolveBestItemUrl(item, mapped, compressed);

      const descLines = doc.splitTextToSize(descripcion, contentW) as string[];
      const urlLines = doc.splitTextToSize(`URL: ${url}`, contentW) as string[];
      const blockH =
        16 + descLines.length * 4.5 + urlLines.length * 4.2 + 8;

      cursorY = ensureSpace(cursorY, blockH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${index + 1}. ${nombre}`, marginX, cursorY);
      cursorY += 5.2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.2);
      doc.setTextColor(71, 85, 105);
      doc.text(`Categoría: ${categoria}`, marginX, cursorY);
      cursorY += 5;

      doc.setFontSize(9.2);
      doc.setTextColor(30, 41, 59);
      for (const line of descLines) {
        cursorY = ensureSpace(cursorY, 4.5);
        doc.text(line, marginX, cursorY);
        cursorY += 4.5;
      }

      cursorY += 1.5;
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(37, 99, 235);
      for (const line of urlLines) {
        cursorY = ensureSpace(cursorY, 4.2);
        doc.text(line, marginX, cursorY);
        cursorY += 4.2;
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, cursorY + 2, pageW - marginX, cursorY + 2);
      cursorY += 8;
    });

    doc.save('search-link-metadatos.pdf');
    return;
  }

  // Load images cleanly for 'images' and 'all'
  const loadedImages = await Promise.all(
    images.map(async (item) => {
      const mapped = mappedResults[item.id];
      const compressed = compressionResults[item.id];
      const primaryUrl = compressed?.url || mapped?.url || item.url;
      let loaded = await fetchImageForPdf(primaryUrl);
      if (!loaded && item.url !== primaryUrl) {
        loaded = await fetchImageForPdf(item.url);
      }
      return loaded;
    }),
  );

  if (kind === 'images') {
    let cursorY = addDocumentHeader(
      doc,
      'Imágenes — Search Link',
      `${images.length} imágenes • Generado el ${dateLabel}`,
    );

    const colGap = 10;
    const cellW = (contentW - colGap) / 2;
    const maxImgH = 68;

    for (let i = 0; i < images.length; i += 2) {
      const rowHeight = maxImgH + 14;
      cursorY = ensureSpace(cursorY, rowHeight);

      for (let col = 0; col < 2; col++) {
        const idx = i + col;
        if (idx >= images.length) break;
        const item = images[idx];
        const loaded = loadedImages[idx];
        const mapped = mappedResults[item.id];
        const x = marginX + col * (cellW + colGap);

        if (loaded) {
          const ratio = loaded.width / loaded.height;
          let drawW = cellW;
          let drawH = drawW / ratio;
          if (drawH > maxImgH) {
            drawH = maxImgH;
            drawW = drawH * ratio;
          }
          const offsetX = x + (cellW - drawW) / 2;
          const offsetY = cursorY + (maxImgH - drawH) / 2;
          doc.addImage(loaded.dataUrl, 'JPEG', offsetX, offsetY, drawW, drawH);
        } else {
          doc.setDrawColor(203, 213, 225);
          doc.rect(x, cursorY, cellW, maxImgH);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(148, 163, 184);
          doc.text('Imagen no disponible', x + cellW / 2, cursorY + maxImgH / 2, {
            align: 'center',
          });
        }

        const caption = `${idx + 1}. ${mapped?.nombre || item.alt || `Imagen ${idx + 1}`}`;
        const truncatedCaption =
          caption.length > 38 ? `${caption.slice(0, 35)}...` : caption;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(truncatedCaption, x, cursorY + maxImgH + 6);
      }

      cursorY += rowHeight + 4;
    }

    doc.save('search-link-imagenes.pdf');
    return;
  }

  // kind === 'all': nombres, imágenes, metadatos y URLs
  let cursorY = addDocumentHeader(
    doc,
    'Catálogo Completo — Search Link',
    `${images.length} productos • Nombres, imágenes, metadatos y URLs • ${dateLabel}`,
  );

  images.forEach((item, index) => {
    const mapped = mappedResults[item.id];
    const compressed = compressionResults[item.id];
    const loaded = loadedImages[index];

    const nombre = mapped?.nombre || item.alt || `Producto ${index + 1}`;
    const categoria = mapped?.categoria || 'General';
    const descripcion = mapped?.descripcion || 'Sin descripción disponible.';
    const finalUrl = resolveBestItemUrl(item, mapped, compressed);

    const thumbBox = 38;
    const textColX = marginX + thumbBox + 6;
    const textColW = contentW - thumbBox - 6;

    const descLines = doc.splitTextToSize(descripcion, textColW) as string[];
    const urlLines = doc.splitTextToSize(finalUrl, textColW) as string[];
    const textHeight = 14 + descLines.length * 4.2 + urlLines.length * 4 + 4;
    const itemHeight = Math.max(thumbBox, textHeight) + 10;

    cursorY = ensureSpace(cursorY, itemHeight);

    if (loaded) {
      const ratio = loaded.width / loaded.height;
      let drawW = thumbBox;
      let drawH = drawW / ratio;
      if (drawH > thumbBox) {
        drawH = thumbBox;
        drawW = drawH * ratio;
      }
      const offsetX = marginX + (thumbBox - drawW) / 2;
      const offsetY = cursorY + (thumbBox - drawH) / 2;
      doc.addImage(loaded.dataUrl, 'JPEG', offsetX, offsetY, drawW, drawH);
    } else {
      doc.setDrawColor(203, 213, 225);
      doc.rect(marginX, cursorY, thumbBox, thumbBox);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Sin imagen', marginX + thumbBox / 2, cursorY + thumbBox / 2, {
        align: 'center',
      });
    }

    let textY = cursorY + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${index + 1}. ${nombre}`, textColX, textY);
    textY += 4.8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Categoría: ${categoria}`, textColX, textY);
    textY += 4.8;

    doc.setFontSize(8.8);
    doc.setTextColor(30, 41, 59);
    for (const line of descLines) {
      doc.text(line, textColX, textY);
      textY += 4.2;
    }

    textY += 1;
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(37, 99, 235);
    for (const line of urlLines) {
      doc.text(line, textColX, textY);
      textY += 3.9;
    }

    cursorY += Math.max(thumbBox, textY - cursorY) + 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, cursorY, pageW - marginX, cursorY);
    cursorY += 6;
  });

  doc.save('search-link-catalogo-completo.pdf');
}
