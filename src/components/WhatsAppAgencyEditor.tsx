import { useMemo, useState, type KeyboardEvent } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Code2,
  FileCode2,
  FileJson,
  Folder,
  FolderOpen,
  Moon,
  Pencil,
  Play,
  Sun,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  AGENCY_ROOT_METADATA_FILE,
  AGENCY_SOURCE_FOLDERS,
  ALL_AGENCY_SOURCE_FILES,
  type AgencySourceFolderId,
} from '../lib/agencySourceFiles';
import {
  getTokenColorClass,
  highlightSourceLines,
} from '../lib/agencySyntaxHighlight';
import { getAgencyPathForTab } from '../lib/agencyRoutes';
import { useI18n, type SupportedLocale } from '../lib/i18n';

interface WhatsAppAgencyEditorProps {
  open: boolean;
  onClose: () => void;
}

interface EditorCopy {
  brandTitle: string;
  editorAria: string;
  filesAria: string;
  filesTitle: string;
  openFilesDrawerAria: string;
  closeFilesDrawerAria: string;
  darkModeAria: string;
  lightModeAria: string;
  editModeAria: string;
  readModeAria: string;
  iframePreviewAria: string;
  backToCodeAria: string;
  closeEditorAria: string;
  iframeTitle: string;
}

const EDITOR_COPY: Record<SupportedLocale, EditorCopy> = {
  es: {
    brandTitle: 'Agencia de WhatsApp',
    editorAria: 'Editor de código fuente de Agencia de WhatsApp',
    filesAria: 'Archivos del proyecto',
    filesTitle: 'Archivos',
    openFilesDrawerAria: 'Abrir menú de archivos',
    closeFilesDrawerAria: 'Cerrar menú de archivos',
    darkModeAria: 'Activar modo oscuro del editor',
    lightModeAria: 'Activar modo claro del editor',
    editModeAria: 'Habilitar edición del código',
    readModeAria: 'Salir del modo edición',
    iframePreviewAria: 'Ver vista previa en vivo (iframe)',
    backToCodeAria: 'Volver al código fuente',
    closeEditorAria: 'Cerrar editor de código',
    iframeTitle: 'Vista previa en vivo de Agencia de WhatsApp',
  },
  en: {
    brandTitle: 'WhatsApp Agency',
    editorAria: 'WhatsApp Agency source code editor',
    filesAria: 'Project files',
    filesTitle: 'Files',
    openFilesDrawerAria: 'Open files menu',
    closeFilesDrawerAria: 'Close files menu',
    darkModeAria: 'Enable editor dark mode',
    lightModeAria: 'Enable editor light mode',
    editModeAria: 'Enable code editing',
    readModeAria: 'Exit edit mode',
    iframePreviewAria: 'Open live iframe preview',
    backToCodeAria: 'Return to source code',
    closeEditorAria: 'Close code editor',
    iframeTitle: 'WhatsApp Agency live preview',
  },
  pt: {
    brandTitle: 'Agência de WhatsApp',
    editorAria: 'Editor de código-fonte da Agência de WhatsApp',
    filesAria: 'Arquivos do projeto',
    filesTitle: 'Arquivos',
    openFilesDrawerAria: 'Abrir menu de arquivos',
    closeFilesDrawerAria: 'Fechar menu de arquivos',
    darkModeAria: 'Ativar modo escuro do editor',
    lightModeAria: 'Ativar modo claro do editor',
    editModeAria: 'Habilitar edição de código',
    readModeAria: 'Sair do modo de edição',
    iframePreviewAria: 'Ver prévia ao vivo (iframe)',
    backToCodeAria: 'Voltar ao código-fonte',
    closeEditorAria: 'Fechar editor de código',
    iframeTitle: 'Prévia ao vivo da Agência de WhatsApp',
  },
};

