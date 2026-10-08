// #region Imports
import { $ } from "@de-xima/fc-form-designer";
import { Constants } from "codbi-common";
// #endregion Imports

/** One option for a Mirror dropdown. `text` is shown; the extra fields feed the hover preview. */
export interface IMirrorOption {
  value: string;
  text: string;
  name?: string;
  className?: string;
  label?: string;
  parent?: string;
  /** Depth in the source form's hierarchy (0 = root); used for tree rendering. */
  depth?: number;
  /** Whether the option is a container with children; used for tree rendering. */
  hasChildren?: boolean;
}

/** Listeners notified whenever the chosen source form changes (used by the dependent dropdown). */
const formListeners = new Set<(form: string) => void>();

/** Registers a listener that is called with the newly chosen source form key. */
export function onMirrorFormChanged(listener: (form: string) => void): void {
  formListeners.add(listener);
}

/**
 * The source form currently chosen in the Mirror widget's form dropdown.
 */
let currentMirrorForm = "";

/** Stores the currently selected source form key and notifies the dependent dropdowns. */
export function setCurrentMirrorForm(value: string): void {
  currentMirrorForm = value;
  for (const listener of formListeners) {
    try {
      listener(value);
    } catch {
      /* a broken listener must not break the others */
    }
  }
}

/** @returns the currently selected source form key ("" when none is chosen). */
export function getCurrentMirrorForm(): string {
  return currentMirrorForm;
}

/** Reads the source form from the designer's persisted properties of the currently selected item. */
export function formFromDesigner(designer: unknown): string {
  try {
    const d = designer as {
      getSelectedItems?: () => JQuery;
      getItem?: (el: unknown) => { getPersist?: () => { properties?: Record<string, unknown> } } | undefined;
    };
    const selected = d.getSelectedItems?.();
    const item = selected ? d.getItem?.(selected) : undefined;
    const properties = item?.getPersist?.()?.properties;
    return String(properties?.[String(Constants["mirror.property.form"])] ?? "");
  } catch {
    return "";
  }
}

/**
 * Publishes the CodBi logo as the CSS custom property `--codbi-logo-url` (absolute URL) so the
 * injected designer CSS can use it as the settings-panel watermark. Idempotent.
 */
export function ensureCodbiBranding(): void {
  const root = document.documentElement;
  if (root.style.getPropertyValue("--codbi-logo-url")) {
    return;
  }
  const baseURL = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  const path = "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg";
  const url = `${baseURL}plugin?name=Resource&Path=${encodeURIComponent(path)}`;
  root.style.setProperty("--codbi-logo-url", `url("${url}")`);
}

/** Builds the plugin servlet URL used by the dropdowns. */
function mirrorActionUrl(): string {
  const baseURL = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  const action = encodeURIComponent(String(Constants["mirror.servlet_action.name"]));
  return `${baseURL}plugin?name=${action}`;
}

/** GETs JSON from the Mirror servlet action, resolving with `[]` on failure. */
function fetchOptions(url: string): Promise<unknown[]> {
  return new Promise((resolve) => {
    $.ajax({ url, type: "GET", dataType: "json" })
      .done((data: unknown) => {
        const array = Array.isArray(data) ? data : [];
        console.log("[CodBi] Mirror options", url, array.length);
        resolve(array);
      })
      .fail((xhr: JQuery.jqXHR) => {
        console.error("[CodBi] Mirror options request failed", url, xhr?.status, xhr?.responseText);
        resolve([]);
      });
  });
}

/** Options for the “source form” dropdown: every form of the current client. */
export async function mirrorFormOptions(): Promise<IMirrorOption[]> {
  const options = (await fetchOptions(`${mirrorActionUrl()}&action=forms`))
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      value: String(entry.key ?? ""),
      text: String(entry.name ?? entry.key ?? ""),
    }));
  if (options.length === 0) {
    console.warn("[CodBi] Mirror: the source-form list is empty — check the CodBi_Mirror servlet action.");
  }
  return options;
}

/**
 * Fetches the designer-style PREVIEW HTML of one element of a foreign form (how the element renders
 * in the form designer). Returns "" when the reference is incomplete or rendering fails.
 */
export async function mirrorElementPreview(form: string, element: string): Promise<string> {
  if (!form || !element) {
    return "";
  }
  const url =
    `${mirrorActionUrl()}&action=preview&form=${encodeURIComponent(form)}` + `&element=${encodeURIComponent(element)}`;
  return new Promise((resolve) => {
    $.ajax({ url, type: "GET", dataType: "text" })
      .done((data: unknown) => resolve(typeof data === "string" ? data : ""))
      .fail(() => resolve(""));
  });
}

