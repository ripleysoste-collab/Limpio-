import { useState } from 'react';
import { ChevronRight, Layers } from 'lucide-react';
import type { SupportedLocale } from '../lib/i18n';

export type MobileHomeTarget =
  | 'bots'
  | 'metrics'
  | 'sql'
  | 'searchlink'
  | 'env'
  | 'whatsapp'
  | 'superintelligence';

type MobileHomeVariant = 'minimal' | 'checklist';

interface AgencyMobileHomeProps {
  locale: SupportedLocale;
  onNavigate: (tab: MobileHomeTarget) => void;
}

interface PassiveMetricItem {
  label: string;
  value: string;
  hint: string;
  target: MobileHomeTarget;
}

interface SetupStepItem {
  title: string;
  status: string;
  target: MobileHomeTarget;
}

interface MobileHomeCopy {
  kicker: string;
  headline: string;
  subcopy: string;
  primaryAction: string;
  secondaryAction: string;
  metricsAria: string;
  setupTitle: string;
  setupAria: string;
  optionMinimalLabel: string;
  optionChecklistLabel: string;
  switchOptionAria: string;
  metrics: PassiveMetricItem[];
  setupSteps: SetupStepItem[];
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
    setupTitle: 'Preparación inicial',
    setupAria: 'Pasos iniciales de configuración',
    optionMinimalLabel: 'Opción A · Minimal',
    optionChecklistLabel: 'Opción B · Con lista',
    switchOptionAria: 'Cambiar diseño de inicio móvil',
    metrics: [
      {
        label: 'Bots activos',
        value: '0',
        hint: 'Sin instancias',
        target: 'bots',
      },
      {
        label: 'Chats (24 h)',
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
        hint: 'Catálogo y API',
        target: 'searchlink',
      },
    ],
    setupSteps: [
      {
        title: '1. Conectar Base SQL',
        status: 'Pendiente',
        target: 'sql',
      },
      {
        title: '2. Credenciales WhatsApp Cloud',
        status: 'Sin conectar',
        target: 'whatsapp',
      },
      {
        title: '3. API de Superinteligencia',
        status: 'Sin configurar',
        target: 'superintelligence',
      },
      {
        title: '4. Activar Search Link Core',
        status: 'Inactivo',
        target: 'searchlink',
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
    setupTitle: 'Initial setup',
    setupAria: 'Initial configuration steps',
    optionMinimalLabel: 'Option A · Minimal',
    optionChecklistLabel: 'Option B · Checklist',
    switchOptionAria: 'Switch mobile home layout option',
    metrics: [
      {
        label: 'Active bots',
        value: '0',
        hint: 'No instances',
        target: 'bots',
      },
      {
        label: 'Chats (24h)',
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
        hint: 'Catalog & API',
        target: 'searchlink',
      },
    ],
    setupSteps: [
      {
        title: '1. Connect SQL Database',
        status: 'Pending',
        target: 'sql',
      },
      {
        title: '2. WhatsApp Cloud credentials',
        status: 'Disconnected',
        target: 'whatsapp',
      },
      {
        title: '3. Superintelligence API',
        status: 'Not configured',
        target: 'superintelligence',
      },
      {
        title: '4. Enable Search Link Core',
        status: 'Inactive',
        target: 'searchlink',
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
    setupTitle: 'Preparação inicial',
    setupAria: 'Passos iniciais de configuração',
    optionMinimalLabel: 'Opção A · Minimal',
    optionChecklistLabel: 'Opção B · Com lista',
    switchOptionAria: 'Alternar layout inicial no celular',
    metrics: [
      {
        label: 'Bots ativos',
        value: '0',
        hint: 'Sem instâncias',
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
        hint: 'Catálogo e API',
        target: 'searchlink',
      },
    ],
    setupSteps: [
      {
        title: '1. Conectar Base SQL',
        status: 'Pendente',
        target: 'sql',
      },
      {
        title: '2. Credenciais WhatsApp Cloud',
        status: 'Desconectado',
        target: 'whatsapp',
      },
      {
        title: '3. API de Superinteligência',
        status: 'Sem configurar',
        target: 'superintelligence',
      },
      {
        title: '4. Ativar Search Link Core',
        status: 'Inativo',
        target: 'searchlink',
      },
    ],
  },
};

export function AgencyMobileHome({
  locale,
  onNavigate,
}: AgencyMobileHomeProps) {
  const [variant, setVariant] = useState<MobileHomeVariant>('minimal');
  const copy = MOBILE_HOME_COPY[locale] ?? MOBILE_HOME_COPY.es;

  const isChecklist = variant === 'checklist';

  return (
    <div className="relative min-h-full bg-white text-slate-950 px-5 pt-6 pb-24">
      <p className="text-[12px] font-medium text-slate-500 tracking-tight">
        {copy.kicker}
      </p>

      <h2 className="mt-2 text-[24px] leading-[1.18] font-semibold tracking-[-0.02em] text-slate-950 text-balance">
        {copy.headline}
      </h2>

      {!isChecklist && (
        <p className="mt-3 text-[13.5px] leading-[1.6] text-slate-600">
          {copy.subcopy}
        </p>
      )}

      <div className={`${isChecklist ? 'mt-5' : 'mt-6'} flex items-center gap-4`}>
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

      {/* Passive 2x2 operational summary separated strictly by hairline borders */}
      <section
        aria-label={copy.metricsAria}
        className={`${isChecklist ? 'mt-6' : 'mt-8'} border-t border-b border-slate-200/90`}
      >
        <div className="grid grid-cols-2">
          {copy.metrics.map((item, index) => {
            const isRightCol = index % 2 === 1;
            const isSecondRow = index >= 2;
            return (
              <button
                key={item.target}
                type="button"
                onClick={() => onNavigate(item.target)}
                className={`min-h-[82px] py-4 text-left flex flex-col justify-center cursor-pointer active:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 ${
                  isRightCol ? 'pl-4 border-l border-slate-200/90' : 'pr-4'
                } ${isSecondRow ? 'border-t border-slate-200/90' : ''}`}
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
            );
          })}
        </div>
      </section>

      {/* Option B only: clean tactile checklist for initial agency setup */}
      {isChecklist && (
        <section aria-label={copy.setupAria} className="mt-6">
          <h3 className="text-[12.5px] font-semibold text-slate-950 tracking-tight mb-2">
            {copy.setupTitle}
          </h3>

          <div className="border-t border-slate-200/80">
            {copy.setupSteps.map((step) => (
              <button
                key={step.target}
                type="button"
                onClick={() => onNavigate(step.target)}
                className="w-full min-h-[54px] py-3 border-b border-slate-200/80 flex items-center justify-between gap-3 text-left cursor-pointer active:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <div className="min-w-0">
                  <span className="block text-[13.5px] font-medium text-slate-900 truncate">
                    {step.title}
                  </span>
                  <span className="block text-[12px] text-slate-500 mt-0.5 truncate">
                    {step.status}
                  </span>
                </div>

                <ChevronRight
                  className="w-4 h-4 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Temporary layout comparison toggle between Option A and Option B */}
      <button
        type="button"
        onClick={() =>
          setVariant((current) =>
            current === 'minimal' ? 'checklist' : 'minimal'
          )
        }
        aria-label={copy.switchOptionAria}
        className="fixed bottom-5 right-4 z-30 lg:hidden min-h-[44px] px-4 rounded-full bg-slate-950 text-white shadow-sm flex items-center gap-2 text-[12px] font-medium cursor-pointer active:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <Layers className="w-3.5 h-3.5 text-[#86EFAC]" aria-hidden="true" />
        <span>
          {isChecklist ? copy.optionChecklistLabel : copy.optionMinimalLabel}
        </span>
      </button>
    </div>
  );
}
