import { useEffect, useRef } from 'react';
import { AlertTriangle, Eye, MoreHorizontal, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  CLIENT_STATUS_STYLE,
  formatAgencyDateDisplay,
  type AgencyClientRecord,
} from '../lib/agencyClients';
import type { SupportedLocale } from '../lib/i18n';

interface RowMenuCopy {
  menuAria: (name: string) => string;
  viewAction: string;
  statusAction: string;
  deleteAction: string;
  viewTitle: string;
  statusTitle: string;
  closeModalAria: string;
  emailField: string;
  phoneField: string;
  countryField: string;
  timezoneField: string;
  startDateField: string;
  endDateField: string;
  noExpirationValue: string;
  notesField: string;
  noNotesValue: string;
  statusLabelField: string;
  exampleTag: string;
  deleteConfirmTitle: string;
  deleteConfirmBody: string;
  cancelAction: string;
  acceptAction: string;
}

const ROW_MENU_COPY: Record<SupportedLocale, RowMenuCopy> = {
  es: {
    menuAria: (name) => `Opciones para ${name}`,
    viewAction: 'Ver',
    statusAction: 'Estado',
    deleteAction: 'Eliminar',
    viewTitle: 'Vista previa del cliente',
    statusTitle: 'Estado del producto',
    closeModalAria: 'Cerrar ventana',
    emailField: 'Correo electrónico',
    phoneField: 'Teléfono personal',
    countryField: 'País',
    timezoneField: 'Zona horaria',
    startDateField: 'Inicio del servicio',
    endDateField: 'Vencimiento',
    noExpirationValue: 'Sin fecha de vencimiento',
    notesField: 'Nota',
    noNotesValue: 'Sin nota registrada',
    statusLabelField: 'Estado actual',
    exampleTag: 'Ejemplo',
    deleteConfirmTitle: 'Confirmar eliminación',
    deleteConfirmBody:
      '¿Estás seguro? Consciente de las leyes de cumplimiento, si es justificado, procede.',
    cancelAction: 'Cancelar',
    acceptAction: 'Aceptar',
  },
  en: {
    menuAria: (name) => `Options for ${name}`,
    viewAction: 'View',
    statusAction: 'Status',
    deleteAction: 'Delete',
    viewTitle: 'Client preview',
    statusTitle: 'Product status',
    closeModalAria: 'Close modal',
    emailField: 'Email address',
    phoneField: 'Personal phone',
    countryField: 'Country',
    timezoneField: 'Timezone',
    startDateField: 'Service started',
    endDateField: 'Expiration',
    noExpirationValue: 'No expiration date',
    notesField: 'Note',
    noNotesValue: 'No note recorded',
    statusLabelField: 'Current status',
    exampleTag: 'Sample',
    deleteConfirmTitle: 'Confirm deletion',
    deleteConfirmBody:
      'Are you sure? Aware of compliance laws, if justified, proceed.',
    cancelAction: 'Cancel',
    acceptAction: 'Accept',
  },
  pt: {
    menuAria: (name) => `Opções para ${name}`,
    viewAction: 'Ver',
    statusAction: 'Status',
    deleteAction: 'Excluir',
    viewTitle: 'Prévia do cliente',
    statusTitle: 'Status do produto',
    closeModalAria: 'Fechar janela',
    emailField: 'E-mail',
    phoneField: 'Telefone pessoal',
    countryField: 'País',
    timezoneField: 'Fuso horário',
    startDateField: 'Início do serviço',
    endDateField: 'Vencimento',
    noExpirationValue: 'Sem data de vencimento',
    notesField: 'Nota',
    noNotesValue: 'Nenhuma nota registrada',
    statusLabelField: 'Status atual',
    exampleTag: 'Exemplo',
    deleteConfirmTitle: 'Confirmar exclusão',
    deleteConfirmBody:
      'Tem certeza? Ciente das leis de cumprimento, se for justificado, prossiga.',
    cancelAction: 'Cancelar',
    acceptAction: 'Aceitar',
  },
};

interface AgencyClientRowActionsTriggerProps {
  client: AgencyClientRecord;
  locale: SupportedLocale;
  isOpen: boolean;
  openUpward?: boolean;
  triggerAriaLabel: string;
  onToggle: () => void;
  onClose: () => void;
  onView: (client: AgencyClientRecord) => void;
  onViewStatus: (client: AgencyClientRecord) => void;
  onRequestDelete: (client: AgencyClientRecord) => void;
}

