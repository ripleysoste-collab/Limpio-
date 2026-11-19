import { useState } from 'react';
import { MoreHorizontal, Plus, Search, X } from 'lucide-react';
import {
  CLIENT_STATUS_STYLE,
  filterAgencyClients,
  getVisibleAgencyClients,
  type AgencyClientRecord,
} from '../lib/agencyClients';
import type { SupportedLocale } from '../lib/i18n';

interface AgencyMobileClientsProps {
  locale: SupportedLocale;
  clients?: AgencyClientRecord[];
  onAddClient?: () => void;
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
}

const MOBILE_CLIENTS_COPY: Record<SupportedLocale, MobileClientsCopy> = {
  es: {
    title: 'Clientes',
    searchPlaceholder: 'Buscar cliente, negocio o correo...',
    searchAria: 'Buscar clientes registrados',
    clearSearchAria: 'Limpiar búsqueda',
    listAria: 'Lista de clientes registrados',
    noMatches: 'No hay coincidencias con esa búsqueda.',
    addClientAria: 'Agregar cliente',
    rowActionsAria: (name) => `Acciones para ${name}`,
  },
  en: {
    title: 'Clients',
    searchPlaceholder: 'Search client, business, or email...',
    searchAria: 'Search registered clients',
    clearSearchAria: 'Clear search',
    listAria: 'Registered clients list',
    noMatches: 'No clients match your search.',
    addClientAria: 'Add client',
    rowActionsAria: (name) => `Actions for ${name}`,
  },
  pt: {
    title: 'Clientes',
    searchPlaceholder: 'Buscar cliente, negócio ou e-mail...',
    searchAria: 'Buscar clientes cadastrados',
    clearSearchAria: 'Limpar busca',
    listAria: 'Lista de clientes cadastrados',
    noMatches: 'Nenhum cliente corresponde à busca.',
    addClientAria: 'Adicionar cliente',
    rowActionsAria: (name) => `Ações para ${name}`,
  },
};

export function AgencyMobileClients({
  locale,
  clients = [],
  onAddClient,
}: AgencyMobileClientsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const copy = MOBILE_CLIENTS_COPY[locale] ?? MOBILE_CLIENTS_COPY.es;

  const visibleClients = getVisibleAgencyClients(clients);
  const filteredClients = filterAgencyClients(visibleClients, searchQuery);

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
