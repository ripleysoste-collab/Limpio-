import { useEffect, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link2, X } from 'lucide-react';
import desktopExecutivesBg from './assets/images/bg_executives_desktop_1794778300480.jpg';
import { AuthDrawer } from './components/AuthDrawer';
import { DualCatalogShowcase } from './components/DualCatalogShowcase';
import { MobileCatalogCarousel } from './components/MobileCatalogCarousel';
import { SearchLinkLogo } from './components/SearchLinkLogo';
import { CATALOG_SAMPLE_IMAGES, type CatalogImageItem } from './data/catalogSamples';

export default function App() {
  const [url, setUrl] = useState('');
  const [activeBgImage, setActiveBgImage] = useState<CatalogImageItem | null>(null);
  const [hasAnimatedFirstBg, setHasAnimatedFirstBg] = useState(false);
  const [shouldAnimateBgEntry, setShouldAnimateBgEntry] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isAuthOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsAuthOpen(false);
        return;
      }

      if (
        event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        event.key.toLowerCase() === 'x'
      ) {
        event.preventDefault();
        setIsAuthOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setUrl(trimmed);
  };

  const handleSelectBackground = (item: CatalogImageItem) => {
    if (!hasAnimatedFirstBg) {
      setShouldAnimateBgEntry(true);
      setHasAnimatedFirstBg(true);
    } else {
      setShouldAnimateBgEntry(false);
    }
    setActiveBgImage(item);
  };

  return (
    <main className="bg-white lg:bg-[#0e1013] relative min-h-dvh w-full overflow-hidden flex flex-col items-center px-4 sm:px-5 lg:px-6 pt-3.5 sm:pt-4 lg:pt-5 pb-6 lg:pb-8">
      {/* Mobile-only full-screen natural luminous backdrop with gentle living color movement */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none fixed inset-0 z-0 overflow-hidden lg:hidden"
        style={{
          background:
            'linear-gradient(160deg, #eef6ff 0%, #f8fbff 42%, #ffffff 70%, #f2fbf6 100%)',
        }}
      >
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [-18, 28, -10, -18],
                  y: [-12, 22, 10, -12],
                  scale: [1, 1.08, 0.96, 1],
                }
          }
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-24 -left-20 w-[92vw] h-[46vh] rounded-full blur-3xl will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(59, 130, 246, 0.28) 0%, rgba(96, 165, 250, 0.14) 55%, transparent 76%)',
          }}
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [20, -24, 14, 20],
                  y: [10, -16, 20, 10],
                  scale: [1.02, 0.95, 1.07, 1.02],
                }
          }
          transition={{
            duration: 21,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-16 -right-24 w-[88vw] h-[44vh] rounded-full blur-3xl will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(234, 67, 53, 0.20) 0%, rgba(245, 158, 11, 0.15) 50%, transparent 76%)',
          }}
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [-16, 22, -20, -16],
                  y: [18, -20, 8, 18],
                  scale: [0.98, 1.07, 1, 0.98],
                }
          }
          transition={{
            duration: 23,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-[36vh] -left-20 w-[90vw] h-[44vh] rounded-full blur-3xl will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, rgba(59, 130, 246, 0.12) 55%, transparent 76%)',
          }}
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [14, -26, 12, 14],
                  y: [-14, 18, -8, -14],
                  scale: [1, 1.09, 0.97, 1],
                }
          }
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-24 -right-16 w-[96vw] h-[48vh] rounded-full blur-3xl will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(59, 130, 246, 0.15) 52%, transparent 76%)',
          }}
        />
      </div>

      {/* Desktop-only official AI-generated executives background */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none fixed inset-0 z-0 hidden lg:block overflow-hidden bg-[#0e1013]"
      >
        <img
          src={desktopExecutivesBg}
          alt=""
          decoding="sync"
          className="w-full h-full object-cover object-[50%_18%]"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/40" />
      </div>

      {/* Desktop URL-selected background override activated via eye icon */}
      {activeBgImage && (
        <motion.div
          key={shouldAnimateBgEntry ? 'first-bg-reveal' : 'instant-bg-swap'}
          aria-hidden="true"
          initial={
            shouldAnimateBgEntry && !shouldReduceMotion
              ? {
                  clipPath: 'inset(3% 1.25% 3% 85% round 22px)',
                  opacity: 0,
                }
              : false
          }
          animate={
            shouldAnimateBgEntry && !shouldReduceMotion
              ? {
                  clipPath: [
                    'inset(3% 1.25% 3% 85% round 22px)',
                    'inset(3% 1.25% 3% 85% round 22px)',
                    'inset(0% 0% 0% 0% round 0px)',
                  ],
                  opacity: [0, 1, 1],
                }
              : {
                  clipPath: 'inset(0% 0% 0% 0% round 0px)',
                  opacity: 1,
                }
          }
          transition={
            shouldAnimateBgEntry && !shouldReduceMotion
              ? {
                  duration: 1.25,
                  times: [0, 0.24, 1],
                  ease: [0.22, 1, 0.36, 1],
                }
              : { duration: 0 }
          }
          className="pointer-events-none select-none fixed inset-0 z-[2] hidden lg:block overflow-hidden"
        >
          <img
            src={activeBgImage.url}
            alt=""
            referrerPolicy="no-referrer"
            decoding="sync"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/35" />
        </motion.div>
      )}

      {/* Top header: corners hug edges; URL bar stays centered on desktop and below on mobile */}
      <header className="relative z-10 w-full flex flex-col gap-2.5 lg:grid lg:grid-cols-[1fr_minmax(0,768px)_1fr] lg:items-center lg:gap-6">
        {/* Top row on mobile (Logo left + Guest icon right); split into outer grid tracks on desktop */}
        <div className="flex items-center justify-between lg:contents">
          <div className="flex items-center justify-start lg:justify-self-start">
            <SearchLinkLogo onDarkBackground="desktop" />
          </div>

          {/* Mobile top-right guest sketch (light backdrop contrast) */}
          <div className="flex items-center justify-end lg:hidden">
            <GuestAvatarSketch
              variant="light"
              expanded={isAuthOpen}
              onClick={() => setIsAuthOpen(true)}
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          role="search"
          aria-label="Pegar URL de página web"
          className="w-full max-w-3xl mx-auto"
        >
          <div className="group flex items-center gap-3 h-12 w-full rounded-full px-5 bg-white/40 lg:bg-white/95 backdrop-blur-xl lg:backdrop-blur-md border border-slate-900/12 lg:border-white/85 ring-1 ring-inset ring-white/85 lg:ring-0 shadow-[0_8px_28px_-6px_rgba(37,99,235,0.12),0_2px_8px_-2px_rgba(15,23,42,0.06)] lg:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.4)] transition-all duration-150 focus-within:bg-white/75 lg:focus-within:bg-white focus-within:border-blue-500/45 lg:focus-within:border-white focus-within:shadow-[0_10px_34px_-6px_rgba(37,99,235,0.2)] lg:focus-within:shadow-[0_14px_42px_-6px_rgba(0,0,0,0.48)]">
            <Link2
              className="w-4 h-4 text-blue-600/75 lg:text-slate-400 shrink-0 transition-colors duration-150 group-focus-within:text-blue-600 lg:group-focus-within:text-slate-700"
              aria-hidden="true"
            />
            <input
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.blur();
                }
              }}
              placeholder="Pega aquí la URL de tu página web..."
              aria-label="URL de tu página web"
              autoComplete="url"
              spellCheck={false}
              className="flex-1 min-w-0 bg-transparent text-[15px] font-normal text-slate-900 placeholder:text-slate-500 lg:placeholder:text-slate-400 focus:outline-none"
            />
            {url.length > 0 && (
              <button
                type="button"
                onClick={() => setUrl('')}
                aria-label="Limpiar URL"
                className="flex items-center justify-center w-7 h-7 -mr-1.5 rounded-full text-slate-500 lg:text-slate-400 hover:text-slate-800 hover:bg-white/60 lg:hover:bg-slate-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:focus-visible:ring-slate-400 shrink-0"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>

        {/* Desktop top-right guest sketch (dark executives backdrop contrast) */}
        <div className="hidden lg:flex lg:justify-self-end items-center justify-end">
          <GuestAvatarSketch
            variant="dark"
            expanded={isAuthOpen}
            onClick={() => setIsAuthOpen(true)}
          />
        </div>
      </header>

      {/* Desktop-only dual showcase boxes with cross-gap animations */}
      <DualCatalogShowcase
        images={CATALOG_SAMPLE_IMAGES}
        activeBackgroundId={activeBgImage?.id ?? null}
        onSelectBackground={handleSelectBackground}
        suspendShortcuts={isAuthOpen}
      />

      {/* Mobile-only swipeable side-by-side white boxes with right-edge peek */}
      <MobileCatalogCarousel images={CATALOG_SAMPLE_IMAGES} />

      {/* Responsive white dot-grid registration panel */}
      <AuthDrawer open={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}

interface GuestAvatarSketchProps {
  variant: 'light' | 'dark';
  expanded: boolean;
  onClick: () => void;
}

function GuestAvatarSketch({ variant, expanded, onClick }: GuestAvatarSketchProps) {
  const toneClass =
    variant === 'light'
      ? 'border-slate-300/90 bg-white/85 text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,0.08)] hover:border-slate-400 hover:bg-white focus-visible:ring-slate-400'
      : 'border-white/50 bg-black/25 text-white/90 shadow-[0_2px_10px_rgba(0,0,0,0.28)] hover:border-white/85 hover:bg-black/35 focus-visible:ring-white/80';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-haspopup="dialog"
      aria-label="Abrir registro de cuenta"
      title="Crear cuenta o iniciar sesión"
      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border backdrop-blur-sm flex items-center justify-center cursor-pointer select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 shrink-0 ${toneClass}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4.5 h-4.5 sm:w-5 sm:h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="8.5" r="3.25" />
        <path d="M5.75 19.25a6.5 6.5 0 0 1 12.5 0" />
      </svg>
    </button>
  );
}
