import agencyRoutesRaw from './agencyRoutes.ts?raw';
import agencyClientsRaw from './agencyClients.ts?raw';
import agencyBotsRaw from './agencyBots.ts?raw';
import agencyCountriesRaw from './agencyCountries.ts?raw';
import agencyValidationRaw from './agencyValidation.ts?raw';
import whatsAppAgencyPreviewRaw from '../components/WhatsAppAgencyPreview.tsx?raw';
import agencyDesktopHomeRaw from '../components/AgencyDesktopHome.tsx?raw';
import agencyMobileHomeRaw from '../components/AgencyMobileHome.tsx?raw';
import agencyDesktopClientsRaw from '../components/AgencyDesktopClients.tsx?raw';
import agencyMobileClientsRaw from '../components/AgencyMobileClients.tsx?raw';
import agencyClientRowMenuRaw from '../components/AgencyClientRowMenu.tsx?raw';
import agencyClientDetailPanelRaw from '../components/AgencyClientDetailPanel.tsx?raw';
import agencyDesktopBotsRaw from '../components/AgencyDesktopBots.tsx?raw';
import type { AgencyTabId } from './agencyRoutes';

export type AgencySourceLanguage = 'json' | 'tsx' | 'ts';
export type AgencySourceFolderId =
  | 'root'
  | 'core'
  | 'inicio'
  | 'clientes'
  | 'bots';

export interface AgencySourceFileEntry {
  id: string;
  name: string;
  path: string;
  folderId: AgencySourceFolderId;
  language: AgencySourceLanguage;
  previewTab: AgencyTabId;
  content: string;
}

export interface AgencySourceFolderGroup {
  id: Exclude<AgencySourceFolderId, 'root'>;
  name: string;
  previewTab: AgencyTabId;
  files: AgencySourceFileEntry[];
}

const AGENCY_METADATA_JSON = `{
  "name": "Agencia de WhatsApp",
  "version": "1.0.0",
  "description": "Sistema modular para gestión de clientes, suscripciones, husos horarios y automatización de bots en WhatsApp.",
  "license": "MIT",
  "locales": ["es", "en", "pt"],
  "modules": [
    "core",
    "inicio",
    "clientes",
    "bots"
  ],
  "stack": {
    "frontend": "React + TypeScript + Tailwind CSS",
    "runtime": "Node.js + Express",
    "messaging": "Meta WhatsApp Cloud API"
  }
}
`;

export const AGENCY_ROOT_METADATA_FILE: AgencySourceFileEntry = {
  id: 'metadata-json',
  name: 'metadata.json',
  path: 'metadata.json',
  folderId: 'root',
  language: 'json',
  previewTab: 'home',
  content: AGENCY_METADATA_JSON,
};

export const AGENCY_SOURCE_FOLDERS: AgencySourceFolderGroup[] = [
  {
    id: 'core',
    name: 'core',
    previewTab: 'home',
    files: [
      {
        id: 'core-shell',
        name: 'WhatsAppAgencyPreview.tsx',
        path: 'core/WhatsAppAgencyPreview.tsx',
        folderId: 'core',
        language: 'tsx',
        previewTab: 'home',
        content: whatsAppAgencyPreviewRaw,
      },
      {
        id: 'core-routes',
        name: 'agencyRoutes.ts',
        path: 'core/agencyRoutes.ts',
        folderId: 'core',
        language: 'ts',
        previewTab: 'home',
        content: agencyRoutesRaw,
      },
    ],
  },
  {
    id: 'inicio',
    name: 'inicio',
    previewTab: 'home',
    files: [
      {
        id: 'inicio-desktop',
        name: 'AgencyDesktopHome.tsx',
        path: 'inicio/AgencyDesktopHome.tsx',
        folderId: 'inicio',
        language: 'tsx',
        previewTab: 'home',
        content: agencyDesktopHomeRaw,
      },
      {
        id: 'inicio-mobile',
        name: 'AgencyMobileHome.tsx',
        path: 'inicio/AgencyMobileHome.tsx',
        folderId: 'inicio',
        language: 'tsx',
        previewTab: 'home',
        content: agencyMobileHomeRaw,
      },
    ],
  },
  {
    id: 'clientes',
    name: 'clientes',
    previewTab: 'clients',
    files: [
      {
        id: 'clientes-model',
        name: 'agencyClients.ts',
        path: 'clientes/agencyClients.ts',
        folderId: 'clientes',
        language: 'ts',
        previewTab: 'clients',
        content: agencyClientsRaw,
      },
      {
        id: 'clientes-validation',
        name: 'agencyValidation.ts',
        path: 'clientes/agencyValidation.ts',
        folderId: 'clientes',
        language: 'ts',
        previewTab: 'clients',
        content: agencyValidationRaw,
      },
      {
        id: 'clientes-countries',
        name: 'agencyCountries.ts',
        path: 'clientes/agencyCountries.ts',
        folderId: 'clientes',
        language: 'ts',
        previewTab: 'clients',
        content: agencyCountriesRaw,
      },
      {
        id: 'clientes-desktop',
        name: 'AgencyDesktopClients.tsx',
        path: 'clientes/AgencyDesktopClients.tsx',
        folderId: 'clientes',
        language: 'tsx',
        previewTab: 'clients',
        content: agencyDesktopClientsRaw,
      },
      {
        id: 'clientes-mobile',
        name: 'AgencyMobileClients.tsx',
        path: 'clientes/AgencyMobileClients.tsx',
        folderId: 'clientes',
        language: 'tsx',
        previewTab: 'clients',
        content: agencyMobileClientsRaw,
      },
      {
        id: 'clientes-row-menu',
        name: 'AgencyClientRowMenu.tsx',
        path: 'clientes/AgencyClientRowMenu.tsx',
        folderId: 'clientes',
        language: 'tsx',
        previewTab: 'clients',
        content: agencyClientRowMenuRaw,
      },
      {
        id: 'clientes-detail-panel',
        name: 'AgencyClientDetailPanel.tsx',
        path: 'clientes/AgencyClientDetailPanel.tsx',
        folderId: 'clientes',
        language: 'tsx',
        previewTab: 'clients',
        content: agencyClientDetailPanelRaw,
      },
    ],
  },
  {
    id: 'bots',
    name: 'bots',
    previewTab: 'bots',
    files: [
      {
        id: 'bots-model',
        name: 'agencyBots.ts',
        path: 'bots/agencyBots.ts',
        folderId: 'bots',
        language: 'ts',
        previewTab: 'bots',
        content: agencyBotsRaw,
      },
      {
        id: 'bots-desktop',
        name: 'AgencyDesktopBots.tsx',
        path: 'bots/AgencyDesktopBots.tsx',
        folderId: 'bots',
        language: 'tsx',
        previewTab: 'bots',
        content: agencyDesktopBotsRaw,
      },
    ],
  },
];

export const ALL_AGENCY_SOURCE_FILES: AgencySourceFileEntry[] = [
  AGENCY_ROOT_METADATA_FILE,
  ...AGENCY_SOURCE_FOLDERS.flatMap((folder) => folder.files),
];
