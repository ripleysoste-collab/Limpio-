import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'motion/react';
import {
  Check,
  Copy,
  Eye,
  Image as ImageIcon,
  Link2,
  Loader2,
  Smartphone,
  X,
  Zap,
} from 'lucide-react';
import type { CatalogImageItem } from '../data/catalogSamples';

export type ImageCompressionStatus =
  | 'pending'
  | 'rendering'
  | 'compressing'
  | 'done'
  | 'error';
export type ImageUploadStatus = 'pending' | 'uploading' | 'done' | 'error';
export type ImageReceiveStatus = 'waiting' | 'received' | 'error';

export interface CompressedImageMeta {
  url: string;
  cleanUrl: string;
  savedPercent: number;
  compressedBytes: number;
}

interface MobileCatalogCarouselProps {
  images: CatalogImageItem[];
  isUnified: boolean;
  isExtracting: boolean;
  extractError: string | null;
  hasExtractedResults: boolean;
  showCompressionBox?: boolean;
  compressionStatuses?: Record<string, ImageCompressionStatus>;
  showUploadBox?: boolean;
  uploadStatuses?: Record<string, ImageUploadStatus>;
  showReceiveBox?: boolean;
  receiveStatuses?: Record<string, ImageReceiveStatus>;
  compressionResults?: Record<string, CompressedImageMeta>;
}

const SEARCH_LINK_BENEFITS = [
  {
    id: 'speed',
    title: 'Rapidez',
    description: 'Extrae y organiza imágenes en segundos, ligera y sin esperas.',
    icon: Zap,
    toneClass: 'bg-amber-50 text-amber-600',
  },
  {
    id: 'clean-urls',
    title: 'URLs limpias',
    description: 'Convierte rutas largas en enlaces cortos, claros y ordenados.',
    icon: Link2,
    toneClass: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'easy-anywhere',
    title: 'Fácil en teléfono o PC',
    description: 'Úsala cómodo desde el celular o el computador sin complicaciones.',
    icon: Smartphone,
    toneClass: 'bg-emerald-50 text-emerald-600',
  },
  {
    id: 'ready-to-share',
    title: 'Listas para compartir',
    description: 'Revisa cada foto y ten tus enlaces listos al instante en un toque.',
    icon: Copy,
    toneClass: 'bg-rose-50 text-rose-600',
  },
] as const;

