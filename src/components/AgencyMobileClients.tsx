import { useMemo, useState, type FormEvent } from 'react';
import { MoreHorizontal, Plus, Search, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  CLIENT_STATUS_STYLE,
  filterAgencyClients,
  getVisibleAgencyClients,
  parseExpirationInput,
  type AgencyClientRecord,
} from '../lib/agencyClients';
import {
  TOP_50_COMMERCIAL_COUNTRIES,
  type CommercialCountry,
} from '../lib/agencyCountries';
import type { SupportedLocale } from '../lib/i18n';

interface AgencyMobileClientsProps {
  locale: SupportedLocale;
  clients?: AgencyClientRecord[];
  onRegisterClient?: (client: AgencyClientRecord) => void;
}

interface MobileClientsCopy {
  title: string;
  searchPlaceholder: string;
  searchAria: string;
  clearSearchAria: string;
  listAria: string;
  noMatches: string;
  addClientAria: string;
  rowActionsAria: (name: string) => string;
  registerTitle: string;
  closeRegisterAria: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  countryLabel: string;
  selectCountryBtn: string;
  countrySheetAria: string;
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
    addClientAria: 'Agregar cliente',
    rowActionsAria: (name) => `Acciones para ${name}`,
    registerTitle: 'Registrar',
    closeRegisterAria: 'Cerrar registro',
    nameLabel: 'Escribe el apellido y nombre de tu cliente',
    namePlaceholder: 'Ej: Pérez Francisco',
    emailLabel: 'Pon el correo de tu cliente',
    emailPlaceholder: 'correo@ejemplo.com',
    phoneLabel: 'Pon su número de teléfono personal',
    phonePlaceholder: '+57 300 000 0000',
    countryLabel: 'Pon la zona horaria del país',
    selectCountryBtn: 'Seleccionar',
    countrySheetAria: 'Seleccionar país comercial',
    expirationLabel: 'Pon la fecha de vencimiento',
    expirationPlaceholder: 'Ej: 18/12/2026 23:59',
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
    addClientAria: 'Add client',
    rowActionsAria: (name) => `Actions for ${name}`,
    registerTitle: 'Register',
    closeRegisterAria: 'Close registration',
    nameLabel: "Enter your client's last and first name",
    namePlaceholder: 'e.g. Smith John',
    emailLabel: "Enter your client's email",
    emailPlaceholder: 'email@example.com',
    phoneLabel: 'Enter their personal phone number',
    phonePlaceholder: '+1 555 000 0000',
    countryLabel: "Set the country's time zone",
    selectCountryBtn: 'Select',
    countrySheetAria: 'Select commercial country',
    expirationLabel: 'Set the expiration date',
    expirationPlaceholder: 'e.g. 18/12/2026 23:59',
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
    addClientAria: 'Adicionar cliente',
    rowActionsAria: (name) => `Ações para ${name}`,
    registerTitle: 'Registrar',
    closeRegisterAria: 'Fechar cadastro',
    nameLabel: 'Escreva o sobrenome e nome do seu cliente',
    namePlaceholder: 'Ex: Silva João',
    emailLabel: 'Coloque o e-mail do seu cliente',
    emailPlaceholder: 'email@exemplo.com',
    phoneLabel: 'Coloque o telefone pessoal dele',
    phonePlaceholder: '+55 11 90000 0000',
    countryLabel: 'Defina o fuso horário do país',
    selectCountryBtn: 'Selecionar',
    countrySheetAria: 'Selecionar país comercial',
    expirationLabel: 'Coloque a data de vencimento',
    expirationPlaceholder: 'Ex: 18/12/2026 23:59',
    noExpirationAction: 'Não adicionar data de vencimento',
    noExpirationMarkedAria: 'Sem data de vencimento',
    noteLabel: 'Adicione uma nota',
    notePlaceholder: 'Escreva uma nota curta (mínimo 30 caracteres)...',
    noteCounter: (count) => `${count}/30`,
    registerSubmit: 'Registrar',
  },
};

