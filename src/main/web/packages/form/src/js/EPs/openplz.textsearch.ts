// #region Imports
// #region XDBC
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { IF } from "xdbc/src/DBC/IF";
import { OR } from "xdbc/src/DBC/OR.js";
import { EQ } from "xdbc/src/DBC/EQ.js";
import { DBC } from "xdbc/src/DBC";
// #endregion XDBC
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
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
export class OpenPLZ_TextSearch extends OpenPLZ {
  /**
   * Joins all {@link object }s in "params" into one.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static override retrieve(
    @GREATER.PRE(1, true, false, "length", "Hasn't at least the RegEx to search with been specified?")
    @AE.PRE(new TYPE("string"), 0, 1)
    @AE.PRE(new OR([new EQ(""), new REGEX(/(de|en|at|li|ch)/i)]), 0)
    @AE.PRE(new TYPE("string | number"), 2)
    @AE.PRE(new IF(new TYPE("string"), new REGEX(/^\d+$/)), 2)
    params: Array<unknown>,
  ): Array<unknown> | unknown {
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
}

window.codbi.registerEP("OpenPLZ.TextSearch", OpenPLZ_TextSearch.retrieve.bind(OpenPLZ_TextSearch)); // Initialization
