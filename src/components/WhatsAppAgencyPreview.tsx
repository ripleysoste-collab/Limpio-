import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useI18n, type SupportedLocale } from '../lib/i18n';
import type { AgencyTabId } from '../lib/agencyRoutes';
import { AgencyDesktopHome } from './AgencyDesktopHome';
import { AgencyMobileHome } from './AgencyMobileHome';

interface WhatsAppAgencyPreviewProps {
  open: boolean;
  activeTab: AgencyTabId;
  onSelectTab: (tab: AgencyTabId) => void;
  onClose: () => void;
}

interface AgencyTabItem {
  id: AgencyTabId;
  label: string;
  description: string;
}

const PREVIEW_COPY: Record<
  SupportedLocale,
  {
    mobileBrandTitle: string;
    desktopBrandTitle: string;
    tabsAria: string;
    tabs: AgencyTabItem[];
  }
> = {
  es: {
    mobileBrandTitle: 'Agencia de WhatsApp',
    desktopBrandTitle: 'Agencia de automatizado WhatsApp Bot',
    tabsAria: 'Secciones de Agencia de WhatsApp',
    tabs: [
      {
        id: 'home',
        label: 'Inicio',
        description: 'Resumen general de la agencia, accesos rápidos y estado del sistema',
      },
      {
        id: 'bots',
        label: 'Bots',
        description: 'Crear clientes, encender, pausar y suspender bots',
      },
      {
        id: 'metrics',
        label: 'Métricas',
        description: 'Mensajes procesados, bots activos y rendimiento en vivo',
      },
      {
        id: 'users',
        label: 'Usuarios',
        description: 'Contactos de WhatsApp, chats y control humano',
      },
      {
        id: 'searchlink',
        label: 'Search Link',
        description: 'Activar y gestionar APIs y Endpoints de Search Link Core',
      },
      {
        id: 'superintelligence',
        label: 'Superinteligencia',
        description: 'Motor de IA, API Key, modelo y reglas de respuesta',
      },
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        description: 'Webhook de Meta Cloud API, Verify Token y credenciales',
      },
      {
        id: 'sql',
        label: 'Base SQL',
        description: 'Conexión SQL compatible (Supabase / PostgreSQL) y tablas',
      },
      {
        id: 'env',
        label: '.env',
        description: 'Variables globales del servidor, seguridad y exportación',
      },
      {
        id: 'support',
        label: 'Asistencia humana',
        description: 'Habilitar página y canales para contacto con soporte humano',
      },
      {
        id: 'landing',
        label: 'Página de inicio',
        description: 'Landing pública opcional de la agencia (desactivada por defecto)',
      },
      {
        id: 'settings',
        label: 'Configuración',
        description: 'Apariencia, modo oscuro, preferencias y textos legales',
      },
    ],
  },
  en: {
    mobileBrandTitle: 'WhatsApp Agency',
    desktopBrandTitle: 'WhatsApp Bot Automation Agency',
    tabsAria: 'WhatsApp Agency sections',
    tabs: [
      {
        id: 'home',
        label: 'Dashboard',
        description: 'Agency overview, quick shortcuts, and system status',
      },
      {
        id: 'bots',
        label: 'Bots',
        description: 'Create clients, toggle power, and suspend bots',
      },
      {
        id: 'metrics',
        label: 'Metrics',
        description: 'Processed messages, active bots, and live performance',
      },
      {
        id: 'users',
        label: 'Users',
        description: 'WhatsApp contacts, conversations, and human handoff',
      },
      {
        id: 'searchlink',
        label: 'Search Link',
        description: 'Enable and manage Search Link Core APIs and Endpoints',
      },
      {
        id: 'superintelligence',
        label: 'Superintelligence',
        description: 'AI engine, API Key, model, and response rules',
      },
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        description: 'Meta Cloud API webhook, Verify Token, and credentials',
      },
      {
        id: 'sql',
        label: 'SQL Base',
        description: 'Compatible SQL connection (Supabase / PostgreSQL) & schema',
      },
      {
        id: 'env',
        label: '.env',
        description: 'Global server variables, security keys, and export',
      },
      {
        id: 'support',
        label: 'Human Support',
        description: 'Enable a contact page and channels for human assistance',
      },
      {
        id: 'landing',
        label: 'Landing Page',
        description: 'Optional public agency homepage (disabled by default)',
      },
      {
        id: 'settings',
        label: 'Settings',
        description: 'Appearance, dark mode, preferences, and legal compliance',
      },
    ],
  },
  pt: {
    mobileBrandTitle: 'Agência de WhatsApp',
    desktopBrandTitle: 'Agência de Automação WhatsApp Bot',
    tabsAria: 'Seções da Agência de WhatsApp',
    tabs: [
      {
        id: 'home',
        label: 'Início',
        description: 'Resumo geral da agência, atalhos e status do sistema',
      },
      {
        id: 'bots',
        label: 'Bots',
        description: 'Criar clientes, ligar, pausar e suspender bots',
      },
      {
        id: 'metrics',
        label: 'Métricas',
        description: 'Mensagens processadas, bots ativos e desempenho ao vivo',
      },
      {
        id: 'users',
        label: 'Usuários',
        description: 'Contatos do WhatsApp, conversas e atendimento humano',
      },
      {
        id: 'searchlink',
        label: 'Search Link',
        description: 'Ativar e gerenciar APIs e Endpoints do Search Link Core',
      },
      {
        id: 'superintelligence',
        label: 'Superinteligência',
        description: 'Motor de IA, API Key, modelo e regras de resposta',
      },
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        description: 'Webhook da Meta Cloud API, Verify Token e credenciais',
      },
      {
        id: 'sql',
        label: 'Base SQL',
        description: 'Conexão SQL compatível (Supabase / PostgreSQL) e tabelas',
      },
      {
        id: 'env',
        label: '.env',
        description: 'Variáveis globais do servidor, segurança e exportação',
      },
      {
        id: 'support',
        label: 'Suporte humano',
        description: 'Habilitar página e canais de contato para atendimento humano',
      },
      {
        id: 'landing',
        label: 'Página inicial',
        description: 'Landing page pública opcional da agência (desativada por padrão)',
      },
      {
        id: 'settings',
        label: 'Configurações',
        description: 'Aparência, modo escuro, preferências e termos legais',
      },
    ],
  },
};

