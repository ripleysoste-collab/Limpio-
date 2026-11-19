import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useI18n } from '../lib/i18n';

interface SourceCodeLibrarySectionProps {
  visible: boolean;
  onOpenPreview?: () => void;
  onOpenEditor?: () => void;
}

type LibraryActionId = 'github' | 'zip' | 'editor' | 'preview';

const ACTION_IDS: LibraryActionId[] = ['github', 'zip', 'editor', 'preview'];

export function SourceCodeLibrarySection({
  visible,
  onOpenPreview,
  onOpenEditor,
}: SourceCodeLibrarySectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const { t } = useI18n();
  const [selectedAction, setSelectedAction] = useState<LibraryActionId | null>(
    null,
  );

  const handleActionClick = (actionId: LibraryActionId) => {
    if (actionId === 'preview' && onOpenPreview) {
      setSelectedAction(null);
      onOpenPreview();
      return;
    }
    if (actionId === 'editor' && onOpenEditor) {
      setSelectedAction(null);
      onOpenEditor();
      return;
    }
    setSelectedAction((prev) => (prev === actionId ? null : actionId));
  };

  const activeFeedback = selectedAction
    ? t.sourceCode.actions[selectedAction].feedback
    : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          key="source-code-library-section"
          aria-label={t.sourceCode.sectionAria}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full mt-5 pb-4 lg:mt-6 lg:pb-16 lg:max-w-[1360px] lg:mx-auto"
        >
          {/* Mobile Header: dark text directly over the luminous mobile background */}
          <div className="lg:hidden mb-2.5 pl-1">
            <h2 className="text-[13.5px] font-semibold text-slate-950 tracking-[-0.015em] leading-tight">
              {t.sourceCode.mobileSectionTitle}
            </h2>
            <p className="mt-0.5 text-[11px] font-normal text-slate-500 leading-snug">
              {t.sourceCode.mobileSectionSubtitle}
            </p>
          </div>

          {/* Mobile Horizontal Swipe Track (sized so 2 cards fit side-by-side and swipe cleanly) */}
          <div className="lg:hidden -mx-4 sm:-mx-5 w-[calc(100%+2rem)] sm:w-[calc(100%+2.5rem)] overflow-x-auto snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-5 px-4 sm:px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-stretch gap-2.5 w-max pr-4 sm:pr-5">
              <article
                aria-label={t.sourceCode.whatsappCardAria}
                className="w-[44vw] min-w-[162px] max-w-[196px] shrink-0 snap-start rounded-[18px] bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-[0_14px_38px_-12px_rgba(15,23,42,0.11),0_4px_12px_-4px_rgba(37,99,235,0.06)] px-3 py-2.5 flex flex-col"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    aria-hidden="true"
                    className="w-7 h-7 rounded-xl bg-[#25D366]/12 flex items-center justify-center shrink-0"
                  >
                    <WhatsAppBrandIcon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[11.5px] font-semibold text-slate-950 tracking-tight leading-tight truncate">
                      {t.sourceCode.whatsappTitle}
                    </h3>
                    <p className="text-[9.5px] text-slate-500 truncate mt-0.5">
                      {t.sourceCode.whatsappSubtitle}
                    </p>
                  </div>
                </div>

                <p className="mt-2 text-[10px] leading-[1.35] text-slate-600 line-clamp-3">
                  {t.sourceCode.whatsappDescription}
                </p>

                <ul className="mt-2 pt-0.5 border-t border-slate-100 divide-y divide-slate-100/90">
                  {ACTION_IDS.map((actionId) => {
                    const isSelected = selectedAction === actionId;
                    const label = t.sourceCode.actions[actionId].label;
                    return (
                      <li key={`mob-${actionId}`}>
                        <button
                          type="button"
                          onClick={() => handleActionClick(actionId)}
                          className={`w-full py-1.5 text-left text-[10.5px] leading-tight transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline ${
                            isSelected
                              ? 'font-medium text-blue-700'
                              : 'font-normal text-blue-600 hover:text-blue-700 active:opacity-70'
                          }`}
                        >
                          {label}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {activeFeedback && (
                  <p
                    role="status"
                    className="mt-1.5 pt-1.5 border-t border-slate-100 text-[9.5px] leading-snug text-slate-500"
                  >
                    {activeFeedback}
                  </p>
                )}
              </article>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-5 px-1">
            <h2 className="text-xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] text-balance">
              {t.sourceCode.sectionTitle}
            </h2>
            <p className="mt-1 text-sm text-white/85 drop-shadow-[0_1px_10px_rgba(0,0,0,0.6)]">
              {t.sourceCode.sectionSubtitle}
            </p>
          </div>

          {/* Desktop Left-aligned grid ready to scale horizontally across all starter kits */}
          <div className="hidden lg:flex flex-wrap gap-4 items-start">
            <article
              aria-label={t.sourceCode.whatsappCardAria}
              className="w-[258px] shrink-0 rounded-3xl bg-white border border-white/85 shadow-[0_18px_44px_-14px_rgba(0,0,0,0.48)] px-5 py-4 flex flex-col"
            >
              {/* Brand logo + title */}
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="w-9 h-9 rounded-2xl bg-[#25D366]/12 flex items-center justify-center shrink-0"
                >
                  <WhatsAppBrandIcon className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold text-slate-950 tracking-tight truncate">
                    {t.sourceCode.whatsappTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    {t.sourceCode.whatsappSubtitle}
                  </p>
                </div>
              </div>

              {/* Minimal description */}
              <p className="mt-3 text-[12px] leading-relaxed text-slate-600">
                {t.sourceCode.whatsappDescription}
              </p>

              {/* Pure clickable text actions (matching Productividad aesthetic, no filled buttons) */}
              <ul className="mt-3.5 pt-0.5 border-t border-slate-100 divide-y divide-slate-100/90">
                {ACTION_IDS.map((actionId) => {
                  const isSelected = selectedAction === actionId;
                  const label = t.sourceCode.actions[actionId].label;
                  return (
                    <li key={`desk-${actionId}`}>
                      <button
                        type="button"
                        onClick={() => handleActionClick(actionId)}
                        className={`w-full py-2 text-left text-[12.5px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline ${
                          isSelected
                            ? 'font-medium text-blue-700'
                            : 'font-normal text-blue-600 hover:text-blue-700 active:opacity-70'
                        }`}
                      >
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {activeFeedback && (
                <p
                  role="status"
                  className="mt-2 pt-2 border-t border-slate-100 text-[11px] leading-snug text-slate-500"
                >
                  {activeFeedback}
                </p>
              )}
            </article>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function WhatsAppBrandIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3.25C7.17 3.25 3.25 7.17 3.25 12C3.25 13.71 3.74 15.3 4.59 16.65L3.55 20.45L7.46 19.43C8.76 20.19 10.33 20.65 12 20.65C16.83 20.65 20.75 16.83 20.75 12C20.75 7.17 16.83 3.25 12 3.25Z"
        fill="#25D366"
      />
      <path
        d="M9.68 8.95C9.49 8.53 9.29 8.52 9.11 8.51H8.62C8.45 8.51 8.18 8.58 7.95 8.83C7.72 9.08 7.07 9.69 7.07 10.92C7.07 12.15 7.97 13.34 8.09 13.5C8.22 13.67 9.83 16.28 12.39 17.29C14.51 18.12 14.95 17.96 15.41 17.92C15.87 17.87 16.89 17.31 17.1 16.73C17.31 16.14 17.31 15.64 17.24 15.53C17.18 15.43 17.01 15.36 16.76 15.24C16.51 15.11 15.29 14.51 15.06 14.43C14.83 14.35 14.66 14.3 14.49 14.55C14.33 14.8 13.85 15.36 13.7 15.53C13.56 15.7 13.41 15.72 13.16 15.59C12.91 15.47 12.11 15.2 11.16 14.36C10.42 13.7 9.93 12.89 9.78 12.64C9.64 12.39 9.76 12.25 9.89 12.13C10 12.02 10.14 11.84 10.26 11.69C10.39 11.55 10.43 11.44 10.51 11.28C10.59 11.11 10.55 10.96 10.49 10.84C10.43 10.71 9.93 9.48 9.68 8.95Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
