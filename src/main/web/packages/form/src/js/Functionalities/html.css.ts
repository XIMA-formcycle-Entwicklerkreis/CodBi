// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { AE } from "xdbc/src/DBC/AE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Select_Injection.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_CSS {
  /**
   * Registers the "HTML.CSS"-Functionality.
   *
   * This functionality injects a {@link HTMLStyleElement } containing the specified "CSS" into either the specified
   * "Destination" or the {@link document }'s {@link HTMLHeadElement }.
   * Prior to injection the placeholder (<...>) within the specified "CSS" will be replaced with their
   * respective values according to the given "Replacements"-Definition (...|...).
   *
   * Config Parameter:
   *  - CSS:          The CSS to inject (when used in CodBi-Standard-Configuration) or the result of an Elementplaceholder-Retrieval (when used in plain attributes).
   *  - Replacements: An {@link Array < string >} of two elements each that are separated by a "|".
   *                  The first part contains the placeholder as found in the specified "CSS". The second one
   *                  the {@link string } the placeholder shall be replaced with.
   *  - Destination:  The selector pointing to the "CSS"-Destination. */
  @DBC.ParamvalueProvider
  public static functionality(
    @AE.PRE(new TYPE("string"), undefined, undefined, "replacements")
    @TYPE.PRE("string", "css")
    toLoad: { [key: string]: string | Array<string> },
    toProcess: Element,
  ): void {
    if (Array.isArray(toLoad.css)) {
      toLoad.css = toLoad.css[0];
    }

    const style = document.createElement("style");

    if (toLoad.darkmode) {
      if (typeof toLoad.darkmode === "string") {
        toLoad.darkmode = [toLoad.darkmode];
      }

      for (const replacement of toLoad.darkmode) {
        const parts = replacement.split("|");

        if (parts.length === 2) {
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
        const parts = replacement.split("|");

        if (parts.length === 2) {
          toLoad.css = (toLoad.css as string).replace(
            new RegExp(`${parts[0]?.trim()}`, "g"),
            parts[1].trim(),
          ) as string;
        }
      }
    }

    style.innerHTML = (toLoad.css as string).replace(/</g, "{").replace(/>/g, "}").replace(/§/g, ",");

    toProcess.setAttribute("cbCSS", "");

    if (toLoad.destination) {
      document.querySelector(toLoad.destination as string)?.appendChild(style);
    }
  }
  // #region Initialization
  /**
   * States whether this {@link HTML_CSS } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.CSS", HTML_CSS.functionality);
  })();
  // #endregion Initialization
}
