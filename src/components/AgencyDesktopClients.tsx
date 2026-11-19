import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { SupportedLocale } from '../lib/i18n';

interface AgencyDesktopClientsProps {
  locale: SupportedLocale;
}

interface DesktopClientsCopy {
  title: string;
  searchPlaceholder: string;
  searchAria: string;
  clearSearchAria: string;
  listAria: string;
  emptyRecords: string;
  registrationTitle: string;
  registrationAria: string;
}

const DESKTOP_CLIENTS_COPY: Record<SupportedLocale, DesktopClientsCopy> = {
  es: {
    title: 'Clientes',
    searchPlaceholder: 'Buscar cliente, negocio o correo...',
    searchAria: 'Buscar clientes registrados',
    clearSearchAria: 'Limpiar búsqueda',
    listAria: 'Lista de clientes registrados',
    emptyRecords: 'Todavía no hay registros',
    registrationTitle: 'Registros',
    registrationAria: 'Formulario de registro de clientes',
  },
  en: {
    title: 'Clients',
    searchPlaceholder: 'Search client, business, or email...',
    searchAria: 'Search registered clients',
    clearSearchAria: 'Clear search',
    listAria: 'Registered clients list',
    emptyRecords: 'No records yet',
    registrationTitle: 'Registration',
    registrationAria: 'Client registration form',
  },
  pt: {
    title: 'Clientes',
    searchPlaceholder: 'Buscar cliente, negócio ou e-mail...',
    searchAria: 'Buscar clientes cadastrados',
    clearSearchAria: 'Limpar busca',
    listAria: 'Lista de clientes cadastrados',
    emptyRecords: 'Ainda não há registros',
    registrationTitle: 'Registros',
    registrationAria: 'Formulário de cadastro de clientes',
  },
};

export function AgencyDesktopClients({ locale }: AgencyDesktopClientsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const copy = DESKTOP_CLIENTS_COPY[locale] ?? DESKTOP_CLIENTS_COPY.es;

  return (
    <div className="w-full h-full bg-white text-slate-950 grid grid-cols-2 overflow-hidden">
      {/* Left half: search bar + stacked clients list area */}
      <section
        aria-label={copy.listAria}
        className="h-full min-w-0 border-r border-slate-200/85 px-8 pt-7 pb-8 flex flex-col overflow-hidden"
      >
        <h1 className="text-[18px] font-semibold text-slate-950 tracking-tight shrink-0">
          {copy.title}
        </h1>

        <div className="mt-4 shrink-0">
          <div className="group flex items-center gap-2.5 h-11 px-4 rounded-full bg-white border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-slate-400 focus-within:shadow-[0_6px_20px_-6px_rgba(15,23,42,0.13)] transition-all duration-150">
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

        <div className="mt-6 flex-1 min-h-0 overflow-y-auto flex items-start justify-center pt-10">
          <p className="text-[13px] text-slate-400">{copy.emptyRecords}</p>
        </div>
      </section>

      {/* Right half: Registros workspace ready for the registration form */}
      <section
        aria-label={copy.registrationAria}
        className="h-full min-w-0 px-8 pt-7 pb-8 pr-16 flex flex-col overflow-y-auto bg-white"
      >
        <h2 className="text-[16px] font-semibold text-slate-950 tracking-tight shrink-0">
          {copy.registrationTitle}
        </h2>
      </section>
    </div>
  );
}
