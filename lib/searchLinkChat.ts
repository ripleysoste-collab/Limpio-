import type { IncomingHttpHeaders } from 'node:http';
import {
  resolveSearchLinkCoreEndpoint,
  type SearchLinkCoreProduct,
  type SearchLinkCoreResponse,
} from './supabaseServer.ts';

export const SEARCH_LINK_CHAT_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
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

interface GroqSelectionOutcome {
  selectedProducts: SearchLinkCoreProduct[];
  reply: string;
}

async function resolveWithGroqReasoning(options: {
  apiKey: string;
  orgName: string;
  serviceName: string;
  products: SearchLinkCoreProduct[];
  history: SearchLinkChatTurn[];
  message: string;
}): Promise<GroqSelectionOutcome> {
  if (options.products.length === 0) {
    return {
      selectedProducts: [],
      reply:
        'Este servicio aún no tiene productos publicados en su catálogo.',
    };
  }

  // Use short numeric keys ("1", "2", ...) so the model never drops or mistypes a UUID
  const indexedCatalog = options.products.map((p, idx) => ({
    id: String(idx + 1),
    nombre: p.nombre,
    categoria: p.categoria,
    descripcion: p.descripcion,
  }));
  const productByShortId = new Map(
    options.products.map((p, idx) => [String(idx + 1), p]),
  );

  const systemInstruction =
    `Eres Search Link IA, asesor experto y amable de "${options.orgName}" (${options.serviceName}).\n` +
    `Catálogo real del negocio: ${JSON.stringify(indexedCatalog)}\n\n` +
    `Reglas estrictas para elegir "product_ids":\n` +
    `1) Analiza con cuidado la intención real del cliente antes de responder.\n` +
    `2) Si pide un producto específico (ej. "crema de tomate", "ramen", "paella"), incluye ÚNICAMENTE el id exacto que corresponde a ese plato o artículo. NUNCA incluyas otros productos distintos solo porque compartan una palabra o ingrediente menor en su descripción.\n` +
    `3) Si pide por característica o categoría (ej. "algo ligero y saludable", "algo con camarones", "sopas"), incluye SOLO los ids que realmente cumplan con eso.\n` +
    `4) Si pregunta de forma general ("qué hay", "qué hay de comer", "qué venden", "menú", "muéstrame todo"), incluye una muestra amplia y variada del catálogo (hasta 6 ids).\n` +
    `5) Si pide algo que NO existe en el catálogo (ej. "pizza", "hamburguesa" cuando no están), devuelve product_ids: [] y díselo con amabilidad sugiriendo 1 o 2 opciones que sí existan.\n` +
    `6) Si es solo un saludo ("hola", "buenas"), devuelve product_ids: [] y saluda brevemente preguntando qué busca.\n\n` +
    `Reglas para "reply":\n` +
    `- Español natural, cálido y breve (1 o 2 frases cortas, máximo 35 palabras).\n` +
    `- Cuando product_ids no esté vacío, recuerda que las imágenes de esos productos se mostrarán justo arriba del texto, así que no hagas listas largas.`;

  const messages = [
    { role: 'system', content: systemInstruction },
    ...options.history.slice(-6).map((t) => ({
      role: t.role,
      content: t.text.trim().slice(0, 600),
    })),
    { role: 'user', content: options.message },
  ];

  const preferredModel = cleanEnv(process.env.GROQ_MODEL);
  const modelsToTry = preferredModel
    ? [
        preferredModel,
        ...SEARCH_LINK_CHAT_GROQ_MODELS.filter((m) => m !== preferredModel),
      ]
    : SEARCH_LINK_CHAT_GROQ_MODELS;

  let lastError = 'Error consultando Groq';

  for (const model of modelsToTry) {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          reasoning_effort: 'medium',
          max_completion_tokens: 750,
          temperature: 0.2,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'search_link_catalog_selection',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  product_ids: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  reply: {
                    type: 'string',
                  },
                },
                required: ['product_ids', 'reply'],
                additionalProperties: false,
              },
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      lastError = `Groq (${response.status}): ${errText.slice(0, 160)}`;
      if (
        response.status === 404 ||
        response.status === 400 ||
        errText.includes('model') ||
        errText.includes('json_validate_failed')
      ) {
        continue;
      }
      throw new Error(lastError);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = (data.choices?.[0]?.message?.content || '').trim();
    if (!rawContent) {
      lastError = 'Groq devolvió una respuesta vacía.';
      continue;
    }

    try {
      const parsed = JSON.parse(rawContent) as {
        product_ids?: unknown;
        reply?: unknown;
      };

      const seen = new Set<string>();
      const selectedProducts: SearchLinkCoreProduct[] = [];
      if (Array.isArray(parsed.product_ids)) {
        for (const rawId of parsed.product_ids) {
          if (typeof rawId !== 'string') continue;
          const cleanId = rawId.trim();
          if (!cleanId || seen.has(cleanId)) continue;
          const matched = productByShortId.get(cleanId);
          if (matched) {
            seen.add(cleanId);
            selectedProducts.push(matched);
            if (selectedProducts.length >= 6) break;
          }
        }
      }

      const reply =
        typeof parsed.reply === 'string' && parsed.reply.trim()
          ? parsed.reply.trim()
          : selectedProducts.length > 0
            ? 'Aquí tienes lo que coincide con tu búsqueda. ¿Te gustaría más detalles?'
            : 'No encontré ese producto exacto en el catálogo. ¿Te muestro otras opciones?';

      return { selectedProducts, reply };
    } catch {
      lastError = 'No se pudo interpretar la respuesta estructurada de Groq.';
      continue;
    }
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

  const history = Array.isArray(input.history)
    ? input.history.filter(
        (t) =>
          (t.role === 'user' || t.role === 'assistant') &&
          typeof t.text === 'string' &&
          t.text.trim().length > 0,
      )
    : [];

  try {
    const outcome = await resolveWithGroqReasoning({
      apiKey: groqKey,
      orgName: catalog.orgName,
      serviceName: catalog.serviceName,
      products: catalog.products,
      history,
      message: cleanMessage,
    });

    // Emit the reasoned, accurate product images FIRST above the text
    yield {
      type: 'products',
      products: outcome.selectedProducts,
      totalCatalogProducts: catalog.products.length,
      coreSource: catalog.coreSource,
    };

    // Emit the short friendly reply cleanly below the images
    yield {
      type: 'delta',
      text: outcome.reply,
    };

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
