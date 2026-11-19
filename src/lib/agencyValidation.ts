import {
  TOP_50_COMMERCIAL_COUNTRIES,
  isCountryInputPrefix,
  matchCommercialCountry,
  type CommercialCountry,
} from './agencyCountries';

export type ValidationTone = 'neutral' | 'blue' | 'red';

export interface FieldValidationResult {
  tone: ValidationTone;
  isValid: boolean;
}

export interface CountryValidationResult {
  tone: ValidationTone;
  matched: CommercialCountry | null;
  requiresUtc: boolean;
  resolvedTimezone: string | null;
  utcHint: string | null;
  isValid: boolean;
}

export interface ExpirationValidationResult extends FieldValidationResult {
  iso: string | null;
}

function splitCountryAndUtc(raw: string): {
  countryPart: string;
  hasUtcKeyword: boolean;
  utcOffsetRaw: string;
} {
  const utcMatch = /^(.*?)\s+utc(?:\s*(.*))?$/i.exec(raw.trim());
  if (!utcMatch) {
    return {
      countryPart: raw,
      hasUtcKeyword: false,
      utcOffsetRaw: '',
    };
  }

  return {
    countryPart: utcMatch[1] ?? '',
    hasUtcKeyword: true,
    utcOffsetRaw: (utcMatch[2] ?? '').replace(/\s+/g, ''),
  };
}

/**
 * Auto-appends " UTC" once when typing forward into a multi-timezone country
 * so the user immediately sees "País UTC" in blue and can type the country's UTC offset.
 */
export function formatCountryWithUtcPrompt(
  nextRaw: string,
  prevValue: string,
): string {
  const isTypingForward = nextRaw.length >= prevValue.length;
  if (!isTypingForward) {
    return nextRaw;
  }

  if (/\sutc\b/i.test(nextRaw)) {
    return nextRaw;
  }

  const matched = matchCommercialCountry(nextRaw);
  if (matched && matched.timezones.length > 1) {
    const prevMatched = matchCommercialCountry(splitCountryAndUtc(prevValue).countryPart);
    if (!prevMatched || prevMatched.code !== matched.code) {
      return `${matched.name} UTC`;
    }
  }

  return nextRaw;
}

/**
 * Validates country + logical UTC offset for multi-timezone countries.
 * - Single-timezone countries turn blue and validate immediately.
 * - Multi-timezone countries require one of that country's official UTC offsets (e.g. México UTC-6).
 * - Invented or out-of-country UTC offsets turn red.
 */
export function validateCountryField(
  raw: string,
  blurred: boolean,
): CountryValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      tone: 'neutral',
      matched: null,
      requiresUtc: false,
      resolvedTimezone: null,
      utcHint: null,
      isValid: false,
    };
  }

  const { countryPart, hasUtcKeyword, utcOffsetRaw } = splitCountryAndUtc(trimmed);
  const matched = matchCommercialCountry(countryPart);

  if (!matched) {
    if (!blurred && !hasUtcKeyword && isCountryInputPrefix(trimmed)) {
      return {
        tone: 'neutral',
        matched: null,
        requiresUtc: false,
        resolvedTimezone: null,
        utcHint: null,
        isValid: false,
      };
    }
    return {
      tone: 'red',
      matched: null,
      requiresUtc: false,
      resolvedTimezone: null,
      utcHint: null,
      isValid: false,
    };
  }

  // Single-timezone country: immediately valid & blue
  if (matched.timezones.length <= 1) {
    if (hasUtcKeyword) {
      const onlyTz = matched.timezones[0];
      const matchesSingle =
        !utcOffsetRaw ||
        onlyTz.shortOffset.toLowerCase() === utcOffsetRaw.toLowerCase();
      return {
        tone: matchesSingle ? 'blue' : 'red',
        matched,
        requiresUtc: false,
        resolvedTimezone: matchesSingle ? onlyTz.timezone : null,
        utcHint: null,
        isValid: matchesSingle && (!utcOffsetRaw || matchesSingle),
      };
    }
    return {
      tone: 'blue',
      matched,
      requiresUtc: false,
      resolvedTimezone: matched.timezone,
      utcHint: null,
      isValid: true,
    };
  }

  // Multi-timezone country: must provide one of this country's official UTC offsets
  const validOffsetsLabel = matched.timezones
    .map((tz) => tz.shortOffset)
    .join(' / ');

  if (!hasUtcKeyword) {
    return {
      tone: blurred ? 'red' : 'blue',
      matched,
      requiresUtc: true,
      resolvedTimezone: null,
      utcHint: validOffsetsLabel,
      isValid: false,
    };
  }

  if (!utcOffsetRaw) {
    return {
      tone: blurred ? 'red' : 'blue',
      matched,
      requiresUtc: true,
      resolvedTimezone: null,
      utcHint: validOffsetsLabel,
      isValid: false,
    };
  }

  const exactTz = matched.timezones.find(
    (tz) => tz.shortOffset.toLowerCase() === utcOffsetRaw.toLowerCase(),
  );
  if (exactTz) {
    return {
      tone: 'blue',
      matched,
      requiresUtc: true,
      resolvedTimezone: exactTz.timezone,
      utcHint: exactTz.offsetLabel,
      isValid: true,
    };
  }

  const canStillComplete = matched.timezones.some((tz) =>
    tz.shortOffset.toLowerCase().startsWith(utcOffsetRaw.toLowerCase()),
  );
  if (canStillComplete && !blurred) {
    return {
      tone: 'blue',
      matched,
      requiresUtc: true,
      resolvedTimezone: null,
      utcHint: validOffsetsLabel,
      isValid: false,
    };
  }

  return {
    tone: 'red',
    matched,
    requiresUtc: true,
    resolvedTimezone: null,
    utcHint: validOffsetsLabel,
    isValid: false,
  };
}

