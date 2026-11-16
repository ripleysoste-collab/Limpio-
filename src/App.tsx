import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link2, Loader2, Upload, X } from 'lucide-react';
import desktopExecutivesBg from './assets/images/bg_executives_desktop_1794778300480.jpg';
import { AuthDrawer } from './components/AuthDrawer';
import { DualCatalogShowcase } from './components/DualCatalogShowcase';
import {
  MobileCatalogCarousel,
  type CompressedImageMeta,
  type ImageCompressionStatus,
  type ImageMapStatus,
  type ImageReceiveStatus,
  type ImageUploadStatus,
} from './components/MobileCatalogCarousel';
import { SearchLinkLogo } from './components/SearchLinkLogo';
import { CATALOG_SAMPLE_IMAGES, type CatalogImageItem } from './data/catalogSamples';
import {
  compressImageToWebp,
  mapUploadedImageWithAi,
  renderImageBlobFromUrl,
  uploadCompressedImage,
  type CompressedImageResult,
  type MappedImageMetadata,
  type UploadedCompressedImage,
} from './lib/imageCompression';

const MAX_FREE_UPLOAD_IMAGES = 10;
const COMPRESSION_START_DELAY_MS = 2000;
const UPLOAD_START_DELAY_MS = 1000;
const RECEIVE_START_DELAY_MS = 1000;
const MAP_START_DELAY_MS = 1000;
const UPLOAD_CONCURRENCY = 3;
const MIN_RENDER_STEP_MS = 230;
const MIN_TILE_STEP_MS = 260;
const MIN_RECEIVE_STEP_MS = 230;
const MIN_MAP_STEP_MS = 230;

type BatchImageSource =
  | { kind: 'file'; file: File }
  | { kind: 'url'; url: string };

