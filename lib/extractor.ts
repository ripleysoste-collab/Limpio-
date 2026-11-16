import * as cheerio from 'cheerio';
import { imageSize } from 'image-size';
import { safeFetch } from './urlSafety.ts';

export interface ExtractedCatalogImage {
  id: string;
  url: string;
  originalUrl: string;
  cleanUrl: string;
  sourcePageUrl: string;
  alt: string;
  width: number;
  height: number;
}

export interface ExtractImagesResult {
  sourceUrl: string;
  images: ExtractedCatalogImage[];
  totalCandidates: number;
}

interface RawCandidate {
  url: string;
  alt: string;
  priority: number;
}

const MIN_DIMENSION_PX = 200;
const MAX_HTML_BYTES = 4 * 1024 * 1024;
const MAX_PROBE_CANDIDATES = 65;
const MAX_RESULTS = 15;
const PROBE_CONCURRENCY = 8;
const MAX_IMAGE_PROBE_BYTES = 256 * 1024;

const BROWSER_HEADER_PROFILES: Record<string, string>[] = [
  {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/png,image/jpeg,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
  },
  {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
  },
];

const JUNK_EXTENSIONS = /\.(svg|ico|cur|woff2?|ttf|eot|mp4|webm|mov|pdf|css|js)(\?|#|$)/i;
const JUNK_KEYWORDS =
  /(^|[^a-z])(logo|icon|icono|favicon|sprite|spacer|pixel|1x1|tracking|analytics|telemetry|spinner|loader|loading|placeholder|emoji|doubleclick|adsense|blank|transparent)([^a-z]|$)/i;
const IMAGE_EXT_REGEX = /\.(jpe?g|png|webp|gif)(\?|#|$)/i;

const TRACKING_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
]);

function resolveHttpUrl(raw: string | undefined, baseUrl: string): string | null {
  if (!raw) return null;
  const trimmed = raw
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/');

  if (
    !trimmed ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('#')
  ) {
    return null;
  }

  try {
    const resolved = new URL(trimmed, baseUrl);
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return null;
    }
    resolved.hash = '';
    return resolved.href;
  } catch {
    return null;
  }
}

function pickBestSrcsetCandidate(srcset: string | undefined, baseUrl: string): string | null {
  if (!srcset) return null;

  let bestUrl: string | null = null;
  let bestScore = -1;

  for (const entry of srcset.split(',')) {
    const parts = entry.trim().split(/\s+/);
    if (!parts[0]) continue;
    const candidateUrl = resolveHttpUrl(parts[0], baseUrl);
    if (!candidateUrl) continue;

    let score = 1;
    const descriptor = parts[1]?.toLowerCase() ?? '';
    if (descriptor.endsWith('w')) {
      score = parseInt(descriptor, 10) || 1;
    } else if (descriptor.endsWith('x')) {
      score = Math.round((parseFloat(descriptor) || 1) * 1000);
    }

    if (score > bestScore) {
      bestScore = score;
      bestUrl = candidateUrl;
    }
  }

  return bestUrl;
}

function extractCssUrlValues(cssText: string, baseUrl: string): string[] {
  const results: string[] = [];
  const regex = /url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(cssText)) !== null) {
    const resolved = resolveHttpUrl(match[2], baseUrl);
    if (resolved) results.push(resolved);
  }
  return results;
}

function extractScriptImageUrls(scriptText: string, baseUrl: string): string[] {
  const results: string[] = [];
  const regex =
    /(?:https?:\\?\/\\?\/|\/)[^\s"'`<>()\\]{6,320}\.(?:jpe?g|png|webp)(?:\?[^\s"'`<>()\\]{0,120})?/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(scriptText)) !== null) {
    const resolved = resolveHttpUrl(match[0], baseUrl);
    if (resolved) results.push(resolved);
    if (results.length >= 30) break;
  }
  return results;
}

function isJunkCandidateUrl(url: string): boolean {
  if (JUNK_EXTENSIONS.test(url)) return true;
  try {
    const parsed = new URL(url);
    const pathAndQuery = `${parsed.pathname}${parsed.search}`;
    if (JUNK_KEYWORDS.test(pathAndQuery)) return true;
    return false;
  } catch {
    return true;
  }
}

function buildCleanDisplayUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (TRACKING_QUERY_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }
    return parsed.href;
  } catch {
    return rawUrl;
  }
}

function deriveTitleFromUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const lastSegment = parsed.pathname.split('/').filter(Boolean).pop() ?? '';
    const cleanName = decodeURIComponent(lastSegment)
      .replace(/\.[a-z0-9]{2,5}$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    if (cleanName.length >= 2) {
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1, 80);
    }
    return parsed.hostname;
  } catch {
    return 'Imagen extraída';
  }
}

function collectJsonLdImages(node: unknown, baseUrl: string, out: RawCandidate[]) {
  if (!node) return;
  if (typeof node === 'string') {
    const resolved = resolveHttpUrl(node, baseUrl);
    if (resolved) out.push({ url: resolved, alt: '', priority: 2 });
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectJsonLdImages(item, baseUrl, out);
    }
    return;
  }
  if (typeof node === 'object') {
    const record = node as Record<string, unknown>;
    const label =
      typeof record.name === 'string'
        ? record.name
        : typeof record.headline === 'string'
          ? record.headline
          : '';

    const imageKeys = ['image', 'images', 'thumbnailUrl', 'contentUrl', 'photo'];
    for (const key of imageKeys) {
      if (!(key in record)) continue;
      const val = record[key];
      if (typeof val === 'string') {
        const resolved = resolveHttpUrl(val, baseUrl);
        if (resolved) out.push({ url: resolved, alt: label, priority: 2 });
      } else {
        collectJsonLdImages(val, baseUrl, out);
      }
    }

    if ('@graph' in record) {
      collectJsonLdImages(record['@graph'], baseUrl, out);
    }
    if ('itemListElement' in record) {
      collectJsonLdImages(record.itemListElement, baseUrl, out);
    }
    if ('offers' in record) {
      collectJsonLdImages(record.offers, baseUrl, out);
    }
  }
}

function extractNearestHeading($el: cheerio.Cheerio<any>): string {
  const ownAlt = ($el.attr('alt') || $el.attr('title') || $el.attr('aria-label') || '').trim();
  if (ownAlt.length >= 2) return ownAlt.slice(0, 90);

  const container = $el.closest('figure, article, li, a, div, section');
  if (container.length > 0) {
    const nearby = container
      .find('figcaption, h1, h2, h3, h4, [class*="title"], [class*="name"]')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    if (nearby.length >= 2 && nearby.length <= 90) return nearby;
  }

  return '';
}

async function readHtmlTextWithLimit(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return (await response.text()).slice(0, MAX_HTML_BYTES);
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.byteLength;
    if (total >= MAX_HTML_BYTES) {
      await reader.cancel().catch(() => {});
      break;
    }
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function fetchHtmlWithFallback(targetUrl: string): Promise<{ html: string; finalUrl: string }> {
  let lastError: Error | null = null;

  for (const headers of BROWSER_HEADER_PROFILES) {
    try {
      const { response, finalUrl } = await safeFetch(targetUrl, {
        headers,
        timeoutMs: 9000,
      });

      if (response.status === 403 || response.status === 406 || response.status === 429) {
        lastError = new Error(`El sitio respondió con estado ${response.status}.`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`No se pudo cargar la página (HTTP ${response.status}).`);
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (
        contentType &&
        !contentType.includes('text/html') &&
        !contentType.includes('application/xhtml+xml')
      ) {
        throw new Error('La URL no corresponde a una página web HTML.');
      }

      const html = await readHtmlTextWithLimit(response);
      return { html, finalUrl };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('No se pudo leer la página.');
    }
  }

  throw lastError ?? new Error('No fue posible leer la página solicitada.');
}

async function probeImageDimensions(
  candidateUrl: string,
  refererUrl: string,
): Promise<{ width: number; height: number } | null> {
  try {
    const { response } = await safeFetch(candidateUrl, {
      headers: {
        'User-Agent': BROWSER_HEADER_PROFILES[0]['User-Agent'],
        // Prefer JPEG/WebP/PNG so binary header parsers read dimensions in the first few KB
        Accept: 'image/webp,image/png,image/jpeg,image/*;q=0.8',
        Referer: refererUrl,
      },
      timeoutMs: 4200,
    });

    if (!response.ok) return null;

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const isImageHeader = contentType.startsWith('image/');
    const isBinaryFallback =
      (!contentType || contentType.includes('octet-stream')) &&
      IMAGE_EXT_REGEX.test(candidateUrl);

    if (
      (!isImageHeader && !isBinaryFallback) ||
      contentType.includes('svg') ||
      contentType.includes('icon')
    ) {
      await response.body?.cancel().catch(() => {});
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) return null;

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (totalBytes < MAX_IMAGE_PROBE_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      totalBytes += value.byteLength;

      const combined = Buffer.concat(chunks);
      try {
        const size = imageSize(combined);
        if (size.width && size.height) {
          await reader.cancel().catch(() => {});
          return { width: size.width, height: size.height };
        }
      } catch {
        // Need more bytes from header stream
      }
    }

    await reader.cancel().catch(() => {});
    return null;
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, idx: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const current = cursor++;
      results[current] = await worker(items[current], current);
    }
  });

  await Promise.all(runners);
  return results;
}

