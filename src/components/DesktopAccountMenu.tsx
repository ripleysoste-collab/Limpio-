import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

interface DesktopAccountMenuProps {
  open: boolean;
  onClose: () => void;
}

export function DesktopAccountMenu({ open, onClose }: DesktopAccountMenuProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          aria-label="Menú de cuenta"
          initial={shouldReduceMotion ? { opacity: 0 } : { width: 0, opacity: 0.9 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { width: '25%', opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { width: 0, opacity: 0.9 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.36, ease: [0.22, 1, 0.36, 1] }
          }
          className="hidden lg:block shrink-0 h-dvh sticky top-0 overflow-hidden z-20"
        >
          <div className="w-[25vw] min-w-[270px] h-full bg-white/95 backdrop-blur-xl border-l border-slate-200/85 shadow-[-14px_0_40px_-18px_rgba(15,23,42,0.22)] flex flex-col">
            {/* Top bar: Menú title + X close button */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-200/75 shrink-0">
              <span className="text-sm font-semibold tracking-tight text-slate-950">
                Cuenta
              </span>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar menú"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100/90 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Vertical menu items list (stacked cleanly one under another) */}
            <nav aria-label="Opciones de cuenta" className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="divide-y divide-slate-200/75">
                <li>
                  <button
                    type="button"
                    className="w-full py-3 text-left text-[14px] font-medium text-slate-800 hover:text-slate-950 transition-colors duration-150 focus-visible:outline-none focus-visible:text-slate-950 cursor-pointer"
                  >
                    Tu cuenta de Google
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
