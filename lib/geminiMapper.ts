import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { isValidMediaKey, readImageFromR2 } from './r2Storage.ts';

export const GEMINI_MAPPER_MODEL = 'gemini-3.1-flash-lite';

export interface MappedImageMetadata {
  nombre: string;
  categoria: string;
  descripcion: string;
  url: string;
}

function getGeminiApiKey(): string {
  return (process.env.GEMINI_API_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

export async function mapStoredImageWithGemini(options: {
  key?: string;
  imageUrl: string;
  dataBase64?: string;
  mimeType?: string;
}): Promise<MappedImageMetadata> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'Falta GEMINI_API_KEY en el servidor (agrégalo en Settings > Secrets o en las variables de Vercel).',
    );
  }

  let imageBase64 = '';
  let resolvedMimeType = 'image/webp';

  if (options.key && isValidMediaKey(options.key)) {
    const stored = await readImageFromR2(options.key);
    imageBase64 = stored.buffer.toString('base64');
    resolvedMimeType = stored.contentType || 'image/webp';
  } else if (options.dataBase64) {
    const trimmed = options.dataBase64.trim();
    const commaIdx = trimmed.indexOf(',');
    imageBase64 =
      trimmed.startsWith('data:') && commaIdx !== -1
        ? trimmed.slice(commaIdx + 1)
        : trimmed;
    if (options.mimeType && options.mimeType.startsWith('image/')) {
      resolvedMimeType = options.mimeType;
    }
  } else {
    throw new Error('Se requiere una imagen guardada válida para mapear.');
  }

  if (!imageBase64) {
    throw new Error('La imagen para mapear está vacía.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const promptText =
    'Analiza visualmente esta imagen de producto, alimento o artículo para un catálogo comercial conectado a un chatbot de ventas. ' +
    'Devuelve exclusivamente JSON en español con: ' +
    '1) "nombre": nombre completo, claro y comercial (ej. "Hamburguesa artesanal doble con queso cheddar"). ' +
    '2) "categoria": categoría corta y precisa (ej. "Comida rápida", "Calzado deportivo", "Accesorios"). ' +
    '3) "descripcion": descripción útil y natural de 2 a 3 líneas con detalles visuales clave y contexto para responder a clientes.';

  const MAX_GEMINI_ATTEMPTS = 4;

  const isTransientError = (msg: string): boolean => {
    const upper = msg.toUpperCase();
    return (
      upper.includes('503') ||
      upper.includes('UNAVAILABLE') ||
      upper.includes('OVERLOADED') ||
      upper.includes('HIGH DEMAND') ||
      upper.includes('429') ||
      upper.includes('RESOURCE_EXHAUSTED') ||
      upper.includes('DEADLINE_EXCEEDED') ||
      upper.includes('ETIMEDOUT') ||
      upper.includes('ECONNRESET') ||
      upper.includes('FETCH FAILED')
    );
  };

  for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MAPPER_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: resolvedMimeType,
                data: imageBase64,
              },
            },
            { text: promptText },
          ],
        },
        config: {
          systemInstruction:
            'Eres un catalogador comercial experto en e-commerce y restaurantes. Responde únicamente JSON válido en español, sin inventar precios ni marcas que no sean visibles.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nombre: {
                type: Type.STRING,
                description:
                  'Nombre completo del producto o artículo en español.',
              },
              categoria: {
                type: Type.STRING,
                description:
                  'Categoría comercial corta y precisa en español.',
              },
              descripcion: {
                type: Type.STRING,
                description:
                  'Descripción contextual de 2 a 3 líneas en español.',
              },
            },
            required: ['nombre', 'categoria', 'descripcion'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as Partial<MappedImageMetadata>;

      const nombre =
        typeof parsed.nombre === 'string' && parsed.nombre.trim()
          ? parsed.nombre.trim()
          : 'Producto catalogado';
      const categoria =
        typeof parsed.categoria === 'string' && parsed.categoria.trim()
          ? parsed.categoria.trim()
          : 'General';
      const descripcion =
        typeof parsed.descripcion === 'string' && parsed.descripcion.trim()
          ? parsed.descripcion.trim()
          : 'Imagen procesada y lista para responder consultas de clientes en tu catálogo.';

      return {
        nombre,
        categoria,
        descripcion,
        url: options.imageUrl,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al consultar Gemini';

      if (
        message.includes('API_KEY') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('403')
      ) {
        throw new Error(
          'La clave GEMINI_API_KEY fue rechazada o falta en Settings > Secrets.',
        );
      }

      const transient = isTransientError(message);
      if (transient && attempt < MAX_GEMINI_ATTEMPTS) {
        const baseDelay = attempt === 1 ? 950 : attempt === 2 ? 2200 : 4200;
        const jitter = Math.floor(Math.random() * 400);
        await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
        continue;
      }

      if (message.includes('503') || message.toUpperCase().includes('UNAVAILABLE')) {
        throw new Error(
          'El servidor de Gemini tuvo saturación temporal (503) tras varios reintentos.',
        );
      }
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        throw new Error(
          'Se alcanzó el límite temporal gratuito de Gemini. Intenta en unos segundos.',
        );
      }
      throw new Error(`Error al mapear con Gemini: ${message.slice(0, 120)}`);
    }
  }

  throw new Error('No se pudo completar el mapeo con Gemini.');
}
