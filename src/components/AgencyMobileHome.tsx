import type { SupportedLocale } from '../lib/i18n';
import type { AgencyTabId } from '../lib/agencyRoutes';

export type MobileHomeTarget = Extract<
  AgencyTabId,
  'bots' | 'metrics' | 'sql' | 'searchlink' | 'env'
>;

interface AgencyMobileHomeProps {
  locale: SupportedLocale;
  onNavigate: (tab: MobileHomeTarget) => void;
}

interface PassiveMetricItem {
  label: string;
  value: string;
  hint: string;
  target: MobileHomeTarget;
  borderClass: string;
}

interface MobileHomeCopy {
  kicker: string;
  headline: string;
  subcopy: string;
  primaryAction: string;
  secondaryAction: string;
  metricsAria: string;
  metrics: PassiveMetricItem[];
}

const MOBILE_HOME_COPY: Record<SupportedLocale, MobileHomeCopy> = {
  es: {
    kicker: 'Panel operativo · Código fuente propio',
    headline: 'Control central para tus bots de WhatsApp',
    subcopy:
      'Administra clientes, activa Search Link Core y supervisa tu base SQL desde un entorno limpio y privado.',
    primaryAction: 'Ir a Bots',
    secondaryAction: 'Configurar .env',
    metricsAria: 'Resumen pasivo del sistema',
    metrics: [
      {
        label: 'Bots activos',
        value: '0',
        hint: 'Sin instancias',
        target: 'bots',
        borderClass: 'border-emerald-400/80 active:bg-emerald-50/40',
      },
      {
        label: 'Chats (24 h)',
        value: '0',
        hint: 'Esperando tráfico',
        target: 'metrics',
        borderClass: 'border-sky-400/80 active:bg-sky-50/40',
      },
      {
        label: 'Base SQL',
        value: 'Pendiente',
        hint: 'PostgreSQL / Supabase',
        target: 'sql',
        borderClass: 'border-amber-400/80 active:bg-amber-50/40',
      },
      {
        label: 'Search Link Core',
        value: 'Inactivo',
        hint: 'Catálogo y API',
        target: 'searchlink',
        borderClass: 'border-violet-400/80 active:bg-violet-50/40',
      },
    ],
  },
  en: {
    kicker: 'Operations console · Open source stack',
    headline: 'Central control for your WhatsApp bots',
    subcopy:
      'Manage client bots, connect Search Link Core, and oversee your SQL database from one private workspace.',
    primaryAction: 'Open Bots',
    secondaryAction: 'Configure .env',
    metricsAria: 'Passive system overview',
    metrics: [
      {
        label: 'Active bots',
        value: '0',
        hint: 'No instances',
        target: 'bots',
        borderClass: 'border-emerald-400/80 active:bg-emerald-50/40',
      },
      {
        label: 'Chats (24h)',
        value: '0',
        hint: 'Awaiting traffic',
        target: 'metrics',
        borderClass: 'border-sky-400/80 active:bg-sky-50/40',
      },
      {
        label: 'SQL Database',
        value: 'Pending',
        hint: 'PostgreSQL / Supabase',
        target: 'sql',
        borderClass: 'border-amber-400/80 active:bg-amber-50/40',
      },
      {
        label: 'Search Link Core',
        value: 'Inactive',
        hint: 'Catalog & API',
        target: 'searchlink',
        borderClass: 'border-violet-400/80 active:bg-violet-50/40',
      },
    ],
  },
  pt: {
    kicker: 'Painel operacional · Código-fonte próprio',
    headline: 'Controle central dos seus bots de WhatsApp',
    subcopy:
      'Gerencie clientes, ative o Search Link Core e acompanhe sua base SQL em um ambiente limpo e privado.',
    primaryAction: 'Abrir Bots',
    secondaryAction: 'Configurar .env',
    metricsAria: 'Resumo passivo do sistema',
    metrics: [
      {
        label: 'Bots ativos',
        value: '0',
        hint: 'Sem instâncias',
        target: 'bots',
        borderClass: 'border-emerald-400/80 active:bg-emerald-50/40',
      },
      {
        label: 'Conversas (24 h)',
        value: '0',
        hint: 'Aguardando tráfego',
        target: 'metrics',
        borderClass: 'border-sky-400/80 active:bg-sky-50/40',
      },
      {
        label: 'Base SQL',
        value: 'Pendente',
        hint: 'PostgreSQL / Supabase',
        target: 'sql',
        borderClass: 'border-amber-400/80 active:bg-amber-50/40',
      },
      {
        label: 'Search Link Core',
        value: 'Inativo',
        hint: 'Catálogo e API',
        target: 'searchlink',
        borderClass: 'border-violet-400/80 active:bg-violet-50/40',
      },
    ],
  },
};

export function AgencyMobileHome({
  locale,
  onNavigate,
}: AgencyMobileHomeProps) {
  const copy = MOBILE_HOME_COPY[locale] ?? MOBILE_HOME_COPY.es;

  return (
    <div className="relative min-h-full bg-white text-slate-950 px-5 pt-6 pb-12">
      <p className="text-[12px] font-medium text-slate-500 tracking-tight">
        {copy.kicker}
      </p>

      <h2 className="mt-2 text-[24px] leading-[1.18] font-semibold tracking-[-0.02em] text-slate-950 text-balance">
        {copy.headline}
      </h2>

      <p className="mt-3 text-[13.5px] leading-[1.6] text-slate-600">
        {copy.subcopy}
      </p>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => onNavigate('bots')}
          className="min-h-[44px] px-5 rounded-xl bg-[#86EFAC] active:bg-[#4ADE80] text-slate-950 border border-[#4ADE80]/70 text-[13.5px] font-semibold whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]"
        >
          {copy.primaryAction}
        </button>

        <button
          type="button"
          onClick={() => onNavigate('env')}
          className="min-h-[44px] px-2 flex items-center text-[13.5px] font-medium text-slate-700 underline underline-offset-4 decoration-slate-300 active:text-slate-950 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded"
        >
          {copy.secondaryAction}
        </button>
      </div>

      {/* Minimalist 2x2 operational summary with distinct colored borders */}
      <section aria-label={copy.metricsAria} className="mt-8">
        <div className="grid grid-cols-2 gap-2.5">
          {copy.metrics.map((item) => (
            <button
              key={item.target}
              type="button"
              onClick={() => onNavigate(item.target)}
              className={`min-h-[86px] rounded-xl border bg-white px-3.5 py-3.5 text-left flex flex-col justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${item.borderClass}`}
            >
              <span className="text-[11.5px] font-medium text-slate-500 truncate">
                {item.label}
              </span>
              <span className="mt-1 text-[19px] font-semibold tracking-tight text-slate-950 tabular-nums truncate">
                {item.value}
              </span>
              <span className="mt-0.5 text-[11px] text-slate-400 truncate">
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
