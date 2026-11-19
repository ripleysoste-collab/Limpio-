import type { SupportedLocale } from './i18n';
import {
  resolveEffectiveClientStatus,
  type AgencyClientRecord,
} from './agencyClients';
import {
  TOP_50_COMMERCIAL_COUNTRIES,
  type CommercialCountry,
} from './agencyCountries';
import type { FieldValidationResult } from './agencyValidation';

export type BotOperationalStatus =
  | 'active'
  | 'incomplete'
  | 'paused'
  | 'suspended'
  | 'expired';

export interface AgencyBotRecord {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  botPhone: string;
  businessName?: string;
  status: BotOperationalStatus;
  hasBusinessProfile: boolean;
  hasTraining: boolean;
  hasWhatsAppConnection: boolean;
  createdAt: string;
  isExample?: boolean;
}

export const BOT_COLUMN_ORDER: BotOperationalStatus[] = [
  'active',
  'incomplete',
  'paused',
  'suspended',
  'expired',
];

export const BOT_STATUS_STYLE: Record<
  BotOperationalStatus,
  {
    squareClass: string;
    labels: Record<SupportedLocale, string>;
    columnTitles: Record<SupportedLocale, string>;
  }
> = {
  active: {
    squareClass: 'bg-[#22C55E] ring-1 ring-inset ring-[#16A34A]/30',
    labels: {
      es: 'Activo',
      en: 'Active',
      pt: 'Ativo',
    },
    columnTitles: {
      es: 'Bots activos',
      en: 'Active bots',
      pt: 'Bots ativos',
    },
  },
  incomplete: {
    squareClass: 'bg-[#EAB308] ring-1 ring-inset ring-[#CA8A04]/30',
    labels: {
      es: 'Incompleto',
      en: 'Incomplete',
      pt: 'Incompleto',
    },
    columnTitles: {
      es: 'Bots incompletos',
      en: 'Incomplete bots',
      pt: 'Bots incompletos',
    },
  },
  paused: {
    squareClass: 'bg-[#EF4444] ring-1 ring-inset ring-[#DC2626]/30',
    labels: {
      es: 'En pausa',
      en: 'Paused',
      pt: 'Em pausa',
    },
    columnTitles: {
      es: 'Bots en pausa',
      en: 'Paused bots',
      pt: 'Bots em pausa',
    },
  },
  suspended: {
    squareClass: 'bg-[#F97316] ring-1 ring-inset ring-[#EA580C]/30',
    labels: {
      es: 'Suspendido',
      en: 'Suspended',
      pt: 'Suspenso',
    },
    columnTitles: {
      es: 'Bots suspendidos',
      en: 'Suspended bots',
      pt: 'Bots suspensos',
    },
  },
  expired: {
    squareClass: 'bg-[#9333EA] ring-1 ring-inset ring-[#7E22CE]/30',
    labels: {
      es: 'Vencido',
      en: 'Expired',
      pt: 'Vencido',
    },
    columnTitles: {
      es: 'Bots vencidos',
      en: 'Expired bots',
      pt: 'Bots vencidos',
    },
  },
};

