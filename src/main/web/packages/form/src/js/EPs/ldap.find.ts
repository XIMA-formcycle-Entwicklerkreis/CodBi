// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE.js";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER.js";
import { REGEX } from "xdbc/src/DBC/REGEX.js";
import { IF } from "xdbc/src/DBC/IF.js";
import { DEFINED } from "xdbc/src/DBC/DEFINED.js";
// #endregion XDBC
import { CodBiError, resolveLdapUrl } from "../global-scope.js";
// #endregion Imports
/**
 * This Elementplaceholder connects via a default (**LDAP_URL** in CodBi Settings) or an optionally specified
 * URL (optional **3rd parameter**) to a predefined Formcycle LDAP-Query requesting data from it.
 * The Query has to have following content in order to work with this Elementplaceholder:
 * **(?(?*)(?*)(?*)(?*)(?*)(?*)(?*)(?*)(?*)(?*))**.
 *
 * **Furthermore Following currently supported LDAP-Attributes should be returned by the predefined Formcycle LDAP-Query**
 * | LDAP Property | Corresponds To |
 * | :------------ | :------------- |
 * | givenName     | First Name     |
 * | mail          | eMail Address  |
 * | sn            | Last Name      |
 * | title         | Title          |
 * | department    | Department     |
 * | telephoneNumber| Phonenumber   |
 * | sAMAccountName| Account        |
 * | cn            | Common Name    |
 * | displayName   | Display Name   |
 *
 * ### Config Parameter:
 *  - 1st:  The mode to use for the filter. Either **AND** or **OR** (case insensitive). Everything else will be interpreted as **AND**.
 *  - 2nd:  The LDAP conditions (like sn = Doe) separated by **|** (like sn = Doe | givenName = John).
 *  - 3rd:  The optional **URL** to a Formcycle-LDAP-Query (which's content is **(?(?*)(?*)(?*)(?*)(?*)(?*)(?*)(?*)(?*)(?*))**) to use.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class LDAP_Find {
  /**
   * See {@link LDAP_Find }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(1, true, false, "length", "Haven't at least the mode and the LDAP-Conditions been specified?")
    @AE.PRE(new TYPE("string"))
    @AE.PRE(new REGEX(/(AND|OR)/i), 0)
    @AE.PRE(new REGEX(/^\w+\s*=\s*[\w.@+-]+(?:\s*\|\s*\w+\s*=\s*[\w.@+-]+)*$/), 1)
    @AE.PRE(new IF(new DEFINED(), new REGEX(REGEX.stdExp.url)), 2)
    params: Array<unknown>,
  ): Promise<Array<unknown>> {
    let runningQuery = undefined;

    const abortedQueries = new Array<unknown>();

    return new Promise((resolve, reject) => {
      const mode =
        params[0] === ""
          ? "%26"
          : (params[0] as string).toLowerCase() === "and"
            ? "%26"
            : (params[0] as string).toLowerCase() === "or"
              ? "|"
              : "%26";
      let conditions = (params[1] as string).split("|");
      const url = params.length > 2 ? params[2] : (resolveLdapUrl() ?? "");

      if (!url) {
        reject(new CodBiError("[[ LDAP.Find ] No LDAP-URL specified neither via parameter nor via CodBi Settings. ]"));
      }
      // #region Fill conditions up to 10 elements.
      for (let i = conditions.length - 1; i < 9; i++) {
        conditions.push(conditions[conditions.length - 1]);
      }
      // #endregion Fill conditions up to 10 elements.
      // #region Normalize conditions.
      conditions = conditions.map((toTransform) => {
        return toTransform.replace("=", "%3D").trim();
      });
      // #endregion Normalize conditions.
      if (runningQuery) {
        runningQuery.abort();
      }

      runningQuery = getJQuery()
        .ajax(`${url}&queryParameter=${mode},${conditions.join(",")}`)
        .done((response) => {
          if (abortedQueries.indexOf(runningQuery) === -1) {
            resolve(response);
          }
        });
    });
  }
}

window.codbi.registerEP("LDAP.Find", LDAP_Find.retrieve.bind(LDAP_Find)); // Initialization
