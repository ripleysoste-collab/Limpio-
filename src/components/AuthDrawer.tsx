import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Eye, EyeOff, Lock, Mail, X } from 'lucide-react';
import { SearchLinkLogo } from './SearchLinkLogo';

interface AuthDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AuthDrawer({ open, onClose }: AuthDrawerProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  );
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const panelInitial = shouldReduceMotion
    ? { opacity: 0 }
    : isDesktop
      ? { x: '100%' }
      : { y: '100%' };

  const panelAnimate = shouldReduceMotion
    ? { opacity: 1 }
    : isDesktop
      ? { x: 0 }
      : { y: 0 };

  const panelExit = shouldReduceMotion
    ? { opacity: 0 }
    : isDesktop
      ? { x: '100%' }
      : { y: '100%' };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-stretch lg:justify-end">
          {/* Blurred backdrop covering the left half on desktop and top strip on mobile */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
          />

          {/* Responsive white registration surface: bottom sheet on mobile, right half-screen on desktop */}
          <motion.section
            key={isDesktop ? 'desktop-auth-panel' : 'mobile-auth-sheet'}
            role="dialog"
            aria-modal="true"
            aria-label="Crea tu cuenta en Search Link"
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.36, ease: [0.22, 1, 0.36, 1] }
            }
            className="relative z-10 w-full h-[90dvh] rounded-t-[28px] lg:rounded-none lg:w-1/2 lg:h-full bg-white shadow-[0_-18px_60px_-12px_rgba(15,23,42,0.38)] lg:shadow-[-24px_0_80px_-16px_rgba(15,23,42,0.35)] border-t border-slate-200/80 lg:border-t-0 lg:border-l flex flex-col overflow-y-auto"
          >
            {/* Subtle architectural dot pattern behind the white registration surface */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(15, 23, 42, 0.11) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                maskImage:
                  'radial-gradient(ellipse 85% 80% at 50% 45%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,0.25) 100%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 85% 80% at 50% 45%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,0.25) 100%)',
              }}
            />

            {/* Mobile sheet handle for immediate visual comfort */}
            <div className="relative z-10 flex justify-center pt-3 pb-1 lg:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200" aria-hidden="true" />
            </div>

            {/* Top bar inside the registration interface */}
            <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 lg:px-10 pt-3 lg:pt-6 pb-3 shrink-0">
              <SearchLinkLogo size="sm" onDarkBackground={false} />

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar registro"
                className="w-10 h-10 lg:w-9 lg:h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <X className="w-4.5 h-4.5" aria-hidden="true" />
              </button>
            </div>

            {/* Centered registration form content */}
            <div className="relative z-10 flex-1 flex items-start sm:items-center justify-center px-6 sm:px-10 lg:px-12 pt-4 pb-10 sm:py-8">
              <div className="w-full max-w-[390px]">
                <div className="mb-6 lg:mb-7">
                  <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-slate-950 text-balance">
                    Crea tu cuenta en Search Link
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                    Guarda tus enlaces limpios y personaliza tu espacio.
                  </p>
                </div>

                {/* Rounded Google provider input-style control */}
                <button
                  type="button"
                  onClick={() => {}}
                  className="w-full h-12 rounded-full bg-white border border-slate-200/95 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] hover:border-slate-300 hover:bg-slate-50/80 px-5 flex items-center justify-center gap-3 text-[15px] font-medium text-slate-800 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <GoogleLogoIcon />
                  <span>Google</span>
                </button>

                {/* Clean hairline divider */}
                <div className="relative my-5 lg:my-6 flex items-center">
                  <div className="flex-1 border-t border-slate-200/90" />
                  <span className="px-3 text-xs font-medium text-slate-400 whitespace-nowrap">
                    o con tu correo y contraseña
                  </span>
                  <div className="flex-1 border-t border-slate-200/90" />
                </div>

                {/* Classic email & password registration UI */}
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="register-email"
                      className="block text-xs font-medium text-slate-600 mb-1.5 pl-1"
                    >
                      Correo electrónico
                    </label>
                    <div className="flex items-center gap-2.5 h-12 w-full rounded-full bg-white border border-slate-200/95 px-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200/70 transition-all duration-150">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                      <input
                        id="register-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nombre@correo.com"
                        className="flex-1 min-w-0 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="register-password"
                      className="block text-xs font-medium text-slate-600 mb-1.5 pl-1"
                    >
                      Contraseña
                    </label>
                    <div className="flex items-center gap-2.5 h-12 w-full rounded-full bg-white border border-slate-200/95 pl-4 pr-2.5 shadow-[0_1px_4px_rgba(15,23,42,0.03)] focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200/70 transition-all duration-150">
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                      <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Crea una contraseña"
                        className="flex-1 min-w-0 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? 'Ocultar contraseña' : 'Ver contraseña'
                        }
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 shrink-0"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 mt-1"
                  >
                    Crear cuenta
                  </button>
                </form>
              </div>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}

function GoogleLogoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.3 0 6.08-1.09 8.105-2.96l-3.88-3.05c-1.09.73-2.48 1.16-4.225 1.16-3.25 0-6.01-2.19-6.995-5.14H1.01v3.14C3.03 21.16 7.2 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.005 14.01a7.21 7.21 0 0 1 0-4.62V6.25H1.01a11.997 11.997 0 0 0 0 10.9l3.995-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.795 0 3.41.62 4.68 1.835l3.51-3.51C18.075 1.09 15.295 0 12 0 7.2 0 3.03 2.84 1.01 6.25l3.995 3.14c.985-2.95 3.745-5.14 6.995-5.14Z"
      />
    </svg>
  );
}