export function WhatsAppAgencyEditor({
  open,
  onClose,
}: WhatsAppAgencyEditorProps) {
  const { locale } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const [selectedFileId, setSelectedFileId] = useState<string>(
    AGENCY_ROOT_METADATA_FILE.id,
  );
  const [expandedFolders, setExpandedFolders] = useState<
    Record<Exclude<AgencySourceFolderId, 'root'>, boolean>
  >({
    core: true,
    inicio: true,
    clientes: true,
  });
  const [fileContents, setFileContents] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      ALL_AGENCY_SOURCE_FILES.map((file) => [file.id, file.content]),
    ),
  );
  const [isEditorDark, setIsEditorDark] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isIframeOpen, setIsIframeOpen] = useState(false);
  const [isMobileFilesOpen, setIsMobileFilesOpen] = useState(false);

  const selectedFile =
    ALL_AGENCY_SOURCE_FILES.find((f) => f.id === selectedFileId) ??
    AGENCY_ROOT_METADATA_FILE;
  const activeCode =
    fileContents[selectedFile.id] ?? selectedFile.content;

  const tokenizedLines = useMemo(
    () => highlightSourceLines(activeCode, selectedFile.language),
    [activeCode, selectedFile.language],
  );

  if (!open) return null;

  const copy = EDITOR_COPY[locale] ?? EDITOR_COPY.es;
  const iframeSrc = `${getAgencyPathForTab(selectedFile.previewTab)}?embed=1`;

  const toggleFolder = (folderId: Exclude<AgencySourceFolderId, 'root'>) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const selectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    setIsIframeOpen(false);
    setIsMobileFilesOpen(false);
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const nextValue = `${activeCode.slice(0, start)}  ${activeCode.slice(end)}`;
    setFileContents((prev) => ({ ...prev, [selectedFile.id]: nextValue }));
    window.requestAnimationFrame(() => {
      target.selectionStart = start + 2;
      target.selectionEnd = start + 2;
    });
  };

  const toolbarIconClass = (active: boolean) => {
    if (isEditorDark && !isIframeOpen) {
      return active
        ? 'text-white bg-white/10'
        : 'text-slate-400 hover:text-white hover:bg-white/10';
    }
    return active
      ? 'text-slate-950 bg-slate-100'
      : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100';
  };

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={copy.editorAria}
      className="fixed inset-0 z-50 w-full h-dvh bg-white text-slate-950 flex flex-col overflow-hidden"
    >
      {/* Desktop workspace: 10% organized file tree + 90% clean source editor / iframe */}
      <div className="hidden lg:flex w-full h-full bg-white">
        {/* 10% Left File Tree */}
        <aside
          aria-label={copy.filesAria}
          className="w-[10%] min-w-[190px] shrink-0 h-full border-r border-slate-200/90 bg-white flex flex-col overflow-hidden select-none"
        >
          <div className="px-3 pt-4 pb-3.5 border-b border-slate-200/80 shrink-0 flex items-center gap-2 min-w-0">
            <div
              aria-hidden="true"
              className="w-6 h-6 rounded-md bg-[#25D366]/12 flex items-center justify-center shrink-0"
            >
              <WhatsAppMiniIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11.5px] font-semibold leading-[1.25] text-slate-950 tracking-tight truncate">
              {copy.brandTitle}
            </span>
          </div>

          <nav
            aria-label={copy.filesAria}
            className="flex-1 min-h-0 overflow-y-auto px-2 pt-3 pb-6 flex flex-col gap-0.5"
          >
            {/* First entry always selected on launch: metadata.json */}
            <button
              type="button"
              onClick={() => selectFile(AGENCY_ROOT_METADATA_FILE.id)}
              className={`w-full py-1.5 pl-2.5 pr-2 flex items-center gap-2 text-left text-[12px] leading-snug border-l-2 cursor-pointer transition-colors focus-visible:outline-none ${
                selectedFile.id === AGENCY_ROOT_METADATA_FILE.id
                  ? 'border-slate-950 text-slate-950 font-semibold bg-slate-50/75'
                  : 'border-transparent text-slate-600 font-medium hover:text-slate-950 hover:bg-slate-50/60'
              }`}
            >
              <FileJson
                className="w-3.5 h-3.5 text-amber-500 shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">{AGENCY_ROOT_METADATA_FILE.name}</span>
            </button>

            {/* Module folders stacked one below the other */}
            {AGENCY_SOURCE_FOLDERS.map((folder) => {
              const isExpanded = expandedFolders[folder.id];
              return (
                <div key={folder.id} className="mt-1">
                  <button
                    type="button"
                    onClick={() => toggleFolder(folder.id)}
                    aria-expanded={isExpanded}
                    className="w-full py-1.5 px-2 flex items-center gap-1.5 text-left text-[12px] font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-50/70 rounded-md cursor-pointer transition-colors focus-visible:outline-none"
                  >
                    {isExpanded ? (
                      <ChevronDown
                        className="w-3 h-3 text-slate-400 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronRight
                        className="w-3 h-3 text-slate-400 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    {isExpanded ? (
                      <FolderOpen
                        className="w-3.5 h-3.5 text-sky-500 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <Folder
                        className="w-3.5 h-3.5 text-sky-500 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span className="truncate">{folder.name}</span>
                  </button>

                  {isExpanded && (
                    <div className="mt-0.5 flex flex-col gap-0.5 pl-3">
                      {folder.files.map((file) => {
                        const isSelected = selectedFile.id === file.id;
                        return (
                          <button
                            key={file.id}
                            type="button"
                            onClick={() => selectFile(file.id)}
                            title={file.path}
                            className={`w-full py-1.5 pl-2.5 pr-1.5 flex items-center gap-2 text-left text-[11.5px] leading-snug border-l-2 cursor-pointer transition-colors focus-visible:outline-none ${
                              isSelected
                                ? 'border-slate-950 text-slate-950 font-semibold bg-slate-50/75'
                                : 'border-transparent text-slate-500 font-normal hover:text-slate-900 hover:bg-slate-50/50'
                            }`}
                          >
                            <FileCode2
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-blue-600' : 'text-slate-400'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="truncate">{file.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* 90% Right Code Editor / Iframe Canvas */}
        <main
          className={`relative flex-1 min-w-0 h-full flex flex-col overflow-hidden transition-colors ${
            isIframeOpen
              ? 'bg-white'
              : isEditorDark
                ? 'bg-[#0D1117] text-slate-100'
                : 'bg-white text-slate-950'
          }`}
        >
          {/* Minimal header: path on left, strictly 3 tiny transparent toolbar buttons + X on right */}
          <header
            className={`shrink-0 h-11 px-4 border-b flex items-center justify-between gap-3 ${
              isEditorDark && !isIframeOpen
                ? 'border-slate-800/90 bg-[#0D1117]'
                : 'border-slate-200/80 bg-white'
            }`}
          >
            <span
              className={`text-[12px] font-mono truncate ${
                isEditorDark && !isIframeOpen
                  ? 'text-slate-400'
                  : 'text-slate-500'
              }`}
            >
              {selectedFile.path}
            </span>

            <div className="flex items-center gap-1 shrink-0">
              {/* 1. Luna: modo oscuro / claro del editor */}
              <button
                type="button"
                onClick={() => setIsEditorDark((prev) => !prev)}
                aria-pressed={isEditorDark}
                aria-label={
                  isEditorDark ? copy.lightModeAria : copy.darkModeAria
                }
                title={isEditorDark ? copy.lightModeAria : copy.darkModeAria}
                className={`w-7 h-7 rounded-lg bg-transparent flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${toolbarIconClass(
                  isEditorDark,
                )}`}
              >
                {isEditorDark ? (
                  <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>

              {/* 2. Edición: habilitar edición directa */}
              <button
                type="button"
                onClick={() => {
                  setIsIframeOpen(false);
                  setIsEditing((prev) => !prev);
                }}
                aria-pressed={isEditing}
                aria-label={isEditing ? copy.readModeAria : copy.editModeAria}
                title={isEditing ? copy.readModeAria : copy.editModeAria}
                className={`w-7 h-7 rounded-lg bg-transparent flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${toolbarIconClass(
                  isEditing,
                )}`}
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              {/* 3. Play / Iframe: ver ejecución en vivo en el 90% */}
              <button
                type="button"
                onClick={() => setIsIframeOpen((prev) => !prev)}
                aria-pressed={isIframeOpen}
                aria-label={
                  isIframeOpen ? copy.backToCodeAria : copy.iframePreviewAria
                }
                title={
                  isIframeOpen ? copy.backToCodeAria : copy.iframePreviewAria
                }
                className={`w-7 h-7 rounded-lg bg-transparent flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${toolbarIconClass(
                  isIframeOpen,
                )}`}
              >
                {isIframeOpen ? (
                  <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>

              {/* Cerrar editor */}
              <button
                type="button"
                onClick={onClose}
                aria-label={copy.closeEditorAria}
                title={copy.closeEditorAria}
                className={`w-7 h-7 ml-1 rounded-lg bg-transparent flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${toolbarIconClass(
                  false,
                )}`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* 90% Body: Live iframe OR Syntax-highlighted pure code editor */}
          {isIframeOpen ? (
            <div className="flex-1 min-h-0 w-full bg-white">
              <iframe
                key={iframeSrc}
                src={iframeSrc}
                title={copy.iframeTitle}
                className="w-full h-full border-0 bg-white block"
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto flex items-start">
              {/* Synchronized Line-Number Gutter */}
              <div
                aria-hidden="true"
                className={`sticky left-0 z-10 shrink-0 select-none py-4 pl-4 pr-4 text-right font-mono text-[12px] leading-[21px] tabular-nums border-r ${
                  isEditorDark
                    ? 'bg-[#0D1117] border-slate-800/90 text-slate-600'
                    : 'bg-white border-slate-200/80 text-slate-400'
                }`}
              >
                {tokenizedLines.map((_, lineIdx) => (
                  <div key={`ln-${selectedFile.id}-${lineIdx}`}>
                    {lineIdx + 1}
                  </div>
                ))}
              </div>

              {/* Syntax-highlighted Code Canvas + Optional Pixel-Aligned Edit Overlay */}
              <div className="relative flex-1 min-w-max min-h-full">
                <pre
                  aria-hidden={isEditing}
                  style={{ tabSize: 2 }}
                  className="m-0 py-4 px-5 font-mono text-[13px] leading-[21px] whitespace-pre select-text"
                >
                  {tokenizedLines.map((lineTokens, lineIdx) => (
                    <div key={`line-${selectedFile.id}-${lineIdx}`}>
                      {lineTokens.length === 0 ? (
                        ' '
                      ) : (
                        lineTokens.map((token, tokIdx) => (
                          <span
                            key={`tok-${lineIdx}-${tokIdx}`}
                            className={getTokenColorClass(
                              token.kind,
                              isEditorDark,
                            )}
                          >
                            {token.text}
                          </span>
                        ))
                      )}
                    </div>
                  ))}
                </pre>

                {isEditing && (
                  <textarea
                    value={activeCode}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setFileContents((prev) => ({
                        ...prev,
                        [selectedFile.id]: nextValue,
                      }));
                    }}
                    onKeyDown={handleTextareaKeyDown}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    style={{ tabSize: 2 }}
                    aria-label={selectedFile.path}
                    className={`absolute inset-0 w-full h-full m-0 py-4 px-5 font-mono text-[13px] leading-[21px] whitespace-pre bg-transparent text-transparent resize-none focus:outline-none overflow-hidden ${
                      isEditorDark
                        ? 'caret-white selection:bg-sky-400/25'
                        : 'caret-slate-950 selection:bg-blue-500/20'
                    }`}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile workspace: full-screen editor + top toggle opening left file-tree drawer with floating 3-icon dock */}
      <div
        className={`lg:hidden relative w-full h-full flex flex-col overflow-hidden transition-colors ${
          isIframeOpen
            ? 'bg-white text-slate-950'
            : isEditorDark
              ? 'bg-[#0D1117] text-slate-100'
              : 'bg-white text-slate-950'
        }`}
      >
        <header
          className={`shrink-0 h-14 px-4 border-b flex items-center justify-between gap-2 ${
            isEditorDark && !isIframeOpen
              ? 'border-slate-800/90 bg-[#0D1117]'
              : 'border-slate-200/85 bg-white'
          }`}
        >
          <button
            type="button"
            onClick={() => setIsMobileFilesOpen(true)}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer focus-visible:outline-none"
          >
            <div
              aria-hidden="true"
              className="w-7 h-7 rounded-lg bg-[#25D366]/12 flex items-center justify-center shrink-0"
            >
              <WhatsAppMiniIcon className="w-4 h-4" />
            </div>
            <span
              className={`text-[13px] font-mono font-medium tracking-tight truncate ${
                isEditorDark && !isIframeOpen
                  ? 'text-slate-100'
                  : 'text-slate-900'
              }`}
            >
              {selectedFile.name}
            </span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileFilesOpen((prev) => !prev)}
              aria-expanded={isMobileFilesOpen}
              aria-label={
                isMobileFilesOpen
                  ? copy.closeFilesDrawerAria
                  : copy.openFilesDrawerAria
              }
              title={
                isMobileFilesOpen
                  ? copy.closeFilesDrawerAria
                  : copy.openFilesDrawerAria
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                isEditorDark && !isIframeOpen
                  ? 'text-slate-300 active:bg-white/10'
                  : 'text-slate-500 active:bg-slate-100'
              }`}
            >
              <ChevronUp
                className={`w-5 h-5 transition-transform duration-200 ${
                  isMobileFilesOpen ? 'rotate-0' : 'rotate-180'
                }`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={copy.closeEditorAria}
              title={copy.closeEditorAria}
              className={`w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                isEditorDark && !isIframeOpen
                  ? 'text-slate-300 active:bg-white/10'
                  : 'text-slate-500 active:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Full-screen mobile editor canvas (syntax-highlighted / editable / live iframe) */}
        {isIframeOpen ? (
          <div className="flex-1 min-h-0 w-full bg-white">
            <iframe
              key={`mob-${iframeSrc}`}
              src={iframeSrc}
              title={copy.iframeTitle}
              className="w-full h-full border-0 bg-white block"
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto flex items-start">
            <div
              aria-hidden="true"
              className={`sticky left-0 z-10 shrink-0 select-none py-3.5 pl-3 pr-3 text-right font-mono text-[11px] leading-[19px] tabular-nums border-r ${
                isEditorDark
                  ? 'bg-[#0D1117] border-slate-800/90 text-slate-600'
                  : 'bg-white border-slate-200/80 text-slate-400'
              }`}
            >
              {tokenizedLines.map((_, lineIdx) => (
                <div key={`mob-ln-${selectedFile.id}-${lineIdx}`}>
                  {lineIdx + 1}
                </div>
              ))}
            </div>

            <div className="relative flex-1 min-w-max min-h-full">
              <pre
                aria-hidden={isEditing}
                style={{ tabSize: 2 }}
                className="m-0 py-3.5 px-3.5 font-mono text-[12px] leading-[19px] whitespace-pre select-text"
              >
                {tokenizedLines.map((lineTokens, lineIdx) => (
                  <div key={`mob-line-${selectedFile.id}-${lineIdx}`}>
                    {lineTokens.length === 0
                      ? ' '
                      : lineTokens.map((token, tokIdx) => (
                          <span
                            key={`mob-tok-${lineIdx}-${tokIdx}`}
                            className={getTokenColorClass(
                              token.kind,
                              isEditorDark,
                            )}
                          >
                            {token.text}
                          </span>
                        ))}
                  </div>
                ))}
              </pre>

              {isEditing && (
                <textarea
                  value={activeCode}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setFileContents((prev) => ({
                      ...prev,
                      [selectedFile.id]: nextValue,
                    }));
                  }}
                  onKeyDown={handleTextareaKeyDown}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  style={{ tabSize: 2 }}
                  aria-label={selectedFile.path}
                  className={`absolute inset-0 w-full h-full m-0 py-3.5 px-3.5 font-mono text-[12px] leading-[19px] whitespace-pre bg-transparent text-transparent resize-none focus:outline-none overflow-hidden ${
                    isEditorDark
                      ? 'caret-white selection:bg-sky-400/25'
                      : 'caret-slate-950 selection:bg-blue-500/20'
                  }`}
                />
              )}
            </div>
          </div>
        )}

        {/* Left-docked half-screen Archivos drawer + floating 3-icon bottom dock */}
        <AnimatePresence>
          {isMobileFilesOpen && (
            <motion.div
              key="mobile-editor-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsMobileFilesOpen(false)}
              className="fixed inset-0 z-40 lg:hidden bg-slate-950/25 backdrop-blur-[1px] flex justify-start"
            >
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label={copy.filesTitle}
                initial={shouldReduceMotion ? { opacity: 0 } : { x: '-100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { x: '-100%' }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-[62%] min-w-[218px] max-w-[270px] h-full bg-white text-slate-950 border-r border-slate-200/90 shadow-[18px_0_46px_-12px_rgba(15,23,42,0.22)] flex flex-col overflow-hidden select-none"
              >
                <header className="shrink-0 h-14 px-4 border-b border-slate-200/80 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-slate-950 tracking-tight">
                    {copy.filesTitle}
                  </span>
                </header>

                <nav
                  aria-label={copy.filesAria}
                  className="flex-1 min-h-0 overflow-y-auto px-2 pt-3 pb-4 flex flex-col gap-0.5"
                >
                  <button
                    type="button"
                    onClick={() => selectFile(AGENCY_ROOT_METADATA_FILE.id)}
                    className={`w-full py-2 pl-2.5 pr-2 flex items-center gap-2 text-left text-[12.5px] leading-snug border-l-2 cursor-pointer transition-colors ${
                      selectedFile.id === AGENCY_ROOT_METADATA_FILE.id
                        ? 'border-slate-950 text-slate-950 font-semibold bg-slate-50/75'
                        : 'border-transparent text-slate-600 font-medium active:bg-slate-50'
                    }`}
                  >
                    <FileJson
                      className="w-3.5 h-3.5 text-amber-500 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">
                      {AGENCY_ROOT_METADATA_FILE.name}
                    </span>
                  </button>

                  {AGENCY_SOURCE_FOLDERS.map((folder) => {
                    const isExpanded = expandedFolders[folder.id];
                    return (
                      <div key={`mob-folder-${folder.id}`} className="mt-1">
                        <button
                          type="button"
                          onClick={() => toggleFolder(folder.id)}
                          aria-expanded={isExpanded}
                          className="w-full py-2 px-2 flex items-center gap-1.5 text-left text-[12.5px] font-medium text-slate-700 active:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown
                              className="w-3 h-3 text-slate-400 shrink-0"
                              aria-hidden="true"
                            />
                          ) : (
                            <ChevronRight
                              className="w-3 h-3 text-slate-400 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          {isExpanded ? (
                            <FolderOpen
                              className="w-3.5 h-3.5 text-sky-500 shrink-0"
                              aria-hidden="true"
                            />
                          ) : (
                            <Folder
                              className="w-3.5 h-3.5 text-sky-500 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span className="truncate">{folder.name}</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-0.5 flex flex-col gap-0.5 pl-3">
                            {folder.files.map((file) => {
                              const isSelected = selectedFile.id === file.id;
                              return (
                                <button
                                  key={`mob-file-${file.id}`}
                                  type="button"
                                  onClick={() => selectFile(file.id)}
                                  className={`w-full py-1.5 pl-2.5 pr-1.5 flex items-center gap-2 text-left text-[12px] leading-snug border-l-2 cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'border-slate-950 text-slate-950 font-semibold bg-slate-50/75'
                                      : 'border-transparent text-slate-500 font-normal active:bg-slate-50'
                                  }`}
                                >
                                  <FileCode2
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isSelected
                                        ? 'text-blue-600'
                                        : 'text-slate-400'
                                    }`}
                                    aria-hidden="true"
                                  />
                                  <span className="truncate">{file.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>

                {/* Floating 3-icon bar at the bottom of the left Archivos menu */}
                <div className="shrink-0 px-3 pb-4 pt-2 bg-gradient-to-t from-white via-white to-white/0">
                  <div className="rounded-2xl border border-slate-200/95 bg-white/95 backdrop-blur-md shadow-[0_12px_32px_-8px_rgba(15,23,42,0.2)] px-2 py-1.5 flex items-center justify-around">
                    {/* 1. Luna: modo oscuro del editor */}
                    <button
                      type="button"
                      onClick={() => setIsEditorDark((prev) => !prev)}
                      aria-pressed={isEditorDark}
                      aria-label={
                        isEditorDark ? copy.lightModeAria : copy.darkModeAria
                      }
                      title={
                        isEditorDark ? copy.lightModeAria : copy.darkModeAria
                      }
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                        isEditorDark
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 active:bg-slate-100'
                      }`}
                    >
                      {isEditorDark ? (
                        <Sun className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Moon className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>

                    {/* 2. Edición */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsIframeOpen(false);
                        setIsEditing((prev) => {
                          const next = !prev;
                          if (next) setIsMobileFilesOpen(false);
                          return next;
                        });
                      }}
                      aria-pressed={isEditing}
                      aria-label={
                        isEditing ? copy.readModeAria : copy.editModeAria
                      }
                      title={
                        isEditing ? copy.readModeAria : copy.editModeAria
                      }
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                        isEditing
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 active:bg-slate-100'
                      }`}
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>

                    {/* 3. Play / Iframe */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsIframeOpen((prev) => !prev);
                        setIsMobileFilesOpen(false);
                      }}
                      aria-pressed={isIframeOpen}
                      aria-label={
                        isIframeOpen
                          ? copy.backToCodeAria
                          : copy.iframePreviewAria
                      }
                      title={
                        isIframeOpen
                          ? copy.backToCodeAria
                          : copy.iframePreviewAria
                      }
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                        isIframeOpen
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 active:bg-slate-100'
                      }`}
                    >
                      {isIframeOpen ? (
                        <Code2 className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Play className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function WhatsAppMiniIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3.25C7.17 3.25 3.25 7.17 3.25 12C3.25 13.71 3.74 15.3 4.59 16.65L3.55 20.45L7.46 19.43C8.76 20.19 10.33 20.65 12 20.65C16.83 20.65 20.75 16.83 20.75 12C20.75 7.17 16.83 3.25 12 3.25Z"
        fill="#25D366"
      />
      <path
        d="M9.68 8.95C9.49 8.53 9.29 8.52 9.11 8.51H8.62C8.45 8.51 8.18 8.58 7.95 8.83C7.72 9.08 7.07 9.69 7.07 10.92C7.07 12.15 7.97 13.34 8.09 13.5C8.22 13.67 9.83 16.28 12.39 17.29C14.51 18.12 14.95 17.96 15.41 17.92C15.87 17.87 16.89 17.31 17.1 16.73C17.31 16.14 17.31 15.64 17.24 15.53C17.18 15.43 17.01 15.36 16.76 15.24C16.51 15.11 15.29 14.51 15.06 14.43C14.83 14.35 14.66 14.3 14.49 14.55C14.33 14.8 13.85 15.36 13.7 15.53C13.56 15.7 13.41 15.72 13.16 15.59C12.91 15.47 12.11 15.2 11.16 14.36C10.42 13.7 9.93 12.89 9.78 12.64C9.64 12.39 9.76 12.25 9.89 12.13C10 12.02 10.14 11.84 10.26 11.69C10.39 11.55 10.43 11.44 10.51 11.28C10.59 11.11 10.55 10.96 10.49 10.84C10.43 10.71 9.93 9.48 9.68 8.95Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
