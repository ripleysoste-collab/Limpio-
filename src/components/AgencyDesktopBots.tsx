import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Check,
  Clock,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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
  formatAgencyDateDisplay,
  getVisibleAgencyClients,
  type AgencyClientRecord,
} from '../lib/agencyClients';
import { TOP_50_COMMERCIAL_COUNTRIES } from '../lib/agencyCountries';
import type { ValidationTone } from '../lib/agencyValidation';
import type { SupportedLocale } from '../lib/i18n';

interface AgencyDesktopBotsProps {
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

interface DesktopBotsCopy {
  registerTitle: string;
  clientSearchPlaceholder: string;
  clientSearchAria: string;
  clearSearchAria: string;
  deselectClientAria: string;
  noClientMatch: string;
  clientBlockedNotice: string;
  botPhoneLabel: string;
  defaultBotPhonePlaceholder: string;
  registerSubmit: string;
  listTitle: string;
  closeListAria: string;
  clientStatusField: string;
  clientEmailField: string;
  clientPhoneField: string;
  clientTimezoneField: string;
  clientExpirationField: string;
  noExpirationValue: string;
  clientBotsHeading: (count: number) => string;
  noClientBotsYet: string;
  unnamedBusiness: string;
  missingPrefix: string;
  readyConfiguration: string;
  emptyColumnText: string;
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

const DESKTOP_BOTS_COPY: Record<SupportedLocale, DesktopBotsCopy> = {
  es: {
    registerTitle: 'Registrar bots',
    clientSearchPlaceholder: 'Nombre, correo o teléfono personal...',
    clientSearchAria: 'Buscar cliente por nombre, correo o teléfono personal',
    clearSearchAria: 'Limpiar búsqueda',
    deselectClientAria: 'Cambiar cliente seleccionado',
    noClientMatch: 'No encontrado en Clientes.',
    clientBlockedNotice:
      'Cliente no activo. Reactívalo en Clientes para asignar un bot.',
    botPhoneLabel: 'Número del bot',
    defaultBotPhonePlaceholder: '+57 300 412 8890',
    registerSubmit: 'Registrar',
    listTitle: 'Listar',
    closeListAria: 'Cerrar panel de cliente',
    clientStatusField: 'Estado',
    clientEmailField: 'Correo',
    clientPhoneField: 'Teléfono personal',
    clientTimezoneField: 'País y zona horaria',
    clientExpirationField: 'Vencimiento',
    noExpirationValue: 'Sin vencimiento',
    clientBotsHeading: (count) => `Bots (${count})`,
    noClientBotsYet: 'Sin bots registrados.',
    unnamedBusiness: 'Negocio pendiente',
    missingPrefix: 'Falta',
    readyConfiguration: 'Configuración completa',
    emptyColumnText: 'Sin bots.',
    rowActionsAria: (label) => `Acciones para ${label}`,
    pauseAction: 'Pausar bot',
    activateAction: 'Activar bot',
    suspendAction: 'Suspender bot',
    deleteAction: 'Eliminar bot',
    deleteConfirmTitle: 'Eliminar bot específico',
    deleteConfirmBody: (botLabel, clientName) =>
      `Se eliminará el bot ${botLabel} de ${clientName} junto con su negocio, entrenamiento y línea asociada. El cliente y sus demás bots permanecerán intactos.`,
    cancelAction: 'Cancelar',
    confirmDeleteAction: 'Aceptar',
  },
  en: {
    registerTitle: 'Register bots',
    clientSearchPlaceholder: 'Name, email, or personal phone...',
    clientSearchAria: 'Search client by name, email, or personal phone',
    clearSearchAria: 'Clear search',
    deselectClientAria: 'Change selected client',
    noClientMatch: 'Not found in Clients.',
    clientBlockedNotice:
      'Client is inactive. Reactivate them in Clients to assign a bot.',
    botPhoneLabel: 'Bot number',
    defaultBotPhonePlaceholder: '+1 305 555 0199',
    registerSubmit: 'Register',
    listTitle: 'List',
    closeListAria: 'Close client panel',
    clientStatusField: 'Status',
    clientEmailField: 'Email',
    clientPhoneField: 'Personal phone',
    clientTimezoneField: 'Country & timezone',
    clientExpirationField: 'Expiration',
    noExpirationValue: 'No expiration',
    clientBotsHeading: (count) => `Bots (${count})`,
    noClientBotsYet: 'No bots registered.',
    unnamedBusiness: 'Pending business',
    missingPrefix: 'Missing',
    readyConfiguration: 'Complete setup',
    emptyColumnText: 'No bots.',
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
    clientSearchPlaceholder: 'Nome, e-mail ou telefone pessoal...',
    clientSearchAria: 'Buscar cliente por nome, e-mail ou telefone pessoal',
    clearSearchAria: 'Limpar busca',
    deselectClientAria: 'Alterar cliente selecionado',
    noClientMatch: 'Não encontrado em Clientes.',
    clientBlockedNotice:
      'Cliente inativo. Reative em Clientes para atribuir um bot.',
    botPhoneLabel: 'Número do bot',
    defaultBotPhonePlaceholder: '+55 11 98765 4321',
    registerSubmit: 'Registrar',
    listTitle: 'Listar',
    closeListAria: 'Fechar painel do cliente',
    clientStatusField: 'Status',
    clientEmailField: 'E-mail',
    clientPhoneField: 'Telefone pessoal',
    clientTimezoneField: 'País e fuso horário',
    clientExpirationField: 'Vencimento',
    noExpirationValue: 'Sem vencimento',
    clientBotsHeading: (count) => `Bots (${count})`,
    noClientBotsYet: 'Sem bots cadastrados.',
    unnamedBusiness: 'Negócio pendente',
    missingPrefix: 'Falta',
    readyConfiguration: 'Configuração completa',
    emptyColumnText: 'Sem bots.',
    rowActionsAria: (label) => `Ações para ${label}`,
    pauseAction: 'Pausar bot',
    activateAction: 'Ativar bot',
    suspendAction: 'Suspender bot',
    deleteAction: 'Excluir bot',
    deleteConfirmTitle: 'Excluir bot específico',
    deleteConfirmBody: (botLabel, clientName) =>
      `O bot ${botLabel} de ${clientName} será excluído junto com seu negócio, treinamento e linha associada. O cliente e os outros bots permanecerão intactos.`,
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

export function AgencyDesktopBots({
  locale,
  clients = [],
  dismissedExampleClientIds = [],
  bots = [],
  dismissedExampleBotIds = [],
  nowMs,
  onRegisterBot,
  onUpdateBotStatus,
  onDeleteBot,
}: AgencyDesktopBotsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [botPhone, setBotPhone] = useState('');
  const [botPhoneBlurred, setBotPhoneBlurred] = useState(false);

  const [openMenuBotId, setOpenMenuBotId] = useState<string | null>(null);
  const [deleteConfirmBot, setDeleteConfirmBot] =
    useState<AgencyBotRecord | null>(null);

  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  const copy = DESKTOP_BOTS_COPY[locale] ?? DESKTOP_BOTS_COPY.es;

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
  const showListPanel = selectedClient !== null;

  const listedClientBots = useMemo(
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

  const botsByColumn = useMemo(() => {
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
    if (!openMenuBotId) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
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
      setBotPhone('');
      setBotPhoneBlurred(false);
    }
  };

  const handleSelectMatchedClient = (client: AgencyClientRecord) => {
    setSelectedClientId(client.id);
    setSearchQuery(client.fullName);
    setBotPhone('');
    setBotPhoneBlurred(false);
  };

  const handleDeselectClient = () => {
    setSelectedClientId(null);
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

  return (
    <div
      ref={menuContainerRef}
      className="relative w-full h-full bg-white flex flex-col overflow-hidden"
    >
      <div className="flex-1 min-h-0 w-full flex overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:thin] [scrollbar-color:#cbd5e1_#f8fafc] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-slate-100/90 [&::-webkit-scrollbar-track]:border-t [&::-webkit-scrollbar-track]:border-slate-200/80 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full">
        {/* Panel 1 (40%): Registrar bots */}
        <section
          aria-label={copy.registerTitle}
          className="w-[40%] min-w-[380px] shrink-0 h-full border-r border-slate-200/85 bg-white px-7 pt-6 pb-8 flex flex-col overflow-y-auto"
        >
          <h1 className="text-[18px] font-semibold text-slate-950 tracking-tight">
            {copy.registerTitle}
          </h1>

          <form
            onSubmit={handleRegisterSubmit}
            className="mt-4 flex-1 flex flex-col gap-4"
            noValidate
          >
            {/* Search input */}
            <div
              className={`relative flex items-center h-11 rounded-2xl border px-3.5 ${BASE_SURFACE_CLASS} border-slate-200/90 focus-within:border-slate-400 focus-within:shadow-[0_6px_20px_-6px_rgba(15,23,42,0.13)]`}
            >
              <Search
                className="w-4 h-4 text-slate-400 shrink-0 mr-2.5"
                aria-hidden="true"
              />
              <input
                id="bot-client-search"
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={copy.clientSearchPlaceholder}
                aria-label={copy.clientSearchAria}
                className="w-full bg-transparent text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none pr-6"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleDeselectClient}
                  aria-label={copy.clearSearchAria}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Search results shown until a client is selected */}
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
                        onClick={() => handleSelectMatchedClient(client)}
                        className="w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2.5 hover:bg-slate-50/75 cursor-pointer transition-colors"
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

            {/* Selected client + Bot phone field + Register action */}
            {selectedClient && (
              <>
                <div className="rounded-2xl border border-slate-200/85 bg-slate-50/60 px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
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
                  <button
                    type="button"
                    onClick={handleDeselectClient}
                    aria-label={copy.deselectClientAria}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                {selectedClient.status !== 'active' ? (
                  <p className="px-1 text-[12.5px] text-rose-600 leading-snug">
                    {copy.clientBlockedNotice}
                  </p>
                ) : (
                  <>
                    <div>
                      <label
                        htmlFor="bot-whatsapp-phone"
                        className="block text-[13px] font-medium text-slate-800 mb-2"
                      >
                        {copy.botPhoneLabel}
                      </label>
                      <div
                        className={`h-11 rounded-2xl border px-3.5 flex items-center ${BASE_SURFACE_CLASS} ${getToneBorderClass(botPhoneValidation.tone)}`}
                      >
                        <input
                          id="bot-whatsapp-phone"
                          type="tel"
                          value={botPhone}
                          onChange={(e) => {
                            setBotPhone(e.target.value);
                            if (botPhoneBlurred) setBotPhoneBlurred(false);
                          }}
                          onBlur={() => setBotPhoneBlurred(true)}
                          placeholder={botPhonePlaceholder}
                          autoFocus
                          className={`w-full bg-transparent text-[13.5px] placeholder:text-slate-400 focus:outline-none tabular-nums ${getToneTextClass(botPhoneValidation.tone)}`}
                        />
                      </div>
                    </div>

                    <div className="pt-1 mt-auto">
                      <button
                        type="submit"
                        disabled={!canRegisterBot}
                        className={`w-full h-11 rounded-2xl text-[13.5px] font-semibold transition-all duration-150 ${
                          canRegisterBot
                            ? 'bg-slate-950 text-white shadow-[0_8px_20px_-8px_rgba(15,23,42,0.5)] hover:bg-slate-800 cursor-pointer'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {copy.registerSubmit}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </form>
        </section>

        {/* Expandable Listar drawer when a client is selected */}
        <AnimatePresence initial={false}>
          {showListPanel && selectedClient && (
            <motion.section
              key="bots-client-list-drawer"
              aria-label={copy.listTitle}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { width: 0, minWidth: 0, opacity: 0 }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { width: '30%', minWidth: 295, opacity: 1 }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { width: 0, minWidth: 0, opacity: 0 }
              }
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 h-full border-r border-slate-200/85 bg-slate-50/45 overflow-hidden flex flex-col"
            >
              <div className="w-full min-w-[295px] h-full flex flex-col px-6 pt-6 pb-8 overflow-y-auto">
                <div className="flex items-start justify-between gap-2 pb-4 border-b border-slate-200/80">
                  <div className="min-w-0">
                    <h2 className="text-[18px] font-semibold text-slate-950 tracking-tight truncate">
                      {copy.listTitle}
                    </h2>
                    <p className="mt-0.5 text-[12.5px] font-medium text-slate-600 truncate">
                      {selectedClient.fullName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeselectClient}
                    aria-label={copy.closeListAria}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white cursor-pointer shrink-0 transition-colors"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-5">
                  <div className="rounded-2xl border border-slate-200/85 bg-white divide-y divide-slate-100 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)]">
                    <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                      <span className="text-[11.5px] text-slate-400">
                        {copy.clientStatusField}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className={`w-3 h-3 rounded-[3px] ${CLIENT_STATUS_STYLE[selectedClient.status].squareClass}`}
                        />
                        <span className="text-[12.5px] font-medium text-slate-900">
                          {CLIENT_STATUS_STYLE[selectedClient.status].labels[
                            locale
                          ] ??
                            CLIENT_STATUS_STYLE[selectedClient.status].labels
                              .es}
                        </span>
                      </div>
                    </div>

                    <div className="px-3.5 py-2.5">
                      <p className="text-[11px] text-slate-400">
                        {copy.clientEmailField}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-slate-900 break-all">
                        {selectedClient.email}
                      </p>
                    </div>

                    <div className="px-3.5 py-2.5">
                      <p className="text-[11px] text-slate-400">
                        {copy.clientPhoneField}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-slate-900 tabular-nums">
                        {selectedClient.phone}
                      </p>
                    </div>

                    <div className="px-3.5 py-2.5">
                      <p className="text-[11px] text-slate-400">
                        {copy.clientTimezoneField}
                      </p>
                      <p className="mt-0.5 text-[12px] text-slate-700">
                        {selectedClient.countryName
                          ? `${selectedClient.countryName} · `
                          : ''}
                        {selectedClient.timezone}
                      </p>
                    </div>

                    <div className="px-3.5 py-2.5">
                      <p className="text-[11px] text-slate-400">
                        {copy.clientExpirationField}
                      </p>
                      <p className="mt-0.5 text-[12px] text-slate-700 tabular-nums">
                        {selectedClient.endDate
                          ? formatAgencyDateDisplay(
                              selectedClient.endDate,
                              selectedClient.timezone,
                            )
                          : copy.noExpirationValue}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[12.5px] font-semibold text-slate-900 mb-2.5 tabular-nums">
                      {copy.clientBotsHeading(listedClientBots.length)}
                    </h3>

                    {listedClientBots.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200/85 bg-white px-4 py-4 text-[12.5px] text-slate-400">
                        {copy.noClientBotsYet}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {listedClientBots.map((bot) => {
                          const statusMeta = BOT_STATUS_STYLE[bot.status];
                          const statusLabel =
                            statusMeta.labels[locale] ?? statusMeta.labels.es;
                          const missing = getBotMissingModules(bot, locale);

                          return (
                            <div
                              key={bot.id}
                              className="rounded-2xl border border-slate-200/85 bg-white px-3.5 py-3 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.05)]"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[13px] font-semibold text-slate-950 truncate">
                                    {bot.businessName || copy.unnamedBusiness}
                                  </p>
                                  <p className="mt-0.5 text-[12px] text-slate-600 tabular-nums">
                                    {bot.botPhone}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                  <span
                                    aria-hidden="true"
                                    className={`w-2.5 h-2.5 rounded-[3px] ${statusMeta.squareClass}`}
                                  />
                                  <span className="text-[11.5px] font-medium text-slate-700 whitespace-nowrap">
                                    {statusLabel}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
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
                                      {copy.missingPrefix}:{' '}
                                      {missing.join(' · ')}
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
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Status Columns (30% each) */}
        {BOT_COLUMN_ORDER.map((statusKey) => {
          const columnMeta = BOT_STATUS_STYLE[statusKey];
          const columnTitle =
            columnMeta.columnTitles[locale] ?? columnMeta.columnTitles.es;
          const columnBots = botsByColumn[statusKey];

          return (
            <section
              key={statusKey}
              aria-label={columnTitle}
              className="w-[30%] min-w-[290px] shrink-0 h-full border-r border-slate-200/85 bg-white px-6 pt-6 pb-8 flex flex-col"
            >
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200/80 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    aria-hidden="true"
                    className={`w-3.5 h-3.5 rounded-[4px] shrink-0 ${columnMeta.squareClass}`}
                  />
                  <h2 className="text-[16px] font-semibold text-slate-950 tracking-tight truncate">
                    {columnTitle}
                  </h2>
                </div>
                <span className="text-[12.5px] font-medium text-slate-400 tabular-nums shrink-0">
                  {columnBots.length}
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pt-4 flex flex-col gap-2.5">
                {columnBots.length === 0 ? (
                  <p className="text-[12.5px] text-slate-400 py-4">
                    {copy.emptyColumnText}
                  </p>
                ) : (
                  columnBots.map((bot) => {
                    const primaryLabel = bot.businessName || bot.botPhone;
                    const missingModules = getBotMissingModules(bot, locale);
                    const isMenuOpen = openMenuBotId === bot.id;
                    const canActivate =
                      isBotSetupComplete(bot) &&
                      bot.status !== 'expired' &&
                      bot.status !== 'suspended';

                    return (
                      <div
                        key={bot.id}
                        className="relative rounded-2xl border border-slate-200/85 bg-white px-3.5 py-3 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-slate-300/90 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClientId(bot.clientId);
                              setSearchQuery(bot.clientName);
                              setBotPhone('');
                              setBotPhoneBlurred(false);
                            }}
                            className="min-w-0 flex-1 text-left cursor-pointer focus-visible:outline-none"
                          >
                            <p className="text-[13.5px] font-semibold text-slate-950 truncate">
                              {primaryLabel}
                            </p>
                            <p className="mt-0.5 text-[12px] text-slate-500 truncate tabular-nums">
                              {bot.clientName}
                              {bot.businessName ? ` · ${bot.botPhone}` : ''}
                            </p>
                            {bot.status === 'incomplete' &&
                              missingModules.length > 0 && (
                                <p className="mt-1 text-[11px] text-amber-700 truncate">
                                  {copy.missingPrefix}:{' '}
                                  {missingModules.join(' · ')}
                                </p>
                              )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuBotId((prev) =>
                                prev === bot.id ? null : bot.id,
                              )
                            }
                            aria-label={copy.rowActionsAria(primaryLabel)}
                            aria-expanded={isMenuOpen}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer shrink-0"
                          >
                            <MoreHorizontal
                              className="w-4 h-4"
                              aria-hidden="true"
                            />
                          </button>
                        </div>

                        {isMenuOpen && (
                          <div
                            role="menu"
                            className="absolute right-3 top-11 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_30px_-8px_rgba(15,23,42,0.2)] flex flex-col gap-0.5"
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
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>

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
