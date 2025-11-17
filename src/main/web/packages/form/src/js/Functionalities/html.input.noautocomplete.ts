// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Input_NoAutocomplete.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Input_NoAutocomplete {
  /**
   * This functionality deactivates the autocomplete for the provided {@link HTMLInputElement }.
   * If it is not an {@link HTMLInputElement } that is tagged, it searches for all nested {@link HTMLInputElement }s
   * and deactivates the autocomplete for them.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(toLoad: { [key: string]: unknown }, toProcess: Element): void {
    if (toProcess.tagName === "INPUT") {
      toProcess.setAttribute("autocomplete", "off");
    } else {
      for (const toDisable of toProcess.querySelectorAll("input")) {
        toDisable.setAttribute("autocomplete", "off");
      }
    }
  }
  // #region Initialization
  /**
   * States whether this {@link HTML_Input_NoAutocomplete } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.Input.NoAutocomplete", HTML_Input_NoAutocomplete.functionality);
  })();
  // #endregion Initialization
}