/**
 * Email rules:
 * - Local part before '@' must have strictly more than 6 characters (>= 7).
 * - Followed by '@gmail.com'.
 * - Otherwise turns red; when valid '@gmail.com' with >6 chars before '@', turns blue.
 */
export function validateGmailEmail(
  raw: string,
  blurred: boolean,
): FieldValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { tone: 'neutral', isValid: false };
  }

  if (/\s/.test(trimmed)) {
    return { tone: 'red', isValid: false };
  }

  const atIndex = trimmed.indexOf('@');
  if (atIndex === -1) {
    if (!/^[a-zA-Z0-9._+-]+$/.test(trimmed)) {
      return { tone: 'red', isValid: false };
    }
    if (blurred) {
      return { tone: 'red', isValid: false };
    }
    return { tone: 'neutral', isValid: false };
  }

  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex + 1).toLowerCase();

  if (
    localPart.length <= 6 ||
    !/^[a-zA-Z0-9._+-]+$/.test(localPart) ||
    trimmed.indexOf('@', atIndex + 1) !== -1
  ) {
    return { tone: 'red', isValid: false };
  }

  const targetDomain = 'gmail.com';
  if (domainPart === targetDomain) {
    return { tone: 'blue', isValid: true };
  }

  if (!targetDomain.startsWith(domainPart)) {
    return { tone: 'red', isValid: false };
  }

  if (blurred) {
    return { tone: 'red', isValid: false };
  }

  return { tone: 'neutral', isValid: false };
}

function matchesNationalPrefix(
  nationalDigits: string,
  prefixes: string[] | undefined,
  requireComplete: boolean,
): boolean {
  if (!prefixes || prefixes.length === 0) return true;
  if (!nationalDigits) return !requireComplete;

  if (requireComplete) {
    return prefixes.some((prefix) => nationalDigits.startsWith(prefix));
  }

  return prefixes.some(
    (prefix) =>
      nationalDigits.startsWith(prefix) || prefix.startsWith(nationalDigits),
  );
}

/**
 * Personal phone rules:
 * - Must start with '+' and the selected country's international dial code.
 * - Must satisfy that country's national subscriber length and leading digit rules.
 */
export function validatePersonalPhone(
  raw: string,
  matchedCountry: CommercialCountry | null,
  blurred: boolean,
): FieldValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { tone: 'neutral', isValid: false };
  }

  if (!trimmed.startsWith('+')) {
    return { tone: 'red', isValid: false };
  }

  if (!/^\+[0-9\s-]*$/.test(trimmed)) {
    return { tone: 'red', isValid: false };
  }

  const digits = trimmed.slice(1).replace(/\D/g, '');
  if (!digits) {
    return blurred
      ? { tone: 'red', isValid: false }
      : { tone: 'neutral', isValid: false };
  }

  const checkCountry = (country: CommercialCountry): FieldValidationResult => {
    if (digits.length < country.dialCode.length) {
      if (!country.dialCode.startsWith(digits)) {
        return { tone: 'red', isValid: false };
      }
      return blurred
        ? { tone: 'red', isValid: false }
        : { tone: 'neutral', isValid: false };
    }

    if (!digits.startsWith(country.dialCode)) {
      return { tone: 'red', isValid: false };
    }

    const national = digits.slice(country.dialCode.length);
    if (national.length > country.nationalMax) {
      return { tone: 'red', isValid: false };
    }

    const isLengthComplete =
      national.length >= country.nationalMin &&
      national.length <= country.nationalMax;

    if (
      !matchesNationalPrefix(
        national,
        country.validNationalPrefixes,
        isLengthComplete,
      )
    ) {
      return { tone: 'red', isValid: false };
    }

    if (isLengthComplete) {
      return { tone: 'blue', isValid: true };
    }

    return blurred
      ? { tone: 'red', isValid: false }
      : { tone: 'neutral', isValid: false };
  };

  if (matchedCountry) {
    return checkCountry(matchedCountry);
  }

  const candidateCountries = TOP_50_COMMERCIAL_COUNTRIES.filter(
    (c) => digits.startsWith(c.dialCode) || c.dialCode.startsWith(digits),
  );
  if (candidateCountries.length === 0) {
    return { tone: 'red', isValid: false };
  }

  for (const candidate of candidateCountries) {
    const result = checkCountry(candidate);
    if (result.isValid) return result;
  }

  const anyStillPossible = candidateCountries.some(
    (c) => checkCountry(c).tone !== 'red',
  );
  if (!anyStillPossible || blurred) {
    return { tone: 'red', isValid: false };
  }

  return { tone: 'neutral', isValid: false };
}

