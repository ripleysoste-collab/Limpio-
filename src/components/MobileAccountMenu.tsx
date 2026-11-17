import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { User } from '@supabase/supabase-js';
import { Calendar, Loader2, Mail, User as UserIcon, X } from 'lucide-react';

interface MobileAccountMenuProps {
  menuOpen: boolean;
  accountModalOpen: boolean;
  panelOpen: boolean;
  user: User;
  onCloseMenu: () => void;
  onOpenAccountModal: () => void;
  onCloseAccountModal: () => void;
  onOpenPanel: () => void;
  onClosePanel: () => void;
  onSignOut: () => Promise<void>;
}

function formatCreationDateEs(isoDate?: string): string {
  if (!isoDate) return 'Fecha no disponible';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function getUserDisplayInfo(user: User) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    user.email?.split('@')[0] ||
    'Usuario';
  const photoUrl =
    (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) ||
    (typeof meta.picture === 'string' && meta.picture.trim()) ||
    null;

  return {
    fullName,
    email: user.email || '',
    photoUrl,
    createdAtFormatted: formatCreationDateEs(user.created_at),
    initialLetter: fullName.trim().charAt(0).toUpperCase() || 'U',
  };
}

export function MobileAccountMenu({
  menuOpen,
  accountModalOpen,
  panelOpen,
  user,
  onCloseMenu,
  onOpenAccountModal,
  onCloseAccountModal,
  onOpenPanel,
  onClosePanel,
  onSignOut,
}: MobileAccountMenuProps) {
  const shouldReduceMotion = useReducedMotion();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const info = getUserDisplayInfo(user);

  useEffect(() => {
    setImgFailed(false);
  }, [info.photoUrl]);

  useEffect(() => {
    if (!accountModalOpen) {
      setConfirmSignOut(false);
      setSigningOut(false);
      setSignOutError(null);
    }
  }, [accountModalOpen]);

  const handleConfirmSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await onSignOut();
    } catch {
      setSignOutError('No pudimos cerrar la sesión. Intenta de nuevo.');
      setSigningOut(false);
    }
  };

  return (
    <>
      {/* 1. Mobile right slide-in slim menu with dimmed backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Dimmed backdrop — tap outside to close */}
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
              onClick={onCloseMenu}
              className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            />

            {/* Slim comfortable right drawer */}
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Menú de cuenta"
              initial={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
              animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
              }
              className="absolute top-0 right-0 bottom-0 w-[62%] max-w-[248px] min-w-[208px] bg-white/96 backdrop-blur-xl border-l border-slate-200/85 shadow-[-14px_0_38px_-14px_rgba(15,23,42,0.28)] flex flex-col"
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-3.5 border-b border-slate-200/75 shrink-0">
                <span className="text-sm font-semibold tracking-tight text-slate-950">
                  Cuenta
                </span>
                <button
                  type="button"
                  onClick={onCloseMenu}
                  aria-label="Cerrar menú"
                  className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100/90 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Opciones de cuenta" className="flex-1 overflow-y-auto px-4 py-3">
                <ul className="divide-y divide-slate-200/75">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        onOpenAccountModal();
                      }}
                      className="w-full py-3 text-left text-[14px] font-medium text-slate-800 hover:text-slate-950 transition-colors cursor-pointer"
                    >
                      Tu cuenta de Google
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        onOpenPanel();
                      }}
                      className="w-full py-3 text-left text-[14px] font-medium text-slate-800 hover:text-slate-950 transition-colors cursor-pointer"
                    >
                      Panel
                    </button>
                  </li>
                </ul>
              </nav>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Mobile centered compact Google Account modal */}
      <AnimatePresence>
        {accountModalOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex items-center justify-center p-5">
            {/* Dimmed backdrop */}
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              onClick={() => {
                if (!signingOut) onCloseAccountModal();
              }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            />

            {/* Centered compact card */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Detalles de tu cuenta de Google"
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }
              }
              animate={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
              }
              exit={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
              }
              className="relative w-full max-w-[336px] rounded-3xl bg-white/96 backdrop-blur-xl border border-slate-200/90 shadow-[0_24px_60px_-16px_rgba(15,23,42,0.3)] overflow-visible"
            >
              {/* Modal top bar */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-slate-200/75">
                <span className="text-sm font-semibold tracking-tight text-slate-950">
                  Tu cuenta de Google
                </span>
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={onCloseAccountModal}
                  aria-label="Cerrar detalles de cuenta"
                  className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Account summary + details */}
              <div className="px-5 py-4 space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full border border-slate-200/90 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    {info.photoUrl && !imgFailed ? (
                      <img
                        src={info.photoUrl}
                        alt={info.fullName}
                        referrerPolicy="no-referrer"
                        onError={() => setImgFailed(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-semibold text-slate-800">
                        {info.initialLetter}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-slate-950 truncate">
                      {info.fullName}
                    </p>
                    {info.email && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {info.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/75 divide-y divide-slate-200/70">
                  <div className="px-3.5 py-2.5 flex items-start gap-2.5">
                    <UserIcon
                      className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-slate-400">
                        Nombre de usuario
                      </p>
                      <p className="text-xs font-medium text-slate-900 mt-0.5 break-words">
                        {info.fullName}
                      </p>
                    </div>
                  </div>

                  {info.email && (
                    <div className="px-3.5 py-2.5 flex items-start gap-2.5">
                      <Mail
                        className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-slate-400">
                          Cuenta de Google
                        </p>
                        <p className="text-xs font-medium text-slate-900 mt-0.5 break-all">
                          {info.email}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="px-3.5 py-2.5 flex items-start gap-2.5">
                    <Calendar
                      className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-slate-400">
                        Fecha de creación
                      </p>
                      <p className="text-xs font-medium text-slate-900 mt-0.5">
                        Cuenta creada el {info.createdAtFormatted}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Sign Out + small confirmation dialog right above */}
              <div className="px-5 pt-3 pb-4 border-t border-slate-200/75 relative">
                <AnimatePresence>
                  {confirmSignOut && (
                    <motion.div
                      role="alertdialog"
                      aria-label="Confirmar cierre de sesión"
                      initial={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 8, scale: 0.96 }
                      }
                      animate={
                        shouldReduceMotion
                          ? { opacity: 1 }
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      exit={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 6, scale: 0.96 }
                      }
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      className="mb-3 rounded-2xl border border-slate-200/95 bg-white p-3.5 shadow-[0_14px_32px_-10px_rgba(15,23,42,0.22)]"
                    >
                      <p className="text-xs font-medium text-slate-900">
                        ¿Estás seguro que quieres cerrar cuenta?
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tendrás que volver a iniciar sesión con Google.
                      </p>

                      {signOutError && (
                        <p className="text-[11px] text-rose-600 mt-1.5">{signOutError}</p>
                      )}

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={signingOut}
                          onClick={() => {
                            setConfirmSignOut(false);
                            setSignOutError(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={signingOut}
                          onClick={() => void handleConfirmSignOut()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {signingOut && (
                            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                          )}
                          Aceptar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => {
                    setSignOutError(null);
                    setConfirmSignOut((prev) => !prev);
                  }}
                  className="text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  Cerrar cuenta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Mobile full-screen Panel view with top-right X to exit */}
      <AnimatePresence>
        {panelOpen && (
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Panel"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 lg:hidden bg-white flex flex-col"
          >
            <header className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-slate-200/80 shrink-0">
              <span className="text-base font-semibold tracking-tight text-slate-950">
                Panel
              </span>
              <button
                type="button"
                onClick={onClosePanel}
                aria-label="Cerrar panel"
                className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100/90 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </header>

            <div className="flex-1 flex items-center justify-center px-6 py-10">
              <p className="text-sm font-medium text-slate-400 tracking-tight">
                En creación
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
