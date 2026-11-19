import type { SupportedLocale } from '../lib/i18n';

export type AgencyNavigationTarget =
  | 'bots'
  | 'metrics'
  | 'sql'
  | 'searchlink'
  | 'env';

interface AgencyDesktopHomeProps {
  locale: SupportedLocale;
  onNavigate: (tab: AgencyNavigationTarget) => void;
  backgroundImageSrc?: string;
}

interface PassiveMetricItem {
  label: string;
  value: string;
  hint: string;
  target: AgencyNavigationTarget;
}

interface DesktopHomeCopy {
  kicker: string;
  headline: string;
  subcopy: string;
  primaryAction: string;
  secondaryAction: string;
  metricsAria: string;
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
    metricsAria: 'Resumen pasivo del sistema',
    metrics: [
      {
        label: 'Bots activos',
        value: '0',
        hint: 'Sin instancias creadas',
        target: 'bots',
      },
      {
        label: 'Conversaciones (24 h)',
        value: '0',
        hint: 'Esperando tráfico',
        target: 'metrics',
      },
      {
        label: 'Base SQL',
        value: 'Pendiente',
        hint: 'PostgreSQL / Supabase',
        target: 'sql',
      },
      {
        label: 'Search Link Core',
        value: 'Inactivo',
        hint: 'Catálogo y endpoints',
        target: 'searchlink',
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
    metricsAria: 'Passive system overview',
    metrics: [
      {
        label: 'Active bots',
        value: '0',
        hint: 'No instances created',
        target: 'bots',
      },
      {
        label: 'Conversations (24h)',
        value: '0',
        hint: 'Awaiting traffic',
        target: 'metrics',
      },
      {
        label: 'SQL Database',
        value: 'Pending',
        hint: 'PostgreSQL / Supabase',
        target: 'sql',
      },
      {
        label: 'Search Link Core',
        value: 'Inactive',
        hint: 'Catalog & endpoints',
        target: 'searchlink',
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
    metricsAria: 'Resumo passivo do sistema',
    metrics: [
      {
        label: 'Bots ativos',
        value: '0',
        hint: 'Nenhuma instância criada',
        target: 'bots',
      },
      {
        label: 'Conversas (24 h)',
        value: '0',
        hint: 'Aguardando tráfego',
        target: 'metrics',
      },
      {
        label: 'Base SQL',
        value: 'Pendente',
        hint: 'PostgreSQL / Supabase',
        target: 'sql',
      },
      {
        label: 'Search Link Core',
        value: 'Inativo',
        hint: 'Catálogo e endpoints',
        target: 'searchlink',
      },
    ],
  },
};

export function AgencyDesktopHome({
  locale,
  onNavigate,
  backgroundImageSrc,
}: AgencyDesktopHomeProps) {
  const copy = DESKTOP_HOME_COPY[locale] ?? DESKTOP_HOME_COPY.es;

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-gradient-to-br from-[#1E293B] via-[#263448] to-[#314358] text-white flex flex-col justify-between select-none">
      {/* Real photographic background slot when provided */}
      {backgroundImageSrc ? (
        <img
          src={backgroundImageSrc}
          alt=""
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(134,239,172,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(15,23,42,0.35),transparent_65%)]"
        />
      )}

      {/* Measured scrim for crisp foreground legibility without blacking out the backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#16202E]/88 via-[#16202E]/55 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141D29]/90 via-transparent to-transparent"
      />

      {/* Left focal column */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-12 xl:px-16 pt-14 pb-8 max-w-2xl">
        <p className="text-[12.5px] font-medium text-slate-300 tracking-tight">
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

      {/* Bottom passive operational readout */}
      <footer
        aria-label={copy.metricsAria}
        className="relative z-10 px-12 xl:px-16 pb-9"
      >
        <div className="border-t border-white/15 pt-6 grid grid-cols-4 gap-8 max-w-5xl">
          {copy.metrics.map((item) => (
            <button
              key={item.target}
              type="button"
              onClick={() => onNavigate(item.target)}
              className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded cursor-pointer"
            >
              <span className="block text-[12px] font-medium text-slate-300 group-hover:text-white whitespace-nowrap truncate">
                {item.label}
              </span>
              <span className="mt-1.5 block text-[22px] font-semibold tracking-tight text-white tabular-nums">
                {item.value}
              </span>
              <span className="mt-1 block text-[12px] text-slate-300/80 truncate">
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
