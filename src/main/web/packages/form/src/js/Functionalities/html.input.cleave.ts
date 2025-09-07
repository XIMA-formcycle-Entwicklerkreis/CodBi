// #region Imports
// #region Cleave
import Cleave from "cleave.js";
import "cleave.js/dist/addons/cleave-phone.de";
import type { CleaveOptions } from "cleave.js/options/index.js";
// #endregion Cleave
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { EQ } from "xdbc/src/DBC/EQ";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Input_Cleave.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Input_Cleave {
  /**
   * This functionality applies Cleave on an {@link HTMLInputElement }.
   *
   * Config Parameter:
   *  - Config      : The {@link CleaveOptions } to set instead of the other shorthand parameter.
   *  - Date        : The {@link CleaveOptions.date }.
   *  - DateMin     : The {@link CleaveOptions.dateMin }.
   *  - DateMax     : The {@link CleaveOptions.dateMax }.
   *  - Delimiter   : The {@link CleaveOptions.delimiter }.
   *  - DatePattern : The {@link CleaveOptions.datePattern }.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    toLoad: { [key: string]: unknown },
    @EQ.PRE("INPUT", false, "tagName") toProcess: Element,
  ): void {
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
          datePattern:
            toLoad.datepattern &&
            Array.isArray(toLoad.datepattern) &&
            toLoad.datepattern.every((item) => typeof item === "string")
              ? (toLoad.datepattern as Array<string>)
              : ["d", "m", "Y"],
        };
    // #endregion Build "CleaveOptions".
    new Cleave(toProcess as HTMLElement, config);
  }
  // #region Initialization
  /**
   * States whether this {@link HTML_Input_Cleave } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.Input.Cleave", HTML_Input_Cleave.functionality);
  })();
  // #endregion Initialization
}
