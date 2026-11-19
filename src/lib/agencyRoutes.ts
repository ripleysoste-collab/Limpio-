export type AgencyTabId =
  | 'home'
  | 'clients'
  | 'bots'
  | 'businesses'
  | 'training'
  | 'metrics'
  | 'searchlink'
  | 'superintelligence'
  | 'whatsapp'
  | 'sql'
  | 'env'
  | 'support'
  | 'landing'
  | 'settings';

export const WHATSAPP_AGENCY_PREVIEW_PATH = '/preview/agencia-whatsapp';
export const AGENCY_EDITOR_PATH = '/editor/agencia-whatsapp';
export const AGENCY_ROUTE_PREFIX = '/agencia';

export const AGENCY_TAB_PATHS: Record<AgencyTabId, string> = {
  home: '/agencia/inicio',
  clients: '/agencia/clientes',
  bots: '/agencia/bots',
  businesses: '/agencia/negocios',
  training: '/agencia/entrenamiento',
  metrics: '/agencia/metricas',
  searchlink: '/agencia/search-link',
  superintelligence: '/agencia/superinteligencia',
  whatsapp: '/agencia/whatsapp',
  sql: '/agencia/base-sql',
  env: '/agencia/env',
  support: '/agencia/asistencia-humana',
  landing: '/agencia/pagina-de-inicio',
  settings: '/agencia/configuracion',
};

const PATH_ALIAS_MAP: Record<string, AgencyTabId> = {
  '/preview/agencia-whatsapp': 'home',
  '/agencia': 'home',
  '/agencia/inicio': 'home',
  '/agencia/home': 'home',
  '/agencia/dashboard': 'home',
  '/agencia/clientes': 'clients',
  '/agencia/clients': 'clients',
  '/agencia/usuarios': 'clients',
  '/agencia/users': 'clients',
  '/agencia/bots': 'bots',
  '/agencia/negocios': 'businesses',
  '/agencia/businesses': 'businesses',
  '/agencia/entrenamiento': 'training',
  '/agencia/training': 'training',
  '/agencia/metricas': 'metrics',
  '/agencia/metrics': 'metrics',
  '/agencia/search-link': 'searchlink',
  '/agencia/searchlink': 'searchlink',
  '/agencia/superinteligencia': 'superintelligence',
  '/agencia/superintelligence': 'superintelligence',
  '/agencia/whatsapp': 'whatsapp',
  '/agencia/base-sql': 'sql',
  '/agencia/sql': 'sql',
  '/agencia/env': 'env',
  '/agencia/asistencia-humana': 'support',
  '/agencia/support': 'support',
  '/agencia/pagina-de-inicio': 'landing',
  '/agencia/landing': 'landing',
  '/agencia/configuracion': 'settings',
  '/agencia/settings': 'settings',
};

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim().toLowerCase().replace(/\/+$/, '');
  return trimmed || '/';
}

export function isAgencyEditorPath(pathname: string): boolean {
  return normalizePathname(pathname) === AGENCY_EDITOR_PATH;
}

export function isAgencyPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    normalized === WHATSAPP_AGENCY_PREVIEW_PATH ||
    normalized === AGENCY_ROUTE_PREFIX ||
    normalized.startsWith(`${AGENCY_ROUTE_PREFIX}/`)
  );
}

export function resolveAgencyTabFromPath(pathname: string): AgencyTabId | null {
  const normalized = normalizePathname(pathname);
  if (!isAgencyPath(normalized)) return null;
  return PATH_ALIAS_MAP[normalized] ?? 'home';
}

export function getAgencyPathForTab(tab: AgencyTabId): string {
  return AGENCY_TAB_PATHS[tab] ?? AGENCY_TAB_PATHS.home;
}
