export interface CommercialCountry {
  code: string;
  flag: string;
  name: string;
  aliases: string[];
  timezone: string;
}

/**
 * Top 50 commercial countries globally with primary timezones and flags.
 */
export const TOP_50_COMMERCIAL_COUNTRIES: CommercialCountry[] = [
  { code: 'US', flag: '🇺🇸', name: 'Estados Unidos', aliases: ['united states', 'usa', 'eeuu'], timezone: 'America/New_York' },
  { code: 'MX', flag: '🇲🇽', name: 'México', aliases: ['mexico'], timezone: 'America/Mexico_City' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombia', aliases: [], timezone: 'America/Bogota' },
  { code: 'ES', flag: '🇪🇸', name: 'España', aliases: ['spain', 'espanha'], timezone: 'Europe/Madrid' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentina', aliases: [], timezone: 'America/Argentina/Buenos_Aires' },
  { code: 'BR', flag: '🇧🇷', name: 'Brasil', aliases: ['brazil'], timezone: 'America/Sao_Paulo' },
  { code: 'CL', flag: '🇨🇱', name: 'Chile', aliases: [], timezone: 'America/Santiago' },
  { code: 'PE', flag: '🇵🇪', name: 'Perú', aliases: ['peru'], timezone: 'America/Lima' },
  { code: 'EC', flag: '🇪🇨', name: 'Ecuador', aliases: [], timezone: 'America/Guayaquil' },
  { code: 'PA', flag: '🇵🇦', name: 'Panamá', aliases: ['panama'], timezone: 'America/Panama' },
  { code: 'DO', flag: '🇩🇴', name: 'República Dominicana', aliases: ['republica dominicana', 'dominican republic'], timezone: 'America/Santo_Domingo' },
  { code: 'CR', flag: '🇨🇷', name: 'Costa Rica', aliases: [], timezone: 'America/Costa_Rica' },
  { code: 'GT', flag: '🇬🇹', name: 'Guatemala', aliases: [], timezone: 'America/Guatemala' },
  { code: 'UY', flag: '🇺🇾', name: 'Uruguay', aliases: [], timezone: 'America/Montevideo' },
  { code: 'PY', flag: '🇵🇾', name: 'Paraguay', aliases: [], timezone: 'America/Asuncion' },
  { code: 'BO', flag: '🇧🇴', name: 'Bolivia', aliases: [], timezone: 'America/La_Paz' },
  { code: 'SV', flag: '🇸🇻', name: 'El Salvador', aliases: [], timezone: 'America/El_Salvador' },
  { code: 'HN', flag: '🇭🇳', name: 'Honduras', aliases: [], timezone: 'America/Tegucigalpa' },
  { code: 'CA', flag: '🇨🇦', name: 'Canadá', aliases: ['canada'], timezone: 'America/Toronto' },
  { code: 'GB', flag: '🇬🇧', name: 'Reino Unido', aliases: ['united kingdom', 'uk', 'inglaterra'], timezone: 'Europe/London' },
  { code: 'DE', flag: '🇩🇪', name: 'Alemania', aliases: ['germany', 'alemanha'], timezone: 'Europe/Berlin' },
  { code: 'FR', flag: '🇫🇷', name: 'Francia', aliases: ['france'], timezone: 'Europe/Paris' },
  { code: 'IT', flag: '🇮🇹', name: 'Italia', aliases: ['italy'], timezone: 'Europe/Rome' },
  { code: 'PT', flag: '🇵🇹', name: 'Portugal', aliases: [], timezone: 'Europe/Lisbon' },
  { code: 'NL', flag: '🇳🇱', name: 'Países Bajos', aliases: ['paises bajos', 'netherlands', 'holanda'], timezone: 'Europe/Amsterdam' },
  { code: 'BE', flag: '🇧🇪', name: 'Bélgica', aliases: ['belgica', 'belgium'], timezone: 'Europe/Brussels' },
  { code: 'CH', flag: '🇨🇭', name: 'Suiza', aliases: ['switzerland', 'suica'], timezone: 'Europe/Zurich' },
  { code: 'AT', flag: '🇦🇹', name: 'Austria', aliases: [], timezone: 'Europe/Vienna' },
  { code: 'SE', flag: '🇸🇪', name: 'Suecia', aliases: ['sweden', 'suecia'], timezone: 'Europe/Stockholm' },
  { code: 'NO', flag: '🇳🇴', name: 'Noruega', aliases: ['norway'], timezone: 'Europe/Oslo' },
  { code: 'DK', flag: '🇩🇰', name: 'Dinamarca', aliases: ['denmark'], timezone: 'Europe/Copenhagen' },
  { code: 'PL', flag: '🇵🇱', name: 'Polonia', aliases: ['poland'], timezone: 'Europe/Warsaw' },
  { code: 'IE', flag: '🇮🇪', name: 'Irlanda', aliases: ['ireland'], timezone: 'Europe/Dublin' },
  { code: 'CN', flag: '🇨🇳', name: 'China', aliases: [], timezone: 'Asia/Shanghai' },
  { code: 'JP', flag: '🇯🇵', name: 'Japón', aliases: ['japon', 'japan'], timezone: 'Asia/Tokyo' },
  { code: 'KR', flag: '🇰🇷', name: 'Corea del Sur', aliases: ['south korea', 'coreia do sul'], timezone: 'Asia/Seoul' },
  { code: 'IN', flag: '🇮🇳', name: 'India', aliases: [], timezone: 'Asia/Kolkata' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapur', aliases: ['singapore', 'cingapura'], timezone: 'Asia/Singapore' },
  { code: 'AE', flag: '🇦🇪', name: 'Emiratos Árabes Unidos', aliases: ['emiratos arabes', 'uae', 'emirates'], timezone: 'Asia/Dubai' },
  { code: 'SA', flag: '🇸🇦', name: 'Arabia Saudita', aliases: ['saudi arabia'], timezone: 'Asia/Riyadh' },
  { code: 'IL', flag: '🇮🇱', name: 'Israel', aliases: [], timezone: 'Asia/Jerusalem' },
  { code: 'TR', flag: '🇹🇷', name: 'Turquía', aliases: ['turquia', 'turkey'], timezone: 'Europe/Istanbul' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia', aliases: [], timezone: 'Australia/Sydney' },
  { code: 'NZ', flag: '🇳🇿', name: 'Nueva Zelanda', aliases: ['new zealand', 'nova zelandia'], timezone: 'Pacific/Auckland' },
  { code: 'ID', flag: '🇮🇩', name: 'Indonesia', aliases: [], timezone: 'Asia/Jakarta' },
  { code: 'TH', flag: '🇹🇭', name: 'Tailandia', aliases: ['thailand'], timezone: 'Asia/Bangkok' },
  { code: 'MY', flag: '🇲🇾', name: 'Malasia', aliases: ['malaysia'], timezone: 'Asia/Kuala_Lumpur' },
  { code: 'VN', flag: '🇻🇳', name: 'Vietnam', aliases: [], timezone: 'Asia/Ho_Chi_Minh' },
  { code: 'PH', flag: '🇵🇭', name: 'Filipinas', aliases: ['philippines'], timezone: 'Asia/Manila' },
  { code: 'ZA', flag: '🇿🇦', name: 'Sudáfrica', aliases: ['sudafrica', 'south africa'], timezone: 'Africa/Johannesburg' },
];

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[n];
}

function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Matches user country input against the 50 commercial countries.
 * Returns a match on exact normalized spelling or >= 80% orthographic similarity.
 */
export function matchCommercialCountry(
  rawInput: string,
): CommercialCountry | null {
  const normalized = normalizeText(rawInput);
  if (normalized.length < 3) return null;

  // 1. Exact orthographic check (case- and accent-normalized)
  for (const country of TOP_50_COMMERCIAL_COUNTRIES) {
    if (normalizeText(country.name) === normalized) return country;
    if (country.aliases.some((alias) => normalizeText(alias) === normalized)) {
      return country;
    }
  }

  // 2. High-confidence (>= 80%) orthographic similarity tolerance
  let bestMatch: CommercialCountry | null = null;
  let bestScore = 0;

  for (const country of TOP_50_COMMERCIAL_COUNTRIES) {
    const candidates = [country.name, ...country.aliases];
    for (const candidate of candidates) {
      const score = similarityRatio(normalized, normalizeText(candidate));
      if (score >= 0.8 && score > bestScore) {
        bestScore = score;
        bestMatch = country;
      }
    }
  }

  return bestMatch;
}