/**
 * Auto-formats digits into "DD/MM/YYYY HH:mm" inserting '/', ' ', ':' automatically
 * and handling Backspace cleanly across trailing separators.
 */
export function formatExpirationInput(
  nextRaw: string,
  prevFormatted: string,
): string {
  let digits = nextRaw.replace(/\D/g, '').slice(0, 12);
  const prevDigits = prevFormatted.replace(/\D/g, '');

  if (
    nextRaw.length < prevFormatted.length &&
    digits === prevDigits &&
    digits.length > 0 &&
    /[/ :]$/.test(prevFormatted)
  ) {
    digits = digits.slice(0, -1);
  }

  const len = digits.length;
  if (len === 0) return '';
  if (len === 1) return digits;
  if (len === 2) return `${digits}/`;
  if (len === 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  if (len === 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/`;
  if (len <= 7) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (len === 8) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} `;
  if (len === 9) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} ${digits.slice(8)}`;
  if (len === 10) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} ${digits.slice(8, 10)}:`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} ${digits.slice(8, 10)}:${digits.slice(10, 12)}`;
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export function validateExpirationMasked(
  formatted: string,
  noExpiration: boolean,
  blurred: boolean,
): ExpirationValidationResult {
  if (noExpiration) {
    return { tone: 'neutral', isValid: true, iso: null };
  }

  const digits = formatted.replace(/\D/g, '');
  if (digits.length === 0) {
    return { tone: 'neutral', isValid: false, iso: null };
  }

  const currentYear = new Date().getFullYear();
  const currentYearStr = String(currentYear);

  if (digits.length >= 1) {
    const d1 = Number(digits[0]);
    if (d1 > 3) return { tone: 'red', isValid: false, iso: null };
  }
  let day = 0;
  if (digits.length >= 2) {
    day = Number(digits.slice(0, 2));
    if (day < 1 || day > 31) {
      return { tone: 'red', isValid: false, iso: null };
    }
  }

  if (digits.length >= 3) {
    const m1 = Number(digits[2]);
    if (m1 > 1) return { tone: 'red', isValid: false, iso: null };
  }
  let month = 0;
  if (digits.length >= 4) {
    month = Number(digits.slice(2, 4));
    if (month < 1 || month > 12) {
      return { tone: 'red', isValid: false, iso: null };
    }
    if (day > getDaysInMonth(month, currentYear)) {
      return { tone: 'red', isValid: false, iso: null };
    }
  }

  if (digits.length >= 5) {
    const yearPrefix = digits.slice(4, Math.min(8, digits.length));
    if (!currentYearStr.startsWith(yearPrefix)) {
      return { tone: 'red', isValid: false, iso: null };
    }
  }
  if (digits.length >= 8) {
    const year = Number(digits.slice(4, 8));
    if (year !== currentYear) {
      return { tone: 'red', isValid: false, iso: null };
    }
  }

  if (digits.length >= 9) {
    const h1 = Number(digits[8]);
    if (h1 > 2) return { tone: 'red', isValid: false, iso: null };
  }
  let hour = 0;
  if (digits.length >= 10) {
    hour = Number(digits.slice(8, 10));
    if (hour < 0 || hour > 23) {
      return { tone: 'red', isValid: false, iso: null };
    }
  }

  if (digits.length >= 11) {
    const min1 = Number(digits[10]);
    if (min1 > 5) return { tone: 'red', isValid: false, iso: null };
  }
  let minute = 0;
  if (digits.length === 12) {
    minute = Number(digits.slice(10, 12));
    if (minute < 0 || minute > 59) {
      return { tone: 'red', isValid: false, iso: null };
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      tone: 'blue',
      isValid: true,
      iso: `${currentYear}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`,
    };
  }

  if (blurred) {
    return { tone: 'red', isValid: false, iso: null };
  }

  return { tone: 'blue', isValid: false, iso: null };
}
