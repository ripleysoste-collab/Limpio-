import { useMemo, useState, type FormEvent } from 'react';
import { Plus, Search, X } from 'lucide-react';
import {
  CLIENT_STATUS_STYLE,
  filterAgencyClients,
  getVisibleAgencyClients,
  type AgencyClientRecord,
} from '../lib/agencyClients';
import {
  formatCountryWithUtcPrompt,
  formatExpirationInput,
  validateCountryField,
  validateExpirationMasked,
  validateGmailEmail,
  validatePersonalPhone,
  type ValidationTone,
} from '../lib/agencyValidation';
import type { SupportedLocale } from '../lib/i18n';
import {
  AgencyClientActionModals,
  AgencyClientRowActionsTrigger,
} from './AgencyClientRowMenu';

interface AgencyMobileClientsProps {
  locale: SupportedLocale;
  clients?: AgencyClientRecord[];
  dismissedExampleIds?: string[];
  nowMs?: number;
  onRegisterClient?: (client: AgencyClientRecord) => void;
  onDeleteClient?: (client: AgencyClientRecord) => void;
}

interface MobileClientsCopy {
  title: string;
  searchPlaceholder: string;
  searchAria: string;
  clearSearchAria: string;
  listAria: string;
  noMatches: string;
  emptyClients: string;
  addClientAria: string;
  rowActionsAria: (name: string) => string;
  registerTitle: string;
  closeRegisterAria: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phoneDefaultPlaceholder: string;
  countryLabel: string;
  countryPlaceholder: string;
  expirationLabel: string;
  expirationPlaceholder: string;
  noExpirationAction: string;
  noExpirationMarkedAria: string;
  noteLabel: string;
  notePlaceholder: string;
  noteCounter: (count: number) => string;
  registerSubmit: string;
}

