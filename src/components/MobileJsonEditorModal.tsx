import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Copy, Lock, X } from 'lucide-react';

interface MobileJsonEditorModalProps {
  jsonText: string;
  onClose: () => void;
}

type JsonTokenType = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation';

interface JsonToken {
  type: JsonTokenType;
  text: string;
}

function tokenizeJsonLine(line: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  const regex =
    /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}[\],:])/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'punctuation',
        text: line.slice(lastIndex, match.index),
      });
    }

    const token = match[0];
    if (token.startsWith('"')) {
      if (token.endsWith(':')) {
        const colonIdx = token.lastIndexOf(':');
        tokens.push({ type: 'key', text: token.slice(0, colonIdx) });
        tokens.push({ type: 'punctuation', text: token.slice(colonIdx) });
      } else {
        tokens.push({ type: 'string', text: token });
      }
    } else if (token === 'true' || token === 'false') {
      tokens.push({ type: 'boolean', text: token });
    } else if (token === 'null') {
      tokens.push({ type: 'null', text: token });
    } else if (/^-?\d/.test(token)) {
      tokens.push({ type: 'number', text: token });
    } else {
      tokens.push({ type: 'punctuation', text: token });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({ type: 'punctuation', text: line.slice(lastIndex) });
  }

  return tokens;
}

const TOKEN_CLASSES: Record<JsonTokenType, string> = {
  key: 'text-sky-300',
  string: 'text-emerald-300',
  number: 'text-amber-300',
  boolean: 'text-violet-300',
  null: 'text-rose-300',
  punctuation: 'text-slate-400',
};

export function MobileJsonEditorModal({
  jsonText,
  onClose,
}: MobileJsonEditorModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => jsonText.split('\n'), [jsonText]);
  const tokenizedLines = useMemo(
    () => lines.map((line) => tokenizeJsonLine(line)),
    [lines],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.section
      role="dialog"
      aria-modal="true"
      aria-label="Editor JSON de solo lectura"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 lg:hidden bg-[#0d1117] text-slate-200 flex flex-col"
    >
      {/* Top IDE Header Bar */}
      <header className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-3 border-b border-slate-800/90 bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d1117] border border-slate-700/80 min-w-0">
            <span className="text-[11px] font-mono font-semibold text-amber-300 shrink-0">
              {'{}'}
            </span>
            <span className="font-mono text-xs font-medium text-slate-100 truncate">
              mapeo.json
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-slate-400 shrink-0">
            <Lock className="w-3 h-3 text-slate-500" aria-hidden="true" />
            Solo lectura
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => void handleCopyAll()}
            aria-label="Copiar todo el JSON"
            title="Copiar JSON"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400 stroke-[2.75]" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar editor"
            className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Read-only syntax-highlighted code canvas with line numbers */}
      <div
        aria-readonly="true"
        className="flex-1 min-h-0 overflow-auto py-3.5 px-2 font-mono text-[12px] leading-[1.65] select-text"
      >
        <div className="min-w-max">
          {tokenizedLines.map((tokens, idx) => (
            <div
              key={`code-line-${idx}`}
              className="flex items-start px-2 hover:bg-slate-800/35 rounded"
            >
              <span
                aria-hidden="true"
                className="w-8 pr-3 text-right text-[11px] text-slate-600 select-none shrink-0 tabular-nums"
              >
                {idx + 1}
              </span>
              <pre className="whitespace-pre font-mono">
                {tokens.length === 0 ? (
                  <span>{' '}</span>
                ) : (
                  tokens.map((tok, tIdx) => (
                    <span key={`tok-${idx}-${tIdx}`} className={TOKEN_CLASSES[tok.type]}>
                      {tok.text}
                    </span>
                  ))
                )}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle bottom status strip */}
      <footer className="px-4 py-2 border-t border-slate-800/90 bg-[#161b22] flex items-center justify-between text-[10.5px] font-mono text-slate-400 shrink-0">
        <span>JSON • UTF-8</span>
        <span>{lines.length} líneas</span>
      </footer>
    </motion.section>
  );
}
