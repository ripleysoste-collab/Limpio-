import { useEffect, useState } from 'react';
import type { SupportedLocale } from '../lib/i18n';

export type AgencyDesktopActionTarget = 'bots' | 'env';

const DESKTOP_HOME_IMAGE_URL =
  'https://limpioso.vercel.app/api/media?k=catalog%2F2026-11%2Fc523daefbd9f4c25.webp';

// Module-level preload state so switching tabs or reopening Inicio reuses the cached browser image immediately.
let preloadedHeroStatus: 'idle' | 'loaded' | 'error' = 'idle';

export function preloadAgencyHeroImage(): void {
  if (typeof window === 'undefined' || preloadedHeroStatus === 'loaded') {
    return;
  }
  const img = new Image();
  img.referrerPolicy = 'no-referrer';
  img.onload = () => {
    preloadedHeroStatus = 'loaded';
  };
  img.onerror = () => {
    preloadedHeroStatus = 'error';
  };
  img.src = DESKTOP_HOME_IMAGE_URL;
}

interface AgencyDesktopHomeProps {
  locale: SupportedLocale;
  onNavigate: (tab: AgencyDesktopActionTarget) => void;
}

interface PassiveMetricItem {
  id: 'bots' | 'chats' | 'sql' | 'core';
  label: string;
  value: string;
  hint: string;
  accentClass: string;
}

interface DesktopHomeCopy {
  kicker: string;
  headline: string;
  subcopy: string;
  primaryAction: string;
  secondaryAction: string;
  metricsAria: string;
  imageAlt: string;
  metrics: PassiveMetricItem[];
}

const DESKTOP_HOME_COPY: Record<SupportedLocale, DesktopHomeCopy> = {
  es: {
    kicker: 'Panel operativo · Infraestructura propia',
    headline: 'Control central para tus bots de WhatsApp',
    subcopy:
      'Administra clientes, conecta Search Link Core y supervisa tu base SQL y motor de respuesta desde un entorno limpio y privado.',
    primaryAction: 'Ir a Bots',
    secondaryAction: 'Configurar .env',
    metricsAria: 'Métricas iniciales del sistema',
    imageAlt: 'Equipo de la agencia trabajando junto a la pantalla principal',
    metrics: [
      {
        id: 'bots',
        label: 'Bots activos',
        value: '0',
        hint: 'Sin instancias creadas',
        accentClass: 'border-emerald-400/55 bg-emerald-950/25',
      },
      {
        id: 'chats',
        label: 'Conversaciones (24 h)',
        value: '0',
        hint: 'Esperando tráfico',
        accentClass: 'border-sky-400/45 bg-sky-950/20',
      },
      {
        id: 'sql',
        label: 'Base SQL',
        value: 'Pendiente',
        hint: 'PostgreSQL / Supabase',
        accentClass: 'border-amber-300/45 bg-amber-950/20',
      },
      {
        id: 'core',
        label: 'Search Link Core',
        value: 'Inactivo',
        hint: 'Catálogo y endpoints',
        accentClass: 'border-teal-300/45 bg-teal-950/20',
      },
    ],
  },
  en: {
    kicker: 'Operations console · Self-hosted stack',
    headline: 'Central control for your WhatsApp bots',
    subcopy:
      'Manage client instances, connect Search Link Core, and oversee your SQL database and response engine from one quiet private workspace.',
    primaryAction: 'Open Bots',
    secondaryAction: 'Configure .env',
    metricsAria: 'Initial system metrics',
    imageAlt: 'Agency team collaborating around the main studio display',
    metrics: [
      {
        id: 'bots',
        label: 'Active bots',
        value: '0',
        hint: 'No instances created',
        accentClass: 'border-emerald-400/55 bg-emerald-950/25',
      },
      {
        id: 'chats',
        label: 'Conversations (24h)',
        value: '0',
        hint: 'Awaiting traffic',
        accentClass: 'border-sky-400/45 bg-sky-950/20',
      },
      {
        id: 'sql',
        label: 'SQL Database',
        value: 'Pending',
        hint: 'PostgreSQL / Supabase',
        accentClass: 'border-amber-300/45 bg-amber-950/20',
      },
      {
        id: 'core',
        label: 'Search Link Core',
        value: 'Inactive',
        hint: 'Catalog & endpoints',
        accentClass: 'border-teal-300/45 bg-teal-950/20',
      },
    ],
  },
  pt: {
    kicker: 'Painel operacional · Arquitetura própria',
    headline: 'Controle central dos seus bots de WhatsApp',
    subcopy:
      'Gerencie clientes, conecte o Search Link Core e acompanhe sua base SQL e motor de resposta em um único ambiente privado.',
    primaryAction: 'Abrir Bots',
    secondaryAction: 'Configurar .env',
    metricsAria: 'Métricas iniciais do sistema',
    imageAlt: 'Equipe da agência trabalhando ao redor da tela principal',
    metrics: [
      {
        id: 'bots',
        label: 'Bots ativos',
        value: '0',
        hint: 'Nenhuma instância criada',
        accentClass: 'border-emerald-400/55 bg-emerald-950/25',
      },
      {
        id: 'chats',
        label: 'Conversas (24 h)',
        value: '0',
        hint: 'Aguardando tráfego',
        accentClass: 'border-sky-400/45 bg-sky-950/20',
      },
      {
        id: 'sql',
        label: 'Base SQL',
        value: 'Pendente',
        hint: 'PostgreSQL / Supabase',
        accentClass: 'border-amber-300/45 bg-amber-950/20',
      },
      {
        id: 'core',
        label: 'Search Link Core',
        value: 'Inativo',
        hint: 'Catálogo e endpoints',
        accentClass: 'border-teal-300/45 bg-teal-950/20',
      },
    ],
  },
};

