import type { AgencySourceLanguage } from './agencySourceFiles';

export type SyntaxTokenKind =
  | 'comment'
  | 'string'
  | 'keyword'
  | 'type'
  | 'number'
  | 'property'
  | 'operator'
  | 'punctuation'
  | 'plain';

export interface SyntaxToken {
  kind: SyntaxTokenKind;
  text: string;
}

const TS_KEYWORDS = new Set([
  'import',
  'from',
  'export',
  'default',
  'type',
  'interface',
  'const',
  'let',
  'var',
  'function',
  'return',
  'if',
  'else',
  'for',
  'of',
  'in',
  'while',
  'switch',
  'case',
  'break',
  'continue',
  'try',
  'catch',
  'finally',
  'throw',
  'new',
  'typeof',
  'keyof',
  'as',
  'extends',
  'readonly',
  'async',
  'await',
  'void',
  'true',
  'false',
  'null',
  'undefined',
]);

const BUILTIN_TYPES = new Set([
  'string',
  'number',
  'boolean',
  'unknown',
  'never',
  'object',
  'Record',
  'Array',
  'Promise',
  'Set',
  'Map',
  'Date',
  'Intl',
  'Window',
  'HTMLElement',
  'HTMLFormElement',
  'HTMLDivElement',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'FormEvent',
  'KeyboardEvent',
  'PointerEvent',
  'CustomEvent',
  'Storage',
]);

function tokenizeJsonLine(line: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    if (ch === '"') {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\') {
          j += 2;
          continue;
        }
        if (line[j] === '"') {
          j += 1;
          break;
        }
        j += 1;
      }
      const strText = line.slice(i, j);
      const rest = line.slice(j).trimStart();
      tokens.push({
        kind: rest.startsWith(':') ? 'property' : 'string',
        text: strText,
      });
      i = j;
      continue;
    }

    if (/[0-9-]/.test(ch)) {
      const match = /^-?\d+(?:\.\d+)?/.exec(line.slice(i));
      if (match) {
        tokens.push({ kind: 'number', text: match[0] });
        i += match[0].length;
        continue;
      }
    }

    if (/[a-zA-Z]/.test(ch)) {
      const match = /^[a-zA-Z]+/.exec(line.slice(i));
      if (match) {
        const word = match[0];
        tokens.push({
          kind:
            word === 'true' || word === 'false' || word === 'null'
              ? 'keyword'
              : 'plain',
          text: word,
        });
        i += word.length;
        continue;
      }
    }

    if (/[{}\[\],:]/.test(ch)) {
      tokens.push({ kind: 'punctuation', text: ch });
      i += 1;
      continue;
    }

    let j = i + 1;
    while (j < line.length && line[j] === ' ') j += 1;
    tokens.push({ kind: 'plain', text: line.slice(i, j) });
    i = j;
  }

  return tokens;
}

/**
 * Character-preserving multi-line source highlighter for TSX, TS, and JSON.
 * Preserves exact line counts and character offsets for aligned editable overlays.
 */
