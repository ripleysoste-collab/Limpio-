import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CheckCheck, Package, Pause, Play, RotateCcw } from 'lucide-react';
import whiteCourtSneaker from '../assets/images/white_court_sneaker_1795003832742.jpg';
import whiteRunnerSneaker from '../assets/images/white_runner_sneaker_1795003832857.jpg';

const WHATSAPP_WALLPAPER_URL = '/assets/aistudio/IMG_20261118_070436_08aaef60.jpg';

interface AutomationExamplesSectionProps {
  visible: boolean;
}

interface FootwearPreviewItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
}

const WHITE_FOOTWEAR_CATALOG: FootwearPreviewItem[] = [
  {
    id: 'court-blanco',
    name: 'Veloce Court Blanco',
    category: 'Cuero · Urbano',
    imageUrl: whiteCourtSneaker,
  },
  {
    id: 'runner-marfil',
    name: 'Veloce Runner Marfil',
    category: 'Knit · Ligero',
    imageUrl: whiteRunnerSneaker,
  },
];

// Animation step timeline:
// 1: User says "Hola"
// 2: Bot typing indicator
// 3: Bot replies "¡Hola! ¿Cómo estás? ¿Qué estás buscando hoy?"
// 4: User says "Quiero ver el catálogo de calzado blanco"
// 5: Bot typing indicator
// 6: Bot sends 2 rounded white footwear cards + "Aquí tienes lo que tenemos en catálogo."
type ConversationStep = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_TIMINGS_MS: Array<{ step: ConversationStep; delay: number }> = [
  { step: 1, delay: 450 },
  { step: 2, delay: 1350 },
  { step: 3, delay: 2250 },
  { step: 4, delay: 3700 },
  { step: 5, delay: 4650 },
  { step: 6, delay: 5650 },
];

const LOOP_RESET_DELAY_MS = 11000;

