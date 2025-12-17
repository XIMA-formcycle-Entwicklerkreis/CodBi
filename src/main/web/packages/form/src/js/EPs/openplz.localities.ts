// #region Imports
import { OpenPLZ } from "./openplz.js";
// #endregion Imports
/**
 * An {@link OpenPLZ }-Request specialized into searching for localities.
 *
 * Config Parameter:
 * - 1st: The optional **country** to retrieve the data of (if not provided either the country specified in
 *        the CodBi's Configuration **OpenPLZ_Country** will be used or, if not specified, "de").
 * - 2nd: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) for the locality's name.
 * - 3rd: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) for the locality's postal code.
 * - 4th: An Optional number of pages to load.
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
      `name-${(params[1] as string).replace(/^/, "°")}`,
      params.length >= 3 ? `postalCode-${(params[2] as string).replace(/^/, "°")}` : "",
      "",
      "",
      "",
      params[3] ? params[3] : "",
      params[3] ? params[3] : "",
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
