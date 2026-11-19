import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Check,
  Clock,
  Eye,
  Menu,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  BOT_COLUMN_ORDER,
  BOT_STATUS_STYLE,
  getBotMissingModules,
  getBotsForClient,
  getVisibleAgencyBots,
  isBotSetupComplete,
  searchAgencyClientsForBot,
  validateBotPhoneField,
  type AgencyBotRecord,
  type BotOperationalStatus,
} from '../lib/agencyBots';
import {
  CLIENT_STATUS_STYLE,
  getVisibleAgencyClients,
  type AgencyClientRecord,
} from '../lib/agencyClients';
import { TOP_50_COMMERCIAL_COUNTRIES } from '../lib/agencyCountries';
import type { ValidationTone } from '../lib/agencyValidation';
import type { SupportedLocale } from '../lib/i18n';

interface AgencyMobileBotsProps {
  locale: SupportedLocale;
  clients?: AgencyClientRecord[];
  dismissedExampleClientIds?: string[];
  bots?: AgencyBotRecord[];
  dismissedExampleBotIds?: string[];
  nowMs?: number;
  onRegisterBot?: (bot: AgencyBotRecord) => void;
  onUpdateBotStatus?: (botId: string, nextStatus: BotOperationalStatus) => void;
  onDeleteBot?: (bot: AgencyBotRecord) => void;
}

interface MobileBotsCopy {
  registerTitle: string;
  openStatusMenuAria: string;
  statusMenuAria: string;
  backToRegisterLabel: string;
  clientSearchPlaceholder: string;
  clientSearchAria: string;
  clearSearchAria: string;
  deselectClientAria: string;
  viewClientBotsAria: (name: string) => string;
  closeClientBotsAria: string;
  noClientMatch: string;
  clientBlockedNotice: string;
  botPhoneLabel: string;
  defaultBotPhonePlaceholder: string;
  registerSubmit: string;
  clientBotsEmpty: string;
  unnamedBusiness: string;
  missingPrefix: string;
  readyConfiguration: string;
  emptyStatusList: string;
  rowActionsAria: (label: string) => string;
  pauseAction: string;
  activateAction: string;
  suspendAction: string;
  deleteAction: string;
  deleteConfirmTitle: string;
  deleteConfirmBody: (botLabel: string, clientName: string) => string;
  cancelAction: string;
  confirmDeleteAction: string;
}

