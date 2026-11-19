export type AgencyTabId =
  | 'home'
  | 'bots'
  | 'metrics'
  | 'users'
  | 'searchlink'
  | 'superintelligence'
  | 'whatsapp'
  | 'sql'
  | 'env'
  | 'support'
  | 'landing'
  | 'settings';

export const WHATSAPP_AGENCY_PREVIEW_PATH = '/preview/agencia-whatsapp';

export const AGENCY_TAB_PATHS: Record<AgencyTabId, string> = {
  home: '/agencia-inicio',
  bots: '/agencia-bots',
  metrics: '/agencia-metricas',
  users: '/agencia-usuarios',
  searchlink: '/agencia-search-link',
  superintelligence: '/agencia-superinteligencia',
  whatsapp: '/agencia-whatsapp',
  sql: '/agencia-base-sql',
  env: '/agencia-env',
  support: '/agencia-asistencia-humana',
  landing: '/agencia-pagina-inicio',
  settings: '/agencia-configuracion',
};

const PATH_TO_AGENCY_TAB: Record<string, AgencyTabId> = Object.entries(
  AGENCY_TAB_PATHS,
).reduce<Record<string, AgencyTabId>>((acc, [tabId, path]) => {
  acc[path] = tabId as AgencyTabId;
  return acc;
}, {});

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function getAgencyTabFromPathname(pathname: string): AgencyTabId | null {
  const normalized = normalizePathname(pathname);
  if (normalized === WHATSAPP_AGENCY_PREVIEW_PATH) {
    return 'home';
  }
  return PATH_TO_AGENCY_TAB[normalized] ?? null;
}

export function getAgencyPathForTab(tab: AgencyTabId): string {
  return AGENCY_TAB_PATHS[tab] ?? AGENCY_TAB_PATHS.home;
}
