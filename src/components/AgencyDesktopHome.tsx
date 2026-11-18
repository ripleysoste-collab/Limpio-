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
}: AgencyDesktopHomeProps) {
  const copy = DESKTOP_HOME_COPY[locale] ?? DESKTOP_HOME_COPY.es;

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-[#0A0E14] text-white flex flex-col justify-between select-none">
      {/* Studio developer workspace backdrop */}
      <DeveloperStudioBackdrop />

      {/* Measured contrast scrims so foreground text stays effortless to read */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#090D12]/92 via-[#090D12]/68 to-[#090D12]/28"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080B10]/95 via-[#080B10]/25 to-transparent"
      />

      {/* Top editorial breathing room + center focal headline */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-12 xl:px-16 pt-14 pb-8 max-w-2xl">
        <p className="text-[12.5px] font-medium text-slate-300/90 tracking-tight">
          {copy.kicker}
        </p>

        <h1 className="mt-3 text-[clamp(2rem,3vw,2.85rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-white text-balance">
          {copy.headline}
        </h1>

        <p className="mt-4 text-[14.5px] leading-[1.65] text-slate-300 max-w-xl">
          {copy.subcopy}
        </p>

        <div className="mt-8 flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate('bots')}
            className="px-5 py-2.5 rounded-lg bg-white text-slate-950 text-[13px] font-semibold whitespace-nowrap shrink-0 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer"
          >
            {copy.primaryAction}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('env')}
            className="text-[13px] font-medium text-slate-300 hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded cursor-pointer"
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
              <span className="block text-[12px] font-medium text-slate-400 group-hover:text-slate-200 whitespace-nowrap truncate">
                {item.label}
              </span>
              <span className="mt-1.5 block text-[22px] font-semibold tracking-tight text-white tabular-nums">
                {item.value}
              </span>
              <span className="mt-1 block text-[12px] text-slate-400/85 truncate">
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}

function DeveloperStudioBackdrop() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="studioWall" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#090C11" />
          <stop offset="55%" stopColor="#121821" />
          <stop offset="100%" stopColor="#1B2330" />
        </linearGradient>

        <linearGradient id="windowGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D9E2EC" stopOpacity="0.16" />
          <stop offset="65%" stopColor="#94A3B8" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="lightShaft" x1="100%" y1="0%" x2="15%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.08" />
          <stop offset="55%" stopColor="#CBD5E1" stopOpacity="0.025" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
        </linearGradient>

        <radialGradient id="screenAmbient" cx="50%" cy="48%" r="48%">
          <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#475569" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="deskSurface" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#171C24" />
          <stop offset="60%" stopColor="#11151C" />
          <stop offset="100%" stopColor="#0B0E14" />
        </linearGradient>

        <linearGradient id="monitorBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#161C26" />
          <stop offset="100%" stopColor="#0E131A" />
        </linearGradient>

        <filter id="studioGrain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.045" />
          </feComponentTransfer>
        </filter>
      </defs>

      {/* Architectural studio wall */}
      <rect width="1440" height="900" fill="url(#studioWall)" />

      {/* Subtle architectural concrete panel joints */}
      <line x1="360" y1="0" x2="360" y2="620" stroke="#FFFFFF" strokeOpacity="0.03" />
      <line x1="720" y1="0" x2="720" y2="620" stroke="#FFFFFF" strokeOpacity="0.035" />
      <line x1="1080" y1="0" x2="1080" y2="620" stroke="#FFFFFF" strokeOpacity="0.03" />
      <line x1="0" y1="310" x2="1440" y2="310" stroke="#FFFFFF" strokeOpacity="0.022" />

      {/* Tall studio window light on upper right */}
      <rect x="1140" y="0" width="300" height="470" fill="url(#windowGlow)" />
      <line x1="1290" y1="0" x2="1290" y2="470" stroke="#0B0F15" strokeWidth="6" />
      <line x1="1140" y1="220" x2="1440" y2="220" stroke="#0B0F15" strokeWidth="6" />

      {/* Diagonal soft window daylight shafts across studio */}
      <polygon points="1140,0 1440,0 1440,420 760,720 620,620" fill="url(#lightShaft)" />

      {/* Ambient halo cast by the workstation display */}
      <ellipse cx="1010" cy="390" rx="340" ry="220" fill="url(#screenAmbient)" />

      {/* Studio desk surface */}
      <polygon points="520,605 1440,565 1440,900 440,900" fill="url(#deskSurface)" />
      <line x1="520" y1="605" x2="1440" y2="565" stroke="#FFFFFF" strokeOpacity="0.09" strokeWidth="1.5" />

      {/* Monitor stand */}
      <path d="M1002 485 L1002 586 L954 596 L1068 594 L1022 586 L1022 485 Z" fill="#0E1218" />

      {/* Primary studio display */}
      <rect
        x="826"
        y="255"
        width="386"
        height="234"
        rx="10"
        fill="url(#monitorBody)"
        stroke="#FFFFFF"
        strokeOpacity="0.14"
        strokeWidth="1.5"
      />
      <rect x="838" y="267" width="362" height="210" rx="5" fill="#101722" />

      {/* Quiet abstract workspace layout inside the studio monitor */}
      <rect x="852" y="282" width="64" height="180" rx="3" fill="#182231" />
      <rect x="862" y="296" width="38" height="4" rx="2" fill="#475569" fillOpacity="0.65" />
      <rect x="862" y="312" width="44" height="3" rx="1.5" fill="#334155" />
      <rect x="862" y="324" width="34" height="3" rx="1.5" fill="#334155" />
      <rect x="862" y="336" width="40" height="3" rx="1.5" fill="#25D366" fillOpacity="0.45" />
      <rect x="862" y="348" width="30" height="3" rx="1.5" fill="#334155" />

      {/* Code / architecture lines inside editor pane */}
      <rect x="932" y="288" width="118" height="5" rx="2.5" fill="#64748B" fillOpacity="0.45" />
      <rect x="932" y="308" width="176" height="4" rx="2" fill="#334155" fillOpacity="0.85" />
      <rect x="948" y="322" width="132" height="4" rx="2" fill="#475569" fillOpacity="0.7" />
      <rect x="948" y="336" width="198" height="4" rx="2" fill="#25D366" fillOpacity="0.35" />
      <rect x="948" y="350" width="152" height="4" rx="2" fill="#334155" fillOpacity="0.8" />
      <rect x="932" y="370" width="106" height="4" rx="2" fill="#475569" fillOpacity="0.65" />
      <rect x="948" y="384" width="184" height="4" rx="2" fill="#334155" fillOpacity="0.8" />
      <rect x="948" y="398" width="124" height="4" rx="2" fill="#475569" fillOpacity="0.55" />
      <rect x="932" y="418" width="160" height="4" rx="2" fill="#334155" fillOpacity="0.75" />
      <rect x="948" y="432" width="96" height="4" rx="2" fill="#25D366" fillOpacity="0.3" />

      {/* Secondary angled laptop on left edge of workstation */}
      <path
        d="M688 456 L804 468 L792 562 L674 548 Z"
        fill="#131923"
        stroke="#FFFFFF"
        strokeOpacity="0.1"
        strokeWidth="1.2"
      />
      <path d="M694 464 L796 474 L786 552 L682 540 Z" fill="#0F1620" />
      <path d="M674 548 L792 562 L822 590 L692 574 Z" fill="#181F2A" />

      {/* Minimal desk mug */}
      <rect x="1256" y="534" width="32" height="36" rx="4" fill="#171D26" stroke="#FFFFFF" strokeOpacity="0.08" />
      <path d="M1288 542 C1298 542 1298 560 1288 560" stroke="#1E2530" strokeWidth="3.5" fill="none" />

      {/* Developer seated in calm three-quarter rear profile */}
      <g>
        {/* Backlit rim edge on hair and shoulders */}
        <path
          d="M956 440 C956 392 992 362 1030 366 C1066 370 1090 402 1086 446 C1082 472 1072 486 1068 504 L1126 534 C1154 550 1168 584 1172 642 L1178 900 L896 900 L908 656 C912 586 930 550 964 532 L1002 508 C996 490 956 474 956 440 Z"
          fill="#070A0E"
          stroke="#CBD5E1"
          strokeOpacity="0.12"
          strokeWidth="1.2"
        />

        {/* Subtle chair backrest behind shoulder */}
        <path
          d="M934 624 C934 590 958 574 1034 574 C1110 574 1134 592 1138 628 L1148 900 L922 900 Z"
          fill="#05070B"
          fillOpacity="0.72"
        />
      </g>

      {/* Subtle studio film grain */}
      <rect width="1440" height="900" filter="url(#studioGrain)" />
    </svg>
  );
}
