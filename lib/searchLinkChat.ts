import type { IncomingHttpHeaders } from 'node:http';
import {
  resolveSearchLinkCoreEndpoint,
  type SearchLinkCoreProduct,
  type SearchLinkCoreResponse,
} from './supabaseServer.ts';

export const SEARCH_LINK_CHAT_GROQ_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
];
export const SEARCH_LINK_IA_DAILY_LIMIT = 1;
export const SEARCH_LINK_IA_COOKIE_NAME = 'sl_ia_daily';

export function isDailyLimitEnforced(): boolean {
  return cleanEnv(process.env.SEARCH_LINK_IA_ENFORCE_LIMIT) === 'true';
}

const dailyUsageMemory = new Map<string, number>();

export interface SearchLinkChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface SearchLinkChatInput {
  message: string;
  history?: SearchLinkChatTurn[];
  serviceSlug?: string;
  apiKey?: string;
  serviceName?: string;
  organizationName?: string;
  userId?: string;
  fallbackProducts?: Array<{
    id?: string;
    nombre: string;
    categoria: string;
    descripcion: string;
    imagen_url?: string;
    url?: string;
  }>;
}

export type SearchLinkChatStreamEvent =
  | {
      type: 'products';
      products: SearchLinkCoreProduct[];
      totalCatalogProducts: number;
      coreSource: 'live_core' | 'session_cache';
    }
  | {
      type: 'delta';
      text: string;
    }
  | {
      type: 'done';
      provider: 'groq';
      dailyLimit: {
        used: number;
        limit: number;
        day: string;
      };
    }
  | {
      type: 'error';
      status: number;
      error: string;
    };

