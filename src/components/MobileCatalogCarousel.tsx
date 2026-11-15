import { useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'motion/react';
import { Eye, Image as ImageIcon, X } from 'lucide-react';
import type { CatalogImageItem } from '../data/catalogSamples';

interface MobileCatalogCarouselProps {
  images: CatalogImageItem[];
}

export function MobileCatalogCarousel({ images }: MobileCatalogCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState<0 | 1>(0);
  const [fullscreenImage, setFullscreenImage] = useState<CatalogImageItem | null>(null);
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});
  const shouldReduceMotion = useReducedMotion();

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    setActiveCard(el.scrollLeft > maxScroll * 0.45 ? 1 : 0);
  };

  return (
    <>
      <div className="relative z-10 lg:hidden w-full flex flex-col mt-6">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="-mx-4 sm:-mx-5 w-[calc(100%+2rem)] sm:w-[calc(100%+2.5rem)] overflow-x-auto snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-5 px-4 sm:px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Vista móvil de imágenes y URLs"
        >
          <div className="flex items-start gap-3.5 w-max pr-4 sm:pr-5">
            {/* Card 1: Instant fluid 15-image thumbnail gallery (~30% more compact) */}
            <div className="w-[62vw] max-w-[248px] shrink-0 snap-start flex flex-col">
              <h2 className="text-[13.5px] font-semibold text-slate-950 tracking-[-0.015em] mb-2 pl-1">
                Aquí verás tus imágenes
              </h2>

              <section
                aria-label="Aquí verás tus imágenes"
                className="h-[min(41dvh,300px)] min-h-[245px] w-full rounded-[18px] bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-[0_14px_38px_-12px_rgba(15,23,42,0.11),0_4px_12px_-4px_rgba(37,99,235,0.06)] p-2"
              >
                <div className="w-full h-full grid grid-cols-3 grid-rows-5 gap-1">
                  {images.map((item) => {
                    const hasError = Boolean(failedIds[item.id]);

                    return (
                      <button
                        key={`mobile-thumb-${item.id}`}
                        type="button"
                        onClick={() => setFullscreenImage(item)}
                        aria-label={`Ver ${item.alt}`}
                        className="relative w-full h-full overflow-hidden rounded-lg bg-slate-50 ring-1 ring-inset ring-black/[0.04] active:scale-[0.96] transition-transform duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                      >
                        {hasError ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                            <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.alt}
                            referrerPolicy="no-referrer"
                            decoding="sync"
                            onError={() =>
                              setFailedIds((prev) => ({ ...prev, [item.id]: true }))
                            }
                            className="w-full h-full object-cover select-none"
                            draggable={false}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Card 2: Clean static URLs list (~30% more compact; touching URLs does nothing) */}
            <div className="w-[62vw] max-w-[248px] shrink-0 snap-start flex flex-col">
              <h2 className="text-[13.5px] font-semibold text-slate-950 tracking-[-0.015em] mb-2 pl-1">
                Acá verás tu URL
              </h2>

              <section
                aria-label="Acá verás tu URL"
                className="h-[min(41dvh,300px)] min-h-[245px] w-full rounded-[18px] bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-[0_14px_38px_-12px_rgba(15,23,42,0.11),0_4px_12px_-4px_rgba(37,99,235,0.06)] px-2.5 py-1.5"
              >
                <div className="w-full h-full flex flex-col justify-between divide-y divide-slate-100/85 select-none">
                  {images.map((item) => (
                    <div
                      key={`mobile-url-${item.id}`}
                      className="flex-1 flex items-center gap-1.5 px-0.5 min-w-0"
                    >
                      <Eye
                        className="w-2.5 h-2.5 text-blue-500/70 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="font-mono text-[9.5px] leading-none text-slate-700 truncate tabular-nums">
                        {item.cleanUrl}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Passive scroll progress cue (no buttons added) */}
        <div
          aria-hidden="true"
          className="flex items-center justify-center gap-1.5 mt-1"
        >
          <span
            className={`h-1.5 rounded-full transition-all duration-200 ${
              activeCard === 0 ? 'w-5 bg-slate-900' : 'w-1.5 bg-slate-300'
            }`}
          />
          <span
            className={`h-1.5 rounded-full transition-all duration-200 ${
              activeCard === 1 ? 'w-5 bg-slate-900' : 'w-1.5 bg-slate-300'
            }`}
          />
        </div>
      </div>

      {/* Mobile fullscreen image viewer with swipe-down to dismiss */}
      <AnimatePresence>
        {fullscreenImage && (
          <MobileFullscreenViewer
            key={`mobile-viewer-${fullscreenImage.id}`}
            item={fullscreenImage}
            reduceMotion={Boolean(shouldReduceMotion)}
            onClose={() => setFullscreenImage(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface MobileFullscreenViewerProps {
  item: CatalogImageItem;
  reduceMotion: boolean;
  onClose: () => void;
}

function MobileFullscreenViewer({
  item,
  reduceMotion,
  onClose,
}: MobileFullscreenViewerProps) {
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 260], [1, 0.25]);
  const ambientOpacity = useTransform(dragY, [0, 260], [0.35, 0.08]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 85 || info.velocity.y > 380) {
      onClose();
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.18 }}
      className="fixed inset-0 z-50 lg:hidden flex items-center justify-center overflow-hidden touch-none"
    >
      {/* Backdrop that subtly fades as the user swipes down */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: backdropOpacity }}
        className="absolute inset-0 bg-slate-950"
      />

      {/* Ambient blurred edge-to-edge atmosphere */}
      <motion.img
        src={item.url}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        decoding="sync"
        style={{ opacity: ambientOpacity }}
        className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover blur-3xl scale-110"
      />

      {/* Top swipe-down indicator */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-3 inset-x-0 z-20 flex justify-center"
      >
        <div className="w-10 h-1 rounded-full bg-white/40" />
      </div>

      {/* Draggable image surface: swipe down to close */}
      <motion.div
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.08, bottom: 0.7 }}
        onDragEnd={handleDragEnd}
        style={{ y: dragY }}
        initial={reduceMotion ? false : { scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { y: 120, opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        <img
          src={item.url}
          alt={item.alt}
          referrerPolicy="no-referrer"
          decoding="sync"
          className="w-full h-full object-contain select-none pointer-events-none"
          draggable={false}
        />
      </motion.div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar imagen"
        className="fixed top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/55 hover:bg-black/75 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
    </motion.div>
  );
}
