// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { OR } from "xdbc/src/DBC/OR";
import { EQ } from "xdbc/src/DBC/EQ";
// #endregion XDBC
import { OpenPLZ } from "./openplz";
// #endregion Imports
/**
 * An {@link OpenPLZ }-Request specialized into searching for streets.
 *
 * ### Config Parameter:
 * - 1st: The optional **country** to retrieve the data of (if not provided either the country specified in
 *        the CodBi's Configuration **OpenPLZ_Country** will be used or, if not specified, "de").
 * - 2nd: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) for the street's name.
 * - 3rd: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) for the street's postal code. If this is empty the
 *        **4th** parameter will be used for the search as the street's city-name.
 * - 4th: The [ POSIX RegEx ](https://www.openplzapi.org/de/regex/) for the city's name used if the **3rd**
 *        parameter is empty.
 * - 5th: An Optional number of pages to load.
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
export class OpenPLZ_Streets extends OpenPLZ {
  /**
   * Joins all {@link object }s in "params" into one.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static override retrieve(
    @GREATER.PRE(2, true, false, "length", "Hasn't at least the Street and City RegEx been specified?")
    @AE.PRE(new TYPE("string"), 0, 4)
    @AE.PRE(new OR([new EQ(""), new REGEX(/(de|en|at|li|ch)/i)]), 0)
    params: Array<unknown>,
  ): Array<unknown> | unknown {
    return OpenPLZ.retrieve([
      params[0] ? (params[0] as string) : "",
      "Streets",
      "",
      "",
      `name-${(params[1] as string).replace(/^/, "°")}`,
      params.length >= 4
        ? `locality-${(params[3] as string).replace(/^/, "°")}`
        : `postalCode-${(params[2] as string).replace(/^/, "°")}`,
      "",
      "",
      params[4] ? params[4] : "",
    ]);
  }
}

window.codbi.registerEP("OpenPLZ.Streets", OpenPLZ_Streets.retrieve.bind(OpenPLZ_Streets)); // Initialization