const MOBILE_CLIENTS_COPY: Record<SupportedLocale, MobileClientsCopy> = {
  es: {
    title: 'Clientes',
    searchPlaceholder: 'Buscar cliente o correo...',
    searchAria: 'Buscar clientes registrados',
    clearSearchAria: 'Limpiar búsqueda',
    listAria: 'Lista de clientes registrados',
    noMatches: 'No hay coincidencias con esa búsqueda.',
    emptyClients: 'Sin clientes registrados.',
    addClientAria: 'Agregar cliente',
    rowActionsAria: (name) => `Acciones para ${name}`,
    registerTitle: 'Registrar',
    closeRegisterAria: 'Cerrar registro',
    nameLabel: 'Escribe el apellido y nombre de tu cliente',
    namePlaceholder: 'Ej: Pérez Francisco',
    emailLabel: 'Pon el correo de tu cliente',
    emailPlaceholder: 'nombrecliente@gmail.com',
    phoneLabel: 'Pon su número de teléfono personal',
    phoneDefaultPlaceholder: '+57 300 123 4567',
    countryLabel: 'Escribe el país',
    countryPlaceholder: 'Ej: Colombia',
    expirationLabel: 'Pon la fecha de vencimiento',
    expirationPlaceholder: 'Ej: 18/12/2026 23:52',
    noExpirationAction: 'No agregar fecha de vencimiento',
    noExpirationMarkedAria: 'Sin fecha de vencimiento',
    noteLabel: 'Pon una nota',
    notePlaceholder: 'Escribe una nota breve (mínimo 30 caracteres)...',
    noteCounter: (count) => `${count}/30`,
    registerSubmit: 'Registrar',
  },
  en: {
    title: 'Clients',
    searchPlaceholder: 'Search client or email...',
    searchAria: 'Search registered clients',
    clearSearchAria: 'Clear search',
    listAria: 'Registered clients list',
    noMatches: 'No clients match your search.',
    emptyClients: 'No registered clients.',
    addClientAria: 'Add client',
    rowActionsAria: (name) => `Actions for ${name}`,
    registerTitle: 'Register',
    closeRegisterAria: 'Close registration',
    nameLabel: "Enter your client's last and first name",
    namePlaceholder: 'e.g. Smith John',
    emailLabel: "Enter your client's email",
    emailPlaceholder: 'clientname@gmail.com',
    phoneLabel: 'Enter their personal phone number',
    phoneDefaultPlaceholder: '+1 305 555 0199',
    countryLabel: 'Write the country',
    countryPlaceholder: 'e.g. Colombia',
    expirationLabel: 'Set the expiration date',
    expirationPlaceholder: 'e.g. 18/12/2026 23:52',
    noExpirationAction: 'Do not add expiration date',
    noExpirationMarkedAria: 'No expiration date',
    noteLabel: 'Add a note',
    notePlaceholder: 'Write a short note (minimum 30 characters)...',
    noteCounter: (count) => `${count}/30`,
    registerSubmit: 'Register',
  },
  pt: {
    title: 'Clientes',
    searchPlaceholder: 'Buscar cliente ou e-mail...',
    searchAria: 'Buscar clientes cadastrados',
    clearSearchAria: 'Limpar busca',
    listAria: 'Lista de clientes cadastrados',
    noMatches: 'Nenhum cliente corresponde à busca.',
    emptyClients: 'Nenhum cliente cadastrado.',
    addClientAria: 'Adicionar cliente',
    rowActionsAria: (name) => `Ações para ${name}`,
    registerTitle: 'Registrar',
    closeRegisterAria: 'Fechar cadastro',
    nameLabel: 'Escreva o sobrenome e nome do seu cliente',
    namePlaceholder: 'Ex: Silva João',
    emailLabel: 'Coloque o e-mail do seu cliente',
    emailPlaceholder: 'nomecliente@gmail.com',
    phoneLabel: 'Coloque o telefone pessoal dele',
    phoneDefaultPlaceholder: '+55 11 98765 4321',
    countryLabel: 'Escreva o país',
    countryPlaceholder: 'Ex: Brasil',
    expirationLabel: 'Coloque a data de vencimento',
    expirationPlaceholder: 'Ex: 18/12/2026 23:52',
    noExpirationAction: 'Não adicionar data de vencimento',
    noExpirationMarkedAria: 'Sem data de vencimento',
    noteLabel: 'Adicione uma nota',
    notePlaceholder: 'Escreva uma nota curta (mínimo 30 caracteres)...',
    noteCounter: (count) => `${count}/30`,
    registerSubmit: 'Registrar',
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

export function AgencyMobileClients({
  locale,
  clients = [],
  dismissedExampleIds = [],
  nowMs,
  onRegisterClient,
  onDeleteClient,
}: AgencyMobileClientsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [openMenuClientId, setOpenMenuClientId] = useState<string | null>(null);
  const [viewClient, setViewClient] = useState<AgencyClientRecord | null>(null);
  const [statusClient, setStatusClient] = useState<AgencyClientRecord | null>(
    null,
  );
  const [deleteConfirmClient, setDeleteConfirmClient] =
    useState<AgencyClientRecord | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneBlurred, setPhoneBlurred] = useState(false);
  const [countryText, setCountryText] = useState('');
  const [countryBlurred, setCountryBlurred] = useState(false);
  const [expirationText, setExpirationText] = useState('');
  const [expirationBlurred, setExpirationBlurred] = useState(false);
  const [noExpiration, setNoExpiration] = useState(false);
  const [note, setNote] = useState('');

  const copy = MOBILE_CLIENTS_COPY[locale] ?? MOBILE_CLIENTS_COPY.es;

  const visibleClients = getVisibleAgencyClients(
    clients,
    nowMs,
    dismissedExampleIds,
  );
  const filteredClients = filterAgencyClients(visibleClients, searchQuery);

  const countryValidation = useMemo(
    () => validateCountryField(countryText, countryBlurred),
    [countryText, countryBlurred],
  );
  const matchedCountry = countryValidation.matched;

  const emailValidation = useMemo(
    () => validateGmailEmail(email, emailBlurred, clients),
    [email, emailBlurred, clients],
  );

  const phoneValidation = useMemo(
    () => validatePersonalPhone(phone, matchedCountry, phoneBlurred, clients),
    [phone, matchedCountry, phoneBlurred, clients],
  );

  const expirationValidation = useMemo(
    () =>
      validateExpirationMasked(
        expirationText,
        noExpiration,
        expirationBlurred,
        countryValidation.resolvedTimezone,
      ),
    [
      expirationText,
      noExpiration,
      expirationBlurred,
      countryValidation.resolvedTimezone,
    ],
  );

  const noteLen = note.trim().length;
  const isFormReady =
    fullName.trim().length >= 2 &&
    emailValidation.isValid &&
    phoneValidation.isValid &&
    countryValidation.isValid &&
    matchedCountry !== null &&
    countryValidation.resolvedTimezone !== null &&
    expirationValidation.isValid &&
    noteLen >= 30;

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setEmailBlurred(false);
    setPhone('');
    setPhoneBlurred(false);
    setCountryText('');
    setCountryBlurred(false);
    setExpirationText('');
    setExpirationBlurred(false);
    setNoExpiration(false);
    setNote('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !isFormReady ||
      !matchedCountry ||
      !countryValidation.resolvedTimezone
    ) {
      return;
    }

    const nowIso = new Date().toISOString();
    const record: AgencyClientRecord = {
      id: `cli_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      countryCode: matchedCountry.code,
      countryName: matchedCountry.name,
      timezone: countryValidation.resolvedTimezone,
      status: 'active',
      startDate: nowIso,
      endDate: noExpiration ? null : expirationValidation.iso,
      notes: note.trim(),
    };

    onRegisterClient?.(record);
    resetForm();
    setIsRegisterOpen(false);
  };

  const phonePlaceholder = matchedCountry
    ? `+${matchedCountry.dialCode} ${matchedCountry.exampleNational}`
    : copy.phoneDefaultPlaceholder;

  return (
    <div className="relative min-h-full bg-white text-slate-950 px-4 pt-4 pb-24 flex flex-col">
      <h2 className="text-[18px] font-semibold text-slate-950 tracking-tight">
        {copy.title}
      </h2>

      {/* Clean pure-white rounded search bar directly below Clientes title */}
      <div className="mt-3.5">
        <div
          className={`group flex items-center gap-2.5 h-11 px-4 rounded-full border ${BASE_SURFACE_CLASS} ${getToneBorderClass('neutral')}`}
        >
          <Search
            className="w-4 h-4 text-slate-400 group-focus-within:text-slate-700 transition-colors shrink-0"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchAria}
            className="flex-1 min-w-0 bg-transparent text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={copy.clearSearchAria}
              className="w-6 h-6 -mr-1.5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 active:bg-slate-100 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Uniform hairline-divided rows directly below search bar */}
      <section aria-label={copy.listAria} className="mt-4 -mx-4 flex-1 flex flex-col">
        {filteredClients.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px] text-slate-400">
              {visibleClients.length === 0 ? copy.emptyClients : copy.noMatches}
            </p>
          </div>
        ) : (
          <ul className="border-t border-b border-slate-200/85 divide-y divide-slate-200/85">
            {filteredClients.map((client, index) => {
              const statusMeta = CLIENT_STATUS_STYLE[client.status];
              const statusLabel = statusMeta.labels[locale] ?? statusMeta.labels.es;
              const isMenuOpen = openMenuClientId === client.id;
              const openUpward =
                filteredClients.length >= 3 && index >= filteredClients.length - 2;
              return (
                <li
                  key={client.id}
                  className={`relative h-[52px] px-4 bg-white flex items-center justify-between gap-3 ${
                    isMenuOpen ? 'z-30' : 'z-0'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      title={statusLabel}
                      aria-label={statusLabel}
                      className={`w-[18px] h-[18px] rounded-[5px] shrink-0 ${statusMeta.squareClass}`}
                    />
                    <span className="text-[14px] font-normal text-slate-900 truncate">
                      {client.fullName}
                    </span>
                  </div>

                  <AgencyClientRowActionsTrigger
                    client={client}
                    locale={locale}
                    isOpen={isMenuOpen}
                    openUpward={openUpward}
                    triggerAriaLabel={copy.rowActionsAria(client.fullName)}
                    onToggle={() =>
                      setOpenMenuClientId((prev) =>
                        prev === client.id ? null : client.id,
                      )
                    }
                    onClose={() => setOpenMenuClientId(null)}
                    onView={(target) => setViewClient(target)}
                    onViewStatus={(target) => setStatusClient(target)}
                    onRequestDelete={(target) => setDeleteConfirmClient(target)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Compact WhatsApp-green floating + button anchored bottom-right */}
      <button
        type="button"
        onClick={() => setIsRegisterOpen(true)}
        aria-label={copy.addClientAria}
        title={copy.addClientAria}
        className="fixed bottom-5 right-4 z-20 lg:hidden w-11 h-11 rounded-full bg-[#25D366] active:bg-[#1FB858] text-white shadow-[0_8px_22px_-6px_rgba(37,211,102,0.65)] flex items-center justify-center cursor-pointer transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128C7E]"
      >
        <Plus className="w-5 h-5 stroke-[2.25]" aria-hidden="true" />
      </button>

      {/* Full-screen Registrar view when tapping + on mobile */}
      {isRegisterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={copy.registerTitle}
          className="fixed inset-0 z-30 lg:hidden bg-white text-slate-950 flex flex-col overflow-hidden"
        >
          <header className="shrink-0 h-14 px-5 bg-white border-b border-slate-200/80 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-slate-950 tracking-tight">
              {copy.registerTitle}
            </h2>
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              aria-label={copy.closeRegisterAria}
              className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </header>

          <form
            onSubmit={handleSubmit}
            className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-12 flex flex-col gap-4"
          >
            {/* 1. Apellido y nombre */}
            <label className="block">
              <span className="block text-[12.5px] font-medium text-slate-700 mb-1.5 pl-1">
                {copy.nameLabel}
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={copy.namePlaceholder}
                className={`w-full h-10 px-4 rounded-full border text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none ${BASE_SURFACE_CLASS} ${getToneBorderClass('neutral')}`}
              />
            </label>

            {/* 2. Correo (@gmail.com con más de 6 caracteres antes de @) */}
            <label className="block">
              <span className="block text-[12.5px] font-medium text-slate-700 mb-1.5 pl-1">
                {copy.emailLabel}
              </span>
              <div
                className={`flex items-center h-10 px-4 rounded-full border ${BASE_SURFACE_CLASS} ${getToneBorderClass(emailValidation.tone)}`}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailBlurred) setEmailBlurred(false);
                  }}
                  onBlur={() => setEmailBlurred(true)}
                  placeholder={copy.emailPlaceholder}
                  autoComplete="off"
                  spellCheck={false}
                  className={`flex-1 min-w-0 bg-transparent text-[13.5px] placeholder:text-slate-400 focus:outline-none ${getToneTextClass(emailValidation.tone)}`}
                />
              </div>
            </label>

            {/* 3. Teléfono personal (+prefijo nacional lógico del país) */}
            <label className="block">
              <span className="block text-[12.5px] font-medium text-slate-700 mb-1.5 pl-1">
                {copy.phoneLabel}
              </span>
              <div
                className={`flex items-center h-10 px-4 rounded-full border ${BASE_SURFACE_CLASS} ${getToneBorderClass(phoneValidation.tone)}`}
              >
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneBlurred) setPhoneBlurred(false);
                  }}
                  onBlur={() => setPhoneBlurred(true)}
                  placeholder={phonePlaceholder}
                  className={`flex-1 min-w-0 bg-transparent text-[13.5px] placeholder:text-slate-400 focus:outline-none ${getToneTextClass(phoneValidation.tone)}`}
                />
              </div>
            </label>

            {/* 4. Escribe el país + UTC automático si tiene múltiples husos horarios */}
            <label className="block">
              <span className="block text-[12.5px] font-medium text-slate-700 mb-1.5 pl-1">
                {copy.countryLabel}
              </span>
              <div
                className={`flex items-center gap-2 h-10 px-4 rounded-full border ${BASE_SURFACE_CLASS} ${getToneBorderClass(countryValidation.tone)}`}
              >
                <input
                  type="text"
                  value={countryText}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    if (countryBlurred) setCountryBlurred(false);
                    setCountryText((prev) =>
                      formatCountryWithUtcPrompt(nextVal, prev),
                    );
                  }}
                  onBlur={() => setCountryBlurred(true)}
                  placeholder={copy.countryPlaceholder}
                  className={`flex-1 min-w-0 bg-transparent text-[13.5px] placeholder:text-slate-400 focus:outline-none ${getToneTextClass(countryValidation.tone)}`}
                />
                {matchedCountry && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {countryValidation.requiresUtc &&
                      !countryValidation.isValid &&
                      countryValidation.utcHint && (
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          {countryValidation.utcHint}
                        </span>
                      )}
                    <span
                      aria-label={matchedCountry.name}
                      title={matchedCountry.name}
                      className="text-[15px] leading-none"
                    >
                      {matchedCountry.flag}
                    </span>
                  </div>
                )}
              </div>
            </label>

            {/* 5. Fecha de vencimiento autoformateada DD/MM/AAAA HH:mm */}
            <div>
              <label className="block">
                <span className="block text-[12.5px] font-medium text-slate-700 mb-1.5 pl-1">
                  {copy.expirationLabel}
                </span>
                <div
                  className={`flex items-center gap-2 h-10 px-4 rounded-full border ${BASE_SURFACE_CLASS} ${getToneBorderClass(expirationValidation.tone)}`}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    value={noExpiration ? '' : expirationText}
                    onChange={(e) => {
                      setNoExpiration(false);
                      setExpirationBlurred(false);
                      setExpirationText((prev) =>
                        formatExpirationInput(e.target.value, prev),
                      );
                    }}
                    onBlur={() => {
                      if (!noExpiration && expirationText.length > 0) {
                        setExpirationBlurred(true);
                      }
                    }}
                    readOnly={noExpiration}
                    placeholder={copy.expirationPlaceholder}
                    className={`flex-1 min-w-0 bg-transparent text-[13.5px] tabular-nums placeholder:text-slate-400 focus:outline-none ${
                      noExpiration
                        ? 'text-slate-400 cursor-default'
                        : getToneTextClass(expirationValidation.tone)
                    }`}
                  />
                  {noExpiration && (
                    <button
                      type="button"
                      onClick={() => setNoExpiration(false)}
                      aria-label={copy.noExpirationMarkedAria}
                      className="w-6 h-6 -mr-1.5 rounded-full flex items-center justify-center text-slate-700 cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4 stroke-[2.25]" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </label>

              <button
                type="button"
                onClick={() => {
                  setNoExpiration((prev) => {
                    const next = !prev;
                    if (next) {
                      setExpirationText('');
                      setExpirationBlurred(false);
                    }
                    return next;
                  });
                }}
                className={`mt-1.5 pl-1 text-[12px] cursor-pointer transition-colors ${
                  noExpiration
                    ? 'text-slate-950 font-medium'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {copy.noExpirationAction}
              </button>
            </div>

            {/* 6. Nota (mínimo 30 caracteres) */}
            <label className="block">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[12.5px] font-medium text-slate-700">
                  {copy.noteLabel}
                </span>
                <span
                  className={`text-[11px] tabular-nums ${
                    noteLen >= 30 ? 'text-emerald-600 font-medium' : 'text-slate-400'
                  }`}
                >
                  {copy.noteCounter(noteLen)}
                </span>
              </div>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={copy.notePlaceholder}
                className={`w-full rounded-2xl border px-4 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none ${BASE_SURFACE_CLASS} ${getToneBorderClass('neutral')}`}
              />
            </label>

            {/* Small green Registrar button appears once all required data is filled */}
            {isFormReady && (
              <div className="pt-2">
                <button
                  type="submit"
                  className="h-9 px-5 rounded-full bg-[#25D366] active:bg-[#1FB858] text-white text-[13px] font-semibold shadow-[0_6px_16px_-6px_rgba(37,211,102,0.7)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128C7E]"
                >
                  {copy.registerSubmit}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      <AgencyClientActionModals
        locale={locale}
        viewClient={viewClient}
        statusClient={statusClient}
        deleteConfirmClient={deleteConfirmClient}
        onCloseView={() => setViewClient(null)}
        onCloseStatus={() => setStatusClient(null)}
        onCancelDelete={() => setDeleteConfirmClient(null)}
        onConfirmDelete={(target) => {
          onDeleteClient?.(target);
          setDeleteConfirmClient(null);
          if (viewClient?.id === target.id) setViewClient(null);
          if (statusClient?.id === target.id) setStatusClient(null);
        }}
      />
    </div>
  );
}
