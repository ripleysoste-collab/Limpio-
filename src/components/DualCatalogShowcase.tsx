import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Copy, Eye, Image as ImageIcon, X } from 'lucide-react';
import type { CatalogImageItem } from '../data/catalogSamples';

interface DualCatalogShowcaseProps {
  images: CatalogImageItem[];
  activeBackgroundId: string | null;
  onSelectBackground: (item: CatalogImageItem) => void;
  suspendShortcuts?: boolean;
}

interface BoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ViewportBoxRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface GridDimensions {
  cols: number;
  rows: number;
}

type AnimationPhase =
  | 'FILL_IMAGES'
  | 'HOLD_BEFORE_ESCAPE'
  | 'TRANSFER_TO_URLS'
  | 'REFILL_IMAGES'
  | 'COMPLETED';

type ExpandedMode = 'images' | 'urls';
type ExpandStage = 'start' | 'merging' | 'expanded' | 'closing';

interface ActiveFlight {
  index: number;
  direction: 'to-url' | 'to-image';
  targetSlot: number;
  key: string;
}

interface ExpandGeometry {
  start: ViewportBoxRect;
  merged: ViewportBoxRect;
  final: { left: number; top: number; width: number; height: number };
}

const TILE_GAP = 8;
const URL_ROW_GAP = 2;

const FILL_STEP_MS = 1050;
const FULL_HOLD_MS = 260;
const SHRINK_DURATION_S = 0.72;

const HOLD_BEFORE_ESCAPE_MS = 2000;

const FLIGHT_STAGGER_MS = 280;
const FLIGHT_DURATION_S = 1.15;

const MERGE_DURATION_S = 0.55;
const EXPAND_DURATION_S = 0.65;
const CLOSE_DURATION_S = 0.28;

function computeGridDimensions(count: number, containerAspect: number): GridDimensions {
  if (count <= 1) return { cols: 1, rows: 1 };

  let bestCols = count;
  let bestRows = 1;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const emptyCells = cols * rows - count;
    const cellAspect = containerAspect / (cols / rows);
    const squarePenalty = Math.abs(Math.log(Math.max(cellAspect, 0.1)));
    const score = emptyCells * 10 + squarePenalty;

    if (score < bestScore) {
      bestScore = score;
      bestCols = cols;
      bestRows = rows;
    }
  }

  return { cols: bestCols, rows: bestRows };
}

function buildRightMiddleExitOrder(count: number, cols: number, rows: number): number[] {
  const midRow = Math.floor(rows / 2);
  const rowPriority: number[] = [midRow];
  for (let offset = 1; offset < rows; offset++) {
    if (midRow - offset >= 0) rowPriority.push(midRow - offset);
    if (midRow + offset < rows) rowPriority.push(midRow + offset);
  }

  const order: number[] = [];
  for (let col = cols - 1; col >= 0; col--) {
    for (const row of rowPriority) {
      const idx = row * cols + col;
      if (idx < count) {
        order.push(idx);
      }
    }
  }
  return order;
}

