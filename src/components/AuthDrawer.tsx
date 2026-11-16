import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { User } from '@supabase/supabase-js';
import {
  Check,
  Copy,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import {
  createUserApiKey,
  deleteUserApiKey,
  deleteUserCatalogBatch,
  fetchCurrentUserProfile,
  fetchUserApiKeysSafe,
  fetchUserCatalogBatchesSafe,
  saveMappedCatalogToSupabase,
  supabase,
  type SaveCatalogBatchInput,
  type SavedCatalogBatchRow,
  type UserApiKeyRow,
  type UserProfileRow,
} from '../lib/supabaseClient';
import { SearchLinkLogo } from './SearchLinkLogo';

interface AuthDrawerProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  pendingBatch: SaveCatalogBatchInput | null;
  onPendingBatchSaved: () => void;
}

type AuthMode = 'signup' | 'signin';
type WorkspaceTab = 'catalogs' | 'endpoints';

export function AuthDrawer({
  open,
  onClose,
  user,
  pendingBatch,
  onPendingBatchSaved,
}: AuthDrawerProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('catalogs');
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [profileTableMissing, setProfileTableMissing] = useState(false);
  const [catalogTableMissing, setCatalogTableMissing] = useState(false);
  const [keysTableMissing, setKeysTableMissing] = useState(false);
  const [batches, setBatches] = useState<SavedCatalogBatchRow[]>([]);
  const [apiKeys, setApiKeys] = useState<UserApiKeyRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyBatchId, setNewKeyBatchId] = useState<string>('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [justCreatedRawKey, setJustCreatedRawKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  );
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const loadWorkspaceData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    setDataError(null);
    try {
      const [profileRes, batchesRes, keysRes] = await Promise.all([
        fetchCurrentUserProfile(),
        fetchUserCatalogBatchesSafe(),
        fetchUserApiKeysSafe(),
      ]);
      setProfile(profileRes.profile);
      setProfileTableMissing(profileRes.tableMissing);
      setBatches(batchesRes.batches);
      setCatalogTableMissing(batchesRes.tableMissing);
      setApiKeys(keysRes.keys);
      setKeysTableMissing(keysRes.tableMissing);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'No se pudieron cargar tus datos.';
      setDataError(msg);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      void loadWorkspaceData();
    }
  }, [open, user, loadWorkspaceData]);

  const handleCopy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1600);
    } catch {
      setCopiedId(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setAuthError('Supabase no está configurado en el entorno.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setAuthError('Ingresa tu correo electrónico y una contraseña.');
      return;
    }
    if (authMode === 'signup' && password.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setAuthError(translateSupabaseAuthError(error.message));
          return;
        }
        if (data.session) {
          setAuthSuccess('Cuenta creada e iniciada correctamente.');
          if (pendingBatch) {
            const res = await saveMappedCatalogToSupabase(pendingBatch);
            if (res.saved) onPendingBatchSaved();
          }
        } else {
          setAuthSuccess(
            'Revisa tu correo para confirmar tu cuenta y luego inicia sesión.',
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setAuthError(translateSupabaseAuthError(error.message));
          return;
        }
        if (data.session && pendingBatch) {
          const res = await saveMappedCatalogToSupabase(pendingBatch);
          if (res.saved) onPendingBatchSaved();
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    setAuthError(null);
    setAuthSuccess(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setAuthError(
        'Activa el proveedor Google en Authentication → Providers de tu Supabase o usa correo y contraseña.',
      );
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setBatches([]);
    setApiKeys([]);
    setJustCreatedRawKey(null);
  };

  const handleSavePendingNow = async () => {
    if (!pendingBatch) return;
    setLoadingData(true);
    setDataError(null);
    try {
      const res = await saveMappedCatalogToSupabase(pendingBatch);
      if (res.saved) {
        onPendingBatchSaved();
        await loadWorkspaceData();
      } else if (res.reason) {
        setDataError(res.reason);
      }
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    try {
      await deleteUserCatalogBatch(batchId);
      setBatches((prev) => prev.filter((b) => b.id !== batchId));
    } catch (err) {
      setDataError(
        err instanceof Error ? err.message : 'No se pudo eliminar el catálogo.',
      );
    }
  };

  const handleCreateApiKey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingKey(true);
    setDataError(null);
    try {
      const { rawKey, row } = await createUserApiKey({
        name: newKeyName || 'Chatbot / API',
        batchId: newKeyBatchId || null,
      });
      setJustCreatedRawKey(rawKey);
      setApiKeys((prev) => [row, ...prev]);
      setNewKeyName('');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'No se pudo crear la API Key.';
      if (msg.includes('relation') || msg.includes('schema cache')) {
        setDataError(
          'Primero ejecuta el script SQL en Supabase para habilitar las API Keys.',
        );
      } else {
        setDataError(msg);
      }
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await deleteUserApiKey(keyId);
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (err) {
      setDataError(
        err instanceof Error ? err.message : 'No se pudo eliminar la API Key.',
      );
    }
  };

  const endpointBaseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/v1/catalog`
      : '/api/v1/catalog';

  const panelInitial = shouldReduceMotion
    ? { opacity: 0 }
    : isDesktop
      ? { x: '100%' }
      : { y: '100%' };

  const panelAnimate = shouldReduceMotion
    ? { opacity: 1 }
    : isDesktop
      ? { x: 0 }
      : { y: 0 };

  const panelExit = shouldReduceMotion
    ? { opacity: 0 }
    : isDesktop
      ? { x: '100%' }
      : { y: '100%' };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-stretch lg:justify-end">
          {/* Blurred backdrop covering the left half on desktop and top strip on mobile */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
          />

          {/* Responsive white drawer: bottom sheet on mobile, right half-screen on desktop */}
          <motion.section
            key={isDesktop ? 'desktop-auth-panel' : 'mobile-auth-sheet'}
            role="dialog"
            aria-modal="true"
            aria-label={user ? 'Tu espacio en Search Link' : 'Crea tu cuenta en Search Link'}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.36, ease: [0.22, 1, 0.36, 1] }
            }
            className="relative z-10 w-full h-[90dvh] rounded-t-[28px] lg:rounded-none lg:w-1/2 lg:h-full bg-white shadow-[0_-18px_60px_-12px_rgba(15,23,42,0.38)] lg:shadow-[-24px_0_80px_-16px_rgba(15,23,42,0.35)] border-t border-slate-200/80 lg:border-t-0 lg:border-l flex flex-col overflow-hidden"
          >
            {/* Subtle architectural dot pattern behind the white panel */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(15, 23, 42, 0.11) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                maskImage:
                  'radial-gradient(ellipse 85% 80% at 50% 45%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,0.25) 100%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 85% 80% at 50% 45%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,0.25) 100%)',
              }}
            />

            {/* Mobile sheet handle */}
            <div className="relative z-10 flex justify-center pt-3 pb-1 lg:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200" aria-hidden="true" />
            </div>

            {/* Top bar */}
            <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 lg:px-10 pt-3 lg:pt-6 pb-3 shrink-0">
              <SearchLinkLogo size="sm" onDarkBackground={false} />

              <div className="flex items-center gap-2">
                {user && (
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    aria-label="Cerrar sesión"
                    title="Cerrar sesión"
                    className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 border border-slate-200/80 bg-white/90 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar panel"
                  className="w-10 h-10 lg:w-9 lg:h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <X className="w-4.5 h-4.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {user ? (
              /* AUTHENTICATED WORKSPACE: Step 1 Profile + Saved Catalogs + Endpoints & API Keys */
              <div className="relative z-10 flex-1 min-h-0 flex flex-col px-6 sm:px-8 lg:px-10 pb-6">
                {(() => {
                  const metadata = user.user_metadata as
                    | Record<string, unknown>
                    | undefined;
                  const appMeta = user.app_metadata as
                    | Record<string, unknown>
                    | undefined;
                  const displayName =
                    profile?.full_name ||
                    (typeof metadata?.full_name === 'string' &&
                      metadata.full_name) ||
                    (typeof metadata?.name === 'string' && metadata.name) ||
                    user.email?.split('@')[0] ||
                    'Usuario';
                  const avatarUrl =
                    profile?.avatar_url ||
                    (typeof metadata?.avatar_url === 'string' &&
                      metadata.avatar_url) ||
                    (typeof metadata?.picture === 'string' &&
                      metadata.picture) ||
                    null;
                  const rawProvider =
                    profile?.auth_provider ||
                    (typeof appMeta?.provider === 'string'
                      ? appMeta.provider
                      : 'email');
                  const providerLabel =
                    rawProvider === 'google'
                      ? 'Google'
                      : 'Correo y contraseña';
                  const initials = displayName.slice(0, 2).toUpperCase();

                  return (
                    <div className="mt-1 mb-4 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-[0_2px_10px_-6px_rgba(15,23,42,0.08)] shrink-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-950 truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {user.email}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              Acceso: {providerLabel} · Plan{' '}
                              {profile?.plan === 'pro' ? 'Pro' : 'Gratuito'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => void loadWorkspaceData()}
                          disabled={loadingData}
                          aria-label="Actualizar cuenta"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`}
                            aria-hidden="true"
                          />
                        </button>
                      </div>

                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[11px]">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            profile
                              ? 'bg-emerald-500'
                              : profileTableMissing
                                ? 'bg-amber-400'
                                : 'bg-sky-500'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="text-slate-600">
                          {profile
                            ? 'Sesión activa y perfil sincronizado en Supabase (tabla profiles).'
                            : profileTableMissing
                              ? 'Sesión activa. Falta ejecutar el SQL del Paso 1 para crear la tabla profiles.'
                              : 'Sesión activa en Supabase Auth.'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {pendingBatch && !catalogTableMissing && (
                  <div className="mb-3 rounded-2xl border border-blue-200/80 bg-blue-50/85 px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <p className="text-xs text-blue-900 leading-snug">
                      Tienes un catálogo recién mapeado listo para guardar ({pendingBatch.items.length} ítems).
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleSavePendingNow()}
                      disabled={loadingData}
                      className="shrink-0 h-8 px-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                    >
                      Guardar ahora
                    </button>
                  </div>
                )}

                {/* Clean hairline underline tabs */}
                <div className="flex items-center gap-6 border-b border-slate-200 shrink-0 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('catalogs')}
                    className={`pb-2.5 text-xs font-semibold tracking-tight border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === 'catalogs'
                        ? 'border-slate-950 text-slate-950'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" aria-hidden="true" />
                    Mis catálogos ({batches.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('endpoints')}
                    className={`pb-2.5 text-xs font-semibold tracking-tight border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === 'endpoints'
                        ? 'border-slate-950 text-slate-950'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                    Endpoint y API Keys ({apiKeys.length})
                  </button>
                </div>

                {dataError && (
                  <p
                    role="alert"
                    className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 shrink-0"
                  >
                    {dataError}
                  </p>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                  {activeTab === 'catalogs' ? (
                    loadingData && batches.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        <span className="text-xs">Cargando datos de Supabase...</span>
                      </div>
                    ) : catalogTableMissing ? (
                      <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 bg-white/85 px-5">
                        <p className="text-sm font-medium text-slate-900">
                          Paso 2 pendiente: Guardar catálogos
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                          Primero estamos verificando tu inicio de sesión (Paso 1). Cuando me confirmes que tu cuenta y Google funcionan, crearemos aquí las tablas para guardar catálogos.
                        </p>
                      </div>
                    ) : batches.length === 0 ? (
                      <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4">
                        <p className="text-sm font-medium text-slate-800">
                          Aún no tienes catálogos guardados
                        </p>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                          Procesa imágenes o una página web estando conectado y se guardarán automáticamente aquí.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-200/80 bg-white/90 rounded-2xl border border-slate-200/85 px-4">
                        {batches.map((batch) => {
                          const isExpanded = expandedBatchId === batch.id;
                          const batchJson = JSON.stringify(
                            batch.catalog_items.map((it) => ({
                              nombre: it.nombre,
                              categoria: it.categoria,
                              descripcion: it.descripcion,
                              url: it.image_url,
                            })),
                            null,
                            2,
                          );

                          return (
                            <li key={batch.id} className="py-3.5">
                              <div className="flex items-start justify-between gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedBatchId(isExpanded ? null : batch.id)
                                  }
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <p className="text-sm font-semibold text-slate-900 truncate">
                                    {batch.title}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-slate-500">
                                    {batch.catalog_items.length || batch.item_count} productos ·{' '}
                                    {new Date(batch.created_at).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </button>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleCopy(`batch-${batch.id}`, batchJson)
                                    }
                                    title="Copiar JSON completo"
                                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 inline-flex items-center gap-1.5"
                                  >
                                    {copiedId === `batch-${batch.id}` ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Copiado</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>JSON</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteBatch(batch.id)}
                                    aria-label={`Eliminar ${batch.title}`}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  </button>
                                </div>
                              </div>

                              {isExpanded && (
                                <pre className="mt-3 max-h-56 overflow-y-auto rounded-xl bg-slate-50 border border-slate-200/80 p-3 font-mono text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap break-all">
                                  {batchJson}
                                </pre>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )
                  ) : keysTableMissing ? (
                    <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 bg-white/85 px-5">
                      <p className="text-sm font-medium text-slate-900">
                        Paso 3 pendiente: Endpoint y API Keys
                      </p>
                      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                        Primero terminaremos el Paso 1 (Inicio de sesión) y el Paso 2 (Guardar catálogos). Después activaremos tus llaves y tu enlace JSON para conectar chatbots.
                      </p>
                    </div>
                  ) : (
                    /* Endpoint & API Keys tab */
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200/85 bg-white/95 p-4">
                        <p className="text-xs font-semibold text-slate-900">
                          Endpoint de lectura JSON
                        </p>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                          Conecta este enlace a tu chatbot, n8n o Make enviando tu API Key por parámetro <code className="font-mono text-slate-700">?key=...</code> o cabecera <code className="font-mono text-slate-700">Authorization: Bearer ...</code>.
                        </p>
                        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2">
                          <span className="flex-1 min-w-0 font-mono text-[11px] text-slate-800 truncate">
                            {endpointBaseUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleCopy('endpoint-base', endpointBaseUrl)}
                            className="shrink-0 text-xs font-medium text-slate-600 hover:text-slate-950 inline-flex items-center gap-1"
                          >
                            {copiedId === 'endpoint-base' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <form
                        onSubmit={handleCreateApiKey}
                        className="rounded-2xl border border-slate-200/85 bg-white/95 p-4 space-y-3"
                      >
                        <p className="text-xs font-semibold text-slate-900">
                          Generar nueva API Key
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder="Nombre (ej. Bot WhatsApp)"
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                          />
                          <select
                            value={newKeyBatchId}
                            onChange={(e) => setNewKeyBatchId(e.target.value)}
                            aria-label="Catálogo asociado"
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                          >
                            <option value="">Todos mis catálogos</option>
                            {batches.map((b) => (
                              <option key={`opt-${b.id}`} value={b.id}>
                                Solo: {b.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={creatingKey}
                          className="h-10 px-4 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-60"
                        >
                          {creatingKey ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          Crear API Key
                        </button>
                      </form>

                      {justCreatedRawKey && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 space-y-2">
                          <p className="text-xs font-semibold text-emerald-950">
                            Tu nueva API Key (guárdala ahora, no se vuelve a mostrar completa)
                          </p>
                          <div className="flex items-center gap-2 rounded-xl bg-white border border-emerald-200 px-3 py-2">
                            <span className="flex-1 min-w-0 font-mono text-[11px] text-slate-900 truncate">
                              {justCreatedRawKey}
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleCopy('raw-key', justCreatedRawKey)}
                              className="shrink-0 text-xs font-medium text-emerald-700 inline-flex items-center gap-1"
                            >
                              {copiedId === 'raw-key' ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copiada</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl bg-white border border-emerald-200 px-3 py-2">
                            <span className="flex-1 min-w-0 font-mono text-[10.5px] text-slate-700 truncate">
                              {`${endpointBaseUrl}?key=${justCreatedRawKey}`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                void handleCopy(
                                  'full-endpoint',
                                  `${endpointBaseUrl}?key=${justCreatedRawKey}`,
                                )
                              }
                              className="shrink-0 text-xs font-medium text-emerald-700 inline-flex items-center gap-1"
                            >
                              {copiedId === 'full-endpoint' ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>URL copiada</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copiar URL</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {apiKeys.length > 0 && (
                        <ul className="divide-y divide-slate-200/80 rounded-2xl border border-slate-200/85 bg-white/95 px-4">
                          {apiKeys.map((k) => (
                            <li
                              key={k.id}
                              className="py-3 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">
                                  {k.name}
                                </p>
                                <p className="font-mono text-[11px] text-slate-500 truncate">
                                  {k.key_prefix}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleRevokeKey(k.id)}
                                aria-label={`Revocar ${k.name}`}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* AUTHENTICATION FORM: Sign Up / Sign In with Supabase */
              <div className="relative z-10 flex-1 overflow-y-auto flex items-start sm:items-center justify-center px-6 sm:px-10 lg:px-12 pt-4 pb-10 sm:py-8">
                <div className="w-full max-w-[390px]">
                  <div className="mb-6 lg:mb-7">
                    <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-slate-950 text-balance">
                      {authMode === 'signup'
                        ? 'Crea tu cuenta en Search Link'
                        : 'Inicia sesión en Search Link'}
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                      Guarda tus catálogos en Supabase y conecta tu API a cualquier chatbot.
                    </p>
                  </div>

                  {/* Rounded Google provider button */}
                  <button
                    type="button"
                    onClick={() => void handleGoogleSignIn()}
                    className="w-full h-12 rounded-full bg-white border border-slate-200/95 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] hover:border-slate-300 hover:bg-slate-50/80 px-5 flex items-center justify-center gap-3 text-[15px] font-medium text-slate-800 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <GoogleLogoIcon />
                    <span>Google</span>
                  </button>

                  {/* Clean hairline divider */}
                  <div className="relative my-5 lg:my-6 flex items-center">
                    <div className="flex-1 border-t border-slate-200/90" />
                    <span className="px-3 text-xs font-medium text-slate-400 whitespace-nowrap">
                      o con tu correo y contraseña
                    </span>
                    <div className="flex-1 border-t border-slate-200/90" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                      <label
                        htmlFor="register-email"
                        className="block text-xs font-medium text-slate-600 mb-1.5 pl-1"
                      >
                        Correo electrónico
                      </label>
                      <div className="flex items-center gap-2.5 h-12 w-full rounded-full bg-white border border-slate-200/95 px-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200/70 transition-all duration-150">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                        <input
                          id="register-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="nombre@correo.com"
                          className="flex-1 min-w-0 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="register-password"
                        className="block text-xs font-medium text-slate-600 mb-1.5 pl-1"
                      >
                        Contraseña
                      </label>
                      <div className="flex items-center gap-2.5 h-12 w-full rounded-full bg-white border border-slate-200/95 pl-4 pr-2.5 shadow-[0_1px_4px_rgba(15,23,42,0.03)] focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200/70 transition-all duration-150">
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                        <input
                          id="register-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete={
                            authMode === 'signup' ? 'new-password' : 'current-password'
                          }
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={
                            authMode === 'signup'
                              ? 'Crea una contraseña (mín. 6 caracteres)'
                              : 'Tu contraseña'
                          }
                          className="flex-1 min-w-0 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={
                            showPassword ? 'Ocultar contraseña' : 'Ver contraseña'
                          }
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 shrink-0"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>

                    {authError && (
                      <p role="alert" className="text-xs font-medium text-rose-600 px-1">
                        {authError}
                      </p>
                    )}

                    {authSuccess && (
                      <p role="status" className="text-xs font-medium text-emerald-700 px-1">
                        {authSuccess}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full h-12 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 mt-1 inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>
                        {authMode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
                      </span>
                    </button>
                  </form>

                  <p className="mt-5 text-center text-xs text-slate-500">
                    {authMode === 'signup' ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
                        setAuthError(null);
                        setAuthSuccess(null);
                      }}
                      className="font-semibold text-slate-900 hover:underline underline-offset-4"
                    >
                      {authMode === 'signup' ? 'Inicia sesión' : 'Regístrate gratis'}
                    </button>
                  </p>
                </div>
              </div>
            )}
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}

function translateSupabaseAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (lower.includes('already registered')) {
    return 'Este correo ya tiene una cuenta. Cambia a "Inicia sesión".';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirma tu correo electrónico antes de iniciar sesión.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Demasiados intentos seguidos. Espera unos segundos.';
  }
  return message;
}

function GoogleLogoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.3 0 6.08-1.09 8.105-2.96l-3.88-3.05c-1.09.73-2.48 1.16-4.225 1.16-3.25 0-6.01-2.19-6.995-5.14H1.01v3.14C3.03 21.16 7.2 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.005 14.01a7.21 7.21 0 0 1 0-4.62V6.25H1.01a11.997 11.997 0 0 0 0 10.9l3.995-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.795 0 3.41.62 4.68 1.835l3.51-3.51C18.075 1.09 15.295 0 12 0 7.2 0 3.03 2.84 1.01 6.25l3.995 3.14c.985-2.95 3.745-5.14 6.995-5.14Z"
      />
    </svg>
  );
}
