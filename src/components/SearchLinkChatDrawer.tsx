import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUp, Loader2, Package, RotateCcw, X } from 'lucide-react';
import type { OrganizationServiceItem } from './DesktopOrganizationView';

interface ChatProductCard {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  imagen_url: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  products?: ChatProductCard[];
  error?: boolean;
}

interface SearchLinkChatDrawerProps {
  service: OrganizationServiceItem | null;
  organizationName: string;
  onClose: () => void;
}

export function SearchLinkChatDrawer({
  service,
  organizationName,
  onClose,
}: SearchLinkChatDrawerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [messagesByService, setMessagesByService] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeMessages = service ? messagesByService[service.id] ?? [] : [];

  useEffect(() => {
    if (!service) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [service?.id]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeMessages.length, isSending]);

  const handleResetChat = () => {
    if (!service || isSending) return;
    setMessagesByService((prev) => ({
      ...prev,
      [service.id]: [],
    }));
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!service || isSending) return;

    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      text: trimmed,
    };

    const currentHistory = (messagesByService[service.id] ?? [])
      .filter((m) => !m.error)
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessagesByService((prev) => ({
      ...prev,
      [service.id]: [...(prev[service.id] ?? []), userMsg],
    }));
    setInputValue('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: currentHistory,
          serviceSlug: service.slug,
          apiKey: service.apiKey,
          serviceName: service.name,
          organizationName,
          fallbackProducts: (service.products ?? []).map((prod) => ({
            id: prod.id,
            nombre: prod.nombre,
            categoria: prod.categoria,
            descripcion: prod.descripcion,
            imagen_url: prod.url,
            url: prod.url,
          })),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reply?: string;
        products?: ChatProductCard[];
        error?: string;
      };

      if (!res.ok || !data.ok) {
        const errMsg: ChatMessage = {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text:
            data.error ||
            'No se pudo obtener respuesta de Search Link IA en este momento.',
          error: true,
        };
        setMessagesByService((prev) => ({
          ...prev,
          [service.id]: [...(prev[service.id] ?? []), errMsg],
        }));
        return;
      }

      const botMsg: ChatMessage = {
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        text: data.reply || 'Aquí tienes la información de tu catálogo.',
        products: Array.isArray(data.products) ? data.products : [],
      };

      setMessagesByService((prev) => ({
        ...prev,
        [service.id]: [...(prev[service.id] ?? []), botMsg],
      }));
    } catch {
      const errMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: 'Error de red al conectar con Search Link IA. Intenta de nuevo.',
        error: true,
      };
      setMessagesByService((prev) => ({
        ...prev,
        [service.id]: [...(prev[service.id] ?? []), errMsg],
      }));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {service && (
        <motion.aside
          role="dialog"
          aria-modal="true"
          aria-label={`Search Link IA - ${service.name}`}
          initial={
            shouldReduceMotion ? { opacity: 0 } : { x: '-100%', opacity: 0.96 }
          }
          animate={shouldReduceMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
          exit={
            shouldReduceMotion ? { opacity: 0 } : { x: '-100%', opacity: 0.96 }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
          }
          className="fixed inset-0 lg:inset-y-0 lg:left-0 lg:right-auto lg:w-1/2 z-[60] lg:z-40 bg-white lg:border-r lg:border-slate-200/85 lg:shadow-[18px_0_48px_-18px_rgba(15,23,42,0.2)] flex flex-col"
        >
          {/* Minimal Top Bar: X on the top-left corner + Search Link IA title */}
          <header className="flex items-center justify-between gap-3 px-4 sm:px-6 pt-4 pb-3.5 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar Search Link IA"
                className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="flex items-baseline gap-2 min-w-0">
                <h2 className="text-[15px] font-semibold tracking-tight text-slate-950 whitespace-nowrap shrink-0">
                  Search Link IA
                </h2>
                <span
                  aria-hidden="true"
                  className="text-slate-300 text-xs shrink-0"
                >
                  ·
                </span>
                <span className="text-xs font-normal text-slate-500 truncate">
                  {service.name}
                </span>
              </div>
            </div>

            {activeMessages.length > 0 && (
              <button
                type="button"
                onClick={handleResetChat}
                disabled={isSending}
                aria-label="Reiniciar conversación"
                title="Nueva conversación"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 disabled:opacity-45"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Limpiar</span>
              </button>
            )}
          </header>

          {/* Pure White Conversation Surface */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 bg-white flex flex-col"
          >
            {activeMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 select-none">
                <div className="max-w-sm space-y-2">
                  <p className="text-lg font-semibold tracking-tight text-slate-950">
                    Search Link IA
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {organizationName !== 'Sin nombre'
                      ? `${organizationName} · `
                      : ''}
                    {service.name} · {service.itemCount}{' '}
                    {service.itemCount === 1 ? 'producto' : 'productos'} en vivo
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 max-w-2xl w-full mx-auto">
                {activeMessages.map((msg) =>
                  msg.role === 'user' ? (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[82%] rounded-2xl rounded-br-md bg-slate-900 text-white px-4 py-2.5 text-[13.5px] leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="space-y-3">
                      <div
                        className={`text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                          msg.error
                            ? 'rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2.5 text-rose-700'
                            : 'text-slate-800'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {msg.products && msg.products.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-0.5">
                          {msg.products.map((prod) => {
                            const imgBroken = failedImages[prod.id];
                            return (
                              <div
                                key={`${msg.id}-${prod.id}`}
                                className="rounded-xl border border-slate-200/85 bg-white overflow-hidden"
                              >
                                <div className="aspect-[4/3] bg-slate-50 overflow-hidden flex items-center justify-center">
                                  {prod.imagen_url && !imgBroken ? (
                                    <img
                                      src={prod.imagen_url}
                                      alt={prod.nombre}
                                      referrerPolicy="no-referrer"
                                      onError={() =>
                                        setFailedImages((prev) => ({
                                          ...prev,
                                          [prod.id]: true,
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
                                <div className="p-2 space-y-0.5">
                                  <p className="text-[11.5px] font-semibold text-slate-900 line-clamp-1">
                                    {prod.nombre}
                                  </p>
                                  <p className="text-[10.5px] text-slate-500 line-clamp-1">
                                    {prod.categoria}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ),
                )}

                {isSending && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                    <Loader2
                      className="w-3.5 h-3.5 animate-spin text-slate-500"
                      aria-hidden="true"
                    />
                    <span>Consultando catálogo...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Minimal Bottom Chat Input */}
          <div className="px-4 sm:px-6 pb-5 pt-3 border-t border-slate-100 bg-white shrink-0">
            <form
              onSubmit={handleSubmit}
              className="max-w-2xl mx-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-4 pr-1.5 py-1.5 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] focus-within:border-slate-400 transition-colors"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isSending}
                placeholder="Escribe tu mensaje..."
                aria-label="Escribe tu mensaje para Search Link IA"
                className="flex-1 min-w-0 bg-transparent text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isSending || !inputValue.trim()}
                aria-label="Enviar mensaje"
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowUp className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </form>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