function toViewportRect(rect: DOMRect): ViewportBoxRect {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

export function DualCatalogShowcase({
  images,
  activeBackgroundId,
  onSelectBackground,
  suspendShortcuts = false,
}: DualCatalogShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftCardRef = useRef<HTMLElement>(null);
  const rightCardRef = useRef<HTMLElement>(null);
  const leftStageRef = useRef<HTMLDivElement>(null);
  const rightStageRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const [rects, setRects] = useState<{ left: BoxRect; right: BoxRect }>({
    left: { x: 0, y: 0, width: 0, height: 0 },
    right: { x: 0, y: 0, width: 0, height: 0 },
  });

  const [phase, setPhase] = useState<AnimationPhase>('FILL_IMAGES');
  const [visibleImages, setVisibleImages] = useState<boolean[]>(() =>
    images.map(() => Boolean(shouldReduceMotion)),
  );
  const [visibleUrls, setVisibleUrls] = useState<boolean[]>(() =>
    images.map(() => Boolean(shouldReduceMotion)),
  );
  const [flights, setFlights] = useState<ActiveFlight[]>([]);
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});

  // Expanded 80% desktop modal state
  const [expandedMode, setExpandedMode] = useState<ExpandedMode | null>(null);
  const [expandStage, setExpandStage] = useState<ExpandStage>('start');
  const [expandGeometry, setExpandGeometry] = useState<ExpandGeometry | null>(null);
  const [contentVisible, setContentVisible] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fullscreen edge-to-edge image viewer state
  const [fullscreenImage, setFullscreenImage] = useState<CatalogImageItem | null>(null);

  // Hover tracking for context-aware keyboard shortcuts
  const [hoveredImage, setHoveredImage] = useState<CatalogImageItem | null>(null);

  const expandTimersRef = useRef<number[]>([]);

  const clearExpandTimers = useCallback(() => {
    expandTimersRef.current.forEach((id) => window.clearTimeout(id));
    expandTimersRef.current = [];
  }, []);

  useEffect(() => {
    images.forEach((item) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = item.url;
      img.decode?.().catch(() => {});
    });
  }, [images]);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const left = leftStageRef.current;
      const right = rightStageRef.current;
      if (!container || !left || !right) return;

      const cRect = container.getBoundingClientRect();
      const lRect = left.getBoundingClientRect();
      const rRect = right.getBoundingClientRect();

      setRects({
        left: {
          x: lRect.left - cRect.left,
          y: lRect.top - cRect.top,
          width: lRect.width,
          height: lRect.height,
        },
        right: {
          x: rRect.left - cRect.left,
          y: rRect.top - cRect.top,
          width: rRect.width,
          height: rRect.height,
        },
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    if (leftStageRef.current) observer.observe(leftStageRef.current);
    if (rightStageRef.current) observer.observe(rightStageRef.current);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const grid = useMemo(() => {
    const aspect =
      rects.left.width > 0 && rects.left.height > 0
        ? rects.left.width / rects.left.height
        : 1.35;
    return computeGridDimensions(images.length, aspect);
  }, [images.length, rects.left.width, rects.left.height]);

  const rightMiddleExitOrder = useMemo(
    () => buildRightMiddleExitOrder(images.length, grid.cols, grid.rows),
    [images.length, grid.cols, grid.rows],
  );

  const orderedUrlItems = useMemo(
    () => rightMiddleExitOrder.map((imgIndex) => images[imgIndex] ?? images[0]),
    [rightMiddleExitOrder, images],
  );

  const hasMeasured = rects.left.width > 0 && rects.right.width > 0;

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleImages(images.map(() => true));
      setVisibleUrls(images.map(() => true));
      setFlights([]);
      setPhase('COMPLETED');
      return;
    }

    if (!hasMeasured || images.length === 0 || phase === 'COMPLETED') {
      return;
    }

    const timers: number[] = [];
    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    if (phase === 'FILL_IMAGES') {
      setVisibleImages(images.map(() => false));
      setVisibleUrls(images.map(() => false));
      setFlights([]);

      images.forEach((_, idx) => {
        schedule(() => {
          setVisibleImages((prev) => {
            const next = [...prev];
            next[idx] = true;
            return next;
          });
        }, 200 + idx * FILL_STEP_MS);
      });

      const doneAt =
        200 + (images.length - 1) * FILL_STEP_MS + FULL_HOLD_MS + SHRINK_DURATION_S * 1000;
      schedule(() => setPhase('HOLD_BEFORE_ESCAPE'), doneAt);
    } else if (phase === 'HOLD_BEFORE_ESCAPE') {
      schedule(() => setPhase('TRANSFER_TO_URLS'), HOLD_BEFORE_ESCAPE_MS);
    } else if (phase === 'TRANSFER_TO_URLS') {
      setFlights([]);
      rightMiddleExitOrder.forEach((imgIndex, orderIdx) => {
        const startAt = orderIdx * FLIGHT_STAGGER_MS;
        const flightKey = `to-url-${imgIndex}`;

        schedule(() => {
          setVisibleImages((prev) => {
            const next = [...prev];
            next[imgIndex] = false;
            return next;
          });
          setFlights((prev) => [
            ...prev,
            { index: imgIndex, direction: 'to-url', targetSlot: orderIdx, key: flightKey },
          ]);
        }, startAt);

        schedule(() => {
          setFlights((prev) => prev.filter((f) => f.key !== flightKey));
          setVisibleUrls((prev) => {
            const next = [...prev];
            next[orderIdx] = true;
            return next;
          });
        }, startAt + FLIGHT_DURATION_S * 1000);
      });

      const allLandedAt =
        (rightMiddleExitOrder.length - 1) * FLIGHT_STAGGER_MS + FLIGHT_DURATION_S * 1000 + 180;
      schedule(() => setPhase('REFILL_IMAGES'), allLandedAt);
    } else if (phase === 'REFILL_IMAGES') {
      images.forEach((_, idx) => {
        schedule(() => {
          setVisibleImages((prev) => {
            const next = [...prev];
            next[idx] = true;
            return next;
          });
        }, 180 + idx * FILL_STEP_MS);
      });

      const doneAt =
        180 + (images.length - 1) * FILL_STEP_MS + FULL_HOLD_MS + SHRINK_DURATION_S * 1000;
      schedule(() => setPhase('COMPLETED'), doneAt);
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [phase, images, shouldReduceMotion, hasMeasured, rightMiddleExitOrder]);

  const computeExpandGeometry = useCallback((mode: ExpandedMode): ExpandGeometry | null => {
    const leftCard = leftCardRef.current;
    const rightCard = rightCardRef.current;
    if (!leftCard || !rightCard) return null;

    const L = toViewportRect(leftCard.getBoundingClientRect());
    const R = toViewportRect(rightCard.getBoundingClientRect());
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const finalW = Math.round(vw * 0.8);
    const finalH = Math.round(vh * 0.8);
    const finalLeft = Math.round((vw - finalW) / 2);
    const finalTop = Math.round((vh - finalH) / 2);

    const start = mode === 'images' ? L : R;
    const merged: ViewportBoxRect = {
      left: L.left,
      top: start.top,
      right: R.right,
      bottom: start.bottom,
      width: R.right - L.left,
      height: Math.max(L.height, R.height),
    };

    return {
      start,
      merged,
      final: { left: finalLeft, top: finalTop, width: finalW, height: finalH },
    };
  }, []);

  const openExpanded = useCallback(
    (mode: ExpandedMode) => {
      clearExpandTimers();
      const geo = computeExpandGeometry(mode);
      if (!geo) return;

      setExpandGeometry(geo);
      setContentVisible(false);
      setExpandStage('start');
      setExpandedMode(mode);

      const mergeId = window.setTimeout(() => {
        setExpandStage('merging');
      }, 25);

      const expandId = window.setTimeout(() => {
        setExpandStage('expanded');
      }, 25 + MERGE_DURATION_S * 1000 + 60);

      const contentId = window.setTimeout(() => {
        setContentVisible(true);
      }, 25 + MERGE_DURATION_S * 1000 + 60 + EXPAND_DURATION_S * 1000 * 0.7);

      expandTimersRef.current = [mergeId, expandId, contentId];
    },
    [clearExpandTimers, computeExpandGeometry],
  );

  const closeExpanded = useCallback(() => {
    if (!expandedMode) return;
    clearExpandTimers();
    setContentVisible(false);
    setHoveredImage(null);
    setExpandStage('closing');

    const closeId = window.setTimeout(() => {
      setExpandedMode(null);
      setExpandStage('start');
    }, CLOSE_DURATION_S * 1000);

    expandTimersRef.current = [closeId];
  }, [clearExpandTimers, expandedMode]);

  const closeAllToHome = useCallback(() => {
    clearExpandTimers();
    setFullscreenImage(null);
    setExpandedMode(null);
    setExpandStage('start');
    setContentVisible(false);
    setHoveredImage(null);
  }, [clearExpandTimers]);

  useEffect(() => {
    return () => {
      clearExpandTimers();
    };
  }, [clearExpandTimers]);

  useEffect(() => {
    if (!expandedMode) return;
    const onResize = () => {
      if (window.innerWidth < 1024) {
        clearExpandTimers();
        setExpandedMode(null);
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const finalW = Math.round(vw * 0.8);
      const finalH = Math.round(vh * 0.8);
      setExpandGeometry((prev) =>
        prev
          ? {
              ...prev,
              final: {
                left: Math.round((vw - finalW) / 2),
                top: Math.round((vh - finalH) / 2),
                width: finalW,
                height: finalH,
              },
            }
          : prev,
      );
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [expandedMode, clearExpandTimers]);

  // Context-aware desktop keyboard intelligence (Ctrl+B, Ctrl+V, Esc)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (suspendShortcuts) return;
      if (window.innerWidth < 1024) return;

      const target = event.target as HTMLElement | null;
      const isInputFocused =
        target !== null &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (event.key === 'Escape') {
        if (fullscreenImage) {
          event.preventDefault();
          setFullscreenImage(null);
          return;
        }
        if (expandedMode !== null) {
          event.preventDefault();
          closeExpanded();
          return;
        }
      }

      if (!event.ctrlKey || event.altKey || event.metaKey) return;

      const key = event.key.toLowerCase();

      // General return-to-home command: Ctrl+X closes any expanded/fullscreen overlay back to home
      if (key === 'x') {
        if (isInputFocused) return;
        if (fullscreenImage) {
          event.preventDefault();
          closeAllToHome();
          return;
        }
        if (expandedMode !== null && expandStage !== 'closing') {
          event.preventDefault();
          closeExpanded();
          return;
        }
        return;
      }

      // 1. Inside fullscreen edge-to-edge image viewer: Ctrl+B closes immediately back to home
      if (fullscreenImage) {
        if (key === 'b') {
          event.preventDefault();
          closeAllToHome();
        }
        return;
      }

      // 2. Inside 80% Images view
      if (expandedMode === 'images' && expandStage !== 'closing') {
        if (key === 'b') {
          event.preventDefault();
          closeExpanded();
          return;
        }
        if (key === 'v') {
          event.preventDefault();
          // Opposite command while hovering an image opens it edge-to-edge fullscreen
          if (hoveredImage) {
            setFullscreenImage(hoveredImage);
          }
          return;
        }
        return;
      }

      // 3. Inside 80% URLs view: no extra commands, only Ctrl+X (handled above) and X/Esc return to home
      if (expandedMode === 'urls' && expandStage !== 'closing') {
        return;
      }

      // 4. On Home screen (no 80% view open)
      if (key === 'b') {
        event.preventDefault();
        if (hoveredImage) {
          setFullscreenImage(hoveredImage);
          return;
        }
        openExpanded('images');
        return;
      }

      if (key === 'v') {
        if (isInputFocused) return;
        event.preventDefault();
        openExpanded('urls');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    suspendShortcuts,
    fullscreenImage,
    expandedMode,
    expandStage,
    hoveredImage,
    openExpanded,
    closeExpanded,
    closeAllToHome,
  ]);

  const handleCopyUrl = async (item: CatalogImageItem) => {
    try {
      await navigator.clipboard.writeText(item.cleanUrl);
      setCopiedId(item.id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === item.id ? null : prev));
      }, 1600);
    } catch {
      setCopiedId(null);
    }
  };

  // Click on the pure-white outer border or corner of either box when animation has finished
  const handleLeftBorderClick = (event: MouseEvent<HTMLElement>) => {
    if (phase !== 'COMPLETED') return;
    if (event.target === leftCardRef.current || event.target === leftStageRef.current) {
      openExpanded('images');
    }
  };

  const handleRightBorderClick = (event: MouseEvent<HTMLElement>) => {
    if (phase !== 'COMPLETED') return;
    if (event.target === rightCardRef.current || event.target === rightStageRef.current) {
      openExpanded('urls');
    }
  };

  const tileWidth =
    rects.left.width > 0 ? (rects.left.width - TILE_GAP * (grid.cols - 1)) / grid.cols : 0;
  const tileHeight =
    rects.left.height > 0 ? (rects.left.height - TILE_GAP * (grid.rows - 1)) / grid.rows : 0;

  const rowHeight =
    rects.right.height > 0
      ? (rects.right.height - URL_ROW_GAP * (images.length - 1)) / images.length
      : 20;

  const isFillShrinkActive = phase === 'FILL_IMAGES' || phase === 'REFILL_IMAGES';
  const isCompleted = phase === 'COMPLETED';

  const headingClasses =
    'text-sm font-semibold text-white tracking-tight mb-2.5 pl-1 drop-shadow-[0_1px_10px_rgba(0,0,0,0.65)] transition-colors duration-300';

  const cardClasses = `h-[min(50vh,380px)] min-h-[320px] w-full rounded-3xl bg-white border border-white/85 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] p-4 transition-shadow duration-300 ${
    isCompleted ? 'cursor-pointer' : ''
  }`;

  const isExpandingActive = expandedMode !== null && expandStage !== 'closing';

  const currentExpandedRect = useMemo(() => {
    if (!expandGeometry) return null;
    if (expandStage === 'start' || expandStage === 'closing') {
      return {
        left: expandGeometry.start.left,
        top: expandGeometry.start.top,
        width: expandGeometry.start.width,
        height: expandGeometry.start.height,
        borderRadius: 24,
        opacity: expandStage === 'closing' ? 0 : 1,
      };
    }
    if (expandStage === 'merging') {
      return {
        left: expandGeometry.merged.left,
        top: expandGeometry.merged.top,
        width: expandGeometry.merged.width,
        height: expandGeometry.merged.height,
        borderRadius: 24,
        opacity: 1,
      };
    }
    return {
      left: expandGeometry.final.left,
      top: expandGeometry.final.top,
      width: expandGeometry.final.width,
      height: expandGeometry.final.height,
      borderRadius: 28,
      opacity: 1,
    };
  }, [expandGeometry, expandStage]);

  const currentExpandedTransition = useMemo(() => {
    if (expandStage === 'merging') {
      return { duration: MERGE_DURATION_S, ease: [0.22, 1, 0.36, 1] as const };
    }
    if (expandStage === 'expanded') {
      return { duration: EXPAND_DURATION_S, ease: [0.22, 1, 0.36, 1] as const };
    }
    if (expandStage === 'closing') {
      return { duration: CLOSE_DURATION_S, ease: [0.4, 0, 1, 1] as const };
    }
    return { duration: 0 };
  }, [expandStage]);

  return (
    <>
      <div
        ref={containerRef}
        className="relative z-10 hidden lg:grid grid-cols-2 gap-14 xl:gap-20 w-full max-w-[960px] mt-8"
      >
        {/* Left column: Images */}
        <motion.div
          animate={{ opacity: isExpandingActive && expandedMode === 'urls' ? 0 : 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col"
        >
          <h2 className={headingClasses}>Aquí verás tus imágenes</h2>
          <section
            ref={leftCardRef}
            onClick={handleLeftBorderClick}
            aria-label="Aquí verás tus imágenes"
            title={isCompleted ? 'Toca el borde blanco para ampliar' : undefined}
            className={cardClasses}
          >
            <div
              ref={leftStageRef}
              onClick={handleLeftBorderClick}
              className="relative w-full h-full overflow-hidden rounded-2xl bg-white cursor-default"
            >
              {rects.left.width > 0 &&
                images.map((item, index) => {
                  if (!visibleImages[index]) return null;

                  const col = index % grid.cols;
                  const row = Math.floor(index / grid.cols);
                  const targetX = col * (tileWidth + TILE_GAP);
                  const targetY = row * (tileHeight + TILE_GAP);

                  if (shouldReduceMotion || !isFillShrinkActive) {
                    return (
                      <div
                        key={`grid-${index}`}
                        onMouseEnter={() => setHoveredImage(item)}
                        onMouseLeave={() =>
                          setHoveredImage((prev) => (prev?.id === item.id ? null : prev))
                        }
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setFullscreenImage(item);
                        }}
                        style={{
                          left: targetX,
                          top: targetY,
                          width: tileWidth,
                          height: tileHeight,
                        }}
                        className="absolute overflow-hidden rounded-[10px] bg-white shadow-xs cursor-zoom-in"
                      >
                        <TileImage
                          item={item}
                          hasError={Boolean(failedIds[item.id])}
                          onError={() =>
                            setFailedIds((prev) => ({ ...prev, [item.id]: true }))
                          }
                        />
                      </div>
                    );
                  }

                  return (
                    <ShrinkingIntroTile
                      key={`intro-${phase}-${item.id}`}
                      item={item}
                      index={index}
                      stageWidth={rects.left.width}
                      stageHeight={rects.left.height}
                      targetX={targetX}
                      targetY={targetY}
                      tileWidth={tileWidth}
                      tileHeight={tileHeight}
                      hasError={Boolean(failedIds[item.id])}
                      onError={() =>
                        setFailedIds((prev) => ({ ...prev, [item.id]: true }))
                      }
                    />
                  );
                })}
            </div>
          </section>
        </motion.div>

        {/* Right column: Clean URLs */}
        <motion.div
          animate={{ opacity: isExpandingActive && expandedMode === 'images' ? 0 : 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col"
        >
          <h2 className={headingClasses}>Acá verás tu URL</h2>
          <section
            ref={rightCardRef}
            onClick={handleRightBorderClick}
            aria-label="Acá verás tu URL"
            title={isCompleted ? 'Toca el borde blanco para ampliar' : undefined}
            className={cardClasses}
          >
            <div
              ref={rightStageRef}
              onClick={handleRightBorderClick}
              className="relative w-full h-full overflow-hidden rounded-2xl bg-white cursor-default"
            >
              {rects.right.width > 0 &&
                images.map((_, rowIdx) => {
                  if (!visibleUrls[rowIdx]) return null;
                  const mappedImgIndex = rightMiddleExitOrder[rowIdx] ?? rowIdx;
                  const item = images[mappedImgIndex];
                  const topY = rowIdx * (rowHeight + URL_ROW_GAP);
                  const isActive = activeBackgroundId === item.id;

                  return (
                    <div
                      key={`url-row-${rowIdx}-${item.id}`}
                      style={{
                        top: topY,
                        left: 0,
                        width: rects.right.width,
                        height: rowHeight,
                      }}
                      className="absolute flex items-center"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBackground(item);
                        }}
                        aria-pressed={isActive}
                        className={`group w-full h-full flex items-center gap-2 px-2.5 rounded-lg text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                          isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                        }`}
                        title={`Ver ${item.alt} en el fondo`}
                      >
                        <Eye
                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                            isActive
                              ? 'text-slate-950'
                              : 'text-slate-400 group-hover:text-slate-900'
                          }`}
                          aria-hidden="true"
                        />
                        <span
                          className={`font-mono text-[11px] leading-none truncate tabular-nums ${
                            isActive
                              ? 'text-slate-950 font-medium'
                              : 'text-slate-700 group-hover:text-slate-950'
                          }`}
                        >
                          {item.cleanUrl}
                        </span>
                      </button>
                    </div>
                  );
                })}
            </div>
          </section>
        </motion.div>

        {/* Cross-box flight overlay layer */}
        {rects.left.width > 0 && rects.right.width > 0 && flights.length > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-0 z-30 overflow-visible"
          >
            {flights.map((flight) => {
              const item = images[flight.index];
              const col = flight.index % grid.cols;
              const row = Math.floor(flight.index / grid.cols);

              const tileStartX = rects.left.x + col * (tileWidth + TILE_GAP);
              const tileStartY = rects.left.y + row * (tileHeight + TILE_GAP);

              const midCol = grid.cols - 1;
              const midRow = Math.floor(grid.rows / 2);
              const leftPortalX = rects.left.x + midCol * (tileWidth + TILE_GAP);
              const leftPortalY = rects.left.y + midRow * (tileHeight + TILE_GAP);

              const rightPortalX = rects.right.x;
              const rightPortalY =
                rects.right.y + rects.right.height / 2 - rowHeight / 2;

              const urlTargetY =
                rects.right.y + flight.targetSlot * (rowHeight + URL_ROW_GAP);

              return (
                <FlightToUrlCard
                  key={flight.key}
                  item={item}
                  startX={tileStartX}
                  startY={tileStartY}
                  portalLeftX={leftPortalX}
                  portalLeftY={leftPortalY}
                  portalRightX={rightPortalX}
                  portalRightY={rightPortalY}
                  endX={rects.right.x}
                  endY={urlTargetY}
                  tileWidth={tileWidth}
                  tileHeight={tileHeight}
                  rowWidth={rects.right.width}
                  rowHeight={rowHeight}
                  hasError={Boolean(failedIds[item.id])}
                  onError={() =>
                    setFailedIds((prev) => ({ ...prev, [item.id]: true }))
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Expanded 80% Desktop Overlay triggered by Ctrl+B / Ctrl+V or clicking box white edge */}
      {expandedMode && expandGeometry && currentExpandedRect && (
        <div className="fixed inset-0 z-40 hidden lg:block">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: expandStage === 'expanded' ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            onClick={closeExpanded}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2px]"
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={
              expandedMode === 'images'
                ? 'Vista ampliada de imágenes'
                : 'Vista ampliada de URLs'
            }
            initial={{
              left: expandGeometry.start.left,
              top: expandGeometry.start.top,
              width: expandGeometry.start.width,
              height: expandGeometry.start.height,
              borderRadius: 24,
              opacity: 1,
            }}
            animate={currentExpandedRect}
            transition={currentExpandedTransition}
            className="fixed bg-white border border-slate-200/90 shadow-[0_28px_80px_-16px_rgba(15,23,42,0.28)] overflow-hidden flex flex-col p-6"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: contentVisible ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 shrink-0"
            >
              <div className="flex items-baseline gap-3">
                <h2 className="text-lg font-semibold text-slate-950 tracking-tight">
                  {expandedMode === 'images'
                    ? 'Aquí verás tus imágenes'
                    : 'Acá verás tu URL'}
                </h2>
                <span className="text-xs text-slate-400 tabular-nums">
                  {images.length} elementos
                </span>
              </div>

              <button
                type="button"
                onClick={closeExpanded}
                aria-label="Cerrar vista ampliada"
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-950 hover:bg-slate-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <X className="w-4.5 h-4.5" aria-hidden="true" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: contentVisible ? 1 : 0 }}
              transition={{ duration: 0.22 }}
              className="flex-1 min-h-0 pt-5"
            >
              {expandedMode === 'images' ? (
                <div className="w-full h-full grid grid-cols-5 grid-rows-3 gap-4">
                  {images.map((item) => (
                    <button
                      key={`expanded-img-${item.id}`}
                      type="button"
                      onMouseEnter={() => setHoveredImage(item)}
                      onMouseLeave={() =>
                        setHoveredImage((prev) => (prev?.id === item.id ? null : prev))
                      }
                      onClick={() => onSelectBackground(item)}
                      onDoubleClick={() => setFullscreenImage(item)}
                      className="group relative w-full h-full overflow-hidden rounded-2xl bg-white border border-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-zoom-in"
                      title={`Doble clic para ver ${item.alt} en pantalla completa`}
                    >
                      <TileImage
                        item={item}
                        hasError={Boolean(failedIds[item.id])}
                        onError={() =>
                          setFailedIds((prev) => ({ ...prev, [item.id]: true }))
                        }
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-slate-950/65 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end justify-between">
                        <span className="text-xs font-medium text-white truncate">
                          {item.alt}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full overflow-y-auto pr-1 flex flex-col justify-between gap-1.5">
                  {orderedUrlItems.map((item) => {
                    const isActive = activeBackgroundId === item.id;
                    const isCopied = copiedId === item.id;

                    return (
                      <div
                        key={`expanded-url-${item.id}`}
                        className={`group flex items-center justify-between gap-4 px-3.5 py-2 rounded-xl transition-colors duration-150 ${
                          isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onSelectBackground(item)}
                            aria-pressed={isActive}
                            aria-label={`Usar ${item.alt} como fondo`}
                            title={`Usar ${item.alt} como fondo`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                          >
                            <Eye
                              className={`w-4 h-4 transition-colors ${
                                isActive
                                  ? 'text-slate-950'
                                  : 'text-slate-400 group-hover:text-slate-900'
                              }`}
                              aria-hidden="true"
                            />
                          </button>

                          <a
                            href={item.sourcePageUrl ?? item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-1 min-w-0 font-mono text-sm truncate tabular-nums hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded py-0.5 ${
                              isActive
                                ? 'text-slate-950 font-medium'
                                : 'text-slate-700 hover:text-slate-950'
                            }`}
                            title={`Abrir imagen original: ${item.alt}`}
                          >
                            {item.cleanUrl}
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-950 hover:bg-white border border-transparent hover:border-slate-200 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                              <span className="text-emerald-700">Copiada</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.section>
        </div>
      )}

      {/* Fullscreen edge-to-edge image viewer ("de punta a punta todo el computador") */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            key={`fullscreen-${fullscreenImage.id}`}
            role="dialog"
            aria-modal="true"
            aria-label={fullscreenImage.alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 hidden lg:flex items-center justify-center bg-slate-950 overflow-hidden"
          >
            {/* Ambient edge-to-edge atmospheric backdrop so 1:1 images feel seamless from corner to corner */}
            <img
              src={fullscreenImage.url}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              decoding="sync"
              className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover opacity-35 blur-3xl scale-110"
            />

            <motion.img
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              src={fullscreenImage.url}
              alt={fullscreenImage.alt}
              referrerPolicy="no-referrer"
              decoding="sync"
              className="relative z-10 w-full h-full object-contain select-none"
              draggable={false}
            />

            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              aria-label="Cerrar imagen en pantalla completa"
              className="fixed top-5 right-5 z-20 w-11 h-11 rounded-full bg-black/55 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface ShrinkingIntroTileProps {
  item: CatalogImageItem;
  index: number;
  stageWidth: number;
  stageHeight: number;
  targetX: number;
  targetY: number;
  tileWidth: number;
  tileHeight: number;
  hasError: boolean;
  onError: () => void;
}

function ShrinkingIntroTile({
  item,
  index,
  stageWidth,
  stageHeight,
  targetX,
  targetY,
  tileWidth,
  tileHeight,
  hasError,
  onError,
}: ShrinkingIntroTileProps) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSettled(true);
    }, FULL_HOLD_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{
        left: 0,
        top: 0,
        width: stageWidth,
        height: stageHeight,
        borderRadius: 16,
        opacity: 1,
      }}
      animate={
        settled
          ? {
              left: targetX,
              top: targetY,
              width: tileWidth,
              height: tileHeight,
              borderRadius: 10,
              opacity: 1,
            }
          : {
              left: 0,
              top: 0,
              width: stageWidth,
              height: stageHeight,
              borderRadius: 16,
              opacity: 1,
            }
      }
      transition={{ duration: SHRINK_DURATION_S, ease: [0.22, 1, 0.36, 1] }}
      style={{ zIndex: settled ? 10 + index : 50 + index }}
      className="absolute overflow-hidden bg-white shadow-xs"
    >
      <TileImage item={item} hasError={hasError} onError={onError} />
    </motion.div>
  );
}

interface FlightToUrlCardProps {
  item: CatalogImageItem;
  startX: number;
  startY: number;
  portalLeftX: number;
  portalLeftY: number;
  portalRightX: number;
  portalRightY: number;
  endX: number;
  endY: number;
  tileWidth: number;
  tileHeight: number;
  rowWidth: number;
  rowHeight: number;
  hasError: boolean;
  onError: () => void;
}

function FlightToUrlCard({
  item,
  startX,
  startY,
  portalLeftX,
  portalLeftY,
  portalRightX,
  portalRightY,
  endX,
  endY,
  tileWidth,
  tileHeight,
  rowWidth,
  rowHeight,
  hasError,
  onError,
}: FlightToUrlCardProps) {
  const midMorphWidth = Math.min(rowWidth * 0.72, 240);
  const midMorphHeight = Math.max(rowHeight * 1.45, 32);

  return (
    <motion.div
      initial={{
        left: startX,
        top: startY,
        width: tileWidth,
        height: tileHeight,
        borderRadius: 10,
      }}
      animate={{
        left: [startX, portalLeftX, portalRightX, endX],
        top: [startY, portalLeftY, portalRightY, endY],
        width: [tileWidth, tileWidth, midMorphWidth, rowWidth],
        height: [tileHeight, tileHeight, midMorphHeight, rowHeight],
        borderRadius: [10, 10, 999, 8],
      }}
      transition={{
        duration: FLIGHT_DURATION_S,
        times: [0, 0.24, 0.64, 1],
        ease: 'easeInOut',
      }}
      className="absolute overflow-hidden bg-white shadow-md border border-slate-200/80"
    >
      <motion.div
        animate={{ opacity: [1, 1, 0.35, 0] }}
        transition={{
          duration: FLIGHT_DURATION_S,
          times: [0, 0.48, 0.7, 0.84],
          ease: 'easeOut',
        }}
        className="absolute inset-0"
      >
        <TileImage item={item} hasError={hasError} onError={onError} />
      </motion.div>

      <motion.div
        animate={{ opacity: [0, 0, 0.85, 1] }}
        transition={{
          duration: FLIGHT_DURATION_S,
          times: [0, 0.52, 0.76, 0.92],
          ease: 'easeIn',
        }}
        className="absolute inset-0 flex items-center gap-2 px-2.5 bg-white"
      >
        <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
        <span className="font-mono text-[11px] leading-none text-slate-700 truncate">
          {item.cleanUrl}
        </span>
      </motion.div>
    </motion.div>
  );
}

interface TileImageProps {
  item: CatalogImageItem;
  hasError: boolean;
  onError: () => void;
}

function TileImage({ item, hasError, onError }: TileImageProps) {
  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white text-slate-400">
        <ImageIcon className="w-5 h-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={item.url}
      alt={item.alt}
      referrerPolicy="no-referrer"
      loading="eager"
      decoding="sync"
      onError={onError}
      className="w-full h-full object-cover select-none"
      draggable={false}
    />
  );
}
