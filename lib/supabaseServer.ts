import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedServerClient: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://nhofuamltqglrgfjucof.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_wKhXyZ7s3CtT4NcU8Nx8EQ_T9TZsxFI';

function cleanEnv(value: string | undefined): string {
  return (value || '').trim().replace(/^["']|["']$/g, '').trim();
}

export function getSupabaseServerConfig(): { url: string; key: string } {
  const url =
    cleanEnv(process.env.SUPABASE_URL) ||
    cleanEnv(process.env.VITE_SUPABASE_URL) ||
    DEFAULT_SUPABASE_URL;
  const key =
    cleanEnv(process.env.SUPABASE_PUBLISHABLE_KEY) ||
    cleanEnv(process.env.SUPABASE_ANON_KEY) ||
    cleanEnv(process.env.VITE_SUPABASE_PUBLISHABLE_KEY) ||
    DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  return { url, key };
}

export function getSupabaseServerClient(): SupabaseClient | null {
  if (cachedServerClient) return cachedServerClient;
  const { url, key } = getSupabaseServerConfig();
  if (!url || !key) return null;

  cachedServerClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedServerClient;
}

export interface PublicCatalogResult {
  total_productos: number;
  productos: Array<{
    nombre: string;
    categoria: string;
    descripcion: string;
    url: string;
  }>;
  catalogos: Array<{
    id: string;
    titulo: string;
    tipo: string;
    origen_url: string | null;
    creado_en: string;
    items: Array<{
      nombre: string;
      categoria: string;
      descripcion: string;
      url: string;
    }>;
  }>;
}

export async function fetchCatalogByApiKey(
  rawApiKey: string,
): Promise<
  | { ok: true; data: PublicCatalogResult }
  | { ok: false; status: number; error: string }
> {
  const trimmedKey = rawApiKey.trim();
  if (!trimmedKey) {
    return {
      ok: false,
      status: 401,
      error: 'Falta la API Key (envía ?key=tu_llave o Authorization: Bearer tu_llave).',
    };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      status: 500,
      error: 'Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY en el servidor.',
    };
  }

  const { data, error } = await supabase.rpc('get_catalog_by_api_key', {
    p_api_key: trimmedKey,
  });

  if (error) {
    return {
      ok: false,
      status: 500,
      error:
        error.message.includes('get_catalog_by_api_key')
          ? 'Aún no se ha ejecutado el script SQL de Search Link en Supabase.'
          : `Error al consultar Supabase: ${error.message}`,
    };
  }

  if (!data) {
    return {
      ok: false,
      status: 401,
      error: 'API Key inválida o revocada.',
    };
  }

  return {
    ok: true,
    data: data as PublicCatalogResult,
  };
}
