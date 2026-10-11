/**
 * The **EP builder** — a modal popup that lets a user compose and nest Element Placeholders
 * (`{ Id > p1; p2; … }`) in a guided tree editor instead of hand-typing the raw expression.
 *
 * It is opened by **ALT+E** on a codbi-marker parameter-value input (see
 * [`CodbiElementMarkers.ts`](./CodbiElementMarkers.ts)) and can also be used from the config
 * attribute table. The editor works with *no* signature knowledge at all (everything is untyped) and
 * enriches itself from whatever signatures are available (see {@link resolveEPSignatureForId}).
 */
import { instance as getDesignerInstance } from "@de-xima/fc-form-designer";
import { codbiDocsUrl } from "./CodbiDocs.js";
import { getDesignerLanguage, i18n } from "./i18n.js";
import {
  collectEPIds,
  createEPNode,
  type EPNode,
  parseEPValue,
  serializeEPNode,
  serializeEPValue,
  type ValueSegment,
} from "./EPExpression.js";

/** A window that may expose the CodBi runtime in the canvas iframe. */
interface CodbiRuntimeWindow extends Window {
  codbi?: {
    resolveEPSignature?: (id: string) => CodbiEPSignature | undefined;
    describeEP?: (id: string, signature: { params: Array<CodbiEPParamSpec>; returnType?: string }) => void;
    resolveEP?: (config: { [key: string]: unknown }) => Promise<{ [key: string]: unknown }>;
  };
}

/**
 * Locates the CodBi **form runtime** (`window.codbi`) across the designer and canvas windows. The
 * builder runs in the designer, while the EPs are registered by the form runtime in the canvas
 * iframe — which may be the anchor's own window, its parent/top, or the designer's own window.
 *
 * @param anchor An element inside the target document.
 *
 * @returns The runtime `codbi` object exposing `resolveEP`, or **undefined**. */
function findRuntimeCodbi(anchor: HTMLElement): CodbiRuntimeWindow["codbi"] | undefined {
  const canvasWindow = anchor.ownerDocument?.defaultView as CodbiRuntimeWindow | null;
  const candidates: Array<CodbiRuntimeWindow | null | undefined> = [canvasWindow];

  try {
    candidates.push(canvasWindow?.parent as CodbiRuntimeWindow | undefined);
  } catch {
    /* cross-origin */
  }

  try {
    candidates.push(canvasWindow?.top as CodbiRuntimeWindow | undefined);
  } catch {
    /* cross-origin */
  }

  candidates.push(window as unknown as CodbiRuntimeWindow);

  for (const candidate of candidates) {
    try {
      if (candidate?.codbi?.resolveEP) {
        return candidate.codbi;
      }
    } catch {
      /* cross-origin */
    }
  }

  return canvasWindow?.codbi;
}

/** Escapes **value** for use inside a `[attr="…"]` selector (falls back to quote/backslash escaping). */
function escapeAttributeValue(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/["\\]/g, "\\$&");
}

/**
 * Collects the hidden inputs that may carry a form global variable inside **root**. Only declared
 * (`XVariable`) and otherwise hidden inputs are considered so regular form fields are never mirrored.
 */
function collectVariableInputs(root: ParentNode | null | undefined): Array<HTMLElement> {
  if (!root) {
    return [];
  }

  try {
    return Array.from(root.querySelectorAll<HTMLElement>('input.XVariable, input[type="hidden"][data-name]'));
  } catch {
    return [];
  }
}

/**
 * Reads the form's declared global variables from the **authoritative** designer model: the designer
 * instance's `getPersist().persist` holds the persisted form object whose top-level `variables` array
 * lists every Formularvariable with its `name` and `value`. This is preferred over any DOM scraping,
 * because the FORMCYCLE design canvas does not render the hidden variable inputs.
 *
 * @returns The variables as `{ name, value }` pairs (empty when the designer is unavailable). */
function readFormModelVariables(): Array<{ name: string; value: string }> {
  const result: Array<{ name: string; value: string }> = [];

  try {
    const designer = getDesignerInstance() as unknown as { getPersist?: () => unknown } | undefined;
    const wrapper = designer?.getPersist?.();

    let json: unknown = wrapper;

    if (wrapper && typeof wrapper === "object" && typeof (wrapper as Record<string, unknown>)["persist"] === "string") {
      json = JSON.parse((wrapper as Record<string, unknown>)["persist"] as string);
    } else if (typeof wrapper === "string") {
      json = JSON.parse(wrapper);
    }

    const variables = (json as { variables?: unknown } | undefined)?.variables;

    if (Array.isArray(variables)) {
      for (const entry of variables) {
        if (entry && typeof entry === "object") {
          const record = entry as Record<string, unknown>;
          const name = String(record["name"] ?? "").trim();
          const value = record["value"];

          if (name !== "") {
            result.push({ name, value: value === undefined || value === null ? "" : String(value) });
          }
        }
      }
    }
  } catch {
    /* Designer unavailable — fall back to the DOM sources. */
  }

  return result;
}

/**
 * Reads the form's declared global variables from the designer's variables-editor grid
 * (`#varseditor`): each `.slick-row` carries the variable **name** in its `r1` cell and the **value**
 * in its `r2` cell. This is the fallback source when the canvas does not render the variables as
 * hidden inputs (FORMCYCLE only renders *visible* design elements in the design canvas).
 */
function readVariablesEditorVariables(doc: Document): Array<{ name: string; value: string }> {
  const result: Array<{ name: string; value: string }> = [];
  const editor = doc.querySelector<HTMLElement>("#varseditor, [id$='varseditor']");

  if (!editor) {
    return result;
  }

  const cellText = (cell: HTMLElement | undefined): string => {
    if (!cell) {
      return "";
    }

    const control = cell.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input,textarea,select",
    );

    return (control?.value ?? cell.textContent ?? "").trim();
  };

  for (const row of editor.querySelectorAll<HTMLElement>(".slick-row")) {
    const cells = Array.from(row.querySelectorAll<HTMLElement>(".slick-cell"));

    // Prefer the explicit name/value columns (`r1`/`r2`), but fall back to the first two cells so a
    // different grid markup still yields the row's variable.
    const nameCell = cells.find((cell) => cell.classList.contains("r1")) ?? cells[0];
    const valueCell = cells.find((cell) => cell.classList.contains("r2")) ?? cells[1];
    const name = cellText(nameCell);

    if (name !== "") {
      result.push({ name, value: valueCell ? cellText(valueCell) : "" });
    }
  }

  return result;
}

/**
 * Mirrors the form's global variables into **target** — the designer document the form runtime was
 * injected into — for the duration of an EP retrieval. DOM-based Element Placeholders such as `V`
 * read the runtime document directly, so the variables must exist there. They are sourced, in order
 * of reliability: (1) the designer model's top-level `variables` array, (2) any hidden variable
 * inputs rendered on the canvas, (3) the designer's variables-editor grid. Returns a cleanup function
 * that removes the mirrored inputs again.
 *
 * @param anchor An element inside the canvas (used to reach the host document / shadow root).
 * @param target The document the EP runtime resolves in (usually the designer document).
 *
 * @returns A cleanup function removing everything that was mirrored. */
function mirrorGlobalVariables(anchor: HTMLElement, target: Document): () => void {
  // The authoritative source first — the designer model's persisted `variables`.
  const candidates = readFormModelVariables();
  const sources = new Set<ParentNode>();
  const root = anchor.getRootNode();

  if (root instanceof ShadowRoot) {
    sources.add(root);
  }

  if (anchor.ownerDocument) {
    sources.add(anchor.ownerDocument);
  }

  for (const source of sources) {
    for (const input of collectVariableInputs(source)) {
      const control = input as HTMLInputElement;

      candidates.push({
        name: (input.getAttribute("data-name") ?? input.getAttribute("name") ?? "").trim(),
        value: typeof control.value === "string" ? control.value : (input.getAttribute("value") ?? ""),
      });
    }
  }

  // The design canvas often omits the hidden variables, so also read the designer's variables grid.
  candidates.push(...readVariablesEditorVariables(target));

  const created: Array<HTMLElement> = [];
  const seen = new Set<string>();

  for (const { name, value } of candidates) {
    if (name === "" || seen.has(name.toLowerCase())) {
      continue;
    }

    seen.add(name.toLowerCase());

    // Never shadow a variable that already exists in the target document.
    const selector = `[data-name="${escapeAttributeValue(name)}"],[name="${escapeAttributeValue(name)}"]`;

    if (target.querySelector(selector)) {
      continue;
    }

    const clone = target.createElement("input");
    clone.type = "hidden";
    clone.className = "XVariable";
    clone.setAttribute("data-name", name);
    clone.setAttribute("name", name);
    clone.value = value;
    clone.setAttribute("value", value);
    clone.setAttribute("data-codbi-epb-mirror", "1");
    (target.body ?? target.documentElement).appendChild(clone);
    created.push(clone);
  }

  // Always report what the mirror saw (visible in DevTools) so a missing variable is diagnosable.
  console.warn("[CodBi EP-builder] mirrored global variables", {
    candidates: candidates.map((candidate) => `${candidate.name}=${candidate.value}`),
    mirrored: created.map((element) => element.getAttribute("data-name")),
  });

  return () => {
    for (const element of created) {
      element.remove();
    }
  };
}

/** Classpath path of the CodBi form runtime script. */
const RUNTIME_SCRIPT_PATH = "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi.js";
/** Classpath prefix under which the individual CodBi element scripts live. */
const EP_SCRIPT_PREFIX = "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/";
/** Script ids already injected into the designer document. */
const injectedScripts = new Set<string>();

/**
 * Builds a `plugin?name=Resource` URL for a classpath path.
 *
 * @param path The classpath path (must start with the codbi resource root).
 *
 * @returns The absolute resource URL. */
function resourceUrl(path: string): string {
  const baseURL = `${window.location.href.split("/").slice(0, 4).join("/")}/`;

  return `${baseURL}plugin?name=Resource&Path=${encodeURIComponent(path)}`;
}

