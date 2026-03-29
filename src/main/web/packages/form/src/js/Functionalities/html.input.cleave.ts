// #region Imports
// #region Cleave
import Cleave from "cleave.js";
import "cleave.js/dist/addons/cleave-phone.de";
import type { CleaveOptions } from "cleave.js/options/index.js";
// #endregion Cleave
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { EQ } from "xdbc/src/DBC/EQ";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Input_Cleave.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Input_Cleave {
  /**
   * This functionality applies Cleave on an {@link HTMLInputElement }.
   *
   * ### Config Parameter:
   *  - Config      : The {@link CleaveOptions } to set instead of the other shorthand parameter.
   *  - Date        : The {@link CleaveOptions.date }.
   *  - DateMin     : The {@link CleaveOptions.dateMin }.
   *                  Has to be set according to the american standard with dashes (YYYY-MM-DD).
   *  - DateMax     : The {@link CleaveOptions.dateMax }.
   *                  Has to be set according to the american standard with dashes (YYYY-MM-DD).
   *  - Delimiter   : The {@link CleaveOptions.delimiter }.
   *  - DatePattern : The {@link CleaveOptions.datePattern }.
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
    // #region Normalize Arrayed-Parameter.
    if (Array.isArray(toLoad.config)) {
      toLoad.config = (toLoad.config as Array<string>)[0];
    }
    if (Array.isArray(toLoad.date)) {
      toLoad.date = (toLoad.date as Array<boolean>)[0];
    }
    if (Array.isArray(toLoad.datemin)) {
      toLoad.datemin = (toLoad.datemin as Array<string>)[0];
    }
    if (Array.isArray(toLoad.datemax)) {
      toLoad.datemax = (toLoad.datemax as Array<string>)[0];
    }
    if (Array.isArray(toLoad.delimiter)) {
      toLoad.delimiter = (toLoad.delimiter as Array<string>)[0];
    }
    if (Array.isArray(toLoad.datepattern)) {
      toLoad.datepattern = (toLoad.datepattern as Array<Array<string>>)[0];
    }
    // #endregion Normalize Arrayed-Parameter
    // Do nothing if not applied on an "HTMLInputElement".
    if (toProcess.tagName.toUpperCase() !== "INPUT") {
      return;
    }
    // #region Build "CleaveOptions".
    const config: CleaveOptions = toLoad.config
      ? typeof toLoad.config === "string"
        ? (JSON.parse(toLoad.config.replace(/</, "{").replace(/>/, "}")) as CleaveOptions)
        : (toLoad.config as CleaveOptions)
      : {
          date: toLoad.date ? (toLoad.date as boolean) : true,
          dateMin: toLoad.datemin && typeof toLoad.datemin === "string" ? (toLoad.datemin as string) : undefined,
          dateMax: toLoad.datemax && typeof toLoad.datemax === "string" ? (toLoad.datemax as string) : undefined,
          delimiter: toLoad.delimiter && typeof toLoad.delimiter === "string" ? (toLoad.delimiter as string) : ".",
          datePattern: toLoad.datepattern
            ? TYPE.tsCheck<string>(toLoad.datepattern, "string").split("-")
            : ["d", "m", "Y"],
        };
    // #endregion Build "CleaveOptions".
    // Apply Cleave.
    new Cleave(toProcess as HTMLElement, config);
  }
}

window.codbi.registerFunctionality("HTML.Input.Cleave", HTML_Input_Cleave.functionality.bind(HTML_Input_Cleave)); // Initialization
