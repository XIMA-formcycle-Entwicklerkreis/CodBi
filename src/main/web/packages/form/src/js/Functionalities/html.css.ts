// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Select_Injection.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_CSS {
  /**
   * Strips known dangerous CSS patterns that could be used for injection:
   * - url(http://...) and url(https://...) — blocks external URLs to
   *   prevent data exfiltration via attribute selectors + background-image
   *   requests. Allows relative URLs (e.g. url(/images/bg.png)) and
   *   data: URIs (e.g. url(data:image/png;base64,...)).
   * - javascript: URLs in CSS values (defense-in-depth)
   * - expression() — IE legacy JS execution in CSS
   * - -moz-binding — Firefox legacy XBL execution
   * - behavior: — IE legacy
   */
  public static sanitizeCss(css: string): string {
    return css
      .replace(/url\s*\(\s*(?:https?:\/\/[^)]*)\s*\)/gi, "/* external url blocked */")
      .replace(/javascript\s*:/gi, "blocked:")
      .replace(/expression\s*\(/gi, "blocked(")
      .replace(/-moz-binding\s*:/gi, "-moz-blocked:")
      .replace(/behavior\s*:/gi, "blocked:");
  }

  /** The {@link RegExp} used to validate replacement strings. */
  public static rexpReplacements: RegExp = /^.+\s*\|\s*.+$/;
  /**
   * This functionality injects a {@link HTMLStyleElement } containing the specified "CSS" into either the specified
   * "Destination" or the {@link document }'s {@link HTMLHeadElement }.
   * Prior to injection the placeholder (<...>) within the specified "CSS" will be replaced with their
   * respective values according to the given "Replacements"-Definition (...|...).
   *
   * ### Config Parameter:
   *  - CSS:          The CSS to inject (when used in CodBi-Standard-Configuration) or the result of an
   *                  Elementplaceholder-Retrieval (when used in plain attributes).
   *  - Replacements: An {@link Array < string >} of two elements each that are separated by a "|".
   *                  The first part contains the placeholder as found in the specified "CSS". The second one
   *                  the {@link string } the placeholder shall be replaced with. Each element has to comply to
   *                  **^[a-zA-Z][a-zA-Z0-9]*\s*\|\s*[a-zA-Z0-9]*$**.
   *  - Darkmode:     The Darkmode-**Replacements** that will replace all placeholders ending with "_DM" in the
   *                  provided **CSS**.
   *  - Destination:  The selector pointing to the "CSS"-Destination. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "destination") toLoad: { [key: string]: string | Array<string> },
    toProcess: Element,
  ): void {
    if (Array.isArray(toLoad.css)) {
      toLoad.css = TYPE.tsCheck<string>(toLoad.css[0], "string");
    } else {
      toLoad.css = TYPE.tsCheck<string>(toLoad.css, "string");
    }

    const style = document.createElement("style");

    if (toLoad.darkmode) {
      if (typeof toLoad.darkmode === "string") {
        toLoad.darkmode = [toLoad.darkmode];
      }

      for (const replacement of toLoad.darkmode) {
        const parts = REGEX.tsCheck<string>(replacement, HTML_CSS.rexpReplacements).split("|");

        if (parts.length >= 2) {
          toLoad.css = (toLoad.css as string).replace(
            new RegExp(`${parts[0]?.trim()}_DM`, "g"),
            parts[1].trim(),
          ) as string;
        }
      }
    }

    if (toLoad.replacements) {
      if (typeof toLoad.replacements === "string") {
        toLoad.replacements = [toLoad.replacements];
      }

      for (const replacement of toLoad.replacements) {
        const parts = REGEX.tsCheck<string>(replacement, HTML_CSS.rexpReplacements).split("|");

        if (parts.length >= 2) {
          toLoad.css = (toLoad.css as string).replace(
            new RegExp(`${parts[0]?.trim()}`, "g"),
            parts[1].trim(),
          ) as string;
        }
      }
    }

    // Security:
    // 1. Sanitize known dangerous CSS patterns (javascript:, expression(), etc.)
    // 2. Use textContent instead of innerHTML to prevent XSS via
    //    malicious CSS values (e.g. </style><script>alert(1)</script>).
    // 3. The < → { and > → } replacements are still applied for the CodBi
    //    CSS placeholder syntax.
    style.textContent = HTML_CSS.sanitizeCss(toLoad.css as string)
      .replace(/</g, "{")
      .replace(/>/g, "}")
      .replace(/§/g, ",");

    toProcess.setAttribute("cbCSS", "");

    if (toLoad.destination) {
      document.querySelector(toLoad.destination as string)?.appendChild(style);
    } else {
      document.head.appendChild(style);
    }
  }
}

window.codbi.registerFunctionality("HTML.CSS", HTML_CSS.functionality.bind(HTML_CSS)); // Initialization
