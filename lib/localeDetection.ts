import type { IncomingHttpHeaders } from 'node:http';

export type SupportedLocale = 'es' | 'en' | 'pt';

export interface LocaleDetectionResult {
  locale: SupportedLocale;
  countryCode: string | null;
  source: 'ip' | 'header' | 'fallback';
}

const SPANISH_COUNTRIES = new Set([
  'ES',
  'MX',
  'CO',
  'AR',
  'PE',
  'VE',
  'CL',
  'EC',
  'GT',
  'CU',
  'BO',
  'DO',
  'HN',
  'PY',
  'SV',
  'NI',
  'CR',
  'PA',
  'UY',
  'GQ',
  'PR',
]);

const PORTUGUESE_COUNTRIES = new Set([
  'BR',
  'PT',
  'AO',
  'MZ',
  'CV',
  'GW',
  'ST',
  'TL',
]);

export function mapCountryToLocale(countryCode: string | null | undefined): SupportedLocale | null {
  const code = (countryCode || '').trim().toUpperCase();
  if (!code || code === 'XX' || code === 'T1' || code.length !== 2) {
    return null;
  }
  if (SPANISH_COUNTRIES.has(code)) return 'es';
  if (PORTUGUESE_COUNTRIES.has(code)) return 'pt';
  return 'en';
}

export function mapAcceptLanguageToLocale(
  acceptLanguage: string | string[] | undefined,
): SupportedLocale | null {
  const raw = Array.isArray(acceptLanguage)
    ? acceptLanguage.join(',')
    : acceptLanguage || '';
  if (!raw.trim()) return null;

  const tags = raw
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase() || '')
    .filter(Boolean);

  for (const tag of tags) {
    if (tag === 'es' || tag.startsWith('es-')) return 'es';
    if (tag === 'pt' || tag.startsWith('pt-')) return 'pt';
    if (tag === 'en' || tag.startsWith('en-')) return 'en';
  }

  return null;
}

function getHeaderString(
  headers: IncomingHttpHeaders,
  name: string,
): string | null {
  const value = headers[name.toLowerCase()];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0].trim();
  }
  return null;
}

function extractClientIp(
  headers: IncomingHttpHeaders,
  remoteAddress?: string,
): string | null {
  const forwarded = getHeaderString(headers, 'x-forwarded-for');
  const realIp = getHeaderString(headers, 'x-real-ip');
  const cfConnecting = getHeaderString(headers, 'cf-connecting-ip');
  const candidate =
    (forwarded ? forwarded.split(',')[0]?.trim() : null) ||
    cfConnecting ||
    realIp ||
    (remoteAddress ? remoteAddress.trim() : null);

  if (!candidate) return null;
  const cleaned = candidate.replace(/^::ffff:/i, '').trim();
  if (
    !cleaned ||
    cleaned === '::1' ||
    cleaned === '127.0.0.1' ||
    cleaned.startsWith('10.') ||
    cleaned.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(cleaned) ||
    cleaned.startsWith('fc') ||
    cleaned.startsWith('fd')
  ) {
    return null;
  }
  return cleaned;
}

async function lookupCountryByIp(ip: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);
  try {
    const res = await fetch(`https://api.country.is/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as { country?: unknown };
    if (typeof data.country === 'string' && data.country.trim().length === 2) {
      return data.country.trim().toUpperCase();
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function detectLocaleFromRequest(
  headers: IncomingHttpHeaders,
  remoteAddress?: string,
): Promise<LocaleDetectionResult> {
  // 1. Platform edge IP geo headers (Vercel / Cloudflare / proxy)
  const edgeCountry =
    getHeaderString(headers, 'x-vercel-ip-country') ||
    getHeaderString(headers, 'cf-ipcountry') ||
    getHeaderString(headers, 'x-country-code');

  const edgeLocale = mapCountryToLocale(edgeCountry);
  if (edgeLocale && edgeCountry) {
    return {
      locale: edgeLocale,
      countryCode: edgeCountry.trim().toUpperCase(),
      source: 'ip',
    };
  }

  // 2. Public client IP geolocation lookup (if a non-private IP is forwarded)
  const publicIp = extractClientIp(headers, remoteAddress);
  if (publicIp) {
    const lookedUpCountry = await lookupCountryByIp(publicIp);
    const lookedUpLocale = mapCountryToLocale(lookedUpCountry);
    if (lookedUpLocale && lookedUpCountry) {
      return {
        locale: lookedUpLocale,
        countryCode: lookedUpCountry,
        source: 'ip',
      };
    }
  }

  // 3. Browser Accept-Language fallback
  const headerLocale = mapAcceptLanguageToLocale(headers['accept-language']);
  if (headerLocale) {
    return {
      locale: headerLocale,
      countryCode: null,
      source: 'header',
    };
  }

  // 4. Primary platform language fallback (Español)
  return {
    locale: 'es',
    countryCode: null,
    source: 'fallback',
  };
}