const MOBILE_BOTS_COPY: Record<SupportedLocale, MobileBotsCopy> = {
  es: {
    registerTitle: 'Registrar bots',
    openStatusMenuAria: 'Ver estados de bots',
    statusMenuAria: 'Estados de bots',
    backToRegisterLabel: 'Registrar bots',
    clientSearchPlaceholder: 'Nombre, correo o teléfono...',
    clientSearchAria: 'Buscar cliente por nombre, correo o teléfono',
    clearSearchAria: 'Limpiar búsqueda',
    deselectClientAria: 'Cambiar cliente seleccionado',
    viewClientBotsAria: (name) => `Ver bots de ${name}`,
    closeClientBotsAria: 'Cerrar bots del cliente',
    noClientMatch: 'No encontrado en Clientes.',
    clientBlockedNotice:
      'Cliente no activo. Reactívalo en Clientes para asignar un bot.',
    botPhoneLabel: 'Número del bot',
    defaultBotPhonePlaceholder: '+57 300 412 8890',
    registerSubmit: 'Registrar',
    clientBotsEmpty: 'Este cliente no tiene bots registrados.',
    unnamedBusiness: 'Negocio pendiente',
    missingPrefix: 'Falta',
    readyConfiguration: 'Configuración completa',
    emptyStatusList: 'Sin bots.',
    rowActionsAria: (label) => `Acciones para ${label}`,
    pauseAction: 'Pausar bot',
    activateAction: 'Activar bot',
    suspendAction: 'Suspender bot',
    deleteAction: 'Eliminar bot',
    deleteConfirmTitle: 'Eliminar bot específico',
    deleteConfirmBody: (botLabel, clientName) =>
      `Se eliminará el bot ${botLabel} de ${clientName} junto con su negocio, entrenamiento y línea asociada. El cliente y sus demás bots permanecen intactos.`,
    cancelAction: 'Cancelar',
    confirmDeleteAction: 'Aceptar',
  },
  en: {
    registerTitle: 'Register bots',
    openStatusMenuAria: 'View bot statuses',
    statusMenuAria: 'Bot statuses',
    backToRegisterLabel: 'Register bots',
    clientSearchPlaceholder: 'Name, email, or phone...',
    clientSearchAria: 'Search client by name, email, or phone',
    clearSearchAria: 'Clear search',
    deselectClientAria: 'Change selected client',
    viewClientBotsAria: (name) => `View bots for ${name}`,
    closeClientBotsAria: 'Close client bots',
    noClientMatch: 'Not found in Clients.',
    clientBlockedNotice:
      'Client is inactive. Reactivate them in Clients to assign a bot.',
    botPhoneLabel: 'Bot number',
    defaultBotPhonePlaceholder: '+1 305 555 0199',
    registerSubmit: 'Register',
    clientBotsEmpty: 'This client has no registered bots.',
    unnamedBusiness: 'Pending business',
    missingPrefix: 'Missing',
    readyConfiguration: 'Complete setup',
    emptyStatusList: 'No bots.',
    rowActionsAria: (label) => `Actions for ${label}`,
    pauseAction: 'Pause bot',
    activateAction: 'Activate bot',
    suspendAction: 'Suspend bot',
    deleteAction: 'Delete bot',
    deleteConfirmTitle: 'Delete specific bot',
    deleteConfirmBody: (botLabel, clientName) =>
      `This will delete bot ${botLabel} for ${clientName} along with its business profile, training, and line configuration. The client and their other bots stay untouched.`,
    cancelAction: 'Cancel',
    confirmDeleteAction: 'Accept',
  },
  pt: {
    registerTitle: 'Registrar bots',
    openStatusMenuAria: 'Ver status dos bots',
    statusMenuAria: 'Status dos bots',
    backToRegisterLabel: 'Registrar bots',
    clientSearchPlaceholder: 'Nome, e-mail ou telefone...',
    clientSearchAria: 'Buscar cliente por nome, e-mail ou telefone',
    clearSearchAria: 'Limpar busca',
    deselectClientAria: 'Alterar cliente selecionado',
    viewClientBotsAria: (name) => `Ver bots de ${name}`,
    closeClientBotsAria: 'Fechar bots do cliente',
    noClientMatch: 'Não encontrado em Clientes.',
    clientBlockedNotice:
      'Cliente inativo. Reative em Clientes para atribuir um bot.',
    botPhoneLabel: 'Número do bot',
    defaultBotPhonePlaceholder: '+55 11 98765 4321',
    registerSubmit: 'Registrar',
    clientBotsEmpty: 'Este cliente não tem bots cadastrados.',
    unnamedBusiness: 'Negócio pendente',
    missingPrefix: 'Falta',
    readyConfiguration: 'Configuração completa',
    emptyStatusList: 'Sem bots.',
    rowActionsAria: (label) => `Ações para ${label}`,
    pauseAction: 'Pausar bot',
    activateAction: 'Ativar bot',
    suspendAction: 'Suspender bot',
    deleteAction: 'Excluir bot',
    deleteConfirmTitle: 'Excluir bot específico',
    deleteConfirmBody: (botLabel, clientName) =>
      `O bot ${botLabel} de ${clientName} será excluído junto com seu negócio, treinamento e linha associada. O cliente e os outros bots permanecem intactos.`,
    cancelAction: 'Cancelar',
    confirmDeleteAction: 'Aceitar',
  },
};

const BASE_SURFACE_CLASS =
  'bg-white shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150';

