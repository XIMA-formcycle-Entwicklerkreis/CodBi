// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
import { OpenPLZ } from "./openplz.js";
// #endregion Imports
/**
 * An {@link OpenPLZ }-Request specialized into retrieving organizational units.
 * This {@link OpenPLZ } does not search for units but rather returns all available ones.
 *
 * Config Parameter:
 * - 1st: The **country** to retrieve the data of.
 * - 2nd: The **orgaUnit** to retrieve (e.g. **FederalStates**, **FederalProvinces** or **Cantons**).
 * - 3rd: The optional key of the state, province or canton to get details of. This {@link OpenPLZ } has the ability
 *        to lookup **FederalStates**, **FederalProvinces** & **Cantons** by name, if the key provided is
 *        not a number but a name. If this parameter is set the 4th must be provided also.
 * - 4th: The optional detail to fetch about a certain state, province or canton identified by the
 *        **officialKey** (not optional if an official key is present). May be Municipalities or Districts.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
export class OpenPLZ_OrganizationalUnits extends OpenPLZ {
  /**
   * Joins all {@link object }s in "params" into one.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  public static override retrieve(params: Array<unknown>): Array<unknown> | unknown {
    return new Promise((resolve, reject) => {
      const $ = getJQuery();

      if (params.length === 2) {
        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
          type: "GET",
          headers: {
            Accept: "application/json",
            "X-Country": params[0] ? (params[0] as string) : "",
            "X-OrgaUnit": params[1] ? (params[1] as string) : "",
            "X-OfficialKey": "",
            "X-Detail": "",
            "X-Param1": "",
            "X-Param2": "",
            "X-Param3": "",
            "X-Param4": "",
          },
        }).done((response: string) => {
          resolve(response);
        });
      } else {
        if (isNumericString(params[2] as string)) {
          $.ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
            type: "GET",
            headers: {
              Accept: "application/json",
              "X-Country": params[0] ? (params[0] as string) : "",
              "X-OrgaUnit": params[1] ? (params[1] as string) : "",
              "X-OfficialKey": params[2] ? (params[2] as string) : "",
              "X-Detail": params[3] ? (params[3] as string) : "",
              "X-Param1": "",
              "X-Param2": "",
              "X-Param3": "",
              "X-Param4": "",
            },
          }).done((response: string) => {
            resolve(response);
          });
        } else {
          $.ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
            type: "GET",
            headers: {
              Accept: "application/json",
              "X-Country": params[0] ? (params[0] as string) : "",
              "X-OrgaUnit": params[1] ? (params[1] as string) : "",
              "X-OfficialKey": "",
              "X-Detail": "",
              "X-Param1": "",
              "X-Param2": "",
              "X-Param3": "",
              "X-Param4": "",
            },
          }).done((response: string) => {
            for (const candidate of JSON.parse(response)) {
              if ((params[2] as string) === candidate.name) {
                $.ajax({
                  url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
                  type: "GET",
                  headers: {
                    Accept: "application/json",
                    "X-Country": params[0] ? (params[0] as string) : "",
                    "X-OrgaUnit": params[1] ? (params[1] as string) : "",
                    "X-OfficialKey": candidate.key,
                    "X-Detail": params[3] ? (params[3] as string) : "",
                    "X-Param1": "",
                    "X-Param2": "",
                    "X-Param3": "",
                    "X-Param4": "",
                  },
                }).done((response: string) => {
                  resolve(response);
                });
              }
            }
          });
        }
      }
    });
  }
  // #region Initialization
  /**
   * States whether this {@link OpenPLZ_OrganizationalUnits } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static override registered: boolean = (() => {
    return window.codbi.registerEP("OpenPLZ.OrganizationalUnits", OpenPLZ_OrganizationalUnits.retrieve);
  })();
  // #region Initialization
}
// #region Helper
function isNumericString(candidate: string): boolean {
  if (candidate.trim() === "") {
    return false;
  }

  const num = +candidate;

  return !Number.isNaN(num) && Number.isFinite(num);
}
// #endregion Helper
