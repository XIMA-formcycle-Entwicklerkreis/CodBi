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
import { OpenPLZ } from "./openplz";
// #endregion Imports
/**
 * An {@link OpenPLZ }-Request specialized into searching for localities.
 *
 * ### Config Parameter:
 * - 1st: The optional **country** to retrieve the data of (if not provided either the country specified in
 *        the CodBi's Configuration **OpenPLZ_Country** will be used or, if not specified, "de").
 * - 2nd: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) for the locality's name.
 * - 3rd: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) for the locality's postal code.
 * - 4th: An Optional number of pages to load.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
export class OpenPLZ_Localities extends OpenPLZ {
  /**
   * Retrieves the localities found according to the provided **params**.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static override retrieve(
    @GREATER.PRE(1, true, false, "length", "Hasn't at least the Locality's or the Postalcode RegEx been specified?")
    @AE.PRE(new TYPE("string"), 0, 2)
    @AE.PRE(new OR([new EQ(""), new REGEX(/(de|en|at|li|ch)/i)]), 0)
    @AE.PRE(new TYPE("string | number"), 3)
    @AE.PRE(new IF(new TYPE("string"), new REGEX(/^\d+$/)), 3)
    params: Array<unknown>,
  ): Array<unknown> | unknown {
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
}

window.codbi.registerEP("OpenPLZ.Localities", OpenPLZ_Localities.retrieve.bind(OpenPLZ_Localities)); // Initialization