/**
 * Injects a classic `<script>` once and resolves on load, error or a 4s timeout.
 *
 * @param doc The document to inject into.
 * @param id  The unique script id.
 * @param url The script URL.
 *
 * @returns A promise resolving when the script settled. */
function injectScript(doc: Document, id: string, url: string): Promise<void> {
  return new Promise((resolve) => {
    const settle = (): void => resolve();

    if (injectedScripts.has(id) || doc.getElementById(id)) {
      settle();

      return;
    }

    injectedScripts.add(id);

    const script = doc.createElement("script");
    script.id = id;
    script.type = "text/javascript";
    script.src = url;
    script.addEventListener("load", settle);
    script.addEventListener("error", settle);
    doc.head.appendChild(script);
    window.setTimeout(settle, 4000);
  });
}

/** Cache of already-resolved module blob URLs (per resource file name). */
const moduleBlobCache = new Map<string, Promise<string>>();
/** EP modules already imported into the designer. */
const loadedModules = new Set<string>();

/**
 * Lazily fetches an EP/chunk ES module and rewrites its **relative** imports (`./chunk-X.js`) to
 * absolute Resource URLs, returning a Blob URL for the rewritten module. Because the Resource servlet
 * URL is query-based, a relative sibling import would otherwise resolve to `<base>/chunk-X.js`
 * (`/not-found`); rewriting keeps lazy loading working **without bundling** the EP into the designer.
 *
 * @param fileName The resource file name (e.g. `sorted.js`).
 *
 * @returns The Blob URL of the rewritten module. */
async function resolveModuleBlob(fileName: string): Promise<string> {
  const cached = moduleBlobCache.get(fileName);

  if (cached) {
    return cached;
  }

  const pending = (async (): Promise<string> => {
    const response = await fetch(resourceUrl(`${EP_SCRIPT_PREFIX}${fileName}`));

    if (!response.ok) {
      throw new Error(`Failed to load EP module ${fileName}`);
    }

    let text = await response.text();
    const refs = new Set<string>();

    for (const match of text.matchAll(/(?:from\s*|import\s*)["']\.\/([^"']+)["']/g)) {
      refs.add(match[1]);
    }

    for (const ref of refs) {
      const blobUrl = await resolveModuleBlob(ref);

      text = text.split(`"./${ref}"`).join(`"${blobUrl}"`).split(`'./${ref}'`).join(`"${blobUrl}"`);
    }

    return URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
  })();

  moduleBlobCache.set(fileName, pending);

  return pending;
}

/**
 * Ensures the CodBi form runtime and the requested EP modules are loaded into the **designer**
 * document, then returns the runtime. Loading it into the designer frame (rather than the canvas)
 * ensures it cannot trigger functionalities on the canvas' `data-cb-*` elements.
 *
 * @param anchor An element inside the target document.
 * @param ids    The EP ids (incl. nested ones) that must be available.
 *
 * @returns The runtime `codbi` object, or **undefined** when it cannot be loaded. */
async function ensureRuntime(
  anchor: HTMLElement,
  ids: Array<string>,
): Promise<CodbiRuntimeWindow["codbi"] | undefined> {
  const doc = window.document;

  // Inject the runtime into the DESIGNER window (once). The check is deliberately against the
  // designer window's own `codbi` — NOT against `findRuntimeCodbi(anchor)`: the anchor may live in
  // the canvas, whose `codbi` (if any) is a DIFFERENT runtime that the EP modules below would never
  // register into. Returning/using that canvas runtime made `resolveEP` fall back to an AJAX lookup
  // that never settles in the designer (timeout). Keeping the runtime and the modules co-located in
  // one window guarantees the returned runtime actually knows the requested EPs.
  if (!(window as unknown as CodbiRuntimeWindow).codbi?.resolveEP) {
    await injectScript(doc, "codbi-epb-runtime", resourceUrl(RUNTIME_SCRIPT_PATH));
  }

  // The runtime's own EP registry: skip an id only when the runtime already knows it. This makes a
  // previously FAILED import (e.g. from an earlier attempt before the runtime existed) retry instead
  // of being permanently suppressed by the session-level `loadedModules` bookkeeping.
  const knownEPs =
    (window as unknown as { codbi?: { availableEPs?: Record<string, unknown> } }).codbi?.availableEPs ?? {};

  for (const id of ids) {
    if (knownEPs[id] !== undefined) {
      continue;
    }

    loadedModules.add(id);

    try {
      // Lazily load the EP module graph via a module script whose Blob URL already carries absolute
      // (rewritten) chunk imports — no eval, no bundling; only the used EPs are fetched.
      const blobUrl = await resolveModuleBlob(`${id}.js`);
      const script = doc.createElement("script");

      script.type = "module";
      script.src = blobUrl;
      doc.head.appendChild(script);

      await new Promise<void>((resolve) => {
        script.addEventListener("load", () => resolve());
        script.addEventListener("error", () => resolve());
        window.setTimeout(resolve, 4000);
      });
    } catch {
      /* EP module unavailable — resolveEP will report it */
    }
  }

  return (window as unknown as CodbiRuntimeWindow).codbi ?? findRuntimeCodbi(anchor);
}

/** The options accepted by {@link openEPBuilder}. */
export interface EPBuilderOptions {
  /** The document the popup shall be rendered into (usually the canvas iframe's document). */
  document: Document;
  /** The element the popup is anchored to (used to locate the canvas window for signature lookups). */
  anchor: HTMLElement;
  /** The current attribute value. */
  value: string;
  /** Returns the available EP ids (from the `fslElementplaceholder` listing). */
  listEPs: () => Array<string>;
  /** Invoked when the user applies the built value. */
  onApply: (value: string) => void;
}

/** The handle returned by {@link openEPBuilder}. */
export interface EPBuilderController {
  /** Closes and removes the popup. */
  close: () => void;
}

