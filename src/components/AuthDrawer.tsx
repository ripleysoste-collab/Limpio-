import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { User } from '@supabase/supabase-js';
import {
  Check,
  Copy,
  Database,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
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
import {
  formatShortDateTime,
  useI18n,
  type TranslationDictionary,
} from '../lib/i18n';
import { SearchLinkLogo } from './SearchLinkLogo';

interface AuthDrawerProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  pendingBatch: SaveCatalogBatchInput | null;
  onPendingBatchSaved: () => void;
}

type WorkspaceTab = 'catalogs' | 'endpoints';

export function AuthDrawer({
  open,
  onClose,
  user,
  pendingBatch,
  onPendingBatchSaved,
}: AuthDrawerProps) {
  const { locale, t } = useI18n();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsHighlight, setTermsHighlight] = useState(false);
  const [oauthFallbackUrl, setOauthFallbackUrl] = useState<string | null>(null);
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
      const msg = err instanceof Error ? err.message : t.auth.errLoadData;
      setDataError(msg);
    } finally {
      setLoadingData(false);
    }
  }, [user, t]);

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

  useEffect(() => {
    const applyOAuthPayload = async (hash: string, search: string) => {
      if (!supabase) return;
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      const queryParams = new URLSearchParams(search.replace(/^\?/, ''));

      const oauthError =
        hashParams.get('error_description') ||
        queryParams.get('error_description') ||
        hashParams.get('error') ||
        queryParams.get('error');

      if (oauthError) {
        setGoogleLoading(false);
        setAuthError(translateSupabaseAuthError(oauthError, t));
        return;
      }

      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const authCode = queryParams.get('code');

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setAuthError(translateSupabaseAuthError(error.message, t));
          } else {
            setAuthSuccess(t.auth.googleSignedInSuccess);
            setOauthFallbackUrl(null);
          }
        } else if (authCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(authCode);
          if (error) {
            setAuthError(translateSupabaseAuthError(error.message, t));
          } else {
            setAuthSuccess(t.auth.googleSignedInSuccess);
            setOauthFallbackUrl(null);
          }
        }
      } finally {
        setGoogleLoading(false);
      }
    };

    const handleWindowMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as
        | { type?: string; hash?: string; search?: string }
        | undefined;
      if (data?.type === 'SEARCHLINK_OAUTH_RESULT') {
        void applyOAuthPayload(data.hash || '', data.search || '');
      }
    };

    window.addEventListener('message', handleWindowMessage);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('searchlink-oauth');
        channel.onmessage = (event: MessageEvent) => {
          const data = event.data as
            | { type?: string; hash?: string; search?: string }
            | undefined;
          if (data?.type === 'SEARCHLINK_OAUTH_RESULT') {
            void applyOAuthPayload(data.hash || '', data.search || '');
          }
        };
      } catch {
        channel = null;
      }
    }

    return () => {
      window.removeEventListener('message', handleWindowMessage);
      channel?.close();
    };
  }, [t]);

  useEffect(() => {
    if (!open) {
      setAcceptedTerms(false);
      setTermsHighlight(false);
      setAuthError(null);
      setAuthSuccess(null);
    }
  }, [open]);

  useEffect(() => {
    if (user) {
      setGoogleLoading(false);
      setOauthFallbackUrl(null);
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    if (!acceptedTerms) {
      setTermsHighlight(true);
      setAuthError(t.auth.termsError);
      return;
    }

    if (!supabase) {
      setAuthError(t.auth.supabaseMissingError);
      return;
    }

    setAuthError(null);
    setAuthSuccess(null);
    setOauthFallbackUrl(null);
    setGoogleLoading(true);

    const isInsideIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    try {
      if (!isInsideIframe) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          setGoogleLoading(false);
          setAuthError(translateSupabaseAuthError(error.message, t));
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        setGoogleLoading(false);
        setAuthError(
          error
            ? translateSupabaseAuthError(error.message, t)
            : t.auth.googleLinkError,
        );
        return;
      }

      const width = 520;
      const height = 650;
      const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

      const popup = window.open(
        data.url,
        'searchlink_google_oauth',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,status=no`,
      );

      if (!popup) {
        setGoogleLoading(false);
        setOauthFallbackUrl(data.url);
        setAuthError(t.auth.popupBlockedError);
        return;
      }

      const closeWatcher = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(closeWatcher);
          setGoogleLoading(false);
        }
      }, 500);
    } catch (err) {
      setGoogleLoading(false);
      setAuthError(
        err instanceof Error
          ? translateSupabaseAuthError(err.message, t)
          : t.auth.googleSignInError,
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
      setDataError(err instanceof Error ? err.message : t.auth.errDeleteBatch);
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
      const msg = err instanceof Error ? err.message : t.auth.errCreateKey;
      if (msg.includes('relation') || msg.includes('schema cache')) {
        setDataError(t.auth.errCreateKeySchema);
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
      setDataError(err instanceof Error ? err.message : t.auth.errDeleteKey);
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
      : { opacity: 0, y: 18 };

  const panelAnimate = shouldReduceMotion
    ? { opacity: 1 }
    : isDesktop
      ? { x: 0 }
      : { opacity: 1, y: 0 };

  const panelExit = shouldReduceMotion
    ? { opacity: 0 }
    : isDesktop
      ? { x: '100%' }
      : { opacity: 0, y: 14 };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-stretch lg:justify-end">
          {/* Desktop blurred backdrop covering left half; mobile uses full-screen /login */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
            onClick={onClose}
            className="hidden lg:block fixed inset-0 bg-slate-950/40 backdrop-blur-md"
          />

          {/* Full-screen /login on mobile (same luminous phone background), right half-screen drawer on desktop */}
          <motion.section
            key={isDesktop ? 'desktop-auth-panel' : 'mobile-login-route'}
            role="dialog"
            aria-modal="true"
            aria-label={user ? t.auth.drawerAriaAuth : t.auth.drawerAriaGuest}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: isDesktop ? 0.36 : 0.26, ease: [0.22, 1, 0.36, 1] }
            }
            className="relative z-10 w-full h-dvh lg:w-1/2 lg:h-full bg-[#f8fbff] lg:bg-white lg:shadow-[-24px_0_80px_-16px_rgba(15,23,42,0.35)] lg:border-l lg:border-slate-200/80 flex flex-col overflow-hidden"
          >
            {/* Mobile-only matching phone background (same soft gradient & luminous atmosphere as Search Link) */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0 lg:hidden overflow-hidden"
              style={{
                background:
                  'linear-gradient(160deg, #eef6ff 0%, #f8fbff 42%, #ffffff 70%, #f2fbf6 100%)',
              }}
            >
              <div
                className="absolute -top-24 -left-20 w-[92vw] h-[46vh] rounded-full blur-3xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(59, 130, 246, 0.24) 0%, rgba(96, 165, 250, 0.12) 55%, transparent 76%)',
                }}
              />
              <div
                className="absolute -bottom-24 -right-16 w-[96vw] h-[48vh] rounded-full blur-3xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(59, 130, 246, 0.12) 52%, transparent 76%)',
                }}
              />
            </div>

            {/* Desktop-only subtle architectural dot pattern */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0 hidden lg:block"
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

            {/* Top bar */}
            <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 lg:px-10 pt-4 lg:pt-6 pb-3 shrink-0">
              <SearchLinkLogo size="sm" onDarkBackground={false} />

              <div className="flex items-center gap-2">
                {user && (
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    aria-label={t.auth.signOutAria}
                    title={t.auth.signOutAria}
                    className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 border border-slate-200/80 bg-white/90 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">{t.auth.signOutShort}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.auth.closePanelAria}
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
                    t.common.userFallback;
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
                      : t.auth.emailPasswordProvider;
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
                              {t.auth.accessPlanLine(providerLabel, profile?.plan === 'pro')}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => void loadWorkspaceData()}
                          disabled={loadingData}
                          aria-label={t.auth.refreshAccountAria}
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
                            ? t.auth.sessionSynced
                            : profileTableMissing
                              ? t.auth.sessionMissingProfilesTable
                              : t.auth.sessionActive}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {pendingBatch && !catalogTableMissing && (
                  <div className="mb-3 rounded-2xl border border-blue-200/80 bg-blue-50/85 px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <p className="text-xs text-blue-900 leading-snug">
                      {t.auth.pendingBatchText(pendingBatch.items.length)}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleSavePendingNow()}
                      disabled={loadingData}
                      className="shrink-0 h-8 px-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                    >
                      {t.auth.saveNow}
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
                    {t.auth.myCatalogsTab(batches.length)}
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
                    {t.auth.endpointsTab(apiKeys.length)}
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
                        <span className="text-xs">{t.auth.loadingSupabase}</span>
                      </div>
                    ) : catalogTableMissing ? (
                      <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 bg-white/85 px-5">
                        <p className="text-sm font-medium text-slate-900">
                          {t.auth.step2PendingTitle}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                          {t.auth.step2PendingDesc}
                        </p>
                      </div>
                    ) : batches.length === 0 ? (
                      <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4">
                        <p className="text-sm font-medium text-slate-800">
                          {t.auth.noCatalogsTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                          {t.auth.noCatalogsDesc}
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
                                    {t.auth.productsCount(
                                      batch.catalog_items.length || batch.item_count,
                                    )}{' '}
                                    · {formatShortDateTime(batch.created_at, locale)}
                                  </p>
                                </button>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleCopy(`batch-${batch.id}`, batchJson)
                                    }
                                    title={t.auth.copyFullJsonTitle}
                                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 inline-flex items-center gap-1.5"
                                  >
                                    {copiedId === `batch-${batch.id}` ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>{t.common.copied}</span>
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
                                    aria-label={t.auth.deleteBatchAria(batch.title)}
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
                        {t.auth.step3PendingTitle}
                      </p>
                      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                        {t.auth.step3PendingDesc}
                      </p>
                    </div>
                  ) : (
                    /* Endpoint & API Keys tab */
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200/85 bg-white/95 p-4">
                        <p className="text-xs font-semibold text-slate-900">
                          {t.auth.readEndpointTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                          {t.auth.readEndpointDescPrefix}
                          <code className="font-mono text-slate-700">?key=...</code>
                          {t.auth.readEndpointDescMiddle}
                          <code className="font-mono text-slate-700">
                            Authorization: Bearer ...
                          </code>
                          {t.auth.readEndpointDescSuffix}
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
                          {t.auth.generateKeyTitle}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder={t.auth.keyNamePlaceholder}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                          />
                          <select
                            value={newKeyBatchId}
                            onChange={(e) => setNewKeyBatchId(e.target.value)}
                            aria-label={t.auth.associatedCatalogAria}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                          >
                            <option value="">{t.auth.allMyCatalogs}</option>
                            {batches.map((b) => (
                              <option key={`opt-${b.id}`} value={b.id}>
                                {t.auth.onlyCatalogPrefix(b.title)}
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
                          {t.auth.createApiKey}
                        </button>
                      </form>

                      {justCreatedRawKey && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 space-y-2">
                          <p className="text-xs font-semibold text-emerald-950">
                            {t.auth.newKeyCreatedHint}
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
                                  <span>{t.common.copiedFem}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{t.common.copy}</span>
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
                                  <span>{t.auth.urlCopied}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{t.auth.copyUrl}</span>
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
                                aria-label={t.auth.revokeKeyAria(k.name)}
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
              /* GOOGLE-ONLY AUTHENTICATION: Direct on mobile background (/login), framed card on desktop */
              <div className="relative z-10 flex-1 overflow-y-auto flex items-center justify-center px-6 sm:px-10 lg:px-12 py-8">
                <div className="w-full max-w-[400px] lg:rounded-[28px] lg:border lg:border-slate-200/85 lg:bg-white/95 lg:backdrop-blur-sm lg:p-8 lg:shadow-[0_24px_60px_-24px_rgba(15,23,42,0.16)]">
                  <div className="mb-7">
                    <h2 className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-slate-950 leading-[1.15] text-balance">
                      {t.auth.loginHeading}
                    </h2>
                    <p className="mt-2.5 text-sm text-slate-600 lg:text-slate-500 leading-relaxed">
                      {t.auth.loginSubtitle}
                    </p>
                  </div>

                  <label
                    htmlFor="accept-legal-terms"
                    className={`mb-4 flex items-start gap-2.5 cursor-pointer select-none rounded-xl transition-colors ${
                      termsHighlight ? 'ring-2 ring-rose-400/70 bg-rose-50/40 p-2 -mx-2' : 'py-1'
                    }`}
                  >
                    <input
                      id="accept-legal-terms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAcceptedTerms(checked);
                        if (checked) {
                          setTermsHighlight(false);
                          setAuthError((prev) =>
                            prev === t.auth.termsError ? null : prev,
                          );
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 focus:ring-slate-400 shrink-0 cursor-pointer"
                    />
                    <span className="text-[13px] font-normal text-slate-700 leading-snug">
                      {t.auth.acceptTermsLabel}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => void handleGoogleSignIn()}
                    disabled={googleLoading}
                    aria-disabled={!acceptedTerms}
                    className={`w-full h-13 rounded-full bg-white border border-slate-200/95 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.09)] px-5 flex items-center justify-center gap-3 text-[15px] font-medium text-slate-800 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer ${
                      acceptedTerms
                        ? 'hover:border-slate-300 hover:bg-slate-50/85 active:scale-[0.99] opacity-100'
                        : 'opacity-60'
                    }`}
                  >
                    {googleLoading ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin text-slate-600 shrink-0" />
                    ) : (
                      <GoogleLogoIcon />
                    )}
                    <span>
                      {googleLoading
                        ? t.auth.connectingGoogle
                        : t.auth.continueWithGoogle}
                    </span>
                  </button>

                  {oauthFallbackUrl && (
                    <a
                      href={oauthFallbackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full h-10 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 flex items-center justify-center transition-colors"
                    >
                      {t.auth.openGoogleNewTab}
                    </a>
                  )}

                  {authError && (
                    <p role="alert" className="mt-3 text-xs font-medium text-rose-600">
                      {authError}
                    </p>
                  )}

                  {authSuccess && (
                    <p role="status" className="mt-3 text-xs font-medium text-emerald-700">
                      {authSuccess}
                    </p>
                  )}

                  <div className="my-6 border-t border-slate-200/80" />

                  <ul className="space-y-3 text-[13px] text-slate-600">
                    <li className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-slate-800 shrink-0" aria-hidden="true" />
                      <span>{t.auth.bullet1}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-slate-800 shrink-0" aria-hidden="true" />
                      <span>{t.auth.bullet2}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <KeyRound className="w-4 h-4 text-slate-800 shrink-0" aria-hidden="true" />
                      <span>{t.auth.bullet3}</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}

function translateSupabaseAuthError(
  message: string,
  t: TranslationDictionary,
): string {
  const lower = message.toLowerCase();
  if (lower.includes('provider is not enabled')) {
    return t.auth.errProviderNotEnabled;
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return t.auth.errRateLimit;
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
