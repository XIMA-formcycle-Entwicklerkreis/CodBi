// #region Imports
import { OpenPLZ } from "./openplz.js";
// #endregion Imports
/**
 * An {@link OpenPLZ }-Request performing a full text-search.
 *
 * Config Parameter:
 * - 1st: The country's code to look up the locality in (e.g. de or ch).
 * - 2nd: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) term to search for (e.g. 91522 Nürnbergerstrasse ).
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
