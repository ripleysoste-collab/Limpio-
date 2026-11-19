import type { SupportedLocale } from './i18n';

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

export function getVisibleAgencyClients(
  realClients: AgencyClientRecord[],
): AgencyClientRecord[] {
  return realClients.length > 0 ? realClients : DEFAULT_EXAMPLE_CLIENTS;
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
