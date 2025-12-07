// #region Imports
import { OpenPLZ } from "./openplz.js";
// #endregion Imports
/**
 * An {@link OpenPLZ }-Request specialized into searching for localities.
 *
 * Config Parameter:
 * - 1st: The country's code to look up the locality in (e.g. de or ch).
 * - 2nd: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) for the locality's name.
 * - 3rd: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) for the locality's postal code.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
export class OpenPLZ_Localities extends OpenPLZ {
  /**
   * Retrieves the localities found according to the provided **params**.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  public static override retrieve(params: Array<unknown>): Array<unknown> | unknown {
    return OpenPLZ.retrieve([
      params[0],
      "Localities",
      "",
      "",
      `name-${params[1]}`,
      params.length === 3 ? `postalCode-${params[2]}` : "",
    ]);
  }
  // #region Initialization
  /**
   * States whether this {@link OpenPLZ_Localities } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static override registered: boolean = (() => {
    return window.codbi.registerEP("OpenPLZ.Localities", OpenPLZ_Localities.retrieve);
  })();
  // #region Initialization
}