/** The stylesheet injected once per document. */
const BUILDER_CSS = `
.codbi-epb-overlay{position:fixed;inset:0;z-index:100000;display:block;background:rgba(60,30,0,.18);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:12px;color:#3a2200}
.codbi-epb-overlay,.codbi-epb-overlay *{scrollbar-color:#ff9f40 transparent;scrollbar-width:thin}
.codbi-epb-overlay ::-webkit-scrollbar,.codbi-epb-overlay::-webkit-scrollbar{width:10px;height:10px}
.codbi-epb-overlay ::-webkit-scrollbar-track,.codbi-epb-overlay::-webkit-scrollbar-track{background:transparent}
.codbi-epb-overlay ::-webkit-scrollbar-thumb,.codbi-epb-overlay::-webkit-scrollbar-thumb{background:#ff9f40;border-radius:5px}
.codbi-epb-overlay ::-webkit-scrollbar-thumb:hover,.codbi-epb-overlay::-webkit-scrollbar-thumb:hover{background:#ffb266}
.codbi-epb-overlay ::-webkit-scrollbar-corner,.codbi-epb-overlay::-webkit-scrollbar-corner{background:transparent}
.codbi-epb{position:fixed;display:flex;flex-direction:column;background:#fff;border:2px solid darkorange;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.55);overflow:hidden}
.codbi-epb__grip{position:absolute;right:0;bottom:0;width:16px;height:16px;cursor:nwse-resize;touch-action:none;background:linear-gradient(135deg,transparent 46%,darkorange 46%);border-bottom-right-radius:6px}
.codbi-epb__head{display:flex;align-items:center;gap:8px;padding:8px 12px;background:darkorange;border-bottom:1px solid #b35c00;cursor:move;touch-action:none}
.codbi-epb__title{font-weight:700;color:#fff;flex:1 1 auto}
.codbi-epb__body{flex:1 1 auto;overflow:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;background:#fffdf9}
.codbi-epb__foot{display:flex;justify-content:flex-end;gap:8px;padding:8px 12px;background:#fff3e0;border-top:1px solid darkorange}
.codbi-epb button{cursor:pointer;border:1px solid darkorange;border-radius:4px;background:#fff;color:#a85a00;padding:2px 8px;font:inherit}
.codbi-epb__head button{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;padding:0 8px;font-size:14px;line-height:1;border-color:darkorange;color:#a85a00;background:#fff;box-shadow:0 0 .25em black;transition:background-color .25s ease,color .25s ease,box-shadow .25s ease,transform .25s ease}
.codbi-epb__head button:hover{background:darkorange;color:#fff;box-shadow:0 0 .4em black}
.codbi-epb__head button:active{background:#c96a00;color:#fff;transform:translateY(1px)}
.codbi-epb__head button.primary{background:#fff;color:#a85a00}
.codbi-epb button:hover{background:#ffe8cc}
.codbi-epb button.primary{background:darkorange;color:#fff}
.codbi-epb button.primary:hover{background:#c96a00}
.codbi-epb input,.codbi-epb select,.codbi-epb textarea{padding:1px 4px;border:1px solid darkorange;border-radius:3px;font:inherit;background:#fff;color:#3a2200}
.codbi-epb input[type="text"]{min-width:8em}
.codbi-epb input:focus,.codbi-epb select:focus,.codbi-epb textarea:focus{outline:none;border-bottom-width:3px;box-shadow:0 0 .5em black}
.codbi-epb__seglist{display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.codbi-epb__node{border:1px solid darkorange;border-radius:6px;background:#fff7ec;padding:6px;display:flex;flex-direction:column;gap:6px;width:100%}
.codbi-epb__nodehead{display:flex;align-items:center;gap:6px}
.codbi-epb__param{display:flex;align-items:flex-start;gap:6px;border-left:3px solid darkorange;padding-left:6px}
.codbi-epb__paramlabel{flex:0 0 auto;color:#8a4700;font-weight:600;white-space:nowrap;padding-top:2px;min-width:3.5em}
.codbi-epb__params{display:flex;flex-direction:column;gap:6px}
.codbi-epb__textinput{flex:1 1 auto}
.codbi-epb__banner{background:#fff0d9;border:1px solid darkorange;border-radius:4px;padding:4px 6px;color:#8a4700}
.codbi-epb__empty{color:#9a7b55;font-style:italic}
.codbi-epb__desc{display:flex;flex-direction:column;gap:4px;border:1px dashed darkorange;border-radius:4px;padding:6px;background:#fff7ec}
.codbi-epb__descrow{display:flex;align-items:center;gap:6px}
.codbi-epb__hint{color:#9a7b55;font-size:11px;display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.codbi-epb__hintbadge{display:inline-flex;align-items:center;background:#fff7ec;border:1px solid darkorange;border-radius:10px;padding:1px 8px;color:#a85a00;font-weight:600;font-family:monospace}
.codbi-epb__diagramwrap{display:flex;gap:0;width:100%;flex:1 1 auto;min-height:0;align-items:stretch}
.codbi-epb__diagram{flex:0 0 34%;max-width:34%;min-width:0;overflow:auto;display:flex;flex-direction:column;gap:8px;align-items:flex-start;padding-right:8px}
.codbi-epb__diagramsplit{position:relative;flex:0 0 16px;cursor:col-resize;touch-action:none;display:flex;align-items:center;justify-content:center;border-radius:8px;background:transparent;transition:background-color .25s ease,box-shadow .25s ease}
.codbi-epb__diagramsplit::before{content:"";width:4px;height:100%;border-radius:999px;background:darkorange;transition:background-color .25s ease}
.codbi-epb__diagramsplit:hover,.codbi-epb__diagramsplit:active{background:darkorange;box-shadow:0 0 .25em black}
.codbi-epb__diagramsplit:hover::before,.codbi-epb__diagramsplit:active::before{background:#fff}
.codbi-epb__diagramdocs{flex:1 1 auto;min-width:0;min-height:0;display:flex;flex-direction:column;gap:6px;padding-left:12px}
.codbi-epb__diagramdocstitle{font-weight:700;color:#a85a00;font-family:monospace;background:#fff7ec;border:1px solid darkorange;border-radius:10px;padding:2px 10px;align-self:flex-start;box-shadow:0 0 .25em black}
.codbi-epb__diagram-id--selected{box-shadow:0 0 .5em black,0 0 0 3px #a85a00}
.codbi-epb__diagram-param--selected{background:#fff0d9;border-radius:6px}
.codbi-epb__diagram-ep{border:2px solid darkorange;border-radius:8px;background:#fff7ec;padding:8px 10px;display:flex;flex-direction:column;gap:6px;box-shadow:0 2px 6px rgba(255,140,0,.25)}
.codbi-epb__diagram-id{font-weight:700;color:#a85a00}
.codbi-epb__diagram-params{display:flex;flex-direction:column;gap:6px;margin-left:14px;border-left:2px dashed darkorange;padding-left:10px}
.codbi-epb__diagram-param{display:flex;align-items:flex-start;gap:6px}
.codbi-epb__diagram-index{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;padding:0;line-height:1;border-radius:50%;background:darkorange;color:#fff;font-weight:700;font-size:11px;cursor:pointer}
.codbi-epb__diagram-inner{display:flex;flex-direction:column;gap:6px}
.codbi-epb__diagram-literal{display:inline-block;background:#ffe8cc;border:1px solid #e0a86a;border-radius:12px;padding:1px 8px;color:#7a3e00;font-family:monospace}
.codbi-epb__literal{display:inline-block;background:#ffe8cc;border:1px solid #e0a86a;border-radius:4px;padding:1px 6px;color:#7a3e00;font-family:monospace}
.codbi-epb__parambody{flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0}
.codbi-epb__paramdesc{color:#9a7b55;font-size:11px;line-height:1.2}
.codbi-epb__epdesc{color:#8a4700;font-size:11px;font-style:italic}
.codbi-epb__pickerwrap{display:flex;flex-direction:column;width:100%}
.codbi-epb__pickerfilter{width:100%;margin:0 0 4px}
.codbi-epb__picker{display:flex;flex-direction:column;gap:2px;max-height:220px;overflow:auto;border:1px solid darkorange;border-radius:6px;background:#fff;padding:4px}
.codbi-epb__pickeritem{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:1px;border:0;border-bottom:1px solid #ffe0b8;border-radius:0;background:transparent;padding:3px 6px;width:100%;font:inherit}
.codbi-epb__pickeritem:hover{background:#fff3e0}
.codbi-epb__pickername{font-weight:600;color:#a85a00}
.codbi-epb__pickersummary{color:#9a7b55;font-size:11px}
.codbi-epb__badge{display:inline-flex;align-items:center;background:#fff7ec;border:1px solid darkorange;border-radius:12px;padding:2px 10px;color:#a85a00;font-weight:600;font-family:monospace;box-shadow:0 0 .25em black}
.codbi-epb__badge--empty{color:#9a7b55;font-style:italic;font-family:inherit}
.codbi-epb__epsel{display:inline-flex;align-items:center;gap:6px;border:1px solid darkorange;border-radius:18px;padding:6px 10px 6px 8px;background:#fffdf9}
.codbi-epb__paramhead{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px}
.codbi-epb__paramline{display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.codbi-epb__head button[aria-pressed="true"]{background:darkorange;color:#fff;font-weight:700;box-shadow:0 0 .4em black,inset 0 0 0 2px #fff}
.codbi-epb__head button[aria-pressed="false"]{background:#fff;color:#a85a00}
.codbi-epb__logo{flex:0 0 auto;width:20px;height:20px;background-repeat:no-repeat;background-position:center;background-size:contain}
.codbi-epb__epdesc{display:flex;align-items:center;gap:6px;width:100%}
.codbi-epb__epdesctext{flex:1 1 auto;min-width:0}
.codbi-epb__fold{min-width:26px;padding:0 8px;font-size:1.6em;line-height:1;background:darkorange;color:#fff;border-color:#b35c00;box-shadow:0 0 .25em black}
.codbi-epb__fold:hover{background:#c96a00}
.codbi-epb__folded{display:flex;align-items:center;gap:6px;font-family:monospace;color:#fff;background:darkorange;border:1px solid #b35c00;border-radius:4px;box-shadow:0 0 .25em black;padding:2px 4px 2px 8px;width:100%}
.codbi-epb__foldedtext{flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.codbi-epb__copy{flex:0 0 auto;border:1px solid rgba(255,255,255,.7);background:transparent;color:#fff;border-radius:4px;padding:0 5px;line-height:1.5;font-size:12px;cursor:pointer}
.codbi-epb__copy:hover{background:rgba(255,255,255,.25)}
.codbi-epb__copy--done{background:#fff;color:#a85a00}
.codbi-epb__toprow{display:flex;align-items:flex-start;gap:6px}
.codbi-epb__toprow>.codbi-epb__seglist{flex:1 1 auto}
.codbi-epb__addtext{flex:0 0 auto;min-width:26px;font-weight:700}
.codbi-epb__resultpanel{margin-top:4px}
.codbi-epb__result{max-height:220px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-family:monospace;font-size:11px;background:#fffdf9;border:1px solid darkorange;border-radius:4px;padding:4px 6px;color:#3a2200}
.codbi-epb--max{width:96vw;max-width:96vw;height:96vh;max-height:96vh}
.codbi-epb--docked{border-radius:0;max-width:none;max-height:100vh}
.codbi-epb__docsbtn{display:inline-flex;align-items:center;justify-content:center;border:0;background:transparent;color:#a85a00;padding:2px;font-style:normal;line-height:1;cursor:pointer;vertical-align:middle;border-radius:50%}
.codbi-epb__docsbtn:hover{color:#fff;background:darkorange}
.codbi-epb__docsbtn:focus-visible{outline:2px solid darkorange;outline-offset:1px}
.codbi-epb__docsbtn--on,.codbi-epb__docsbtn[aria-pressed="true"]{background:darkorange;color:#fff;box-shadow:0 0 .25em black}
.codbi-epb__docspanel{margin:4px 0}
.codbi-epb__docsframe{width:100%;height:380px;border:1px solid darkorange;border-radius:6px;background:#fff}
.codbi-epb__docspanel--diagram{flex:1 1 auto;display:flex;min-height:0;margin:0}
.codbi-epb__diagramdocsframe{border:1px solid darkorange;border-radius:6px;background:#fff}
.codbi-epb__diagram-id{display:inline-block;background:darkorange;border:1px solid #b35c00;border-radius:12px;padding:1px 10px;color:#fff;font-weight:700;box-shadow:0 0 .5em black;cursor:pointer}
.codbi-epb__diagram-index[title]{cursor:pointer}
.codbi-epb__diagram-input{font-family:monospace;background:#ffe8cc;border:1px solid #e0a86a;border-radius:12px;padding:1px 8px;color:#7a3e00;min-width:6em;max-width:100%}
`;

/** Absolute URL of the CodBi logo served by the plugin's `Resource` servlet. */
const CODBI_LOGO_URL = (() => {
  const baseURL = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  const path = encodeURIComponent("/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg");

  return `${baseURL}plugin?name=Resource&Path=${path}`;
})();

/** Injects {@link BUILDER_CSS} into **doc** once. */
function ensureStyles(doc: Document): void {
  if (doc.getElementById("codbi-epb-styles")) {
    return;
  }

  const style = doc.createElement("style");
  style.id = "codbi-epb-styles";
  style.textContent = BUILDER_CSS;
  doc.head.appendChild(style);
}

/** Shortens **text** to its first sentence (or a hard cap) for compact display. */
function shorten(text: string, max = 110): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const end = normalized.search(/[.!?](\s|$)/);
  const sentence = end >= 0 ? normalized.slice(0, end + 1) : normalized;

  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}

