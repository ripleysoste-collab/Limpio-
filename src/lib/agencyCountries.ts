export interface CountryTimezoneOption {
  offsetLabel: string; // e.g. 'UTC-6'
  shortOffset: string; // e.g. '-6'
  timezone: string; // IANA timezone id
}

export interface CommercialCountry {
  code: string;
  flag: string;
  name: string;
  aliases: string[];
  timezone: string;
  timezones: CountryTimezoneOption[];
  dialCode: string; // digits only without '+'
  nationalMin: number;
  nationalMax: number;
  validNationalPrefixes?: string[];
  exampleNational: string;
}

function singleTz(offset: string, timezone: string): CountryTimezoneOption[] {
  return [{ offsetLabel: `UTC${offset}`, shortOffset: offset, timezone }];
}

/**
 * Top 50 commercial countries globally with primary & multi-zone UTC rules and telecom validation rules.
 */
export const TOP_50_COMMERCIAL_COUNTRIES: CommercialCountry[] = [
  {
    code: 'US',
    flag: '🇺🇸',
    name: 'Estados Unidos',
    aliases: ['united states', 'usa', 'eeuu'],
    timezone: 'America/New_York',
    timezones: [
      { offsetLabel: 'UTC-4', shortOffset: '-4', timezone: 'America/New_York' },
      { offsetLabel: 'UTC-5', shortOffset: '-5', timezone: 'America/New_York' },
      { offsetLabel: 'UTC-6', shortOffset: '-6', timezone: 'America/Chicago' },
      { offsetLabel: 'UTC-7', shortOffset: '-7', timezone: 'America/Denver' },
      { offsetLabel: 'UTC-8', shortOffset: '-8', timezone: 'America/Los_Angeles' },
      { offsetLabel: 'UTC-9', shortOffset: '-9', timezone: 'America/Anchorage' },
      { offsetLabel: 'UTC-10', shortOffset: '-10', timezone: 'Pacific/Honolulu' },
    ],
    dialCode: '1',
    nationalMin: 10,
    nationalMax: 10,
    validNationalPrefixes: ['2', '3', '4', '5', '6', '7', '8', '9'],
    exampleNational: '305 555 0199',
  },
  {
    code: 'MX',
    flag: '🇲🇽',
    name: 'México',
    aliases: ['mexico'],
    timezone: 'America/Mexico_City',
    timezones: [
      { offsetLabel: 'UTC-5', shortOffset: '-5', timezone: 'America/Cancun' },
      { offsetLabel: 'UTC-6', shortOffset: '-6', timezone: 'America/Mexico_City' },
      { offsetLabel: 'UTC-7', shortOffset: '-7', timezone: 'America/Mazatlan' },
      { offsetLabel: 'UTC-8', shortOffset: '-8', timezone: 'America/Tijuana' },
    ],
    dialCode: '52',
    nationalMin: 10,
    nationalMax: 10,
    validNationalPrefixes: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    exampleNational: '55 1234 5678',
  },
  { code: 'CO', flag: '🇨🇴', name: 'Colombia', aliases: [], timezone: 'America/Bogota', timezones: singleTz('-5', 'America/Bogota'), dialCode: '57', nationalMin: 10, nationalMax: 10, validNationalPrefixes: ['3', '60'], exampleNational: '300 123 4567' },
  {
    code: 'ES',
    flag: '🇪🇸',
    name: 'España',
    aliases: ['spain', 'espanha'],
    timezone: 'Europe/Madrid',
    timezones: [
      { offsetLabel: 'UTC+0', shortOffset: '+0', timezone: 'Atlantic/Canary' },
      { offsetLabel: 'UTC+1', shortOffset: '+1', timezone: 'Europe/Madrid' },
      { offsetLabel: 'UTC+2', shortOffset: '+2', timezone: 'Europe/Madrid' },
    ],
    dialCode: '34',
    nationalMin: 9,
    nationalMax: 9,
    validNationalPrefixes: ['6', '7', '8', '9'],
    exampleNational: '612 345 678',
  },
  { code: 'AR', flag: '🇦🇷', name: 'Argentina', aliases: [], timezone: 'America/Argentina/Buenos_Aires', timezones: singleTz('-3', 'America/Argentina/Buenos_Aires'), dialCode: '54', nationalMin: 10, nationalMax: 11, validNationalPrefixes: ['1', '2', '3', '9'], exampleNational: '9 11 2345 6789' },
  {
    code: 'BR',
    flag: '🇧🇷',
    name: 'Brasil',
    aliases: ['brazil'],
    timezone: 'America/Sao_Paulo',
    timezones: [
      { offsetLabel: 'UTC-2', shortOffset: '-2', timezone: 'America/Noronha' },
      { offsetLabel: 'UTC-3', shortOffset: '-3', timezone: 'America/Sao_Paulo' },
      { offsetLabel: 'UTC-4', shortOffset: '-4', timezone: 'America/Manaus' },
      { offsetLabel: 'UTC-5', shortOffset: '-5', timezone: 'America/Rio_Branco' },
    ],
    dialCode: '55',
    nationalMin: 10,
    nationalMax: 11,
    validNationalPrefixes: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    exampleNational: '11 98765 4321',
  },
  {
    code: 'CL',
    flag: '🇨🇱',
    name: 'Chile',
    aliases: [],
    timezone: 'America/Santiago',
    timezones: [
      { offsetLabel: 'UTC-3', shortOffset: '-3', timezone: 'America/Santiago' },
      { offsetLabel: 'UTC-4', shortOffset: '-4', timezone: 'America/Santiago' },
      { offsetLabel: 'UTC-5', shortOffset: '-5', timezone: 'Pacific/Easter' },
      { offsetLabel: 'UTC-6', shortOffset: '-6', timezone: 'Pacific/Easter' },
    ],
    dialCode: '56',
    nationalMin: 9,
    nationalMax: 9,
    validNationalPrefixes: ['2', '3', '4', '5', '6', '7', '8', '9'],
    exampleNational: '9 8765 4321',
  },
  { code: 'PE', flag: '🇵🇪', name: 'Perú', aliases: ['peru'], timezone: 'America/Lima', timezones: singleTz('-5', 'America/Lima'), dialCode: '51', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['9', '1', '4', '5', '6', '7', '8'], exampleNational: '987 654 321' },
  {
    code: 'EC',
    flag: '🇪🇨',
    name: 'Ecuador',
    aliases: [],
    timezone: 'America/Guayaquil',
    timezones: [
      { offsetLabel: 'UTC-5', shortOffset: '-5', timezone: 'America/Guayaquil' },
      { offsetLabel: 'UTC-6', shortOffset: '-6', timezone: 'Pacific/Galapagos' },
    ],
    dialCode: '593',
    nationalMin: 9,
    nationalMax: 9,
    validNationalPrefixes: ['9', '2', '3', '4', '5', '6', '7'],
    exampleNational: '99 123 4567',
  },
  { code: 'PA', flag: '🇵🇦', name: 'Panamá', aliases: ['panama'], timezone: 'America/Panama', timezones: singleTz('-5', 'America/Panama'), dialCode: '507', nationalMin: 7, nationalMax: 8, validNationalPrefixes: ['6', '2', '3', '4', '5', '7', '8', '9'], exampleNational: '6123 4567' },
  { code: 'DO', flag: '🇩🇴', name: 'República Dominicana', aliases: ['republica dominicana', 'dominican republic'], timezone: 'America/Santo_Domingo', timezones: singleTz('-4', 'America/Santo_Domingo'), dialCode: '1', nationalMin: 10, nationalMax: 10, validNationalPrefixes: ['809', '829', '849'], exampleNational: '809 555 0199' },
  { code: 'CR', flag: '🇨🇷', name: 'Costa Rica', aliases: [], timezone: 'America/Costa_Rica', timezones: singleTz('-6', 'America/Costa_Rica'), dialCode: '506', nationalMin: 8, nationalMax: 8, validNationalPrefixes: ['2', '4', '5', '6', '7', '8'], exampleNational: '8312 3456' },
  { code: 'GT', flag: '🇬🇹', name: 'Guatemala', aliases: [], timezone: 'America/Guatemala', timezones: singleTz('-6', 'America/Guatemala'), dialCode: '502', nationalMin: 8, nationalMax: 8, validNationalPrefixes: ['2', '3', '4', '5', '6', '7'], exampleNational: '5123 4567' },
  { code: 'UY', flag: '🇺🇾', name: 'Uruguay', aliases: [], timezone: 'America/Montevideo', timezones: singleTz('-3', 'America/Montevideo'), dialCode: '598', nationalMin: 8, nationalMax: 8, validNationalPrefixes: ['9', '2', '4'], exampleNational: '94 123 456' },
  { code: 'PY', flag: '🇵🇾', name: 'Paraguay', aliases: [], timezone: 'America/Asuncion', timezones: singleTz('-3', 'America/Asuncion'), dialCode: '595', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['9', '2', '3', '4', '5', '6', '7', '8'], exampleNational: '981 123 456' },
  { code: 'BO', flag: '🇧🇴', name: 'Bolivia', aliases: [], timezone: 'America/La_Paz', timezones: singleTz('-4', 'America/La_Paz'), dialCode: '591', nationalMin: 8, nationalMax: 8, validNationalPrefixes: ['6', '7', '2', '3', '4'], exampleNational: '7123 4567' },
  { code: 'SV', flag: '🇸🇻', name: 'El Salvador', aliases: [], timezone: 'America/El_Salvador', timezones: singleTz('-6', 'America/El_Salvador'), dialCode: '503', nationalMin: 8, nationalMax: 8, validNationalPrefixes: ['6', '7', '2'], exampleNational: '7123 4567' },
  { code: 'HN', flag: '🇭🇳', name: 'Honduras', aliases: [], timezone: 'America/Tegucigalpa', timezones: singleTz('-6', 'America/Tegucigalpa'), dialCode: '504', nationalMin: 8, nationalMax: 8, validNationalPrefixes: ['3', '8', '9', '2'], exampleNational: '9123 4567' },
  {
    code: 'CA',
    flag: '🇨🇦',
    name: 'Canadá',
    aliases: ['canada'],
    timezone: 'America/Toronto',
    timezones: [
      { offsetLabel: 'UTC-3:30', shortOffset: '-3:30', timezone: 'America/St_Johns' },
      { offsetLabel: 'UTC-4', shortOffset: '-4', timezone: 'America/Halifax' },
      { offsetLabel: 'UTC-5', shortOffset: '-5', timezone: 'America/Toronto' },
      { offsetLabel: 'UTC-6', shortOffset: '-6', timezone: 'America/Winnipeg' },
      { offsetLabel: 'UTC-7', shortOffset: '-7', timezone: 'America/Edmonton' },
      { offsetLabel: 'UTC-8', shortOffset: '-8', timezone: 'America/Vancouver' },
    ],
    dialCode: '1',
    nationalMin: 10,
    nationalMax: 10,
    validNationalPrefixes: ['2', '3', '4', '5', '6', '7', '8', '9'],
    exampleNational: '416 555 0199',
  },
  { code: 'GB', flag: '🇬🇧', name: 'Reino Unido', aliases: ['united kingdom', 'uk', 'inglaterra'], timezone: 'Europe/London', timezones: singleTz('+0', 'Europe/London'), dialCode: '44', nationalMin: 10, nationalMax: 10, validNationalPrefixes: ['7', '1', '2', '3'], exampleNational: '7700 900123' },
  { code: 'DE', flag: '🇩🇪', name: 'Alemania', aliases: ['germany', 'alemanha'], timezone: 'Europe/Berlin', timezones: singleTz('+1', 'Europe/Berlin'), dialCode: '49', nationalMin: 10, nationalMax: 11, validNationalPrefixes: ['1', '2', '3', '4', '5', '6', '7', '8', '9'], exampleNational: '151 23456789' },
  { code: 'FR', flag: '🇫🇷', name: 'Francia', aliases: ['france'], timezone: 'Europe/Paris', timezones: singleTz('+1', 'Europe/Paris'), dialCode: '33', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['1', '2', '3', '4', '5', '6', '7', '9'], exampleNational: '6 12 34 56 78' },
  { code: 'IT', flag: '🇮🇹', name: 'Italia', aliases: ['italy'], timezone: 'Europe/Rome', timezones: singleTz('+1', 'Europe/Rome'), dialCode: '39', nationalMin: 9, nationalMax: 10, validNationalPrefixes: ['3', '0'], exampleNational: '312 345 6789' },
  {
    code: 'PT',
    flag: '🇵🇹',
    name: 'Portugal',
    aliases: [],
    timezone: 'Europe/Lisbon',
    timezones: [
      { offsetLabel: 'UTC-1', shortOffset: '-1', timezone: 'Atlantic/Azores' },
      { offsetLabel: 'UTC+0', shortOffset: '+0', timezone: 'Europe/Lisbon' },
      { offsetLabel: 'UTC+1', shortOffset: '+1', timezone: 'Europe/Lisbon' },
    ],
    dialCode: '351',
    nationalMin: 9,
    nationalMax: 9,
    validNationalPrefixes: ['9', '2'],
    exampleNational: '912 345 678',
  },
  { code: 'NL', flag: '🇳🇱', name: 'Países Bajos', aliases: ['paises bajos', 'netherlands', 'holanda'], timezone: 'Europe/Amsterdam', timezones: singleTz('+1', 'Europe/Amsterdam'), dialCode: '31', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['6', '1', '2', '3', '4', '5', '7'], exampleNational: '6 12345678' },
  { code: 'BE', flag: '🇧🇪', name: 'Bélgica', aliases: ['belgica', 'belgium'], timezone: 'Europe/Brussels', timezones: singleTz('+1', 'Europe/Brussels'), dialCode: '32', nationalMin: 8, nationalMax: 9, validNationalPrefixes: ['4', '2', '3', '5', '6', '7', '8', '9'], exampleNational: '470 12 34 56' },
  { code: 'CH', flag: '🇨🇭', name: 'Suiza', aliases: ['switzerland', 'suica'], timezone: 'Europe/Zurich', timezones: singleTz('+1', 'Europe/Zurich'), dialCode: '41', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['7', '2', '3', '4', '5', '6', '8'], exampleNational: '79 123 45 67' },
  { code: 'AT', flag: '🇦🇹', name: 'Austria', aliases: [], timezone: 'Europe/Vienna', timezones: singleTz('+1', 'Europe/Vienna'), dialCode: '43', nationalMin: 10, nationalMax: 11, validNationalPrefixes: ['6', '1', '2', '3', '4', '5', '7'], exampleNational: '664 1234567' },
  { code: 'SE', flag: '🇸🇪', name: 'Suecia', aliases: ['sweden', 'suecia'], timezone: 'Europe/Stockholm', timezones: singleTz('+1', 'Europe/Stockholm'), dialCode: '46', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['7', '1', '2', '3', '4', '5', '6', '8', '9'], exampleNational: '70 123 45 67' },
  { code: 'NO', flag: '🇳🇴', name: 'Noruega', aliases: ['norway'], timezone: 'Europe/Oslo', timezones: singleTz('+1', 'Europe/Oslo'), dialCode: '47', nationalMin: 8, nationalMax: 8, validNationalPrefixes: ['4', '9', '2', '3', '5', '6', '7'], exampleNational: '412 34 567' },
  { code: 'DK', flag: '🇩🇰', name: 'Dinamarca', aliases: ['denmark'], timezone: 'Europe/Copenhagen', timezones: singleTz('+1', 'Europe/Copenhagen'), dialCode: '45', nationalMin: 8, nationalMax: 8, validNationalPrefixes: ['2', '3', '4', '5', '6', '7', '8', '9'], exampleNational: '20 12 34 56' },
  { code: 'PL', flag: '🇵🇱', name: 'Polonia', aliases: ['poland'], timezone: 'Europe/Warsaw', timezones: singleTz('+1', 'Europe/Warsaw'), dialCode: '48', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['5', '6', '7', '8', '1', '2', '3', '4', '9'], exampleNational: '501 234 567' },
  { code: 'IE', flag: '🇮🇪', name: 'Irlanda', aliases: ['ireland'], timezone: 'Europe/Dublin', timezones: singleTz('+0', 'Europe/Dublin'), dialCode: '353', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['8', '1', '2', '4', '5', '6', '7', '9'], exampleNational: '85 123 4567' },
  { code: 'CN', flag: '🇨🇳', name: 'China', aliases: [], timezone: 'Asia/Shanghai', timezones: singleTz('+8', 'Asia/Shanghai'), dialCode: '86', nationalMin: 11, nationalMax: 11, validNationalPrefixes: ['1'], exampleNational: '138 0013 8000' },
  { code: 'JP', flag: '🇯🇵', name: 'Japón', aliases: ['japon', 'japan'], timezone: 'Asia/Tokyo', timezones: singleTz('+9', 'Asia/Tokyo'), dialCode: '81', nationalMin: 10, nationalMax: 10, validNationalPrefixes: ['7', '8', '9', '3', '6'], exampleNational: '90 1234 5678' },
  { code: 'KR', flag: '🇰🇷', name: 'Corea del Sur', aliases: ['south korea', 'coreia do sul'], timezone: 'Asia/Seoul', timezones: singleTz('+9', 'Asia/Seoul'), dialCode: '82', nationalMin: 9, nationalMax: 10, validNationalPrefixes: ['1', '2', '3', '4', '5', '6'], exampleNational: '10 1234 5678' },
  { code: 'IN', flag: '🇮🇳', name: 'India', aliases: [], timezone: 'Asia/Kolkata', timezones: singleTz('+5:30', 'Asia/Kolkata'), dialCode: '91', nationalMin: 10, nationalMax: 10, validNationalPrefixes: ['6', '7', '8', '9'], exampleNational: '98765 43210' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapur', aliases: ['singapore', 'cingapura'], timezone: 'Asia/Singapore', timezones: singleTz('+8', 'Asia/Singapore'), dialCode: '65', nationalMin: 8, nationalMax: 8, validNationalPrefixes: ['8', '9', '6'], exampleNational: '8123 4567' },
  { code: 'AE', flag: '🇦🇪', name: 'Emiratos Árabes Unidos', aliases: ['emiratos arabes', 'uae', 'emirates'], timezone: 'Asia/Dubai', timezones: singleTz('+4', 'Asia/Dubai'), dialCode: '971', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['5', '2', '3', '4', '6', '7', '9'], exampleNational: '50 123 4567' },
  { code: 'SA', flag: '🇸🇦', name: 'Arabia Saudita', aliases: ['saudi arabia'], timezone: 'Asia/Riyadh', timezones: singleTz('+3', 'Asia/Riyadh'), dialCode: '966', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['5', '1'], exampleNational: '50 123 4567' },
  { code: 'IL', flag: '🇮🇱', name: 'Israel', aliases: [], timezone: 'Asia/Jerusalem', timezones: singleTz('+2', 'Asia/Jerusalem'), dialCode: '972', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['5', '2', '3', '4', '8', '9'], exampleNational: '50 123 4567' },
  { code: 'TR', flag: '🇹🇷', name: 'Turquía', aliases: ['turquia', 'turkey'], timezone: 'Europe/Istanbul', timezones: singleTz('+3', 'Europe/Istanbul'), dialCode: '90', nationalMin: 10, nationalMax: 10, validNationalPrefixes: ['5', '2', '3', '4'], exampleNational: '532 123 4567' },
  {
    code: 'AU',
    flag: '🇦🇺',
    name: 'Australia',
    aliases: [],
    timezone: 'Australia/Sydney',
    timezones: [
      { offsetLabel: 'UTC+8', shortOffset: '+8', timezone: 'Australia/Perth' },
      { offsetLabel: 'UTC+9:30', shortOffset: '+9:30', timezone: 'Australia/Darwin' },
      { offsetLabel: 'UTC+10', shortOffset: '+10', timezone: 'Australia/Sydney' },
      { offsetLabel: 'UTC+10:30', shortOffset: '+10:30', timezone: 'Australia/Adelaide' },
      { offsetLabel: 'UTC+11', shortOffset: '+11', timezone: 'Australia/Sydney' },
    ],
    dialCode: '61',
    nationalMin: 9,
    nationalMax: 9,
    validNationalPrefixes: ['4', '2', '3', '7', '8'],
    exampleNational: '412 345 678',
  },
  { code: 'NZ', flag: '🇳🇿', name: 'Nueva Zelanda', aliases: ['new zealand', 'nova zelandia'], timezone: 'Pacific/Auckland', timezones: singleTz('+12', 'Pacific/Auckland'), dialCode: '64', nationalMin: 8, nationalMax: 10, validNationalPrefixes: ['2', '3', '4', '6', '7', '9'], exampleNational: '21 123 4567' },
  {
    code: 'ID',
    flag: '🇮🇩',
    name: 'Indonesia',
    aliases: [],
    timezone: 'Asia/Jakarta',
    timezones: [
      { offsetLabel: 'UTC+7', shortOffset: '+7', timezone: 'Asia/Jakarta' },
      { offsetLabel: 'UTC+8', shortOffset: '+8', timezone: 'Asia/Makassar' },
      { offsetLabel: 'UTC+9', shortOffset: '+9', timezone: 'Asia/Jayapura' },
    ],
    dialCode: '62',
    nationalMin: 9,
    nationalMax: 12,
    validNationalPrefixes: ['8', '2', '3', '4', '5', '6', '7', '9'],
    exampleNational: '812 3456 7890',
  },
  { code: 'TH', flag: '🇹🇭', name: 'Tailandia', aliases: ['thailand'], timezone: 'Asia/Bangkok', timezones: singleTz('+7', 'Asia/Bangkok'), dialCode: '66', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['6', '8', '9', '2', '3', '4', '5', '7'], exampleNational: '81 234 5678' },
  { code: 'MY', flag: '🇲🇾', name: 'Malasia', aliases: ['malaysia'], timezone: 'Asia/Kuala_Lumpur', timezones: singleTz('+8', 'Asia/Kuala_Lumpur'), dialCode: '60', nationalMin: 9, nationalMax: 10, validNationalPrefixes: ['1', '3', '4', '5', '6', '7', '8', '9'], exampleNational: '12 345 6789' },
  { code: 'VN', flag: '🇻🇳', name: 'Vietnam', aliases: [], timezone: 'Asia/Ho_Chi_Minh', timezones: singleTz('+7', 'Asia/Ho_Chi_Minh'), dialCode: '84', nationalMin: 9, nationalMax: 10, validNationalPrefixes: ['3', '5', '7', '8', '9', '2'], exampleNational: '91 234 5678' },
  { code: 'PH', flag: '🇵🇭', name: 'Filipinas', aliases: ['philippines'], timezone: 'Asia/Manila', timezones: singleTz('+8', 'Asia/Manila'), dialCode: '63', nationalMin: 10, nationalMax: 10, validNationalPrefixes: ['9', '2'], exampleNational: '917 123 4567' },
  { code: 'ZA', flag: '🇿🇦', name: 'Sudáfrica', aliases: ['sudafrica', 'south africa'], timezone: 'Africa/Johannesburg', timezones: singleTz('+2', 'Africa/Johannesburg'), dialCode: '27', nationalMin: 9, nationalMax: 9, validNationalPrefixes: ['6', '7', '8', '1', '2', '3', '4', '5'], exampleNational: '82 123 4567' },
];

export function normalizeCountryText(value: string): string {
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

export function isCountryInputPrefix(rawInput: string): boolean {
  const normalized = normalizeCountryText(rawInput);
  if (!normalized) return true;
  return TOP_50_COMMERCIAL_COUNTRIES.some(
    (country) =>
      normalizeCountryText(country.name).startsWith(normalized) ||
      country.aliases.some((alias) =>
        normalizeCountryText(alias).startsWith(normalized),
      ),
  );
}

export function matchCommercialCountry(
  rawInput: string,
): CommercialCountry | null {
  const normalized = normalizeCountryText(rawInput);
  if (normalized.length < 3) return null;

  for (const country of TOP_50_COMMERCIAL_COUNTRIES) {
    if (normalizeCountryText(country.name) === normalized) return country;
    if (country.aliases.some((alias) => normalizeCountryText(alias) === normalized)) {
      return country;
    }
  }

  let bestMatch: CommercialCountry | null = null;
  let bestScore = 0;

  for (const country of TOP_50_COMMERCIAL_COUNTRIES) {
    const candidates = [country.name, ...country.aliases];
    for (const candidate of candidates) {
      const score = similarityRatio(normalized, normalizeTextCandidate(candidate));
      if (score >= 0.8 && score > bestScore) {
        bestScore = score;
        bestMatch = country;
      }
    }
  }

  return bestMatch;
}

function normalizeTextCandidate(value: string): string {
  return normalizeCountryText(value);
}