export function highlightSourceLines(
  code: string,
  language: AgencySourceLanguage,
): SyntaxToken[][] {
  const lines = code.split('\n');
  if (language === 'json') {
    return lines.map((line) => tokenizeJsonLine(line));
  }

  const result: SyntaxToken[][] = [];
  let inBlockComment = false;

  for (const line of lines) {
    const tokens: SyntaxToken[] = [];
    let i = 0;

    while (i < line.length) {
      if (inBlockComment) {
        const closeIdx = line.indexOf('*/', i);
        if (closeIdx === -1) {
          tokens.push({ kind: 'comment', text: line.slice(i) });
          i = line.length;
        } else {
          tokens.push({ kind: 'comment', text: line.slice(i, closeIdx + 2) });
          i = closeIdx + 2;
          inBlockComment = false;
        }
        continue;
      }

      if (line.startsWith('/*', i)) {
        const closeIdx = line.indexOf('*/', i + 2);
        if (closeIdx === -1) {
          tokens.push({ kind: 'comment', text: line.slice(i) });
          i = line.length;
          inBlockComment = true;
        } else {
          tokens.push({ kind: 'comment', text: line.slice(i, closeIdx + 2) });
          i = closeIdx + 2;
        }
        continue;
      }

      if (line.startsWith('//', i)) {
        tokens.push({ kind: 'comment', text: line.slice(i) });
        break;
      }

      const ch = line[i];

      if (ch === "'" || ch === '"' || ch === '`') {
        const quote = ch;
        let j = i + 1;
        while (j < line.length) {
          if (line[j] === '\\') {
            j += 2;
            continue;
          }
          if (line[j] === quote) {
            j += 1;
            break;
          }
          j += 1;
        }
        tokens.push({ kind: 'string', text: line.slice(i, j) });
        i = j;
        continue;
      }

      if (/[0-9]/.test(ch)) {
        const match = /^\d+(?:\.\d+)?/.exec(line.slice(i));
        if (match) {
          tokens.push({ kind: 'number', text: match[0] });
          i += match[0].length;
          continue;
        }
      }

      if (/[a-zA-Z_$]/.test(ch)) {
        const match = /^[a-zA-Z_$][a-zA-Z0-9_$]*/.exec(line.slice(i));
        if (match) {
          const word = match[0];
          const prevNonSpace =
            tokens.length > 0 ? tokens[tokens.length - 1]?.text.trim() : '';
          const nextChar = line[i + word.length];

          if (TS_KEYWORDS.has(word)) {
            tokens.push({ kind: 'keyword', text: word });
          } else if (
            BUILTIN_TYPES.has(word) ||
            (/^[A-Z][a-zA-Z0-9]*$/.test(word) && word.length > 1)
          ) {
            tokens.push({ kind: 'type', text: word });
          } else if (
            prevNonSpace === '<' ||
            prevNonSpace === '</' ||
            (nextChar === ':' && !line.slice(i + word.length).startsWith('::'))
          ) {
            tokens.push({ kind: 'property', text: word });
          } else {
            tokens.push({ kind: 'plain', text: word });
          }
          i += word.length;
          continue;
        }
      }

      if (
        line.startsWith('</', i) ||
        line.startsWith('/>', i) ||
        line.startsWith('=>', i) ||
        line.startsWith('===', i) ||
        line.startsWith('!==', i) ||
        line.startsWith('&&', i) ||
        line.startsWith('||', i)
      ) {
        const twoOrThree = line.startsWith('===', i) || line.startsWith('!==', i) ? 3 : 2;
        tokens.push({ kind: 'operator', text: line.slice(i, i + twoOrThree) });
        i += twoOrThree;
        continue;
      }

      if (/[{}()[\].,:;<>+\-*/=!&|?]/.test(ch)) {
        tokens.push({
          kind: /[=+\-*/<>!&|?]/.test(ch) ? 'operator' : 'punctuation',
          text: ch,
        });
        i += 1;
        continue;
      }

      let j = i + 1;
      while (j < line.length && /\s/.test(line[j])) j += 1;
      tokens.push({ kind: 'plain', text: line.slice(i, j) });
      i = j;
    }

    result.push(tokens);
  }

  return result;
}

export function getTokenColorClass(
  kind: SyntaxTokenKind,
  isDark: boolean,
): string {
  if (isDark) {
    switch (kind) {
      case 'comment':
        return 'text-[#6A9955]';
      case 'string':
        return 'text-[#CE9178]';
      case 'keyword':
        return 'text-[#C586C0]';
      case 'type':
        return 'text-[#4EC9B0]';
      case 'number':
        return 'text-[#B5CEA8]';
      case 'property':
        return 'text-[#9CDCFE]';
      case 'operator':
        return 'text-[#7DD3FC]';
      case 'punctuation':
        return 'text-[#94A3B8]';
      default:
        return 'text-[#E2E8F0]';
    }
  }

  switch (kind) {
    case 'comment':
      return 'text-[#008000]';
    case 'string':
      return 'text-[#A31515]';
    case 'keyword':
      return 'text-[#AF00DB]';
    case 'type':
      return 'text-[#267F99]';
    case 'number':
      return 'text-[#098658]';
    case 'property':
      return 'text-[#0451A5]';
    case 'operator':
      return 'text-[#0284C7]';
    case 'punctuation':
      return 'text-[#64748B]';
    default:
      return 'text-[#0F172A]';
  }
}