function getToneBorderClass(tone: ValidationTone): string {
  if (tone === 'blue') {
    return 'border-blue-300/90 focus-within:border-blue-500 focus-within:shadow-[0_6px_20px_-6px_rgba(37,99,235,0.16)]';
  }
  if (tone === 'red') {
    return 'border-rose-300/90 focus-within:border-rose-500 focus-within:shadow-[0_6px_20px_-6px_rgba(225,29,72,0.16)]';
  }
  return 'border-slate-200/90 focus-within:border-slate-400 focus-within:shadow-[0_6px_20px_-6px_rgba(15,23,42,0.13)]';
}

function getToneTextClass(tone: ValidationTone): string {
  if (tone === 'blue') return 'text-blue-600 font-medium';
  if (tone === 'red') return 'text-rose-600 font-medium';
  return 'text-slate-900';
}

export function AgencyMobileBots({
  locale,
  clients = [],
  dismissedExampleClientIds = [],
  bots = [],
  dismissedExampleBotIds = [],
  nowMs,
  onRegisterBot,
  onUpdateBotStatus,
  onDeleteBot,
}: AgencyMobileBotsProps) {
  const [activeStatusView, setActiveStatusView] =
    useState<BotOperationalStatus | null>(null);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isClientBotsModalOpen, setIsClientBotsModalOpen] = useState(false);
  const [botPhone, setBotPhone] = useState('');
  const [botPhoneBlurred, setBotPhoneBlurred] = useState(false);

  const [openMenuBotId, setOpenMenuBotId] = useState<string | null>(null);
  const [deleteConfirmBot, setDeleteConfirmBot] =
    useState<AgencyBotRecord | null>(null);

  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const rowMenusContainerRef = useRef<HTMLDivElement | null>(null);

  const copy = MOBILE_BOTS_COPY[locale] ?? MOBILE_BOTS_COPY.es;

  const visibleClients = useMemo(
    () =>
      getVisibleAgencyClients(clients, nowMs, dismissedExampleClientIds),
    [clients, nowMs, dismissedExampleClientIds],
  );

  const visibleBots = useMemo(
    () =>
      getVisibleAgencyBots(
        bots,
        visibleClients,
        nowMs,
        dismissedExampleBotIds,
      ),
    [bots, visibleClients, nowMs, dismissedExampleBotIds],
  );

  const matchingClients = useMemo(
    () => searchAgencyClientsForBot(visibleClients, searchQuery),
    [visibleClients, searchQuery],
  );

  const selectedClient = useMemo(
    () =>
      selectedClientId
        ? visibleClients.find((c) => c.id === selectedClientId) ?? null
        : null,
    [selectedClientId, visibleClients],
  );

  const hasSearchQuery = searchQuery.trim().length > 0;

  const selectedClientBots = useMemo(
    () => getBotsForClient(visibleBots, selectedClient),
    [visibleBots, selectedClient],
  );

  const preferredCountry = useMemo(() => {
    if (!selectedClient?.countryCode) return null;
    return (
      TOP_50_COMMERCIAL_COUNTRIES.find(
        (c) => c.code === selectedClient.countryCode,
      ) ?? null
    );
  }, [selectedClient]);

  const botPhonePlaceholder = preferredCountry
    ? `+${preferredCountry.dialCode} ${preferredCountry.exampleNational}`
    : copy.defaultBotPhonePlaceholder;

  const botPhoneValidation = useMemo(
    () =>
      validateBotPhoneField(
        botPhone,
        preferredCountry,
        botPhoneBlurred,
        bots,
        clients,
      ),
    [botPhone, preferredCountry, botPhoneBlurred, bots, clients],
  );

  const isClientEligibleForBot =
    selectedClient !== null && selectedClient.status === 'active';
  const canRegisterBot =
    isClientEligibleForBot && botPhoneValidation.isValid;

  const botsByStatus = useMemo(() => {
    const grouped: Record<BotOperationalStatus, AgencyBotRecord[]> = {
      active: [],
      incomplete: [],
      paused: [],
      suspended: [],
      expired: [],
    };
    for (const bot of visibleBots) {
      grouped[bot.status].push(bot);
    }
    return grouped;
  }, [visibleBots]);

  useEffect(() => {
    if (!isStatusMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node)
      ) {
        setIsStatusMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsStatusMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isStatusMenuOpen]);

  useEffect(() => {
    if (!openMenuBotId) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        rowMenusContainerRef.current &&
        !rowMenusContainerRef.current.contains(event.target as Node)
      ) {
        setOpenMenuBotId(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuBotId(null);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [openMenuBotId]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (selectedClientId) {
      setSelectedClientId(null);
      setIsClientBotsModalOpen(false);
      setBotPhone('');
      setBotPhoneBlurred(false);
    }
  };

  const handleSelectClient = (client: AgencyClientRecord) => {
    setSelectedClientId(client.id);
    setSearchQuery(client.fullName);
    setBotPhone('');
    setBotPhoneBlurred(false);
  };

  const handleDeselectClient = () => {
    setSelectedClientId(null);
    setIsClientBotsModalOpen(false);
    setSearchQuery('');
    setBotPhone('');
    setBotPhoneBlurred(false);
  };

  const handleRegisterSubmit = (event: FormEvent) => {
    event.preventDefault();
    setBotPhoneBlurred(true);
    if (!canRegisterBot || !selectedClient) return;

    const newBot: AgencyBotRecord = {
      id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      clientId: selectedClient.id,
      clientName: selectedClient.fullName,
      clientEmail: selectedClient.email,
      clientPhone: selectedClient.phone,
      botPhone: botPhone.trim(),
      status: 'incomplete',
      hasBusinessProfile: false,
      hasTraining: false,
      hasWhatsAppConnection: false,
      createdAt: new Date().toISOString().slice(0, 16),
    };

    onRegisterBot?.(newBot);
    setBotPhone('');
    setBotPhoneBlurred(false);
  };

  const activeStatusMeta = activeStatusView
    ? BOT_STATUS_STYLE[activeStatusView]
    : null;
  const currentListBots = activeStatusView
    ? botsByStatus[activeStatusView]
    : [];

  return (
    <div className="relative min-h-full bg-white text-slate-950 px-4 pt-4 pb-10 flex flex-col">
      {/* Top header with title on the left and compact 3-line status menu icon on top-right */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2.5">
          {activeStatusMeta && (
            <span
              aria-hidden="true"
              className={`w-3.5 h-3.5 rounded-[4px] shrink-0 ${activeStatusMeta.squareClass}`}
            />
          )}
          <h2 className="text-[18px] font-semibold text-slate-950 tracking-tight truncate">
            {activeStatusMeta
              ? activeStatusMeta.columnTitles[locale] ??
                activeStatusMeta.columnTitles.es
              : copy.registerTitle}
          </h2>
        </div>

        <div ref={statusMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsStatusMenuOpen((prev) => !prev)}
            aria-label={copy.openStatusMenuAria}
            aria-expanded={isStatusMenuOpen}
            className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-950 active:bg-slate-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <Menu className="w-[18px] h-[18px]" aria-hidden="true" />
          </button>

          {isStatusMenuOpen && (
            <div
              role="menu"
              aria-label={copy.statusMenuAria}
              className="absolute right-0 top-10 z-40 w-[196px] rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-[0_16px_36px_-10px_rgba(15,23,42,0.22)] flex flex-col gap-0.5"
            >
              {activeStatusView !== null && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActiveStatusView(null);
                    setIsStatusMenuOpen(false);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-[12.5px] font-medium text-blue-600 hover:bg-blue-50/70 flex items-center gap-2.5 cursor-pointer"
                >
                  <Search
                    className="w-3.5 h-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">{copy.backToRegisterLabel}</span>
                </button>
              )}

              {BOT_COLUMN_ORDER.map((statusKey) => {
                const statusMeta = BOT_STATUS_STYLE[statusKey];
                const label =
                  statusMeta.columnTitles[locale] ??
                  statusMeta.columnTitles.es;
                const count = botsByStatus[statusKey].length;
                const isSelected = activeStatusView === statusKey;

                return (
                  <button
                    key={statusKey}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveStatusView(statusKey);
                      setIsStatusMenuOpen(false);
                      setOpenMenuBotId(null);
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-left text-[12.5px] flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-100 text-slate-950 font-semibold'
                        : 'text-slate-700 font-medium hover:bg-slate-50'
                    }`}
                  >
                    <span className="min-w-0 flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className={`w-3 h-3 rounded-[3.5px] shrink-0 ${statusMeta.squareClass}`}
                      />
                      <span className="truncate">{label}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Mobile Content */}
      {activeStatusView === null ? (
        <form
          onSubmit={handleRegisterSubmit}
          className="mt-4 flex flex-col gap-4"
          noValidate
        >
          {/* Minimal client search input */}
          <div
            className={`group flex items-center gap-2.5 h-11 px-4 rounded-full border ${BASE_SURFACE_CLASS} border-slate-200/90 focus-within:border-slate-400 focus-within:shadow-[0_6px_20px_-6px_rgba(15,23,42,0.13)]`}
          >
            <Search
              className="w-4 h-4 text-slate-400 group-focus-within:text-slate-700 transition-colors shrink-0"
              aria-hidden="true"
            />
            <input
              id="mobile-bot-client-search"
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={copy.clientSearchPlaceholder}
              aria-label={copy.clientSearchAria}
              className="flex-1 min-w-0 bg-transparent text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={handleDeselectClient}
                aria-label={copy.clearSearchAria}
                className="w-6 h-6 -mr-1.5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 active:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Search matches shown until user taps a specific client */}
          {!selectedClient && hasSearchQuery && (
            matchingClients.length > 0 ? (
              <div className="rounded-2xl border border-slate-200/85 bg-white divide-y divide-slate-100 max-h-60 overflow-y-auto shadow-[0_4px_14px_-6px_rgba(15,23,42,0.08)]">
                {matchingClients.map((client) => {
                  const clientStatus = CLIENT_STATUS_STYLE[client.status];
                  const statusLabel =
                    clientStatus.labels[locale] ?? clientStatus.labels.es;

                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2.5 hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-medium text-slate-950 truncate">
                          {client.fullName}
                        </p>
                        <p className="text-[11.5px] text-slate-500 truncate">
                          {client.email} · {client.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          aria-hidden="true"
                          className={`w-2.5 h-2.5 rounded-[3px] ${clientStatus.squareClass}`}
                        />
                        <span className="text-[11.5px] text-slate-600 whitespace-nowrap">
                          {statusLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-1 text-[12.5px] text-rose-600">
                {copy.noClientMatch}
              </p>
            )
          )}

          {/* Selected client row + eye button + bot number input */}
          {selectedClient && (
            <>
              <div className="rounded-2xl border border-slate-200/85 bg-slate-50/60 px-3.5 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`w-2.5 h-2.5 rounded-[3px] shrink-0 ${CLIENT_STATUS_STYLE[selectedClient.status].squareClass}`}
                    />
                    <p className="text-[13.5px] font-semibold text-slate-950 truncate">
                      {selectedClient.fullName}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[12px] text-slate-500 truncate">
                    {selectedClient.email} · {selectedClient.phone}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsClientBotsModalOpen(true)}
                    aria-label={copy.viewClientBotsAria(
                      selectedClient.fullName,
                    )}
                    title={copy.viewClientBotsAria(selectedClient.fullName)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-950 hover:bg-white active:bg-slate-100 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectClient}
                    aria-label={copy.deselectClientAria}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white active:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {selectedClient.status !== 'active' ? (
                <p className="px-1 text-[12.5px] text-rose-600 leading-snug">
                  {copy.clientBlockedNotice}
                </p>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="mobile-bot-whatsapp-phone"
                      className="block text-[12.5px] font-medium text-slate-700 mb-1.5 pl-1"
                    >
                      {copy.botPhoneLabel}
                    </label>
                    <div
                      className={`flex items-center h-10 px-4 rounded-full border ${BASE_SURFACE_CLASS} ${getToneBorderClass(botPhoneValidation.tone)}`}
                    >
                      <input
                        id="mobile-bot-whatsapp-phone"
                        type="tel"
                        inputMode="tel"
                        value={botPhone}
                        onChange={(e) => {
                          setBotPhone(e.target.value);
                          if (botPhoneBlurred) setBotPhoneBlurred(false);
                        }}
                        onBlur={() => setBotPhoneBlurred(true)}
                        placeholder={botPhonePlaceholder}
                        autoFocus
                        className={`flex-1 min-w-0 bg-transparent text-[13.5px] placeholder:text-slate-400 focus:outline-none tabular-nums ${getToneTextClass(botPhoneValidation.tone)}`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!canRegisterBot}
                    className={`h-11 rounded-full text-[13.5px] font-semibold transition-all duration-150 ${
                      canRegisterBot
                        ? 'bg-slate-950 text-white shadow-[0_8px_20px_-8px_rgba(15,23,42,0.5)] active:scale-[0.99] cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {copy.registerSubmit}
                  </button>
                </>
              )}
            </>
          )}
        </form>
      ) : (
        /* Filtered status list opened from top-right 3-line menu */
        <section
          ref={rowMenusContainerRef}
          className="mt-4 -mx-4 flex-1 flex flex-col"
        >
          {currentListBots.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[13px] text-slate-400">
                {copy.emptyStatusList}
              </p>
            </div>
          ) : (
            <ul className="border-t border-b border-slate-200/85 divide-y divide-slate-200/85">
              {currentListBots.map((bot, index) => {
                const statusMeta = BOT_STATUS_STYLE[bot.status];
                const primaryLabel = bot.businessName || bot.botPhone;
                const missing = getBotMissingModules(bot, locale);
                const isMenuOpen = openMenuBotId === bot.id;
                const openUpward =
                  currentListBots.length >= 3 &&
                  index >= currentListBots.length - 2;
                const canActivate =
                  isBotSetupComplete(bot) &&
                  bot.status !== 'expired' &&
                  bot.status !== 'suspended';

                return (
                  <li
                    key={bot.id}
                    className={`relative px-4 py-3 bg-white flex items-center justify-between gap-3 ${
                      isMenuOpen ? 'z-30' : 'z-0'
                    }`}
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`w-[16px] h-[16px] rounded-[4px] shrink-0 ${statusMeta.squareClass}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-slate-900 truncate">
                          {primaryLabel}
                        </p>
                        <p className="text-[12px] text-slate-500 truncate tabular-nums">
                          {bot.clientName}
                          {bot.businessName ? ` · ${bot.botPhone}` : ''}
                        </p>
                        {bot.status === 'incomplete' && missing.length > 0 && (
                          <p className="mt-0.5 text-[11px] text-amber-700 truncate">
                            {copy.missingPrefix}: {missing.join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuBotId((prev) =>
                            prev === bot.id ? null : bot.id,
                          )
                        }
                        aria-label={copy.rowActionsAria(primaryLabel)}
                        aria-expanded={isMenuOpen}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 active:bg-slate-100 cursor-pointer"
                      >
                        <MoreHorizontal
                          className="w-4 h-4"
                          aria-hidden="true"
                        />
                      </button>

                      {isMenuOpen && (
                        <div
                          role="menu"
                          className={`absolute right-0 z-40 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_30px_-8px_rgba(15,23,42,0.22)] flex flex-col gap-0.5 ${
                            openUpward ? 'bottom-9' : 'top-9'
                          }`}
                        >
                          {bot.status === 'active' && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                onUpdateBotStatus?.(bot.id, 'paused');
                                setOpenMenuBotId(null);
                              }}
                              className="w-full px-2.5 py-2 rounded-lg text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Pause
                                className="w-3.5 h-3.5 text-rose-500"
                                aria-hidden="true"
                              />
                              <span>{copy.pauseAction}</span>
                            </button>
                          )}

                          {bot.status === 'paused' && canActivate && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                onUpdateBotStatus?.(bot.id, 'active');
                                setOpenMenuBotId(null);
                              }}
                              className="w-full px-2.5 py-2 rounded-lg text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Play
                                className="w-3.5 h-3.5 text-emerald-600"
                                aria-hidden="true"
                              />
                              <span>{copy.activateAction}</span>
                            </button>
                          )}

                          {(bot.status === 'active' ||
                            bot.status === 'paused' ||
                            bot.status === 'incomplete') && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                onUpdateBotStatus?.(bot.id, 'suspended');
                                setOpenMenuBotId(null);
                              }}
                              className="w-full px-2.5 py-2 rounded-lg text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Clock
                                className="w-3.5 h-3.5 text-orange-500"
                                aria-hidden="true"
                              />
                              <span>{copy.suspendAction}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setDeleteConfirmBot(bot);
                              setOpenMenuBotId(null);
                            }}
                            className="w-full px-2.5 py-2 rounded-lg text-left text-[12.5px] font-medium text-rose-600 hover:bg-rose-50/70 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2
                              className="w-3.5 h-3.5 text-rose-600"
                              aria-hidden="true"
                            />
                            <span>{copy.deleteAction}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Full-screen client bots modal triggered by the Eye icon beside client's name */}
      {isClientBotsModalOpen && selectedClient && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedClient.fullName}
          className="fixed inset-0 z-30 lg:hidden bg-white text-slate-950 flex flex-col overflow-hidden"
        >
          <header className="shrink-0 h-14 px-5 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold text-slate-950 tracking-tight truncate">
              {selectedClient.fullName}
            </h2>
            <button
              type="button"
              onClick={() => setIsClientBotsModalOpen(false)}
              aria-label={copy.closeClientBotsAria}
              className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-10">
            {selectedClientBots.length === 0 ? (
              <p className="text-[13.5px] text-slate-400 py-8 text-center">
                {copy.clientBotsEmpty}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedClientBots.map((bot) => {
                  const statusMeta = BOT_STATUS_STYLE[bot.status];
                  const statusLabel =
                    statusMeta.labels[locale] ?? statusMeta.labels.es;
                  const missing = getBotMissingModules(bot, locale);

                  return (
                    <div
                      key={bot.id}
                      className="rounded-2xl border border-slate-200/85 bg-white px-4 py-3.5 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-slate-950 truncate">
                            {bot.businessName || copy.unnamedBusiness}
                          </p>
                          <p className="mt-0.5 text-[12.5px] text-slate-600 tabular-nums">
                            {bot.botPhone}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                          <span
                            aria-hidden="true"
                            className={`w-3 h-3 rounded-[3.5px] ${statusMeta.squareClass}`}
                          />
                          <span className="text-[12px] font-medium text-slate-700 whitespace-nowrap">
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500">
                        {missing.length === 0 ? (
                          <>
                            <Check
                              className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">
                              {copy.readyConfiguration}
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock
                              className="w-3.5 h-3.5 text-amber-500 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">
                              {copy.missingPrefix}: {missing.join(' · ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {deleteConfirmBot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={copy.deleteConfirmTitle}
          className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[1px] flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.28)]">
            <h3 className="text-[15.5px] font-semibold text-slate-950">
              {copy.deleteConfirmTitle}
            </h3>
            <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">
              {copy.deleteConfirmBody(
                deleteConfirmBot.businessName || deleteConfirmBot.botPhone,
                deleteConfirmBot.clientName,
              )}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmBot(null)}
                className="h-9 px-4 rounded-full border border-slate-200 bg-white text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {copy.cancelAction}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBot?.(deleteConfirmBot);
                  setDeleteConfirmBot(null);
                }}
                className="h-9 px-4 rounded-full bg-rose-600 text-white text-[12.5px] font-semibold hover:bg-rose-700 cursor-pointer"
              >
                {copy.confirmDeleteAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
