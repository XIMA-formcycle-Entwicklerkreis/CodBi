// #region Imports
import { $, Callbacks, Editors, type IPropertyDescriptor, type TEditorCfg } from "@de-xima/fc-form-designer";
import { MirrorDropdown } from "./MirrorDropdown.js";
import { i18n } from "./i18n.js";
import {
  formFromDesigner,
  getCurrentMirrorForm,
  mirrorElementOptions,
  mirrorElementPreview,
  mirrorFormCss,
  mirrorFormWrapper,
  onMirrorFormChanged,
  setCurrentMirrorForm,
  type IMirrorOption,
} from "./MirrorSelect.js";
// #endregion Imports

/** Editor type for the Mirror widget's dependent “source element” dropdown. */
export const MirrorElementSelectType =
  "com.github.xima_formcycle_entwicklerkreis.fc.plugin:fc-plugin-codbi:MirrorElementSelect";

/** Describes {@link MirrorElementSelectType}. */
export interface IMirrorElementSelectDescriptor extends IPropertyDescriptor<typeof MirrorElementSelectType> {}

/** Augments **@de-xima/fc-form-designer** so the editor is known to the {@link IEditorMap}. */
declare module "@de-xima/fc-form-designer" {
  export interface IEditorMap {
    [MirrorElementSelectType]: {
      descriptor: IMirrorElementSelectDescriptor;
      editor: MirrorElementSelect;
      value: string;
    };
  }
}

/**
 * Custom editor for the Mirror widget's dependent “source element” dropdown. Reloads its options
 * whenever the source form changes (via {@link onMirrorFormChanged}) and shows a hover preview of
 * the hovered element (label, widget class, name, parent container).
 */
export class MirrorElementSelect extends Editors.BaseEditor<typeof MirrorElementSelectType> {
  private readonly dropdown: MirrorDropdown;
  private _value = "";

  constructor(config: TEditorCfg<IMirrorElementSelectDescriptor>) {
    super(config, "", "text");
    this.dropdown = new MirrorDropdown(
      (value) => {
        this._value = value;
        Callbacks["set-property"].fire(this.config.property, value, this);
      },
      (option) => this.previewBody(option),
      {
        // Mirror the source form's structure and let the user narrow the list down.
        tree: true,
        filter: true,
        filterPlaceholder: i18n("designer.widget.mirror.filter"),
        filterEmptyText: i18n("designer.widget.mirror.noResults"),
        maximizeLabel: i18n("designer.widget.mirror.enlarge"),
        restoreLabel: i18n("designer.widget.mirror.restore"),
      },
    );

    onMirrorFormChanged((form) => void this.reload(form));

    const initial = formFromDesigner(this.config.designer) || getCurrentMirrorForm();
    if (initial) {
      setCurrentMirrorForm(initial);
      void this.reload(initial);
    }
  }

  /** Reloads the element options for the given source form. */
  private async reload(form: string): Promise<void> {
    const options = form ? await mirrorElementOptions(form) : [];
    this.dropdown.setOptions(options);
    this.dropdown.setValue(this._value);
  }

