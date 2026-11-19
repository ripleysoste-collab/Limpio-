import { useMemo, useState, type FormEvent } from 'react';
import { MoreHorizontal, Search, X } from 'lucide-react';
import {
  CLIENT_STATUS_STYLE,
  filterAgencyClients,
  getVisibleAgencyClients,
  parseExpirationInput,
  type AgencyClientRecord,
} from '../lib/agencyClients';
import { matchCommercialCountry } from '../lib/agencyCountries';
import type { SupportedLocale } from '../lib/i18n';

interface AgencyDesktopClientsProps {
  locale: SupportedLocale;
  clients?: AgencyClientRecord[];
  onRegisterClient?: (client: AgencyClientRecord) => void;
}

interface DesktopClientsCopy {
  title: string;
  searchPlaceholder: string;
  searchAria: string;
  clearSearchAria: string;
  listAria: string;
  noMatches: string;
  registrationTitle: string;
  registrationAria: string;
  rowActionsAria: (name: string) => string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
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

const DESKTOP_CLIENTS_COPY: Record<SupportedLocale, DesktopClientsCopy> = {
  es: {
    title: 'Clientes',
    searchPlaceholder: 'Buscar cliente o correo...',
    searchAria: 'Buscar clientes registrados',
    clearSearchAria: 'Limpiar búsqueda',
    listAria: 'Lista de clientes registrados',
    noMatches: 'No hay coincidencias con esa búsqueda.',
    registrationTitle: 'Registros',
    registrationAria: 'Formulario de registro de clientes',
    rowActionsAria: (name) => `Acciones para ${name}`,
    nameLabel: 'Escribe el apellido y nombre de tu cliente',
    namePlaceholder: 'Ej: Pérez Francisco',
    emailLabel: 'Pon el correo de tu cliente',
    emailPlaceholder: 'correo@ejemplo.com',
    phoneLabel: 'Pon su número de teléfono personal',
    phonePlaceholder: '+57 300 000 0000',
    countryLabel: 'Escribe el país',
    countryPlaceholder: 'Ej: Colombia',
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
    registrationTitle: 'Registration',
    registrationAria: 'Client registration form',
    rowActionsAria: (name) => `Actions for ${name}`,
    nameLabel: "Enter your client's last and first name",
    namePlaceholder: 'e.g. Smith John',
    emailLabel: "Enter your client's email",
    emailPlaceholder: 'email@example.com',
    phoneLabel: 'Enter their personal phone number',
    phonePlaceholder: '+1 555 000 0000',
    countryLabel: 'Write the country',
    countryPlaceholder: 'e.g. Colombia',
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
    registrationTitle: 'Registros',
    registrationAria: 'Formulário de cadastro de clientes',
    rowActionsAria: (name) => `Ações para ${name}`,
    nameLabel: 'Escreva o sobrenome e nome do seu cliente',
    namePlaceholder: 'Ex: Silva João',
    emailLabel: 'Coloque o e-mail do seu cliente',
    emailPlaceholder: 'email@exemplo.com',
    phoneLabel: 'Coloque o telefone pessoal dele',
    phonePlaceholder: '+55 11 90000 0000',
    countryLabel: 'Escreva o país',
    countryPlaceholder: 'Ex: Brasil',
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

export function AgencyDesktopClients({
  locale,
  clients = [],
  onRegisterClient,
}: AgencyDesktopClientsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryText, setCountryText] = useState('');
  const [expirationText, setExpirationText] = useState('');
  const [noExpiration, setNoExpiration] = useState(false);
  const [note, setNote] = useState('');

  const copy = DESKTOP_CLIENTS_COPY[locale] ?? DESKTOP_CLIENTS_COPY.es;

  const visibleClients = getVisibleAgencyClients(clients);
  const filteredClients = filterAgencyClients(visibleClients, searchQuery);

  const matchedCountry = useMemo(
    () => matchCommercialCountry(countryText),
    [countryText],
  );

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
    matchedCountry !== null &&
    isExpirationValid &&
    noteLen >= 30;

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setCountryText('');
    setExpirationText('');
    setNoExpiration(false);
    setNote('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormReady || !matchedCountry) return;

    const nowIso = new Date().toISOString();
    const record: AgencyClientRecord = {
      id: `cli_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      countryCode: matchedCountry.code,
      countryName: matchedCountry.name,
      timezone: matchedCountry.timezone,
      status: 'active',
      startDate: nowIso,
      endDate: noExpiration ? null : parsedExpiration,
      notes: note.trim(),
    };

    onRegisterClient?.(record);
    resetForm();
  };

  return (
    <div className="w-full h-full bg-white text-slate-950 grid grid-cols-2 overflow-hidden">
      {/* Left half: search bar + uniform hairline-divided client rows */}
      <section
        aria-label={copy.listAria}
        className="h-full min-w-0 border-r border-slate-200/85 pt-7 pb-8 flex flex-col overflow-hidden"
      >
        <div className="px-8 shrink-0">
          <h1 className="text-[18px] font-semibold text-slate-950 tracking-tight">
            {copy.title}
          </h1>

          <div className="mt-4">
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
                  className="w-6 h-6 -mr-1.5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex-1 min-h-0 overflow-y-auto">
          {filteredClients.length === 0 ? (
            <div className="px-8 py-12 text-center">
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
                    className="h-[52px] px-8 bg-white hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
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
                      className="w-8 h-8 -mr-1.5 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      <MoreHorizontal className="w-[18px] h-[18px]" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Right half: Registros form with country text recognition */}
      <section
        aria-label={copy.registrationAria}
        className="h-full min-w-0 px-8 pt-7 pb-10 pr-16 flex flex-col overflow-y-auto bg-white"
      >
        <h2 className="text-[18px] font-semibold text-slate-950 tracking-tight shrink-0">
          {copy.registrationTitle}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="mt-5 w-full max-w-[400px] flex flex-col gap-4"
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

          {/* 4. Escribe el país: turns blue immediately when recognized from top 50 countries */}
          <label className="block">
            <span className="block text-[12.5px] font-medium text-slate-700 mb-1.5 pl-1">
              {copy.countryLabel}
            </span>
            <div
              className={`flex items-center gap-2 h-10 px-4 rounded-full ${FIELD_SURFACE_CLASS} ${
                matchedCountry ? 'border-blue-300/90' : ''
              }`}
            >
              <input
                type="text"
                value={countryText}
                onChange={(e) => setCountryText(e.target.value)}
                placeholder={copy.countryPlaceholder}
                className={`flex-1 min-w-0 bg-transparent text-[13.5px] placeholder:text-slate-400 focus:outline-none ${
                  matchedCountry
                    ? 'text-blue-600 font-medium'
                    : 'text-slate-900'
                }`}
              />
              {matchedCountry && (
                <span
                  aria-label={matchedCountry.name}
                  title={matchedCountry.name}
                  className="text-[15px] leading-none shrink-0"
                >
                  {matchedCountry.flag}
                </span>
              )}
            </div>
          </label>

          {/* 5. Fecha de vencimiento + No agregar fecha de vencimiento */}
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
                    className="w-6 h-6 -mr-1.5 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
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
            <div className="pt-1">
              <button
                type="submit"
                className="h-9 px-5 rounded-full bg-[#25D366] hover:bg-[#1FB858] text-white text-[13px] font-semibold shadow-[0_6px_16px_-6px_rgba(37,211,102,0.7)] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128C7E]"
              >
                {copy.registerSubmit}
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
