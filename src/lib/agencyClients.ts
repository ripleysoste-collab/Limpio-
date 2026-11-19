import type { SupportedLocale } from './i18n';
import { getCurrentWallClockInTimezone } from './agencyValidation';

export type ClientServiceStatus =
  | 'active'
  | 'expired'
  | 'suspended'
  | 'paused';

export interface AgencyClientRecord {
  id: string;
  fullName: string;
  businessName?: string;
  email: string;
  phone: string;
  countryCode?: string;
  countryName?: string;
  timezone: string;
  status: ClientServiceStatus;
  startDate: string;
  endDate: string | null;
  notes?: string;
  isExample?: boolean;
}

export const CLIENT_STATUS_STYLE: Record<
  ClientServiceStatus,
  {
    squareClass: string;
    labels: Record<SupportedLocale, string>;
  }
> = {
  active: {
    squareClass: 'bg-[#22C55E] ring-1 ring-inset ring-[#16A34A]/30',
    labels: {
      es: 'Activo',
      en: 'Active',
      pt: 'Ativo',
    },
  },
  expired: {
    squareClass: 'bg-[#9333EA] ring-1 ring-inset ring-[#7E22CE]/30',
    labels: {
      es: 'Vencido',
      en: 'Expired',
      pt: 'Vencido',
    },
  },
  suspended: {
    squareClass: 'bg-[#F97316] ring-1 ring-inset ring-[#EA580C]/30',
    labels: {
      es: 'Suspendido',
      en: 'Suspended',
      pt: 'Suspenso',
    },
  },
  paused: {
    squareClass: 'bg-[#EF4444] ring-1 ring-inset ring-[#DC2626]/30',
    labels: {
      es: 'Pausado',
      en: 'Paused',
      pt: 'Pausado',
    },
  },
};

/**
 * Built-in starter examples (one per status color).
 * Automatically hidden as soon as the agency registers its first real client.
 */
export const DEFAULT_EXAMPLE_CLIENTS: AgencyClientRecord[] = [
  {
    id: 'example-client-1',
    fullName: 'Francisco Pérez',
    email: 'francisco.perez@ejemplo.com',
    phone: '+52 55 1234 5678',
    countryCode: 'MX',
    countryName: 'México',
    timezone: 'America/Mexico_City',
    status: 'active',
    startDate: '2026-11-01',
    endDate: '2026-12-01',
    isExample: true,
  },
  {
    id: 'example-client-2',
    fullName: 'Camila Gutiérrez',
    email: 'camila.gutierrez@ejemplo.com',
    phone: '+57 310 456 7890',
    countryCode: 'CO',
    countryName: 'Colombia',
    timezone: 'America/Bogota',
    status: 'expired',
    startDate: '2026-10-15',
    endDate: '2026-11-15',
    isExample: true,
  },
  {
    id: 'example-client-3',
    fullName: 'Mateo Ramírez',
    email: 'mateo.ramirez@ejemplo.com',
    phone: '+54 11 3456 7890',
    countryCode: 'AR',
    countryName: 'Argentina',
    timezone: 'America/Argentina/Buenos_Aires',
    status: 'suspended',
    startDate: '2026-10-20',
    endDate: '2026-11-20',
    isExample: true,
  },
  {
    id: 'example-client-4',
    fullName: 'Valentina Morales',
    email: 'valentina.morales@ejemplo.com',
    phone: '+34 612 345 678',
    countryCode: 'ES',
    countryName: 'España',
    timezone: 'Europe/Madrid',
    status: 'paused',
    startDate: '2026-11-05',
    endDate: '2026-12-05',
    isExample: true,
  },
];

/**
 * Resolves effective client status using the client's saved timezone clock.
 * Active clients automatically become 'expired' (purple) once endDate is reached.
 */
export function resolveEffectiveClientStatus(
  client: AgencyClientRecord,
  nowMs = Date.now(),
): ClientServiceStatus {
  if (client.isExample) return client.status;
  if (client.status === 'paused' || client.status === 'suspended') {
    return client.status;
  }
  if (client.status === 'active' && client.endDate) {
    const nowInClientTz = getCurrentWallClockInTimezone(client.timezone, nowMs);
    if (nowInClientTz.comparableIso >= client.endDate) {
      return 'expired';
    }
  }
  return client.status;
}

export function applyAutoExpirationToClients(
  clients: AgencyClientRecord[],
  nowMs = Date.now(),
): AgencyClientRecord[] {
  return clients.map((client) => {
    const nextStatus = resolveEffectiveClientStatus(client, nowMs);
    return nextStatus === client.status
      ? client
      : { ...client, status: nextStatus };
  });
}

export const CLIENT_PURGE_CASCADE_TARGETS = [
  'primary_client_record',
  'bot_instances',
  'whatsapp_webhooks_and_credentials',
  'automation_metrics_and_logs',
  'searchlink_endpoints_cache',
  'scheduled_expiration_jobs',
  'backup_archives_and_local_storage',
] as const;

export type ClientPurgeCascadeTarget =
  (typeof CLIENT_PURGE_CASCADE_TARGETS)[number];

