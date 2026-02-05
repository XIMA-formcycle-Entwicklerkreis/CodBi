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
import { DEFINED } from "xdbc/src/DBC/DEFINED.js";
import { TYPE } from "xdbc/src/DBC/TYPE.js";
import { REGEX } from "xdbc/src/DBC/REGEX.js";
import { EQ } from "xdbc/src/DBC/EQ.js";
// #endregion Elementplaceholder
// #endregion Imports

// #region Types
/**
 * Extended HTMLInputElement interface that adds support for LDAP match listeners.
 */
interface HTMLInputElementWithLDAPListeners extends HTMLInputElement {
  /**
   * Array of listener callbacks to be invoked when an LDAP match is found.
   *
   * @param ldapResult - The array of LDAP result objects returned from the LDAP query.
   * @param element - The HTML input element that triggered the LDAP match.
   */
  codbiLDAPSetMatchListeners?: ((ldapResult: unknown[], element: Element) => void)[];
}
// #endregion Types
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
   *  - URL:            The URL of the Formcycle predefined LDAP-Query to use.
   *  - MsgNotInLDAP:   The message to display when the entered value is not found in the LDAP.
   */
  @DBC.ParamvalueProvider
  public static functionality(
    @DEFINED.PRE("property")
    @TYPE.PRE("string", "property :: cssproposals :: url :: msgnotinldap")
    @REGEX.PRE(REGEX.stdExp.property, "property")
    @REGEX.PRE(REGEX.stdExp.url, "url")
    toLoad: { [key: string]: string },

    @INSTANCE.PRE(HTMLInputElement, undefined, "Is it not an <input> that is tagged with this functionality?")
    @EQ.PRE("text", false, "type", 'Isn\'t the tagged <input type = "text"/> ?')
    toProcess: Element,
  ): void {
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
        for (const listener of (toProcess as HTMLInputElementWithLDAPListeners).codbiLDAPSetMatchListeners) {
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

      if (key.length !== 1 && key !== "Backspace" && key !== "Delete") {
        return;
      }

      const findParameter = [
        "AND",
        `${toLoad.property}=${(toProcess as HTMLInputElement).value}${key.length === 1 ? key : ""}`,
      ];

      if (toLoad.url) {
        findParameter.push(toLoad.url);
      }

      const ldapResult = removeDuplicates(await LDAP_Find.retrieve(findParameter), toLoad.property);

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
}

window.codbi.registerFunctionality("LDAP.Autocomplete", LDAP_Autocomplete.functionality.bind(LDAP_Autocomplete)); // Initialization
// #region Helper
/**
 * Removes duplicate items from an array based on an optional property.
 *
 * @param toFilter  The array of items to filter for duplicates.
 * @param by        The property name to use for deduplication. If undefined, uses the Set-based approach for primitive values.
 *
 * @returns A new array with duplicate items removed. If `by` is specified, duplicates are identified by comparing the value of that property. Otherwise, duplicates are identified using Set equality.
 */
export function removeDuplicates(toFilter: unknown[], by: string | undefined = undefined): unknown[] {
  if (by) {
    const seen = new Map<string, unknown>();

    for (const item of toFilter) {
      const propValue = item[by];

      if (!seen.has(propValue)) {
        seen.set(propValue, item);
      }
    }

    return Array.from(seen.values());
  } else {
    return [...new Set(toFilter)];
  }
}
// #endregion Helper