export async function extractImagesFromUrl(rawUrl: string): Promise<ExtractImagesResult> {
  const { html, finalUrl } = await fetchHtmlWithFallback(rawUrl);
  const $ = cheerio.load(html);
  const rawCandidates: RawCandidate[] = [];

  // 1. <img> tags (lazy attrs, srcset, src)
  $('img').each((_, el) => {
    const $el = $(el);
    const label = extractNearestHeading($el);
    const preferredUrls = [
      pickBestSrcsetCandidate($el.attr('data-srcset'), finalUrl),
      pickBestSrcsetCandidate($el.attr('srcset'), finalUrl),
      resolveHttpUrl($el.attr('data-large_image'), finalUrl),
      resolveHttpUrl($el.attr('data-zoom-image'), finalUrl),
      resolveHttpUrl($el.attr('data-hi-res-src'), finalUrl),
      resolveHttpUrl($el.attr('data-full-src'), finalUrl),
      resolveHttpUrl($el.attr('data-src-retina'), finalUrl),
      resolveHttpUrl($el.attr('data-original'), finalUrl),
      resolveHttpUrl($el.attr('data-lazy-src'), finalUrl),
      resolveHttpUrl($el.attr('data-lazy'), finalUrl),
      resolveHttpUrl($el.attr('data-src'), finalUrl),
      resolveHttpUrl($el.attr('data-image'), finalUrl),
      resolveHttpUrl($el.attr('src'), finalUrl),
    ].filter((u): u is string => Boolean(u)).filter((u) => !isJunkCandidateUrl(u));

    const nonAvif = preferredUrls.find((u) => !/\.avif(\?|#|$)/i.test(u));
    const chosen = nonAvif ?? preferredUrls[0];
    if (chosen) {
      rawCandidates.push({ url: chosen, alt: label, priority: 1 });
    }
  });

  // 2. <picture> <source> & background data attributes
  $('picture source').each((_, el) => {
    const $el = $(el);
    const best =
      pickBestSrcsetCandidate($el.attr('data-srcset'), finalUrl) ??
      pickBestSrcsetCandidate($el.attr('srcset'), finalUrl);
    if (best) {
      rawCandidates.push({ url: best, alt: '', priority: 2 });
    }
  });

  $('[data-bg], [data-background], [data-background-image]').each((_, el) => {
    const $el = $(el);
    const rawBg =
      $el.attr('data-bg') || $el.attr('data-background') || $el.attr('data-background-image');
    const resolved = resolveHttpUrl(rawBg, finalUrl);
    if (resolved) {
      rawCandidates.push({ url: resolved, alt: '', priority: 2 });
    }
  });

  // 3. Inline CSS background-image & <style> blocks
  $('[style*="background"]').each((_, el) => {
    const styleAttr = $(el).attr('style') || '';
    for (const cssUrl of extractCssUrlValues(styleAttr, finalUrl)) {
      rawCandidates.push({ url: cssUrl, alt: '', priority: 3 });
    }
  });

  $('style').each((_, el) => {
    const cssText = $(el).html() || '';
    for (const cssUrl of extractCssUrlValues(cssText, finalUrl).slice(0, 12)) {
      rawCandidates.push({ url: cssUrl, alt: '', priority: 4 });
    }
  });

  // 4. OpenGraph & Twitter Card meta images
  const metaTitle = ($('meta[property="og:title"]').attr('content') || $('title').text() || '').trim();
  const metaSelectors = [
    'meta[property="og:image:secure_url"]',
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[property="twitter:image"]',
  ];
  for (const selector of metaSelectors) {
    $(selector).each((_, el) => {
      const resolved = resolveHttpUrl($(el).attr('content'), finalUrl);
      if (resolved) {
        rawCandidates.push({ url: resolved, alt: metaTitle.slice(0, 90), priority: 2 });
      }
    });
  }

  // 5. Structured JSON-LD & Hydration Scripts (__NEXT_DATA__, Shopify, Nuxt, etc.)
  $('script[type="application/ld+json"]').each((_, el) => {
    const rawJson = $(el).contents().text().trim();
    if (!rawJson) return;
    try {
      const parsed = JSON.parse(rawJson);
      collectJsonLdImages(parsed, finalUrl, rawCandidates);
    } catch {
      // Ignore malformed JSON-LD blocks
    }
  });

  $('script:not([src])').each((_, el) => {
    const type = ($(el).attr('type') || '').toLowerCase();
    if (type === 'application/ld+json') return;
    const text = $(el).contents().text();
    if (!text || text.length < 20) return;
    for (const scriptUrl of extractScriptImageUrls(text.slice(0, 250_000), finalUrl)) {
      rawCandidates.push({ url: scriptUrl, alt: '', priority: 3 });
    }
  });

  // Deduplicate & pre-filter junk before touching image streams
  const dedupedMap = new Map<string, RawCandidate>();
  for (const item of rawCandidates) {
    if (isJunkCandidateUrl(item.url)) continue;
    const existing = dedupedMap.get(item.url);
    if (!existing) {
      dedupedMap.set(item.url, item);
    } else {
      if (!existing.alt && item.alt) existing.alt = item.alt;
      if (item.priority < existing.priority) existing.priority = item.priority;
    }
  }

  const orderedCandidates = Array.from(dedupedMap.values())
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_PROBE_CANDIDATES);

  const probed = await mapWithConcurrency(
    orderedCandidates,
    PROBE_CONCURRENCY,
    async (candidate) => {
      const dims = await probeImageDimensions(candidate.url, finalUrl);
      if (!dims) return null;
      if (dims.width < MIN_DIMENSION_PX || dims.height < MIN_DIMENSION_PX) {
        return null;
      }
      return { candidate, dims };
    },
  );

  const validItems: ExtractedCatalogImage[] = [];
  for (const entry of probed) {
    if (!entry) continue;
    const { candidate, dims } = entry;
    const cleanUrl = buildCleanDisplayUrl(candidate.url);
    const proxyParams = new URLSearchParams({
      url: candidate.url,
      ref: finalUrl,
    });

    validItems.push({
      id: `ext-${validItems.length + 1}-${Buffer.from(candidate.url).toString('base64url').slice(0, 10)}`,
      url: `/api/image-proxy?${proxyParams.toString()}`,
      originalUrl: candidate.url,
      cleanUrl,
      sourcePageUrl: candidate.url,
      alt: candidate.alt || deriveTitleFromUrl(candidate.url),
      width: dims.width,
      height: dims.height,
    });

    if (validItems.length >= MAX_RESULTS) break;
  }

  return {
    sourceUrl: finalUrl,
    images: validItems,
    totalCandidates: dedupedMap.size,
  };
}
