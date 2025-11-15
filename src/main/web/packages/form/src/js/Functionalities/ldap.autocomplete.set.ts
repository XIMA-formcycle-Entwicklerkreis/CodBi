// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #region Elementplaceholder
import { LDAP_Find } from "../EPs/ldap.find.js";
// #endregion Elementplaceholder
// #endregion Imports
/**
 * Provides the {@link LDAP_Autocomplete.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class LDAP_Autocomplete_Set {
  /**
   * Registers the "Matomo.Tracking"-Functionality.
   *
   * This functionality connects to a **Matomo-Server**, that is either specified in the Plugin-Config (**Matomo_URL**)
   * or in this functionalitie's parameter (**URL**) while the functionality parameter takes precedence, and initiates
   * tracking to a specified **Site-ID**. The **Site-ID** is either specified o n the PLugin-Config (**Matomo_SiteID**)
   * or in the functionalitie's parameter (**SiteID**) while the functionality parameter takes precedence.
   * Furthermore, this functionality prevents any input that is not matched (removes any unmatched input on blur).
   *
   * Config Parameter:
   *  - Property:       The URL of the Matomo-Server that shall track the tagged form.
   *  - CSSProposals:   The CSS-Style for the proposals-Select-Element appearing when there are multiple matches.
   *  - URL:            The ID of the Matomo-Project-Site that shall be used for tracking. */
  @DBC.ParamvalueProvider
  public static functionality(toLoad: { [key: string]: string }, toProcess: Element): void {
    // #region Define match-listener routine.
    const matchListener = (ldapResult, origin) => {
      let current = toProcess.querySelector(".CodBi_LDAP_AC_Mail");

      if (current) {
        (current as HTMLInputElement).value = ldapResult[0].mail;
      }

      current = toProcess.querySelector(".CodBi_LDAP_AC_FirstName");

      if (current) {
        (current as HTMLInputElement).value = ldapResult[0].givenName;
      }

      current = toProcess.querySelector(".CodBi_LDAP_AC_LastName");

      if (current) {
        (current as HTMLInputElement).value = ldapResult[0].sn;
      }

      current = toProcess.querySelector(".CodBi_LDAP_AC_Title");

      if (current) {
        (current as HTMLInputElement).value = ldapResult[0].title;
      }

      current = toProcess.querySelector(".CodBi_LDAP_AC_Department");

      if (current) {
        (current as HTMLInputElement).value = ldapResult[0].department;
      }

      current = toProcess.querySelector(".CodBi_LDAP_AC_Telephone");

      if (current) {
        (current as HTMLInputElement).value = ldapResult[0].telephoneNumber;
      }

      current = toProcess.querySelector(".CodBi_LDAP_AC_Account");

      if (current) {
        (current as HTMLInputElement).value = ldapResult[0].sAMAccountName;
      }

      current = toProcess.querySelector(".CodBi_LDAP_AC_CommonName");

      if (current) {
        (current as HTMLInputElement).value = ldapResult[0].cn;
      }

      current = toProcess.querySelector(".CodBi_LDAP_AC_DisplayName");

      if (current) {
        (current as HTMLInputElement).value = ldapResult[0].displayName;
      }

      current = toProcess.querySelector(".CodBi_LDAP_AC_DisplayName");

      if (current) {
        (current as HTMLInputElement).value = ldapResult[0].displayName;
      }

      for (const inputField of toProcess.querySelectorAll(".CodBi_LDAP_Set_Member")) {
        if (inputField.hasAttribute("data-cb-ldapProperty")) {
          (inputField as HTMLInputElement).value = ldapResult[0][inputField.getAttribute("data-cb-ldapProperty")];
        }
      }
    };
    // #endregion Define match-listener routine.
    // #region Acquire input fields to complete.
    let current = toProcess.querySelector(".CodBi_LDAP_AC_Mail");

    if (current) {
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      current["codbiLDAPSetMatchListeners"] = [matchListener];
    }

    current = toProcess.querySelector(".CodBi_LDAP_AC_FirstName");

    if (current) {
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      current["codbiLDAPSetMatchListeners"] = [matchListener];
    }

    current = toProcess.querySelector(".CodBi_LDAP_AC_LastName");

    if (current) {
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      current["codbiLDAPSetMatchListeners"] = [matchListener];
    }

    current = toProcess.querySelector(".CodBi_LDAP_AC_Title");

    if (current) {
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      current["codbiLDAPSetMatchListeners"] = [matchListener];
    }

    current = toProcess.querySelector(".CodBi_LDAP_AC_Department");

    if (current) {
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      current["codbiLDAPSetMatchListeners"] = [matchListener];
    }

    current = toProcess.querySelector(".CodBi_LDAP_AC_Telephone");

    if (current) {
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      current["codbiLDAPSetMatchListeners"] = [matchListener];
    }

    current = toProcess.querySelector(".CodBi_LDAP_AC_Account");

    if (current) {
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      current["codbiLDAPSetMatchListeners"] = [matchListener];
    }

    current = toProcess.querySelector(".CodBi_LDAP_AC_CommonName");

    if (current) {
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      current["codbiLDAPSetMatchListeners"] = [matchListener];
    }

    current = toProcess.querySelector(".CodBi_LDAP_AC_DisplayName");

    if (current) {
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      current["codbiLDAPSetMatchListeners"] = [matchListener];
    }

    for (const inputField of toProcess.querySelectorAll(".CodBi_LDAP_Set_Member")) {
      if (inputField.hasAttribute("data-cb-ldapProperty")) {
      }
    }
    // #endregion Acquire input fields to complete.
  }
  // #region Initialization
  /**
   * States whether this {@link LDAP_Autocomplete } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("LDAP.Autocomplete.Set", LDAP_Autocomplete_Set.functionality);
  })();
  // #endregion Initialization
}
