// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE.js";
// #endregion XDBC
// #endregion Imports

// Provide basic layout for the injected widget as early as possible so that no visual jump occurs once the
// translator has been (re)built.
{
  const style: HTMLStyleElement = document.createElement("style");
  style.textContent = `
    .CodBi_Google_Website_Translator {
      display: inline-flex;
      align-items: center;
      gap: .5em;
    }
    .CodBi_Google_Website_Translator > .goog-te-gadget-simple {
      border: 1px solid rgba(0, 0, 0, .35);
      border-radius: .25em;
      padding: .25em .5em;
      font-family: inherit;
      font-size: inherit;
      cursor: pointer;
    }
    .CodBi_Google_Website_Translator > .goog-te-gadget-simple .goog-te-menu-value span {
      color: inherit;
    }
    /* Make sure the translated-menu is reachable even though the form may have overflow/hidden or z-index contexts. */
    .goog-te-menu-frame {
      z-index: 2147483001 !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Provides the {@link Google_Website_Translator.functionality }.
 *
 * @remarks
 * The functionality embeds Google's "Website Translator" widget (the classic language-dropdown that dynamically
 * translates the whole page into one of dozens of languages) into the tagged element, usually the form's header.
 *
 * Unlike the (discontinued, effectively clientside) widget, no API-key is required: Google loads its translation
 * engine through a dynamically injected `<script>`. As soon as a visitor picks a language, Google's iframe-based
 * engine translates the content of the current page on the fly.
 *
 * ### Loading behaviour
 * The Google translation-script is *not* injected on page-load. Instead it is loaded lazily as soon as the tagged
 * element becomes visible / the widget-setup succeeds. This keeps page-load fast and avoids third-party requests for
 * visitors who never translate. Use the **AutoLoad**-Parameter to force immediate loading instead.
 *
 * ### Config Parameter:
 *  - AutoLoad : The optional {@link boolean } stating whether the Google translation-script shall be loaded
 *               immediately (defaults to FALSE — i.e. the script only loads once the tagged element is visible).
 *  - Lang     : The optional {@link string } containing the ISO-639 language-code to use as the initial language of
 *               the dropdown (defaults to the browser's/preferred language or "en").
 *  - Inline   : The optional {@link boolean } stating whether the widget shall be shown inline within the tagged
 *               element (defaults to TRUE). When FALSE, the widget is appended to the tagged element on its own line.
 *
 * @param toLoad    Provided by the CodBi.
 * @param toProcess Provided by the CodBi (the element tagged with this functionality, usually the form's header). */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Google_Website_Translator {
  /** The Google Website-Translator element-id. */
  private static readonly ELEMENT_ID: string = "google_translate_element";
  /** The attribute storing the ISO-639 language-code currently selected for this widget. */
  private static readonly LANG_ATTR: string = "data-codbi-translator-lang";

  /**
   * Loads (idempotently) the Google translation-engine script and, once it has loaded, (re)builds the dropdown.
   *
   * @param toProcess The tagged element hosting the widget.
   * @param lang      The ISO-639 language-code to preselect.
   * @param inline    Whether the widget shall be rendered inline.
   * @returns The injected widget-container element, or {@link null} if the script could not be (re)used. */
  private static loadTranslator(toProcess: Element, lang: string, inline: boolean): HTMLElement {
    const container: HTMLElement = Google_Website_Translator.ensureContainer(toProcess, inline);

    // Bind a global callback so the "cb=" in the script-URL triggers our builder once the engine is loaded.
    (window as unknown as { codbiGoogleTranslateElementInit?: () => void }).codbiGoogleTranslateElementInit =
      Google_Website_Translator.buildTranslator(lang);

    // Load (idempotently) the Google translation-engine script exactly once for the whole page.
    const script: HTMLScriptElement | null = document.querySelector(
      'script[src*="translate.google.com/translate_a/element.js"]',
    );
    if (script === null) {
      const newScript: HTMLScriptElement = document.createElement("script");
      newScript.type = "text/javascript";
      newScript.src = "//translate.google.com/translate_a/element.js?cb=codbiGoogleTranslateElementInit";
      newScript.async = true;
      newScript.onload = (): void => container.classList.add("CodBi_Google_Website_Translator--ready");
      newScript.onerror = (): void => container.classList.add("CodBi_Google_Website_Translator--error");
      document.head.appendChild(newScript);
    }

    return container;
  }

  /** Ensures the widget-container {@link HTMLDivElement } exists (and is freshly emptied) within the tagged element. */
  private static ensureContainer(toProcess: Element, inline: boolean): HTMLElement {
    let container: HTMLElement | null = toProcess.querySelector(".CodBi_Google_Website_Translator");
    if (container === null) {
      container = document.createElement("div");
      container.className = "CodBi_Google_Website_Translator";
      toProcess.appendChild(container);
    }
    container.style.display = inline ? "inline-flex" : "block";
    container.replaceChildren();

    return container;
  }

  /**
   * A minimal structural typing of Google's injected {@link window.google} translation-API.
   *
   * @returns The {@link window.google} translation-API if Google's script has been loaded, otherwise {@link null}. */
  private static googleTranslate(): {
    translate: {
      TranslateElement: (new (
        options: {
          pageLanguage?: string;
          includedLanguages?: string;
          layout?: number;
        },
        elementId?: string,
      ) => unknown) & {
        InlineLayout: { SIMPLE: number };
      };
    };
  } | null {
    const g = (
      window as unknown as {
        google?: { translate?: { TranslateElement?: unknown } };
      }
    ).google;
    if (g?.translate?.TranslateElement === undefined) {
      return null;
    }

    return g as unknown as {
      translate: {
        TranslateElement: (new (
          options: {
            pageLanguage?: string;
            includedLanguages?: string;
            layout?: number;
          },
          elementId?: string,
        ) => unknown) & {
          InlineLayout: { SIMPLE: number };
        };
      };
    };
  }

  /** Builds the {@link window.googleTranslateElementInit}-callback that renders the dropdown. */
  private static buildTranslator(lang: string): () => void {
    return (): void => {
      const container: HTMLElement | null = document.querySelector(".CodBi_Google_Website_Translator");
      if (container === null) {
        return;
      }
      const holder: HTMLDivElement = document.createElement("div");
      holder.id = Google_Website_Translator.ELEMENT_ID;
      container.appendChild(holder);

      const api = Google_Website_Translator.googleTranslate();
      if (api === null) {
        container.classList.add("CodBi_Google_Website_Translator--error");
        return;
      }

      try {
        const layout = api.translate.TranslateElement.InlineLayout.SIMPLE;
        new api.translate.TranslateElement(
          {
            pageLanguage: lang,
            includedLanguages: "",
            layout,
          },
          Google_Website_Translator.ELEMENT_ID,
        );
      } catch {
        container.classList.add("CodBi_Google_Website_Translator--error");
      }
    };
  }

  /**
   * This functionality embeds the Google Website-Translator language-dropdown into the tagged element (the form's
   * header).
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string | boolean", "autoload :: inline")
    @TYPE.PRE("string", "lang")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(Element, undefined, "Is it not an element that is tagged with this functionality?")
    toProcess: Element,
  ): void {
    const lang: string =
      typeof toLoad.lang === "string" && toLoad.lang.trim() !== ""
        ? toLoad.lang.trim()
        : Google_Website_Translator.defaultLanguage();
    const inline: boolean =
      typeof toLoad.inline === "boolean" ? toLoad.inline : !(String(toLoad.inline).toLowerCase() === "false");
    toProcess.setAttribute(Google_Website_Translator.LANG_ATTR, lang);

    const autoload: boolean =
      typeof toLoad.autoload === "boolean" ? toLoad.autoload : String(toLoad.autoload).toLowerCase() === "true";

    Google_Website_Translator.loadTranslator(toProcess, lang, inline);

    if (!autoload) {
      // Load the script lazily as soon as the tagged element becomes visible (avoids a third-party request for
      // visitors who do not use the translator).
      if (!Google_Website_Translator.isVisible(toProcess)) {
        const observer: MutationObserver = new MutationObserver(() => {
          if (Google_Website_Translator.isVisible(toProcess)) {
            observer.disconnect();
            Google_Website_Translator.loadTranslator(toProcess, lang, inline);
          }
        });
        observer.observe(toProcess, { attributes: true, childList: true, subtree: true });
      }
    }
  }

  /** The default language (the browser's language, falling back to "en"). */
  private static defaultLanguage(): string {
    const nav: string | undefined = navigator.language;
    if (typeof nav === "string" && nav.length >= 2) {
      return nav.slice(0, 2);
    }

    return "en";
  }

  /** Whether the tagged element is currently rendered (i.e. not `display:none` and within the viewport). */
  private static isVisible(element: Element): boolean {
    const style: CSSStyleDeclaration = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    const rect: DOMRect = element.getBoundingClientRect();

    return rect.width > 0 && rect.height > 0;
  }
}

window.codbi.registerFunctionality(
  "Google.Website.Translator",
  Google_Website_Translator.functionality.bind(Google_Website_Translator),
); // Initialization