export function AutomationExamplesSection({
  visible,
}: AutomationExamplesSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState<ConversationStep>(
    shouldReduceMotion ? 6 : 1,
  );
  const [cycleId, setCycleId] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [wallpaperFailed, setWallpaperFailed] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!visible) return;
    if (shouldReduceMotion) {
      setStep(6);
      return;
    }
    if (isPaused) return;

    setStep(1);
    const timers: number[] = [];

    for (const item of STEP_TIMINGS_MS) {
      if (item.step === 1) continue;
      timers.push(
        window.setTimeout(() => {
          setStep(item.step);
        }, item.delay),
      );
    }

    timers.push(
      window.setTimeout(() => {
        setCycleId((prev) => prev + 1);
      }, LOOP_RESET_DELAY_MS),
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [visible, shouldReduceMotion, isPaused, cycleId]);

  const handleReplay = () => {
    setIsPaused(false);
    setStep(1);
    setCycleId((prev) => prev + 1);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          key="desktop-automation-examples"
          aria-label="Ejemplos de automatizaciones"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 hidden lg:block w-full max-w-[960px] mt-16 pb-16"
        >
          {/* Section heading directly below the dual showcase boxes */}
          <div className="mb-6 flex items-end justify-between gap-6 px-1">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] text-balance">
                Ejemplos de automatizaciones
              </h2>
              <p className="mt-1 text-sm text-white/85 drop-shadow-[0_1px_10px_rgba(0,0,0,0.6)]">
                Cómo actúa Search Link en diferentes plataformas
              </p>
            </div>

            {!shouldReduceMotion && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPaused((prev) => !prev)}
                  aria-label={isPaused ? 'Reanudar ejemplo' : 'Pausar ejemplo'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 bg-black/30 hover:bg-black/45 border border-white/20 backdrop-blur-md transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  {isPaused ? (
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReplay}
                  aria-label="Repetir animación del ejemplo"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 bg-black/30 hover:bg-black/45 border border-white/20 backdrop-blur-md transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Repetir</span>
                </button>
              </div>
            )}
          </div>

          {/* Showcase Stage: Large rounded WhatsApp chatbot example */}
          <div className="w-full flex flex-col items-center">
            <article
              aria-label="Ejemplo de conversación automatizada en WhatsApp"
              className="w-full max-w-[600px] rounded-3xl bg-white border border-white/85 shadow-[0_24px_60px_-14px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
            >
              {/* Authentic Business Header: Professional fictional brand logo + Enterprise */}
              <header className="px-5 py-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Professional geometric brand emblem (Veloce Calzado) */}
                  <div
                    aria-hidden="true"
                    className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center shrink-0 shadow-xs"
                  >
                    <svg
                      viewBox="0 0 28 28"
                      className="w-5 h-5"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.5 8.5L13.4 20.5L22.5 8.5"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M11 8.5L14.2 13.4L17.4 8.5"
                        stroke="#34D399"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[14.5px] font-semibold text-slate-950 tracking-tight truncate">
                        Veloce Calzado
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-slate-300 text-xs shrink-0"
                      >
                        ·
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
                        Enterprise
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 truncate">
                      Asistente de catálogo en WhatsApp
                    </p>
                  </div>
                </div>
              </header>

              {/* WhatsApp Authentic Wallpaper Canvas */}
              <div className="relative min-h-[500px] px-5 py-5 bg-[#EFEAE2] overflow-hidden flex flex-col justify-end">
                {!wallpaperFailed && (
                  <img
                    src={WHATSAPP_WALLPAPER_URL}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    onError={() => setWallpaperFailed(true)}
                    className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover opacity-85"
                  />
                )}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[#EFEAE2]/15"
                />

                <div
                  key={`wa-cycle-${cycleId}`}
                  className="relative z-10 flex flex-col gap-3 w-full"
                >
                  {/* Turn 1: User says "Hola" */}
                  {step >= 1 && (
                    <motion.div
                      initial={
                        shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-[#D9FDD3] px-3.5 py-2 shadow-[0_1px_2px_rgba(11,20,26,0.13)] text-[#111B21]">
                        <div className="flex items-end gap-2">
                          <p className="text-[13.5px] leading-snug">Hola</p>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#667781] tabular-nums shrink-0 translate-y-0.5">
                            10:42
                            <CheckCheck
                              className="w-3.5 h-3.5 text-[#53BDEB]"
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Turn 2: Typing indicator before greeting */}
                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(11,20,26,0.13)] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      </div>
                    </motion.div>
                  )}

                  {/* Turn 2: Bot replies "¡Hola! ¿Cómo estás? ¿Qué estás buscando hoy?" */}
                  {step >= 3 && (
                    <motion.div
                      initial={
                        shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="flex justify-start"
                    >
                      <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 shadow-[0_1px_2px_rgba(11,20,26,0.13)] text-[#111B21]">
                        <div className="flex items-end gap-2">
                          <p className="text-[13.5px] leading-snug">
                            ¡Hola! ¿Cómo estás? ¿Qué estás buscando hoy?
                          </p>
                          <span className="text-[10px] text-[#667781] tabular-nums shrink-0 translate-y-0.5">
                            10:42
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Turn 3: User asks for white footwear catalog */}
                  {step >= 4 && (
                    <motion.div
                      initial={
                        shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-[#D9FDD3] px-3.5 py-2 shadow-[0_1px_2px_rgba(11,20,26,0.13)] text-[#111B21]">
                        <div className="flex items-end gap-2">
                          <p className="text-[13.5px] leading-snug">
                            Quiero ver el catálogo de calzado blanco
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#667781] tabular-nums shrink-0 translate-y-0.5">
                            10:42
                            <CheckCheck
                              className="w-3.5 h-3.5 text-[#53BDEB]"
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Turn 4: Typing indicator while querying Search Link Core */}
                  {step === 5 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(11,20,26,0.13)] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      </div>
                    </motion.div>
                  )}

                  {/* Turn 4: Bot displays 2 rounded product image cards FIRST, then caption below */}
                  {step >= 6 && (
                    <motion.div
                      initial={
                        shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="flex justify-start"
                    >
                      <div className="w-full max-w-[92%] rounded-2xl rounded-tl-sm bg-white p-2.5 shadow-[0_1px_2px_rgba(11,20,26,0.14)] text-[#111B21]">
                        {/* 2 rounded footwear product cards */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {WHITE_FOOTWEAR_CATALOG.map((shoe, idx) => {
                            const broken = Boolean(failedImages[shoe.id]);
                            return (
                              <motion.div
                                key={shoe.id}
                                initial={
                                  shouldReduceMotion
                                    ? false
                                    : { opacity: 0, y: 8 }
                                }
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  duration: 0.24,
                                  delay: shouldReduceMotion ? 0 : idx * 0.08,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                                className="rounded-xl border border-slate-200/85 bg-slate-50/50 overflow-hidden"
                              >
                                <div className="aspect-[4/3] bg-slate-100 overflow-hidden flex items-center justify-center">
                                  {!broken ? (
                                    <img
                                      src={shoe.imageUrl}
                                      alt={shoe.name}
                                      decoding="async"
                                      referrerPolicy="no-referrer"
                                      onError={() =>
                                        setFailedImages((prev) => ({
                                          ...prev,
                                          [shoe.id]: true,
                                        }))
                                      }
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package
                                      className="w-5 h-5 text-slate-300"
                                      aria-hidden="true"
                                    />
                                  )}
                                </div>
                                <div className="px-2.5 py-2 bg-white">
                                  <p className="text-[12px] font-semibold text-slate-900 truncate">
                                    {shoe.name}
                                  </p>
                                  <p className="text-[10.5px] text-slate-500 truncate">
                                    {shoe.category}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Friendly reply text right below the 2 cards */}
                        <div className="mt-2.5 px-1 pb-0.5 flex items-end justify-between gap-2">
                          <p className="text-[13.5px] leading-snug text-[#111B21]">
                            Aquí tienes lo que tenemos en catálogo.
                          </p>
                          <span className="text-[10px] text-[#667781] tabular-nums shrink-0">
                            10:43
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </article>

            {/* Clean platform label directly below the card */}
            <p className="mt-3 text-sm font-medium text-white tracking-tight drop-shadow-[0_1px_10px_rgba(0,0,0,0.65)]">
              WhatsApp · Chatbots
            </p>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