/** Creates a crisp, non-italic SVG info icon (outlined circle with a lowercase "i") for doc buttons. */
function createInfoIcon(doc: Document): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";

  const svg = doc.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.style.display = "block";

  const circle = doc.createElementNS(ns, "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "9.5");

  const stem = doc.createElementNS(ns, "line");
  stem.setAttribute("x1", "12");
  stem.setAttribute("y1", "16");
  stem.setAttribute("x2", "12");
  stem.setAttribute("y2", "11");

  const dot = doc.createElementNS(ns, "line");
  dot.setAttribute("x1", "12");
  dot.setAttribute("y1", "7.75");
  dot.setAttribute("x2", "12.01");
  dot.setAttribute("y2", "7.75");

  svg.append(circle, stem, dot);

  return svg;
}

/**
 * Copies **text** to the clipboard. Uses the async Clipboard API when available and falls back to a
 * hidden `<textarea>` + `execCommand("copy")` so it also works in older designer hosts.
 *
 * @param text The text to copy.
 *
 * @returns **TRUE** when the copy succeeded. */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);

      return true;
    }
  } catch {
    /* Fall back to the legacy path below. */
  }

  try {
    const scratch = document.createElement("textarea");
    scratch.value = text;
    scratch.setAttribute("readonly", "");
    scratch.style.position = "fixed";
    scratch.style.opacity = "0";
    document.body.appendChild(scratch);
    scratch.select();
    const ok = document.execCommand("copy");
    scratch.remove();

    return ok;
  } catch {
    return false;
  }
}

/**
 * Whether a literal value may be entered for a parameter of **type**. Only string parameters (and
 * parameters of unknown type) accept a plain literal; every other datatype must be produced by a
 * nested Element-Placeholder.
 *
 * @param type The parameter's datatype hint.
 *
 * @returns **TRUE** when a literal input is allowed. */
function allowsLiteral(type: string | undefined): boolean {
  return type === undefined || type === "string" || type === "any";
}

/**
 * Resolves a description that may be a plain string or a per-language map, using the current
 * designer language (falling back to the two-letter language and finally English).
 *
 * @param value The description value.
 *
 * @returns The localized string or **undefined**. */
function pickLanguage(value: string | { [lang: string]: string } | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  const language = getDesignerLanguage().toLowerCase();

  return value[language] ?? value[language.slice(0, 2)] ?? value.en;
}

/**
 * Formats an EP retrieval result for display.
 *
 * @param value The retrieved value.
 *
 * @returns A human readable string. */
function formatResult(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    const json = JSON.stringify(value, null, 2);

    return json.length > 4000 ? `${json.slice(0, 4000)}\n…` : json;
  } catch {
    return String(value);
  }
}

/**
 * Resolves the signature of an EP from every available source (never throws, always returns a
 * best-effort result or `undefined`):
 *
 * 1. `window.CodbiPluginData.epSignatures[id]`;
 * 2. `window.CodbiPluginData.detElementplaceholder[id].Signature`;
 * 3. synthesized from `detElementplaceholder[id].Parameter` (numeric index → description);
 * 4. the canvas iframe's runtime (`window.codbi.resolveEPSignature`).
 *
 * @param id     The EP id.
 * @param anchor An element inside the target document (to reach the canvas window).
 *
 * @returns The resolved signature or **undefined** when nothing is known. */
/** The subset of a `detElementplaceholder` entry the builder consumes. */
interface EPEntry {
  Signature?: CodbiEPSignature;
  Summary?: string | { [lang: string]: string };
  Parameter?: { [key: string]: string };
  Description?: string;
}

/**
 * Looks up the raw `detElementplaceholder` entry for **id**. The runtime keys it by the EP's
 * (lowercase) file name, so the lookup is case-insensitive.
 *
 * @param id The EP id.
 *
 * @returns The entry or **undefined**. */
function lookupEPEntry(id: string): EPEntry | undefined {
  const key = id.toLowerCase().trim();

  if (key === "") {
    return undefined;
  }

  const placeholders = window.CodbiPluginData?.detElementplaceholder;

  if (!placeholders) {
    return undefined;
  }

  let entry = placeholders[key] ?? placeholders[id];

  if (!entry) {
    const match = Object.keys(placeholders).find((candidate) => candidate.toLowerCase() === key);

    if (match !== undefined) {
      entry = placeholders[match];
    }
  }

  return entry;
}

/**
 * Resolves a very short (one-sentence) description of the EP.
 *
 * @param id The EP id.
 *
 * @returns The summary or **undefined**. */
export function resolveEPSummary(id: string): string | undefined {
  return pickLanguage(lookupEPEntry(id)?.Summary);
}

/**
 * Resolves the (designer-language) documentation URL of an EP, exactly like the flat ALT+E listing
 * does: `<docsAPI[lang]><entry.Description>`.
 *
 * @param id The EP id.
 *
 * @returns The documentation URL or **undefined** when none is configured. */
export function resolveEPDocUrl(id: string): string | undefined {
  const relative = lookupEPEntry(id)?.Description;

  if (!relative) {
    return undefined;
  }

  const docsApi = window.CodbiPluginData?.docsAPI;

  if (!docsApi) {
    return undefined;
  }

  const language = getDesignerLanguage().toLowerCase();
  const base = docsApi[language] ?? docsApi[language.slice(0, 2)] ?? docsApi.en;

  return base ? `${base}${relative}` : undefined;
}

export function resolveEPSignatureForId(id: string, anchor: HTMLElement): CodbiEPSignature | undefined {
  const key = id.toLowerCase().trim();

  if (key === "") {
    return undefined;
  }

  const explicit = window.CodbiPluginData?.epSignatures?.[key];

  if (explicit) {
    return explicit;
  }

  const entry = lookupEPEntry(id);

  if (entry?.Signature) {
    return entry.Signature;
  }

  if (entry?.Parameter) {
    const params = new Array<CodbiEPParamSpec>();

    for (const [paramIndex, description] of Object.entries(entry.Parameter)) {
      const parsedIndex = Number.parseInt(paramIndex, 10);

      params.push({
        index: Number.isNaN(parsedIndex) ? params.length + 1 : parsedIndex,
        type: "any",
        description: typeof description === "string" ? description : undefined,
      });
    }

    if (params.length > 0) {
      params.sort((a, b) => a.index - b.index);

      return { params, returnType: "any", source: "manager" };
    }
  }

  const runtimeWindow = anchor.ownerDocument?.defaultView as CodbiRuntimeWindow | null;

  return runtimeWindow?.codbi?.resolveEPSignature?.(key);
}

/**
 * Records a signature so subsequent builder openings (and the runtime) can use it.
 *
 * @param id        The EP id.
 * @param signature The signature to record.
 * @param anchor    An element inside the target document. */
export function describeEP(id: string, signature: CodbiEPSignature, anchor: HTMLElement): void {
  const key = id.toLowerCase().trim();

  if (key === "") {
    return;
  }

  if (window.CodbiPluginData) {
    window.CodbiPluginData.epSignatures = window.CodbiPluginData.epSignatures ?? {};
    window.CodbiPluginData.epSignatures[key] = signature;
  }

  const runtimeWindow = anchor.ownerDocument?.defaultView as CodbiRuntimeWindow | null;

  runtimeWindow?.codbi?.describeEP?.(key, { params: signature.params, returnType: signature.returnType });
}

/** The datatype options offered in the "Describe this EP…" form. */
const TYPE_OPTIONS: Array<string> = ["any", "string", "number", "boolean", "array", "object", "date"];

/**
 * Opens the EP builder modal.
 *
 * @param options The {@link EPBuilderOptions }.
 *
 * @returns An {@link EPBuilderController } to programmatically close the popup. */
