// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link Net_xrURL_Normalize.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Net_xrURL_Normalize {
  /**
   * This functionality corrects links in all {@link HTMLAnchorElements }s, {@link HTMLImageElement }s, {@link HTMLIFrameElement }s & {@link HTMLObjectElement } within the {@link Element}
   * "toProcess" to the * {@link window.location }'s "href" as specified in "RootINT" & "RootEXT", thus
   * if the {@link window.location} contains the "RootINT" all "RootEXT" contained within the tag links will be
   * replaced with "RootINT" and vice versa.
   *
   * Config Parameter:
   *  - RootINT:  The internal server's root.
   *  - RootEXT:  The external server's root.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @REGEX.PRE(REGEX.stdExp.url, "rootint")
    @REGEX.PRE(REGEX.stdExp.url, "rootext")
    toLoad: { [key: string]: unknown },
    toProcess: Element,
  ): void {
    // #region Determine false and correct root.
    const correctRoot: string = (
      window.location.href.indexOf(toLoad.rootint as string) === -1 ? toLoad.rootext : toLoad.rootint
    ) as string;
    const falseRoot: string = (
      window.location.href.indexOf(toLoad.rootint as string) === -1 ? toLoad.rootint : toLoad.rootext
    ) as string;
    // #endregion Determine false and correct root.
    // Process all <a>.
    for (const candidate of toProcess.querySelectorAll("a")) {
      const current = candidate.getAttribute("href");

      if (current && current.indexOf(falseRoot) !== -1) {
        candidate.setAttribute("href", current.replace(falseRoot, correctRoot));
      }
    }
    // Process all <img>s and <iframe>s.
    for (const candidate of toProcess.querySelectorAll("img, iframe")) {
      const current = candidate.getAttribute("src");

      if (current && current.indexOf(falseRoot) !== -1) {
        candidate.setAttribute("src", current.replace(falseRoot, correctRoot));
      }
    }
    // Process all <object>s.
    for (const candidate of toProcess.querySelectorAll("object")) {
      const current = candidate.getAttribute("data");

      if (current && current.indexOf(falseRoot) !== -1) {
        candidate.setAttribute("data", current.replace(falseRoot, correctRoot));
      }
    }
  }
  // #region Initialization
  /**
   * States whether this {@link Net_xrURL_Normalize } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("Net.xrURL.Normalize", Net_xrURL_Normalize.functionality);
  })();
  // #endregion Initialization
}
