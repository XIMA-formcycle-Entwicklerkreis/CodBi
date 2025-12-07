// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
import { OpenPLZ } from "./openplz.js";
// #endregion Imports
/**
 * An {@link OpenPLZ }-Request specialized into searching for streets.
 *
 * Config Parameter:
 * - 1st: The country's code to look up the street in (e.g. de or ch).
 * - 2nd: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) for the street's name.
 * - 3rd: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) for the street's postal code. If this is empty the
 *        **4th** parameter will be used for the search as the street's city-name.
 * - 4th: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) for the street's name used if the **3rd**
 *        parameter is empty.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
export class OpenPLZ_Streets extends OpenPLZ {
  /**
   * Joins all {@link object }s in "params" into one.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  public static override retrieve(params: Array<unknown>): Array<unknown> | unknown {
    return OpenPLZ.retrieve([
      params[0] ? (params[0] as string) : "",
      "Streets",
      "",
      "",
      `name-${params[1]}`,
      params.length === 4 ? `locality-${params[3]}` : `postalCode-${params[2]}`,
    ]);
  }
  // #region Initialization
  /**
   * States whether this {@link OpenPLZ_Streets } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static override registered: boolean = (() => {
    return window.codbi.registerEP("OpenPLZ.Streets", OpenPLZ_Streets.retrieve);
  })();
  // #region Initialization
}