export function openEPBuilder(options: EPBuilderOptions): EPBuilderController {
  const doc = options.document;

  ensureStyles(doc);

  let root = parseEPValue(options.value);
  let disposed = false;

  /** EP nodes whose details are folded. */
  const collapsed = new Set<EPNode>();
  /** EP nodes whose retrieval result panel is open. */
  const openResults = new Set<EPNode>();
  /** The last retrieval result per EP node. */
  const results = new Map<EPNode, string>();
  /** The EP id whose documentation is currently shown in the diagram's docs pane. */
  let diagramSelection: string | undefined;
  /** Fraction of the diagram area used by the (left) diagram column (0..1). */
  let diagramSplitRatio = 0.34;
  /** Persisted filter query per EP-node chooser (so it survives re-renders). */
  const pickerFilters = new Map<EPNode, string>();
  const MAX_KEY = "codbi-epb-maximized";
  let maximized = false;
  try {
    maximized = localStorage.getItem(MAX_KEY) === "1";
  } catch {
    maximized = false;
  }

  const overlay = doc.createElement("div");
  overlay.className = "codbi-epb-overlay";

  const panel = doc.createElement("div");
  panel.className = "codbi-epb";
  overlay.appendChild(panel);

  // #region Geometry (move / resize / snap / dock)
  const GEOM_KEY = "codbi-epb-geometry";
  /** Distance from a viewport edge (px) that triggers docking to that side — mirrors the assistant. */
  const DOCK_MARGIN = 8;
  const MIN_W = 340;
  const MIN_H = 220;

  /** The viewport half a panel may dock to. */
  type DockSide = "left" | "right";
  type Geometry = { left: number; top: number; width: number; height: number; docked?: DockSide | null };

  /** The half the panel is currently docked to, or **null** while floating. */
  let docked: DockSide | null = null;
  /** The last floating geometry, restored when a docked panel is dragged away from the edge. */
  let floatingGeometry = { left: 0, top: 0, width: 0, height: 0 };

  const clampGeometry = (geom: Geometry): Geometry => {
    const width = Math.max(MIN_W, Math.min(geom.width, window.innerWidth));
    const height = Math.max(MIN_H, Math.min(geom.height, window.innerHeight));

    return {
      width,
      height,
      left: Math.max(0, Math.min(geom.left, window.innerWidth - width)),
      top: Math.max(0, Math.min(geom.top, window.innerHeight - height)),
    };
  };

  /** Docks the panel to a viewport half: full height, half width, flush against that edge. */
  const applyDock = (side: DockSide): void => {
    docked = side;
    panel.classList.add("codbi-epb--docked");
    panel.style.maxHeight = "100vh";
    panel.style.left = side === "left" ? "0px" : "50vw";
    panel.style.top = "0px";
    panel.style.width = "50vw";
    panel.style.height = "100vh";
  };

  /** Positions the panel as a floating window at **geom** (clamped to the viewport). */
  const applyFloating = (geom: Geometry): void => {
    docked = null;
    panel.classList.remove("codbi-epb--docked");
    panel.style.maxHeight = "";
    const clamped = clampGeometry(geom);

    floatingGeometry = clamped;
    panel.style.left = `${clamped.left}px`;
    panel.style.top = `${clamped.top}px`;
    panel.style.width = `${clamped.width}px`;
    panel.style.height = `${clamped.height}px`;
  };

  const applyGeometry = (geom: Geometry): void => {
    if (geom.docked === "left" || geom.docked === "right") {
      floatingGeometry = clampGeometry(geom);
      applyDock(geom.docked);

      return;
    }

    applyFloating(geom);
  };

  const readGeometry = (): Geometry | undefined => {
    try {
      const raw = localStorage.getItem(GEOM_KEY);

      return raw ? (JSON.parse(raw) as Geometry) : undefined;
    } catch {
      return undefined;
    }
  };

  const saveGeometry = (): void => {
    if (maximized) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const geom: Geometry = docked
      ? { ...floatingGeometry, docked }
      : { left: rect.left, top: rect.top, width: rect.width, height: rect.height };

    try {
      localStorage.setItem(GEOM_KEY, JSON.stringify(geom));
    } catch {
      /* ignore persistence errors */
    }
  };

  const defaultGeometry = (): Geometry => {
    const width = Math.min(800, window.innerWidth * 0.95);
    const height = Math.min(640, window.innerHeight * 0.9);

    return { width, height, left: (window.innerWidth - width) / 2, top: (window.innerHeight - height) / 2 };
  };

  applyGeometry(readGeometry() ?? defaultGeometry());
  // #endregion Geometry (move / resize / snap / dock)

  // Isolate the popup from the designer's drag/drop and hotkey handling.
  for (const eventName of ["mousedown", "pointerdown", "click", "keydown", "keyup"]) {
    overlay.addEventListener(eventName, (event) => event.stopPropagation(), false);
  }

  // #region Head
  const head = doc.createElement("div");
  head.className = "codbi-epb__head";
  const logo = doc.createElement("span");
  logo.className = "codbi-epb__logo";
  logo.style.backgroundImage = `url("${CODBI_LOGO_URL}")`;
  logo.setAttribute("aria-hidden", "true");
  const title = doc.createElement("span");
  title.className = "codbi-epb__title";
  title.textContent = i18n("epBuilder.title");
  const maxButton = doc.createElement("button");
  maxButton.type = "button";
  const rawToggle = doc.createElement("button");
  rawToggle.type = "button";
  rawToggle.textContent = "{ }";
  rawToggle.title = i18n("epBuilder.raw");
  rawToggle.setAttribute("aria-label", i18n("epBuilder.raw"));
  rawToggle.setAttribute("aria-pressed", "false");
  const diagramToggle = doc.createElement("button");
  diagramToggle.type = "button";
  diagramToggle.textContent = "◫";
  diagramToggle.title = i18n("epBuilder.diagram");
  diagramToggle.setAttribute("aria-label", i18n("epBuilder.diagram"));
  diagramToggle.setAttribute("aria-pressed", "false");
  head.append(logo, title, diagramToggle, rawToggle, maxButton);
  panel.appendChild(head);

  /** Applies the (persisted) maximize state to the panel geometry and the maximize button. */
  const applyMaximize = (): void => {
    if (maximized) {
      applyGeometry({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
      maxButton.textContent = "🗗";
      maxButton.title = i18n("epBuilder.restore");
    } else {
      applyGeometry(readGeometry() ?? defaultGeometry());
      maxButton.textContent = "🗖";
      maxButton.title = i18n("epBuilder.maximize");
    }
  };
  maxButton.addEventListener("click", () => {
    maximized = !maximized;
    try {
      localStorage.setItem(MAX_KEY, maximized ? "1" : "0");
    } catch {
      /* ignore persistence errors */
    }
    applyMaximize();
  });
  applyMaximize();

  // #region Move (drag the header) + edge docking
  let dragging = false;
  let dragDX = 0;
  let dragDY = 0;
  head.addEventListener("pointerdown", (event) => {
    if (maximized || (event.target as HTMLElement).closest("button")) {
      return;
    }

    const rect = panel.getBoundingClientRect();

    dragging = true;
    dragDX = event.clientX - rect.left;
    dragDY = event.clientY - rect.top;
    head.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  head.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const left = Math.max(0, Math.min(event.clientX - dragDX, window.innerWidth - rect.width));
    const top = Math.max(0, Math.min(event.clientY - dragDY, window.innerHeight - rect.height));

    // Dock to the left/right viewport half once the header is dragged onto that edge — exactly like
    // the Form Assistant dialog. Dragging a docked panel away from the edge un-docks it again at its
    // remembered floating size.
    let nextSide: DockSide | null = null;

    if (left <= DOCK_MARGIN) {
      nextSide = "left";
    } else if (left + rect.width >= window.innerWidth - DOCK_MARGIN) {
      nextSide = "right";
    }

    if (nextSide) {
      if (!docked) {
        floatingGeometry = { left, top, width: rect.width, height: rect.height };
      }

      applyDock(nextSide);

      return;
    }

    if (docked) {
      docked = null;
      panel.classList.remove("codbi-epb--docked");
      panel.style.maxHeight = "";
      panel.style.width = `${floatingGeometry.width}px`;
      panel.style.height = `${floatingGeometry.height}px`;
    }

    const width = panel.getBoundingClientRect().width;
    const height = panel.getBoundingClientRect().height;

    floatingGeometry = { left, top, width, height };
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  });
  const endMove = (event: PointerEvent): void => {
    if (!dragging) {
      return;
    }

    dragging = false;

    try {
      head.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }

    saveGeometry();
  };
  head.addEventListener("pointerup", endMove);
  head.addEventListener("pointercancel", endMove);
  // #endregion Move (drag the header) + edge docking

  // #region Resize (bottom-right grip)
  const grip = doc.createElement("div");
  grip.className = "codbi-epb__grip";
  panel.appendChild(grip);

  let resizing = false;
  let rsX = 0;
  let rsY = 0;
  let rsW = 0;
  let rsH = 0;
  grip.addEventListener("pointerdown", (event) => {
    if (maximized) {
      return;
    }

    // Resizing a docked panel un-docks it first so it resizes as a floating window.
    if (docked) {
      applyFloating(floatingGeometry);
    }

    const rect = panel.getBoundingClientRect();

    resizing = true;
    rsX = event.clientX;
    rsY = event.clientY;
    rsW = rect.width;
    rsH = rect.height;
    grip.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  });
  grip.addEventListener("pointermove", (event) => {
    if (!resizing) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const width = Math.max(MIN_W, Math.min(rsW + (event.clientX - rsX), window.innerWidth - rect.left));
    const height = Math.max(MIN_H, Math.min(rsH + (event.clientY - rsY), window.innerHeight - rect.top));

    panel.style.width = `${width}px`;
    panel.style.height = `${height}px`;
  });
  const endResize = (event: PointerEvent): void => {
    if (!resizing) {
      return;
    }

    resizing = false;

    try {
      grip.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }

    saveGeometry();
  };
  grip.addEventListener("pointerup", endResize);
  grip.addEventListener("pointercancel", endResize);
  // #endregion Resize (bottom-right grip)
  // #endregion Head

  // #region Body
  const body = doc.createElement("div");
  body.className = "codbi-epb__body";
  panel.appendChild(body);
  // #endregion Body

  // #region Foot
  const foot = doc.createElement("div");
  foot.className = "codbi-epb__foot";
  const cancel = doc.createElement("button");
  cancel.type = "button";
  cancel.textContent = i18n("epBuilder.cancel");
  const apply = doc.createElement("button");
  apply.type = "button";
  apply.className = "primary";
  apply.textContent = i18n("epBuilder.apply");
  foot.append(cancel, apply);
  panel.appendChild(foot);
  // #endregion Foot

  /** Closes the popup (idempotent). */
  const close = (): void => {
    if (disposed) {
      return;
    }

    disposed = true;
    overlay.remove();
    doc.removeEventListener("keydown", onKeydown, true);
  };

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  cancel.addEventListener("click", close);
  apply.addEventListener("click", () => {
    // CodBi treats parameter values case-insensitively, so pass them lowercased — the builder's
    // inputs keep the user's original casing, only the applied value is normalised.
    options.onApply(serializeEPValue(root, true));
    close();
  });

  // #region View modes (tree / diagram / raw)
  let rawMode = false;
  let diagramMode = false;
  rawToggle.addEventListener("click", () => {
    rawMode = !rawMode;
    diagramMode = false;
    rawToggle.setAttribute("aria-pressed", String(rawMode));
    diagramToggle.setAttribute("aria-pressed", "false");
    render();
  });
  diagramToggle.addEventListener("click", () => {
    diagramMode = !diagramMode;
    rawMode = false;
    diagramToggle.setAttribute("aria-pressed", String(diagramMode));
    rawToggle.setAttribute("aria-pressed", "false");
    render();
  });
  // #endregion View modes (tree / diagram / raw)

  /**
   * The available EP ids: the built-in ones from the file listing **plus** the locally defined EPs
   * (registered via the Local API-doc manager, i.e. `detElementplaceholder[…].local === true`).
   *
   * @returns The sorted EP ids. */
  const availableIds = (): Array<string> => {
    const ids = new Set<string>();

    try {
      for (const entry of options.listEPs()) {
        ids.add(entry.replace(/\.(js|ts)$/i, ""));
      }
    } catch {
      /* ignore */
    }

    const placeholders = window.CodbiPluginData?.detElementplaceholder ?? {};

    for (const [id, entry] of Object.entries(placeholders)) {
      if (entry?.local === true) {
        ids.add(id);
      }
    }

    return Array.from(ids).sort((a, b) => a.localeCompare(b));
  };

  /** EP nodes whose chooser popover is currently open. */
  const openPickers = new Set<EPNode>();

  /** EP nodes whose inline documentation panel is currently open. */
  const openDocs = new Set<EPNode>();

  /** Ensures a freshly chosen EP has one parameter row per declared signature entry. */
  const prefillParams = (node: EPNode): void => {
    if (node.params.length !== 0) {
      return;
    }

    const resolved = resolveEPSignatureForId(node.id, options.anchor);

    for (let paramIndex = 0; paramIndex < (resolved?.params.length ?? 0); paramIndex++) {
      node.params.push([]);
    }
  };

  /** Renders the EP chooser (id + short description) with a filter box for **node**. */
  const renderPicker = (node: EPNode): HTMLElement => {
    const wrapper = doc.createElement("div");
    wrapper.className = "codbi-epb__pickerwrap";

    const filter = doc.createElement("input");
    filter.type = "text";
    filter.className = "codbi-epb__pickerfilter";
    filter.placeholder = i18n("epBuilder.filterEp");
    filter.title = i18n("epBuilder.filterEp");
    filter.value = pickerFilters.get(node) ?? "";
    wrapper.appendChild(filter);

    const list = doc.createElement("div");
    list.className = "codbi-epb__picker";
    wrapper.appendChild(list);

    const candidates = availableIds();

    if (candidates.length === 0) {
      const empty = doc.createElement("div");
      empty.className = "codbi-epb__empty";
      empty.textContent = i18n("epBuilder.empty");
      list.appendChild(empty);

      return wrapper;
    }

    const items = new Array<{ element: HTMLElement; haystack: string }>();

    for (const candidate of candidates) {
      const item = doc.createElement("button");
      item.type = "button";
      item.className = "codbi-epb__pickeritem";

      const name = doc.createElement("span");
      name.className = "codbi-epb__pickername";
      name.textContent = candidate;
      item.appendChild(name);

      const summary = resolveEPSummary(candidate);

      if (summary) {
        const desc = doc.createElement("span");
        desc.className = "codbi-epb__pickersummary";
        desc.textContent = shorten(summary);
        item.appendChild(desc);
      }

      item.addEventListener("click", () => {
        node.id = candidate;
        openPickers.delete(node);
        pickerFilters.delete(node);
        prefillParams(node);
        render();
      });

      list.appendChild(item);
      items.push({ element: item, haystack: `${candidate} ${summary ?? ""}`.toLowerCase() });
    }

    const applyFilter = (query: string): void => {
      const needle = query.trim().toLowerCase();

      for (const entry of items) {
        entry.element.style.display = needle === "" || entry.haystack.includes(needle) ? "" : "none";
      }
    };

    filter.addEventListener("input", () => {
      pickerFilters.set(node, filter.value);
      applyFilter(filter.value);
    });

    applyFilter(filter.value);

    return wrapper;
  };

  // #region Rendering
  /**
   * Renders the CodBi documentation embed for the EP **id**, resolved to the designer-language URL
   * (honouring the plugin's per-language `docsAPI` redirect) — the same viewer the flat ALT+E listing
   * uses.
   *
   * @param id The EP id.
   *
   * @returns The documentation panel (a message when none is configured). */
  const renderDocsForId = (id: string): HTMLElement => {
    const wrap = doc.createElement("div");
    wrap.className = "codbi-epb__docspanel";

    const url = resolveEPDocUrl(id);

    if (!url) {
      const missing = doc.createElement("div");
      missing.className = "codbi-epb__empty";
      missing.textContent = i18n("epBuilder.noDocs");
      wrap.appendChild(missing);

      return wrap;
    }

    const frame = doc.createElement("object");
    frame.className = "codbi-epb__docsframe";
    frame.setAttribute("type", "text/html");
    frame.setAttribute("data", url);
    wrap.appendChild(frame);

    return wrap;
  };

  /**
   * Renders the inline CodBi documentation panel for **node**.
   *
   * @param node The EP node.
   *
   * @returns The documentation panel. */
  const renderDocs = (node: EPNode): HTMLElement => renderDocsForId(node.id);

  /**
   * Renders the retrieval-result panel for **node**.
   *
   * @param node The EP node.
   *
   * @returns The result panel. */
  const renderResult = (node: EPNode): HTMLElement => {
    const wrap = doc.createElement("div");
    wrap.className = "codbi-epb__resultpanel";

    const pre = doc.createElement("div");
    pre.className = "codbi-epb__result";
    pre.textContent = results.get(node) ?? "";
    wrap.appendChild(pre);

    return wrap;
  };

  /**
   * Retrieves the value the EP (including its nested EPs, resolved first — exactly as at runtime)
   * would produce, using the form runtime exposed by the canvas iframe.
   *
   * @param node The EP node. */
  const retrieveNode = async (node: EPNode): Promise<void> => {
    results.set(node, i18n("epBuilder.retrieving"));
    openResults.add(node);
    render();

    const ids = collectEPIds([node]);
    const requested = serializeEPNode(node, true);
    let runtimeDiag = "";

    try {
      const codbi = await ensureRuntime(options.anchor, ids);

      if (!codbi?.resolveEP) {
        results.set(node, i18n("epBuilder.retrieveUnavailable"));
        render();

        return;
      }

      const registry = (codbi as unknown as { availableEPs?: Record<string, unknown> }).availableEPs ?? {};
      const registered = ids.filter((id) => registry[id] !== undefined);
      const missing = ids.filter((id) => registry[id] === undefined);

      runtimeDiag = ` [runtime=${(window as unknown as CodbiRuntimeWindow).codbi === codbi ? "designer" : "canvas"}; registered=${registered.join(",") || "none"}; missing=${missing.join(",") || "none"}]`;
      console.warn(`[CodBi EP-builder] runtime${runtimeDiag} requested=${requested}`);

      // DOM-based EPs (e.g. V) read the document the runtime was injected into; mirror the form's
      // global variables there for the duration of the resolution so they resolve to real values.
      const cleanupVariables = mirrorGlobalVariables(options.anchor, window.document);

      try {
        const resolved = await Promise.race([
          codbi.resolveEP({ value: requested }),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error("timeout")), 10000);
          }),
        ]);

        console.warn("[CodBi EP-builder] resolved", { requested, resolved: resolved.value });
        results.set(node, formatResult(resolved.value));
      } finally {
        cleanupVariables();
      }
    } catch (error) {
      console.warn("[CodBi EP-builder] retrieval failed", { requested, error });
      results.set(node, `${i18n("epBuilder.retrieveError")}: ${String(error)}${runtimeDiag}`);
    }

    render();
  };

  /**
   * Renders a value segment list (text runs and EPs) into **container**, backed by **list**.
   *
   * When **allowLiteral** is false (a non-string parameter type) no literal input is offered — the
   * value must be produced by a nested Element-Placeholder.
   */
  const renderValueList = (container: HTMLElement, list: Array<ValueSegment>, allowLiteral = true): void => {
    container.className = "codbi-epb__seglist";

    // An empty value/parameter is directly editable: typing creates the literal-text segment.
    if (list.length === 0) {
      if (allowLiteral) {
        const input = doc.createElement("input");
        input.type = "text";
        input.className = "codbi-epb__textinput";
        input.placeholder = i18n("epBuilder.value");
        input.title = i18n("epBuilder.value");
        input.addEventListener("input", () => {
          if (list.length === 0) {
            list.push({ kind: "text", value: input.value });
          } else if (list[0].kind === "text") {
            list[0].value = input.value;
          }
        });
        container.appendChild(input);
      } else {
        const hint = doc.createElement("span");
        hint.className = "codbi-epb__empty";
        hint.textContent = i18n("epBuilder.epOnlyHint");
        container.appendChild(hint);
      }
    }

    list.forEach((segment, index) => {
      if (segment.kind === "text") {
        const remove = doc.createElement("button");
        remove.type = "button";
        remove.textContent = "✕";
        remove.title = i18n("epBuilder.remove");
        remove.addEventListener("click", () => {
          list.splice(index, 1);
          render();
        });

        if (allowLiteral) {
          const input = doc.createElement("input");
          input.type = "text";
          input.className = "codbi-epb__textinput";
          input.value = segment.value;
          input.title = i18n("epBuilder.value");
          input.addEventListener("input", () => {
            segment.value = input.value;
          });
          container.append(input, remove);
        } else {
          const literal = doc.createElement("span");
          literal.className = "codbi-epb__literal";
          literal.textContent = segment.value;
          container.append(literal, remove);
        }

        return;
      }

      container.appendChild(renderEPNode(segment, list, index));
    });
  };

  /** Renders a single EP node card, backed by **parentList** at **position**. */
  const renderEPNode = (node: EPNode, parentList: Array<ValueSegment>, position: number): HTMLElement => {
    const card = doc.createElement("div");
    card.className = "codbi-epb__node";

    // #region Head: EP badge + chooser + remove
    const nodeHead = doc.createElement("div");
    nodeHead.className = "codbi-epb__nodehead";

    const badge = doc.createElement("span");
    badge.className = "codbi-epb__badge";
    if (node.id.trim() === "") {
      badge.classList.add("codbi-epb__badge--empty");
      badge.textContent = i18n("epBuilder.epId");
    } else {
      badge.textContent = node.id;
    }

    const choose = doc.createElement("button");
    choose.type = "button";
    choose.textContent = "▾";
    choose.title = i18n("epBuilder.chooseEp");
    choose.addEventListener("click", () => {
      const opening = !openPickers.has(node);

      if (opening) {
        openPickers.add(node);
      } else {
        openPickers.delete(node);
      }

      render();

      // Move focus straight into the freshly opened chooser's filter box.
      if (opening) {
        overlay.querySelector<HTMLInputElement>(".codbi-epb__pickerfilter")?.focus();
      }
    });

    const removeNode = doc.createElement("button");
    removeNode.type = "button";
    removeNode.textContent = "✕";
    removeNode.title = i18n("epBuilder.remove");
    removeNode.addEventListener("click", () => {
      parentList.splice(position, 1);
      render();
    });

    const foldButton = doc.createElement("button");
    foldButton.type = "button";
    foldButton.className = "codbi-epb__fold";
    foldButton.textContent = collapsed.has(node) ? "▸" : "▾";
    foldButton.title = i18n("epBuilder.fold");
    foldButton.addEventListener("click", () => {
      if (collapsed.has(node)) {
        collapsed.delete(node);
      } else {
        collapsed.add(node);
      }

      render();
    });

    const retrieveButton = doc.createElement("button");
    retrieveButton.type = "button";
    retrieveButton.className = "codbi-epb__retrieve";
    retrieveButton.textContent = "⟳";
    retrieveButton.title = i18n("epBuilder.retrieve");
    retrieveButton.addEventListener("click", () => {
      openResults.add(node);
      void retrieveNode(node);
    });

    // Badge + chooser grouped in one rounded frame so they read as a single control.
    const epSel = doc.createElement("span");
    epSel.className = "codbi-epb__epsel";
    epSel.append(badge, choose);

    nodeHead.append(foldButton, epSel, retrieveButton, removeNode);
    card.appendChild(nodeHead);
    // #endregion Head

    // #region Folded view (badge + the built string)
    if (collapsed.has(node)) {
      const built = serializeEPNode(node);
      const folded = doc.createElement("div");
      folded.className = "codbi-epb__folded";

      const foldedText = doc.createElement("span");
      foldedText.className = "codbi-epb__foldedtext";
      foldedText.textContent = built;
      foldedText.title = i18n("epBuilder.fold");
      foldedText.addEventListener("click", () => {
        collapsed.delete(node);
        render();
      });
      folded.appendChild(foldedText);

      const copyButton = doc.createElement("button");
      copyButton.type = "button";
      copyButton.className = "codbi-epb__copy";
      copyButton.textContent = "⧉";
      copyButton.title = i18n("epBuilder.copy");
      copyButton.setAttribute("aria-label", i18n("epBuilder.copy"));
      copyButton.addEventListener("click", (event) => {
        event.stopPropagation();
        void copyToClipboard(built).then((ok) => {
          copyButton.classList.toggle("codbi-epb__copy--done", ok);
          copyButton.textContent = ok ? "✓" : "⧉";
          window.setTimeout(() => {
            copyButton.classList.remove("codbi-epb__copy--done");
            copyButton.textContent = "⧉";
          }, 1200);
        });
      });
      folded.appendChild(copyButton);

      card.appendChild(folded);

      if (openResults.has(node)) {
        card.appendChild(renderResult(node));
      }

      return card;
    }
    // #endregion Folded view (badge + the built string)

    // #region EP short description + docs + chooser list
    const summary = resolveEPSummary(node.id);
    const epDesc = doc.createElement("div");
    epDesc.className = "codbi-epb__epdesc";

    if (summary) {
      const descText = doc.createElement("span");
      descText.className = "codbi-epb__epdesctext";
      descText.textContent = shorten(summary);
      descText.title = summary;
      epDesc.appendChild(descText);
    }

    const docsButton = doc.createElement("button");
    docsButton.type = "button";
    docsButton.className = "codbi-epb__docsbtn";
    docsButton.appendChild(createInfoIcon(doc));
    docsButton.title = i18n("epBuilder.docs");
    docsButton.setAttribute("aria-label", i18n("epBuilder.docs"));
    if (openDocs.has(node)) {
      docsButton.classList.add("codbi-epb__docsbtn--on");
      docsButton.setAttribute("aria-pressed", "true");
    } else {
      docsButton.setAttribute("aria-pressed", "false");
    }
    docsButton.addEventListener("click", () => {
      if (openDocs.has(node)) {
        openDocs.delete(node);
      } else {
        openDocs.add(node);
      }

      render();
    });
    epDesc.appendChild(docsButton);
    card.appendChild(epDesc);

    if (openPickers.has(node)) {
      card.appendChild(renderPicker(node));
    }

    if (openDocs.has(node)) {
      card.appendChild(renderDocs(node));
    }

    if (openResults.has(node)) {
      card.appendChild(renderResult(node));
    }
    // #endregion EP short description + docs + chooser list

    const signature = resolveEPSignatureForId(node.id, options.anchor);

    // #region Unknown-signature banner + "Describe this EP…"
    if (!signature && node.id.trim() !== "") {
      const banner = doc.createElement("div");
      banner.className = "codbi-epb__banner";
      banner.textContent = i18n("epBuilder.unknownSignature");
      const describe = doc.createElement("button");
      describe.type = "button";
      describe.textContent = i18n("epBuilder.describe");
      describe.addEventListener("click", () => {
        card.appendChild(renderDescribeForm(node));
      });
      banner.appendChild(document.createTextNode(" "));
      banner.appendChild(describe);
      card.appendChild(banner);
    }
    // #endregion Unknown-signature banner + "Describe this EP…"

    // #region Params
    const params = doc.createElement("div");
    params.className = "codbi-epb__params";

    node.params.forEach((param, paramIndex) => {
      const signatureParam = signature?.params.find((candidate) => candidate.index === paramIndex + 1);
      const labelParts = [signatureParam?.name ?? String(paramIndex + 1)];

      if (signatureParam?.type && signatureParam.type !== "any") {
        labelParts.push(signatureParam.type);
      }

      if (signatureParam?.optional) {
        labelParts.push(i18n("epBuilder.optional"));
      }

      if (signatureParam?.variadic) {
        labelParts.push(i18n("epBuilder.variadic"));
      }

      const row = doc.createElement("div");
      row.className = "codbi-epb__param";

      const head = doc.createElement("div");
      head.className = "codbi-epb__paramhead";

      const label = doc.createElement("span");
      label.className = "codbi-epb__paramlabel";
      label.textContent = labelParts.join(" · ");
      head.appendChild(label);

      const description = pickLanguage(signatureParam?.description);

      if (description) {
        const desc = doc.createElement("span");
        desc.className = "codbi-epb__paramdesc";
        desc.textContent = shorten(description);
        desc.title = description;
        head.appendChild(desc);
      }

      const line = doc.createElement("div");
      line.className = "codbi-epb__paramline";

      const inner = doc.createElement("div");
      inner.className = "codbi-epb__seglist";
      renderValueList(inner, param, allowsLiteral(signatureParam?.type));
      line.appendChild(inner);

      const addNested = doc.createElement("button");
      addNested.type = "button";
      addNested.textContent = i18n("epBuilder.addNested");
      addNested.addEventListener("click", () => {
        param.push(createEPNode("", 0));
        render();
      });

      const removeParam = doc.createElement("button");
      removeParam.type = "button";
      removeParam.textContent = "✕";
      removeParam.title = i18n("epBuilder.remove");
      removeParam.addEventListener("click", () => {
        node.params.splice(paramIndex, 1);
        render();
      });

      line.append(addNested, removeParam);
      row.append(head, line);
      params.appendChild(row);
    });

    // Do not offer more parameters than the EP's signature allows (variadic EPs are unbounded).
    const maxParams = signature
      ? signature.params.some((candidate) => candidate.variadic)
        ? Number.POSITIVE_INFINITY
        : signature.params.length
      : Number.POSITIVE_INFINITY;

    if (node.params.length < maxParams) {
      const addParam = doc.createElement("button");
      addParam.type = "button";
      addParam.textContent = i18n("epBuilder.addParam");
      addParam.addEventListener("click", () => {
        node.params.push([]);
        render();
      });
      params.appendChild(addParam);
    }
    card.appendChild(params);
    // #endregion Params

    return card;
  };

  /** Renders the inline "Describe this EP…" signature editor for **node**. */
  const renderDescribeForm = (node: EPNode): HTMLElement => {
    const form = doc.createElement("div");
    form.className = "codbi-epb__desc";

    const drafts: Array<CodbiEPParamSpec> =
      node.params.length > 0
        ? node.params.map((_, index) => ({ index: index + 1, type: "any" }))
        : [{ index: 1, type: "any" }];

    const rows = doc.createElement("div");
    rows.className = "codbi-epb__params";

    const renderRows = (): void => {
      rows.textContent = "";

      drafts.forEach((draft, index) => {
        const row = doc.createElement("div");
        row.className = "codbi-epb__descrow";

        const indexInput = doc.createElement("input");
        indexInput.type = "number";
        indexInput.style.width = "4em";
        indexInput.value = String(draft.index);
        indexInput.addEventListener("change", () => {
          draft.index = Number.parseInt(indexInput.value, 10) || index + 1;
        });

        const nameInput = doc.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = i18n("epBuilder.name");
        nameInput.value = draft.name ?? "";
        nameInput.addEventListener("change", () => {
          draft.name = nameInput.value.trim() || undefined;
        });

        const typeSelect = doc.createElement("select");
        for (const type of TYPE_OPTIONS) {
          const option = doc.createElement("option");
          option.value = type;
          option.textContent = type;
          typeSelect.appendChild(option);
        }
        typeSelect.value = draft.type ?? "any";
        typeSelect.addEventListener("change", () => {
          draft.type = typeSelect.value;
        });

        const optional = doc.createElement("label");
        const optionalInput = doc.createElement("input");
        optionalInput.type = "checkbox";
        optionalInput.checked = draft.optional ?? false;
        optionalInput.addEventListener("change", () => {
          draft.optional = optionalInput.checked;
        });
        optional.append(optionalInput, doc.createTextNode(` ${i18n("epBuilder.optional")}`));

        const removeRow = doc.createElement("button");
        removeRow.type = "button";
        removeRow.textContent = "✕";
        removeRow.addEventListener("click", () => {
          drafts.splice(index, 1);
          renderRows();
        });

        row.append(indexInput, nameInput, typeSelect, optional, removeRow);
        rows.appendChild(row);
      });
    };

    renderRows();

    const addRow = doc.createElement("button");
    addRow.type = "button";
    addRow.textContent = i18n("epBuilder.addParam");
    addRow.addEventListener("click", () => {
      drafts.push({ index: drafts.length + 1, type: "any" });
      renderRows();
    });

    const save = doc.createElement("button");
    save.type = "button";
    save.className = "primary";
    save.textContent = i18n("epBuilder.save");
    save.addEventListener("click", () => {
      describeEP(
        node.id,
        { params: drafts.slice().sort((a, b) => a.index - b.index), returnType: "any", source: "runtime" },
        options.anchor,
      );
      render();
    });

    form.append(rows, addRow, save);
    return form;
  };

  /**
   * Renders the AST as a nested diagram (left column) beside a documentation pane (right column).
   * Clicking an EP badge shows that EP's docs; clicking a parameter shows the docs of the EP that
   * parameter refers to (the nested one), falling back to the owning EP.
   */
  const renderDiagram = (): HTMLElement => {
    const wrap = doc.createElement("div");
    wrap.className = "codbi-epb__diagramwrap";

    const diagram = doc.createElement("div");
    diagram.className = "codbi-epb__diagram";
    wrap.appendChild(diagram);

    const select = (id: string | undefined): void => {
      const key = (id ?? "").toLowerCase().trim();
      diagramSelection = key === "" ? undefined : key;
      render();
    };

    const firstEPId = (segments: Array<ValueSegment>): string | undefined => {
      for (const segment of segments) {
        if (segment.kind === "ep" && segment.id.trim() !== "") {
          return segment.id;
        }
      }

      return undefined;
    };

    const renderSegments = (list: Array<ValueSegment>, parent: HTMLElement): void => {
      for (const segment of list) {
        if (segment.kind === "text") {
          const input = doc.createElement("input");
          input.type = "text";
          input.className = "codbi-epb__diagram-input";
          input.value = segment.value;
          input.title = i18n("epBuilder.value");
          input.addEventListener("input", () => {
            segment.value = input.value;
          });
          parent.appendChild(input);
          continue;
        }

        const box = doc.createElement("div");
        box.className = "codbi-epb__diagram-ep";

        const epTitle = doc.createElement("span");
        epTitle.className = "codbi-epb__diagram-id";
        epTitle.textContent = segment.id.trim() === "" ? i18n("epBuilder.epId") : segment.id;
        const epSummary = resolveEPSummary(segment.id);
        if (epSummary) {
          epTitle.title = epSummary;
        }
        if (segment.id.trim() !== "" && segment.id.toLowerCase().trim() === diagramSelection) {
          epTitle.classList.add("codbi-epb__diagram-id--selected");
        }
        const owningId = segment.id;
        epTitle.addEventListener("click", (event) => {
          event.stopPropagation();
          select(owningId);
        });
        box.appendChild(epTitle);

        const diagramSignature = resolveEPSignatureForId(segment.id, options.anchor);

        if (segment.params.length > 0) {
          const children = doc.createElement("div");
          children.className = "codbi-epb__diagram-params";

          segment.params.forEach((param, paramIndex) => {
            const row = doc.createElement("div");
            row.className = "codbi-epb__diagram-param";

            const nestedId = firstEPId(param);

            const index = doc.createElement("span");
            index.className = "codbi-epb__diagram-index";
            index.textContent = String(paramIndex + 1);
            const paramDescription = pickLanguage(
              diagramSignature?.params.find((candidate) => candidate.index === paramIndex + 1)?.description,
            );
            if (paramDescription) {
              index.title = paramDescription;
            }
            index.addEventListener("click", (event) => {
              event.stopPropagation();
              select(nestedId ?? owningId);
            });
            row.appendChild(index);

            const inner = doc.createElement("div");
            inner.className = "codbi-epb__diagram-inner";

            if (param.length === 0) {
              const empty = doc.createElement("span");
              empty.className = "codbi-epb__diagram-literal codbi-epb__empty";
              empty.textContent = i18n("epBuilder.empty");
              inner.appendChild(empty);
            } else {
              renderSegments(param, inner);
            }

            if (nestedId !== undefined && nestedId.toLowerCase().trim() === diagramSelection) {
              row.classList.add("codbi-epb__diagram-param--selected");
            }

            row.appendChild(inner);
            children.appendChild(row);
          });

          box.appendChild(children);
        }

        parent.appendChild(box);
      }
    };

    renderSegments(root, diagram);

    // Restore the persisted split ratio (inline so it wins over the default CSS width).
    diagram.style.flex = `0 0 ${diagramSplitRatio * 100}%`;
    diagram.style.maxWidth = `${diagramSplitRatio * 100}%`;

    // Draggable divider: lets the user size the diagram vs. docs columns.
    const split = doc.createElement("div");
    split.className = "codbi-epb__diagramsplit";
    split.setAttribute("role", "separator");
    split.setAttribute("aria-orientation", "vertical");
    split.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      split.setPointerCapture(event.pointerId);

      const wrapRect = wrap.getBoundingClientRect();

      const onMove = (move: PointerEvent): void => {
        const ratio = Math.min(0.85, Math.max(0.15, (move.clientX - wrapRect.left) / wrapRect.width));

        diagramSplitRatio = ratio;
        diagram.style.flex = `0 0 ${ratio * 100}%`;
        diagram.style.maxWidth = `${ratio * 100}%`;
      };

      const onUp = (): void => {
        split.removeEventListener("pointermove", onMove);
        split.removeEventListener("pointerup", onUp);
        split.removeEventListener("pointercancel", onUp);
      };

      split.addEventListener("pointermove", onMove);
      split.addEventListener("pointerup", onUp);
      split.addEventListener("pointercancel", onUp);
    });
    wrap.appendChild(split);

    // Right-hand documentation pane — fills the remaining width AND the full available height.
    const docs = doc.createElement("div");
    docs.className = "codbi-epb__diagramdocs";

    if (diagramSelection) {
      const title = doc.createElement("div");
      title.className = "codbi-epb__diagramdocstitle";
      title.textContent = diagramSelection;
      docs.appendChild(title);

      const panel = renderDocsForId(diagramSelection);
      panel.classList.add("codbi-epb__docspanel--diagram");

      const frame = panel.querySelector<HTMLElement>(".codbi-epb__docsframe");

      if (frame) {
        frame.classList.add("codbi-epb__diagramdocsframe");
        frame.style.width = "100%";
        frame.style.height = "100%";
        frame.style.flex = "1 1 auto";
        frame.style.minHeight = "0";
      }

      docs.appendChild(panel);
    } else {
      const hint = doc.createElement("div");
      hint.className = "codbi-epb__empty";
      hint.textContent = i18n("epBuilder.docsHint");
      docs.appendChild(hint);
    }

    wrap.appendChild(docs);

    return wrap;
  };

  /** Renders the builder body without touching the keyboard tab order. */
  function renderInner(): void {
    body.textContent = "";

    if (rawMode) {
      const raw = doc.createElement("textarea");
      raw.style.width = "100%";
      raw.style.minHeight = "12em";
      raw.style.fontFamily = "monospace";
      raw.value = serializeEPValue(root);
      raw.addEventListener("change", () => {
        root = parseEPValue(raw.value);
      });
      body.appendChild(raw);
      return;
    }

    if (diagramMode) {
      body.appendChild(renderDiagram());
      return;
    }

    const topRow = doc.createElement("div");
    topRow.className = "codbi-epb__toprow";

    const list = doc.createElement("div");
    renderValueList(list, root);

    // Adds a plain (manual) CSV element to the top-level value — the counterpart to the EP button
    // below. A `data-cb-*` value is a CSV, so an extra element needs a leading comma unless it is
    // the very first element.
    const addText = doc.createElement("button");
    addText.type = "button";
    addText.className = "codbi-epb__addtext";
    addText.textContent = "+";
    addText.title = i18n("epBuilder.addText");
    addText.setAttribute("aria-label", i18n("epBuilder.addText"));
    addText.addEventListener("click", () => {
      const hasContent = root.some(
        (segment) => segment.kind === "ep" || (segment.kind === "text" && segment.value.trim() !== ""),
      );

      if (hasContent) {
        root.push({ kind: "text", value: ", " });
      }

      root.push({ kind: "text", value: "" });
      render();
    });

    topRow.append(list, addText);
    body.appendChild(topRow);

    const addEP = doc.createElement("button");
    addEP.type = "button";
    addEP.textContent = i18n("epBuilder.addEp");
    addEP.addEventListener("click", () => {
      // A `data-cb-*` value is a CSV, so a top-level EP needs a leading comma unless it is the first.
      const hasContent = root.some(
        (segment) => segment.kind === "ep" || (segment.kind === "text" && segment.value.trim() !== ""),
      );

      if (hasContent) {
        root.push({ kind: "text", value: ", " });
      }

      root.push(createEPNode("", 0));
      render();
    });
    body.appendChild(addEP);

    const ids = collectEPIds(root);

    if (ids.length > 0) {
      const hint = doc.createElement("div");
      hint.className = "codbi-epb__hint";

      for (const id of ids) {
        const badge = doc.createElement("span");
        badge.className = "codbi-epb__hintbadge";
        badge.textContent = id;
        hint.appendChild(badge);
      }

      body.appendChild(hint);
    }
  }

  /** Re-renders the builder and keeps every button out of the keyboard tab order. */
  function render(): void {
    renderInner();

    // Tab should only move between input fields; the buttons are mouse/touch only.
    for (const button of overlay.querySelectorAll<HTMLButtonElement>("button")) {
      button.tabIndex = -1;
    }
  }
  // #endregion Rendering

  render();

  doc.body.appendChild(overlay);
  doc.addEventListener("keydown", onKeydown, true);

  focusFirstField(overlay);

  return { close };
}

/** Focuses the first focusable text field in the overlay, if any. */
function focusFirstField(overlay: HTMLElement): void {
  const first = overlay.querySelector<HTMLInputElement>('input[type="text"], textarea');

  first?.focus();
}
