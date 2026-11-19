import smilingBotImg from '../assets/images/smiling_whatsapp_bot_1795059037308.jpg';
import type { SupportedLocale } from '../lib/i18n';
import type { AgencyTabId } from '../lib/agencyRoutes';

export type MobileHomeTarget = Extract<AgencyTabId, 'bots' | 'env'>;

interface AgencyMobileHomeProps {
  locale: SupportedLocale;
  onNavigate: (tab: MobileHomeTarget) => void;
}

interface MobileHomeCopy {
  illustrationAlt: string;
  headline: string;
  subcopy: string;
  primaryAction: string;
  secondaryAction: string;
}

const MOBILE_HOME_COPY: Record<SupportedLocale, MobileHomeCopy> = {
  es: {
    illustrationAlt: 'Robot asistente sonriente de WhatsApp',
    headline: 'Tu agencia de bots en WhatsApp',
    subcopy: 'Crea bots, conecta tu base SQL y responde en automático.',
    primaryAction: 'Ir a Bots',
    secondaryAction: 'Configurar .env',
  },
  en: {
    illustrationAlt: 'Smiling WhatsApp assistant robot',
    headline: 'Your WhatsApp bot agency',
    subcopy: 'Create bots, connect your SQL database, and reply automatically.',
    primaryAction: 'Open Bots',
    secondaryAction: 'Configure .env',
  },
  pt: {
    illustrationAlt: 'Robô assistente sorridente do WhatsApp',
    headline: 'Sua agência de bots no WhatsApp',
    subcopy: 'Crie bots, conecte sua base SQL e responda no automático.',
    primaryAction: 'Abrir Bots',
    secondaryAction: 'Configurar .env',
  },
};

export function AgencyMobileHome({
  locale,
  onNavigate,
}: AgencyMobileHomeProps) {
  const copy = MOBILE_HOME_COPY[locale] ?? MOBILE_HOME_COPY.es;

  return (
    <div className="min-h-full bg-[#25D366] text-slate-950 px-6 py-8 flex flex-col items-center justify-center text-center select-none">
      <div className="w-full max-w-[290px] flex flex-col items-center">
        <div className="w-36 h-36 rounded-full overflow-hidden ring-2 ring-white/40 shadow-[0_14px_30px_-8px_rgba(6,78,59,0.28)] bg-[#25D366] shrink-0">
          <img
            src={smilingBotImg}
            alt={copy.illustrationAlt}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top scale-[1.03]"
          />
        </div>

        <h2 className="mt-5 text-[22px] leading-[1.18] font-semibold tracking-[-0.02em] text-slate-950 text-balance">
          {copy.headline}
        </h2>

        <p className="mt-2 text-[13.5px] leading-[1.45] text-slate-950/80 text-balance">
          {copy.subcopy}
        </p>

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('bots')}
            className="h-9 px-5 rounded-xl bg-slate-950 active:bg-slate-800 text-white text-[12.5px] font-semibold tracking-tight shadow-[0_8px_18px_-8px_rgba(2,6,23,0.45)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
          >
            {copy.primaryAction}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('env')}
            className="py-1.5 px-3 text-[12.5px] font-medium text-slate-950/85 underline underline-offset-4 decoration-slate-950/35 active:text-slate-950 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/50 rounded"
          >
            {copy.secondaryAction}
          </button>
        </div>
      </div>
    </div>
  );
}