export const DEFAULT_EXAMPLE_BOTS: AgencyBotRecord[] = [
  {
    id: 'example-bot-1',
    clientId: 'example-client-1',
    clientName: 'Francisco Pérez',
    clientEmail: 'francisco.perez@ejemplo.com',
    clientPhone: '+52 55 1234 5678',
    botPhone: '+52 55 9087 6543',
    businessName: 'Cocina Doña María',
    status: 'active',
    hasBusinessProfile: true,
    hasTraining: true,
    hasWhatsAppConnection: true,
    createdAt: '2026-11-02T10:15',
    isExample: true,
  },
  {
    id: 'example-bot-2',
    clientId: 'example-client-1',
    clientName: 'Francisco Pérez',
    clientEmail: 'francisco.perez@ejemplo.com',
    clientPhone: '+52 55 1234 5678',
    botPhone: '+52 55 4410 2299',
    status: 'incomplete',
    hasBusinessProfile: false,
    hasTraining: false,
    hasWhatsAppConnection: false,
    createdAt: '2026-11-16T14:30',
    isExample: true,
  },
  {
    id: 'example-bot-3',
    clientId: 'example-client-4',
    clientName: 'Valentina Morales',
    clientEmail: 'valentina.morales@ejemplo.com',
    clientPhone: '+34 612 345 678',
    botPhone: '+34 644 901 234',
    businessName: 'Repuestos Norte',
    status: 'paused',
    hasBusinessProfile: true,
    hasTraining: true,
    hasWhatsAppConnection: true,
    createdAt: '2026-11-07T09:20',
    isExample: true,
  },
  {
    id: 'example-bot-4',
    clientId: 'example-client-3',
    clientName: 'Mateo Ramírez',
    clientEmail: 'mateo.ramirez@ejemplo.com',
    clientPhone: '+54 11 3456 7890',
    botPhone: '+54 11 5522 7788',
    businessName: 'Estudio Contable Sur',
    status: 'suspended',
    hasBusinessProfile: true,
    hasTraining: true,
    hasWhatsAppConnection: true,
    createdAt: '2026-10-25T16:40',
    isExample: true,
  },
  {
    id: 'example-bot-5',
    clientId: 'example-client-2',
    clientName: 'Camila Gutiérrez',
    clientEmail: 'camila.gutierrez@ejemplo.com',
    clientPhone: '+57 310 456 7890',
    botPhone: '+57 311 890 1234',
    businessName: 'Boutique Andes',
    status: 'expired',
    hasBusinessProfile: true,
    hasTraining: true,
    hasWhatsAppConnection: true,
    createdAt: '2026-10-18T11:05',
    isExample: true,
  },
];

export function isBotSetupComplete(bot: AgencyBotRecord): boolean {
  return (
    bot.hasBusinessProfile && bot.hasTraining && bot.hasWhatsAppConnection
  );
}

export function resolveEffectiveBotStatus(
  bot: AgencyBotRecord,
  clients: AgencyClientRecord[],
  nowMs = Date.now(),
): BotOperationalStatus {
  if (bot.isExample) return bot.status;

  const owner = clients.find((c) => c.id === bot.clientId);
  if (owner) {
    const ownerStatus = resolveEffectiveClientStatus(owner, nowMs);
    if (ownerStatus === 'expired') return 'expired';
    if (ownerStatus === 'suspended') return 'suspended';
  }

  if (bot.status === 'suspended' || bot.status === 'paused') {
    return bot.status;
  }

  if (!isBotSetupComplete(bot)) {
    return 'incomplete';
  }

  return bot.status;
}

export function getVisibleAgencyBots(
  realBots: AgencyBotRecord[],
  visibleClients: AgencyClientRecord[],
  nowMs = Date.now(),
  dismissedExampleBotIds: string[] = [],
): AgencyBotRecord[] {
  if (realBots.length > 0) {
    return realBots.map((bot) => ({
      ...bot,
      status: resolveEffectiveBotStatus(bot, visibleClients, nowMs),
    }));
  }

  if (dismissedExampleBotIds.length === 0) {
    return DEFAULT_EXAMPLE_BOTS;
  }

  return DEFAULT_EXAMPLE_BOTS.filter(
    (bot) => !dismissedExampleBotIds.includes(bot.id),
  );
}

export function searchAgencyClientsForBot(
  clients: AgencyClientRecord[],
  query: string,
): AgencyClientRecord[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const queryDigits = trimmed.replace(/\D/g, '');
  return clients.filter((client) => {
    const nameMatch = client.fullName.toLowerCase().includes(trimmed);
    const emailMatch = client.email.toLowerCase().includes(trimmed);
    const phoneTextMatch = client.phone.toLowerCase().includes(trimmed);
    const phoneDigitsMatch =
      queryDigits.length >= 3 &&
      client.phone.replace(/\D/g, '').includes(queryDigits);

    return nameMatch || emailMatch || phoneTextMatch || phoneDigitsMatch;
  });
}

