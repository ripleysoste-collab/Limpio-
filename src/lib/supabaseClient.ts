import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MappedImageMetadata } from './imageCompression';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
).trim();

export const isSupabaseClientConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

export const supabase: SupabaseClient | null = isSupabaseClientConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface UserProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  auth_provider: string;
  plan: string;
  created_at: string;
}

export interface SavedCatalogItemRow {
  id: string;
  batch_id: string;
  position: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  image_url: string;
  r2_key: string | null;
  saved_percent: number;
  created_at: string;
}

export interface SavedCatalogBatchRow {
  id: string;
  user_id: string;
  title: string;
  source_type: 'url' | 'files';
  source_url: string | null;
  item_count: number;
  created_at: string;
  catalog_items: SavedCatalogItemRow[];
}

export interface UserApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  batch_id: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface SaveCatalogBatchInput {
  title: string;
  sourceType: 'url' | 'files';
  sourceUrl?: string | null;
  items: Array<
    MappedImageMetadata & {
      r2Key?: string;
      savedPercent?: number;
    }
  >;
}

function isMissingTableError(
  error: { code?: string; message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === '42P01' || error.code === 'PGRST205') return true;
  const msg = (error.message || '').toLowerCase();
  return (
    msg.includes('relation') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table')
  );
}

export async function fetchCurrentUserProfile(): Promise<{
  profile: UserProfileRow | null;
  tableMissing: boolean;
}> {
  if (!supabase) return { profile: null, tableMissing: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { profile: null, tableMissing: false };

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, auth_provider, plan, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return { profile: null, tableMissing: true };
    }
    return { profile: null, tableMissing: false };
  }

  return {
    profile: (data as UserProfileRow | null) ?? null,
    tableMissing: false,
  };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return bytesToHex(new Uint8Array(digest));
}

export async function saveMappedCatalogToSupabase(
  input: SaveCatalogBatchInput,
): Promise<{ saved: boolean; batchId?: string; reason?: string }> {
  if (!supabase) {
    return { saved: false, reason: 'Supabase no está configurado.' };
  }

  if (input.items.length === 0) {
    return { saved: false, reason: 'No hay elementos mapeados para guardar.' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { saved: false, reason: 'Inicia sesión para guardar en tu cuenta.' };
  }

  const { data: batch, error: batchError } = await supabase
    .from('catalog_batches')
    .insert({
      user_id: user.id,
      title: input.title,
      source_type: input.sourceType,
      source_url: input.sourceUrl || null,
      item_count: input.items.length,
    })
    .select('id')
    .single();

  if (batchError || !batch) {
    return {
      saved: false,
      reason:
        batchError?.message || 'No se pudo guardar el lote en Supabase.',
    };
  }

  const itemRows = input.items.map((item, idx) => ({
    batch_id: batch.id,
    user_id: user.id,
    position: idx,
    nombre: item.nombre,
    categoria: item.categoria,
    descripcion: item.descripcion,
    image_url: item.url,
    r2_key: item.r2Key || null,
    saved_percent: item.savedPercent ?? 0,
  }));

  const { error: itemsError } = await supabase
    .from('catalog_items')
    .insert(itemRows);

  if (itemsError) {
    return {
      saved: false,
      reason: itemsError.message,
    };
  }

  return { saved: true, batchId: batch.id as string };
}

export async function fetchUserCatalogBatchesSafe(): Promise<{
  batches: SavedCatalogBatchRow[];
  tableMissing: boolean;
}> {
  if (!supabase) return { batches: [], tableMissing: false };

  const { data, error } = await supabase
    .from('catalog_batches')
    .select(
      'id, user_id, title, source_type, source_url, item_count, created_at, catalog_items(id, batch_id, position, nombre, categoria, descripcion, image_url, r2_key, saved_percent, created_at)',
    )
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    if (isMissingTableError(error)) {
      return { batches: [], tableMissing: true };
    }
    throw new Error(error.message || 'No se pudieron cargar tus catálogos.');
  }

  return {
    batches: ((data || []) as SavedCatalogBatchRow[]).map((batch) => ({
      ...batch,
      catalog_items: [...(batch.catalog_items || [])].sort(
        (a, b) => a.position - b.position,
      ),
    })),
    tableMissing: false,
  };
}

export async function fetchUserCatalogBatches(): Promise<
  SavedCatalogBatchRow[]
> {
  const { batches } = await fetchUserCatalogBatchesSafe();
  return batches;
}

export async function deleteUserCatalogBatch(batchId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('catalog_batches')
    .delete()
    .eq('id', batchId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchUserApiKeysSafe(): Promise<{
  keys: UserApiKeyRow[];
  tableMissing: boolean;
}> {
  if (!supabase) return { keys: [], tableMissing: false };
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('id, name, key_prefix, batch_id, is_active, last_used_at, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return { keys: [], tableMissing: true };
    }
    throw new Error(error.message);
  }
  return { keys: (data || []) as UserApiKeyRow[], tableMissing: false };
}

export async function fetchUserApiKeys(): Promise<UserApiKeyRow[]> {
  const { keys } = await fetchUserApiKeysSafe();
  return keys;
}

export async function createUserApiKey(options: {
  name: string;
  batchId?: string | null;
}): Promise<{ rawKey: string; row: UserApiKeyRow }> {
  if (!supabase) {
    throw new Error('Supabase no está configurado.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Debes iniciar sesión para crear una API Key.');
  }

  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  const rawKey = `sl_live_${bytesToHex(randomBytes)}`;
  const keyHash = await sha256Hex(rawKey);
  const keyPrefix = `${rawKey.slice(0, 14)}...${rawKey.slice(-4)}`;

  const { data, error } = await supabase
    .from('user_api_keys')
    .insert({
      user_id: user.id,
      name: options.name.trim() || 'Llave principal',
      key_prefix: keyPrefix,
      key_hash: keyHash,
      batch_id: options.batchId || null,
      is_active: true,
    })
    .select('id, name, key_prefix, batch_id, is_active, last_used_at, created_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'No se pudo generar la API Key.');
  }

  return {
    rawKey,
    row: data as UserApiKeyRow,
  };
}

export async function deleteUserApiKey(keyId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('id', keyId);
  if (error) {
    throw new Error(error.message);
  }
}