export default function App() {
  const [url, setUrl] = useState('');
  const [catalogImages, setCatalogImages] = useState<CatalogImageItem[]>(
    CATALOG_SAMPLE_IMAGES,
  );
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [activeBgImage, setActiveBgImage] = useState<CatalogImageItem | null>(null);
  const [hasAnimatedFirstBg, setHasAnimatedFirstBg] = useState(false);
  const [shouldAnimateBgEntry, setShouldAnimateBgEntry] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);
  const [isFileUploadFlow, setIsFileUploadFlow] = useState(false);
  const [showCompressionBox, setShowCompressionBox] = useState(false);
  const [compressionStatuses, setCompressionStatuses] = useState<
    Record<string, ImageCompressionStatus>
  >({});
  const [showUploadBox, setShowUploadBox] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<
    Record<string, ImageUploadStatus>
  >({});
  const [showReceiveBox, setShowReceiveBox] = useState(false);
  const [receiveStatuses, setReceiveStatuses] = useState<
    Record<string, ImageReceiveStatus>
  >({});
  const [showMapBox, setShowMapBox] = useState(false);
  const [mapStatuses, setMapStatuses] = useState<
    Record<string, ImageMapStatus>
  >({});
  const [mappedResults, setMappedResults] = useState<
    Record<string, MappedImageMetadata>
  >({});
  const [compressionResults, setCompressionResults] = useState<
    Record<string, CompressedImageMeta>
  >({});
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractAbortRef = useRef<AbortController | null>(null);
  const compressionAbortRef = useRef<AbortController | null>(null);
  const compressionTimerRef = useRef<number | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const cancelOngoingCompression = () => {
    if (compressionTimerRef.current !== null) {
      window.clearTimeout(compressionTimerRef.current);
      compressionTimerRef.current = null;
    }
    compressionAbortRef.current?.abort();
    compressionAbortRef.current = null;
  };

  useEffect(() => {
    return () => {
      extractAbortRef.current?.abort();
      cancelOngoingCompression();
      objectUrlsRef.current.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
    };
  }, []);

  useEffect(() => {
    if (!isAuthOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsAuthOpen(false);
        return;
      }

      if (
        event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        event.key.toLowerCase() === 'x'
      ) {
        event.preventDefault();
        setIsAuthOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || isExtracting) return;

    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    cancelOngoingCompression();
    setBatchNotice(null);
    setIsFileUploadFlow(false);
    setShowCompressionBox(false);
    setCompressionStatuses({});
    setShowUploadBox(false);
    setUploadStatuses({});
    setShowReceiveBox(false);
    setReceiveStatuses({});
    setShowMapBox(false);
    setMapStatuses({});
    setMappedResults({});
    setCompressionResults({});
    setUrl(normalized);
    setHasSearched(true);
    setExtractError(null);
    setIsExtracting(true);

    extractAbortRef.current?.abort();
    const controller = new AbortController();
    extractAbortRef.current = controller;

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => ({}))) as {
        images?: CatalogImageItem[];
        error?: string;
      };

      if (!response.ok || !Array.isArray(data.images) || data.images.length === 0) {
        setExtractError(
          data.error ||
            'No pudimos encontrar imágenes válidas en esa dirección web.',
        );
        return;
      }

      const extractedImages = data.images.slice(0, MAX_FREE_UPLOAD_IMAGES);
      const overflowNotice =
        data.images.length > MAX_FREE_UPLOAD_IMAGES
          ? `Plan gratuito: se procesarán las primeras ${MAX_FREE_UPLOAD_IMAGES} imágenes.`
          : null;

      inputRef.current?.blur();
      startAutomatedBatchPipeline(
        extractedImages,
        extractedImages.map((img) => ({ kind: 'url', url: img.url })),
        overflowNotice,
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setExtractError(
        'No se pudo conectar con la página. Verifica la URL e intenta de nuevo.',
      );
    } finally {
      if (extractAbortRef.current === controller) {
        setIsExtracting(false);
      }
    }
  };

  const startAutomatedBatchPipeline = (
    items: CatalogImageItem[],
    sources: BatchImageSource[],
    initialNotice: string | null = null,
  ) => {
    const initialCompressionStatuses: Record<string, ImageCompressionStatus> = {};
    const initialUploadStatuses: Record<string, ImageUploadStatus> = {};
    const initialReceiveStatuses: Record<string, ImageReceiveStatus> = {};
    const initialMapStatuses: Record<string, ImageMapStatus> = {};

    items.forEach((item) => {
      initialCompressionStatuses[item.id] = 'pending';
      initialUploadStatuses[item.id] = 'pending';
      initialReceiveStatuses[item.id] = 'waiting';
      initialMapStatuses[item.id] = 'waiting';
    });

    setBatchNotice(initialNotice);
    setIsFileUploadFlow(true);
    setShowCompressionBox(false);
    setShowUploadBox(false);
    setShowReceiveBox(false);
    setShowMapBox(false);
    setCompressionStatuses(initialCompressionStatuses);
    setUploadStatuses(initialUploadStatuses);
    setReceiveStatuses(initialReceiveStatuses);
    setMapStatuses(initialMapStatuses);
    setMappedResults({});
    setCompressionResults({});
    setHasSearched(true);
    setCatalogImages(items);
    setCatalogVersion((prev) => prev + 1);

    const controller = new AbortController();
    compressionAbortRef.current = controller;

    // Wait 2 seconds after images settle, then run Stage 2 (render URL if needed -> WebP compress), Stage 3 (R2 upload), Stage 4 (receive URLs)
    compressionTimerRef.current = window.setTimeout(() => {
      compressionTimerRef.current = null;
      if (controller.signal.aborted) return;

      setShowCompressionBox(true);

      type RenderTaskResult =
        | { ok: true; blob: Blob }
        | { ok: false };

      type CompressTaskResult =
        | { ok: true; data: CompressedImageResult }
        | { ok: false };

      const renderResolvers: Array<(res: RenderTaskResult) => void> = [];
      const renderPromises: Array<Promise<RenderTaskResult>> = sources.map(
        (_, idx) =>
          new Promise<RenderTaskResult>((resolve) => {
            renderResolvers[idx] = resolve;
          }),
      );

      const compressResolvers: Array<(res: CompressTaskResult) => void> = [];
      const compressPromises: Array<Promise<CompressTaskResult>> = sources.map(
        (_, idx) =>
          new Promise<CompressTaskResult>((resolve) => {
            compressResolvers[idx] = resolve;
          }),
      );

      // Workers render URLs (if remote) and compress to WebP in parallel
      let workerCursor = 0;
      const workerCount = Math.min(UPLOAD_CONCURRENCY, sources.length);
      for (let w = 0; w < workerCount; w++) {
        void (async () => {
          while (workerCursor < sources.length && !controller.signal.aborted) {
            const index = workerCursor++;
            const source = sources[index];

            try {
              let sourceBlob: Blob;
              if (source.kind === 'url') {
                sourceBlob = await renderImageBlobFromUrl(
                  source.url,
                  controller.signal,
                );
                renderResolvers[index]({ ok: true, blob: sourceBlob });
              } else {
                sourceBlob = source.file;
                renderResolvers[index]({ ok: true, blob: sourceBlob });
              }

              const compressed = await compressImageToWebp(sourceBlob);
              compressResolvers[index]({ ok: true, data: compressed });
            } catch {
              renderResolvers[index]({ ok: false });
              compressResolvers[index]({ ok: false });
            }
          }
        })();
      }

      void (async () => {
        const compressedPayloads: Array<CompressedImageResult | null> = new Array(
          items.length,
        ).fill(null);

        for (let i = 0; i < items.length; i++) {
          if (controller.signal.aborted) return;
          const item = items[i];
          const source = sources[i];

          if (source.kind === 'url') {
            setCompressionStatuses((prev) => ({
              ...prev,
              [item.id]: 'rendering',
            }));

            const renderBeat = new Promise<void>((resolve) =>
              window.setTimeout(resolve, MIN_RENDER_STEP_MS),
            );
            const [renderResult] = await Promise.all([renderPromises[i], renderBeat]);
            if (controller.signal.aborted) return;

            if (!renderResult.ok) {
              setCompressionStatuses((prev) => ({
                ...prev,
                [item.id]: 'error',
              }));
              continue;
            }
          }

          setCompressionStatuses((prev) => ({
            ...prev,
            [item.id]: 'compressing',
          }));

          const stepBeat = new Promise<void>((resolve) =>
            window.setTimeout(
              resolve,
              source.kind === 'file' ? 320 : MIN_TILE_STEP_MS,
            ),
          );

          const [result] = await Promise.all([compressPromises[i], stepBeat]);
          if (controller.signal.aborted) return;

          if (result.ok) {
            compressedPayloads[i] = result.data;
            setCompressionStatuses((prev) => ({
              ...prev,
              [item.id]: 'done',
            }));
          } else {
            setCompressionStatuses((prev) => ({
              ...prev,
              [item.id]: 'error',
            }));
          }
        }

        // Wait 1 second after all images finish compressing before moving to Stage 3
        await new Promise<void>((resolve) => {
          compressionTimerRef.current = window.setTimeout(() => {
            compressionTimerRef.current = null;
            resolve();
          }, UPLOAD_START_DELAY_MS);
        });

        if (controller.signal.aborted) return;

        setShowUploadBox(true);

        type UploadTaskResult =
          | { ok: true; data: UploadedCompressedImage }
          | { ok: false; aborted: boolean; errorMessage?: string };

        const uploadResolvers: Array<(res: UploadTaskResult) => void> = [];
        const uploadPromises: Array<Promise<UploadTaskResult>> = compressedPayloads.map(
          (payload, idx) => {
            if (!payload) {
              return Promise.resolve({ ok: false, aborted: false });
            }
            return new Promise<UploadTaskResult>((resolve) => {
              uploadResolvers[idx] = resolve;
            });
          },
        );

        let uploadCursor = 0;
        const uploadWorkerCount = Math.min(UPLOAD_CONCURRENCY, compressedPayloads.length);
        for (let w = 0; w < uploadWorkerCount; w++) {
          void (async () => {
            while (
              uploadCursor < compressedPayloads.length &&
              !controller.signal.aborted
            ) {
              const index = uploadCursor++;
              const payload = compressedPayloads[index];
              if (!payload) continue;

              try {
                const data = await uploadCompressedImage(payload, controller.signal);
                uploadResolvers[index]({ ok: true, data });
              } catch (err) {
                const aborted =
                  controller.signal.aborted ||
                  (err instanceof DOMException && err.name === 'AbortError');
                const errorMessage =
                  err instanceof Error ? err.message : 'Error al subir la imagen.';
                uploadResolvers[index]({ ok: false, aborted, errorMessage });
              }
            }
          })();
        }

        const uploadedPayloads: Array<UploadedCompressedImage | null> = new Array(
          items.length,
        ).fill(null);
        let firstUploadError: string | null = null;

        for (let i = 0; i < items.length; i++) {
          if (controller.signal.aborted) return;
          const item = items[i];

          setUploadStatuses((prev) => ({
            ...prev,
            [item.id]: 'uploading',
          }));

          const stepBeat = new Promise<void>((resolve) =>
            window.setTimeout(resolve, MIN_TILE_STEP_MS),
          );

          const [result] = await Promise.all([uploadPromises[i], stepBeat]);
          if (controller.signal.aborted) return;

          if (result.ok) {
            uploadedPayloads[i] = result.data;
            setUploadStatuses((prev) => ({
              ...prev,
              [item.id]: 'done',
            }));
          } else if (!result.aborted) {
            if (!firstUploadError && result.errorMessage) {
              firstUploadError = result.errorMessage;
              setBatchNotice(result.errorMessage);
            }
            setUploadStatuses((prev) => ({
              ...prev,
              [item.id]: 'error',
            }));
          }
        }

        // Wait 1 second after all uploads finish before moving to Stage 4 ("Recibiendo")
        await new Promise<void>((resolve) => {
          compressionTimerRef.current = window.setTimeout(() => {
            compressionTimerRef.current = null;
            resolve();
          }, RECEIVE_START_DELAY_MS);
        });

        if (controller.signal.aborted) return;

        setShowReceiveBox(true);

        // Brief spin beat so the user sees all green circles rotating rapidly before URLs settle
        await new Promise<void>((resolve) => {
          compressionTimerRef.current = window.setTimeout(() => {
            compressionTimerRef.current = null;
            resolve();
          }, 360);
        });

        for (let i = 0; i < items.length; i++) {
          if (controller.signal.aborted) return;
          const item = items[i];
          const uploaded = uploadedPayloads[i];

          if (uploaded) {
            setCompressionResults((prev) => ({
              ...prev,
              [item.id]: {
                url: uploaded.url,
                cleanUrl: uploaded.url,
                savedPercent: uploaded.savedPercent,
                compressedBytes: uploaded.compressedBytes,
              },
            }));
            setReceiveStatuses((prev) => ({
              ...prev,
              [item.id]: 'received',
            }));
          } else {
            setReceiveStatuses((prev) => ({
              ...prev,
              [item.id]: 'error',
            }));
          }

          if (i < items.length - 1) {
            await new Promise<void>((resolve) =>
              window.setTimeout(resolve, MIN_RECEIVE_STEP_MS),
            );
          }
        }

        // Wait 1 second after all URLs are received before moving to Stage 5 ("Renderizar y mapear")
        await new Promise<void>((resolve) => {
          compressionTimerRef.current = window.setTimeout(() => {
            compressionTimerRef.current = null;
            resolve();
          }, MAP_START_DELAY_MS);
        });

        if (controller.signal.aborted) return;

        setShowMapBox(true);

        type MapTaskResult =
          | { ok: true; data: MappedImageMetadata }
          | { ok: false; aborted: boolean; errorMessage?: string };

        const mapResolvers: Array<(res: MapTaskResult) => void> = [];
        const mapPromises: Array<Promise<MapTaskResult>> = uploadedPayloads.map(
          (uploaded, idx) => {
            if (!uploaded) {
              return Promise.resolve({ ok: false, aborted: false });
            }
            return new Promise<MapTaskResult>((resolve) => {
              mapResolvers[idx] = resolve;
            });
          },
        );

        let mapCursor = 0;
        const mapWorkerCount = Math.min(UPLOAD_CONCURRENCY, uploadedPayloads.length);
        for (let w = 0; w < mapWorkerCount; w++) {
          void (async () => {
            while (
              mapCursor < uploadedPayloads.length &&
              !controller.signal.aborted
            ) {
              const index = mapCursor++;
              const uploaded = uploadedPayloads[index];
              if (!uploaded) continue;

              try {
                const data = await mapUploadedImageWithAi(
                  { key: uploaded.key, imageUrl: uploaded.url },
                  controller.signal,
                );
                mapResolvers[index]({ ok: true, data });
              } catch (err) {
                const aborted =
                  controller.signal.aborted ||
                  (err instanceof DOMException && err.name === 'AbortError');
                const errorMessage =
                  err instanceof Error
                    ? err.message
                    : 'Error al renderizar y mapear la imagen con IA.';
                mapResolvers[index]({ ok: false, aborted, errorMessage });
              }
            }
          })();
        }

        let firstMapError: string | null = null;

        for (let i = 0; i < items.length; i++) {
          if (controller.signal.aborted) return;
          const item = items[i];

          setMapStatuses((prev) => ({
            ...prev,
            [item.id]: 'mapping',
          }));

          const stepBeat = new Promise<void>((resolve) =>
            window.setTimeout(resolve, MIN_MAP_STEP_MS),
          );

          const [mapResult] = await Promise.all([mapPromises[i], stepBeat]);
          if (controller.signal.aborted) return;

          if (mapResult.ok) {
            setMappedResults((prev) => ({
              ...prev,
              [item.id]: mapResult.data,
            }));
            setMapStatuses((prev) => ({
              ...prev,
              [item.id]: 'mapped',
            }));
          } else if (!mapResult.aborted) {
            if (!firstMapError && mapResult.errorMessage) {
              firstMapError = mapResult.errorMessage;
              setBatchNotice(mapResult.errorMessage);
            }
            setMapStatuses((prev) => ({
              ...prev,
              [item.id]: 'error',
            }));
          }
        }
      })();
    }, COMPRESSION_START_DELAY_MS);
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const allValidFiles = Array.from(fileList).filter(
      (file) =>
        file.type.startsWith('image/') ||
        /\.(jpe?g|png|webp|gif|avif|bmp|svg)$/i.test(file.name),
    );

    event.target.value = '';

    if (allValidFiles.length === 0) {
      setExtractError('Por favor selecciona archivos de imagen válidos.');
      return;
    }

    const validFiles = allValidFiles.slice(0, MAX_FREE_UPLOAD_IMAGES);
    const overflowNotice =
      allValidFiles.length > MAX_FREE_UPLOAD_IMAGES
        ? `Plan gratuito: se procesarán las primeras ${MAX_FREE_UPLOAD_IMAGES} imágenes.`
        : null;

    extractAbortRef.current?.abort();
    cancelOngoingCompression();
    setIsExtracting(false);
    setExtractError(null);

    const activeBgUrl = activeBgImage?.url ?? null;
    objectUrlsRef.current.forEach((oldUrl) => {
      if (oldUrl !== activeBgUrl) {
        URL.revokeObjectURL(oldUrl);
      }
    });

    const newBlobUrls: string[] = [];
    const batchStamp = Date.now();
    const uploadedItems: CatalogImageItem[] = validFiles.map((file, idx) => {
      const objectUrl = URL.createObjectURL(file);
      newBlobUrls.push(objectUrl);

      const cleanTitle =
        file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .trim() || `Imagen ${idx + 1}`;

      return {
        id: `local-${batchStamp}-${idx}-${file.lastModified}`,
        url: objectUrl,
        cleanUrl: `archivo/${file.name}`,
        alt: cleanTitle,
        originalBytes: file.size,
      };
    });

    objectUrlsRef.current =
      activeBgUrl && activeBgUrl.startsWith('blob:')
        ? [activeBgUrl, ...newBlobUrls]
        : newBlobUrls;

    startAutomatedBatchPipeline(
      uploadedItems,
      validFiles.map((file) => ({ kind: 'file', file })),
      overflowNotice,
    );
  };

  const handleSelectBackground = (item: CatalogImageItem) => {
    if (!hasAnimatedFirstBg) {
      setShouldAnimateBgEntry(true);
      setHasAnimatedFirstBg(true);
    } else {
      setShouldAnimateBgEntry(false);
    }
    setActiveBgImage(item);
  };

  return (
    <main className="bg-white lg:bg-[#0e1013] relative min-h-dvh w-full overflow-x-hidden lg:overflow-hidden flex flex-col items-center px-4 sm:px-5 lg:px-6 pt-3.5 sm:pt-4 lg:pt-5 pb-6 lg:pb-8">
      {/* Mobile-only full-screen natural luminous backdrop with gentle living color movement */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none fixed inset-0 z-0 overflow-hidden lg:hidden"
        style={{
          background:
            'linear-gradient(160deg, #eef6ff 0%, #f8fbff 42%, #ffffff 70%, #f2fbf6 100%)',
        }}
      >
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [-18, 28, -10, -18],
                  y: [-12, 22, 10, -12],
                  scale: [1, 1.08, 0.96, 1],
                }
          }
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-24 -left-20 w-[92vw] h-[46vh] rounded-full blur-3xl will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(59, 130, 246, 0.28) 0%, rgba(96, 165, 250, 0.14) 55%, transparent 76%)',
          }}
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [20, -24, 14, 20],
                  y: [10, -16, 20, 10],
                  scale: [1.02, 0.95, 1.07, 1.02],
                }
          }
          transition={{
            duration: 21,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-16 -right-24 w-[88vw] h-[44vh] rounded-full blur-3xl will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(234, 67, 53, 0.20) 0%, rgba(245, 158, 11, 0.15) 50%, transparent 76%)',
          }}
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [-16, 22, -20, -16],
                  y: [18, -20, 8, 18],
                  scale: [0.98, 1.07, 1, 0.98],
                }
          }
          transition={{
            duration: 23,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-[36vh] -left-20 w-[90vw] h-[44vh] rounded-full blur-3xl will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, rgba(59, 130, 246, 0.12) 55%, transparent 76%)',
          }}
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [14, -26, 12, 14],
                  y: [-14, 18, -8, -14],
                  scale: [1, 1.09, 0.97, 1],
                }
          }
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-24 -right-16 w-[96vw] h-[48vh] rounded-full blur-3xl will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(59, 130, 246, 0.15) 52%, transparent 76%)',
          }}
        />
      </div>

      {/* Desktop-only official AI-generated executives background */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none fixed inset-0 z-0 hidden lg:block overflow-hidden bg-[#0e1013]"
      >
        <img
          src={desktopExecutivesBg}
          alt=""
          decoding="sync"
          className="w-full h-full object-cover object-[50%_18%]"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/40" />
      </div>

      {/* Desktop URL-selected background override activated via eye icon */}
      {activeBgImage && (
        <motion.div
          key={shouldAnimateBgEntry ? 'first-bg-reveal' : 'instant-bg-swap'}
          aria-hidden="true"
          initial={
            shouldAnimateBgEntry && !shouldReduceMotion
              ? {
                  clipPath: 'inset(3% 1.25% 3% 85% round 22px)',
                  opacity: 0,
                }
              : false
          }
          animate={
            shouldAnimateBgEntry && !shouldReduceMotion
              ? {
                  clipPath: [
                    'inset(3% 1.25% 3% 85% round 22px)',
                    'inset(3% 1.25% 3% 85% round 22px)',
                    'inset(0% 0% 0% 0% round 0px)',
                  ],
                  opacity: [0, 1, 1],
                }
              : {
                  clipPath: 'inset(0% 0% 0% 0% round 0px)',
                  opacity: 1,
                }
          }
          transition={
            shouldAnimateBgEntry && !shouldReduceMotion
              ? {
                  duration: 1.25,
                  times: [0, 0.24, 1],
                  ease: [0.22, 1, 0.36, 1],
                }
              : { duration: 0 }
          }
          className="pointer-events-none select-none fixed inset-0 z-[2] hidden lg:block overflow-hidden"
        >
          <img
            src={activeBgImage.url}
            alt=""
            referrerPolicy="no-referrer"
            decoding="sync"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/35" />
        </motion.div>
      )}

      {/* Top header: corners hug edges; URL bar stays centered on desktop and below on mobile */}
      <header className="relative z-10 w-full flex flex-col gap-2.5 lg:grid lg:grid-cols-[1fr_minmax(0,768px)_1fr] lg:items-center lg:gap-6">
        {/* Top row on mobile (Logo left + Guest icon right); split into outer grid tracks on desktop */}
        <div className="flex items-center justify-between lg:contents">
          <div className="flex items-center justify-start lg:justify-self-start">
            <SearchLinkLogo onDarkBackground="desktop" />
          </div>

          {/* Mobile top-right guest sketch (light backdrop contrast) */}
          <div className="flex items-center justify-end lg:hidden">
            <GuestAvatarSketch
              variant="light"
              expanded={isAuthOpen}
              onClick={() => setIsAuthOpen(true)}
            />
          </div>
        </div>

        <div className="w-full max-w-3xl mx-auto flex flex-col">
          <div className="flex items-center gap-2.5 sm:gap-3 w-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
              aria-label="Subir imágenes desde el dispositivo"
              title="Subir imágenes desde tu dispositivo"
              className="h-12 w-12 shrink-0 rounded-full flex items-center justify-center bg-white/40 lg:bg-white/95 backdrop-blur-xl lg:backdrop-blur-md border border-slate-900/12 lg:border-white/85 ring-1 ring-inset ring-white/85 lg:ring-0 text-blue-600/85 lg:text-slate-600 hover:bg-white/75 lg:hover:bg-white hover:text-blue-700 lg:hover:text-slate-900 shadow-[0_8px_28px_-6px_rgba(37,99,235,0.12),0_2px_8px_-2px_rgba(15,23,42,0.06)] lg:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.4)] transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 lg:focus-visible:ring-white disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <Upload className="w-4.5 h-4.5" aria-hidden="true" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />

            <form
              onSubmit={handleSubmit}
              role="search"
              aria-label="Pegar URL de página web"
              className="flex-1 min-w-0"
            >
              <div className="group flex items-center gap-2.5 lg:gap-3 h-12 w-full rounded-full px-4 lg:px-5 bg-white/40 lg:bg-white/95 backdrop-blur-xl lg:backdrop-blur-md border border-slate-900/12 lg:border-white/85 ring-1 ring-inset ring-white/85 lg:ring-0 shadow-[0_8px_28px_-6px_rgba(37,99,235,0.12),0_2px_8px_-2px_rgba(15,23,42,0.06)] lg:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.4)] transition-all duration-150 focus-within:bg-white/75 lg:focus-within:bg-white focus-within:border-blue-500/45 lg:focus-within:border-white focus-within:shadow-[0_10px_34px_-6px_rgba(37,99,235,0.2)] lg:focus-within:shadow-[0_14px_42px_-6px_rgba(0,0,0,0.48)]">
                <Link2
                  className="w-4 h-4 text-blue-600/75 lg:text-slate-400 shrink-0 transition-colors duration-150 group-focus-within:text-blue-600 lg:group-focus-within:text-slate-700"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (extractError) setExtractError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Pega aquí la URL de tu página web..."
                  aria-label="URL de tu página web"
                  autoComplete="url"
                  spellCheck={false}
                  className="flex-1 min-w-0 bg-transparent text-[14px] sm:text-[15px] font-normal text-slate-900 placeholder:text-slate-500 lg:placeholder:text-slate-400 focus:outline-none"
                />
                {isExtracting ? (
                  <Loader2
                    className="w-4 h-4 text-blue-600 lg:text-slate-700 animate-spin shrink-0"
                    aria-label="Extrayendo imágenes"
                  />
                ) : (
                  url.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setUrl('');
                        setExtractError(null);
                      }}
                      aria-label="Limpiar URL"
                      className="flex items-center justify-center w-7 h-7 -mr-1.5 rounded-full text-slate-500 lg:text-slate-400 hover:text-slate-800 hover:bg-white/60 lg:hover:bg-slate-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:focus-visible:ring-slate-400 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )
                )}
              </div>
            </form>
          </div>

          {extractError ? (
            <p
              role="alert"
              className="mt-2 px-4 text-xs font-medium text-rose-600 lg:text-rose-200 lg:drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] text-center"
            >
              {extractError}
            </p>
          ) : (
            batchNotice && (
              <p
                role="status"
                className="mt-2 px-4 text-xs font-medium text-slate-600 lg:text-slate-200 lg:drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] text-center"
              >
                {batchNotice}
              </p>
            )
          )}
        </div>

        {/* Desktop top-right guest sketch (dark executives backdrop contrast) */}
        <div className="hidden lg:flex lg:justify-self-end items-center justify-end">
          <GuestAvatarSketch
            variant="dark"
            expanded={isAuthOpen}
            onClick={() => setIsAuthOpen(true)}
          />
        </div>
      </header>

      {/* Desktop-only dual showcase boxes with cross-gap animations */}
      <DualCatalogShowcase
        key={`desktop-catalog-${catalogVersion}`}
        images={catalogImages}
        activeBackgroundId={activeBgImage?.id ?? null}
        onSelectBackground={handleSelectBackground}
        suspendShortcuts={isAuthOpen}
        isFileUploadFlow={isFileUploadFlow}
        showCompressionBox={showCompressionBox}
        compressionStatuses={compressionStatuses}
        showUploadBox={showUploadBox}
        uploadStatuses={uploadStatuses}
        showReceiveBox={showReceiveBox}
        receiveStatuses={receiveStatuses}
        compressionResults={compressionResults}
      />

      {/* Mobile-only swipeable boxes with Stage 2–5 auto-pan + unboxed metadata / JSON below */}
      <MobileCatalogCarousel
        images={catalogImages}
        isUnified={hasSearched}
        isExtracting={isExtracting}
        extractError={extractError}
        hasExtractedResults={catalogVersion > 0}
        showCompressionBox={showCompressionBox}
        compressionStatuses={compressionStatuses}
        showUploadBox={showUploadBox}
        uploadStatuses={uploadStatuses}
        showReceiveBox={showReceiveBox}
        receiveStatuses={receiveStatuses}
        showMapBox={showMapBox}
        mapStatuses={mapStatuses}
        mappedResults={mappedResults}
        compressionResults={compressionResults}
      />

      {/* Responsive white dot-grid registration panel */}
      <AuthDrawer open={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}

interface GuestAvatarSketchProps {
  variant: 'light' | 'dark';
  expanded: boolean;
  onClick: () => void;
}

function GuestAvatarSketch({ variant, expanded, onClick }: GuestAvatarSketchProps) {
  const toneClass =
    variant === 'light'
      ? 'border-slate-300/90 bg-white/85 text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,0.08)] hover:border-slate-400 hover:bg-white focus-visible:ring-slate-400'
      : 'border-white/50 bg-black/25 text-white/90 shadow-[0_2px_10px_rgba(0,0,0,0.28)] hover:border-white/85 hover:bg-black/35 focus-visible:ring-white/80';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-haspopup="dialog"
      aria-label="Abrir registro de cuenta"
      title="Crear cuenta o iniciar sesión"
      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border backdrop-blur-sm flex items-center justify-center cursor-pointer select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 shrink-0 ${toneClass}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4.5 h-4.5 sm:w-5 sm:h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="8.5" r="3.25" />
        <path d="M5.75 19.25a6.5 6.5 0 0 1 12.5 0" />
      </svg>
    </button>
  );
}
