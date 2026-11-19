import { Bot, Mail, Phone, Smartphone, Trash2 } from 'lucide-react';
import {
  CLIENT_STATUS_STYLE,
  formatAgencyDateDisplay,
  type AgencyClientRecord,
} from '../lib/agencyClients';
import { TOP_50_COMMERCIAL_COUNTRIES } from '../lib/agencyCountries';
import type { SupportedLocale } from '../lib/i18n';

interface AgencyClientDetailPanelProps {
  client: AgencyClientRecord;
  locale: SupportedLocale;
  onRequestDelete: (client: AgencyClientRecord) => void;
}

interface DetailCopy {
  activeBotsLabel: string;
  botPhoneLabel: string;
  unassignedBotPhone: string;
  emailLabel: string;
  personalPhoneLabel: string;
  countryTimezoneLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  noExpirationValue: string;
  noteLabel: string;
  noNoteValue: string;
  deleteButton: string;
}

const DETAIL_COPY: Record<SupportedLocale, DetailCopy> = {
  es: {
    activeBotsLabel: 'Bots activos',
    botPhoneLabel: 'Número de teléfono del bot',
    unassignedBotPhone: 'Pendiente por asignar en Bots',
    emailLabel: 'Correo electrónico',
    personalPhoneLabel: 'Teléfono personal',
    countryTimezoneLabel: 'País y zona horaria',
    startDateLabel: 'Inicio del servicio',
    endDateLabel: 'Fecha de vencimiento',
    noExpirationValue: 'Sin fecha de vencimiento',
    noteLabel: 'Nota',
    noNoteValue: 'Sin nota registrada.',
    deleteButton: 'Eliminar',
  },
  en: {
    activeBotsLabel: 'Active bots',
    botPhoneLabel: 'Bot phone number',
    unassignedBotPhone: 'Pending assignment in Bots',
    emailLabel: 'Email address',
    personalPhoneLabel: 'Personal phone',
    countryTimezoneLabel: 'Country & timezone',
    startDateLabel: 'Service started',
    endDateLabel: 'Expiration date',
    noExpirationValue: 'No expiration date',
    noteLabel: 'Note',
    noNoteValue: 'No note recorded.',
    deleteButton: 'Delete',
  },
  pt: {
    activeBotsLabel: 'Bots ativos',
    botPhoneLabel: 'Número de telefone do bot',
    unassignedBotPhone: 'Pendente de atribuição em Bots',
    emailLabel: 'E-mail',
    personalPhoneLabel: 'Telefone pessoal',
    countryTimezoneLabel: 'País e fuso horário',
    startDateLabel: 'Início do serviço',
    endDateLabel: 'Data de vencimento',
    noExpirationValue: 'Sem data de vencimento',
    noteLabel: 'Nota',
    noNoteValue: 'Nenhuma nota registrada.',
    deleteButton: 'Excluir',
  },
};

export function AgencyClientDetailPanel({
  client,
  locale,
  onRequestDelete,
}: AgencyClientDetailPanelProps) {
  const copy = DETAIL_COPY[locale] ?? DETAIL_COPY.es;
  const statusMeta = CLIENT_STATUS_STYLE[client.status];
  const statusLabel = statusMeta.labels[locale] ?? statusMeta.labels.es;
  const activeBotsCount = client.activeBotsCount ?? 0;

  const countryInfo = client.countryCode
    ? TOP_50_COMMERCIAL_COUNTRIES.find((c) => c.code === client.countryCode)
    : undefined;
  const countryDisplay = [
    countryInfo?.flag,
    client.countryName || client.countryCode,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Top metric row: Active bots count + current status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200/85 bg-white px-4 py-3.5 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-medium text-slate-400">
              {copy.activeBotsLabel}
            </span>
            <Bot className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          </div>
          <p className="mt-1 text-[22px] font-semibold text-slate-950 tracking-tight tabular-nums leading-none">
            {activeBotsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/85 bg-white px-4 py-3.5 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between">
          <span className="text-[11.5px] font-medium text-slate-400">
            {statusLabel}
          </span>
          <div className="mt-1.5 flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={`w-4 h-4 rounded-[4px] shrink-0 ${statusMeta.squareClass}`}
            />
            <span className="text-[14px] font-medium text-slate-900 truncate">
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Main contact & bot connection details */}
      <div className="rounded-2xl border border-slate-200/85 bg-white shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] divide-y divide-slate-100">
        <div className="px-4 py-3 flex items-start gap-3">
          <Smartphone
            className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400">
              {copy.botPhoneLabel}
            </p>
            <p
              className={`mt-0.5 text-[13.5px] tabular-nums ${
                client.botPhone?.trim()
                  ? 'text-slate-950 font-medium'
                  : 'text-slate-400'
              }`}
            >
              {client.botPhone?.trim()
                ? client.botPhone
                : copy.unassignedBotPhone}
            </p>
          </div>
        </div>

        <div className="px-4 py-3 flex items-start gap-3">
          <Mail
            className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400">
              {copy.emailLabel}
            </p>
            <p className="mt-0.5 text-[13.5px] text-slate-900 break-all">
              {client.email}
            </p>
          </div>
        </div>

        <div className="px-4 py-3 flex items-start gap-3">
          <Phone
            className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400">
              {copy.personalPhoneLabel}
            </p>
            <p className="mt-0.5 text-[13.5px] text-slate-900 tabular-nums">
              {client.phone}
            </p>
          </div>
        </div>

        <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-medium text-slate-400">
              {copy.countryTimezoneLabel}
            </p>
            <p className="mt-0.5 text-[13px] text-slate-800">
              {countryDisplay ? `${countryDisplay} · ` : ''}
              {client.timezone}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] font-medium text-slate-400">
                {copy.startDateLabel}
              </p>
              <p className="mt-0.5 text-[12.5px] text-slate-800 tabular-nums">
                {formatAgencyDateDisplay(client.startDate, client.timezone)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">
                {copy.endDateLabel}
              </p>
              <p className="mt-0.5 text-[12.5px] text-slate-800 tabular-nums">
                {client.endDate
                  ? formatAgencyDateDisplay(client.endDate, client.timezone)
                  : copy.noExpirationValue}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Client note */}
      <div className="rounded-2xl border border-slate-200/85 bg-white px-4 py-3.5 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-medium text-slate-400">
          {copy.noteLabel}
        </p>
        <p className="mt-1 text-[13px] text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
          {client.notes?.trim() ? client.notes : copy.noNoteValue}
        </p>
      </div>

      {/* Bottom delete action ("abajo a lo último, muestra para eliminar") */}
      <div className="mt-auto pt-4 border-t border-slate-200/80 flex items-center justify-start">
        <button
          type="button"
          onClick={() => onRequestDelete(client)}
          className="h-9 px-4 rounded-full border border-rose-200 bg-rose-50/75 text-rose-600 hover:bg-rose-100/80 active:bg-rose-100 text-[12.5px] font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{copy.deleteButton}</span>
        </button>
      </div>
    </div>
  );
}
