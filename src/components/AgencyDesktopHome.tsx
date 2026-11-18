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
  screenBrandTitle: string;
  screenSubtitle: string;
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
    screenBrandTitle: 'Agencia de WhatsApp',
    screenSubtitle: 'Automatización multi-cliente',
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
    screenBrandTitle: 'WhatsApp Agency',
    screenSubtitle: 'Multi-client automation',
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
    screenBrandTitle: 'Agência de WhatsApp',
    screenSubtitle: 'Automação multi-cliente',
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
}: AgencyDesktopHomeProps) {
  const copy = DESKTOP_HOME_COPY[locale] ?? DESKTOP_HOME_COPY.es;

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-[#F7F9FB] text-slate-950 flex flex-col justify-between select-none">
      {/* Bright daylight agency worktable scene with front display */}
      <AgencyDaylightStudioBackdrop
        screenTitle={copy.screenBrandTitle}
        screenSubtitle={copy.screenSubtitle}
      />

      {/* Soft daylight scrims so left editorial copy and bottom metrics remain razor sharp */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FFFFFF]/95 via-[#FFFFFF]/80 to-[#FFFFFF]/12"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#FFFFFF]/94 via-[#FFFFFF]/35 to-transparent"
      />

      {/* Left focal column */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-12 xl:px-16 pt-14 pb-8 max-w-2xl">
        <p className="text-[12.5px] font-medium text-slate-500 tracking-tight">
          {copy.kicker}
        </p>

        <h1 className="mt-3 text-[clamp(2rem,3vw,2.85rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-slate-950 text-balance">
          {copy.headline}
        </h1>

        <p className="mt-4 text-[14.5px] leading-[1.65] text-slate-600 max-w-xl">
          {copy.subcopy}
        </p>

        <div className="mt-8 flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate('bots')}
            className="px-5 py-2.5 rounded-lg bg-[#86EFAC] hover:bg-[#6EE7B7] text-slate-950 border border-[#4ADE80]/70 text-[13px] font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] cursor-pointer"
          >
            {copy.primaryAction}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('env')}
            className="text-[13px] font-medium text-slate-700 hover:text-slate-950 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-950 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded cursor-pointer"
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
        <div className="border-t border-slate-900/10 pt-6 grid grid-cols-4 gap-8 max-w-5xl">
          {copy.metrics.map((item) => (
            <button
              key={item.target}
              type="button"
              onClick={() => onNavigate(item.target)}
              className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded cursor-pointer"
            >
              <span className="block text-[12px] font-medium text-slate-500 group-hover:text-slate-800 whitespace-nowrap truncate">
                {item.label}
              </span>
              <span className="mt-1.5 block text-[22px] font-semibold tracking-tight text-slate-950 tabular-nums">
                {item.value}
              </span>
              <span className="mt-1 block text-[12px] text-slate-500 truncate">
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}

function AgencyDaylightStudioBackdrop({
  screenTitle,
  screenSubtitle,
}: {
  screenTitle: string;
  screenSubtitle: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="dayWall" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#F5F7FA" />
          <stop offset="100%" stopColor="#E9EEF4" />
        </linearGradient>

        <linearGradient id="dayFloor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EBF0F5" />
          <stop offset="100%" stopColor="#DFE6EE" />
        </linearGradient>

        <linearGradient id="dayWindow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        <linearGradient id="oakTop" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F1DFCA" />
          <stop offset="55%" stopColor="#E8CFAF" />
          <stop offset="100%" stopColor="#DEC09C" />
        </linearGradient>

        <linearGradient id="sunWash" x1="100%" y1="0%" x2="15%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#FEF9EE" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <filter id="softScreenShadow" x="-15%" y="-15%" width="130%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#0F172A" floodOpacity="0.1" />
        </filter>
      </defs>

      {/* Sunlit architectural studio walls & floor */}
      <rect width="1440" height="635" fill="url(#dayWall)" />
      <rect y="635" width="1440" height="265" fill="url(#dayFloor)" />
      <line x1="0" y1="635" x2="1440" y2="635" stroke="#CBD5E1" strokeOpacity="0.65" />

      {/* Subtle architectural wall panels */}
      <line x1="560" y1="0" x2="560" y2="635" stroke="#CBD5E1" strokeOpacity="0.35" />
      <line x1="1175" y1="0" x2="1175" y2="635" stroke="#CBD5E1" strokeOpacity="0.4" />

      {/* Tall studio window on far right */}
      <rect x="1195" y="42" width="215" height="470" rx="2" fill="url(#dayWindow)" stroke="#CBD5E1" strokeWidth="2" />
      <line x1="1302" y1="42" x2="1302" y2="512" stroke="#CBD5E1" strokeWidth="2" />
      <line x1="1195" y1="230" x2="1410" y2="230" stroke="#CBD5E1" strokeWidth="2" />
      <line x1="1195" y1="385" x2="1410" y2="385" stroke="#CBD5E1" strokeWidth="2" />

      {/* Soft morning daylight wash */}
      <polygon points="1195,42 1410,42 1440,560 710,720 560,550" fill="url(#sunWash)" />

      {/* Studio botanical accent near the window */}
      <g opacity="0.88">
        <rect x="1296" y="544" width="48" height="62" rx="6" fill="#D5DEE8" />
        <path d="M1320 544 C1314 495 1290 462 1272 440 C1298 456 1318 486 1322 528 Z" fill="#84A98C" />
        <path d="M1320 544 C1326 485 1352 448 1372 426 C1352 456 1332 490 1324 534 Z" fill="#6B9080" />
        <path d="M1320 544 C1318 480 1322 435 1324 405 C1328 438 1328 482 1324 544 Z" fill="#95B89C" />
      </g>

      {/* Main studio wall display clearly showing "Agencia de WhatsApp" */}
      <g filter="url(#softScreenShadow)">
        <rect
          x="772"
          y="138"
          width="410"
          height="234"
          rx="12"
          fill="#1E293B"
        />
        <rect
          x="782"
          y="148"
          width="390"
          height="214"
          rx="6"
          fill="#FFFFFF"
        />
      </g>

      {/* Display top strip & live "Agencia de WhatsApp" presentation canvas */}
      <rect x="782" y="148" width="390" height="34" rx="6" fill="#F8FAFC" />
      <line x1="782" y1="182" x2="1172" y2="182" stroke="#E2E8F0" strokeWidth="1" />

      {/* WhatsApp logo badge inside the studio display */}
      <g transform="translate(808, 206)">
        <rect width="34" height="34" rx="9" fill="#DCFCE7" />
        <path
          d="M17 7.5C11.75 7.5 7.5 11.75 7.5 17C7.5 18.85 8.03 20.58 8.95 22.05L7.82 26.18L12.07 25.07C13.48 25.9 15.19 26.4 17 26.4C22.25 26.4 26.5 22.25 26.5 17C26.5 11.75 22.25 7.5 17 7.5Z"
          fill="#25D366"
        />
        <path
          d="M14.48 13.7C14.27 13.24 14.05 13.23 13.86 13.22H13.33C13.14 13.22 12.85 13.3 12.6 13.57C12.35 13.84 11.64 14.5 11.64 15.84C11.64 17.18 12.62 18.47 12.75 18.65C12.89 18.83 14.64 21.67 17.42 22.76C19.72 23.66 20.2 23.49 20.7 23.44C21.2 23.39 22.31 22.78 22.54 22.15C22.77 21.51 22.77 20.97 22.69 20.85C22.63 20.74 22.44 20.66 22.17 20.53C21.9 20.39 20.57 19.74 20.32 19.65C20.07 19.56 19.89 19.51 19.7 19.78C19.53 20.05 19.01 20.66 18.84 20.85C18.69 21.03 18.53 21.05 18.26 20.91C17.99 20.78 17.12 20.49 16.09 19.58C15.28 18.86 14.75 17.98 14.59 17.71C14.44 17.44 14.57 17.28 14.71 17.15C14.83 17.03 14.98 16.84 15.11 16.67C15.25 16.52 15.3 16.4 15.38 16.23C15.47 16.04 15.43 15.88 15.36 15.75C15.3 15.61 14.75 14.27 14.48 13.7Z"
          fill="#FFFFFF"
        />
      </g>

      {/* Front screen readable title: "Agencia de WhatsApp" */}
      <text
        x="854"
        y="222"
        fill="#0F172A"
        fontSize="20"
        fontWeight="700"
        fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
      >
        {screenTitle}
      </text>
      <text
        x="854"
        y="240"
        fill="#64748B"
        fontSize="11.5"
        fontWeight="500"
        fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
      >
        {screenSubtitle}
      </text>

      {/* Clean UI wireframe preview lines inside the front screen */}
      <rect x="808" y="264" width="108" height="74" rx="6" fill="#F8FAFC" stroke="#E2E8F0" />
      <rect x="822" y="280" width="52" height="6" rx="3" fill="#CBD5E1" />
      <rect x="822" y="296" width="76" height="10" rx="4" fill="#86EFAC" />
      <rect x="822" y="316" width="64" height="6" rx="3" fill="#E2E8F0" />

      <rect x="928" y="264" width="108" height="74" rx="6" fill="#F8FAFC" stroke="#E2E8F0" />
      <rect x="942" y="280" width="46" height="6" rx="3" fill="#CBD5E1" />
      <rect x="942" y="296" width="72" height="10" rx="4" fill="#0F172A" fillOpacity="0.82" />
      <rect x="942" y="316" width="60" height="6" rx="3" fill="#E2E8F0" />

      <rect x="1048" y="264" width="98" height="74" rx="6" fill="#F8FAFC" stroke="#E2E8F0" />
      <rect x="1062" y="280" width="44" height="6" rx="3" fill="#CBD5E1" />
      <rect x="1062" y="296" width="62" height="10" rx="4" fill="#25D366" fillOpacity="0.35" />
      <rect x="1062" y="316" width="54" height="6" rx="3" fill="#E2E8F0" />

      {/* Agency people collaborating behind/around the worktable */}
      {/* Team Member 1 (center-left behind table, looking toward laptop & screen) */}
      <g>
        <circle cx="806" cy="434" r="24" fill="#E2C0A4" />
        <path d="M782 430 C782 408 796 400 812 402 C824 404 832 414 830 430 C822 420 794 420 782 430 Z" fill="#1E293B" />
        <path d="M754 536 C754 486 776 462 806 462 C836 462 858 486 858 536 Z" fill="#334155" />
      </g>

      {/* Team Member 2 (center-right standing/leaning gently toward the table) */}
      <g>
        <circle cx="984" cy="422" r="25" fill="#D4A684" />
        <path d="M959 418 C959 394 975 386 992 388 C1006 390 1012 402 1009 420 C1001 408 972 408 959 418 Z" fill="#0F172A" />
        <path d="M930 534 C932 480 956 454 984 454 C1012 454 1036 480 1038 534 Z" fill="#F1F5F9" stroke="#CBD5E1" />
      </g>

      {/* Team Member 3 (right side seated at the worktable) */}
      <g>
        <circle cx="1156" cy="442" r="24" fill="#E8C7AC" />
        <path d="M1132 438 C1132 414 1148 405 1166 408 C1180 412 1184 424 1180 442 C1172 426 1146 426 1132 438 Z" fill="#3B2F2F" />
        <path d="M1104 538 C1106 490 1128 468 1156 468 C1184 468 1206 490 1208 538 Z" fill="#475569" />
      </g>

      {/* Soft table shadow on floor */}
      <ellipse cx="975" cy="744" rx="340" ry="26" fill="#CBD5E1" fillOpacity="0.48" />

      {/* Architectural steel table legs */}
      <rect x="690" y="556" width="12" height="184" rx="2" fill="#94A3B8" />
      <rect x="1250" y="556" width="12" height="184" rx="2" fill="#94A3B8" />

      {/* Bright light-oak agency conference worktable */}
      <polygon points="620,534 1330,534 1360,558 590,558" fill="url(#oakTop)" />
      <rect x="590" y="558" width="770" height="14" rx="2" fill="#D1B08B" />

      {/* Laptops and coffee mugs on the oak worktable */}
      {/* Laptop 1 (left) */}
      <polygon points="758,476 846,476 854,532 750,532" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2" />
      <polygon points="750,532 854,532 868,542 738,542" fill="#CBD5E1" />

      {/* Laptop 2 (center) */}
      <polygon points="942,482 1030,482 1036,532 936,532" fill="#1E293B" />
      <polygon points="936,532 1036,532 1052,542 924,542" fill="#475569" />

      {/* Laptop 3 (right) */}
      <polygon points="1102,480 1188,480 1196,532 1094,532" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2" />
      <polygon points="1094,532 1196,532 1210,542 1082,542" fill="#CBD5E1" />

      {/* Ceramic coffee mugs on table */}
      <rect x="886" y="514" width="18" height="22" rx="3" fill="#FFFFFF" stroke="#CBD5E1" />
      <rect x="1226" y="516" width="18" height="20" rx="3" fill="#FFFFFF" stroke="#CBD5E1" />

      {/* Foreground foreground chairs (backs subtly visible below table) */}
      <rect x="742" y="572" width="110" height="130" rx="14" fill="#E2E8F0" stroke="#CBD5E1" />
      <rect x="920" y="576" width="110" height="126" rx="14" fill="#DCE4EE" stroke="#CBD5E1" />
      <rect x="1102" y="572" width="110" height="130" rx="14" fill="#E2E8F0" stroke="#CBD5E1" />
    </svg>
  );
}