export interface ClientPurgeOutcome {
  nextClients: AgencyClientRecord[];
  nextDismissedExampleIds: string[];
  purgedClientId: string;
  clearedBackupKeys: number;
  cascades: readonly ClientPurgeCascadeTarget[];
}

/**
 * Purges a client completely across the primary client store, starter examples,
 * browser storage backups/caches, and notifies active agency subsystems via event dispatch
 * so all backing data tied to the client is irreversibly deleted.
 */
export function purgeAgencyClientEverywhere(
  target: AgencyClientRecord,
  clients: AgencyClientRecord[],
  dismissedExampleIds: string[] = [],
): ClientPurgeOutcome {
  const normalizedTargetEmail = target.email.trim().toLowerCase();
  const targetPhoneDigits = target.phone.replace(/\D/g, '');

  const nextClients = target.isExample
    ? clients
    : clients.filter(
        (client) =>
          client.id !== target.id &&
          client.email.trim().toLowerCase() !== normalizedTargetEmail &&
          (!targetPhoneDigits ||
            client.phone.replace(/\D/g, '') !== targetPhoneDigits),
      );

  const nextDismissedExampleIds = target.isExample
    ? dismissedExampleIds.includes(target.id)
      ? dismissedExampleIds
      : [...dismissedExampleIds, target.id]
    : dismissedExampleIds;

  let clearedBackupKeys = 0;

  if (typeof window !== 'undefined') {
    const scrubStorage = (storage: Storage | undefined) => {
      if (!storage) return;
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i += 1) {
          const key = storage.key(i);
          if (!key) continue;
          if (
            key.includes(target.id) ||
            (normalizedTargetEmail &&
              key.toLowerCase().includes(normalizedTargetEmail))
          ) {
            keysToRemove.push(key);
          }
        }
        for (const key of keysToRemove) {
          storage.removeItem(key);
          clearedBackupKeys += 1;
        }
      } catch {
        // Ignore restricted storage environments
      }
    };

    scrubStorage(window.localStorage);
    scrubStorage(window.sessionStorage);

    try {
      window.dispatchEvent(
        new CustomEvent('agency:client-purged', {
          detail: {
            clientId: target.id,
            email: normalizedTargetEmail,
            cascades: CLIENT_PURGE_CASCADE_TARGETS,
          },
        }),
      );
    } catch {
      // Ignore environments without CustomEvent support
    }
  }

  return {
    nextClients,
    nextDismissedExampleIds,
    purgedClientId: target.id,
    clearedBackupKeys,
    cascades: CLIENT_PURGE_CASCADE_TARGETS,
  };
}

export function getVisibleAgencyClients(
  realClients: AgencyClientRecord[],
  nowMs = Date.now(),
  dismissedExampleIds: string[] = [],
): AgencyClientRecord[] {
  if (realClients.length > 0) {
    return applyAutoExpirationToClients(realClients, nowMs);
  }
  if (dismissedExampleIds.length === 0) {
    return DEFAULT_EXAMPLE_CLIENTS;
  }
  return DEFAULT_EXAMPLE_CLIENTS.filter(
    (example) => !dismissedExampleIds.includes(example.id),
  );
}

export function filterAgencyClients(
  clients: AgencyClientRecord[],
  query: string,
): AgencyClientRecord[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return clients;
  return clients.filter(
    (client) =>
      client.fullName.toLowerCase().includes(normalized) ||
      (client.businessName ?? '').toLowerCase().includes(normalized) ||
      client.email.toLowerCase().includes(normalized) ||
      (client.countryName ?? '').toLowerCase().includes(normalized),
  );
}

/**
 * Formats an ISO timestamp or YYYY-MM-DD[THH:mm] wall-clock string into DD/MM/YYYY HH:mm.
 */
export function formatAgencyDateDisplay(
  rawValue: string | null | undefined,
  timezone?: string,
): string {
  if (!rawValue) return '';
  const trimmed = rawValue.trim();

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    return `${dateOnlyMatch[3]}/${dateOnlyMatch[2]}/${dateOnlyMatch[1]}`;
  }

  const wallClockMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(
    trimmed,
  );
  if (wallClockMatch) {
    return `${wallClockMatch[3]}/${wallClockMatch[2]}/${wallClockMatch[1]} ${wallClockMatch[4]}:${wallClockMatch[5]}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone || undefined,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(parsed);
      const getPart = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((p) => p.type === type)?.value ?? '';
      const year = getPart('year');
      const month = getPart('month');
      const day = getPart('day');
      const rawHour = getPart('hour');
      const hour = rawHour === '24' ? '00' : rawHour;
      const minute = getPart('minute');
      if (year && month && day) {
        return `${day}/${month}/${year} ${hour}:${minute}`;
      }
    } catch {
      // Fallback below
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  }

  return trimmed;
}

/**
 * Validates DD/MM/YYYY HH:MM (or DD/MM/YYYY) input format.
 */
export function parseExpirationInput(raw: string): string | null {
  const trimmed = raw.trim();
  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(
    trimmed,
  );
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const hour = match[4] !== undefined ? Number(match[4]) : 23;
  const minute = match[5] !== undefined ? Number(match[5]) : 59;

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    year < 2024 ||
    year > 2100 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const probe = new Date(year, month - 1, day);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}
