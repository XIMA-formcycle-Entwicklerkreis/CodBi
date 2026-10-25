// #region Imports
// #region XDBC
import { IF } from "xdbc/src/DBC/IF";
import { EQ } from "xdbc/src/DBC/EQ";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
import { ParameterTypes, SupportedFormelementtype } from "codbi-common";
// #endregion XIMA
// #endregion Imports

/** The id of the `<style>` element that carries the functionality's stylesheet. */
const STYLE_ID = "CodBi_Media_MultipleUpload_Styles";
/** Marker attribute that makes the initialisation idempotent (e.g. when a holistic config and a
 *  `data-cb-func` attribute both resolve to this functionality). */
const READY_ATTRIBUTE = "data-cb-multipleupload-ready";

/** The localized UI texts of the multiple-upload widget. */
interface IMultipleUploadTexts {
  /** Label of the button that opens the file dialogue when no Formcycle label exists. */
  chooseFiles: string;
  /** Hint shown inside the dropzone above the button. */
  dropHint: string;
  /** Hint describing the number of selected files. */
  selected: (count: number) => string;
  /** Label of the "maximize preview" action. */
  maximize: string;
  /** Label of the "show all selected files" action (from the single-file lightbox). */
  showAll: string;
  /** Tooltip/aria label of the previous-file navigation. */
  previous: string;
  /** Tooltip/aria label of the next-file navigation. */
  next: string;
  /** Label of the "close preview" action. */
  close: string;
  /** Label of a single remove action. */
  remove: string;
  /** Label of the "remove all files" action. */
  removeAll: string;
  /** Title of the maximized preview dialog. */
  dialogTitle: (count: number) => string;
}

/** The available translations of the UI texts, keyed by ISO-639-1 language code. */
const TEXTS: { [language: string]: IMultipleUploadTexts } = {
  en: {
    chooseFiles: "Choose files",
    dropHint: "Drag & drop your files here or",
    selected: (count: number) => (count === 1 ? "1 file selected" : `${count} files selected`),
    maximize: "Maximize",
    showAll: "Show all",
    previous: "Previous file",
    next: "Next file",
    close: "Close",
    remove: "Remove file",
    removeAll: "Remove all",
    dialogTitle: (count: number) => (count === 1 ? "1 selected file" : `${count} selected files`),
  },
  de: {
    chooseFiles: "Dateien auswählen",
    dropHint: "Dateien hierher ziehen und ablegen oder",
    selected: (count: number) => (count === 1 ? "1 Datei ausgewählt" : `${count} Dateien ausgewählt`),
    maximize: "Maximieren",
    showAll: "Alle anzeigen",
    previous: "Vorherige Datei",
    next: "Nächste Datei",
    close: "Schließen",
    remove: "Datei entfernen",
    removeAll: "Alle entfernen",
    dialogTitle: (count: number) => (count === 1 ? "1 ausgewählte Datei" : `${count} ausgewählte Dateien`),
  },
  it: {
    chooseFiles: "Scegli i file",
    dropHint: "Trascina qui i file oppure",
    selected: (count: number) => (count === 1 ? "1 file selezionato" : `${count} file selezionati`),
    maximize: "Ingrandisci",
    showAll: "Mostra tutti",
    previous: "File precedente",
    next: "File successivo",
    close: "Chiudi",
    remove: "Rimuovi file",
    removeAll: "Rimuovi tutto",
    dialogTitle: (count: number) => (count === 1 ? "1 file selezionato" : `${count} file selezionati`),
  },
};

/**
 * German DEFAULT captions an upload field commonly carries when it was generated in German — by the
 * AI assistant or by a default Formcycle configuration — i.e. captions that were NOT chosen as this
 * form's label on purpose: "Datei hochladen", "Dateien hochladen", "Datei auswählen", "Anhang",
 * "Anlage", "Datei", "Dateien".
 *
 * On a page in ANOTHER language such a default caption is replaced by this widget's localized
 * "choose files" text (see the label handling in {@link Media_MultipleUpload.functionality}), so the
 * drop area does not mix a localized hint with a German button. Anything that is not one of these
 * plain defaults — e.g. "Personalausweis Vorderseite" — is left untouched.
 */
const DEFAULT_GERMAN_UPLOAD_CAPTION =
  /^(datei(en)?(\s+(hochladen|auswählen|auswaehlen|anhängen|anhaengen))?|anhang|anlage|anlagen|hochladen)$/i;

/** The SVG icons used by the widget. All of them are static, trusted markup. */
const ICONS = {
  upload:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
  paperclip:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.4 11.05 12.25 20.2a5.5 5.5 0 0 1-7.78-7.78l8.49-8.49a3.5 3.5 0 1 1 4.95 4.95l-8.49 8.49a1.5 1.5 0 0 1-2.12-2.12l7.78-7.78"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  maximize:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H3v5"/><path d="M16 3h5v5"/><path d="M21 16v5h-5"/><path d="M3 16v5h5"/></svg>',
  chevronLeft:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
  chevronRight:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  image:
    '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5L5 20"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2.5a1.5 1.5 0 0 1 0 3H8v3"/></svg>',
  document:
    '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/></svg>',
  spreadsheet:
    '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
  archive:
    '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></svg>',
  file: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
};

/**
 * Detects the language to use for the widget's own texts. Formcycle's language marker wins, then the
 * browser language. Falls back to English.
 *
 * @returns An ISO-639-1 code that is guaranteed to exist in {@link TEXTS }. */
function detectLanguage(): string {
  const candidates: string[] = [];

  if (typeof document !== "undefined") {
    candidates.push(document.documentElement.getAttribute("lang") ?? "");
  }

  if (typeof navigator !== "undefined") {
    candidates.push(navigator.language ?? "");
  }

  for (const candidate of candidates) {
    const code = candidate.slice(0, 2).toLowerCase();

    if (Object.prototype.hasOwnProperty.call(TEXTS, code)) {
      return code;
    }
  }

  return "en";
}

/** Formats a byte count as a human readable size. */
function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