  /**
   * Collects a document's stylesheets (external links — ABSOLUTISED so they resolve inside the
   * preview's `srcdoc` iframe — plus inline `<style>` blocks and constructable stylesheets).
   */
  private static stylesFrom(doc: Document): string {
    const parts: string[] = [];
    for (const link of Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))) {
      const href = link.getAttribute("href");
      if (href) {
        let absolute = href;
        try {
          absolute = new URL(href, doc.baseURI).href;
        } catch {
          /* keep as-is */
        }
        parts.push(`<link rel="stylesheet" href="${absolute}">`);
      }
    }
    for (const style of Array.from(doc.querySelectorAll("style"))) {
      parts.push(`<style>${style.textContent ?? ""}</style>`);
    }
    // Serialise every stylesheet's rules (covers CSSOM-injected sheets and constructable sheets);
    // cross-origin sheets throw on cssRules and are already covered by the absolutised <link> above.
    const serialise = (sheet: CSSStyleSheet): void => {
      try {
        const rules = Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
        if (rules) {
          parts.push(`<style>${rules}</style>`);
        }
      } catch {
        /* ignore inaccessible sheet */
      }
    };
    for (const sheet of Array.from(doc.styleSheets)) {
      serialise(sheet);
    }
    const adopted = (doc as Document & { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets;
    for (const sheet of Array.from(adopted ?? [])) {
      serialise(sheet);
    }
    return parts.join("");
  }

  /**
   * Classes of the FORMCYCLE form root element (`form.xm-form …`) as rendered by the designer. The
   * theme CSS scopes element/input styling under this wrapper (e.g.
   * `.xm-form.modern input.XItem.XTextField`), so the preview must carry the same wrapper classes or
   * the mirrored markup renders unstyled. Falls back to the plain `xm-form` class.
   */
  private static formWrapperClass(): string {
    const find = (doc: Document): string => {
      const root = doc.querySelector("form.xm-form, .xm-form");
      return root ? String(root.className).replace(/["<>]/g, "").trim() : "";
    };
    const own = find(document);
    if (own) {
      return own;
    }
    for (const iframe of Array.from(document.querySelectorAll("iframe"))) {
      try {
        const doc = (iframe as HTMLIFrameElement).contentDocument;
        if (doc) {
          const cls = find(doc);
          if (cls) {
            return cls;
          }
        }
      } catch {
        /* cross-origin iframe — skip */
      }
    }
    return "xm-form";
  }

  /**
   * Collects the stylesheets that style form elements: the designer shell's own stylesheets PLUS
   * those of every same-origin iframe (the form canvas lives in an iframe, and its form/element CSS
   * is inside it). This is what makes the preview look like the designer.
   */
  private static designerStyles(): string {
    let css = MirrorElementSelect.stylesFrom(document);
    for (const iframe of Array.from(document.querySelectorAll("iframe"))) {
      try {
        const doc = (iframe as HTMLIFrameElement).contentDocument;
        if (doc) {
          css += MirrorElementSelect.stylesFrom(doc);
        }
      } catch {
        /* cross-origin iframe — skip */
      }
    }
    return css;
  }

  /**
   * Builds the hover-preview BODY for one element option: the element rendered the way the designer
   * renders it, in an ISOLATED iframe together with the designer's own stylesheets so the element's
   * CSS (classes, layout, theme) applies exactly as in the designer. `<script>` blocks are stripped
   * for safety. The caption (element name + type badge + enlarge button) is owned by the dropdown.
   */
  private previewBody(option: IMirrorOption): Node | null {
    const frame = document.createElement("iframe");
    frame.className = "codbi-mirror-preview__frame";
    frame.setAttribute("sandbox", "allow-same-origin allow-forms");
    frame.setAttribute("title", option.label ?? option.name ?? option.text);

    const baseHref = document.baseURI;
    const writeFallback = (text: string): void => {
      frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><base href="${baseHref}"><style>
        html,body{margin:0;padding:10px;background:#fff;color:#111827;
        font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px}
      </style></head><body>${text}</body></html>`;
    };

    const form = getCurrentMirrorForm();
    if (form && option.value) {
      void Promise.all([mirrorElementPreview(form, option.value), mirrorFormCss(form), mirrorFormWrapper(form)]).then(
        ([html, formCss, sourceWrapper]) => {
          if (!html) {
            writeFallback(option.className ?? option.text);
            return;
          }
          const safe = html.replace(/<script[\s\S]*?<\/script>/gi, "");
          const styles = MirrorElementSelect.designerStyles();
          // Prefer the SOURCE form's own root classes (the theme CSS and the form's user defined CSS
          // are scoped under them); fall back to the designer canvas' classes when unavailable.
          const wrapper = sourceWrapper || MirrorElementSelect.formWrapperClass();
          console.log("[CodBi] Mirror preview", {
            stylesChars: styles.length,
            formCssChars: formCss.length,
            htmlChars: safe.length,
            wrapper,
          });
          frame.srcdoc =
            `<!doctype html><html><head><meta charset="utf-8"><base href="${baseHref}">` +
            `${styles}<style>${formCss}</style>` +
            `<style>html,body{margin:0;padding:10px;background:#fff}</style></head>` +
            `<body><div class="${wrapper}">${safe}</div></body></html>`;
        },
      );
    } else {
      writeFallback(option.className ?? option.text);
    }
    return frame;
  }

  getElement(): JQuery {
    return $(this.dropdown.root);
  }

  getValue(): string {
    return this._value;
  }

  setValue(value: unknown): void {
    this._value = value == null ? "" : String(value);
    this.dropdown.setValue(this._value);
  }
}
