// #region Imports
import {
  $,
  getDesignerConfig,
  Callbacks,
  Editors,
  type IPropertyDescriptor,
  type TEditorCfg,
} from "@de-xima/fc-form-designer";
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
   * The mirror form key of the form currently being edited. Formcycle's mirror forms are addressed
   * by a `project-<id>` technical key (see `MirrorFormAccess.formKey`).
   *
   * The id is resolved in the SAME order the assistant uses (see the designer's
   * `ai-assistant/form-key.ts`): first Formcycle's global `XFC_METADATA.currentProject.id`, which is
   * present for every real form, then the designer configuration's `formId`. (The configuration is
   * not a reliable source on its own — hence the metadata fallback.)
   *
   * @returns e.g. `project-123`, or `""` when the current form id is unknown.
   */
  private static currentFormKey(): string {
    try {
      const meta = (
        window as unknown as {
          XFC_METADATA?: {
            currentProject?: { id?: number | string; currentForm?: { id?: number | string } };
            currentForm?: { id?: number | string };
          };
        }
      ).XFC_METADATA;
      const projectId = meta?.currentProject?.id ?? meta?.currentProject?.currentForm?.id ?? meta?.currentForm?.id;
      if (projectId !== undefined && projectId !== null && String(projectId).trim() !== "") {
        return `project-${String(projectId).trim()}`;
      }
      const formId = getDesignerConfig().formId;
      if (!formId) {
        return "";
      }
      return `project-${formId}`;
    } catch {
      return "";
    }
  }

  /**
   * Builds the hover-preview BODY for one element option: the source element's markup rendered inside
   * an ISOLATED iframe, styled with the CURRENT form's look (the form being edited). The styling is
   * fetched server-side via the SAME path the backend uses to style a published form — the FORMCYCLE
   * frontend theme CSS plus the current form's own user CSS, wrapped in the current form's root
   * classes (`xm-form modern …`). Scraping the live design-canvas DOM would not work, because the
   * canvas runs in a cross-origin sandboxed iframe whose stylesheets are unreadable from here.
   * `<script>` blocks are stripped for safety. The caption (element name + type badge + enlarge
   * button) is owned by the dropdown.
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
      // Style the preview with the CURRENT form's look (the form being edited), not the source
      // form's. Both the CSS and the root wrapper come from the backend keyed by the current form.
      const currentKey = MirrorElementSelect.currentFormKey();
      void Promise.all([mirrorFormCss(currentKey), mirrorFormWrapper(currentKey)]).then(([styles, wrapper]) => {
        void mirrorElementPreview(form, option.value).then((html) => {
          if (!html) {
            writeFallback(option.className ?? option.text);
            return;
          }
          const safe = html.replace(/<script[\s\S]*?<\/script>/gi, "");
          const wrapperClass = wrapper || "xm-form";
          // FORMCYCLE's theme CSS is STRUCTURE dependent, so the preview markup must reproduce the
          // REAL rendered form page (otherwise the fetched CSS is loaded but never matches):
          //  - the classic theme (030-default.css) uses element selectors `FORM.xm-form` and
          //    `BODY.xm-body`, plus `.body`,
          //  - the modern theme (031-extended.css) uses `.xm-form.modern`, `.body.modern` and
          //    `.body .xm-form.modern`,
          //  - the CodBi standards (Holistic.CSS.Standard) additionally target `body.modern.xm-body`.
          // The old markup was `<body>` (no classes) around `<div class="xm-form …">`, so NONE of
          // those matched and the current form's CSS never applied. We now emit a <body> carrying
          // `body xm-body` (+ `modern` when the form is modern) and wrap the element in a real
          // <form> element, giving exactly the hierarchy a published form has.
          const modern = /(?:^|\s)modern(?:\s|$)/.test(wrapperClass);
          const bodyClass = `body xm-body${modern ? " modern" : ""}`;
          console.log("[CodBi] Mirror preview", {
            currentFormKey: currentKey,
            stylesChars: styles.length,
            htmlChars: safe.length,
            wrapper: wrapperClass,
            bodyClass,
          });
          // The backend CSS is wrapped in its own <style> element; otherwise the browser would
          // treat the embedded base64 @font-face/data-URI rules as renderable body text and print
          // them at the top of the preview. `onsubmit="return false"` keeps a mirrored submit
          // button from navigating the preview iframe when the user operates it.
          frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><base href="${baseHref}"><style>${styles}</style><style>html,body{margin:0;padding:10px;background:#fff}</style></head><body class="${bodyClass}"><form class="${wrapperClass}" action="#" onsubmit="return false">${safe}</form></body></html>`;
        });
      });
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