export function getBotsForClient(
  bots: AgencyBotRecord[],
  client: AgencyClientRecord | null,
): AgencyBotRecord[] {
  if (!client) return [];
  const normalizedEmail = client.email.trim().toLowerCase();
  return bots.filter(
    (bot) =>
      bot.clientId === client.id ||
      (normalizedEmail &&
        bot.clientEmail.trim().toLowerCase() === normalizedEmail),
  );
}

function matchesBotNationalPrefix(
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
 * Validates the dedicated WhatsApp Business phone number for a bot:
 * - Must start with '+' and match a supported country dial code + subscriber length
 * - Must not duplicate any existing real bot's phone number or client's personal phone
 */
export function validateBotPhoneField(
  raw: string,
  preferredCountry: CommercialCountry | null,
  blurred: boolean,
  existingBots: AgencyBotRecord[] = [],
  existingClients: AgencyClientRecord[] = [],
): FieldValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { tone: 'neutral', isValid: false };
  }

  if (!trimmed.startsWith('+') || !/^\+[0-9\s-]*$/.test(trimmed)) {
    return { tone: 'red', isValid: false };
  }

  const digits = trimmed.slice(1).replace(/\D/g, '');
  if (!digits) {
    return blurred
      ? { tone: 'red', isValid: false }
      : { tone: 'neutral', isValid: false };
  }

  const duplicateInBots = existingBots.some(
    (b) => !b.isExample && b.botPhone.replace(/\D/g, '') === digits,
  );
  const duplicatePersonal = existingClients.some(
    (c) => !c.isExample && c.phone.replace(/\D/g, '') === digits,
  );
  const isDuplicateDigits = duplicateInBots || duplicatePersonal;

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
      !matchesBotNationalPrefix(
        national,
        country.validNationalPrefixes,
        isLengthComplete,
      )
    ) {
      return { tone: 'red', isValid: false };
    }

    if (isLengthComplete) {
      if (isDuplicateDigits) {
        return { tone: 'red', isValid: false };
      }
      return { tone: 'blue', isValid: true };
    }

    return blurred
      ? { tone: 'red', isValid: false }
      : { tone: 'neutral', isValid: false };
  };

  const candidates = preferredCountry
    ? [
        preferredCountry,
        ...TOP_50_COMMERCIAL_COUNTRIES.filter(
          (c) =>
            c.code !== preferredCountry.code &&
            (digits.startsWith(c.dialCode) || c.dialCode.startsWith(digits)),
        ),
      ]
    : TOP_50_COMMERCIAL_COUNTRIES.filter(
        (c) => digits.startsWith(c.dialCode) || c.dialCode.startsWith(digits),
      );

  if (candidates.length === 0) {
    return { tone: 'red', isValid: false };
  }

  for (const candidate of candidates) {
    const result = checkCountry(candidate);
    if (result.isValid) return result;
  }

  const anyStillPossible = candidates.some(
    (c) => checkCountry(c).tone !== 'red',
  );
  if (!anyStillPossible || blurred) {
    return { tone: 'red', isValid: false };
  }

  return { tone: 'neutral', isValid: false };
}

export function getBotMissingModules(
  bot: AgencyBotRecord,
  locale: SupportedLocale,
): string[] {
  const labels: Record<
    SupportedLocale,
    { business: string; training: string; whatsapp: string }
  > = {
    es: {
      business: 'Negocios',
      training: 'Entrenamiento',
      whatsapp: 'WhatsApp',
    },
    en: {
      business: 'Businesses',
      training: 'Training',
      whatsapp: 'WhatsApp',
    },
    pt: {
      business: 'Negócios',
      training: 'Treinamento',
      whatsapp: 'WhatsApp',
    },
  };

  const copy = labels[locale] ?? labels.es;
  const missing: string[] = [];
  if (!bot.hasBusinessProfile) missing.push(copy.business);
  if (!bot.hasTraining) missing.push(copy.training);
  if (!bot.hasWhatsAppConnection) missing.push(copy.whatsapp);
  return missing;
}