const FIELD_SURFACE_CLASS =
  'bg-white border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-slate-400 focus-within:shadow-[0_6px_20px_-6px_rgba(15,23,42,0.13)] transition-all duration-150';

export function AgencyMobileClients({
  locale,
  clients = [],
  onRegisterClient,
}: AgencyMobileClientsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] =
    useState<CommercialCountry | null>(null);
  const [isCountrySheetOpen, setIsCountrySheetOpen] = useState(false);
  const [expirationText, setExpirationText] = useState('');
  const [noExpiration, setNoExpiration] = useState(false);
  const [note, setNote] = useState('');

  const copy = MOBILE_CLIENTS_COPY[locale] ?? MOBILE_CLIENTS_COPY.es;

  const visibleClients = getVisibleAgencyClients(clients);
  const filteredClients = filterAgencyClients(visibleClients, searchQuery);

  const parsedExpiration = useMemo(
    () => (noExpiration ? null : parseExpirationInput(expirationText)),
    [expirationText, noExpiration],
  );

  const noteLen = note.trim().length;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPhoneValid = phone.replace(/\D/g, '').length >= 6;
  const isExpirationValid = noExpiration || parsedExpiration !== null;
  const isFormReady =
    fullName.trim().length >= 2 &&
    isEmailValid &&
    isPhoneValid &&
    selectedCountry !== null &&
    isExpirationValid &&
    noteLen >= 30;

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setSelectedCountry(null);
    setIsCountrySheetOpen(false);
    setExpirationText('');
    setNoExpiration(false);
    setNote('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormReady || !selectedCountry) return;

    const nowIso = new Date().toISOString();
    const record: AgencyClientRecord = {
      id: `cli_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      countryCode: selectedCountry.code,
      countryName: selectedCountry.name,
      timezone: selectedCountry.timezone,
      status: 'active',
      startDate: nowIso,
      endDate: noExpiration ? null : parsedExpiration,
      notes: note.trim(),
    };

    onRegisterClient?.(record);
    resetForm();
    setIsRegisterOpen(false);
  };

  return (
    <div className="relative min-h-full bg-white text-slate-950 px-4 pt-4 pb-24 flex flex-col">
      <h2 className="text-[18px] font-semibold text-slate-950 tracking-tight">
        {copy.title}
      </h2>

      {/* Clean pure-white rounded search bar directly below Clientes title */}
      <div className="mt-3.5">
        <div
          className={`group flex items-center gap-2.5 h-11 px-4 rounded-full ${FIELD_SURFACE_CLASS}`}
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
            <p className="text-[13px] text-slate-400">{copy.noMatches}</p>
          </div>
        ) : (
          <ul className="border-t border-b border-slate-200/85 divide-y divide-slate-200/85">
            {filteredClients.map((client) => {
              const statusMeta = CLIENT_STATUS_STYLE[client.status];
              const statusLabel = statusMeta.labels[locale] ?? statusMeta.labels.es;
              return (
                <li
                  key={client.id}
                  className="h-[52px] px-4 bg-white flex items-center justify-between gap-3"
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

                  <button
                    type="button"
                    aria-label={copy.rowActionsAria(client.fullName)}
                    className="w-8 h-8 -mr-1.5 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-950 active:bg-slate-100 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <MoreHorizontal className="w-[18px] h-[18px]" aria-hidden="true" />
                  </button>
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
                className={`w-full h-10 px-4 rounded-full text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none ${FIELD_SURFACE_CLASS}`}
              />
            </label>

            {/* 2. Correo */}
            <label className="block">
              <span className="block text-[12.5px] font-medium text-slate-700 mb-1.5 pl-1">
                {copy.emailLabel}
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy.emailPlaceholder}
                className={`w-full h-10 px-4 rounded-full text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none ${FIELD_SURFACE_CLASS}`}
              />
            </label>

            {/* 3. Teléfono personal */}
            <label className="block">
              <span className="block text-[12.5px] font-medium text-slate-700 mb-1.5 pl-1">
                {copy.phoneLabel}
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={copy.phonePlaceholder}
                className={`w-full h-10 px-4 rounded-full text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none ${FIELD_SURFACE_CLASS}`}
              />
            </label>

            {/* 4. Zona horaria del país (botón compacto Seleccionar) */}
            <div>
              <span className="block text-[12.5px] font-medium text-slate-700 mb-1.5 pl-1">
                {copy.countryLabel}
              </span>
              <button
                type="button"
                onClick={() => setIsCountrySheetOpen(true)}
                className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-[13.5px] cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${FIELD_SURFACE_CLASS} ${
                  selectedCountry ? 'text-slate-950 font-medium' : 'text-slate-600'
                }`}
              >
                {selectedCountry ? (
                  <>
                    <span aria-hidden="true">{selectedCountry.flag}</span>
                    <span>{selectedCountry.name}</span>
                  </>
                ) : (
                  <span>{copy.selectCountryBtn}</span>
                )}
              </button>
            </div>

            {/* 5. Fecha de vencimiento + No agregar fecha de vencimiento (marca X al final) */}
            <div>
              <label className="block">
                <span className="block text-[12.5px] font-medium text-slate-700 mb-1.5 pl-1">
                  {copy.expirationLabel}
                </span>
                <div
                  className={`flex items-center gap-2 h-10 px-4 rounded-full ${FIELD_SURFACE_CLASS}`}
                >
                  <input
                    type="text"
                    value={noExpiration ? '' : expirationText}
                    onChange={(e) => {
                      setNoExpiration(false);
                      setExpirationText(e.target.value);
                    }}
                    readOnly={noExpiration}
                    placeholder={copy.expirationPlaceholder}
                    className={`flex-1 min-w-0 bg-transparent text-[13.5px] placeholder:text-slate-400 focus:outline-none ${
                      noExpiration ? 'text-slate-400 cursor-default' : 'text-slate-900'
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
                    if (next) setExpirationText('');
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
                className={`w-full rounded-2xl px-4 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none ${FIELD_SURFACE_CLASS}`}
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

          {/* ~35% bottom sheet showing top 50 commercial countries side by side with flags */}
          <AnimatePresence>
            {isCountrySheetOpen && (
              <div
                className="fixed inset-0 z-40 flex flex-col justify-end"
                role="dialog"
                aria-modal="true"
                aria-label={copy.countrySheetAria}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
                  onClick={() => setIsCountrySheetOpen(false)}
                  className="absolute inset-0 bg-slate-950/25"
                />

                <motion.div
                  initial={shouldReduceMotion ? { opacity: 1 } : { y: '100%' }}
                  animate={{ y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 h-[35dvh] min-h-[240px] max-h-[42dvh] bg-white rounded-t-3xl shadow-[0_-12px_36px_rgba(15,23,42,0.16)] px-4 pt-3 pb-5 flex flex-col"
                >
                  <div
                    aria-hidden="true"
                    className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-3 shrink-0"
                  />
                  <div className="flex-1 min-h-0 overflow-y-auto flex flex-wrap content-start gap-2 pb-2">
                    {TOP_50_COMMERCIAL_COUNTRIES.map((country) => {
                      const isPicked = selectedCountry?.code === country.code;
                      return (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setIsCountrySheetOpen(false);
                          }}
                          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12.5px] cursor-pointer transition-colors ${
                            isPicked
                              ? 'bg-slate-950 text-white border-slate-950 font-medium'
                              : 'bg-white text-slate-800 border-slate-200/90 active:bg-slate-100'
                          }`}
                        >
                          <span aria-hidden="true">{country.flag}</span>
                          <span>{country.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
