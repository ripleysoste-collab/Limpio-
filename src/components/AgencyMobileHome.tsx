import type { SupportedLocale } from '../lib/i18n';

export type MobileHomeActionTarget = 'bots' | 'env';

interface AgencyMobileHomeProps {
  locale: SupportedLocale;
  onNavigate: (tab: MobileHomeActionTarget) => void;
}

interface PassiveMetricCard {
  id: 'bots' | 'chats' | 'sql' | 'core';
  label: string;
  value: string;
  hint: string;
  cardClass: string;
}

interface MobileHomeCopy {
  kicker: string;
  headline: string;
  subcopy: string;
  primaryAction: string;
  secondaryAction: string;
  metricsAria: string;
  metrics: PassiveMetricCard[];
}

const MOBILE_HOME_COPY: Record<SupportedLocale, MobileHomeCopy> = {
  es: {
    kicker: 'Panel operativo · Código fuente propio',
    headline: 'Control central para tus bots de WhatsApp',
    subcopy:
      'Administra clientes, activa Search Link Core y supervisa tu base SQL desde un entorno limpio y privado.',
    primaryAction: 'Ir a Bots',
    secondaryAction: 'Configurar .env',
    metricsAria: 'Métricas iniciales del sistema',
    metrics: [
      {
        id: 'bots',
        label: 'Bots activos',
        value: '0',
        hint: 'Sin instancias',
        cardClass: 'border-emerald-300 bg-emerald-50/35',
      },
      {
        id: 'chats',
        label: 'Chats (24 h)',
        value: '0',
        hint: 'Esperando tráfico',
        cardClass: 'border-sky-300/90 bg-sky-50/30',
      },
      {
        id: 'sql',
        label: 'Base SQL',
        value: 'Pendiente',
        hint: 'PostgreSQL / Supabase',
        cardClass: 'border-amber-300/90 bg-amber-50/30',
      },
      {
        id: 'core',
        label: 'Search Link Core',
        value: 'Inactivo',
        hint: 'Catálogo y API',
        cardClass: 'border-teal-300/85 bg-teal-50/25',
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
    metricsAria: 'Initial system metrics',
    metrics: [
      {
        id: 'bots',
        label: 'Active bots',
        value: '0',
        hint: 'No instances',
        cardClass: 'border-emerald-300 bg-emerald-50/35',
      },
      {
        id: 'chats',
        label: 'Chats (24h)',
        value: '0',
        hint: 'Awaiting traffic',
        cardClass: 'border-sky-300/90 bg-sky-50/30',
      },
      {
        id: 'sql',
        label: 'SQL Database',
        value: 'Pending',
        hint: 'PostgreSQL / Supabase',
        cardClass: 'border-amber-300/90 bg-amber-50/30',
      },
      {
        id: 'core',
        label: 'Search Link Core',
        value: 'Inactive',
        hint: 'Catalog & API',
        cardClass: 'border-teal-300/85 bg-teal-50/25',
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
    metricsAria: 'Métricas iniciais do sistema',
    metrics: [
      {
        id: 'bots',
        label: 'Bots ativos',
        value: '0',
        hint: 'Sem instâncias',
        cardClass: 'border-emerald-300 bg-emerald-50/35',
      },
      {
        id: 'chats',
        label: 'Conversas (24 h)',
        value: '0',
        hint: 'Aguardando tráfego',
        cardClass: 'border-sky-300/90 bg-sky-50/30',
      },
      {
        id: 'sql',
        label: 'Base SQL',
        value: 'Pendente',
        hint: 'PostgreSQL / Supabase',
        cardClass: 'border-amber-300/90 bg-amber-50/30',
      },
      {
        id: 'core',
        label: 'Search Link Core',
        value: 'Inativo',
        hint: 'Catálogo e API',
        cardClass: 'border-teal-300/85 bg-teal-50/25',
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
    <div className="min-h-full bg-white text-slate-950 px-5 pt-6 pb-10">
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

      {/* Visual-only passive initial metrics with distinct colored card borders */}
      <section aria-label={copy.metricsAria} className="mt-7">
        <div className="grid grid-cols-2 gap-3">
          {copy.metrics.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border px-3.5 py-3.5 ${item.cardClass}`}
            >
              <span className="block text-[11.5px] font-medium text-slate-600 truncate">
                {item.label}
              </span>
              <span className="mt-1.5 block text-[20px] font-semibold tracking-tight text-slate-950 tabular-nums truncate">
                {item.value}
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500 truncate">
                {item.hint}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