export function AgencyDesktopHome({
  locale,
  onNavigate,
}: AgencyDesktopHomeProps) {
  const copy = DESKTOP_HOME_COPY[locale] ?? DESKTOP_HOME_COPY.es;
  const [imageFailed, setImageFailed] = useState(
    () => preloadedHeroStatus === 'error',
  );

  useEffect(() => {
    preloadAgencyHeroImage();
  }, []);

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-[#182230] text-white flex flex-col justify-between select-none">
      {/* Cached immutable WebP hero photo with clean slate fallback if offline */}
      {!imageFailed && (
        <img
          src={DESKTOP_HOME_IMAGE_URL}
          alt={copy.imageAlt}
          referrerPolicy="no-referrer"
          decoding="async"
          loading="eager"
          onLoad={() => {
            preloadedHeroStatus = 'loaded';
          }}
          onError={() => {
            preloadedHeroStatus = 'error';
            setImageFailed(true);
          }}
          className="pointer-events-none absolute inset-0 w-full h-full object-cover object-center"
        />
      )}

      {/* Measured contrast scrims focused on left text column and bottom strip so the center/right scene stays vivid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0B121C]/88 via-[#0B121C]/48 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A1019]/90 via-[#0A1019]/25 to-transparent"
      />

      {/* Left focal column */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-12 xl:px-16 pt-14 pb-8 max-w-2xl">
        <p className="text-[12.5px] font-medium text-slate-200/90 tracking-tight">
          {copy.kicker}
        </p>

        <h1 className="mt-3 text-[clamp(2rem,3vw,2.85rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-white text-balance">
          {copy.headline}
        </h1>

        <p className="mt-4 text-[14.5px] leading-[1.65] text-slate-200/90 max-w-xl">
          {copy.subcopy}
        </p>

        <div className="mt-8 flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate('bots')}
            className="px-5 py-2.5 rounded-lg bg-[#86EFAC] hover:bg-[#6EE7B7] text-slate-950 border border-[#4ADE80]/70 text-[13px] font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86EFAC] cursor-pointer"
          >
            {copy.primaryAction}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('env')}
            className="text-[13px] font-medium text-slate-200 hover:text-white underline underline-offset-4 decoration-white/35 hover:decoration-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded cursor-pointer"
          >
            {copy.secondaryAction}
          </button>
        </div>
      </div>

      {/* Bottom passive real-time visual metrics (non-navigational) */}
      <footer
        aria-label={copy.metricsAria}
        className="relative z-10 px-12 xl:px-16 pb-9"
      >
        <div className="grid grid-cols-4 gap-4 max-w-5xl">
          {copy.metrics.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border px-4 py-3.5 backdrop-blur-[2px] ${item.accentClass}`}
            >
              <span className="block text-[12px] font-medium text-slate-200/90 whitespace-nowrap truncate">
                {item.label}
              </span>
              <span className="mt-1.5 block text-[22px] font-semibold tracking-tight text-white tabular-nums">
                {item.value}
              </span>
              <span className="mt-1 block text-[12px] text-slate-300/85 truncate">
                {item.hint}
              </span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
