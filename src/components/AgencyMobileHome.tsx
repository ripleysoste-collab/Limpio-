import smilingBotImg from '../assets/images/smiling_whatsapp_bot_1795059037308.jpg';
import type { SupportedLocale } from '../lib/i18n';

interface AgencyMobileHomeProps {
  locale: SupportedLocale;
}

interface MobileHomeCopy {
  illustrationAlt: string;
  headline: string;
  subcopy: string;
}

const MOBILE_HOME_COPY: Record<SupportedLocale, MobileHomeCopy> = {
  es: {
    illustrationAlt: 'Robot asistente sonriente de WhatsApp',
    headline: 'Tu agencia de bots en WhatsApp',
    subcopy: 'Crea bots, conecta tu base SQL y responde en automático.',
  },
  en: {
    illustrationAlt: 'Smiling WhatsApp assistant robot',
    headline: 'Your WhatsApp bot agency',
    subcopy: 'Create bots, connect your SQL database, and reply automatically.',
  },
  pt: {
    illustrationAlt: 'Robô assistente sorridente do WhatsApp',
    headline: 'Sua agência de bots no WhatsApp',
    subcopy: 'Crie bots, conecte sua base SQL e responda no automático.',
  },
};

export function AgencyMobileHome({ locale }: AgencyMobileHomeProps) {
  const copy = MOBILE_HOME_COPY[locale] ?? MOBILE_HOME_COPY.es;

  return (
    <div className="min-h-full bg-[#25D366] text-slate-950 px-6 py-10 flex flex-col items-center justify-center text-center select-none">
      <div className="w-full max-w-[290px] flex flex-col items-center">
        <div className="w-40 h-40 rounded-full overflow-hidden ring-2 ring-white/40 shadow-[0_14px_30px_-8px_rgba(6,78,59,0.28)] bg-[#25D366] shrink-0">
          <img
            src={smilingBotImg}
            alt={copy.illustrationAlt}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top scale-[1.03]"
          />
        </div>

        <h2 className="mt-6 text-[22px] leading-[1.18] font-semibold tracking-[-0.02em] text-slate-950 text-balance">
          {copy.headline}
        </h2>

        <p className="mt-2.5 text-[14px] leading-[1.5] text-slate-950/80 text-balance">
          {copy.subcopy}
        </p>
      </div>
    </div>
  );
}