export function WhatsAppAgencyPreview({
  open,
  activeTab,
  onSelectTab,
  onClose,
}: WhatsAppAgencyPreviewProps) {
  const { t, locale } = useI18n();
  const mobileNavRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !mobileNavRef.current) return;
    const activeButton = mobileNavRef.current.querySelector<HTMLButtonElement>(
      `[data-tab-id="${activeTab}"]`
    );
    activeButton?.scrollIntoView({
      behavior: 'auto',
      inline: 'nearest',
      block: 'nearest',
    });
  }, [activeTab, open]);

  if (!open) return null;

  const copy = PREVIEW_COPY[locale] ?? PREVIEW_COPY.es;
  const currentTab =
    copy.tabs.find((item) => item.id === activeTab) ?? copy.tabs[0];

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={t.sourceCode.previewAria}
      className="fixed inset-0 z-50 w-full h-dvh bg-white text-slate-950 flex flex-col overflow-hidden"
    >
      {/* Desktop shell: 10% left sidebar with brand and stacked menu + 90% main workspace on the right */}
      <div className="hidden lg:flex w-full h-full bg-white">
        <aside
          aria-label={copy.tabsAria}
          className="w-[10%] min-w-[162px] shrink-0 h-full border-r border-slate-200/90 bg-white flex flex-col overflow-hidden"
        >
          <div className="px-3 pt-4 pb-3.5 border-b border-slate-200/80 shrink-0 flex items-start gap-2 min-w-0">
            <div
              aria-hidden="true"
              className="w-6 h-6 rounded-md bg-[#25D366]/12 flex items-center justify-center shrink-0 mt-0.5"
            >
              <WhatsAppBrandIcon className="w-3.5 h-3.5" />
            </div>

            <span className="text-[11.5px] font-semibold leading-[1.25] text-slate-950 tracking-tight break-words min-w-0">
              {copy.desktopBrandTitle}
            </span>
          </div>

          <nav
            aria-label={copy.tabsAria}
            className="flex-1 min-h-0 overflow-y-auto px-2 pt-3 pb-6 flex flex-col gap-0.5"
          >
            {copy.tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={`desk-${tab.id}`}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`w-full py-1.5 pl-2.5 pr-1.5 text-left text-[12.5px] leading-snug border-l-2 truncate cursor-pointer focus-visible:outline-none ${
                    isActive
                      ? 'border-slate-950 text-slate-950 font-semibold'
                      : 'border-transparent text-slate-500 font-medium hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main
          className={`relative flex-1 min-w-0 h-full ${
            activeTab === 'home'
              ? 'overflow-hidden bg-[#1E293B]'
              : 'overflow-y-auto bg-white px-8 pt-7 pb-10'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={t.sourceCode.closePreviewAria}
            title={t.sourceCode.closePreviewAria}
            className={`absolute top-4 right-5 z-20 w-9 h-9 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 cursor-pointer ${
              activeTab === 'home'
                ? 'text-white/80 hover:text-white hover:bg-white/12 focus-visible:ring-white/50'
                : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100 focus-visible:ring-slate-400'
            }`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          {activeTab === 'home' ? (
            <AgencyDesktopHome locale={locale} onNavigate={onSelectTab} />
          ) : (
            <div className="max-w-4xl pr-12">
              <h1 className="text-[18px] font-semibold text-slate-950 tracking-tight">
                {currentTab.label}
              </h1>
              <p className="mt-1 text-[13px] text-slate-500">
                {currentTab.description}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile shell: pure white agency layout with swipeable single-purpose tabs */}
      <div className="lg:hidden relative w-full h-full flex flex-col bg-white">
        <header className="shrink-0 h-14 px-4 bg-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              aria-hidden="true"
              className="w-7 h-7 rounded-lg bg-[#25D366]/12 flex items-center justify-center shrink-0"
            >
              <WhatsAppBrandIcon className="w-4 h-4" />
            </div>

            <span className="text-[14.5px] font-semibold text-slate-950 tracking-tight truncate">
              {copy.mobileBrandTitle}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.sourceCode.closePreviewAria}
            title={t.sourceCode.closePreviewAria}
            className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-950 active:bg-slate-100 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        <nav
          ref={mobileNavRef}
          aria-label={copy.tabsAria}
          className="shrink-0 border-b border-slate-200/85 bg-white px-4 flex items-center gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {copy.tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={`mob-${tab.id}`}
                data-tab-id={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`py-3 text-[13px] whitespace-nowrap shrink-0 border-b-2 -mb-px cursor-pointer focus-visible:outline-none ${
                  isActive
                    ? 'border-slate-950 text-slate-950 font-semibold'
                    : 'border-transparent text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-h-0 overflow-y-auto bg-white">
          {activeTab === 'home' ? (
            <AgencyMobileHome locale={locale} onNavigate={onSelectTab} />
          ) : (
            <div className="px-4 pt-5">
              <h2 className="text-[15px] font-semibold text-slate-950 tracking-tight">
                {currentTab.label}
              </h2>
              <p className="mt-1 text-[12px] text-slate-500">
                {currentTab.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function WhatsAppBrandIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3.25C7.17 3.25 3.25 7.17 3.25 12C3.25 13.71 3.74 15.3 4.59 16.65L3.55 20.45L7.46 19.43C8.76 20.19 10.33 20.65 12 20.65C16.83 20.65 20.75 16.83 20.75 12C20.75 7.17 16.83 3.25 12 3.25Z"
        fill="#25D366"
      />
      <path
        d="M9.68 8.95C9.49 8.53 9.29 8.52 9.11 8.51H8.62C8.45 8.51 8.18 8.58 7.95 8.83C7.72 9.08 7.07 9.69 7.07 10.92C7.07 12.15 7.97 13.34 8.09 13.5C8.22 13.67 9.83 16.28 12.39 17.29C14.51 18.12 14.95 17.96 15.41 17.92C15.87 17.87 16.89 17.31 17.1 16.73C17.31 16.14 17.31 15.64 17.24 15.53C17.18 15.43 17.01 15.36 16.76 15.24C16.51 15.11 15.29 14.51 15.06 14.43C14.83 14.35 14.66 14.3 14.49 14.55C14.33 14.8 13.85 15.36 13.7 15.53C13.56 15.7 13.41 15.72 13.16 15.59C12.91 15.47 12.11 15.2 11.16 14.36C10.42 13.7 9.93 12.89 9.78 12.64C9.64 12.39 9.76 12.25 9.89 12.13C10 12.02 10.14 11.84 10.26 11.69C10.39 11.55 10.43 11.44 10.51 11.28C10.59 11.11 10.55 10.96 10.49 10.84C10.43 10.71 9.93 9.48 9.68 8.95Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