export function AgencyClientRowActionsTrigger({
  client,
  locale,
  isOpen,
  openUpward = false,
  triggerAriaLabel,
  onToggle,
  onClose,
  onView,
  onViewStatus,
  onRequestDelete,
}: AgencyClientRowActionsTriggerProps) {
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const copy = ROW_MENU_COPY[locale] ?? ROW_MENU_COPY.es;
  const statusMeta = CLIENT_STATUS_STYLE[client.status];
  const statusLabel = statusMeta.labels[locale] ?? statusMeta.labels.es;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const container = menuContainerRef.current;
      if (container && !container.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={menuContainerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={triggerAriaLabel}
        className={`w-8 h-8 -mr-1.5 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
          isOpen
            ? 'bg-slate-100 text-slate-950'
            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:bg-slate-100'
        }`}
      >
        <MoreHorizontal className="w-[18px] h-[18px]" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            aria-label={copy.menuAria(client.fullName)}
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: openUpward ? 4 : -4 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: openUpward ? 4 : -4 }
            }
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute right-0 w-56 rounded-2xl border border-slate-200/95 bg-white shadow-[0_18px_44px_-12px_rgba(15,23,42,0.24)] p-1.5 z-40 ${
              openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium text-slate-400 truncate">
              {client.fullName}
            </p>

            <ul className="divide-y divide-slate-100">
              {/* 1. Ver */}
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onClose();
                    onView(client);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-left hover:bg-slate-50 active:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium text-slate-800">
                    {copy.viewAction}
                  </span>
                  <Eye
                    className="w-3.5 h-3.5 text-slate-400 shrink-0"
                    aria-hidden="true"
                  />
                </button>
              </li>

              {/* 2. Estado actual del producto */}
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onClose();
                    onViewStatus(client);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-left hover:bg-slate-50 active:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium text-slate-800">
                    {copy.statusAction}
                  </span>
                  <span className="inline-flex items-center gap-1.5 shrink-0">
                    <span
                      aria-hidden="true"
                      className={`w-2.5 h-2.5 rounded-[3px] ${statusMeta.squareClass}`}
                    />
                    <span className="text-[11px] font-medium text-slate-500">
                      {statusLabel}
                    </span>
                  </span>
                </button>
              </li>

              {/* 3. Eliminar */}
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onClose();
                    onRequestDelete(client);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-left hover:bg-rose-50/70 active:bg-rose-50/80 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium text-rose-600">
                    {copy.deleteAction}
                  </span>
                  <Trash2
                    className="w-3.5 h-3.5 text-rose-500 shrink-0"
                    aria-hidden="true"
                  />
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AgencyClientActionModalsProps {
  locale: SupportedLocale;
  viewClient: AgencyClientRecord | null;
  statusClient: AgencyClientRecord | null;
  deleteConfirmClient: AgencyClientRecord | null;
  onCloseView: () => void;
  onCloseStatus: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: (client: AgencyClientRecord) => void;
}

export function AgencyClientActionModals({
  locale,
  viewClient,
  statusClient,
  deleteConfirmClient,
  onCloseView,
  onCloseStatus,
  onCancelDelete,
  onConfirmDelete,
}: AgencyClientActionModalsProps) {
  const shouldReduceMotion = useReducedMotion();
  const copy = ROW_MENU_COPY[locale] ?? ROW_MENU_COPY.es;

  const activeModalClient = viewClient ?? statusClient ?? deleteConfirmClient;

  useEffect(() => {
    if (!activeModalClient) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (deleteConfirmClient) onCancelDelete();
      else if (statusClient) onCloseStatus();
      else if (viewClient) onCloseView();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    activeModalClient,
    deleteConfirmClient,
    statusClient,
    viewClient,
    onCancelDelete,
    onCloseStatus,
    onCloseView,
  ]);

  return (
    <AnimatePresence>
      {/* 1. Ver (Client Preview Modal) */}
      {viewClient && (
        <motion.div
          key="client-view-modal"
          role="dialog"
          aria-modal="true"
          aria-label={copy.viewTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCloseView}
          className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }
            }
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200/95 bg-white shadow-[0_22px_50px_-14px_rgba(15,23,42,0.28)] overflow-hidden"
          >
            <header className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={`w-3.5 h-3.5 rounded-[4px] shrink-0 ${
                    CLIENT_STATUS_STYLE[viewClient.status].squareClass
                  }`}
                />
                <h3 className="text-[14.5px] font-semibold text-slate-950 truncate">
                  {viewClient.fullName}
                </h3>
                {viewClient.isExample && (
                  <span className="text-[10.5px] font-medium text-slate-400 shrink-0">
                    · {copy.exampleTag}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onCloseView}
                aria-label={copy.closeModalAria}
                className="w-8 h-8 -mr-1.5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </header>

            <div className="px-5 py-4 space-y-3 text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">
                    {copy.statusLabelField}
                  </p>
                  <p className="mt-0.5 font-medium text-slate-900">
                    {CLIENT_STATUS_STYLE[viewClient.status].labels[locale] ??
                      CLIENT_STATUS_STYLE[viewClient.status].labels.es}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-400">
                    {copy.countryField}
                  </p>
                  <p className="mt-0.5 text-slate-800">
                    {viewClient.countryName || viewClient.countryCode || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-400">
                    {copy.emailField}
                  </p>
                  <p className="mt-0.5 text-slate-800 break-all">
                    {viewClient.email}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-400">
                    {copy.phoneField}
                  </p>
                  <p className="mt-0.5 text-slate-800 tabular-nums">
                    {viewClient.phone}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-400">
                    {copy.startDateField}
                  </p>
                  <p className="mt-0.5 text-slate-800 tabular-nums">
                    {formatAgencyDateDisplay(
                      viewClient.startDate,
                      viewClient.timezone,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-400">
                    {copy.endDateField}
                  </p>
                  <p className="mt-0.5 text-slate-800 tabular-nums">
                    {viewClient.endDate
                      ? formatAgencyDateDisplay(
                          viewClient.endDate,
                          viewClient.timezone,
                        )
                      : copy.noExpirationValue}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-medium text-slate-400">
                  {copy.timezoneField}
                </p>
                <p className="mt-0.5 text-slate-700">{viewClient.timezone}</p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-medium text-slate-400">
                  {copy.notesField}
                </p>
                <p className="mt-0.5 text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                  {viewClient.notes?.trim()
                    ? viewClient.notes
                    : copy.noNotesValue}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 2. Estado (Product Status Modal) */}
      {statusClient && (
        <motion.div
          key="client-status-modal"
          role="dialog"
          aria-modal="true"
          aria-label={copy.statusTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCloseStatus}
          className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }
            }
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl border border-slate-200/95 bg-white shadow-[0_22px_50px_-14px_rgba(15,23,42,0.28)] overflow-hidden"
          >
            <header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[13.5px] font-semibold text-slate-950 truncate">
                {copy.statusTitle}
              </span>
              <button
                type="button"
                onClick={onCloseStatus}
                aria-label={copy.closeModalAria}
                className="w-7 h-7 -mr-1 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </header>

            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`w-5 h-5 rounded-[6px] shrink-0 ${
                    CLIENT_STATUS_STYLE[statusClient.status].squareClass
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-950 leading-tight">
                    {CLIENT_STATUS_STYLE[statusClient.status].labels[locale] ??
                      CLIENT_STATUS_STYLE[statusClient.status].labels.es}
                  </p>
                  <p className="text-[12px] text-slate-500 truncate mt-0.5">
                    {statusClient.fullName}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2.5 text-[12px]">
                <div>
                  <p className="text-[10.5px] font-medium text-slate-400">
                    {copy.startDateField}
                  </p>
                  <p className="mt-0.5 text-slate-800 tabular-nums">
                    {formatAgencyDateDisplay(
                      statusClient.startDate,
                      statusClient.timezone,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] font-medium text-slate-400">
                    {copy.endDateField}
                  </p>
                  <p className="mt-0.5 text-slate-800 tabular-nums">
                    {statusClient.endDate
                      ? formatAgencyDateDisplay(
                          statusClient.endDate,
                          statusClient.timezone,
                        )
                      : copy.noExpirationValue}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 3. Eliminar (Compliance Confirmation Box) */}
      {deleteConfirmClient && (
        <motion.div
          key="client-delete-confirm-modal"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="agency-delete-title"
          aria-describedby="agency-delete-desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancelDelete}
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 6 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 6 }
            }
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-slate-200/95 bg-white shadow-[0_24px_54px_-12px_rgba(15,23,42,0.3)] p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-4.5 h-4.5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3
                  id="agency-delete-title"
                  className="text-[14.5px] font-semibold text-slate-950"
                >
                  {copy.deleteConfirmTitle}
                </h3>
                <p className="mt-0.5 text-[12px] font-medium text-slate-500 truncate">
                  {deleteConfirmClient.fullName}
                </p>
              </div>
            </div>

            <p
              id="agency-delete-desc"
              className="mt-3.5 text-[13px] text-slate-700 leading-relaxed"
            >
              {copy.deleteConfirmBody}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancelDelete}
                className="h-9 px-4 rounded-full border border-slate-200 bg-white text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors"
              >
                {copy.cancelAction}
              </button>
              <button
                type="button"
                onClick={() => onConfirmDelete(deleteConfirmClient)}
                className="h-9 px-4 rounded-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-[12.5px] font-semibold shadow-[0_6px_16px_-6px_rgba(225,29,72,0.65)] cursor-pointer transition-colors"
              >
                {copy.acceptAction}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