/** Resolves the most fitting icon for a selected file. */
function iconForFile(file: File): string {
  const extension = (file.name.split(".").pop() ?? "").toLowerCase();

  if (
    file.type.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "heic", "avif"].includes(extension)
  ) {
    return ICONS.image;
  }

  if (extension === "pdf") {
    return ICONS.pdf;
  }

  if (["doc", "docx", "odt", "rtf", "txt", "md"].includes(extension)) {
    return ICONS.document;
  }

  if (["xls", "xlsx", "csv", "ods"].includes(extension)) {
    return ICONS.spreadsheet;
  }

  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(extension)) {
    return ICONS.archive;
  }

  return ICONS.file;
}

/** Injects the widget's stylesheet once. */
function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");

  style.id = STYLE_ID;
  style.textContent = `
    .CodBi_MultiUpload {
      display: flex ;
      flex-direction: column ;
      gap: 10px ;
      width: 100% ;
      margin-top: 8px ;
      font-family: inherit ;
      color: #374151 ;
    }
    .CodBi_MultiUpload__input {
      position: absolute !important ;
      width: 1px !important ;
      height: 1px !important ;
      padding: 0 !important ;
      margin: -1px !important ;
      overflow: hidden !important ;
      clip: rect(0 0 0 0) !important ;
      white-space: nowrap !important ;
      border: 0 !important ;
    }
    .CodBi_MultiUpload__dropzone {
      position: relative ;
      display: flex ;
      flex-direction: column ;
      align-items: center ;
      justify-content: center ;
      gap: 8px ;
      padding: 20px 18px ;
      border: 2px dashed #c4cdd9 ;
      border-radius: 14px ;
      background: linear-gradient(180deg, #fbfdff 0%, #f1f5fa 100%) ;
      text-align: center ;
      cursor: pointer ;
      transition: border-color .18s ease, background .18s ease, box-shadow .18s ease, transform .18s ease ;
    }
    .CodBi_MultiUpload__dropzone:hover {
      border-color: #7c96b5 ;
      background: linear-gradient(180deg, #ffffff 0%, #eef4fb 100%) ;
      box-shadow: 0 4px 14px rgba(15, 23, 42, .08) ;
    }
    .CodBi_MultiUpload__dropzone:focus-within {
      border-color: #1f6feb ;
      box-shadow: 0 0 0 4px rgba(31, 111, 235, .16) ;
    }
    .CodBi_MultiUpload__dropzone--dragover {
      border-color: #1f6feb ;
      background: linear-gradient(180deg, #eef5ff 0%, #dbeafe 100%) ;
      box-shadow: 0 0 0 4px rgba(31, 111, 235, .18) ;
      transform: translateY(-1px) ;
    }
    .CodBi_MultiUpload__dropzone-icon {
      display: inline-flex ;
      align-items: center ;
      justify-content: center ;
      width: 38px ;
      height: 38px ;
      border-radius: 50% ;
      background: #e8f0fe ;
      color: #1f6feb ;
    }
    .CodBi_MultiUpload__dropzone--dragover .CodBi_MultiUpload__dropzone-icon {
      background: #dbeafe ;
      color: #1d4ed8 ;
    }
    .CodBi_MultiUpload__hint {
      font-size: 12.5px ;
      line-height: 1.35 ;
      color: #64748b ;
    }
    .CodBi_MultiUpload__label {
      display: inline-flex !important ;
      align-items: center !important ;
      justify-content: center ;
      gap: 8px ;
      padding: 9px 20px ;
      border: none ;
      border-radius: 999px ;
      background: linear-gradient(180deg, #2d7ff9 0%, #1f6feb 100%) ;
      box-shadow: 0 3px 8px rgba(31, 111, 235, .32) ;
      color: #ffffff !important ;
      font-size: 13px ;
      font-weight: 600 ;
      line-height: 1 ;
      text-decoration: none ;
      white-space: nowrap ;
      cursor: pointer ;
      transition: filter .18s ease, box-shadow .18s ease, transform .18s ease ;
    }
    .CodBi_MultiUpload__label:hover {
      filter: brightness(1.06) ;
      box-shadow: 0 5px 14px rgba(31, 111, 235, .38) ;
      transform: translateY(-1px) ;
    }
    .CodBi_MultiUpload__label:active {
      transform: translateY(0) ;
      box-shadow: 0 2px 6px rgba(31, 111, 235, .32) ;
    }
    .CodBi_MultiUpload__label:focus-visible {
      outline: 3px solid rgba(31, 111, 235, .45) ;
      outline-offset: 2px ;
    }
    .CodBi_MultiUpload__label-icon,
    .CodBi_MultiUpload__label-text,
    .CodBi_MultiUpload__label-count {
      display: inline-flex ;
      align-items: center ;
      align-self: center ;
      line-height: 1 ;
      vertical-align: middle ;
    }
    .CodBi_MultiUpload__label-icon {
      flex: 0 0 auto ;
      justify-content: center ;
    }
    .CodBi_MultiUpload__label-icon svg {
      display: block ;
    }
    .CodBi_MultiUpload__label-text {
      display: inline-flex ;
      align-items: center ;
      line-height: 1.2 ;
    }
    .CodBi_MultiUpload__label-count {
      flex: 0 0 auto ;
      justify-content: center ;
      min-width: 20px ;
      height: 20px ;
      padding: 0 8px 0 10px ;
      border-radius: 999px ;
      background: rgba(255, 255, 255, .26) ;
      color: #ffffff ;
      font-size: 11px ;
      font-weight: 700 ;
      box-sizing: border-box ;
    }
    .CodBi_MultiUpload__label-count[hidden] {
      display: none !important ;
    }
    .CodBi_MultiUpload__error {
      margin: 0 ;
      font-size: 12px ;
      font-weight: 600 ;
      color: #dc2626 ;
    }
    .CodBi_MultiUpload__preview {
      display: flex ;
      flex-direction: column ;
      gap: 6px ;
      width: 100% ;
      margin-top: 4px ;
      cursor: default ;
    }
    .CodBi_MultiUpload__preview[hidden] {
      display: none !important ;
    }
    .CodBi_MultiUpload__preview-head {
      display: flex ;
      align-items: center ;
      justify-content: space-between ;
      gap: 10px ;
    }
    .CodBi_MultiUpload__count {
      font-size: 12px ;
      font-weight: 700 ;
      letter-spacing: .2px ;
      color: #334155 ;
    }
    .CodBi_MultiUpload__actions {
      display: flex ;
      align-items: center ;
      gap: 6px ;
    }
    /* EVERY control button of the widget carries the CodBi accent border (darkorange) in ALL states —
       only the "choose files" call-to-action (.CodBi_MultiUpload__label) stays borderless. */
    .CodBi_MultiUpload__btn {
      display: inline-flex ;
      align-items: center ;
      gap: 5px ;
      padding: 4px 10px ;
      border: 1px solid darkorange ;
      border-radius: 8px ;
      background: #ffffff ;
      color: #475569 ;
      font-size: 11px ;
      font-weight: 600 ;
      line-height: 1.4 ;
      cursor: pointer ;
      transition: border-color .15s ease, color .15s ease, background .15s ease ;
    }
    .CodBi_MultiUpload__btn:hover {
      border-color: #c96a00 ;
      color: #1f2937 ;
      background: #f8fafc ;
    }
    /* The danger buttons keep their red TEXT (the destructive meaning) but the darkorange border. */
    .CodBi_MultiUpload__btn--danger:hover {
      border-color: #c96a00 ;
      color: #b91c1c ;
      background: #fef2f2 ;
    }
    .CodBi_MultiUpload__stack {
      position: relative ;
      display: flex ;
      align-items: flex-start ;
      min-height: 96px ;
      padding: 6px 4px 10px ;
      overflow-x: auto ;
      overflow-y: hidden ;
    }
    /* Darkorange scrollbar (transparent track) — matches the form-assistant change-log listing. */
    .CodBi_MultiUpload__stack,
    .CodBi_MultiUpload__dialog-body {
      scrollbar-color: #ff9f40 transparent ;
      scrollbar-width: thin ;
    }
    .CodBi_MultiUpload__stack::-webkit-scrollbar,
    .CodBi_MultiUpload__dialog-body::-webkit-scrollbar {
      width: 10px ;
      height: 10px ;
    }
    .CodBi_MultiUpload__stack::-webkit-scrollbar-track,
    .CodBi_MultiUpload__dialog-body::-webkit-scrollbar-track {
      background: transparent ;
    }
    .CodBi_MultiUpload__stack::-webkit-scrollbar-thumb,
    .CodBi_MultiUpload__dialog-body::-webkit-scrollbar-thumb {
      background: #ff9f40 ;
      border-radius: 5px ;
    }
    .CodBi_MultiUpload__stack::-webkit-scrollbar-thumb:hover,
    .CodBi_MultiUpload__dialog-body::-webkit-scrollbar-thumb:hover {
      background: #ffb266 ;
    }
    .CodBi_MultiUpload__stack::-webkit-scrollbar-corner,
    .CodBi_MultiUpload__dialog-body::-webkit-scrollbar-corner {
      background: transparent ;
    }
    .CodBi_MultiUpload__card {
      position: relative ;
      flex: 0 0 auto ;
      display: flex ;
      flex-direction: column ;
      width: 148px ;
      cursor: pointer ;
      margin-left: -46px ;
      border: 1px solid #e2e8f0 ;
      border-radius: 12px ;
      background: #ffffff ;
      box-shadow: 0 6px 16px rgba(15, 23, 42, .13) ;
      transform: rotate(var(--codbi-mu-rotate, 0deg)) ;
      transition: transform .18s ease, margin .18s ease, box-shadow .18s ease ;
    }
    .CodBi_MultiUpload__card:first-child {
      margin-left: 0 ;
    }
    .CodBi_MultiUpload__stack:hover .CodBi_MultiUpload__card {
      margin-left: -18px ;
    }
    .CodBi_MultiUpload__card:hover,
    .CodBi_MultiUpload__card:focus-within {
      z-index: 2 ;
      margin-left: 0 ;
      transform: translateY(-6px) rotate(0deg) ;
      box-shadow: 0 12px 24px rgba(15, 23, 42, .2) ;
    }
    .CodBi_MultiUpload__thumb {
      display: flex ;
      align-items: center ;
      justify-content: center ;
      height: 76px ;
      border-radius: 11px 11px 0 0 ;
      background: #eef2f7 ;
      color: #64748b ;
      overflow: hidden ;
    }
    .CodBi_MultiUpload__thumb img {
      width: 100% ;
      height: 100% ;
      object-fit: cover ;
      display: block ;
    }
    .CodBi_MultiUpload__card-meta {
      display: flex ;
      flex-direction: column ;
      gap: 1px ;
      padding: 7px 10px 9px ;
    }
    .CodBi_MultiUpload__card-name {
      overflow: hidden ;
      font-size: 11px ;
      font-weight: 600 ;
      color: #1f2937 ;
      text-overflow: ellipsis ;
      white-space: nowrap ;
    }
    .CodBi_MultiUpload__card-size {
      font-size: 10px ;
      color: #64748b ;
    }
    .CodBi_MultiUpload__card-remove {
      position: absolute ;
      top: -7px ;
      right: -7px ;
      display: inline-flex ;
      align-items: center ;
      justify-content: center ;
      width: 22px ;
      height: 22px ;
      padding: 0 ;
      border: 1px solid darkorange ;
      border-radius: 50% ;
      background: #ffffff ;
      box-shadow: 0 2px 6px rgba(15, 23, 42, .18) ;
      color: #64748b ;
      cursor: pointer ;
      transition: background .15s ease, border-color .15s ease, color .15s ease, transform .15s ease ;
    }
    .CodBi_MultiUpload__card-remove:hover {
      background: #dc2626 ;
      /* Keep the darkorange ring so the border never changes palette (only the fill turns red). */
      border-color: #c96a00 ;
      color: #ffffff ;
      transform: scale(1.08) ;
    }
    .CodBi_MultiUpload__overlay {
      position: fixed ;
      top: 0 ;
      right: 0 ;
      bottom: 0 ;
      left: 0 ;
      z-index: 2147483000 ;
      display: flex ;
      align-items: center ;
      justify-content: center ;
      padding: 24px ;
      background: rgba(15, 23, 42, .58) ;
      -webkit-backdrop-filter: blur(3px) ;
      backdrop-filter: blur(3px) ;
    }
    .CodBi_MultiUpload__dialog {
      display: flex ;
      flex-direction: column ;
      width: min(960px, 100%) ;
      max-height: 86vh ;
      border-radius: 16px ;
      background: #ffffff ;
      box-shadow: 0 24px 60px rgba(15, 23, 42, .4) ;
      overflow: hidden ;
    }
    .CodBi_MultiUpload__dialog-head {
      display: flex ;
      align-items: center ;
      justify-content: space-between ;
      gap: 12px ;
      padding: 14px 18px ;
      border-bottom: 1px solid #e5e7eb ;
    }
    .CodBi_MultiUpload__dialog-body {
      display: flex ;
      flex-direction: column ;
      flex: 1 1 auto ;
      min-height: 0 ;
      overflow: hidden ;
    }
    .CodBi_MultiUpload__dialog-title {
      margin: 0 ;
      font-size: 15px ;
      font-weight: 700 ;
      color: #111827 ;
    }
    .CodBi_MultiUpload__dialog-close {
      display: inline-flex ;
      align-items: center ;
      justify-content: center ;
      width: 30px ;
      height: 30px ;
      padding: 0 ;
      border: 1px solid darkorange ;
      border-radius: 8px ;
      background: #ffffff ;
      color: #475569 ;
      cursor: pointer ;
      transition: background .15s ease, border-color .15s ease, color .15s ease ;
    }
    .CodBi_MultiUpload__dialog-close:hover {
      background: #f1f5f9 ;
      border-color: #c96a00 ;
      color: #111827 ;
    }
    .CodBi_MultiUpload__grid {
      display: grid ;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) ;
      flex: 1 1 auto ;
      min-height: 0 ;
      gap: 16px ;
      padding: 20px ;
      overflow: auto ;
    }
    .CodBi_MultiUpload__grid .CodBi_MultiUpload__card {
      width: auto ;
      margin-left: 0 ;
    }
    .CodBi_MultiUpload__grid .CodBi_MultiUpload__thumb {
      height: 120px ;
    }
    .CodBi_MultiUpload__grid .CodBi_MultiUpload__card:hover {
      transform: translateY(-3px) ;
    }
    .CodBi_MultiUpload__single {
      display: flex ;
      flex-direction: column ;
      align-items: center ;
      flex: 1 1 auto ;
      min-height: 0 ;
      gap: 14px ;
      padding: 24px ;
      overflow: auto ;
    }
    .CodBi_MultiUpload__single-figure {
      display: flex ;
      align-items: center ;
      justify-content: center ;
      width: 100% ;
      min-height: 180px ;
      max-height: 56vh ;
      border-radius: 12px ;
      background: #f1f5f9 ;
      color: #64748b ;
      overflow: hidden ;
    }
    .CodBi_MultiUpload__single-figure img {
      display: block ;
      max-width: 100% ;
      max-height: 56vh ;
      object-fit: contain ;
    }
    .CodBi_MultiUpload__single-figure svg {
      width: 96px ;
      height: 96px ;
    }
    .CodBi_MultiUpload__single-meta {
      display: flex ;
      align-items: center ;
      justify-content: space-between ;
      flex-wrap: wrap ;
      gap: 12px ;
      width: 100% ;
    }
    .CodBi_MultiUpload__single-name {
      font-size: 14px ;
      font-weight: 700 ;
      color: #1f2937 ;
      overflow-wrap: anywhere ;
    }
    .CodBi_MultiUpload__single-size {
      font-size: 12px ;
      color: #64748b ;
    }
    .CodBi_MultiUpload__single-nav {
      display: flex ;
      align-items: center ;
      gap: 10px ;
    }
    .CodBi_MultiUpload__single-counter {
      min-width: 44px ;
      font-size: 12px ;
      font-weight: 600 ;
      color: #475569 ;
      text-align: center ;
    }
    @media (prefers-color-scheme: dark) {
      .CodBi_MultiUpload { color: #e2e8f0 ; }
      .CodBi_MultiUpload__dropzone {
        border-color: #3b4a5e ;
        background: linear-gradient(180deg, #1b2432 0%, #141c28 100%) ;
      }
      .CodBi_MultiUpload__dropzone:hover { background: linear-gradient(180deg, #1f2a3a 0%, #172233 100%) ; }
      .CodBi_MultiUpload__hint { color: #94a3b8 ; }
      .CodBi_MultiUpload__count { color: #cbd5e1 ; }
      /* The darkorange accent border stays in the dark theme as well. */
      .CodBi_MultiUpload__btn { border-color: darkorange ; background: #1b2634 ; color: #cbd5e1 ; }
      .CodBi_MultiUpload__btn:hover { border-color: #c96a00 ; background: #22303f ; color: #f1f5f9 ; }
      .CodBi_MultiUpload__card { border-color: #2b3a4d ; background: #1b2634 ; }
      .CodBi_MultiUpload__thumb { background: #22303f ; color: #94a3b8 ; }
      .CodBi_MultiUpload__card-name { color: #e2e8f0 ; }
      .CodBi_MultiUpload__card-size { color: #94a3b8 ; }
      .CodBi_MultiUpload__card-remove { border-color: darkorange ; background: #1b2634 ; color: #cbd5e1 ; }
      .CodBi_MultiUpload__single-figure { background: #22303f ; color: #94a3b8 ; }
      .CodBi_MultiUpload__single-name { color: #e2e8f0 ; }
      .CodBi_MultiUpload__single-size { color: #94a3b8 ; }
      .CodBi_MultiUpload__single-counter { color: #cbd5e1 ; }
      .CodBi_MultiUpload__dialog { background: #161f2c ; }
      .CodBi_MultiUpload__dialog-head { border-bottom-color: #2b3a4d ; }
      .CodBi_MultiUpload__dialog-title { color: #f1f5f9 ; }
      .CodBi_MultiUpload__dialog-close { border-color: darkorange ; background: #1b2634 ; color: #cbd5e1 ; }
      .CodBi_MultiUpload__dialog-close:hover { border-color: #c96a00 ; background: #22303f ; color: #ffffff ; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Provides the {@link Media_MultipleUpload.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Media_MultipleUpload {
  /**
   * Registers the "Media.MultipleUpload"-Functionality.
   *
   * This functionality enables a file upload dialogue to support selecting multiple files for upload.
   * It augments the tagged upload field with a drag & drop area, a professional upload button and an
   * overlapping-card preview of the selected files, which can be maximized and from which single
   * files may be removed again.
   *
   * Parameter:
   *  - Maximum:        The number of files that may be uploaded.
   *  - prefixTooMany:  The message that is displayed before the **Maximum** if too many files were selected.
   *  - postfixTooMany: The message that is displayed after the **Maximum** if too many files were selected. */
  @SupportedFormelementtype("XUpload")
  @ParameterTypes({
    Maximum: { type: "integer" },
    PrefixTooMany: { type: "string" },
    PostfixTooMany: { type: "string" },
  })
  public static functionality(
    @TYPE.PRE("string", "prefixtoomany :: postfixtoomany")
    @TYPE.PRE("string | number", "maximum")
    @IF.PRE(new TYPE("string"), new REGEX(/\d+/), "maximum")
    toLoad: { [key: string]: string },

    @INSTANCE.PRE(HTMLInputElement, "Is it not an <input> that is tagged with this functionality?")
    @EQ.PRE("file", false, 'Is it not an <input type = "file"> that is tagged with this functionality?', "type")
    toProcess: Element,
  ): void {
    /** @funcElement XUpload */
    const input = toProcess as HTMLInputElement;

    if (input.hasAttribute(READY_ATTRIBUTE)) {
      return;
    }

    input.setAttribute(READY_ATTRIBUTE, "1");
    ensureStyles();

    const language = detectLanguage();
    const texts = TEXTS[language];
    const maximum = toLoad.maximum ? Number.parseInt(toLoad.maximum) : 2;

    // Formcycle's combined filename length check causes false positives when multiple files are
    // selected. The individual check below replaces it.
    const maxLength = input.getAttribute("maxlength");

    if (maxLength) {
      input.removeAttribute("maxlength");
    }

    // #region Resolve the upload control (label / button).
    /**
     * Finds the label that actually opens this file input. Only a label that wraps the input or is
     * bound to it via `for` is considered — never the surrounding question label of the form field.
     */
    const resolveUploadLabel = (): HTMLLabelElement | null => {
      const wrapping = input.closest("label");

      if (wrapping) {
        return wrapping as HTMLLabelElement;
      }

      if (input.id) {
        const escapedId =
          typeof CSS !== "undefined" && typeof CSS.escape === "function" ? CSS.escape(input.id) : input.id;
        const explicit = input.parentElement?.querySelector<HTMLLabelElement>(`label[for="${escapedId}"]`) ?? null;

        if (explicit) {
          return explicit;
        }
      }

      return null;
    };

    const label = resolveUploadLabel();
    const labelOpensInput = label != null && (label.contains(input) || (!!input.id && label.htmlFor === input.id));
    let labelCountEl: HTMLElement | null = null;

    if (label) {
      label.classList.add("CodBi_MultiUpload__label");

      if (!label.querySelector(".CodBi_MultiUpload__label-icon")) {
        const iconEl = document.createElement("span");

        iconEl.className = "CodBi_MultiUpload__label-icon";
        iconEl.innerHTML = ICONS.paperclip;
        label.insertBefore(iconEl, label.firstChild);
      }

      if (!label.querySelector(".CodBi_MultiUpload__label-text")) {
        // Move every text node into a dedicated span so the icon and the text stay separate and the
        // button keeps its original (possibly admin-localized) caption.
        const textEl = document.createElement("span");
        const textParts: string[] = [];

        textEl.className = "CodBi_MultiUpload__label-text";

        for (const node of Array.from(label.childNodes)) {
          if (node.nodeType === Node.TEXT_NODE) {
            textParts.push(node.textContent ?? "");
            label.removeChild(node);
          }
        }

        // The caption of the upload control comes from the FIELD's label (admin/AI generated), not
        // from this widget — an AI-generated upload field routinely carries a GERMAN default caption
        // ("Datei hochladen", "Anhang", …) while the page is displayed in another language, so the
        // drop area showed LOCALIZED texts next to a GERMAN button. On a non-German page such a
        // default caption is replaced by this widget's localized "choose files" text, so no language
        // is mixed; any OTHER caption (a real, deliberately chosen label) is kept verbatim.
        const caption = textParts.join(" ").replace(/\s+/g, " ").trim();
        textEl.textContent =
          caption !== "" && !(language !== "de" && DEFAULT_GERMAN_UPLOAD_CAPTION.test(caption))
            ? caption
            : texts.chooseFiles;
        label.appendChild(textEl);
      }

      labelCountEl = document.createElement("span");
      labelCountEl.className = "CodBi_MultiUpload__label-count";
      labelCountEl.hidden = true;
      label.appendChild(labelCountEl);
    }
    // #endregion Resolve the upload control (label / button).

    // #region Build the widget.
    const wrapper = document.createElement("div");

    wrapper.className = "CodBi_MultiUpload";

    const dropzone = document.createElement("div");

    dropzone.className = "CodBi_MultiUpload__dropzone";

    const dropIcon = document.createElement("div");

    dropIcon.className = "CodBi_MultiUpload__dropzone-icon";
    dropIcon.innerHTML = ICONS.upload;
    dropzone.appendChild(dropIcon);

    const hint = document.createElement("div");

    hint.className = "CodBi_MultiUpload__hint";
    hint.textContent = texts.dropHint;
    dropzone.appendChild(hint);

    if (!label) {
      // No usable label exists — provide our own professional button.
      const button = document.createElement("button");
      const buttonIcon = document.createElement("span");
      const buttonText = document.createElement("span");
      const buttonCount = document.createElement("span");

      button.type = "button";
      button.className = "CodBi_MultiUpload__label";
      buttonIcon.className = "CodBi_MultiUpload__label-icon";
      buttonIcon.innerHTML = ICONS.paperclip;
      buttonText.className = "CodBi_MultiUpload__label-text";
      buttonText.textContent = texts.chooseFiles;
      buttonCount.className = "CodBi_MultiUpload__label-count";
      buttonCount.hidden = true;
      button.append(buttonIcon, buttonText, buttonCount);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        input.click();
      });
      dropzone.appendChild(button);
      labelCountEl = buttonCount;
    }

    const errorEl = document.createElement("p");

    errorEl.className = "CodBi_MultiUpload__error";
    errorEl.setAttribute("role", "alert");
    errorEl.hidden = true;

    const preview = document.createElement("div");

    preview.className = "CodBi_MultiUpload__preview";
    preview.hidden = true;

    const previewHead = document.createElement("div");

    previewHead.className = "CodBi_MultiUpload__preview-head";

    const countEl = document.createElement("span");

    countEl.className = "CodBi_MultiUpload__count";
    countEl.setAttribute("aria-live", "polite");
    previewHead.appendChild(countEl);

    const actions = document.createElement("div");

    actions.className = "CodBi_MultiUpload__actions";

    const maximizeButton = document.createElement("button");

    const maximizeIcon = document.createElement("span");

    maximizeIcon.innerHTML = ICONS.maximize;
    maximizeButton.type = "button";
    maximizeButton.className = "CodBi_MultiUpload__btn CodBi_MultiUpload__btn--maximize";
    maximizeButton.appendChild(maximizeIcon);
    maximizeButton.appendChild(document.createTextNode(texts.maximize));
    actions.appendChild(maximizeButton);

    const removeAllButton = document.createElement("button");

    removeAllButton.type = "button";
    removeAllButton.className = "CodBi_MultiUpload__btn CodBi_MultiUpload__btn--danger";
    removeAllButton.textContent = texts.removeAll;
    actions.appendChild(removeAllButton);
    previewHead.appendChild(actions);
    preview.appendChild(previewHead);

    const stack = document.createElement("div");

    stack.className = "CodBi_MultiUpload__stack";
    preview.appendChild(stack);
    // #endregion Build the widget.

    // #region Mount the widget (keeping the original control inside the dropzone).
    const control: HTMLElement = label ?? input;
    const container = control.parentElement;

    /** Finds the CodBi loading spinner that global-scope injected next to the original field. */
    const findOwnLoader = (root: Element | null): HTMLElement | null => {
      if (!root) {
        return null;
      }

      const fieldName = input.getAttribute("data-name");

      return (
        (Array.from(root.children).find(
          (child) =>
            child.classList.contains("cCodBiLoader") &&
            (fieldName == null || child.getAttribute("cbFOR") === fieldName),
        ) as HTMLElement | undefined) ?? null
      );
    };

    // Capture the spinner BEFORE re-parenting: global-scope's removeLoaderAnim() searches the
    // input's parentElement afterwards, which is our new dropzone — the spinner would stay in the
    // old parent and spin forever.
    const loaderToCleanup = findOwnLoader(input.parentElement) ?? findOwnLoader(container);

    if (!container) {
      loaderToCleanup?.remove();
      return;
    }

    container.insertBefore(wrapper, control);
    dropzone.appendChild(control);
    wrapper.appendChild(dropzone);
    wrapper.appendChild(errorEl);
    // The preview is part of the SAME panel as the upload control (one single drop area).
    dropzone.appendChild(preview);

    if (!dropzone.contains(input)) {
      dropzone.appendChild(input);
    }

    loaderToCleanup?.remove();
    input.classList.remove("Processing");
    input.classList.add("CodBi_MultiUpload__input");
    input.setAttribute("multiple", "");
    // The visible button/label drives the dialogue — keep the now hidden input out of the tab order.
    input.tabIndex = -1;

    if (label) {
      label.tabIndex = 0;

      if (!labelOpensInput) {
        label.setAttribute("role", "button");
      }

      label.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          input.click();
        }
      });
    }
    // #endregion Mount the widget (keeping the original control inside the dropzone).

    // #region State / helpers.
    const fileObjectUrls = new Map<File, string>();

    const selectedFiles = (): File[] => Array.from(input.files ?? []);

    const canUseObjectUrls =
      typeof URL !== "undefined" &&
      typeof URL.createObjectURL === "function" &&
      typeof URL.revokeObjectURL === "function";

    const releaseObjectUrls = (): void => {
      if (canUseObjectUrls) {
        for (const url of fileObjectUrls.values()) {
          URL.revokeObjectURL(url);
        }
      }

      fileObjectUrls.clear();
    };

    const createObjectUrls = (files: File[]): void => {
      if (!canUseObjectUrls) {
        return;
      }

      for (const file of files) {
        if (file.type.startsWith("image/")) {
          fileObjectUrls.set(file, URL.createObjectURL(file));
        }
      }
    };

    /**
     * Assigns the given files to the input (so Formcycle's own upload pipeline sees them) and
     * notifies its listeners. Returns `false` when the browser does not support `DataTransfer`.
     */
    const assignFiles = (files: File[]): boolean => {
      if (typeof DataTransfer === "undefined") {
        return false;
      }

      const transfer = new DataTransfer();

      for (const file of files) {
        transfer.items.add(file);
      }

      try {
        input.files = transfer.files;
      } catch {
        // Some environments do not allow replacing the FileList programmatically.
        return false;
      }

      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    };

    const tooManyMessage = (): string =>
      toLoad.prefixtoomany && toLoad.postfixtoomany
        ? `${toLoad.prefixtoomany}${maximum}${toLoad.postfixtoomany}`
        : `Too many files selected. The maximum number of files is ${maximum}.`;

    /** Validates the given selection and returns the error message (or an empty string). */
    const validate = (files: File[]): string => {
      if (files.length > maximum) {
        return tooManyMessage();
      }

      if (maxLength) {
        const limit = Number.parseInt(maxLength);
        const tooLong = files.find((file) => file.name.length > limit);

        if (tooLong) {
          return `Filename "${tooLong.name}" exceeds the maximum length of ${limit} characters.`;
        }
      }

      return "";
    };

    /** Shows the given message both in the inline hint and (for compatibility) via Formcycle. */
    const showError = (message: string): void => {
      errorEl.textContent = message;
      errorEl.hidden = message === "";

      try {
        getJQuery()(input).error(message);
      } catch {
        // Formcycle's jQuery plugin is not available — the inline hint above is sufficient.
      }
    };

    /**
     * What the maximized preview currently shows (`null` while it is closed) and the index of the
     * file displayed in its single-file view. Tracked so a removal inside the modal can refresh the
     * modal instead of closing it.
     */
    let modalMode: "grid" | "single" | null = null;
    let modalIndex = 0;
    /** Set while a modal-initiated removal updates the input, so {@link render } keeps the modal. */
    let keepModalOnRender = false;

    const removeFile = (index: number): void => {
      const remaining = selectedFiles();

      remaining.splice(index, 1);

      const wasOpen = modalMode !== null;
      const previousMode = modalMode;
      const previousIndex = modalIndex;

      // `assignFiles` dispatches `change`, whose handler calls `render`. Keep an open modal alive
      // while that happens; it is rebuilt with the remaining files right afterwards.
      keepModalOnRender = wasOpen;
      let assigned = false;

      try {
        assigned = assignFiles(remaining);
      } finally {
        keepModalOnRender = false;
      }

      if (!assigned) {
        // Without `DataTransfer` a single file cannot be removed; at least clear everything.
        input.value = "";

        if (remaining.length > 0) {
          showError("Removing single files is not supported by this browser.");
        }

        render();
        return;
      }

      if (wasOpen) {
        if (remaining.length === 0) {
          closeModal();
        } else {
          // Stay in the SAME view and keep browsing/removing the remaining files.
          openModal(previousMode ?? "grid", Math.min(previousIndex, remaining.length - 1));
        }
      }
    };

    const buildCard = (file: File, index: number, variant: "stack" | "grid"): HTMLDivElement => {
      const card = document.createElement("div");

      card.className = "CodBi_MultiUpload__card";
      card.dataset.cbFileIndex = String(index);
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${file.name} — ${texts.maximize}`);

      if (variant === "stack") {
        const rotation = (index % 2 === 0 ? 1 : -1) * (1 + Math.min(index, 6) * 0.35);

        card.style.setProperty("--codbi-mu-rotate", `${rotation}deg`);
      }

      const thumb = document.createElement("div");

      thumb.className = "CodBi_MultiUpload__thumb";

      const objectUrl = fileObjectUrls.get(file);

      if (objectUrl) {
        const image = document.createElement("img");

        image.src = objectUrl;
        image.alt = file.name;
        image.loading = "lazy";
        thumb.appendChild(image);
      } else {
        thumb.innerHTML = iconForFile(file);
      }

      card.appendChild(thumb);

      const meta = document.createElement("div");

      meta.className = "CodBi_MultiUpload__card-meta";

      const name = document.createElement("span");

      name.className = "CodBi_MultiUpload__card-name";
      name.textContent = file.name;
      name.title = file.name;
      meta.appendChild(name);

      const size = document.createElement("span");

      size.className = "CodBi_MultiUpload__card-size";
      size.textContent = formatBytes(file.size);
      meta.appendChild(size);
      card.appendChild(meta);

      const removeButton = document.createElement("button");

      removeButton.type = "button";
      removeButton.className = "CodBi_MultiUpload__card-remove";
      removeButton.innerHTML = ICONS.close;
      removeButton.title = texts.remove;
      removeButton.setAttribute("aria-label", `${texts.remove}: ${file.name}`);
      removeButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        removeFile(index);
      });
      card.appendChild(removeButton);

      const openPreview = (): void => openModal("single", index);

      card.addEventListener("click", (event) => {
        if ((event.target as HTMLElement).closest(".CodBi_MultiUpload__card-remove")) {
          return;
        }

        openPreview();
      });
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPreview();
        }
      });

      return card;
    };

    const render = (): void => {
      if (!keepModalOnRender) {
        closeModal();
      }
      releaseObjectUrls();

      const files = selectedFiles();

      createObjectUrls(files);

      stack.replaceChildren();

      files.forEach((file, index) => stack.appendChild(buildCard(file, index, "stack")));

      preview.hidden = files.length === 0;
      countEl.textContent = texts.selected(files.length);

      if (labelCountEl) {
        // The button keeps its original caption; a badge next to it shows the current file count.
        labelCountEl.textContent = files.length > 0 ? String(files.length) : "";
        labelCountEl.hidden = files.length === 0;
      }
    };
    // #endregion State / helpers.

    // #region Maximized preview.
    let overlay: HTMLDivElement | null = null;
    /** Arrow-key navigation while the single-file lightbox is shown. */
    let modalNavigate: ((direction: -1 | 1) => void) | null = null;

    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        closeModal();
      } else if (event.key === "ArrowLeft") {
        modalNavigate?.(-1);
      } else if (event.key === "ArrowRight") {
        modalNavigate?.(1);
      }
    };

    function closeModal(): void {
      modalMode = null;
      modalIndex = 0;

      if (!overlay) {
        return;
      }

      overlay.remove();
      overlay = null;
      modalNavigate = null;
      document.removeEventListener("keydown", onKeydown);
      document.body.style.removeProperty("overflow");
    }

    function openModal(mode: "grid" | "single", startIndex = 0): void {
      closeModal();

      const files = selectedFiles();

      if (files.length === 0) {
        return;
      }

      let index = Math.min(Math.max(startIndex, 0), files.length - 1);

      modalMode = mode;
      modalIndex = index;

      const dialogOverlay = document.createElement("div");

      dialogOverlay.className = "CodBi_MultiUpload__overlay";
      dialogOverlay.setAttribute("role", "dialog");
      dialogOverlay.setAttribute("aria-modal", "true");

      const dialog = document.createElement("div");

      dialog.className = "CodBi_MultiUpload__dialog";

      const head = document.createElement("div");

      head.className = "CodBi_MultiUpload__dialog-head";

      const title = document.createElement("h3");

      title.className = "CodBi_MultiUpload__dialog-title";
      title.textContent = texts.dialogTitle(files.length);
      head.appendChild(title);

      const closeButton = document.createElement("button");

      closeButton.type = "button";
      closeButton.className = "CodBi_MultiUpload__dialog-close";
      closeButton.innerHTML = ICONS.close;
      closeButton.title = texts.close;
      closeButton.setAttribute("aria-label", texts.close);
      closeButton.addEventListener("click", () => closeModal());
      head.appendChild(closeButton);
      dialog.appendChild(head);

      const body = document.createElement("div");

      body.className = "CodBi_MultiUpload__dialog-body";
      dialog.appendChild(body);

      /** Shows the overview grid of ALL selected files. */
      const renderGrid = (): void => {
        modalNavigate = null;
        modalMode = "grid";
        title.textContent = texts.dialogTitle(files.length);
        body.replaceChildren();

        const grid = document.createElement("div");

        grid.className = "CodBi_MultiUpload__grid";
        files.forEach((file, fileIndex) => grid.appendChild(buildCard(file, fileIndex, "grid")));
        body.appendChild(grid);
      };

      /** Shows exactly ONE file maximized (plus previous/next navigation). */
      const renderSingle = (): void => {
        const file = files[index];

        modalMode = "single";
        modalIndex = index;
        modalNavigate =
          files.length > 1
            ? (direction: -1 | 1): void => {
                index = (index + direction + files.length) % files.length;
                renderSingle();
              }
            : null;
        title.textContent = file.name;
        body.replaceChildren();

        const single = document.createElement("div");

        single.className = "CodBi_MultiUpload__single";

        const figure = document.createElement("div");

        figure.className = "CodBi_MultiUpload__single-figure";

        const objectUrl = fileObjectUrls.get(file);

        if (objectUrl) {
          const image = document.createElement("img");

          image.src = objectUrl;
          image.alt = file.name;
          figure.appendChild(image);
        } else {
          figure.innerHTML = iconForFile(file);
        }

        single.appendChild(figure);

        const meta = document.createElement("div");

        meta.className = "CodBi_MultiUpload__single-meta";

        const metaText = document.createElement("div");

        const singleName = document.createElement("div");

        singleName.className = "CodBi_MultiUpload__single-name";
        singleName.textContent = file.name;

        const singleSize = document.createElement("div");

        singleSize.className = "CodBi_MultiUpload__single-size";
        singleSize.textContent = formatBytes(file.size);
        metaText.append(singleName, singleSize);
        meta.appendChild(metaText);

        const metaActions = document.createElement("div");

        metaActions.className = "CodBi_MultiUpload__actions";

        const removeSingle = document.createElement("button");

        removeSingle.type = "button";
        removeSingle.className = "CodBi_MultiUpload__btn CodBi_MultiUpload__btn--danger";
        removeSingle.textContent = texts.remove;
        removeSingle.addEventListener("click", () => removeFile(index));
        metaActions.appendChild(removeSingle);

        if (files.length > 1) {
          const showAll = document.createElement("button");

          showAll.type = "button";
          showAll.className = "CodBi_MultiUpload__btn";
          showAll.textContent = texts.showAll;
          showAll.addEventListener("click", () => renderGrid());
          metaActions.appendChild(showAll);
        }

        meta.appendChild(metaActions);
        single.appendChild(meta);

        if (files.length > 1) {
          const nav = document.createElement("div");

          nav.className = "CodBi_MultiUpload__single-nav";

          const previousButton = document.createElement("button");

          previousButton.type = "button";
          previousButton.className = "CodBi_MultiUpload__btn";
          previousButton.innerHTML = ICONS.chevronLeft;
          previousButton.title = texts.previous;
          previousButton.setAttribute("aria-label", texts.previous);
          previousButton.addEventListener("click", () => {
            index = (index - 1 + files.length) % files.length;
            renderSingle();
          });

          const counter = document.createElement("span");

          counter.className = "CodBi_MultiUpload__single-counter";
          counter.textContent = `${index + 1} / ${files.length}`;

          const nextButton = document.createElement("button");

          nextButton.type = "button";
          nextButton.className = "CodBi_MultiUpload__btn";
          nextButton.innerHTML = ICONS.chevronRight;
          nextButton.title = texts.next;
          nextButton.setAttribute("aria-label", texts.next);
          nextButton.addEventListener("click", () => {
            index = (index + 1) % files.length;
            renderSingle();
          });

          nav.append(previousButton, counter, nextButton);
          single.appendChild(nav);
        }

        body.appendChild(single);
      };

      dialogOverlay.appendChild(dialog);
      dialogOverlay.addEventListener("mousedown", (event) => {
        if (event.target === dialogOverlay) {
          closeModal();
        }
      });
      document.body.appendChild(dialogOverlay);
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKeydown);
      overlay = dialogOverlay;
      closeButton.focus();

      if (mode === "grid") {
        renderGrid();
      } else {
        renderSingle();
      }
    }

    maximizeButton.addEventListener("click", () => openModal("grid"));
    removeAllButton.addEventListener("click", () => {
      if (assignFiles([])) {
        showError("");
      } else {
        input.value = "";
        render();
      }
    });
    // #endregion Maximized preview.

    // #region Drag & drop + input events.
    let dragDepth = 0;

    const isDragEvent = (event: Event): event is DragEvent => "dataTransfer" in event;

    const onDragEnter = (event: Event): void => {
      if (!isDragEvent(event)) {
        return;
      }

      event.preventDefault();
      dragDepth++;
      dropzone.classList.add("CodBi_MultiUpload__dropzone--dragover");
    };

    const onDragOver = (event: Event): void => {
      if (!isDragEvent(event)) {
        return;
      }

      event.preventDefault();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    };

    const onDragLeave = (): void => {
      dragDepth = Math.max(0, dragDepth - 1);

      if (dragDepth === 0) {
        dropzone.classList.remove("CodBi_MultiUpload__dropzone--dragover");
      }
    };

    const onDrop = (event: Event): void => {
      if (!isDragEvent(event)) {
        return;
      }

      event.preventDefault();
      dragDepth = 0;
      dropzone.classList.remove("CodBi_MultiUpload__dropzone--dragover");

      const dropped = Array.from(event.dataTransfer?.files ?? []);

      if (dropped.length === 0) {
        return;
      }

      // Dropping ADDS to the current selection (instead of silently discarding it).
      const combined = [...selectedFiles(), ...dropped];
      const message = validate(combined);

      if (message) {
        showError(message);
        return;
      }

      showError("");

      if (!assignFiles(combined)) {
        showError("Drag & drop is not supported by this browser. Please use the file dialogue.");
      }
    };

    dropzone.addEventListener("dragenter", onDragEnter);
    dropzone.addEventListener("dragover", onDragOver);
    dropzone.addEventListener("dragleave", onDragLeave);
    dropzone.addEventListener("drop", onDrop);

    dropzone.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;

      // The native label and our fallback button open the dialogue themselves; the preview (which
      // is part of the same panel) has its own card/button interactions.
      if (
        target === input ||
        target?.closest("label") ||
        target?.closest("button") ||
        target?.closest(".CodBi_MultiUpload__preview")
      ) {
        return;
      }

      input.click();
    });

    if (!labelOpensInput && label) {
      // A label exists but neither wraps the input nor is bound via `for` — make it open the
      // dialogue explicitly.
      label.addEventListener("click", (event) => {
        event.preventDefault();
        input.click();
      });
    }

    input.addEventListener("change", () => {
      const files = selectedFiles();
      const message = validate(files);

      showError(message);
      render();
    });

    render();
    // #endregion Drag & drop + input events.
  }
}

window.codbi.registerFunctionality(
  "Media.MultipleUpload",
  Media_MultipleUpload.functionality.bind(Media_MultipleUpload),
); // Initialization
