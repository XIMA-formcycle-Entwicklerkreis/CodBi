// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { LDAP_Autocomplete } from "./ldap.autocomplete.js";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link LDAP_Autocomplete.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class LDAP_Autocomplete_Set {
  /**
   * Registers the "LDAP.Autocomplete.Set"-Functionality.
   *
   * This functionality connects all {@link HTMLInputElement }s tagged with the
   * **LDAP.Autofill** Standardconfiguration's CSS-Classes within the tagged container to a set.
   * When a match is found for one of the autocompleting input fields, all other input fields get the corresponding
   * values filled in automatically according to their LDAP-Property. */
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
        LDAP_Autocomplete.functionality({ Property: inputField.getAttribute("data-cb-ldapProperty") }, inputField);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        inputField["codbiLDAPSetMatchListeners"] = [matchListener];
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
