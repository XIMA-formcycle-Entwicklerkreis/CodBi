// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #endregion Imports
/**
 * Retrieves data from the **CodBi_OpenPLZ_Verwaltungseinheiten**-Servlet according to the parameter specified.
 * This is the base class for accessing the **[OpenPLZ REST API](https://www.openplzapi.org/de/)**, thus making all
 * features that the REST-Service provides accessible.
 *
 * Config Parameter:
 * - 1st: The **country** to retrieve the data of.
 * - 2nd: The **orgaUnit** to retrieve (e.g. **FederalStates**, **FederalProvinces** or **Cantons**).
 * - 3rd: The optional key of the state, province or canton to get details of.
 * - 4th: The optional detail to fetch about a certain state, province or canton identified by the
 *        **officialKey** (not optional if an official key is present). May be Municipalities or Districts.
 * - 5th: There may be up to four parameter passed along the request (e.g. **postalCode**, **name**,
 *        **locality**, **searchTerm**).
 * - 6th: There may be up to four parameter passed along the request (e.g. **postalCode**, **name**,
 *        **locality**, **searchTerm**).
 * - 7th: There may be up to four parameter passed along the request (e.g. **postalCode**, **name**,
 *        **locality**, **searchTerm**).
 * - 8th: There may be up to four parameter passed along the request (e.g. **postalCode**, **name**,
 *        **locality**, **searchTerm**).
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class OpenPLZ {
  /**
   * Joins all {@link object }s in "params" into one.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  public static retrieve(params: Array<unknown>): Array<unknown> | unknown {
    return new Promise((resolve, reject) => {
      getJQuery()
        .ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
          type: "GET",
          headers: {
            Accept: "application/json",
            "X-Country": params[0] ? (params[0] as string) : "",
            "X-OrgaUnit": params[1] ? (params[1] as string) : "",
            "X-OfficialKey": params[2] ? (params[2] as string) : "",
            "X-Detail": params[3] ? (params[3] as string) : "",
            "X-Param1": params[4] ? (params[4] as string).replace("=", "-").replace(/ /, "") : "",
            "X-Param2": params[5] ? (params[5] as string).replace("=", "-").replace(/ /, "") : "",
            "X-Param3": params[6] ? (params[6] as string).replace("=", "-").replace(/ /, "") : "",
            "X-Param4": params[7] ? (params[7] as string).replace("=", "-").replace(/ /, "") : "",
          },
        })
        .done((response: string) => {
          resolve(JSON.parse(response));
        });
    });
  }
  // #region Initialization
  /**
   * States whether this {@link OpenPLZ } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("OpenPLZ", OpenPLZ.retrieve);
  })();
  // #region Initialization
}
