import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type SupportedLocale = 'es' | 'en' | 'pt';
export type LocaleSource = 'manual' | 'ip' | 'browser' | 'default';

export interface LanguageOption {
  code: SupportedLocale;
  nativeLabel: string;
  regionLabel: string;
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { code: 'es', nativeLabel: 'Español', regionLabel: 'Principal' },
  { code: 'en', nativeLabel: 'English', regionLabel: 'International' },
  { code: 'pt', nativeLabel: 'Português', regionLabel: 'Brasil / Portugal' },
];

const LOCALE_STORAGE_KEY = 'searchlink_locale';
const LOCALE_MANUAL_STORAGE_KEY = 'searchlink_locale_manual';

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return value === 'es' || value === 'en' || value === 'pt';
}

function getIntlLocale(locale: SupportedLocale): string {
  switch (locale) {
    case 'en':
      return 'en-US';
    case 'pt':
      return 'pt-BR';
    case 'es':
    default:
      return 'es-ES';
  }
}

export function formatCreationDate(
  isoDate: string | undefined,
  locale: SupportedLocale,
  fallback: string,
): string {
  if (!isoDate) return fallback;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export function formatShortDateTime(
  isoDate: string,
  locale: SupportedLocale,
): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(getIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface LocalizedAutomationExample {
  id:
    | 'whatsapp'
    | 'telegram'
    | 'instagram'
    | 'messenger'
    | 'web'
    | 'discord'
    | 'slack'
    | 'line';
  bottomLabel: string;
  companyName: string;
  accountType: string;
  headerSubline: string;
  userGreeting: string;
  botGreeting: string;
  userRequest: string;
  botResultText: string;
  products: [
    { id: string; name: string; subtitle: string },
    { id: string; name: string; subtitle: string },
  ];
}

export interface TranslationDictionary {
  common: {
    userFallback: string;
    productFallback: string;
    generalCategory: string;
    copy: string;
    copied: string;
    copiedFem: string;
    cancel: string;
    accept: string;
    edit: string;
    continueBtn: string;
    nextBtn: string;
    skip: string;
    close: string;
    save: string;
  };
  menu: {
    account: string;
    googleAccount: string;
    googleAccountDetailsAria: string;
    organization: string;
    myStore: string;
    language: string;
    languagesTitle: string;
    accountMenuAria: string;
    accountOptionsAria: string;
    languageOptionsAria: string;
    backToMenuAria: string;
    backToOrgAria: string;
    closeMenuAria: string;
    closeAccountModalAria: string;
    closeStoreAria: string;
    closeOrgAria: string;
    usernameLabel: string;
    googleAccountLabel: string;
    createdAtLabel: string;
    accountCreatedOn: (formattedDate: string) => string;
    dateUnavailable: string;
    signOut: string;
    confirmSignOutAria: string;
    confirmSignOutTitle: string;
    confirmSignOutDescDesktop: string;
    confirmSignOutDescMobile: string;
    signOutError: string;
    languageSectionPrompt: string;
    languageSelectedLabel: (label: string) => string;
    languageAutoDetectedNote: (countryCode: string | null) => string;
    languageManualSavedNote: string;
    languageLocalStorageHint: string;
  };
  home: {
    uploadDeviceAria: string;
    uploadDeviceTitle: string;
    urlFormAria: string;
    urlInputPlaceholder: string;
    urlInputAria: string;
    extractingAria: string;
    clearUrlAria: string;
    invalidUrlError: string;
    connectUrlError: string;
    invalidFilesError: string;
    freePlanNotice: (max: number) => string;
    defaultServicePrefix: string;
    catalogBatchTitle: (count: number) => string;
    savedToCoreNotice: string;
    openAccountMenuAria: (name: string) => string;
    connectedAccountAria: (name: string) => string;
    openAuthAria: string;
    openAuthTitle: string;
    uploadImageFallbackError: string;
    mapImageFallbackError: string;
    imageLabel: (index: number) => string;
    productLabel: (index: number) => string;
  };
  pipeline: {
    stageImagesTitle: string;
    stageMetadataTitle: string;
    stageCompressingTitle: string;
    stageUploadingTitle: string;
    stageReceivingTitle: string;
    stageMappingTitle: string;
    stageMappedDoneTitle: string;
    stageLifecycleTitle: string;
    stageLifecycleFullTitle: string;
    stageViewApiTitle: string;
    stageProductivityTitle: string;
    stageEditorTitle: string;
    congratsTitleDesktop: string;
    congratsTitleMobile: string;
    congratsBodyDesktop: (count: number) => string;
    congratsBodyMobile: (count: number) => string;
    generatedApiTitle: string;
    generatedApisLink: string;
    generatedEndpointLink: string;
    credentialsReadyTitle: string;
    credentialsReadyHint: string;
    viewYourOrg: string;
    generatingApiKey: string;
    generatingEndpoint: string;
    copyApiAria: string;
    copyApiTitle: string;
    copyEndpointAria: string;
    copyEndpointTitle: string;
    backToMappedAria: string;
    goToLifecycleAria: string;
    couldNotReceive: string;
    couldNotMap: string;
    tapBorderToExpand: string;
    expandedImagesAria: string;
    expandedMetadataAria: string;
    elementsCount: (count: number) => string;
    closeExpandedAria: string;
    doubleClickFullscreen: (alt: string) => string;
    useAsBackgroundAria: (alt: string) => string;
    openOriginalImageTitle: (alt: string) => string;
    copyUrlOfAria: (alt: string) => string;
    copyUrlTitle: string;
    viewInBackgroundTitle: (alt: string) => string;
    enlargeLeftAria: (alt: string) => string;
    clickToViewTitle: (alt: string) => string;
    viewProductAria: (alt: string) => string;
    closeFullscreenAria: string;
    closeImageAria: string;
    searchingImages: string;
    whyUseSearchLink: string;
    whyUseSearchLinkAria: string;
    mobileCarouselAria: string;
    mobileCompressionAria: string;
    productJsonLabel: string;
    showJsonAria: (expanded: boolean, name: string) => string;
    copyJsonOfAria: (name: string) => string;
    copyAllJsonAria: string;
    copyJsonTitle: string;
    closeEditorBackAria: string;
    closeEditorTitle: string;
    readOnlyEditorAria: string;
    pdfActions: {
      json: string;
      images: string;
      urls: string;
      metadata: string;
      all: string;
      openEditor: string;
    };
    benefits: Array<{ id: string; title: string; description: string }>;
  };
  examples: {
    sectionAria: string;
    heading: string;
    subtitle: string;
    cardAria: (label: string) => string;
    discordVisitor: string;
    items: Record<LocalizedAutomationExample['id'], LocalizedAutomationExample>;
  };
  org: {
    unnamed: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    companyPlaceholder: string;
    uploadLogoAria: string;
    uploadLogoTitle: string;
    helperArrowPrompt: string;
    logoUploadError: string;
    congratsTitle: string;
    congratsBoth: string;
    congratsLogoOnly: string;
    congratsNameOnly: string;
    congratsMobileFallback: string;
    changeLogoAria: string;
    changeLogoTitle: string;
    orgNamePlaceholder: string;
    orgNameShortPlaceholder: string;
    saveOrgNameAria: string;
    renameOrgAria: string;
    renameOrgTitle: string;
    openStoreServicesAria: string;
    openStoreAria: string;
    viewStoreTitle: string;
    pickStoreAria: string;
    viewStoreOf: string;
    noServicesAvailable: string;
    myServices: string;
    newProduct: string;
    noServicesTitleDesktop: string;
    noServicesDescDesktop: string;
    noServicesTitleMobile: string;
    noServicesDescMobile: string;
    saveServiceNameAria: string;
    renameServiceAria: (name: string) => string;
    renameServiceTitle: string;
    productCount: (count: number) => string;
    productCountShort: (count: number) => string;
    serviceApiLink: string;
    serviceEndpointLink: string;
    testChatAria: (name: string) => string;
    testChatTitle: string;
    viewHistoryAria: (name: string) => string;
    viewHistoryTitle: string;
    closeBoxAria: string;
    apiHintRaw: string;
    apiHintPrefixDesktop: string;
    apiHintPrefixMobile: string;
    serviceActiveDesktop: string;
    servicePausedDesktop: string;
    serviceActiveMobile: string;
    servicePausedMobile: string;
    regenerateKeyDesktop: string;
    regenerateKeyMobile: string;
    pasteKeyPlaceholder: string;
    copyCurlDesktop: string;
    copyCurlMobile: string;
    curlCopied: string;
    testLive: string;
  };
  store: {
    emptyTitle: string;
    emptyDescDesktop: string;
    emptyDescMobile: string;
    noImage: string;
    tapToCollapse: string;
    tapToExpandFull: (name: string) => string;
    unnamedProduct: string;
  };
  chat: {
    closeAria: string;
    clearConversation: string;
    clearShort: string;
    liveProducts: (count: number) => string;
    preparingReply: string;
    queryingCatalog: string;
    dailyLimitNotice: string;
    dailyLimitPlaceholder: string;
    inputPlaceholder: string;
    inputAria: string;
    sendAria: string;
    defaultSuccessReply: string;
    defaultRequestError: string;
    defaultStreamError: string;
    networkError: string;
  };
  auth: {
    drawerAriaAuth: string;
    drawerAriaGuest: string;
    signOutAria: string;
    signOutShort: string;
    closePanelAria: string;
    emailPasswordProvider: string;
    accessPlanLine: (provider: string, isPro: boolean) => string;
    refreshAccountAria: string;
    sessionSynced: string;
    sessionMissingProfilesTable: string;
    sessionActive: string;
    pendingBatchText: (count: number) => string;
    saveNow: string;
    myCatalogsTab: (count: number) => string;
    endpointsTab: (count: number) => string;
    loadingSupabase: string;
    step2PendingTitle: string;
    step2PendingDesc: string;
    noCatalogsTitle: string;
    noCatalogsDesc: string;
    productsCount: (count: number) => string;
    copyFullJsonTitle: string;
    deleteBatchAria: (title: string) => string;
    step3PendingTitle: string;
    step3PendingDesc: string;
    readEndpointTitle: string;
    readEndpointDescPrefix: string;
    readEndpointDescMiddle: string;
    readEndpointDescSuffix: string;
    generateKeyTitle: string;
    keyNamePlaceholder: string;
    associatedCatalogAria: string;
    allMyCatalogs: string;
    onlyCatalogPrefix: (title: string) => string;
    createApiKey: string;
    newKeyCreatedHint: string;
    copyUrl: string;
    urlCopied: string;
    revokeKeyAria: (name: string) => string;
    loginHeading: string;
    loginSubtitle: string;
    acceptTermsLabel: string;
    termsError: string;
    supabaseMissingError: string;
    googleLinkError: string;
    popupBlockedError: string;
    googleSignInError: string;
    googleSignedInSuccess: string;
    connectingGoogle: string;
    continueWithGoogle: string;
    openGoogleNewTab: string;
    bullet1: string;
    bullet2: string;
    bullet3: string;
    errProviderNotEnabled: string;
    errRateLimit: string;
    errLoadData: string;
    errDeleteBatch: string;
    errCreateKey: string;
    errCreateKeySchema: string;
    errDeleteKey: string;
  };
}

const ES_DICT: TranslationDictionary = {
  common: {
    userFallback: 'Usuario',
    productFallback: 'Producto',
    generalCategory: 'General',
    copy: 'Copiar',
    copied: 'Copiado',
    copiedFem: 'Copiada',
    cancel: 'Cancelar',
    accept: 'Aceptar',
    edit: 'Editar',
    continueBtn: 'Continuar',
    nextBtn: 'Siguiente',
    skip: 'Omitir',
    close: 'Cerrar',
    save: 'Guardar',
  },
  menu: {
    account: 'Cuenta',
    googleAccount: 'Tu cuenta de Google',
    googleAccountDetailsAria: 'Detalles de tu cuenta de Google',
    organization: 'Organización',
    myStore: 'Mi tienda',
    language: 'Idioma',
    languagesTitle: 'Idiomas',
    accountMenuAria: 'Menú de cuenta',
    accountOptionsAria: 'Opciones de cuenta',
    languageOptionsAria: 'Idiomas disponibles',
    backToMenuAria: 'Volver al menú',
    backToOrgAria: 'Volver a Organización',
    closeMenuAria: 'Cerrar menú',
    closeAccountModalAria: 'Cerrar detalles de cuenta',
    closeStoreAria: 'Cerrar tienda',
    closeOrgAria: 'Cerrar organización',
    usernameLabel: 'Nombre de usuario',
    googleAccountLabel: 'Cuenta de Google',
    createdAtLabel: 'Fecha de creación',
    accountCreatedOn: (formattedDate) => `Cuenta creada el ${formattedDate}`,
    dateUnavailable: 'Fecha no disponible',
    signOut: 'Cerrar cuenta',
    confirmSignOutAria: 'Confirmar cierre de cuenta',
    confirmSignOutTitle: '¿Estás seguro que quieres cerrar cuenta?',
    confirmSignOutDescDesktop:
      'Tendrás que volver a iniciar sesión con Google para entrar de nuevo.',
    confirmSignOutDescMobile: 'Tendrás que volver a iniciar sesión con Google.',
    signOutError: 'No pudimos cerrar la sesión. Intenta de nuevo.',
    languageSectionPrompt:
      'Elige el idioma oficial de toda la plataforma y de Search Link IA.',
    languageSelectedLabel: (label) => `${label} seleccionado`,
    languageAutoDetectedNote: (countryCode) =>
      countryCode
        ? `Idioma ajustado automáticamente según tu IP (${countryCode}).`
        : 'Idioma ajustado automáticamente según tu ubicación.',
    languageManualSavedNote:
      'Preferencia guardada en este navegador. No se sobrescribirá automáticamente.',
    languageLocalStorageHint:
      'Puedes cambiarlo en cualquier momento desde este menú.',
  },
  home: {
    uploadDeviceAria: 'Subir imágenes desde el dispositivo',
    uploadDeviceTitle: 'Subir imágenes desde tu dispositivo',
    urlFormAria: 'Pegar URL de página web',
    urlInputPlaceholder: 'Pega aquí la URL de tu página web...',
    urlInputAria: 'URL de tu página web',
    extractingAria: 'Extrayendo imágenes',
    clearUrlAria: 'Limpiar URL',
    invalidUrlError:
      'No pudimos encontrar imágenes válidas en esa dirección web.',
    connectUrlError:
      'No se pudo conectar con la página. Verifica la URL e intenta de nuevo.',
    invalidFilesError: 'Por favor selecciona archivos de imagen válidos.',
    freePlanNotice: (max) =>
      `Plan gratuito: se procesarán las primeras ${max} imágenes.`,
    defaultServicePrefix: 'Servicio',
    catalogBatchTitle: (count) => `Catálogo (${count} imágenes)`,
    savedToCoreNotice: 'Servicio y API guardados en Search Link Core.',
    openAccountMenuAria: (name) => `Abrir menú de cuenta (${name})`,
    connectedAccountAria: (name) => `Cuenta conectada (${name})`,
    openAuthAria: 'Abrir registro de cuenta',
    openAuthTitle: 'Crear cuenta o iniciar sesión',
    uploadImageFallbackError: 'Error al subir la imagen.',
    mapImageFallbackError: 'Error al renderizar y mapear la imagen con IA.',
    imageLabel: (index) => `Imagen ${index}`,
    productLabel: (index) => `Producto ${index}`,
  },
  pipeline: {
    stageImagesTitle: 'Aquí verás tus imágenes',
    stageMetadataTitle: 'Aquí puedes ver tus metadatos',
    stageCompressingTitle: 'Comprimiendo',
    stageUploadingTitle: 'Lanzando a base de datos',
    stageReceivingTitle: 'Recibiendo',
    stageMappingTitle: 'Renderizar y mapear',
    stageMappedDoneTitle: 'Renderizado y mapeado',
    stageLifecycleTitle: 'Ciclo de vida',
    stageLifecycleFullTitle: 'Ciclo de vida, API y endpoint',
    stageViewApiTitle: 'Ver tu API',
    stageProductivityTitle: 'Productividad',
    stageEditorTitle: 'Editor JSON',
    congratsTitleDesktop: '¡Felicidades!',
    congratsTitleMobile: '¡Enhorabuena!',
    congratsBodyDesktop: (count) =>
      `Ya tienes ${
        count === 1
          ? 'tu 1 imagen procesada y guardada'
          : `tus ${count} imágenes procesadas y guardadas`
      } en nuestro R2. Tu endpoint y tu API te servirán para conectar tu chatbot y la página de tu emprendimiento.`,
    congratsBodyMobile: (count) =>
      `Ya tienes ${
        count === 1
          ? 'tu 1 imagen procesada y guardada'
          : `tus ${count} imágenes procesadas y guardadas`
      } en nuestro R2, listas para conectar tu chatbot y página.`,
    generatedApiTitle: 'Generado tu API y endpoint',
    generatedApisLink: 'APIs generadas',
    generatedEndpointLink: 'Endpoint generado',
    credentialsReadyTitle: 'Tus credenciales listas',
    credentialsReadyHint:
      'Toca el ícono al final para copiar tu API o endpoint.',
    viewYourOrg: 'Ver tu organización',
    generatingApiKey: 'Generando API Key...',
    generatingEndpoint: 'Generando endpoint...',
    copyApiAria: 'Copiar API',
    copyApiTitle: 'Copiar API Key',
    copyEndpointAria: 'Copiar endpoint',
    copyEndpointTitle: 'Copiar endpoint',
    backToMappedAria: 'Volver a Renderizado y mapeado',
    goToLifecycleAria: 'Ir a Ciclo de vida, API y endpoint',
    couldNotReceive: 'No se pudo recibir',
    couldNotMap: 'No se pudo mapear esta imagen.',
    tapBorderToExpand: 'Toca el borde blanco para ampliar',
    expandedImagesAria: 'Vista ampliada de imágenes',
    expandedMetadataAria: 'Vista ampliada de metadatos',
    elementsCount: (count) => `${count} elementos`,
    closeExpandedAria: 'Cerrar vista ampliada',
    doubleClickFullscreen: (alt) =>
      `Doble clic para ver ${alt} en pantalla completa`,
    useAsBackgroundAria: (alt) => `Usar ${alt} como fondo`,
    openOriginalImageTitle: (alt) => `Abrir imagen original: ${alt}`,
    copyUrlOfAria: (alt) => `Copiar URL de ${alt}`,
    copyUrlTitle: 'Copiar URL',
    viewInBackgroundTitle: (alt) => `Ver ${alt} en el fondo`,
    enlargeLeftAria: (alt) => `Ampliar ${alt} en el lado izquierdo`,
    clickToViewTitle: (alt) => `Clic para ver ${alt}`,
    viewProductAria: (alt) => `Ver ${alt}`,
    closeFullscreenAria: 'Cerrar imagen en pantalla completa',
    closeImageAria: 'Cerrar imagen',
    searchingImages: 'Buscando imágenes...',
    whyUseSearchLink: '¿Por qué usarías Search Link?',
    whyUseSearchLinkAria: 'Por qué usarías Search Link',
    mobileCarouselAria: 'Vista móvil de imágenes, URLs y beneficios',
    mobileCompressionAria: 'Imágenes y proceso de compresión',
    productJsonLabel: 'JSON del producto',
    showJsonAria: (expanded, name) =>
      `${expanded ? 'Ocultar' : 'Ver'} JSON de ${name}`,
    copyJsonOfAria: (name) => `Copiar JSON de ${name}`,
    copyAllJsonAria: 'Copiar todo el JSON',
    copyJsonTitle: 'Copiar JSON',
    closeEditorBackAria: 'Cerrar editor y volver a Ciclo de vida',
    closeEditorTitle: 'Cerrar editor',
    readOnlyEditorAria: 'Editor JSON de solo lectura',
    pdfActions: {
      json: 'Descargar mapeo JSON',
      images: 'Descargar imágenes',
      urls: 'Descargar URLs',
      metadata: 'Descargar metadatos',
      all: 'Descargar todo',
      openEditor: 'Ver en editor',
    },
    benefits: [
      {
        id: 'speed',
        title: 'Rapidez',
        description:
          'Extrae y organiza imágenes en segundos, ligera y sin esperas.',
      },
      {
        id: 'clean-urls',
        title: 'URLs limpias',
        description:
          'Convierte rutas largas en enlaces cortos, claros y ordenados.',
      },
      {
        id: 'easy-anywhere',
        title: 'Fácil en teléfono o PC',
        description:
          'Úsala cómodo desde el celular o el computador sin complicaciones.',
      },
      {
        id: 'ready-to-share',
        title: 'Listas para compartir',
        description:
          'Revisa cada foto y ten tus enlaces listos al instante en un toque.',
      },
    ],
  },
  examples: {
    sectionAria: 'Ejemplos de automatizaciones',
    heading: 'Ejemplos de automatizaciones',
    subtitle: 'Cómo actúa Search Link en diferentes plataformas',
    cardAria: (label) => `Ejemplo en ${label}`,
    discordVisitor: 'Visitante',
    items: {
      whatsapp: {
        id: 'whatsapp',
        bottomLabel: 'WhatsApp · Chatbots',
        companyName: 'Veloce Calzado',
        accountType: 'Enterprise',
        headerSubline: 'Catálogo automático',
        userGreeting: 'Hola',
        botGreeting: '¡Hola! ¿Cómo estás? ¿Qué estás buscando hoy?',
        userRequest: 'Quiero ver el catálogo de calzado blanco',
        botResultText: 'Aquí tienes lo que tenemos en catálogo.',
        products: [
          { id: 'wa-court', name: 'Veloce Court', subtitle: 'Cuero blanco' },
          { id: 'wa-runner', name: 'Veloce Runner', subtitle: 'Knit marfil' },
        ],
      },
      telegram: {
        id: 'telegram',
        bottomLabel: 'Telegram · Bots',
        companyName: 'Apex Motors',
        accountType: 'Bot Oficial',
        headerSubline: 'Concesionario digital',
        userGreeting: 'Hola, busco autos',
        botGreeting: '¡Bienvenido! ¿Prefieres sedán eléctrico o SUV?',
        userRequest: 'Muéstrame los disponibles hoy',
        botResultText: 'Estos dos modelos están listos para entrega.',
        products: [
          { id: 'tg-sedan', name: 'Apex Air EV', subtitle: 'Sedán eléctrico' },
          { id: 'tg-suv', name: 'Apex Terra', subtitle: 'SUV híbrida' },
        ],
      },
      instagram: {
        id: 'instagram',
        bottomLabel: 'Instagram · DM Bot',
        companyName: 'Núa Studio',
        accountType: 'Tienda',
        headerSubline: 'Respuestas en DM',
        userGreeting: 'Hola, me gustó su reel',
        botGreeting: '¡Gracias! ¿Qué accesorio quieres revisar?',
        userRequest: 'Relojes y gafas para regalo',
        botResultText: 'Aquí tienes nuestros favoritos de temporada.',
        products: [
          { id: 'ig-watch', name: 'Crono Cuero', subtitle: 'Edición clásica' },
          { id: 'ig-glasses', name: 'Gafas Carey', subtitle: 'Filtro UV400' },
        ],
      },
      messenger: {
        id: 'messenger',
        bottomLabel: 'Messenger · Meta Bot',
        companyName: 'Casa Nórdica',
        accountType: 'Hogar',
        headerSubline: 'Asesor de espacios',
        userGreeting: 'Buenas, vi su anuncio',
        botGreeting: '¡Hola! ¿Para qué espacio buscas piezas?',
        userRequest: 'Algo minimalista para la sala',
        botResultText: 'Estas dos piezas combinan perfecto juntas.',
        products: [
          { id: 'ms-chair', name: 'Silla Roble', subtitle: 'Tela beige' },
          { id: 'ms-plant', name: 'Monstera Maceta', subtitle: 'Cerámica mate' },
        ],
      },
      web: {
        id: 'web',
        bottomLabel: 'Chat Web · Tienda',
        companyName: 'Bistro Brasa',
        accountType: 'Web Widget',
        headerSubline: 'Menú en línea',
        userGreeting: 'Hola, ¿qué recomiendan?',
        botGreeting: '¡Hola! Todo sale recién hecho. ¿Qué te provoca?',
        userRequest: 'Algo rápido para cenar hoy',
        botResultText: 'Nuestros dos platos más pedidos esta noche.',
        products: [
          { id: 'web-burger', name: 'Burger Brioche', subtitle: 'Cheddar maduro' },
          { id: 'web-pizza', name: 'Pizza Margarita', subtitle: 'Masa madre' },
        ],
      },
      discord: {
        id: 'discord',
        bottomLabel: 'Discord · Bot API',
        companyName: 'Pulse Gear',
        accountType: 'APP',
        headerSubline: '#tienda-hardware',
        userGreeting: 'Hola, busco setup oscuro',
        botGreeting: '¡Qué tal! ¿Buscas audio o periféricos?',
        userRequest: 'Muéstrame teclado y audífonos',
        botResultText: 'Ambos disponibles con envío inmediato.',
        products: [
          { id: 'dc-audio', name: 'Pulse Audio Pro', subtitle: 'Negro mate' },
          { id: 'dc-kb', name: 'Teclado 65%', subtitle: 'Aluminio ámbar' },
        ],
      },
      slack: {
        id: 'slack',
        bottomLabel: 'Slack · App B2B',
        companyName: 'WorkCraft B2B',
        accountType: 'Empresa',
        headerSubline: '#compras-oficina',
        userGreeting: 'Hola, renovamos oficina',
        botGreeting: 'Con gusto. ¿Qué equipamiento necesitan cotizar?',
        userRequest: 'Sillas ergonómicas y tazas',
        botResultText: 'Catálogo corporativo listo para pedido.',
        products: [
          { id: 'sl-chair', name: 'Silla Mesh Pro', subtitle: 'Aluminio B2B' },
          { id: 'sl-mug', name: 'Set Cerámica', subtitle: 'Lote oficina' },
        ],
      },
      line: {
        id: 'line',
        bottomLabel: 'LINE · Official Account',
        companyName: 'Sora Botanics',
        accountType: 'Oficial',
        headerSubline: 'Asistente cosmético',
        userGreeting: 'Hola, busco skincare',
        botGreeting: '¡Hola! ¿Te interesa sérum o fragancia?',
        userRequest: 'Muéstrame ambos por favor',
        botResultText: 'Aquí tienes nuestras fórmulas más buscadas.',
        products: [
          { id: 'ln-serum', name: 'Sérum Ámbar', subtitle: 'Uso nocturno' },
          { id: 'ln-perfume', name: 'Esencia Botánica', subtitle: 'Notas cálidas' },
        ],
      },
    },
  },
  org: {
    unnamed: 'Sin nombre',
    welcomeTitle: 'Bienvenido a tu organización',
    welcomeSubtitle: 'Vamos a crearla',
    companyPlaceholder: 'Pon el nombre de tu empresa',
    uploadLogoAria: 'Subir logo de tu organización',
    uploadLogoTitle: 'Subir logo de tu organización',
    helperArrowPrompt: 'Pon el logo de tu organización y tu nombre',
    logoUploadError: 'No se pudo subir el logo.',
    congratsTitle: '¡Felicidades!',
    congratsBoth:
      'Ya tienes el logo y el nombre de tu organización listos para empezar.',
    congratsLogoOnly:
      'Ya tienes el logo de tu organización. Podrás poner el nombre cuando desees.',
    congratsNameOnly:
      'Ya tienes el nombre de tu organización. Podrás subir tu logo cuando desees.',
    congratsMobileFallback:
      'Ya tienes tu organización creada. Podrás ajustar tu logo o nombre cuando quieras.',
    changeLogoAria: 'Cambiar logo de la organización',
    changeLogoTitle: 'Cambiar logo de la organización',
    orgNamePlaceholder: 'Nombre de tu organización',
    orgNameShortPlaceholder: 'Nombre',
    saveOrgNameAria: 'Guardar nombre de organización',
    renameOrgAria: 'Cambiar nombre de la organización',
    renameOrgTitle: 'Cambiar nombre',
    openStoreServicesAria: 'Abrir tienda de tus servicios',
    openStoreAria: 'Abrir tienda',
    viewStoreTitle: 'Ver tienda',
    pickStoreAria: 'Selecciona un servicio para ver en tu tienda',
    viewStoreOf: 'Ver tienda de',
    noServicesAvailable: 'Aún no tienes servicios disponibles.',
    myServices: 'Mis servicios',
    newProduct: 'Nuevo producto',
    noServicesTitleDesktop: 'Aún no tienes servicios en tu organización',
    noServicesDescDesktop:
      'Procesa y mapea tu primer producto desde la pantalla principal para tener aquí su servicio, API y endpoint.',
    noServicesTitleMobile: 'Aún no tienes servicios',
    noServicesDescMobile:
      'Procesa un producto desde el inicio para ver aquí su servicio, API y endpoint.',
    saveServiceNameAria: 'Guardar nombre del servicio',
    renameServiceAria: (name) => `Renombrar ${name}`,
    renameServiceTitle: 'Renombrar servicio',
    productCount: (count) =>
      `${count} ${count === 1 ? 'producto' : 'productos'}`,
    productCountShort: (count) => `${count} prod.`,
    serviceApiLink: 'API del servicio',
    serviceEndpointLink: 'Endpoint de este servicio',
    testChatAria: (name) => `Probar ${name} en Search Link IA`,
    testChatTitle: 'Probar en Search Link IA',
    viewHistoryAria: (name) => `Ver historial del proceso de ${name}`,
    viewHistoryTitle: 'Ver proceso de automatización',
    closeBoxAria: 'Cerrar recuadro',
    apiHintRaw:
      'Envía esta llave en el header x-api-key o Authorization: Bearer.',
    apiHintPrefixDesktop:
      'Por seguridad solo se guarda el prefijo en la nube. Genera una nueva API Key si necesitas copiarla completa.',
    apiHintPrefixMobile:
      'Por seguridad solo se guarda el prefijo. Genera una nueva API Key si necesitas copiarla completa.',
    serviceActiveDesktop: 'Servicio activo',
    servicePausedDesktop: 'Servicio pausado',
    serviceActiveMobile: 'Activo',
    servicePausedMobile: 'Pausado',
    regenerateKeyDesktop: 'Regenerar API Key',
    regenerateKeyMobile: 'Regenerar',
    pasteKeyPlaceholder: 'Pega tu API Key sl_core_... para probar',
    copyCurlDesktop: 'Copiar comando cURL',
    copyCurlMobile: 'Copiar cURL',
    curlCopied: 'cURL copiado',
    testLive: 'Probar en vivo',
  },
  store: {
    emptyTitle: 'Este servicio aún no tiene productos visibles en tienda',
    emptyDescDesktop:
      'Procesa un nuevo lote de imágenes para verlo aquí en tu tienda visual.',
    emptyDescMobile: 'Procesa un nuevo lote de imágenes para verlo aquí.',
    noImage: 'Sin imagen',
    tapToCollapse: 'Toca para contraer',
    tapToExpandFull: (name) => `${name} (toca para ver completo)`,
    unnamedProduct: 'Producto sin nombre',
  },
  chat: {
    closeAria: 'Cerrar Search Link IA',
    clearConversation: 'Limpiar conversación',
    clearShort: 'Limpiar',
    liveProducts: (count) =>
      `${count} ${count === 1 ? 'producto' : 'productos'} en vivo`,
    preparingReply: 'Preparando respuesta...',
    queryingCatalog: 'Consultando catálogo...',
    dailyLimitNotice:
      'Prueba diaria usada (1/1 hoy). Vuelve mañana para probar de nuevo.',
    dailyLimitPlaceholder: 'Límite diario de 1 prueba alcanzado por hoy',
    inputPlaceholder: 'Escribe tu mensaje...',
    inputAria: 'Escribe tu mensaje para Search Link IA',
    sendAria: 'Enviar mensaje',
    defaultSuccessReply:
      'Aquí tienes las opciones disponibles en tu catálogo.',
    defaultRequestError:
      'No se pudo obtener respuesta de Search Link IA en este momento.',
    defaultStreamError: 'Error al generar respuesta.',
    networkError:
      'Error de red al conectar con Search Link IA. Intenta de nuevo.',
  },
  auth: {
    drawerAriaAuth: 'Tu espacio en Search Link',
    drawerAriaGuest: 'Iniciar sesión en Search Link',
    signOutAria: 'Cerrar sesión',
    signOutShort: 'Salir',
    closePanelAria: 'Cerrar panel',
    emailPasswordProvider: 'Correo y contraseña',
    accessPlanLine: (provider, isPro) =>
      `Acceso: ${provider} · Plan ${isPro ? 'Pro' : 'Gratuito'}`,
    refreshAccountAria: 'Actualizar cuenta',
    sessionSynced:
      'Sesión activa y perfil sincronizado en Supabase (tabla profiles).',
    sessionMissingProfilesTable:
      'Sesión activa. Falta ejecutar el SQL del Paso 1 para crear la tabla profiles.',
    sessionActive: 'Sesión activa en Supabase Auth.',
    pendingBatchText: (count) =>
      `Tienes un catálogo recién mapeado listo para guardar (${count} ítems).`,
    saveNow: 'Guardar ahora',
    myCatalogsTab: (count) => `Mis catálogos (${count})`,
    endpointsTab: (count) => `Endpoint y API Keys (${count})`,
    loadingSupabase: 'Cargando datos de Supabase...',
    step2PendingTitle: 'Paso 2 pendiente: Guardar catálogos',
    step2PendingDesc:
      'Primero estamos verificando tu inicio de sesión (Paso 1). Cuando me confirmes que tu cuenta y Google funcionan, crearemos aquí las tablas para guardar catálogos.',
    noCatalogsTitle: 'Aún no tienes catálogos guardados',
    noCatalogsDesc:
      'Procesa imágenes o una página web estando conectado y se guardarán automáticamente aquí.',
    productsCount: (count) => `${count} productos`,
    copyFullJsonTitle: 'Copiar JSON completo',
    deleteBatchAria: (title) => `Eliminar ${title}`,
    step3PendingTitle: 'Paso 3 pendiente: Endpoint y API Keys',
    step3PendingDesc:
      'Primero terminaremos el Paso 1 (Inicio de sesión) y el Paso 2 (Guardar catálogos). Después activaremos tus llaves y tu enlace JSON para conectar chatbots.',
    readEndpointTitle: 'Endpoint de lectura JSON',
    readEndpointDescPrefix:
      'Conecta este enlace a tu chatbot, n8n o Make enviando tu API Key por parámetro ',
    readEndpointDescMiddle: ' o cabecera ',
    readEndpointDescSuffix: '.',
    generateKeyTitle: 'Generar nueva API Key',
    keyNamePlaceholder: 'Nombre (ej. Bot WhatsApp)',
    associatedCatalogAria: 'Catálogo asociado',
    allMyCatalogs: 'Todos mis catálogos',
    onlyCatalogPrefix: (title) => `Solo: ${title}`,
    createApiKey: 'Crear API Key',
    newKeyCreatedHint:
      'Tu nueva API Key (guárdala ahora, no se vuelve a mostrar completa)',
    copyUrl: 'Copiar URL',
    urlCopied: 'URL copiada',
    revokeKeyAria: (name) => `Revocar ${name}`,
    loginHeading: 'Tu cuenta de Search Link',
    loginSubtitle:
      'Inicia sesión en un toque con Google para guardar tus catálogos procesados y conectar tu API.',
    acceptTermsLabel:
      'Aceptar Términos y Condiciones y Política de Privacidad',
    termsError:
      'Debes aceptar los Términos y Condiciones y la Política de Privacidad antes de continuar.',
    supabaseMissingError: 'Supabase no está configurado en el entorno.',
    googleLinkError: 'No se pudo generar el enlace de acceso con Google.',
    popupBlockedError:
      'Tu navegador bloqueó la ventana emergente. Pulsa el enlace de abajo para abrir Google.',
    googleSignInError: 'No se pudo iniciar sesión con Google.',
    googleSignedInSuccess: 'Sesión iniciada con Google correctamente.',
    connectingGoogle: 'Conectando con Google…',
    continueWithGoogle: 'Continuar con Google',
    openGoogleNewTab: 'Abrir acceso con Google en una pestaña nueva',
    bullet1: 'Acceso inmediato sin contraseñas ni correos extra',
    bullet2: 'Tus imágenes y JSON respaldados en tu espacio',
    bullet3: 'Listo para generar tu Endpoint y API Keys',
    errProviderNotEnabled:
      'El acceso con Google no está activado en Supabase.',
    errRateLimit: 'Demasiados intentos seguidos. Espera unos segundos.',
    errLoadData: 'No se pudieron cargar tus datos.',
    errDeleteBatch: 'No se pudo eliminar el catálogo.',
    errCreateKey: 'No se pudo crear la API Key.',
    errCreateKeySchema:
      'Primero ejecuta el script SQL en Supabase para habilitar las API Keys.',
    errDeleteKey: 'No se pudo eliminar la API Key.',
  },
};

const EN_DICT: TranslationDictionary = {
  common: {
    userFallback: 'User',
    productFallback: 'Product',
    generalCategory: 'General',
    copy: 'Copy',
    copied: 'Copied',
    copiedFem: 'Copied',
    cancel: 'Cancel',
    accept: 'Confirm',
    edit: 'Edit',
    continueBtn: 'Continue',
    nextBtn: 'Next',
    skip: 'Skip',
    close: 'Close',
    save: 'Save',
  },
  menu: {
    account: 'Account',
    googleAccount: 'Your Google account',
    googleAccountDetailsAria: 'Google account details',
    organization: 'Organization',
    myStore: 'My store',
    language: 'Language',
    languagesTitle: 'Languages',
    accountMenuAria: 'Account menu',
    accountOptionsAria: 'Account options',
    languageOptionsAria: 'Available languages',
    backToMenuAria: 'Back to menu',
    backToOrgAria: 'Back to Organization',
    closeMenuAria: 'Close menu',
    closeAccountModalAria: 'Close account details',
    closeStoreAria: 'Close store',
    closeOrgAria: 'Close organization',
    usernameLabel: 'Username',
    googleAccountLabel: 'Google account',
    createdAtLabel: 'Created on',
    accountCreatedOn: (formattedDate) => `Account created on ${formattedDate}`,
    dateUnavailable: 'Date unavailable',
    signOut: 'Sign out',
    confirmSignOutAria: 'Confirm sign out',
    confirmSignOutTitle: 'Are you sure you want to sign out?',
    confirmSignOutDescDesktop:
      'You will need to sign in again with Google to access your workspace.',
    confirmSignOutDescMobile: 'You will need to sign in again with Google.',
    signOutError: 'Could not sign out. Please try again.',
    languageSectionPrompt:
      'Choose the interface language for the platform and Search Link IA.',
    languageSelectedLabel: (label) => `${label} selected`,
    languageAutoDetectedNote: (countryCode) =>
      countryCode
        ? `Automatically matched to your country by IP (${countryCode}).`
        : 'Automatically matched to your location.',
    languageManualSavedNote:
      'Saved in this browser. It will stay until you change it.',
    languageLocalStorageHint:
      'You can switch between Spanish, English, and Portuguese anytime.',
  },
  home: {
    uploadDeviceAria: 'Upload images from your device',
    uploadDeviceTitle: 'Upload images from your device',
    urlFormAria: 'Paste webpage URL',
    urlInputPlaceholder: 'Paste your website URL here...',
    urlInputAria: 'Your website URL',
    extractingAria: 'Extracting images',
    clearUrlAria: 'Clear URL',
    invalidUrlError: 'We could not find valid images at that web address.',
    connectUrlError:
      'Could not connect to the page. Check the URL and try again.',
    invalidFilesError: 'Please select valid image files.',
    freePlanNotice: (max) =>
      `Free plan: the first ${max} images will be processed.`,
    defaultServicePrefix: 'Service',
    catalogBatchTitle: (count) => `Catalog (${count} images)`,
    savedToCoreNotice: 'Service and API saved to Search Link Core.',
    openAccountMenuAria: (name) => `Open account menu (${name})`,
    connectedAccountAria: (name) => `Connected account (${name})`,
    openAuthAria: 'Open account sign in',
    openAuthTitle: 'Create account or sign in',
    uploadImageFallbackError: 'Failed to upload image.',
    mapImageFallbackError: 'Failed to render and map the image with AI.',
    imageLabel: (index) => `Image ${index}`,
    productLabel: (index) => `Product ${index}`,
  },
  pipeline: {
    stageImagesTitle: 'Your images will appear here',
    stageMetadataTitle: 'Your metadata appears here',
    stageCompressingTitle: 'Compressing',
    stageUploadingTitle: 'Uploading to database',
    stageReceivingTitle: 'Receiving',
    stageMappingTitle: 'Render & map',
    stageMappedDoneTitle: 'Rendered & mapped',
    stageLifecycleTitle: 'Lifecycle',
    stageLifecycleFullTitle: 'Lifecycle, API & endpoint',
    stageViewApiTitle: 'View your API',
    stageProductivityTitle: 'Productivity',
    stageEditorTitle: 'JSON Editor',
    congratsTitleDesktop: 'Congratulations!',
    congratsTitleMobile: 'Congratulations!',
    congratsBodyDesktop: (count) =>
      `You now have ${
        count === 1
          ? '1 image processed and stored'
          : `${count} images processed and stored`
      } in our R2. Your endpoint and API Key let you connect your chatbot and your business website.`,
    congratsBodyMobile: (count) =>
      `You now have ${
        count === 1
          ? '1 image processed and stored'
          : `${count} images processed and stored`
      } in our R2, ready to connect your chatbot and site.`,
    generatedApiTitle: 'Your API & endpoint generated',
    generatedApisLink: 'Generated APIs',
    generatedEndpointLink: 'Generated endpoint',
    credentialsReadyTitle: 'Your credentials are ready',
    credentialsReadyHint:
      'Tap the icon on the right to copy your API Key or endpoint.',
    viewYourOrg: 'View your organization',
    generatingApiKey: 'Generating API Key...',
    generatingEndpoint: 'Generating endpoint...',
    copyApiAria: 'Copy API',
    copyApiTitle: 'Copy API Key',
    copyEndpointAria: 'Copy endpoint',
    copyEndpointTitle: 'Copy endpoint',
    backToMappedAria: 'Back to Rendered & mapped',
    goToLifecycleAria: 'Go to Lifecycle, API & endpoint',
    couldNotReceive: 'Could not receive',
    couldNotMap: 'Could not map this image.',
    tapBorderToExpand: 'Click the white border to expand',
    expandedImagesAria: 'Expanded images view',
    expandedMetadataAria: 'Expanded metadata view',
    elementsCount: (count) => `${count} items`,
    closeExpandedAria: 'Close expanded view',
    doubleClickFullscreen: (alt) =>
      `Double click to view ${alt} fullscreen`,
    useAsBackgroundAria: (alt) => `Use ${alt} as background`,
    openOriginalImageTitle: (alt) => `Open original image: ${alt}`,
    copyUrlOfAria: (alt) => `Copy URL for ${alt}`,
    copyUrlTitle: 'Copy URL',
    viewInBackgroundTitle: (alt) => `View ${alt} in background`,
    enlargeLeftAria: (alt) => `Enlarge ${alt} on the left`,
    clickToViewTitle: (alt) => `Click to view ${alt}`,
    viewProductAria: (alt) => `View ${alt}`,
    closeFullscreenAria: 'Close fullscreen image',
    closeImageAria: 'Close image',
    searchingImages: 'Finding images...',
    whyUseSearchLink: 'Why use Search Link?',
    whyUseSearchLinkAria: 'Why use Search Link',
    mobileCarouselAria: 'Mobile view of images, URLs and benefits',
    mobileCompressionAria: 'Images and compression process',
    productJsonLabel: 'Product JSON',
    showJsonAria: (expanded, name) =>
      `${expanded ? 'Hide' : 'Show'} JSON for ${name}`,
    copyJsonOfAria: (name) => `Copy JSON for ${name}`,
    copyAllJsonAria: 'Copy all JSON',
    copyJsonTitle: 'Copy JSON',
    closeEditorBackAria: 'Close editor and return to Lifecycle',
    closeEditorTitle: 'Close editor',
    readOnlyEditorAria: 'Read-only JSON editor',
    pdfActions: {
      json: 'Download JSON mapping',
      images: 'Download images',
      urls: 'Download URLs',
      metadata: 'Download metadata',
      all: 'Download all',
      openEditor: 'Open in editor',
    },
    benefits: [
      {
        id: 'speed',
        title: 'High speed',
        description:
          'Extract and organize images in seconds, lightweight with zero wait.',
      },
      {
        id: 'clean-urls',
        title: 'Clean URLs',
        description:
          'Turn long messy links into short, structured, ready-to-use URLs.',
      },
      {
        id: 'easy-anywhere',
        title: 'Easy on phone or PC',
        description:
          'Work smoothly from your phone or desktop with no setup hassle.',
      },
      {
        id: 'ready-to-share',
        title: 'Ready to share',
        description:
          'Preview every asset and copy your links or JSON in a single tap.',
      },
    ],
  },
  examples: {
    sectionAria: 'Automation examples',
    heading: 'Automation examples',
    subtitle: 'How Search Link works across messaging & commerce platforms',
    cardAria: (label) => `Example on ${label}`,
    discordVisitor: 'Visitor',
    items: {
      whatsapp: {
        id: 'whatsapp',
        bottomLabel: 'WhatsApp · Chatbots',
        companyName: 'Veloce Footwear',
        accountType: 'Enterprise',
        headerSubline: 'Automated catalog',
        userGreeting: 'Hi',
        botGreeting: 'Hello! How are you? What are you looking for today?',
        userRequest: 'I want to see the white sneakers catalog',
        botResultText: 'Here is what we have available in our catalog.',
        products: [
          { id: 'wa-court', name: 'Veloce Court', subtitle: 'White leather' },
          { id: 'wa-runner', name: 'Veloce Runner', subtitle: 'Ivory knit' },
        ],
      },
      telegram: {
        id: 'telegram',
        bottomLabel: 'Telegram · Bots',
        companyName: 'Apex Motors',
        accountType: 'Official Bot',
        headerSubline: 'Digital dealership',
        userGreeting: 'Hi, looking for cars',
        botGreeting: 'Welcome! Do you prefer an electric sedan or SUV?',
        userRequest: 'Show me what is available today',
        botResultText: 'These two models are ready for delivery.',
        products: [
          { id: 'tg-sedan', name: 'Apex Air EV', subtitle: 'Electric sedan' },
          { id: 'tg-suv', name: 'Apex Terra', subtitle: 'Hybrid SUV' },
        ],
      },
      instagram: {
        id: 'instagram',
        bottomLabel: 'Instagram · DM Bot',
        companyName: 'Núa Studio',
        accountType: 'Shop',
        headerSubline: 'DM automation',
        userGreeting: 'Hi, loved your reel',
        botGreeting: 'Thanks! Which accessory would you like to check?',
        userRequest: 'Watches and sunglasses for a gift',
        botResultText: 'Here are our seasonal favorites.',
        products: [
          { id: 'ig-watch', name: 'Chrono Leather', subtitle: 'Classic edition' },
          { id: 'ig-glasses', name: 'Tortoise Shades', subtitle: 'UV400 filter' },
        ],
      },
      messenger: {
        id: 'messenger',
        bottomLabel: 'Messenger · Meta Bot',
        companyName: 'Nordic Home',
        accountType: 'Home',
        headerSubline: 'Interior advisor',
        userGreeting: 'Hi, I saw your ad',
        botGreeting: 'Hello! Which room are you shopping for?',
        userRequest: 'Something minimalist for the living room',
        botResultText: 'These two pieces pair together seamlessly.',
        products: [
          { id: 'ms-chair', name: 'Oak Lounge Chair', subtitle: 'Beige weave' },
          { id: 'ms-plant', name: 'Monstera Planter', subtitle: 'Matte ceramic' },
        ],
      },
      web: {
        id: 'web',
        bottomLabel: 'Web Chat · Storefront',
        companyName: 'Bistro Brasa',
        accountType: 'Web Widget',
        headerSubline: 'Live menu',
        userGreeting: 'Hi, what do you recommend?',
        botGreeting: 'Hi! Everything is freshly made. What are you craving?',
        userRequest: 'Something quick for dinner tonight',
        botResultText: 'Our two top-ordered dishes tonight.',
        products: [
          { id: 'web-burger', name: 'Brioche Burger', subtitle: 'Aged cheddar' },
          { id: 'web-pizza', name: 'Margherita Pizza', subtitle: 'Sourdough crust' },
        ],
      },
      discord: {
        id: 'discord',
        bottomLabel: 'Discord · Bot API',
        companyName: 'Pulse Gear',
        accountType: 'APP',
        headerSubline: '#hardware-store',
        userGreeting: 'Hey, looking for a dark setup',
        botGreeting: 'Hey there! Audio gear or peripherals?',
        userRequest: 'Show me a keyboard and headset',
        botResultText: 'Both in stock with same-day dispatch.',
        products: [
          { id: 'dc-audio', name: 'Pulse Audio Pro', subtitle: 'Matte black' },
          { id: 'dc-kb', name: '65% Keyboard', subtitle: 'Amber aluminum' },
        ],
      },
      slack: {
        id: 'slack',
        bottomLabel: 'Slack · B2B App',
        companyName: 'WorkCraft B2B',
        accountType: 'Workspace',
        headerSubline: '#office-procurement',
        userGreeting: 'Hi, refreshing our office',
        botGreeting: 'Glad to help. What equipment do you need quoted?',
        userRequest: 'Ergonomic chairs and mugs',
        botResultText: 'Corporate catalog ready for ordering.',
        products: [
          { id: 'sl-chair', name: 'Mesh Chair Pro', subtitle: 'B2B aluminum' },
          { id: 'sl-mug', name: 'Ceramic Set', subtitle: 'Office pack' },
        ],
      },
      line: {
        id: 'line',
        bottomLabel: 'LINE · Official Account',
        companyName: 'Sora Botanics',
        accountType: 'Official',
        headerSubline: 'Skincare assistant',
        userGreeting: 'Hi, looking for skincare',
        botGreeting: 'Hello! Are you looking for serum or fragrance?',
        userRequest: 'Show me both please',
        botResultText: 'Here are our most requested formulas.',
        products: [
          { id: 'ln-serum', name: 'Amber Serum', subtitle: 'Night repair' },
          { id: 'ln-perfume', name: 'Botanic Mist', subtitle: 'Warm notes' },
        ],
      },
    },
  },
  org: {
    unnamed: 'Unnamed',
    welcomeTitle: 'Welcome to your organization',
    welcomeSubtitle: "Let's set it up",
    companyPlaceholder: 'Enter your company name',
    uploadLogoAria: 'Upload organization logo',
    uploadLogoTitle: 'Upload organization logo',
    helperArrowPrompt: 'Add your organization logo and name',
    logoUploadError: 'Could not upload logo.',
    congratsTitle: 'Congratulations!',
    congratsBoth:
      'Your organization logo and name are ready to go.',
    congratsLogoOnly:
      'Your organization logo is ready. You can set a name anytime.',
    congratsNameOnly:
      'Your organization name is set. You can upload a logo anytime.',
    congratsMobileFallback:
      'Your organization is created. You can update your logo or name anytime.',
    changeLogoAria: 'Change organization logo',
    changeLogoTitle: 'Change organization logo',
    orgNamePlaceholder: 'Organization name',
    orgNameShortPlaceholder: 'Name',
    saveOrgNameAria: 'Save organization name',
    renameOrgAria: 'Rename organization',
    renameOrgTitle: 'Rename',
    openStoreServicesAria: 'Open store for your services',
    openStoreAria: 'Open store',
    viewStoreTitle: 'View store',
    pickStoreAria: 'Select a service to view in your store',
    viewStoreOf: 'View store for',
    noServicesAvailable: 'No services available yet.',
    myServices: 'My services',
    newProduct: 'New product',
    noServicesTitleDesktop: 'You do not have any services yet',
    noServicesDescDesktop:
      'Process and map your first catalog on the home screen to generate its service, API Key, and endpoint here.',
    noServicesTitleMobile: 'No services yet',
    noServicesDescMobile:
      'Process a catalog from home to access its service, API Key, and endpoint here.',
    saveServiceNameAria: 'Save service name',
    renameServiceAria: (name) => `Rename ${name}`,
    renameServiceTitle: 'Rename service',
    productCount: (count) => `${count} ${count === 1 ? 'product' : 'products'}`,
    productCountShort: (count) => `${count} items`,
    serviceApiLink: 'Service API',
    serviceEndpointLink: 'Service Endpoint',
    testChatAria: (name) => `Test ${name} in Search Link IA`,
    testChatTitle: 'Test in Search Link IA',
    viewHistoryAria: (name) => `View automation history for ${name}`,
    viewHistoryTitle: 'View automation process',
    closeBoxAria: 'Close dialog',
    apiHintRaw:
      'Send this key in the x-api-key or Authorization: Bearer header.',
    apiHintPrefixDesktop:
      'For security only the prefix is stored in the cloud. Regenerate the API Key if you need to copy it again.',
    apiHintPrefixMobile:
      'For security only the prefix is kept. Regenerate the API Key if you need to copy it again.',
    serviceActiveDesktop: 'Service active',
    servicePausedDesktop: 'Service paused',
    serviceActiveMobile: 'Active',
    servicePausedMobile: 'Paused',
    regenerateKeyDesktop: 'Regenerate API Key',
    regenerateKeyMobile: 'Regenerate',
    pasteKeyPlaceholder: 'Paste your sl_core_... API Key to test',
    copyCurlDesktop: 'Copy cURL command',
    copyCurlMobile: 'Copy cURL',
    curlCopied: 'cURL copied',
    testLive: 'Test live',
  },
  store: {
    emptyTitle: 'This service does not have visible products yet',
    emptyDescDesktop:
      'Process a new batch of images to display them in your visual store.',
    emptyDescMobile: 'Process a new batch of images to view them here.',
    noImage: 'No image',
    tapToCollapse: 'Tap to collapse',
    tapToExpandFull: (name) => `${name} (tap for full name)`,
    unnamedProduct: 'Untitled product',
  },
  chat: {
    closeAria: 'Close Search Link IA',
    clearConversation: 'Clear conversation',
    clearShort: 'Clear',
    liveProducts: (count) =>
      `${count} live ${count === 1 ? 'product' : 'products'}`,
    preparingReply: 'Preparing response...',
    queryingCatalog: 'Querying catalog...',
    dailyLimitNotice:
      'Daily preview used (1/1 today). Come back tomorrow to test again.',
    dailyLimitPlaceholder: 'Daily limit of 1 test reached for today',
    inputPlaceholder: 'Type your message...',
    inputAria: 'Type your message for Search Link IA',
    sendAria: 'Send message',
    defaultSuccessReply: 'Here are the matching options from your catalog.',
    defaultRequestError:
      'Unable to get a response from Search Link IA right now.',
    defaultStreamError: 'Error generating response.',
    networkError: 'Network error connecting to Search Link IA. Please try again.',
  },
  auth: {
    drawerAriaAuth: 'Your Search Link workspace',
    drawerAriaGuest: 'Sign in to Search Link',
    signOutAria: 'Sign out',
    signOutShort: 'Sign out',
    closePanelAria: 'Close panel',
    emailPasswordProvider: 'Email & password',
    accessPlanLine: (provider, isPro) =>
      `Access: ${provider} · ${isPro ? 'Pro' : 'Free'} Plan`,
    refreshAccountAria: 'Refresh account',
    sessionSynced:
      'Active session synced with Supabase (profiles table).',
    sessionMissingProfilesTable:
      'Active session. Run Step 1 SQL to create the profiles table.',
    sessionActive: 'Active session on Supabase Auth.',
    pendingBatchText: (count) =>
      `You have a newly mapped catalog ready to save (${count} items).`,
    saveNow: 'Save now',
    myCatalogsTab: (count) => `My catalogs (${count})`,
    endpointsTab: (count) => `Endpoints & API Keys (${count})`,
    loadingSupabase: 'Loading data from Supabase...',
    step2PendingTitle: 'Step 2 pending: Save catalogs',
    step2PendingDesc:
      'We are verifying your sign-in first (Step 1). Once Google login is verified, catalog tables will store batches here.',
    noCatalogsTitle: 'No saved catalogs yet',
    noCatalogsDesc:
      'Process images or a webpage while signed in and they will appear automatically here.',
    productsCount: (count) => `${count} products`,
    copyFullJsonTitle: 'Copy full JSON',
    deleteBatchAria: (title) => `Delete ${title}`,
    step3PendingTitle: 'Step 3 pending: Endpoints & API Keys',
    step3PendingDesc:
      'Complete Steps 1 & 2 first to enable API Keys and chatbot JSON endpoints.',
    readEndpointTitle: 'JSON Read Endpoint',
    readEndpointDescPrefix:
      'Connect this link to your chatbot, n8n, or Make by sending your API Key via ',
    readEndpointDescMiddle: ' or header ',
    readEndpointDescSuffix: '.',
    generateKeyTitle: 'Generate new API Key',
    keyNamePlaceholder: 'Name (e.g. WhatsApp Bot)',
    associatedCatalogAria: 'Associated catalog',
    allMyCatalogs: 'All my catalogs',
    onlyCatalogPrefix: (title) => `Only: ${title}`,
    createApiKey: 'Create API Key',
    newKeyCreatedHint:
      'Your new API Key (copy it now, it will not be shown in full again)',
    copyUrl: 'Copy URL',
    urlCopied: 'URL copied',
    revokeKeyAria: (name) => `Revoke ${name}`,
    loginHeading: 'Your Search Link account',
    loginSubtitle:
      'Sign in with one tap using Google to save your processed catalogs and connect your API.',
    acceptTermsLabel: 'Accept Terms & Conditions and Privacy Policy',
    termsError:
      'You must accept the Terms & Conditions and Privacy Policy before continuing.',
    supabaseMissingError: 'Supabase is not configured in this environment.',
    googleLinkError: 'Could not generate Google sign-in link.',
    popupBlockedError:
      'Your browser blocked the popup window. Click the link below to open Google.',
    googleSignInError: 'Could not sign in with Google.',
    googleSignedInSuccess: 'Signed in with Google successfully.',
    connectingGoogle: 'Connecting with Google…',
    continueWithGoogle: 'Continue with Google',
    openGoogleNewTab: 'Open Google sign-in in a new tab',
    bullet1: 'Instant access without extra passwords or emails',
    bullet2: 'Your images and JSON safely stored in your workspace',
    bullet3: 'Ready to generate your Endpoint and API Keys',
    errProviderNotEnabled: 'Google sign-in is not enabled in Supabase.',
    errRateLimit: 'Too many requests. Please wait a few seconds.',
    errLoadData: 'Could not load your data.',
    errDeleteBatch: 'Could not delete catalog.',
    errCreateKey: 'Could not create API Key.',
    errCreateKeySchema: 'Run the SQL setup in Supabase to enable API Keys first.',
    errDeleteKey: 'Could not revoke API Key.',
  },
};

const PT_DICT: TranslationDictionary = {
  common: {
    userFallback: 'Usuário',
    productFallback: 'Produto',
    generalCategory: 'Geral',
    copy: 'Copiar',
    copied: 'Copiado',
    copiedFem: 'Copiada',
    cancel: 'Cancelar',
    accept: 'Aceitar',
    edit: 'Editar',
    continueBtn: 'Continuar',
    nextBtn: 'Avançar',
    skip: 'Pular',
    close: 'Fechar',
    save: 'Salvar',
  },
  menu: {
    account: 'Conta',
    googleAccount: 'Sua conta do Google',
    googleAccountDetailsAria: 'Detalhes da sua conta do Google',
    organization: 'Organização',
    myStore: 'Minha loja',
    language: 'Idioma',
    languagesTitle: 'Idiomas',
    accountMenuAria: 'Menu da conta',
    accountOptionsAria: 'Opções da conta',
    languageOptionsAria: 'Idiomas disponíveis',
    backToMenuAria: 'Voltar ao menu',
    backToOrgAria: 'Voltar para Organização',
    closeMenuAria: 'Fechar menu',
    closeAccountModalAria: 'Fechar detalhes da conta',
    closeStoreAria: 'Fechar loja',
    closeOrgAria: 'Fechar organização',
    usernameLabel: 'Nome de usuário',
    googleAccountLabel: 'Conta do Google',
    createdAtLabel: 'Data de criação',
    accountCreatedOn: (formattedDate) => `Conta criada em ${formattedDate}`,
    dateUnavailable: 'Data indisponível',
    signOut: 'Sair da conta',
    confirmSignOutAria: 'Confirmar saída da conta',
    confirmSignOutTitle: 'Tem certeza de que deseja sair da conta?',
    confirmSignOutDescDesktop:
      'Você precisará entrar novamente com o Google para acessar seu espaço.',
    confirmSignOutDescMobile:
      'Você precisará entrar novamente com o Google.',
    signOutError: 'Não foi possível encerrar a sessão. Tente novamente.',
    languageSectionPrompt:
      'Escolha o idioma oficial de toda a plataforma e da Search Link IA.',
    languageSelectedLabel: (label) => `${label} selecionado`,
    languageAutoDetectedNote: (countryCode) =>
      countryCode
        ? `Idioma ajustado automaticamente pelo seu IP (${countryCode}).`
        : 'Idioma ajustado automaticamente pela sua localização.',
    languageManualSavedNote:
      'Preferência salva neste navegador. Não será alterada automaticamente.',
    languageLocalStorageHint:
      'Você pode alternar entre Espanhol, Inglês e Português quando quiser.',
  },
  home: {
    uploadDeviceAria: 'Enviar imagens do dispositivo',
    uploadDeviceTitle: 'Enviar imagens do seu dispositivo',
    urlFormAria: 'Colar URL do site',
    urlInputPlaceholder: 'Cole aqui a URL do seu site...',
    urlInputAria: 'URL do seu site',
    extractingAria: 'Extraindo imagens',
    clearUrlAria: 'Limpar URL',
    invalidUrlError:
      'Não foi possível encontrar imagens válidas neste endereço web.',
    connectUrlError:
      'Não foi possível conectar com a página. Verifique a URL e tente novamente.',
    invalidFilesError: 'Por favor, selecione arquivos de imagem válidos.',
    freePlanNotice: (max) =>
      `Plano gratuito: as primeiras ${max} imagens serão processadas.`,
    defaultServicePrefix: 'Serviço',
    catalogBatchTitle: (count) => `Catálogo (${count} imagens)`,
    savedToCoreNotice: 'Serviço e API salvos no Search Link Core.',
    openAccountMenuAria: (name) => `Abrir menu da conta (${name})`,
    connectedAccountAria: (name) => `Conta conectada (${name})`,
    openAuthAria: 'Abrir cadastro ou login',
    openAuthTitle: 'Criar conta ou entrar',
    uploadImageFallbackError: 'Erro ao enviar a imagem.',
    mapImageFallbackError: 'Erro ao renderizar e mapear a imagem com IA.',
    imageLabel: (index) => `Imagem ${index}`,
    productLabel: (index) => `Produto ${index}`,
  },
  pipeline: {
    stageImagesTitle: 'Aqui você verá suas imagens',
    stageMetadataTitle: 'Aqui você pode ver seus metadados',
    stageCompressingTitle: 'Comprimindo',
    stageUploadingTitle: 'Enviando para o banco',
    stageReceivingTitle: 'Recebendo',
    stageMappingTitle: 'Renderizar e mapear',
    stageMappedDoneTitle: 'Renderizado e mapeado',
    stageLifecycleTitle: 'Ciclo de vida',
    stageLifecycleFullTitle: 'Ciclo de vida, API e endpoint',
    stageViewApiTitle: 'Ver sua API',
    stageProductivityTitle: 'Produtividade',
    stageEditorTitle: 'Editor JSON',
    congratsTitleDesktop: 'Parabéns!',
    congratsTitleMobile: 'Parabéns!',
    congratsBodyDesktop: (count) =>
      `Você já tem ${
        count === 1
          ? '1 imagem processada e salva'
          : `${count} imagens processadas e salvas`
      } no nosso R2. Seu endpoint e sua API conectam seu chatbot ao site da sua empresa.`,
    congratsBodyMobile: (count) =>
      `Você já tem ${
        count === 1
          ? '1 imagem processada e salva'
          : `${count} imagens processadas e salvas`
      } no nosso R2, prontas para conectar seu chatbot e site.`,
    generatedApiTitle: 'Sua API e endpoint gerados',
    generatedApisLink: 'APIs geradas',
    generatedEndpointLink: 'Endpoint gerado',
    credentialsReadyTitle: 'Suas credenciais prontas',
    credentialsReadyHint:
      'Toque no ícone ao lado para copiar sua API Key ou endpoint.',
    viewYourOrg: 'Ver sua organização',
    generatingApiKey: 'Gerando API Key...',
    generatingEndpoint: 'Gerando endpoint...',
    copyApiAria: 'Copiar API',
    copyApiTitle: 'Copiar API Key',
    copyEndpointAria: 'Copiar endpoint',
    copyEndpointTitle: 'Copiar endpoint',
    backToMappedAria: 'Voltar para Renderizado e mapeado',
    goToLifecycleAria: 'Ir para Ciclo de vida, API e endpoint',
    couldNotReceive: 'Não foi possível receber',
    couldNotMap: 'Não foi possível mapear esta imagem.',
    tapBorderToExpand: 'Toque na borda branca para ampliar',
    expandedImagesAria: 'Visualização ampliada de imagens',
    expandedMetadataAria: 'Visualização ampliada de metadados',
    elementsCount: (count) => `${count} itens`,
    closeExpandedAria: 'Fechar visualização ampliada',
    doubleClickFullscreen: (alt) =>
      `Clique duas vezes para ver ${alt} em tela cheia`,
    useAsBackgroundAria: (alt) => `Usar ${alt} como fundo`,
    openOriginalImageTitle: (alt) => `Abrir imagem original: ${alt}`,
    copyUrlOfAria: (alt) => `Copiar URL de ${alt}`,
    copyUrlTitle: 'Copiar URL',
    viewInBackgroundTitle: (alt) => `Ver ${alt} no fundo`,
    enlargeLeftAria: (alt) => `Ampliar ${alt} no lado esquerdo`,
    clickToViewTitle: (alt) => `Clique para ver ${alt}`,
    viewProductAria: (alt) => `Ver ${alt}`,
    closeFullscreenAria: 'Fechar imagem em tela cheia',
    closeImageAria: 'Fechar imagem',
    searchingImages: 'Buscando imagens...',
    whyUseSearchLink: 'Por que usar o Search Link?',
    whyUseSearchLinkAria: 'Por que usar o Search Link',
    mobileCarouselAria: 'Visualização móvel de imagens, URLs e benefícios',
    mobileCompressionAria: 'Imagens e processo de compressão',
    productJsonLabel: 'JSON do produto',
    showJsonAria: (expanded, name) =>
      `${expanded ? 'Ocultar' : 'Ver'} JSON de ${name}`,
    copyJsonOfAria: (name) => `Copiar JSON de ${name}`,
    copyAllJsonAria: 'Copiar todo o JSON',
    copyJsonTitle: 'Copiar JSON',
    closeEditorBackAria: 'Fechar editor e voltar para Ciclo de vida',
    closeEditorTitle: 'Fechar editor',
    readOnlyEditorAria: 'Editor JSON somente leitura',
    pdfActions: {
      json: 'Baixar mapeamento JSON',
      images: 'Baixar imagens',
      urls: 'Baixar URLs',
      metadata: 'Baixar metadados',
      all: 'Baixar tudo',
      openEditor: 'Ver no editor',
    },
    benefits: [
      {
        id: 'speed',
        title: 'Rapidez',
        description:
          'Extrai e organiza imagens em segundos, leve e sem esperas.',
      },
      {
        id: 'clean-urls',
        title: 'URLs limpas',
        description:
          'Converte caminhos longos em links curtos, claros e organizados.',
      },
      {
        id: 'easy-anywhere',
        title: 'Fácil no celular ou PC',
        description:
          'Use com conforto pelo telefone ou computador sem complicações.',
      },
      {
        id: 'ready-to-share',
        title: 'Prontas para compartilhar',
        description:
          'Revise cada foto e tenha seus links prontos em um toque.',
      },
    ],
  },
  examples: {
    sectionAria: 'Exemplos de automações',
    heading: 'Exemplos de automações',
    subtitle: 'Como o Search Link atua em diferentes plataformas',
    cardAria: (label) => `Exemplo no ${label}`,
    discordVisitor: 'Visitante',
    items: {
      whatsapp: {
        id: 'whatsapp',
        bottomLabel: 'WhatsApp · Chatbots',
        companyName: 'Veloce Calçados',
        accountType: 'Enterprise',
        headerSubline: 'Catálogo automático',
        userGreeting: 'Olá',
        botGreeting: 'Olá! Tudo bem? O que você procura hoje?',
        userRequest: 'Quero ver o catálogo de tênis brancos',
        botResultText: 'Aqui estão os modelos disponíveis em catálogo.',
        products: [
          { id: 'wa-court', name: 'Veloce Court', subtitle: 'Couro branco' },
          { id: 'wa-runner', name: 'Veloce Runner', subtitle: 'Knit marfim' },
        ],
      },
      telegram: {
        id: 'telegram',
        bottomLabel: 'Telegram · Bots',
        companyName: 'Apex Motors',
        accountType: 'Bot Oficial',
        headerSubline: 'Concessionária digital',
        userGreeting: 'Olá, procuro carros',
        botGreeting: 'Bem-vindo! Prefere sedã elétrico ou SUV?',
        userRequest: 'Mostre os disponíveis hoje',
        botResultText: 'Estes dois modelos estão prontos para entrega.',
        products: [
          { id: 'tg-sedan', name: 'Apex Air EV', subtitle: 'Sedã elétrico' },
          { id: 'tg-suv', name: 'Apex Terra', subtitle: 'SUV híbrido' },
        ],
      },
      instagram: {
        id: 'instagram',
        bottomLabel: 'Instagram · DM Bot',
        companyName: 'Núa Studio',
        accountType: 'Loja',
        headerSubline: 'Respostas no DM',
        userGreeting: 'Olá, curti o seu reel',
        botGreeting: 'Obrigado! Qual acessório você quer ver?',
        userRequest: 'Relógios e óculos para presente',
        botResultText: 'Aqui estão os nossos favoritos da temporada.',
        products: [
          { id: 'ig-watch', name: 'Crono Couro', subtitle: 'Edição clássica' },
          { id: 'ig-glasses', name: 'Óculos Tartaruga', subtitle: 'Filtro UV400' },
        ],
      },
      messenger: {
        id: 'messenger',
        bottomLabel: 'Messenger · Meta Bot',
        companyName: 'Casa Nórdica',
        accountType: 'Casa',
        headerSubline: 'Consultor de espaços',
        userGreeting: 'Olá, vi o anúncio',
        botGreeting: 'Oi! Para qual ambiente procura peças?',
        userRequest: 'Algo minimalista para a sala',
        botResultText: 'Estas duas peças combinam perfeitamente juntas.',
        products: [
          { id: 'ms-chair', name: 'Poltrona Carvalho', subtitle: 'Linho bege' },
          { id: 'ms-plant', name: 'Vaso Monstera', subtitle: 'Cerâmica fosca' },
        ],
      },
      web: {
        id: 'web',
        bottomLabel: 'Chat Web · Loja',
        companyName: 'Bistro Brasa',
        accountType: 'Web Widget',
        headerSubline: 'Cardápio on-line',
        userGreeting: 'Olá, o que recomendam?',
        botGreeting: 'Oi! Tudo sai fresco na hora. O que prefere?',
        userRequest: 'Algo rápido para o jantar hoje',
        botResultText: 'Nossos dois pratos mais pedidos esta noite.',
        products: [
          { id: 'web-burger', name: 'Burger Brioche', subtitle: 'Cheddar curado' },
          { id: 'web-pizza', name: 'Pizza Margherita', subtitle: 'Fermentação natural' },
        ],
      },
      discord: {
        id: 'discord',
        bottomLabel: 'Discord · Bot API',
        companyName: 'Pulse Gear',
        accountType: 'APP',
        headerSubline: '#loja-hardware',
        userGreeting: 'Olá, busco setup escuro',
        botGreeting: 'E aí! Procura áudio ou periféricos?',
        userRequest: 'Mostre teclado e headset',
        botResultText: 'Ambos disponíveis com envio imediato.',
        products: [
          { id: 'dc-audio', name: 'Pulse Audio Pro', subtitle: 'Preto fosco' },
          { id: 'dc-kb', name: 'Teclado 65%', subtitle: 'Alumínio âmbar' },
        ],
      },
      slack: {
        id: 'slack',
        bottomLabel: 'Slack · App B2B',
        companyName: 'WorkCraft B2B',
        accountType: 'Empresa',
        headerSubline: '#compras-escritorio',
        userGreeting: 'Olá, renovando escritório',
        botGreeting: 'Com certeza. Quais itens precisam cotar?',
        userRequest: 'Cadeiras ergonômicas e canecas',
        botResultText: 'Catálogo corporativo pronto para pedido.',
        products: [
          { id: 'sl-chair', name: 'Cadeira Mesh Pro', subtitle: 'Alumínio B2B' },
          { id: 'sl-mug', name: 'Kit Cerâmica', subtitle: 'Lote escritório' },
        ],
      },
      line: {
        id: 'line',
        bottomLabel: 'LINE · Official Account',
        companyName: 'Sora Botanics',
        accountType: 'Oficial',
        headerSubline: 'Assistente skincare',
        userGreeting: 'Olá, procuro skincare',
        botGreeting: 'Oi! Prefere sérum ou fragrância?',
        userRequest: 'Mostre os dois por favor',
        botResultText: 'Aqui estão nossas fórmulas mais procuradas.',
        products: [
          { id: 'ln-serum', name: 'Sérum Âmbar', subtitle: 'Uso noturno' },
          { id: 'ln-perfume', name: 'Essência Botânica', subtitle: 'Notas quentes' },
        ],
      },
    },
  },
  org: {
    unnamed: 'Sem nome',
    welcomeTitle: 'Bem-vindo à sua organização',
    welcomeSubtitle: 'Vamos criá-la',
    companyPlaceholder: 'Digite o nome da sua empresa',
    uploadLogoAria: 'Enviar logo da organização',
    uploadLogoTitle: 'Enviar logo da organização',
    helperArrowPrompt: 'Adicione o logo da sua organização e o nome',
    logoUploadError: 'Não foi possível enviar o logo.',
    congratsTitle: 'Parabéns!',
    congratsBoth:
      'O logo e o nome da sua organização já estão prontos para começar.',
    congratsLogoOnly:
      'O logo da sua organização já está pronto. Você pode definir o nome quando quiser.',
    congratsNameOnly:
      'O nome da sua organização já está pronto. Você pode enviar o logo quando quiser.',
    congratsMobileFallback:
      'Sua organização foi criada. Você pode ajustar o logo ou o nome quando quiser.',
    changeLogoAria: 'Alterar logo da organização',
    changeLogoTitle: 'Alterar logo da organização',
    orgNamePlaceholder: 'Nome da sua organização',
    orgNameShortPlaceholder: 'Nome',
    saveOrgNameAria: 'Salvar nome da organização',
    renameOrgAria: 'Alterar nome da organização',
    renameOrgTitle: 'Alterar nome',
    openStoreServicesAria: 'Abrir loja dos seus serviços',
    openStoreAria: 'Abrir loja',
    viewStoreTitle: 'Ver loja',
    pickStoreAria: 'Selecione um serviço para ver na sua loja',
    viewStoreOf: 'Ver loja de',
    noServicesAvailable: 'Você ainda não tem serviços disponíveis.',
    myServices: 'Meus serviços',
    newProduct: 'Novo produto',
    noServicesTitleDesktop: 'Você ainda não tem serviços na sua organização',
    noServicesDescDesktop:
      'Processe e mapeie seu primeiro catálogo na tela inicial para ter aqui seu serviço, API e endpoint.',
    noServicesTitleMobile: 'Você ainda não tem serviços',
    noServicesDescMobile:
      'Processe um produto na tela inicial para ver aqui seu serviço, API e endpoint.',
    saveServiceNameAria: 'Salvar nome do serviço',
    renameServiceAria: (name) => `Renomear ${name}`,
    renameServiceTitle: 'Renomear serviço',
    productCount: (count) => `${count} ${count === 1 ? 'produto' : 'produtos'}`,
    productCountShort: (count) => `${count} prod.`,
    serviceApiLink: 'API do serviço',
    serviceEndpointLink: 'Endpoint deste serviço',
    testChatAria: (name) => `Testar ${name} na Search Link IA`,
    testChatTitle: 'Testar na Search Link IA',
    viewHistoryAria: (name) => `Ver histórico do processo de ${name}`,
    viewHistoryTitle: 'Ver processo de automação',
    closeBoxAria: 'Fechar quadro',
    apiHintRaw:
      'Envie esta chave no header x-api-key ou Authorization: Bearer.',
    apiHintPrefixDesktop:
      'Por segurança apenas o prefixo é salvo na nuvem. Gere uma nova API Key se precisar copiá-la completa.',
    apiHintPrefixMobile:
      'Por segurança apenas o prefixo é guardado. Gere uma nova API Key se precisar copiá-la completa.',
    serviceActiveDesktop: 'Serviço ativo',
    servicePausedDesktop: 'Serviço pausado',
    serviceActiveMobile: 'Ativo',
    servicePausedMobile: 'Pausado',
    regenerateKeyDesktop: 'Regenerar API Key',
    regenerateKeyMobile: 'Regenerar',
    pasteKeyPlaceholder: 'Cole sua API Key sl_core_... para testar',
    copyCurlDesktop: 'Copiar comando cURL',
    copyCurlMobile: 'Copiar cURL',
    curlCopied: 'cURL copiado',
    testLive: 'Testar ao vivo',
  },
  store: {
    emptyTitle: 'Este serviço ainda não possui produtos visíveis na loja',
    emptyDescDesktop:
      'Processe um novo lote de imagens para vê-las aqui na sua loja visual.',
    emptyDescMobile: 'Processe um novo lote de imagens para vê-las aqui.',
    noImage: 'Sem imagem',
    tapToCollapse: 'Toque para recolher',
    tapToExpandFull: (name) => `${name} (toque para ver completo)`,
    unnamedProduct: 'Produto sem nome',
  },
  chat: {
    closeAria: 'Fechar Search Link IA',
    clearConversation: 'Limpar conversa',
    clearShort: 'Limpar',
    liveProducts: (count) =>
      `${count} ${count === 1 ? 'produto' : 'produtos'} ao vivo`,
    preparingReply: 'Preparando resposta...',
    queryingCatalog: 'Consultando catálogo...',
    dailyLimitNotice:
      'Teste diário usado (1/1 hoje). Volte amanhã para testar novamente.',
    dailyLimitPlaceholder: 'Limite diário de 1 teste atingido hoje',
    inputPlaceholder: 'Digite sua mensagem...',
    inputAria: 'Digite sua mensagem para a Search Link IA',
    sendAria: 'Enviar mensagem',
    defaultSuccessReply: 'Aqui estão as opções disponíveis no seu catálogo.',
    defaultRequestError:
      'Não foi possível obter resposta da Search Link IA neste momento.',
    defaultStreamError: 'Erro ao gerar resposta.',
    networkError:
      'Erro de rede ao conectar com a Search Link IA. Tente novamente.',
  },
  auth: {
    drawerAriaAuth: 'Seu espaço no Search Link',
    drawerAriaGuest: 'Entrar no Search Link',
    signOutAria: 'Sair',
    signOutShort: 'Sair',
    closePanelAria: 'Fechar painel',
    emailPasswordProvider: 'E-mail e senha',
    accessPlanLine: (provider, isPro) =>
      `Acesso: ${provider} · Plano ${isPro ? 'Pro' : 'Gratuito'}`,
    refreshAccountAria: 'Atualizar conta',
    sessionSynced:
      'Sessão ativa e perfil sincronizado no Supabase (tabela profiles).',
    sessionMissingProfilesTable:
      'Sessão ativa. Execute o SQL do Passo 1 para criar a tabela profiles.',
    sessionActive: 'Sessão ativa no Supabase Auth.',
    pendingBatchText: (count) =>
      `Você tem um catálogo recém-mapeado pronto para salvar (${count} itens).`,
    saveNow: 'Salvar agora',
    myCatalogsTab: (count) => `Meus catálogos (${count})`,
    endpointsTab: (count) => `Endpoint e API Keys (${count})`,
    loadingSupabase: 'Carregando dados do Supabase...',
    step2PendingTitle: 'Passo 2 pendente: Salvar catálogos',
    step2PendingDesc:
      'Estamos verificando seu login primeiro (Passo 1). Após confirmar o Google, os catálogos serão salvos aqui.',
    noCatalogsTitle: 'Você ainda não tem catálogos salvos',
    noCatalogsDesc:
      'Processe imagens ou um site estando conectado e eles serão salvos automaticamente aqui.',
    productsCount: (count) => `${count} produtos`,
    copyFullJsonTitle: 'Copiar JSON completo',
    deleteBatchAria: (title) => `Excluir ${title}`,
    step3PendingTitle: 'Passo 3 pendente: Endpoint e API Keys',
    step3PendingDesc:
      'Conclua os Passos 1 e 2 antes para ativar suas chaves e seu link JSON para chatbots.',
    readEndpointTitle: 'Endpoint de leitura JSON',
    readEndpointDescPrefix:
      'Conecte este link ao seu chatbot, n8n ou Make enviando sua API Key por parâmetro ',
    readEndpointDescMiddle: ' ou cabeçalho ',
    readEndpointDescSuffix: '.',
    generateKeyTitle: 'Gerar nova API Key',
    keyNamePlaceholder: 'Nome (ex. Bot WhatsApp)',
    associatedCatalogAria: 'Catálogo associado',
    allMyCatalogs: 'Todos os meus catálogos',
    onlyCatalogPrefix: (title) => `Apenas: ${title}`,
    createApiKey: 'Criar API Key',
    newKeyCreatedHint:
      'Sua nova API Key (salve agora, não será exibida completa novamente)',
    copyUrl: 'Copiar URL',
    urlCopied: 'URL copiada',
    revokeKeyAria: (name) => `Revogar ${name}`,
    loginHeading: 'Sua conta do Search Link',
    loginSubtitle:
      'Entre em um toque com o Google para salvar seus catálogos processados e conectar sua API.',
    acceptTermsLabel:
      'Aceitar Termos e Condições e Política de Privacidade',
    termsError:
      'Você deve aceitar os Termos e Condições e a Política de Privacidade antes de continuar.',
    supabaseMissingError: 'O Supabase não está configurado neste ambiente.',
    googleLinkError: 'Não foi possível gerar o link de acesso com o Google.',
    popupBlockedError:
      'Seu navegador bloqueou a janela pop-up. Clique no link abaixo para abrir o Google.',
    googleSignInError: 'Não foi possível entrar com o Google.',
    googleSignedInSuccess: 'Login com Google realizado com sucesso.',
    connectingGoogle: 'Conectando com o Google…',
    continueWithGoogle: 'Continuar com o Google',
    openGoogleNewTab: 'Abrir acesso com Google em uma nova aba',
    bullet1: 'Acesso imediato sem senhas ou e-mails extras',
    bullet2: 'Suas imagens e JSON salvos no seu espaço',
    bullet3: 'Pronto para gerar seu Endpoint e API Keys',
    errProviderNotEnabled: 'O login com Google não está ativado no Supabase.',
    errRateLimit: 'Muitas tentativas seguidas. Aguarde alguns segundos.',
    errLoadData: 'Não foi possível carregar seus dados.',
    errDeleteBatch: 'Não foi possível excluir o catálogo.',
    errCreateKey: 'Não foi possível criar a API Key.',
    errCreateKeySchema:
      'Execute primeiro o script SQL no Supabase para habilitar as API Keys.',
    errDeleteKey: 'Não foi possível revogar a API Key.',
  },
};

const DICTIONARIES: Record<SupportedLocale, TranslationDictionary> = {
  es: ES_DICT,
  en: EN_DICT,
  pt: PT_DICT,
};

interface I18nContextValue {
  locale: SupportedLocale;
  source: LocaleSource;
  countryCode: string | null;
  isDetecting: boolean;
  intlLocale: string;
  setManualLocale: (next: SupportedLocale) => void;
  t: TranslationDictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLocaleState(): {
  locale: SupportedLocale;
  source: LocaleSource;
  isManual: boolean;
} {
  if (typeof window === 'undefined') {
    return { locale: 'es', source: 'default', isManual: false };
  }

  try {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const storedManual =
      window.localStorage.getItem(LOCALE_MANUAL_STORAGE_KEY) === 'true';

    if (storedManual && isSupportedLocale(storedLocale)) {
      return { locale: storedLocale, source: 'manual', isManual: true };
    }

    if (isSupportedLocale(storedLocale)) {
      return { locale: storedLocale, source: 'ip', isManual: false };
    }
  } catch {
    // Ignore storage read restrictions
  }

  return { locale: 'es', source: 'default', isManual: false };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => readInitialLocaleState(), []);
  const [locale, setLocale] = useState<SupportedLocale>(initial.locale);
  const [source, setSource] = useState<LocaleSource>(initial.source);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(!initial.isManual);
  const hasManualOverrideRef = useRef<boolean>(initial.isManual);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  useEffect(() => {
    if (hasManualOverrideRef.current) {
      setIsDetecting(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch('/api/locale', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as {
          ok?: boolean;
          locale?: string;
          countryCode?: string | null;
          source?: string;
        };

        if (cancelled || hasManualOverrideRef.current) return;

        if (data.countryCode) {
          setCountryCode(data.countryCode);
        }

        if (isSupportedLocale(data.locale)) {
          setLocale(data.locale);
          setSource(data.source === 'accept-language' ? 'browser' : 'ip');
          try {
            window.localStorage.setItem(LOCALE_STORAGE_KEY, data.locale);
          } catch {
            // Ignore storage write errors
          }
        }
      } catch {
        // Keep fallback locale silently
      } finally {
        if (!cancelled) {
          setIsDetecting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setManualLocale = useCallback((next: SupportedLocale) => {
    hasManualOverrideRef.current = true;
    setLocale(next);
    setSource('manual');
    setIsDetecting(false);

    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      window.localStorage.setItem(LOCALE_MANUAL_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      source,
      countryCode,
      isDetecting,
      intlLocale: getIntlLocale(locale),
      setManualLocale,
      t: DICTIONARIES[locale],
    }),
    [locale, source, countryCode, isDetecting, setManualLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: 'es',
      source: 'default',
      countryCode: null,
      isDetecting: false,
      intlLocale: 'es-ES',
      setManualLocale: () => {},
      t: ES_DICT,
    };
  }
  return ctx;
}
