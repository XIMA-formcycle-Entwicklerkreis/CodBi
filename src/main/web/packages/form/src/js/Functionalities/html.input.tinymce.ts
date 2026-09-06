// #region Imports
// #region XIMA
import { getXUtil } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Input_TinyMCE.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Input_TinyMCE {
  /** Stores the {@link Promise } that resolves once TinyMCE has been loaded. */
  protected static loadPromise: Promise<void> | null = null;
  /**
   * Ensures the TinyMCE library is loaded on the page.
   *
   * @param resourceURL The base URL where the TinyMCE distribution is served (must contain ```tinymce.min.js```). */
  protected static async ensureTinyMCE(resourceURL: string): Promise<void> {
    // #region Already loaded.
    if (typeof (window as unknown as { tinymce?: unknown }).tinymce !== "undefined") {
      return;
    }
    // #endregion Already loaded.
    // #region Deduplicate concurrent load requests.
    if (HTML_Input_TinyMCE.loadPromise) {
      return HTML_Input_TinyMCE.loadPromise;
    }
    // #endregion Deduplicate concurrent load requests.
    HTML_Input_TinyMCE.loadPromise = new Promise<void>((resolve, reject) => {
      const baseURL = resourceURL.replace(/\/+$/, "");
      // #region Load skin CSS.
      const link = document.createElement("link");

      link.rel = "stylesheet";
      link.href = `${baseURL}/skins/ui/tinymce-5/skin.min.css`;

      document.head.appendChild(link);
      // #endregion Load skin CSS.
      // #region Load TinyMCE script.
      const script = document.createElement("script");

      script.src = `${baseURL}/tinymce.min.js`;

      script.onload = () => {
        // #region Set base URL so sub-resources (models, icons, skins) resolve correctly.
        (window as unknown as { tinymce: { baseURL: string } }).tinymce.baseURL = baseURL;
        // #endregion Set base URL so sub-resources (models, icons, skins) resolve correctly.
        resolve();
      };

      script.onerror = () => {
        HTML_Input_TinyMCE.loadPromise = null;

        reject(new Error(`Failed to load TinyMCE from ${baseURL}/tinymce.min.js`));
      };

      document.head.appendChild(script);
      // #endregion Load TinyMCE script.
    });

    return HTML_Input_TinyMCE.loadPromise;
  }
  /**
   * Removes the port number(s) from a URL if present.
   *
   * Handles both single ports (```:444```) and malformed double ports (```:444:444```).
   *
   * @param url The URL to strip the port from.
   *
   * @returns The URL without the port number. */
  protected static stripPortFromUrl(url: string): string {
    // #region Attempt URL API first (clean single ports).
    try {
      const parsed = new URL(url);

      if (parsed.port) {
        parsed.port = "";
      }

      return parsed.toString();
    } catch {
      return url.replace(/^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^:/]+)(:\d+)+/, "$1");
    } // Fallback: regex for malformed URLs (e.g. double port :444:444).
    // #endregion Attempt URL API first.
  }
  /**
   * Registers the "HTML.Input.TinyMCE"-Functionality which turns the tagged {@link HTMLTextAreaElement } into a
   * {@link https://www.tiny.cloud/docs/tinymce/latest/ TinyMCE} rich-text editor.
   *
   * This functionality replaces the tagged `<textarea>` with a fully featured TinyMCE WYSIWYG editor.
   * The editor's content is automatically synced back to the original textarea on every change.
   *
   * Config Parameter:
   *  - ```Plugins```:          A **CSV** of TinyMCE plugin names to load (e.g. ```advlist, autolink, lists, link, image, table, code```).
   *                            See the {@link https://www.tiny.cloud/docs/tinymce/latest/plugins/ official TinyMCE documentation}
   *                            for a full list of available plugins.
   *  - ```Toolbar```:          The toolbar configuration string defining which buttons and groups to display
   *                            (e.g. ```undo redo | blocks | bold italic forecolor | bullist numlist | table | code```).
   *                            Defaults to a basic formatting toolbar if not provided.
   *                            When ```UploadURL``` is configured, the custom toolbar buttons ```codbiupload``` (image upload)
   *                            and ```codbiuploadfile``` (file upload) are automatically available.
   *  - ```ResourceURL```:      The base URL where the TinyMCE distribution is served (must contain ```tinymce.min.js```,
   *                            ```skins/```, ```icons/```, ```models/```, and ```plugins/``` subdirectories).
   *                            Defaults to the CodBi Plugin Resource-servlet path serving the TinyMCE distribution bundled
   *                            with the plugin. Override this to point to a custom TinyMCE deployment if needed.
   *  - ```UploadURL```:        The server endpoint URL for file uploads (e.g. ```TTBoard_UPLOAD?uid=```).
   *                            Used by the ```codbiuploadfile``` toolbar button.
   *  - ```UploadImageURL```:   The server endpoint URL for image uploads.
   *                            Falls back to ```UploadURL``` if not set. Used by the ```codbiupload``` toolbar button.
   *  - ```UploadFieldName```:  The name of the form field for the uploaded file (default: ```fileToUpload```).
   *  - ```StripPort```:        If set to **"true"**, the port number (e.g. ```:444```) is removed from the URL
   *                            returned by the upload server before inserting it into the editor.
   *  - ```RenderToPdf```:      If set to **"true"**, a ```print```-listener is registered on ```$.xutil``` (via
   *                            {@link getXUtil }) that replaces the document body with the **plain-text** content of
   *                            this editor (the HTML markup is stripped) when the form is printed / exported to PDF.
   *                            The content is wrapped in a ```<div>``` tagged with the CSS-Class
   *                            ```CodBi_TinyMCE_RenderToPdf```, so a print-stylesheet can target it (e.g.
   *                            ```white-space: pre-wrap``` to preserve line-breaks/paragraphs). This makes it
   *                            possible to render the content of an editor that was filled via TinyMCE into a PDF. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "plugins :: toolbar :: resourceurl :: uploadurl :: uploadimageurl :: uploadfieldname")
    @TYPE.PRE("string | boolean", "stripport :: rendertopdf")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(HTMLTextAreaElement, undefined, "Is it not a <textarea> that is tagged with this functionality?")
    toProcess: Element,
  ): void {
    const textarea = toProcess as HTMLTextAreaElement;
    // #region Generate a unique ID for the editor if not already present.
    if (!textarea.id) {
      textarea.id = `tinymce-${Math.random().toString(36).substring(2, 11)}`;
    }
    // #endregion Generate a unique ID for the editor if not already present.
    // #region Parse plugins (handles both CSV string and pre-parsed array).
    // NOTE: "codbiupload" and "codbiuploadfile" are custom toolbar buttons registered via
    // editor.ui.registry.addButton() in the setup callback — they must NOT be in the plugins
    // list or TinyMCE will try to load them from disk (404). They may only appear in toolbar.
    const customButtons = new Set(["codbiupload", "codbiuploadfile"]);
    const toLoadPlugins = toLoad.plugins as string | string[] | undefined;
    const plugins: string[] = toLoadPlugins
      ? (Array.isArray(toLoadPlugins) ? toLoadPlugins : toLoadPlugins.split(","))
          .map((p) => p.trim())
          .filter((p) => p.length > 0 && !customButtons.has(p.toLowerCase()))
      : [];
    // #endregion Parse plugins (handles both CSV string and pre-parsed array).
    // #region Parse toolbar (fallback to a basic default).
    const toolbar: string =
      toLoad.toolbar && (toLoad.toolbar as string).trim().length > 0
        ? (toLoad.toolbar as string).trim()
        : "undo redo | bold italic underline strikethrough | bullist numlist | removeformat";
    // #endregion Parse toolbar (fallback to a basic default).
    // #region Determine resource URL (default to the CodBi Plugin Resource-servlet path).
    const resourceURL: string =
      toLoad.resourceurl && (toLoad.resourceurl as string).trim().length > 0
        ? (toLoad.resourceurl as string).trim()
        : `${window.location.href.split("/").slice(0, 4).join("/")}/plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/tinymce`;
    // #endregion Determine resource URL (default to the CodBi Plugin Resource-servlet path).
    // #region Parse upload configuration.
    const uploadURL: string | undefined =
      toLoad.uploadurl && (toLoad.uploadurl as string).trim().length > 0
        ? (toLoad.uploadurl as string).trim()
        : undefined;
    const uploadImageURL: string | undefined =
      toLoad.uploadimageurl && (toLoad.uploadimageurl as string).trim().length > 0
        ? (toLoad.uploadimageurl as string).trim()
        : uploadURL;
    const uploadFieldName: string =
      toLoad.uploadfieldname && (toLoad.uploadfieldname as string).trim().length > 0
        ? (toLoad.uploadfieldname as string).trim()
        : "fileToUpload";
    const stripPort: boolean =
      toLoad.stripport !== undefined &&
      (toLoad.stripport === true || String(toLoad.stripport).toLowerCase() === "true");
    // #endregion Parse upload configuration.
    // #region Parse "RenderToPdf" flag (render this editor's plain-text content on print/PDF-export).
    const renderToPdf: boolean =
      toLoad.rendertopdf !== undefined &&
      (toLoad.rendertopdf === true || String(toLoad.rendertopdf).toLowerCase() === "true");
    // #endregion Parse "RenderToPdf" flag (render this editor's plain-text content on print/PDF-export).
    // #region Load TinyMCE (if not already loaded) and initialize the editor.
    HTML_Input_TinyMCE.ensureTinyMCE(resourceURL)
      .then(() => {
        // biome-ignore lint/suspicious/noExplicitAny: TinyMCE types not available without bundling.
        const tm = (window as any).tinymce;

        tm.init({
          target: textarea,
          plugins: plugins,
          toolbar: toolbar,
          menubar: false,
          statusbar: true,
          branding: false,
          promotion: false,
          license_key: "gpl",
          // #region Prevent TinyMCE from modifying inserted URLs (avoids double port with absolute upload URLs).
          convert_urls: false,
          relative_urls: false,
          remove_script_host: false,
          // #endregion Prevent TinyMCE from modifying inserted URLs.
          // biome-ignore lint/suspicious/noExplicitAny: TinyMCE Editor type not available without bundling.
          setup: (editor: any) => {
            // #region Register custom upload buttons in the editor's UI (always, so toolbar buttons are visible).
            // #region Helper: show "not configured" notification when UploadURL is missing.
            const notifyNotConfigured = () => {
              editor.notificationManager.open({
                text: "Upload not configured: set the UploadURL/UploadImageURL parameter.",
                type: "error",
              });
            };
            // #endregion Helper.
            // #region Helper: create XHR upload function for a given endpoint URL.
            const createUploader = (endpoint: string | undefined): ((file: File) => Promise<string>) | undefined => {
              if (!endpoint) {
                return undefined;
              }

              return (file: File): Promise<string> => {
                return new Promise<string>((resolve, reject) => {
                  const formData = new FormData();

                  formData.append(uploadFieldName, file);

                  const xhr = new XMLHttpRequest();

                  xhr.open("POST", endpoint, true);
                  xhr.onreadystatechange = () => {
                    if (xhr.readyState !== 4) {
                      return;
                    }

                    if (xhr.status < 200 || xhr.status >= 300) {
                      reject(new Error(`Upload failed with status ${xhr.status}`));

                      return;
                    }

                    try {
                      const response = JSON.parse(xhr.responseText);
                      const url = response.file || response.url || response;

                      resolve(stripPort ? HTML_Input_TinyMCE.stripPortFromUrl(url) : url);
                    } catch {
                      resolve(stripPort ? HTML_Input_TinyMCE.stripPortFromUrl(xhr.responseText) : xhr.responseText);
                    }
                  };

                  xhr.onerror = () => reject(new Error("Upload request failed"));
                  xhr.send(formData);
                });
              };
            };
            // #endregion Helper: create XHR upload function for a given endpoint URL.
            const fileUpload = createUploader(uploadURL);
            const imageUpload = createUploader(uploadImageURL);
            // #region "Upload File" button — any file, inserts <a> link.
            editor.ui.registry.addButton("codbiuploadfile", {
              icon: "upload",
              tooltip: "Upload File",

              onAction: () => {
                if (!fileUpload) {
                  notifyNotConfigured();

                  return;
                }

                const input = document.createElement("input");

                input.type = "file";
                input.addEventListener("change", async () => {
                  const file = input.files?.[0];

                  if (!file) {
                    return;
                  }

                  try {
                    const url = await fileUpload(file);

                    editor.insertContent(`<a href="${url}" target="_blank">${file.name}</a>`);
                  } catch (error) {
                    editor.notificationManager.open({
                      text: `Upload failed: ${(error as Error).message}`,
                      type: "error",
                    });
                  }
                });

                input.click();
              },
            });
            // #endregion "Upload File" button — any file, inserts <a> link.
            // #region "Upload Image" button — images only, inserts <img>.
            editor.ui.registry.addButton("codbiupload", {
              icon: "image",
              tooltip: "Upload Image",
              onAction: () => {
                if (!imageUpload) {
                  notifyNotConfigured();

                  return;
                }

                const input = document.createElement("input");

                input.type = "file";
                input.accept = "image/*";
                input.addEventListener("change", async () => {
                  const file = input.files?.[0];

                  if (!file) {
                    return;
                  }

                  try {
                    const url = await imageUpload(file);

                    editor.insertContent(`<img src="${url}" alt="${file.name.replace(/\.[^/.]+$/, "")}" />`);
                  } catch (error) {
                    editor.notificationManager.open({
                      text: `Upload failed: ${(error as Error).message}`,
                      type: "error",
                    });
                  }
                });

                input.click();
              },
            });
            // #endregion "Upload Image" button — images only, inserts <img>.
            // #endregion Register custom upload buttons in the editor's UI.
            // #region Sync content back to the textarea on every change.
            editor.on("Change", () => {
              textarea.value = editor.getContent();

              textarea.dispatchEvent(new Event("change", { bubbles: true }));
            });
            // #endregion Sync content back to the textarea on every change.
            // #region Sync on undo/redo.
            editor.on("Undo Redo", () => {
              textarea.value = editor.getContent();

              textarea.dispatchEvent(new Event("change", { bubbles: true }));
            });
            // #endregion Sync on undo/redo.
            // #region Clean up on editor remove.
            editor.on("remove", () => {
              textarea.style.display = "";
            });
            // #endregion Clean up on editor remove.
            // #region "RenderToPdf": On print, replace the document body with this editor's plain-text content.
            // Registering per editor (only when the tagged field enables the parameter) mirrors the classic snippet
            // `$.xutil.on('print', (data) => { document.body.innerHTML = "<div>" + ...textContent + "</div>"; });`
            // — the HTML content is stripped to its text, so a PDF export contains the editor's text.
            // The wrapper <div> is tagged with "CodBi_TinyMCE_RenderToPdf" so a print-stylesheet can style it.
            if (renderToPdf) {
              getXUtil().on("print", () => {
                const editorHTML = editor.getContent();
                const plainText = new DOMParser().parseFromString(editorHTML, "text/html").body.textContent ?? "";

                document.body.innerHTML = `<div class="CodBi_TinyMCE_RenderToPdf">${plainText}</div>`;
              });
            }
            // #endregion "RenderToPdf": On print, replace the document body with this editor's plain-text content.
          },
        });
      })
      .catch((error: unknown) => {
        console.error(`[HTML.Input.TinyMCE] Failed to initialize TinyMCE on #${textarea.id}:`, error);
      });
    // #endregion Load TinyMCE (if not already loaded) and initialize the editor.
  }
  // #region Initialization
  /**
   * States whether this {@link HTML_Input_TinyMCE } was successfully registered
   * via {@link window.codbi.registerFunctionality } with the CodBi and performs the registration upon class usage.
   *
   * @returns Always **true** when registration was successful. */
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.Input.TinyMCE", HTML_Input_TinyMCE.functionality);
  })();
  // #endregion Initialization
}