/** Removes HTML tags (element labels are rich text and must not leak markup into the UI). */
function stripTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cache of a form's user CSS, keyed by form key. */
const formCssCache = new Map<string, string>();

/**
 * Fetches the form's own (user) CSS so the preview iframe can reproduce the element's styling.
 * Cached per form.
 */
export async function mirrorFormCss(form: string): Promise<string> {
  if (!form) {
    return "";
  }
  const cached = formCssCache.get(form);
  if (cached !== undefined) {
    return cached;
  }
  const url = `${mirrorActionUrl()}&action=css&form=${encodeURIComponent(form)}`;
  const css: string = await new Promise((resolve) => {
    $.ajax({ url, type: "GET", dataType: "text" })
      .done((data: unknown) => resolve(typeof data === "string" ? data : ""))
      .fail(() => resolve(""));
  });
  formCssCache.set(form, css);
  return css;
}

/** Cache of a form's root CSS classes, keyed by form key. */
const formWrapperCache = new Map<string, string>();

/**
 * Fetches the CSS classes FORMCYCLE puts on the SOURCE form's root element (`xm-form modern …`). The
 * theme CSS and the form's own (user defined) CSS are scoped under these classes, so the preview
 * must reuse them or the mirrored element renders unstyled. Cached per form.
 */
export async function mirrorFormWrapper(form: string): Promise<string> {
  if (!form) {
    return "";
  }
  const cached = formWrapperCache.get(form);
  if (cached !== undefined) {
    return cached;
  }
  const url = `${mirrorActionUrl()}&action=wrapper&form=${encodeURIComponent(form)}`;
  const cls: string = await new Promise((resolve) => {
    $.ajax({ url, type: "GET", dataType: "text" })
      .done((data: unknown) => resolve(typeof data === "string" ? data.trim() : ""))
      .fail(() => resolve(""));
  });
  formWrapperCache.set(form, cls);
  return cls;
}

/** An element option while the source form's hierarchy is being rebuilt. */
interface ElementNode extends IMirrorOption {
  parentId: string;
}

/**
 * Reorders a flat element list into the source form's hierarchy (depth-first, parents before their
 * children) and records each option's `depth`/`hasChildren` so a dropdown can render it as a tree.
 */
function orderAsTree(nodes: ElementNode[]): IMirrorOption[] {
  const byId = new Map(nodes.map((node) => [node.value, node]));
  const children = new Map<string, ElementNode[]>();
  const roots: ElementNode[] = [];
  for (const node of nodes) {
    const parentId = node.parentId && byId.has(node.parentId) ? node.parentId : "";
    const bucket = children.get(parentId);
    if (bucket) {
      bucket.push(node);
    } else {
      children.set(parentId, [node]);
    }
    if (!parentId) {
      roots.push(node);
    }
  }

  const ordered: IMirrorOption[] = [];
  const seen = new Set<string>();
  const visit = (list: ElementNode[], depth: number): void => {
    for (const node of list) {
      if (seen.has(node.value)) {
        continue;
      }
      seen.add(node.value);
      const kids = children.get(node.value) ?? [];
      ordered.push({ ...node, depth, hasChildren: kids.length > 0 });
      visit(kids, depth + 1);
    }
  };
  visit(roots, 0);
  // Anything not reached (e.g. a broken parent link forming a cycle) is appended at the root level.
  for (const node of nodes) {
    if (!seen.has(node.value)) {
      ordered.push({ ...node, depth: 0, hasChildren: false });
    }
  }
  return ordered;
}

/** Options for the dependent “source element” dropdown: the elements of the selected source form. */
export async function mirrorElementOptions(form: string): Promise<IMirrorOption[]> {
  if (!form) {
    return [];
  }
  const entries = (await fetchOptions(`${mirrorActionUrl()}&action=elements&form=${encodeURIComponent(form)}`)).filter(
    (entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null,
  );

  const nodes: ElementNode[] = entries.map((entry) => {
    const name = String(entry.name ?? entry.id ?? "");
    const className = String(entry.className ?? "");
    return {
      value: String(entry.id ?? ""),
      // The option label is the element NAME (the raw label is rich text and not shown here).
      text: className ? `${name} (${className})` : name,
      name,
      className,
      label: entry.label == null ? undefined : stripTags(String(entry.label)),
      parent: entry.parent == null ? undefined : String(entry.parent),
      parentId: String(entry.parentid ?? ""),
    };
  });

  return orderAsTree(nodes);
}