export function MobileCatalogCarousel({
  images,
  isUnified,
  isExtracting,
  extractError,
  hasExtractedResults,
  showCompressionBox = false,
  compressionStatuses = {},
  showUploadBox = false,
  uploadStatuses = {},
  showReceiveBox = false,
  receiveStatuses = {},
  compressionResults = {},
}: MobileCatalogCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const compressionScrollRef = useRef<HTMLDivElement>(null);
  const compressionCardRef = useRef<HTMLDivElement>(null);
  const uploadCardRef = useRef<HTMLDivElement>(null);
  const receiveCardRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState<0 | 1 | 2>(0);
  const [activeCompressionCard, setActiveCompressionCard] = useState<0 | 1 | 2 | 3>(0);
  const [fullscreenImage, setFullscreenImage] = useState<CatalogImageItem | null>(null);
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});
  const [copiedMetadataId, setCopiedMetadataId] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const [mergeStage, setMergeStage] = useState<'idle' | 'merging' | 'unified'>('idle');
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopyMetadataUrl = async (itemId: string, urlToCopy: string) => {
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(urlToCopy);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = urlToCopy;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        copied = false;
      }
    }

    if (copied) {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      setCopiedMetadataId(itemId);
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedMetadataId((prev) => (prev === itemId ? null : prev));
        copyTimerRef.current = null;
      }, 1500);
    }
  };

  useEffect(() => {
    if (!isUnified) {
      setMergeStage('idle');
      return;
    }

    if (shouldReduceMotion) {
      setMergeStage('unified');
      return;
    }

    if (scrollRef.current && scrollRef.current.scrollLeft > 0) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }

    setMergeStage('merging');
    const timer = window.setTimeout(() => {
      setMergeStage('unified');
    }, 460);

    return () => window.clearTimeout(timer);
  }, [isUnified, shouldReduceMotion]);

  useEffect(() => {
    if (!showCompressionBox || showUploadBox || showReceiveBox || mergeStage !== 'unified') {
      if (!showCompressionBox) setActiveCompressionCard(0);
      return;
    }

    const scrollTimer = window.setTimeout(() => {
      const container = compressionScrollRef.current;
      const target = compressionCardRef.current;
      if (!container || !target) return;

      const paddingLeft = Number.parseFloat(
        window.getComputedStyle(container).paddingLeft || '16',
      );
      const targetLeft = Math.max(0, target.offsetLeft - paddingLeft);

      container.scrollTo({
        left: targetLeft,
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
      setActiveCompressionCard(1);
    }, 90);

    return () => window.clearTimeout(scrollTimer);
  }, [showCompressionBox, showUploadBox, showReceiveBox, mergeStage, shouldReduceMotion]);

  useEffect(() => {
    if (!showUploadBox || !showCompressionBox || showReceiveBox || mergeStage !== 'unified') {
      return;
    }

    const scrollTimer = window.setTimeout(() => {
      const container = compressionScrollRef.current;
      const target = uploadCardRef.current;
      if (!container || !target) return;

      const paddingLeft = Number.parseFloat(
        window.getComputedStyle(container).paddingLeft || '16',
      );
      const targetLeft = Math.max(0, target.offsetLeft - paddingLeft);

      container.scrollTo({
        left: targetLeft,
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
      setActiveCompressionCard(2);
    }, 90);

    return () => window.clearTimeout(scrollTimer);
  }, [showUploadBox, showCompressionBox, showReceiveBox, mergeStage, shouldReduceMotion]);

  useEffect(() => {
    if (!showReceiveBox || !showUploadBox || !showCompressionBox || mergeStage !== 'unified') {
      return;
    }

    const scrollTimer = window.setTimeout(() => {
      const container = compressionScrollRef.current;
      const target = receiveCardRef.current;
      if (!container || !target) return;

      const paddingLeft = Number.parseFloat(
        window.getComputedStyle(container).paddingLeft || '16',
      );
      const targetLeft = Math.max(0, target.offsetLeft - paddingLeft);

      container.scrollTo({
        left: targetLeft,
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
      setActiveCompressionCard(3);
    }, 90);

    return () => window.clearTimeout(scrollTimer);
  }, [showReceiveBox, showUploadBox, showCompressionBox, mergeStage, shouldReduceMotion]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    const index = Math.min(2, Math.max(0, Math.round((el.scrollLeft / maxScroll) * 2)));
    setActiveCard(index as 0 | 1 | 2);
  };

  const handleCompressionScroll = () => {
    const el = compressionScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    const totalSteps = showReceiveBox ? 3 : showUploadBox ? 2 : 1;
    const index = Math.min(
      totalSteps,
      Math.max(0, Math.round((el.scrollLeft / maxScroll) * totalSteps)),
    );
    setActiveCompressionCard(index as 0 | 1 | 2 | 3);
  };

  const mobileCols = images.length <= 1 ? 1 : images.length <= 4 ? 2 : 3;
  const mobileRows = Math.max(1, Math.ceil(images.length / mobileCols));

  return (
    <>
      {mergeStage !== 'unified' ? (
        <div className="relative z-10 lg:hidden w-full flex flex-col mt-6">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className={`-mx-4 sm:-mx-5 w-[calc(100%+2rem)] sm:w-[calc(100%+2.5rem)] snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-5 px-4 sm:px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              mergeStage === 'merging' ? 'overflow-hidden' : 'overflow-x-auto'
            }`}
            aria-label="Vista móvil de imágenes, URLs y beneficios"
          >
            <div className="flex items-start gap-3.5 w-max pr-4 sm:pr-5">
              {/* Card 1: Expands cleanly to full visible mobile width during merge */}
              <motion.div
                animate={
                  mergeStage === 'merging'
                    ? { width: 'calc(100vw - 2rem)' }
                    : undefined
                }
                transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
                className="w-[62vw] max-w-[248px] shrink-0 snap-start flex flex-col"
              >
                <h2 className="text-[13.5px] font-semibold text-slate-950 tracking-[-0.015em] mb-2 pl-1">
                  Aquí verás tus imágenes
                </h2>

                <section
                  aria-label="Aquí verás tus imágenes"
                  className="h-[min(41dvh,300px)] min-h-[245px] w-full rounded-[18px] bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-[0_14px_38px_-12px_rgba(15,23,42,0.11),0_4px_12px_-4px_rgba(37,99,235,0.06)] p-2 overflow-hidden"
                >
                  {isExtracting ? (
                    <ExtractingPlaceholder />
                  ) : (
                    <div
                      className="w-full h-full grid gap-1"
                      style={{
                        gridTemplateColumns: `repeat(${mobileCols}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${mobileRows}, minmax(0, 1fr))`,
                      }}
                    >
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
                  )}
                </section>
              </motion.div>

              {/* Card 2: Slides smoothly leftward into Card 1 when merging */}
              <motion.div
                animate={
                  mergeStage === 'merging'
                    ? { x: -110, opacity: 0, scale: 0.94 }
                    : { x: 0, opacity: 1, scale: 1 }
                }
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                className="w-[62vw] max-w-[248px] shrink-0 snap-start flex flex-col"
              >
                <h2 className="text-[13.5px] font-semibold text-slate-950 tracking-[-0.015em] mb-2 pl-1">
                  Aquí puedes ver tus metadatos
                </h2>

                <section
                  aria-label="Aquí puedes ver tus metadatos"
                  className="h-[min(41dvh,300px)] min-h-[245px] w-full rounded-[18px] bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-[0_14px_38px_-12px_rgba(15,23,42,0.11),0_4px_12px_-4px_rgba(37,99,235,0.06)] px-2.5 py-1.5"
                >
                  <div className="w-full h-full flex flex-col divide-y divide-slate-100/85 select-none overflow-hidden">
                    {images.map((item) => (
                      <div
                        key={`mobile-url-${item.id}`}
                        className="flex-1 max-h-7 flex items-center gap-1.5 px-0.5 min-w-0"
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
              </motion.div>

              {/* Column 3: Slides leftward and fades out cleanly during merge */}
              <motion.div
                animate={
                  mergeStage === 'merging'
                    ? { x: -180, opacity: 0, scale: 0.94 }
                    : { x: 0, opacity: 1, scale: 1 }
                }
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="w-[62vw] max-w-[248px] shrink-0 snap-start flex flex-col"
              >
                <h2 className="text-[13.5px] font-semibold text-slate-950 tracking-[-0.015em] mb-2 pl-1">
                  ¿Por qué usarías Search Link?
                </h2>

                <section
                  aria-label="Por qué usarías Search Link"
                  className="h-[min(41dvh,300px)] min-h-[245px] w-full flex flex-col justify-between gap-2"
                >
                  {SEARCH_LINK_BENEFITS.map((benefit) => {
                    const Icon = benefit.icon;
                    return (
                      <article
                        key={benefit.id}
                        className="flex-1 min-h-0 w-full rounded-[14px] bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-[0_8px_22px_-10px_rgba(15,23,42,0.11),0_2px_8px_-3px_rgba(37,99,235,0.05)] px-2.5 py-1.5 flex items-center gap-2.5"
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${benefit.toneClass}`}
                          aria-hidden="true"
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-[11px] font-semibold text-slate-950 leading-tight truncate">
                            {benefit.title}
                          </h3>
                          <p className="mt-0.5 text-[9.5px] leading-[1.2] text-slate-500 line-clamp-2">
                            {benefit.description}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </section>
              </motion.div>
            </div>
          </div>

          {/* Passive 3-step scroll progress cue (hidden as soon as merge begins) */}
          <motion.div
            aria-hidden="true"
            animate={{ opacity: mergeStage === 'merging' ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center gap-1.5 mt-1"
          >
            {[0, 1, 2].map((step) => (
              <span
                key={step}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  activeCard === step ? 'w-5 bg-slate-900' : 'w-1.5 bg-slate-300'
                }`}
              />
            ))}
          </motion.div>
        </div>
      ) : (
        /* Unified mobile view after merge: single image box or auto-panning 2-box compression flow + unboxed metadata below */
        <div className="relative z-10 lg:hidden w-full flex flex-col mt-6">
          {showCompressionBox && !isExtracting && images.length > 0 ? (
            <div className="w-full flex flex-col">
              <div
                ref={compressionScrollRef}
                onScroll={handleCompressionScroll}
                className="relative -mx-4 sm:-mx-5 w-[calc(100%+2rem)] sm:w-[calc(100%+2.5rem)] overflow-x-auto snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-5 px-4 sm:px-5 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-label="Imágenes y proceso de compresión"
              >
                <div className="flex items-start gap-3.5 w-max pr-4 sm:pr-5">
                  {/* Card 1: Uploaded images remain safely accessible on the left */}
                  <div className="w-[78vw] max-w-[308px] shrink-0 snap-start flex flex-col">
                    <h2 className="text-[14px] font-semibold text-slate-950 tracking-[-0.015em] mb-2 pl-1">
                      Aquí verás tus imágenes
                    </h2>

                    <section
                      aria-label="Aquí verás tus imágenes"
                      className="h-[min(42dvh,310px)] min-h-[245px] w-full rounded-[20px] bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-[0_16px_42px_-12px_rgba(15,23,42,0.12),0_4px_14px_-4px_rgba(37,99,235,0.06)] p-2.5 overflow-hidden"
                    >
                      <div
                        className="w-full h-full grid gap-1.5"
                        style={{
                          gridTemplateColumns: `repeat(${mobileCols}, minmax(0, 1fr))`,
                          gridTemplateRows: `repeat(${mobileRows}, minmax(0, 1fr))`,
                        }}
                      >
                        {images.map((item) => {
                          const hasError = Boolean(failedIds[item.id]);

                          return (
                            <button
                              key={`comp-left-thumb-${item.id}`}
                              type="button"
                              onClick={() => setFullscreenImage(item)}
                              aria-label={`Ver ${item.alt}`}
                              className="relative w-full h-full overflow-hidden rounded-xl bg-slate-50 ring-1 ring-inset ring-black/[0.04] active:scale-[0.96] transition-transform duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                            >
                              {hasError ? (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                  <ImageIcon className="w-4 h-4" aria-hidden="true" />
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

                  {/* Card 2: Automatic "Comprimiendo" box that slides into view to the right */}
                  <motion.div
                    ref={compressionCardRef}
                    initial={shouldReduceMotion ? false : { opacity: 0, x: 24, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    className="w-[78vw] max-w-[308px] shrink-0 snap-start flex flex-col"
                  >
                    <h2 className="text-[14px] font-semibold text-slate-950 tracking-[-0.015em] mb-2 pl-1">
                      Comprimiendo
                    </h2>

                    <section
                      aria-label="Comprimiendo"
                      className="h-[min(42dvh,310px)] min-h-[245px] w-full rounded-[20px] bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-[0_16px_42px_-12px_rgba(15,23,42,0.12),0_4px_14px_-4px_rgba(16,185,129,0.08)] p-2.5 overflow-hidden"
                    >
                      <div
                        className="w-full h-full grid gap-1.5"
                        style={{
                          gridTemplateColumns: `repeat(${mobileCols}, minmax(0, 1fr))`,
                          gridTemplateRows: `repeat(${mobileRows}, minmax(0, 1fr))`,
                        }}
                      >
                        {images.map((item) => {
                          const status = compressionStatuses[item.id] ?? 'pending';
                          const hasError = Boolean(failedIds[item.id]);

                          return (
                            <div
                              key={`comp-right-tile-${item.id}`}
                              className={`relative w-full h-full overflow-hidden rounded-xl ring-1 ring-inset transition-colors duration-200 flex items-center justify-center ${
                                status === 'done'
                                  ? 'bg-emerald-50/70 ring-emerald-200/70'
                                  : status === 'error'
                                    ? 'bg-rose-50/70 ring-rose-200/70'
                                    : 'bg-slate-50 ring-black/[0.04]'
                              }`}
                            >
                              {status === 'pending' && (
                                hasError ? (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                    <ImageIcon className="w-4 h-4" aria-hidden="true" />
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
                                )
                              )}

                              {status === 'rendering' && (
                                <motion.div
                                  initial={shouldReduceMotion ? false : { scale: 0.7, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.16 }}
                                  aria-label={`Renderizando ${item.alt}`}
                                  className="flex items-center justify-center"
                                >
                                  <span className="w-5 h-5 rounded-full border-[2.5px] border-blue-200 border-t-blue-600 animate-spin" />
                                </motion.div>
                              )}

                              {status === 'compressing' && (
                                <motion.div
                                  initial={shouldReduceMotion ? false : { scale: 0.7, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.16 }}
                                  aria-label={`Comprimiendo ${item.alt}`}
                                  className="flex items-center justify-center"
                                >
                                  <span className="w-5 h-5 rounded-full border-[2.5px] border-emerald-200 border-t-emerald-500 animate-spin" />
                                </motion.div>
                              )}

                              {status === 'done' && (
                                <motion.div
                                  initial={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                  aria-label={`${item.alt} comprimida`}
                                  className="w-6 h-6 rounded-full bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)] flex items-center justify-center"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[2.75]" aria-hidden="true" />
                                </motion.div>
                              )}

                              {status === 'error' && (
                                <div
                                  aria-label={`Error al comprimir ${item.alt}`}
                                  className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </motion.div>

                  {/* Card 3: Automatic "Lanzando a base de datos" box — thumbnails stay visible with green spinner/check overlay */}
                  {showUploadBox && (
                    <motion.div
                      ref={uploadCardRef}
                      initial={shouldReduceMotion ? false : { opacity: 0, x: 24, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                      className="w-[78vw] max-w-[308px] shrink-0 snap-start flex flex-col"
                    >
                      <h2 className="text-[14px] font-semibold text-slate-950 tracking-[-0.015em] mb-2 pl-1">
                        Lanzando a base de datos
                      </h2>

                      <section
                        aria-label="Lanzando a base de datos"
                        className="h-[min(42dvh,310px)] min-h-[245px] w-full rounded-[20px] bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-[0_16px_42px_-12px_rgba(15,23,42,0.12),0_4px_14px_-4px_rgba(16,185,129,0.08)] p-2.5 overflow-hidden"
                      >
                        <div
                          className="w-full h-full grid gap-1.5"
                          style={{
                            gridTemplateColumns: `repeat(${mobileCols}, minmax(0, 1fr))`,
                            gridTemplateRows: `repeat(${mobileRows}, minmax(0, 1fr))`,
                          }}
                        >
                          {images.map((item) => {
                            const status = uploadStatuses[item.id] ?? 'pending';
                            const hasError = Boolean(failedIds[item.id]);

                            return (
                              <button
                                key={`upload-right-tile-${item.id}`}
                                type="button"
                                onClick={() => setFullscreenImage(item)}
                                aria-label={`Ver ${item.alt}`}
                                className="relative w-full h-full overflow-hidden rounded-xl bg-slate-50 ring-1 ring-inset ring-black/[0.04] active:scale-[0.96] transition-transform duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
                              >
                                {hasError ? (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                    <ImageIcon className="w-4 h-4" aria-hidden="true" />
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

                                {status === 'uploading' && (
                                  <motion.div
                                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.14 }}
                                    aria-label={`Subiendo ${item.alt}`}
                                    className="absolute inset-0 bg-slate-950/25 flex items-center justify-center"
                                  >
                                    <span className="w-6 h-6 rounded-full bg-white/95 shadow-sm flex items-center justify-center">
                                      <span className="w-4 h-4 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin" />
                                    </span>
                                  </motion.div>
                                )}

                                {status === 'done' && (
                                  <motion.div
                                    initial={shouldReduceMotion ? false : { scale: 0.55, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                    aria-label={`${item.alt} subida`}
                                    className="absolute inset-0 bg-slate-950/10 flex items-center justify-center pointer-events-none"
                                  >
                                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white ring-2 ring-white shadow-[0_2px_8px_rgba(16,185,129,0.45)] flex items-center justify-center">
                                      <Check className="w-3.5 h-3.5 stroke-[2.75]" aria-hidden="true" />
                                    </span>
                                  </motion.div>
                                )}

                                {status === 'error' && (
                                  <div
                                    aria-label={`Error al subir ${item.alt}`}
                                    className="absolute inset-0 bg-slate-950/20 flex items-center justify-center pointer-events-none"
                                  >
                                    <span className="w-6 h-6 rounded-full bg-rose-500 text-white ring-2 ring-white flex items-center justify-center">
                                      <X className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                                    </span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Card 4: Automatic "Recibiendo" box — stacked from top inside fixed card height (max 10) */}
                  {showReceiveBox && (
                    <motion.div
                      ref={receiveCardRef}
                      initial={shouldReduceMotion ? false : { opacity: 0, x: 24, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                      className="w-[78vw] max-w-[308px] shrink-0 snap-start flex flex-col"
                    >
                      <h2 className="text-[14px] font-semibold text-slate-950 tracking-[-0.015em] mb-2 pl-1">
                        Recibiendo
                      </h2>

                      <section
                        aria-label="Recibiendo"
                        className="h-[min(42dvh,310px)] min-h-[245px] w-full rounded-[20px] bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-[0_16px_42px_-12px_rgba(15,23,42,0.12),0_4px_14px_-4px_rgba(16,185,129,0.08)] p-2.5 overflow-hidden"
                      >
                        <ul className="w-full h-full flex flex-col justify-start gap-[2.5px] overflow-hidden">
                          {images.slice(0, 10).map((item) => {
                            const status = receiveStatuses[item.id] ?? 'waiting';
                            const received = compressionResults[item.id];
                            const displayUrl = received?.cleanUrl ?? item.cleanUrl;

                            return (
                              <li
                                key={`receive-row-${item.id}`}
                                className="h-5 shrink-0 w-full min-w-0 flex items-center gap-2 px-1 overflow-hidden select-none"
                              >
                                <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                                  {status === 'waiting' && (
                                    <span
                                      aria-label={`Recibiendo URL de ${item.alt}`}
                                      className="w-3.5 h-3.5 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin [animation-duration:500ms]"
                                    />
                                  )}

                                  {status === 'received' && (
                                    <motion.span
                                      initial={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                      aria-label={`URL recibida para ${item.alt}`}
                                      className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center"
                                    >
                                      <Check className="w-2.5 h-2.5 stroke-[3]" aria-hidden="true" />
                                    </motion.span>
                                  )}

                                  {status === 'error' && (
                                    <span
                                      aria-label={`Error al recibir ${item.alt}`}
                                      className="w-3.5 h-3.5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"
                                    >
                                      <X className="w-2.5 h-2.5 stroke-[2.5]" aria-hidden="true" />
                                    </span>
                                  )}
                                </div>

                                {status === 'received' ? (
                                  <motion.span
                                    initial={shouldReduceMotion ? false : { opacity: 0, x: 4 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="flex-1 min-w-0 font-mono text-[10.5px] leading-none text-slate-800 truncate tabular-nums"
                                  >
                                    {displayUrl}
                                  </motion.span>
                                ) : status === 'error' ? (
                                  <span className="flex-1 min-w-0 text-[10.5px] leading-none text-rose-500 truncate">
                                    No se pudo recibir
                                  </span>
                                ) : (
                                  <span className="h-2 w-2/3 rounded-full bg-slate-100 animate-pulse" />
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Dynamic 2-step, 3-step, or 4-step swipe indicator */}
              <div
                aria-hidden="true"
                className="flex items-center justify-center gap-1.5 mt-0.5"
              >
                {(showReceiveBox
                  ? [0, 1, 2, 3]
                  : showUploadBox
                    ? [0, 1, 2]
                    : [0, 1]
                ).map((step) => (
                  <span
                    key={step}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      activeCompressionCard === step
                        ? 'w-5 bg-slate-900'
                        : 'w-1.5 bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-[14px] font-semibold text-slate-950 tracking-[-0.015em] mb-2 pl-1">
                Aquí verás tus imágenes
              </h2>

              <section
                aria-label="Aquí verás tus imágenes"
                className="h-[min(42dvh,310px)] min-h-[245px] w-full rounded-[20px] bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-[0_16px_42px_-12px_rgba(15,23,42,0.12),0_4px_14px_-4px_rgba(37,99,235,0.06)] p-2.5 overflow-hidden"
              >
                {isExtracting ? (
                  <ExtractingPlaceholder />
                ) : extractError && (!hasExtractedResults || images.length === 0) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center px-4">
                    <ImageIcon className="w-7 h-7 text-slate-300 mb-2" aria-hidden="true" />
                    <p className="text-xs text-slate-500 leading-relaxed">{extractError}</p>
                  </div>
                ) : (
                  <div
                    className="w-full h-full grid gap-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${mobileCols}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${mobileRows}, minmax(0, 1fr))`,
                    }}
                  >
                    {images.map((item) => {
                      const hasError = Boolean(failedIds[item.id]);

                      return (
                        <button
                          key={`unified-thumb-${item.id}`}
                          type="button"
                          onClick={() => setFullscreenImage(item)}
                          aria-label={`Ver ${item.alt}`}
                          className="relative w-full h-full overflow-hidden rounded-xl bg-slate-50 ring-1 ring-inset ring-black/[0.04] active:scale-[0.96] transition-transform duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                        >
                          {hasError ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                              <ImageIcon className="w-4 h-4" aria-hidden="true" />
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
                )}
              </section>
            </>
          )}

          {/* Clean unboxed metadata/URLs stacked vertically directly over the moving light background */}
          {!isExtracting && (hasExtractedResults || !extractError) && images.length > 0 && (
            <motion.section
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              aria-label="Aquí puedes ver tus metadatos"
              className="mt-5 px-1 pb-4"
            >
              <h2 className="text-[13.5px] font-semibold text-slate-950 tracking-[-0.015em] mb-2">
                Aquí puedes ver tus metadatos
              </h2>

              <ul className="divide-y divide-slate-900/[0.06]">
                {images.map((item) => {
                  const compressed = compressionResults[item.id];
                  const displayUrl = compressed?.cleanUrl ?? item.cleanUrl;
                  const copyableUrl = compressed?.url
                    ? compressed.url
                    : /^https?:\/\//i.test(item.sourcePageUrl || '')
                      ? item.sourcePageUrl!
                      : /^https?:\/\//i.test(displayUrl)
                        ? displayUrl
                        : null;
                  const isCopied = copiedMetadataId === item.id;

                  return (
                    <li
                      key={`unified-url-${item.id}`}
                      className="min-w-0 select-none"
                    >
                      {copyableUrl ? (
                        <button
                          type="button"
                          onClick={() => handleCopyMetadataUrl(item.id, copyableUrl)}
                          aria-label={`Copiar URL ${displayUrl}`}
                          className="w-full flex items-center justify-between gap-2.5 py-2.5 min-w-0 text-left active:opacity-65 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-md"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {isCopied ? (
                              <Check
                                className="w-3.5 h-3.5 shrink-0 text-emerald-600 stroke-[2.75]"
                                aria-hidden="true"
                              />
                            ) : (
                              <Eye
                                className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                  compressed ? 'text-emerald-600' : 'text-blue-600/80'
                                }`}
                                aria-hidden="true"
                              />
                            )}
                            <span className="font-mono text-[11.5px] leading-snug text-slate-800 truncate tabular-nums">
                              {displayUrl}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCopied && (
                              <span className="text-[10.5px] font-medium text-emerald-600">
                                Copiado
                              </span>
                            )}
                            {compressed && compressed.savedPercent > 0 && (
                              <span className="text-[10.5px] font-semibold text-emerald-600 tabular-nums">
                                -{compressed.savedPercent}%
                              </span>
                            )}
                          </div>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-2.5 py-2.5 min-w-0">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Eye
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                compressed ? 'text-emerald-600' : 'text-blue-600/80'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="font-mono text-[11.5px] leading-snug text-slate-800 truncate tabular-nums">
                              {displayUrl}
                            </span>
                          </div>

                          {compressed && compressed.savedPercent > 0 && (
                            <span className="text-[10.5px] font-semibold text-emerald-600 tabular-nums shrink-0">
                              -{compressed.savedPercent}%
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.section>
          )}
        </div>
      )}

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

function ExtractingPlaceholder() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-full h-full opacity-55">
        {Array.from({ length: 9 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-lg bg-slate-100 animate-pulse"
            style={{ animationDelay: `${idx * 70}ms` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/60 backdrop-blur-[2px]">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-700">
          Buscando imágenes...
        </span>
      </div>
    </div>
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
