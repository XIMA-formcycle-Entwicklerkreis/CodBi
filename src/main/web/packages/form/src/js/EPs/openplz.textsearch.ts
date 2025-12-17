// #region Imports
import { OpenPLZ } from "./openplz.js";
// #endregion Imports
/**
 * An {@link OpenPLZ }-Request performing a full text-search.
 *
 * Config Parameter:
 * - 1st: The optional **country** to retrieve the data of (if not provided either the country specified in
 *        the CodBi's Configuration **OpenPLZ_Country** will be used or, if not specified, "de").
 * - 2nd: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) term to search for (e.g. 91522 Nürnbergerstrasse ).
 * - 3rd: An Optional number of pages to load.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
export class OpenPLZ_TextSearch extends OpenPLZ {
  /**
   * Joins all {@link object }s in "params" into one.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  public static override retrieve(params: Array<unknown>): Array<unknown> | unknown {
    return OpenPLZ.retrieve([
      params[0],
      "FullTextSearch",
      "",
      "",
      `searchTerm-${(params[1] as string).replace(/ /, "+")}`,
      "",
      "",
      "",
      params[2] ? (params[2] as string) : "",
    ]);
  }
  // #region Initialization
  /**
   * States whether this {@link OpenPLZ_TextSearch } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static override registered: boolean = (() => {
    return window.codbi.registerEP("OpenPLZ.TextSearch", OpenPLZ_TextSearch.retrieve);
  })();
  // #region Initialization
}