export type SearchLinkChatResult =
  | {
      ok: true;
      reply: string;
      products: SearchLinkCoreProduct[];
      coreStatus: number;
      coreSource: 'live_core' | 'session_cache';
      totalCatalogProducts: number;
      provider: 'groq';
      dailyLimit: {
        used: number;
        limit: number;
        day: string;
      };
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

function cleanEnv(value: string | undefined): string {
  return (value || '').trim().replace(/^["']|["']$/g, '').trim();
}

function getGroqApiKey(): string {
  return cleanEnv(process.env.GROQ_API_KEY);
}

function isRawCoreKey(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return (
    trimmed.startsWith('sl_core_') &&
    trimmed.length >= 24 &&
    !trimmed.includes('...')
  );
}

export function getTodayUtcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

function getClientIp(headers: IncomingHttpHeaders, remoteAddress?: string): string {
  const forwarded = headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === 'string'
      ? forwarded.split(',')[0]
      : '';
  return (raw || remoteAddress || 'local').trim();
}

function getQuotaKey(
  headers: IncomingHttpHeaders,
  userId?: string,
  remoteAddress?: string,
): string {
  const actor = userId?.trim() || getClientIp(headers, remoteAddress);
  return `${actor}:${getTodayUtcDateString()}`;
}

export function checkDailyLimit(
  headers: IncomingHttpHeaders,
  userId?: string,
  remoteAddress?: string,
): { allowed: boolean; day: string; used: number } {
  const day = getTodayUtcDateString();
  if (!isDailyLimitEnforced()) {
    return { allowed: true, day, used: 0 };
  }

  const cookies = parseCookies(
    typeof headers.cookie === 'string' ? headers.cookie : undefined,
  );
  if (cookies[SEARCH_LINK_IA_COOKIE_NAME] === day) {
    return { allowed: false, day, used: SEARCH_LINK_IA_DAILY_LIMIT };
  }

  const key = getQuotaKey(headers, userId, remoteAddress);
  const count = dailyUsageMemory.get(key) ?? 0;
  return {
    allowed: count < SEARCH_LINK_IA_DAILY_LIMIT,
    day,
    used: count,
  };
}

export function consumeDailyLimit(
  headers: IncomingHttpHeaders,
  userId?: string,
  remoteAddress?: string,
): { day: string; cookieHeader: string } {
  const day = getTodayUtcDateString();
  const key = getQuotaKey(headers, userId, remoteAddress);
  const prev = dailyUsageMemory.get(key) ?? 0;
  dailyUsageMemory.set(key, prev + 1);

  if (dailyUsageMemory.size > 5000) {
    for (const mapKey of dailyUsageMemory.keys()) {
      if (!mapKey.endsWith(`:${day}`)) {
        dailyUsageMemory.delete(mapKey);
      }
    }
  }

  const cookieHeader = `${SEARCH_LINK_IA_COOKIE_NAME}=${encodeURIComponent(day)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
  return { day, cookieHeader };
}

const SPANISH_STOPWORDS = new Set([
  'que',
  'qué',
  'hay',
  'de',
  'del',
  'la',
  'el',
  'los',
  'las',
  'un',
  'una',
  'unos',
  'unas',
  'para',
  'por',
  'con',
  'sin',
  'sobre',
  'como',
  'cómo',
  'cual',
  'cuál',
  'cuales',
  'cuáles',
  'tienen',
  'tienes',
  'tiene',
  'tengo',
  'quiero',
  'busco',
  'ver',
  'mostrar',
  'muestrame',
  'muéstrame',
  'dame',
  'dime',
  'hola',
  'buenas',
  'buenos',
  'dias',
  'días',
  'tardes',
  'noches',
  'algo',
  'comer',
  'tomar',
  'comprar',
  'productos',
  'producto',
  'catalogo',
  'catálogo',
  'menu',
  'menú',
  'opciones',
  'todo',
  'todos',
  'me',
  'te',
  'se',
  'es',
  'son',
  'en',
  'al',
  'lo',
  'le',
  'y',
  'o',
  'a',
]);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function selectInstantMatchingProducts(
  query: string,
  catalog: SearchLinkCoreProduct[],
  maxItems = 6,
): SearchLinkCoreProduct[] {
  if (catalog.length === 0) return [];
  const normalizedQuery = normalizeText(query);
  const tokens = normalizedQuery
    .split(' ')
    .filter((t) => t.length >= 2 && !SPANISH_STOPWORDS.has(t));

  if (tokens.length === 0) {
    return catalog.slice(0, maxItems);
  }

  const scored = catalog.map((item, idx) => {
    const normName = normalizeText(item.nombre);
    const normCat = normalizeText(item.categoria);
    const normDesc = normalizeText(item.descripcion);
    let score = 0;

    for (const token of tokens) {
      if (normName.includes(token)) score += 6;
      if (normCat.includes(token)) score += 4;
      if (normDesc.includes(token)) score += 2;
      if (token.length >= 4 && token.endsWith('s')) {
        const singular = token.slice(0, -1);
        if (normName.includes(singular)) score += 5;
        if (normCat.includes(singular)) score += 3;
        if (normDesc.includes(singular)) score += 1.5;
      }
    }

    return { item, score, idx };
  });

  const matched = scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .slice(0, maxItems)
    .map((entry) => entry.item);

  return matched.length > 0 ? matched : catalog.slice(0, maxItems);
}

async function resolveCatalogForChat(input: SearchLinkChatInput): Promise<
  | {
      ok: true;
      orgName: string;
      serviceName: string;
      products: SearchLinkCoreProduct[];
      coreSource: 'live_core' | 'session_cache';
    }
  | { ok: false; status: number; error: string }
> {
  let orgName = (input.organizationName || '').trim() || 'Tu negocio';
  let serviceName = (input.serviceName || '').trim() || 'Catálogo';
  let products: SearchLinkCoreProduct[] = [];
  let coreSource: 'live_core' | 'session_cache' = 'session_cache';

  if (isRawCoreKey(input.apiKey)) {
    const coreResult = await resolveSearchLinkCoreEndpoint({
      apiKey: input.apiKey!.trim(),
      slug: input.serviceSlug?.trim() || undefined,
      limit: 100,
      offset: 0,
    });

    if (!coreResult.ok) {
      return {
        ok: false,
        status: coreResult.status,
        error: `Search Link Core respondió ${coreResult.status}: ${coreResult.error}`,
      };
    }

    const coreData = coreResult.data as SearchLinkCoreResponse;
    if (Array.isArray(coreData.productos)) {
      products = coreData.productos;
      orgName = coreData.organizacion?.nombre || orgName;
      serviceName = coreData.servicio?.nombre || serviceName;
      coreSource = 'live_core';
    }
  } else if (Array.isArray(input.fallbackProducts)) {
    products = input.fallbackProducts.map((item, idx) => ({
      id: item.id || `item-${idx}`,
      nombre: item.nombre || `Producto ${idx + 1}`,
      categoria: item.categoria || 'General',
      descripcion: item.descripcion || '',
      imagen_url: item.imagen_url || item.url || '',
      url: item.url || item.imagen_url || '',
    }));
  }

  return { ok: true, orgName, serviceName, products, coreSource };
}

function buildConciseSystemInstruction(options: {
  orgName: string;
  serviceName: string;
  selectedProducts: SearchLinkCoreProduct[];
  allProductsCount: number;
}): string {
  const compactItems = options.selectedProducts.map((p) => ({
    nombre: p.nombre,
    categoria: p.categoria,
    descripcion: p.descripcion,
  }));

  return (
    `Eres Search Link IA, asistente amable de "${options.orgName}" (${options.serviceName}). ` +
    `Las imágenes de estos productos ya se muestran arriba al cliente: ${JSON.stringify(compactItems)} ` +
    `(catálogo total: ${options.allProductsCount}). ` +
    `Responde en español con 1 o 2 frases muy cortas, naturales y amables (máximo 35 palabras) comentando las opciones mostradas arriba o preguntando cuál prefiere. ` +
    `No hagas listas largas ni inventes precios o productos que no estén arriba.`
  );
}

async function* streamWithGroq(options: {
  apiKey: string;
  systemInstruction: string;
  history: SearchLinkChatTurn[];
  message: string;
}): AsyncGenerator<string> {
  const preferredModel = cleanEnv(process.env.GROQ_MODEL);
  const modelsToTry = preferredModel
    ? [
        preferredModel,
        ...SEARCH_LINK_CHAT_GROQ_MODELS.filter((m) => m !== preferredModel),
      ]
    : SEARCH_LINK_CHAT_GROQ_MODELS;

  const messages = [
    { role: 'system', content: options.systemInstruction },
    ...options.history.slice(-6).map((t) => ({
      role: t.role,
      content: t.text.trim().slice(0, 800),
    })),
    { role: 'user', content: options.message },
  ];

  let lastError = 'Error consultando Groq';

  for (const model of modelsToTry) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        reasoning_effort: 'low',
        max_completion_tokens: 300,
        temperature: 0.5,
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => '');
      lastError = `Groq (${response.status}): ${errText.slice(0, 140)}`;
      if (response.status === 404 || errText.includes('model')) {
        continue;
      }
      throw new Error(lastError);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const chunkText = parsed.choices?.[0]?.delta?.content;
          if (typeof chunkText === 'string' && chunkText.length > 0) {
            yield chunkText;
          }
        } catch {
          // Ignore malformed SSE keepalive frames
        }
      }
    }
    return;
  }

  throw new Error(lastError);
}

export async function* streamSearchLinkChat(
  input: SearchLinkChatInput,
): AsyncGenerator<SearchLinkChatStreamEvent> {
  const cleanMessage = (input.message || '').trim().slice(0, 2000);
  if (!cleanMessage) {
    yield {
      type: 'error',
      status: 400,
      error: 'Escribe un mensaje para consultar el catálogo.',
    };
    return;
  }

  const groqKey = getGroqApiKey();
  if (!groqKey) {
    yield {
      type: 'error',
      status: 503,
      error:
        'Search Link IA está esperando la variable GROQ_API_KEY en el servidor.',
    };
    return;
  }

  const catalog = await resolveCatalogForChat(input);
  if (!catalog.ok) {
    yield {
      type: 'error',
      status: catalog.status,
      error: catalog.error,
    };
    return;
  }

  const selectedProducts = selectInstantMatchingProducts(
    cleanMessage,
    catalog.products,
    6,
  );

  yield {
    type: 'products',
    products: selectedProducts,
    totalCatalogProducts: catalog.products.length,
    coreSource: catalog.coreSource,
  };

  const systemInstruction = buildConciseSystemInstruction({
    orgName: catalog.orgName,
    serviceName: catalog.serviceName,
    selectedProducts,
    allProductsCount: catalog.products.length,
  });

  const history = Array.isArray(input.history)
    ? input.history.filter(
        (t) =>
          (t.role === 'user' || t.role === 'assistant') &&
          typeof t.text === 'string' &&
          t.text.trim().length > 0,
      )
    : [];

  let yieldedAny = false;

  try {
    for await (const piece of streamWithGroq({
      apiKey: groqKey,
      systemInstruction,
      history,
      message: cleanMessage,
    })) {
      yieldedAny = true;
      yield { type: 'delta', text: piece };
    }

    if (!yieldedAny) {
      yield {
        type: 'delta',
        text: 'Aquí tienes las opciones principales del catálogo. ¿Cuál te gustaría ver más de cerca?',
      };
    }

    yield {
      type: 'done',
      provider: 'groq',
      dailyLimit: {
        used: SEARCH_LINK_IA_DAILY_LIMIT,
        limit: SEARCH_LINK_IA_DAILY_LIMIT,
        day: getTodayUtcDateString(),
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error en Groq';
    yield {
      type: 'error',
      status: 502,
      error: `No se pudo responder con Groq: ${msg}`,
    };
  }
}

export async function runSearchLinkChat(
  input: SearchLinkChatInput,
): Promise<SearchLinkChatResult> {
  let products: SearchLinkCoreProduct[] = [];
  let totalCatalogProducts = 0;
  let coreSource: 'live_core' | 'session_cache' = 'session_cache';
  let reply = '';
  let dailyLimit = {
    used: SEARCH_LINK_IA_DAILY_LIMIT,
    limit: SEARCH_LINK_IA_DAILY_LIMIT,
    day: getTodayUtcDateString(),
  };

  for await (const evt of streamSearchLinkChat(input)) {
    if (evt.type === 'error') {
      return { ok: false, status: evt.status, error: evt.error };
    }
    if (evt.type === 'products') {
      products = evt.products;
      totalCatalogProducts = evt.totalCatalogProducts;
      coreSource = evt.coreSource;
    }
    if (evt.type === 'delta') {
      reply += evt.text;
    }
    if (evt.type === 'done') {
      dailyLimit = evt.dailyLimit;
    }
  }

  return {
    ok: true,
    reply: reply.trim(),
    products,
    coreStatus: 200,
    coreSource,
    totalCatalogProducts,
    provider: 'groq',
    dailyLimit,
  };
}
