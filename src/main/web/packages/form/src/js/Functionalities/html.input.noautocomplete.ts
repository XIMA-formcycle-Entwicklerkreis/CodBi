// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { EQ } from "xdbc/src/DBC/EQ";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Input_NoAutocomplete.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Input_NoAutocomplete {
  /**
   * This functionality deactivates the autocomplete for the provided {@link HTMLInputElement }.
   * If it is not an {@link HTMLInputElement } that is tagged, it searches for all nested {@link HTMLInputElement }s
   * and deactivates the autocomplete for them. Check the CodBi-Testing page for browser-support.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(
      HTMLInputElement,
      undefined,
      'Is it not an <input type = "text"/> that is tagged with this functionality?',
    )
    @EQ.PRE("text", false, "type")
    toProcess: Element,
  ): void {
    if (toProcess.tagName === "INPUT") {
      toProcess.setAttribute("autocomplete", "off");
    } else {
      for (const toDisable of toProcess.querySelectorAll("input")) {
        toDisable.setAttribute("autocomplete", "off");
      }
    }
  }
}

window.codbi.registerFunctionality(
  "HTML.Input.NoAutocomplete",
  HTML_Input_NoAutocomplete.functionality.bind(HTML_Input_NoAutocomplete),
); // Initialization
