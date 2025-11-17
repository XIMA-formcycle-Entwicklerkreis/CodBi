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
export class LDAP_Autocomplete {
  /**
   * Registers the "LDAP.Autocomplete"-Functionality.
   *
   * This functionalities takes advantage of the {@link LDAP_Find} Elementplaceholder to complete what is typed into
   * the tagged {@link HTMLInputElement } with data from a connected Formcycle predefined LDAP-Query according
   * to the {@link LDAP_Find } specifications.
   * It suggests completions as soon as there are multiple matches and only allows entries that match exactly one
   * LDAP-Entry.
   *
   * Config Parameter:
   *  - Property:       The LDAP-Property that shall be autocompleted.
   *  - CSSProposals:   The CSS-Style for the proposals-Select-Element appearing when there are multiple matches.
   *  - URL:            The URL of the Formcycle predefined LDAP-Query to use. */
  @DBC.ParamvalueProvider
  public static functionality(toLoad: { [key: string]: string }, toProcess: Element): void {
    // #region Remove entries that're not in LDAP.
    toProcess.addEventListener("blur", async (event) => {
      const findParameter = ["AND", `${toLoad.property}=${(toProcess as HTMLInputElement).value}`];

      if (toLoad.url) {
        findParameter.push(toLoad.url);
      }

      const ldapResult = await LDAP_Find.retrieve(findParameter);

      if (ldapResult.length === 0) {
        getJQuery()(toProcess).error(
          toLoad.msgnotinldap
            ? toLoad.msgnotinldap
            : "Only values that're present in the Active Directory are permitted.",
        );
      } else {
        if (document.activeElement !== proposals) {
          proposals.remove();
        }

        getJQuery()(toProcess).error("");
      }
    });
    // #endregion Remove entries that're not in LDAP.
    let blocked = false;
    // #region Create Selection.
    const proposals = document.createElement("select");

    proposals.classList.add("---CodBi", "--LDAP_Autocomplete", "-Proposals");
    proposals.setAttribute(
      "style",
      toLoad.cssproposals
        ? toLoad.cssproposals
        : "margin-top: .5em ; max-width: 100% ; border-color: darkorange ; border-radius: .5em ; box-shadow: 0 0 .5em darkorange ; color: green ; font-weight: bolder ; cursor: pointer;",
    );
    // #region Handle Selection.
    const onSelected = async () => {
      (toProcess as HTMLInputElement).value = (proposals as HTMLSelectElement).value;

      proposals.remove();
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      if ((toProcess as any).codbiLDAPSetMatchListeners) {
        // #region Acquire LDAP-Data for passing it to the match-listeners.
        const findParameter = ["AND", `${toLoad.property}=${(proposals as HTMLSelectElement).value}`];

        if (toLoad.url) {
          findParameter.push(toLoad.url);
        }

        const ldapResult = await LDAP_Find.retrieve(findParameter);
        // #endregion Acquire LDAP-Data for passing it to the match-listeners.
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        for (const listener of (toProcess as any).codbiLDAPSetMatchListeners) {
          listener(ldapResult, toProcess);
        }
      }
    };

    proposals.addEventListener("change", async (event) => {
      onSelected();
    });
    proposals.addEventListener("keydown", async (event) => {
      if (event.key === "Enter" || event.key === "Space") {
        onSelected();
      }
    });
    // #endregion Handle Selection.
    // #endregion Create Selection.
    toProcess.addEventListener("keydown", async (event) => {
      if (blocked) {
        event.stopPropagation();
        event.preventDefault();
        event.stopImmediatePropagation();
      }

      const key = INSTANCE.tsCheck<KeyboardEvent>(event, KeyboardEvent).key;

      if (key.length !== 1) {
        return;
      }

      const findParameter = ["AND", `${toLoad.property}=${(toProcess as HTMLInputElement).value}${key}`];

      if (toLoad.url) {
        findParameter.push(toLoad.url);
      }

      const ldapResult = await LDAP_Find.retrieve(findParameter);

      if (ldapResult.length === 1) {
        (toProcess as HTMLInputElement).value = ldapResult[0][toLoad.property];
        // #region Block input on match.
        blocked = true;
        // #region Remove proposals.
        proposals.remove();
        // #endregion Remove proposals.
        // #region Notify match-listeners.
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        if ((toProcess as any).codbiLDAPSetMatchListeners) {
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          for (const listener of (toProcess as any).codbiLDAPSetMatchListeners) {
            listener(ldapResult, toProcess);
          }
        }
        // #endregion Notify match-listeners.
        setTimeout(() => {
          blocked = false;
        }, 500);
        // #endregion Block input on match.
      }
      // #region Show proposals.
      if (ldapResult.length > 1) {
        proposals.innerHTML = "";

        for (const result of ldapResult) {
          proposals.options.add(new Option(result[toLoad.property], result[toLoad.property]));
        }

        toProcess.parentElement.appendChild(proposals);
      }
      // #endregion Show proposals.
    });
  }
  // #region Initialization
  /**
   * States whether this {@link LDAP_Autocomplete } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("LDAP.Autocomplete", LDAP_Autocomplete.functionality);
  })();
  // #endregion Initialization
}
