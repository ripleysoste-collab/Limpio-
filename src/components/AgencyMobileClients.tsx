import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import type { SupportedLocale } from '../lib/i18n';

interface AgencyMobileClientsProps {
  locale: SupportedLocale;
  onAddClient?: () => void;
}

interface MobileClientsCopy {
  title: string;
  searchPlaceholder: string;
  searchAria: string;
  clearSearchAria: string;
  listAria: string;
  emptyState: string;
  addClientAria: string;
}

const MOBILE_CLIENTS_COPY: Record<SupportedLocale, MobileClientsCopy> = {
  es: {
    title: 'Clientes',
    searchPlaceholder: 'Buscar cliente, negocio o correo...',
    searchAria: 'Buscar clientes registrados',
    clearSearchAria: 'Limpiar búsqueda',
    listAria: 'Lista de clientes registrados',
    emptyState: 'Aún no hay clientes registrados.',
    addClientAria: 'Agregar cliente',
  },
  en: {
    title: 'Clients',
    searchPlaceholder: 'Search client, business, or email...',
    searchAria: 'Search registered clients',
    clearSearchAria: 'Clear search',
    listAria: 'Registered clients list',
    emptyState: 'No clients registered yet.',
    addClientAria: 'Add client',
  },
  pt: {
    title: 'Clientes',
    searchPlaceholder: 'Buscar cliente, negócio ou e-mail...',
    searchAria: 'Buscar clientes cadastrados',
    clearSearchAria: 'Limpar busca',
    listAria: 'Lista de clientes cadastrados',
    emptyState: 'Ainda não há clientes cadastrados.',
    addClientAria: 'Adicionar cliente',
  },
};

export function AgencyMobileClients({
  locale,
  onAddClient,
}: AgencyMobileClientsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const copy = MOBILE_CLIENTS_COPY[locale] ?? MOBILE_CLIENTS_COPY.es;

  return (
    <div className="relative min-h-full bg-white text-slate-950 px-4 pt-4 pb-24 flex flex-col">
      <h2 className="text-[18px] font-semibold text-slate-950 tracking-tight">
        {copy.title}
      </h2>

      {/* Clean pure-white rounded search bar directly below Clientes title */}
      <div className="mt-3.5">
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
              className="w-6 h-6 -mr-1.5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 active:bg-slate-100 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Vertical stack container directly below search input for client rows */}
      <section aria-label={copy.listAria} className="mt-4 flex-1 flex flex-col">
        <div className="py-10 text-center">
          <p className="text-[13px] text-slate-400">{copy.emptyState}</p>
        </div>
      </section>

      {/* Compact WhatsApp-green floating + button anchored bottom-right */}
      <button
        type="button"
        onClick={onAddClient}
        aria-label={copy.addClientAria}
        title={copy.addClientAria}
        className="fixed bottom-5 right-4 z-20 lg:hidden w-11 h-11 rounded-full bg-[#25D366] active:bg-[#1FB858] text-white shadow-[0_8px_22px_-6px_rgba(37,211,102,0.65)] flex items-center justify-center cursor-pointer transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128C7E]"
      >
        <Plus className="w-5 h-5 stroke-[2.25]" aria-hidden="true" />
      </button>
    </div>
  );
}
